// BACKEND-008: server-only Supabase Auth and operator membership. Never put a master key in the page.
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
import {normalizedEmail,validEmail,validCode,validBootstrap,cookieJar,makeSessionCookies,eraseCookies} from './auth-core.mjs';
const url=Deno.env.get('SUPABASE_URL'),adminKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anonKey=Deno.env.get('SUPABASE_ANON_KEY');
if(!url||!adminKey||!anonKey)throw Error('AUTH_NOT_CONFIGURED');
export const db=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
const auth=()=>createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
export const cookiesOn=makeSessionCookies;
export const cookiesOff=eraseCookies;
const operator=async(email)=>{
 const {data,error}=await db.from('jarvis_backend_operator_identities')
 .select('user_id,email,actor').eq('email',email).is('revoked_at',null).maybeSingle();
 if(error)throw Error('STORE_UNAVAILABLE');return data;
};
async function bootstrap(raw){
 if(!validBootstrap(raw))return false;
 const {data,error}=await db.rpc('jarvis_backend_check_capability',{p_token:raw,p_scope:'operator'});
 return !error&&data?.authorized===true&&data.actor==='primary_operator';
}
export async function requestCode(b){
 if(!validEmail(b.email))return {status:400,body:{ok:false,reason:'EMAIL'}};
 const email=normalizedEmail(b.email);const member=await operator(email);
 if(!member&&!await bootstrap(b.operatorKey))return {status:401,body:{ok:false,reason:'ONE_TIME_OPERATOR_KEY_REQUIRED'}};
 const {error}=await auth().auth.signInWithOtp({email,options:{shouldCreateUser:!member}});
 return error?{status:503,body:{ok:false,reason:'EMAIL_PROVIDER_UNAVAILABLE'}}:
 {status:200,body:{ok:true,state:'CHECK_EMAIL'}};
}
export async function verifyCode(b){
 if(!validEmail(b.email)||!validCode(b.code))return {status:400,body:{ok:false,reason:'CODE_FORMAT'}};
 const email=normalizedEmail(b.email),client=auth();
 const {data,error}=await client.auth.verifyOtp({email,token:b.code,type:'email'});
 if(error||!data.session?.access_token||!data.session.refresh_token)return {status:401,body:{ok:false,reason:'CODE_EXPIRED_OR_INCORRECT'}};
 const {data:confirm,error:verifyError}=await client.auth.getUser(data.session.access_token);
 const person=confirm?.user;
 if(verifyError||!person?.email_confirmed_at||normalizedEmail(person.email)!==email)
   return {status:403,body:{ok:false,reason:'EMAIL_NOT_CONFIRMED'}};
 let member=await operator(email);
 if(!member){
   if(!await bootstrap(b.operatorKey))return {status:403,body:{ok:false,reason:'ONE_TIME_OPERATOR_KEY_REQUIRED'}};
   const {error:insertError}=await db.from('jarvis_backend_operator_identities').insert({
     user_id:person.id,email,actor:'primary_operator'
   });
   if(insertError)return {status:403,body:{ok:false,reason:'OPERATOR_ALREADY_BOUND'}};
   member=await operator(email);
 }
 if(!member||member.user_id!==person.id||member.actor!=='primary_operator')
   return {status:403,body:{ok:false,reason:'NOT_AN_OPERATOR'}};
 return {status:200,body:{ok:true,state:'SIGNED_IN'},cookies:makeSessionCookies(
   data.session.access_token,data.session.refresh_token,data.session.expires_in||3600)};
}
export async function readSession(req){
 const jar=cookieJar(req);let access='',refresh='';
 try{access=decodeURIComponent(jar.jv8_a||'');refresh=decodeURIComponent(jar.jv8_r||'');}
 catch{return null;}
 if(access.length>5000||refresh.length>5000)return null;
 const client=auth();let person=null,rotated=[];
 if(access){const check=await client.auth.getUser(access);if(!check.error)person=check.data.user;}
 if(!person&&refresh){
  const response=await client.auth.refreshSession({refresh_token:refresh});
  if(!response.error&&response.data.session){
   const s=response.data.session,check=await client.auth.getUser(s.access_token);
   if(!check.error){person=check.data.user;rotated=makeSessionCookies(s.access_token,s.refresh_token,s.expires_in||3600);}
  }
 }
 if(!person?.email||!person.email_confirmed_at)return null;
 const member=await operator(normalizedEmail(person.email));
 if(!member||member.user_id!==person.id||member.actor!=='primary_operator')return null;
 return {person,cookies:rotated};
}
export async function signOut(req){
 const jar=cookieJar(req);
 try{
  const access=decodeURIComponent(jar.jv8_a||''),refresh=decodeURIComponent(jar.jv8_r||'');
  if(access&&refresh){const client=auth();await client.auth.setSession({access_token:access,refresh_token:refresh});await client.auth.signOut({scope:'local'});}
 }catch{}
 return {status:200,body:{ok:true,state:'SIGNED_OUT'},cookies:eraseCookies()};
}
