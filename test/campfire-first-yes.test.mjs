import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {
 FIRST_YES_SCHEMA,composeFirstYes,renderFirstYes,makeCampfireFirstYesBridge
} from '../src/campfire-first-yes.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const adminKey='J'.repeat(48);
const circleId='11111111-1111-4111-8111-111111111111';
function sample(overrides={}){
 return {
  ok:true,schema:'campfire.operator-attention/v0',mode:'READ_ONLY_OPERATOR_BRIEF',
  basis:'SOURCE_DATABASE_COUNTS_NOT_MESSAGES',auditState:'LOCAL_HASH_CHAIN_INTACT',
  next24Hours:{
   code:'TEST_ONE_NEED',level:'next',scope:circleId,
   headline:'not trusted as output',observation:'private raw record should NOT be propagated',
   prepare:'irrelevant backend details should NOT be copied',
   permission:'choose voluntarily',proof:'a valid independent proof',
   standing:'PROPOSAL_NOT_ACTION',canExecute:false,hasConsent:false
  },
  otherOptions:[],countContext:{circles:1,messages:2,needs:0,reports:0,ownerAcceptances:0},
  authority:{
   execute:false,inviteSent:false,personAssigned:false,humanVerified:false,
   provisionVerified:false,knowledgePublished:false,backendChanged:false
  },
  ...overrides
 };
}
async function fixtureServer(payload=sample(),key=adminKey){
 const requests=[];
 const server=createServer((req,res)=>{
  requests.push({path:req.url,method:req.method,auth:req.headers.authorization});
  const authorized=req.headers.authorization==='Bearer '+key;
  const status=authorized?200:403;
  res.writeHead(status,{'Content-Type':'application/json'});
  res.end(JSON.stringify(authorized?payload:{ok:false,error:'ADMIN_DENIED'}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 return {url:'http://127.0.0.1:'+port,requests,close:()=>new Promise(resolve=>server.close(resolve))};
}
async function withSandbox(run){
 const dir=await mkdtemp(join(tmpdir(),'jarvis-campfire-'));
 try{return await run(dir);}
 finally{await rm(dir,{recursive:true,force:true});}
}
test('reviewed Firebox counts become printable human card, not personal data or adopted authority',()=>{
 const source=sample();
 const kit=composeFirstYes(source);
 assert.equal(kit.schema,FIRST_YES_SCHEMA);
 assert.equal(kit.firstYes.code,'TEST_ONE_NEED');
 assert.equal(kit.boundaries.workPerformed,false);
 assert.equal(kit.boundaries.authorization,'NONE_IMPORTED');
 assert.equal(kit.boundaries.backendMutation,false);
 assert.equal(kit.provenance.visibility,'PRIVATE_OPERATOR_ONLY');
 assert.ok(kit.provenance.sourceDigest.startsWith('sha256:'));
 assert.ok(kit.firstYes.prepare.includes('fictional'));
 const paper=renderFirstYes(kit);
 assert.match(paper,/Whose permission is required/);
 assert.match(paper,/What would count as evidence/);
 assert.match(paper,/No contact was made/);
 assert.equal(paper.includes(circleId),false);
 assert.equal(JSON.stringify(kit).includes(circleId),false);
 assert.equal(JSON.stringify(kit).includes('private raw record'),false);
});
test('HOLD source integrity cannot become an invitation',()=>{
 const s=sample({
  auditState:'LOCAL_AUDIT_FAILED',
  next24Hours:{...sample().next24Hours,code:'HALT_INTEGRITY',level:'stop'}
 });
 const kit=composeFirstYes(s);
 assert.equal(kit.standing,'HOLD_SOURCE_INTEGRITY');
 assert.equal(kit.firstYes.voluntaryInvitationDraft,null);
 assert.match(kit.firstYes.prepare,/Stop recruiting/);
 assert.throws(()=>composeFirstYes(sample({auditState:'LOCAL_AUDIT_FAILED'})),/FAILED_INTEGRITY_MUST_HALT/);
});
test('fake source authority, contact-bearing question, or invalid source fails closed',()=>{
 const source=sample();
 assert.throws(()=>composeFirstYes(sample({authority:{...source.authority,execute:true}})),/AUTHORITY_IMPORT_REFUSED/);
 assert.throws(()=>composeFirstYes(sample({next24Hours:{...source.next24Hours,standing:'ADMITTED'}})),/SOURCE_NOT_PROPOSAL/);
 assert.throws(()=>composeFirstYes(sample({next24Hours:{...source.next24Hours,code:'DID_REAL_HELP'}})),/SOURCE_NOT_PROPOSAL/);
 assert.throws(()=>composeFirstYes(sample({mode:'AUTOMATIC_ACT'})),/UNTRUSTED_CAMPFIRE_ATTENTION/);
 assert.throws(()=>composeFirstYes(source,{question:'Please email someone at buyer@example.org about their records'}),/PRIVATE_CONTACT_OR_LINK_REFUSED/);
 assert.throws(()=>composeFirstYes(source,{question:'Check https://a.example for private records'}),/PRIVATE_CONTACT_OR_LINK_REFUSED/);
 assert.throws(()=>renderFirstYes({standing:'LIVE_SUCCESS'}),/INVALID_FIRST_YES_KIT/);
});
test('local-only transport refuses unapproved remote endpoints, even with TLS or URL credentials',()=>{
 for(const url of [
  'http://example.com','https://example.com',
  'http://127.0.0.1:3417@evil.example',
  'http://127.0.0.1:3417/invite',
  'http://127.0.0.1:3417/#secret',
  'http://localhost:3417/?token=never'
 ]){
  assert.throws(()=>makeCampfireFirstYesBridge({baseUrl:url}),/LOCAL_OWNER_FIREBOX_ONLY/);
 }
});
test('JAR;VIS CSRF-gated click reads only one private Firebox GET, then returns unsent markdown',()=>withSandbox(async dir=>{
 const keyPath=join(dir,'operator.key');
 await writeFile(keyPath,adminKey,{mode:0o600});
 const fire=await fixtureServer(sample());
 try{
  const bridge=makeCampfireFirstYesBridge({baseUrl:fire.url,keyFile:keyPath});
  const jar=await startWorkbenchServer({journalPath:join(dir,'jarvis.jsonl'),port:0,campfireBridge:bridge});
  try{
   const state=await (await fetch(jar.url+'/api/state')).json();
   const address=jar.url+'/api/campfire/first-yes';
   const missing=await fetch(address,{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question:'What useful thing could we prepare in the next 24 hours?'})});
   assert.equal(missing.status,403,'anti-CSRF gate is mandatory');
   const response=await fetch(address,{
    method:'POST',
    headers:{'Content-Type':'application/json','x-jarvis-csrf':state.csrfToken},
    body:JSON.stringify({question:'What useful thing could we prepare in the next 24 hours?'})
   });
   assert.equal(response.status,200);
   const kit=await response.json();
   assert.equal(kit.standing,'LOCAL_DRAFT_NOT_SENT');
   assert.equal(kit.firstYes.code,'TEST_ONE_NEED');
   assert.match(kit.markdown,/What can be prepared now/);
   assert.equal(kit.boundaries.invitationSent,false);
   assert.equal(kit.boundaries.backendMutation,false);
   assert.equal(JSON.stringify(kit).includes(adminKey),false);
   assert.equal(JSON.stringify(kit).includes(circleId),false);
   assert.deepEqual(fire.requests.map(x=>x.path),['/v1/admin/attention']);
   assert.deepEqual(fire.requests.map(x=>x.method),['GET']);
   assert.equal(fire.requests[0].auth,'Bearer '+adminKey);
   const after=await (await fetch(jar.url+'/api/state')).json();
   assert.equal(after.journal?.length||0,0);
  }finally{await jar.close();}
 }finally{await fire.close();}
}));
test('no operator key or Firebox refusal yields no draft, no fallback to public data',()=>withSandbox(async dir=>{
 const keyPath=join(dir,'operator.key');
 const fire=await fixtureServer(sample());
 try{
  const bridge=makeCampfireFirstYesBridge({baseUrl:fire.url,keyFile:keyPath});
  await assert.rejects(()=>bridge.prepare('What useful thing could we prepare today?'),/FIREBOX_OPERATOR_KEY_UNAVAILABLE/);
  await writeFile(keyPath,'WRONG'.repeat(10));
  await assert.rejects(()=>bridge.prepare('What useful thing could we prepare today?'),/FIREBOX_PRIVATE_READ_DENIED/);
 }finally{await fire.close();}
}));
test('optional native source: real SQLite Firebox → JAR;VIS First Yes; read does not mutate logbook',async t=>{
 const sourcePath=process.env.CAMPFIRE_NATIVE_BACKEND_PATH;
 if(!sourcePath){t.skip('Set CAMPFIRE_NATIVE_BACKEND_PATH in CI to pin the actual NanaSpork backend');return;}
 const {createCampfireBackend}=await import(pathToFileURL(sourcePath).href);
 await withSandbox(async dir=>{
  const dbPath=join(dir,'real.sqlite'),keyPath=join(dir,'operator.key');
  await writeFile(keyPath,adminKey);
  const native=createCampfireBackend({dbPath,bootstrapKey:adminKey});
  await new Promise(resolve=>native.server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+native.server.address().port;
  const headers={Authorization:'Bearer '+adminKey,'Content-Type':'application/json'};
  const send=async(path,data,memberKey=adminKey)=>{
   const r=await fetch(url+path,{method:'POST',headers:{...headers,Authorization:'Bearer '+memberKey},body:JSON.stringify(data)});
   const value=await r.json();assert.equal(r.ok,true,JSON.stringify(value));return value;
  };
  const bridge=makeCampfireFirstYesBridge({baseUrl:url,keyFile:keyPath});
  try{
   assert.equal((await bridge.prepare('What useful thing could we prepare in the next 24 hours?')).firstYes.code,'FIRST_CIRCLE');
   const {circle}=await send('/v1/admin/circles',{label:'Harmless Test Room'});
   const inviteOwner=await send('/v1/admin/circles/'+circle.id+'/invites',{role:'owner'});
   const inviteMember=await send('/v1/admin/circles/'+circle.id+'/invites',{role:'member'});
   const owner=await send('/v1/join',{inviteCode:inviteOwner.inviteCode},'');
   const member=await send('/v1/join',{inviteCode:inviteMember.inviteCode},'');
   assert.equal((await bridge.prepare('What can we prepare within the next day?')).firstYes.code,'FIRST_CONVERSATION');
   const before=await (await fetch(url+'/v1/admin/audit',{headers})).json();
   await bridge.prepare('What can we prepare within the next day?');
   const after=await (await fetch(url+'/v1/admin/audit',{headers})).json();
   assert.equal(before.audit.head,after.audit.head);
   assert.equal(before.audit.checked,after.audit.checked);
   await send('/v1/circles/'+circle.id+'/messages',{body:'Fictional test message'},member.accessToken);
   assert.equal((await bridge.prepare('What can we prepare within the next day?')).firstYes.code,'TEST_ONE_NEED');
   const opened=await send('/v1/circles/'+circle.id+'/needs',
    {description:'12 fictional cartons',unit:'cartons',units:12},owner.accessToken);
   const reported=await send('/v1/needs/'+opened.need.id+'/reports',
    {units:9,requestId:randomUUID()},member.accessToken);
   assert.equal((await bridge.prepare('What can we prepare within the next day?')).firstYes.code,'REVIEW_REPORTED_HELP');
   const accept=await send('/v1/reports/'+reported.report.id+'/confirm',
    {units:6,requestId:randomUUID()},owner.accessToken);
   assert.equal(accept.need.residual,6);
   const kit=await bridge.prepare('What can we prepare within the next day?');
   assert.equal(kit.standing,'LOCAL_DRAFT_NOT_SENT');
   assert.equal(kit.boundaries.verifiedPhysicalFulfillment,false);
   assert.equal(JSON.stringify(kit).includes('Fictional test message'),false);
   assert.equal(JSON.stringify(kit).includes('12 fictional cartons'),false);
  }finally{
   await new Promise(resolve=>native.server.close(resolve));
   native.db.close();
  }
 });
});
