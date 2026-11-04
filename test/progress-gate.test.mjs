import test from "node:test";
import assert from "node:assert/strict";
import {inspectProgressGate,inspectLoopChain} from "../src/progress-gate.mjs";
const check=(kind,artifact,body,claim="local-prepared",extras={})=>
 inspectProgressGate({request:{kind,original:"The person explicitly requested a "+kind+" deliverable"},
 artifact:{kind:artifact,body},claim,...extras});
test("repair request cannot finish with a polite ready-to-send invitation",()=>{
 const x=check("repair","ready-message","Could someone help me fix a washing machine? Please respond if you are available.");
 assert.deepEqual([x.decision,x.reason],["HOLD","GOAL_MISMATCH"]);
});
test("a task to write an invitation passes only when a complete message is present",()=>{
 assert.equal(check("invitation","ready-message","Make a simple invitation.").reason,"EMPTY_HANDOFF");
 const x=check("invitation","ready-message","Could one volunteer help arrange chairs on Friday? Please reply with a suitable time.");
 assert.equal(x.decision,"LOCAL_WORK_PREPARED");
 assert.equal(x.reason,"SHAPE_CHECK_ONLY");
});
test("repair procedure counts as prepared work, not a completed physical repair",()=>{
 const x=check("repair","diagnostic-procedure","First check the external drain hose for an accessible kink, without touching live wiring. Stop if water leaks.");
 assert.equal(x.decision,"LOCAL_WORK_PREPARED");
 const claim=check("repair","diagnostic-procedure","First check the external drain hose for an accessible kink, without touching live wiring. Stop if water leaks.","external-complete");
 assert.equal(claim.decision,"NEEDS_OWNER_REVIEW");
});
test("a one-line instruction to make a recipe is not a ready recipe",()=>{
 assert.equal(check("meal","ready-recipe","Write a meal plan.").reason,"EMPTY_HANDOFF");
 assert.equal(check("meal","ready-recipe","Boil water, add rice, and serve when cooked.").reason,"UNTESTED_ARTIFACT_SHAPE");
 const p=check("meal","ready-recipe","INGREDIENTS: cooked beans, tomatoes and water. METHOD: simmer 20 minutes until heated thoroughly.");
 assert.equal(p.decision,"LOCAL_WORK_PREPARED");
});
test("an agenda or complete game may be actual requested work",()=>{
 assert.equal(check("event","run-sheet","00–05 welcome, 05–10 music, 10–25 perform one useful action, 25–30 close and note unverified outcomes.").decision,"LOCAL_WORK_PREPARED");
 assert.equal(check("game","playable-rules","RULES: use one item and one challenge. Each player gets three turns; WIN when a workable move survives.").decision,"LOCAL_WORK_PREPARED");
});
test("partial work names actual missing dependency",()=>{
 const x=check("repair","diagnostic-procedure","Check the accessible label and record the precise error code. Stop for exposed wiring.","partial",
 {blocker:"Exact manufacturer model is not known.",dependsOn:"missing-source"});
 assert.equal(x.decision,"LOCAL_PARTIAL_WITH_ARTIFACT");
 const invalid=check("repair","diagnostic-procedure","Check the accessible label and record the precise error code. Stop for exposed wiring.","partial",
 {blocker:"Exact manufacturer model is not known."});
 assert.equal(invalid.reason,"MISSING_BOUNDARY_OWNER");
});
test("software code without test evidence does not pretend to have passed tests",()=>{
 const out=check("code","code-patch","export function answer() { return 'hello world'; }");
 assert.equal(out.reason,"MISSING_TEST_EVIDENCE_DECLARATION");
 const x=check("code","code-patch","export function answer() { return 'hello world'; }","local-prepared",{evidence:[]});
 assert.equal(x.decision,"LOCAL_WORK_PREPARED");
 assert.match(x.meaning,/Utility remains unverified/);
});
test("empty and invented claims remain HOLD",()=>{
 const no=check("repair","diagnostic-procedure","Check the visible port and stop if damaged.","blocked",{blocker:"No physical access is available."});
 assert.equal(no.decision,"HOLD");
 const fake=check("repair","diagnostic-procedure","Check the visible port and stop if damaged.","verified-world-result");
 assert.equal(fake.reason,"INVALID_STATUS_CLAIM");
});
test("literal self-referential tickets and repeated handoffs are refused",()=>{
 assert.equal(inspectLoopChain([{target:"create card",produced:"create card"}]).reason,"SELF_REFERENTIAL_HANDOFF");
 assert.equal(inspectLoopChain([{target:"fix washer",produced:"write invitation"},{target:"use invitation",produced:"write invitation"}]).reason,"REPEATED_OUTPUT_WITHOUT_NEW_DELIVERABLE");
 assert.equal(inspectLoopChain([{target:"fix washer",produced:"check drain hose"},{target:"check drain hose",produced:"record error code"}]).decision,"STRUCTURAL_ADVANCE_POSSIBLE");
});
