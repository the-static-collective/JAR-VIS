import test from "node:test";
import assert from "node:assert/strict";
import { planTriage, TRIAGE_DECISIONS } from "../live/reviewer-operator/policy.mjs";

test("all reviewer transitions are explicit and withheld from withdrawn records", () => {
  assert.deepEqual(new Set(TRIAGE_DECISIONS),
    new Set(["start","conflict_clear","conflict_hold","invite","accept","decline","close"]));
  const r={status:"WITHDRAWN",conflict_disposition:"NO_KNOWN_CONFLICT_REVIEWED"};
  for(const a of TRIAGE_DECISIONS)assert.equal(planTriage(r,a,{}).allowed,false);
  assert.equal(planTriage({status:"PENDING"},"accept",{humanConsentConfirmed:true}).allowed,false);
  assert.equal(planTriage({status:"PENDING"},"start",{}).patch.status,"SCREENING");
});
test("conflict unknown prevents invitation until operator explicitly records screening", () => {
 const r={status:"SCREENING",conflict_disposition:"UNCHECKED"};
 assert.equal(planTriage(r,"invite",{humanContactConfirmed:true}).why,"CONFLICT_REVIEW_REQUIRED");
 assert.equal(planTriage(r,"conflict_clear",{}).allowed,false);
 const screened=planTriage(r,"conflict_clear",{conflictCheckConfirmed:true});
 assert.equal(screened.patch.conflict_disposition,"NO_KNOWN_CONFLICT_REVIEWED");
 assert.equal(screened.verified,false);
 assert.equal(planTriage({...r,conflict_disposition:"NO_KNOWN_CONFLICT_REVIEWED"},"invite",{}).allowed,false);
 const invited=planTriage({...r,conflict_disposition:"NO_KNOWN_CONFLICT_REVIEWED"},"invite",{humanContactConfirmed:true});
 assert.equal(invited.allowed,true);
 assert.equal(invited.patch.status,"INVITED");
 assert.equal(invited.public,false);
});
test("accepted is still an operator claim and cannot imply authenticated identity", () => {
 const r={status:"INVITED"};
 assert.equal(planTriage(r,"accept",{}).why,"RECIPIENT_ACCEPTANCE_ATTESTATION_REQUIRED");
 const accepted=planTriage(r,"accept",{humanConsentConfirmed:true});
 assert.deepEqual(accepted.patch,{status:"ACCEPTED"});
 assert.equal(accepted.verified,false);
 assert.equal(accepted.recipientAcceptanceOnlyClaimed,true);
 assert.equal(planTriage({status:"ACCEPTED"},"close",{}).allowed,true);
 assert.equal(planTriage({status:"ACCEPTED"},"invite",{humanContactConfirmed:true}).allowed,false);
});
test("decline and close terminate responsibly without manufacturing success", () => {
 for(const x of ["PENDING","SCREENING","INVITED","ACCEPTED"])
  assert.equal(planTriage({status:x},"decline",{}).patch.status,"DECLINED");
 assert.equal(planTriage({status:"DECLINED"},"close",{}).patch.status,"CLOSED");
 assert.equal(planTriage({status:"CLOSED"},"start",{}).allowed,false);
 assert.equal(planTriage({status:"INVITED"},"close",{}).allowed,false);
 assert.equal(planTriage({status:"SCREENING"},"conflict_hold",{}).patch.conflict_disposition,"CONFLICT_HOLD");
});
