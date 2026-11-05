// Human-facing MOTIF-027 capability garden.
// Public GitHub spec search and third-party live demo each require a distinct
// operator action. Only original source-owned GRAFT modules are executed.
import {createHash} from 'node:crypto';
import {verifyOriginalOrgans} from './investigation-desk.mjs';
import {discoverMissingProvider} from '../integrations/investigation/alex/api-discovery-026.mjs';
import {cultivate} from '../integrations/investigation/graft/src/capability-gardener-027.mjs';
import {probePublicExample,PILOT} from '../integrations/investigation/graft/src/live-pilot-027.mjs';
import {solve} from '../integrations/investigation/planz/motif-classical.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const response=body=>({status:200,contentType:'application/json',body});
function weatherCases(){
 return {hint:'temperature',train:[
  {response:response({current:{temperature_2m:21,humidity:50},decoy:{temperature:21}}),expected:21},
  {response:response({current:{temperature_2m:12,humidity:65},decoy:{temperature:12}}),expected:12}
 ],holdout:[
  {response:response({current:{temperature_2m:3,humidity:85},decoy:{temperature:19}}),expected:3},
  {response:response({current:{temperature_2m:-4,humidity:44},decoy:{temperature:29}}),expected:-4}
 ],negative:[
  {response:response({current:{temperature_2m:'error'}}),reject:true},
  {response:response({current:{humidity:11}}),reject:true},
  {response:{status:503,contentType:'application/json',
   body:{current:{temperature_2m:8}}},reject:true}
 ]};
}
export function getSyntheticGardenCases(){return structuredClone(weatherCases());}
const action=(name,cost,pre,add)=>({name,cost,pre,add,del:[]});
function reviewPlan(evaluation){
 const winner=!!evaluation.winner;
 const actions=[
  action('INSPECT_HELDOUT_RESULTS',1,['TESTED'],['READ']),
  action(winner?'REQUEST_INDEPENDENT_LIVE_VALIDATION':'REQUEST_BETTER_LABELED_EXAMPLES',
   2,['READ'],['QUESTION_READY']),
  action('ASSUME_LIVE_SUCCESS',9,['READ'],['QUESTION_READY']),
  action('HOLD_SOURCE_OWNER_REVIEW',1,['QUESTION_READY'],['DONE'])
 ];
 const chosen=solve(actions,['TESTED'],['DONE']);
 if(chosen.status!=='PLAN_FOUND'||chosen.steps.includes('ASSUME_LIVE_SUCCESS'))
  throw Error('HOLD_UNSAFE_GARDEN_REVIEW_PLAN');
 return {schema:'jarvis027.classical-garden-plan/v0',
  steps:chosen.steps,cost:chosen.cost,
  next_question:evaluation.failure_driven_next_question,
  source_owner_approval:false,production_install:false};
}
export async function growSourceGarden(input={},options={}){
 if(!input||typeof input!=='object'||typeof input.question!=='string'||
  input.question.length>320||input.approvedPublicGithubSearch!==true)
  throw Error('HOLD_EXPLICIT_GARDEN_SEARCH_CONSENT_REQUIRED');
 const owners=verifyOriginalOrgans();
 const discovery=await discoverMissingProvider({
  question:input.question,approvedPublicGithubSearch:true
 },{transport:options.transport??globalThis.fetch,
  githubToken:options.githubToken??null});
 if(discovery.status!=='PROPOSED_NEW_PUBLIC_SOURCE_ADAPTER')
  return {schema:'jarvis027.source-garden/v0',status:'HOLD_NO_REVIEWABLE_SOURCE_SPEC',
   discovery,owners,comparison:null,plan:null,
   live_public_service_contacted:false,production_install:false};
 if(discovery.gap?.identified_domain!=='weather')
  return {schema:'jarvis027.source-garden/v0',
   status:'HOLD_NEEDS_OPERATOR_LABELED_FIXTURES',
   discovery,owners,comparison:null,plan:null,
   labeled_examples_not_generalized:true,
   live_public_service_contacted:false,production_install:false};
 const comparison=await cultivate(discovery,weatherCases());
 const plan=reviewPlan(comparison);
 const body={schema:'jarvis027.source-garden/v0',
  status:comparison.winner?'HELD_SOURCE_SPECIFIC_GARDENER_RESULT':'HOLD_FAILED_VARIANTS',
  discovery,owners,comparison,plan,
  fixtures_are_synthetic_and_weather_specific:true,
  source_github_search_user_approved:true,
  real_third_party_connectivity_unproven_by_garden:true,
  live_public_service_contacted:false,production_install:false,
  private_sources_read:false,external_writes:0,authority:'none'};
 return {...body,checksum_sha256:sha(body)};
}
export async function runPublicLivePilot(input={},options={}){
 if(!input||input.approvedPublicPilot!==true)
  throw Error('HOLD_EXPLICIT_PUBLIC_LIVE_CONSENT_REQUIRED');
 if(Object.keys(input).some(k=>k!=='approvedPublicPilot'))
  throw Error('HOLD_UNSUPPORTED_LIVE_API_ARGUMENTS');
 verifyOriginalOrgans();
 return probePublicExample({approvedPublicPilot:true},{
  transport:options.transport??globalThis.fetch});
}
export function publicPilotDescription(){return PILOT;}
