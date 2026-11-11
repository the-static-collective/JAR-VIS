// MOTIF ORG-002: local-only, untrusted-file crossing into JAR;VIS HOLD.
// No legal status, official identity, public position, consent, or projected
// intervention is authenticated by this adapter.
const KINDS = new Set(["funding_lapse", "negotiated_impasse", "capacity_loss", "statutory_pause", "unknown_delay"]);
const EVIDENCE = new Set(["none", "documented_public_position", "documented_action", "attributed_claim"]);
const ID = /^[A-Za-z0-9_][A-Za-z0-9_-]{0,80}$/;
const HOLD = "HOLD_FOR_SCOPE_AUTHORITY_AND_EVIDENCE";
const COMPARABLE = "CONDITIONALLY_COMPARABLE_NOT_AUTHORIZED";
export const MANUAL_SOURCE_PIN = "248b2b71356a7a177a12bf10fe5900c2b8fffacf";

const record = x=>x!==null && typeof x==="object" && !Array.isArray(x);
const numeric = x=>typeof x==="number" && Number.isFinite(x) && x>=0 && x<=36500;
function reject(message) {throw Error("HOLD_ORG002_" + message);}

export function parseOrg002LocalFile(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength<80 || bytes.byteLength>65536) reject("PACKET_SIZE");
  try {return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}
  catch {reject("INVALID_JSON");}
}

export function receiveOrg002Report(report) {
  if (!record(report) || report.kind!=="MOTIF_ORG_002_RESULT" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(report.as_of||"") ||
      typeof report.modeled_outcome!=="string" || !numeric(report.baseline_forecast_days))
    reject("INVALID_REPORT");

  const receipt=report.return_receipt;
  if (!record(receipt) || receipt.status!=="UNVERIFIED_HYPOTHETICAL_SIMULATION" ||
      receipt.human_authority_required!==true || receipt.not_measured_real_outcomes!==true ||
      receipt.no_outside_action!==true || receipt.all_alternatives_hold!==true ||
      receipt.source_authentication!=="NOT_PERFORMED")
    reject("AUTHORITY_CLAIM");

  const events=report.shock_scenarios;
  if (!Array.isArray(events) || !events.length || events.length>20) reject("EVENT_LIMIT");
  const seen=new Set();
  const cards = [];
  for (const event of events) {
    if (!record(event) || !ID.test(event.shock_id||"") || seen.has(event.shock_id) ||
        !KINDS.has(event.type) || !EVIDENCE.has(event.source_classification) ||
        event.not_a_motive_verdict!==true || !numeric(event.disrupted_forecast_days) ||
        !Array.isArray(event.sources) || event.sources.length>12)
      reject("SHOCK_NOT_PROVISIONAL");
    if (event.source_classification!=="none" && !event.sources.length) reject("MISSING_ATTRIBUTION");
    seen.add(event.shock_id);
    if (!Array.isArray(event.alternative_routes) || event.alternative_routes.length>24)
      reject("ROUTE_LIMIT");
    const routes=new Set();
    for (const route of event.alternative_routes) {
      if (!record(route) || !ID.test(route.id||"") || routes.has(route.id) ||
          route.authority!=="HUMAN_REVIEW_REQUIRED" || route.disposition!==HOLD ||
          typeof route.comparison!=="string" || !numeric(route.route_forecast_days))
        reject("UNAUTHORIZED_ROUTE");
      routes.add(route.id);
      const comparable=route.comparison===COMPARABLE;
      if (comparable && (typeof route.conditional_days_difference!=="number" ||
          !Number.isFinite(route.conditional_days_difference))) reject("INVALID_DELTA");
      if (!comparable && route.conditional_days_difference!==null) reject("NONCOMPARABLE_DELTA");
      // Only structural IDs and hypothetical arithmetic cross, never action text or sources.
      cards.push({
        shockId:event.shock_id, routeId:route.id,
        conditionalDaysDifference:comparable?route.conditional_days_difference:null,
        comparison:route.comparison,
        disposition:"HOLD_FOR_OPERATOR_REVIEW",
        externalContact:false, independentAuthorization:false,
        allowedEffect:"NONE"
      });
    }
  }
  return {
    kind:"jarvis.motif-org002-impasse-triage/v0",
    sourceStatus:"UNAUTHENTICATED_LOCAL_OPERATOR_FILE",
    sourcePinForManualReview:MANUAL_SOURCE_PIN,
    admission:"NONE", persisted:false, sentExternally:false,
    claimsAboutOfficialMotives:"NONE",
    scope:"LOCAL_ONLY", disposition:"HOLD_FOR_OPERATOR_REVIEW",
    scenarioCount:events.length, candidates:cards,
    warning:"Hypothetical timeline differences only; verify separate lawful authority, safety, consent, funding and beneficiary equivalence"
  };
}
