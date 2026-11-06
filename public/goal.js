const $=id=>document.getElementById(id);
let csrf=null,answers={},draft=null,statement="",questionKey=null;
const report=s=>{$("goal-status").textContent=s};
async function handshake(confirm=false){
 const payload={text:statement,answers,...(confirm?{
  confirmed:true,expected_contract_id:draft.contract_id}:{})};
 const response=await fetch("/api/reciprocal/goal",{
  method:"POST",cache:"no-store",
  headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
  body:JSON.stringify(payload)});
 const x=await response.json();
 if(!response.ok)throw Error(x.error||"HOLD: unavailable");
 if(x.source_requests_sent!==0||x.transmittedToNetwork!==false)
  throw Error("HOLD: unexpected external work");
 return x;
}
function display(x){
 $("clarify").hidden=true;$("contract").hidden=true;
 report(x.message+" No external requests or stored questions.");
 if(x.status==="ASK_ONE_DECISIVE_QUESTION"){
  const q=x.next_question;questionKey=q.id;
  $("clarify-title").textContent=q.question;
  const s=$("clarify-select");s.replaceChildren();
  for(const choice of q.options){
   const o=document.createElement("option");
   o.value=String(choice.value);o.textContent=choice.label;s.append(o);
  }
  $("why").textContent=x.why_this_question||"Your answer changes what counts as done.";
  $("clarify").hidden=false;
 }else if(x.status==="CONFIRM_REQUIRED"){
  draft=x;const c=x.draft_contract;
  $("contract-meaning").textContent=
   (c.goal==="any_fresh"?"ONE qualifying public river report would be enough.":
    "BOTH Blue Earth and Le Sueur public reports are required.")+
    " Maximum observation age: "+c.freshness_hours+" hours.";
  $("contract-sources").textContent="Public stations in order: "+
   c.read_only_public_gauge_ids.join(", ")+". No source contacted.";
  const old=x.earlier_matching_12h_example;
  $("contract-resource").textContent=old?
   "Earlier source experiment: "+old.historical_actual_request_count+
   " actual GET(s), "+old.historical_actual_http_body_bytes+
   " HTTP body bytes. NOT a future estimate.":
   "No matching physical report for this freshness cutoff.";
  $("confirm").disabled=false;
  $("confirm-status").textContent="Confirmation does not permit execution.";
  $("contract").hidden=false;
 }else if(x.status==="READY_HELD_NO_EXECUTION"){
  $("contract").hidden=false;$("confirm").disabled=true;
  $("confirm-status").textContent="Exact goal acknowledged. HELD: no HTTP requests, no storage, no execution.";
 }else if(x.status.startsWith("HOLD_"))report(x.message+" No action taken.");
}
async function step(confirm=false){
 if(!csrf)return report("HOLD: localhost desk unavailable");
 $("start").disabled=true;$("answer").disabled=true;$("confirm").disabled=true;
 try{display(await handshake(confirm))}
 catch(err){report(err.message)}
 finally{$("start").disabled=false;$("answer").disabled=false}
}
(async()=>{
 try{
  const r=await fetch("/api/reciprocal/state",{cache:"no-store"});
  const x=await r.json();if(!r.ok)throw Error(x.error||"Unavailable");
  csrf=x.csrfToken;$("connection").textContent="LOCAL ONLY";
 }catch(err){$("connection").textContent="HOLD";report(err.message);$("start").disabled=true}
})();
$("example").addEventListener("click",()=>{$("need").value="Could you check the rivers?"});
$("goal-form").addEventListener("submit",e=>{
 e.preventDefault();statement=$("need").value.trim();answers={};draft=null;
 $("confirm-status").textContent="";void step();
});
$("answer").addEventListener("click",()=>{
 if(!questionKey)return;
 const val=$("clarify-select").value;
 answers[questionKey]=questionKey==="freshness_hours"?Number(val):val;
 void step();
});
$("change").addEventListener("click",()=>{
 $("contract").hidden=true;$("clarify").hidden=true;draft=null;
 report("Edit your question above. No sources contacted.");$("need").focus();
});
$("confirm").addEventListener("click",()=>{if(draft)void step(true)});
