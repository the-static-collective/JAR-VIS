import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyInvitationCartridge,understandInvitation,proposeInvitationActions} from '../src/any-invitation.mjs';
const cartridge=JSON.parse(readFileSync(new URL('../cartridges/any-invitation-001.json',import.meta.url),'utf8'));
test('cartridge is inert, locally owned, and never permission to send',()=>{
 assert.equal(verifyInvitationCartridge(cartridge),true);
 for(const [key,val] of [
  ['remote_execution',true],['automatic_propagation',true],['automatic_notifications',true],
  ['authority','SIGNED'],['sender_reply_delivery','ACTIVE']
 ])assert.throws(()=>verifyInvitationCartridge({...cartridge,[key]:val}),/UNSAFE/);
});
test('deterministic routing always leaves the person their choice',()=>{
 const p=proposeInvitationActions('I can play guitar right now',cartridge);
 assert.equal(p.input.lane,'creative');assert.equal(p.input.when,'now');
 assert.equal(p.actions[0].id,'act');assert.equal(p.actions.length,6);
 assert.equal(p.shared,false);assert.equal(p.remoteExecution,false);
 assert.ok(p.actions.some(x=>x.id==='decline'));
});
test('NOW is preferred but never silently asserted',()=>{
 const p=proposeInvitationActions('I have extra vegetables',cartridge);
 assert.equal(p.input.when,'open');assert.equal(p.input.nowPossible,true);
 assert.equal(p.input.urgencyDeclared,false);
 const later=proposeInvitationActions('Not now, maybe tomorrow',cartridge);
 assert.equal(later.input.when,'open');
 const override=proposeInvitationActions('I have vegetables',cartridge,{when:'soon'});
 assert.equal(override.input.when,'soon');assert.equal(override.input.nowPossible,false);
});
test('all kinds are meaningful and no option is penalized',()=>{
 for(const [words,lane] of [
  ['I have spare fish','food'],['I can offer a ride','transport'],['I can repair a bike','make'],
  ['How does this work?','question'],['I have an interesting possibility','open']]){
  const p=proposeInvitationActions(words,cartridge);assert.equal(p.input.lane,lane);
  assert.equal(p.actions.length,6);assert.equal(p.actions.find(x=>x.id==='decline').possibleEffect,'NO_RECORD');
 }
});
test('unreviewed scripts and routing effects cannot enter a cartridge',()=>{
 const c=structuredClone(cartridge);
 c.possible_responses.push({id:'auto-message-everyone',label:'Broadcast',kinds:['open'],needs_permission:false,side_effect:'SERVER_SEND'});
 assert.throws(()=>verifyInvitationCartridge(c),/INVALID_RESPONSES/);
 c.possible_responses.pop();c.possible_responses[3].side_effect='SERVER_SEND';
 assert.throws(()=>verifyInvitationCartridge(c),/UNSAFE_INVITATION_ACTION/);
 c.possible_responses[3].side_effect='EXPLICIT_HUMAN_SHARE';c.laws=[];
 assert.throws(()=>verifyInvitationCartridge(c),/MISSING_INVITATION_LAW/);
});
