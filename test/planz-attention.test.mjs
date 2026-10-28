import test from "node:test";import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";import { tmpdir } from "node:os";import { join } from "node:path";
import { PLANZ_URL,validatePlanZFeed,readPlanZAttention,findPlanAttention } from "../src/planz-attention.mjs";
import { Workbench } from "../src/workbench.mjs";import { startWorkbenchServer } from "../src/server.mjs";
const entry=(id,source,tags,related=[])=>({id,title:id.replaceAll("-"," ")+" project",source,region:"Minnesota ↔ Ghana",
  disposition:"AWAITING_LOCAL_STEWARD",tags,nextGate:"Ask one independent local operator to review one bounded food delivery.",
  blockedBy:["LOCAL_OPERATOR_PERMISSION"],related,fieldOutcome:"NOT_VERIFIED",executionAllowed:false,
  thirdPartyApproval:"NOT_ESTABLISHED"});
const fixture={schema:"planz/public-attention-v1",edition:"ATTENTION-2026-10-28-001",
 reviewedOn:"2026-10-28",authority:"INDEX_ONLY",disclosure:"Source-owned organizational index only.",
 entries:[
   entry("GHANA-FOOD-001","https://github.com/the-static-collective/BananaSpork/issues/29",["ghana","food","shelf","porchlight"],["WASECA-FOOD-001"]),
   entry("WASECA-FOOD-001","https://github.com/the-static-collective/planZ/issues/21",["waseca","garden","food","volunteer"],["GHANA-FOOD-001"])
 ]};
const now=()=> "2026-10-28T19:00:00.000Z";
let calls=0;
function fetcher(data=fixture,{status=200,type="application/json",redirected=false,url=PLANZ_URL}={}){
 return async(req,opts)=>{calls++;assert.equal(req,PLANZ_URL);assert.equal(opts.method,"GET");assert.equal(opts.redirect,"error");
 return {ok:status===200,redirected,url,headers:new Headers({"content-type":type}),body:new Response(JSON.stringify(data)).body};
 };
}
async function sandbox(fn){
 const dir=await mkdtemp(join(tmpdir(),"jarvis-planz-"));
 try{return await fn(join(dir,"events.jsonl"))}finally{await rm(dir,{recursive:true,force:true})}
}
test("fixed owner-public source, source SHA, no runtime authority and deterministic topical matching",async()=>{
 calls=0;const observed=await readPlanZAttention({fetchImpl:fetcher(),now});
 assert.equal(calls,1);assert.equal(observed.records.length,2);assert.match(observed.contentSha256,/^[a-f0-9]{64}$/);
 assert.equal(observed.admission,"none");assert.equal(observed.runtimeConnected,false);
 assert.equal(findPlanAttention(observed,"Ghana food shelf")[0].id,"GHANA-FOOD-001");
 assert.equal(findPlanAttention(observed,"Waseca volunteers")[0].id,"WASECA-FOOD-001");
 assert.deepEqual(findPlanAttention(observed,"quantum toaster"),[]);
});
test("unauthorized status promotion, private contacts, unowned origins and bogus relations refused",()=>{
 const promoted=structuredClone(fixture);promoted.entries[0].fieldOutcome="COMPLETE";
 assert.throws(()=>validatePlanZFeed(promoted),/untrusted/);
 const contact=structuredClone(fixture);contact.entries[0].nextGate="Email client@example.org before attempting the local trial for this task.";
 assert.throws(()=>validatePlanZFeed(contact),/private contact/);
 const source=structuredClone(fixture);source.entries[0].source="https://evil.example/collect";
 assert.throws(()=>validatePlanZFeed(source),/untrusted/);
 const broken=structuredClone(fixture);broken.entries[0].related=["NONEXISTENT-ID"];
 assert.throws(()=>validatePlanZFeed(broken),/relation/);
});
test("redirect, content-type and invalid JSON fail without journal effects",async()=>{
 await assert.rejects(readPlanZAttention({fetchImpl:fetcher(fixture,{url:"https://evil.example"})}),/exact/);
 await assert.rejects(readPlanZAttention({fetchImpl:fetcher(fixture,{type:"text/html"})}),/content type/);
 await assert.rejects(readPlanZAttention({fetchImpl:async()=>new Response("{broken",{headers:{"content-type":"application/json"}})}),/JSON/);
});
test("operator inspection is explicit, append-only, restart-preserved, and topical attendance is local",()=>sandbox(async journalPath=>{
 const reader=opts=>readPlanZAttention({...opts,fetchImpl:fetcher(),now});
 const app=await Workbench.open({journalPath,clock:now,planReader:reader});
 assert.equal(app.state().planIndex,null);
 assert.match(app.attend("What about planZ?").answer,/unconnected/);
 const result=await app.inspectPlanIndex();assert.equal(result.admittedAction,false);
 assert.equal(app.state().planIndex.records.length,2);
 assert.match(app.attend("What planZ tasks in Ghana?").answer,/GLOBAL|GHANA|local operator/i);
 assert.equal(app.state().outbox.length,0);
 const newApp=await Workbench.open({journalPath,clock:now});
 assert.equal(newApp.state().planIndex.contentSha256,result.observation.contentSha256);
 assert.equal(newApp.state().events[0].kind,"PLANZ_INDEX_INSPECTED");
}));
test("failed reinspection retains older observation, no fake authorization",()=>sandbox(async journalPath=>{
 let broken=false;
 const app=await Workbench.open({journalPath,clock:now,planReader:opts=>broken?Promise.reject(Error("offline")):readPlanZAttention({...opts,fetchImpl:fetcher(),now})});
 const first=await app.inspectPlanIndex();broken=true;
 await assert.rejects(app.inspectPlanIndex(),/unavailable/);
 assert.equal(app.state().events.length,1);
 assert.equal(app.state().planIndex.contentSha256,first.observation.contentSha256);
}));
test("local HTTP inspection requires CSRF and has no arbitrary source URL",()=>sandbox(async journalPath=>{
 const app=await Workbench.open({journalPath,clock:now,planReader:opts=>readPlanZAttention({...opts,fetchImpl:fetcher(),now})});
 const server=await startWorkbenchServer({workbench:app,port:0});
 try{
  const url=server.url;const csrf=(await (await fetch(url+"/api/state")).json()).csrfToken;
  const blocked=await fetch(url+"/api/inspect-planz",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
  assert.equal(blocked.status,403);
  const ok=await fetch(url+"/api/inspect-planz",{method:"POST",headers:{"content-type":"application/json","x-jarvis-csrf":csrf},body:JSON.stringify({url:"http://localhost/secret"})});
  assert.equal(ok.status,200);
  assert.equal((await ok.json()).observation.records.length,2);
  assert.equal(app.state().outbox.length,0);
 }finally{await server.close()}
}));

test('a forged source-reader cannot smuggle plan authority or unreviewed source addresses',()=>sandbox(async journalPath=>{
 const good=await readPlanZAttention({fetchImpl:fetcher(),now});
 const forged=structuredClone(good);forged.source='https://example.com/new-index';
 const app=await Workbench.open({journalPath,clock:now,planReader:async()=>forged});
 await assert.rejects(app.inspectPlanIndex(),/HOLD boundary/);
 assert.equal(app.state().events.length,0);
 forged.source=PLANZ_URL;forged.records[0].source='https://example.com/evil';
 await assert.rejects(app.inspectPlanIndex(),/independent source-shape/);
 assert.equal(app.state().planIndex,null);
}));
