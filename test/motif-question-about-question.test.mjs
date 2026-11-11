import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {inspectQuestionAboutQuestion,verifyQuestionAboutQuestion,MOTIF019_SOURCE} from "../src/motif-question-about-question.mjs";
import {inspectRealityIron} from "../src/motif-reality-iron.mjs";

async function source(){
 const loop=JSON.parse(await readFile(new URL("../integrations/motif-reality-019/question-evolution-2026-11-05.json",import.meta.url)));
 const result=JSON.parse(await readFile(new URL("../integrations/motif-reality-019/march-outcome-2026-11-05.json",import.meta.url)));
 return {loop,result};
}
test("source-pinned 019 demonstrates a fallible question-cost objective, not a clever new prediction",async()=>{
 const value=await inspectQuestionAboutQuestion();
 assert.equal(value.schema,"jarvis.motif-question-about-question/v1");
 assert.equal(value.sourceCommit,MOTIF019_SOURCE);
 assert.equal(value.frozenQuestion,"downstream");
 assert.equal(value.downstreamCases,300);
 assert.equal(value.blueAvailableCases,35);
 assert.equal(value.sueurAvailableCases,116);
 assert.equal(value.selectedModelMaeCfs,185.3333);
 assert.equal(value.sourceHealthModelMaeCfs,150.4962);
 assert.equal(value.assumedCreditPriceCfsEquiv,37.382353);
 assert.equal(value.posthocHealthBreakEvenCreditCfsEquiv,18.8795);
 assert.equal(value.phases.length,6);
 assert.equal(value.phases[1].changed,true);
 assert.equal(value.phases[4].questionKind,"source_health");
 assert.match(value.deeperQuestion,/prices the WRONG question/i);
 assert.equal(value.automaticPromotion,false);
 assert.equal(value.independentPhysicalVerification,false);
 const combined=await inspectRealityIron();
 assert.deepEqual(combined.questionAboutQuestion,value);
});
test("relabeling the failure as success, changing declared value, or claiming issue-time health fails",async()=>{
 const {loop,result}=await source();
 assert.ok(verifyQuestionAboutQuestion(loop,result));
 for(const mutate of [
  r=>{r.hypothesis_state="PROVED_QUESTION_VALUE";},
  r=>{r.sensor_health_really_queried_at_issue_time=true;},
  r=>{r.self_diagnostic_on_assumed_cost_of_questions.frozen_question_credit_price_cfs_equivalent=1;},
  r=>{r.frozen_policy_mae_cfs=100;},
  r=>{r.downstream_complete_case_population.upstream_present_feature_hours.blue=300;}
 ]){
  const fake=structuredClone(result);mutate(fake);
  assert.throws(()=>verifyQuestionAboutQuestion(loop,fake),/HOLD/);
 }
 const forged=structuredClone(loop);
 forged.stages[4].new_kind="AUTONOMOUS_CODE_REWRITE";
 assert.throws(()=>verifyQuestionAboutQuestion(forged,result),/HOLD/);
});
