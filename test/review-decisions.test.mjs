import test from 'node:test';import assert from 'node:assert/strict';
import {parseReviewIssue,validateLedger,decide,getPermission} from '../tools/record-review-decision.mjs';
const A='a'.repeat(40),B='b'.repeat(40),id='DIFF-'+'A'.repeat(20);
const body='JARVIS_CHANGE_REVIEW_V1\n'+JSON.stringify({candidateId:id,repo:'webZ',from:A,to:B})+'\nEND_JARVIS_CHANGE_REVIEW_V1';
const issueUrl='https://github.com/the-static-collective/JAR-VIS/issues/15';
const event={action:'created',repository:{full_name:'the-static-collective/JAR-VIS'},
 issue:{number:15,title:'[JARVIS REVIEW] webZ '+id,body,html_url:issueUrl},
 comment:{id:123,body:'/jarvis-review HOLD',created_at:'2026-10-28T19:00:00Z',html_url:issueUrl+'#issuecomment-123',user:{login:'reviewer-a'}},
 sender:{login:'reviewer-a'}};
const queue={candidates:[{id,repo:'webZ',from:A,to:B,state:'PENDING_REVIEW',admission:'NOT_ADMITTED'}]};
const ledger={schema:'static-collective/review-decisions-v1',authority:'GITHUB_WRITE_REVIEWERS',records:[]};
test('a signed-in write reviewer can persist only a bounded source decision',()=>{
 const r=decide({event,queue,permission:'write',ledger});
 assert.equal(r.updated,true);assert.equal(r.ledger.records[0].disposition,'HOLD');
 assert.equal(r.ledger.records[0].claim,'SOURCE_REVIEW_ONLY_NOT_DEPLOYMENT_OR_FIELD_PROOF');
 assert.ok(!JSON.stringify(r.ledger).includes('approved partnership'));
 assert.equal(decide({event,queue,permission:'write',ledger:r.ledger}).updated,false);
 validateLedger(r.ledger);
});
test('review decisions never inherit authority from untrusted issue authors or labels',()=>{
 for(const role of ['read','triage','none',null]){
  assert.throws(()=>decide({event,queue,permission:role,ledger}),/NOT_AUTHORIZED/);
 }
 assert.throws(()=>decide({event:{...event,sender:{login:'someone-else'}},queue,permission:'write',ledger}),/NOT_AUTHORIZED/);
 assert.throws(()=>decide({event:{...event,issue:{...event.issue,pull_request:{}}},queue,permission:'write',ledger}));
 assert.throws(()=>decide({event:{...event,action:'edited'},queue,permission:'write',ledger}));
});
test('unmatched or mutated source descriptions and uninspectable comparisons fail closed',()=>{
 for(const bodyEdit of ['garbage','JARVIS_CHANGE_REVIEW_V1\n{"candidateId":"'+id+'"}\nEND_JARVIS_CHANGE_REVIEW_V1']){
  assert.throws(()=>parseReviewIssue(bodyEdit));
 }
 assert.throws(()=>decide({event,queue:{candidates:[]},permission:'write',ledger}),/CANDIDATE_NOT_CURRENTLY_QUEUED/);
 assert.throws(()=>decide({event:{...event,comment:{...event.comment,body:'/jarvis-review VERIFIED_FIELD'}},queue,permission:'write',ledger}),/NOT_REVIEW_COMMAND/);
 assert.throws(()=>decide({event:{...event,comment:{...event.comment,body:'/jarvis-review SOURCE_CHANGE_REVIEWED'}},queue:{candidates:[{...queue.candidates[0],state:'HOLD_COMPARE'}]},permission:'admin',ledger}),/UNINSPECTABLE_COMPARE/);
});
test('permission check reads GitHub repository authorization, not an issue user claim',async()=>{
 const calls=[];
 const allow=await getPermission('reviewer-a',{token:'test-only',fetcher:async(url)=>{calls.push(url);return new Response(JSON.stringify({permission:'write',user:{login:'reviewer-a'}}));}});
 assert.equal(allow,'write');assert.ok(calls[0].includes('/collaborators/reviewer-a/permission'));
 await assert.rejects(()=>getPermission('reviewer-a',{token:'test-only',fetcher:async()=>new Response(JSON.stringify({permission:'read',user:{login:'reviewer-a'}}))}));
});
test('a distinct authorized comment creates a new, attributable append-only decision',()=>{
 const one=decide({event,queue,permission:'admin',ledger}).ledger;
 const event2={...event,comment:{...event.comment,id:124,body:'/jarvis-review NEEDS_EVIDENCE',html_url:issueUrl+'#issuecomment-124'}};
 const two=decide({event:event2,queue,permission:'admin',ledger:one}).ledger;
 assert.equal(two.records.length,2);assert.deepEqual(two.records.map(x=>x.disposition),['HOLD','NEEDS_EVIDENCE']);
});
