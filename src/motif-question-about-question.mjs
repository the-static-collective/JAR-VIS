/** MOTIF-019's source-pinned six-step question-cost critique, not a live forecast.
 * These exact bytes originate from the source-owned experiment and are checked
 * by the CI against a fixed historical Git commit. The underlying agency JSON
 * is stored only in the separately retained 30-day GitHub run artifact.
 */
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
export const MOTIF019_SOURCE="1bb4028141eb20a8798bed338dcb3d851284de22";
const blobs=[
 {name:"loop",schema:"EVOLVED_RESEARCH_QUESTIONS_BEFORE_HELDOUT",
  url:new URL("../integrations/motif-reality-019/question-evolution-2026-11-05.json",import.meta.url),
  sha:"15f1e8cfecd781ca68f4eec05e1fc44e71668d1c"},
 {name:"outcome",schema:"motif.question-kind-physical-test/v1",
  url:new URL("../integrations/motif-reality-019/march-outcome-2026-11-05.json",import.meta.url),
  sha:"0cf1303cdeb83d9c29fe417ac19c66c217ddf63d"},
];
const hold=message=>Object.assign(new Error("HOLD: "+message),{status:409});
const valid=n=>typeof n==="number"&&Number.isFinite(n);
const close=(a,b)=>valid(a)&&Math.abs(a-b)<.0002;
export function verifyQuestionAboutQuestion(loop,event){
 const models=event?.all_declared_policy_results_POSTHOC_DO_NOT_SELECT;
 const base=models?.downstream;
 const health=models?.health_last3;
 const both=models?.both_graceful;
 const cost=event?.self_diagnostic_on_assumed_cost_of_questions;
 const population=event?.downstream_complete_case_population;
 if(loop?.phase!=="EVOLVED_RESEARCH_QUESTIONS_BEFORE_HELDOUT"||
    loop?.plan_sha256!=="d6c24709882faee4e66a2b32ad0502422f5ac8d526025da114571a8a6a705cac"||
    loop?.holdout_seen!==false||loop?.selected!=="downstream"||
    !Array.isArray(loop?.stages)||loop.stages.length!==6||
    loop.stages[0]?.selected!=="both_graceful"||
    loop.stages[1]?.selected!=="downstream"||
    loop.stages[4]?.new_kind!=="source_health"||
    loop.stages[5]?.new_kind!=="false_health_cost"||
    event?.schema!=="motif.question-kind-physical-test/v1"||
    event.status!=="PUBLIC_SENSOR_RETROSPECTIVE_COMPARISON_NO_ACTUAL_FORECAST_ISSUED"||
    event.authority!==false||event.automatic_admission!==false||
    event.autonomous_code_modification!==false||
    event.actual_2026_forecasts_issued!==false||
    event.sensor_health_really_queried_at_issue_time!==false||
    event.observed_future_labels_used_to_modify_policy!==false||
    event.fixed_frozen_plan_sha256!==loop.plan_sha256||
    event.frozen_selection!==loop.selected||
    event.hypothesis_state!=="HOLD_NO_INDEPENDENT_QUESTION_VALUE"||
    !Array.isArray(event.test_window)||event.test_window[0]!=="2026-03-01"||
    event.test_window[1]!=="2026-03-14"||
    population?.complete_downstream_hours!==300||
    population?.upstream_present_feature_hours?.blue!==35||
    population?.upstream_present_feature_hours?.sueur!==116||
    population?.complete_both_hours!==35||
    !close(event.baseline_mae_cfs,185.3333)||
    !close(event.frozen_policy_mae_cfs,event.baseline_mae_cfs)||
    !close(event.frozen_policy_raw_mae_improvement_cfs,0)||
    !close(event.frozen_policy_utility_improvement_cfs_equivalent,0)||
    !close(health?.absolute_error_mae_cfs,150.4962)||
    !close(both?.absolute_error_mae_cfs,150.4962)||
    !close(base?.absolute_error_mae_cfs,event.baseline_mae_cfs)||
    !close(health?.weighted_objective_cfs_equivalent,261.5924)||
    !close(base?.weighted_objective_cfs_equivalent,213.7933)||
    !close(cost?.frozen_question_credit_price_cfs_equivalent,37.382353)||
    !close(cost?.all_candidate_break_even_credit_prices?.health_last3?.
         max_credit_unit_for_positive_weighted_value_cfs_equivalent,18.8795)||
    cost.assumed_query_cost_dominated_final_choice!==true||
    cost.posthoc_only_not_admitted!==true||
    typeof event.proposed_next_question!=="string"||
    !event.proposed_next_question.startsWith("Are our research credit prices the WRONG question?")){
    throw hold("source-owned 019 question evidence inconsistent");
 }
 return {
    schema:"jarvis.motif-question-about-question/v1",
    state:"SOURCE_PINNED_HOLD_NO_INDEPENDENT_QUESTION_VALUE",
    sourceCommit:MOTIF019_SOURCE,
    sourceExperiment:"MOTIF-019",
    sourceRun:"https://github.com/the-static-collective/MOTIF/actions/runs/42040857789",
    phases:loop.stages.map(s=>({
      stage:s.stage,questionKind:s.new_kind||"measurement_value",
      chosen:s.selected,changed:s.policy_changed
    })),
    frozenQuestion:loop.selected,
    period:"2026-03-01 to 2026-03-14 / historical retrospective",
    downstreamCases:population.complete_downstream_hours,
    blueAvailableCases:population.upstream_present_feature_hours.blue,
    sueurAvailableCases:population.upstream_present_feature_hours.sueur,
    selectedModelMaeCfs:event.frozen_policy_mae_cfs,
    sourceHealthModelMaeCfs:health.absolute_error_mae_cfs,
    declaredCostBaselineCfsEquiv:base.weighted_objective_cfs_equivalent,
    declaredCostHealthCfsEquiv:health.weighted_objective_cfs_equivalent,
    assumedCreditPriceCfsEquiv:cost.frozen_question_credit_price_cfs_equivalent,
    posthocHealthBreakEvenCreditCfsEquiv:
      cost.all_candidate_break_even_credit_prices.health_last3.max_credit_unit_for_positive_weighted_value_cfs_equivalent,
    deeperQuestion:event.proposed_next_question,
    missingPrerequisite:"Real issue-time query latency, availability, and actual operator-defined value of avoiding or making a wrong decision.",
    limitations:[
      "Six bounded revisions of a decision-rule JSON rubric, not self-written code or autonomous model retraining.",
      "The final frozen policy did not improve against its own comparison baseline.",
      "The lower 2026 error of an unselected strategy is posthoc research, not an admitted policy.",
      "Station-health is a retrospective timestamp-presence proxy, not authenticated real-time network availability.",
      "The hypothetical cost function drove abstention; its price is not calibrated to users' real costs."
    ],
    automaticPromotion:false,independentPhysicalVerification:false,
    sourceAuthority:false,dispatch:false
 };
}
export async function inspectQuestionAboutQuestion(){
 const receipts={};
 for(const entry of blobs){
   const content=await readFile(entry.url);
   const gitBlob=createHash("sha1")
     .update(Buffer.from("blob "+content.length+"\0")).update(content).digest("hex");
   if(gitBlob!==entry.sha)throw hold("question evidence hash changed");
   try{receipts[entry.name]=JSON.parse(content.toString("utf8"))}
   catch{throw hold("invalid source-owned question JSON")}
 }
 return verifyQuestionAboutQuestion(receipts.loop,receipts.outcome);
}
