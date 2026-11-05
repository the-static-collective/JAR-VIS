/** MOTIF-025: source-verified, local-only multi-domain definition of done.
 * No network, files, actions, hosted tokens, source queries, or persistence.
 */
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {verifyExamplesSource} from "./motif-goal-examples.mjs";

export const SOURCE_025_COMMIT="1c3c6d3474c096ce2403902a1bc5a19f1633c344";
export const SOURCE_025_BLOB="47a3425c6a42bd028a836ac136223f5503e7ad9d";
const SOURCE=new URL("../integrations/experiments/025/example_composer.py",import.meta.url);
const fail=(message,status=409)=>Object.assign(new Error("HOLD: "+message),{status});
const hex=/^[a-f0-9]{64}$/;
const controls=/[\x00-\x08\x0b-\x1f\x7f]/;
const statusSet=new Set([
 "SHOW_TWO_EXAMPLES","ASK_ONE_DECISIVE_QUESTION","CONFIRM_REQUIRED",
 "READY_HELD_NO_EXECUTION","HOLD_HIGH_STAKES",
 "HOLD_OUTSIDE_RESEARCH_SCOPE","HOLD_UNSUPPORTED_SOURCE_SPECIFICATION",
 "HOLD_CONFLICTING_HUMAN_INTENT","HOLD_CUSTOM_EXAMPLE_REQUIRED",
 "HOLD_CUSTOM_EXAMPLE_NEEDS_REVIEW","HOLD_UNSUPPORTED_FRESHNESS"
]);

export async function verifyComposerSource(){
 await verifyExamplesSource(); // 024→023→022→GHoT-004 physical evidence
 const raw=await readFile(SOURCE);
 const blob=createHash("sha1")
   .update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
 if(blob!==SOURCE_025_BLOB)throw fail("MOTIF-025 source or evidence modified");
 return true;
}
export function validateComposeInput(b){
 if(!b||typeof b!=="object"||Array.isArray(b)||
    Object.keys(b).some(k=>!["text","choice","own_example",
       "freshness_hours","confirmed","expected_contract_id","correction_of_id"].includes(k))||
    typeof b.text!=="string"||!b.text.trim()||b.text.length>320||
    controls.test(b.text)||
    (b.choice!==undefined&&!["a","b","custom"].includes(b.choice))||
    (b.own_example!==undefined&&(
       typeof b.own_example!=="string"||b.own_example.length>320||
       controls.test(b.own_example)))||
    (b.freshness_hours!==undefined&&![1,6,12,24].includes(b.freshness_hours))||
    (b.confirmed!==undefined&&typeof b.confirmed!=="boolean")||
    ["expected_contract_id","correction_of_id"].some(k=>
       b[k]!==undefined&&!hex.test(b[k]))){
  throw fail("invalid local human goal",400);
 }
 const size=Buffer.byteLength(JSON.stringify(b));
 if(size>4095)throw fail("goal request too long",413);
}
export async function composeHumanExamples(body,{python=process.env.JARVIS_PYTHON||"python3"}={}){
 validateComposeInput(body);
 await verifyComposerSource();
 const payload=JSON.stringify(body);
 let output;
 try{
   output=await new Promise((resolve,reject)=>{
     const child=spawn(python,["-B","-I",fileURLToPath(SOURCE)],{
        stdio:["pipe","pipe","pipe"],windowsHide:true,
        env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
     });
     let s="",size=0,finished=false;
     const timer=setTimeout(()=>child.kill("SIGKILL"),5000);
     const finish=(error,result)=>{
       if(finished)return;finished=true;clearTimeout(timer);
       if(error)reject(error);else resolve(result);
     };
     child.on("error",finish);
     child.stdout.on("data",data=>{
       size+=data.length;
       if(size>32768)child.kill("SIGKILL");
       else s+=data.toString("utf8");
     });
     child.stderr.on("data",()=>{});
     child.on("close",exit=>{
       if(exit===0&&size<=32768)finish(null,s);
       else finish(fail("local interpreter unavailable"));
     });
     child.stdin.on("error",()=>{});
     child.stdin.end(payload);
   });
 }catch{throw fail("local interpreter unavailable");}
 let result;
 try{result=JSON.parse(output)}catch{throw fail("unreadable source-owned goal reply")}
 if(result?.schema!=="motif.composable-goal-examples/v1"||
    !statusSet.has(result.status)||
    result.network_requests_sent!==0||
    result.human_text_persisted!==false||
    result.llm_calls!==0||result.credits_used!==0||
    result.actual_energy_joules!==null||result.authority!==false||
    result.physical_action!==false||
    result.automatic_model_promotion!==false||
    (result.status==="SHOW_TWO_EXAMPLES"&&(
      !Array.isArray(result.examples)||result.examples.length!==2||
      result.examples[0]?.id!=="a"||result.examples[1]?.id!=="b"||
      result.write_your_own_option?.id!=="custom"))||
    (result.status==="CONFIRM_REQUIRED"&&(
      result.human_confirmed!==false||!hex.test(result.contract_id)||
      typeof result.draft_contract!=="object"))||
    (result.status==="READY_HELD_NO_EXECUTION"&&(
      result.human_confirmed!==true||!hex.test(result.contract_id)))||
    (result.next_question&&result.next_question.id!=="freshness_hours"))
  throw fail("untrusted completion contract or implied external work");
 return {...result,transmittedToNetwork:false,
   sourceAuthority:false,sourceCommit:SOURCE_025_COMMIT,
   localOrigin:"VENDORED_NATIVE_MOTIF_025",
   persistentLearning:false};
}
