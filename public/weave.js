const $=id=>document.getElementById(id);
const A=["small","creative","autonomous"];
const EXAMPLES={
 fellowship:{sourceNode:"fellowship",targetNode:"seven-table",kind:"creative",when:"open",
  title:"Welcome table at Fellowship (illustrative)",
  context:"Example only. A human-led gathering could use one welcoming, voluntary ten-minute task. No confirmed partner or event is implied.",
  asks:{small:"Could you help set one chair at the welcome table?",
   creative:"What is one unexpected way to help a new guest feel welcome?",
   autonomous:"Would you propose and steward one ten-minute welcoming task?"}},
 garden:{sourceNode:"garden",targetNode:"now-route",kind:"food",when:"open",
  title:"Garden neighbor support (illustrative)",
  context:"Example only. Consider one voluntary, shelf-stable nonperishable food contribution; no real offer or recipient is implied.",
  asks:{small:"Could you identify one sealed shelf-stable item that might be offered?",
   creative:"What's a useful new way to connect an available shelf-stable item with an expressed need?",
   autonomous:"Would you outline a small human-reviewed pickup coordination task without contacting anyone?"}},
 commons:{sourceNode:"commons",targetNode:"work-inherits",kind:"make",when:"open",
  title:"Commons contribution (illustrative)",
  context:"Example only. A small public-safe code or documentation task could invite independently proposed contributions.",
  asks:{small:"Could you notice one confusing sentence in a public documentation page?",
   creative:"Could you suggest one original, testable way to make a workflow clearer?",
   autonomous:"Would you propose and implement a small reviewed change in your own branch?"}}
};
let csrf=null,state=null,preview=null,reviewedCarrier=null;
const say=(id,text)=>{$(id).textContent=text};
function options(select,items,getKey,getLabel,empty){
 select.replaceChildren();
 if(empty!==undefined){const o=document.createElement("option");o.value="";o.textContent=empty;select.append(o)}
 for(const x of items){const o=document.createElement("option");o.value=getKey(x);o.textContent=getLabel(x);select.append(o)}
}
async function stateLoad(){
 const response=await fetch("/api/weave/state",{cache:"no-store"});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"Network Weave unavailable");
 csrf=data.csrfToken;state=data;renderAtlas();renderEdges();
}
async function call(url,body){
 if(!csrf)throw Error("No local operator session.");
 const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",
  "x-jarvis-csrf":csrf},body:JSON.stringify(body),cache:"no-store"});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"HOLD: rejected by source owner");
 return data;
}
function renderAtlas(){
 const grid=$("organ-grid");grid.replaceChildren();
 for(const n of state.atlas){
  const article=document.createElement("article");article.className="organ";
  const title=document.createElement("strong");title.textContent=n.label;
  const stage=document.createElement("p");stage.className="state";
  stage.textContent=n.maturity+" · NOT CONNECTED";
  const note=document.createElement("p");note.textContent=n.note;
  article.append(title,stage,note);
  if(n.sourceURL){
   const a=document.createElement("a");a.href=n.sourceURL;a.target="_blank";
   a.rel="noopener noreferrer";a.textContent="Inspect source ↗";article.append(a);
  }
  grid.append(article);
 }
 const lastSource=$("source").value,lastTarget=$("target").value,lastCarrierTarget=$("carrier-target").value;
 options($("source"),state.atlas,n=>n.id,n=>n.label);
 options($("target"),state.atlas,n=>n.id,n=>n.label+" · proposed only","No proposed destination");
 options($("carrier-target"),state.atlas,n=>n.id,n=>n.label);
 if(state.atlas.some(n=>n.id===lastSource))$("source").value=lastSource;
 if(state.atlas.some(n=>n.id===lastTarget))$("target").value=lastTarget;
 if(state.atlas.some(n=>n.id===lastCarrierTarget))$("carrier-target").value=lastCarrierTarget;
}
function renderEdges(){
 const edges=$("edges");edges.replaceChildren();
 const list=state.edges||[];
 if(!list.length){const p=document.createElement("p");p.className="subtle";
  p.textContent="No local weave candidates yet. Preview an opportunity above.";edges.append(p)}
 for(const x of list){
  const box=document.createElement("article");box.className="edge";
  const body=document.createElement("div"),title=document.createElement("strong");
  const src=state.atlas.find(n=>n.id===x.sourceNode)?.label||x.sourceNode;
  const dst=state.atlas.find(n=>n.id===x.targetNode)?.label||"Unspecified destination";
  title.textContent=src+" → "+dst;
  const meta=document.createElement("small");meta.textContent="WAKE study "+x.studyId+
   (x.parentStudyId?" · branch from "+x.parentStudyId+" / "+x.parentSlot:"")+
   " · LOCAL ONLY · "+x.disposition;
  const a=document.createElement("a");a.href="/wake";a.textContent="Open WAKE →";
  body.append(title,meta);box.append(body,a);edges.append(box);
 }
 options($("carrier-study"),list,x=>x.studyId,x=>x.studyId+" / "+x.sourceNode,
  "Choose a local woven study");
}
function packetFromForm(){
 return {
  sourceNode:$("source").value,targetNode:$("target").value||null,
  kind:$("kind").value,when:$("when").value,
  title:$("title").value.trim(),context:$("context").value.trim(),
  asks:Object.fromEntries(A.map(k=>[k,$(k).value.trim()])),
  parentStudyId:$("parent-study").value.trim()||null,
  parentSlot:$("parent-slot").value.trim()||null
 };
}
function hidePreview(){
 preview=null;$("preview-panel").hidden=true;
 $("reviewed").checked=false;$("carry-ok").checked=false;$("verified").checked=false;
}
$("thread-form").addEventListener("input",hidePreview);
$("thread-form").addEventListener("change",hidePreview);
for(const button of document.querySelectorAll("[data-preset]")){
 button.addEventListener("click",()=>{
  const p=EXAMPLES[button.dataset.preset];if(!p)return;
  for(const key of ["sourceNode","targetNode","kind","when"]){
   $(key==="sourceNode"?"source":key==="targetNode"?"target":key).value=p[key]
  }
  $("title").value=p.title;$("context").value=p.context;
  for(const k of A)$(k).value=p.asks[k];
  $("parent-study").value="";$("parent-slot").value="";hidePreview();
  say("compose-status","Illustrative example loaded; not a confirmed opportunity or partner.");
 });
}
$("thread-form").addEventListener("submit",async event=>{
 event.preventDefault();hidePreview();$("preview-button").disabled=true;
 try{
  const result=await call("/api/weave/preview",{packet:packetFromForm()});
  preview=result;
  say("preview-summary","Source: "+result.source.label+" / "+result.source.maturity+
    ". Selected receiver: "+(result.destination||"none")+
    ". No data imported, message delivered or person identified.");
  say("preview-packet",["SOURCE: "+result.payload.sourceNode,"TARGET: "+(result.payload.targetNode||"UNSELECTED"),
   "KIND: "+result.payload.kind,"TIME: "+result.payload.when,"TITLE: "+result.payload.title,
   "CONTEXT: "+result.payload.context,...A.map(k=>k.toUpperCase()+": "+result.payload.asks[k]),
   "PARENT: "+(result.payload.parentStudyId ? result.payload.parentStudyId+"/"+result.payload.parentSlot:"none")].join("\n\n"));
  say("preview-hash","SHA-256 (local proposal): "+result.packetSha256);
  const receivers=$("receivers"),routes=$("invitation-actions");receivers.replaceChildren();routes.replaceChildren();
  for(const candidate of result.suggestedReceivers.slice(0,6)){
   const div=document.createElement("div");div.className="route";
   const strong=document.createElement("strong");strong.textContent=candidate.label;
   const note=document.createElement("small");note.textContent=candidate.reason+" · RECEIVER REVIEW REQUIRED";
   div.append(strong,note);receivers.append(div);
  }
  for(const action of result.invitationRoutes){
   const div=document.createElement("div");div.className="route";
   const strong=document.createElement("strong");strong.textContent=action.label;
   const note=document.createElement("small");note.textContent=action.possibleEffect+" · PROPOSAL ONLY";
   div.append(strong,note);routes.append(div);
  }
  $("preview-panel").hidden=false;
  $("preview-panel").scrollIntoView({behavior:"smooth",block:"start"});
  say("compose-status","Review the exact source-labelled packet below; nothing is sent.");
 }catch(error){say("compose-status",error.message)}
 finally{$("preview-button").disabled=false}
});
$("admit").addEventListener("click",async()=>{
 if(!preview)return;
 $("admit").disabled=true;
 try{
  const response=await call("/api/weave/admit",{
   packet:preview.payload,packetSha256:preview.packetSha256,
   reviewed:$("reviewed").checked,sourceReuseApproved:$("carry-ok").checked,
   verifiedOpportunity:$("verified").checked,
   count:Number($("count").value),seed:Number($("seed").value)
  });
  say("admit-status","LOCAL STUDY "+response.studyId+" prepared. No message sent or receiver admitted.");
  await stateLoad();
 }catch(error){say("admit-status",error.message)}
 finally{$("admit").disabled=false}
});
function downloadJson(value,name){
 const blob=new Blob([JSON.stringify(value,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("export-carrier").addEventListener("click",async()=>{
 $("export-carrier").disabled=true;
 try{
  const studyId=$("carrier-study").value,targetNode=$("carrier-target").value;
  const carrier=await call("/api/weave/carrier",{studyId,targetNode,
   humanShareReviewed:$("share-reviewed").checked});
  downloadJson(carrier,"weave-HOLD-"+studyId+"-"+targetNode+".json");
  say("carrier-status","Unsigned HOLD carrier prepared locally. Nothing delivered or authorized.");
  $("share-reviewed").checked=false;
 }catch(error){say("carrier-status",error.message)}
 finally{$("export-carrier").disabled=false}
});
$("incoming").addEventListener("input",()=>{reviewedCarrier=null;$("receive-panel").hidden=true});
$("inspect-carrier").addEventListener("click",async()=>{
 reviewedCarrier=null;$("receive-panel").hidden=true;
 try{
  const carrier=JSON.parse($("incoming").value);
  const observation=await call("/api/weave/inspect-carrier",{carrier});
  reviewedCarrier=carrier;
  say("receive-summary","HOLD: "+observation.sourceNode+" → "+observation.targetNode+
    " / "+observation.selectedTitle+" / unsigned / no source identity established.");
  $("independent-review").checked=false;$("accept-local").checked=false;
  $("receive-panel").hidden=false;
  say("incoming-status","Checksum structure inspected. No admission or network contact.");
 }catch(error){say("incoming-status","HOLD: "+error.message)}
});
$("receive-carrier").addEventListener("click",async()=>{
 if(!reviewedCarrier)return;
 $("receive-carrier").disabled=true;
 try{
  const response=await call("/api/weave/receive",{
   carrier:reviewedCarrier,independentlyReviewed:$("independent-review").checked,
   localOperatorApproved:$("accept-local").checked,count:3,seed:2026
  });
  say("incoming-status","Receiver generated unverified WAKE draft "+response.studyId+
    ". No person contacted, no external authority inherited.");
  $("receive-panel").hidden=true;
  await stateLoad();
 }catch(error){say("incoming-status",error.message)}
 finally{$("receive-carrier").disabled=false}
});
stateLoad().catch(error=>{
 say("compose-status",error.message+" · Run JAR;VIS locally with Python 3.");
 $("preview-button").disabled=true;
});
