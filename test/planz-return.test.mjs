import test from "node:test";import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";import {tmpdir} from "node:os";import {join} from "node:path";
import {Workbench} from "../src/workbench.mjs";
import {InheritanceBoard} from "../src/inheritance.mjs";
import {startWorkbenchServer} from "../src/server.mjs";
import {makePlanReturn} from "../src/planz-return.mjs";
import {PLANZ_URL} from "../src/planz-attention.mjs";
const now=()=>"2026-10-28T20:00:00.000Z";
const plan={id:"GLOBAL-CROSSING-001",title:"Porchlight Commons food distribution",source:"https://github.com/the-static-collective/BananaSpork/issues/29",
 region:"Ghana (proposed)",nextGate:"Ask the local steward to review one bounded food distribution question.",
 blockedBy:["LOCAL_OPERATOR_PERMISSION"],tags:["ghana","food","porchlight"],related:[],disposition:"AWAITING_LOCAL_STEWARD",fieldOutcome:"NOT_VERIFIED",executionAllowed:false,thirdPartyApproval:"NOT_ESTABLISHED"};
const obs={schema:"jarvis.planz-attention-observation/v0",source:PLANZ_URL,authority:"INDEX_ONLY",
 edition:"ATTENTION-2026-10-28-001",reviewedOn:"2026-10-28",contentSha256:"a".repeat(64),observedAt:now(),records:[plan],
 access:"public-read-only",admission:"none",runtimeConnected:false};
const summary="Ask the local steward to test one shelf-stable route with approved existing distribution staff.";
async function sandbox(fn){const dir=await mkdtemp(join(tmpdir(),"jar-return-"));try{return await fn(join(dir,"events.jsonl"))}finally{await rm(dir,{recursive:true,force:true})}}
test("planZ plan remains a proposal and duplicate source import is reused",()=>sandbox(async file=>{
 const board=await InheritanceBoard.open({journalPath:file,clock:now});
 const a=await board.proposeFromPlan({plan,observation:obs,steward:"Volunteer A"});
 const b=await board.proposeFromPlan({plan,observation:obs,steward:"Volunteer B"});
 assert.equal(b.reused,true);assert.equal(a.weave.id,b.weave.id);
 assert.equal(board.state().records[0].commitment,null);assert.equal(board.state().records[0].verified,false);
 await assert.rejects(board.proposeFromPlan({plan:{...plan,source:"https://evil.example"},observation:obs,steward:"Volunteer B"}),/HOLD/);
}));
test("return candidate requires gates; no private notes or aliases leave the journal",()=>sandbox(async file=>{
 const board=await InheritanceBoard.open({journalPath:file,clock:now});
 const {weave}=await board.proposeFromPlan({plan,observation:obs,steward:"Volunteer A"});const weaveId=weave.id;
 await assert.rejects(board.preparePlanReturn({weaveId,publicSummary:summary,operatorRedacted:true}),/HOLD/);
 await board.commit({weaveId,actor:"Volunteer A",voluntary:true});
 await board.report({weaveId,outcome:"completed",note:"SECRET REPORT NOTES",evidenceRef:"SECRET REF"});
 await board.review({weaveId,reviewer:"Reviewer B",decision:"accept-report",note:"SECRET REVIEW NOTES"});
 await board.returnCapability({weaveId,method:"SECRET LOCAL METHOD",nextInvitation:"SECRET INVITATION"});
 await assert.rejects(board.preparePlanReturn({weaveId,publicSummary:summary,operatorRedacted:false}),/redaction/);
 await assert.rejects(board.preparePlanReturn({weaveId,publicSummary:"Email support@example.org and ask for private details.",operatorRedacted:true}),/private/);
 const {packet}=await board.preparePlanReturn({weaveId,publicSummary:summary,operatorRedacted:true});
 assert.equal(packet.fieldVerified,false);assert.equal(packet.disposition,"HOLD_FOR_OWNER_REVIEW");
 assert.equal(packet.sourceOwnerApproved,false);assert.equal(packet.sentExternally,false);
 for(const forbidden of ["SECRET","Volunteer A","Reviewer B"])assert.ok(!JSON.stringify(packet).includes(forbidden));
 assert.equal((await board.preparePlanReturn({weaveId,publicSummary:summary,operatorRedacted:true})).reused,true);
 await assert.rejects(board.preparePlanReturn({weaveId,publicSummary:"Different redacted summary with a new suggestion",operatorRedacted:true}),/Immutable/);
 assert.deepEqual((await InheritanceBoard.open({journalPath:file,clock:now})).state().records[0].planReturn,packet);
}));
test("failed local review and missing origin refuse return",()=>sandbox(async file=>{
 const board=await InheritanceBoard.open({journalPath:file,clock:now});
 const {weave}=await board.proposeFromPlan({plan,observation:obs,steward:"Volunteer A"});
 const weaveId=weave.id;await board.commit({weaveId,actor:"Volunteer A",voluntary:true});
 await board.report({weaveId,outcome:"partial",note:"Not complete"});
 await board.review({weaveId,reviewer:"Reviewer B",decision:"needs-more",note:"No evidence"});
 await assert.rejects(board.preparePlanReturn({weaveId,publicSummary:summary,operatorRedacted:true}),/HOLD/);
 assert.throws(()=>makePlanReturn({},summary,{redacted:true,at:now()}),/HOLD/);
}));
test("HTTP from-plan requires inspected plan and CSRF; no arbitrary URL fetch",()=>sandbox(async file=>{
 const app=await Workbench.open({journalPath:file,clock:now,planReader:async()=>obs});
 const server=await startWorkbenchServer({workbench:app,journalPath:file,port:0});
 try{
  const url=server.url;const csrf=(await(await fetch(url+"/api/state")).json()).csrfToken;
  const h={"content-type":"application/json","x-jarvis-csrf":csrf};
  let r=await fetch(url+"/api/inheritance/from-plan",{method:"POST",headers:h,body:JSON.stringify({planId:plan.id,steward:"Volunteer A"})});
  assert.equal(r.status,409);
  r=await fetch(url+"/api/inspect-planz",{method:"POST",headers:h,body:"{}"});assert.equal(r.status,200,await r.text());
  r=await fetch(url+"/api/inheritance/from-plan",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});assert.equal(r.status,403);
  r=await fetch(url+"/api/inheritance/from-plan",{method:"POST",headers:h,body:JSON.stringify({planId:plan.id,steward:"Volunteer A",url:"http://localhost/private"})});
  assert.equal(r.status,200);
  const result=await r.json();assert.equal(result.weave.planOrigin.sourceSha256,obs.contentSha256);
  assert.equal((await(await fetch(url+"/api/inheritance")).json()).counters.weaves,1);
  assert.equal(app.state().outbox.length,0);
 }finally{await server.close()}
}));
