// JAR;VIS Investigation Desk — human-facing entry to source-owned MOTIF
// inquiry machinery, plus ALEX-024 Eagle Eye breadth. No persistence or writes.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {eagleEye,validatePacket as checkEagle} from '../integrations/investigation/alex/eagle-eye-024.mjs';
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
   Object.keys(manifest.sources).length!==7)
  throw Error('HOLD_UNKNOWN_RESEARCH_ORGAN_PINSET');
 for(const [p,info] of Object.entries(manifest.sources)){
  if(!/^(alex|planz|graft)\//.test(p)||
     p.includes('..')||!(/^[a-f0-9]{40}$/.test(info.blob))||
     blob(readFileSync(new URL(p,DIRECTORY)))!==info.blob)
   throw Error('HOLD_SOURCE_OWNER_CODE_DRIFT_'+p);
 }
 verifyNativePlanZ();
 return {source_count:7,owners:['ALEX.2','planZ','GRAFT'],
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
   !['github','wikipedia','scholarly'].every(k=>typeof scopes[k]==='boolean')||
   !Object.values(scopes).some(Boolean)||
   Object.keys(scopes).some(k=>!['github','wikipedia','scholarly'].includes(k)))
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
 const evidence=await eagleEye({question:form.question,scopes:form.scopes,depth:form.depth},
  {transport,githubToken});
 checkEagle(evidence);
 const motif=form.deep?await sourceReasoning(form.question,transport,githubToken):
  {status:'NOT_REQUESTED',no_native_reasoning_claimed:true};
 const body={
  schema:'jarvis.investigation-desk/v0',
  question:form.question,
  searched_at:(options.now||safeNow)(),
  source_owners:pins,
  selected_scopes:form.scopes,source_depth:form.depth,
  public_research:evidence,
  motif_reasoning:motif,
  status:evidence.hits.length?'PUBLIC_EVIDENCE_LEADS_AVAILABLE':
   'HOLD_NOT_ENOUGH_PUBLIC_SOURCE_EVIDENCE',
  next_questions:[
   ...(motif.feedback_plan?.next_question?[motif.feedback_plan.next_question]:[]),
   'Which independently recoverable original would distinguish a shared source from coincidental agreement?',
   'Which additional source is not downstream from the same claimant?'
  ].slice(0,3),
  disclosure:'Search query sent only to opted-in public providers. No private account access or automatic records storage.',
  research_lead_not_answer:true,
  output_admission:'NONE',
  source_custody_verified:false,
  external_writes:0,no_contact_or_deployment:true
 };
 return {...body,receipt_sha256:hash(body)};
}
