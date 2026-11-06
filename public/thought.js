
const $=id=>document.getElementById(id), NS="http://www.w3.org/2000/svg";
let csrf=null,ready=false,ideas=[],links=[],pending=null;
const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);if(cls)e.className=cls;return e;};
function note(x){$("status").textContent=x;}
function draw(){
  const box=$("ideas");box.replaceChildren();
  ideas.forEach((name,i)=>{
    const b=el("button",String(i+1)+". "+name,"idea"+(pending===i?" selected":""));
    b.type="button";b.setAttribute("aria-pressed",String(pending===i));
    b.addEventListener("click",()=>{
      if(pending===null){pending=i;note("Choose the other idea to connect.");}
      else if(pending===i){pending=null;}
      else{
        const r={from:pending,to:i,predicate:$("predicate").value,
                 status:$("authored").checked?"AUTHORED":"HYPOTHESIS_ONLY"};
        if(!links.some(x=>JSON.stringify(x)===JSON.stringify(r)))links.push(r);
        pending=null;note("Link added. It is not independent evidence.");
      }draw();
    });box.append(b);
  });
  if(!ideas.length)box.append(el("p","No ideas yet. Add one above.","hint"));
  const list=$("links");list.replaceChildren();
  links.forEach((r,i)=>{
    const block=el("div",undefined,"link");
    block.append(el("span",(r.from+1)+". "+ideas[r.from]+" — "+r.predicate+" → "+(r.to+1)+". "+ideas[r.to]+" / "+r.status));
    const del=el("button","×");del.type="button";del.setAttribute("aria-label","Remove link "+(i+1));
    del.addEventListener("click",()=>{links.splice(i,1);draw()});block.append(del);list.append(block);
  });
  if(!links.length)list.append(el("p","No authored relations: MOTIF will not invent links from similar words.","hint"));
  for(const [which,defaultIndex] of [["seed-a",0],["seed-b",1]]){
    const sel=$(which),original=sel.value;sel.replaceChildren();
    ideas.forEach((idea,i)=>{const opt=el("option",String(i+1)+". "+idea);opt.value=String(i);sel.append(opt)});
    if(ideas.length)sel.value=original!==""&&Number(original)<ideas.length?original:String(Math.min(defaultIndex,ideas.length-1));
  }
  $("cross-check").disabled=!ready||ideas.length<2;
}
function addIdea(){
  const name=$("idea-input").value.trim();
  if(!name)return;
  if(ideas.length>=24||name.length>160){note("Maximum 24 ideas, 160 characters each.");return;}
  ideas.push(name);$("idea-input").value="";pending=null;draw();$("idea-input").focus();
}
$("add-idea").addEventListener("click",addIdea);
$("idea-input").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addIdea()}});
$("clear").addEventListener("click",()=>{
 ideas=[];links=[];pending=null;$("question").value="";
 $("result").hidden=true;$("cross-result").hidden=true;$("empty").hidden=false;draw();note("Cleared locally. Nothing was stored.");
});
$("example").addEventListener("click",()=>{
 ideas=["Food shelf","Cold storage","Community meal","Volunteers","Venue open","Venue closed"];
 links=[{from:2,to:1,predicate:"requires",status:"AUTHORED"},
 {from:2,to:3,predicate:"requires",status:"AUTHORED"},
 {from:4,to:5,predicate:"contradicts",status:"AUTHORED"},
 {from:0,to:2,predicate:"associated",status:"HYPOTHESIS_ONLY"}];
 $("question").value="What dependencies and contradictions appear in this fictional meal?";
 document.querySelectorAll("[name=goal]").forEach(c=>{c.checked=c.value==="dependency"||c.value==="tension"});
 pending=null;draw();note("Fictional fixture loaded. No actual resources or venues are verified.");
});
function svg(tag,attrs,txt){
 const o=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attrs||{}))o.setAttribute(k,String(v));
 if(txt!==undefined)o.textContent=String(txt);
 return o;
}
function showDrawing(result){
 const container=$("drawing");container.replaceChildren();
 if(!$("geometry").checked){
   container.append(el("p","Geometry disabled. Only source-grounded answers were inspected.","hint"));return;
 }
 const map=result.views.find(v=>v.lens!=="NONE"&&v.placements.length);
 const items=map?map.placements.filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)):
   result.ideas.map((_,i)=>({manifestation_id:"m:"+String(i).padStart(2,"0"),
     x:Math.cos(i*6.28318/result.ideas.length),y:Math.sin(i*6.28318/result.ideas.length)}));
 if(!items.length){container.append(el("p","No geometric projection was returned.","hint"));return;}
 const W=920,H=Math.max(310,Math.min(570,105+items.length*42));
 const minx=Math.min(...items.map(p=>p.x)),maxx=Math.max(...items.map(p=>p.x));
 const miny=Math.min(...items.map(p=>p.y)),maxy=Math.max(...items.map(p=>p.y));
 const sx=Math.max(.1,maxx-minx),sy=Math.max(.1,maxy-miny);
 const positions=new Map();
 const scene=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"Provisional idea placements"});
 scene.append(svg("rect",{width:W,height:H,fill:"#fffdfa"}));
 for(const p of items){
   const prior=positions.get(p.manifestation_id)||[];
   const xy={x:105+(p.x-minx)/sx*(W-210)+prior.length*18,
             y:63+(p.y-miny)/sy*(H-126)+prior.length*18};
   positions.set(p.manifestation_id,[...prior,xy]);
 }
 const colors={associated:"#729589",requires:"#679481",enables:"#bd8856",contradicts:"#b95e50",precedes:"#978ac0"};
 for(const r of result.relationships){
   const a=positions.get("m:"+String(r.from).padStart(2,"0"))?.[0];
   const b=positions.get("m:"+String(r.to).padStart(2,"0"))?.[0];
   if(!a||!b)continue;
   scene.append(svg("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:colors[r.predicate],
     "stroke-width":r.status==="AUTHORED"?2.5:2,
     "stroke-dasharray":r.status==="AUTHORED"?"none":"7 5"}));
 }
 for(const [id,arr] of positions){
   const i=Number(id.slice(2)),name=result.ideas[i]||id;
   for(const p of arr){
     scene.append(svg("rect",{x:p.x-88,y:p.y-20,width:176,height:40,rx:13,fill:"#fffdf5",stroke:"#47775b","stroke-width":1.8}));
     scene.append(svg("text",{x:p.x,y:p.y+4,"text-anchor":"middle","font-size":12,
       "font-family":"system-ui,sans-serif",fill:"#2c5139"},String(i+1)+". "+(name.length>20?name.slice(0,19)+"…":name)));
   }
 }
 scene.append(svg("text",{x:19,y:H-12,fill:"#728478","font-size":12},
   map?"MOTIF "+map.lens+" projection / coordinates are not evidence":
       "UI-only sketch / MOTIF did not select geometry"));
 container.append(scene);
}
function render(out){
 $("cross-result").hidden=true;
 $("empty").hidden=true;$("result").hidden=false;
 $("review").textContent=out.status+" · PEN "+out.pen_status+" · AUTHORITY NONE";
 $("lens-pills").replaceChildren();
 for(const lens of (out.selected_lenses.length?out.selected_lenses:["NONE / SOURCE ONLY"]))
  $("lens-pills").append(el("span",lens.toUpperCase()));
 showDrawing(out);
 const list=$("questions");list.replaceChildren();
 if(!out.questions.length)
   list.append(el("p","No new evidence-grounded questions. A single operator cannot create independent witnesses by drawing more edges.","hint"));
 for(const [i,q] of out.questions.entries()){
   const card=el("article",undefined,"question");
   card.append(el("strong",String(i+1)+". "+q.question),el("p",q.kind.replaceAll("_"," ")+" / QUESTION ONLY"));
   list.append(card);
 }
 $("evidence").textContent=JSON.stringify({source_only_answers:out.source_only_answers,
  selection_trace:out.selection_trace,source_digest:out.source_digest,
  receipt_digest:out.receipt_digest,stored:out.stored,exported:out.exported},null,2);
 $("limits").textContent=out.boundary+" No outside contact, export or PEN update occurred.";
}
$("explore").addEventListener("click",async()=>{
 const goals=[...document.querySelectorAll("[name=goal]:checked")].map(x=>x.value);
 if(!ready||!csrf){note("HOLD: local MOTIF runtime unavailable.");return;}
 if(!ideas.length||!goals.length||!$("question").value.trim()){
   note("Add at least one idea, a question and a reasoning goal.");return;
 }
 $("explore").disabled=true;note("Examining pencil sketch using pinned local MOTIF…");
 try{
   const response=await fetch("/api/thought/preview",{method:"POST",cache:"no-store",
     headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
     body:JSON.stringify({question:$("question").value,ideas,relationships:links,
       goals,show_geometry:$("geometry").checked})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"HOLD: operation refused");
   render(result);note("Pencil sketch complete. No raw input stored or sent externally.");
 }catch(e){note(e.message);}
 finally{$("explore").disabled=false;}
});
$("cross-check").addEventListener("click",async()=>{
  const seed_a=Number($("seed-a").value),seed_b=Number($("seed-b").value);
  if(!ready||!csrf){note("HOLD: local MOTIF runtime unavailable.");return;}
  if(!Number.isSafeInteger(seed_a)||!Number.isSafeInteger(seed_b)||seed_a===seed_b||ideas.length<2){
    note("Select two separate idea occurrences.");return;
  }
  if(!$("question").value.trim()){note("Write a question first.");return;}
  $("cross-check").disabled=true;
  note("Carrying one pencil question through several source-bound perspectives…");
  try{
    const response=await fetch("/api/thought/cross-check",{method:"POST",cache:"no-store",
      headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
      body:JSON.stringify({question:$("question").value,ideas,relationships:links,seed_a,seed_b,show_geometry:$("geometry").checked})});
    const out=await response.json();
    if(!response.ok)throw Error(out.error||"HOLD: cross-lens inspection refused");
    $("result").hidden=false;$("empty").hidden=true;$("cross-result").hidden=false;
    $("cross-review").textContent=out.status+" · ONE SOURCE · PEN "+out.pen_status;
    const steps=$("cross-steps");steps.replaceChildren();
    out.steps.forEach((step,i)=>{
      const card=el("article");
      card.append(el("strong",String(i+1)+". "+step.lens.toUpperCase()),
        el("p",step.new_question_ids.length+" new question(s), "+step.carried_question_ids.length+
          " carried. Geometric evidence: NONE."));
      steps.append(card);
    });
    const questions=$("cross-questions");questions.replaceChildren();
    out.carried_questions.forEach((q,i)=>{
      const card=el("article");
      card.append(el("strong",String(i+1)+". "+q.question),
        el("p",q.kind.replaceAll("_"," ")+" / "+q.status+" / "+q.evidence_class));
      questions.append(card);
    });
    note("Cross-lens inspection complete. No input saved, sent, or promoted.");
  }catch(e){note(e.message)}
  finally{$("cross-check").disabled=!ready||ideas.length<2}
});
async function init(){
 try{
   const [a,b]=await Promise.all([fetch("/api/state",{cache:"no-store"}),
     fetch("/api/thought/status",{cache:"no-store"})]);
   const state=await a.json(),desk=await b.json();
   if(!a.ok||!b.ok||!desk.available)throw Error(desk.reason||"MOTIF unavailable");
   csrf=state.csrfToken;ready=true;draw();$("machine").textContent="PINNED / LOCAL";
   note("Local Pencil engine ready; nothing is retained.");
 }catch(e){$("machine").textContent="HOLD / UNAVAILABLE";$("explore").disabled=true;note(e.message);}
}
draw();init();
