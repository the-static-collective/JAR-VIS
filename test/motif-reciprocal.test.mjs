import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {verifyMotifSource,callMotif,compareReciprocally,SOURCE_BLOB} from "../src/motif-reciprocal.mjs";
import {RecursiveWorkshop} from "../src/recursive-workshop.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const id=c=>"route-proposal:"+c.repeat(64);
const fixture={
 schema:"jarvis.motif-reciprocal-request/v1",
 routes:[
  {id:id("a"),policy:"baseline",steps:["music"]},
  {id:id("b"),policy:"counterpoint",steps:["food","music"]}
 ],
 scores:{music:10,food:2},uncertain:false
};
test("real native MOTIF-003 source is byte pinned; hypothetical frontier differs from immediate",async()=>{
  assert.match(SOURCE_BLOB,/^[a-f0-9]{40}$/);
  assert.equal(await verifyMotifSource(),true);
  const x=await callMotif(fixture);
  assert.equal(x.native_kernel,"MOTIF-003");
  assert.equal(x.field,"SYNTHETIC_ROUTE_SEQUENCES_ONLY");
  assert.equal(x.immediate_id,id("a"));
  assert.equal(x.new_choices_id,id("b"));
  assert.equal(x.disagreement,true);
  assert.equal(x.external_effect,false);
  assert.equal(x.observed_external_outcomes,0);
  assert.equal(x.first_moves.find(r=>r.candidate_id===id("b")).new_continuations,1);
});
test("malformed and forged proposed routes HOLD, never run or mutate",async()=>{
  for(const changes of [
    {routes:[{id:id("a"),policy:"baseline",steps:["unknown"]}]},
    {routes:[{id:id("a"),policy:"baseline",steps:["music","music"]}]},
    {routes:[{id:id("a"),policy:"baseline",steps:["music"],extra:true}]},
    {scores:{music:1000000}},
    {schema:"attacker.route/9"}
  ]){
    await assert.rejects(callMotif({...fixture,...changes}),/HOLD/);
  }
});
test("JAR;VIS remains source of problem and reciprocal review is held",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"motif-jarvis-"));
  try {
    const journalPath=join(dir,"journal.jsonl");
    const desk=await RecursiveWorkshop.open({journalPath});
    const result=await compareReciprocally("music and food",desk);
    assert.equal(result.schema,"jarvis.motif-reciprocal/v1");
    assert.equal(result.assessment.independentOutcomes,0);
    assert.equal(result.assessment.automaticPromotion,false);
    assert.equal(result.assessment.externalEffect,false);
    assert.equal(result.improvementCandidates.length,2);
    assert.ok(result.improvementCandidates.every(x=>x.status==="HELD_FOR_TEST"));
    assert.ok(!result.motif.affordanceFirst.routes.includes("unknown"));
    const repeat=await compareReciprocally("music and food",desk);
    assert.deepEqual(result,repeat);
    assert.equal(desk.summary().feedbackEvents,0);
    await assert.rejects(readFile(journalPath,"utf8"),/ENOENT/);
  }finally {await rm(dir,{force:true,recursive:true});}
});
test("localhost mutual reasoning API is CSRF-bound and read-only",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"motif-http-"));
  const app=await startWorkbenchServer({journalPath:join(dir,"journal.jsonl"),port:0});
  try {
    const page=await fetch(app.url+"/reciprocal");
    assert.equal(page.status,200);
    assert.match(await page.text(),/What if we/);
    const state=await (await fetch(app.url+"/api/reciprocal/state")).json();
    const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
    const denied=await fetch(app.url+"/api/reciprocal/compare",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({text:"music and food"})});
    assert.equal(denied.status,403);
    const ok=await fetch(app.url+"/api/reciprocal/compare",{
      method:"POST",headers,body:JSON.stringify({text:"music and food"})});
    assert.equal(ok.status,200);
    assert.equal((await ok.json()).assessment.dispatch,false);
    const bad=await fetch(app.url+"/api/reciprocal/compare",{
      method:"POST",headers,body:JSON.stringify({text:"\n"})});
    assert.equal(bad.status,400);
  }finally {await app.close();await rm(dir,{recursive:true,force:true});}
});
