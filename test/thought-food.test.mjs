import test from 'node:test';
import assert from 'node:assert/strict';
import {THOUGHT_SOURCES,compileThoughtFood,verifyThoughtFood} from '../src/thought-food.mjs';
const packet=()=>compileThoughtFood();
test('five creative owners plus festival method are pinned public references, never claimed executed',()=>{
 assert.equal(THOUGHT_SOURCES.length,6);
 assert.deepEqual(new Set(THOUGHT_SOURCES.map(x=>x.kind)).size,6);
 for(const s of THOUGHT_SOURCES){assert.match(s.commit,/^[0-9a-f]{40}$/);assert.match(s.url,/^https:\/\/github.com\/the-static-collective\//);}
 const p=packet();
 assert.equal(p.schema,'jarvis.thought-food-packet/v1');
 assert.equal(p.payload.crossings.length,3);
 assert.equal(p.payload.operatorDisposition,'REVIEW_HOLD');
 assert.equal(p.payload.rightsToReuseMedia,false);
 assert.equal(p.payload.sourceOwnersExecutedByThisCall,0);
 assert.equal(p.payload.realPeopleRecruited,0);
 assert.equal(p.payload.applicationSubmitted,false);
 assert.deepEqual(verifyThoughtFood(p).permissionToPublish,false);
 assert.deepEqual(p,packet());
});
test('crossing requires real independent review, not fictional or inherited permission',()=>{
 const p=compileThoughtFood({purpose:'VOQAL_APPLICANT_REVIEW',ids:['living-record','groovetown','music-film','machine-book']});
 assert.equal(p.payload.crossings.length,6);
 assert.ok(p.payload.crossings.every(x=>x.state==='IDEA_ONLY_HOLD'&&/independent second table/.test(x.concreteNextStep)));
 assert.ok(p.payload.rules.some(x=>/SECOND_TABLE_RETAINS_INDEPENDENT/.test(x)));
 assert.ok(p.payload.sourceReferences.every(x=>x.rightsAndTruthBoundary));
 assert.equal(verifyThoughtFood(p).realHumanEvidence,false);
});
test('invalid selections, forged evidence, and altered source ancestry are refused',()=>{
 for(const ids of [[],['six-movies'],['six-movies','six-movies'],['unknown','groovetown'],Array(6).fill('groovetown')])
  assert.throws(()=>compileThoughtFood({ids}),/THOUGHT_FOOD_HOLD/);
 assert.throws(()=>compileThoughtFood({purpose:'AUTO_PUBLISH'}),/THOUGHT_FOOD_HOLD/);
 const p=packet();
 for(const forged of [
  {...p,digest:'sha256:'+'0'.repeat(64)},
  {...p,payload:{...p.payload,realSuccessVerified:true}},
  {...p,payload:{...p.payload,sourceReferences:p.payload.sourceReferences.map((x,i)=>i===0?{...x,commit:'0'.repeat(40)}:x)}},
  {...p,payload:{...p.payload,crossings:[]}},
  {...p,payload:{...p.payload,rules:[]}},
  {...p,externalSend:true},
 ])assert.throws(()=>verifyThoughtFood(forged),/THOUGHT_FOOD_HOLD/);
});
