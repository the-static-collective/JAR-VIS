import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composeFixtureGardenParty, inspectCard } from "../src/house-party.mjs";
import { gardenJar } from "../src/fixture.mjs";
import { Jar } from "../src/engine.mjs";
import { Workbench } from "../src/workbench.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const now = () => "2026-10-21T21:35:00.000Z";
async function sandbox(action) {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-party-"));
  try { return await action(join(dir, "journal.jsonl")); }
  finally { await rm(dir, { force: true, recursive: true }); }
}
function fixture() {
  let n = 0;
  return composeFixtureGardenParty({
    jar: gardenJar(), at: now(), ids: () => "fixture-id-" + (++n)
  });
}
test("party outputs a bounded fictional Table & Road card", () => {
  const result = fixture();
  assert.equal(result.schema, "jarvis.house-party/v0");
  assert.equal(result.artifact.schema, "jarvis.table-road-card/v0");
  assert.match(result.artifact.body, /fictional demonstration/);
  assert.match(result.artifact.body, /12 boxes/);
  assert.match(result.artifact.body, /20 boxes/);
  assert.equal(result.review.disposition, "HOLD_HUMAN_REVIEW");
  assert.equal(result.artifact.authorizedForPublication, false);
  assert.equal(result.guests.length, 2);
  assert.notEqual(result.guests[0].id, result.guests[1].id);
  assert.ok(result.guests.every((v) => v.modelInvoked === false &&
    v.originalElfHatchInvoked === false && v.authorityInherited === false));
  assert.ok(Object.values(result.trust).every((v) => v === false));
});
test("review examines actual bytes and context independently from draft claims", () => {
  const result = fixture();
  const jar = gardenJar();
  const need = jar.get("garden.need.produce-001");
  const offer = jar.get("garden.offer.produce-001");
  assert.equal(inspectCard({ draft: result.artifact, need, offer }).passed, true);
  assert.equal(inspectCard({
    draft: { ...result.artifact, body: result.artifact.body + "NEW TEXT" }, need, offer
  }).disposition, "REFUSE_DRAFT");
  assert.equal(inspectCard({
    draft: { ...result.artifact, source: { needId: "not-the-need", offerId: offer.id } }, need, offer
  }).disposition, "REFUSE_DRAFT");
  assert.equal(inspectCard({
    draft: result.artifact, need, offer: { ...offer, quantity: 9 }
  }).disposition, "REFUSE_DRAFT");
});
test("refuse parties when the synthetic source stops matching", () => {
  const jar = gardenJar();
  const need = jar.get("garden.need.produce-001");
  const offer = { ...jar.get("garden.offer.produce-001"), status: "closed" };
  assert.throws(() => composeFixtureGardenParty({ jar: new Jar([need, offer]) }), /HOLD/);
});
test("workbench journals a fixture party; no prior Garden proposal or broadcast", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({ journalPath, clock: now });
    const prior = workbench.state();
    assert.equal(prior.parties.length, 0);
    const { party, published } = await workbench.hostFixtureParty();
    assert.equal(published, false);
    assert.equal(party.review.disposition, "HOLD_HUMAN_REVIEW");
    const after = workbench.state();
    assert.equal(after.parties.length, 1);
    assert.equal(after.counters.parties, 1);
    assert.equal(after.proposals.length, 0);
    assert.equal(after.outbox.length, 0);
    assert.equal(after.events[0].kind, "PARTY_COMPLETED");
    const restarted = await Workbench.open({ journalPath, clock: now });
    assert.deepEqual(restarted.state().parties, after.parties);
  }));
test("every fixture party uses separate occurrence IDs and no authority inheritance", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({ journalPath, clock: now });
    const p1 = (await workbench.hostFixtureParty()).party;
    const p2 = (await workbench.hostFixtureParty()).party;
    assert.notEqual(p1.id, p2.id);
    assert.notEqual(p1.guests[0].id, p2.guests[0].id);
    assert.equal(workbench.state().counters.parties, 2);
    assert.equal(workbench.state().outbox.length, 0);
  }));
test("party endpoint needs same-origin anti-CSRF and never triggers a model", () =>
  sandbox(async (journalPath) => {
    const wb = await Workbench.open({ journalPath, clock: now });
    const instance = await startWorkbenchServer({ workbench: wb, port: 0 });
    try {
      const url = instance.url;
      const state = await (await fetch(url + "/api/state")).json();
      const unapproved = await fetch(url + "/api/house-party", {
        method: "POST", headers: { "content-type": "application/json" }, body: "{}"
      });
      assert.equal(unapproved.status, 403);
      assert.equal(wb.state().parties.length, 0);
      const actual = await fetch(url + "/api/house-party", {
        method: "POST",
        headers: { "content-type": "application/json", "x-jarvis-csrf": state.csrfToken },
        body: "{}"
      });
      assert.equal(actual.status, 200);
      const party = (await actual.json()).party;
      assert.equal(party.trust.openmanusExecuted, false);
      assert.equal(party.trust.elfActualHatches, false);
      assert.equal(wb.state().outbox.length, 0);
    } finally { await instance.close(); }
  }));
