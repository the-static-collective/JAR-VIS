/** MOTIF-027: source-pinned local capability routing.
 * Source-owned Python handles domain authorization + exact recipient/subject/body
 * permission binding. This Node process exposes only INERT review results:
 * No SMTP, OAuth, email APIs, mail transport or browser auto-navigation.
 */
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {verifyPrepareSource} from "./motif-goal-workpacket.mjs";

export const SOURCE_027_COMMIT="90cbe6427d52286d17b74cdff48c4a81a48db3d0";
export const SOURCE_027_BLOB="dd108e4765e9cce1e15e35a01c2fd3c2f7a83979";
export const STAGES=Object.freeze({
 discover:"DISCOVER_LOCAL_CAPABILITIES",
 preview:"PREVIEW_MAIL_APP_HANDOFF",
 open:"AUTHORIZE_MAIL_APP_OPEN"
});
export const COMPOSER_SCOPE="OPEN_LOCAL_MAIL_COMPOSER_ONLY";
const FILE=new URL("../integrations/experiments/027/capability_handoff.py",import.meta.url);
const deny=(reason,status=409)=>Object.assign(new Error("HOLD: "+reason),{status});
const HEX=/^[a-f0-9]{64}$/;
const CONTROL=/[\x00-\x08\x0b-\x1f\x7f]/;
const DOMAINS=new Set(["coffee_donation","volunteer_shift","community_event",
    "grocery_network","website","research","generic","river_reports"]);
const STATUSES=new Set([
 "LOCAL_CAPABILITIES_AVAILABLE_NOT_EXECUTED",
 "LOCAL_MAIL_COMPOSER_PREVIEW_NOT_SENT",
 "LOCAL_MAIL_APP_HANDOFF_READY_NOT_SENT",
 "HOLD_MAIL_HANDOFF_NOT_SUPPORTED_FOR_THIS_GOAL"
]);
const NO_PRIVILEGE=new Set([
 "text","choice","own_example","freshness_hours","expected_contract_id",
 "stage","recipient","subject","message","preview_id",
 "open_permission","open_consent"
]);

export async function verifyCapabilitySource(){
 await verifyPrepareSource();
 const raw=await readFile(FILE);
 const blob=createHash("sha1")
   .update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
 if(blob!==SOURCE_027_BLOB)throw deny("MOTIF-027 source bytes changed");
 return true;
}
export function validateHandoffInput(b){
 if(!b||typeof b!=="object"||Array.isArray(b)||
    Object.keys(b).some(k=>!NO_PRIVILEGE.has(k))||
    typeof b.text!=="string"||!b.text.trim()||
    b.text.length>320||CONTROL.test(b.text)||
    !["a","b","custom"].includes(b.choice)||
    (b.own_example!==undefined&&(
      typeof b.own_example!=="string"||b.own_example.length>320||
      CONTROL.test(b.own_example)))||
    (b.freshness_hours!==undefined&&![1,6,12,24].includes(b.freshness_hours))||
    typeof b.expected_contract_id!=="string"||!HEX.test(b.expected_contract_id)||
    !Object.values(STAGES).includes(b.stage)||
    ["preview_id"].some(k=>b[k]!==undefined&&!HEX.test(b[k]))||
    (b.recipient!==undefined&&(
      typeof b.recipient!=="string"||b.recipient.length>150||CONTROL.test(b.recipient)))||
    (b.subject!==undefined&&(
      typeof b.subject!=="string"||b.subject.length>130||CONTROL.test(b.subject)))||
    (b.message!==undefined&&(
      typeof b.message!=="string"||b.message.length>1300||
      /[\x00-\x08\x0b-\x1f\x7f]/.test(b.message)))||
    (b.open_consent!==undefined&&typeof b.open_consent!=="boolean")||
    (b.open_permission!==undefined&&b.open_permission!==COMPOSER_SCOPE)){
   throw deny("invalid or unsupported handoff input",400);
 }
 if(b.stage===STAGES.discover &&
    ["recipient","subject","message","preview_id","open_permission","open_consent"]
      .some(k=>b[k]!==undefined))throw deny("contact not authorized during discovery",400);
 if(b.stage===STAGES.preview &&
    ["preview_id","open_permission","open_consent"].some(k=>b[k]!==undefined))
   throw deny("composer permission cannot precede preview",400);
 if(b.stage===STAGES.open && (
    b.open_consent!==true||b.open_permission!==COMPOSER_SCOPE||
    !HEX.test(b.preview_id)))throw deny("separate mail app permission required",403);
 if(Buffer.byteLength(JSON.stringify(b))>4095)throw deny("handoff too long",413);
 return true;
}

async function invokeSource(b,{python=process.env.JARVIS_PYTHON||"python3"}={}){
 await verifyCapabilitySource();
 let output;
 try{
   output=await new Promise((resolve,reject)=>{
     const child=spawn(python,["-B","-I",fileURLToPath(FILE)],{
       stdio:["pipe","pipe","pipe"],windowsHide:true,
       env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
     });
     let body="",bytes=0,done=false;
     const timer=setTimeout(()=>child.kill("SIGKILL"),5000);
     const settle=(error,result)=>{
       if(done)return;done=true;clearTimeout(timer);
       error?reject(error):resolve(result);
     };
     child.on("error",settle);
     child.stdout.on("data",part=>{
       bytes+=part.length;
       if(bytes>24000)child.kill("SIGKILL");
       else body+=part.toString("utf8");
     });
     child.stderr.on("data",()=>{});
     child.on("close",code=>{
       if(code===0&&bytes<=24000)settle(null,body);
       else settle(deny("local handoff source refused or unavailable"));
     });
     child.stdin.on("error",()=>{});
     child.stdin.end(JSON.stringify(b));
   });
 }catch{throw deny("local MOTIF handoff interpreter unavailable")}
 try{return JSON.parse(output)}
 catch{throw deny("unparseable source-owned handoff result")}
}

function verifyResponse(r,request){
 if(r?.schema!=="motif.capability-handoff/v1"||
    !STATUSES.has(r.status)||
    r.actual_message_sent!==false||
    r.external_delivery!==false||r.remote_execution!==false||
    r.public_network_gets!==0||r.journal_events_created!==0||
    r.api_credits_spent!==0||r.actual_energy_joules!==null||
    r.authority!==false||r.model_updated!==false||
    (r.goal_contract_id!==request.expected_contract_id &&
     r.status!=="HOLD_MAIL_HANDOFF_NOT_SUPPORTED_FOR_THIS_GOAL")||
    (r.status==="LOCAL_CAPABILITIES_AVAILABLE_NOT_EXECUTED"&&(
      !Array.isArray(r.capabilities)||
      r.capabilities.length<1||
      r.capabilities.length>3||
      r.capabilities.some(c=>![
        "local_workkit","local_workshop","local_email_composer"].includes(c.id))||
      r.mailto_uri!==null))||
    (r.status==="LOCAL_MAIL_COMPOSER_PREVIEW_NOT_SENT"&&(
      !HEX.test(r.preview_id)||r.mailto_uri!==null||
      r.recipient!==request.recipient||r.subject!==request.subject||
      r.message!==request.message))||
    (r.status==="LOCAL_MAIL_APP_HANDOFF_READY_NOT_SENT"&&(
      !HEX.test(r.preview_id)||r.preview_id!==request.preview_id||
      r.recipient!==request.recipient||
      r.subject!==request.subject||r.message!==request.message||
      typeof r.mailto_uri!=="string"||
      r.mailto_uri.length>3400||
      !r.mailto_uri.startsWith("mailto:")||
      r.no_smtp_request!==true||r.no_delivery_receipt!==true)))
   throw deny("unverified handoff result or false delivery claim");
 if(r.mailto_uri!==null){
   // Ensure the source URL contains only one recipient and EXACT subject/body,
   // rather than trusting an arbitrary scheme string from the subprocess.
   let parsed;
   try{parsed=new URL(r.mailto_uri)}catch{throw deny("unparseable mail app URI")}
   const params=parsed.searchParams;
   if(parsed.protocol!=="mailto:"||parsed.hash||
      params.size!==2||params.getAll("subject").length!==1||
      params.getAll("body").length!==1||
      params.get("subject")!==request.subject||
      params.get("body")!==request.message||
      decodeURIComponent(parsed.pathname)!==request.recipient)
     throw deny("mailto payload changed after review");
 }
 return r;
}
export async function handoffCapability(b,options={}){
 validateHandoffInput(b);
 const r=verifyResponse(await invokeSource(b,options),b);
 return {...r,sourceCommit:SOURCE_027_COMMIT,
   sourceBlob:SOURCE_027_BLOB,
   localOrigin:"VENDORED_NATIVE_MOTIF_027",
   actualDeliveryVerified:false,
   transmittedByServer:false,
   mailAppOpeningRequiresHumanClick:true,
   persistentMemoryUpdated:false
 };
}
