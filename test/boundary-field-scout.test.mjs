import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {compileFieldScout,FIELD_LEADS} from "../src/boundary-field-scout.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

test("sourced field leads are deterministic and nobody is declared a donor",()=>{
 const a=compileFieldScout(),b=compileFieldScout();
 assert.deepEqual(a,b);assert.equal(a.entries.length,4);
 assert.equal(a.contactsSent,0);assert.equal(a.acceptedOffers,0);assert.equal(a.repairsCompleted,0);
 assert.equal(a.knownECMsAvailable,0);assert.equal(a.knownInterfacesLoanable,0);
 assert.ok(a.entries.every(e=>e.status==="UNCONTACTED" && !e.permissionToSend &&
   !e.actualDonor&&!e.actualLoan&&!e.confirmedCompatible&&!e.sourceIsInventoryEvidence));
 assert.ok(a.entries.every(e=>e.source.startsWith("https://")));
 assert.ok(a.entries.every(e=>e.ask.length>35));
});
test("two crossing needs map to source-grounded questions, no false Ford ECM compatibility",()=>{
 const s=compileFieldScout();
 assert.deepEqual([...new Set(s.entries.map(e=>e.resourceId))].sort(),
   ["interface-access","possible-ecm"]);
 assert.ok(s.entries.find(e=>e.id==="navistar-mankato").ask.includes("SID903"));
 assert.ok(s.entries.find(e=>e.id==="streamline-faribault").ask.includes("J1708/J1939"));
 assert.ok(!JSON.stringify(s).includes("F-150"));
 assert.ok(!JSON.stringify(s).includes("firmware downloaded"));
});
test("unsafe or made-up candidates do not enter the scout",()=>{
 for(const patch of [
  {id:"navistar-mankato"},
  {id:"invalid",source:"http://untrusted.example/docs"},
  {id:"unknown",role:"guaranteed-donor"},
  {id:"unknown",resourceId:"imaginary-transfer"},
 ]){
  assert.throws(()=>compileFieldScout(undefined,[FIELD_LEADS[0],{...FIELD_LEADS[1],...patch}]),/INVALID_SOURCED_FIELD_LEAD/);
 }
});
test("JAR;VIS localhost has a read-only public-source lead inventory, not a mail sender",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"jarvis-field-scout-"));
 let server;
 try{
  server=await startWorkbenchServer({journalPath:join(dir,"workbench.jsonl"),port:0});
  const r=await fetch(server.url+"/api/boundary/field-scout-002");
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.mode,"READ_ONLY_RESEARCH");
  assert.equal(body.contactsSent,0);
  assert.equal(body.entries.length,4);
  const html=await (await fetch(server.url+"/workshop")).text();
  assert.match(html,/Show uncontacted local leads/);
  assert.equal(server.app.state().events.length,0);
 }finally{
  if(server)await server.close();
  await rm(dir,{recursive:true,force:true});
 }
});
