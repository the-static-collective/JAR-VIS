// THOUGHT-FOOD-001: curated ideas from public creative-owner PR heads.
// This is a deterministic, offline ideation instrument, not an LLM, source executor,
// copyright license, human outcome attestation, endorsement, or grant submission.
import {createHash} from 'node:crypto';
const sha = s=>'sha256:'+createHash('sha256').update(s).digest('hex');
const CATALOG = [
 {id:'six-movies',kind:'FILM',title:'Six unborn films',
  repo:'the-static-collective/the-haunted-toaster',commit:'b9cdd0533c34635a84d4a83bbcb1ae1cbf81a9fa',pr:362,
  observed:'Six original native fictional films and an offline screening room; scripted fixture keeps are not audience consent.',
  spark:'a portable mini-cinema that helps newcomers imagine what a second gathering could become',
  guard:'Do not confuse fixture KEEP, film characters, or viewing with real participants or media distribution rights.'},
 {id:'machine-book',kind:'BOOK',title:'Book of Machines folios',
  repo:'the-static-collective/lemonPRESS',commit:'aae960f13d45eb4713460ed9660b7baf5ba3c473',pr:63,
  observed:'Native held illustrated machine-manuscript compiler from approved-form review packets; not a physical book or built machine.',
  spark:'a take-home illustrated book of small, independently adaptable community practices',
  guard:'No printer, publishing, rights, practical feasibility, or machine safety approval is inherited.'},
 {id:'music-film',kind:'MOVIE_RECIPE',title:'Timeback music-film scene grammar',
  repo:'the-static-collective/webZ',commit:'3a4e9f679a92c2545c474723682e8b1311dc2e76',pr:207,
  observed:'Local scene recipe plus original FFmpeg music-film renderer, with synthetic proof and no external audio committed.',
  spark:'a consented three-scene invitation film whose reusable recipe survives its original producer',
  guard:'Do not use a participant recording, song, image, or likeness without independent rights and consent.'},
 {id:'living-record',kind:'RECORD',title:'Return Press living record',
  repo:'the-static-collective/lemonPRESS',commit:'fe1d154fa3b76d933016634683a4d743a02a0338',pr:64,
  observed:'Synthetic opt-in history and separately reviewed motifs make attributed descendant audio while preserving the original.',
  spark:'a community album that changes only when separately reviewed contributions are voluntarily accepted',
  guard:'An encounter is not permission, listening is not consent, and an audio key does not execute or authorize code.'},
 {id:'groovetown',kind:'SONIC_WORLD',title:'The town that plays itself',
  repo:'the-static-collective/CANNON',commit:'076305540707913b1e2998f62dc90b94cc031c00',pr:66,
  observed:'Synthetic NEED versus CONFIRM changes fictional tones; signed portable town can be admitted or refused by separate receivers.',
  spark:'a playful soundscape that distinguishes a promise to help from an independently confirmed useful act',
  guard:'No real work was confirmed; source-authored adapter is not native reLATTE integration.'},
 {id:'festival-fork',kind:'CULTURAL_METHOD',title:'One festival makes another',
  repo:'the-static-collective/webZ',commit:'11bebee583f01866512e050c3bf44f5ea08e9d2c',pr:200,
  observed:'Offline ten-station proposal workshop; independent successor venues remain HOLD, not booked or staffed.',
  spark:'a festival station where a new circle can rewrite the method and choose its own next gathering',
  guard:'No predecessor permit, budget, or institutional relationship carries to a successor group.'}
].map(x=>Object.freeze({...x,url:'https://github.com/'+x.repo+'/pull/'+x.pr}));
export const THOUGHT_SOURCES=Object.freeze(CATALOG);
const INDEX=new Map(THOUGHT_SOURCES.map(s=>[s.id,s]));
const PURPOSES=['SECOND_TABLE','VOQAL_APPLICANT_REVIEW','OPEN_CREATIVE_EXPERIMENT'];
const GATES=Object.freeze([
 'CREATIVE_METAPHOR_IS_NOT_EVIDENCE',
 'SOURCE_REFERENCE_IS_NOT_RIGHTS_CLEARANCE',
 'FICTIONAL_SCENE_IS_NOT_REAL_PARTICIPATION',
 'PROPOSAL_IS_NOT_PERMISSION_OR_APPLICATION_SUBMISSION',
 'NO_PRIVATE_SURVIVOR_OR_CHILD_DATA',
 'SECOND_TABLE_RETAINS_INDEPENDENT_RULES_AND_REFUSAL',
 'NO_AUTOMATED_CONTACT_DEPLOYMENT_OR_ENROLLMENT'
]);
function hold(v){throw Error('THOUGHT_FOOD_HOLD_'+v);}
function strictKeys(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||
 Object.keys(v).sort().join('|')!==[...keys].sort().join('|'))hold('FIELDS');}
function selection(ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>5||new Set(ids).size!==ids.length)hold('SELECT_TWO_TO_FIVE_DISTINCT_SOURCES');
 for(const id of ids)if(typeof id!=='string'||!INDEX.has(id))hold('UNKNOWN_SOURCE');
 return [...ids].sort();
}
export function compileThoughtFood({purpose='SECOND_TABLE',ids=['six-movies','machine-book','festival-fork']}={}){
 if(!PURPOSES.includes(purpose))hold('UNKNOWN_PURPOSE');
 const picked=selection(ids).map(id=>INDEX.get(id));
 const crossings=[];
 for(let i=0;i<picked.length;i++)for(let j=i+1;j<picked.length;j++){
  const a=picked[i],b=picked[j];
  crossings.push({
   pair:[a.id,b.id],
   question:'What if '+a.spark+' were composed with '+b.spark+'?',
   concreteNextStep:'Draft one public-safe, paper-optional prototype for an independent second table; request separate owner and participant review before any real use.',
   falsifier:'If a newcomer cannot adapt, refuse, or operate the method without the first founder, this proposal has not demonstrated independent founding.',
   state:'IDEA_ONLY_HOLD'
  });
 }
 const payload={
  schema:'jarvis.thought-food-payload/v1',purpose,
  sourceReferences:picked.map(x=>({id:x.id,kind:x.kind,title:x.title,repo:x.repo,commit:x.commit,url:x.url,observed:x.observed,rightsAndTruthBoundary:x.guard})),
  crossings,rightsToReuseMedia:false,sourceOwnersExecutedByThisCall:0,
  realPeopleRecruited:0,realSuccessVerified:false,applicationSubmitted:false,
  sourceVerification:'HARD_CODED_PUBLIC_PR_REFS_NOT_REFETCHED_AT_RUNTIME',
  operatorDisposition:'REVIEW_HOLD',rules:[...GATES]
 };
 return {schema:'jarvis.thought-food-packet/v1',payload,digest:sha(JSON.stringify(payload))};
}
// Recomputes exact local source-bound candidates; not a claim that GitHub
// revisions, media rights, real people, or third-party services were verified.
export function verifyThoughtFood(packet){
 strictKeys(packet,['schema','payload','digest']);
 if(packet.schema!=='jarvis.thought-food-packet/v1')hold('SCHEMA');
 if(JSON.stringify(packet).length>24000)hold('OVERSIZE');
 strictKeys(packet.payload,['schema','purpose','sourceReferences','crossings','rightsToReuseMedia',
  'sourceOwnersExecutedByThisCall','realPeopleRecruited','realSuccessVerified','applicationSubmitted',
  'sourceVerification','operatorDisposition','rules']);
 if(!Array.isArray(packet.payload.sourceReferences))hold('SOURCES');
 const expected=compileThoughtFood({purpose:packet.payload.purpose,ids:packet.payload.sourceReferences.map(s=>s.id)});
 if(JSON.stringify(expected)!==JSON.stringify(packet))hold('TAMPER_OR_FOREIGN_PACKET');
 return {schema:packet.schema,digest:packet.digest,verified:'LOCAL_CATALOG_RECOMPOSITION_ONLY',permissionToPublish:false,realHumanEvidence:false};
}
