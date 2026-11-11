import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {attendCultureReturn} from '../src/culture-return.mjs';
const H=(prefix,x)=>'sha256:'+createHash('sha256').update(prefix+JSON.stringify(x)).digest('hex');
function demo(){
 const feed={schema:'planz/public-attention-v1',edition:'ATTENTION-2026-10-28-005',reviewedOn:'2026-10-28',authority:'INDEX_ONLY',
  entries:[{id:'ATLAS-BRIDGE-002',title:'Atlas 002: independent source-review proposal',
   source:'https://github.com/the-static-collective/planZ/issues/33',
   region:'Source atlas',disposition:'OWNER_REVIEW_REQUIRED',tags:['atlas','bridge','cannon','graft'],
   nextGate:'Ask an authorized project owner to review this source cut before any actual use.',
   blockedBy:['SOURCE_OWNER_PERMISSION'],related:[],fieldOutcome:'NOT_VERIFIED',
   executionAllowed:false,thirdPartyApproval:'NOT_ESTABLISHED'}]};
 const source={schema:'cannon.culture-reuse-offer/v1',source:{comicSha256:'sha256:'+'a'.repeat(64)},
  proposal:{candidateMethod:'Illustrate a public method as a six panel teaching aid.',
   suggestedUse:'Ask a willing local host whether the card is helpful.'},
  truth:{fictional:true,humanAuthenticated:false,fieldUseVerified:false,
   licensedEdition:false,ownerCanonSelected:false,sourceSignatureIndependentlyVerified:false},
  effects:{pennyIssued:0,humanDeeds:0,externalPayments:0,nftsMinted:0,automaticActions:0}};
 const packet={...source,identity:H('CULTURE_RETURN_005|',source)},plan=feed.entries[0];
 const p={schema:'planz.culture-return-triage/v1',culturePacket:packet.identity,planId:plan.id,
  planSource:plan.source,indexEdition:feed.edition,ownerGate:plan.nextGate,
  disposition:'HOLD_FOR_PLAN_OWNER_REVIEW',sourceOwnerApproved:false,planUpdated:false,
  executionAllowed:false,networkSent:false};
 const triage={...p,triageId:H('',p)};
 const g={schema:'graft.culture-nursery-candidate/v1',parentCulture:packet.identity,
  planReview:triage.triageId,planId:plan.id,branchCreated:false,codeImported:false,
  publication:false,ownerConsent:'UNKNOWN',status:'HELD_BRANCH_CANDIDATE_NOT_A_BRANCH'};
 return {packet,triage,graft:{...g,candidateId:H('',g)},feed};
}
test('native JAR;VIS attention returns an owner-held next question',()=>{
 const d=demo(),v=attendCultureReturn(d.packet,d.triage,d.graft,d.feed);
 assert.equal(v.selectedPlan,'ATLAS-BRIDGE-002');
 assert.equal(v.disposition,'HOLD_FOR_HUMAN_ATTENTION');
 assert.equal(v.localTaskCreated,false);assert.equal(v.canonSelected,false);
 assert.equal(v.attentionId,attendCultureReturn(d.packet,d.triage,d.graft,d.feed).attentionId);
});
test('false rights and substitutions never become a JAR;VIS task',()=>{
 for(const mutate of [
  d=>d.packet.truth.humanAuthenticated=true,
  d=>d.packet.effects.pennyIssued=1,
  d=>d.triage.planUpdated=true,
  d=>d.graft.branchCreated=true,
  d=>d.feed.entries[0].source='https://example.com'
 ]){const d=demo();mutate(d);assert.throws(()=>attendCultureReturn(d.packet,d.triage,d.graft,d.feed));}
});
