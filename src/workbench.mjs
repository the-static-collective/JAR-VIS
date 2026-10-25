import { gardenJar } from "./fixture.mjs";
import {
  observe, understand, propose, makeGrant, cross, MockKinshipRelay
} from "./engine.mjs";
import { LocalJournal } from "./journal.mjs";
import { doors } from "./doors.mjs";
import { inspectPublicDoor, publicDoorIds } from "./public-doors.mjs";
import { composeFixtureGardenParty } from "./house-party.mjs";
import { inspectNativeTestimony } from "./native-testimony.mjs";
import { projectHeartbeat, fixtureWitness } from "./heartbeat.mjs";

const copy = (v) => structuredClone(v);
const notFound = (message) => Object.assign(new Error(message), { status: 404 });
const bad = (message) => Object.assign(new Error(message), { status: 400 });
const conflict = (message) => Object.assign(new Error(message), { status: 409 });

export class Workbench {
  #jar;
  #journal;
  #clock;
  #sourceReader;
  #tail = Promise.resolve();
  constructor({ jar, journal, clock, sourceReader = inspectPublicDoor }) {
    this.#jar = jar;
    this.#journal = journal;
    this.#clock = clock;
    this.#sourceReader = sourceReader;
  }
  static async open({ journalPath, clock = () => new Date().toISOString(), sourceReader = inspectPublicDoor }) {
    return new Workbench({
      jar: gardenJar(),
      journal: await LocalJournal.open(journalPath),
      clock,
      sourceReader
    });
  }
  #exclusive(callback) {
    const result = this.#tail.then(callback);
    this.#tail = result.catch(() => {});
    return result;
  }
  #replay() {
    const proposals = new Map();
    const grants = new Map();
    const outcomes = new Map();
    const sourceObservations = new Map();
    const parties = new Map();
    const nativeObservations = new Map();
    const witnesses = new Map();
    const events = this.#journal.list();
    for (const event of events) {
      const { kind, payload } = event;
      if (kind === "PROPOSED") {
        proposals.set(payload.id, payload);
        grants.set(payload.id, new Map());
      } else if (kind === "MOCK_APPROVED") {
        grants.get(payload.proposalId)?.set(payload.issuedBy, payload);
      } else if (kind === "MOCK_REVOKED") {
        grants.get(payload.proposalId)?.delete(payload.steward);
      } else if (kind === "CROSSED") {
        outcomes.set(payload.proposalId, payload);
      } else if (kind === "DOOR_INSPECTED") {
        sourceObservations.set(payload.doorId, payload);
      } else if (kind === "PARTY_COMPLETED") {
        parties.set(payload.id, payload);
      } else if (kind === "NATIVE_REPORTED") {
        nativeObservations.set(payload.importedId, payload);
      } else if (kind === "FIXTURE_WITNESSED") {
        witnesses.set(payload.proposalId, payload);
      }
    }
    return { proposals, grants, outcomes, sourceObservations, parties, nativeObservations, witnesses, events };
  }
  state() {
    const { proposals, grants, outcomes, sourceObservations, parties, nativeObservations, witnesses, events } = this.#replay();
    const list = [...proposals.values()].reverse().map((proposal) => ({
      ...copy(proposal),
      approvedBy: [...(grants.get(proposal.id)?.values() ?? [])]
        .filter((grant) => Date.parse(grant.expiresAt) > Date.parse(this.#clock()))
        .map((grant) => grant.issuedBy),
      outcome: copy(outcomes.get(proposal.id) ?? null)
    }));
    const heartbeats = this.#jar.list("need").map((need) => {
      const proposal = [...proposals.values()].reverse().find((item) => item.needId === need.id);
      const approvedBy = [...(grants.get(proposal?.id)?.values() ?? [])]
        .filter((grant) => Date.parse(grant.expiresAt) > Date.parse(this.#clock()))
        .map((grant) => grant.issuedBy);
      return projectHeartbeat({
        match: understand(this.#jar, need.id), proposal, approvedBy,
        outcome: outcomes.get(proposal?.id), witness: witnesses.get(proposal?.id)
      });
    });
    return {
      schema: "jarvis.workbench-state/v0",
      mode: "LOCAL / SYNTHETIC / MOCK",
      particulars: observe(this.#jar),
      doors: copy(doors),
      sourceObservations: [...sourceObservations.values()].map(copy),
      parties: [...parties.values()].reverse().map(copy),
      nativeObservations: [...nativeObservations.values()].reverse().map(copy),
      proposals: list,
      heartbeats,
      outbox: [...outcomes.values()].filter((v) => v.message).map((v) => copy(v.message)),
      events: events.slice(-80).reverse().map(({ id, seq, kind, at, payload }) => ({
        id, seq, kind, at,
        subject: payload?.proposalId ?? payload?.id ?? null
      })),
      counters: {
        needs: this.#jar.list("need").length,
        offers: this.#jar.list("offer").length,
        proposals: proposals.size,
        mockRelays: [...outcomes.values()].filter((v) => v.receipt?.kind === "MOCK_RELAYED").length,
        parties: parties.size,
        nativeReports: nativeObservations.size,
        fixtureWitnesses: witnesses.size
      }
    };
  }
  async importNativeReport(report) {
    return this.#exclusive(async () => {
      const observation = inspectNativeTestimony(report, this.#clock());
      const { nativeObservations } = this.#replay();
      if (nativeObservations.has(observation.importedId)) {
        return { observation: copy(nativeObservations.get(observation.importedId)), reused: true };
      }
      await this.#journal.append("NATIVE_REPORTED", observation, this.#clock());
      return { observation: copy(observation), reused: false };
    });
  }
  async hostFixtureParty() {
    return this.#exclusive(async () => {
      const party = composeFixtureGardenParty({ jar: this.#jar, at: this.#clock() });
      // Preparation and deterministic review only: no external execution is authorized.
      await this.#journal.append("PARTY_COMPLETED", party, this.#clock());
      return { party: copy(party), published: false };
    });
  }
  async witnessMock({ proposalId, disposition, note } = {}) {
    return this.#exclusive(async () => {
      const { proposals, outcomes, witnesses } = this.#replay();
      const proposal = proposals.get(proposalId);
      if (!proposal) throw notFound("Unknown proposal");
      const existing = witnesses.get(proposalId);
      if (existing) return { witness: copy(existing), reused: true };
      let report;
      try {
        report = fixtureWitness({
          proposal, outcome: outcomes.get(proposalId), disposition, note, at: this.#clock()
        });
      } catch (error) { throw bad(error.message); }
      await this.#journal.append("FIXTURE_WITNESSED", report, this.#clock());
      return { witness: copy(report), reused: false };
    });
  }
  async inspectDoor(doorId) {
    return this.#exclusive(async () => {
      if (typeof doorId !== "string" || !publicDoorIds.includes(doorId)) {
        throw bad("Door does not expose an allowlisted public source");
      }
      let observation;
      try {
        observation = await this.#sourceReader(doorId, { now: this.#clock });
      } catch (error) {
        // A failed read never gets reclassified as a verified capability.
        const result = new Error("Public source unavailable or invalid; no discovery admitted");
        result.status = 502;
        result.cause = error;
        throw result;
      }
      if (observation?.schema !== "jarvis.public-door-observation/v0" ||
          observation.doorId !== doorId || observation.access !== "public-read-only" ||
          observation.admission !== "none" || observation.runtimeConnected !== false ||
          !Array.isArray(observation.capabilities) || observation.capabilities.length > 32 ||
          observation.capabilities.some((cap) => cap.callable !== false)) {
        throw bad("Public source did not satisfy the read-only boundary");
      }
      await this.#journal.append("DOOR_INSPECTED", observation, this.#clock());
      return { observation: copy(observation), admittedAction: false };
    });
  }
  async proposeNeed(needId) {
    return this.#exclusive(async () => {
      if (typeof needId !== "string" || !needId) throw bad("Specify a need ID");
      const { proposals, outcomes } = this.#replay();
      const existing = [...proposals.values()].reverse().find(
        (p) => p.needId === needId && !outcomes.has(p.id));
      if (existing) return { proposal: copy(existing), reused: true };
      const proposal = propose(this.#jar, needId, { at: this.#clock() });
      if (!proposal) throw bad("No compatible open offer is available for this need");
      await this.#journal.append("PROPOSED", proposal, this.#clock());
      return { proposal, reused: false };
    });
  }
  async grant({ proposalId, steward, decision }) {
    return this.#exclusive(async () => {
      if (!["approve", "revoke"].includes(decision)) throw bad("Unsupported decision");
      const { proposals, outcomes } = this.#replay();
      const proposal = proposals.get(proposalId);
      if (!proposal) throw notFound("Unknown proposal");
      if (outcomes.has(proposalId)) throw conflict("Mock crossing already recorded; cannot change prior approvals");
      if (!proposal.stewards.includes(steward)) throw bad("Steward not named on this proposal");
      const now = this.#clock();
      if (decision === "revoke") {
        await this.#journal.append("MOCK_REVOKED", { proposalId, steward }, now);
        return { status: "reverted-to-hold", steward };
      }
      // The UI is operated by one local demonstrator, not an authenticated steward.
      // This is a simulation grant, never real-world consent.
      const expiresAt = new Date(Date.parse(now) + 10 * 60 * 1000).toISOString();
      const grant = makeGrant({ proposal, steward, expiresAt });
      await this.#journal.append("MOCK_APPROVED", grant, now);
      return { status: "mock-approved", steward, expiresAt };
    });
  }
  async dispatch(proposalId) {
    return this.#exclusive(async () => {
      const { proposals, grants, outcomes } = this.#replay();
      const proposal = proposals.get(proposalId);
      if (!proposal) throw notFound("Unknown proposal");
      const prior = outcomes.get(proposalId);
      if (prior) return { ...copy(prior), alreadyRecorded: true };
      const currentGrants = [...(grants.get(proposalId)?.values() ?? [])];
      const result = cross({
        jar: this.#jar, proposal, grants: currentGrants,
        relay: new MockKinshipRelay(), at: this.#clock()
      });
      if (result.receipt.kind === "HOLD") {
        await this.#journal.append("HELD", {
          proposalId,
          receipt: result.receipt,
          returnText: result.returnText
        }, this.#clock());
        return { ...result, alreadyRecorded: false };
      }
      const payload = {
        proposalId,
        receipt: result.receipt,
        message: result.message,
        returnText: result.returnText
      };
      await this.#journal.append("CROSSED", payload, this.#clock());
      return { ...payload, alreadyRecorded: false };
    });
  }
  attend(question) {
    if (typeof question !== "string" || question.length > 500) throw bad("Question must be 500 characters or less");
    const q = question.trim().toLowerCase();
    const state = this.state();
    let answer;
    if (/consent|authoriz|approv|permission|gate|semicolon/.test(q)) {
      answer = "The semicolon is a gate, not punctuation for automatic action. Genesis 002 accepts only two separately triggered MOCK steward approvals scoped to one proposal. It cannot authenticate real human consent; absent grants mean HOLD.";
    } else if (/kinship|radio|broadcast/.test(q)) {
      answer = "Kinship has a process-local mock adapter only. " + state.counters.mockRelays + " simulated crossing(s) are in the local journal. No real broadcast, website post, or external message occurs.";
    } else if (/relatte|receipt|signature/.test(q)) {
      answer = "These are local JAR;VIS receipts with no signatures. reLATTE signing and receiver admission are separate future integrations. A receipt is not proof of fulfillment.";
    } else if (/ghot|planz|abundent|penny|door|connect/.test(q)) {
      const seen = state.sourceObservations.map((v) => v.doorId + " (" + v.observedAt + ")");
      answer = "GHoT and planZ have opt-in read-only GitHub source inspection. " +
        (seen.length ? "Previously observed: " + seen.join(", ") + ". " : "No public source inspected yet. ") +
        "These observations are published descriptions, not live machines, plans, identities, or permissions. The other doors remain unconnected.";
    } else if (/party|elf|manus|loadout|card|jarhead/.test(q)) {
      answer = "HOUSE PARTY 005 provides an optional local command-line runner for two separate pinned, LOADOUT-gated OpenManus model workers and two original ELF data-copy hatches. Nothing launches automatically from the browser. " + state.counters.parties + " fixture party record(s) and " + state.counters.nativeReports + " imported native report(s) exist. Imported JSON is unverified operator testimony and cannot authorize publication.";
    } else if (/heartbeat|discover|compose|witness|return|next step|what can i do|where do i start/.test(q)) {
      const heartbeat = state.heartbeats[0];
      answer = "DISCOVER → COMPOSE → ACT → WITNESS → RETURN. " +
        (heartbeat?.next ?? "No source particulars were discovered.") +
        " This is still a local fictional exercise, not real-world fulfillment.";
    } else if (/truck|volunteer|cleanup|potluck|campus compute|help somebody/.test(q)) {
      answer = "That could be an OFFER to connect with a specific NEED, but no such verified record exists in this fictional fixture. " +
        "Collect an attributable offer, location, availability, and intended audience first; seek separate permission before any real action. " +
        "JAR;VIS cannot post or match live volunteers yet.";
    } else if (/need|offer|garden|match|attention|next|status|what/.test(q) || !q) {
      const matched = state.particulars.needs.length &&
        state.particulars.offers.length;
      answer = matched
        ? "I see a fictional Garden need for 12 produce boxes and a fictional offer of 20. The possible match is available for proposal. " +
          (state.proposals.length
            ? "There are " + state.proposals.length + " proposal(s); open one to inspect approval and receipt status."
            : "Choose 'Form proposal' to begin; nothing is sent automatically.")
        : "There are no current fictional particulars available.";
    } else {
      answer = "I am a deterministic local attendant, not a connected language model. Try asking about Garden needs, Kinship broadcasts, project doors, receipts, or authorization.";
    }
    return {
      schema: "jarvis.attention/v0",
      answer,
      mode: "deterministic-local-rules",
      limits: "No LLM, private project queries, or external action"
    };
  }
}
