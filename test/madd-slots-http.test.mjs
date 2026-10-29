import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startWorkbenchServer} from '../src/server.mjs';

test('JAR;VIS serves playable six-up and refuses forged genome, actions and outside origins',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'madd-local-'));
 const app=await startWorkbenchServer({journalPath:join(temp,'journal.jsonl'),port:0,cannonPath:null});
 try{
  for(const route of ['/slots','/slots.css','/slots.js']){
   const response=await fetch(app.url+route);
   assert.equal(response.status,200,route);
   assert.ok((await response.text()).length>100);
  }
  const state=await (await fetch(app.url+'/api/state')).json();
  const question='Could Garden make an experimental festival?';
  const post=(body,token=state.csrfToken)=>fetch(app.url+'/api/slots/deal',{
   method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':token},
   body:JSON.stringify(body)});
  assert.equal((await post({question,intents:[]},'INVALID')).status,403);
  const initial=await post({question,intents:[]});assert.equal(initial.status,200);
  const parsed=await initial.json();
  assert.equal(parsed.deck.family.creatures.length,6);
  assert.equal(new Set(parsed.deck.family.creatures.map(c=>c.renderer)).size,6);
  assert.equal(parsed.deck.sourceExecution.nativeToaster,false);
  assert.equal(parsed.nativeToasterExecuted,false);
  assert.equal(parsed.fieldVerified,false);
  assert.equal((await post({question,intents:[],permission:'REAL'})).status,400);
  const after=await post({question,intents:[{kind:'SCRAPE'}]});
  assert.equal(after.status,200);
  assert.equal((await after.json()).deck.family.operation,'CONVERGE');
  const fabricated=await post({question,intents:[{kind:'KEEP',candidateId:'a'.repeat(16)}]});
  assert.equal(fabricated.status,422);
  assert.match((await fabricated.json()).error,/HOLD_KEEP_EXACT_CURRENT_CREATURE_REQUIRED/);
 }finally{await app.close();rmSync(temp,{recursive:true,force:true})}
});
