// Minimal, session-only human interface for the original MOTIF source runtime.
// No localStorage, indexedDB, remote calls, analytics, or automatic branch activity.
const el = id => document.getElementById(id);
const put = (parent, tag, text, className = "") => {
  const node = document.createElement(tag);
  if(className)node.className=className;
  node.textContent = String(text);
  parent.appendChild(node);
  return node;
};
let csrf = null, reports = [], last = null, caseData = null;
let busy = false;
const ids = ["a","b","c"];
const sources = {first:"Observation A",second:"Observation B"};
function labelFor(id) {
  return id === "first" ? el("test-a").value : id === "second" ? el("test-b").value : id ?? "none";
}
function buildCase() {
  const question = el("question").value.trim();
  const goal = el("goal").value.trim();
  if(question.length<3 || goal.length<3)throw Error("State a question and a consequential decision.");
  const hypotheses = ids.map(id=>({
    id, label:el("hyp-"+id).value.trim(),predictions:{
      first:el(id+"-a").value,second:el(id+"-b").value
    }
  }));
  if(hypotheses.some(h=>!h.label))throw Error("Provide all three candidate explanations.");
  const tests = [{id:"first",cost:.04,risk:0},{id:"second",cost:.12,risk:.10}];
  return {question,goal,hypotheses,tests,reports:reports.map(r=>({...r}))};
}
const status = (msg, error=false) => {
  const node=el("machine-status");
  node.textContent=msg;
  node.classList.toggle("error",error);
};
async function request(path, body) {
  if(!csrf)throw Error("Local source status unavailable.");
  const reply=await fetch(path,{
    method:"POST",
    headers:{"content-type":"application/json","x-jarvis-csrf":csrf},
    body:JSON.stringify(body)
  });
  const payload=await reply.json();
  if(!reply.ok)throw Error(payload.error || "Source-held operation failed.");
  return payload;
}
function clear(node) {node.replaceChildren();}
function nameOf(id) {
  if(!id)return "No discriminating question";
  return labelFor(id);
}
function draw() {
  const result=last.results;
  const motif=result.motif_spine;
  el("answer").hidden=false;
  el("compare").hidden=false;
  const decision=el("decision");clear(decision);
  const box=put(decision,"div","","decision");
  put(box,"strong",motif.result.replaceAll("_"," "));
  put(box,"p","Unresolved hypotheses: "+
      (motif.remaining_hypotheses.map(id=>el("hyp-"+id).value).join(" · ")||"none"));
  put(box,"p","Source claims on this session: "+motif.reported_source_claims+"; these are not verified identities.","mini");
  put(box,"p","Next observation: "+nameOf(motif.next_probe?.id));
  const next=motif.next_probe?.id||null;
  el("challenge").hidden=!next;
  if(next)el("next-question").textContent="Would you examine: "+labelFor(next)+"?";
  el("record").dataset.test = next||"";
  const ledger=el("ledger");clear(ledger);
  if(reports.length) {
    put(ledger,"h3","Session reports (not stored)");
    for(const r of reports)put(ledger,"p",labelFor(r.test)+": "+r.outcome.toUpperCase()+
      " / "+(r.status==="reviewed"?"self-marked reviewed in fictional exercise":"unverified report"));
  }
  const policies=el("policies");clear(policies);
  for(const [key,title] of [
    ["fixed_classical","Fixed-order classical"],
    ["strong_classical_ig","Classical information gain"],
    ["motif_spine","MOTIF cost-aware policy"]
  ]) {
    const x=result[key];const card=put(policies,"div","","policy");
    put(card,"h3",title);
    put(card,"strong",nameOf(x.next_probe?.id));
    put(card,"p","Status: "+x.result.replaceAll("_"," "));
    put(card,"p",x.next_probe
      ? "Information gain: "+x.next_probe.classical_information_gain_bits+" bits"
      : "No currently justified probe.","mini");
  }
}
async function perform() {
  if(busy)return;
  busy=true;el("run").disabled=true;el("record").disabled=true;
  try {
    caseData=buildCase();
    status("Executing original pinned MOTIF locally…");
    last=await request("/api/motif/compare",{case:caseData});
    draw();
    status("Original MOTIF code executed locally. Nothing stored, sent or merged.");
  } catch (error) {
    status("HOLD: "+error.message,true);
  } finally {
    busy=false;el("run").disabled=false;el("record").disabled=false;
  }
}
el("case-form").addEventListener("submit",async event=>{
  event.preventDefault();reports=[];await perform();
});
el("reset").addEventListener("click",()=>{
  reports=[];last=null;caseData=null;
  el("answer").hidden=true;el("compare").hidden=true;
  status("Local observations cleared. The example fields remain editable.");
});
el("record").addEventListener("click",async()=>{
  const test=el("record").dataset.test;
  if(!test||!last||busy)return;
  const reported={
    source_root:"same-local-operator-session",
    test,
    outcome:el("outcome").value,
    status:el("reviewed").checked?"reviewed":"reported",
  };
  if(reported.status==="reviewed")
    reported.review_receipt="self-declared-fictional-session-review-not-independent";
  // The same claimed source always replaces its earlier statement for this test.
  reports=reports.filter(r=>r.test!==test);
  reports.push(reported);
  el("reviewed").checked=false;
  await perform();
});
(async()=>{
  try {
    const r=await fetch("/api/motif/state",{cache:"no-store"});
    const s=await r.json();
    csrf=s.csrfToken;
    if(!r.ok||!s.localSourceVerified)
      throw Error("Pinned source missing or altered.");
    status("Pinned MOTIF source verified. Python 3 required to reason; no external service is contacted.");
  } catch(error) {
    csrf=null;
    status("HOLD: "+error.message,true);
    el("run").disabled=true;
  }
})();
