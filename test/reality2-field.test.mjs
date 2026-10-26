import test from "node:test";import assert from "node:assert/strict";
import {acceptReviewedPacket,proposeNextUsefulThing,readReviewedField,FIELD_ENDPOINT} from "../src/reality2-field.mjs";
const candidate={id:"e31c9d80-b0ec-44ad-a222-8795c9130191",title:"The print button does nothing on older phones",kind:"feedback",lane:"site",progress:"BLOCKED",nextStep:"Ask someone to test print and report browser details without private data.",verification:"PUBLICATION_REVIEW_ONLY"};
const packet={schema:"reality2/jarvis-opportunities-v1",reviewedOnly:true,source:"reality2-waseca-001",observedAt:"2026-10-26T17:00:00Z",entries:[candidate]};
test("rejects unreviewed and source-mismatched feeds",()=>{
 for(const v of [{...packet,reviewedOnly:false},{...packet,source:"private-queue"},{...packet,schema:"anything"}])assert.throws(()=>acceptReviewedPacket(v),/NOT_A_REVIEWED/);
});
test("admits only reviewed proposal and never interprets it as an action",()=>{
 const p=acceptReviewedPacket({...packet,entries:[{...candidate,verification:"PRIVATE_PENDING"},candidate]});
 assert.equal(p.candidates.length,1);assert.equal(p.candidates[0].notACommand,true);
 const next=proposeNextUsefulThing(p);assert.equal(next.type,"PROPOSAL_NOT_ASSIGNMENT");
 assert.equal(next.candidateId,candidate.id);assert.ok(next.requires.includes("explicit human decision"));
});
test("no case is not a fake win",()=>{
 const p=acceptReviewedPacket({...packet,entries:[]});assert.equal(proposeNextUsefulThing(p).type,"NO_REVIEWED_CANDIDATE");
});
test("GET only from fixed source",async()=>{
 const p=await readReviewedField(async(url,opts)=>{assert.equal(url,FIELD_ENDPOINT);assert.equal(opts.method,"GET");return {ok:true,json:async()=>packet};});
 assert.equal(p.candidates.length,1);
});
