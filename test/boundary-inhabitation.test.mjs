import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inhabitBoundary, BUS_CASE } from "../src/boundary-inhabitation.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

test("same physical problem produces the same typed perspective plan",()=>{
 const a=inhabitBoundary(BUS_CASE),b=inhabitBoundary(BUS_CASE);
 assert.deepEqual(a,b);
 assert.match(a.planId,/^boundary-plan:[a-f0-9]{64}$/);
 assert.equal(a.crossings.length,2);
 assert.equal(a.crossings[0].transferMode,"permanent-transfer");
 assert.equal(a.crossings[1].transferMode,"temporary-loan");
 assert.ok(a.crossings.every(c=>c.viewpoints.length===4 && c.requiredEvidence.length>=2));
});
test("boundary inhabitation exposes no invented donors, mechanical rights or completed repair",()=>{
 const r=inhabitBoundary(BUS_CASE);
 assert.equal(r.executionAuthorized,false);
 assert.equal(r.claims.autonomousMatching,false);
 assert.equal(r.claims.partCompatibilityProven,false);
 assert.equal(r.outcomes.repairComplete,false);
 assert.equal(r.outcomes.donorsConfirmed,0);
 assert.ok(r.crossings.every(c=>c.knownDonorFound===false && c.compatible===false && c.loanAgreed===false));
 assert.ok(r.crossings.every(c=>c.permittedEffect==="PROPOSE_ONLY"));
 assert.ok(!JSON.stringify(r).includes("4drapafk38a555976"));
 assert.ok(!JSON.stringify(r).includes("Soulseek"));
});
test("different resource boundaries actually change the compiled proposal",()=>{
 const change=structuredClone(BUS_CASE);
 change.resourceNeeds[0].mode="temporary-loan";
 const output=inhabitBoundary(change);
 assert.notEqual(output.planId,inhabitBoundary().planId);
 assert.match(output.crossings[0].viewpoints[3].question,/how long/);
});
test("missing verification or invalid transfer vocabulary refuses compilation",()=>{
 const broken=structuredClone(BUS_CASE);
 broken.resourceNeeds[0].verification=[];
 assert.throws(()=>inhabitBoundary(broken),/VERIFICATION_REQUIRED/);
 const bad=structuredClone(BUS_CASE);
 bad.resourceNeeds[0].mode="steal";
 assert.throws(()=>inhabitBoundary(bad),/UNKNOWN_CROSSING_TYPE/);
});
test("local JAR;VIS attendant exposes read-only fixture but no participant contact",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"boundary-inhabitation-"));
 let srv;
 try {
   srv=await startWorkbenchServer({journalPath:join(dir,"journal.jsonl"),port:0});
   const r=await fetch(srv.url+"/api/boundary/001");
   assert.equal(r.status,200);
   const body=await r.json();
   assert.equal(body.crossings.length,2);
   assert.equal(body.mode,"DETERMINISTIC_PROPOSAL_ONLY");
   const main=await fetch(srv.url+"/workshop");
   assert.match(await main.text(),/Inhabit the boundary/);
   assert.match(srv.app.attend("Can we be the marble for the ECM?").answer,/BOUNDARY INHABITATION/);
   assert.equal(srv.app.state().events.length,0);
 }finally{if(srv)await srv.close();await rm(dir,{recursive:true,force:true})}
});
