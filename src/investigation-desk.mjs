// JAR;VIS Investigation Desk — human-facing entry to source-owned MOTIF
// inquiry machinery, plus ALEX-024 Eagle Eye breadth. No persistence or writes.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {eagleEye,validatePacket as checkEagle} from '../integrations/investigation/alex/eagle-eye-024.mjs';
import {discoverProviders,searchSelectedProviders,verifySupplemental,PUBLIC_PROVIDER_CATALOG}
 from '../integrations/investigation/alex/eagle-eye-providers-025.mjs';
import {identifyGap,discoverMissingProvider,verifyDiscovery}
 from '../integrations/investigation/alex/api-discovery-026.mjs';
import {evaluateFixture,verifyAlexSource}
 from '../integrations/investigation/graft/src/discovered-adapter-026.mjs';
import {solve} from '../integrations/investigation/planz/motif-classical.mjs';
import {investigatePublic,verifyPacket as checkAlex}
 from '../integrations/investigation/alex/motif023-live.mjs';
import {planEvidence,verifyPlan,replanAfterObservation}
 from '../integrations/investigation/planz/motif023-replan.mjs';
import {compileEvidenceCapability,executeCandidate,verifyNativePlanZ}
 from '../integrations/investigation/graft/src/motif023-compiler.mjs';

const DIRECTORY=new URL('../integrations/investigation/',import.meta.url);
const GIT='blob ';
const blob=bytes=>createHash('sha1')
 .update(Buffer.from(GIT+bytes.length+'\0')).update(bytes).digest('hex');
const hash=obj=>createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const safeNow=()=>new Date().toISOString();

export function verifyOriginalOrgans(){
 const manifest=JSON.parse(readFileSync(new URL('pins.json',DIRECTORY)));
 if(manifest.schema!=='jarvis.investigation-organ-pins/v0'||
   Object.keys(manifest.sources).length!==15)
  throw Error('HOLD_UNKNOWN_RESEARCH_ORGAN_PINSET');
 for(const [p,info] of Object.entries(manifest.sources)){
  if(!/^(alex|planz|graft)\//.test(p)||
     p.includes('..')||!(/^[a-f0-9]{40}$/.test(info.blob))||
     blob(readFileSync(new URL(p,DIRECTORY)))!==info.blob)
   throw Error('HOLD_SOURCE_OWNER_CODE_DRIFT_'+p);
 }
 verifyNativePlanZ();
 verifyAlexSource();
 return {source_count:15,owners:['ALEX.2','planZ','GRAFT'],
   research_owner:'MOTIF-023',
   source_organs_exact_pinned:true,
   source_owner_review_not_automatic:true};
}
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw Error('HOLD_INVALID_QUESTION_FORM');
 const question=input.question;
 if(typeof question!=='string'||question.trim().length<10||question.length>320||
   /[\x00-\x1f]/.test(question))
  throw Error('HOLD_INVALID_QUESTION');
 const scopes=input.scopes;
 if(!scopes||typeof scopes!=='object'||Array.isArray(scopes)||
   Object.keys(scopes).some(k=>!PUBLIC_PROVIDER_CATALOG.some(x=>x.id===k))||
   Object.values(scopes).some(v=>typeof v!=='boolean')||
   !Object.values(scopes).some(Boolean)||
   Object.values(scopes).filter(Boolean).length>4)
  throw Error('HOLD_PUBLIC_SEARCH_OPT_IN_REQUIRED');
 const depth=input.depth??3;
 if(!Number.isSafeInteger(depth)||depth<1||depth>6)
  throw Error('HOLD_INVALID_PUBLIC_SEARCH_DEPTH');
 const deep=input.deep===true;
 if(deep&&!scopes.github)
  throw Error('HOLD_MOTIF_NATIVE_REQUIRES_OPTED_IN_GITHUB');
 return {question:question.trim(),scopes,depth,deep};
}
async function sourceRound(question,collections,transport,token){
 const packet=await investigatePublic({question,collections},{transport,token});
 if(packet.status==='HOLD_NO_REGISTERED_PUBLIC_COLLECTION'){
  return {status:'HOLD_NOT_IN_MOTIF_023_FIVE_REPO_CATALOG',
   packet,plan:null,compiled:null,observation:null};
 }
 checkAlex(packet);
 const plan=planEvidence(packet);
 verifyPlan(plan,packet);
 if(plan.status!=='HELD_CLASSICAL_PLAN')
  return {status:'HOLD_NO_VERIFIABLE_MOTIF_SOURCE_LEADS',
   packet,plan,compiled:null,observation:null};
 const candidate=compileEvidenceCapability(packet,plan);
 const observation=await executeCandidate(candidate,packet,plan);
 return {
  status:'EXECUTED_FINITE_MOTIF_CAPABILITY',
  packet,plan,
  compiled:{mode:candidate.mode,source_sha256:candidate.source_sha256,
   generated_source_length:candidate.source.length,
   source_owner_approved:false,production_installed:false},
  observation
 };
}
async function sourceReasoning(query,transport,githubToken){
 try{
  const first=await sourceRound(query,null,transport,githubToken);
  if(first.status!=='EXECUTED_FINITE_MOTIF_CAPABILITY')
   return {status:'HOLD_FIRST_SOURCE_PLAN',first,feedback_plan:null,second:null,
    research_reuse_not_general_agent:true};
  const feedback_plan=replanAfterObservation(first.packet,first.plan,first.observation);
  const second=await sourceRound(feedback_plan.next_question,
   feedback_plan.next_source_collections,transport,githubToken);
  return {
   status:second.status==='EXECUTED_FINITE_MOTIF_CAPABILITY'?
    'TWO_ROUNDS_EXECUTED':'SECOND_ROUND_HELD',
   first,feedback_plan,second,
   independent_source_identity_verified:false,
   no_auto_capability_install:true,
   origin:'NATIVE_EXACT_ALEX023_PLANZ023_GRAFT023'
  };
 }catch(error){
  return {status:'HOLD_NATIVE_MOTIF_SOURCE_OR_PROCESS',
   error:String(error.message||error).slice(0,140),
   independent_source_identity_verified:false,
   no_auto_capability_install:true};
 }
}
// A local, side-effect-free route recommendation. The question is not sent
// to any public service until the operator checks providers and investigates.
export function suggestInvestigationProviders(question){
 return discoverProviders(question);
}
export function listPublicInvestigationProviders(){
 return PUBLIC_PROVIDER_CATALOG;
}
export async function investigateDesk(input,options={}){
 const form=normalize(input);
 const pins=verifyOriginalOrgans(); // verify before network effects
 const fetchImpl=options.transport||globalThis.fetch;
 const githubToken=options.githubToken??null;
 if(typeof fetchImpl!=='function')throw Error('HOLD_NO_PUBLIC_SOURCE_TRANSPORT');
 // Budget total outbound calls; providers remain independently resumable by
 // the operator through a new explicit public-search request.
 const timer=AbortSignal.timeout(options.timeoutMs??50000);
 const transport=(url,opts)=>fetchImpl(url,{...opts,
  signal:opts.signal?AbortSignal.any([opts.signal,timer]):timer});
 // These two research contracts stay independent: ALEX-024 signs its own
 // GitHub/Wikipedia/OpenAlex packet; ALEX-025 signs a separate index packet.
 const legacyScopes=Object.fromEntries(['github','wikipedia','scholarly']
  .map(k=>[k,form.scopes[k]===true]));
 const evidence=Object.values(legacyScopes).some(Boolean)?
  await eagleEye({question:form.question,scopes:legacyScopes,depth:form.depth},
   {transport,githubToken}):
  {schema:'jarvis.no-legacy-public-provider/v0',status:'NOT_SELECTED',
   hits:[],failures:[],source_documents:[],results_truncated:false,
   catalog:{enumerated:0,selected:0,complete:true}};
 if(evidence.status!=='NOT_SELECTED')checkEagle(evidence);
 const supplemental=await searchSelectedProviders({question:form.question,scopes:form.scopes},
  {transport,githubToken});
 verifySupplemental(supplemental);
 const public_leads=[...evidence.hits,...supplemental.hits];
 const motif=form.deep?await sourceReasoning(form.question,transport,githubToken):
  {status:'NOT_REQUESTED',no_native_reasoning_claimed:true};
 const body={
  schema:'jarvis.investigation-desk/v0',
  question:form.question,
  searched_at:(options.now||safeNow)(),
  source_owners:pins,
  selected_scopes:form.scopes,source_depth:form.depth,
  public_research:evidence,
  supplemental_research:supplemental,
  public_leads,
  provider_recommendations:discoverProviders(form.question),
  motif_reasoning:motif,
  status:public_leads.length?'PUBLIC_EVIDENCE_LEADS_AVAILABLE':
   'HOLD_NOT_ENOUGH_PUBLIC_SOURCE_EVIDENCE',
  next_questions:[
   ...(motif.feedback_plan?.next_question?[motif.feedback_plan.next_question]:[]),
   'Which independently recoverable original would distinguish a shared source from coincidental agreement?',
   'Which additional source is not downstream from the same claimant?'
  ].slice(0,3),
  disclosure:'Recommendations were computed locally; the search question was sent only to explicitly selected public providers. No private account access or automatic records storage.',
  research_lead_not_answer:true,
  output_admission:'NONE',
  source_custody_verified:false,
  external_writes:0,no_contact_or_deployment:true
 };
 return {...body,receipt_sha256:hash(body)};
}

// Separate explicit door: missing-specialized-provider investigation.
//
// The capability compiler never contacts a discovered API server. Even the
// public GitHub *specification search* requires an explicit user action.
export async function discoverResearchSource(input,options={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||
   typeof input.question!=='string'||input.question.length>320||
   input.approvedPublicGithubSearch!==true)
  throw Error('HOLD_PUBLIC_SPEC_SEARCH_CONSENT_REQUIRED');
 const originals=verifyOriginalOrgans();
 const gap=identifyGap(input.question);
 const discovery=await discoverMissingProvider({
  question:input.question,approvedPublicGithubSearch:true
 },{transport:options.transport??globalThis.fetch,
    githubToken:options.githubToken??null});
 verifyDiscovery(discovery);
 const candidate=discovery.public_provider_proposals?.[0]??null;
 let review=null;
 if(candidate){
  // Original planZ classical solver, not a handwritten fake plan.
  const a=(name,cost,pre,add)=>({name,cost,pre,add,del:[]});
  const domain=[
   a('VERIFY_PUBLIC_GIT_BLOB',1,['DISCOVERED'],['SOURCE_SEEN']),
   a('REVIEW_SECURITY_AND_LICENSING',1,['SOURCE_SEEN'],['LIMITATIONS_KNOWN']),
   a('COMPILE_OFFLINE_FIXTURE',2,['LIMITATIONS_KNOWN'],['FIXTURE_AVAILABLE']),
   a('PRETEND_PUBLIC_HOST_IS_TRUSTED',9,['LIMITATIONS_KNOWN'],['FIXTURE_AVAILABLE']),
   a('REQUIRE_HUMAN_OWNER_DECISION',1,['FIXTURE_AVAILABLE'],['REVIEW_READY'])
  ];
  const plan=solve(domain,['DISCOVERED'],['REVIEW_READY']);
  if(plan.status!=='PLAN_FOUND'||plan.steps.includes('PRETEND_PUBLIC_HOST_IS_TRUSTED'))
   throw Error('HOLD_UNSAFE_CLASSICAL_PROVIDER_PLAN');
  const fixture=await evaluateFixture(discovery,0,{
   status:200,contentType:'application/json',
   body:{demonstration:'SYNTHETIC_NOT_REAL_API_RESPONSE',records:[1,2]}
  });
  review={
   classical_plan:{steps:plan.steps,declared_cost:plan.cost,
    original_optimizer:'planZ/STRIPS_DIJKSTRA',field_steps_executed:0},
   compiled_fixture:fixture.compiled,
   offline_observation:fixture.observation,
   next_question:'Which official provider can authenticate this API specification, license, security requirements and safe production access?',
   requires_separate_owner_review:true
  };
 }
 const body={
  schema:'jarvis.missing-provider-discovery/v0',question:input.question,
  research_gap:gap,discovery,
  review,imported_source_owners:originals,
  status:review?'REVIEWABLE_API_ADAPTER_PROPOSAL':
   'HOLD_NO_VERIFIED_PUBLIC_SPEC_ADAPTER',
  public_github_index_only:true,
  reported_source_origin_identity_not_verified:true,
  proposed_provider_server_contacted:false,
  private_sources_read:false,
  adapter_installed:false,
  external_writes:0,authority:'none'
 };
 return {...body,receipt_sha256:hash(body)};
}
