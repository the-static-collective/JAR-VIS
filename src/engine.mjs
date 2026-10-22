import { createHash } from "node:crypto";

const PARTICULAR = "jarvis.particular/v0";
const PROPOSAL = "jarvis.proposal/v0";
const GRANT = "jarvis.grant/v0";
const RECEIPT = "jarvis.receipt/v0";
const ACTION = "kinship.mock.broadcast/v0";
const AUDIENCE = "garden-waseca-demo";

const copy = (v) => structuredClone(v);
const hash = (kind, fields) =>
  createHash("sha256")
    .update("JARVIS-GENESIS-001|" + kind + "|" + JSON.stringify(fields))
    .digest("hex");
const isTime = (x) => typeof x === "string" && Number.isFinite(Date.parse(x));
const fail = (why) => { throw new Error(why); };

export function validateParticular(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("Invalid particular");
  const fields = ["id", "kind", "steward", "category", "region", "quantity", "unit", "status", "label", "schema"];
  if (Object.keys(p).some((key) => !fields.includes(key))) fail("Unknown particular field");
  if (p.schema !== PARTICULAR || !["need", "offer"].includes(p.kind) ||
      !["open", "held", "closed"].includes(p.status) ||
      !Number.isSafeInteger(p.quantity) || p.quantity < 1) fail("Invalid particular schema");
  for (const key of ["id", "steward", "category", "region", "unit", "label"]) {
    if (typeof p[key] !== "string" || !p[key].trim()) fail("Missing particular field: " + key);
  }
  if (Object.keys(p).length !== fields.length) fail("Missing particular fields");
  return true;
}

export class Jar {
  #records = new Map();
  constructor(records = []) {
    for (const record of records) this.add(record);
  }
  add(record) {
    validateParticular(record);
    if (this.#records.has(record.id)) fail("Duplicate particular: " + record.id);
    this.#records.set(record.id, copy(record));
  }
  get(id) {
    const record = this.#records.get(id);
    return record ? copy(record) : null;
  }
  list(kind) {
    return [...this.#records.values()]
      .filter((p) => !kind || p.kind === kind)
      .map(copy)
      .sort((a, b) => a.id.localeCompare(b.id, "en"));
  }
}

const compatible = (need, offer) =>
  need?.kind === "need" && need.status === "open" &&
  offer?.kind === "offer" && offer.status === "open" &&
  need.steward !== offer.steward &&
  need.category === offer.category &&
  need.region === offer.region &&
  need.unit === offer.unit &&
  offer.quantity >= need.quantity;

export function observe(jar) {
  return { needs: jar.list("need"), offers: jar.list("offer") };
}

export function understand(jar, needId) {
  const need = jar.get(needId);
  if (!need || need.kind !== "need" || need.status !== "open") return null;
  const offer = jar.list("offer").find((candidate) => compatible(need, candidate));
  return offer ? { need, offer, reason: "same category, region, unit; capacity meets quantity" } : null;
}

function snapshot(need, offer) {
  return hash("snapshot", [need, offer]);
}

export function propose(jar, needId, { at = new Date().toISOString() } = {}) {
  if (!isTime(at)) fail("Invalid proposal time");
  const found = understand(jar, needId);
  if (!found) return null;
  const { need, offer, reason } = found;
  const body = {
    schema: PROPOSAL,
    needId: need.id,
    offerId: offer.id,
    action: ACTION,
    audience: AUDIENCE,
    stewards: [need.steward, offer.steward],
    snapshot: snapshot(need, offer),
    reason,
    createdAt: at
  };
  return { ...body, id: "jarvis-proposal-v0:" + hash("proposal", body) };
}

export function makeGrant({ proposal, steward, expiresAt }) {
  // DEMO ONLY: caller asserts permission after asking the person. No authentication.
  if (!isTime(expiresAt)) fail("Invalid expiry");
  return {
    schema: GRANT,
    proposalId: proposal.id,
    issuedBy: steward,
    action: proposal.action,
    audience: proposal.audience,
    decision: "approve",
    expiresAt
  };
}

export function authorizationReasons(jar, proposal, grants, now) {
  const reasons = [];
  if (!proposal || proposal.schema !== PROPOSAL || !isTime(proposal.createdAt)) return ["invalid proposal"];
  const { id, ...body } = proposal;
  if (id !== "jarvis-proposal-v0:" + hash("proposal", body)) reasons.push("proposal identity mismatch");
  if (proposal.action !== ACTION || proposal.audience !== AUDIENCE) reasons.push("unsupported action or audience");
  const need = jar.get(proposal.needId);
  const offer = jar.get(proposal.offerId);
  if (!compatible(need, offer) || snapshot(need, offer) !== proposal.snapshot ||
      JSON.stringify([need?.steward, offer?.steward]) !== JSON.stringify(proposal.stewards)) {
    reasons.push("stale or incompatible particular snapshots");
  }
  const nowMs = Date.parse(now);
  if (!isTime(now)) reasons.push("invalid clock");
  if (Date.parse(proposal.createdAt) > nowMs) reasons.push("proposal created in the future");
  if (!Array.isArray(grants)) return [...reasons, "grants must be a list"];
  if (grants.length !== 2 || new Set(grants.map((g) => g?.issuedBy)).size !== 2) {
    reasons.push("two distinct steward grants required");
  }
  for (const steward of proposal.stewards ?? []) {
    const grant = grants.find((candidate) => candidate?.issuedBy === steward);
    if (!grant) { reasons.push("missing grant from " + steward); continue; }
    if (grant.schema !== GRANT || grant.proposalId !== proposal.id ||
        grant.action !== ACTION || grant.audience !== AUDIENCE ||
        grant.decision !== "approve" || !isTime(grant.expiresAt) ||
        Date.parse(grant.expiresAt) <= nowMs) reasons.push("invalid or expired grant from " + steward);
  }
  return [...new Set(reasons)];
}

export class MockKinshipRelay {
  #outbox = new Map();
  send(proposal, need, offer) {
    if (this.#outbox.has(proposal.id)) return { ...copy(this.#outbox.get(proposal.id)), duplicate: true };
    const message = {
      schema: "kinship.mock/v0",
      proposalId: proposal.id,
      audience: proposal.audience,
      needId: need.id,
      offerId: offer.id,
      summary: "MOCK: proposed " + need.quantity + " " + need.unit + " of " + need.category + " in " + need.region,
      transmittedExternally: false
    };
    this.#outbox.set(proposal.id, message);
    return { ...copy(message), duplicate: false };
  }
  get outbox() { return [...this.#outbox.values()].map(copy); }
}

function receipt(proposal, kind, reasons, at, duplicate = false) {
  const body = {
    schema: RECEIPT,
    proposalId: proposal?.id ?? null,
    kind,
    semanticEffect: "none",
    externalDelivery: false,
    duplicate,
    reasons,
    createdAt: at
  };
  return { ...body, id: "jarvis-receipt-v0:" + hash("receipt", body) };
}

export function cross({ jar, proposal, grants = [], relay, at = new Date().toISOString() }) {
  if (!relay || !(relay instanceof MockKinshipRelay)) fail("Genesis only allows MockKinshipRelay");
  const reasons = authorizationReasons(jar, proposal, grants, at);
  if (reasons.length) {
    const outcome = receipt(proposal, "HOLD", reasons, at);
    return { receipt: outcome, message: null, returnText: "HOLD: no action was sent. " + reasons.join("; ") };
  }
  const message = relay.send(proposal, jar.get(proposal.needId), jar.get(proposal.offerId));
  const outcome = receipt(proposal, "MOCK_RELAYED", [], at, message.duplicate);
  return {
    receipt: outcome,
    message,
    returnText: message.duplicate ?
      "RETURN: mock proposal already present; no duplicate relay." :
      "RETURN: recorded in a process-local mock Kinship outbox; nothing was externally sent."
  };
}
