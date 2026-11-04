// PROGRESS-GATE-002 — explicit goal-alignment checks, not automated judgments of truth.
// Operates on locally declared contracts only. This never grants receiver authority.
const EXPECTED=Object.freeze({
 repair:["diagnostic-procedure","fault-isolation"],
 invitation:["ready-message"], meal:["ready-recipe"],
 event:["run-sheet","facilitation-script"], music:["arrangement","performance-script"],
 code:["code-patch","runnable-program"], game:["playable-rules"],
 analysis:["answer","analysis"], skill:["executable-procedure","teaching-script"]
});
const MARKERS=Object.freeze({
 "diagnostic-procedure":/(\b(check|inspect|observe|measure|stop|record)\b)/i,
 "fault-isolation":/(\b(check|inspect|observe|measure|stop|record)\b)/i,
 "ready-message":/(\b(could|can|would|please|offer)\b)/i,
 "ready-recipe":/(\bingredients?\b).*(\bmethod\b|\bheat\b|\bcook\b)/is,
 "run-sheet":/(\b(?:minutes?|00.?\d\d|01.?\d\d|welcome)\b)/i,
 "facilitation-script":/(\bask\b|\bminute\b|\bwelcome\b)/i,
 "arrangement":/(\bverse\b|\bchorus\b|\bbar\b|\bmeasure\b|\btempo\b|\bminute\b)/i,
 "performance-script":/(\bminute\b|\bwelcome\b|\bcue\b)/i,
 "code-patch":/(\bfunction\b|\bexport\b|\bdef\b|\bconst\b|\bclass\b|diff --git)/i,
 "runnable-program":/(\bfunction\b|\bexport\b|\bdef\b|\bconst\b|\bclass\b)/i,
 "playable-rules":/(\brules?\b).*(\bwin\b|\bround\b|\bturn\b)/is,
 "answer":/\S/, "analysis":/\S/,
 "executable-procedure":/(\b(step\b|first\b|1\.|00.?\d\d|start\b))/i,
 "teaching-script":/(\bminute\b|\bdemonstrate\b|\bask\b)/i
});
const META=/^\s*(?:make|prepare|write|create|draft|find|ask someone to make)\s+(?:an?\s+)?(?:(?:simple|meal|event|volunteer|generic)\s+)*(?:invitation|request|card|plan|document|ticket|instructions?|recipe)\s*[.!?]?\s*$/i;
const bounded=(s,max=5000)=>typeof s==="string"&&s.trim().length>0&&s.length<=max;
const fail=(reason)=>({decision:"HOLD",reason,meaning:"No useful completion is established."});

export function inspectProgressGate(spec={}) {
 const r=spec.request, a=spec.artifact;
 if(!r||!EXPECTED[r.kind]||!bounded(r.original,1000)||!a||!bounded(a.body)||
   typeof a.kind!=="string")return fail("INVALID_TASK_CONTRACT");
 if(!EXPECTED[r.kind].includes(a.kind))return fail("GOAL_MISMATCH");
 if(META.test(a.body.trim())||!bounded(a.body,5000))return fail("EMPTY_HANDOFF");
 if(a.body.trim().length<40||!MARKERS[a.kind].test(a.body))return fail("UNTESTED_ARTIFACT_SHAPE");
 if(spec.claim==="external-complete") {
  // Even a receipt-shaped object is not independent verification.
  return {decision:"NEEDS_OWNER_REVIEW",reason:"EXTERNAL_CLAIM_NEEDS_DESTINATION_EVIDENCE",
    meaning:"A local claim cannot attest a real-world consequence."};
 }
 if(spec.claim==="blocked"&&!bounded(spec.blocker,500))return fail("MISSING_EXPLICIT_BLOCKER");
 if(spec.claim==="partial") {
  if(!bounded(spec.blocker,500))return fail("MISSING_EXPLICIT_BLOCKER");
  if(!["human-approval","external-service","missing-source","physical-access","unknown"].includes(spec.dependsOn))
    return fail("MISSING_BOUNDARY_OWNER");
  return {decision:"LOCAL_PARTIAL_WITH_ARTIFACT",reason:"BOUNDED_PROGRESS",
    meaning:"Work exists, but a named unresolved dependency remains."};
 }
 if(spec.claim!=="local-prepared")return fail("INVALID_STATUS_CLAIM");
 if(a.kind==="code-patch"&&!Array.isArray(spec.evidence))return fail("MISSING_TEST_EVIDENCE_DECLARATION");
 // Test evidence may be empty; an empty array proves no test was run.
 return {decision:"LOCAL_WORK_PREPARED",reason:"SHAPE_CHECK_ONLY",
   meaning:"A deliverable of the requested structural type exists. Utility remains unverified."};
}

export function inspectLoopChain(events) {
 if(!Array.isArray(events)||events.length===0||events.length>32) return fail("INVALID_CHAIN");
 // Explicit, owner-declared deliverable targets only: identical repeated meta-output is not progress.
 const normalized=events.map(e=>({
   target:typeof e?.target==="string"?e.target.trim().toLowerCase():"",
   produced:typeof e?.produced==="string"?e.produced.trim().toLowerCase():""
 }));
 if(normalized.some(e=>!e.target||!e.produced))return fail("INVALID_CHAIN");
 for(let i=0;i<normalized.length;i++){
   if(normalized[i].target===normalized[i].produced)
     return fail("SELF_REFERENTIAL_HANDOFF");
   if(i>0&&normalized[i].produced===normalized[i-1].produced)
     return fail("REPEATED_OUTPUT_WITHOUT_NEW_DELIVERABLE");
 }
 return {decision:"STRUCTURAL_ADVANCE_POSSIBLE",reason:"NO_EXACT_META_LOOP_FOUND",
   meaning:"No exact loop detected. This does not establish real progress or correctness."};
}
