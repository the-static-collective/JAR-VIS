import test from "node:test";
import assert from "node:assert/strict";
import {
  Jar, MockKinshipRelay, observe, propose, understand, makeGrant, cross
} from "../src/engine.mjs";
import { gardenJar } from "../src/fixture.mjs";

const t0 = "2026-10-21T12:00:00.000Z";
const t1 = "2026-10-21T12:01:00.000Z";
const future = "2026-10-21T13:00:00.000Z";
function setup() {
  const jar = gardenJar();
  const proposal = propose(jar, "garden.need.produce-001", { at: t0 });
  const relay = new MockKinshipRelay();
  const grants = proposal.stewards.map((steward) =>
    makeGrant({ proposal, steward, expiresAt: future }));
  return { jar, proposal, relay, grants };
}

test("observe preserves two particulars and produces one candidate", () => {
  const jar = gardenJar();
  assert.equal(observe(jar).needs.length, 1);
  assert.equal(observe(jar).offers.length, 1);
  assert.ok(understand(jar, "garden.need.produce-001"));
  assert.ok(propose(jar, "garden.need.produce-001", { at: t0 }).id.startsWith("jarvis-proposal-v0:"));
});
test("proposing alone never dispatches", () => {
  const { jar, proposal, relay } = setup();
  const result = cross({ jar, proposal, relay, at: t1 });
  assert.equal(result.receipt.kind, "HOLD");
  assert.equal(result.receipt.semanticEffect, "none");
  assert.deepEqual(relay.outbox, []);
});
test("one steward is insufficient", () => {
  const { jar, proposal, relay, grants } = setup();
  assert.equal(cross({ jar, proposal, relay, grants: grants.slice(0, 1), at: t1 }).receipt.kind, "HOLD");
  assert.equal(relay.outbox.length, 0);
});
test("two matching grants permit mock-only relay", () => {
  const { jar, proposal, relay, grants } = setup();
  const result = cross({ jar, proposal, relay, grants, at: t1 });
  assert.equal(result.receipt.kind, "MOCK_RELAYED");
  assert.equal(result.receipt.externalDelivery, false);
  assert.equal(result.message.transmittedExternally, false);
  assert.equal(relay.outbox.length, 1);
});
test("expired, wrong-scope, and wrong-proposal grants HOLD", () => {
  const { jar, proposal, relay, grants } = setup();
  for (const patch of [
    { expiresAt: t0 },
    { audience: "internet-public" },
    { action: "kinship.send.real" },
    { proposalId: "someone-else" },
    { decision: "deny" }
  ]) {
    const changed = [{ ...grants[0], ...patch }, grants[1]];
    assert.equal(cross({ jar, proposal, relay, grants: changed, at: t1 }).receipt.kind, "HOLD");
  }
  assert.equal(relay.outbox.length, 0);
});
test("tampering with proposal identity and its snapshots causes HOLD", () => {
  const { jar, proposal, relay, grants } = setup();
  assert.equal(cross({ jar, proposal: { ...proposal, offerId: "bad" }, relay, grants, at: t1 }).receipt.kind, "HOLD");
  const updated = jar.get("garden.offer.produce-001");
  updated.quantity = 19;
  const changedJar = new Jar([jar.get("garden.need.produce-001"), updated]);
  assert.equal(cross({ jar: changedJar, proposal, relay, grants, at: t1 }).receipt.kind, "HOLD");
});
test("different category, region, or insufficient inventory prevents proposal", () => {
  const original = gardenJar();
  const need = original.get("garden.need.produce-001");
  const offer = original.get("garden.offer.produce-001");
  for (const patch of [{ category: "milk" }, { region: "elsewhere" }, { quantity: 11 }, { status: "closed" }]) {
    const jar = new Jar([need, { ...offer, ...patch }]);
    assert.equal(propose(jar, need.id, { at: t0 }), null);
  }
});
test("repeat dispatch is mock-idempotent", () => {
  const { jar, proposal, relay, grants } = setup();
  const first = cross({ jar, proposal, relay, grants, at: t1 });
  const second = cross({ jar, proposal, relay, grants, at: t1 });
  assert.equal(first.message.duplicate, false);
  assert.equal(second.message.duplicate, true);
  assert.equal(relay.outbox.length, 1);
});
test("the JAR copies incoming and outgoing particulars", () => {
  const jar = gardenJar();
  const fetched = jar.get("garden.need.produce-001");
  fetched.quantity = 999;
  assert.equal(jar.get(fetched.id).quantity, 12);
});
test("the demo never offers a real adapter", () => {
  const { jar, proposal, grants } = setup();
  assert.throws(() => cross({ jar, proposal, grants, relay: { send() {} }, at: t1 }), /MockKinshipRelay/);
});
