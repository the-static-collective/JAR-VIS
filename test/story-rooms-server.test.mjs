import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {startWorkbenchServer} from '../src/server.mjs';
test('real localhost story catalog, fictional-only composition, CSRF and prompt boundary',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'story-rooms-'));
 const app=await startWorkbenchServer({journalPath:join(dir,'journal.jsonl'),port:0,cannonPath:null});
 try{
  const state=await fetch(app.url+'/api/state').then(r=>r.json());
  const src=await fetch(app.url+'/api/story-rooms/catalog').then(r=>r.json());
  assert.equal(src.sources.length,8);
  const post=(body,token=state.csrfToken)=>fetch(app.url+'/api/story-rooms/compose',{method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':token},body:JSON.stringify(body)});
  assert.equal((await post({purpose:'SECOND_TABLE',ids:['collection-event','octopus-rooms']},'forgery')).status,403);
  assert.equal((await post({purpose:'SECOND_TABLE',ids:['collection-event','octopus-rooms'],publish:true})).status,400);
  const ok=await post({purpose:'SECOND_TABLE',ids:['collection-event','octopus-rooms']});
  assert.equal(ok.status,200);
  const result=await ok.json();assert.equal(result.packet.payload.planCandidates.length,1);
  assert.equal(result.packet.payload.newStoryCanonDeclared,false);assert.equal(result.published,false);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
