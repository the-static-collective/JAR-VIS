/** Source-pinned LOCAL MOTIF-023 human goal handshake.
 * This passes the person's bounded question to a vendored Python subprocess
 * on their own machine, NEVER a remote API, and never persists their text.
 * It drafts a goal only. Even 'confirmed' has no right to fetch sensors.
 */
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

export const SOURCE_COMMIT="5051af387eb05f1611d7f12e473dab58078719cb";
export const SOURCE={
 "experiments/023/human_goal.py":"00c6f648588f2cbe0ad153d6c90d91e03247c847",
 "experiments/022/cost_of_knowing.py":"ce59dc4495c29eccc30aabf8fbeec7cf0b99b1f3",
 "experiments/022/evidence/ghot-004-actual-2026-11-05.json":"ee545add1b71f97eb3fae2e5151398f81814a89b",
};
const root=new URL("../integrations/",import.meta.url);
const bridge=new URL("./experiments/023/human_goal.py",root);
const fail=(reason,status=409)=>Object.assign(new Error("HOLD: "+reason),{status});
const reserved=/[\x00-\x08\x0b-\x1f\x7f]/;
const statuses=new Set([
 "ASK_ONE_DECISIVE_QUESTION","CONFIRM_REQUIRED","READY_HELD_NO_EXECUTION",
 "HOLD_HIGH_STAKES","HOLD_OUTSIDE_RESEARCH_SCOPE",
 "HOLD_CONFLICTING_HUMAN_INTENT","HOLD_UNSUPPORTED_SOURCE_SPECIFICATION",
 "HOLD_UNSUPPORTED_FRESHNESS",
]);
export async function verifyGoalSources(){
 for(const [path,blob] of Object.entries(SOURCE)){
   const raw=await readFile(new URL("./"+path,root));
   const actual=createHash("sha1")
     .update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
   if(actual!==blob)throw fail("changed MOTIF-023 source or physical evidence");
 }
 return true;
}

export async function askHumanGoal(body,{python=process.env.JARVIS_PYTHON||"python3"}={}){
 if(!body||typeof body!=="object"||Array.isArray(body)||
    Object.keys(body).some(k=>![
      "text","answers","confirmed","expected_contract_id"].includes(k))||
    typeof body.text!=="string"||!body.text.trim()||
    body.text.length>320||reserved.test(body.text)||
    (body.answers!==undefined&&
     (!body.answers||typeof body.answers!=="object"||Array.isArray(body.answers)))||
    (body.confirmed!==undefined&&typeof body.confirmed!=="boolean")||
    (body.expected_contract_id!==undefined&&
     !/^[0-9a-f]{64}$/.test(body.expected_contract_id))){
   throw fail("invalid local human-goal request",400);
 }
 await verifyGoalSources();
 const payload=JSON.stringify(body);
 if(Buffer.byteLength(payload)>8192)throw fail("question too large",413);
 let output;
 try{
   output=await new Promise((resolve,reject)=>{
     const child=spawn(python,["-B","-I",fileURLToPath(bridge)],{
       stdio:["pipe","pipe","pipe"],windowsHide:true,
       env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
     });
     let text="",bytes=0,settled=false;
     const timeout=setTimeout(()=>child.kill("SIGKILL"),5000);
     const finish=(err,result)=>{
       if(settled)return;
       settled=true;clearTimeout(timeout);
       err?reject(err):resolve(result);
     };
     child.on("error",finish);
     child.stdout.on("data",b=>{
       bytes+=b.length;
       if(bytes>32768)child.kill("SIGKILL");
       else text+=b.toString("utf8");
     });
     child.stderr.on("data",()=>{});
     child.on("close",code=>{
       if(code===0&&bytes<=32768)finish(null,text);
       else finish(fail("local MOTIF goal handshake unavailable"));
     });
     child.stdin.on("error",()=>{});
     child.stdin.end(payload);
   });
 }catch{throw fail("local MOTIF goal handshake unavailable");}
 let result;
 try{result=JSON.parse(output)}catch{throw fail("unreadable source-owned goal reply");}
 if(result?.schema!=="motif.human-goal-handshake/v1"||
    !statuses.has(result.status)||
    result.source_requests_sent!==0||
    result.personal_question_stored!==false||
    result.llm_calls!==0||result.credits_used!==0||
    result.actual_energy_joules!==null||
    result.physical_action!==false||
    result.authority!==false||
    result.automatic_promotion!==false||
    (result.status==="READY_HELD_NO_EXECUTION"&&result.human_confirmed!==true)||
    (result.status==="CONFIRM_REQUIRED"&&
     (result.human_confirmed!==false||typeof result.contract_id!=="string"))||
    (result.next_question&&
     !["evidence_scope","freshness_hours"].includes(result.next_question.id))){
   throw fail("untrusted native human-goal result");
 }
 return {...result,localOrigin:"VENDORED_NATIVE_MOTIF_023",
  sourceCommit:SOURCE_COMMIT,transmittedToNetwork:false,
  sourceAuthority:false};
}
