import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectPublicDoor, sourceForDoor } from "../src/public-doors.mjs";
import { Workbench } from "../src/workbench.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const GHOST_DOC = "# Executor Pantry\n\n## V0 executors\n\n- Python\n- Git\n- ffmpeg\n- ffprobe\n- llama.cpp\n- whisper.cpp\n- Piper\n- ImageMagick\n\n## Example\n";
const PLAN_DOC = "# planZ\n\n**Global plan census, archaeology, and disposition for the Static Collective.**\n\nThis is a provenance-preserving index and recovery surface.\n";
const clock = () => "2026-10-21T21:00:00.000Z";
function mockFetch(body, options = {}) {
  const calls = [];
  const reader = async (url, request) => {
    calls.push({ url, request });
    return new Response(body, {
      status: options.status ?? 200,
      headers: { "content-type": options.type ?? "text/plain; charset=utf-8" }
    });
  };
  return { reader, calls };
}
async function sandbox(fn) {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-door-"));
  try { return await fn(join(dir, "ledger.jsonl")); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
test("GHoT source door reads fixed public URL, derives documentary executor declarations", async () => {
  const { reader, calls } = mockFetch(GHOST_DOC);
  const observed = await inspectPublicDoor("ghot", { fetchImpl: reader, now: clock });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url,
    "https://raw.githubusercontent.com/the-static-collective/GHoT/main/docs/EXECUTOR-PANTRY.md");
  assert.equal(calls[0].request.method, "GET");
  assert.equal(calls[0].request.redirect, "error");
  assert.equal(observed.capabilities.length, 8);
  assert.equal(observed.capabilities[3].label, "ffprobe");
  assert.match(observed.contentSha256, /^[0-9a-f]{64}$/);
  assert.equal(observed.admission, "none");
  assert.equal(observed.runtimeConnected, false);
  assert.ok(observed.capabilities.every((c) => c.callable === false));
});
test("planZ source door reads the owner-authored purpose rather than invented plan API", async () => {
  const { reader, calls } = mockFetch(PLAN_DOC);
  const observed = await inspectPublicDoor("planz", { fetchImpl: reader, now: clock });
  assert.equal(calls[0].url,
    "https://raw.githubusercontent.com/the-static-collective/planZ/main/README.md");
  assert.equal(observed.capabilities[0].kind, "documented-project-purpose");
  assert.equal(observed.capabilities[0].runtimeAvailability, "not-observed");
});
test("unknown names cannot become arbitrary network destinations", async () => {
  let outbound = 0;
  await assert.rejects(
    inspectPublicDoor("https://127.0.0.1:8080/secret", { fetchImpl: async () => { outbound++; } }),
    /Invalid door ID/
  );
  await assert.rejects(
    inspectPublicDoor("arbitrary", { fetchImpl: async () => { outbound++; } }),
    /not allowlisted/
  );
  assert.equal(outbound, 0);
  assert.equal(sourceForDoor("__proto__"), null);
});
test("malformed or adversarial content is not admitted as capability", async () => {
  for (const text of [
    "# A page without declared executors\n",
    "# X\n## V0 executors\n- Good\n- Good\n## END\n",
    "# X\n## V0 executors\n- <script>evil</script>\n## END\n"
  ]) {
    await assert.rejects(inspectPublicDoor("ghot", { fetchImpl: mockFetch(text).reader }),
      /Expected|Invalid/);
  }
});
test("non-successful, oversized and wrong content-type responses fail closed", async () => {
  const calls = [
    mockFetch("not found", { status: 404 }).reader,
    mockFetch(GHOST_DOC, { type: "text/html" }).reader,
    mockFetch("x".repeat(130 * 1024)).reader
  ];
  for (const reader of calls) {
    await assert.rejects(inspectPublicDoor("ghot", { fetchImpl: reader }));
  }
});
test("read-only inspection persists provenance without granting execution authority", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({
      journalPath, clock,
      sourceReader: (id) => inspectPublicDoor(id, { fetchImpl: mockFetch(id === "ghot" ? GHOST_DOC : PLAN_DOC).reader, now: clock })
    });
    const before = workbench.state();
    assert.equal(before.sourceObservations.length, 0);
    assert.equal(before.outbox.length, 0);
    const result = await workbench.inspectDoor("ghot");
    assert.equal(result.admittedAction, false);
    const after = workbench.state();
    assert.equal(after.sourceObservations.length, 1);
    assert.equal(after.sourceObservations[0].capabilities.length, 8);
    assert.equal(after.events[0].kind, "DOOR_INSPECTED");
    assert.equal(after.proposals.length, 0);
    assert.equal(after.outbox.length, 0);
    assert.ok(after.doors.every((door) => door.connected === false));
    const restarted = await Workbench.open({ journalPath, clock });
    assert.deepEqual(restarted.state().sourceObservations, after.sourceObservations);
    assert.match(restarted.attend("What about GHoT?").answer, /Previously observed/);
  }));
test("failed sources leave journal and trust state untouched", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({
      journalPath, clock, sourceReader: async () => { throw Error("no network"); }
    });
    await assert.rejects(workbench.inspectDoor("ghot"), /unavailable or invalid/);
    await assert.rejects(workbench.inspectDoor("kinship"), /allowlisted public source/);
    assert.equal(workbench.state().events.length, 0);
  }));
test("fabricated callable capabilities cannot be journaled via a reader", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({ journalPath, clock,
      sourceReader: async () => ({
        schema: "jarvis.public-door-observation/v0", doorId: "ghot",
        access: "public-read-only", admission: "none", runtimeConnected: false,
        capabilities: [{ id: "fake", callable: true }]
      })
    });
    await assert.rejects(workbench.inspectDoor("ghot"), /read-only boundary/);
    assert.equal(workbench.state().sourceObservations.length, 0);
  }));
test("HTTP POST source inspection is explicit and anti-CSRF protected", () =>
  sandbox(async (journalPath) => {
    const workbench = await Workbench.open({ journalPath, clock,
      sourceReader: (id) => inspectPublicDoor(id, {
        fetchImpl: mockFetch(GHOST_DOC).reader, now: clock
      })
    });
    const server = await startWorkbenchServer({ workbench, port: 0 });
    try {
      const url = server.url;
      const initial = await (await fetch(url + "/api/state")).json();
      const forbidden = await fetch(url + "/api/inspect-door", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ doorId: "ghot" })
      });
      assert.equal(forbidden.status, 403);
      const allowed = await fetch(url + "/api/inspect-door", {
        method: "POST", headers: {
          "content-type": "application/json", "x-jarvis-csrf": initial.csrfToken
        }, body: JSON.stringify({ doorId: "ghot" })
      });
      assert.equal(allowed.status, 200);
      assert.equal((await allowed.json()).observation.capabilities.length, 8);
      const after = await (await fetch(url + "/api/state")).json();
      assert.equal(after.sourceObservations.length, 1);
      assert.equal(after.counters.mockRelays, 0);
    } finally { await server.close(); }
  }));
