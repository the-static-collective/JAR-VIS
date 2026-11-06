import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {inspectRealityIron,inspectEvidenceBodies,RESEARCH_RECEIPT_COMMIT} from "../src/motif-reality-iron.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

test("real public-source environmental witness bytes are pinned and expose genuine negative evidence",async()=>{
  const report=await inspectRealityIron();
  assert.equal(report.schema,"jarvis.motif-real-environment-witness/v1");
  assert.equal(report.watershed.matchedHours,324);
  assert.equal(report.watershed.test,82);
  assert.equal(report.watershed.selectedOnValidation,"cross_gauges");
  assert.equal(report.watershed.holdoutCandidateCfs,20.9575);
  assert.equal(report.watershed.holdoutPersistenceCfs,13.1402);
  assert.equal(report.watershed.candidateExtraErrorCfs,7.8173);
  assert.equal(report.weather.matchedHours,88);
  assert.equal(report.weather.adjustedExtraErrorC,0.0126);
  assert.equal(report.watershed.disposition,"HOLD_NO_IMPROVEMENT");
  assert.equal(report.weather.disposition,"HOLD_NO_MEASURED_IMPROVEMENT");
  assert.equal(report.upstreamCommit,RESEARCH_RECEIPT_COMMIT);
  assert.equal(report.automaticPromotion,false);
  assert.equal(report.sampledIndependently,false);
  assert.equal(report.realWorldActions,0);
});
test("fake weather or river win, mistaken station IDs or authority are rejected",async()=>{
  const {readFile}=await import("node:fs/promises");
  const water=JSON.parse(await readFile(new URL("../integrations/motif-reality-016/actual-watershed-2026-11-05.json",import.meta.url)));
  const weather=JSON.parse(await readFile(new URL("../integrations/motif-reality-016/actual-weather-2026-11-05.json",import.meta.url)));
  assert.ok(inspectEvidenceBodies(water,weather));
  for(const mutation of [
    w=>{w.authority=true;},w=>{w.provenance.USGS_public_site_ids.blue="USGS-00000000";},
    w=>{w.holdout_mae_cfs.cross_gauges=2;},
    w=>{w.disposition="PROVED_SUPERIOR";},
  ]){
    const copy=structuredClone(water);
    mutation(copy);
    assert.throws(()=>inspectEvidenceBodies(copy,weather),/HOLD/);
  }
  const corrupt=structuredClone(weather);
  corrupt.holdout_mae_c.train_bias_adjusted=0;
  assert.throws(()=>inspectEvidenceBodies(water,corrupt),/HOLD/);
});
test("environment API is public-read-only local endpoint; route comparison returns independent context",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"jarvis-reality-"));
  try{
    const server=await startWorkbenchServer({journalPath:join(dir,"events.jsonl"),port:0});
    try{
      const publicReceipt=await fetch(server.url+"/api/reciprocal/environment");
      assert.equal(publicReceipt.status,200);
      const report=await publicReceipt.json();
      assert.equal(report.authority,false);
      const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
      const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
      const contrast=await fetch(server.url+"/api/reciprocal/compare",{
        method:"POST",headers,body:JSON.stringify({text:"food and music"})});
      assert.equal(contrast.status,200);
      const outcome=await contrast.json();
      assert.equal(outcome.realityIron.watershed.disposition,"HOLD_NO_IMPROVEMENT");
      assert.equal(outcome.assessment.dispatch,false);
      assert.equal(outcome.realityIron.automaticPromotion,false);
    }finally{await server.close();}
  }finally{await rm(dir,{recursive:true,force:true});}
});
