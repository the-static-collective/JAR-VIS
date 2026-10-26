import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { InheritanceBoard } from "../src/inheritance.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-inheritance-"));
  const file = join(dir, "events.jsonl");
  const clock = () => "2026-10-26T14:00:00.000Z";
  try { return await fn({ file, clock, dir }); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
const sample = { title: "Sample supply route", need: "Find a repeatable route for a hypothetical supply need", region: "Sample Region", steward: "Volunteer A" };
async function propose(board) { return (await board.propose(sample)).weave.id; }

test("possible work never becomes accomplishment by implication", () => fixture(async ({ file, clock }) => {
  const board = await InheritanceBoard.open({ journalPath: file, clock });
  const id = await propose(board);
  let state = board.state();
  assert.equal(state.records[0].stage, "WEAVE_PROPOSED");
  assert.equal(state.counters.independentlyVerified, 0);
  assert.equal(state.records[0].verified, false);
  await assert.rejects(board.report({ weaveId: id, outcome: "completed", note: "Done" }), /no recorded voluntary commitment/);
  await assert.rejects(board.returnCapability({ weaveId: id, method: "Drive route", nextInvitation: "Repeat route" }), /HOLD/);
  await assert.rejects(board.commit({ weaveId: id, actor: "Volunteer A", voluntary: false }), /voluntary assertion/);
  await assert.rejects(board.commit({ weaveId: id, actor: "Not the steward", voluntary: true }), /voluntary assertion/);
  const results = await Promise.all([
    board.commit({ weaveId: id, actor: "Volunteer A", voluntary: true }),
    board.commit({ weaveId: id, actor: "Volunteer A", voluntary: true })
  ]);
  assert.deepEqual(results.map((r) => r.reused), [false, true]);
  state = board.state();
  assert.equal(state.records[0].stage, "COMMITMENT_RECORDED");
  assert.equal(state.records[0].commitment.authenticated, false);
  assert.equal(state.records[0].externalPublication, false);
}));

test("complete -> distinct claimed review -> candidate capability, with cold replay", () => fixture(async ({ file, clock }) => {
  const board = await InheritanceBoard.open({ journalPath: file, clock });
  const id = await propose(board);
  await board.commit({ weaveId: id, actor: sample.steward, voluntary: true });
  await board.report({ weaveId: id, outcome: "completed", note: "Example route completed in local test", evidenceRef: "fictional-report-001" });
  assert.equal(board.state().records[0].stage, "REPORTED_UNVERIFIED");
  await assert.rejects(board.review({ weaveId: id, reviewer: sample.steward, decision: "accept-report", note: "Same person" }), /distinct reviewer/);
  await assert.rejects(board.returnCapability({ weaveId: id, method: "Pack route", nextInvitation: "Try again" }), /completed report and separately/);
  const reviewed = await board.review({ weaveId: id, reviewer: "Reviewer B", decision: "accept-report", note: "Examined a fictional report" });
  assert.equal(reviewed.verified, false);
  assert.equal(reviewed.review.identityVerified, false);
  const candidate = await board.returnCapability({
    weaveId: id, method: "Ask a driver, identify a pickup, confirm a dropoff, document blockers",
    nextInvitation: "Would another volunteer like to test the documented route?"
  });
  assert.equal(candidate.capability.status, "CANDIDATE_ONLY");
  assert.equal(candidate.capability.published, false);
  assert.equal((await board.returnCapability({ weaveId: id, method: "Mutated", nextInvitation: "Change" })).reused, true);
  assert.equal(board.state().records[0].stage, "RETURNED_CANDIDATE");
  assert.equal(board.state().counters.reusableCandidates, 1);
  assert.equal(board.state().counters.independentlyVerified, 0);
  const restarted = await InheritanceBoard.open({ journalPath: file, clock });
  assert.deepEqual(restarted.state(), board.state());
  assert.equal(restarted.state().records[0].capability.nextInvitation.startsWith("Would another"), true);
}));

test("partial, blocked and needs-more outcomes cannot be promoted", () => fixture(async ({ file, clock }) => {
  const board = await InheritanceBoard.open({ journalPath: file, clock });
  for (const outcome of ["partial", "blocked", "completed"]) {
    const id = await propose(board);
    await board.commit({ weaveId: id, actor: sample.steward, voluntary: true });
    await board.report({ weaveId: id, outcome, note: "Not a completed reviewed fulfillment" });
    await board.review({ weaveId: id, reviewer: "Reviewer B", decision: "needs-more", note: "Not enough reliable evidence" });
    await assert.rejects(board.returnCapability({ weaveId: id, method: "Pretend method", nextInvitation: "Start" }), /HOLD/);
  }
  assert.equal(board.state().counters.reusableCandidates, 0);
  assert.equal(board.state().counters.reviewed, 0);
}));

test("duplicate outcome is refused, field bounds are enforced, hash-chain detects tampering", () => fixture(async ({ file, clock }) => {
  const board = await InheritanceBoard.open({ journalPath: file, clock });
  await assert.rejects(board.propose({ ...sample, title: " " }), /Title/);
  const id = await propose(board);
  await board.commit({ weaveId: id, actor: sample.steward, voluntary: true });
  await board.report({ weaveId: id, outcome: "blocked", note: "Blocked for the demo" });
  await assert.rejects(board.report({ weaveId: id, outcome: "completed", note: "Override" }), /already exists/);
  const raw = await readFile(file, "utf8");
  await writeFile(file, raw.replace("Blocked for the demo", "Falsified fake report"));
  await assert.rejects(InheritanceBoard.open({ journalPath: file, clock }), /Journal chain verification failed/);
}));

test("HTTP exposes a useful notebook on loopback, with host/origin and anti-CSRF gates", () => fixture(async ({ file }) => {
  const server = await startWorkbenchServer({ journalPath: file, port: 0 });
  try {
    const page = await fetch(server.url + "/inherit");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Tomorrow begins/);
    const script = await fetch(server.url + "/inherit.js");
    assert.equal(script.status, 200);
    const style = await fetch(server.url + "/inherit.css");
    assert.equal(style.status, 200);
    const state = await (await fetch(server.url + "/api/inheritance")).json();
    assert.equal(state.counters.weaves, 0);
    const noToken = await fetch(server.url + "/api/inheritance/propose", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sample)
    });
    assert.equal(noToken.status, 403);
    const wrongOrigin = await fetch(server.url + "/api/inheritance/propose", {
      method: "POST", headers: { "content-type": "application/json", "origin": "http://bad.example", "x-jarvis-csrf": state.csrfToken },
      body: JSON.stringify(sample)
    });
    assert.equal(wrongOrigin.status, 403);
    const made = await fetch(server.url + "/api/inheritance/propose", {
      method: "POST", headers: { "content-type": "application/json", "x-jarvis-csrf": state.csrfToken }, body: JSON.stringify(sample)
    });
    assert.equal(made.status, 200);
    const after = await (await fetch(server.url + "/api/inheritance")).json();
    assert.equal(after.counters.weaves, 1);
    assert.equal(after.records[0].verified, false);
  } finally { await server.close(); }
}));


test("operator browser script is syntactically valid JavaScript", () => {
  const script = fileURLToPath(new URL("../public/inherit.js", import.meta.url));
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", script], { stdio: "pipe" }));
});
