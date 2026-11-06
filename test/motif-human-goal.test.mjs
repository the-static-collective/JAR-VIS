import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {askHumanGoal,verifyGoalSources,SOURCE_COMMIT} from "../src/motif-human-goal.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

test("source-owned human-goal kernel and physical receipt remain pinned",async()=>{
 assert.equal(await verifyGoalSources(),true);
 assert.match(SOURCE_COMMIT,/^[0-9a-f]{40}$/);
});
test("ambiguous river inquiry asks the one question that changes actual work",async()=>{
 const x=await askHumanGoal({text:"Could you check the rivers?"});
 assert.equal(x.status,"ASK_ONE_DECISIVE_QUESTION");
 assert.equal(x.next_question.id,"evidence_scope");
 assert.equal(x.historical_resource_examples.any_fresh.historical_actual_request_count,1);
 assert.equal(x.historical_resource_examples.two_named_fresh.historical_actual_request_count,2);
 assert.equal(x.source_requests_sent,0);
 assert.equal(x.transmittedToNetwork,false);
});
test("named completion requires two sources, exact human confirmation and still no execution",async()=>{
 const text="Need both Blue Earth and Le Sueur river reports within 12 hours.";
 const draft=await askHumanGoal({text});
 assert.equal(draft.status,"CONFIRM_REQUIRED");
 assert.equal(draft.draft_contract.completion_rule,"BOTH_NAMED_REPORTED_SOURCES");
 assert.equal(draft.draft_contract.read_only_public_gauge_ids.length,2);
 const yes=await askHumanGoal({text,confirmed:true,expected_contract_id:draft.contract_id});
 assert.equal(yes.status,"READY_HELD_NO_EXECUTION");
 assert.equal(yes.source_requests_sent,0);
 assert.equal(yes.physical_action,false);
 const no=await askHumanGoal({text,confirmed:true,expected_contract_id:"f".repeat(64)});
 assert.equal(no.status,"HOLD_CONFLICTING_HUMAN_INTENT");
});
test("freshness is a human constraint; invented future resource totals are forbidden",async()=>{
 const text="Could you check the rivers?";
 const a=await askHumanGoal({text,answers:{evidence_scope:"any_fresh"}});
 assert.equal(a.next_question.id,"freshness_hours");
 const b=await askHumanGoal({text,answers:{
   evidence_scope:"any_fresh",freshness_hours:6}});
 assert.equal(b.status,"CONFIRM_REQUIRED");
 assert.equal(b.earlier_matching_12h_example,null);
 assert.equal(b.estimated_actual_future_requests,null);
 assert.equal(b.actual_energy_joules,null);
});
test("no false river routing for safety, volunteering or donated coffee",async()=>{
 for(const text of ["Is this bridge safe to cross?",
   "Should I evacuate because of flood risk?",
   "Can someone donate coffee for our fellowship?"]){
  const x=await askHumanGoal({text});
  assert.match(x.status,/^HOLD_/);
  assert.equal(x.source_requests_sent,0);
 }
 await assert.rejects(askHumanGoal({text:"river",execute:true}),/invalid/);
});
test("localhost endpoint requires CSRF and never dispatches on confirmation",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"jarvis-goal-023-"));
 try{
  const server=await startWorkbenchServer({journalPath:join(dir,"events.jsonl"),port:0});
  try{
   const ui=await fetch(server.url+"/goal");
   assert.equal(ui.status,200);
   const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
   const text="Could you check the rivers?";
   const denied=await fetch(server.url+"/api/reciprocal/goal",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({text})});
   assert.equal(denied.status,403);
   const request=async payload=>{
    const res=await fetch(server.url+"/api/reciprocal/goal",{
     method:"POST",headers:{"content-type":"application/json",
       "x-jarvis-csrf":state.csrfToken},body:JSON.stringify(payload)});
    assert.equal(res.status,200);
    return res.json();
   };
   const a=await request({text});
   assert.equal(a.next_question.id,"evidence_scope");
   const answers={evidence_scope:"two_named_fresh",freshness_hours:12};
   const b=await request({text,answers});
   assert.equal(b.status,"CONFIRM_REQUIRED");
   const c=await request({text,answers,confirmed:true,expected_contract_id:b.contract_id});
   assert.equal(c.status,"READY_HELD_NO_EXECUTION");
   assert.equal(c.source_requests_sent,0);
   assert.equal((await (await fetch(server.url+"/api/reciprocal/state")).json()).reviews,0);
  }finally{await server.close()}
 }finally{await rm(dir,{recursive:true,force:true})}
});
