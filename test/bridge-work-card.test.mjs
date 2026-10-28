import test from "node:test";import assert from "node:assert/strict";
import {parseBridgeFile,validateBridgeWork} from "../src/bridge-work-card.mjs";
import {startWorkbenchServer} from "../src/server.mjs";
const src="27c280d5297e593512d85eb3c83d74904856cfdf";
function packet(target){
 const p={schema:"abundent.bridge-work-card/v1",sourceCommit:src,
  sourceUrl:"https://github.com/the-static-collective/webZ/blob/"+src+"/bridge/network/model.mjs",
  snapshot:"BRIDGE-NETWORK-003/2026-10-28",doorId:"voqal",target,
  actionCode:"VERIFY_ELIGIBILITY",classification:"PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW",
  manualExport:true,externalContact:false,applicationSubmitted:false,receiverAdmitted:false,fieldVerified:false,authority:"NONE"};
 return {...p,candidateId:target==="JARVIS"?
  "bridge-work-v1:b901e29d73dec2879211254f1057df6c31cebd5dc37ee601bd6fc99d0ea24d3b":
  "bridge-work-v1:1fac08572d288addaf339a454864916f8ca57132ca9b143756ca5a675c5f7ef0"};
}

test("JAR;VIS independently triages exact source-pinned candidate and refuses arbitrary fields",()=>{
 const good=packet("JARVIS"),r=validateBridgeWork(good,"JARVIS");
 assert.equal(r.actionCode,"VERIFY_ELIGIBILITY");
 assert.equal(r.classification,"UNVERIFIED_OPERATOR_DRAFT");
 assert.equal(parseBridgeFile(Buffer.from(JSON.stringify(good))).target,"JARVIS");
 for(const x of [
 {...good,privateNote:"a person's story"},{...good,receiverAdmitted:true},
 {...good,sourceCommit:"0".repeat(40)},{...good,target:"PLANZ"},
 {...good,candidateId:"bridge-work-v1:"+"f".repeat(64)}
 ])assert.throws(()=>validateBridgeWork(x,"JARVIS"),/HOLD/);
 assert.throws(()=>parseBridgeFile(Buffer.alloc(3100)),/HOLD_PACKET_SIZE/);
});
test("loopback POST accepts only CSRF-protected, receiver-specific public work card",async()=>{
 const wb={state:()=>({planIndex:null})};
 const local=await startWorkbenchServer({workbench:wb,port:0});
 try{
  const state=await (await fetch(local.url+"/api/state")).json();
  assert.match(state.csrfToken,/^[a-f0-9]{48}$/);
  const good=packet("JARVIS");
  const call=(value,headers={})=>fetch(local.url+"/api/bridge/triage",{
   method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify(value)});
  assert.equal((await call(good)).status,403);
  const response=await call(good,{"x-jarvis-csrf":state.csrfToken});
  assert.equal(response.status,200);
  const triage=await response.json();
  assert.equal(triage.disposition,"HOLD_FOR_OPERATOR_REVIEW");
  assert.equal(triage.allowedEffect,"NONE");
  assert.equal(triage.sentExternally,false);
  assert.equal(triage.fieldVerified,false);
  const invalid=await call({...good,recipientAccepted:true},{"x-jarvis-csrf":state.csrfToken});
  assert.equal(invalid.status,422);
  assert.equal((await invalid.json()).error,"HOLD_INVALID_BRIDGE_PACKET");
  assert.equal((await fetch(local.url+"/bridge")).status,200);
 }finally{await local.close()}
});
