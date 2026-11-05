const $=id=>document.getElementById(id);
let token=null;
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
