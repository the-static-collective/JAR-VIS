import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp,rm,readFile,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {composeHumanExamples} from "../src/motif-composable-goals.mjs";
import {validateLocalPermission,prepareLocalWork,verifyPrepareSource,
  renderWorkSpec,PREPARE_ONLY} from "../src/motif-goal-workpacket.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const COFFEE="Can we get free coffee donated for our fellowship event?";
const sha=s=>createHash("sha256").update(s).digest("hex");
async function approved(text=COFFEE,choice="a",own_example){
 const result=await composeHumanExamples({text,choice,
   ...(own_example?{own_example}:{})});
 assert.equal(result.status,"CONFIRM_REQUIRED");
 return {text,choice,...(own_example?{own_example}:{}),
   expected_contract_id:result.contract_id,
   action:PREPARE_ONLY,consent:true};
}
test("real MOTIF-026 work spec bytes and upstream goal-source chain pinned",async()=>{
 assert.equal(await verifyPrepareSource(),true);
});
test("separate local packet grant is mandatory even after goal confirmation",async()=>{
 const req=await approved();
 for(const changes of [
  {consent:false},{consent:undefined},{action:"SEND_DONOR_MESSAGE"},
  {action:undefined},{expected_contract_id:"x".repeat(64)}
 ]){
  await assert.rejects(
   prepareLocalWork({...req,...changes}),
   /HOLD:/);
 }
 assert.throws(()=>validateLocalPermission({...req,send:true}),/HOLD:/);
});
test("confirmed coffee criterion becomes four *actual* local, human-usable work files",async()=>{
 const p=await prepareLocalWork(await approved());
 assert.equal(p.schema,"jarvis.goal-work-packet/v1");
 assert.equal(p.status,"LOCAL_ARTIFACTS_PREPARED_IN_MEMORY");
 assert.equal(p.domain,"coffee_donation");
 assert.equal(p.artifacts.length,4);
 assert.deepEqual(p.artifacts.map(a=>a.kind),
   ["checklist","csv_tracker","unsent_message","html_workpage"]);
 for(const a of p.artifacts){
  assert.equal(a.sha256,sha(a.content));
  assert.ok(a.bytes>30);
  assert.equal(a.saved_to_disk,false);
  assert.equal(a.downloaded,false);
  assert.equal(a.external_delivery,false);
 }
 assert.match(p.artifacts[0].content,/pickup|quantity/i);
 assert.match(p.artifacts[1].content,/donor_or_source/);
 assert.match(p.artifacts[1].content,/evidence_of_commitment/);
 assert.match(p.artifacts[2].content,/UNSENT DRAFT/);
 assert.match(p.artifacts[2].content,/Would you consider helping/i);
 assert.match(p.artifacts[3].content,/Definition of done/);
 assert.match(p.artifacts[3].content,/NO MESSAGES SENT/);
 assert.equal(p.external_delivery,false);
 assert.equal(p.saved_to_disk,false);
 assert.equal(p.claimed_real_world_completion,false);
 assert.equal(p.electricity_joules,null);
 assert.equal(p.paid_tokens,0);
});
test("a corrected goal cannot inherit the old accepted contract digest",async()=>{
 const one=await approved(COFFEE,"a");
 const two=await approved(COFFEE,"b");
 assert.notEqual(one.expected_contract_id,two.expected_contract_id);
 await assert.rejects(prepareLocalWork({...two,
   expected_contract_id:one.expected_contract_id}),/contract changed/);
 const packet=await prepareLocalWork(two);
 assert.equal(packet.goal_contract_id,two.expected_contract_id);
 assert.match(packet.artifacts[0].content,/two successive/);
});
test("custom user text is embedded only in local output, HTML-escaped, never claimed interpreted",async()=>{
 const typed="A donor confirms <img src=x onerror=alert(1)> coffee by Friday";
 const p=await prepareLocalWork(await approved(COFFEE,"custom",typed));
 const html=p.artifacts.find(a=>a.kind==="html_workpage").content;
 assert.doesNotMatch(html,/<img src=x onerror/);
 assert.match(html,/&lt;img src=x onerror/);
 const list=p.artifacts.find(a=>a.kind==="checklist").content;
 assert.match(list,/img src=x onerror/);
 assert.equal(p.localOnly,true);
});
test("other recognized and generic goals also create usable but unexecuted local packets",async()=>{
 for(const [text,domain,word] of [
  ["Need volunteers for the event","volunteer_shift","shift_date"],
  ["Make a community grocery exchange","grocery_network","offer_or_need"],
  ["Build a working website page","website","test_status"],
  ["Research the evidence of this claim","research","source_checked"],
  ["Help me understand this strange dream","generic","next_action"]
 ]){
  const p=await prepareLocalWork(await approved(text));
  assert.equal(p.domain,domain);
  assert.match(p.artifacts[1].content,new RegExp(word));
  assert.equal(p.artifacts[2].external_delivery,false);
 }
});
test("river goal is allowed only as non-fetching research checklist",async()=>{
 const text="Could you check the rivers?";
 const p=await prepareLocalWork(await approved(text));
 assert.equal(p.domain,"river_reports");
 assert.match(p.artifacts[0].content,/does not contact USGS/i);
 assert.equal(p.external_delivery,false);
});
test("renderer rejects fabricated external dispatch or unsupported type",async()=>{
 const fake={
  domain:"coffee_donation",goal_contract_id:"a".repeat(64),
  goal_contract:{completion_statement:"A real goal"},
  allowed_outputs:["checklist","csv_tracker","unsent_message","html_workpage"],
  tracking_fields:["source"],checklist_items:["Ask first"],
  message_subject:"Test",message_draft:"Test",
  external_delivery_permitted:true,remote_execution_permitted:false,
  execution_claim:false
 };
 assert.throws(()=>renderWorkSpec(fake),/HOLD:/);
});
test("localhost API enforces CSRF, consent and goal binding; no private journal writes",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"motif-026-local-work-"));
 const journal=join(dir,"workbench.jsonl");
 try{
  const server=await startWorkbenchServer({journalPath:journal,port:0});
  try{
   const page=await fetch(server.url+"/goal");
   assert.equal(page.status,200);
   const html=await page.text();
   assert.match(html,/prepare my local work kit/i);
   assert.match(html,/work-files/);
   const [script,css]=await Promise.all([
    fetch(server.url+"/goal.js"),fetch(server.url+"/goal.css")]);
   assert.equal(script.status,200);
   assert.match(await script.text(),/\/api\/reciprocal\/prepare-work/);
   assert.equal(css.status,200);
   const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
   const endpoint=server.url+"/api/reciprocal/prepare-work";
   const payload=await approved();
   const denied=await fetch(endpoint,{method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(payload)});
   assert.equal(denied.status,403);
   const post=async p=>{
    const r=await fetch(endpoint,{method:"POST",headers:{
      "content-type":"application/json","x-jarvis-csrf":state.csrfToken},
      body:JSON.stringify(p)});
    return {status:r.status,body:await r.json()};
   };
   const missing=await post({...payload,consent:false});
   assert.equal(missing.status,403);
   const changed=await post({...payload,expected_contract_id:"f".repeat(64)});
   assert.equal(changed.status,409);
   const actual=await post(payload);
   assert.equal(actual.status,200);
   assert.equal(actual.body.artifacts.length,4);
   assert.equal(actual.body.artifacts[2].external_delivery,false);
   const afterwards=await (await fetch(server.url+"/api/reciprocal/state")).json();
   assert.equal(afterwards.reviews,0);
  }finally{await server.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});
