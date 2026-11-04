// USEFUL-DELTA-001 — optional deterministic output audit; NOT wired into dispatch.
// It checks the shape of a delivered result, not truth, human value, or authority.
const MEANS = new Set(["answer","procedure","draft","code","analysis","plan","verified-external-action"]);
const CLAIM = new Set(["local-work","external-complete","partial","no-capability"]);
const META_ONLY = /^\s*(make|write|create|draft|prepare|plan|generate|ask someone to make)\s+(an?\s+)?(invitation|request|plan|card|document|ticket)\s*[\s.!?]*$/i;
const text = (v,n) => typeof v === "string" && v.trim().length >= n && v.trim().length <= 5000;

export function inspectUsefulDelta({requestedOutcome, claim, delivered, evidence = [], blocker = null} = {}) {
  if (!text(requestedOutcome,3) || !CLAIM.has(claim) ||
      !Array.isArray(delivered) || !Array.isArray(evidence) ||
      (blocker !== null && !text(blocker,5))) return {decision:"HOLD", reason:"MALFORMED"};
  if (delivered.length > 10 || evidence.length > 20) return {decision:"HOLD",reason:"OVERSIZED"};
  const products = delivered.filter(d => d && MEANS.has(d.kind) && text(d.content,30) &&
    !META_ONLY.test(d.content));
  if (claim === "no-capability")
    return {decision:"HOLD",reason: blocker ? "HONEST_BLOCKER" : "MISSING_BLOCKER"};
  if (!products.length) return {decision:"HOLD",reason:"EMPTY_HANDOFF"};
  if (claim === "partial")
    return {decision:blocker ? "LOCAL_PARTIAL" : "HOLD",reason:blocker ? "PARTIAL_WITH_DECLARED_BLOCKER" : "PARTIAL_WITHOUT_BLOCKER"};
  if (claim === "external-complete") {
    // A claimed effect is not independently verified just because a local artifact exists.
    const validReceipt = evidence.some(e => e && e.kind === "receiver-receipt" &&
      e.verification === "independently-verified" && text(e.ref,8));
    return validReceipt
      ? {decision:"NEEDS_DESTINATION_REVIEW",reason:"RECEIPT_PRESENT_NOT_GLOBAL_AUTHORITY"}
      : {decision:"HOLD",reason:"EXTERNAL_EFFECT_UNPROVEN"};
  }
  if (delivered.some(d => d.kind === "verified-external-action"))
    return {decision:"HOLD",reason:"EXTERNAL_EFFECT_MISCLASSIFIED"};
  return {decision:"LOCAL_WORK_PREPARED",reason:"LOCAL_ARTIFACT_NOT_FIELD_PROOF"};
}
