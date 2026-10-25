import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Workbench } from "../src/workbench.mjs";
import { projectHeartbeat, fixtureWitness, HEARTBEAT_STAGES } from "../src/heartbeat.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const clock = () => "2026-10-25T13:00:00.000Z";
async function withFixture(callback) {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-heartbeat-"));
  const journalPath = join(dir, "journal.jsonl");
  try { return await callback(journalPath); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test("one shared contract preserves ordered phases without authorizing an effect", () => {
  const h = projectHeartbeat();
  assert.equal(h.schema, "jarvis.heartbeat/v0");
  assert.deepEqual(h.phases.map((x) => x.stage), HEARTBEAT_STAGES);
  assert.equal(h.phases[0].status, "unmatched");
  assert.equal(h.externalAction, false);
  assert.equal(h.realWorldFulfillment, "not-established");
});

test("discovery and proposal do not become completed work", () =>
  withFixture(async (journalPath) => {
    const app = await Workbench.open({ journalPath, clock });
    let heart = app.state().heartbeats[0];
    assert.equal(heart.phases[0].status, "observed");
    assert.equal(heart.phases[1].status, "waiting");
    assert.equal(heart.phases[2].status, "hold");
    const { proposal } = await app.proposeNeed("garden.need.produce-001");
    heart = app.state().heartbeats[0];
    assert.equal(heart.proposalId, proposal.id);
    assert.equal(heart.phases[1].status, "proposed");
    assert.equal(heart.phases[2].status, "hold");
    assert.equal(heart.phases[4].status, "not-started");
    await assert.rejects(
      app.witnessMock({ proposalId: proposal.id, disposition: "fixture-complete", note: "Demo boxes moved" }),
      /mock crossing is required/
    );
    assert.equal(app.state().counters.fixtureWitnesses, 0);
  }));

test("mock crossing can be witnessed once and replayed, never verified", () =>
  withFixture(async (journalPath) => {
    const app = await Workbench.open({ journalPath, clock });
    const { proposal } = await app.proposeNeed("garden.need.produce-001");
    for (const steward of proposal.stewards) {
      await app.grant({ proposalId: proposal.id, steward, decision: "approve" });
    }
    let heart = app.state().heartbeats[0];
    assert.equal(heart.phases[2].status, "gate-ready-demo");
    const dispatched = await app.dispatch(proposal.id);
    assert.equal(dispatched.receipt.kind, "MOCK_RELAYED");
    heart = app.state().heartbeats[0];
    assert.equal(heart.phases[2].status, "mock-recorded");
    assert.equal(heart.phases[3].status, "awaiting-testimony");
    await assert.rejects(
      app.witnessMock({ proposalId: proposal.id, disposition: "completed", note: "No" }),
      /Unsupported fixture/
    );
    const first = await app.witnessMock({
      proposalId: proposal.id, disposition: "fixture-partial", note: "Only a small part in this local simulation"
    });
    assert.equal(first.reused, false);
    assert.equal(first.witness.verified, false);
    assert.equal(first.witness.physicalFulfillmentEstablished, false);
    assert.equal(first.witness.externalPublication, false);
    const second = await app.witnessMock({
      proposalId: proposal.id, disposition: "fixture-blocked", note: "Different claim"
    });
    assert.equal(second.reused, true);
    assert.deepEqual(first.witness, second.witness);
    const restarted = await Workbench.open({ journalPath, clock });
    heart = restarted.state().heartbeats[0];
    assert.equal(heart.phases[3].status, "unverified-fixture-report");
    assert.equal(heart.phases[4].status, "local-fixture-return");
    assert.equal(heart.realWorldFulfillment, "not-established");
    assert.equal(restarted.state().counters.fixtureWitnesses, 1);
    assert.equal(restarted.state().outbox.length, 1);
  }));

test("fixture witness builder refuses invented effects, scopes, and long notes", () => {
  const proposal = { schema: "jarvis.proposal/v0", id: "p0" };
  const mock = { proposalId: "p0", receipt: { kind: "MOCK_RELAYED", externalDelivery: false } };
  assert.throws(() => fixtureWitness({ proposal, outcome: { ...mock, proposalId: "p1" },
    disposition: "fixture-complete", note: "Mock result", at: clock() }), /crossing is required/);
  assert.throws(() => fixtureWitness({ proposal, outcome: mock,
    disposition: "fixture-complete", note: "a".repeat(241), at: clock() }), /3–240/);
  assert.equal(fixtureWitness({ proposal, outcome: mock,
    disposition: "fixture-blocked", note: "Still not done", at: clock() }).verified, false);
});

test("local HTTP witness endpoint keeps same host and CSRF restrictions", () =>
  withFixture(async (journalPath) => {
    const server = await startWorkbenchServer({ journalPath, port: 0 });
    try {
      const state = await (await fetch(server.url + "/api/state")).json();
      assert.ok(state.heartbeats.length);
      const denied = await fetch(server.url + "/api/heartbeat-witness", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposalId: "absent", note: "Mock only", disposition: "fixture-blocked" })
      });
      assert.equal(denied.status, 403);
      const unknown = await fetch(server.url + "/api/heartbeat-witness", {
        method: "POST", headers: { "content-type": "application/json", "x-jarvis-csrf": state.csrfToken },
        body: JSON.stringify({ proposalId: "absent", note: "Mock only", disposition: "fixture-blocked" })
      });
      assert.equal(unknown.status, 404);
    } finally { await server.close(); }
  }));
