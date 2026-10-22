import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { gardenJar } from "./fixture.mjs";
import { propose, makeGrant, MockKinshipRelay, cross } from "./engine.mjs";

const jar = gardenJar();
const now = new Date().toISOString();
const proposal = propose(jar, "garden.need.produce-001", { at: now });
const relay = new MockKinshipRelay();
console.log("JAR;VIS Genesis 001 — fictional Waseca Garden demonstration");
console.log("PROPOSAL (not permission):");
console.log(JSON.stringify(proposal, null, 2));

const grants = [];
if (!process.argv.includes("--hold")) {
  const rl = createInterface({ input, output });
  try {
    for (const steward of proposal.stewards) {
      const answer = await rl.question("Authorize " + steward + " to join this exact MOCK broadcast? Type YES: ");
      if (answer.trim() === "YES") {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        grants.push(makeGrant({ proposal, steward, expiresAt }));
      }
    }
  } finally { rl.close(); }
}
const result = cross({ jar, proposal, grants, relay, at: new Date().toISOString() });
console.log("RECEIPT:", JSON.stringify(result.receipt, null, 2));
console.log("MOCK OUTBOX:", JSON.stringify(relay.outbox, null, 2));
console.log(result.returnText);
