import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectMotifTournament,runMotifTournament,MOTIF_TOURNAMENT_SOURCE_COMMIT,REVIEWED_DONOR_SHA} from "../src/motif-method-tournament.mjs";
import {startWorkbenchServer} from "../src/server.mjs";
import {Workbench} from "../src/workbench.mjs";

test("fixed original source, independent evaluator and adverse fixture are pinned byte-for-byte",async()=>{
  const observed=await inspectMotifTournament();
  assert.equal(observed.originalCodeVerified,true);
  assert.equal(observed.sourceCommit,MOTIF_TOURNAMENT_SOURCE_COMMIT);
  assert.equal(observed.reviewedDonorCommit,REVIEWED_DONOR_SHA);
  assert.equal(observed.originalFiles.length,4);
  assert.ok(observed.originalFiles.every(x=>/^[0-9a-f]{40}$/.test(x.gitBlob)));
  assert.equal(observed.automaticExecution,false);
  assert.equal(observed.methodInstalled,false);
  assert.equal(observed.automaticMerge,false);
});

test("unrelated, malformed, hostile or unrecognized methods cannot reach the runner",async()=>{
  await assert.rejects(runMotifTournament(""),/short printable/);
  await assert.rejects(runMotifTournament("a\nb"),/short printable/);
  await assert.rejects(runMotifTournament("a".repeat(200)),/short printable/);
  await assert.rejects(runMotifTournament("reciprocal",{execute:"yes"}),/Unknown trial action/);
  await assert.rejects(runMotifTournament("reciprocal",{timeoutMs:-1}),/deadline/);
});

test("no local Python interpreter refuses original-source trial rather than simulating it",async()=>{
  await assert.rejects(runMotifTournament("reciprocal role prediction",{
    execute:false,python:"__no_such_python__",timeoutMs:1000
  }),/HOLD/);
});

test("localhost source state, CSRF and fail-closed request leave journal unchanged",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"jarvis-motif-tournament-"));
  let server;
  try{
    const journalPath=join(dir,"journal.jsonl");
    const wb=await Workbench.open({journalPath});
    server=await startWorkbenchServer({workbench:wb,port:0});
    const address=server.url;
    const sourceResponse=await fetch(address+"/api/motif/tournament/state");
    assert.equal(sourceResponse.status,200);
    const state=await sourceResponse.json();
    assert.equal(state.originalCodeVerified,true);
    assert.equal(state.network,"NONE_UNTIL_EXPLICIT_POST");
    assert.ok(state.csrfToken);
    const page=await fetch(address+"/motif");
    assert.match(await page.text(),/Challenge an existing method/);
    const noCSRF=await fetch(address+"/api/motif/tournament",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({question:"reciprocal role",execute:true})
    });
    assert.equal(noCSRF.status,403);
    const invalid=await fetch(address+"/api/motif/tournament",{
      method:"POST",headers:{"content-type":"application/json","x-jarvis-csrf":state.csrfToken},
      body:JSON.stringify({question:"",execute:true})
    });
    assert.equal(invalid.status,400);
    const held=await invalid.json();
    assert.equal(held.disposition,"HOLD_REVIEWED_METHOD_TOURNAMENT_UNAVAILABLE");
    assert.equal(held.methodInstalled,false);
    assert.equal(held.mergePerformed,false);
    const journal=await readFile(journalPath,"utf8").catch(()=>"");
    assert.equal(journal,"");
  }finally{
    if(server)await server.close();
    await rm(dir,{force:true,recursive:true});
  }
});
