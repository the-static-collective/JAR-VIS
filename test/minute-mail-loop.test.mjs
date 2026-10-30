import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {editorialReview,verifyFinal,operate} from "../src/minute-mail-loop.mjs";
const sha=x=>createHash("sha256").update(x).digest("hex");
test("new post office experiment is an original goal, not reused Genesis video or permission",async()=>{
 const i=await operate(["inspect"]);
 assert.equal(i.originalGenesisMediaUsed,false);
 assert.equal(i.stages,4);
 assert.equal(i.executed,false);
 assert.equal(i.externalActions,0);
 await assert.rejects(operate(["build","--out","/tmp/would-not-run"]),/GRANT/);
 await assert.rejects(operate(["inspect","--authorize","SYNTHETIC_TEST_ONLY"]),/INSPECT/);
});
test("JARVIS only asks original lemonPRESS for editorial revision when real independent media evidence matches",()=>{
 const p=Buffer.from("actual original native video bytes"),q=Buffer.from("different final native video bytes");
 const s={schema:"jarvis.minute-mail-kit-source/v1",media:{proof:{sha256:sha(p)},revised:{sha256:sha(q)}}};
 const draft={schema:"lemonpress.minute-mail-kit/v1",version:"draft",published:false,
  tracksPeople:false,rightsGranted:false,sourceSha256:sha(JSON.stringify(s,null,2)+"\n"),
  originalProofFilmSha256:sha(p),revisedNativeFilmSha256:sha(q),receiptSha256:"a".repeat(64)};
 const r=editorialReview(s,draft,p,q);
 assert.equal(r.status,"REVISE_CLARITY_WITH_SOURCE_EVIDENCE");
 assert.equal(r.releaseAllowed,false);
 assert.throws(()=>editorialReview(s,draft,p,Buffer.from("spoof")) ,/EDITORIAL_REVIEW_SOURCE/);
});
test("final contract requires all return steps, two distinct source-native films and real source-derived lemonPRESS final",()=>{
 const plans=["PROOF_FILM","REVISED_FILM","KIT_DRAFT","KIT_FINAL"].map((stage,i)=>({
  stage,planSha256:(i+1).toString(16).repeat(64),rightsGranted:false}));
 const returns=plans.map((p,i)=>({planSha256:p.planSha256,nativeArtifactSha256:(i+5).toString(16).repeat(64),published:false}));
 const confirmations=returns.map((r,i)=>({planSha256:plans[i].planSha256,receiptSha256:r.nativeArtifactSha256}));
 const media={proofSha256:"a".repeat(64),revisedSha256:"b".repeat(64)};
 const draft={version:"draft",receiptSha256:"c".repeat(64)};
 const final={version:"final",previousDraftSha256:draft.receiptSha256,
  originalProofFilmSha256:media.proofSha256,revisedNativeFilmSha256:media.revisedSha256,
  receiptSha256:"d".repeat(64),published:false,rightsGranted:false,tracksPeople:false};
 const intent={schema:"planz.minute-mail-creative-intent/v1"};
 const x=verifyFinal({intent,plans,returns,confirmations,media,draft,final});
 assert.equal(x.rounds,4);assert.equal(x.nativeVideoRenders,2);
 assert.equal(x.published,false);assert.equal(x.modelWasInvoked,false);
 assert.throws(()=>verifyFinal({intent,plans:plans.slice(1),returns,confirmations,media,draft,final}),/FOUR_DISTINCT_STAGES/);
 assert.throws(()=>verifyFinal({intent,plans,returns,confirmations,media:{...media,proofSha256:media.revisedSha256},draft,final}),/FULL_LOCAL_PACKAGE/);
});
