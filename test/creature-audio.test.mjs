import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffer} from '../src/cabaret/toaster-offer.mjs';
import {renderKeptAudio} from '../src/cabaret/creature-audio.mjs';
import {replaySlots} from '../src/cabaret/slots.mjs';
const answer='Local fiction only, not human verification.';
function findKind(kind){
 for(let i=0;i<50;i++){
  const question='How can ghost cowboy play a song '+i+'?';
  const x=replaySlots({question,answer});
  const candidate=x.family.creatures.find(c=>c.renderer===kind);
  if(candidate)return createOffer({question,answer,intents:[{kind:'KEEP',candidateId:candidate.id}]});
 }
 throw Error('NO_FIXTURE_'+kind);
}
test('radio and drums produce actual deterministic, parseable PCM WAV bytes and bounded source receipts',()=>{
 for(const kind of ['radio','drums']){
  const offer=findKind(kind);
  const first=renderKeptAudio(offer);
  const second=renderKeptAudio(offer);
  assert.equal(first.receipt.renderer,kind);
  assert.deepEqual(first.wav,second.wav);
  assert.equal(first.wav.toString('ascii',0,4),'RIFF');
  assert.equal(first.wav.toString('ascii',8,12),'WAVE');
  assert.equal(first.wav.readUInt32LE(24),48000);
  assert.equal(first.wav.readUInt16LE(22),1);
  assert.ok(first.wav.length>44+48000*2);
  assert.ok(first.receipt.durationSeconds<30);
  assert.equal(first.receipt.originalComposition,true);
  assert.equal(first.receipt.nativeToasterRendered,false);
  assert.equal(first.receipt.permissionToPublish,false);
 }
});
test('an unchecked media claim or altered kept identity cannot synthesize soundtrack',()=>{
 const offer=findKind('radio');
 assert.throws(()=>renderKeptAudio({...offer,offerDigest:'sha256:'+'0'.repeat(64)}),/HOLD_/);
 assert.throws(()=>renderKeptAudio({...offer,sourceMedia:{...offer.sourceMedia,permissionForToasterKeep:true}}),/HOLD_/);
 const original=offer.selectedCreature.id;
 assert.throws(()=>renderKeptAudio({...offer,selectedCreature:{...offer.selectedCreature,id:original.slice(0,-1)+'z'}}),/HOLD_/);
});
test('non-audio kept species refuses WAV impersonation',()=>{
 const question='Can a clown draw our future?';
 const initial=replaySlots({question,answer});
 const candidate=initial.family.creatures.find(c=>!['radio','drums'].includes(c.renderer));
 const offer=createOffer({question,answer,intents:[{kind:'KEEP',candidateId:candidate.id}]});
 assert.throws(()=>renderKeptAudio(offer),/HOLD_AUDIO_RENDERER_REQUIRES_RADIO_OR_DRUMS/);
});
