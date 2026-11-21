const el=id=>document.getElementById(id);
const ARMS=["small","creative","autonomous"];
const NEXT={
  NONE:["offered","opted_out"],
  OFFERED:["replied","declined","opted_out"],
  REPLIED:["action","declined","opted_out"],
  ACTION:["novel_action","opted_out"],
  NOVEL_ACTION:["opted_out"], DECLINED:[], OPTED_OUT:[]
};
const WORDS={
  offered:"Invitation offered (I confirmed contact permission)",
  replied:"They voluntarily replied",
  action:"A useful action happened (operator-attested)",
  novel_action:"An unplanned useful action happened (operator-attested)",
  declined:"They declined — stop",
  opted_out:"They opted out — stop"
};
const PRESETS={
 fellowship:{
  title:"Fellowship welcome table — EXAMPLE",
  context:"Illustrative only: a community gathering might need a voluntary welcome table. Confirm the actual gathering and need before use.",
  small:"Could you help place one chair at the welcome table?",
  creative:"What is one better way to welcome someone who walks in alone?",
  autonomous:"Would you like to propose and steward a ten-minute welcome-table task?"
 },
 garden:{
  title:"Garden grocery exchange — EXAMPLE",
  context:"Illustrative only: a local mutual-help network might need volunteers to identify a useful, safe small contribution.",
  small:"Could you suggest one ordinary shelf-stable food item to offer?",
  creative:"What's one practical, unexpected way neighbors could share a resource?",
  autonomous:"Would you outline and own a ten-minute, nonperishable collection task?"
 },
 commons:{
  title:"Neighborhood help exchange — EXAMPLE",
  context:"Illustrative only: people with useful skills might contribute to a small voluntary community task.",
  small:"Could you identify one tool we already have available?",
  creative:"What creative reuse of existing tools would make this task easier?",
  autonomous:"Would you like to propose and lead a tiny experiment, with no ongoing obligation?"
 }
};
let csrf=null,state=null,slotId=null,activeStudy=null;
const say=(id,text)=>{el(id).textContent=text};
function buildOptions(select,items,getValue,getLabel){
  select.replaceChildren();
  for(const item of items){const option=document.createElement("option");option.value=getValue(item);option.textContent=getLabel(item);select.append(option)}
}
async function load(id=null){
 const path="/api/wake/state"+(id?"?studyId="+encodeURIComponent(id):"");
 const response=await fetch(path,{cache:"no-store"});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"WAKE desk unavailable");
 csrf=data.csrfToken;
 render(data);
}
async function post(path,data){
 if(!csrf)throw Error("Local session is not ready.");
 const response=await fetch(path,{method:"POST",headers:{
  "content-type":"application/json","x-jarvis-csrf":csrf},body:JSON.stringify(data),cache:"no-store"});
 const body=await response.json();
 if(!response.ok)throw Error(body.error||"HOLD: action refused");
 csrf=body.csrfToken;return body;
}
function render(data){
 state=data;
 const picker=el("study-select");
 buildOptions(picker,data.studies,x=>x.studyId,x=>x.title+" · "+x.studyId.slice(0,8));
 el("study").hidden=!data.active;
 if(!data.active){activeStudy=null;return}
 const active=data.active,plan=active.plan,spec=plan.spec,summary=active.report.results;
 activeStudy=active.studyId;picker.value=activeStudy;
 el("kind").textContent=spec.verified_opportunity?"OPERATOR CONFIRMED":"DRAFT ONLY";
 say("study-summary","Study "+activeStudy+" · "+spec.count+" randomized slots · "+
  active.event_count+" locally recorded events · no automatic delivery.");
 const counts=el("counts");counts.replaceChildren();
 for(const arm of ARMS){
  const r=summary[arm],card=document.createElement("article");card.className="count";
  const title=document.createElement("strong");title.textContent=arm.toUpperCase()+" / "+r.assigned+" ASSIGNED";
  const count=document.createElement("b");count.textContent=r.operator_attested_actions+" ACTIONS";
  const sub=document.createElement("span");sub.textContent=r.offered+" offered · "+r.replied+" replied · "+
      r.operator_attested_unplanned_actions+" unexpected · "+r.opted_out+" opted out";
  card.append(title,count,sub);counts.append(card);
 }
 const slots=el("slot");
 const previous=slotId && plan.assignments.some(x=>x.slot===slotId)?slotId:plan.assignments[0].slot;
 buildOptions(slots,plan.assignments,x=>x.slot,x=>x.slot+" · "+x.arm+" · "+active.states[x.slot]);
 slotId=previous;slots.value=previous;renderSlot();
}
function renderSlot(){
 if(!state?.active)return;
 const active=state.active,item=active.plan.assignments.find(x=>x.slot===slotId);
 if(!item)return;
 say("slot-state",item.slot+" / "+item.arm.toUpperCase()+" / "+active.states[slotId]);
 say("message",item.message);
 const options=NEXT[active.states[slotId]]||[];
 buildOptions(el("event"),options,x=>x,x=>WORDS[x]);
 el("record-button").disabled=options.length===0||(!active.plan.spec.verified_opportunity&&options.includes("offered"));
 // For drafts, "opted_out" is still permitted as a local disposition.
 if(!active.plan.spec.verified_opportunity&&options.includes("offered")){
  el("event").value="opted_out";
 }
 adjustEvent();
}
function adjustEvent(){
 const event=el("event").value;
 el("permission-row").hidden=event!=="offered";
 el("attest-row").hidden=!["action","novel_action"].includes(event);
 el("receipt-row").hidden=!["action","novel_action"].includes(event);
 el("contact-permission").checked=false;el("attestation").checked=false;el("receipt").value="";
 const dry=state?.active?.plan?.spec?.verified_opportunity===false;
 el("record-button").disabled=!event||(dry&&event==="offered");
 if(dry&&event==="offered")say("record-status","HOLD: create a separate verified study before recording a real invitation.");
}
el("new-study").addEventListener("submit",async event=>{
 event.preventDefault();
 const button=el("create-button");button.disabled=true;
 try{
  const payload={title:el("title").value.trim(),context:el("context").value.trim(),
    small:el("small").value.trim(),creative:el("creative").value.trim(),
    autonomous:el("autonomous").value.trim(),count:Number(el("count").value),
    seed:Number(el("seed").value),verifiedOpportunity:el("verified").checked};
  const data=await post("/api/wake/create",payload);
  slotId=null;render(data);
  say("create-status","Study "+data.active.studyId+" saved on this computer. No invitation was sent.");
  el("study").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(error){say("create-status",error.message)}
 finally{button.disabled=false}
});
document.querySelectorAll("[data-preset]").forEach(button=>button.addEventListener("click",()=>{
 const preset=PRESETS[button.dataset.preset];if(!preset)return;
 for(const name of ["title","context",...ARMS])el(name).value=preset[name];
 el("verified").checked=false;
 say("create-status","Illustrative draft loaded. Edit and independently verify before any real outreach.");
}));
el("study-select").addEventListener("change",async()=>{
 try{slotId=null;await load(el("study-select").value)}
 catch(error){say("record-status",error.message)}
});
el("slot").addEventListener("change",()=>{slotId=el("slot").value;renderSlot()});
el("event").addEventListener("change",adjustEvent);
el("record-form").addEventListener("submit",async event=>{
 event.preventDefault();
 if(!state?.active)return;
 const button=el("record-button");button.disabled=true;
 const payload={studyId:activeStudy,slot:slotId,event:el("event").value,
  contactPermission:el("contact-permission").checked,actionAttested:el("attestation").checked,
  receipt:el("receipt").value.trim()||null};
 try{
  const data=await post("/api/wake/record",payload);render(data);
  say("record-status","Recorded "+payload.event+" for "+payload.slot+" in the local operator journal. Not independent proof.");
 }catch(error){say("record-status",error.message)}
 finally{if(el("event").value)button.disabled=false}
});
el("copy").addEventListener("click",async()=>{
 if(!state?.active)return;
 try{await navigator.clipboard.writeText(el("message").textContent);
  say("record-status","Copied draft text only. Nothing sent.")}
 catch{say("record-status","Copy unavailable in this browser. Select the invitation text manually.")}
});
function download(text,name,type){
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
el("download").addEventListener("click",()=>{
 if(!state?.active)return;
 const plan=state.active.plan;
 const text=plan.assignments.map(x=>x.slot+" / "+x.arm.toUpperCase()+"\n"+x.message).join("\n\n"+
  "-".repeat(45)+"\n\n");
 download("UNSENT DRAFTS — "+plan.study_id+"\nNo contacts or deliveries recorded.\n\n"+text,
  "wake-"+plan.study_id+"-UNSENT.txt","text/plain;charset=utf-8");
});
el("export").addEventListener("click",()=>{
 if(!state?.active)return;
 const {studyId,report}=state.active;
 download(JSON.stringify({studyId,sourceCommit:state.sourceCommit,report},null,2)+"\n",
 "wake-"+studyId+"-aggregates.json","application/json");
});
load().catch(error=>{
 say("create-status",error.message+" · Requires local JAR;VIS and Python 3.");
 el("create-button").disabled=true;
});
