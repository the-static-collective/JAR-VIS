const $=id=>document.getElementById(id);
let token=null,current=null;
function note(message){$("status").textContent=message;}
(async()=>{
  try{
    const response=await fetch("/api/reciprocal/state",{cache:"no-store"});
    const body=await response.json();
    if(!response.ok)throw Error(body.error||"Unavailable");
    token=body.csrfToken;
    $("ready").textContent="LOCAL BRIDGE READY";
  }catch(e){$("ready").textContent="HOLD";note(e.message);$("run").disabled=true;}
})();
$("example").addEventListener("click",()=>{
  $("question").value="How might music and food come together at a community table?";
});
$("ask").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!token)return;
  const text=$("question").value.trim();
  $("run").disabled=true;note("Comparing two bounded hypotheses locally...");
  try {
    const response=await fetch("/api/reciprocal/compare",{
      method:"POST",cache:"no-store",
      headers:{"content-type":"application/json","x-jarvis-csrf":token},
      body:JSON.stringify({text})
    });
    const out=await response.json();
    if(!response.ok)throw Error(out.error||"HOLD: comparison failed");
    current=out;
    $("helpful").disabled=out.reviewStatus!=="AVAILABLE_WITH_CONSENT";
    $("not-helpful").disabled=out.reviewStatus!=="AVAILABLE_WITH_CONSENT";
    $("review-status").textContent="Prior operator opinions retained: "+out.operatorFeedback.reviews+". No independent outcomes are verified.";
    const routes=x=>x.routes.join(" → ")+" ("+x.policy+")";
    $("jarvis").textContent=routes(out.jarvis.baseline)+
      (out.jarvis.uncertain?" · Topic uncertain":"");
    $("motif").textContent=routes(out.motif.affordanceFirst)+
      " · Alternative after synthetic reachability check.";
    $("motif-review").textContent="MOTIF → JAR;VIS: "+out.peerCritique.motifToJarvis;
    $("jarvis-review").textContent="JAR;VIS → MOTIF: "+out.peerCritique.jarvisToMotif;
    $("improve-jarvis").textContent="JAR;VIS: "+out.improvementCandidates[0].proposal;
    $("improve-motif").textContent="MOTIF: "+out.improvementCandidates[1].proposal;
    $("limits").textContent=out.assessment.limitation+" No independent outcomes measured. Nothing changed or executed.";
    $("results").hidden=false;$("results").focus();
    note("Local comparison finished. No question retained or action dispatched.");
  }catch(e){note(e.message);}
  finally{$("run").disabled=false;}
});

async function opinion(outcome){
  if(!current)return;
  $("helpful").disabled=true;$("not-helpful").disabled=true;
  try{
    const response=await fetch("/api/reciprocal/review",{
      method:"POST",cache:"no-store",
      headers:{"content-type":"application/json","x-jarvis-csrf":token},
      body:JSON.stringify({comparisonId:current.comparisonId,
        candidateId:current.motif.affordanceFirst.candidateId,outcome,consent:true})
    });
    const r=await response.json();
    if(!response.ok)throw Error(r.error||"HOLD: opinion was not stored");
    $("review-status").textContent="Your unverified "+outcome.replace("_"," ")+
      " report was stored locally. Opinions: "+r.summary.reviews+
      ". No source code or action permissions changed.";
  }catch(e){$("review-status").textContent=e.message;}
}
$("helpful").addEventListener("click",()=>opinion("helpful"));
$("not-helpful").addEventListener("click",()=>opinion("not_helpful"));
$("download").addEventListener("click",()=>{
  if(!current)return;
  const raw=JSON.stringify({schema:"jarvis.motif-cartridge-export/v1",
    proposals:current.cartridges},null,2)+"\n";
  const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="motif-jarvis-held-proposals.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  $("review-status").textContent="Held-for-test improvement proposals exported. Not approved or applied.";
});
