import {createHash} from 'node:crypto';
import {replaySlots,POLICY} from './slots.mjs';

export const OFFER_SCHEMA='jarvis.toaster-native-offer/v1';
const hash=value=>'sha256:'+createHash('sha256').update(JSON.stringify(value)).digest('hex');
const keys=(object,fields)=>{
 if(!object||typeof object!=='object'||Array.isArray(object)||
    Object.keys(object).sort().join('|')!==[...fields].sort().join('|'))
  throw Error('HOLD_NATIVE_OFFER_SHAPE');
};
function plain(value){
 if(value===null || typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(plain);
 return Object.fromEntries(Object.keys(value).sort().map(k=>[k,plain(value[k])]));
}
function same(a,b){return JSON.stringify(plain(a))===JSON.stringify(plain(b))}
export function createOffer({question,answer,intents}={}){
 const deck=replaySlots({question,answer,intents});
 if(deck.status!=='KEPT'||deck.keepers.length<1||intents.at(-1)?.kind!=='KEEP')
  throw Error('HOLD_EXACT_LOCAL_KEEP_REQUIRED');
 const kept=deck.keepers.at(-1);
 const creature=deck.family.creatures.find(c=>c.id===kept.id);
 if(!creature||creature.creatureDigest!==kept.creatureDigest)
  throw Error('HOLD_KEEP_NOT_IN_CURRENT_FAMILY');
 const payload={
  schema:OFFER_SCHEMA,
  provenance:'ORIGINAL_JARVIS_DETERMINISTIC_CREATURE',
  sourcePolicy:POLICY,
  explicitLocalCreativeKeep:true,
  question:deck.question,answer:deck.answer,
  intents:structuredClone(intents),
  familyDigest:deck.family.familyDigest,
  selectedCreature:{
   id:creature.id,creatureDigest:creature.creatureDigest,
   seed:creature.seed,role:creature.role,renderer:creature.renderer,
   topology:creature.topology,material:creature.material,
   motion:creature.motion,palette:creature.palette,
   species:creature.species
  },
  sourceMedia:{
   audioSupplied:false,videoSupplied:false,
   nativeVisualScoreSupplied:false,
   permissionForToasterKeep:false,
   sourceRightsVerified:false
  },
  dispatch:false,fieldVerified:false
 };
 return {...payload,offerDigest:hash(payload)};
}
export function verifyOffer(offer){
 keys(offer,['schema','provenance','sourcePolicy','explicitLocalCreativeKeep',
  'question','answer','intents','familyDigest','selectedCreature','sourceMedia',
  'dispatch','fieldVerified','offerDigest']);
 if(offer.schema!==OFFER_SCHEMA)throw Error('HOLD_UNSUPPORTED_NATIVE_OFFER_SCHEMA');
 if(offer.sourcePolicy!==POLICY||offer.dispatch!==false||offer.fieldVerified!==false)
  throw Error('HOLD_EXTERNAL_AUTHORITY_NOT_ADMITTED');
 const expected=createOffer({question:offer.question,answer:offer.answer,intents:offer.intents});
 if(!same(offer,expected))throw Error('HOLD_FOREIGN_OFFER_REPLAY_MISMATCH');
 return {
  schema:'jarvis.toaster-native-offer-verification/v1',
  sourceOwner:'the-static-collective/JAR-VIS',
  policy:POLICY,
  candidateId:expected.selectedCreature.id,
  creatureDigest:expected.selectedCreature.creatureDigest,
  offerDigest:expected.offerDigest,
  mediaProvided:false,nativeScoreCreated:false,
  toasterKeepAuthorized:false,
  permissionToRender:false,
  realHumanRightsVerified:false,
  provenance:'REPLAYED_ORIGINAL_JARVIS_SOFTWARE_ONLY',
  externalDispatch:false
 };
}
