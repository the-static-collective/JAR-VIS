import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectMotifKernel,runMotifSpine,MOTIF_SPINE_SOURCE_COMMIT} from "../src/motif-spine.mjs";
import {startWorkbenchServer} from "../src/server.mjs";
import {Workbench} from "../src/workbench.mjs";

const CASE={
  question:"Which invented relation explains a discrepant drawing?",
  goal:"Choose a discriminating observation before revising the fictional diagram.",
  hypotheses:[
    {id:"camera",predictions:{angle:"yes",post:"no"}},
    {id:"post",predictions:{angle:"no",post:"yes"}},
    {id:"corner",predictions:{angle:"no",post:"no"}}
  ],
  tests:[{id:"angle",cost:.04,risk:0},{id:"post",cost:.12,risk:.1}],
  reports:[]
};
test("original MOTIF code is byte-verified at immutable source commit",async()=>{
  const verified=await inspectMotifKernel();
  assert.equal(verified.sourceCommit,MOTIF_SPINE_SOURCE_COMMIT);
  assert.equal(verified.localSourceVerified,true);
  assert.equal(verified.remoteSourceRead,false);
});
test("real Python executes three finite policies on identical input",async()=>{
  const output=await runMotifSpine(CASE);
  assert.equal(output.schema,"jarvis.motif-spine-local/v1");
  assert.equal(output.method,"ORIGINAL_MOTIF_MAIN_CODE");
  assert.equal(output.results.motif_spine.next_probe.id,"angle");
  assert.equal(output.results.strong_classical_ig.next_probe.id,"angle");
  assert.equal(output.results.motif_spine.roles.governor.policy,"spine");
  assert.match(output.results.real_pretrained_llm.status,/NOT_RUN/);
  assert.equal(output.externalEffects,false);
  assert.equal(output.stored,false);
  assert.equal(output.mergePerformed,false);
});
test("a reported single claimed source does not convert itself to truth",async()=>{
  const input={...CASE,reports:[{source_root:"local-operator",test:"angle",outcome:"yes",status:"reported"}]};
  const result=await runMotifSpine(input,{action:"analyze"});
  assert.equal(result.results.remaining_hypotheses.length,3);
  assert.deepEqual(result.results.declared_reviewed_observations_not_authenticated_truth,{});
});
test("invalid model, unknown op and oversized request all HOLD",async()=>{
  await assert.rejects(runMotifSpine({...CASE,hypotheses:[{id:"x",predictions:{angle:"maybe"}}]}),/HOLD/);
  await assert.rejects(runMotifSpine(CASE,{action:"merge"}),/Unsupported MOTIF/);
  await assert.rejects(runMotifSpine({...CASE,question:"x".repeat(20_000)}),/budget/);
});
test("missing Python fails closed, never falls back to a made-up answer",async()=>{
  await assert.rejects(runMotifSpine(CASE,{python:"__no_such_python_interpreter__"}),/HOLD/);
});
test("localhost endpoint serves UI, checks CSRF and executes the same original kernel",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"jarvis-motif-"));
  let server;
  try {
    const journal=join(dir,"journal.jsonl");
    const wb=await Workbench.open({journalPath:journal});
    server=await startWorkbenchServer({workbench:wb,port:0});
    const root=server.url;
    const state=await (await fetch(root+"/api/motif/state")).json();
    assert.equal(state.localSourceVerified,true);
    assert.ok(state.csrfToken);
    const page=await fetch(root+"/motif");
    assert.equal(page.status,200);
    assert.match(await page.text(),/Ask a question/);
    const noCsrf=await fetch(root+"/api/motif/compare",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({case:CASE})
    });
    assert.equal(noCsrf.status,403);
    const response=await fetch(root+"/api/motif/compare",{
      method:"POST",headers:{
        "content-type":"application/json",
        "x-jarvis-csrf":state.csrfToken
      },
      body:JSON.stringify({case:CASE})
    });
    assert.equal(response.status,200);
    const outcome=await response.json();
    assert.equal(outcome.results.motif_spine.next_probe.id,"angle");
    assert.equal(outcome.stored,false);
    assert.equal(outcome.externalEffects,false);
    const before=await readFile(journal,"utf8").catch(()=>"");
    const badInput=await fetch(root+"/api/motif/analyze",{
      method:"POST",headers:{
        "content-type":"application/json",
        "x-jarvis-csrf":state.csrfToken
      },
      body:JSON.stringify({case:{question:"invalid"}})
    });
    assert.equal(badInput.status,409);
    assert.deepEqual(await badInput.json(),{
      disposition:"HOLD",
      error:"MOTIF source unavailable or structured case invalid; no action performed"
    });
    const after=await readFile(journal,"utf8").catch(()=>"");
    assert.equal(before,after);
  } finally {
    if(server)await server.close();
    await rm(dir,{recursive:true,force:true});
  }
});
