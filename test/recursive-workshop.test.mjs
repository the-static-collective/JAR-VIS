import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {RecursiveWorkshop,callStaticOS,verifyPinnedKernel,draftCard} from "../src/recursive-workshop.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

async function sandbox(fn){
  const dir=await mkdtemp(join(tmpdir(),"jarvis-recursive-"));
  try{return await fn({dir,journalPath:join(dir,"events.jsonl")})}
  finally{await rm(dir,{recursive:true,force:true})}
}
test("source-pinned native Static OS Python is actually invoked",async()=>{
  assert.equal(await verifyPinnedKernel(),true);
  const genesis=await callStaticOS({action:"genesis"});
  const r=await callStaticOS({action:"compile",state:genesis.state,text:"music and food"});
  assert.equal(r.plan.schema,"static-os.recomposer-plan/v0");
  assert.equal(r.family.schema,"static-os.witness-candidate-family/v0");
  assert.ok(r.family.candidates.length>=2);
  assert.equal(r.plan.external_effect,false);
});
test("identical state and question builds same proposals; different question changes graph",()=>sandbox(async({journalPath})=>{
  const engine=await RecursiveWorkshop.open({journalPath});
  const a=await engine.ask("music and food");
  const b=await engine.ask("music and food");
  assert.deepEqual(a.plan,b.plan);
  assert.deepEqual(a.family,b.family);
  const c=await engine.ask("grocery");
  assert.notDeepEqual(a.plan.operators,c.plan.operators);
  assert.equal(engine.summary().feedbackEvents,0);
  assert.equal(engine.summary().artifactObservations,0);
  assert.ok(!a.plan.public_input_saved);
}));
test("without consent nothing learned; with consent memory and macro survive restart",()=>sandbox(async({journalPath})=>{
  const e=await RecursiveWorkshop.open({journalPath});
  const initial=await e.ask("music and food");
  await assert.rejects(e.feedback({plan:initial.plan,selected:"music",outcome:"helpful"}),/consent/);
  assert.equal(e.summary().feedbackEvents,0);
  const observed=await e.feedback({plan:initial.plan,selected:"music",outcome:"helpful",consent:true,promoteRecipe:true});
  assert.equal(observed.memory.feedbackEvents,1);
  assert.equal(observed.memory.recipes,1);
  const next=await e.ask("music and food");
  assert.ok(next.plan.operator_count < initial.plan.operator_count);
  assert.equal(next.plan.topics[0],"music");
  const reopened=await RecursiveWorkshop.open({journalPath});
  assert.equal(reopened.summary().feedbackEvents,1);
  assert.deepEqual((await reopened.ask("music and food")).plan,next.plan);
  await assert.rejects(e.feedback({plan:initial.plan,selected:"music",outcome:"helpful",consent:true}),/refused|HOLD/);
}));
test("generated card changes next exploration only when explicitly witnessed",()=>sandbox(async({journalPath})=>{
  const e=await RecursiveWorkshop.open({journalPath});
  const first=await e.ask("music and food");
  const originalCard=draftCard(first.plan,"food");
  assert.match(originalCard,/ONE LITTLE WORKSHOP CARD/);
  assert.doesNotMatch(originalCard,/music and food/i);
  assert.equal(e.summary().artifactObservations,0);
  await assert.rejects(e.rememberCard({plan:first.plan,topic:"food"}),/consent/);
  const remembered=await e.rememberCard({plan:first.plan,topic:"food",consent:true});
  assert.equal(remembered.memory.artifactObservations,1);
  assert.equal(remembered.receipt.status,"SELF_ATTESTED_MATERIALIZED_OUTPUT");
  const after=await e.ask("music and food");
  assert.notEqual(first.family.family_id,after.family.family_id);
  const again=await e.rememberCard({plan:first.plan,topic:"food",consent:true});
  assert.equal(again.reused,true);
  assert.equal(e.summary().artifactObservations,1);
  const reopened=await RecursiveWorkshop.open({journalPath});
  assert.equal(reopened.summary().artifactObservations,1);
  assert.notEqual((await reopened.ask("music and food")).family.family_id,first.family.family_id);
  const raw=await readFile(journalPath,"utf8");
  assert.ok(!raw.includes("music and food"));
  assert.ok(!raw.includes("Could we"));
}));
test("local UI and API require caller-local CSRF; no route dispatch",()=>sandbox(async({journalPath})=>{
  const instance=await startWorkbenchServer({journalPath,port:0});
  try{
    const home=await fetch(instance.url+"/workshop");
    assert.equal(home.status,200);
    assert.match(await home.text(),/Recursive Workshop|The machine isn't finished/);
    const status=await fetch(instance.url+"/api/recursive/state");
    assert.equal(status.status,200);
    const state=await status.json();
    assert.equal(state.feedbackEvents,0);
    assert.equal(state.storesRawQuestion,false);
    const denied=await fetch(instance.url+"/api/recursive/ask",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"food and music"})
    });
    assert.equal(denied.status,403);
    const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
    const ask=await fetch(instance.url+"/api/recursive/ask",{
      method:"POST",headers,body:JSON.stringify({text:"music and food"})
    });
    assert.equal(ask.status,200);
    const proposal=await ask.json();
    assert.equal(proposal.stored,false);
    assert.equal(proposal.dispatched,false);
    const generated=await fetch(instance.url+"/api/recursive/preview-card",{
      method:"POST",headers,body:JSON.stringify({plan:proposal.plan,topic:"food"})
    });
    assert.equal(generated.status,200);
    assert.equal((await generated.json()).stored,false);
    const consentDenied=await fetch(instance.url+"/api/recursive/feedback",{
      method:"POST",headers,body:JSON.stringify({plan:proposal.plan,selected:"food",outcome:"helpful"})
    });
    assert.equal(consentDenied.status,400);
    const feedback=await fetch(instance.url+"/api/recursive/feedback",{
      method:"POST",headers,body:JSON.stringify({plan:proposal.plan,selected:"food",outcome:"helpful",consent:true})
    });
    assert.equal(feedback.status,200);
    const updated=await fetch(instance.url+"/api/recursive/state");
    assert.equal((await updated.json()).feedbackEvents,1);
  }finally{await instance.close()}
}));
