import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {inspectEmbodied,inspectEmbodiedReceipt,EMBODIED_SOURCE_COMMIT} from "../src/motif-embodied-resource.mjs";
import {inspectRealityIron} from "../src/motif-reality-iron.mjs";

test("GHOT native measured resources enter JAR;VIS as source-pinned evidence not token credits",async()=>{
 const x=await inspectEmbodied();
 assert.equal(x.schema,"jarvis.motif-physical-resource-witness/v1");
 assert.equal(x.sourceCommit,EMBODIED_SOURCE_COMMIT);
 assert.equal(x.repeatQuestions,250);
 assert.equal(x.reparseCpuNs,100424701);
 assert.equal(x.reuseCpuNs,28376628);
 assert.equal(x.observedCpuNsDifference,72048073);
 assert.equal(x.bytesReadBoth,2426750);
 assert.equal(x.measuredJoules,null);
 assert.equal(x.modeledCostInCredits,false);
 assert.equal(x.automaticPromotion,false);
 assert.equal(x.realRemoteExecution,false);
 const combined=await inspectRealityIron();
 assert.deepEqual(combined.embodiedResources,x);
});
test("a false Watts, promoted candidate or modified CPU reading is refused",async()=>{
 const raw=JSON.parse(await readFile(new URL("../integrations/motif-resource-020/embodied-resource-2026-11-05.json",import.meta.url)));
 assert.ok(inspectEmbodiedReceipt(raw));
 for(const mutate of [
  x=>{x.measured_work.electrical_energy_joules=0;},
  x=>{x.automatic_promotion=true;},
  x=>{x.measured_work.reuse_median_cpu_ns=1;},
  x=>{x.GHOT_actual_execution=true;},
  x=>{x.disposition="AUTO_PROVED";},
 ]){
  const tmp=structuredClone(raw);mutate(tmp);
  assert.throws(()=>inspectEmbodiedReceipt(tmp),/HOLD/);
 }
});
