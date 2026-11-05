import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {composeHumanExamples} from "../src/motif-composable-goals.mjs";
import {
 verifyCapabilitySource,handoffCapability,validateHandoffInput,
 STAGES,COMPOSER_SCOPE
} from "../src/motif-capability-handoff.mjs";
import {startWorkbenchServer} from "../src/server.mjs";

const text="Can we get free coffee donated for our fellowship event?";
async function contract(original=text,choice="a"){
 const r=await composeHumanExamples({text:original,choice});
 assert.equal(r.status,"CONFIRM_REQUIRED");
 return {text:original,choice,expected_contract_id:r.contract_id};
}
function content(){return {
 recipient:"someone@example.org",
 subject:"Would you consider donating coffee?",
 message:"Hello,\n\nWould you consider helping with coffee for our next community gathering?\n\nThank you."
}}
test("MOTIF-027 source and every older physical/goal evidence link are pinned",async()=>{
 assert.equal(await verifyCapabilitySource(),true);
});
test("an already confirmed human goal can discover specific local capabilities",async()=>{
 const c=await contract();
 const x=await handoffCapability({...c,stage:STAGES.discover});
 assert.equal(x.schema,"motif.capability-handoff/v1");
 assert.equal(x.status,"LOCAL_CAPABILITIES_AVAILABLE_NOT_EXECUTED");
 assert.equal(x.goal_contract_id,c.expected_contract_id);
 assert.deepEqual(x.capabilities.map(z=>z.id),
   ["local_workkit","local_workshop","local_email_composer"]);
 assert.equal(x.capabilities[2].requires_permission,COMPOSER_SCOPE);
 assert.match(x.message_template_body,/Would you consider helping/i);
 assert.equal(x.actual_message_sent,false);
 assert.equal(x.external_delivery,false);
 assert.equal(x.transmittedByServer,false);
 assert.equal(x.public_network_gets,0);
 assert.equal(x.api_credits_spent,0);
 assert.equal(x.actual_energy_joules,null);
});
test("preview does not expose mailto; separate exact review permission enables an inert link",async()=>{
 const c=await contract();
 const draft=content();
 const p=await handoffCapability({...c,...draft,stage:STAGES.preview});
 assert.equal(p.status,"LOCAL_MAIL_COMPOSER_PREVIEW_NOT_SENT");
 assert.equal(p.mailto_uri,null);
 assert.equal(p.message,draft.message);
 assert.equal(p.recipient,draft.recipient);
 assert.match(p.preview_id,/^[a-f0-9]{64}$/);
 const x=await handoffCapability({...c,...draft,stage:STAGES.open,
   preview_id:p.preview_id,open_consent:true,open_permission:COMPOSER_SCOPE});
 assert.equal(x.status,"LOCAL_MAIL_APP_HANDOFF_READY_NOT_SENT");
 assert.equal(x.actual_message_sent,false);
 assert.equal(x.external_delivery,false);
 assert.equal(x.no_smtp_request,true);
 assert.equal(x.no_delivery_receipt,true);
 assert.equal(x.actualDeliveryVerified,false);
 const uri=new URL(x.mailto_uri);
 assert.equal(uri.protocol,"mailto:");
 assert.equal(uri.pathname,draft.recipient);
 assert.equal(uri.searchParams.get("subject"),draft.subject);
 assert.equal(uri.searchParams.get("body"),draft.message);
});
test("preview cannot be reused when person changes recipient, subject, body or goal",async()=>{
 const c=await contract(),draft=content();
 const p=await handoffCapability({...c,...draft,stage:STAGES.preview});
 for(const change of [
   {recipient:"other@example.org"},
   {subject:"Changed"},
   {message:"This is a substantially different request."},
 ]){
   await assert.rejects(handoffCapability({
     ...c,...draft,...change,stage:STAGES.open,
     open_permission:COMPOSER_SCOPE,open_consent:true,preview_id:p.preview_id
   }),/HOLD/);
 }
 const changed=await contract(text,"b");
 await assert.rejects(handoffCapability({
   ...changed,...draft,stage:STAGES.open,
   open_permission:COMPOSER_SCOPE,open_consent:true,preview_id:p.preview_id
 }),/HOLD/);
});
test("opening a mail app without distinct consent or explicit recipient is refused",async()=>{
 const c=await contract(),draft=content();
 const p=await handoffCapability({...c,...draft,stage:STAGES.preview});
 await assert.rejects(handoffCapability({...c,...draft,
   stage:STAGES.open,preview_id:p.preview_id,
   open_consent:false,open_permission:COMPOSER_SCOPE}),/HOLD/);
 await assert.rejects(handoffCapability({...c,...draft,
   stage:STAGES.open,preview_id:p.preview_id,
   open_consent:true}),/HOLD/);
 await assert.rejects(handoffCapability({...c,
   stage:STAGES.preview,subject:draft.subject,message:draft.message}),/HOLD/);
});
test("no mass email recipients, header injections, private network, or invented sends",async()=>{
 const c=await contract();
 for(const recipient of [
  "a@example.org,b@example.org",
  "person@example.org\nBcc:other@example.org",
  "user@localhost",
  "user%40other@example.org",
  "foo%0Abcc@example.org",
  "User Display Name <person@example.org>",
 ]){
  await assert.rejects(handoffCapability({...c,...content(),
    recipient,stage:STAGES.preview}),/HOLD/);
 }
 await assert.rejects(handoffCapability({...c,...content(),
   subject:"Welcome\nBcc:secret@evil.org",stage:STAGES.preview}),/HOLD/);
 for(const extra of [{send:true},{smtp:true},{provider:"gmail"},
   {oauth:"token"},{bcc:"secret@example.org"}]){
  assert.throws(()=>validateHandoffInput({...c,stage:STAGES.discover,...extra}),/HOLD/);
 }
});
test("website route offers a local workshop but never a donor email app",async()=>{
 const c=await contract("Build a working website page");
 const x=await handoffCapability({...c,stage:STAGES.discover});
 assert.equal(x.domain,"website");
 assert.ok(x.capabilities.some(t=>t.id==="local_workshop"));
 assert.equal(x.capabilities.some(t=>t.id==="local_email_composer"),false);
 assert.equal(x.mail_app_supported,false);
 await assert.rejects(handoffCapability({...c,...content(),stage:STAGES.preview}),/HOLD/);
});
test("river-source contract has no mailto or local workshop dispatch",async()=>{
 const c=await contract("Could you check the rivers?");
 const x=await handoffCapability({...c,stage:STAGES.discover});
 assert.deepEqual(x.capabilities.map(t=>t.id),["local_workkit"]);
 assert.equal(x.public_network_gets,0);
 assert.equal(x.actual_message_sent,false);
});
test("live localhost endpoint has CSRF, stage reviews and no journal mutation",async()=>{
 const directory=await mkdtemp(join(tmpdir(),"motif-027-local-handoff-"));
 try{
   const server=await startWorkbenchServer({
     journalPath:join(directory,"events.jsonl"),port:0
   });
   try{
     const page=await fetch(server.url+"/goal");
     assert.equal(page.status,200);
     const html=await page.text();
     assert.match(html,/mail-recipient/);
     assert.match(html,/authorize-mail-app/);
     assert.match(html,/open-workshop/);
     const js=await (await fetch(server.url+"/goal.js")).text();
     assert.match(js,/\/api\/reciprocal\/handoff/);
     const wk=await (await fetch(server.url+"/workshop.js")).text();
     assert.match(wk,/consumeApprovedGoalPrefill/);
     assert.match(wk,/replaceState/);
     const state=await (await fetch(server.url+"/api/reciprocal/state")).json();
     const endpoint=server.url+"/api/reciprocal/handoff";
     const c=await contract(),draft=content();
     const bad=await fetch(endpoint,{method:"POST",
       headers:{"content-type":"application/json"},
       body:JSON.stringify({...c,stage:STAGES.discover})});
     assert.equal(bad.status,403);
     const post=async obj=>{
       const r=await fetch(endpoint,{method:"POST",headers:{
         "content-type":"application/json","x-jarvis-csrf":state.csrfToken},
         body:JSON.stringify(obj)});
       return {status:r.status,value:await r.json()};
     };
     const discovery=await post({...c,stage:STAGES.discover});
     assert.equal(discovery.status,200);
     assert.equal(discovery.value.capabilities.length,3);
     const p=await post({...c,...draft,stage:STAGES.preview});
     assert.equal(p.status,200);
     assert.equal(p.value.mailto_uri,null);
     const notApproved=await post({...c,...draft,stage:STAGES.open,
       preview_id:p.value.preview_id,open_consent:false,
       open_permission:COMPOSER_SCOPE});
     assert.equal(notApproved.status,403);
     const yes=await post({...c,...draft,stage:STAGES.open,
       preview_id:p.value.preview_id,open_consent:true,
       open_permission:COMPOSER_SCOPE});
     assert.equal(yes.status,200);
     assert.equal(yes.value.status,"LOCAL_MAIL_APP_HANDOFF_READY_NOT_SENT");
     assert.ok(yes.value.mailto_uri.startsWith("mailto:"));
     const updated=(await (await fetch(server.url+"/api/reciprocal/state")).json());
     assert.equal(updated.reviews,0);
   }finally{await server.close()}
 }finally{await rm(directory,{recursive:true,force:true})}
});
