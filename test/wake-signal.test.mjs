import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,readFile,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WakeDesk,verifyPinnedWake,MOTIF_WAKE_COMMIT } from "../src/wake-signal.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const example={
 title:"Example welcome table",
 context:"Illustrative only; not a confirmed real event.",
 small:"Could you set one chair?",
 creative:"Could you propose one unexpected welcome idea?",
 autonomous:"Could you own a ten-minute welcome task?",
 count:100,seed:2026
};
async function sandbox(fn){
 const dir=await mkdtemp(join(tmpdir(),"jarvis-wake-"));
 try{return await fn({dir,folder:join(dir,"wake"),journalPath:join(dir,"journal.jsonl")})}
 finally{await rm(dir,{recursive:true,force:true})}
}
async function create(folder,confirmed=false){
 const desk=await WakeDesk.open({directory:folder});
 return {desk,result:await desk.create({...example,verifiedOpportunity:confirmed})};
}
test("exact owner MOTIF-001 source is byte pinned and bridge executes",async()=>{
 assert.equal(await verifyPinnedWake(),true);
 assert.equal(MOTIF_WAKE_COMMIT,"efe133f0db12b439b9c483eace13601cf8c03285");
});
test("unverified 100-invitation draft never delivers; balanced slots and no contacts",()=>sandbox(async({folder})=>{
 const {desk,result}=await create(folder);
 assert.equal(result.externalDelivery,false);
 assert.equal(result.automatedContact,false);
 assert.equal(result.active.plan.assignments.length,100);
 assert.deepEqual(Object.values(result.active.report.results).map(x=>x.assigned).sort((a,b)=>a-b),[33,33,34]);
 assert.equal(result.active.event_count,0);
 assert.equal(result.active.plan.spec.verified_opportunity,false);
 for(const entry of result.active.plan.assignments){
  assert.match(entry.message,/free to decline or ignore/i);
  assert.ok(!("recipient" in entry));
  assert.equal(result.active.states[entry.slot],"NONE");
 }
 await assert.rejects(desk.record({studyId:result.active.studyId,slot:"P001",event:"offered",contactPermission:true}),/HOLD/);
 assert.equal((await desk.state()).active.event_count,0);
 const report=result.active.report;
 assert.equal(report.results.small.action_per_offered_descriptive,null);
 assert.match(report.inference,/Missing replies are unknown/);
}));
test("permission, evidence, opt-out and restart are upheld by upstream",()=>sandbox(async({folder})=>{
 const {desk,result}=await create(folder,true),studyId=result.active.studyId;
 await assert.rejects(desk.record({studyId,slot:"P001",event:"offered"}),/permission|HOLD/);
 await desk.record({studyId,slot:"P001",event:"offered",contactPermission:true});
 await assert.rejects(desk.record({studyId,slot:"P001",event:"action",actionAttested:true,receipt:"R001"}),/HOLD/);
 await desk.record({studyId,slot:"P001",event:"replied"});
 await assert.rejects(desk.record({studyId,slot:"P001",event:"action",actionAttested:true}),/receipt|HOLD/);
 await desk.record({studyId,slot:"P001",event:"action",actionAttested:true,receipt:"R001"});
 await desk.record({studyId,slot:"P001",event:"novel_action",actionAttested:true,receipt:"R002"});
 await desk.record({studyId,slot:"P002",event:"opted_out"});
 await assert.rejects(desk.record({studyId,slot:"P002",event:"offered",contactPermission:true}),/HOLD/);
 const reopened=await WakeDesk.open({directory:folder});
 const state=await reopened.state(studyId);
 assert.equal(state.active.states.P001,"NOVEL_ACTION");
 assert.equal(state.active.states.P002,"OPTED_OUT");
 assert.equal(state.active.event_count,5);
 const arm=state.active.plan.assignments[0].arm;
 assert.equal(state.active.report.results[arm].operator_attested_actions,1);
 assert.equal(state.active.report.results[arm].operator_attested_unplanned_actions,1);
 assert.equal(state.active.report.offerings_complete,false);
}));
test("multiple independent studies and idempotent duplicate plan",()=>sandbox(async({folder})=>{
 const {desk,result}=await create(folder);
 const same=await desk.create({...example});
 assert.equal(same.studies.length,1);
 assert.equal(same.active.studyId,result.active.studyId);
 const verified=await desk.create({...example,verifiedOpportunity:true});
 assert.equal(verified.studies.length,2);
 assert.notEqual(verified.active.studyId,result.active.studyId);
 assert.equal((await desk.state(result.active.studyId)).active.plan.spec.verified_opportunity,false);
}));
test("tampered upstream source plan is rejected rather than rewritten",()=>sandbox(async({folder})=>{
 const {desk,result}=await create(folder,true);
 const path=join(folder,result.active.studyId+".plan.json");
 const plan=JSON.parse(await readFile(path,"utf8"));
 plan.assignments[0].message="TAMPERED";
 await writeFile(path,JSON.stringify(plan));
 await assert.rejects(desk.state(result.active.studyId),/HOLD/);
}));
test("live JAR;VIS /wake page and HTTP endpoints are localhost and CSRF gated",()=>sandbox(async({journalPath})=>{
 const server=await startWorkbenchServer({journalPath,port:0});
 try{
  const home=await fetch(server.url+"/");
  assert.match(await home.text(),/WAKE Signal/);
  const page=await fetch(server.url+"/wake");
  assert.equal(page.status,200);assert.match(await page.text(),/Ping the possibility/);
  const script=await fetch(server.url+"/wake.js");
  assert.equal(script.status,200);
  assert.match(await script.text(),/No invitation was sent/);
  const stateResponse=await fetch(server.url+"/api/wake/state");
  assert.equal(stateResponse.status,200);
  const state=await stateResponse.json();
  assert.deepEqual(state.studies,[]);
  const payload={...example,verifiedOpportunity:false};
  const denied=await fetch(server.url+"/api/wake/create",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  assert.equal(denied.status,403);
  const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
  const crossed=await fetch(server.url+"/api/wake/create",{method:"POST",headers:{
    ...headers,origin:"https://untrusted.example"},body:JSON.stringify(payload)});
  assert.equal(crossed.status,403);
  const created=await fetch(server.url+"/api/wake/create",{method:"POST",headers,
    body:JSON.stringify(payload)});
  assert.equal(created.status,200);
  const study=await created.json();
  assert.equal(study.active.plan.assignments.length,100);
  const refused=await fetch(server.url+"/api/wake/record",{method:"POST",headers,
    body:JSON.stringify({studyId:study.active.studyId,slot:"P001",event:"offered",contactPermission:true})});
  assert.equal(refused.status,409);
  const verified=await fetch(server.url+"/api/wake/create",{method:"POST",headers,
    body:JSON.stringify({...payload,verifiedOpportunity:true})});
  assert.equal(verified.status,200);
  const real=await verified.json();
  const recorded=await fetch(server.url+"/api/wake/record",{method:"POST",headers,
    body:JSON.stringify({studyId:real.active.studyId,slot:"P001",event:"offered",contactPermission:true})});
  assert.equal(recorded.status,200);
  const output=await recorded.json();
  assert.equal(output.active.states.P001,"OFFERED");
  assert.equal(output.externalDelivery,false);
  assert.equal(output.active.report.results[output.active.plan.assignments[0].arm].offered,1);
 }finally{await server.close()}
}));
