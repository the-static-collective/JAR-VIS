import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyOriginalOrgans,discoverResearchSource} from '../src/investigation-desk.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const question='Which live weather forecast API provides hourly weather data?';
const repo='weather-team/forecast-openapi',commit='a'.repeat(40),tree='b'.repeat(40);
const spec=Buffer.from(JSON.stringify({
 openapi:'3.0.1',info:{title:'Forecast OpenAPI Example',version:'1.0'},
 servers:[{url:'https://weather.example.org'},{url:'http://localhost:8000'}],
 paths:{'/forecast':{get:{summary:'Get forecast'}}}
}));
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sh=gitBlob(spec);
function fixture({privateRepo=false,corrupted=false}={}){
 const calls=[];
 const json=x=>({ok:true,status:200,redirected:false,json:async()=>x});
 const transport=async(url,opts)=>{
  const u=new URL(url);calls.push(u.href);
  assert.equal(opts.method,'GET');
  assert.equal(u.hostname,'api.github.com');
  if(u.pathname==='/search/repositories')return json({
   items:[{full_name:repo,private:false,visibility:'public',default_branch:'main'}]});
  if(u.pathname==='/repos/'+repo)
   return json({full_name:repo,private:privateRepo,
    visibility:privateRepo?'private':'public',default_branch:'main'});
  if(u.pathname==='/repos/'+repo+'/branches/main')
   return json({commit:{sha:commit}});
  if(u.pathname==='/repos/'+repo+'/git/commits/'+commit)
   return json({tree:{sha:tree}});
  if(u.pathname==='/repos/'+repo+'/git/trees/'+tree)
   return json({truncated:false,tree:[{path:'openapi.json',sha:sh,size:spec.length,type:'blob'}]});
  if(u.pathname==='/repos/'+repo+'/git/blobs/'+sh)
   return json({size:spec.length,encoding:'base64',
    content:(corrupted?Buffer.from(spec.toString()+'forgery'):spec).toString('base64')});
  throw Error('unexpected source search path '+u.pathname);
 };
 return {calls,transport};
}
test('all twelve original research modules preserved with byte-verified ALEX / GRAFT provider machinery',()=>{
 const original=verifyOriginalOrgans();
 assert.equal(original.source_count,12);
 assert.equal(original.source_organs_exact_pinned,true);
 assert.equal(original.source_owner_review_not_automatic,true);
});
test('a separate explicit search action discovers an unknown API spec, executes a new fixture-only adapter, and records next question',async()=>{
 const f=fixture();
 const r=await discoverResearchSource({
  question,approvedPublicGithubSearch:true},{transport:f.transport});
 assert.equal(r.schema,'jarvis.missing-provider-discovery/v0');
 assert.equal(r.status,'REVIEWABLE_API_ADAPTER_PROPOSAL');
 assert.equal(r.discovery.public_provider_proposals.length,1);
 assert.equal(r.discovery.public_provider_proposals[0].git_blob,sh);
 assert.equal(r.review.classical_plan.original_optimizer,'planZ/STRIPS_DIJKSTRA');
 assert.ok(r.review.classical_plan.steps.includes('COMPILE_OFFLINE_FIXTURE'));
 assert.equal(r.review.compiled_fixture.network_authority,'NONE');
 assert.equal(r.review.offline_observation.outbound_requests,0);
 assert.equal(r.review.offline_observation.actual_service_reachable,'NOT_TESTED');
 assert.equal(r.proposed_provider_server_contacted,false);
 assert.equal(r.adapter_installed,false);
 assert.equal(r.external_writes,0);
 assert.ok(f.calls.every(x=>x.startsWith('https://api.github.com/')));
});
test('private or corrupted source specs cannot become reviewable adapters',async()=>{
 for(const options of [{privateRepo:true},{corrupted:true}]){
  const f=fixture(options);
  const r=await discoverResearchSource({
   question,approvedPublicGithubSearch:true},{transport:f.transport});
  assert.equal(r.status,'HOLD_NO_VERIFIED_PUBLIC_SPEC_ADAPTER');
  assert.equal(r.review,null);
  assert.equal(r.discovery.public_provider_proposals.length,0);
  assert.equal(r.adapter_installed,false);
 }
});
test('without explicit new consent no API repository search leaves local process',async()=>{
 const f=fixture();
 await assert.rejects(discoverResearchSource({question},{transport:f.transport}),
  /PUBLIC_SPEC_SEARCH_CONSENT_REQUIRED/);
 await assert.rejects(discoverResearchSource({question,approvedPublicGithubSearch:false},
  {transport:f.transport}),/PUBLIC_SPEC_SEARCH_CONSENT_REQUIRED/);
 assert.equal(f.calls.length,0);
});
test('unknown domain is held rather than fabricating an API provider',async()=>{
 const f=fixture();
 const r=await discoverResearchSource({
  question:'What is the meaning of humble patience in literature?',
  approvedPublicGithubSearch:true},{transport:f.transport});
 assert.equal(r.status,'HOLD_NO_VERIFIED_PUBLIC_SPEC_ADAPTER');
 assert.equal(r.discovery.status,'HOLD_UNRECOGNIZED_DOMAIN');
 assert.equal(f.calls.length,0);
});
test('local route rejects unauthorized POST and displays the separate new human-facing source search consent',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jarvis026-'));
 let server;
 try{
  server=await startWorkbenchServer({journalPath:join(dir,'j.jsonl'),port:0});
  const html=await(await fetch(server.url+'/investigate')).text();
  assert.match(html,/Investigate a missing source/);
  assert.match(html,/GitHub.*public|public GitHub/i);
  const js=await(await fetch(server.url+'/investigate.js')).text();
  assert.match(js,/download-source-discovery/);
  const csrf=(await(await fetch(server.url+'/api/state')).json()).csrfToken;
  const route=server.url+'/api/investigate/discover';
  const fail=await fetch(route,{method:'POST',headers:{
   'content-type':'application/json',
   'x-jarvis-csrf':csrf},
   body:JSON.stringify({question,approvedPublicGithubSearch:false})});
  assert.equal(fail.status,422);
  const absent=await fetch(route,{method:'POST',headers:{
   'content-type':'application/json'},
   body:JSON.stringify({question,approvedPublicGithubSearch:true})});
  assert.equal(absent.status,403);
 }finally{
  if(server)await server.close();
  await rm(dir,{recursive:true,force:true});
 }
});
