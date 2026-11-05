/** Source-pinned GHoT→MOTIF physical computation witness. No Joule inference,
 * code promotion, resource scheduling, or hosted token-credit accounting.
 */
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const file=new URL("../integrations/motif-resource-020/embodied-resource-2026-11-05.json",import.meta.url);
export const EMBODIED_SOURCE_COMMIT="aa838a2c419edf5cb19afc15f76b5793e2fe8855";
export const EMBODIED_SOURCE_BLOB="825c455e59e26df01157e5a4677a653fa88b8023";
const hold=s=>Object.assign(new Error("HOLD: "+s),{status:409});
const fin=x=>typeof x==="number"&&Number.isFinite(x);

export function inspectEmbodiedReceipt(r){
 const a=r?.measured_work;
 if(r?.schema!=="motif.embodied-question/v1"||
    r?.state!=="OBSERVED_PHYSICAL_COMPUTE_PROXY_NOT_MEASURED_JOULES"||
    r?.source?.GHOT_commit!=="0cbd111a1f7d58a3e4d1dacaeb6be067cbffe9ad"||
    r?.source?.GHOT_git_blob!=="4c46c92b0529920f4b990d45b64a855abdb7d385"||
    r?.identical_evidence_derived_answer!==true||
    r?.repeated_questions_per_trial!==250||
    r?.trial_count_each!==5||
    !fin(a?.reparse_median_cpu_ns)||!fin(a?.reuse_median_cpu_ns)||
    !fin(a?.median_cpu_ns_reduction_per_batch)||
    a.reparse_median_cpu_ns-a.reuse_median_cpu_ns!==a.median_cpu_ns_reduction_per_batch||
    !(a.reparse_median_cpu_ns>a.reuse_median_cpu_ns)||
    a.actual_source_bytes_read_per_batch!==2426750||
    a.bytes_read_saved!==0||
    a.json_validations_reparse!==250||
    a.json_validations_reuse!==1||
    a.process_cpu_time_is_not_joules!==true||
    a.electrical_energy_joules!==null||
    a.measured_power_draw_watts!==null||
    a.total_CO2_kg!==null||
    r?.GHOT_actual_execution!==false||
    r?.independent_Joules_verified!==false||
    r?.automatic_promotion!==false||
    r?.model_retrained!==false||
    r?.remote_execution!==false||
    r?.authority!==false||
    r?.disposition!=="HELD_REUSE_CANDIDATE_FOR_MORE_BODIES"){
   throw hold("unverified GHoT resource reading");
 }
 return {
   schema:"jarvis.motif-physical-resource-witness/v1",
   state:"OBSERVED_LOCAL_CPU_BENEFIT_NO_MEASURED_ELECTRICAL_ENERGY",
   sourceCommit:EMBODIED_SOURCE_COMMIT,
   sourceBlob:EMBODIED_SOURCE_BLOB,
   GHOTrun:r.source.GHOT_resource_run,
   repeatQuestions:r.repeated_questions_per_trial,
   reparseCpuNs:a.reparse_median_cpu_ns,
   reuseCpuNs:a.reuse_median_cpu_ns,
   observedCpuNsDifference:a.median_cpu_ns_reduction_per_batch,
   bytesReadBoth:a.actual_source_bytes_read_per_batch,
   measuredJoules:null,
   realRemoteExecution:false,
   powerSourceEvidence:"GHOT_POWER_WILLINGNESS_NOT_ENERGY_METER",
   nextQuestion:r.next_question,
   constraints:r.operator_defined_constraints_required,
   admission:"HELD_FOR_OPERATOR_DEVICE_RESOURCE_AND_QUALITY_TEST",
   limitation:"No measured attributable joules or actual source-query network costs. Same answer proved only for the exact cached evidence workload.",
   modeledCostInCredits:false,
   authority:false,automaticPromotion:false
 };
}
export async function inspectEmbodied(){
 const raw=await readFile(file);
 const hash=createHash("sha1").update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
 if(hash!==EMBODIED_SOURCE_BLOB)throw hold("physical resource report changed");
 let data;try{data=JSON.parse(raw.toString("utf8"))}catch{throw hold("bad physical resource evidence")}
 return inspectEmbodiedReceipt(data);
}
