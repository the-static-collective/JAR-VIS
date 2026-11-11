#!/usr/bin/env node
// Manual local intake, not a live authority or network integration.
import {readFile} from "node:fs/promises";
import {parseOrg002LocalFile, receiveOrg002Report} from "../src/motif-org002.mjs";

if (!process.argv[2]) {
  process.stderr.write("Usage: node bin/motif-org002.mjs <local-ORG002-result.json>\n");
  process.exitCode = 2;
} else {
  try {
    const report = parseOrg002LocalFile(await readFile(process.argv[2]));
    process.stdout.write(JSON.stringify(receiveOrg002Report(report),null,2)+"\n");
  } catch (error) {
    process.stderr.write(String(error?.message||"HOLD_ORG002_UNEXPECTED")+"\n");
    process.exitCode = 1;
  }
}
