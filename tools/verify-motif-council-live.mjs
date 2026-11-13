// End-to-end independently verifiable smoke: real original MOTIF Reasoning Spine
// diagnoses a fictional gap; the original Source Council then finds source
// evidence in actual unmerged branches through the protected localhost route.
// Explicit operator/CI invocation only. No fake Git responses and no stored data.
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Workbench} from "../src/workbench.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const caseData={
  question:"Which fictional reciprocal question method survives the contradiction?",
  goal:"Identify a reviewed experiment instead of claiming a premature conclusion.",
  hypotheses:[{id:"single-authored-idea",predictions:{probe:"yes"}}],
  tests:[{id:"probe",cost:0,risk:0}],
  reports:[{
    source_root:"synthetic-witness",
    test:"probe",
    outcome:"no",
    status:"reviewed",
    review_receipt:"fictional-review-not-independent",
  }],
};
const dir=await mkdtemp(join(tmpdir(),"jarvis-motif-real-council-"));
const journalPath=join(dir,"journal.jsonl");
let server;
try{
  const workbench=await Workbench.open({journalPath});
  server=await startWorkbenchServer({workbench,port:0});
  const root=server.url;
  const initial=await fetch(root+"/api/motif/council/state");
  assert.equal(initial.status,200);
  const state=await initial.json();
  assert.equal(state.network,"NONE_UNTIL_EXPLICIT_POST");
  const pre=await readFile(journalPath,"utf8").catch(()=>"");
  const reply=await fetch(root+"/api/motif/council",{
    method:"POST",
    headers:{"content-type":"application/json","x-jarvis-csrf":state.csrfToken},
    body:JSON.stringify({question:"reciprocal questions",budget:2,case:caseData}),
  });
  assert.equal(reply.status,200);
  const result=await reply.json();
  assert.equal(result.schema,"jarvis.motif-source-council/v1");
  assert.equal(result.diagnosis.status,"HOLD_MODEL_FALSIFIED");
  assert.equal(result.diagnosis.gapDetected,true);
  assert.equal(result.disposition,"HELD_UNMERGED_SOURCE_LEADS");
  assert.equal(result.adoptionAllowed,false);
  assert.equal(result.mergePerformed,false);
  assert.equal(result.externalWrites,false);
  assert.equal(result.questionTransmittedToGitHub,false);
  assert.ok(result.originalCouncil.all_remote_heads_observed>2);
  assert.ok(result.originalCouncil.candidates.length>0);
  assert.ok(result.originalCouncil.candidates.some(x=>x.phase==="PENCIL_SOURCE_EVIDENCE"));
  const after=await readFile(journalPath,"utf8").catch(()=>"");
  assert.equal(pre,after,"Investigating a question must not modify the JAR journal");
  console.log(JSON.stringify({
    schema:"jarvis.motif-council-real-local-crossing-verification/v1",
    originalMOTIFDiagnosis:result.diagnosis.status,
    sourceCouncilOwner:result.owner,
    candidateCount:result.originalCouncil.candidates.length,
    candidates:result.originalCouncil.candidates.map(c=>({
      branch:c.branch,commit:c.commit,
      evidenceFiles:c.evidence?.source_witnesses?.length??0,
      disposition:c.phase,executable:c.executable,
    })),
    publicSourceHeadCount:result.originalCouncil.all_remote_heads_observed,
    originalSourceVerified:state.verified,
    rawQuestionSentToGitHub:false,
    journalChanged:false,
    codeExecutedFromUnmergedBranches:false,
    mergePerformed:false,
  },null,2));
}finally{
  if(server)await server.close();
  await rm(dir,{recursive:true,force:true});
}
