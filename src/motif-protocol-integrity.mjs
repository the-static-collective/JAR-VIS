/** Read-only, byte-pinned physical question integrity report.
 * A source bug caused a false-staleness diagnosis. Full UTC query repaired
 * it; GHoT then physically executed a true stop-when-fresh read. Do not
 * confuse the noncontemporaneous 1-vs-3 source count with causal savings.
 */
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
export const SOURCE_COMMIT="cdcec6013492bb6ccd0982ee9af9f5bf1d3200f7";
export const SOURCE_GIT_BLOB="b5cfe73c96ab908a8e87de73e90486fc0ab0ad66";
const SOURCE_URL=new URL("../integrations/motif-reality-021/source-question-integrity-2026-11-05.json",import.meta.url);
const hold=why=>Object.assign(new Error("HOLD: "+why),{status:409});
const num=x=>typeof x==="number"&&Number.isFinite(x);
export function inspectQuestionIntegrity(r){
 const d=r?.observations;
 const first=d?.first_date_only_interval;
 const fixed=d?.corrected_full_UTC_interval;
 const real=d?.actual_stop_when_first_fresh;
 const counters=r?.measured_resource_units;
 if(r?.schema!=="motif.question-integrity-and-physical-work/v1"||
    r?.source_commit_GHOT!=="1517d2ac822ed1e6cfa30320a0f1e4574b6b0e55"||
    r?.learning?.protocol_error_detected!==true||
    r?.learning?.source_code_was_changed_BY_HUMAN_APPROVED_COMMIT!==true||
    r?.learning?.autonomous_model_weight_update!==false||
    r?.disposition!=="HELD_QUESTION_PROTOCOL_VALIDATOR_AND_FRESH_REPLICATION"||
    r?.automatic_promotion!==false||r?.authority!==false||
    r?.environmental_warning!==false||r?.electrical_energy_measured!==false||
    first?.requests_actually_sent!==3||
    first?.qualified_fresh_source_count!==0||
    first?.reported_latest_utc!=="2026-11-05T00:00:00Z"||
    first?.request_url_not_embedded_in_receipt!==true||
    fixed?.requests_actually_sent!==3||fixed?.qualified_fresh_source_count!==3||
    fixed?.reported_latest_utc!=="2026-11-05T13:45:00Z"||
    real?.requests_actually_sent!==1||
    real?.fresh_reported_observation_obtained!==true||
    real?.other_fixed_queries_actually_executed!==false||
    real?.source_observation_utc!=="2026-11-05T14:00:00Z"||
    real?.reported_discharge_cfs!==2580||
    !num(real?.wall_ns_sum)||!num(real?.public_body_bytes)||
    !num(fixed?.wall_ns_sum)||!num(fixed?.public_body_bytes)||
    !num(first?.wall_ns_sum)||!num(first?.public_body_bytes)||
    counters?.electrical_energy_joules!==null||
    counters?.causal_network_cost_savings_PROVED!==false||
    counters?.resource_comparison_is_NONCONTEMPORANEOUS!==true||
    counters?.arbitrary_credits!==false)throw hold("GHoT-021 proof cannot be certified");
 return {
  schema:"jarvis.question-protocol-witness/v1",
  state:"RESEARCH_PROTOCOL_BUG_DETECTED_REPAIRED_AND_PUBLICLY_RETESTED",
  sourceCommit:SOURCE_COMMIT,
  original:{
    actualRequests:3,responseBodyBytes:first.public_body_bytes,
    elapsedWallNs:first.wall_ns_sum,
    incorrectlyConcludedFreshness:false,
    diagnosedBug:"Date-only request ended at UTC midnight",
  },
  repaired:{
    actualRequests:3,sourceFreshCount:3,responseBodyBytes:fixed.public_body_bytes,
    elapsedWallNs:fixed.wall_ns_sum,
  },
  conditional:{
    actualRequests:1,reportedDischargeCfs:real.reported_discharge_cfs,
    observationUTC:real.source_observation_utc,
    responseBodyBytes:real.public_body_bytes,elapsedWallNs:real.wall_ns_sum,
    queriesSkipped:["sueur","mankato"],sourceBackedTaskAchieved:true
  },
  causalSavedNetworkBytesVerified:false,
  attributableJoules:null,
  originTimeAgencyCalibrationVerified:false,
  proposedNextQuestion:r.learning.next_best_question,
  limits:r.source_limits,
  automaticPromotion:false,dispatch:false,authority:false
 };
}
export async function inspectProtocolIntegrity(){
 const raw=await readFile(SOURCE_URL);
 const actual=createHash("sha1").update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
 if(actual!==SOURCE_GIT_BLOB)throw hold("question protocol witness bytes changed");
 let data;try{data=JSON.parse(raw.toString("utf8"))}catch{throw hold("invalid protocol receipt")}
 return inspectQuestionIntegrity(data);
}
