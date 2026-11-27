import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {newRoom,sign,verify,hash,canon,mayAnswer,assessDisposition} from '../bridge/suitcase/protocol.mjs';
const a=await newRoom('Fictional sender','PERSON'),b=await newRoom('Fictional receiver','CHURCH_CANDIDATE'),c=await newRoom('Uninvited third key','PERSON');
const start='2026-11-26T12:00:00.000Z',end='2026-11-26T13:00:00.000Z',middle='2026-11-26T12:30:00.000Z';
// Sign historical fixture times without changing the host clock or native sign().
async function dated(room,kind,body,at){const p=await sign(room,kind,body);p.payload.at=at;p.digest=await hash(p.payload);p.signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},room.privateKey,new TextEncoder().encode(canon(p.payload)))).toString('base64url');return (await verify(p)).packet;}
// Native sign validates expiry relative to now; sign an initial valid offer then set fixture time and expiry together.
async function offer(address=b.fingerprint){const p=await sign(a,'OFFER',{title:'Fictional file crossing',description:'Review synthetic material only.',scope:'No external action authorized.',toFingerprint:address,expiresAt:new Date(Date.now()+86400000).toISOString()});p.payload.at=start;p.payload.body.expiresAt=end;p.digest=await hash(p.payload);p.signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},a.privateKey,new TextEncoder().encode(canon(p.payload)))).toString('base64url');return (await verify(p)).packet;}
const o=await offer();const reply=(room=b,at=middle,onDigest=o.digest,decision='HOLD')=>dated(room,'DISPOSITION',{onDigest,decision,note:'No activity authorized.'},at);
const expect=(p,source,status,matched=false)=>assert.deepEqual(assessDisposition(p,source),{status,matched,authority:'NONE'});
test('addressed independently signed return matches',async()=>expect(await reply(),o,'MATCHED_ADDRESSED_KEY',true));
test('open offer matches without pretending invited recipient',async()=>{const open=await offer('');expect(await reply(c,middle,open.digest),open,'MATCHED_OPEN_OFFER',true)});
test('unexpected signer can verify but relation is invalid',async()=>expect(await reply(c),o,'INVALID_RECIPIENT'));
test('same key cannot independently reply',async()=>expect(await reply(a),o,'INVALID_SAME_KEY'));
test('unknown offer retained unresolved, wrong digest refused when source supplied',async()=>{const p=await reply(b,middle,'0'.repeat(64));expect(p,null,'UNMATCHED_OFFER');expect(p,o,'INVALID_OFFER_REFERENCE')});
test('wrong source packet kind refused',async()=>{const p=await reply();expect(p,p,'INVALID_OFFER_REFERENCE')});
test('signed response before offer invalid',async()=>expect(await reply(b,'2026-11-26T11:59:59.999Z'),o,'INVALID_BEFORE_OFFER'));
test('exact issue time permitted',async()=>expect(await reply(b,start),o,'MATCHED_ADDRESSED_KEY',true));
test('expiry boundary and late response invalid',async()=>{for(const at of [end,'2026-11-26T13:00:00.001Z'])expect(await reply(b,at),o,'INVALID_EXPIRED_OFFER')});
test('historical valid refusal retained even after expiry',async()=>expect(await reply(b,middle,o.digest,'REFUSE'),o,'MATCHED_ADDRESSED_KEY',true));
test('mayAnswer uses same half-open time interval',()=>{assert.equal(mayAnswer(o,b,Date.parse(start)-1),false);assert.equal(mayAnswer(o,b,Date.parse(start)),true);assert.equal(mayAnswer(o,b,Date.parse(end)-1),true);assert.equal(mayAnswer(o,b,Date.parse(end)),false);assert.equal(mayAnswer(o,c,Date.parse(middle)),false);assert.equal(mayAnswer(o,b,NaN),false)});
test('non-string recipient address rejected at signing',async()=>{for(const toFingerprint of [null,false,0,{}])await assert.rejects(sign(a,'OFFER',{title:'Synthetic offer',description:'Fictional review only.',scope:'No action permitted.',toFingerprint,expiresAt:new Date(Date.now()+86400000).toISOString()}))});
test('tampered response fails native verification before relationship assessment',async()=>{const p=await reply();p.payload.body.decision='REVIEW';await assert.rejects(verify(p))});
test('unmatched response can be reassessed when exact offer arrives',async()=>{const p=await reply();expect(p,undefined,'UNMATCHED_OFFER');expect(p,o,'MATCHED_ADDRESSED_KEY',true)});
