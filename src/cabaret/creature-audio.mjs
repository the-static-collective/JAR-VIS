import {createHash} from 'node:crypto';
import {replaySlots} from './slots.mjs';
import {verifyOffer} from './toaster-offer.mjs';
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const RATE=48000;
const clamp=x=>Math.max(-1,Math.min(1,x));
function wavPCM(samples){
 const pcm=Buffer.alloc(44+samples.length*2);
 pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVE',8);
 pcm.write('fmt ',12);pcm.writeUInt32LE(16,16);
 pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);
 pcm.writeUInt32LE(RATE,24);pcm.writeUInt32LE(RATE*2,28);
 pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);
 pcm.write('data',36);pcm.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++)pcm.writeInt16LE(Math.round(clamp(samples[i])*32760),44+i*2);
 return pcm;
}
function tone(t,start,end,freq,amp=.35){
 if(t<start||t>=end)return 0;
 const age=t-start,duration=end-start;
 const envelope=Math.min(1,age/.015)*Math.min(1,(end-t)/.075);
 return Math.sin(2*Math.PI*freq*age)*envelope*amp+
  Math.sin(2*Math.PI*freq*2*age)*envelope*amp*.12;
}
function radio(creature){
 const bpm=creature.art.bpm,events=creature.art.melody;
 const seconds=Math.max(...events.map(e=>(e.beat+e.length)*60/bpm))+.20;
 const length=Math.ceil(seconds*RATE);
 if(length<=0||length>RATE*30)throw Error('HOLD_WAV_DURATION');
 const samples=new Float32Array(length);
 for(let i=0;i<length;i++){
  const t=i/RATE;
  let v=0;
  for(const e of events){
   const start=e.beat*60/bpm,end=(e.beat+e.length)*60/bpm;
   v+=tone(t,start,end,220*Math.pow(2,e.note/12));
  }
  const chordStep=Math.floor(t/(6*60/bpm));
  const bassNotes=[110,98,130.81,146.83];
  const bass=bassNotes[chordStep%bassNotes.length];
  v+=.075*Math.sin(2*Math.PI*bass*t)*Math.min(1,t/.12)*Math.min(1,(seconds-t)/.18);
  samples[i]=clamp(v*.75);
 }
 return samples;
}
function drums(creature){
 const {bpm,steps}=creature.art;
 const beat=60/bpm/4,loops=4;
 const length=Math.ceil((steps.length*loops*beat+.25)*RATE);
 if(length>RATE*30)throw Error('HOLD_WAV_DURATION');
 const samples=new Float32Array(length);
 let state=parseInt(creature.seed.slice(7,15),16)>>>0;
 const noise=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967295*2-1};
 for(let i=0;i<length;i++){
  const t=i/RATE,step=Math.min(steps.length*loops-1,Math.floor(t/beat));
  const x=steps[step%steps.length],age=t-step*beat;
  let v=0;
  if(x.kick&&age<.25)v+=Math.sin(2*Math.PI*(110-60*Math.min(1,age/.25))*age)*Math.exp(-age*17)*.75;
  if(x.snare&&age<.14)v+=noise()*Math.exp(-age*27)*.32;
  if(x.hat&&age<.06)v+=noise()*Math.exp(-age*50)*.11;
  samples[i]=clamp(v*.65);
 }
 return samples;
}
export function renderKeptAudio(offer){
 verifyOffer(offer);
 const deck=replaySlots({question:offer.question,answer:offer.answer,intents:offer.intents});
 const creature=deck.family.creatures.find(c=>c.id===offer.selectedCreature.id);
 if(!creature||creature.creatureDigest!==offer.selectedCreature.creatureDigest)
  throw Error('HOLD_EXACT_KEPT_AUDIO_CREATURE_REQUIRED');
 if(!['radio','drums'].includes(creature.renderer))
  throw Error('HOLD_AUDIO_RENDERER_REQUIRES_RADIO_OR_DRUMS');
 const samples=creature.renderer==='radio'?radio(creature):drums(creature);
 const wav=wavPCM(samples);
 return {wav,receipt:{
  schema:'jarvis.original-creature-audio/v1',
  offerDigest:offer.offerDigest,
  creatureDigest:creature.creatureDigest,
  renderer:creature.renderer,
  sampleRate:RATE,channels:1,
  sampleFormat:'PCM_S16LE',sampleCount:samples.length,
  durationSeconds:samples.length/RATE,
  audioSha256:sha(wav),
  provenance:'ORIGINAL_JARVIS_DETERMINISTIC_SYNTHESIS_ONLY',
  originalComposition:true,nativeToasterRendered:false,
  thirdPartyRightsVerified:false,permissionToPublish:false,
  externalDispatch:false
 }};
}
