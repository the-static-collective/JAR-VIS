#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { prepareSunoHandoff, recordOperatorObservation } from "../src/suno-song-garden.mjs";

function usage() {
  process.stderr.write([
    "Usage:",
    "  node tools/suno-song-garden.mjs prepare path/to/seed.json",
    "  node tools/suno-song-garden.mjs receipt path/to/handoff.json https://suno.com/song/ID 'manual note'",
    "",
    "No Suno login, network call, credit spending, publishing or music generation occurs here.",
    "After prepare, a human submits the prompt in an authorized Suno MCP host."
  ].join("\n") + "\n");
  process.exitCode = 2;
}
async function run(argv) {
  const [command, filename, songUrl, note] = argv;
  if ((command !== "prepare" && command !== "receipt") || !filename ||
      (command === "receipt" && (!songUrl || !note))) return usage();
  const packet = JSON.parse(await readFile(filename, "utf8"));
  const output = command === "prepare" ?
    prepareSunoHandoff(packet) :
    recordOperatorObservation(packet, { songUrl, note });
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}
run(process.argv.slice(2)).catch(error => {
  process.stderr.write((error.code === "HOLD" ? error.message : "Unable to complete Suno handoff") + "\n");
  process.exitCode = 1;
});
