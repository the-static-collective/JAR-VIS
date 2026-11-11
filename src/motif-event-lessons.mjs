/** Reciprocal 017 reality lessons. Read-only, byte-pinned, inspectable research
 * evidence. A result is not a forecast issued in 2024 or learned AI weights.
 */
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

export const EVENT_SOURCE_COMMIT="9f238548a0c1d8bcb6034df0e6992950541b40b8";
const RECORDS=[
 {key:"event",url:new URL("../integrations/motif-reality-017/actual-event-2026-11-05.json",import.meta.url),
  blob:"43236756f24e3b5b8f982c4c6ce228061094e801",schema:"motif.reality-iron-event-learning/v1"},
 {key:"lessons",url:new URL("../integrations/motif-reality-017/learned-constraints-2026-11-05.json",import.meta.url),
  blob:"f5b4d793945e06335e0280687b2a5f0b365a1924",schema:"motif.meta-diagnostic-lessons/v1"}
];
const hold=why=>Object.assign(new Error("HOLD: "+why),{status:409});
const finite=x=>typeof x==="number"&&Number.isFinite(x);

export function checkEventLessons(event,lessons){
 if(event?.schema!=="motif.reality-iron-event-learning/v1"||
    event.status!=="RETROSPECTIVE_SOURCE_BACKED_REPLAY_NOT_ACTUAL_ISSUED_FORECAST"||
    event.model_was_trained_on_event!==false||event.test_labels_selected_policy!==false||
    event.automatic_admission!==false||event.external_action!==false||event.authority!==false||
    event.disposition!=="HOLD_INSUFFICIENT_EVENT_COVERAGE"||
    event.stations?.blue!=="USGS-05320000"||
    event.stations?.sueur!=="USGS-05320500"||
    event.stations?.mankato!=="USGS-05325000"||
    event.policies_frozen?.legacy_validation_winner!=="cross_gauges"||
    event.policies_frozen?.cautious_regime_aware!=="cross_gauges"||
    event.frozen_plan_sha256!=="196fa6be6703c5470b017d3db0ab4da6e5ffb3a4dd74abbe4a098e53c610750a"||
    !Number.isInteger(event.matched_test_hours)||
    event.matched_test_hours!==event.complete_hour_coverage?.available_complete_hours||
    !finite(event.complete_hour_coverage?.complete_hour_coverage)||
    !Number.isInteger(event.complete_hour_coverage?.total_calendar_hours)||
    Math.abs(event.matched_test_hours/event.complete_hour_coverage.total_calendar_hours-
      event.complete_hour_coverage.complete_hour_coverage)>.0001||
    !Number.isInteger(event.origin_ood_fallback_count)||
    event.origin_ood_fallback_count>event.matched_test_hours||
    !Number.isInteger(event.rising_flow_test?.count)||
    !finite(event.candidate_event_mae_cfs?.old_selection)||
    !finite(event.candidate_event_mae_cfs?.cautious_selection)||
    !finite(event.candidate_event_mae_cfs?.persistence)||
    Math.abs((event.candidate_event_mae_cfs.old_selection-
      event.candidate_event_mae_cfs.cautious_selection)-
      event.cautious_vs_old_error_reduction_cfs)>.0003||
    !(event.candidate_event_mae_cfs.old_selection<
      event.candidate_event_mae_cfs.cautious_selection)||
    !(event.candidate_event_mae_cfs.old_selection<
      event.candidate_event_mae_cfs.persistence))throw hold("invalid real historical event result");
 if(lessons?.schema!=="motif.meta-diagnostic-lessons/v1"||
    lessons.status!=="EVIDENCE_TETHERED_HYPOTHESES_NO_IMPROVED_POLICY_VALIDATED"||
    lessons.diagnostic_is_fallible!==true||
    lessons.caution_outperformed_legacy_on_017!==false||
    lessons.wins_on_test?.["016_low_flow"]!=="persistence"||
    lessons.wins_on_test?.["017_historical_event"]!=="cross_gauges"||
    !Array.isArray(lessons.lessons)||lessons.lessons.length!==3||
    lessons.lessons.map(x=>x.id).join(",")!=="L-001,L-002,L-003"||
    lessons.lessons[1]?.evidence?.fallback_hours!==event.origin_ood_fallback_count||
    lessons.lessons[2]?.evidence?.complete_hours!==event.matched_test_hours||
    lessons.next_model_admission!=="HOLD_UNTIL_INDEPENDENT_EVENT_REPLICATION"||
    lessons.automatic_promotion!==false||lessons.external_effect!==false||
    lessons.source_authentication!==false)throw hold("invalid source-owned fallible diagnostic");
 return {
  schema:"jarvis.motif-event-learning-witness/v1",
  status:"REAL_HISTORICAL_SENSOR_REPLAY_HELD_FOR_REPLICATION",
  provenance:{
    sourceCommit:EVENT_SOURCE_COMMIT,
    eventBlob:RECORDS[0].blob,
    diagnosticBlob:RECORDS[1].blob,
    sourceRun:"https://github.com/the-static-collective/MOTIF/actions/runs/42034382151",
    fullPublicSourceResponsesAvailableInRunArtifact:true,
    evidenceMode:"GIT_PINNED_RETROSPECTIVE_REPORT_NOT_INDEPENDENTLY_REPRODUCED"
  },
  historicalEvent:"JUNE_2024_MINNESOTA_FLOOD",
  data:{
    calendarHours:event.complete_hour_coverage.total_calendar_hours,
    observedCompleteHours:event.matched_test_hours,
    completeCoverageFraction:event.complete_hour_coverage.complete_hour_coverage,
    risingFlowObservedHours:event.rising_flow_test.count,
    fallbackHours:event.origin_ood_fallback_count,
    originalSelectedMaeCfs:event.candidate_event_mae_cfs.old_selection,
    cautiousMaeCfs:event.candidate_event_mae_cfs.cautious_selection,
    persistenceMaeCfs:event.candidate_event_mae_cfs.persistence,
    cautiousExtraErrorCfs: +(event.candidate_event_mae_cfs.cautious_selection-
      event.candidate_event_mae_cfs.old_selection).toFixed(4)
  },
  learned:{
    kind:"EVIDENCE_DRIVEN_METHOD_HYPOTHESES_NOT_AN_UPDATED_MODEL",
    diagnosticSelfChallenge:lessons.diagnostic_self_challenge.question,
    lessonSummaries:lessons.lessons.map(x=>({id:x.id,kind:x.kind,
      observed:x.observation,suggestedTest:x.suggestion})),
    nextResearch:lessons.diagnostic_self_challenge.proposed_experiments,
    opposedFindings:[
      "On the 2026 low-flow holdout, persistence beat the cross-gauge fit.",
      "On the June 2024 flood complete-case subset, the cross-gauge fit beat persistence.",
      "A newly proposed conservative fallback made this event subset worse than the unchanged method."
    ]
  },
  limitations:[
    "Only 117 of 264 calendar hours had complete joined sensor data. Missingness may select the sample.",
    "Rapidan gauge power was lost during the historic flood; original time-of-report telemetry was not reconstructed.",
    "The event was selected after it occurred, and reported values could have been historically revised.",
    "The three reported MAEs are retrospective estimates and have no operational flood alert value."
  ],
  automaticPromotion:false,independentPhysicalVerification:false,
  changedModelWeights:false,dispatch:false,authority:false
 };
}
export async function inspectEventLearning(){
 const objects={};
 for(const record of RECORDS){
   const b=await readFile(record.url);
   const actual=createHash("sha1").update(Buffer.from("blob "+b.length+"\0"))
     .update(b).digest("hex");
   if(actual!==record.blob)throw hold("event evidence changed");
   let data;
   try{data=JSON.parse(b.toString("utf8"))}catch{throw hold("event evidence malformed")}
   if(data?.schema!==record.schema)throw hold("unexpected event evidence type");
   objects[record.key]=data;
 }
 return checkEventLessons(objects.event,objects.lessons);
}
