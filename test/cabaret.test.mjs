import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {composeCabaret,makePassport} from '../src/cabaret/engine.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const example='Could our Garden project become a festival?';
const answer='This is a deterministic local attendant. No action has been authorized.';
const make=(extra={})=>composeCabaret({question:example,answer,...extra});
test('creative surprise selection is deterministic and six-eight song is truly synthesized',()=>{
 const a=make(),b=make();
 assert.deepEqual(a,b);
 assert.match(a.seed,/^sha256:[0-9a-f]{64}$/);
 const song=make({mode:'song'});
 assert.equal(song.media.meter,'6/8');
 assert.equal(song.media.bpm,92);
 assert.equal(song.media.melody.length,24);
 assert.equal(song.sourceExecution.hauntedToasterRan,false);
});
test('song, manga and flipbook are distinct executable render contracts, not claimed external media',()=>{
 assert.equal(make({mode:'song'}).media.kind,'browser-synth-song/v1');
 assert.equal(make({mode:'manga'}).media.panels.length,6);
 assert.equal(make({mode:'flipbook'}).media.frames.length,8);
 assert.notEqual(make({mode:'song'}).seed,make({mode:'song',variant:1}).seed);
 const a=make({mode:'surprise',variant:7}),b=make({mode:'surprise',variant:7});
 assert.deepEqual(a,b);
});
test('creative passport preserves question hash but no raw question or alleged external impact',()=>{
 const creative=make({mode:'manga'});
 const passport=makePassport(creative);
 assert.equal(passport.nativeOwnersExecutedByThisRequest,0);
 assert.equal(passport.externallyVerifiedHumanOutcomes,0);
 assert.equal(passport.publishableHumanSuccess,false);
 assert.equal(passport.sourceVerification.disposition,'HOLD_NO_SOURCE_LEDGER_VERIFIED');
 assert.doesNotMatch(JSON.stringify(passport),/Could our Garden project become a festival/);
 assert.deepEqual(passport,makePassport(creative));
});
test('only an exact source-attendant structural inspection may populate a source receipt',()=>{
 const creative=make();
 assert.throws(()=>makePassport(creative,{schema:'fake'}),/HOLD_SOURCE_VERIFIED_WITNESS_REQUIRED/);
 const inspection={schema:'jarvis.season-attendant-return/v1',
  status:'OFFLINE_INSPECTION_ONLY',
  source:{commit:'a'.repeat(40),schema:'jarvis.season-source-observation/v1'},
  result:{schema:'cannon.season-witness-inspection/v1',authorizedRealWorldActions:false,
   caseId:'fixture-case',receipt:'sha256:'+'b'.repeat(64),stage:'HUMAN_OUTCOME_REPORTED',
   disposition:'OPEN',evidenceMeaning:'RECORDED_REPORTS_NOT_INDEPENDENTLY_AUTHENTICATED_FACTS'}};
 const passport=makePassport(creative,inspection);
 assert.equal(passport.sourceVerification.recordedStage,'HUMAN_OUTCOME_REPORTED');
 assert.equal(passport.publishableHumanSuccess,false);
 assert.equal(passport.externallyVerifiedHumanOutcomes,0);
 assert.throws(()=>makePassport(creative,{...inspection,status:'SUBMITTED'}),/HOLD_SOURCE_VERIFIED_WITNESS_REQUIRED/);
});
test('invalid questions, modes, variants and unconstrained answers HOLD',()=>{
 for(const q of ['', ' ', 'x','a'.repeat(501),'\u0001secret'])assert.throws(()=>make({question:q}));
 for(const m of ['mp4','download','native-toaster','<script>'])assert.throws(()=>make({mode:m}));
 for(const v of [-1,1.5,100,'2'])assert.throws(()=>make({variant:v}));
 assert.throws(()=>make({answer:''}));
});
test('integrated JAR;VIS page and endpoints return grounded answer + no-field passport, and reject unsourced proof',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jarvis-cabaret-'));
 const service=await startWorkbenchServer({journalPath:join(dir,'journal.jsonl'),port:0,cannonPath:null});
 try{
  const response=await fetch(service.url+'/cabaret');
  assert.equal(response.status,200);
  assert.match(await response.text(),/GHOST COWBOY/);
  const script=await fetch(service.url+'/cabaret.js');
  assert.equal(script.status,200);
  const state=await (await fetch(service.url+'/api/state')).json();
  const post=async(path,body,token=state.csrfToken)=>
   fetch(service.url+path,{method:'POST',headers:{'content-type':'application/json',
    'x-jarvis-csrf':token},body:JSON.stringify(body)});
  const params={question:example,mode:'surprise',variant:0};
  const noToken=await post('/api/cabaret/ask',params,'INVALID');
  assert.equal(noToken.status,403);
  const ask=await post('/api/cabaret/ask',params);
  assert.equal(ask.status,200);
  const result=await ask.json();
  assert.match(result.creative.answer.text,/deterministic|fictional|Garden|source/i);
  assert.equal(result.passport.publishableHumanSuccess,false);
  assert.equal(result.creative.sourceExecution.cannonNativeRan,false);
  const bad=await post('/api/cabaret/ask',{...params,authorize:'PUBLISH'});
  assert.equal(bad.status,400);
  const witness=await post('/api/cabaret/passport',{...params,ledger:{}});
  assert.equal(witness.status,409);
  assert.match((await witness.json()).error,/SOURCE_LOCKED/);
  const xss=await post('/api/cabaret/ask',{...params,question:'What about <img src=x onerror=alert(1)>?'});
  assert.equal(xss.status,200);
  const reply=await xss.json();
  assert.equal(reply.passport.publishableHumanSuccess,false);
  assert.doesNotMatch(JSON.stringify(reply.passport),/onerror/);
 }finally{await service.close();rmSync(dir,{recursive:true,force:true})}
});
const source=process.env.SEASON_CANNON;
test('native CANNON source-chain checks a genuine fictional ledger, rejects tampering without elevating outcomes',
 {skip:!source?'SEASON_CANNON exact pinned checkout required':false},async()=>{
  const dir=mkdtempSync(join(tmpdir(),'jarvis-cabaret-native-'));
  const {execFileSync}=await import('node:child_process');
  const fixture=join(dir,'fixture');
  execFileSync(process.execPath,[join(source,'scripts/season-witness.mjs'),'demo',fixture]);
  const {readFileSync}=await import('node:fs');
  const ledger=JSON.parse(readFileSync(join(fixture,'fictional-garden.json'),'utf8'));
  const service=await startWorkbenchServer({journalPath:join(dir,'journal.jsonl'),port:0,cannonPath:source});
  try{
   const state=await (await fetch(service.url+'/api/state')).json();
   const post=body=>fetch(service.url+'/api/cabaret/passport',{method:'POST',
    headers:{'content-type':'application/json','x-jarvis-csrf':state.csrfToken},
    body:JSON.stringify({question:example,mode:'manga',variant:0,ledger:body})});
   const okay=await post(ledger);
   assert.equal(okay.status,200);
   const result=await okay.json();
   assert.equal(result.verification.stage,'HUMAN_OUTCOME_REPORTED');
   assert.equal(result.passport.sourceVerification.sourceCommit,'63925118a42ef307fa274443fa9f81957c5a6682');
   assert.equal(result.passport.publishableHumanSuccess,false);
   ledger.events[0].resultDigest='sha256:'+'f'.repeat(64);
   const bad=await post(ledger);
   assert.equal(bad.status,422);
   assert.match((await bad.json()).error,/HOLD_WITNESS/);
  }finally{await service.close();rmSync(dir,{recursive:true,force:true})}
});
