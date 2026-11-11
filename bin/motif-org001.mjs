#!/usr/bin/env node
// Manual file crossing ONLY. No network, app/server update, or persistence.
import {readFile} from "node:fs/promises";
import {parseMotifOrg001File, receiveMotifOrg001} from "../src/motif-org001.mjs";

const file = process.argv[2];
if (!file) {
  process.stderr.write("Usage: node bin/motif-org001.mjs <local-MOTIF-report.json>\n");
  process.exitCode = 2;
} else {
  try {
    const bytes = await readFile(file);
    const triage = receiveMotifOrg001(parseMotifOrg001File(bytes));
    process.stdout.write(JSON.stringify(triage, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(String(error?.message || "HOLD_UNEXPECTED") + "\n");
    process.exitCode = 1;
  }
}
