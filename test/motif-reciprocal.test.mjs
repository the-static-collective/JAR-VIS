import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {MOTIF_SOURCE_SHA,MOTIF_PASSPORT_URL,validateMotifPassport,inspectMotifReciprocal} from "../src/motif-reciprocal.mjs";

const body=await readFile(new URL("./fixtures/motif-reciprocal-passport.v1.json",import.meta.url),"utf8");
const fixture=JSON.parse(body);
const when=()=> "2026-11-12T20:11:00.000Z";
const fetcher=(value=body,{type="application/json",url=MOTIF_PASSPORT_URL,status=200}={})=>
 async(req,opts)=>{
   assert.equal(req,MOTIF_PASSPORT_URL);
   assert.equal(opts.method,"GET");
   assert.equal(opts.redirect,"error");
   const text=typeof value==="string"?value:JSON.stringify(value);
   return {ok:status===200,redirected:false,url,
     headers:new Headers({"content-type":type,"content-length":String(Buffer.byteLength(text))}),
     body:new Response(text).body};
 };
test("exact public donor fixture projects only known bounded read-only capabilities",()=>{
 const x=validateMotifPassport(fixture);
 assert.equal(x.capabilities.length,3);
 assert.equal(x.capabilities.every(c=>!c.callable&&!c.liveRuntimeConnected),true);
 assert.equal(x.neighbors.length,12);
 assert.ok(x.neighbors.every(x=>x.status==="PROPOSED_NOT_CONNECTED"));
 assert.equal(x.necessaryReview,"HOLD_FOR_OWNER_REVIEW");
});
test("operator-initiated native public fetch returns source SHA and explicit HOLD",async()=>{
 const x=await inspectMotifReciprocal({fetchImpl:fetcher(),now:when});
 assert.equal(x.sourceCommit,MOTIF_SOURCE_SHA);
 assert.equal(x.source,MOTIF_PASSPORT_URL);
 assert.equal(x.authority,"none");
 assert.equal(x.admission,"none");
 assert.equal(x.executionAllowed,false);
 assert.equal(x.sourceImported,false);
 assert.equal(x.externalActions,false);
 assert.equal(x.observedAt,when());
 assert.match(x.sha256,/^[a-f0-9]{64}$/);
});
test("source read fails closed on injected URL, redirect, wrong content or bad JSON",async()=>{
 await assert.rejects(inspectMotifReciprocal({fetchImpl:fetcher(body,{url:"https://evil.example/source"})}),/exact pinned URL/);
 await assert.rejects(inspectMotifReciprocal({fetchImpl:fetcher(body,{type:"text/html"})}),/content type/);
 await assert.rejects(inspectMotifReciprocal({fetchImpl:fetcher("{broken")}),/Invalid MOTIF passport JSON/);
 await assert.rejects(inspectMotifReciprocal({fetchImpl:fetcher(body,{status:503})}),/exact pinned URL/);
 await assert.rejects(inspectMotifReciprocal({fetchImpl:fetcher("x".repeat(100000))}),/too large/);
});
test("promoted gate, real participant claim, broad runtime permission or extra capability are refused",()=>{
 const changes=[
  x=>x.gate.autoApproval=true,
  x=>x.source.deployed=true,
  x=>x.source.mergedToMain=true,
  x=>x.source.realHumanData=true,
  x=>x.exchange.status="ADMIT",
  x=>x.exchange.admissible="ALL_HUMAN_DATA",
  x=>x.neighboringDoors[0].crossed=true,
  x=>x.claims.humanSkillImprovementVerified=true,
  x=>x.capabilities.push({...x.capabilities[0],id:"notifications"}),
  x=>x.source.inheritedResearchHead="0".repeat(40)
 ];
 for(const change of changes){
  const x=structuredClone(fixture);change(x);
  assert.throws(()=>validateMotifPassport(x));
 }
});
test("source-supplied code, instructions, secret-bearing fields and external URLs are not returned",()=>{
 const x=structuredClone(fixture);
 x.eval="dangerous()";
 x.passphrase="SECRET_THAT_SHOULD_NOT_RETURN";
 x.neighboringDoors[0].repository="https://evil.example";
 x.capabilities[0].permissions=["contact_all_people"];
 const result=validateMotifPassport(x);
 const safe=JSON.stringify(result);
 for(const forbidden of ["dangerous","SECRET_THAT","contact_all_people","evil.example"]){
   // The bad neighbor URL is accepted as UNTRUSTED description if not filtered.
   // Validate the receiver's defensive implementation does not reflect it.
   assert.equal(safe.includes(forbidden),false,forbidden);
 }
});
