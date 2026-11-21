// ORG-001: independent, local-only intake of a human-supplied MOTIF diagnostic.
// Parsing is not authentication. No action, contact, persistence, or admission.
export const MOTIF_ORG001_SOURCE = "https://github.com/the-static-collective/MOTIF/tree/experiment/org001-throughput-of-help-20261111/experiments/org001";
export const MOTIF_ORG001_REVIEWED_COMMIT = "6affa0cabf07c3aa74877324e3eeef3465571ab1";
const KEYS = ["id","producer","receiver_candidates","scope","disclosure","state","summary","hypothesis","modeled_days_saved"];
const SOURCE_KIND = "MOTIF_ORG_001_DIAGNOSTIC";
const ID = /^[A-Za-z0-9_][A-Za-z0-9_-]{0,80}$/;

function hold(message) { throw new Error("HOLD_" + message); }
const record = x => !!x && typeof x === "object" && !Array.isArray(x);

export function parseMotifOrg001File(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 50 || bytes.byteLength > 65536)
    hold("ORG001_PACKET_SIZE");
  try { return JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(bytes)); }
  catch { hold("ORG001_INVALID_JSON"); }
}

export function receiveMotifOrg001(report) {
  if (!record(report) || report.kind !== SOURCE_KIND || !ID.test(report.world_id || ""))
    hold("ORG001_UNKNOWN_SOURCE");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(report.as_of || "") || typeof report.outcome !== "string")
    hold("ORG001_INVALID_SCOPE");
  if (!record(report.receipts) || report.receipts.no_external_actions !== true ||
    report.receipts.no_permission_inferred_from_silence !== true ||
    report.receipts.observations_are_not_confirmations !== true)
    hold("ORG001_AUTHORITY_CLAIM");
  const cards = report.local_handoff_drafts;
  if (!Array.isArray(cards) || cards.length > 24 || !cards.length)
    hold("ORG001_NO_REVIEWABLE_CARDS");
  const seen = new Set();
  const candidates = cards.map(c => {
    if (!record(c) || Object.keys(c).sort().join("|") !== KEYS.slice().sort().join("|"))
      hold("ORG001_UNKNOWN_CARD_FIELDS");
    if (typeof c.id !== "string" || !ID.test(c.id) || seen.has(c.id)) hold("ORG001_DUPLICATE_OR_INVALID_ID");
    seen.add(c.id);
    if (c.producer !== "MOTIF.ORG-001" || c.state !== "HOLD" || c.scope !== "LOCAL_REVIEW_ONLY" ||
        c.disclosure !== "PRIVATE_UNTIL_REVIEWED" ||
        !Array.isArray(c.receiver_candidates) || !c.receiver_candidates.includes("JAR-VIS"))
      hold("ORG001_UNAUTHORIZED_CROSSING");
    if (typeof c.summary !== "string" || c.summary.length > 700 ||
        typeof c.hypothesis !== "string" || c.hypothesis.length > 700 ||
        typeof c.modeled_days_saved !== "number" || !Number.isFinite(c.modeled_days_saved) ||
        c.modeled_days_saved < 0 || c.modeled_days_saved > 36500)
      hold("ORG001_INVALID_HYPOTHESIS");
    return {
      id: c.id, modeledDaysSaved: c.modeled_days_saved,
      disposition: "HOLD_FOR_OPERATOR_REVIEW", independentVerification: false,
      allowedEffect: "NONE", externalContact: false
    };
  });
  return {
    type: "jarvis.motif-org001-local-triage/v0",
    source: SOURCE_KIND,
    pinForManualComparison: MOTIF_ORG001_REVIEWED_COMMIT,
    sourceAuthenticated: false, // exact fields, NOT signature/hash verification
    receivedAs: "UNTRUSTED_LOCAL_OPERATOR_PROVIDED_DATA",
    authority: "NONE", sentExternally: false, stored: false,
    disposition: "HOLD_FOR_OPERATOR_REVIEW", candidates,
    warning: "Conditional declared-days arithmetic only; not observed savings, permission, or accepted organizational status"
  };
}
