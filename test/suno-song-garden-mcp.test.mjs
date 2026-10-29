import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const server = new URL("../tools/suno-song-garden-mcp.mjs", import.meta.url);
const fixture = new URL("../examples/suno-song-garden-001/fixture.json", import.meta.url);
function send(messages, env = {}) {
  const result = spawnSync(process.execPath, [server.pathname], {
    input: messages.map(x => JSON.stringify({ jsonrpc: "2.0", ...x })).join("\n") + "\n",
    encoding: "utf8", timeout: 4000, env: {...process.env, ...env}
  });
  assert.equal(result.status, 0, result.stderr || "MCP server failed");
  return result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}
test("stdio MCP announces only a local no-effect song handoff tool", () => {
  const result = send([
    {id: 1, method: "initialize", params: {protocolVersion: "2025-06-18", capabilities:{}, clientInfo:{name:"test",version:"1"}}},
    {method: "notifications/initialized"},
    {id: 2, method: "tools/list"},
    {id: 3, method: "tools/call", params: {
      name: "jarvis_prepare_private_suno_seed", arguments: {seedId:"sample-church.porch-light-001"}
    }}
  ]);
  assert.equal(result.length, 3);
  assert.equal(result.find(x=>x.id===1).result.protocolVersion, "2025-06-18");
  assert.equal(result.find(x=>x.id===2).result.tools.length, 1);
  const handoff = JSON.parse(result.find(x=>x.id===3).result.content[0].text);
  assert.equal(handoff.mode, "OPERATOR_HANDOFF_ONLY");
  assert.equal(handoff.creditsSpent, false);
  assert.equal(handoff.publicationAuthorized, false);
});
test("MCP refuses synthesized permissions, arbitrary paths and withdrawn source", () => {
  const bad = send([{id: 4, method:"tools/call",params:{
    name:"jarvis_prepare_private_suno_seed",
    arguments:{seedId:"sample-church.porch-light-001",path:"/tmp/evil.json"}
  }}]);
  assert.equal(bad[0].result.isError, true);
  const dir = mkdtempSync(join(tmpdir(),"jarvis-suno-mcp-test-"));
  try {
    const doc = JSON.parse(readFileSync(fixture,"utf8"));
    doc.review.withdrawn = true;
    const target = join(dir,"withdrawn.json");
    writeFileSync(target,JSON.stringify(doc));
    const revoked = send([{id: 5,method:"tools/call",params:{
      name:"jarvis_prepare_private_suno_seed", arguments:{seedId:doc.seed.id}
    }}], {JARVIS_SUNO_GARDEN_SEED_PATH:target});
    assert.equal(revoked[0].result.isError,true);
    assert.match(revoked[0].result.content[0].text,/HOLD/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
