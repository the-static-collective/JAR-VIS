// Pure authorization-neutral reviewer-triage transition plan.
// Independent human attestation is not identity verification or permission to publish.
const allowed = {
 start: { from: ["PENDING"], to: "SCREENING", audit: "REVIEW_STARTED" },
 conflict_clear: { from: ["SCREENING"], to: "SCREENING", audit: "CONFLICT_CLEARED" },
 conflict_hold: { from: ["SCREENING"], to: "SCREENING", audit: "CONFLICT_HOLD" },
 invite: { from: ["SCREENING"], to: "INVITED", audit: "INVITATION_REQUESTED" },
 accept: { from: ["INVITED"], to: "ACCEPTED", audit: "ACCEPTANCE_RECORDED" },
 decline: { from: ["PENDING","SCREENING","INVITED","ACCEPTED"], to: "DECLINED", audit: "DECLINED" },
 close: { from: ["ACCEPTED","DECLINED"], to: "CLOSED", audit: "CLOSED" }
};
export const TRIAGE_DECISIONS = Object.freeze(Object.keys(allowed));
export function planTriage(current, decision, flags = {}) {
 const spec = allowed[decision];
 if (!spec) return { allowed: false, why: "INVALID_TRIAGE" };
 if (!current || current.status === "WITHDRAWN") return { allowed:false, why:"MISSING_OR_WITHDRAWN" };
 if (!spec.from.includes(current.status)) return { allowed:false, why:"INVALID_STAGE_FOR_TRANSITION" };
 if (decision==="conflict_clear" && flags.conflictCheckConfirmed!==true) return { allowed:false, why:"CONFLICT_SCREENING_ATTESTATION_REQUIRED" };
 if (decision==="invite" && current.conflict_disposition!=="NO_KNOWN_CONFLICT_REVIEWED") return { allowed:false, why:"CONFLICT_REVIEW_REQUIRED" };
 if (decision==="invite" && flags.humanContactConfirmed!==true) return { allowed:false, why:"HUMAN_INVITATION_ATTESTATION_REQUIRED" };
 if (decision==="accept" && flags.humanConsentConfirmed!==true) return { allowed:false, why:"RECIPIENT_ACCEPTANCE_ATTESTATION_REQUIRED" };
 const patch = { status:spec.to };
 if (decision==="conflict_clear") patch.conflict_disposition="NO_KNOWN_CONFLICT_REVIEWED";
 if (decision==="conflict_hold") patch.conflict_disposition="CONFLICT_HOLD";
 return { allowed:true, patch, audit:spec.audit, verified:false, public:false,
  recipientAcceptanceOnlyClaimed:decision==="accept" };
}
