import test from "node:test";
import assert from "node:assert/strict";
import { inspectUsefulDelta } from "../src/useful-delta.mjs";
const base={requestedOutcome:"Diagnose why a washing machine will not drain",claim:"local-work",delivered:[{kind:"procedure",content:"Check an accessible drain hose for a kink, without touching live wiring; read the machine manual before opening a filter."}]};
test("a useful bounded procedure is distinct from a verified repair",()=>{
  assert.deepEqual(inspectUsefulDelta(base),{decision:"LOCAL_WORK_PREPARED",reason:"LOCAL_ARTIFACT_NOT_FIELD_PROOF"});
});
test("make-an-invitation in response to a repair need is an empty handoff",()=>{
  const x=inspectUsefulDelta({...base,delivered:[{kind:"draft",content:"Make a simple invitation."}]});
  assert.equal(x.reason,"EMPTY_HANDOFF");
});
test("a usable prepared invitation is local work when recruiting really is the task",()=>{
  const x=inspectUsefulDelta({requestedOutcome:"Write a volunteer request for setting up chairs",
   claim:"local-work",delivered:[{kind:"draft",content:"Could one volunteer help set up chairs Friday? Please reply with your availability; details are not yet confirmed."}]});
  assert.equal(x.decision,"LOCAL_WORK_PREPARED");
});
test("external action never emerges from local work alone",()=>{
  const x=inspectUsefulDelta({...base,claim:"external-complete"});
  assert.deepEqual(x,{decision:"HOLD",reason:"EXTERNAL_EFFECT_UNPROVEN"});
});
test("even independent receipt still requires destination review",()=>{
  const x=inspectUsefulDelta({...base,claim:"external-complete",evidence:[{kind:"receiver-receipt",verification:"independently-verified",ref:"destination-owned-witness-001"}]});
  assert.equal(x.decision,"NEEDS_DESTINATION_REVIEW");
});
test("partial work names the obstacle rather than claiming fulfillment",()=>{
  const x=inspectUsefulDelta({...base,claim:"partial",blocker:"Needs the exact washing-machine model"});
  assert.equal(x.decision,"LOCAL_PARTIAL");
  assert.equal(inspectUsefulDelta({...base,claim:"partial"}).reason,"PARTIAL_WITHOUT_BLOCKER");
});
test("no-capability without a useful artifact remains HOLD even with honest blocker",()=>{
  assert.equal(inspectUsefulDelta({requestedOutcome:"Repair the machine",claim:"no-capability",
     delivered:[],blocker:"No physical access to the machine"}).reason,"HONEST_BLOCKER");
});
test("an unverified external claim cannot hide inside a local label",()=>{
  const x=inspectUsefulDelta({...base,delivered:[{kind:"verified-external-action",content:"We already repaired the washing machine."}]});
  assert.equal(x.reason,"EXTERNAL_EFFECT_MISCLASSIFIED");
});
