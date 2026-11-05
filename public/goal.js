/** Human examples. Input and correction are in-memory and LOCAL only. */
const $=id=>document.getElementById(id);
let csrf=null,statement="",choice=null,ownExample=null,freshness=undefined;
let draft=null,previousDigest=null,busy=false,approvedDigest=null;
let handoffCapabilities=null,mailPreview=null;
const report=s=>{$("goal-status").textContent=s};
const sections=["examples","clarify","contract"];
const hide=id=>{$(id).hidden=true};
const show=id=>{$(id).hidden=false};

async function request(confirm=false){
 if(!csrf)throw Error("HOLD: local research desk unavailable");
 const data={text:statement,
   ...(choice?{choice}:{}),
   ...(choice==="custom"?{own_example:ownExample}:{}),
   ...(freshness!==undefined?{freshness_hours:freshness}:{}),
   ...(previousDigest?{correction_of_id:previousDigest}:{}),
   ...(confirm&&draft?{confirmed:true,expected_contract_id:draft.contract_id}:{})
 };
 const response=await fetch("/api/reciprocal/compose",{
   method:"POST",cache:"no-store",
   headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
   body:JSON.stringify(data)
 });
 const value=await response.json();
 if(!response.ok)throw Error(value.error||"HOLD: example interpreter unavailable");
 if(value.schema!=="motif.composable-goal-examples/v1"||
    value.network_requests_sent!==0||
    value.transmittedToNetwork!==false||
    value.persistentLearning!==false)
   throw Error("HOLD: unverified research response");
 return value;
}

function render(r){
 hide("clarify");
 hide("contract");
 hide("workkit");
 hide("work-files");
 hide("handoff");hide("handoff-options");hide("mail-review");hide("mail-ready");
 handoffCapabilities=null;mailPreview=null;
 approvedDigest=null;
 report(r.message+" No sources contacted.");
 if(r.status==="SHOW_TWO_EXAMPLES"){
   const examples=r.examples||[];
   if(examples.length!==2)throw Error("HOLD: not two source-owned examples");
   $("example-one-text").textContent=examples[0].would_this_be_enough;
   $("example-one-evidence").textContent="What would verify it: "+examples[0].evidence_needed;
   $("example-both-text").textContent=examples[1].would_this_be_enough;
   $("example-both-evidence").textContent="What would verify it: "+examples[1].evidence_needed;
   $("example-domain").textContent=r.domain==="generic"?
     "These are general possibilities, not an interpretation of your particular request.":
     "Recognized topic: "+r.domain.replaceAll("_"," ")+". These are proposed outcomes, not actual commitments.";
   show("examples");
   return;
 }
 if(r.status==="ASK_ONE_DECISIVE_QUESTION"){
   if(r.next_question?.id!=="freshness_hours")throw Error("HOLD: unsupported follow-up");
   $("clarify-title").textContent=r.next_question.question;
   const field=$("clarify-select");
   field.replaceChildren();
   for(const opt of r.next_question.options){
     const item=document.createElement("option");
     item.value=String(opt.value);
     item.textContent=opt.label;
     field.append(item);
   }
   show("clarify");
   return;
 }
 if(r.status==="CONFIRM_REQUIRED"){
   const old=previousDigest;
   draft=r;
   previousDigest=r.contract_id;
   const c=r.draft_contract;
   if(c.schema==="motif.human-evidence-contract/v1"){
     $("contract-meaning").textContent=
       (c.goal==="any_fresh"?"ONE qualifying public river report would be enough.":
       "Reports from BOTH Blue Earth and Le Sueur would be required.")+
       " Maximum observation age: "+c.freshness_hours+" hours.";
     $("contract-sources").textContent="Research-only public station IDs: "+
       c.read_only_public_gauge_ids.join(", ")+". No source contacted.";
     const oldPhysical=r.prior_physical_example;
     $("contract-resource").textContent=oldPhysical?
       "Older GHoT-004 physical work: "+oldPhysical.historical_actual_request_count+
       " actual GET(s), "+oldPhysical.historical_actual_http_body_bytes+
       " HTTP body bytes; NOT a future budget.":
       "No matching independently measured physical outcome for that deadline.";
   }else if(c.schema==="motif.human-completion-contract/v1"){
     $("contract-meaning").textContent=c.completion_statement;
     $("contract-sources").textContent=
       (c.criterion_origin==="HUMAN_TYPED_UNINTERPRETED"?
        "This is your wording, preserved for review. The system has NOT interpreted or verified it. ":
        "This is only a suggested result, not evidence it happened. ")+
       "Evidence to verify: "+c.verification_required.replaceAll("_"," ").toLowerCase()+".";
     $("contract-resource").textContent=
       "Physical resource cost for this human outcome is UNKNOWN. No donation, volunteer, website, or other action occurred.";
   }else throw Error("HOLD: unsupported source contract");
   $("confirm-status").textContent=
      old&&old!==r.contract_id?
      "You corrected the earlier interpretation. That old definition no longer applies; confirm this new one.":
      "Check the meaning above. Only you may say that this is enough.";
   $("confirm").disabled=false;
   show("contract");
   return;
 }
 if(r.status==="READY_HELD_NO_EXECUTION"){
   approvedDigest=r.contract_id;
   show("contract");
   show("workkit");
   show("handoff");
   $("handoff-status").textContent="No capability selected or external work initiated.";
   $("work-status").textContent="No files prepared. Only this separate button authorizes local file preparation.";
   $("confirm").disabled=true;
   $("confirm-status").textContent=
     "Your exact meaning is acknowledged for this page only. HELD: no investigation, dispatch, source GET or model training occurred.";
   report("Goal acknowledged and held. No work executed or personal goal persisted.");
   return;
 }
 if(r.status.startsWith("HOLD_")){
   report(r.message+" You can revise your example or the original question. Nothing executed.");
   if(choice&&$("examples").hidden){
     // No silent auto-switch: the user may rewrite the original text.
     show("examples");
   }
 }
}

async function step(confirm=false){
 if(busy)return;
 busy=true;
 for(const name of ["start","choose-one","choose-both","use-custom","answer","confirm"])
   $(name).disabled=true;
 try{render(await request(confirm))}
 catch(error){report(error.message)}
 finally{
   busy=false;
   for(const name of ["start","choose-one","choose-both","use-custom","answer"])
     $(name).disabled=false;
   if(draft&&$("contract").hidden===false&&$("confirm-status").textContent.indexOf("HELD:")<0)
     $("confirm").disabled=false;
 }
}
function startNew(){
 statement=$("need").value.trim();
 choice=null;ownExample=null;freshness=undefined;draft=null;previousDigest=null;approvedDigest=null;
 for(const id of [...sections,"workkit","work-files","handoff","handoff-options","mail-review","mail-ready"])hide(id);
 handoffCapabilities=null;mailPreview=null;
 void step(false);
}
function choose(which){
 choice=which;
 ownExample=which==="custom"?$("own-example").value.trim():null;
 freshness=undefined;
 draft=null;approvedDigest=null;
 hide("clarify");hide("contract");hide("workkit");hide("handoff");
 handoffCapabilities=null;mailPreview=null;
 void step(false);
}
(async()=>{
 try{
   const response=await fetch("/api/reciprocal/state",{cache:"no-store"});
   const x=await response.json();
   if(!response.ok||typeof x.csrfToken!=="string")throw Error("Local research desk unavailable");
   csrf=x.csrfToken;
   $("connection").textContent="LOCAL · NO CLOUD REQUESTS";
 }catch(error){
   $("connection").textContent="HOLD";
   report(error.message);
   $("start").disabled=true;
 }
})();
$("example").addEventListener("click",()=>{
 $("need").value="Could we get free coffee donated for our fellowship event?";
});
$("goal-form").addEventListener("submit",ev=>{
 ev.preventDefault();
 startNew();
});
$("choose-one").addEventListener("click",()=>choose("one"));
$("choose-both").addEventListener("click",()=>choose("both"));
$("use-custom").addEventListener("click",()=>choose("custom"));
$("answer").addEventListener("click",()=>{
 freshness=Number($("clarify-select").value);
 if(!Number.isInteger(freshness))return report("HOLD: choose a supported age.");
 hide("clarify");
 void step(false);
});
$("change").addEventListener("click",()=>{
 draft=null;choice=null;ownExample=null;freshness=undefined;approvedDigest=null;
 hide("contract");hide("clarify");hide("workkit");hide("handoff");
 handoffCapabilities=null;mailPreview=null;
 show("examples");
 report("You can choose a different example, type your own, or edit your original question. Your previous interpretation will not be used without a fresh confirmation.");
 $("own-example").focus();
});
$("confirm").addEventListener("click",()=>{if(draft)void step(true)});


/** This is a *second* explicit consent: preparing local artifacts, not acting on the world. */
async function preparePacket(){
 if(!csrf||!approvedDigest||!draft||busy){
   $("work-status").textContent="HOLD: Confirm the exact definition of done first.";
   return;
 }
 if(draft.contract_id!==approvedDigest){
   $("work-status").textContent="HOLD: The contract changed. Please reconfirm it.";
   return;
 }
 const button=$("prepare-work");
 button.disabled=true;
 $("work-status").textContent="Preparing four local files without external calls...";
 try{
   const payload={
     text:statement,choice,
     ...(choice==="custom"?{own_example:ownExample}:{}),
     ...(freshness!==undefined?{freshness_hours:freshness}:{}),
     expected_contract_id:approvedDigest,
     consent:true,action:"PREPARE_LOCAL_PACKET_ONLY"
   };
   const response=await fetch("/api/reciprocal/prepare-work",{
     method:"POST",cache:"no-store",
     headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
     body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"HOLD: local work packet unavailable");
   if(result.schema!=="jarvis.goal-work-packet/v1"||
      result.status!=="LOCAL_ARTIFACTS_PREPARED_IN_MEMORY"||
      result.goal_contract_id!==approvedDigest||
      result.external_delivery!==false||
      result.saved_to_disk!==false||result.claimed_real_world_completion!==false||
      !Array.isArray(result.artifacts)||result.artifacts.length!==4)
     throw Error("HOLD: local work-packet boundary failed");
   const el=$("work-list");el.replaceChildren();
   for(const file of result.artifacts){
     if(typeof file.content!=="string"||
        typeof file.file_name!=="string"||
        !/^jarvis-[a-z-]+-(checklist|csv_tracker|unsent_message|html_workpage)\.(txt|csv|html)$/.test(file.file_name)||
        file.downloaded!==false||file.saved_to_disk!==false||file.external_delivery!==false)
       throw Error("HOLD: unverified local file");
     const box=document.createElement("article");box.className="work-file";
     const title=document.createElement("strong");
     title.textContent=file.kind.replaceAll("_"," ")+" · "+file.file_name;
     const details=document.createElement("details");
     const summary=document.createElement("summary");
     summary.textContent="Review contents";
     const pre=document.createElement("pre");pre.textContent=file.content;
     details.append(summary,pre);
     const button=document.createElement("button");button.type="button";
     button.textContent="Download this file";
     button.addEventListener("click",()=>{
       const blob=new Blob([file.content],{type:file.mime});
       const url=URL.createObjectURL(blob);
       const anchor=document.createElement("a");
       anchor.href=url;anchor.download=file.file_name;
       document.body.append(anchor);anchor.click();anchor.remove();
       setTimeout(()=>URL.revokeObjectURL(url),2000);
       $("work-status").textContent="Browser download requested for "+file.file_name+
         ". This does not mean the real-world goal has been achieved.";
     });
     box.append(title,details,button);el.append(box);
   }
   $("work-status").textContent=
      "Four drafts prepared in this browser response. No donors, messages, accounts or sources contacted. Select and review an individual file to download.";
   show("work-files");
 }catch(error){
   $("work-status").textContent=error.message;
 }finally{button.disabled=false}
}
$("prepare-work").addEventListener("click",()=>void preparePacket());


// MOTIF-027: source-bound local capability discovery; no automatic send.
const STAGES={
 discover:"DISCOVER_LOCAL_CAPABILITIES",
 preview:"PREVIEW_MAIL_APP_HANDOFF",
 open:"AUTHORIZE_MAIL_APP_OPEN"
};
const MAIL_SCOPE="OPEN_LOCAL_MAIL_COMPOSER_ONLY";
function approvedGoal(){
 if(!approvedDigest||!draft||draft.contract_id!==approvedDigest||busy)
   throw Error("HOLD: Confirm your definition of enough before choosing a capability.");
 return {
   text:statement,choice,
   ...(choice==="custom"?{own_example:ownExample}:{}),
   ...(freshness!==undefined?{freshness_hours:freshness}:{}),
   expected_contract_id:approvedDigest
 };
}
async function handoff(payload){
 if(!csrf)throw Error("HOLD: local research desk unavailable.");
 const response=await fetch("/api/reciprocal/handoff",{
   method:"POST",cache:"no-store",
   headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
   body:JSON.stringify(payload)
 });
 const value=await response.json();
 if(!response.ok)throw Error(value.error||"HOLD: source-owned handoff refused");
 if(value.schema!=="motif.capability-handoff/v1"||
    value.actual_message_sent!==false||value.external_delivery!==false||
    value.public_network_gets!==0||value.transmittedByServer!==false||
    value.actualDeliveryVerified!==false||
    value.goal_contract_id!==approvedDigest)
   throw Error("HOLD: unverified source authority / source-safety claim.");
 return value;
}
function invalidateMailPreview(){
 mailPreview=null;
 hide("mail-review");hide("mail-ready");
 const a=$("mail-app-link");a.removeAttribute("href");
}
async function discoverHandoff(){
 const button=$("discover-handoff");button.disabled=true;
 try{
  const reply=await handoff({...approvedGoal(),stage:STAGES.discover});
  if(reply.status!=="LOCAL_CAPABILITIES_AVAILABLE_NOT_EXECUTED"||
     !Array.isArray(reply.capabilities))throw Error("HOLD: no compatible local capability");
  handoffCapabilities=new Set(reply.capabilities.map(c=>c.id));
  const hasWorkshop=handoffCapabilities.has("local_workshop");
  const hasMail=handoffCapabilities.has("local_email_composer");
  if(hasWorkshop)show("workshop-door");else hide("workshop-door");
  if(hasMail){
   $("mail-subject").value=reply.message_template_subject||"";
   $("mail-message").value=reply.message_template_body||"";
   $("mail-recipient").value="";
   invalidateMailPreview();
   show("mail-door");
  }else hide("mail-door");
  show("handoff-options");
  $("handoff-status").textContent=
    "Available local doors displayed. No recipient was chosen, no email was sent and no workshop started.";
 }catch(error){$("handoff-status").textContent=error.message}
 finally{button.disabled=false}
}
function currentMail(){
 return {
  recipient:$("mail-recipient").value.trim(),
  subject:$("mail-subject").value.trim(),
  message:$("mail-message").value
 };
}
async function previewHandoff(){
 invalidateMailPreview();
 if(!handoffCapabilities?.has("local_email_composer"))
   return $("handoff-status").textContent="HOLD: no outreach capability for this goal";
 const button=$("preview-handoff");button.disabled=true;
 try{
  const review=currentMail();
  const reply=await handoff({...approvedGoal(),...review,stage:STAGES.preview});
  if(reply.status!=="LOCAL_MAIL_COMPOSER_PREVIEW_NOT_SENT"||
     !/^[a-f0-9]{64}$/.test(reply.preview_id)||
     reply.recipient!==review.recipient||
     reply.subject!==review.subject||reply.message!==review.message)
    throw Error("HOLD: preview does not match your typed message");
  mailPreview={...review,id:reply.preview_id,contract_id:approvedDigest};
  $("preview-recipient").textContent=review.recipient;
  $("preview-subject").textContent=review.subject;
  $("preview-message").textContent=review.message;
  show("mail-review");
  $("handoff-status").textContent=
    "Preview ready. Read the exact recipient and message. Nothing was sent.";
 }catch(error){$("handoff-status").textContent=error.message}
 finally{button.disabled=false}
}
async function authorizeMailApp(){
 hide("mail-ready");
 if(!mailPreview||mailPreview.contract_id!==approvedDigest||
    JSON.stringify(currentMail())!==JSON.stringify({
      recipient:mailPreview.recipient,subject:mailPreview.subject,
      message:mailPreview.message
    })){
   invalidateMailPreview();
   return $("handoff-status").textContent=
     "HOLD: recipient or message changed. Please preview again.";
 }
 const button=$("authorize-mail-app");button.disabled=true;
 try{
  const reply=await handoff({...approvedGoal(),
    ...currentMail(),stage:STAGES.open,
    preview_id:mailPreview.id,open_consent:true,open_permission:MAIL_SCOPE});
  if(reply.status!=="LOCAL_MAIL_APP_HANDOFF_READY_NOT_SENT"||
     !reply.mailto_uri?.startsWith("mailto:")||
     reply.mailto_uri.length>3400)
    throw Error("HOLD: reviewed mail-app handoff not available");
  const a=$("mail-app-link");
  a.href=reply.mailto_uri;
  show("mail-ready");
  $("handoff-status").textContent=
    "Unsent mail-app link prepared. Click the link yourself to open your app. Sending requires your action there.";
 }catch(error){$("handoff-status").textContent=error.message}
 finally{button.disabled=false}
}
function prefillWorkshop(){
 if(!handoffCapabilities?.has("local_workshop")||!approvedDigest)
  return $("handoff-status").textContent="HOLD: local workshop unavailable.";
 // Fragment never travels to the HTTP server; destination immediately
 // scrubs it from the address bar before offering a separate Run button.
 const query=encodeURIComponent(statement);
 window.location.assign("/workshop#goal="+query);
}
$("discover-handoff").addEventListener("click",()=>void discoverHandoff());
$("preview-handoff").addEventListener("click",()=>void previewHandoff());
$("authorize-mail-app").addEventListener("click",()=>void authorizeMailApp());
$("open-workshop").addEventListener("click",prefillWorkshop);
for(const id of ["mail-recipient","mail-subject","mail-message"]){
 $(id).addEventListener("input",invalidateMailPreview);
}
// A changed visible question or custom example also invalidates its old
// approval rather than leaving an action button beside unapproved wording.
for(const id of ["need","own-example"]){
 $(id).addEventListener("input",()=>{
  if(!approvedDigest)return;
  approvedDigest=null;draft=null;handoffCapabilities=null;mailPreview=null;
  hide("workkit");hide("handoff");hide("mail-ready");
  report("Your question has changed. Review and confirm the new definition before another action.");
 });
}
