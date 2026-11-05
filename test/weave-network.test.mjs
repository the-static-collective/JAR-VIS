import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {NetworkWeave,networkAtlas,validateCarrier} from "../src/weave-network.mjs";
import {WakeDesk} from "../src/wake-signal.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const sample={
 sourceNode:"fellowship",targetNode:"garden",kind:"open",when:"open",
 title:"Fictional welcome table",context:"A synthetic test community gathering needs a voluntary chair.",
 asks:{
  small:"Put one chair out.",
  creative:"Suggest a new way to welcome guests.",
  autonomous:"Propose and own a ten-minute welcome task."
 }
};
const copy=o=>structuredClone(o);
async function sandbox(fn){
 const dir=await mkdtemp(join(tmpdir(),"jarvis-weave-"));
 try{
  const wake=await WakeDesk.open({directory:join(dir,"wake")});
  const weave=await NetworkWeave.open({wake,journalPath:join(dir,"network.jsonl")});
  return await fn({wake,weave,dir,journalPath:join(dir,"jarvis.jsonl")});
 }finally{await rm(dir,{recursive:true,force:true})}
}
async function admit(weave,packet=sample,opts={}){
 const preview=await weave.preview(packet);
 return weave.admit({packet:preview.payload,packetSha256:preview.packetSha256,
  reviewed:true,sourceReuseApproved:true,count:3,seed:2026,...opts});
}

test("source atlas lists 15 separate rooms, never asserts a connected partner",()=>{
 const list=networkAtlas();
 assert.equal(list.length,15);
 assert.equal(new Set(list.map(x=>x.id)).size,list.length);
 assert.ok(list.every(x=>x.connectedToWake===false));
 assert.ok(list.some(x=>x.id==="garden"&&/BananaSpork/.test(x.sourceURL)));
 assert.ok(list.some(x=>x.id==="seven-table"&&/pull\/121/.test(x.sourceURL)));
 assert.ok(list.some(x=>x.id==="now-route"&&/pull\/55/.test(x.sourceURL)));
 assert.ok(list.some(x=>x.id==="relatte"));
 assert.ok(list.some(x=>x.id==="jubilee"));
});
test("preview reads real Any Invitation 001 cartridge and proposes routes without delivery",()=>sandbox(async({weave})=>{
 const r=await weave.preview(sample);
 assert.equal(r.disposition,"HOLD_FOR_HUMAN_REVIEW");
 assert.equal(r.source.id,"fellowship");
 assert.equal(r.readForeignSource,false);
 assert.equal(r.externalContact,false);
 assert.equal(r.invitationRoutes.length,6);
 assert.deepEqual(new Set(r.invitationRoutes.map(a=>a.id)),
  new Set(["act","offer","question","pass","fork","decline"]));
 assert.ok(r.suggestedReceivers.length>=4);
 assert.ok(r.suggestedReceivers.every(x=>x.admitted===false&&x.connected===false));
 assert.equal((await weave.state()).edges.length,0);
}));
test("no human approval, no source permission and stale hashes HOLD",()=>sandbox(async({weave})=>{
 const p=await weave.preview(sample);
 await assert.rejects(weave.admit({packet:p.payload,packetSha256:p.packetSha256}),/HOLD/);
 await assert.rejects(weave.admit({packet:p.payload,packetSha256:p.packetSha256,
  reviewed:true}),/permission/);
 await assert.rejects(weave.admit({packet:p.payload,packetSha256:"0".repeat(64),
  reviewed:true,sourceReuseApproved:true}),/stale preview/);
 const s=await weave.state();assert.equal(s.edges.length,0);
}));
test("admission yields native WAKE study and preserves no personal copy in weave journal",()=>sandbox(async({weave,wake,dir})=>{
 const result=await admit(weave);
 assert.match(result.studyId,/^[0-9a-f]{20}$/);
 assert.equal(result.externalDelivery,false);
 assert.equal(result.disposition,"LOCAL_STUDY_ONLY");
 const saved=(await wake.state(result.studyId)).active;
 assert.equal(saved.plan.spec.count,3);
 assert.equal(saved.plan.spec.verified_opportunity,false);
 const edge=(await weave.state()).edges[0];
 assert.equal(edge.sourceNode,"fellowship");
 assert.equal(edge.targetNode,"garden");
 assert.equal(edge.studyId,result.studyId);
 assert.equal(edge.packetSha256.length,64);
 const raw=await readFile(join(dir,"network.jsonl"),"utf8");
 assert.doesNotMatch(raw,/Put one chair out|A synthetic test|Suggest a new way/);
 const dup=await admit(weave);
 assert.equal(dup.reused,true);
 assert.equal((await weave.state()).edges.length,1);
}));
test("source-labelled contexts reject contact details, unknown organs, false time and stale parents",()=>sandbox(async({weave})=>{
 const bad=[{...sample,sourceNode:"no-organ"},
  {...sample,kind:"mind-reader"},{...sample,when:"always-now"},
  {...sample,context:"Mail me at someone@example.com"},
  {...sample,context:"Call 507-555-1111"},
  {...sample,title:"https://secret.example"},
  {...sample,targetNode:"fellowship"},
  {...sample,parentStudyId:"fake"},
  {...sample,parentStudyId:"a".repeat(20),parentSlot:null}];
 for(const x of bad)await assert.rejects(weave.preview(x),/HOLD/);
}));
test("a new branch must have witnessed unplanned action, not reply or ordinary action",()=>sandbox(async({weave,wake})=>{
 const parent=await admit(weave);
 const child={...sample,title:"Distinct novel attempt",context:"A new synthetic contribution can be considered.",
  parentStudyId:parent.studyId,parentSlot:"P001"};
 await assert.rejects(admit(weave,child),/unplanned action/);
 const p=await wake.create({title:sample.title,context:sample.context,small:sample.asks.small,
  creative:sample.asks.creative,autonomous:sample.asks.autonomous,
  verifiedOpportunity:true,count:3,seed:999});
 // The verified study is not yet a weave parent: do not import it as evidence.
 await assert.rejects(admit(weave,{...child,parentStudyId:p.active.studyId}),/locally reviewed weave/);
 // Confirm the actual local parent study; this still represents operator testimony.
 const verifiedParent=await admit(weave,{...sample,title:"Fictional welcome table — verified by operator"},{verifiedOpportunity:true});
 const derived={...child,parentStudyId:verifiedParent.studyId};
 await wake.record({studyId:verifiedParent.studyId,slot:"P001",event:"offered",contactPermission:true});
 await wake.record({studyId:verifiedParent.studyId,slot:"P001",event:"replied"});
 await assert.rejects(admit(weave,derived),/unplanned action/);
 await wake.record({studyId:verifiedParent.studyId,slot:"P001",event:"action",
   actionAttested:true,receipt:"R01"});
 await assert.rejects(admit(weave,derived),/unplanned action/);
 await wake.record({studyId:verifiedParent.studyId,slot:"P001",event:"novel_action",
   actionAttested:true,receipt:"R02"});
 const fork=await admit(weave,derived);
 const state=await weave.state();
 assert.equal(state.edges.at(-1).parentStudyId,verifiedParent.studyId);
 assert.equal(state.edges.at(-1).parentSlot,"P001");
 assert.equal(fork.externalDelivery,false);
}));
test("export/inspect/receive is portable but independent HOLD and unverified draft",()=>sandbox(async({weave,wake})=>{
 const created=await admit(weave);
 await assert.rejects(weave.prepareCarrier({studyId:created.studyId,targetNode:"webz"}),/approval/);
 const carrier=await weave.prepareCarrier({studyId:created.studyId,
  targetNode:"webz",humanShareReviewed:true});
 assert.equal(carrier.recipientDisposition,"HOLD_FOR_INDEPENDENT_REVIEW");
 assert.equal(carrier.admitted,false);
 assert.equal(carrier.signed,false);
 assert.equal(carrier.externalDelivery,false);
 assert.equal(carrier.sourceNode,"fellowship");
 assert.equal(carrier.targetNode,"webz");
 const inspected=await weave.inspectCarrier(carrier);
 assert.equal(inspected.disposition,"HOLD_FOR_INDEPENDENT_REVIEW");
 assert.equal(inspected.externallyAuthenticated,false);
 await assert.rejects(weave.receiveCarrier({carrier}),/review/);
 const received=await weave.receiveCarrier({carrier,independentlyReviewed:true,
  localOperatorApproved:true,count:3,seed:33});
 assert.notEqual(received.studyId,created.studyId);
 assert.equal(received.storedAs,"LOCAL_UNVERIFIED_DRAFT");
 const child=(await wake.state(received.studyId)).active;
 assert.equal(child.plan.spec.verified_opportunity,false);
 assert.equal(received.remotelyAdmitted,false);
}));
test("counterfeit signed, modified, extra-field or route-forged carriers all HOLD",()=>sandbox(async({weave})=>{
 const created=await admit(weave);
 const good=await weave.prepareCarrier({studyId:created.studyId,targetNode:"webz",humanShareReviewed:true});
 for(const mutator of [
  o=>{o.signed=true},o=>{o.admitted=true},o=>{o.externalDelivery=true},
  o=>{o.payload.asks.small="Modified after review"},
  o=>{o.sourceNode="commons"},o=>{o.targetNode="garden"},
  o=>{o.operatorPrivileges=["publish"]},
  o=>{o.payload.sourceURL="https://evil.example"},
 ]){
  const candidate=copy(good);mutator(candidate);
  assert.throws(()=>validateCarrier(candidate),/HOLD/);
 }
}));
test("bad journal bytes block cold restart, no silent re-trust",()=>sandbox(async({weave,wake,dir})=>{
 await admit(weave);
 const path=join(dir,"network.jsonl");
 const source=await readFile(path,"utf8");
 await writeFile(path,source.replace("fellowship","org_impostor"));
 await assert.rejects(NetworkWeave.open({wake,journalPath:path}),/verification failed/i);
}));
test("real localhost /weave routes enforce host/origin/CSRF and do not deliver",()=>sandbox(async({journalPath})=>{
 const running=await startWorkbenchServer({journalPath,port:0});
 try{
  const get=async path=>fetch(running.url+path,{cache:"no-store"});
  const page=await get("/weave");assert.equal(page.status,200);
  assert.match(await page.text(),/One weave. Distinct owners/);
  const script=await get("/weave.js");assert.equal(script.status,200);
  const state=await (await get("/api/weave/state")).json();
  assert.equal(state.atlas.length,15);
  assert.equal(state.edges.length,0);
  const noCsrf=await fetch(running.url+"/api/weave/preview",{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({packet:sample})});
  assert.equal(noCsrf.status,403);
  const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
  const wrongOrigin=await fetch(running.url+"/api/weave/preview",{method:"POST",
   headers:{...headers,origin:"https://not-us.example"},body:JSON.stringify({packet:sample})});
  assert.equal(wrongOrigin.status,403);
  const route=async(path,body)=>{
   const response=await fetch(running.url+path,{method:"POST",headers,body:JSON.stringify(body)});
   return {status:response.status,result:await response.json()};
  };
  const preview=await route("/api/weave/preview",{packet:sample});
  assert.equal(preview.status,200);
  const denial=await route("/api/weave/admit",{packet:preview.result.payload,
   packetSha256:preview.result.packetSha256});
  assert.equal(denial.status,409);
  const admitted=await route("/api/weave/admit",{packet:preview.result.payload,
   packetSha256:preview.result.packetSha256,reviewed:true,sourceReuseApproved:true,count:3});
  assert.equal(admitted.status,200);
  const studyId=admitted.result.studyId;
  const blocked=await route("/api/weave/carrier",{studyId,targetNode:"webz"});
  assert.equal(blocked.status,409);
  const carrier=await route("/api/weave/carrier",{studyId,targetNode:"webz",humanShareReviewed:true});
  assert.equal(carrier.status,200);
  const held=await route("/api/weave/inspect-carrier",{carrier:carrier.result});
  assert.equal(held.status,200);
  assert.equal(held.result.externallyAuthenticated,false);
  assert.equal((await get("/api/weave/state")).status,200);
 } finally {await running.close()}
}));
