import test from 'node:test';
import assert from 'node:assert/strict';
import {readPublicCommons} from '../tools/read-public-commons.mjs';
const example={room:'build-together',events:[
 {id:'synthetic-001',text:'One practical code proposal',kind:'idea',
  created_at:'2026-11-04T18:00:00Z',by:{label:'Unverified test guest'}}
]};
const stub=payload=>async (url,opts)=>{
 assert.match(url,/\/agent-commons-014\/rooms\/build-together$/);
 assert.equal(opts.method,'GET');
 assert.equal(opts.cache,'no-store');
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(payload)};
};
test('public client uses only GET, returns admission-scoped claims without authority',async()=>{
 const data=await readPublicCommons({fetchImpl:stub(example)});
 assert.equal(data.events.length,1);
 assert.equal(data.events[0].declaredBy,'Unverified test guest');
 assert.equal(data.events[0].status,'ADMITTED_PUBLIC_NOT_IDENTITY_VERIFIED');
 assert.equal(data.noWriteAuthority,true);
 assert.equal(data.scope,'APPROVED_PUBLIC_ONLY');
});
test('room mismatch, malformed content and non-public errors fail closed',async()=>{
 await assert.rejects(()=>readPublicCommons({fetchImpl:stub({...example,room:'different'})}),/HELD_UNEXPECTED_PUBLIC_ROOM/);
 await assert.rejects(()=>readPublicCommons({fetchImpl:async()=>({ok:true,headers:{get:()=>null},text:async()=>'{broken'})}),/HELD_INVALID_PUBLIC_ROOM/);
 await assert.rejects(()=>readPublicCommons({fetchImpl:async()=>({ok:false})}),/HELD_PUBLIC_ROOM_UNAVAILABLE/);
});
test('oversize or invalid event fails closed, no fake guest created',async()=>{
 await assert.rejects(()=>readPublicCommons({fetchImpl:async()=>({ok:true,headers:{get:()=>99000}})}),/HELD_PUBLIC_ROOM_OVERSIZED/);
 await assert.rejects(()=>readPublicCommons({fetchImpl:stub({room:'build-together',events:[{id:'x',text:123}]})}),/HELD_INVALID_EVENT/);
});
