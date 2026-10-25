import { createHash } from "node:crypto";

// A portable projection, not a second approval or execution engine.
// Sibling systems may render these five phases without importing JAR;VIS authority.
export const HEARTBEAT_SCHEMA = "jarvis.heartbeat/v0";
export const HEARTBEAT_STAGES = Object.freeze([
  "DISCOVER", "COMPOSE", "ACT", "WITNESS", "RETURN"
]);

const copy = (value) => structuredClone(value);
const digest = (value) => createHash("sha256")
  .update("JARVIS-HEARTBEAT-001|" + JSON.stringify(value)).digest("hex");

export function fixtureWitness({ proposal, outcome, disposition, note, at }) {
  if (proposal?.schema !== "jarvis.proposal/v0" || typeof proposal.id !== "string" ||
      outcome?.proposalId !== proposal.id || outcome.receipt?.kind !== "MOCK_RELAYED" ||
      outcome.receipt?.externalDelivery !== false) {
    throw new Error("A recorded local mock crossing is required before fixture testimony");
  }
  if (!["fixture-complete", "fixture-blocked", "fixture-partial"].includes(disposition)) {
    throw new Error("Unsupported fixture witness disposition");
  }
  if (typeof note !== "string" || note.trim().length < 3 || note.length > 240) {
    throw new Error("Fixture witness note must be 3–240 characters");
  }
  if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) {
    throw new Error("Invalid fixture witness time");
  }
  const body = {
    schema: "jarvis.fixture-witness/v0",
    proposalId: proposal.id,
    disposition,
    note: note.trim(),
    reportedAt: at,
    reporter: "local-demo-operator",
    evidence: "operator-assertion-only",
    verified: false,
    physicalFulfillmentEstablished: false,
    externalPublication: false
  };
  return { ...body, id: "jarvis-fixture-witness-v0:" + digest(body) };
}

export function projectHeartbeat({ match = null, proposal = null, approvedBy = [], outcome = null, witness = null } = {}) {
  const need = match?.need ?? null;
  const offer = match?.offer ?? null;
  const discovered = Boolean(need && offer);
  const composed = discovered && proposal?.needId === need.id && proposal?.offerId === offer.id;
  const approvals = composed && Array.isArray(approvedBy)
    ? [...new Set(approvedBy.filter((v) => proposal.stewards?.includes(v)))]
    : [];
  const mockAct = composed && outcome?.proposalId === proposal.id &&
    outcome?.receipt?.kind === "MOCK_RELAYED" &&
    outcome?.receipt?.externalDelivery === false;
  const reported = mockAct && witness?.proposalId === proposal.id &&
    witness?.schema === "jarvis.fixture-witness/v0" && witness?.verified === false;
  const steps = [
    { stage: "DISCOVER", status: discovered ? "observed" : "unmatched",
      detail: discovered ? "Compatible source particulars selected; still fictional." : "No compatible source pair observed." },
    { stage: "COMPOSE", status: composed ? "proposed" : "waiting",
      detail: composed ? "Scoped local proposal exists; proposal is not permission." : "No scoped proposal has been formed." },
    { stage: "ACT", status: mockAct ? "mock-recorded" : composed && approvals.length === 2 ? "gate-ready-demo" : "hold",
      detail: mockAct ? "Only an in-process mock relay was recorded." :
        composed && approvals.length === 2 ? "Two unverified mock grants present; an operator must dispatch." :
          "No action authorized or dispatched." },
    { stage: "WITNESS", status: reported ? "unverified-fixture-report" : mockAct ? "awaiting-testimony" : "not-started",
      detail: reported ? "Local operator assertion; not evidence of physical fulfillment." :
        "No physical completion has been established." },
    { stage: "RETURN", status: reported ? "local-fixture-return" : mockAct ? "receipt-only" : "not-started",
      detail: reported ? "Fixture result available locally; nothing was published or delivered." :
        "No real-world outcome or distribution is established." }
  ];
  const next = !discovered
    ? "Collect an attributable need and offer; discovery alone is not permission."
    : !composed
      ? "Form a bounded proposal from the matching source records."
      : !mockAct
        ? approvals.length === 2
          ? "The operator may deliberately attempt the mock crossing; no real dispatch is available."
          : "Request separate mock approvals from both fixture stewards; HOLD until then."
        : !reported
          ? "Record a clearly labeled local fixture witness report, or leave the outcome unknown."
          : "Inspect the return with its unverified status; invite a new cycle without promoting it to proof.";
  return copy({
    schema: HEARTBEAT_SCHEMA,
    id: "jarvis-heartbeat-v0:" + digest([need?.id ?? null, offer?.id ?? null, proposal?.id ?? null]),
    source: { needId: need?.id ?? null, offerId: offer?.id ?? null,
      origin: "fictional-local-fixture" },
    proposalId: composed ? proposal.id : null,
    phases: steps,
    current: reported ? "RETURN" : steps.find((step) => ["unmatched", "waiting", "hold", "gate-ready-demo", "awaiting-testimony"].includes(step.status))?.stage ?? "RETURN",
    next,
    mockApprovals: approvals,
    fixtureWitness: reported ? {
      id: witness.id, disposition: witness.disposition, note: witness.note,
      reportedAt: witness.reportedAt, verified: false
    } : null,
    realWorldFulfillment: "not-established",
    externalAction: false
  });
}
