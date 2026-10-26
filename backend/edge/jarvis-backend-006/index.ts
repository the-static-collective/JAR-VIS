/**
 * JAR;VIS BACKEND-006 — durable synthetic job belt.
 * Hosted at Supabase Edge, independent of Vercel's deployment quota.
 * This endpoint is intentionally NOT a public jobs API: only /health is public.
 * Privileged POST requires an exact server-side service-key match.
 * Modal and other workers must NOT receive the service-role key; a scoped
 * capability exchange is a separate future gate.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.78.0';

const root = Deno.env.get('SUPABASE_URL') || '';
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!root || !secret) throw new Error('BACKEND_006_NOT_CONFIGURED');
const db = createClient(root, secret, { auth: { persistSession:false, autoRefreshToken:false } });
const HEAD = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};
const output = (body:unknown,status=200) => Response.json(body,{status,headers:HEAD});
const validUuid = (s:unknown) => typeof s==='string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
async function sha(v:string) { return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))); }
async function authorized(header:string|null):Promise<boolean> {
  if (!header?.startsWith('Bearer ') || secret.length < 32) return false;
  const presented=header.slice(7);
  if (!presented || presented.length>1024) return false;
  const [a,b]=await Promise.all([sha(presented),sha(secret)]);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
async function bodyJson(req:Request):Promise<Record<string,unknown>|null> {
  if(!(req.headers.get('content-type')||'').startsWith('application/json'))return null;
  if(Number(req.headers.get('content-length')||0)>2800)return null;
  const bytes=new Uint8Array(await req.arrayBuffer());
  if(bytes.length>2800)return null;
  try{
    const result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    return result && typeof result==='object' && !Array.isArray(result) ? result : null;
  }catch{return null;}
}
Deno.serve(async req=>{
  const pathname=new URL(req.url).pathname;
  // Public health: no internal counts, job names, tokens, or private data.
  if(req.method==='GET' && pathname.endsWith('/health')){
    try{
      const {error}=await db.rpc('jarvis_backend_snapshot');
      return error ? output({ok:false,state:'BACKEND_UNAVAILABLE'},503) :
        output({ok:true,schema:'jarvis.backend-health/v1',backend:'Supabase',mode:'SYNTHETIC_ONLY',
          participantData:'NONE',externalEffects:0});
    }catch{return output({ok:false,state:'BACKEND_UNAVAILABLE'},503);}
  }
  if(req.method!=='POST') return output({ok:false,reason:'METHOD_NOT_ALLOWED'},405);
  if(!await authorized(req.headers.get('authorization')))return output({ok:false,reason:'UNAUTHORIZED'},401);
  const b=await bodyJson(req);
  if(!b || typeof b.action!=='string')return output({ok:false,reason:'INVALID_BODY'},400);
  const action=b.action;
  let rpc:string,params:Record<string,unknown>;
  switch(action){
    case 'status': rpc='jarvis_backend_snapshot';params={};break;
    case 'enqueue':
      if(typeof b.key!=='string'||!/^fixture:[A-Za-z0-9_-]{1,80}$/.test(b.key)||
         typeof b.label!=='string'||b.label.length<1||b.label.length>160)
        return output({ok:false,reason:'INVALID_FIXTURE'},400);
      rpc='jarvis_backend_enqueue_fixture';params={p_key:b.key,p_label:b.label};break;
    case 'admit':
      if(!validUuid(b.id))return output({ok:false,reason:'INVALID_ID'},400);
      rpc='jarvis_backend_admit_fixture';params={p_id:b.id};break;
    case 'claim':
      if(typeof b.worker!=='string'|| !/^[A-Za-z0-9_-]{4,64}$/.test(b.worker))
        return output({ok:false,reason:'INVALID_WORKER'},400);
      rpc='jarvis_backend_claim_fixture';params={p_worker:b.worker};break;
    case 'return':
      if(!validUuid(b.id)||typeof b.worker!=='string'|| !/^[A-Za-z0-9_-]{4,64}$/.test(b.worker)||
         !b.result||typeof b.result!=='object'||Array.isArray(b.result)||
         JSON.stringify(b.result).length>1500)
        return output({ok:false,reason:'INVALID_RETURN'},400);
      rpc='jarvis_backend_return_fixture';params={p_id:b.id,p_worker:b.worker,p_result:b.result};break;
    default: return output({ok:false,reason:'UNKNOWN_ACTION'},400);
  }
  try{
    const {data,error}=await db.rpc(rpc,params);
    if(error) return output({ok:false,reason:'BACKEND_UNAVAILABLE'},503);
    return output({ok:true,data,admittedRealWorldClaims:false,externalEffects:0});
  }catch{return output({ok:false,reason:'BACKEND_UNAVAILABLE'},503);}
});
