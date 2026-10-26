import { randomUUID } from "node:crypto";
import { LocalJournal } from "./journal.mjs";

// Work That Inherits 001: a LOCAL operator notebook, not a public intake or identity service.
// A review is a recorded assertion. Neither a hash nor a reviewer alias establishes physical truth.
const copy = (value) => structuredClone(value);
const error = (message, status = 400) => Object.assign(new Error(message), { status });

function field(value, label, max = 240) {
  if (typeof value !== "string" || value.trim().length < 2 || value.length > max ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
    throw error(label + " must be 2–" + max + " printable characters");
  }
  return value.trim();
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export class InheritanceBoard {
  #journal;
  #clock;
  #tail = Promise.resolve();
  constructor(journal, clock) { this.#journal = journal; this.#clock = clock; }
  static async open({ journalPath, clock = () => new Date().toISOString() }) {
    return new InheritanceBoard(await LocalJournal.open(journalPath), clock);
  }
  #exclusive(fn) {
    const result = this.#tail.then(fn);
    this.#tail = result.catch(() => {});
    return result;
  }
  #records() {
    const records = new Map();
    for (const event of this.#journal.list()) {
      const p = event.payload;
      if (event.kind === "INHERIT_WEAVE") {
        if (records.has(p.id)) throw new Error("Duplicate weave in journal");
        records.set(p.id, { ...p, commitment: null, report: null, review: null, capability: null });
      } else if (event.kind?.startsWith("INHERIT_")) {
        const record = records.get(p.weaveId);
        if (!record) throw new Error("Orphan inheritance event");
        const slot = {
          INHERIT_COMMITMENT: "commitment",
          INHERIT_REPORT: "report",
          INHERIT_REVIEW: "review",
          INHERIT_RETURN: "capability"
        }[event.kind];
        if (!slot || record[slot]) throw new Error("Duplicate or unsupported inheritance event");
        record[slot] = p;
      }
    }
    return records;
  }
  #require(id) {
    if (typeof id !== "string") throw error("Invalid weave ID");
    const record = this.#records().get(id);
    if (!record) throw error("Unknown weave", 404);
    return record;
  }
  state() {
    const records = [...this.#records().values()].reverse().map((r) => ({
      ...r,
      stage: r.capability ? "RETURNED_CANDIDATE" :
        r.review ? (r.review.decision === "accept-report" ? "REVIEWED_REPORT" : "REVIEW_HOLD") :
        r.report ? "REPORTED_UNVERIFIED" : r.commitment ? "COMMITMENT_RECORDED" : "WEAVE_PROPOSED",
      // Explicitly do not promote operator testimony to verified accomplishment or publication.
      verified: false,
      externalPublication: false
    }));
    return copy({
      schema: "jarvis.work-inherits/v0",
      mode: "LOCAL_ONLY / UNAUTHENTICATED / NO_EXTERNAL_EFFECT",
      records,
      counters: {
        weaves: records.length,
        commitments: records.filter((r) => r.commitment).length,
        reported: records.filter((r) => r.report).length,
        reviewed: records.filter((r) => r.review?.decision === "accept-report").length,
        reusableCandidates: records.filter((r) => r.capability).length,
        independentlyVerified: 0
      }
    });
  }
  propose({ title, need, region, steward } = {}) {
    return this.#exclusive(async () => {
      const payload = {
        schema: "jarvis.inheritance-weave/v0",
        id: "weave:" + randomUUID(),
        title: field(title, "Title", 100),
        need: field(need, "Need", 500),
        region: field(region, "Region", 100),
        steward: field(steward, "Steward alias", 100),
        at: this.#clock()
      };
      await this.#journal.append("INHERIT_WEAVE", payload, payload.at);
      return { weave: copy(payload), status: "WEAVE_PROPOSED" };
    });
  }
  commit({ weaveId, actor, voluntary } = {}) {
    return this.#exclusive(async () => {
      const r = this.#require(weaveId);
      if (r.commitment) return { commitment: copy(r.commitment), reused: true };
      if (voluntary !== true || field(actor, "Actor alias", 100) !== r.steward) {
        throw error("Explicit voluntary assertion by the named steward alias required; identity is not authenticated");
      }
      const p = {
        schema: "jarvis.inheritance-commitment/v0", weaveId,
        actor: r.steward, voluntaryAsserted: true, authenticated: false, at: this.#clock()
      };
      await this.#journal.append("INHERIT_COMMITMENT", p, p.at);
      return { commitment: copy(p), reused: false };
    });
  }
  report({ weaveId, outcome, note, evidenceRef = "" } = {}) {
    return this.#exclusive(async () => {
      const r = this.#require(weaveId);
      if (!r.commitment) throw error("HOLD: no recorded voluntary commitment", 409);
      if (r.report) throw error("A report already exists; append-only corrections require a future version", 409);
      if (!["completed", "partial", "blocked"].includes(outcome)) throw error("Invalid outcome");
      if (typeof evidenceRef !== "string" || evidenceRef.length > 300) throw error("Invalid evidence reference");
      const p = {
        schema: "jarvis.inheritance-report/v0", weaveId, outcome,
        note: field(note, "Report", 500),
        evidenceRef: evidenceRef.trim(), by: r.steward,
        kind: "operator-reported-unverified", at: this.#clock()
      };
      await this.#journal.append("INHERIT_REPORT", p, p.at);
      return { report: copy(p), verified: false };
    });
  }
  review({ weaveId, reviewer, decision, note } = {}) {
    return this.#exclusive(async () => {
      const r = this.#require(weaveId);
      if (!r.report) throw error("HOLD: no report to review", 409);
      if (r.review) throw error("Review already recorded; corrections require a future version", 409);
      const alias = field(reviewer, "Reviewer alias", 100);
      if (alias.toLocaleLowerCase("en") === r.steward.toLocaleLowerCase("en")) {
        throw error("A distinct reviewer alias is required; identities remain unauthenticated");
      }
      if (!["accept-report", "needs-more"].includes(decision)) throw error("Invalid review decision");
      const p = {
        schema: "jarvis.inheritance-review/v0", weaveId, reviewer: alias, decision,
        note: field(note, "Review note", 500),
        identityVerified: false, independentEvidenceVerified: false, at: this.#clock()
      };
      await this.#journal.append("INHERIT_REVIEW", p, p.at);
      return { review: copy(p), verified: false };
    });
  }
  returnCapability({ weaveId, method, nextInvitation } = {}) {
    return this.#exclusive(async () => {
      const r = this.#require(weaveId);
      if (r.capability) return { capability: copy(r.capability), reused: true };
      if (r.report?.outcome !== "completed" || r.review?.decision !== "accept-report") {
        throw error("HOLD: a completed report and separately recorded accepting review are required", 409);
      }
      const p = {
        schema: "jarvis.inheritance-return/v0", weaveId,
        method: field(method, "Reusable method", 1000),
        nextInvitation: field(nextInvitation, "Next invitation", 500),
        status: "CANDIDATE_ONLY", verified: false, published: false, at: this.#clock()
      };
      await this.#journal.append("INHERIT_RETURN", p, p.at);
      return { capability: copy(p), reused: false };
    });
  }
}
