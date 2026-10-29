import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,RENDERERS,replaySlots,inspectSlots} from '../src/cabaret/slots.mjs';

const q='Could Garden build a funny festival?';
const a='The local attendant cannot authorize real people or venues.';
const run=intents=>replaySlots({question:q,answer:a,intents});
test('47 species, 15 formats, six unique roles and formats',()=>{
 assert.equal(SPECIES.length,47);
 assert.equal(RENDERERS.length,15);
 const x=run([]);
 assert.deepEqual(x,run([]));
 assert.equal(x.family.operation,'BIRTH');
 assert.equal(x.family.creatures.length,6);
 assert.equal(new Set(x.family.creatures.map(c=>c.renderer)).size,6);
 assert.equal(new Set(x.family.creatures.map(c=>c.role)).size,6);
 assert.equal(x.preferenceWeightsRecorded,false);
 assert.equal(x.sourceExecution.nativeToaster,false);
});
test('six-up remains diverse across fifty independent questions',()=>{
 for(let n=0;n<50;n++){
  const x=replaySlots({question:'Can a little clown explore the future '+n+'?',answer:a});
  assert.equal(new Set(x.family.creatures.map(c=>c.renderer)).size,6);
  for(const c of x.family.creatures){
   assert.ok(c.art&&Object.keys(c.art).length);
   assert.ok(c.creatureDigest.startsWith('sha256:'));
  }
 }
});
test('scrape escalates through CONVERGE, STOMP, fresh birth',()=>{
 const one=run([{kind:'SCRAPE'}]);
 const two=run([{kind:'SCRAPE'},{kind:'SCRAPE'}]);
 const three=run([{kind:'SCRAPE'},{kind:'SCRAPE'},{kind:'SCRAPE'}]);
 assert.equal(one.family.operation,'CONVERGE');
 assert.equal(two.family.operation,'STOMP');
 assert.equal(three.family.operation,'FRESH_BIRTH');
 assert.notEqual(one.family.familyDigest,two.family.familyDigest);
 assert.deepEqual(three.keepers,[]);
 assert.equal(three.preferenceWeightsRecorded,false);
});
test('KEEP admits one exact creature, not a feature preference',()=>{
 const specimen=run([]).family.creatures[0];
 const x=run([{kind:'KEEP',candidateId:specimen.id}]);
 assert.equal(x.status,'KEPT');
 assert.equal(x.keepers[0].id,specimen.id);
 assert.deepEqual(x.nextAllowed,['NEXT']);
 assert.equal(x.receipts[0].candidateId,specimen.id);
 assert.equal(x.preferenceWeightsRecorded,false);
 assert.throws(()=>run([{kind:'KEEP',candidateId:specimen.id},{kind:'SCRAPE'}]),/HOLD_AFTER_KEEP_NEXT_REQUIRED/);
});
test('one kept ancestor produces MUTATE, two produce CROSS',()=>{
 const first=run([]).family.creatures[0];
 const next=run([{kind:'KEEP',candidateId:first.id},{kind:'NEXT'}]);
 assert.equal(next.family.operation,'MUTATE');
 const second=next.family.creatures[1];
 const crossed=run([{kind:'KEEP',candidateId:first.id},{kind:'NEXT'},
  {kind:'KEEP',candidateId:second.id},{kind:'NEXT'}]);
 assert.equal(crossed.family.operation,'CROSS');
 assert.deepEqual(crossed.family.ancestry,[first.id,second.id]);
 assert.equal(crossed.receipts[1].priorReceipt,crossed.receipts[0].receiptDigest);
});
test('machine refuses genome injection, fake permission and false replay',()=>{
 for(const intents of [[{kind:'STOMP'}],[{kind:'CROSS'}],[{kind:'FOCUS'}],
  [{kind:'KEEP',candidateId:'fake'}],[{kind:'NEXT'}],
  [{kind:'SCRAPE',authority:'real'}]])assert.throws(()=>run(intents),/HOLD_/);
 const x=run([{kind:'SCRAPE'}]);
 assert.equal(inspectSlots({question:q,answer:a,intents:[{kind:'SCRAPE'}],
  expectedFamilyDigest:x.family.familyDigest}).verified,'DETERMINISTIC_SOFTWARE_REPLAY_ONLY');
 assert.throws(()=>inspectSlots({question:q,answer:a,intents:[],
  expectedFamilyDigest:x.family.familyDigest}),/HOLD_FAMILY_REPLAY_MISMATCH/);
 assert.throws(()=>replaySlots({question:q,answer:a,intents:[null]}),/HOLD_/);
 assert.throws(()=>replaySlots({question:'x',answer:a}),/HOLD_/);
});
test('all fifteen species renderer payload contracts are reached in a bounded sample',()=>{
 const seen=new Map();
 for(let n=0;n<150&&seen.size<15;n++){
  const x=replaySlots({question:'Question about the moon and the festival '+n+'?',answer:a});
  for(const c of x.family.creatures)seen.set(c.renderer,c.art);
 }
 assert.equal(seen.size,15);
 assert.equal(seen.get('radio').melody.length,24);
 assert.equal(seen.get('drums').steps.length,16);
 assert.equal(seen.get('manga').panels.length,6);
 assert.equal(seen.get('flipbook').frames.length,8);
 assert.equal(seen.get('blueprint').nodes.length,6);
 assert.equal(seen.get('constellation').nodes.length,9);
 assert.equal(seen.get('zine').pages.length,4);
 assert.equal(seen.get('gamebook').choices.length,3);
 assert.equal(seen.get('recipe').steps.length,5);
 assert.ok(seen.get('postcard').message);
});

test('CONVERGE chooses only unvisited media after first family',()=>{
 const first=run([]),converged=run([{kind:'SCRAPE'}]);
 const prior=new Set(first.family.creatures.map(c=>c.renderer));
 for(const creature of converged.family.creatures)assert.equal(prior.has(creature.renderer),false);
 assert.equal(converged.family.frontierBefore[first.family.creatures[0].renderer],1);
 assert.equal(converged.family.frontierBefore[converged.family.creatures[0].renderer],0);
});
test('STOMP rejects every renderer from the previous local six-up',()=>{
 const first=run([{kind:'SCRAPE'}]),second=run([{kind:'SCRAPE'},{kind:'SCRAPE'}]);
 const prior=new Set(first.family.creatures.map(c=>c.renderer));
 assert.equal(second.family.operation,'STOMP');
 for(const creature of second.family.creatures)assert.equal(prior.has(creature.renderer),false);
});
test('exact kept parent medium survives MUTATE and two kept parent media survive CROSS',()=>{
 const first=run([]).family.creatures[0];
 const moved=run([{kind:'KEEP',candidateId:first.id},{kind:'NEXT'}]);
 assert.ok(moved.family.creatures.some(c=>c.renderer===first.renderer));
 const other=moved.family.creatures.find(c=>c.renderer!==first.renderer);
 const crossed=run([{kind:'KEEP',candidateId:first.id},{kind:'NEXT'},
  {kind:'KEEP',candidateId:other.id},{kind:'NEXT'}]);
 assert.ok(crossed.family.creatures.some(c=>c.renderer===first.renderer));
 assert.ok(crossed.family.creatures.some(c=>c.renderer===other.renderer));
});
test('SCRAPE receipt preserves the extinct family and subsequent emerging family separately',()=>{
 const one=run([]),after=run([{kind:'SCRAPE'}]);
 assert.equal(after.receipts[0].offeredFamilyDigest,one.family.familyDigest);
 assert.equal(after.receipts[0].resultFamilyDigest,after.family.familyDigest);
 assert.notEqual(after.receipts[0].offeredFamilyDigest,after.receipts[0].resultFamilyDigest);
});
