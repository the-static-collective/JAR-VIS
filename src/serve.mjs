import { resolve } from "node:path";
import { startWorkbenchServer } from "./server.mjs";

const port = Number(process.env.JARVIS_PORT ?? 7789);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("JARVIS_PORT must be an integer from 1 to 65535");
}
const journalPath = resolve(process.env.JARVIS_JOURNAL ?? ".local/jarvis-events.jsonl");
const server = await startWorkbenchServer({ journalPath, port });
console.log("JAR;VIS Genesis 002 — local attendant workbench");
console.log("Open: " + server.url);
console.log("Mode: LOCAL / SYNTHETIC / MOCK. Not accessible from other computers.");
console.log("Journal: " + journalPath);
