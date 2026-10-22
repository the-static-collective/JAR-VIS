import { createHash } from "node:crypto";

const sha = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
const HEX = /^[a-f0-9]{64}$/;
const LOADOUT = "dd5456d45946271e2d20d1dc6145b71576d2380b";
const WORKBENCH = "460b3788d01ec068001b5708654c045d2566532a";
const OPENMANUS = "3309bf4e416fb1c74b008f3e86494439a31bad53";

function refuse(condition, why) {
  if (!condition) throw Object.assign(new Error("Native testimony refused: " + why), { status: 400 });
}
const isRecord = (x) => x && typeof x === "object" && !Array.isArray(x);

export function inspectNativeTestimony(report, at = new Date().toISOString()) {
  refuse(isRecord(report) && report.schema === "jarvis.house-party-live-testimony/v0", "invalid schema");
  refuse(typeof report.party_id === "string" && /^native-[a-f0-9]{32}$/.test(report.party_id), "invalid ID");
  refuse(report.specimen === "fictional-table-road-card" && report.disposition === "HOLD_HUMAN_REVIEW", "invalid scope");
  refuse(isRecord(report.native_pins) &&
    report.native_pins.loadout === LOADOUT &&
    report.native_pins.workbench === WORKBENCH &&
    report.native_pins.openmanus === OPENMANUS, "source pins mismatch");
  refuse(typeof report.card === "string" && Buffer.byteLength(report.card, "utf8") < 3001 &&
    typeof report.review === "string" && Buffer.byteLength(report.review, "utf8") < 2501,
    "card or review oversized");
  refuse(HEX.test(report.card_sha256) && sha(report.card) === report.card_sha256 &&
    HEX.test(report.review_sha256) && sha(report.review) === report.review_sha256,
    "content digest mismatch");
  const c = report.card.toLowerCase();
  refuse(["draft", "fictional", "waseca", "produce", "permission", "human"].every(s => c.includes(s)) &&
    /\b12\s+boxes\b/i.test(report.card) && /\b20\s+boxes\b/i.test(report.card),
    "card content is missing bounded factual requirements");
  refuse(!/https?:\/\/|www\.|mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\bvenmo\b|\bcashapp\b|\bpaypal\b/i.test(report.card),
    "card contains external links or payments");
  refuse(report.review.startsWith("HOLD_HUMAN_REVIEW") &&
    !/\b(PUBLISH_APPROVED|ALREADY_PUBLISHED|REAL_CONSENT_VERIFIED)\b/.test(report.review),
    "review contains unsupported authority");
  refuse(Array.isArray(report.guests) && report.guests.length === 2 &&
    report.guests[0].role === "DRAFTER" && report.guests[1].role === "REVIEWER" &&
    report.guests.every(g => typeof g.guest_id === "string" && /^[a-f0-9]{32}$/.test(g.guest_id) &&
      g.provider === "original-openmanus-worker" && g.loadout_compiled === true &&
      g.provider_receipt_disposition === "COMPLETED") &&
    report.guests[0].guest_id !== report.guests[1].guest_id, "guest claims malformed");
  refuse(Array.isArray(report.elf_copies) && report.elf_copies.length === 2 &&
    report.elf_copies.every(x => x.original_elf_verified === true &&
      x.model_executed_in_elf === false && /^[a-f0-9]{32}$/.test(x.occurrence_id) &&
      HEX.test(x.receipt_sha256) && HEX.test(x.artifact_sha256)) &&
    report.elf_copies[0].occurrence_id !== report.elf_copies[1].occurrence_id &&
    report.elf_copies[0].artifact_sha256 === report.card_sha256 &&
    report.elf_copies[1].artifact_sha256 === report.review_sha256,
    "ELF copy claims malformed");
  refuse(isRecord(report.authority) &&
    [
      "human_permission_to_publish", "receiver_admission", "models_executed_within_elf",
      "signed_relatte_receipts", "os_sandbox_verified"
    ].every(k => report.authority[k] === false), "authority claim forbidden");
  refuse(typeof at === "string" && Number.isFinite(Date.parse(at)), "invalid time");
  return {
    schema: "jarvis.native-testimony-observation/v0",
    importedAt: at,
    importedId: report.party_id,
    validation: "FORMAT_AND_DIGEST_CHECK_ONLY",
    verification: "UNVERIFIED_OPERATOR_TESTIMONY",
    disclaimer: "A JSON file and digest cannot authenticate a model invocation, ELF producer, or issuer. Original native on-disk evidence must be cold-verified separately.",
    disposition: "HOLD_HUMAN_REVIEW",
    card: report.card,
    cardSha256: report.card_sha256,
    review: report.review,
    reviewSha256: report.review_sha256,
    claimedGuests: report.guests.map(g => ({
      guestId: g.guest_id, role: g.role, provider: g.provider,
      claimedLoadoutCompile: g.loadout_compiled
    })),
    claimedElfCopies: report.elf_copies.map(x => ({
      occurrenceId: x.occurrence_id, claimedOriginalElfVerified: x.original_elf_verified,
      receiptSha256: x.receipt_sha256
    })),
    published: false,
    admitted: false
  };
}
