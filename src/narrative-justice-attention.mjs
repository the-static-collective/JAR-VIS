// JAR;VIS Narrative Justice 019 — the narrator is an attendant, not an owner.
// Only independently pinned, synthetic owner projections reach this reviewer.
import {createHash} from 'node:crypto';

export const NARRATIVE_PINS=Object.freeze({
 storyship:'dec614a4205051b4aa666f81ce423ff1ee7c26c7',
 storyDNA:'beab7fd5ab6f63de2a7a9332998c22bedf6b73ea',
 webZ:'5bd9dfc318bad7cb8800156944bb0d5a0ecad84f',
 lemonPRESS:'02feb4454240d482a5e0e03258f24f8b5cc0b9f5',
});
const HEX=/^sha256:[0-9a-f]{64}$/;
const sorted = value => {
 if(Array.isArray(value)) return value.map(sorted);
 if(value&&typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sorted(value[k])]));
 return value;
};
const canonical = value=>JSON.stringify(sorted(value));
const sha = s=>'sha256:'+createHash('sha256').update(s,'utf8').digest('hex');
const hash = value=>sha(canonical(value));
function hold(code){throw new Error('JARVIS_NARRATIVE_HOLD_'+code);}
function object(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function exact(x,keys){return object(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');}
function check(condition,code){if(!condition)hold(code);}
function hashMatches(obj,idKey){
 check(object(obj)&&HEX.test(obj[idKey]),'HASH_SHAPE');
 const copy={...obj};delete copy[idKey];check(hash(copy)===obj[idKey],'HASH_TAMPERED');
}
function noExtra(nav){
 check(exact(nav,['schema','voyage_id','event_cut','replay_id','source_event_id','source_cut_ids','reality_projection_id','narrative_projection_id','lookout','logbook','chartroom','narrative_deck','compass','horizon','helm','harbor','historical_events_added','admission','publication','operator_claim','navigation_id']),'STORYSHIP_SCHEMA');
}
export function attendNarrativeJustice({navigation,candidate,dnaNavigation,checkedSources}){
 // This check is independent of original Storyship, whose native runtime was executed by CLI.
 noExtra(navigation);hashMatches(navigation,'navigation_id');
 check(navigation.schema==='storyship/navigation-turn/v0'&&HEX.test(navigation.replay_id),'NATIVE_STORYSHIP');
 check(Number.isInteger(navigation.event_cut)&&navigation.event_cut>0,'EVENT_CUT');
 check(Array.isArray(navigation.source_cut_ids)&&navigation.source_cut_ids.length>0,'SOURCE_CUT');
 check(HEX.test(navigation.reality_projection_id)&&HEX.test(navigation.narrative_projection_id),'SOURCE_PROJECTION');
 check(exact(navigation.lookout,['observation','source_cut_ids'])&&navigation.lookout.observation==='SOURCE_OWNED_REPLAY_ONLY','LOOKOUT');
 check(exact(navigation.logbook,['event_cut','tip_event_id','historical_rewrite'])&&
   navigation.logbook.event_cut===navigation.event_cut&&navigation.logbook.tip_event_id===navigation.source_event_id&&navigation.logbook.historical_rewrite===false,'LOGBOOK');
 check(exact(navigation.chartroom,['branch_heads','dormant_branches'])&&
   Array.isArray(navigation.chartroom.branch_heads)&&Array.isArray(navigation.chartroom.dormant_branches),'CHARTROOM');
 check(Array.isArray(navigation.narrative_deck)&&navigation.narrative_deck.length>=2&&navigation.narrative_deck.length<=8,'RIVAL_READINGS');
 const used=new Set();
 for(const r of navigation.narrative_deck){
  check(exact(r,['key','text','basis_event_ids','classification'])&&r.classification==='INTERPRETATION_NOT_OBSERVATION','READING');
  check(typeof r.key==='string'&&r.key.length>0&&r.key.length<=64&&!used.has(r.key),'READING_ID');
  used.add(r.key);
  check(Array.isArray(r.basis_event_ids)&&r.basis_event_ids.length>0&&r.basis_event_ids.every(id=>HEX.test(id)),'READING_BASIS');
 }
 check(exact(navigation.compass,['question','disclosure','silence','selected_reading'])&&
   navigation.compass.selected_reading===null&&['REVIEW_ONLY','WITHHELD'].includes(navigation.compass.disclosure),'COMPASS');
 check(navigation.compass.disclosure!=='WITHHELD'||(navigation.compass.question===null&&navigation.compass.silence==='PROTECTED'),'PROTECTED_SILENCE');
 check(exact(navigation.horizon,['open_berth','protected_silence_is_open_berth'])&&
   navigation.horizon.protected_silence_is_open_berth===false&&Array.isArray(navigation.horizon.open_berth),'HORIZON');
 check(exact(navigation.helm,['choices','decision','actor_authority'])&&
   navigation.helm.decision==='NOT_RECORDED'&&navigation.helm.actor_authority==='HUMAN_ONLY'&&
   navigation.helm.choices.join('|')==='HOLD|EXPLORE_ANOTHER_READING|DECLINE|PROPOSE_FOR_HUMAN_REVIEW','HELM');
 check(exact(navigation.harbor,['crossing','arrival','destination_admission'])&&
   navigation.harbor.crossing==='NOT_ATTEMPTED'&&navigation.harbor.arrival==='NOT_OBSERVED'&&
   navigation.harbor.destination_admission==='NOT_REQUESTED','HARBOR');
 check(navigation.historical_events_added===0&&navigation.admission==='NONE'&&navigation.publication==='NONE','FAKE_AUTHORITY');
 check(navigation.operator_claim==='SYNTHETIC_OR_OPERATOR_DECLARED_NOT_INDEPENDENTLY_VERIFIED','WITNESS_CLASS');

 // The owner separately validates its own content ID through navigationProjection.
 check(exact(dnaNavigation,['schema','candidateId','storyshipRuntimeEvent','storyshipTransferPacket','sourceThreads','availableHelmChoices','interpretations','historicalEventsAdded','originalWorldsChanged','destinationDecision','note']),'STORY_DNA_NAV');
 check(dnaNavigation.schema==='story-dna/navigation-projection/v0'&&HEX.test(dnaNavigation.candidateId),'STORY_DNA_NAV_ID');
 check(dnaNavigation.storyshipRuntimeEvent===false&&dnaNavigation.storyshipTransferPacket===false&&
       dnaNavigation.historicalEventsAdded===0&&dnaNavigation.originalWorldsChanged===false&&
       dnaNavigation.destinationDecision==='NOT_REQUESTED','STORY_DNA_NO_AUTHORITY');
 check(exact(candidate,['schema','posture','admission','publication','mode','seed','parentThreads','sourceCuts','sourceWorlds','characterTransfer','relation','title','logline','beats','editorialRightsNote','destinationAuthority','id']),'STORY_DNA_CANDIDATE');
 check(candidate.schema==='story-dna/candidate/v0'&&candidate.mode==='echo'&&
    candidate.posture==='HOLD'&&candidate.admission==='NONE'&&
    candidate.publication==='NONE'&&candidate.destinationAuthority==='NONE'&&
    candidate.characterTransfer===null&&HEX.test(candidate.id),'STORY_DNA_BOUNDARY');
 check(dnaNavigation.candidateId===candidate.id&&
   Array.isArray(candidate.parentThreads)&&candidate.parentThreads.length===2&&
   Array.isArray(dnaNavigation.sourceThreads)&&
   canonical(candidate.parentThreads)===canonical(dnaNavigation.sourceThreads),'STORY_DNA_ANCESTRY');
 check(candidate.sourceCuts.length===2&&candidate.sourceCuts.every(s=>s.visibility==='public'&&s.rights==='unverified'),'RIGHTS_BOUNDARY');
 check(exact(checkedSources,['storyship','storyDNA','webZ','lemonPRESS'])&&
    Object.entries(NARRATIVE_PINS).every(([name,commit])=>checkedSources[name]===commit),'OWNER_SOURCE_PINS');

 // Redacted return. No navigator question, character text, story beats, private testimony or content.
 const body={
  schema:'jarvis/narrative-justice-attention/v0',
  state:'HOLD_FOR_OPERATOR_REVIEW',
  title:'The stranger is not a character',
  claim:'SOURCE_NATIVE_SYNTHETIC_NAVIGATION_ONLY',
  sourcePins:NARRATIVE_PINS,
  sourceWitness:{
   nativeStoryshipReplayId:navigation.replay_id,
   nativeStoryshipNavigationId:navigation.navigation_id,
   nativeStoryDNAEchoId:candidate.id,
   nativeStoryDNANavigationId:dnaNavigation.candidateId,
   numberOfRivalReadings:navigation.narrative_deck.length,
   independentFictionalSourceThreads:candidate.parentThreads.length,
   actualHumansVerified:0,
   historicalEventsAdded:0,
   publicationAuthorized:false,
   consentEstablished:false
  },
  nextHumanGates:[
   {id:'WHO_OWNS_THE_ACCOUNT',state:'UNMET',question:'Can each willing participant define which parts of their own account may be told, by whom, and for what purpose?'},
   {id:'RIGHT_TO_REFUSE',state:'UNMET',question:'Is there a useful no-recording, no-publication path, and can declining be consequence-free?'},
   {id:'CORRECTION_AND_DISSENT',state:'UNMET',question:'Can someone challenge a portrayal or add a competing account without deleting original evidence?'},
   {id:'EDITORIAL_RIGHTS',state:'UNMET',question:'Who holds actual footage, audio, photos, likeness and derivative-use permissions, separate from software provenance?'},
   {id:'PRACTICAL_FIRST_ACT',state:'UNMET',question:'What real need could be addressed first, with independent confirmation instead of a narrative success claim?'},
   {id:'SECOND_TABLE_INDEPENDENCE',state:'UNMET',question:'Could other people change the project or create a successor without founder permission?'}
  ],
  possibleNextRoutes:[
   {owner:'STORYSHIP',route:'human navigation/readings',authority:'NONE'},
   {owner:'Story DNA',route:'fictional echo/fork proposal only',authority:'NONE'},
   {owner:'WebZ',route:'optional public-safe four-door story entrance',authority:'NONE'},
   {owner:'lemonPRESS',route:'separate licensed/consented editorial review',authority:'REQUIRES_EDITOR'},
   {owner:'JAR;VIS',route:'operator holds unmet human gates',authority:'NONE'}
  ],
  allowed:['INSPECT','HOLD','HUMAN_REVIEW','DECLINE','DOWNLOAD_REDACTED_CARD'],
  forbidden:['AUTO_PUBLICATION','REAL_PERSON_TO_FICTION','AI_CONSENT','FICTIVE_PARTNER_ENDORSEMENT','DOCUMENTARY_RELEASE','CONTACT','FUNDING_SUBMISSION','NATIVE_STORYSHIP_STEERING'],
  externalEffects:false,
  note:'A verified software path preserves rival readings, but does not establish a narrator right over other people, a social result, or authority to use footage.'
 };
 return {...body,attentionId:hash(body)};
}
