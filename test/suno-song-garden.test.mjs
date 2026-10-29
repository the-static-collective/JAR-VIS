import test from "node:test";
import assert from "node:assert/strict";
import { prepareSunoHandoff, recordOperatorObservation, SUNO_MCP_URL } from "../src/suno-song-garden.mjs";

const fixture = () => ({
  schema: "jarvis.suno-song-seed/v1",
  origin: "fictional-fixture",
  seed: {
    id: "sample-church.porch-light-001",
    title: "Porch Light",
    lyrics: "We leave a little light on by the door.\nThere is room enough for one more.",
    style: "Acoustic 6/8 folk-gospel, gentle rhythm guitar and congregational response"
  },
  review: {
    sourceAdmitted: true,
    contributorPermissionRef: "FICTIONAL:consent-001",
    rightsReviewRef: "FICTIONAL:rights-001",
    privateGenerationApprovalRef: "FICTIONAL:private-only-001",
    creditSpendApprovalRef: "FICTIONAL:credits-001",
    withdrawn: false
  }
});

test("fixture yields deterministic private MCP handoff; no outside effects", () => {
  const a = prepareSunoHandoff(fixture());
  const b = prepareSunoHandoff(fixture());
  assert.deepEqual(a, b);
  assert.match(a.id, /^suno-handoff:[a-f0-9]{24}$/);
  assert.equal(a.provider.officialMcpUrl, SUNO_MCP_URL);
  assert.equal(a.privateCandidateOnly, true);
  assert.equal(a.songCreated, false);
  assert.equal(a.creditsSpent, false);
  assert.equal(a.publicationAuthorized, false);
  assert.equal(a.authenticationVerified, false);
  assert.match(a.prompt, /Porch Light/);
  assert.match(a.prompt, /ONE private candidate/);
});

test("HOLD on missing approval or permission, unknown review or withdrawn seed", () => {
  for (const field of ["contributorPermissionRef", "rightsReviewRef",
    "privateGenerationApprovalRef", "creditSpendApprovalRef"]) {
    const value = fixture();
    delete value.review[field];
    assert.throws(() => prepareSunoHandoff(value), /HOLD/);
  }
  const unadmitted = fixture(); unadmitted.review.sourceAdmitted = false;
  assert.throws(() => prepareSunoHandoff(unadmitted), /HOLD/);
  const withdrawn = fixture(); withdrawn.review.withdrawn = true;
  assert.throws(() => prepareSunoHandoff(withdrawn), /HOLD/);
  const unclear = fixture(); delete unclear.review.withdrawn;
  assert.throws(() => prepareSunoHandoff(unclear), /HOLD/);
  const hiddenData = fixture(); hiddenData.seed.email = "someone@example.org";
  assert.throws(() => prepareSunoHandoff(hiddenData), /HOLD/);
});

test("creative bytes are bound to distinct handoff ids", () => {
  const original = fixture(), changed = fixture();
  changed.seed.lyrics += "\nAn extra line.";
  assert.notEqual(prepareSunoHandoff(original).id, prepareSunoHandoff(changed).id);
});

test("reported Suno song is not represented as verified or stage-ready", () => {
  const handoff = prepareSunoHandoff(fixture());
  const result = recordOperatorObservation(handoff, {
    songUrl: "https://suno.com/song/example-123",
    note: "Manually observed in a test; not authenticated here"
  });
  assert.equal(result.status, "OPERATOR_REPORTED_UNVERIFIED");
  assert.equal(result.sunoApiVerified, false);
  assert.equal(result.audioExportVerified, false);
  assert.equal(result.staticLiveStageReady, false);
  assert.equal(result.churchAdoptionEstablished, false);
});

test("refuse non-Suno evidence, fake handoffs and suspicious URLs", () => {
  const handoff = prepareSunoHandoff(fixture());
  for (const url of [
    "http://suno.com/song/example", "https://suno.com.evil.test/song/x",
    "https://suno.com/song/x?token=secret", "https://suno.com/playlist/abc"
  ]) assert.throws(() => recordOperatorObservation(handoff, {songUrl: url, note: "checked"}), /HOLD/);
  assert.throws(() => recordOperatorObservation({ ...handoff, mode: "AUTO_GENERATE" },
    {songUrl: "https://suno.com/song/x", note: "checked"}), /HOLD/);
});
