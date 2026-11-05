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
    await displayEnvironment();
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
    await displayEnvironment(out.realityIron);
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

async function displayEnvironment(report){
  const holder=$("environment-witness");
  try{
    if(!report){
      const response=await fetch("/api/reciprocal/environment",{cache:"no-store"});
      report=await response.json();
      if(!response.ok)throw Error(report.error||"HOLD: no public-source receipt");
    }
    holder.replaceChildren();
    for(const entry of [
      ["WEATHER / KMKT",report.weather.matchedHours+
        " actual forecast/sensor pairs. Raw MAE "+report.weather.holdoutRawC+
        " °C; proposed bias correction "+report.weather.holdoutAdjustedC+
        " °C. "+report.weather.disposition],
      ["WATERSHED / THREE GAUGES",report.watershed.matchedHours+
        " aligned river hours. Validation preferred "+report.watershed.selectedOnValidation+
        "; test MAE "+report.watershed.holdoutCandidateCfs+
        " cfs vs persistence "+report.watershed.holdoutPersistenceCfs+
        " cfs. "+report.watershed.disposition],
      ["HISTORIC FLOOD / 017 — THE DIAGNOSTIC CAN LOSE",
        report.eventLearning.data.observedCompleteHours+" of "+
        report.eventLearning.data.calendarHours+
        " hours had complete river sensor coverage. Legacy MAE "+
        report.eventLearning.data.originalSelectedMaeCfs+" cfs; cautious fallback "+
        report.eventLearning.data.cautiousMaeCfs+" cfs; persistence "+
        report.eventLearning.data.persistenceMaeCfs+
        " cfs. Added caution cost "+
        report.eventLearning.data.cautiousExtraErrorCfs+" cfs. Nothing admitted."],
      ["QUESTION ENGINE / 019 — WHAT DOES ASKING COST?",
        "On "+report.questionAboutQuestion.downstreamCases+
        " real downstream hourly target cases, the frozen no-query method MAE was "+
        report.questionAboutQuestion.selectedModelMaeCfs+
        " cfs. The unselected historical-health approach had lower raw error ("+
        report.questionAboutQuestion.sourceHealthModelMaeCfs+
        " cfs), but lost under our arbitrary query-credit model. "+
        report.questionAboutQuestion.state]
    ]){
      const article=document.createElement("article");article.className="witness";
      const title=document.createElement("h3");title.textContent=entry[0];
      const desc=document.createElement("p");desc.textContent=entry[1];
      article.append(title,desc);holder.append(article);
    }
    const contrast=document.createElement("p");
    contrast.textContent="JAR;VIS ↔ MOTIF: "+report.reciprocalDisagreement.motifToJarvis+
      " Next discriminating test: "+report.reciprocalDisagreement.singleMostUsefulNextTest;
    holder.append(contrast);
    const question=document.createElement("p");
    question.textContent="THE META-DIAGNOSTIC QUESTIONS ITSELF: "+
      report.eventLearning.learned.diagnosticSelfChallenge+
      " Neither always choose the simpler method nor always choose the complicated one.";
    holder.append(question);
    const costQuestion=document.createElement("p");
    costQuestion.textContent="QUESTIONING THE VALUE FUNCTION: "+
      report.questionAboutQuestion.deeperQuestion+
      " The engine's source-query price is a hypothetical research assumption, not actual monetary cost.";
    holder.append(costQuestion);
    $("environment-limits").textContent=report.evidenceLimitations[0]+
      " Research receipt: "+report.upstreamCommit+". No methods admitted or actions executed.";
  }catch(error){
    holder.textContent="HOLD: reality receipt not available or source pin changed.";
    $("environment-limits").textContent="No physical-world evidence is substituted.";
  }
}
