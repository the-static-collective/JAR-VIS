import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {inspectProtocolIntegrity,inspectQuestionIntegrity,SOURCE_COMMIT} from "../src/motif-protocol-integrity.mjs";
import {inspectRealityIron} from "../src/motif-reality-iron.mjs";
const file=new URL("../integrations/motif-reality-021/source-question-integrity-2026-11-05.json",import.meta.url);
test("source-pinned protocol failure, corrected source request and real one-query work",async()=>{
 const x=await inspectProtocolIntegrity();
 assert.equal(x.schema,"jarvis.question-protocol-witness/v1");
 assert.equal(x.sourceCommit,SOURCE_COMMIT);
 assert.equal(x.original.actualRequests,3);
 assert.equal(x.original.incorrectlyConcludedFreshness,false);
 assert.equal(x.repaired.sourceFreshCount,3);
 assert.equal(x.conditional.actualRequests,1);
 assert.equal(x.conditional.reportedDischargeCfs,2580);
 assert.equal(x.conditional.responseBodyBytes,270808);
 assert.equal(x.causalSavedNetworkBytesVerified,false);
 assert.equal(x.attributableJoules,null);
 assert.equal(x.automaticPromotion,false);
 const composite=await inspectRealityIron();
 assert.deepEqual(composite.protocolIntegrity,x);
});
test("cannot relabel a false-stale protocol bug as a sensor outage or pretend measured energy",async()=>{
 const original=JSON.parse(await readFile(file,"utf8"));
 for(const mutate of [
  x=>{x.electrical_energy_measured=true;},
  x=>{x.measured_resource_units.causal_network_cost_savings_PROVED=true;},
  x=>{x.observations.first_date_only_interval.qualified_fresh_source_count=3;},
  x=>{x.observations.actual_stop_when_first_fresh.requests_actually_sent=0;},
  x=>{x.observations.actual_stop_when_first_fresh.reported_discharge_cfs=0;},
 ]){
  const f=structuredClone(original);mutate(f);
  assert.throws(()=>inspectQuestionIntegrity(f),/HOLD/);
 }
});
