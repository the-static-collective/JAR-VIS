import { createHash } from "node:crypto";

// Explicitly read only the owner-public planZ snapshot. No issue enumeration,
// provider queries, visitor-question upload, webhook or remote write.
export const PLANZ_URL = "https://raw.githubusercontent.com/the-static-collective/planZ/main/public/attention-v1.json";
const LIMIT = 96 * 1024;
const DISPOSITIONS = new Set(["AWAITING_LOCAL_STEWARD","OWNER_REVIEW_REQUIRED","PROPOSED"]);
const ENTRY_KEYS = ["id","title","source","region","disposition","tags","nextGate","blockedBy","related","fieldOutcome","executionAllowed","thirdPartyApproval"];
function validFeed(data) {
  if (!data || data.schema !== "planz/public-attention-v1" ||
      data.authority !== "INDEX_ONLY" || !/^ATTENTION-\d{4}-\d{2}-\d{2}-\d{3}$/.test(data.edition??"") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.reviewedOn??"") ||
      !Array.isArray(data.entries) || !data.entries.length || data.entries.length>40) {
    throw Error("Invalid planZ index envelope");
  }
  const ids=new Set();
  for(const e of data.entries){
    if(!e || Object.keys(e).sort().join("|")!==[...ENTRY_KEYS].sort().join("|") ||
       typeof e.id!=="string"|| !/^[A-Z0-9-]{5,44}$/.test(e.id) || ids.has(e.id) ||
       typeof e.title!=="string" || e.title.length<10||e.title.length>140 ||
       typeof e.region!=="string"||e.region.length<2||e.region.length>100 ||
       typeof e.nextGate!=="string"||e.nextGate.length<25||e.nextGate.length>260 ||
       !/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9_.-]+\/issues\/[1-9]\d*$/.test(e.source) ||
       !DISPOSITIONS.has(e.disposition)||
       e.fieldOutcome!=="NOT_VERIFIED"||e.executionAllowed!==false||
       e.thirdPartyApproval!=="NOT_ESTABLISHED" ||
       !Array.isArray(e.tags)||e.tags.length<3||e.tags.length>16||
       e.tags.some(x=>typeof x!=="string"|| !/^[a-z0-9-]{2,30}$/.test(x))||
       !Array.isArray(e.blockedBy)||e.blockedBy.length<1||e.blockedBy.length>8||
       e.blockedBy.some(x=>typeof x!=="string"|| !/^[A-Z_]{4,40}$/.test(x))||
       !Array.isArray(e.related)||e.related.length>16||
       e.related.some(x=>typeof x!=="string"|| !/^[A-Z0-9-]{5,44}$/.test(x))){
      throw Error("Invalid, untrusted or authorization-claiming planZ record");
    }
    if(/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d ().-]{9,}\d)/i.test(JSON.stringify(e))){
      throw Error("Potentially private contact information in planZ public feed");
    }
    ids.add(e.id);
  }
  for(const e of data.entries) if(e.related.some(x=>x===e.id||!ids.has(x)))throw Error("Unresolved planZ relation");
  // Construct the only shape JAR;VIS may store or render. Ignore feed metadata
  // not in the documented contract and never admit source-provided commands.
  return {
    edition:data.edition,
    reviewedOn:data.reviewedOn,
    records:data.entries.map(e=>({
      id:e.id,title:e.title,source:e.source,region:e.region,
      disposition:e.disposition,tags:[...e.tags],nextGate:e.nextGate,
      blockedBy:[...e.blockedBy],related:[...e.related],
      fieldOutcome:e.fieldOutcome,executionAllowed:false,
      thirdPartyApproval:"NOT_ESTABLISHED"
    }))
  };
}
export function validatePlanZFeed(data){ return validFeed(data); }
async function readBounded(response){
  const len=response.headers?.get("content-length");
  if(len&&Number(len)>LIMIT)throw Error("PlanZ feed too large");
  const type=response.headers?.get("content-type")??"";
  if(type&&!/^(application\/json|text\/plain|application\/octet-stream)/i.test(type))throw Error("Unexpected planZ content type");
  if(!response.body)throw Error("No planZ body");
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;
    size+=value.byteLength;if(size>LIMIT)throw Error("PlanZ feed too large");
    chunks.push(Buffer.from(value));
  }}finally{reader.releaseLock();}
  return Buffer.concat(chunks,size);
}
export async function readPlanZAttention({ fetchImpl=globalThis.fetch, now=()=>new Date().toISOString(), timeoutMs=5500 }={}){
  const response=await fetchImpl(PLANZ_URL,{
    method:"GET",redirect:"error",headers:{accept:"application/json"},
    signal:AbortSignal.timeout(timeoutMs)
  });
  if(!response?.ok||response.redirected||(response.url&&response.url!==PLANZ_URL))
    throw Error("Source not available at exact planZ URL");
  const bytes=await readBounded(response);
  const raw=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  let parsed;try{parsed=JSON.parse(raw)}catch{throw Error("Invalid planZ JSON")}
  const data=validFeed(parsed);
  return {
    schema:"jarvis.planz-attention-observation/v0",source:PLANZ_URL,
    contentSha256:createHash("sha256").update(bytes).digest("hex"),
    observedAt:now(),access:"public-read-only",admission:"none",
    runtimeConnected:false,authority:"INDEX_ONLY",...data
  };
}
export function findPlanAttention(observation,question,limit=3){
  if(observation?.schema!=="jarvis.planz-attention-observation/v0" ||
     observation.authority!=="INDEX_ONLY" ||
     !Array.isArray(observation.records))return [];
  const words=(String(question??"").toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>x.length>2);
  const tokens=new Set(words.filter(x=>!["what","about","with","this","from","would","could","should","their","there","them","need","help","work","plan","planz","plans"].includes(x)));
  if(!tokens.size)return observation.records.slice(0,limit);
  const ranked=observation.records.map((e,i)=>{
    const tags=new Set(e.tags);
    const title=e.title.toLowerCase();
    const other=(e.region+" "+e.nextGate).toLowerCase();
    let score=0;
    for(const token of tokens){
      if(tags.has(token))score+=5;
      if(title.includes(token))score+=2;
      if(other.includes(token))score+=1;
    }
    return {e,score,i};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i);
  return ranked.slice(0,limit).map(x=>x.e);
}
