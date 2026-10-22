import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectNativeTestimony } from "../src/native-testimony.mjs";
import { Workbench } from "../src/workbench.mjs";
import { startWorkbenchServer } from "../src/server.mjs";
const sum = (s) => createHash("sha256").update(s).digest("hex");
const at = "2026-10-21T21:20:00.000Z";
function report() {
  const card = "# Table & Road (DRAFT / fictional)\nWaseca produce: 12 boxes are needed and 20 boxes are offered. Human review and each participant's permission are required.\n";
  const review = "HOLD_HUMAN_REVIEW\nNumbers and fictional status verified locally; ask people before publication.\n";
  return {
    schema: "jarvis.house-party-live-testimony/v0",
    party_id: "native-" + "0".repeat(32),
    specimen: "fictional-table-road-card",
    disposition: "HOLD_HUMAN_REVIEW",
    card, card_sha256: sum(card), review, review_sha256: sum(review),
    guests: [
      { guest_id: "1".repeat(32), role: "DRAFTER", provider: "original-openmanus-worker", loadout_compiled: true, provider_receipt_disposition: "COMPLETED" },
      { guest_id: "2".repeat(32), role: "REVIEWER", provider: "original-openmanus-worker", loadout_compiled: true, provider_receipt_disposition: "COMPLETED" }
    ],
    elf_copies: [
      { occurrence_id: "3".repeat(32), original_elf_verified: true, model_executed_in_elf: false, receipt_sha256: "5".repeat(64), artifact_sha256: sum(card) },
      { occurrence_id: "4".repeat(32), original_elf_verified: true, model_executed_in_elf: false, receipt_sha256: "6".repeat(64), artifact_sha256: sum(review) }
    ],
    native_pins: {
      loadout: "dd5456d45946271e2d20d1dc6145b71576d2380b",
      workbench: "460b3788d01ec068001b5708654c045d2566532a",
      openmanus: "3309bf4e416fb1c74b008f3e86494439a31bad53"
    },
    authority: {
      human_permission_to_publish: false, receiver_admission: false,
      models_executed_within_elf: false, signed_relatte_receipts: false,
      os_sandbox_verified: false
    }
  };
}
async function sandbox(fn) {
  const path = await mkdtemp(join(tmpdir(), "jarvis-native-"));
  try { return await fn(join(path, "journal.jsonl")); }
  finally { await rm(path, { force: true, recursive: true }); }
}
test("reported native outputs remain unverified testimony, not execution proof", () => {
  const result = inspectNativeTestimony(report(), at);
  assert.equal(result.schema, "jarvis.native-testimony-observation/v0");
  assert.equal(result.verification, "UNVERIFIED_OPERATOR_TESTIMONY");
  assert.equal(result.disposition, "HOLD_HUMAN_REVIEW");
  assert.equal(result.published, false);
  assert.equal(result.admitted, false);
  assert.match(result.disclaimer, /cannot authenticate/);
});
test("native report rejects altered bytes, wrong pins, authority promotion and broken lineage", () => {
  for (const change of [
    (r) => { r.card += "inserted"; },
    (r) => { r.native_pins.openmanus = "a".repeat(40); },
    (r) => { r.authority.human_permission_to_publish = true; },
    (r) => { r.elf_copies[0].artifact_sha256 = r.review_sha256; },
    (r) => { r.elf_copies[1].model_executed_in_elf = true; },
    (r) => { r.guests[1].guest_id = r.guests[0].guest_id; },
    (r) => { r.disposition = "APPROVED"; },
    (r) => { r.card = r.card + " https://example.com"; r.card_sha256 = sum(r.card); }
  ]) {
    const data = report(); change(data);
    assert.throws(() => inspectNativeTestimony(data, at), /refused/i);
  }
});
test("local import only journals a report, deduplicates, and cannot dispatch", () =>
  sandbox(async (journalPath) => {
    const wb = await Workbench.open({ journalPath, clock: () => at });
    const first = await wb.importNativeReport(report());
    assert.equal(first.reused, false);
    assert.equal(first.observation.verification, "UNVERIFIED_OPERATOR_TESTIMONY");
    const second = await wb.importNativeReport(report());
    assert.equal(second.reused, true);
    const current = wb.state();
    assert.equal(current.nativeObservations.length, 1);
    assert.equal(current.events.length, 1);
    assert.equal(current.counters.nativeReports, 1);
    assert.equal(current.proposals.length, 0);
    assert.equal(current.outbox.length, 0);
    const reopened = await Workbench.open({ journalPath, clock: () => at });
    assert.deepEqual(reopened.state().nativeObservations, current.nativeObservations);
  }));
test("import API is same-origin gated and never launches provider process", () =>
  sandbox(async (journalPath) => {
    const wb = await Workbench.open({ journalPath, clock: () => at });
    const server = await startWorkbenchServer({ workbench: wb, port: 0 });
    try {
      const state = await (await fetch(server.url + "/api/state")).json();
      const unauthorized = await fetch(server.url + "/api/import-native", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(report())
      });
      assert.equal(unauthorized.status, 403);
      const ok = await fetch(server.url + "/api/import-native", {
        method: "POST",
        headers: { "content-type": "application/json", "x-jarvis-csrf": state.csrfToken },
        body: JSON.stringify(report())
      });
      assert.equal(ok.status, 200);
      const answer = await ok.json();
      assert.equal(answer.observation.validation, "FORMAT_AND_DIGEST_CHECK_ONLY");
      assert.equal(wb.state().counters.mockRelays, 0);
    } finally { await server.close(); }
  }));
