import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyOriginalOrgans} from '../src/investigation-desk.mjs';
import {growSourceGarden,runPublicLivePilot,publicPilotDescription}
 from '../src/investigation-gardener-027.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const question='Which live weather forecast API provides hourly weather data?';
const repository='public-lab/test-forecast';
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const spec=Buffer.from(JSON.stringify({openapi:'3.0.0',
 info:{title:'Weather API',version:'1'},
 servers:[{url:'https://unreviewed.example.org'}],
 paths:{'/forecast':{get:{summary:'Forecast'}}}}));
const sh=blob(spec);
function github({privateRepo=false,wrongBytes=false}={}){
 const calls=[],success=x=>({ok:true,status:200,redirected:false,json:async()=>x});
 const transport=async(url,opts)=>{
  const u=new URL(url);calls.push(u.href);
  assert.equal(opts.method,'GET');
  assert.equal(u.hostname,'api.github.com');
  if(u.pathname==='/search/repositories')return success({items:[
   {full_name:repository,private:false,visibility:'public',default_branch:'main'}]});
  if(u.pathname==='/repos/'+repository)
   return success({full_name:repository,private:privateRepo,
    visibility:privateRepo?'private':'public',default_branch:'main'});
  if(u.pathname==='/repos/'+repository+'/branches/main')
   return success({commit:{sha:'a'.repeat(40)}});
  if(u.pathname==='/repos/'+repository+'/git/commits/'+'a'.repeat(40))
   return success({tree:{sha:'b'.repeat(40)}});
  if(u.pathname==='/repos/'+repository+'/git/trees/'+'b'.repeat(40))
   return success({truncated:false,tree:[
    {path:'openapi.json',type:'blob',size:spec.length,sha:sh}]});
  if(u.pathname==='/repos/'+repository+'/git/blobs/'+sh)
   return success({encoding:'base64',size:spec.length,
    content:(wrongBytes?Buffer.from('tampered'):spec).toString('base64')});
  throw Error('Unexpected mocked GitHub request');
 };
 return {calls,transport};
}
const fixedWeather=()=>new Response(JSON.stringify({
 latitude:52.52,longitude:13.41,current:{temperature_2m:18,time:'2026-11-05T12:00'},
 current_units:{temperature_2m:'°C'}
}),{status:200,headers:{'content-type':'application/json'}});
test('fourteen exact source-owner modules including GRAFT-027 are byte verified',()=>{
 const p=verifyOriginalOrgans();
 assert.equal(p.source_count,14);
 assert.equal(p.source_organs_exact_pinned,true);
});
test('new weather domain produces a compared executable field variant and classical plan, without connecting proposed host',async()=>{
 const f=github();
 const p=await growSourceGarden({question,approvedPublicGithubSearch:true},
  {transport:f.transport});
 assert.equal(p.status,'HELD_SOURCE_SPECIFIC_GARDENER_RESULT');
 assert.ok(p.comparison.variants_tested>=2);
 assert.deepEqual(p.comparison.winner.selector,['current','temperature_2m']);
 assert.ok(p.comparison.leaderboard.some(x=>x.failures.length>0));
 assert.ok(p.plan.steps.includes('REQUEST_INDEPENDENT_LIVE_VALIDATION'));
 assert.equal(p.live_public_service_contacted,false);
 assert.equal(p.production_install,false);
 assert.ok(f.calls.every(x=>x.startsWith('https://api.github.com/')));
});
test('no consent, incomplete source and non-weather domains all HOLD',async()=>{
 const f=github();
 await assert.rejects(growSourceGarden({question},{transport:f.transport}),
  /EXPLICIT_GARDEN_SEARCH_CONSENT/);
 assert.equal(f.calls.length,0);
 const broken=await growSourceGarden({question,approvedPublicGithubSearch:true},
  {transport:github({wrongBytes:true}).transport});
 assert.equal(broken.status,'HOLD_NO_REVIEWABLE_SOURCE_SPEC');
 assert.equal(broken.comparison,null);
 const other=await growSourceGarden({
  question:'Which public transit bus schedule API could provide real-time arrivals?',
  approvedPublicGithubSearch:true},{transport:github().transport});
 assert.equal(other.status,'HOLD_NEEDS_OPERATOR_LABELED_FIXTURES');
});
test('separately consented real API pilot contacts only the fixed documented endpoint once',async()=>{
 let calls=0;
 const p=await runPublicLivePilot({approvedPublicPilot:true},{
  transport:async(url,options)=>{
   calls++;
   assert.equal(new URL(url).hostname,'api.open-meteo.com');
   assert.equal(options.redirect,'error');
   return fixedWeather();
  }
 });
 assert.equal(calls,1);
 assert.equal(p.status,'READ_ONLY_THIRD_PARTY_RESPONSE_OBSERVED');
 assert.equal(p.observation.temperature_2m,18);
 assert.equal(p.private_identity_used,false);
 assert.equal(p.code_installed,false);
 assert.equal(publicPilotDescription().requests_per_explicit_approval,1);
});
test('live pilot refuses implicit approval and arbitrary source-host override',async()=>{
 let calls=0;
 const transport=async()=>{calls++;return fixedWeather()};
 await assert.rejects(runPublicLivePilot({}, {transport}),
  /EXPLICIT_PUBLIC_LIVE_CONSENT/);
 await assert.rejects(runPublicLivePilot({approvedPublicPilot:true, url:'https://evil.example/'},
  {transport}),/UNSUPPORTED_LIVE_API_ARGUMENTS/);
 assert.equal(calls,0);
});
test('browser and local HTTP routes visibly require separate source search and live read consent',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jarvis-garden-027-'));
 let svc;
 try{
  svc=await startWorkbenchServer({journalPath:join(dir,'events.jsonl'),port:0});
  const html=await(await fetch(svc.url+'/investigate')).text();
  assert.match(html,/Grow \+ challenge candidate/);
  assert.match(html,/Authorize one public example read/);
  const js=await(await fetch(svc.url+'/investigate.js')).text();
  assert.match(js,/garden-results/);
  assert.match(js,/pilot-openmeteo/);
  const csrf=(await(await fetch(svc.url+'/api/state')).json()).csrfToken;
  const post=(path,body,csrfOK=true)=>fetch(svc.url+path,{
   method:'POST',headers:{'content-type':'application/json',
    ...(csrfOK?{'x-jarvis-csrf':csrf}:{})},
   body:JSON.stringify(body)});
  assert.equal((await post('/api/investigate/garden',{question},true)).status,422);
  assert.equal((await post('/api/investigate/pilot',{},true)).status,422);
  assert.equal((await post('/api/investigate/pilot',{approvedPublicPilot:true},false)).status,403);
 }finally{
  if(svc)await svc.close();
  await rm(dir,{recursive:true,force:true});
 }
});
