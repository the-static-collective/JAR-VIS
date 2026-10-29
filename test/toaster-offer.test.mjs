import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffer,verifyOffer} from '../src/cabaret/toaster-offer.mjs';
import {replaySlots} from '../src/cabaret/slots.mjs';
import {startWorkbenchServer} from '../src/server.mjs';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const q='Can a ghost cowboy make a community festival?';
const answer='Local JAR;VIS rule answer, not a real-world authorization.';
const deck=replaySlots({question:q,answer});
const keep={kind:'KEEP',candidateId:deck.family.creatures[0].id};
test('only a recorded exact current KEEP becomes a Toaster offer',()=>{
 assert.throws(()=>createOffer({question:q,answer,intents:[]}),/HOLD_EXACT_LOCAL_KEEP_REQUIRED/);
 assert.throws(()=>createOffer({question:q,answer,intents:[{kind:'SCRAPE'}]}),/HOLD_EXACT_LOCAL_KEEP_REQUIRED/);
 assert.throws(()=>createOffer({question:q,answer,intents:[{kind:'KEEP',candidateId:'a'.repeat(16)}]}),/HOLD_KEEP_EXACT_CURRENT_CREATURE_REQUIRED/);
 const offer=createOffer({question:q,answer,intents:[keep]});
 assert.equal(offer.schema,'jarvis.toaster-native-offer/v1');
 assert.equal(offer.sourceMedia.nativeVisualScoreSupplied,false);
 assert.equal(offer.sourceMedia.permissionForToasterKeep,false);
 assert.equal(offer.sourceMedia.sourceRightsVerified,false);
 assert.equal(offer.selectedCreature.id,keep.candidateId);
 assert.equal(verifyOffer(offer).permissionToRender,false);
 assert.deepEqual(offer,createOffer({question:q,answer,intents:[keep]}));
});
test('forged candidate digest, changed answer, fake media and changed KEEP all refuse',()=>{
 const offer=createOffer({question:q,answer,intents:[keep]});
 for(const value of [
  {...offer,selectedCreature:{...offer.selectedCreature,renderer:'video'}},
  {...offer,answer:offer.answer+' ALTERED'},
  {...offer,sourceMedia:{...offer.sourceMedia,permissionForToasterKeep:true}},
  {...offer,extraAuthority:true},
  {...offer,intents:[{kind:'SCRAPE'}]},
  {...offer,offerDigest:'sha256:'+'f'.repeat(64)}
 ])assert.throws(()=>verifyOffer(value),/HOLD_/);
});
test('real localhost export preserves separate native KEEP and rejects pre-KEEP',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'toaster-offer-'));
 const app=await startWorkbenchServer({journalPath:join(dir,'journal.jsonl'),port:0,cannonPath:null});
 try{
  const state=await (await fetch(app.url+'/api/state')).json();
  const ask=await fetch(app.url+'/api/slots/deal',{method:'POST',
   headers:{'content-type':'application/json','x-jarvis-csrf':state.csrfToken},
   body:JSON.stringify({question:q,intents:[]})});
  const initial=(await ask.json()).deck;
  const post=body=>fetch(app.url+'/api/slots/toaster-offer',{method:'POST',
   headers:{'content-type':'application/json','x-jarvis-csrf':state.csrfToken},
   body:JSON.stringify(body)});
  assert.equal((await post({question:q,intents:[]})).status,422);
  assert.equal((await post({question:q,intents:[],submit:true})).status,400);
  const accepted=await post({question:q,intents:[{kind:'KEEP',candidateId:initial.family.creatures[0].id}]});
  assert.equal(accepted.status,200);
  const payload=await accepted.json();
  assert.equal(payload.renderAuthorized,false);
  assert.equal(payload.mediaAttached,false);
  assert.equal(payload.offer.sourceMedia.permissionForToasterKeep,false);
  assert.ok(verifyOffer(payload.offer).offerDigest.startsWith('sha256:'));
 }finally{await app.close();rmSync(dir,{recursive:true,force:true})}
});
