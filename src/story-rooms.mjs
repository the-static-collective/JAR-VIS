// STORY-ROOMS-002: Attributed fictional-world entrances become bounded question food.
// Source-backed seeds/canon stay distinct; no generative story is silently canon.
import {createHash} from 'node:crypto';
const digest=o=>'sha256:'+createHash('sha256').update(JSON.stringify(o)).digest('hex');
export const STORY_SOURCES=Object.freeze([
  {
    "id": "collective-movie",
    "title": "The Static Collective Movie",
    "medium": "MOVIE",
    "state": "CROSS_MEDIA_RELATION_CANON_EVENT_ONLY",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed/canon-001-the-collection-event",
    "mechanic": "a strange encounter witnessed in differently framed recordings becomes an attributable shared creative artifact",
    "boundary": "The movie's actual screenplay and full scenes are not established; the collection event is story canon, not a historical documentary."
  },
  {
    "id": "pet-sitter",
    "title": "The Pet Sitter",
    "medium": "COMEDY_FILM",
    "state": "FEATURED_STORY_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed",
    "mechanic": "an ordinary substitute teacher stops commanding a chaotic room and begins noticing which particular animal is missing",
    "boundary": "The substitute teacher owns this film's emotional resolution; Deuce is mostly absent and cannot steal the protagonist's story."
  },
  {
    "id": "deuce-stream",
    "title": "Deuce Burbank's nearly empty stream",
    "medium": "LIVE_STREAM",
    "state": "INCUBATING_MULTIMEDIA_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "mechanic": "a few incomplete spectators and an absent animal detective cooperate through a shaky livestream without one omniscient narrator",
    "boundary": "Deuce's stream is his own observational entrance, not a completed standalone Deuce Burbank film or an established real service."
  },
  {
    "id": "renji-game",
    "title": "Renji's Roomspace Workshop",
    "medium": "GAME",
    "state": "INCUBATING_MULTIMEDIA_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "mechanic": "a game player explores an already knowledgeable inventor's studio while each room retains its own boundaries and memory",
    "boundary": "Renji himself is not amnesiac; a controller's limited knowledge never erases the protagonist's real fictional knowledge."
  },
  {
    "id": "renji-treatise",
    "title": "The Room Inside the Room — 48-copy treatise",
    "medium": "IN_WORLD_BOOK",
    "state": "FICTIONAL_BOOK_PROPOSAL",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "mechanic": "a privately printed fallible diagram gathers annotations, photocopies, crops, misunderstandings and distinct readers' corrections",
    "boundary": "Forty-eight copies are fictional; no complete physical edition or authenticated original plate is established."
  },
  {
    "id": "collection-event",
    "title": "CANON 001 — The Collection Event",
    "medium": "AUTHOR_APPROVED_FICTIONAL_CANON",
    "state": "FIXED_FICTIONAL_CANON",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed/canon-001-the-collection-event",
    "mechanic": "two rats freely cross a fragile passage after strangers contribute distinct observations; the people save a shared trace",
    "boundary": "Only the fictional collection event is fixed; names, visuals, song title and unseen motives remain open. No real-world founding claim."
  },
  {
    "id": "octopus-rooms",
    "title": "OCTOPUS MADE THIS — The Rooms That Remember",
    "medium": "SYSTEMIC_GAME_AND_BOOK",
    "state": "CANDIDATE_CREATIVE_SEED",
    "url": "https://github.com/the-static-collective/the-daily-slice/blob/23c3d4bf7e4febb89919a3d54b6e8aaf3a764120/slices/2026/09/2026-09-16/octopus-made-this-rooms-that-remember.md",
    "mechanic": "Saint Eight leaves an affordance sentence for Wrench to reinterpret in an underwater room that remembers",
    "boundary": "The octopus civilization is fiction, not animal research or field proof; no real-world ocean-machine claim."
  },
  {
    "id": "octopus-mutation",
    "title": "OCTOPUS MADE THIS — Civilization Happens Between Us",
    "medium": "IN_WORLD_FABLE_AND_RTS_IDEA",
    "state": "CANDIDATE_MUTATION_NOT_CANON",
    "url": "https://github.com/the-static-collective/the-daily-slice/blob/23c3d4bf7e4febb89919a3d54b6e8aaf3a764120/slices/2026/09/2026-09-16/octopus-made-this-mutation-line-001-relational-cold-war.md",
    "mechanic": "first contact predates recognition as two worlds transform one another's artifacts, categories and future choices",
    "boundary": "Embedding the fable in the Collective movie is proposed only, not admitted film canon; factions and RTS form are speculative."
  }
].map(x=>Object.freeze(x)));
const SOURCES=new Map(STORY_SOURCES.map(s=>[s.id,s]));
const PURPOSES=Object.freeze(['SECOND_TABLE','OPEN_STORY_EXPLORATION','VOQAL_APPLICANT_REVIEW']);
const LENSES=Object.freeze([
 {id:'VIEWPOINT',pressure:'How would each independent protagonist see a different piece of the same problem?'},
 {id:'ABSENCE',pressure:'Who or what is missing, and what evidence would tell us rather than let a narrator assume?'},
 {id:'RECEIVER',pressure:'What could a receiving room, person or fictional creature refuse without losing its history?'},
 {id:'CARRIER',pressure:'What smallest printable trace could survive when its original storyteller disappears?'}
]);
const RULES=Object.freeze(['FICTION_NOT_SOCIAL_EVIDENCE','CANON_001_STAYS_FIXED','SEED_IS_NOT_CANON',
 'PET_SITTER_SUBSTITUTE_REMAINS_LEAD','RENJI_NOT_AMNESIAC','ANIMALS_NOT_PUPPETS',
 'OCTOPUS_NOT_SCIENTIFIC_CLAIM','CROPPED_SCREENSHOT_NOT_ORIGINAL_PLATE',
 'NO_REAL_SENSITIVE_DATA','NO_AUTOMATIC_MEDIA_RIGHTS_OR_PUBLISHING',
 'NO_VOQAL_GRANT_OR_REAL_FESTIVAL_CLAIM']);
function reject(s){throw Error('STORY_ROOMS_HOLD_'+s);}
function chosen(ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>5||new Set(ids).size!==ids.length)reject('PICK_TWO_TO_FIVE_DISTINCT_STORIES');
 for(const id of ids)if(typeof id!=='string'||!SOURCES.has(id))reject('UNKNOWN_STORY');
 return [...ids].sort();
}
export function composeStoryRooms({purpose='SECOND_TABLE',ids=['collection-event','renji-game','octopus-rooms']}={}){
 if(!PURPOSES.includes(purpose))reject('UNKNOWN_PURPOSE');
 const sources=chosen(ids).map(id=>SOURCES.get(id));
 const branches=[],questions=[],planCandidates=[];
 for(let i=0;i<sources.length;i++)for(let j=i+1;j<sources.length;j++){
  const [a,b]=[sources[i],sources[j]];
  const parentIds=[a.id,b.id];
  const question='If '+a.mechanic+' meets '+b.mechanic+', what practical way of making room for another person might be worth testing?';
  const cuts=LENSES.map(lens=>({lensId:lens.id,pressure:lens.pressure,
   heldExperiment:'Compare the two distinct story entrances, propose one removable paper-first participation aid and one valid refusal; record disagreement without rewriting either source.',
   state:'FICTIONAL_LENS_HOLD'}));
  const proposal={id:'story-plan-'+digest([purpose,parentIds,question]).slice(7,27),
   parentIds,question,smallestProof:'A fictional first table and independently editable second-table card, with one refusal and separate source notes.',
   falsifier:'If the second circle cannot change the method without its predecessor, the proposed succession mechanism fails.',
   cuts:cuts.map(x=>x.lensId),status:'PLANNING_CANDIDATE_ONLY',ownerApproved:false,executed:false,
   realPeople:0,rightsCleared:false};
  branches.push({parentIds,question,cuts,status:'CROSS_MEDIA_PROPOSAL_NOT_STORY_CANON'});
  questions.push(question);planCandidates.push(proposal);
 }
 const payload={schema:'jarvis.story-rooms-payload/v1',purpose,
  sourceReferences:sources.map(s=>({...s})),branches,questions,planCandidates,
  suggestedActivity:'One paper-first optional table, followed by a separately run successor with independent rules, refusal and public-safe documentation.',
  sourceMode:'PUBLIC_CREATIVE_SOURCE_DESCRIPTIONS_NO_MEDIA_COPIED',
  humanOutcomes:0,realWorldClaims:false,mediaEnginesExecuted:0,
  newStoryCanonDeclared:false,sourceOwnerAdmission:false,externalAction:false,
  voqalApplicationSubmitted:false,rules:[...RULES],authority:'NONE_REVIEW_HOLD'};
 return {schema:'jarvis.story-rooms-packet/v1',payload,digest:digest(payload)};
}
export function verifyStoryRooms(packet){
 if(!packet||Object.keys(packet).sort().join('|')!=='digest|payload|schema'||
   packet.schema!=='jarvis.story-rooms-packet/v1'||!packet.payload||
   JSON.stringify(packet).length>60000)reject('PACKET_SHAPE');
 const src=packet.payload.sourceReferences;
 if(!Array.isArray(src))reject('SOURCES');
 const wanted=composeStoryRooms({purpose:packet.payload.purpose,ids:src.map(s=>s.id)});
 if(JSON.stringify(packet)!==JSON.stringify(wanted))reject('ALTERED_SOURCE_CANON_OR_OUTPUT');
 return {verified:'LOCAL_COMPOSITION_ONLY',digest:packet.digest,mayExecute:false,mayDeclareCanon:false,mayPublish:false,actualHumans:0};
}
