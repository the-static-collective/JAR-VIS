import {assessDisposition} from "./protocol.mjs";
// SUITCASE-002: local analysis of signed packets; not a shared directory or legal entity register.
// All inputs are assumed signature-verified first. This module NEVER confers real-world authority.
export function assessGenesis(genesis,parcels){
  if(genesis?.payload?.kind!=="GENESIS")return {status:"NOT_GENESIS",valid:false};
  const issuer=genesis.payload.issuer.fingerprint,body=genesis.payload.body;
  const siblings=parcels.filter(p=>p.payload.kind==="GENESIS"&&p.payload.issuer.fingerprint===issuer);
  if(siblings.length!==1)return {status:"CONFLICTING_FOUNDINGS_FOR_ONE_KEY",valid:false};
  if(!body.seedDigest)return {status:"INDEPENDENT_ROOT",valid:true};
  const seed=parcels.find(p=>p.digest===body.seedDigest);
  if(!seed)return {status:"ANCESTRY_SEED_NOT_ON_THIS_DEVICE",valid:false};
  if(seed.payload.kind!=="SEED"||seed.payload.issuer.fingerprint!==body.ancestorFingerprint||
     issuer===body.ancestorFingerprint||Date.parse(genesis.payload.at)>Date.parse(seed.payload.body.expiresAt)||
     Date.parse(genesis.payload.at)<Date.parse(seed.payload.at))
    return {status:"ANCESTRY_MISMATCH",valid:false};
  return {status:"SIGNED_INVITATION_VERIFIED_NOT_AUTHORITY",valid:true,ancestor:body.ancestorFingerprint};
}
export function foundingFor(fingerprint,parcels){
  const found=parcels.filter(p=>p.payload.kind==="GENESIS"&&p.payload.issuer.fingerprint===fingerprint);
  return found.length===1&&assessGenesis(found[0],parcels).valid?found[0]:null;
}
export function discover(parcels,now=Date.now()){
  return parcels.filter(p=>{
    if(p.payload.kind!=="CAPABILITY")return false;
    if(Date.parse(p.payload.body.expiresAt)<=now)return false;
    const g=foundingFor(p.payload.issuer.fingerprint,parcels);
    if(!g||g.digest!==p.payload.body.genesisDigest)return false;
    // Only the same key that issued a capability can withdraw it.
    if(parcels.some(w=>w.payload.kind==="WITHDRAW"&&w.payload.body.onDigest===p.digest&&
      w.payload.issuer.fingerprint===p.payload.issuer.fingerprint))return false;
    return true;
  }).sort((a,b)=>a.payload.body.category.localeCompare(b.payload.body.category)||a.digest.localeCompare(b.digest));
}
export function linkedDisposition(p,parcels){
  if(p?.payload?.kind!=="DISPOSITION")return false;
  return assessDisposition(p,parcels.find(x=>x.digest===p.payload.body.onDigest)).matched;
}
export function localEvidence(room,parcels){
  const own=foundingFor(room.fingerprint,parcels);
  const peer=parcels.some(p=>p.payload.kind==="DISPOSITION"&&p.payload.issuer.fingerprint!==room.fingerprint&&
    linkedDisposition(p,parcels)&&parcels.find(x=>x.digest===p.payload.body.onDigest)?.payload.issuer.fingerprint===room.fingerprint);
  const refused=parcels.some(p=>p.payload.kind==="DISPOSITION"&&p.payload.issuer.fingerprint===room.fingerprint&&
    p.payload.body.decision==="REFUSE"&&linkedDisposition(p,parcels));
  return {hasLocalKey:Boolean(room.privateKey&&!room.privateKey.extractable),selfAttestedFounding:Boolean(own),
    ancestry:own?assessGenesis(own,parcels).status:"NOT_FOUNDED",peerSignedReturn:peer,localRefusal:refused,
    offlineFieldTrialVerified:false,independentStewardVerified:false,nodeAlive:false};
}
