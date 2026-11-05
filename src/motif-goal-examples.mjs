/** MOTIF-024: bounded local-only example and human-correction research organ.
 * The human's input goes to one byte-pinned LOCAL Python process through
 * stdin; no internet, cloud LLM, disk journal, source queries or code edits.
 */
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {verifyGoalSources} from "./motif-human-goal.mjs";

export const SOURCE_024_COMMIT="66dbc1a1b566609a4fc7cf0764bc374e31842d15";
export const SOURCE_024_BLOB="b5f8b21a13819ff6eb7c3ce06f02b71966f5cc06";
const SOURCE=new URL("../integrations/experiments/024/goal_examples.py",import.meta.url);
const deny=(what,status=409)=>Object.assign(new Error("HOLD: "+what),{status});
const digest=/^[0-9a-f]{64}$/;
const controls=/[\x00-\x08\x0b-\x1f\x7f]/;
const allowed=new Set([
 "SHOW_TWO_EXAMPLES","ASK_ONE_DECISIVE_QUESTION","CONFIRM_REQUIRED",
 "READY_HELD_NO_EXECUTION","HOLD_HIGH_STAKES",
 "HOLD_OUTSIDE_RESEARCH_SCOPE","HOLD_UNSUPPORTED_SOURCE_SPECIFICATION",
 "HOLD_CONFLICTING_HUMAN_INTENT","HOLD_CUSTOM_EXAMPLE_REQUIRED",
 "HOLD_CUSTOM_EXAMPLE_NEEDS_REVIEW","HOLD_UNSUPPORTED_FRESHNESS",
]);
export async function verifyExamplesSource(){
 await verifyGoalSources(); // MOTIF-023, MOTIF-022, GHoT-004 physical witness
 const content=await readFile(SOURCE);
 const hash=createHash("sha1")
   .update(Buffer.from("blob "+content.length+"\0")).update(content).digest("hex");
 if(hash!==SOURCE_024_BLOB)throw deny("changed MOTIF-024 source bytes");
 return true;
}
function checkInput(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||
    Object.keys(body).some(k=>![
      "text","choice","own_example","freshness_hours",
      "confirmed","expected_contract_id","correction_of_id"].includes(k))||
    typeof body.text!=="string"||!body.text.trim()||
    body.text.length>320||controls.test(body.text)||
    (body.choice!==undefined&&!["one","both","custom"].includes(body.choice))||
    (body.own_example!==undefined&&(
      typeof body.own_example!=="string"||body.own_example.length>320||
      controls.test(body.own_example)))||
    (body.freshness_hours!==undefined&&
      (!Number.isInteger(body.freshness_hours)||body.freshness_hours<1||body.freshness_hours>240))||
    (body.confirmed!==undefined&&typeof body.confirmed!=="boolean")||
    ["expected_contract_id","correction_of_id"].some(k=>
      body[k]!==undefined&&!digest.test(body[k])))
   throw deny("invalid local example request",400);
}
export async function askGoalExamples(body,{python=process.env.JARVIS_PYTHON||"python3"}={}){
 checkInput(body);
 await verifyExamplesSource();
 const payload=JSON.stringify(body);
 if(Buffer.byteLength(payload)>4095)throw deny("input too large",413);
 let output;
 try{
   output=await new Promise((resolve,reject)=>{
     const child=spawn(python,["-B","-I",fileURLToPath(SOURCE)],{
       stdio:["pipe","pipe","pipe"],windowsHide:true,
       env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
     });
     let out="",length=0,ended=false;
     const timer=setTimeout(()=>child.kill("SIGKILL"),5000);
     const finish=(error,result)=>{
       if(ended)return;ended=true;clearTimeout(timer);
       error?reject(error):resolve(result);
     };
     child.on("error",finish);
     child.stdout.on("data",data=>{
       length+=data.length;
       if(length>32768)child.kill("SIGKILL");
       else out+=data.toString("utf8");
     });
     child.stderr.on("data",()=>{});
     child.on("close",exit=>{
       if(exit===0&&length<=32768)finish(null,out);
       else finish(deny("local example interpreter unavailable"));
     });
     child.stdin.on("error",()=>{});
     child.stdin.end(payload);
   });
 }catch{throw deny("local example interpreter unavailable");}
 let r;
 try{r=JSON.parse(output)}catch{throw deny("unparseable source-owned example reply")}
 if(r?.schema!=="motif.goal-example-correction/v1"||
    !allowed.has(r.status)||
    r.source_requests_sent!==0||r.personal_question_stored!==false||
    r.llm_calls!==0||r.credits_used!==0||
    r.actual_energy_joules!==null||r.authority!==false||
    r.physical_action!==false||r.automatic_model_promotion!==false||
    (r.status==="SHOW_TWO_EXAMPLES"&&(
      !Array.isArray(r.examples)||r.examples.length!==2||
      r.examples[0]?.id!=="one"||r.examples[1]?.id!=="both"||
      r.write_your_own_option?.id!=="custom"))||
    (r.status==="CONFIRM_REQUIRED"&&(
      r.human_confirmed!==false||!digest.test(r.contract_id)))||
    (r.status==="READY_HELD_NO_EXECUTION"&&
      (r.human_confirmed!==true||!digest.test(r.contract_id)))||
    (r.next_question&&!["freshness_hours"].includes(r.next_question.id)))
   throw deny("untrusted result or false work claim");
 return {...r,transmittedToNetwork:false,sourceAuthority:false,
   sourceCommit:SOURCE_024_COMMIT,
   localOrigin:"VENDORED_NATIVE_MOTIF_024",persistentLearning:false};
}
