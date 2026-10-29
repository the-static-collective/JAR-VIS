import {createHash} from 'node:crypto';

// Explicitly fixed, public, source-owned document. This is not Drive ingestion or a live partner directory.
export const HARMONY_SOURCE='https://raw.githubusercontent.com/the-static-collective/webZ/main/bridge/harmony/manifest-v1.json';
const MAX_BYTES=64*1024;
const PATHS=new Set(['../locus/','../../commons/','../../commons/receiver/','../../commons/wallet/','../suitcase/','../atlas/','../outbox/','../../jubilee/','../']);
const IDS=new Set(['food','fellowship','campus','festival','care','farm','civic','founder']);
const validText=(v,max=350)=>typeof v==='string'&&v.length>5&&v.length<=max&&!/[\u0000-\u001f]/.test(v);
export function validateHarmonyCatalog(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    raw.schema!=='abundent.harmony-catalog/v1'||
    raw.status!=='PUBLIC_SAFE_PROTOTYPE_NOT_PARTNERSHIP'||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.asOf??'')||
    !Array.isArray(raw.profiles)||raw.profiles.length!==8||
    !Array.isArray(raw.invariants)||!raw.invariants.includes('CULTURE_NOT_CONQUEST')||
    !raw.invariants.includes('EXIT_WITHOUT_PENALTY'))throw Error('Invalid Harmony public catalog');
 const ids=new Set();
 const records=[];
 for(const p of raw.profiles){
  if(!p||!IDS.has(p.id)||ids.has(p.id)||!validText(p.title,100)||
    !validText(p.question,300)||!p.question.endsWith('?')||
    !validText(p.offer,380)||!validText(p.firstName,120)||
    !PATHS.has(p.first)||!Array.isArray(p.neighbors)||p.neighbors.length<3||
    p.neighbors.length>6||!Array.isArray(p.gates)||p.gates.length<2||
    p.gates.length>6||p.gates.some(v=>!validText(v,260))||
    p.neighbors.some(v=>!Array.isArray(v)||v.length!==2||!validText(v[0],100)||!PATHS.has(v[1]))
  )throw Error('Invalid mission door');
  ids.add(p.id);
  records.push({id:p.id,title:p.title,question:p.question,offer:p.offer,
   firstName:p.firstName,first:p.first,
   neighbors:p.neighbors.map(([label,href])=>({label,href})),
   gates:[...p.gates]});
 }
 if(ids.size!==IDS.size)throw Error('Incomplete Harmony profile set');
 return {catalogDate:raw.asOf,records};
}
async function boundedJson(response){
 const type=response.headers?.get('content-type')??'';
 if(type&&!/^(application\/json|text\/plain|application\/octet-stream)/i.test(type))
  throw Error('Unexpected public manifest content type');
 const len=response.headers?.get('content-length');
 if(len&&Number(len)>MAX_BYTES)throw Error('Harmony manifest too large');
 if(!response.body)throw Error('Harmony manifest has no response body');
 const reader=response.body.getReader();const chunks=[];let n=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;
  n+=value.byteLength;if(n>MAX_BYTES)throw Error('Harmony manifest too large');
  chunks.push(Buffer.from(value));
 }}finally{reader.releaseLock();}
 return Buffer.concat(chunks,n);
}
export async function inspectHarmonyPublic({fetchImpl=globalThis.fetch,now=()=>new Date().toISOString(),timeoutMs=5500}={}){
 const response=await fetchImpl(HARMONY_SOURCE,{method:'GET',redirect:'error',
  headers:{accept:'application/json'},signal:AbortSignal.timeout(timeoutMs)});
 if(!response?.ok||response.redirected||(response.url&&response.url!==HARMONY_SOURCE))
  throw Error('Exact public Harmony source unavailable');
 const bytes=await boundedJson(response);
 let raw;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}
 catch{throw Error('Malformed Harmony manifest')}
 const accepted=validateHarmonyCatalog(raw);
 return {schema:'jarvis.harmony-observation/v1',source:HARMONY_SOURCE,
  contentSha256:createHash('sha256').update(bytes).digest('hex'),
  observedAt:now(),access:'public-read-only',admission:'none',runtimeConnected:false,
  authority:'INDEX_ONLY',...accepted};
}
export function composeHarmonyCandidate(observation,id){
 if(observation?.schema!=='jarvis.harmony-observation/v1'||
    observation.authority!=='INDEX_ONLY'||observation.admission!=='none'||
    observation.runtimeConnected!==false||observation.source!==HARMONY_SOURCE||
    !/^[a-f0-9]{64}$/.test(observation.contentSha256??''))throw Error('HOLD: untrusted observation');
 const p=observation.records?.find(p=>p.id===id);
 if(!p)throw Error('HOLD: unknown doorway');
 return {schema:'jarvis.harmony-candidate/v1',source:observation.source,
  observedSourceSha256:observation.contentSha256,observedAt:observation.observedAt,
  mission:p.id,title:p.title,question:p.question,invitation:p.offer,
  entryInstrument:{name:p.firstName,relativeToHarmony:p.first},
  nearbyInstruments:p.neighbors.map(x=>({...x})),localGates:[...p.gates],
  disposition:'HOLD_FOR_OPERATOR_REVIEW',thirdPartyApproval:'NOT_ESTABLISHED',
  fieldOutcome:'NOT_VERIFIED',executionAllowed:false,transmitted:false,
  note:'A source-backed proposal does not enroll, contact, authenticate or authorize an organization.'};
}
