#!/usr/bin/env node
// Four independently pinned public checkouts, two native engines, one held JAR;VIS card.
// Manual localhost/operator command only; no shell eval, remote dispatch, or live personal data.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {NARRATIVE_PINS,attendNarrativeJustice} from '../src/narrative-justice-attention.mjs';

const instruction='Usage: node tools/attend-narrative-justice-019.mjs inspect|attend STORYSHIP STORY_DNA WEBZ LEMONPRESS (four exact clean public Git checkouts)';
if(process.argv.length!==7||!['inspect','attend'].includes(process.argv[2])) throw Error(instruction);
const [mode,...args]=process.argv.slice(2);
const specs=[
 ['storyship',NARRATIVE_PINS.storyship,'https://github.com/the-static-collective/STORYSHIP',['src/navigation-turn.mjs','test/helpers/fixture.mjs']],
 ['storyDNA',NARRATIVE_PINS.storyDNA,'https://github.com/the-static-collective/story-dna',['src/relationship-passenger.mjs','fixtures/relationship-passenger.json']],
 ['webZ',NARRATIVE_PINS.webZ,'https://github.com/the-static-collective/webZ',['bridge/doorway/index.html']],
 ['lemonPRESS',NARRATIVE_PINS.lemonPRESS,'https://github.com/the-static-collective/lemonPRESS',['README.md']]
];
const checked=specs.map(([name,pin,origin,files],i)=>{
 const root=realpathSync(resolve(args[i]));
 const git=(...argv)=>execFileSync('git',['-C',root,...argv],{encoding:'utf8',maxBuffer:8192}).trim();
 if(git('rev-parse','HEAD')!==pin)throw Error('JARVIS_SOURCE_PIN_REFUSED_'+name);
 const remote=git('remote','get-url','origin').replace(/\.git$/,'');
 if(remote!==origin)throw Error('JARVIS_SOURCE_ORIGIN_REFUSED_'+name);
 if(git('status','--porcelain','--untracked-files=normal')!=='')throw Error('JARVIS_SOURCE_DIRTY_REFUSED_'+name);
 for(const file of files)if(!existsSync(join(root,file)))throw Error('JARVIS_SOURCE_FILE_MISSING_'+name);
 return {name,root,origin,commit:pin};
});
const checkedSources=Object.fromEntries(checked.map(({name,commit})=>[name,commit]));
if(mode==='inspect'){
 process.stdout.write(JSON.stringify({
  schema:'jarvis/narrative-source-inspection/v0',
  checked:checked.map(({name,origin,commit})=>({name,origin,commit})),
  originalOwnerEnginesRun:false,
  humanAuthorization:false,
  status:'HOLD_FOR_OPERATOR_REVIEW',
  note:'Source identity only. No documents interpreted, no human consent, no publication.'
 },null,2)+'\n');
 process.exit(0);
}
const st=checked[0].root,dna=checked[1].root,web=checked[2].root,press=checked[3].root;
const importOwner=async (root,path)=>import(pathToFileURL(join(root,path)).href);
const {makeTwinVoyageFixture}=await importOwner(st,'test/helpers/fixture.mjs');
const {projectNavigationTurn}=await importOwner(st,'src/navigation-turn.mjs');
const {composeRelationship,navigationProjection}=await importOwner(dna,'src/relationship-passenger.mjs');
const {constitution,events}=makeTwinVoyageFixture();
const navigation=projectNavigationTurn({
 constitution,events,cut:events.length,
 navigator:{disclosure:'WITHHELD',question:'SYNTHETIC_PRIVATE_QUESTION_NOT_FOR_CARD'},
 heldSilence:true,
 interpretations:[
  {key:'hospitality',text:'A voluntary space can be an invitation to independent care, never enrollment.',basis_event_ids:[events[0].event_id]},
  {key:'counterreading',text:'A founding invitation may still concentrate control; independent refusals remain necessary.',basis_event_ids:[events[0].event_id]}
 ]
});
const storyFixture=JSON.parse(readFileSync(join(dna,'fixtures/relationship-passenger.json'),'utf8'));
if(storyFixture.schema!=='story-dna/fixture/v0'||storyFixture.threads?.length!==2)throw Error('JARVIS_HOLD_STORY_DNA_FIXTURE');
const candidate=composeRelationship(storyFixture.threads[0],storyFixture.threads[1],{mode:'echo',seed:325});
const dnaNavigation=navigationProjection(candidate);
// Verify that the other two owners are present and source-authored, but they
// grant neither story rights nor publication merely because they were read.
const webPage=readFileSync(join(web,'bridge/doorway/index.html'),'utf8');
const pressConstitution=readFileSync(join(press,'README.md'),'utf8');
if(!webPage.includes('The stranger is not a character.') ||
   !webPage.includes('No service-delivery claim') ||
   !pressConstitution.includes('SOURCE != PROJECTION') ||
   !pressConstitution.includes('Publication is an admitted crossing'))
 throw Error('JARVIS_HOLD_NEIGHBOR_OWNER_SEMANTICS');
const card=attendNarrativeJustice({navigation,candidate,dnaNavigation,checkedSources});
process.stdout.write(JSON.stringify(card,null,2)+'\n');
