// Operator and worker gateway. No public writes. No secrets in UI.
import {db} from './server.ts';
import {dispatch} from './actions.ts';
import {page,client} from './ui.ts';
const h={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const json=(body,status=200)=>Response.json(body,{status,headers:h});
Deno.serve(async req=>{
 const u=new URL(req.url),p=u.pathname;
 if(req.method==='GET'){
  if(p.endsWith('/ui.js'))return new Response(client,{headers:{...h,'content-type':'application/javascript'}});
  if(p.endsWith('/health'))return json({ok:true,service:'jarvis-operator-007',effects:0});
  if(p.endsWith('/jarvis-operator-007')||p.endsWith('/jarvis-operator-007/'))
   return new Response(page,{headers:{...h,'content-type':'text/html; charset=utf-8',
    'x-robots-tag':'noindex,nofollow','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'"}});
  return json({ok:false},404);
 }
 if(req.method!=='POST'||p!=='/functions/v1/jarvis-operator-007')return json({ok:false},405);
 const origin=req.headers.get('origin');
 if(origin&&origin!==u.origin)return json({ok:false,reason:'ORIGIN'},403);
 const auth=req.headers.get('authorization')||'';
 const token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(!/^jv7_[a-f0-9]{64}$/.test(token))return json({ok:false,reason:'AUTH'},401);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return json({ok:false},415);
 let b;
 try{const raw=await req.text();if(raw.length>2400)return json({ok:false},413);
     b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))return json({ok:false},400);}
 catch{return json({ok:false},400);}
 const scope=['view','enqueue','admit'].includes(b.action)?'operator':['claim','return'].includes(b.action)?'worker':null;
 if(!scope)return json({ok:false,reason:'ACTION'},400);
 const check=await db.rpc('jarvis_backend_check_capability',{p_token:token,p_scope:scope});
 if(check.error||!check.data?.authorized)return json({ok:false,reason:'AUTH'},401);
 return dispatch(db,b,check.data.actor,json);
});
