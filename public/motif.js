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


// Source Council is *only* invoked by clicking the research button.
// The original MOTIF council runs locally and sends only fixed public-ref Git
// operations to GitHub. Query text remains in this tab and the Python process.
function councilStatus(text,error=false) {
  const node=el("council-status");
  node.textContent=text;
  node.classList.toggle("error",error);
}
function drawCouncil(data) {
  const root=el("council-results");clear(root);
  const native=data.originalCouncil;
  const diag=data.diagnosis;
  put(root,"h3","Original MOTIF inspected "+
      native.candidates.length+" candidate branches");
  put(root,"p",
    (diag?.gapDetected
      ? "MOTIF's current reasoning result is "+diag.status+
        ". The branches below are potential research leads, not proven repairs."
      : "Method discovery was explicitly requested. No independently verified method gap has been established."),
    "council-caution");
  put(root,"p",
    "Visible Git heads examined for source pointers: "+native.all_remote_heads_observed+
    ". Every branch below is still unmerged and has no execution or merge authority.",
    "council-caution");
  if(!native.candidates.length) {
    put(root,"p","No branch-name matches at this bounded budget. This does not prove the capability is absent.","research-empty");
    return;
  }
  for(const card of native.candidates) {
    const item=put(root,"article","","research-card");
    put(item,"h3",card.branch);
    put(item,"p",card.phase.replaceAll("_"," "));
    const matched=card.evidence?.document_terms_matched??[];
    if(card.phase==="PENCIL_SOURCE_EVIDENCE") {
      put(item,"p","Original document terms matching the question: "+
        (matched.join(", ")||"none"));
      put(item,"p","Visible test filenames: "+
        (card.evidence.test_file_name_visible?"yes (not execution proof)":"not observed"));
      put(item,"p","Suggested next step: "+
        (card.recommendation==="READ_MORE_OR_RUN_REVIEWED_TEST"
          ?"Inspect exact source, then request an independently reviewed native test."
          :"Insufficient document evidence. Keep this candidate on HOLD."));
      const docs=card.evidence?.source_witnesses??[];
      for(const witness of docs) {
        put(item,"p",witness.path+" • SHA-256 "+
          witness.sha256.slice(0,20)+"… • not executed","mini");
      }
    } else {
      put(item,"p","Original source could not be inspected. No method was admitted.");
    }
    if(/^[0-9a-f]{40}$/.test(card.commit)) {
      const link=put(item,"a","Inspect immutable GitHub source ↗");
      link.href="https://github.com/the-static-collective/MOTIF/tree/"+card.commit;
      link.target="_blank";link.rel="noopener noreferrer";
    }
  }
  put(root,"p","A matching document is a lead, not a demonstrated method. "+
      "This desk cannot execute branches, install methods, contact people or merge code.",
      "council-caution");
}
el("council-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=el("investigate");
  if(button.disabled)return;
  button.disabled=true;
  const root=el("council-results");
  clear(root);
  try {
    const question=el("council-query").value.trim();
    const budget=Number(el("council-budget").value);
    councilStatus("Reading only the public MOTIF experimental forest on your explicit request…");
    const body={question,budget};
    // If the local reasoning run exists, diagnose its actual reported state
    // without transmitting its unverified hypotheses to GitHub.
    if(last && caseData)body.case=caseData;
    const result=await request("/api/motif/council",body);
    if(result.disposition!=="HELD_UNMERGED_SOURCE_LEADS")
      throw Error("Source Council did not return a held research packet.");
    drawCouncil(result);
    councilStatus("Original public source evidence inspected locally. "+
      "Nothing merged, executed from branches, or recorded.");
  } catch(error) {
    councilStatus("HOLD: "+error.message,true);
    put(root,"p","No candidate promoted; a missing source is not evidence that a method is absent.",
      "research-empty");
  } finally {button.disabled=false;}
});


// METHOD TOURNAMENT-003 / SOURCE-OWNED ORIGINAL EXPERIMENT, NOT A TOOL INVENTOR.
// Only fixed reviewed source may run, and only on this explicit user gesture.
// Server response data is rendered as text, never HTML or executable code.
let trialBusy=false, heldTrialReceipt=null;
function trialStatus(message,error=false){
  const node=el("trial-status");
  node.textContent=message;
  node.classList.toggle("error",error);
}
function drawTrial(response,executed){
  const parent=el("trial-results");clear(parent);
  const original=response.original_motif;
  const heading=put(parent,"div","","trial-evidence");
  put(heading,"h3",executed?"Original experimental method really executed":"Reviewed source verified; nothing executed");
  put(heading,"p","Method: "+original.profile);
  put(heading,"p","Unmerged source at commit: "+original.source.sha,"source-hold");
  const terms=original.selection?.document_terms_matched??[];
  put(heading,"p","Original source documents matched: "+
    (terms.join(", ")||"none"));
  if(!executed){
    put(parent,"p","This is only a source inspection. Click the separate trial button to run the fixed, reviewed synthetic benchmark.","source-hold");
    return;
  }
  const score=original.scorecard,totals=score.aggregate_on_proposed_only;
  const metrics=put(parent,"div","","trial-metrics");
  for(const [title,value] of [
    ["Original candidate",totals.original_branch_candidate_correct+"/"+totals.future_n],
    ["Global classical",totals.global_classical_correct+"/"+totals.future_n],
    ["Strong classical",totals.independent_strong_classical_correct+"/"+totals.future_n]
  ]){
    const cell=put(metrics,"div");
    put(cell,"strong",value);
    put(cell,"span",title);
  }
  put(parent,"p","The experimental role-conditioned method tied a strong independent classical implementation. Neither has demonstrated a novel superiority.","source-hold");
  const bad=put(parent,"div","","adverse");
  put(bad,"strong","Negative transfer was observed.");
  put(bad,"p","Candidate regressed relative to the global classical control in: "+
    totals.cases_regressing_vs_global.join(", ")+".");
  put(bad,"p","Across four cases where the original candidate made a proposal, it scored "+
    totals.original_branch_candidate_correct+" / "+totals.future_n+
    " future synthetic reports; the strong classical control scored "+
    totals.independent_strong_classical_correct+".");
  const statuses=put(parent,"div","","trial-evidence");
  put(statuses,"h3","Retained, but not admitted");
  put(statuses,"p","Original method code remains on its own unmerged branch. The receipt preserves its exact source SHA, independent scenario receipts, regressions and limitation.");
  put(statuses,"p","HOLD: strong classical outperformance and real-world transfer not established. No code installed, no source merged, no real-world action performed.");
  heldTrialReceipt=original.held_receipt;
  el("trial-export").hidden=!heldTrialReceipt;
}
async function performTrial(execute){
  if(trialBusy)return;
  trialBusy=true;heldTrialReceipt=null;
  el("trial-export").hidden=true;
  el("trial-preview").disabled=true;
  el("trial-execute").disabled=true;
  clear(el("trial-results"));
  try {
    const question=el("trial-query").value.trim();
    trialStatus(execute
      ?"Running source-owned original donor and six synthetic future stress tests. No container networking or external delivery."
      :"Inspecting exact public source of the one approved unmerged experimental method.");
    const result=await request("/api/motif/tournament",{question,execute});
    const expected=execute?"REVIEWED_METHOD_TESTED_RETAINED_HELD":"REVIEWED_METHOD_PREVIEW_ONLY";
    if(result.disposition!==expected)throw Error("The research boundary did not complete.");
    drawTrial(result,execute);
    trialStatus(execute
      ?"Original donor tests and independent classical comparisons finished. The source remains unmerged; evidence is HELD."
      :"Reviewed original source and research relevance inspected. No method executed.");
  } catch(error) {
    trialStatus("HOLD: "+error.message,true);
    put(el("trial-results"),"p","No method was installed or promoted. This local experiment requires Git, Python 3 and (for execution) an already available Docker image.","research-empty");
  } finally {
    trialBusy=false;
    el("trial-preview").disabled=false;
    el("trial-execute").disabled=false;
  }
}
el("trial-form").addEventListener("submit",event=>{
  event.preventDefault();
  performTrial(true);
});
el("trial-preview").addEventListener("click",()=>performTrial(false));
el("trial-export").addEventListener("click",()=>{
  if(!heldTrialReceipt)return;
  const blob=new Blob([JSON.stringify(heldTrialReceipt,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="motif-reviewed-method-held-receipt-003.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
});
