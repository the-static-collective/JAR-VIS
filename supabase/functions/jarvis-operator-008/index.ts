// BACKEND-008: cookie-authenticated operator portal, BACKEND-007 remains available.
import {page,client} from './ui.ts';
import {db,requestCode,verifyCode,readSession,signOut,cookiesOff} from './auth-server.ts';
import {sameOrigin} from './auth-core.mjs';
import {porchOperation} from './porch-ops.ts';
const ROOT='/functions/v1/jarvis-operator-008';
const BASE={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
function json(body,status=200,cookies=[]){
 const headers=new Headers({...BASE,'content-type':'application/json; charset=utf-8'});
 for(const c of cookies)headers.append('set-cookie',c);
 return new Response(JSON.stringify(body),{status,headers});
}
async function input(req){
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return null;
 if(Number(req.headers.get('content-length')||0)>2600)return null;
 try{const raw=await req.text();if(new TextEncoder().encode(raw).length>2600)return null;
  const obj=JSON.parse(raw);return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null;
 }catch{return null;}
}
Deno.serve(async req=>{
 const p=new URL(req.url).pathname;
 // Supabase's function router can supply either the full public path or a
 // function-relative path. Normalize only documented safe leaf routes.
 const atRoot=p===ROOT||p===ROOT+'/'||p==='/'||p===''||p==='/jarvis-operator-008'||p==='/jarvis-operator-008/';
 const atHealth=p===ROOT+'/health'||p==='/health'||p==='/jarvis-operator-008/health';
 const atJs=p===ROOT+'/ui.js'||p==='/ui.js'||p==='/jarvis-operator-008/ui.js';
 if(req.method==='GET'){
  if(atHealth)return json({ok:true,service:'jarvis-email-first-008',externalEffects:0});
  if(atJs)return new Response(client,{headers:{...BASE,'content-type':'application/javascript; charset=utf-8'}});
  if(atRoot)return new Response(page,{headers:{...BASE,'content-type':'text/html; charset=utf-8',
    'x-robots-tag':'noindex,nofollow','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'"}});
  return json({ok:false,reason:'NOT_FOUND'},404);
 }
 if(req.method!=='POST'||!atRoot)return json({ok:false,reason:'METHOD'},405);
 if(!sameOrigin(req))return json({ok:false,reason:'ORIGIN'},403);
 const b=await input(req);
 if(!b||typeof b.action!=='string')return json({ok:false,reason:'BAD_INPUT'},400);
 try{
  if(b.action==='request-code'){const r=await requestCode(b);return json(r.body,r.status);}
  if(b.action==='verify-code'){const r=await verifyCode(b);return json(r.body,r.status,r.cookies||[]);}
  if(b.action==='sign-out'){const r=await signOut(req);return json(r.body,r.status,r.cookies);}
  if(b.action.startsWith('porch-')){
    const verified=await readSession(req);
    if(!verified)return json({ok:false,reason:'SIGN_IN_REQUIRED'},401,cookiesOff());
    try{const result=await porchOperation(db,b);return json(result,200,verified.cookies);}
    catch(e){const safe=typeof e?.message==='string'&&/^[A-Z0-9_]{4,50}$/.test(e.message)?e.message:'PORCH_UNAVAILABLE';return json({ok:false,reason:safe},Number.isInteger(e?.status)?e.status:503,verified.cookies);}
  }
  if(!['session','view','enqueue','admit'].includes(b.action))return json({ok:false,reason:'ACTION'},400);
  const operator=await readSession(req);
  if(!operator)return json({ok:false,reason:'SIGN_IN_REQUIRED'},401,cookiesOff());
  if(b.action==='session')return json({ok:true,state:'SIGNED_IN',scope:'operator'},200,operator.cookies);
  let rpc,args={};
  if(b.action==='view')rpc='jarvis_backend_list_jobs';
  else if(b.action==='enqueue'){
   if(typeof b.label!=='string'||b.label.length<4||b.label.length>140||/[<>@\r\n]|https?:\/\//i.test(b.label)||
     typeof b.key!=='string'||!/^fixture:panel-[a-f0-9]{24}$/.test(b.key))
    return json({ok:false,reason:'FICTIONAL_ONLY'},400,operator.cookies);
   rpc='jarvis_backend_enqueue_fixture';args={p_key:b.key,p_label:'Fictional: '+b.label};
  }else{
   if(!uuid(b.id))return json({ok:false,reason:'INVALID_TASK'},400,operator.cookies);
   rpc='jarvis_backend_admit_fixture';args={p_id:b.id};
  }
  const {data,error}=await db.rpc(rpc,args);
  if(error)return json({ok:false,reason:'STORE'},503,operator.cookies);
  return json({ok:true,data,mode:'SYNTHETIC_ONLY',externalEffects:0},200,operator.cookies);
 }catch{return json({ok:false,reason:'UNAVAILABLE'},503);}
});
