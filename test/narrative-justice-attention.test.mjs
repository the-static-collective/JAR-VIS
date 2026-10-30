import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {attendNarrativeJustice,NARRATIVE_PINS} from '../src/narrative-justice-attention.mjs';
const hex = letter=>'sha256:'+letter.repeat(64);
function canonical(x){
 if(Array.isArray(x))return x.map(canonical);
 if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));
 return x;
}
function seal(x){
 const {navigation_id,...rest}=x;
 return {...rest,navigation_id:'sha256:'+createHash('sha256').update(JSON.stringify(canonical(rest))).digest('hex')};
}
function fixture(){
 const nav=seal({
  schema:'storyship/navigation-turn/v0',voyage_id:'storyship-voyage-000',event_cut:12,
  replay_id:hex('a'),source_event_id:hex('b'),source_cut_ids:[hex('c')],
  reality_projection_id:hex('d'),narrative_projection_id:hex('e'),
  lookout:{observation:'SOURCE_OWNED_REPLAY_ONLY',source_cut_ids:[hex('c')]},
  logbook:{event_cut:12,tip_event_id:hex('b'),historical_rewrite:false},
  chartroom:{branch_heads:[{branch_id:'branch-a',state_id:hex('f'),status:'live'},{branch_id:'branch-b',state_id:hex('1'),status:'dormant'}],dormant_branches:['branch-b']},
  narrative_deck:[
   {key:'reading-one',text:'SECRET-FICTION-CHARACTER-NOT-FOR-EXPORT',basis_event_ids:[hex('2')],classification:'INTERPRETATION_NOT_OBSERVATION'},
   {key:'reading-two',text:'COUNTERREADING-PRIVATE-NOT-FOR-EXPORT',basis_event_ids:[hex('2')],classification:'INTERPRETATION_NOT_OBSERVATION'}
  ],
  compass:{question:null,disclosure:'WITHHELD',silence:'PROTECTED',selected_reading:null},
  horizon:{open_berth:[],protected_silence_is_open_berth:false},
  helm:{choices:['HOLD','EXPLORE_ANOTHER_READING','DECLINE','PROPOSE_FOR_HUMAN_REVIEW'],decision:'NOT_RECORDED',actor_authority:'HUMAN_ONLY'},
  harbor:{crossing:'NOT_ATTEMPTED',arrival:'NOT_OBSERVED',destination_admission:'NOT_REQUESTED'},
  historical_events_added:0,admission:'NONE',publication:'NONE',
  operator_claim:'SYNTHETIC_OR_OPERATOR_DECLARED_NOT_INDEPENDENTLY_VERIFIED'
 });
 const candidate={
  schema:'story-dna/candidate/v0',posture:'HOLD',admission:'NONE',publication:'NONE',
  mode:'echo',seed:325,parentThreads:[hex('3'),hex('4')],
  sourceCuts:[{visibility:'public',rights:'unverified',title:'SECRET-NONPUBLIC-NARRATIVE-SAMPLE'},
              {visibility:'public',rights:'unverified',title:'MUST-NOT-LEAK'}],
  sourceWorlds:['WORLD','OTHER'],characterTransfer:null,relation:{},
  title:'PRIVATE-TEST-WORLD',logline:'SECRET-MOTIF-TEXT',beats:['SECRET-PAGE'],
  editorialRightsNote:'NOT_VERIFIED',destinationAuthority:'NONE',id:hex('5')
 };
 const dnaNavigation={
  schema:'story-dna/navigation-projection/v0',candidateId:hex('5'),
  storyshipRuntimeEvent:false,storyshipTransferPacket:false,
  sourceThreads:[hex('3'),hex('4')],
  availableHelmChoices:['HOLD','REVISE','DECLINE','PROPOSE_FOR_REVIEW'],
  interpretations:[{kind:'analogy',text:'do not export'}],
  historicalEventsAdded:0,originalWorldsChanged:false,destinationDecision:'NOT_REQUESTED',note:'read only'
 };
 return {navigation:nav,candidate,dnaNavigation,checkedSources:{...NARRATIVE_PINS}};
}
test('held card includes source IDs, human gates, no personal/story content',()=>{
 const card=attendNarrativeJustice(fixture()),out=JSON.stringify(card);
 assert.equal(card.state,'HOLD_FOR_OPERATOR_REVIEW');
 assert.equal(card.sourceWitness.numberOfRivalReadings,2);
 assert.equal(card.sourceWitness.historicalEventsAdded,0);
 assert.equal(card.sourceWitness.actualHumansVerified,0);
 assert.equal(card.sourceWitness.consentEstablished,false);
 assert.equal(card.externalEffects,false);
 assert.equal(card.nextHumanGates.length,6);
 assert.equal(card.possibleNextRoutes.length,5);
 for(const banned of ['SECRET','PRIVATE-TEST','NONPUBLIC','MUST-NOT-LEAK','COUNTERREADING','SECRET-MOTIF'])assert.ok(!out.includes(banned),banned);
});
test('cannot launder narrator authority, consent, publication, field proof or human selection',()=>{
 const cases=[
  x=>{x.navigation.publication='YES'},
  x=>{x.navigation.admission='YES'},
  x=>{x.navigation.helm.decision='SELECTED'},
  x=>{x.navigation.harbor.destination_admission='ADMIT'},
  x=>{x.navigation.historical_events_added=1},
  x=>{x.navigation.compass.selected_reading='reading-one'},
  x=>{x.navigation.horizon.protected_silence_is_open_berth=true},
  x=>{x.navigation.compass.question='SECRET_WITHHELD'},
  x=>{x.candidate.publication='YES'},
  x=>{x.candidate.characterTransfer={actorA:'A',actorB:'B'}},
  x=>{x.candidate.sourceCuts[0].visibility='private'},
  x=>{x.candidate.sourceCuts[0].rights='licensed'},
  x=>{x.dnaNavigation.storyshipRuntimeEvent=true},
  x=>{x.dnaNavigation.destinationDecision='ADMIT'},
  x=>{x.checkedSources.storyship='wrong'},
  x=>{x.navigation.narrative_deck.pop()},
  x=>{x.navigation.narrative_deck[0].classification='EVIDENCE'},
  x=>{x.navigation.narrative_deck[0].basis_event_ids=[]},
  x=>{x.navigation.privateWitness='no'},
 ];
 for(const modify of cases){
  const x=fixture();modify(x);
  if(x.navigation.navigation_id)x.navigation=seal(x.navigation);
  assert.throws(()=>attendNarrativeJustice(x),/JARVIS_NARRATIVE_HOLD/);
 }
});
test('changed Storyship payload with stale identity fails independently',()=>{
 const x=fixture();x.navigation.narrative_deck[0].text='tampered';
 assert.throws(()=>attendNarrativeJustice(x),/HASH_TAMPERED/);
});
test('operator CLI only invokes pinned original local modules',()=>{
 const code=readFileSync(new URL('../tools/attend-narrative-justice-019.mjs',import.meta.url),'utf8');
 assert.match(code,/JARVIS_SOURCE_PIN_REFUSED/);
 assert.match(code,/JARVIS_SOURCE_ORIGIN_REFUSED/);
 assert.match(code,/JARVIS_SOURCE_DIRTY_REFUSED/);
 assert.match(code,/projectNavigationTurn/);
 assert.match(code,/makeTwinVoyageFixture/);
 assert.match(code,/composeRelationship/);
 assert.match(code,/navigationProjection/);
 assert.match(code,/mode:'echo'/);
 assert.doesNotMatch(code,/shell:\s*true|execSync\(|\bfetch\s*\(|sendMail|smtp|SupabaseClient/);
});
test('review-only browser route has no participant intake or script execution',()=>{
 const page=readFileSync(new URL('../public/narrative-justice.html',import.meta.url),'utf8');
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(server,/\["\/narrative", \[new URL\("\.\.\/public\/narrative-justice\.html"/);
 assert.match(home,/href="\/narrative"/);
 assert.match(page,/The stranger is not a character/);
 assert.match(page,/HOLD_FOR_OPERATOR_REVIEW/);
 assert.doesNotMatch(page,/<form\b|<input\b|<textarea\b|<script\b/i);
});
