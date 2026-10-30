import {createHash} from 'node:crypto';
import {validatePlanZFeed,findPlanAttention,PLANZ_URL} from './planz-attention.mjs';
const digest=(prefix,obj)=>'sha256:'+createHash('sha256').update(prefix+JSON.stringify(obj)).digest('hex');
const fail=(ok,reason)=>{if(!ok)throw Error('JARVIS_CULTURE_HOLD: '+reason)};
export function attendCultureReturn(packet,triage,graft,feed){
 fail(packet?.schema==='cannon.culture-reuse-offer/v1','SOURCE_SCHEMA');
 const {identity,...sourceBody}=packet;
 fail(identity===digest('CULTURE_RETURN_005|',sourceBody),'SOURCE_CHANGED');
 fail(packet.truth?.fictional===true&&Object.entries(packet.truth).every(([k,v])=>k==='fictional'||v===false)&&
   Object.keys(packet.effects??{}).length===5&&Object.values(packet.effects).every(x=>x===0),
   'AUTHORITY_UNVERIFIED');
 const {triageId,...triageBody}=triage??{};
 fail(triageId===digest('',triageBody)&&triageBody.schema==='planz.culture-return-triage/v1'&&
   triageBody.culturePacket===identity&&triageBody.disposition==='HOLD_FOR_PLAN_OWNER_REVIEW'&&
   triageBody.sourceOwnerApproved===false&&triageBody.planUpdated===false&&
   triageBody.executionAllowed===false&&triageBody.networkSent===false,'PLANZ_GATE');
 const {candidateId,...graftBody}=graft??{};
 fail(candidateId===digest('',graftBody)&&graftBody.schema==='graft.culture-nursery-candidate/v1'&&
   graftBody.parentCulture===identity&&graftBody.planReview===triageId&&
   graftBody.planId===triage.planId&&graftBody.branchCreated===false&&
   graftBody.codeImported===false&&graftBody.publication===false&&
   graftBody.ownerConsent==='UNKNOWN'&&graftBody.status==='HELD_BRANCH_CANDIDATE_NOT_A_BRANCH',
   'GRAFT_GATE');
 const index=validatePlanZFeed(feed),plan=index.records.find(x=>x.id===triage.planId);
 fail(plan&&feed.edition===triage.indexEdition&&plan.source===triage.planSource&&
   plan.nextGate===triage.ownerGate&&plan.executionAllowed===false,'PLAN_SOURCE');
 const observation={schema:'jarvis.planz-attention-observation/v0',source:PLANZ_URL,authority:'INDEX_ONLY',records:index.records};
 fail(findPlanAttention(observation,plan.tags.join(' '),index.records.length).some(x=>x.id===plan.id),
   'NATIVE_MATCH_ABSENT');
 const body={schema:'jarvis.culture-attention/v1',receivedCulture:identity,planZReview:triageId,
   graftProposal:candidateId,selectedPlan:plan.id,planIssue:plan.source,sourceEdition:feed.edition,
   candidateMethod:packet.proposal.candidateMethod,suggestedUse:packet.proposal.suggestedUse,
   nextQuestion:'Would an authorized steward review a fictional six-panel learning-card demonstration?',
   nextGate:plan.nextGate,blockedBy:[...plan.blockedBy],
   sourceRecognition:'NATIVE_PLANZ_PUBLIC_INDEX_MATCH',disposition:'HOLD_FOR_HUMAN_ATTENTION',
   operatorReviewRequired:true,localTaskCreated:false,externalMessageSent:false,
   automaticExecution:false,independentHumanAuthenticated:false,fieldOutcomeVerified:false,
   culturalRightsGranted:false,pennyIssued:0,canonSelected:false};
 return {...body,attentionId:digest('JARVIS_CULTURE_ATTENTION_005|',body)};
}
