import { createHash, randomUUID } from "node:crypto";
import { understand } from "./engine.mjs";

const PARTY = "jarvis.house-party/v0";
const ARTIFACT = "jarvis.table-road-card/v0";
const OCCURRENCE = "jarvis.party-occurrence/v0";
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const copy = (value) => structuredClone(value);
const refuse = (reason) => { throw new Error(reason); };

const markdown = ({ need, offer }) => [
  "# Table & Road — Garden community card (DRAFT / SYNTHETIC)",
  "",
  "A local community table is looking for " + need.quantity + " " + need.unit + " of " + need.category + ".",
  "A separate demonstration grower has " + offer.quantity + " " + offer.unit + " listed as available.",
  "",
  "Region: " + need.region,
  "Need reference: " + need.id,
  "Offer reference: " + offer.id,
  "",
  "This is a **fictional demonstration**, not a verified food offer or request.",
  "Do not print, publish, coordinate a pickup, or share personal information from this draft.",
  "Human verification and each party's permission are required before any real-world use.",
  ""
].join("\n");

export function inspectCard({ draft, need, offer }) {
  const checks = {
    expectedContext: draft.source.needId === need.id && draft.source.offerId === offer.id,
    boundedOffer: offer.status === "open" && need.status === "open" &&
      need.category === offer.category && need.region === offer.region &&
      need.unit === offer.unit && need.steward !== offer.steward &&
      offer.quantity >= need.quantity,
    textByteExact: draft.body === markdown({ need, offer }),
    digestMatches: sha256(Buffer.from(draft.body, "utf8")) === draft.sha256,
    noContactOrPublication: !/(mailto:|https?:\/\/|\bphone\b|\bvenmo\b|\bpublish now\b)/i.test(draft.body),
    safetyMarking: draft.body.includes("fictional demonstration") &&
      draft.body.includes("Human verification")
  };
  const passed = Object.values(checks).every(Boolean);
  return {
    schema: "jarvis.party-review/v0",
    checks,
    passed,
    disposition: passed ? "HOLD_HUMAN_REVIEW" : "REFUSE_DRAFT",
    authority: "none",
    independentModelReviewer: false,
    method: "deterministic fixture validator; not an independent agent"
  };
}

export function composeFixtureGardenParty({ jar, at = new Date().toISOString(), ids = () => randomUUID() }) {
  if (!Number.isFinite(Date.parse(at))) refuse("Party timestamp invalid");
  const found = understand(jar, "garden.need.produce-001");
  if (!found) refuse("No compatible demo Garden offer/need; HOLD");
  const { need, offer } = found;
  const partyId = "jarvis-party-v0:" + ids();
  const maker = {
    schema: OCCURRENCE, id: ids(), role: "CARD_DRAFTER", producer: "deterministic-fixture",
    modelInvoked: false, originalElfHatchInvoked: false, authorityInherited: false
  };
  const witness = {
    schema: OCCURRENCE, id: ids(), role: "CARD_VERIFIER", producer: "deterministic-fixture",
    modelInvoked: false, originalElfHatchInvoked: false, authorityInherited: false
  };
  if (!maker.id || !witness.id || maker.id === witness.id ||
      partyId.endsWith(":" + maker.id) || partyId.endsWith(":" + witness.id)) refuse("Occurrence identity collision");
  const body = markdown({ need, offer });
  const draft = {
    schema: ARTIFACT,
    name: "Table & Road — Garden community card",
    format: "text/markdown",
    body,
    sha256: sha256(Buffer.from(body, "utf8")),
    source: { needId: need.id, offerId: offer.id },
    producerOccurrenceId: maker.id,
    authorizedForPublication: false
  };
  const review = inspectCard({ draft, need, offer });
  return {
    schema: PARTY,
    id: partyId,
    createdAt: at,
    task: "Create a printable community card from fictional Table & Road Garden particulars",
    mode: "OFFLINE / FIXTURE / NOT OPENMANUS / NOT ELF HATCH",
    guests: [maker, witness],
    artifact: copy(draft),
    review,
    trust: {
      loadoutRealCompile: false,
      openmanusExecuted: false,
      elfActualHatches: false,
      osSandboxVerified: false,
      signedNativeReceipts: false,
      humanApproval: false,
      published: false
    },
    returnText: review.passed
      ? "RETURN: fictional card prepared and checked locally; HOLD for human review. No agents, publication, messages, or real inventory were used."
      : "RETURN: fictional card failed local checks; REFUSE, nothing published."
  };
}
