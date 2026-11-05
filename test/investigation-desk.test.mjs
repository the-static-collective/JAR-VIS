import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {investigateDesk,verifyOriginalOrgans} from '../src/investigation-desk.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const SHA='a'.repeat(40),TREE='b'.repeat(40);
const GH=['MOTIF','ALEX.2','planZ','GRAFT','the-daily-slice','JAR-VIS'];
const gitBlob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const baseQuestion='Which original Maxhinal Fiber and Pressure chambers preserve source custody?';
function transportFixture({privateRepo=null,brokenBlob=false}={}){
 const calls=[];
 const source=(name)=>Buffer.from(
  name+' original source custody Maxhinal Fiber Pressure witness independent '+ 
  'ALEX planZ GRAFT evidence capability classical plan source review and method questions.');
 const send=(payload,status=200)=>({ok:status===200,status,redirected:false,
  json:async()=>payload});
 const transport=async(url,opts)=>{
  calls.push({url,method:opts.method,headers:opts.headers});
  assert.equal(opts.method,'GET');
  const u=new URL(url);
  if(u.hostname==='en.wikipedia.org')return send({query:{search:[
   {pageid:144,title:'Original source evidence',snippet:'Research sources and independent testimony'}]}});
  if(u.hostname==='api.openalex.org')return send({results:[
   {id:'https://openalex.org/W12345',display_name:'The study of source independence',publication_year:2024} ]});
  assert.equal(u.hostname,'api.github.com');
  if(u.pathname==='/orgs/the-static-collective/repos')return send({},404);
  if(u.pathname==='/users/the-static-collective/repos')
   return send(GH.map((name,i)=>({
     full_name:'the-static-collective/'+name,owner:{login:'the-static-collective'},
     private:name===privateRepo,visibility:name===privateRepo?'private':'public',
     description:name+' source evidence plan GRAFT Maxhinal research',
     default_branch:'main',topics:['research','source','custody'],
     archived:false
   })));
  const m=u.pathname.match(/^\/repos\/the-static-collective\/([^/]+)(?:\/(.*))?$/);
  if(!m)return send({},404);
  const name=m[1],route=m[2]||'';
  if(!GH.includes(name))return send({},404);
  if(!route)return send({full_name:'the-static-collective/'+name,default_branch:'main',
   private:name===privateRepo,visibility:name===privateRepo?'private':'public'});
  if(route==='branches/main')return send({commit:{sha:SHA}});
  if(route==='git/commits/'+SHA)return send({tree:{sha:TREE}});
  const data=source(name),sha=gitBlob(data);
  if(route==='git/trees/'+TREE)return send({truncated:false,tree:[
   {path:'README.md',type:'blob',sha,size:data.length} ]});
  if(route==='git/blobs/'+sha)return send({encoding:'base64',size:data.length,
   content:(brokenBlob?Buffer.from(data.toString()+'forgery'):data).toString('base64')});
  return send({},404);
 };
 return {transport,calls};
}
function form(deep=true,scopes={github:true,wikipedia:false,scholarly:false}){
 return {question:baseQuestion,scopes,depth:3,deep};
}
test('all seven original ALEX planZ GRAFT code blobs are verified before reading outside sources',()=>{
 const pins=verifyOriginalOrgans();
 assert.equal(pins.source_count,8);
 assert.equal(pins.source_organs_exact_pinned,true);
 assert.equal(pins.source_owner_review_not_automatic,true);
});
test('broad Eagle Eye + actual original MOTIF two-round reasoning and generated code run',async()=>{
 const fixture=transportFixture();
 const r=await investigateDesk(form(true),{transport:fixture.transport,
  now:()=> '2026-11-05T12:00:00.000Z'});
 assert.equal(r.schema,'jarvis.investigation-desk/v0');
 assert.equal(r.status,'PUBLIC_EVIDENCE_LEADS_AVAILABLE');
 assert.ok(r.public_research.catalog.enumerated>=6);
 assert.equal(r.public_research.catalog.selected,3);
 assert.ok(r.public_research.hits.some(h=>h.kind==='github_source'&&h.git_blob.length===40));
 assert.equal(r.motif_reasoning.status,'TWO_ROUNDS_EXECUTED');
 assert.equal(r.motif_reasoning.first.status,'EXECUTED_FINITE_MOTIF_CAPABILITY');
 assert.equal(r.motif_reasoning.first.plan.mode,'LINEAGE');
 assert.ok(r.motif_reasoning.first.compiled.source_sha256.length===64);
 assert.equal(r.motif_reasoning.second.status,'EXECUTED_FINITE_MOTIF_CAPABILITY');
 assert.ok(r.motif_reasoning.feedback_plan.next_question);
 assert.equal(r.external_writes,0);
 assert.equal(r.source_custody_verified,false);
 assert.equal(r.output_admission,'NONE');
 assert.ok(fixture.calls.some(c=>c.url.includes('/users/the-static-collective/repos')));
 assert.ok(fixture.calls.every(c=>c.method==='GET'));
});
test('public web indexes are opt-in: no GitHub query when its checkbox is off',async()=>{
 const f=transportFixture();
 const r=await investigateDesk(form(false,{github:false,wikipedia:true,scholarly:true}),
  {transport:f.transport});
 assert.equal(r.motif_reasoning.status,'NOT_REQUESTED');
 assert.ok(r.public_research.hits.some(x=>x.kind==='encyclopedia_index'));
 assert.ok(r.public_research.hits.some(x=>x.kind==='research_index'));
 assert.ok(f.calls.every(c=>!c.url.includes('github.com')));
});
test('privacy and integrity violations hold source candidates but do not imply no evidence exists',async()=>{
 const f=transportFixture({brokenBlob:true});
 const r=await investigateDesk(form(false),{transport:f.transport});
 assert.equal(r.status,'HOLD_NOT_ENOUGH_PUBLIC_SOURCE_EVIDENCE');
 assert.equal(r.public_research.source_documents.length,0);
 assert.ok(r.public_research.failures.some(x=>/INTEGRITY/.test(x.status)));
 assert.equal(r.external_writes,0);
});
test('unknown provider, missing opt-in or requesting MOTIF without GitHub are refused',async()=>{
 const f=transportFixture();
 await assert.rejects(investigateDesk(form(false,{github:false,wikipedia:false,scholarly:false}),
  {transport:f.transport}),/OPT_IN/);
 await assert.rejects(investigateDesk(form(true,{github:false,wikipedia:true,scholarly:false}),
  {transport:f.transport}),/MOTIF_NATIVE_REQUIRES/);
 await assert.rejects(investigateDesk({...form(false),scopes:{github:true,secretDrive:true}},
  {transport:f.transport}),/OPT_IN/);
 assert.equal(f.calls.length,0);
});
test('local form and endpoint require CSRF and never offer a private provider',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jarvis-eagle-desk-'));
 const calls=[];let local;
 try{
  local=await startWorkbenchServer({journalPath:join(dir,'j.jsonl'),port:0,
   investigationFn:async body=>{
    calls.push(body);
    return {schema:'jarvis.investigation-desk/v0',question:body.question,
      status:'RESEARCH_ONLY',external_writes:0};
   }});
  const p=await fetch(local.url+'/investigate');
  assert.equal(p.status,200);
  assert.match(await p.text(),/Investigation Desk|look into/);
  assert.equal((await fetch(local.url+'/investigate.js')).status,200);
  assert.equal((await fetch(local.url+'/investigate.css')).status,200);
  const meta=await (await fetch(local.url+'/api/investigate/meta')).json();
  assert.equal(meta.private_sources_connected,false);
  const denied=await fetch(local.url+'/api/investigate',{method:'POST',
   headers:{'content-type':'application/json'},body:JSON.stringify(form())});
  assert.equal(denied.status,403);
  const state=await(await fetch(local.url+'/api/state')).json();
  const res=await fetch(local.url+'/api/investigate',{method:'POST',headers:{
   'content-type':'application/json','x-jarvis-csrf':state.csrfToken},
   body:JSON.stringify(form(false))});
  assert.equal(res.status,200);
  const json=await res.json();
  assert.equal(json.schema,'jarvis.investigation-desk/v0');
  assert.equal(calls.length,1);
  assert.equal(calls[0].scopes.github,true);
  const bad=await fetch(local.url+'/api/investigate',{method:'POST',headers:{
   'content-type':'application/json','x-jarvis-csrf':state.csrfToken},
   body:JSON.stringify({question:'Which sources matter now?',scopes:{privateGoogleDrive:true}})});
  assert.equal(bad.status,422);
 }finally{if(local)await local.close();await rm(dir,{recursive:true,force:true})}
});
