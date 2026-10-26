import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deriveReviewSeat, triageReviewCandidates } from "../src/reviewer-discovery.mjs";
import { InheritanceBoard } from "../src/inheritance.mjs";

const base = { id: "weave:sample", region: "Southern Minnesota", steward: "Volunteer A", commitment: null, report: null, review: null };
test("finding an independent reviewer becomes a job only after an asserted commitment", () => {
  assert.equal(deriveReviewSeat(base), null);
  const seat = deriveReviewSeat({ ...base, commitment: { voluntaryAsserted: true } });
  assert.equal(seat.status, "LOCAL_CANDIDATE_HOLD");
  assert.equal(seat.publicPublicationApproved, false);
  assert.equal(seat.reviewerIndependenceEstablished, false);
  assert.equal(seat.volunteerAssignmentAuthorized, false);
  assert.equal(seat.priority, "REVIEW_DISCOVERY");
  assert.equal(deriveReviewSeat({ ...base, commitment: {}, report: { outcome: "completed" } }).priority, "REVIEW_WAITING");
  assert.equal(deriveReviewSeat({ ...base, commitment: {}, review: { decision: "needs-more" } }), null);
});

test("candidate discovery respects opt-in, skill, distinct alias, conflicts and preserves HOLD", () => {
  const seat = deriveReviewSeat({ ...base, commitment: {} });
  const candidate = { role: "reviewer", consentToMatch: true, status: "PENDING",
    capability: "process", independence: "no_known_conflict", region: "Southern Minnesota" };
  const results = triageReviewCandidates(seat, [
    { ...candidate, id: "a", alias: "Reviewer B" },
    { ...candidate, id: "b", alias: "Volunteer A" },
    { ...candidate, id: "c", alias: "Reviewer C", independence: "possible_conflict" },
    { ...candidate, id: "d", alias: "Reviewer D", consentToMatch: false },
    { ...candidate, id: "e", alias: "Reviewer E", capability: "privacy" },
    { ...candidate, id: "f", alias: "Reviewer F", region: "Elsewhere" }
  ], "Volunteer A");
  assert.deepEqual(results.map((x) => x.candidateId), ["a","c","f"]);
  assert.equal(results[0].suggested, true);
  assert.equal(results[0].independentlyVerified, false);
  assert.equal(results[0].admitted, false);
  assert.equal(results[1].suggested, false);
  assert.ok(results[1].reasons.includes("CONFLICT_NOT_CLEARED"));
  assert.ok(results[2].reasons.includes("REGION_TO_CONFIRM"));
  assert.equal(results.every((x) => x.externalContact === false), true);
});

test("local inheritance notebook independently projects reviewer needs and closes them after review", async () => {
  const dir = await mkdtemp(join(tmpdir(), "inherit-reviewer-"));
  try {
    const board = await InheritanceBoard.open({ journalPath: join(dir, "events.jsonl") });
    const w = (await board.propose({ title: "Hypothetical route", need: "Prepare a reversible sample task", region: "Southern Minnesota", steward: "Volunteer A" })).weave.id;
    assert.equal(board.state().reviewerSeats.length, 0);
    await board.commit({ weaveId: w, actor: "Volunteer A", voluntary: true });
    assert.equal(board.state().reviewerSeats.length, 1);
    await board.report({ weaveId: w, outcome: "blocked", note: "Not executed yet" });
    assert.equal(board.state().reviewerSeats[0].priority, "REVIEW_WAITING");
    await board.review({ weaveId: w, reviewer: "Reviewer B", decision: "needs-more", note: "No independent evidence" });
    assert.equal(board.state().reviewerSeats.length, 0);
    assert.equal(board.state().counters.independentlyVerified, 0);
  } finally { await rm(dir, {recursive:true,force:true});}
});
