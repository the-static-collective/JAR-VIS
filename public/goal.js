/** Human examples. Input and correction are in-memory and LOCAL only. */
const $=id=>document.getElementById(id);
let csrf=null,statement="",choice=null,ownExample=null,freshness=undefined;
let draft=null,previousDigest=null,busy=false;
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
 const response=await fetch("/api/reciprocal/examples",{
   method:"POST",cache:"no-store",
   headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
   body:JSON.stringify(data)
 });
 const value=await response.json();
 if(!response.ok)throw Error(value.error||"HOLD: example interpreter unavailable");
 if(value.schema!=="motif.goal-example-correction/v1"||
    value.source_requests_sent!==0||
    value.transmittedToNetwork!==false||
    value.persistentLearning!==false)
   throw Error("HOLD: unverified research response");
 return value;
}

function render(r){
 hide("clarify");
 hide("contract");
 report(r.message+" No sources contacted.");
 if(r.status==="SHOW_TWO_EXAMPLES"){
   const examples=r.examples||[];
   if(examples.length!==2)throw Error("HOLD: not two source-owned examples");
   $("example-one-text").textContent=examples[0].would_this_be_enough;
   $("example-both-text").textContent=examples[1].would_this_be_enough;
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
   $("contract-meaning").textContent=
     (c.goal==="any_fresh"?
      "ONE qualifying public river report is enough.":
      "Reports from BOTH Blue Earth and Le Sueur are required.")+
     " Maximum reported observation age: "+c.freshness_hours+" hours.";
   $("contract-sources").textContent=
     "Predeclared public station IDs: "+c.read_only_public_gauge_ids.join(", ")+
     ". No sensors have been contacted.";
   const previous=r.prior_physical_example;
   $("contract-resource").textContent=previous?
      "In a previous 12-hour research task: "+previous.historical_actual_request_count+
      " actual GET(s), "+previous.historical_actual_http_body_bytes+
      " response-body bytes. This is NOT an estimate for you.":
      "No directly comparable historical physical run for this time threshold.";
   $("confirm-status").textContent=
      old&&old!==r.contract_id?
      "You corrected the earlier interpretation. That old definition no longer applies; confirm this new one.":
      "Check the meaning above. Only you may say that this is enough.";
   $("confirm").disabled=false;
   show("contract");
   return;
 }
 if(r.status==="READY_HELD_NO_EXECUTION"){
   show("contract");
   $("confirm").disabled=true;
   $("confirm-status").textContent=
     "Your exact meaning is acknowledged for this page only. HELD: no investigation, dispatch, source GET or model training occurred.";
   report("Goal acknowledged. The current prototype cannot execute it.");
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
 choice=null;ownExample=null;freshness=undefined;draft=null;previousDigest=null;
 for(const id of sections)hide(id);
 void step(false);
}
function choose(which){
 choice=which;
 ownExample=which==="custom"?$("own-example").value.trim():null;
 freshness=undefined;
 draft=null;
 hide("clarify");hide("contract");
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
 $("need").value="Could you check the rivers?";
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
 draft=null;choice=null;ownExample=null;freshness=undefined;
 hide("contract");hide("clarify");
 show("examples");
 report("You can choose a different example, type your own, or edit your original question. Your previous interpretation will not be used without a fresh confirmation.");
 $("own-example").focus();
});
$("confirm").addEventListener("click",()=>{if(draft)void step(true)});
