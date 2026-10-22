import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Workbench } from "../src/workbench.mjs";
import { LocalJournal } from "../src/journal.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const start = "2026-10-21T12:00:00.000Z";
const later = "2026-10-21T12:01:00.000Z";
const expired = "2026-10-21T12:15:00.000Z";
async function sandbox(callback) {
  const directory = await mkdtemp(join(tmpdir(), "jarvis-g002-"));
  const journalPath = join(directory, "journal.jsonl");
  try { return await callback(journalPath); }
  finally { await rm(directory, { recursive: true, force: true }); }
}
async function scenario(path) {
  let current = start;
  const workbench = await Workbench.open({ journalPath: path, clock: () => current });
  const proposeResult = await workbench.proposeNeed("garden.need.produce-001");
  return {
    workbench,
    proposal: proposeResult.proposal,
    setClock: (value) => { current = value; }
  };
}
test("field shows explicitly unconnected sibling doors and fictional particulars", () =>
  sandbox(async (path) => {
    const workbench = await Workbench.open({ journalPath: path, clock: () => start });
    const state = workbench.state();
    assert.equal(state.counters.needs, 1);
    assert.equal(state.counters.offers, 1);
    assert.equal(state.proposals.length, 0);
    assert.equal(state.doors.find((door) => door.id === "kinship").status, "mock");
    assert.ok(state.doors.every((door) => !door.connected));
  }));
test("proposal is persisted but never silently authorized", () =>
  sandbox(async (path) => {
    const { workbench, proposal } = await scenario(path);
    assert.match(proposal.id, /^jarvis-proposal-v0:/);
    assert.equal(workbench.state().proposals[0].approvedBy.length, 0);
    assert.equal(workbench.state().outbox.length, 0);
    const first = await workbench.dispatch(proposal.id);
    assert.equal(first.receipt.kind, "HOLD");
    assert.equal(workbench.state().outbox.length, 0);
    assert.equal(workbench.state().events[0].kind, "HELD");
  }));
test("two independent DEMO approvals and explicit dispatch produce mock only", () =>
  sandbox(async (path) => {
    const { workbench, proposal, setClock } = await scenario(path);
    await workbench.grant({ proposalId: proposal.id, steward: proposal.stewards[0], decision: "approve" });
    setClock(later);
    assert.equal((await workbench.dispatch(proposal.id)).receipt.kind, "HOLD");
    await workbench.grant({ proposalId: proposal.id, steward: proposal.stewards[1], decision: "approve" });
    const result = await workbench.dispatch(proposal.id);
    assert.equal(result.receipt.kind, "MOCK_RELAYED");
    assert.equal(result.receipt.externalDelivery, false);
    assert.equal(result.message.transmittedExternally, false);
    assert.equal(workbench.state().outbox.length, 1);
    const again = await workbench.dispatch(proposal.id);
    assert.equal(again.alreadyRecorded, true);
    assert.equal(workbench.state().outbox.length, 1);
  }));
test("revocation and grant expiry prevent simulation", () =>
  sandbox(async (path) => {
    const { workbench, proposal, setClock } = await scenario(path);
    for (const steward of proposal.stewards) {
      await workbench.grant({ proposalId: proposal.id, steward, decision: "approve" });
    }
    await workbench.grant({ proposalId: proposal.id, steward: proposal.stewards[0], decision: "revoke" });
    assert.equal((await workbench.dispatch(proposal.id)).receipt.kind, "HOLD");
    assert.equal(workbench.state().outbox.length, 0);
    await workbench.grant({ proposalId: proposal.id, steward: proposal.stewards[0], decision: "approve" });
    setClock(expired);
    assert.equal((await workbench.dispatch(proposal.id)).receipt.kind, "HOLD");
    assert.equal(workbench.state().outbox.length, 0);
  }));
test("journal preserves local history and simulated outbox through restart", () =>
  sandbox(async (path) => {
    const { workbench, proposal } = await scenario(path);
    for (const steward of proposal.stewards) {
      await workbench.grant({ proposalId: proposal.id, steward, decision: "approve" });
    }
    await workbench.dispatch(proposal.id);
    const before = workbench.state();
    const restarted = await Workbench.open({ journalPath: path, clock: () => later });
    assert.equal(restarted.state().outbox.length, 1);
    assert.deepEqual(restarted.state().events, before.events);
    assert.equal((await restarted.dispatch(proposal.id)).alreadyRecorded, true);
  }));
test("journal rejects a single-byte modification and incomplete tail", () =>
  sandbox(async (path) => {
    const { workbench } = await scenario(path);
    assert.equal(workbench.state().events.length, 1);
    const original = await readFile(path, "utf8");
    await writeFile(path, original.replace("PROPOSED", "APPROVED"), "utf8");
    await assert.rejects(LocalJournal.open(path), /verification failed/);
    await writeFile(path, original.trimEnd(), "utf8");
    await assert.rejects(LocalJournal.open(path), /incomplete final record/);
  }));
test("attendant is deterministic and does not claim live project connections", () =>
  sandbox(async (path) => {
    const workbench = await Workbench.open({ journalPath: path, clock: () => start });
    assert.match(workbench.attend("What is Kinship?").answer, /no real broadcast|No real broadcast/);
    assert.match(workbench.attend("How does authorization work?").answer, /MOCK/);
    assert.match(workbench.attend("What about planZ?").answer, /not connected|Not connected/);
    assert.throws(() => workbench.attend("x".repeat(501)), /500/);
  }));
test("server binds loopback, protects writes, and never sends externally", () =>
  sandbox(async (path) => {
    const instance = await startWorkbenchServer({ journalPath: path, port: 0 });
    try {
      const { url } = instance;
      const page = await fetch(url);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /One attendant/);
      const observed = await (await fetch(url + "/api/state")).json();
      assert.equal(observed.counters.needs, 1);
      const denied = await fetch(url + "/api/propose", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ needId: "garden.need.produce-001" })
      });
      assert.equal(denied.status, 403);
      const wrongHost = await fetch(url + "/api/state", { headers: { Host: "malicious.example" } });
      assert.equal(wrongHost.status, 403);
      const wrongOrigin = await fetch(url + "/api/propose", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "origin": "https://foreign.example",
          "x-jarvis-csrf": observed.csrfToken
        },
        body: JSON.stringify({ needId: "garden.need.produce-001" })
      });
      assert.equal(wrongOrigin.status, 403);
      const make = await fetch(url + "/api/propose", {
        method: "POST",
        headers: { "content-type": "application/json", "x-jarvis-csrf": observed.csrfToken },
        body: JSON.stringify({ needId: "garden.need.produce-001" })
      });
      assert.equal(make.status, 200);
      const { proposal } = await make.json();
      const hold = await fetch(url + "/api/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json", "x-jarvis-csrf": observed.csrfToken },
        body: JSON.stringify({ proposalId: proposal.id })
      });
      assert.equal((await hold.json()).receipt.kind, "HOLD");
      assert.equal(instance.app.state().outbox.length, 0);
    } finally { await instance.close(); }
  }));
