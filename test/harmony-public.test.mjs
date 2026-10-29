import test from 'node:test';
import assert from 'node:assert/strict';
import {HARMONY_SOURCE,validateHarmonyCatalog,inspectHarmonyPublic,composeHarmonyCandidate} from '../src/harmony-public.mjs';
const ids=['food','fellowship','campus','festival','care','farm','civic','founder'];
const fixture={schema:'abundent.harmony-catalog/v1',status:'PUBLIC_SAFE_PROTOTYPE_NOT_PARTNERSHIP',asOf:'2026-10-29',
 invariants:['CULTURE_NOT_CONQUEST','EXIT_WITHOUT_PENALTY'],
 profiles:ids.map((id)=>({id,title:'Context of '+id,question:'How could '+id+' help?',offer:'Practice one voluntary, local decision without enrollment.',first:'../suitcase/',firstName:'Suitcase local tool',
  neighbors:[['Room','../'],['Wallet','../../commons/wallet/'],['Receiver','../../commons/receiver/']],
  gates:['Named local permission is independently required.','Human confirmation is not inferred.']}))};
const mock=(doc=fixture,other={})=>{
 const calls=[];
 const fetchImpl=async (url,options)=>{calls.push({url,options});return new Response(JSON.stringify(doc),{
  status:other.status??200,headers:{'content-type':other.type??'application/json'}});};
 return {fetchImpl,calls};
};
test('fixed public source read and human-reviewed HOLD candidate',async()=>{
 const f=mock();
 const o=await inspectHarmonyPublic({fetchImpl:f.fetchImpl,now:()=> '2026-10-29T10:00:00Z'});
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].url,HARMONY_SOURCE);
 assert.equal(f.calls[0].options.redirect,'error');
 assert.equal(o.records.length,8);
 assert.match(o.contentSha256,/^[a-f0-9]{64}$/);
 const d=composeHarmonyCandidate(o,'farm');
 assert.equal(d.mission,'farm');
 assert.equal(d.disposition,'HOLD_FOR_OPERATOR_REVIEW');
 assert.equal(d.executionAllowed,false);
 assert.equal(d.thirdPartyApproval,'NOT_ESTABLISHED');
 assert.equal(d.fieldOutcome,'NOT_VERIFIED');
 assert.equal(d.transmitted,false);
});
test('cannot insert unauthorized destinations or fake profile',()=>{
 for(const bad of [{...fixture,profiles:fixture.profiles.slice(1)},
  {...fixture,profiles:fixture.profiles.map(p=>({...p,first:'https://attacker.example'}))},
  {...fixture,profiles:fixture.profiles.map(p=>({...p,id:'impersonated-steward'}))},
  {...fixture,status:'AUTHORIZED_PARTNERS'}]){
  assert.throws(()=>validateHarmonyCatalog(bad));
 }
});
test('failed source inspection does not create a candidate',async()=>{
 await assert.rejects(inspectHarmonyPublic({fetchImpl:mock(fixture,{status:404}).fetchImpl}));
 await assert.rejects(inspectHarmonyPublic({fetchImpl:mock(fixture,{type:'text/html'}).fetchImpl}));
 const o=await inspectHarmonyPublic({fetchImpl:mock().fetchImpl});
 assert.throws(()=>composeHarmonyCandidate(o,'unknown'),/HOLD/);
 assert.throws(()=>composeHarmonyCandidate({...o,authority:'EXECUTE'},'food'),/HOLD/);
});
