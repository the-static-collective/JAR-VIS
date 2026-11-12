// JAR;VIS Motif Reciprocal 004: exact source-pinned, read-only public capability observation.
// Import is deliberately ONLY a descriptive public passport, not an execution API,
// free-form tool, human-response database, model authority or publication gate.
import { createHash } from "node:crypto";
export const MOTIF_SOURCE_SHA="efb9fe46ebad1b0fc1da91bd7834b7c9fac00707";
export const MOTIF_PASSPORT_URL=
  "https://raw.githubusercontent.com/the-static-collective/MOTIF/"+
  MOTIF_SOURCE_SHA+"/experiments/reciprocal-004/capability-passport.v1.json";
const LIMIT=64*1024;
const VALID_IDS=new Set(["two-doors","reason-field","method-foundry"]);
const EXPECTED_CAPABILITIES=Object.freeze({
 "two-doors":{kind:"local-offline-web-app",scope:"ask_or_volunteer_one_question",schema:"motif.reciprocal002/v1"},
 "reason-field":{kind:"source-scoped-graph",scope:"review_reported_claims_and_hypothetical_forks",schema:"motif.reciprocal003.reason-field/v0"},
 "method-foundry":{kind:"bounded-classical-experiment",scope:"role_conditioned_heldout_choice_prediction",schema:"motif.reciprocal003.method-candidate/v0"}
});
const EXPECTED_REPOS=new Set(["JAR-VIS","GRAFT","free-graph","planZ","MEMENTO","ALEX.2",
 "CANNON","GHoT","webZ","reLATTE","project0","tranchnode"].map(x=>"the-static-collective/"+x));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
export function validateMotifPassport(data){
  assert(data?.schema==="motif.reciprocal-capability-passport/v1","Unsupported MOTIF passport");
  assert(data.owner==="the-static-collective/MOTIF","MOTIF source mismatch");
  assert(data.source?.deployed===false&&data.source?.mergedToMain===false
    &&data.source?.realHumanData===false
    &&data.source.inheritedResearchHead==="4cd625daea43d48248a062d6c686cc42940f2f01",
    "Research source cannot claim live authority");
  assert(data.source.branch==="experiment/reciprocal-004-ecosystem-crosswire-20261112",
    "Unexpected MOTIF experiment branch");
  assert(Array.isArray(data.capabilities)&&data.capabilities.length===3
    &&new Set(data.capabilities.map(x=>x.id)).size===3
    &&data.capabilities.every(x=>VALID_IDS.has(x.id)
      &&EXPECTED_CAPABILITIES[x.id].schema===x.schema
      &&EXPECTED_CAPABILITIES[x.id].kind===x.kind
      &&EXPECTED_CAPABILITIES[x.id].scope===x.scope),
    "Unexpected MOTIF capabilities");
  assert(data.exchange?.schema==="motif.reciprocal-crosswire/v1"
    &&data.exchange?.status==="PROPOSAL_ONLY"
    &&data.exchange.admissible==="PUBLIC_SYNTHETIC_FIXTURE_SUMMARY_ONLY"
    &&data.exchange.reviewedReceiverRequired===true,
    "MOTIF crossing attempted to import human data or authority");
  assert(data.gate?.disposition==="HOLD_FOR_OWNER_REVIEW"
    &&data.gate.autoApproval===false,
    "Missing original owner review gate");
  assert(Array.isArray(data.neighboringDoors)&&data.neighboringDoors.length>=10
    &&data.neighboringDoors.every(x=>x.crossed===false && EXPECTED_REPOS.has(x.repository))
    &&new Set(data.neighboringDoors.map(x=>x.repository)).size===EXPECTED_REPOS.size,
    "Neighboring door cannot claim completed integration");
  assert(Object.entries(data.claims||{}).every(([key,v])=>
    key==="status" ? v==="TESTED_SYNTHETIC_RESEARCH_NOT_PRODUCTION" :
      /Verified$/.test(key)&&v===false),
    "Unverified capability promotion");
  // Copy only a small, explicit allowlist. The rest is untrusted published text.
  return {
    owner:data.owner,
    sourceHead:data.source.inheritedResearchHead,
    experimentalBranch:data.source.branch,
    capabilities:data.capabilities.map(x=>({id:x.id,kind:x.kind,scope:x.scope,
      sourceSchema:x.schema,liveRuntimeConnected:false,callable:false})),
    neighbors:data.neighboringDoors.map(x=>({repository:x.repository,
      status:"PROPOSED_NOT_CONNECTED"})),
    necessaryReview:data.gate.disposition
  };
}
async function bounded(response){
  const ct=response.headers?.get("content-type")??"";
  assert(!ct||/^(application\/json|text\/plain|application\/octet-stream)/i.test(ct),
    "Unexpected MOTIF public source content type");
  if(response.headers?.get("content-length"))
    assert(Number(response.headers.get("content-length"))<=LIMIT,"MOTIF source too large");
  assert(response.body,"MOTIF source body absent");
  const reader=response.body.getReader(),parts=[];let size=0;
  try{
    for(;;){
      const {value,done}=await reader.read();if(done)break;
      size+=value.byteLength;
      assert(size<=LIMIT,"MOTIF source too large");
      parts.push(Buffer.from(value));
    }
  } finally {reader.releaseLock();}
  return Buffer.concat(parts,size);
}
export async function inspectMotifReciprocal({
  fetchImpl=globalThis.fetch,now=()=>new Date().toISOString(),timeoutMs=5500
}={}){
  const response=await fetchImpl(MOTIF_PASSPORT_URL,{
    method:"GET",redirect:"error",headers:{accept:"application/json"},
    signal:AbortSignal.timeout(timeoutMs)
  });
  assert(response?.ok&&!response.redirected
    &&(!response.url||response.url===MOTIF_PASSPORT_URL),
    "MOTIF public source unavailable at exact pinned URL");
  const bytes=await bounded(response);
  const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  let parsed;try{parsed=JSON.parse(text);}catch{throw Error("Invalid MOTIF passport JSON");}
  const safe=validateMotifPassport(parsed);
  return {
    schema:"jarvis.motif-reciprocal-observation/v1",
    source:MOTIF_PASSPORT_URL,
    sourceCommit:MOTIF_SOURCE_SHA,
    sha256:createHash("sha256").update(bytes).digest("hex"),
    observedAt:now(),
    ...safe,
    authority:"none",
    requestedDisposition:"HOLD_FOR_OPERATOR_REVIEW",
    sourceCredibility:"exact-public-research-code-not-deployed",
    externalActions:false,
    humanSubjects:false,
    sourceImported:false,
    executionAllowed:false,
    admission:"none"
  };
}
