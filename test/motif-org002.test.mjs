import test from "node:test";
import assert from "node:assert/strict";
import {receiveOrg002Report, parseOrg002LocalFile} from "../src/motif-org002.mjs";

function specimen(){
  return {
    kind:"MOTIF_ORG_002_RESULT",as_of:"2026-11-11",modeled_outcome:"fictional meal",
    baseline_forecast_days:9,
    return_receipt:{
      status:"UNVERIFIED_HYPOTHETICAL_SIMULATION",human_authority_required:true,
      not_measured_real_outcomes:true,no_outside_action:true,source_authentication:"NOT_PERFORMED",
      all_alternatives_hold:true
    },
    shock_scenarios:[{
      shock_id:"funding_window_pause",type:"funding_lapse",source_classification:"none",sources:[],
      not_a_motive_verdict:true,disrupted_forecast_days:30,
      alternative_routes:[{
        id:"independently_donated_meal",route_forecast_days:5,
        comparison:"CONDITIONALLY_COMPARABLE_NOT_AUTHORIZED",
        conditional_days_difference:25,authority:"HUMAN_REVIEW_REQUIRED",
        disposition:"HOLD_FOR_SCOPE_AUTHORITY_AND_EVIDENCE",
        proposed_benefit:"fictional local meal",warning:"not a legal right"
      },{
        id:"dependent_grant_renamed_local",route_forecast_days:9,
        comparison:"INDEPENDENCE_UNVERIFIED",conditional_days_difference:null,
        authority:"HUMAN_REVIEW_REQUIRED",disposition:"HOLD_FOR_SCOPE_AUTHORITY_AND_EVIDENCE"
      }]
    }]
  };
}
test("ORG-002 conditional rescheduling becomes untrusted HOLD-only structural cards",()=>{
  const input=specimen();
  const r=receiveOrg002Report(parseOrg002LocalFile(Buffer.from(JSON.stringify(input))));
  assert.equal(r.scope,"LOCAL_ONLY");
  assert.equal(r.sentExternally,false);
  assert.equal(r.admission,"NONE");
  assert.equal(r.claimsAboutOfficialMotives,"NONE");
  assert.equal(r.candidates[0].conditionalDaysDifference,25);
  assert.equal(r.candidates[1].conditionalDaysDifference,null);
  assert.ok(r.candidates.every(x=>x.allowedEffect==="NONE" && x.disposition==="HOLD_FOR_OPERATOR_REVIEW"));
  assert.equal(JSON.stringify(r).includes("proposed_benefit"),false);
});
test("rejects altered authority, unsupported motive claims, unsourced public position, noncomparable delta",()=>{
  const edits=[
    x=>x.return_receipt.no_outside_action=false,
    x=>x.shock_scenarios[0].not_a_motive_verdict=false,
    x=>x.shock_scenarios[0].source_classification="malicious_intent",
    x=>x.shock_scenarios[0].source_classification="documented_public_position",
    x=>x.shock_scenarios[0].alternative_routes[0].disposition="APPROVED",
    x=>x.shock_scenarios[0].alternative_routes[1].conditional_days_difference=3,
    x=>x.shock_scenarios[0].alternative_routes[0].conditional_days_difference=Infinity,
    x=>x.shock_scenarios.push(x.shock_scenarios[0]),
  ];
  for(const edit of edits){const x=specimen();edit(x);assert.throws(()=>receiveOrg002Report(x),/HOLD_ORG002/);}
  assert.throws(()=>parseOrg002LocalFile(Buffer.alloc(65537)),/HOLD_ORG002_PACKET_SIZE/);
});
