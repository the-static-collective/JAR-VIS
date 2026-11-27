// POSTMARK 001: authenticated, addressed encryption for native Suitcase parcels.
// P-256 ECDH ephemeral sender key, HKDF-SHA256, AES-256-GCM, P-256 ECDSA.
import {createHash} from 'node:crypto';
import {canon,fingerprint,verify,assessDisposition} from './bridge/suitcase/protocol.mjs';
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const need=(v,m)=>{if(!v)throw Error(m)};
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const hash=x=>createHash('sha256').update(x).digest('hex');
const canonical=x=>enc.encode(canon(x));
const domain=(d,x)=>enc.encode(d+'|'+canon(x));
const b64=b=>Buffer.from(b).toString('base64url');
function un64(s,max,exact){need(typeof s==='string'&&s.length<=Math.ceil(max*4/3)&&/^[A-Za-z0-9_-]+$/.test(s),'Invalid encoding');const b=Buffer.from(s,'base64url');need(b64(b)===s&&b.length<=max&&(exact===undefined||b.length===exact),'Invalid encoded length');return b}
function shape(x,keys){need(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===keys.split(' ').sort().join('|'),'Unexpected fields')}
function pub(j){need(j?.kty==='EC'&&j.crv==='P-256'&&!Object.hasOwn(j,'d'),'Invalid public key');un64(j.x,32,32);un64(j.y,32,32);return {kty:'EC',crv:'P-256',x:j.x,y:j.y}}
async function publicKey(j,algorithm,uses){return crypto.subtle.importKey('jwk',pub(j),{name:algorithm,namedCurve:'P-256'},false,uses)}
async function signature(key,d,x){return b64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,domain(d,x)))}
async function signed(j,sig,d,x){return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await publicKey(j,'ECDSA',['verify']),un64(sig,64,64),domain(d,x))}
export const contactPin=c=>hash(canonical(c));
export async function createContact(room,privateJwk){
 const key=privateJwk??await crypto.subtle.exportKey('jwk',(await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits'])).privateKey);
 const encryption=pub({kty:key.kty,crv:key.crv,x:key.x,y:key.y});
 need(key.d&&canon(encryption)!==canon(pub(room.publicKey)),'Separate encryption key required');
 const body={schema:'postmark.contact/v1',signing:pub(room.publicKey),fingerprint:room.fingerprint,encryption};
 const contact={body,signature:await signature(room.privateKey,'POSTMARK-CONTACT-1',body)};
 // Verify key import before persisting. No private bytes leave the encrypted vault.
 await crypto.subtle.importKey('jwk',key,{name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
 return {privateJwk:key,contact};
}
export async function checkContact(c,pin){
 shape(c,'body signature');shape(c.body,'schema signing fingerprint encryption');const b=c.body;
 shape(b.signing,'kty crv x y');shape(b.encryption,'kty crv x y');
 need(hex(pin)&&contactPin(c)===pin&&b.schema==='postmark.contact/v1'&&await fingerprint(pub(b.signing))===b.fingerprint,'Contact pin or identity mismatch');
 need(canon(pub(b.signing))!==canon(pub(b.encryption)),'Separate encryption key required');
 await publicKey(b.encryption,'ECDH',[]);need(await signed(b.signing,c.signature,'POSTMARK-CONTACT-1',b),'Invalid contact signature');return b;
}
async function derive(privateKey,remote,header){const secret=await crypto.subtle.deriveBits({name:'ECDH',public:await publicKey(remote,'ECDH',[])},privateKey,256);const base=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:un64(header.salt,32,32),info:domain('POSTMARK-KDF-1',header)},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function checkContext(p,sender,recipient,offer){need(p.payload.issuer.fingerprint===sender,'Inner signer mismatch');if(p.payload.kind==='OFFER'){need(p.payload.body.toFingerprint===recipient,'Inner recipient mismatch')}else if(p.payload.kind==='DISPOSITION'){need(offer&&offer.payload.issuer.fingerprint===recipient&&offer.payload.body.toFingerprint===sender&&assessDisposition(p,offer).matched,'Unmatched or invalid disposition')}else throw Error('Unsupported packet kind')}
export async function wrap(room,ownContact,recipientContact,recipientPin,packet,offer){
 const from=await checkContact(ownContact,contactPin(ownContact)),to=await checkContact(recipientContact,recipientPin);need(from.fingerprint===room.fingerprint&&from.fingerprint!==to.fingerprint,'Invalid endpoints');
 const p=(await verify(packet)).packet;if(offer)await verify(offer);checkContext(p,from.fingerprint,to.fingerprint,offer);
 const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);const ep=pub(await crypto.subtle.exportKey('jwk',pair.publicKey));
 const header={schema:'postmark.parcel/v1',suite:'P256-ECDH/HKDF-SHA256/AES256-GCM/ECDSA-P256',sender:from.fingerprint,recipient:to.fingerprint,senderContact:contactPin(ownContact),recipientContact:recipientPin,ephemeral:ep,salt:b64(crypto.getRandomValues(new Uint8Array(32))),iv:b64(crypto.getRandomValues(new Uint8Array(12)))};
 const raw=canonical(p);need(raw.length<=13000,'Parcel size');const ciphertext=b64(await crypto.subtle.encrypt({name:'AES-GCM',iv:un64(header.iv,12,12),additionalData:domain('POSTMARK-AAD-1',header)},await derive(pair.privateKey,to.encryption,header),raw));const body={header,ciphertext};return {...body,signature:await signature(room.privateKey,'POSTMARK-PARCEL-1',body)};
}
export async function unwrap(room,privateJwk,ownContact,senderContact,senderPin,parcel,findOffer){
 shape(parcel,'header ciphertext signature');const h=parcel.header;shape(h,'schema suite sender recipient senderContact recipientContact ephemeral salt iv');shape(h.ephemeral,'kty crv x y');
 const from=await checkContact(senderContact,senderPin),to=await checkContact(ownContact,contactPin(ownContact));
 need(h.schema==='postmark.parcel/v1'&&h.suite==='P256-ECDH/HKDF-SHA256/AES256-GCM/ECDSA-P256'&&h.sender===from.fingerprint&&h.recipient===to.fingerprint&&to.fingerprint===room.fingerprint&&h.sender!==h.recipient&&h.senderContact===senderPin&&h.recipientContact===contactPin(ownContact),'Parcel endpoint mismatch');
 const ct=un64(parcel.ciphertext,13016);need(ct.length>=16,'Invalid ciphertext');un64(h.salt,32,32);un64(h.iv,12,12);pub(h.ephemeral);
 need(await signed(from.signing,parcel.signature,'POSTMARK-PARCEL-1',{header:h,ciphertext:parcel.ciphertext}),'Parcel signature invalid');
 need(privateJwk?.x===to.encryption.x&&privateJwk?.y===to.encryption.y,'Wrong decryption key');const key=await crypto.subtle.importKey('jwk',privateJwk,{name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
 let raw;try{raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(h.iv,12,12),additionalData:domain('POSTMARK-AAD-1',h)},await derive(key,h.ephemeral,h),ct)}catch{throw Error('Parcel authentication failed')}
 const p=(await verify(dec.decode(raw))).packet;const offer=p.payload.kind==='DISPOSITION'?findOffer(p.payload.body.onDigest):undefined;if(offer)await verify(offer);checkContext(p,from.fingerprint,to.fingerprint,offer);return {packet:p,parcelPin:hash(canonical(parcel)),authority:'NONE',admission:'none'};
}
