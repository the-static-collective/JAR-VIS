import test from "node:test";
import assert from "node:assert/strict";
import {projectBrief,makeReturn,editorialReview,finalContract,operate}
 from "../src/creative-studio-cycle.mjs";
test("JAR;VIS makes a bounded multi-owner film+screening production brief, without a release grant",()=>{
 const b=projectBrief();
 assert.equal(b.projectId,"GENESIS-RETURN-001");
 assert.equal(b.requestedArtifact,"LOCAL_SCREENING_PACKAGE");
 assert.equal(b.publish,false);
 assert.equal(b.rightsGranted,false);
 assert.equal(b.modelDelegatedExecution,false);
});
test("all four real production returns and original lemonPRESS final receipt are required",()=>{
 const plans=["CHECKPOINT_STILL","MOVING_EXCERPT","SCREENING_DRAFT","SCREENING_FINAL"]
 .map((route,round)=>({schema:"planz.creative-production-round/v1",
  round,route,roundSha256:(round+1).toString(16).repeat(64)}));
 const returns=plans.map(p=>makeReturn(p,(p.round+5).toString(16).repeat(64)));
 const confirmations=plans.map((p,i)=>({roundSha256:p.roundSha256,
  originalEvidenceSha256:returns[i].artifactSha256}));
 const media={sourceSha256:"a".repeat(64),renderedSha256:"b".repeat(64)};
 const final={schema:"lemonpress.screening-program/v1",version:"final",
  previousDraftSha256:"c".repeat(64),originalMediaSha256:media.sourceSha256,
  transformedMediaSha256:media.renderedSha256,published:false,
  rightsGranted:false,receiptSha256:"d".repeat(64)};
 const args={plans,returns,confirmations,screeningFinal:final,media};
 const result=finalContract(args);
 assert.equal(result.actualRepos.length,6);
 assert.equal(result.actualNativeMediaRenders,2);
 assert.equal(result.originalEditorialPasses,2);
 assert.equal(result.state,"LOCAL_ARTIFACT_COMPLETE_REVIEW_HELD");
 assert.equal(result.publicPublishingApproved,false);
 assert.throws(()=>finalContract({...args,plans:plans.slice(1)}),/FOUR_REAL_ROUNDS/);
 assert.throws(()=>finalContract({...args,
  screeningFinal:{...final,version:"draft"}}),/FINAL_ORIGINAL_HOUSE/);
});
test("an editorial revision requires real PlayDeck and Toaster bytes and an ORIGINAL lemonPRESS draft receipt",()=>{
 const source=Buffer.from("genuine source footage"),rendered=Buffer.from("genuine rendered footage");
 const {createHash}=requireCrypto();
 const sha=x=>createHash("sha256").update(x).digest("hex");
 const input={schema:"jarvis.screening-source/v1",
  media:{originalScene:{sha256:sha(source)},finishedScene:{sha256:sha(rendered)}}};
 const draft={schema:"lemonpress.screening-program/v1",version:"draft",
  sourceSha256:sha(JSON.stringify(input,null,2)+"\n"),
  originalMediaSha256:sha(source),transformedMediaSha256:sha(rendered),
  receiptSha256:"c".repeat(64),published:false,rightsGranted:false};
 const review=editorialReview(input,draft,source,rendered);
 assert.equal(review.decision,"REVISE_WITH_VERIFIED_ORIGIN_AND_OUTPUT");
 assert.equal(review.publishingAllowed,false);
 assert.throws(()=>editorialReview(input,draft,source,Buffer.from("FORGED"))),
  /HOLD/);
});
function requireCrypto(){return {createHash:(...a)=>nodeHash(...a)}}
import {createHash as nodeHash} from "node:crypto";
test("no real media is dispatched by inspection and no build without explicit authorization",async()=>{
 const desc=await operate(["inspect"]);
 assert.equal(desc.automaticallyExecuted,false);
 assert.equal(desc.plannedRounds,4);
 await assert.rejects(operate(["inspect","--authorize","SYNTHETIC_TEST_ONLY"]),/INSPECT_READ_ONLY/);
 await assert.rejects(operate(["build","--out","/tmp/anything"]),/ARGUMENTS_OR_AUTHORIZATION/);
});
