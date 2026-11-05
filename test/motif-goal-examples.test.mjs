import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {askGoalExamples,verifyExamplesSource,SOURCE_024_COMMIT}
 from "../src/motif-goal-examples.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const text="Could you check the rivers?";
test("source-owned example grammar and downstream physical receipts are pinned",async()=>{
 assert.equal(await verifyExamplesSource(),true);
 assert.match(SOURCE_024_COMMIT,/^[0-9a-f]{40}$/);
});
test("two literal would-this-be-enough answers PLUS type-your-own",async()=>{
 const r=await askGoalExamples({text});
 assert.equal(r.status,"SHOW_TWO_EXAMPLES");
 assert.equal(r.examples.length,2);
 assert.deepEqual(r.examples.map(e=>e.id),["one","both"]);
 assert.match(r.examples[0].would_this_be_enough,/would be enough/i);
 assert.match(r.examples[1].would_this_be_enough,/Blue Earth/i);
 assert.equal(r.write_your_own_option.id,"custom");
 assert.equal(r.source_requests_sent,0);
 assert.equal(r.transmittedToNetwork,false);
 assert.equal(r.persistentLearning,false);
});
test("example A and B create genuinely different source contracts",async()=>{
 const a=await askGoalExamples({text,choice:"one"});
 const b=await askGoalExamples({text,choice:"both"});
 assert.equal(a.status,"CONFIRM_REQUIRED");
 assert.equal(b.status,"CONFIRM_REQUIRED");
 assert.equal(a.draft_contract.goal,"any_fresh");
 assert.equal(b.draft_contract.goal,"two_named_fresh");
 assert.notEqual(a.contract_id,b.contract_id);
 assert.equal(a.prior_physical_example.historical_actual_request_count,1);
 assert.equal(b.prior_physical_example.historical_actual_request_count,2);
 assert.equal(a.source_requests_sent,0);
});
test("custom definition is not forced into the two stock examples",async()=>{
 const own_example="One report from within the last 6 hours would be enough";
 const x=await askGoalExamples({text,choice:"custom",own_example});
 assert.equal(x.status,"CONFIRM_REQUIRED");
 assert.equal(x.draft_contract.freshness_hours,6);
 assert.equal(x.draft_contract.goal,"any_fresh");
 assert.equal(x.prior_physical_example,null);
 assert.doesNotMatch(JSON.stringify(x),/One report from within the last 6 hours would be enough/);
 const missing=await askGoalExamples({text,choice:"custom",
  own_example:"Both Blue Earth and Le Sueur readings are enough"});
 assert.equal(missing.status,"ASK_ONE_DECISIVE_QUESTION");
 assert.equal(missing.next_question.id,"freshness_hours");
 const clarified=await askGoalExamples({text,choice:"custom",
   own_example:"Both Blue Earth and Le Sueur readings are enough",
   freshness_hours:24});
 assert.equal(clarified.status,"CONFIRM_REQUIRED");
 assert.equal(clarified.draft_contract.goal,"two_named_fresh");
 assert.equal(clarified.draft_contract.freshness_hours,24);
});
test("correction invalidates a previous digest but preserves the human's right to amend",async()=>{
 const old=await askGoalExamples({text,choice:"one"});
 const newDraft=await askGoalExamples({text,choice:"both",
   correction_of_id:old.contract_id});
 assert.equal(newDraft.prior_contract_replaced,true);
 assert.equal(newDraft.needs_fresh_confirmation_after_correction,true);
 const stale=await askGoalExamples({text,choice:"both",confirmed:true,
   expected_contract_id:old.contract_id});
 assert.equal(stale.status,"HOLD_CONFLICTING_HUMAN_INTENT");
 const approved=await askGoalExamples({text,choice:"both",confirmed:true,
   expected_contract_id:newDraft.contract_id,
   correction_of_id:old.contract_id});
 assert.equal(approved.status,"READY_HELD_NO_EXECUTION");
 assert.equal(approved.human_confirmed,true);
 assert.equal(approved.source_requests_sent,0);
 assert.equal(approved.actual_energy_joules,null);
});
test("unsupported, hazardous, contradictory or invented execution instructions HOLD",async()=>{
 for(const input of [
  {text:"Should I evacuate because of flood risk?"},
  {text:"Could you help get coffee donations for the fellowship event?"},
  {text:"Need both Blue Earth and Le Sueur river readings within 12 hours",choice:"one"},
  {text,choice:"custom",own_example:"I don't need both, maybe somewhere else"}
 ]){
  const r=await askGoalExamples(input);
  assert.match(r.status,/^HOLD_/);
  assert.equal(r.source_requests_sent,0);
 }
 await assert.rejects(askGoalExamples({text,execute:true}),/invalid/);
 await assert.rejects(askGoalExamples({text,choice:"custom",own_example:"z".repeat(321)}),/invalid/);
});
test("local UI, CSRF-protected example endpoint, correction, held confirmation and no journal",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"jarvis-examples-024-"));
 try{
  const server=await startWorkbenchServer({journalPath:join(dir,"events.jsonl"),port:0});
  try{
   const [page,script,css]=await Promise.all([
     fetch(server.url+"/goal"),fetch(server.url+"/goal.js"),
     fetch(server.url+"/goal.css")
   ]);
   assert.equal(page.status,200);assert.match(await page.text(),/type your own example/i);
   assert.equal(script.status,200);assert.match(await script.text(),/choose-both/);
   assert.equal(css.status,200);
   const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
   const url=server.url+"/api/reciprocal/examples";
   const denied=await fetch(url,{method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({text})});
   assert.equal(denied.status,403);
   const request=async body=>{
     const r=await fetch(url,{method:"POST",headers:{
       "content-type":"application/json","x-jarvis-csrf":state.csrfToken},
       body:JSON.stringify(body)});
     assert.equal(r.status,200);
     return r.json();
   };
   const a=await request({text});
   assert.equal(a.status,"SHOW_TWO_EXAMPLES");
   const one=await request({text,choice:"one"});
   const revised=await request({text,choice:"both",correction_of_id:one.contract_id});
   assert.equal(revised.prior_contract_replaced,true);
   const confirmation=await request({text,choice:"both",confirmed:true,
     expected_contract_id:revised.contract_id,
     correction_of_id:one.contract_id});
   assert.equal(confirmation.status,"READY_HELD_NO_EXECUTION");
   assert.equal(confirmation.source_requests_sent,0);
   assert.equal((await (await fetch(server.url+"/api/reciprocal/state")).json()).reviews,0);
  }finally{await server.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});
