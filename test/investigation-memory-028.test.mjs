import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {InvestigationMemory} from '../src/investigation-memory-028.mjs';
import {verifyOriginalOrgans} from '../src/investigation-desk.mjs';
import {growSourceGarden} from '../src/investigation-gardener-027.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const question='Which live weather forecast API provides hourly weather data?';
const repo='test-weather/openapi-forecast';
const bytes=Buffer.from(JSON.stringify({
 openapi:'3.0.1',info:{title:'Unverified Weather Test',version:'1'},
 servers:[{url:'https://unconfirmed.example.org'}],
 paths:{'/forecast':{get:{summary:'Read forecast'}}}
}));
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sh=gitBlob(bytes);
function source(){
 const calls=[];
 const ok=x=>({ok:true,status:200,redirected:false,json:async()=>x});
 const transport=async(url,opts)=>{
  const u=new URL(url);calls.push(u.hostname);
  assert.equal(u.hostname,'api.github.com');
  assert.equal(opts.method,'GET');
  if(u.pathname==='/search/repositories')
   return ok({items:[{full_name:repo,private:false,visibility:'public',default_branch:'main'}]});
  if(u.pathname==='/repos/'+repo)
   return ok({full_name:repo,private:false,visibility:'public',default_branch:'main'});
  if(u.pathname==='/repos/'+repo+'/branches/main')
   return ok({commit:{sha:'a'.repeat(40)}});
  if(u.pathname==='/repos/'+repo+'/git/commits/'+'a'.repeat(40))
   return ok({tree:{sha:'b'.repeat(40)}});
  if(u.pathname==='/repos/'+repo+'/git/trees/'+'b'.repeat(40))
   return ok({truncated:false,tree:[{path:'openapi.json',type:'blob',size:bytes.length,sha:sh}]});
  if(u.pathname==='/repos/'+repo+'/git/blobs/'+sh)
   return ok({size:bytes.length,encoding:'base64',content:bytes.toString('base64')});
  throw Error('Unexpected source request');
 };
 return {transport,calls};
}
const temp=()=>mkdtempSync(path.join(tmpdir(),'jarvis-memento-028-'));
async function specimen(){
 const mock=source();
 const garden=await growSourceGarden({
  question,approvedPublicGithubSearch:true},{transport:mock.transport});
 assert.equal(garden.status,'HELD_SOURCE_SPECIFIC_GARDENER_RESULT');
 return {garden,mock};
}
test('fifteen exact GRAFT and ALEX source-owned code blobs remain pinned',()=>{
 const v=verifyOriginalOrgans();
 assert.equal(v.source_count,15);
 assert.equal(v.source_organs_exact_pinned,true);
});
test('no memory is silently stored; it needs two separate explicit approvals',async()=>{
 const root=temp(),journal=path.join(root,'events.jsonl');
 try{
  const store=InvestigationMemory.open({journalPath:journal});
  assert.equal(store.summary().stored_experiments,0);
  const {garden}=await specimen();
  await assert.rejects(store.rememberGarden(garden,
   {approvedSyntheticCapture:true}),/TWO_DISTINCT_CAPTURE_CONSENTS/);
  assert.equal(store.summary().stored_experiments,0);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('real prior garden comparison is captured, saved locally, then replayed after reopening the store',async()=>{
 const root=temp(),journal=path.join(root,'events.jsonl');
 try{
  const store=InvestigationMemory.open({journalPath:journal});
  const {garden,mock}=await specimen();
  assert.ok(mock.calls.length>0);
  const a=await store.rememberGarden(garden,
   {approvedSyntheticCapture:true,approvedPersistentSave:true});
  assert.equal(a.status,'REMEMBERED_AND_FSYNCED');
  assert.equal(a.stored_experiments,1);
  const duplicate=await store.rememberGarden(garden,
   {approvedSyntheticCapture:true,approvedPersistentSave:true});
  assert.equal(duplicate.status,'EXPERIMENT_ALREADY_REMEMBERED');
  const fresh=InvestigationMemory.open({journalPath:journal});
  const result=await fresh.recall(question);
  assert.equal(result.status,'PAST_EXPERIMENTS_REPLAYED');
  assert.equal(result.count,1);
  assert.ok(result.matched.length>0);
  assert.ok(result.replayed.every(x=>x.status==='EXACT_EXECUTABLE_REPLAY_MATCH'));
  assert.ok(result.plan.steps.includes('REVALIDATE_PREVIOUS_SUCCESS_INDEPENDENTLY'));
  assert.equal(result.automatic_install,false);
  assert.equal(result.external_actions,0);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('altered ledger digest and incomplete final line are rejected rather than silently repaired',async()=>{
 const root=temp(),journal=path.join(root,'events.jsonl');
 try{
  const store=InvestigationMemory.open({journalPath:journal});
  const {garden}=await specimen();
  await store.rememberGarden(garden,
   {approvedSyntheticCapture:true,approvedPersistentSave:true});
  const file=path.join(root,'.investigation-memory','synthetic-research-memory.jsonl');
  const original=readFileSync(file,'utf8');
  writeFileSync(file,original.replace('"sequence":1','"sequence":99'));
  assert.throws(()=>store.summary(),/BROKEN_MEMORY_SEQUENCE/);
  writeFileSync(file,original.slice(0,-1));
  assert.throws(()=>store.summary(),/TRUNCATED_MEMORY/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('no replay family for unrelated question; absence is not a fabricated similar precedent',async()=>{
 const root=temp();
 try{
  const store=InvestigationMemory.open({journalPath:path.join(root,'events.jsonl')});
  const r=await store.recall('How can an author read and cite ancient history?');
  assert.equal(r.status,'HOLD_NO_LABELED_RECALL_DOMAIN');
  assert.equal(r.external_actions,0);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('HTTP/local browser workflow: garden → separate remember consent → recall after server restart',async()=>{
 const root=temp(),journal=path.join(root,'events.jsonl');
 let server1,server2;
 try{
  const {garden}=await specimen();
  server1=await startWorkbenchServer({
   journalPath:journal,port:0,gardenFn:async()=>garden});
  const csrf1=(await(await fetch(server1.url+'/api/state')).json()).csrfToken;
  const request=(srv,csrf,route,body)=>fetch(srv.url+route,{method:'POST',
   headers:{'content-type':'application/json','x-jarvis-csrf':csrf},
   body:JSON.stringify(body)});
  const empty=await(await fetch(server1.url+'/api/investigate/memory')).json();
  assert.equal(empty.stored_experiments,0);
  const noGarden=await request(server1,csrf1,'/api/investigate/memory/remember',{
   expectedGardenReceipt:garden.checksum_sha256,
   approvedSyntheticCapture:true,approvedPersistentSave:true});
  assert.equal(noGarden.status,409);
  const event=await request(server1,csrf1,'/api/investigate/garden',{
   question,approvedPublicGithubSearch:true});
  assert.equal(event.status,200);
  const saved=await request(server1,csrf1,'/api/investigate/memory/remember',{
   expectedGardenReceipt:garden.checksum_sha256,
   approvedSyntheticCapture:true,approvedPersistentSave:true});
  assert.equal(saved.status,200);
  const report=await saved.json();
  assert.equal(report.status,'REMEMBERED_AND_FSYNCED');
  const unauthorized=await fetch(server1.url+'/api/investigate/memory/remember',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({approvedSyntheticCapture:true,approvedPersistentSave:true,
    expectedGardenReceipt:garden.checksum_sha256})});
  assert.equal(unauthorized.status,403);
  await server1.close();server1=null;
  server2=await startWorkbenchServer({journalPath:journal,port:0});
  const summary=await(await fetch(server2.url+'/api/investigate/memory')).json();
  assert.equal(summary.stored_experiments,1);
  const csrf2=(await(await fetch(server2.url+'/api/state')).json()).csrfToken;
  const replay=await request(server2,csrf2,'/api/investigate/memory/recall',{question});
  assert.equal(replay.status,200);
  const result=await replay.json();
  assert.equal(result.status,'PAST_EXPERIMENTS_REPLAYED');
  assert.equal(result.replayed[0].status,'EXACT_EXECUTABLE_REPLAY_MATCH');
  const html=await(await fetch(server2.url+'/investigate')).text();
  assert.match(html,/Remember this synthetic experiment/);
  assert.match(html,/Recall and replay related experiments/);
 }finally{
  if(server1)await server1.close();
  if(server2)await server2.close();
  rmSync(root,{recursive:true,force:true});
 }
});
