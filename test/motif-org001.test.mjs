import test from "node:test";
import assert from "node:assert/strict";
import {receiveMotifOrg001, parseMotifOrg001File} from "../src/motif-org001.mjs";

function fixture() {
  return {
    kind:"MOTIF_ORG_001_DIAGNOSTIC",
    world_id:"FICTIONAL_BASEMENT_SUPPER", as_of:"2026-11-11", outcome:"A fictional meal",
    receipts:{no_external_actions:true,no_permission_inferred_from_silence:true,observations_are_not_confirmations:true},
    local_handoff_drafts:[{
      id:"ask_budget_for_specific_yes_no",producer:"MOTIF.ORG-001",
      receiver_candidates:["JAR-VIS","planZ","reLATTE"],scope:"LOCAL_REVIEW_ONLY",
      disclosure:"PRIVATE_UNTIL_REVIEWED",state:"HOLD",
      summary:"A proposed question only",hypothesis:"This is a conditional estimate",
      modeled_days_saved:4
    }]
  };
}

test("JAR;VIS triages synthetic ORG-001 into HOLD, not action", () => {
  const x=fixture(), file=Buffer.from(JSON.stringify(x));
  const r=receiveMotifOrg001(parseMotifOrg001File(file));
  assert.equal(r.disposition,"HOLD_FOR_OPERATOR_REVIEW");
  assert.equal(r.authority,"NONE");
  assert.equal(r.sourceAuthenticated,false);
  assert.equal(r.candidates[0].allowedEffect,"NONE");
  assert.equal(r.candidates[0].externalContact,false);
  assert.equal(r.candidates[0].modeledDaysSaved,4);
  assert.equal(r.stored,false);
  assert.equal(r.sentExternally,false);
});

test("rejects authority injection, unknown card fields, duplicate ids, excessive input", () => {
  for(const transform of [
    x=>{x.local_handoff_drafts[0].state="APPROVED";},
    x=>{x.local_handoff_drafts[0].recipientApproved=true;},
    x=>{x.local_handoff_drafts[0].scope="PUBLIC";},
    x=>{x.receipts.no_external_actions=false;},
    x=>{x.local_handoff_drafts.push(x.local_handoff_drafts[0]);},
    x=>{x.local_handoff_drafts[0].modeled_days_saved=Infinity;},
    x=>{x.local_handoff_drafts[0].receiver_candidates=["planZ"];}
  ]) {
    const x=fixture(); transform(x);
    assert.throws(()=>receiveMotifOrg001(x),/HOLD_/);
  }
  assert.throws(()=>parseMotifOrg001File(Buffer.alloc(65537)),/HOLD_/);
  assert.throws(()=>parseMotifOrg001File(Buffer.from("{oops")),/HOLD_/);
});
