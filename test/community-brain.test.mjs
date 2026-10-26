import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { Workbench } from "../src/workbench.mjs";
import { startWorkbenchServer } from "../src/server.mjs";
import {
 COMMUNITY_BRAIN_SCHEMA,BRAIN_FOCI,BRAIN_SEATS,BRAIN_SOURCES,
 LOOPS,communityBrain,communityBrainAnswer,routeCommunityIntent
} from "../src/community-brain.mjs";

test("actual JAR;VIS brain keeps first three human needs distinct",()=>{
 const b=communityBrain();
 assert.equal(b.schema,COMMUNITY_BRAIN_SCHEMA);
 assert.equal(b.phase,"INDEPENDENT_PROTOTYPE_UNSTAFFED");
 assert.deepEqual(b.next.map(x=>x.id),
   ["founding-companion","survivor-advocate","nonprofit-counsel"]);
 assert.equal(b.membershipConfirmed,0);
 assert.equal(b.rolesFilled,0);
 assert.equal(b.peerSupportOperating,false);
 assert.equal(b.contactsMadeByJarvis,0);
 assert.equal(b.backendWrite,false);
 assert.equal(b.automaticMatching,false);
 assert.equal(b.legalRepresentation,false);
 assert.match(b.separation,/Personal legal.*must never/i);
 assert.match(b.coreLaw,/Survivors owe no stories/i);
 assert.deepEqual(b.flow,LOOPS);
});

test("group nonprofit lawyer is not a person's family-law representation",()=>{
 const b=communityBrain({focus:"legal"});
 assert.deepEqual(b.next.map(x=>x.id),["nonprofit-counsel","personal-legal-aid"]);
 const org=b.next[0],personal=b.next[1];
 assert.match(org.prohibited,/no claim|do not claim/i);
 assert.match(personal.prohibited,/not merge personal evidence|case intake/i);
 assert.match(personal.return,/Personal next steps stay with the individual/i);
 assert.equal(personal.lane,"personal-private");
 assert.ok(b.sources.some(x=>x.id==="LEGALCORPS-ORG"));
 assert.ok(b.sources.some(x=>x.id==="SMRLS-ORG"));
 assert.ok(b.sources.every(x=>x.notEvidenceOf.includes("partner agreement")));
});

test("workboard moderation remains an unfilled gap; a click cannot grant reviewer access",()=>{
 const b=communityBrain({focus:"moderate"});
 const reviewer=b.next.find(x=>x.id==="review-steward");
 assert.ok(reviewer);
 assert.equal(reviewer.status,"KNOWN_IMPLEMENTATION_GAP_UNFILLED");
 assert.equal(reviewer.requiresHumanApproval,true);
 assert.match(reviewer.safeFirst,/fictional/i);
 assert.match(reviewer.prohibited,/database access|no live moderation/i);
 assert.match(reviewer.authority,/Only the operator/i);
 assert.ok(!("applicant" in reviewer));
});

test("all opening roles remain draft, source-bound and never operationally staffed",()=>{
 assert.equal(BRAIN_SEATS.length,8);
 assert.equal(new Set(BRAIN_SEATS.map(x=>x.id)).size,BRAIN_SEATS.length);
 for(const seat of BRAIN_SEATS){
  assert.equal(seat.requiresHumanApproval,true);
  assert.ok(seat.blocker.length>50&&seat.safeFirst.length>50);
  assert.ok(seat.prohibited.length>50&&seat.authority.length>50);
  assert.ok(seat.sourceIds.every(id=>BRAIN_SOURCES.some(s=>s.id===id)));
  assert.ok(["OPEN_INVITATION_UNFILLED","CONSULTATION_NOT_REQUESTED","PRIVATE_OPTION_NOT_ENROLLED","OPEN_DESIGN_SEAT_UNFILLED","KNOWN_IMPLEMENTATION_GAP_UNFILLED"].includes(seat.status));
 }
 assert.deepEqual(BRAIN_FOCI,["start","legal","support","safety","moderate","documents","volunteer"]);
 assert.throws(()=>communityBrain({focus:"arbitrary"}));
});

test("deterministic attendant recognizes survivor group without accepting stories into project memory",async()=>{
 const d=await mkdtemp(join(tmpdir(),"jarvis-brain006-"));
 try{
  const w=await Workbench.open({journalPath:join(d,"local.jsonl")});
  const b=w.state().communityBrain;
  assert.equal(b.schema,COMMUNITY_BRAIN_SCHEMA);
  const answer=w.attend("How do we recruit people for Still Here survivor group?");
  assert.equal(answer.schema,"jarvis.attention/v0");
  assert.equal(answer.brain.authority,"NONE");
  assert.match(answer.answer,/unstaffed/i);
  assert.match(answer.answer,/No case histories belong in this shared brain/i);
  assert.equal(w.state().events.length,0);
  const personal=w.attend("Is there free counsel for the survivor group?");
  assert.ok(personal.brain);
  assert.equal(personal.brain.focus,"start");
  const other=w.attend("How does Kinship work?");
  assert.equal(other.brain,undefined);
  assert.equal(routeCommunityIntent("What about radio?"),null);
  assert.equal(communityBrainAnswer("hello"),null);
  assert.equal(routeCommunityIntent("x".repeat(501)),null);
 }finally{await rm(d,{recursive:true,force:true});}
});

test("GET /api/brain is fixed-focus only; no narrative or private information is admitted",async()=>{
 const d=await mkdtemp(join(tmpdir(),"jarvis-brain-api-"));
 const server=await startWorkbenchServer({journalPath:join(d,"j.jsonl"),port:0});
 try{
  const {url}=server;
  const result=await fetch(url+"/api/brain?focus=start");
  assert.equal(result.status,200);
  const packet=await result.json();
  assert.equal(packet.schema,COMMUNITY_BRAIN_SCHEMA);
  assert.equal(packet.membershipConfirmed,0);
  const late=await fetch(url+"/api/brain?focus=safety");
  assert.equal(late.status,200);
  assert.equal((await late.json()).next[0].id,"privacy-steward");
  for(const invalid of ["?focus=unknown","?name=Someone","?focus=start&focus=legal","?focus=start&story=private"]){
   const response=await fetch(url+"/api/brain"+invalid);
   assert.equal(response.status,400);
  }
  const post=await fetch(url+"/api/brain",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
  assert.equal(post.status,403); // CSRF first; no public write surface
  assert.equal(server.app.state().events.length,0);
  assert.equal((await fetch(url+"/brain.js")).status,200);
 }finally{await server.close();await rm(d,{recursive:true,force:true});}
});

test("browser layer displays source limits and no private form on the community panel",()=>{
 const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../public/brain.js",import.meta.url),"utf8");
 for(const id of ["community-brain","brain-focus","brain-cards","brain-status","brain-sources"]){
  assert.ok(html.includes('id="'+id+'"'));
 }
 assert.match(html,/founding|one trusted friend/i);
 assert.match(html,/Personal custody\/legal support stays separate/i);
 assert.match(js,/fetch\("\/api\/brain\?focus=/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|sendBeacon|innerHTML|\bPOST\b/);
 assert.match(html,/privacy|Privacy/i);
});
