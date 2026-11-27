import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {newRoom,sign,verify,hash,canon} from '../bridge/suitcase/protocol.mjs';
import {linkedDisposition,localEvidence} from '../bridge/suitcase/foundry.mjs';
const a=await newRoom('Fictional sender','PERSON'),b=await newRoom('Fictional receiver','CHURCH_CANDIDATE'),c=await newRoom('Third key','PERSON');
const o=await sign(a,'OFFER',{title:'Synthetic crossing',description:'Fictional material only.',scope:'No field act authorized.',toFingerprint:b.fingerprint,expiresAt:new Date(Date.now()+86400000).toISOString()});
async function response(room,at,onDigest=o.digest){const p=await sign(room,'DISPOSITION',{onDigest,decision:'REFUSE',note:'No permission granted.'});p.payload.at=at;p.digest=await hash(p.payload);p.signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},room.privateKey,new TextEncoder().encode(canon(p.payload)))).toString('base64url');return (await verify(p)).packet;}
test('native Foundry records only matched evidence and never field proof',async()=>{const r=await response(b,o.payload.at);assert.equal(linkedDisposition(r,[o,r]),true);const s=localEvidence(a,[o,r]),t=localEvidence(b,[o,r]);assert.equal(s.peerSignedReturn,true);assert.equal(t.localRefusal,true);for(const e of [s,t]){assert.equal(e.offlineFieldTrialVerified,false);assert.equal(e.independentStewardVerified,false);assert.equal(e.nodeAlive,false)}});
test('native Foundry refuses premature, expired, wrong-signer and unmatched evidence',async()=>{for(const p of [await response(b,new Date(Date.parse(o.payload.at)-1).toISOString()),await response(b,o.payload.body.expiresAt),await response(c,o.payload.at),await response(b,o.payload.at,'0'.repeat(64))]){assert.equal(linkedDisposition(p,[o,p]),false);assert.equal(localEvidence(a,[o,p]).peerSignedReturn,false);assert.equal(localEvidence(b,[o,p]).localRefusal,false)}});
