import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, cp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MotifThoughtDesk, cleanRequest, PIN } from "../src/motif-thought-desk.mjs";
import { startWorkbenchServer } from "../src/server.mjs";

const fixture={question:"What depends on what?",ideas:["Home","Home","Meal","Volunteers"],
  goals:["dependency"],relationships:[{from:2,to:3,predicate:"requires",status:"AUTHORED"}]};
async function sandbox(run){
  const dir=await mkdtemp(join(tmpdir(),"jarvis-thought-011-"));
  try{return await run(dir)}finally{await rm(dir,{recursive:true,force:true})}
}
test("native MOTIF snapshot bytes and local Python are available",async()=>{
  const desk=new MotifThoughtDesk(),status=await desk.status();
  assert.equal(Object.keys(PIN).length,5);
  assert.equal(status.available,true,JSON.stringify(status));
  assert.equal(status.authority,"NONE");
});
test("actual local Python returns a held pencil reply with non-fungible same-label ideas",async()=>{
  const result=await new MotifThoughtDesk().preview(fixture);
  assert.equal(result.status,"HOLD_FOR_OPERATOR_REVIEW");
  assert.equal(result.pen_status,"UNCHANGED");
  assert.equal(result.external_authority,"NONE");
  assert.equal(result.stored,false);
  assert.equal(result.sent_externally,false);
  assert.equal(result.ideas[0],result.ideas[1]);
  assert.deepEqual(result.selected_lenses,["dependency"]);
  assert.equal(result.source_only_answers.dependency.required_edges.length,1);
  assert.ok(result.views[0].placements.some(p=>p.manifestation_id==="m:00"));
  assert.ok(result.views[0].placements.some(p=>p.manifestation_id==="m:01"));
});
test("ideas alone do not invent associations",async()=>{
  const r=await new MotifThoughtDesk().preview({question:"Could these connect?",
     ideas:["Home","Belonging"],goals:["association"]});
  assert.deepEqual(r.selected_lenses,[]);
  assert.deepEqual(r.questions,[]);
  assert.deepEqual(r.source_only_answers.association,[]);
});
test("one operator cannot create independently authenticated witnesses by adding edges",async()=>{
  const r=await new MotifThoughtDesk().preview({question:"Can these relate?",
    ideas:["A","B","C","D"],goals:["association"],relationships:[
      {from:0,to:2,predicate:"associated",status:"AUTHORED"},
      {from:1,to:2,predicate:"associated",status:"AUTHORED"},
      {from:0,to:3,predicate:"associated",status:"AUTHORED"},
      {from:1,to:3,predicate:"associated",status:"AUTHORED"}]});
  assert.deepEqual(r.questions,[]);
  assert.deepEqual(r.selected_lenses,[]);
  assert.equal(new Set(r.relationships.map(x=>x.origin)).size,1);
});
test("untrusted browser cannot request export, PEN, custom Python, spoof origin or import",()=>{
 for(const fields of [{export:"FREE_GRAPH_V0"},{privacy:"PUBLIC_FIXTURE"},
  {allow_export:true},{caller:"root"},{pen_status:"PEN_SCOPED"},{mode:"snapshot"}]){
   assert.throws(()=>cleanRequest({...fixture,...fields}),/HOLD/);
 }
 for(const r of [{from:0,to:4,predicate:"associated",status:"AUTHORED"},
  {from:0,to:1,predicate:"exec",status:"AUTHORED"},
  {from:0,to:1,predicate:"associated",status:"AUTHORED",origin:"root:pretend"}]){
   assert.throws(()=>cleanRequest({...fixture,relationships:[r]}),/HOLD/);
 }
});
test("modified source fails closed",()=>sandbox(async dir=>{
  const root=new URL("../runtime/motif-thought-010/",import.meta.url);
  const dest=join(dir,"snapshot");
  await cp(root,dest,{recursive:true});
  const path=join(dest,"experiments/thought-010/door.py");
  await writeFile(path,await readFile(path,"utf8")+"\n# edited\n");
  const desk=new MotifThoughtDesk({root:dest});
  assert.equal((await desk.status()).available,false);
  await assert.rejects(desk.preview(fixture),/source pin mismatch/);
}));
test("missing Python means HOLD, not silently degrading into a fake answer",async()=>{
  const desk=new MotifThoughtDesk({python:"/missing/runtime/python"});
  assert.equal((await desk.status()).available,false);
  await assert.rejects(desk.preview(fixture),/unavailable or refused/);
});
test("no-geometry policy preserves source-only findings",async()=>{
  const desk=new MotifThoughtDesk();
  const a=await desk.preview({...fixture,show_geometry:false});
  const b=await desk.preview({...fixture,show_geometry:true});
  assert.deepEqual(a.source_only_answers,b.source_only_answers);
  assert.deepEqual(a.selected_lenses,[]);
  assert.deepEqual(b.selected_lenses,["dependency"]);
});
test("actual JAR;VIS HTTP Thought Room enforces localhost CSRF and origin",()=>sandbox(async dir=>{
 const server=await startWorkbenchServer({journalPath:join(dir,"events.jsonl"),port:0});
 try{
   const home=await fetch(server.url+"/thought");
   assert.equal(home.status,200);
   assert.match(await home.text(),/Thought Room/);
   assert.equal((await fetch(server.url+"/thought.js")).status,200);
   assert.equal((await fetch(server.url+"/thought.css")).status,200);
   const state=await(await fetch(server.url+"/api/state")).json();
   const status=await(await fetch(server.url+"/api/thought/status")).json();
   assert.equal(status.available,true);
   const denied=await fetch(server.url+"/api/thought/preview",{method:"POST",
     headers:{"content-type":"application/json"},body:JSON.stringify(fixture)});
   assert.equal(denied.status,403);
   const cross=await fetch(server.url+"/api/thought/preview",{method:"POST",
     headers:{"content-type":"application/json","x-jarvis-csrf":state.csrfToken,
       origin:"https://evil.example"},body:JSON.stringify(fixture)});
   assert.equal(cross.status,403);
   const allowed=await fetch(server.url+"/api/thought/preview",{method:"POST",
     headers:{"content-type":"application/json","x-jarvis-csrf":state.csrfToken},
     body:JSON.stringify(fixture)});
   assert.equal(allowed.status,200);
   const r=await allowed.json();
   assert.equal(r.status,"HOLD_FOR_OPERATOR_REVIEW");
   assert.equal(r.stored,false);
   assert.equal(r.views[0].lens,"dependency");
 }finally{await server.close()}
}));
