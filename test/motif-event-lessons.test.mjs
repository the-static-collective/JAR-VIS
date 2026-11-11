import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {inspectEventLearning,checkEventLessons,EVENT_SOURCE_COMMIT} from "../src/motif-event-lessons.mjs";
import {inspectRealityIron} from "../src/motif-reality-iron.mjs";

const eventFile=new URL("../integrations/motif-reality-017/actual-event-2026-11-05.json",import.meta.url);
const lessonsFile=new URL("../integrations/motif-reality-017/learned-constraints-2026-11-05.json",import.meta.url);
test("a physical historic flood can falsify a new cautious diagnostic as well as an old model",async()=>{
  const witness=await inspectEventLearning();
  assert.equal(witness.schema,"jarvis.motif-event-learning-witness/v1");
  assert.equal(witness.provenance.sourceCommit,EVENT_SOURCE_COMMIT);
  assert.equal(witness.data.observedCompleteHours,117);
  assert.equal(witness.data.calendarHours,264);
  assert.equal(witness.data.risingFlowObservedHours,32);
  assert.equal(witness.data.fallbackHours,74);
  assert.equal(witness.data.originalSelectedMaeCfs,1293.022);
  assert.equal(witness.data.cautiousMaeCfs,1966.8894);
  assert.equal(witness.data.persistenceMaeCfs,2027.3504);
  assert.equal(witness.data.cautiousExtraErrorCfs,673.8674);
  assert.equal(witness.learned.lessonSummaries.length,3);
  assert.equal(witness.learned.nextResearch.length,3);
  assert.equal(witness.independentPhysicalVerification,false);
  assert.equal(witness.automaticPromotion,false);
  const composite=await inspectRealityIron();
  assert.deepEqual(composite.eventLearning,witness);
});
test("tampering with the event labels, automatic action or self-diagnostic win is refused",async()=>{
  const raw=JSON.parse(await readFile(eventFile,"utf8"));
  const lessons=JSON.parse(await readFile(lessonsFile,"utf8"));
  const baseline=checkEventLessons(raw,lessons);
  assert.equal(baseline.dispatch,false);
  for(const edit of [
    x=>{x.authority=true;},
    x=>{x.candidate_event_mae_cfs.cautious_selection=1;},
    x=>{x.complete_hour_coverage.available_complete_hours=264;},
    x=>{x.policies_frozen.legacy_validation_winner="persistence";}
  ]){
    const trial=structuredClone(raw);
    edit(trial);
    assert.throws(()=>checkEventLessons(trial,lessons),/HOLD/);
  }
  const fake=structuredClone(lessons);
  fake.caution_outperformed_legacy_on_017=true;
  assert.throws(()=>checkEventLessons(raw,fake),/HOLD/);
});
