import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {composeHumanExamples,verifyComposerSource,SOURCE_025_COMMIT}
 from "../src/motif-composable-goals.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const COFFEE="Can we get free coffee donated for our fellowship event?";
test("exact source-owned cross-domain composer and dependency chain verified",async()=>{
 assert.equal(await verifyComposerSource(),true);
 assert.match(SOURCE_025_COMMIT,/^[0-9a-f]{40}$/);
});
test("the user's coffee donation request yields two truly relevant examples",async()=>{
 const r=await composeHumanExamples({text:COFFEE});
 assert.equal(r.schema,"motif.composable-goal-examples/v1");
 assert.equal(r.domain,"coffee_donation");
 assert.equal(r.status,"SHOW_TWO_EXAMPLES");
 assert.deepEqual(r.examples.map(x=>x.id),["a","b"]);
 assert.match(r.examples[0].would_this_be_enough,/quantity/i);
 assert.match(r.examples[1].would_this_be_enough,/two successive/i);
 assert.equal(r.write_your_own_option.id,"custom");
 assert.equal(r.network_requests_sent,0);
 assert.equal(r.transmittedToNetwork,false);
 assert.equal(r.persistentLearning,false);
});
test("one donor vs recurring donation have distinct held user-contract digests",async()=>{
 const a=await composeHumanExamples({text:COFFEE,choice:"a"});
 const b=await composeHumanExamples({text:COFFEE,choice:"b"});
 assert.equal(a.status,"CONFIRM_REQUIRED");
 assert.equal(b.status,"CONFIRM_REQUIRED");
 assert.equal(a.draft_contract.domain,"coffee_donation");
 assert.notEqual(a.contract_id,b.contract_id);
 assert.equal(a.draft_contract.requested_outcome_observed,false);
 assert.equal(b.draft_contract.no_external_work_authorized,true);
 const corrected=await composeHumanExamples({text:COFFEE,choice:"b",
   correction_of_id:a.contract_id});
 assert.equal(corrected.correction_replaces_prior_id,true);
 const stale=await composeHumanExamples({text:COFFEE,choice:"b",
   confirmed:true,expected_contract_id:a.contract_id});
 assert.equal(stale.status,"HOLD_CONFLICTING_HUMAN_INTENT");
 const approved=await composeHumanExamples({text:COFFEE,choice:"b",
   confirmed:true,expected_contract_id:b.contract_id,
   correction_of_id:a.contract_id});
 assert.equal(approved.status,"READY_HELD_NO_EXECUTION");
 assert.equal(approved.network_requests_sent,0);
 assert.equal(approved.authority,false);
});
test("custom finished-result requirement stays the person's uninterpreted wording",async()=>{
 const own_example="A donor confirms exactly 80 cups and a Friday pickup.";
 const x=await composeHumanExamples({text:COFFEE,choice:"custom",own_example});
 assert.equal(x.status,"CONFIRM_REQUIRED");
 assert.equal(x.draft_contract.completion_statement,own_example);
 assert.equal(x.draft_contract.criterion_origin,"HUMAN_TYPED_UNINTERPRETED");
 assert.equal(x.draft_contract.semantics_machine_verified,false);
 assert.equal(x.human_text_persisted,false);
 assert.equal(x.actual_energy_joules,null);
});
test("volunteers, websites, research and generic fallback use distinct cartridges",async()=>{
 const cases=[
  ["Please recruit volunteers for our event","volunteer_shift"],
  ["Build the community website","website"],
  ["Research a claim and assemble an evidence packet","research"],
  ["Help me contemplate a strange dream","generic"],
 ];
 for(const [text,domain] of cases){
  const x=await composeHumanExamples({text});
  assert.equal(x.domain,domain);
  assert.equal(x.examples.length,2);
  assert.notEqual(x.examples[0].would_this_be_enough,
                  x.examples[1].would_this_be_enough);
 }
});
test("existing USGS physical-source branch preserved without external action",async()=>{
 const a=await composeHumanExamples({text:"Could you check the rivers?"});
 assert.equal(a.domain,"river_reports");
 assert.equal(a.examples.length,2);
 const r=await composeHumanExamples({text:"Could you check the rivers?",choice:"a"});
 assert.equal(r.status,"CONFIRM_REQUIRED");
 assert.equal(r.draft_contract.goal,"any_fresh");
 assert.equal(r.network_requests_sent,0);
 const q=await composeHumanExamples({text:"Could you check the rivers?",
    choice:"custom",own_example:"Both Blue Earth and Le Sueur reports are enough"});
 assert.equal(q.status,"ASK_ONE_DECISIVE_QUESTION");
 assert.equal(q.next_question.id,"freshness_hours");
 const ready=await composeHumanExamples({text:"Could you check the rivers?",
    choice:"custom",own_example:"Both Blue Earth and Le Sueur reports are enough",
    freshness_hours:24});
 assert.equal(ready.status,"CONFIRM_REQUIRED");
 assert.equal(ready.draft_contract.freshness_hours,24);
});
test("unsafe and contradictory resource-saving shortcuts never become approved",async()=>{
 for(const text of ["Is this bridge safe to cross?",
                    "Should I evacuate because of flood risk?"]){
  const x=await composeHumanExamples({text});
  assert.equal(x.status,"HOLD_HIGH_STAKES");
 }
 const x=await composeHumanExamples({text:"Find recurring donated coffee every week",choice:"a"});
 assert.equal(x.status,"HOLD_CONFLICTING_HUMAN_INTENT");
 await assert.rejects(composeHumanExamples({text:COFFEE,run:true}),/invalid/);
 await assert.rejects(composeHumanExamples({text:COFFEE,choice:"custom",
    own_example:"a".repeat(321)}),/invalid/);
});
test("local /goal displays choice and custom input; CSRF & no journal mutation",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"motif-025-composer-"));
 try{
  const server=await startWorkbenchServer({journalPath:join(dir,"work.jsonl"),port:0});
  try{
   const [p,s,style]=await Promise.all([
    fetch(server.url+"/goal"),fetch(server.url+"/goal.js"),fetch(server.url+"/goal.css")]);
   assert.equal(p.status,200);
   const html=await p.text();
   assert.match(html,/type your own/i);
   assert.match(html,/donor/i);
   assert.match(html,/example-one-evidence/);
   assert.equal(s.status,200);
   assert.match(await s.text(),/\/api\/reciprocal\/compose/);
   assert.equal(style.status,200);
   const st=await (await fetch(server.url+"/api/reciprocal/state")).json();
   const route=server.url+"/api/reciprocal/compose";
   const noCsrf=await fetch(route,{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({text:COFFEE})});
   assert.equal(noCsrf.status,403);
   const ask=async body=>{
    const res=await fetch(route,{method:"POST",headers:{
     "content-type":"application/json","x-jarvis-csrf":st.csrfToken},
     body:JSON.stringify(body)});
    assert.equal(res.status,200);
    return res.json();
   };
   const opts=await ask({text:COFFEE});
   assert.equal(opts.domain,"coffee_donation");
   const one=await ask({text:COFFEE,choice:"a"});
   const two=await ask({text:COFFEE,choice:"b",correction_of_id:one.contract_id});
   assert.equal(two.correction_replaces_prior_id,true);
   const yes=await ask({text:COFFEE,choice:"b",confirmed:true,
     expected_contract_id:two.contract_id,
     correction_of_id:one.contract_id});
   assert.equal(yes.status,"READY_HELD_NO_EXECUTION");
   assert.equal(yes.transmittedToNetwork,false);
   assert.equal(yes.network_requests_sent,0);
   const current=await (await fetch(server.url+"/api/reciprocal/state")).json();
   assert.equal(current.reviews,0);
  }finally{await server.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});
