// Inheritance needs reviewers, so finding one is legitimate useful work.
// This is triage and discovery, never identity proof, an assignment, or permission to publish.
export const REVIEW_SEAT_SCHEMA = "jarvis.reviewer-seat/v0";
const EXPERTISE = new Set(["process","evidence","logistics","privacy","safety","community"]);
const copy = (v) => structuredClone(v);

export function deriveReviewSeat(record, requiredExpertise = "process") {
  if (!record || typeof record.id !== "string" || !EXPERTISE.has(requiredExpertise)) {
    throw new Error("Invalid review-seat request");
  }
  if (!record.commitment || record.review) return null;
  const request = {
    schema: REVIEW_SEAT_SCHEMA,
    weaveId: record.id,
    requiredExpertise,
    generalRegion: record.region || "Not specified",
    reason: record.report ? "Independent examination of a reported outcome is needed." :
      "Recruit a suitable independent reviewer before work is reported.",
    priority: record.report ? "REVIEW_WAITING" : "REVIEW_DISCOVERY",
    status: "LOCAL_CANDIDATE_HOLD",
    publicSafe: false,
    publicPublicationApproved: false,
    volunteerAssignmentAuthorized: false,
    reviewerIndependenceEstablished: false
  };
  return copy(request);
}

export function triageReviewCandidates(seat, candidates = [], steward = "") {
  if (seat?.schema !== REVIEW_SEAT_SCHEMA || !Array.isArray(candidates) || candidates.length > 250) {
    throw new Error("Invalid review discovery input");
  }
  const matched = [];
  for (const p of candidates) {
    if (!p || p.role !== "reviewer" || p.consentToMatch !== true || p.status !== "PENDING" ||
        p.capability !== seat.requiredExpertise) continue;
    if (typeof p.alias !== "string" || !p.alias.trim() ||
        p.alias.trim().toLocaleLowerCase("en") === String(steward).trim().toLocaleLowerCase("en")) continue;
    const reasons = [];
    if (p.independence !== "no_known_conflict") reasons.push("CONFLICT_NOT_CLEARED");
    if (p.region !== seat.generalRegion && p.region !== "Remote / Southern Minnesota") reasons.push("REGION_TO_CONFIRM");
    reasons.push("IDENTITY_NOT_VERIFIED", "VOLUNTARY_ACCEPTANCE_NOT_RECORDED");
    matched.push({
      candidateId: p.id ?? null,
      alias: p.alias,
      suggested: reasons.length === 2,
      status: "POTENTIAL_ONLY",
      reasons,
      independentlyVerified: false,
      admitted: false,
      externalContact: false
    });
  }
  return matched.sort((a, b) => Number(b.suggested) - Number(a.suggested) ||
    String(a.alias).localeCompare(String(b.alias))).map(copy);
}
