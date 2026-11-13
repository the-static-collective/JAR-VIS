import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectMotifCouncil,runMotifCouncil,COUNCIL_SOURCE_COMMIT} from "../src/motif-source-council.mjs";
import {startWorkbenchServer} from "../src/server.mjs";
import {Workbench} from "../src/workbench.mjs";

test("original source council byte-identical files are pinned and do not read network during verification",async()=>{
  const source=await inspectMotifCouncil();
  assert.equal(source.sourceCommit,COUNCIL_SOURCE_COMMIT);
  assert.equal(source.originals.length,4);
  assert.ok(source.originals.every(r=>/^[0-9a-f]{40}$/.test(r.gitBlob)));
  assert.equal(source.verified,true);
  assert.equal(source.privateDataSentExternally,false);
  assert.equal(source.automaticExecution,false);
});

test("invalid question and budget fail without ever starting a Git read",async()=>{
  await assert.rejects(runMotifCouncil(""),/printable research question/);
  await assert.rejects(runMotifCouncil("foo\nbar"),/printable research question/);
  await assert.rejects(runMotifCouncil("a".repeat(181)),/printable research question/);
  await assert.rejects(runMotifCouncil("reciprocal",{budget:30}),/budget/);
  await assert.rejects(runMotifCouncil("reciprocal",{budget:0}),/budget/);
});

test("a missing local Python runtime results in HOLD, not a fictional method suggestion",async()=>{
  await assert.rejects(runMotifCouncil("reciprocal questions",{
    budget:1,python:"__no_python_runtime__",timeoutMs:1000
  }),/HOLD/);
});

test("local GET source passport and protected POST reject foreign/invalid requests without changing journal",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"jarvis-motif-council-"));
  let server;
  try {
    const journalPath=join(dir,"events.jsonl");
    const workbench=await Workbench.open({journalPath});
    server=await startWorkbenchServer({workbench,port:0});
    const url=server.url;
    const reader=await fetch(url+"/api/motif/council/state");
    assert.equal(reader.status,200);
    const state=await reader.json();
    assert.equal(state.sourceCommit,COUNCIL_SOURCE_COMMIT);
    assert.ok(state.csrfToken);
    assert.equal(state.network,"NONE_UNTIL_EXPLICIT_POST");
    const page=await fetch(url+"/motif");
    assert.match(await page.text(),/experimental forest/);
    const missing=await fetch(url+"/api/motif/council",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({question:"reciprocal",budget:1})
    });
    assert.equal(missing.status,403);
    const invalid=await fetch(url+"/api/motif/council",{
      method:"POST",headers:{"content-type":"application/json",
        "x-jarvis-csrf":state.csrfToken},
      body:JSON.stringify({question:"",budget:1})
    });
    assert.equal(invalid.status,400);
    const failure=await invalid.json();
    assert.equal(failure.disposition,"HOLD_ORIGINAL_SOURCE_RESEARCH_UNAVAILABLE");
    assert.equal(failure.externalWrites,false);
    assert.equal(failure.mergePerformed,false);
    const journal=await readFile(journalPath,"utf8").catch(()=>"");
    assert.equal(journal,"");
  } finally {
    if(server)await server.close();
    await rm(dir,{recursive:true,force:true});
  }
});
