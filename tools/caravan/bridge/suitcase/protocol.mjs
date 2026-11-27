// SUITCASE-001: signed, file-carried proposals. Standalone training adapter, NOT reLATTE wire compatibility.
// ECDSA-P256 binds a statement to a locally generated KEY, not a verified person or institution.
export const SCHEMA="abundent/suitcase-signed-envelope-v1";
export const KINDS=Object.freeze(["OFFER","DISPOSITION","HOST_INTENT","SEED","GENESIS","CAPABILITY","WITHDRAW"]);
export const DECISIONS=Object.freeze(["HOLD","REFUSE","REVIEW"]);
const enc=new TextEncoder();
function fail(msg){throw Error(msg)}
function text(v,max=1200,min=0){if(typeof v!=="string"||v.length>max||v.trim().length<min||/[\u0000-\u001f\u007f]/.test(v))fail("Invalid packet text");return v.trim()}
function at(v){if(typeof v!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(v)||!Number.isFinite(Date.parse(v)))fail("Invalid packet timestamp");return v}
function fields(o,expected){if(!o||typeof o!=="object"||Array.isArray(o)||Object.keys(o).sort().join("|")!==[...expected].sort().join("|"))fail("Unexpected packet fields")}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function un64(s){if(typeof s!=="string"||! /^[A-Za-z0-9_-]{80,130}$/.test(s))fail("Invalid signature");let b;try{b=Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4)),x=>x.charCodeAt(0))}catch{fail("Invalid signature")};if(b64(b)!==s||b.length!==64)fail("Invalid ECDSA signature");return b}
export function canon(v){if(v===null||typeof v==="boolean"||typeof v==="string")return JSON.stringify(v);if(typeof v==="number"&&Number.isFinite(v))return JSON.stringify(v);if(Array.isArray(v))return "["+v.map(canon).join(",")+"]";if(v&&typeof v==="object"&&Object.getPrototypeOf(v)===Object.prototype)return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canon(v[k])).join(",")+"}";fail("Unsupported packet value")}
export async function hash(value){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(canon(value)))))}
function checkKey(jwk){if(!jwk||typeof jwk!=="object"||jwk.kty!=="EC"||jwk.crv!=="P-256"||typeof jwk.x!=="string"||typeof jwk.y!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(jwk.x)||!/^[A-Za-z0-9_-]{43}$/.test(jwk.y)||Object.hasOwn(jwk,"d"))fail("Unsupported public key");return {kty:"EC",crv:"P-256",x:jwk.x,y:jwk.y}}
export async function fingerprint(jwk){return hash(checkKey(jwk))}
export function identity(room){return {id:room.roomId,label:room.label,kind:room.kind,fingerprint:room.fingerprint,publicKey:room.publicKey}}
export async function newRoom(label,kind){text(label,70,3);if(!["PERSON","CHURCH_CANDIDATE","CAMPUS_CANDIDATE","COOP_CANDIDATE","FESTIVAL_CANDIDATE","COMMUNITY_CANDIDATE"].includes(kind))fail("Unsupported room type");const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},false,["sign","verify"]);const publicKey=await crypto.subtle.exportKey("jwk",kp.publicKey);return {roomId:crypto.randomUUID(),label:label.trim(),kind,publicKey,privateKey:kp.privateKey,fingerprint:await fingerprint(publicKey),createdAt:new Date().toISOString()}}
function issuerShape(w){fields(w,["id","label","kind","fingerprint","publicKey"]);if(typeof w.id!=="string"||! /^[0-9a-f-]{36}$/.test(w.id))fail("Invalid room ID");text(w.label,70,3);if(!["PERSON","CHURCH_CANDIDATE","CAMPUS_CANDIDATE","COOP_CANDIDATE","FESTIVAL_CANDIDATE","COMMUNITY_CANDIDATE"].includes(w.kind))fail("Invalid room type");if(! /^[a-f0-9]{64}$/.test(w.fingerprint))fail("Invalid issuer fingerprint");checkKey(w.publicKey)}
export function validatePayload(p){fields(p,["id","kind","at","issuer","body"]);if(typeof p.id!=="string"||! /^[0-9a-f-]{36}$/.test(p.id)||!KINDS.includes(p.kind))fail("Bad packet identifier or kind");at(p.at);issuerShape(p.issuer);
 if(p.kind==="OFFER"){fields(p.body,["title","description","scope","toFingerprint","expiresAt"]);text(p.body.title,100,4);text(p.body.description,1200,8);text(p.body.scope,600,8);if(typeof p.body.toFingerprint!=="string"||(p.body.toFingerprint&&! /^[a-f0-9]{64}$/.test(p.body.toFingerprint)))fail("Invalid address fingerprint");at(p.body.expiresAt);if(Date.parse(p.body.expiresAt)<=Date.parse(p.at)||Date.parse(p.body.expiresAt)-Date.parse(p.at)>90*86400000)fail("Invalid offer expiry")}
 if(p.kind==="DISPOSITION"){fields(p.body,["onDigest","decision","note"]);if(!/^[a-f0-9]{64}$/.test(p.body.onDigest)||!DECISIONS.includes(p.body.decision))fail("Invalid response");text(p.body.note,500,8)}
 if(p.kind==="HOST_INTENT"){fields(p.body,["hostType","nodeName","allowedWork","notAllowed","powerPolicy","authority","status"]);text(p.body.hostType,64,3);text(p.body.nodeName,100,3);text(p.body.allowedWork,500,8);text(p.body.notAllowed,500,8);text(p.body.powerPolicy,500,8);text(p.body.authority,500,8);if(p.body.status!=="UNVERIFIED_HOST_PROPOSAL")fail("Host proposal is not permission")}
 if(p.kind==="SEED"){fields(p.body,["purpose","message","expiresAt","authority"]);text(p.body.purpose,100,4);text(p.body.message,450,12);at(p.body.expiresAt);if(p.body.authority!=="INVITATION_NOT_CONTROL"||Date.parse(p.body.expiresAt)<=Date.parse(p.at)||Date.parse(p.body.expiresAt)-Date.parse(p.at)>90*86400000)fail("Invalid seed invitation")}
 if(p.kind==="GENESIS"){fields(p.body,["name","purpose","operatingRules","seedDigest","ancestorFingerprint","status"]);text(p.body.name,90,3);text(p.body.purpose,400,12);text(p.body.operatingRules,800,20);if(p.body.status!=="SELF_ATTESTED_NOT_LEGAL_ENTITY")fail("Genesis cannot establish legal status");if(typeof p.body.seedDigest!=="string"||typeof p.body.ancestorFingerprint!=="string"||Boolean(p.body.seedDigest)!==Boolean(p.body.ancestorFingerprint))fail("Incomplete optional ancestry");if(p.body.seedDigest&&(!/^[a-f0-9]{64}$/.test(p.body.seedDigest)||!/^[a-f0-9]{64}$/.test(p.body.ancestorFingerprint)||p.body.ancestorFingerprint===p.issuer.fingerprint))fail("Invalid ancestry")}
 if(p.kind==="CAPABILITY"){fields(p.body,["genesisDigest","category","title","scope","expiresAt","visibility"]);if(!/^[a-f0-9]{64}$/.test(p.body.genesisDigest)||!["FOOD","TRANSPORT","SPACE","SKILL","OTHER"].includes(p.body.category))fail("Invalid capability reference");text(p.body.title,100,4);text(p.body.scope,450,12);at(p.body.expiresAt);if(p.body.visibility!=="PUBLIC_OPT_IN"||Date.parse(p.body.expiresAt)<=Date.parse(p.at)||Date.parse(p.body.expiresAt)-Date.parse(p.at)>30*86400000)fail("Invalid capability publication")}
 if(p.kind==="WITHDRAW"){fields(p.body,["onDigest","reason"]);if(!/^[a-f0-9]{64}$/.test(p.body.onDigest))fail("Invalid withdrawal reference");text(p.body.reason,240,8)}
 if(enc.encode(canon(p)).length>6000)fail("Packet exceeds maximum size");
 return p}
export async function sign(room,kind,body){if(!room?.privateKey||room.privateKey.extractable)fail("No nonexportable room key");if(!KINDS.includes(kind))fail("Unknown packet type");const payload=validatePayload({id:crypto.randomUUID(),kind,at:new Date().toISOString(),issuer:identity(room),body});const raw=enc.encode(canon(payload));const signature=new Uint8Array(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},room.privateKey,raw));return {schema:SCHEMA,payload,digest:await hash(payload),signature:b64(signature)}}
export async function verify(packet){if(typeof packet==="string"){if(packet.length>13000)fail("Packet too large");try{packet=JSON.parse(packet)}catch{fail("Not JSON")}}if(JSON.stringify(packet).length>13000)fail("Packet too large");fields(packet,["schema","payload","digest","signature"]);if(packet.schema!==SCHEMA)fail("Unknown transport schema");validatePayload(packet.payload);if(typeof packet.digest!=="string"||! /^[a-f0-9]{64}$/.test(packet.digest)||packet.digest!==await hash(packet.payload))fail("Digest mismatch");const actual=await fingerprint(packet.payload.issuer.publicKey);if(packet.payload.issuer.fingerprint!==actual)fail("Issuer fingerprint mismatch");const key=await crypto.subtle.importKey("jwk",packet.payload.issuer.publicKey,{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);if(!await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,un64(packet.signature),enc.encode(canon(packet.payload))))fail("Invalid signature");return {packet,digest:packet.digest,kind:packet.payload.kind,fingerprint:actual,cryptographicProof:"SIGNED_BY_THIS_PUBLIC_KEY_NOT_IDENTITY_VERIFIED"}}
export function addressedTo(packet,room){return packet.payload.kind==="OFFER"&&(!packet.payload.body.toFingerprint||packet.payload.body.toFingerprint===room.fingerprint)}
export function mayAnswer(packet,room,now=Date.now()){return packet.payload.kind==="OFFER"&&packet.payload.issuer.fingerprint!==room.fingerprint&&addressedTo(packet,room)&&Number.isFinite(now)&&Date.parse(packet.payload.at)<=now&&Date.parse(packet.payload.body.expiresAt)>now}
export function manifestFromIntent(room,fields){return {hostType:fields.hostType,nodeName:fields.nodeName,allowedWork:fields.allowedWork,notAllowed:fields.notAllowed,powerPolicy:fields.powerPolicy,authority:fields.authority,status:"UNVERIFIED_HOST_PROPOSAL"}}

// Relation assessment is separate from signature verification. Inputs must have
// passed verify() before custody; local storage is assumed intact. Signed times
// are issuer claims, not a trusted clock. A matched relation never grants authority.
export function assessDisposition(response,offer){
 const result=(status,matched=false)=>({status,matched,authority:"NONE"});
 if(response?.payload?.kind!=="DISPOSITION")return result("INVALID_RESPONSE_KIND");
 if(!offer)return result("UNMATCHED_OFFER");
 if(offer.payload?.kind!=="OFFER"||response.payload.body.onDigest!==offer.digest)return result("INVALID_OFFER_REFERENCE");
 const issuer=offer.payload.issuer.fingerprint,receiver=response.payload.issuer.fingerprint,address=offer.payload.body.toFingerprint;
 if(issuer===receiver)return result("INVALID_SAME_KEY");
 if(typeof address!=="string"||(address&&address!==receiver))return result("INVALID_RECIPIENT");
 const start=Date.parse(offer.payload.at),end=Date.parse(offer.payload.body.expiresAt),at=Date.parse(response.payload.at);
 if(![start,end,at].every(Number.isFinite)||end<=start)return result("INVALID_TIME");
 if(at<start)return result("INVALID_BEFORE_OFFER");
 if(at>=end)return result("INVALID_EXPIRED_OFFER");
 return result(address?"MATCHED_ADDRESSED_KEY":"MATCHED_OPEN_OFFER",true);
}
