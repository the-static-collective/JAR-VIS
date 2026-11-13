// Actual local HTTP end-to-end proof; runs the original reviewed, still unmerged
// RECIPROCAL program under the source-owned no-network Docker runner.
// CI/operators invoke explicitly. Ordinary npm test never executes this trial.
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Workbench} from "../src/workbench.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const dir=await mkdtemp(join(tmpdir(),"jarvis-real-motif-method-"));
const journalPath=join(dir,"journal.jsonl");
let server;
try{
  const wb=await Workbench.open({journalPath});
  server=await startWorkbenchServer({workbench:wb,port:0});
  const origin=server.url;
  const stateResponse=await fetch(origin+"/api/motif/tournament/state");
  assert.equal(stateResponse.status,200);
  const state=await stateResponse.json();
  assert.equal(state.originalCodeVerified,true);
  assert.equal(state.network,"NONE_UNTIL_EXPLICIT_POST");
  const before=await readFile(journalPath,"utf8").catch(()=>"");
  const run=async execute=>{
    const response=await fetch(origin+"/api/motif/tournament",{
      method:"POST",
      headers:{"content-type":"application/json","x-jarvis-csrf":state.csrfToken},
      body:JSON.stringify({question:"reciprocal role conditioned prediction",execute})
    });
    const result=await response.json();
    assert.equal(response.status,200,
      "Original reviewed trial did not complete: "+result.disposition);
    return result;
  };
  const preview=await run(false);
  assert.equal(preview.disposition,"REVIEWED_METHOD_PREVIEW_ONLY");
  assert.equal(preview.original_motif.execution_requested,false);
  assert.equal(preview.original_motif.status,"PREVIEW_NO_DONOR_EXECUTION");
  assert.equal(preview.original_motif.source.sha,state.reviewedDonorCommit);

  const trial=await run(true);
  assert.equal(trial.disposition,"REVIEWED_METHOD_TESTED_RETAINED_HELD");
  const original=trial.original_motif;
  assert.equal(original.status,"ORIGINAL_DONOR_EXECUTED_AND_STRONG_CLASSICAL_TOURNAMENT_COMPLETE");
  assert.equal(original.native_runs.length,3);
  assert.ok(original.native_runs.every(x=>x.verified));
  assert.equal(original.scorecard.original_native_algorithm_executed,true);
  assert.equal(original.scorecard.automatic_merge,false);
  assert.equal(original.scorecard.reliable_improvement_over_strong_classical,false);
  assert.equal(original.scorecard.aggregate_on_proposed_only.candidate_minus_strong_correct,0);
  assert.ok(original.scorecard.aggregate_on_proposed_only.cases_regressing_vs_global.length>0);
  assert.equal(original.held_receipt.content.method_installed,false);
  assert.equal(original.held_receipt.content.automatic_merge,false);
  assert.equal(trial.stored,false);
  assert.equal(trial.externalWrites,false);
  assert.equal(trial.methodInstalled,false);
  const after=await readFile(journalPath,"utf8").catch(()=>"");
  assert.equal(before,after,"method competition must not alter JAR operator's journal");
  console.log(JSON.stringify({
    schema:"jarvis.original-unmerged-method-tournament-e2e/v1",
    originalSourceCommit:original.source.sha,
    sourceOwner:original.held_receipt.content.owner,
    originalCodeReallyExecuted:true,
    originalNativeTestsPassed:original.native_runs.length===3,
    separateFutureCases:original.scorecard.cases.length,
    measured:original.scorecard.aggregate_on_proposed_only,
    retainedKind:original.held_receipt.content.retained_kind,
    sourceWasMerged:false,
    methodInstalled:false,
    journalChanged:false,
    publicDeployment:false,
    sideEffect:"NONE",
  },null,2));
}finally{
  if(server)await server.close();
  await rm(dir,{recursive:true,force:true});
}
