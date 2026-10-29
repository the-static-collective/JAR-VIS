#!/usr/bin/env node
/**
 * Minimal, local, read-only MCP stdio adapter for the owner-held Suno song garden.
 * No Suno calls, no generated permissions, no network, no disk writes.
 * A fixed operator-chosen seed file is reloaded on every tool call so withdrawal
 * changes are honored. stdout is reserved for JSON-RPC.
 */
import { createInterface } from "node:readline";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prepareSunoHandoff } from "../src/suno-song-garden.mjs";

const DEFAULT_FIXTURE = fileURLToPath(new URL("../examples/suno-song-garden-001/fixture.json", import.meta.url));
const seedFile = process.env.JARVIS_SUNO_GARDEN_SEED_PATH || DEFAULT_FIXTURE;
const toolName = "jarvis_prepare_private_suno_seed";
const tool = {
  name: toolName,
  title: "Prepare private Suno candidate",
  description: "Reads one operator-maintained local approved seed, rechecks withdrawal and separate private-generation/credit permissions, and returns a held, private-only prompt for the official Suno MCP. Does NOT create music, verify human permission, or spend credits.",
  inputSchema: {
    type: "object",
    properties: { seedId: {type: "string", description: "Exact local reviewed seed identifier"} },
    required: ["seedId"],
    additionalProperties: false
  }
};
function emit(message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
}
function error(id, code, message) {
  emit({id, error: {code, message}});
}
async function dispatch(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") return;
  if (!Object.hasOwn(message, "id")) return; // notifications
  const { id, method, params = {} } = message;
  if (method === "initialize") {
    return emit({id, result: {
      protocolVersion: "2025-06-18",
      capabilities: {tools: {listChanged: false}},
      serverInfo: {name: "jarvis-suno-song-garden", version: "0.1.0"}
    }});
  }
  if (method === "ping") return emit({id, result: {}});
  if (method === "tools/list") return emit({id, result: {tools: [tool]}});
  if (method === "tools/call" && params.name === toolName) {
    try {
      if (!params.arguments || typeof params.arguments.seedId !== "string" ||
          Object.keys(params.arguments).length !== 1) throw new Error("HOLD: exact seedId required");
      // Never accept a file path or review assertion from a remote AI tool argument.
      const data = JSON.parse(await readFile(seedFile, "utf8"));
      if (data.seed?.id !== params.arguments.seedId) throw new Error("HOLD: seed not in operator-approved local file");
      const handoff = prepareSunoHandoff(data);
      return emit({id, result: {content: [{type: "text", text: JSON.stringify(handoff)}]}});
    } catch (err) {
      return emit({id, result: {isError: true, content: [
        {type: "text", text: err.message?.startsWith("HOLD:") ? err.message : "HOLD: unable to inspect local seed"}
      ]}});
    }
  }
  return error(id, -32601, "Unsupported MCP operation");
}
const input = createInterface({input: process.stdin, crlfDelay: Infinity});
input.on("line", line => {
  if (Buffer.byteLength(line, "utf8") > 32 * 1024) return;
  try {
    const message = JSON.parse(line);
    dispatch(message).catch(() => { if (Object.hasOwn(message, "id")) error(message.id, -32603, "Internal MCP error"); });
  } catch {
    error(null, -32700, "Invalid JSON");
  }
});
