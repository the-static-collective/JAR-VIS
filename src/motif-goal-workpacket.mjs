/** MOTIF-026 × JAR;VIS: confirmed goal -> separately authorized LOCAL work kit.
 * No network, accounts, contact, journal, disk write, or external dispatch.
 * Four deterministic artifacts in MEMORY; the human must click to download.
 */
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {verifyComposerSource} from "./motif-composable-goals.mjs";

export const SOURCE_COMMIT_026="a4af07cb48c201d22e34b5569496a4ac1d3deb58";
export const SOURCE_BLOB_026="529b0cea7259b1314122d6e0a5d8331f16713180";
export const PREPARE_ONLY="PREPARE_LOCAL_PACKET_ONLY";
const SOURCE=new URL("../integrations/experiments/026/prepare_work.py",import.meta.url);
const hex=/^[a-f0-9]{64}$/;
const control=/[\x00-\x08\x0b-\x1f\x7f]/;
const kinds=["checklist","csv_tracker","unsent_message","html_workpage"];
const knownDomains=new Set(["coffee_donation","volunteer_shift","community_event",
  "grocery_network","website","research","generic","river_reports"]);
const fail=(why,status=409)=>Object.assign(new Error("HOLD: "+why),{status});
const sha=x=>createHash("sha256").update(x).digest("hex");
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);
export async function verifyPrepareSource(){
 await verifyComposerSource();
 const raw=await readFile(SOURCE);
 const actual=createHash("sha1")
   .update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
 if(actual!==SOURCE_BLOB_026)throw fail("MOTIF-026 source bytes changed");
 return true;
}
export function validateLocalPermission(b){
 if(!b||typeof b!=="object"||Array.isArray(b)||
    Object.keys(b).some(k=>!["text","choice","own_example","freshness_hours",
    "expected_contract_id","action","consent"].includes(k))||
    typeof b.text!=="string"||!b.text.trim()||b.text.length>320||control.test(b.text)||
    !["a","b","custom"].includes(b.choice)||
    (b.own_example!==undefined&&(
       typeof b.own_example!=="string"||b.own_example.length>320||
       control.test(b.own_example)))||
    (b.freshness_hours!==undefined&&![1,6,12,24].includes(b.freshness_hours))||
    typeof b.expected_contract_id!=="string"||!hex.test(b.expected_contract_id)){
   throw fail("invalid or missing goal evidence and contract ID",400);
 }
 if(b.action!==PREPARE_ONLY||b.consent!==true)
   throw fail("separate local-work consent required",403);
 if(Buffer.byteLength(JSON.stringify(b))>4095)throw fail("oversized goal",413);
 return true;
}
async function invokeOwner(b,{python=process.env.JARVIS_PYTHON||"python3"}={}){
 await verifyPrepareSource();
 let output;
 try{
   output=await new Promise((resolve,reject)=>{
     const child=spawn(python,["-B","-I",fileURLToPath(SOURCE)],{
       stdio:["pipe","pipe","pipe"],windowsHide:true,
       env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
     });
     let out="",bytes=0,finished=false;
     const timer=setTimeout(()=>child.kill("SIGKILL"),5000);
     const settle=(error,result)=>{
       if(finished)return;
       finished=true;clearTimeout(timer);
       error?reject(error):resolve(result);
     };
     child.on("error",settle);
     child.stdout.on("data",data=>{
       bytes+=data.length;
       if(bytes>64*1024)child.kill("SIGKILL");
       else out+=data.toString("utf8");
     });
     child.stderr.on("data",()=>{});
     child.on("close",code=>{
       if(code===0&&bytes<=64*1024)settle(null,out);
       else settle(fail("source-owned local-work kernel refused request"));
     });
     child.stdin.on("error",()=>{});
     child.stdin.end(JSON.stringify(b));
   });
 }catch{throw fail("MOTIF-026 local Python interpreter unavailable");}
 try{return JSON.parse(output)}catch{throw fail("invalid local work source response")}
}
function checkedSpec(response,requestedDigest){
 const s=response?.work_spec;
 if(response?.schema!=="motif.goal-to-work-spec/v1"||
    response.status!=="LOCAL_WORK_SPEC_PREPARED_NOT_EXECUTED"||
    response.generated!==true||
    response.external_effect!==false||
    response.user_data_stored!==false||
    response.authority!==false||
    response.hosted_tokens_used!==0||
    response.actual_energy_joules!==null||
    response.source_code_modified!==false||
    response.model_trained!==false||
    s?.schema!=="motif.local-work-spec/v1"||
    s?.goal_contract_id!==requestedDigest||
    !knownDomains.has(s.domain)||
    JSON.stringify(s.allowed_outputs)!==JSON.stringify(kinds)||
    !Array.isArray(s.checklist_items)||
    s.checklist_items.length<2||s.checklist_items.length>20||
    !s.checklist_items.every(x=>typeof x==="string"&&x.length<500)||
    !Array.isArray(s.tracking_fields)||
    s.tracking_fields.length<2||s.tracking_fields.length>15||
    !s.tracking_fields.every(x=>typeof x==="string"&&/^[a-z_]{2,48}$/.test(x))||
    typeof s.message_subject!=="string"||s.message_subject.length>140||
    typeof s.message_draft!=="string"||s.message_draft.length>3000||
    !s.goal_contract||typeof s.goal_contract!=="object"||
    s.external_delivery_permitted!==false||
    s.external_contact_verified!==false||
    s.remote_execution_permitted!==false||
    s.execution_claim!==false||
    s.separate_human_permission_scope!==PREPARE_ONLY||
    s.user_content_is_unverified!==true)
  throw fail("untrusted work recipe / false authority claim");
 return s;
}
function artifact(kind,basename,extension,mime,content){
 if(Buffer.byteLength(content)>30*1024)throw fail("oversized rendered work product");
 return {
  kind,file_name:basename+"-"+kind+"."+extension,
  mime,content,bytes:Buffer.byteLength(content),
  sha256:sha(content),
  saved_to_disk:false,downloaded:false,external_delivery:false
 };
}
export function renderWorkSpec(s){
 if(!s||!knownDomains.has(s.domain)||!hex.test(s.goal_contract_id)||
    !Array.isArray(s.tracking_fields)||!Array.isArray(s.checklist_items)||
    s.external_delivery_permitted!==false||
    s.remote_execution_permitted!==false||
    s.execution_claim!==false||
    !s.goal_contract||s.allowed_outputs?.join("|")!==kinds.join("|"))
  throw fail("work packet rendering refused");
 const c=s.goal_contract;
 const description=c.completion_statement||
   ((c.goal==="any_fresh"?"One recent public river source report":
    "Recent reports for BOTH Blue Earth and Le Sueur")+
    " within "+c.freshness_hours+" hours");
 if(typeof description!=="string"||description.length>800)
   throw fail("unknown or too long definition of done");
 const subtitle="DEFINITION OF DONE (human-reviewed, not yet achieved)";
 const prefix="JAR;VIS / MOTIF-026\n"+
   "LOCAL WORK PACKET · NOT AN EXTERNAL ACTION\n"+
   "Goal contract SHA-256: "+s.goal_contract_id+"\n"+
   "Domain: "+s.domain+"\n"+subtitle+":\n"+description+"\n\n";
 const checklist=prefix+s.checklist_items.map((t,i)=>"☐ "+(i+1)+". "+t).join("\n")+
  "\n\nEVIDENCE STATUS: UNKNOWN until a human verifies actual outcomes.\n"+
  "No source requests or donor contacts were made by generating this packet.\n";
 const csv=s.tracking_fields.map(x=>'"'+x.replaceAll('"','""')+'"').join(",")+"\r\n";
 const unsent=prefix+"UNSENT DRAFT — DO NOT AUTOMATICALLY SEND\n"+
  "To: [select and ask an appropriate contact]\n"+
  "Subject: "+s.message_subject+"\n\n"+s.message_draft+
  "\n\n[Review, personalize, verify facts, and send yourself only if appropriate.]\n";
 const rows=s.checklist_items.map((item,i)=>
  "<li><label><input type=\"checkbox\"/> "+escapeHtml(item)+"</label></li>").join("\n");
 const html="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"/>"+
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"+
  "<title>Local Goal Work Page</title><style>body{font:16px/1.6 system-ui;"+
  "max-width:54rem;margin:2rem auto;padding:1.5rem;color:#23251c;background:#faf7f0}"+
  "main{border:1px solid #c6b99f;padding:2rem;background:white}"+
  "li{padding:.5rem}small{color:#655d51}"+
  "@media print{body{margin:0;background:#fff}main{border:0}}</style></head>"+
  "<body><main><p>JAR;VIS · MOTIF-026 · LOCAL ONLY</p><h1>Definition of done</h1>"+
  "<p>"+escapeHtml(description)+"</p>"+
  "<small>Goal contract SHA-256: "+s.goal_contract_id+"</small>"+
  "<h2>Next accountable steps</h2><ol>"+rows+"</ol>"+
  "<h2>Proof of completion</h2><p>Record real evidence below. "+
  "Nothing here is independently verified.</p><p>Evidence: __________________</p>"+
  "<p>Person confirming completion: __________________</p>"+
  "<p><strong>NO MESSAGES SENT · NO WORK PERFORMED</strong></p>"+
  "</main></body></html>\n";
 const basename="jarvis-"+s.domain.replaceAll("_","-");
 return [
  artifact("checklist",basename,"txt","text/plain;charset=utf-8",checklist),
  artifact("csv_tracker",basename,"csv","text/csv;charset=utf-8",csv),
  artifact("unsent_message",basename,"txt","text/plain;charset=utf-8",unsent),
  artifact("html_workpage",basename,"html","text/html;charset=utf-8",html)
 ];
}
export async function prepareLocalWork(b,options={}){
 validateLocalPermission(b);
 const result=await invokeOwner(b,options);
 if(result?.status==="HOLD_UNCONFIRMED_OR_CHANGED_GOAL")
   throw fail("goal contract changed: confirm its exact meaning again");
 const s=checkedSpec(result,b.expected_contract_id);
 const artifacts=renderWorkSpec(s);
 return {
  schema:"jarvis.goal-work-packet/v1",
  status:"LOCAL_ARTIFACTS_PREPARED_IN_MEMORY",
  goal_contract_id:s.goal_contract_id,
  domain:s.domain,
  sourceCommit:SOURCE_COMMIT_026,
  sourceBlob:SOURCE_BLOB_026,
  separate_scope:PREPARE_ONLY,
  artifacts,
  external_delivery:false,
  saved_to_disk:false,
  downloaded:false,
  remote_execution:false,
  claimed_real_world_completion:false,
  electricity_joules:null,
  paid_tokens:0,
  sourceAuthority:false,
  localOnly:true,
  note:"Prepared files are only in the browser response. Click Download on a chosen file to save it yourself. No contacts, source queries, accounts or real actions were performed."
 };
}
