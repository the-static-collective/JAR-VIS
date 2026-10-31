const $ = id => document.getElementById(id);
let csrf=null, current=null, cardText="";
const run = async (url, payload) => {
  const response = await fetch(url,{method:"POST",headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
    body:JSON.stringify(payload),cache:"no-store"});
  const body = await response.json();
  if(!response.ok)throw Error(body.error || "HOLD: operation unavailable");
  return body;
};
function status(id,message) { $(id).textContent=message; }
function refreshCounters(data) {
  $("count-verdicts").textContent=String(data.feedbackEvents);
  $("count-cards").textContent=String(data.artifactObservations);
  $("count-recipes").textContent=String(data.recipes);
}
async function init() {
  try{
    const response=await fetch("/api/recursive/state",{cache:"no-store"});
    const data=await response.json();
    if(!response.ok)throw Error(data.error || "HOLD: local source unavailable");
    csrf=data.csrfToken;
    status("machine-status","PINNED STATIC OS · LOCAL ONLY");
    refreshCounters(data);
  } catch(error) {
    status("machine-status",error.message);
    status("ask-status",error.message+". Install Python 3 or inspect the local source snapshot.");
    $("ask-btn").disabled=true;
  }
}
function render(result) {
  current=result;
  cardText="";
  $("card-output").hidden=true;
  $("download-card").hidden=true;
  $("remember-card").disabled=true;
  $("helpful").disabled=false;
  $("not-helpful").disabled=false;
  $("promote").checked=false;
  $("promote").disabled=!result.plan.candidate_recipe;
  const family=result.family;
  const messages = family.capsule.pressures.map(x=>x.kind.replaceAll("-"," ")).slice(0,3);
  $("result-context").textContent=
    "Static OS assembled "+result.plan.operator_count+" typed operators and "+
    family.candidates.length+" candidate route"+(family.candidates.length===1?"":"s")+
    ". "+(result.plan.uncertain?"It could not identify a confident topic, so these are exploratory. ":"")+
    "Memory pressures: "+(messages.length?messages.join(", "):"no prior local judgments")+
    ". Nothing was dispatched.";
  const routes=$("paths");
  routes.replaceChildren();
  family.candidates.forEach((candidate,i)=>{
    const entry=document.createElement("article");
    entry.className="path";
    const title=document.createElement("strong");title.textContent=(i+1)+". "+candidate.routes.map(x=>x.toUpperCase()).join(" + ");
    const note=document.createElement("small");note.textContent=candidate.policy+" / PROPOSAL ONLY";
    const reason=document.createElement("p");reason.textContent=candidate.why;
    entry.append(title,note,reason);
    for(let j=0;j<candidate.doors.length;j++){
      const url=candidate.doors[j];
      if(!/^https:\/\/(garden\.abundent\.org|table\.abundent\.org|connections\.abundent\.org|abundent\.org)\//.test(url))continue;
      const a=document.createElement("a");
      a.href=url;a.rel="noopener noreferrer";a.target="_blank";a.textContent="Explore "+candidate.routes[j]+" ↗";
      entry.append(a);
    }
    routes.append(entry);
  });
  const menu=$("card-topic");menu.replaceChildren();
  result.plan.topics.forEach(topic=>{
    const o=document.createElement("option");o.value=topic;o.textContent=topic+" / a possible first door";menu.append(o);
  });
  status("feedback-status","No feedback recorded. You can leave without remembering anything.");
  $("result").hidden=false;$("result").focus();
}
$("ask-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!csrf)return;
  try{
    const raw=$("question").value.trim();
    if(raw.length<2 || raw.length>320)throw Error("Please type 2–320 characters.");
    $("ask-btn").disabled=true;
    status("ask-status","Compiling a new local graph...");
    const out=await run("/api/recursive/ask",{text:raw});
    render(out);
    status("ask-status","Local Static OS question processed. Not saved.");
    refreshCounters(out.memory);
  }catch(error){status("ask-status",error.message);}
  finally{$("ask-btn").disabled=false}
});
$("example-btn").addEventListener("click",()=>{$("question").value="Could we make music and food around a folding table?";$("question").focus()});
$("card-topic").addEventListener("change",()=>{cardText="";$("card-output").hidden=true;$("download-card").hidden=true;$("remember-card").disabled=true;});
$("make-card").addEventListener("click",async()=>{
  if(!current)return;
  try{
    const r=await run("/api/recursive/preview-card",{plan:current.plan,topic:$("card-topic").value});
    cardText=r.card;$("card-output").value=cardText;$("card-output").hidden=false;
    $("download-card").hidden=false;$("remember-card").disabled=false;
    status("feedback-status","Card drafted only. It hasn't been saved to the learning journal.");
  }catch(e){status("feedback-status",e.message)}
});
$("download-card").addEventListener("click",()=>{
  if(!cardText)return;
  const url=URL.createObjectURL(new Blob([cardText],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download="jarvis-one-little-workshop-card.txt";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  status("feedback-status","Your browser was asked to download the card. JAR;VIS has not recorded that it was used.");
});
$("remember-card").addEventListener("click",async()=>{
  if(!current||!cardText)return;
  try{
    $("remember-card").disabled=true;
    const result=await run("/api/recursive/remember-card",{plan:current.plan,topic:$("card-topic").value,consent:true});
    refreshCounters(result.memory);
    status("feedback-status","Generated-card observation saved locally, with explicit consent. No claim about real-world use.");
  }catch(e){status("feedback-status",e.message);$("remember-card").disabled=false;}
});
async function verdict(outcome){
  if(!current)return;
  const selected=$("card-topic").value;
  const promoteRecipe=$("promote").checked;
  if(promoteRecipe&&outcome!=="helpful"){status("feedback-status","A negative verdict cannot approve a reusable macro.");return;}
  try{
    $("helpful").disabled=true;$("not-helpful").disabled=true;
    const result=await run("/api/recursive/feedback",{
      plan:current.plan,selected,outcome,consent:true,promoteRecipe
    });
    refreshCounters(result.memory);
    status("feedback-status","Your "+outcome.replaceAll("_"," ")+
      " verdict was saved locally. Re-ask the question to see what changed.");
  }catch(e){status("feedback-status",e.message);$("helpful").disabled=false;$("not-helpful").disabled=false;}
}
$("helpful").addEventListener("click",()=>verdict("helpful"));
$("not-helpful").addEventListener("click",()=>verdict("not_helpful"));
$("remember-card").disabled=true;
init();
