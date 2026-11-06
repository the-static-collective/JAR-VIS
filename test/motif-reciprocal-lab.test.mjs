import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {RecursiveWorkshop} from "../src/recursive-workshop.mjs";
import {ReciprocalLab} from "../src/motif-reciprocal-lab.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

async function fixture(run){
  const dir=await mkdtemp(join(tmpdir(),"jarvis-motif-lab-"));
  try{
    const journalPath=join(dir,"history.jsonl");
    const desk=await RecursiveWorkshop.open({journalPath});
    return await run({dir,desk,journalPath});
  }finally{await rm(dir,{force:true,recursive:true});}
}
test("opinions require consent, issued comparison, once-only review; held cartridges export cleanly",()=>fixture(async({desk,journalPath})=>{
  const path=journalPath+".motif-reviews.jsonl";
  const lab=await ReciprocalLab.open({journalPath:path,recursive:desk});
  const comparison=await lab.compare("music and food");
  assert.equal(comparison.cartridges.length,2);
  assert.equal(comparison.reviewStatus,"AVAILABLE_WITH_CONSENT");
  for(const card of comparison.cartridges){
    assert.equal(card.status,"HELD_FOR_TEST");
    assert.equal(card.authority,false);
    assert.match(card.id,/^proposal:[a-f0-9]{64}$/);
  }
  const choice=comparison.motif.affordanceFirst.candidateId;
  const request={comparisonId:comparison.comparisonId,candidateId:choice,outcome:"not_helpful"};
  await assert.rejects(lab.review(request),/consent/);
  await assert.rejects(lab.review({...request,consent:true,candidateId:"route-proposal:"+"f".repeat(64)}),/unknown/);
  assert.equal(lab.summary().reviews,0);
  const reviewed=await lab.review({...request,consent:true});
  assert.equal(reviewed.operatorOpinionOnly,true);
  assert.equal(reviewed.independentOutcomeVerified,false);
  assert.equal(lab.summary().negative,1);
  await assert.rejects(lab.review({...request,consent:true}),/already reviewed|unknown/);
  const stored=await readFile(path,"utf8");
  assert.doesNotMatch(stored,/music and food/);
  const reopened=await ReciprocalLab.open({journalPath:path,recursive:desk});
  assert.equal(reopened.summary().negative,1);
  const again=await reopened.compare("music and food");
  assert.equal(again.reviewStatus,"ALREADY_REVIEWED");
  assert.equal(again.operatorFeedback.codeChanges,0);
  assert.equal(desk.summary().feedbackEvents,0);
}));
test("browser review goes through local origin/csrf and cannot accept forged review",()=>fixture(async({journalPath})=>{
  const server=await startWorkbenchServer({journalPath,port:0});
  try{
    const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
    const headers={"content-type":"application/json","x-jarvis-csrf":state.csrfToken};
    const comparison=await (await fetch(server.url+"/api/reciprocal/compare",{
      method:"POST",headers,body:JSON.stringify({text:"music and food"})
    })).json();
    const body={comparisonId:comparison.comparisonId,
      candidateId:comparison.motif.affordanceFirst.candidateId,outcome:"helpful",consent:true};
    const denied=await fetch(server.url+"/api/reciprocal/review",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    assert.equal(denied.status,403);
    const ok=await fetch(server.url+"/api/reciprocal/review",{method:"POST",headers,body:JSON.stringify(body)});
    assert.equal(ok.status,200);
    assert.equal((await ok.json()).summary.reviews,1);
    const repeated=await fetch(server.url+"/api/reciprocal/review",{method:"POST",headers,body:JSON.stringify(body)});
    assert.equal(repeated.status,409);
  }finally{await server.close();}
}));
