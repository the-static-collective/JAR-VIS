import {createHash} from 'node:crypto';

// A tiny independent dealer inspired by Toaster's MADD CLOWN design.
// This is NOT the native Toaster evolutionary engine. Human KEEP/SCRAPE never
// becomes inferred preference weights or an authorization to publish.
export const POLICY='jarvis.maddclown-dealer/v1';
export const ROLES=Object.freeze(['ANCHOR','WILDCARD','GHOST','STOMP','FRONTIER','CROSSROADS']);
export const TOPOLOGIES=Object.freeze(['APERTURE','SPEAK','GRAB','GROW','BODY']);
export const MATERIALS=Object.freeze(['neon felt','paper cutout','rusty copper','celestial chalk','CRT phosphor','velvet ink','bottle glass','brick dust','cassette tape','pocket moss','holographic cardboard','campfire smoke']);
export const MOTIONS=Object.freeze(['swirl','stutter','pulse','waltz','drift','bounce','orbit','stamp','ripple','semaphore']);
export const PALETTES=Object.freeze([
 ['#1c213d','#ff9cae','#a3fbc1'],['#122b31','#f6d37d','#8de0ed'],
 ['#21152b','#e79aff','#e8dcb5'],['#2b261c','#c6eb86','#ffb180'],
 ['#1e2637','#ff87bf','#9de0db'],['#13292d','#9db4ff','#f1de9f'],
 ['#301c30','#ffa36d','#b5f2bc'],['#172237','#ffcfbd','#a8b4ff'],
 ['#302226','#c4e9ff','#fed975'],['#1a3040','#ff99aa','#d0ff96'],
 ['#342122','#b8f7e4','#edc5ef'],['#19192d','#f6df9f','#82dae6']
]);
const DEF=[
 ['radio','Elevator Phonk for a Haunted Hotel'],
 ['radio','Blue-Rose Midnight Hymnal'],
 ['radio','Ghost Cowboy Lullaby'],
 ['radio','Reverse-Seismograph Waltz'],
 ['radio','Morse-Code Gospel Organ'],
 ['manga','Six Panels from the Moon'],
 ['manga','Manga About an Unpaid Toaster'],
 ['manga','Detective Bread and the Impossible Receipt'],
 ['flipbook','Black-and-White Cowboy Chase'],
 ['flipbook','The Haunted VHS Transmission'],
 ['flipbook','The Future Arrives Yesterday'],
 ['ascii','1999 BBS Séance'],
 ['ascii','Haunted Computer Boot Screen'],
 ['ascii','The Oracle Lives in a Printer'],
 ['poster','Midnight Circus Manifesto'],
 ['poster','Neon Revival Handbill'],
 ['poster','The Undelivered Invitation'],
 ['blueprint','Blueprint for a Living Suitcase'],
 ['blueprint','Build-a-Garden Robot'],
 ['blueprint','Machine for Making More Festivals'],
 ['constellation','Rooms Between the Stars'],
 ['constellation','Electric Campfire Network'],
 ['constellation','The Cosmic Postal Route'],
 ['zine','Stranger Field Guide'],
 ['zine','Tiny Newspaper from Tomorrow'],
 ['zine','The Pocket Museum of Questions'],
 ['gamebook','Choose the Next Door'],
 ['gamebook','The Cowboy and the Two Futures'],
 ['gamebook','Escape the Bureaucratic Toaster'],
 ['poem','Four-Line Ghost Letter'],
 ['poem','Haunted Haiku Cabinet'],
 ['poem','Ballad of the Lost Semicolon'],
 ['kinetic','Dancing Electric Words'],
 ['kinetic','Glitch Sermon from a Neon Ghost'],
 ['kinetic','Typewriter Weather'],
 ['drums','Cowboy in Six-Eight Time'],
 ['drums','Felt-Piano Elevator Beat'],
 ['drums','Trashcan Breakbeat Rodeo'],
 ['signal','Lighthouse Morse Transmission'],
 ['signal','Signal Fire for the Future'],
 ['signal','Blinking Receipt Machine'],
 ['recipe','Recipe for an Impossible Festival'],
 ['recipe','Mix One Community From Scratch'],
 ['recipe','Five Ingredients for a Haunted Idea'],
 ['postcard','Wish You Were Here in the Future'],
 ['postcard','Postcard from the Next Season'],
 ['postcard','A Letter from the Little Robot']
];
export const SPECIES=Object.freeze(DEF.map(([renderer,title],i)=>Object.freeze({id:'species-'+String(i+1).padStart(2,'0'),renderer,title})));
export const RENDERERS=Object.freeze([...new Set(SPECIES.map(s=>s.renderer))]);
const sha=data=>'sha256:'+createHash('sha256').update(data).digest('hex');
const digest=data=>sha(JSON.stringify(data));
const pick=(seed,salt,max)=>Number.parseInt(sha(seed+'|'+salt).slice(7,15),16)%max;
const word=(text)=>{
 const skip=new Set(['the','that','this','what','where','when','from','could','should','would','will','with','about','make','how','can','our','have','there','someone','something','thing','right']);
 return (text.toLowerCase().match(/[a-z]{3,16}/g)||[]).find(w=>!skip.has(w))||'mystery';
};
const short=(s,n=140)=>s.length>n?s.slice(0,n-1).trimEnd()+'…':s;
function ensureQuestion(question){
 if(typeof question!=='string'||question.trim().length<2||question.length>500||/[\x00-\x1f]/.test(question.replace(/\n/g,' ')))throw Error('HOLD_QUESTION_2_TO_500_REQUIRED');
 return question.trim().replace(/\s+/g,' ');
}
function ensureAnswer(answer){
 if(typeof answer!=='string'||!answer.length||answer.length>6000)throw Error('HOLD_ATTENDANT_ANSWER_REQUIRED');
 return answer;
}
function validateIntents(intents){
 if(!Array.isArray(intents)||intents.length>16)throw Error('HOLD_MAX_16_HUMAN_DECISIONS');
 for(const x of intents){
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('HOLD_DECISION_SHAPE');
  if(x.kind==='KEEP' && Object.keys(x).sort().join(',')==='candidateId,kind' && /^[a-f0-9]{16}$/.test(x.candidateId))continue;
  if(['SCRAPE','NEXT'].includes(x.kind) && Object.keys(x).join(',')==='kind')continue;
  throw Error('HOLD_DECISION_SHAPE');
 }
}
function sceneParts({question,answer,species,seed,role}) {
 const motif=word(question),muse=['cowboy','toaster','moon','moss','radio','witness','garden','ghost'][pick(seed,'muse',8)];
 const answerLine=short(answer,124);
 const verses=[
  'I asked the '+muse+' about '+motif,
  'He tuned the stars to a room in blue',
  'The future stumbled over its boots',
  'And left one honest answer for you',
  'Hold what is true; let the rest pass by',
  'The clown can sing, but the facts must try'
 ];
 switch(species.renderer){
  case 'radio': return {bpm:92+(pick(seed,'tempo',5)*3),meter:'6/8',
   melody:Array.from({length:24},(_,i)=>({note:[0,2,3,5,7,10,12,14,15,17,19,22][pick(seed,'note'+i,12)],beat:i*.5,length:i%3===0?.43:.3})),
   lyrics:verses};
  case 'drums': return {bpm:78+pick(seed,'bpm',52),steps:Array.from({length:16},(_,i)=>({
   kick:(i===0||i===8||pick(seed,'kick'+i,8)===0),snare:(i===4||i===12),
   hat:pick(seed,'hat'+i,4)!==0}))};
  case 'manga': return {panels:[
   ['The Question','A stranger arrives with '+motif+'.'],
   ['The Cowboy','A chrome cowboy checks his hat.'],
   ['The Machine','The clown toaster spits sparks.'],
   ['The Truth',answerLine],
   ['The Boundary','This scene cannot authorize anything.'],
   ['The Next Door','The stranger decides what survives.']
  ].map(([heading,body],i)=>({heading,body,index:i}))};
  case 'flipbook': return {frames:[
   'A '+muse+' enters the station','SIX-EIGHT STATIC ACTIVATED',
   short(question,75),'The little ghost gets creative',
   answerLine,'NO FIELD PROOF CLAIMED',
   'KEEP OR SCRAPE?','THE NEXT DOOR IS YOURS'
  ].map((line,i)=>({index:i,line}))};
  case 'ascii': return {lines:[
   '>>> CONNECTING TO GHOST COWBOY NODE',
   '>>> SIGNAL: '+motif.toUpperCase(),
   '>>> [□□□□■□□□□] BOOTING…',
   '>>> REQUEST: '+short(question.toUpperCase(),90),
   '>>> JAR;VIS: '+answerLine,
   '>>> STATUS: LOCAL / FICTIONAL',
   '>>> HUMAN STEWARD: NOT IMPLIED'
  ]};
  case 'poster': return {headline:short(motif.toUpperCase()+'! THE '+muse.toUpperCase()+' RETURNS',54),
   subtitle:short(question,90),footer:'ONE QUESTION • SIX WEIRD FUTURES • NO INVENTED WITNESSES'};
  case 'blueprint': return {nodes:['QUESTION','MATERIAL','CREATIVE ENGINE','HUMAN REVIEW','LOCAL RESULT','NEXT QUESTION'],
   caption:short('A fictional machine for '+motif+'; external work remains unapproved.',140)};
  case 'constellation': return {nodes:Array.from({length:9},(_,i)=>({id:'N'+i,
   x:10+pick(seed,'x'+i,80),y:10+pick(seed,'y'+i,80),label:['ASK','CANNON','TOASTER','GARDEN','HOLD','JAR;VIS','VOICE','ROOM','YOU'][i]})),
   edges:[[0,1],[1,2],[1,3],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8]]};
  case 'zine': return {pages:[
   {heading:'FIELD NOTE NO. '+(pick(seed,'issue',90)+10),text:short(question,145)},
   {heading:'SPECIMEN',text:'A '+muse+' in a '+motif+' machine.'},
   {heading:'OBSERVATION',text:answerLine},
   {heading:'DO NOT CONFUSE',text:'Creative presentation with real-world permission.'}
  ]};
  case 'gamebook': return {premise:'At a glowing '+muse+' crossroads, the question is '+short(question,95),
   choices:[{label:'OPEN THE EVIDENCE DOOR',response:'The answer is: '+answerLine},
    {label:'OPEN THE CHAOS DOOR',response:'A clown falls out. He cannot authenticate a witness.'},
    {label:'OPEN THE HUMAN DOOR',response:'A person chooses what happens next. No automation follows.'}]};
  case 'poem': return {lines:[
    'The '+muse+' asks the '+motif+' to stay,',
    'A little voltage lights the way,',
    'One truthful answer comes to rest,',
    'And leaves the stranger free to test.'
  ],footnote:answerLine};
  case 'kinetic': return {words:['THE','GHOST',motif.toUpperCase(),'IS','NOT','THE','PROOF'],
   caption:answerLine};
  case 'signal': return {message:'SOS '+motif.toUpperCase().slice(0,8),
   meaning:'Fictional signal only; no broadcast or real emergency message.'};
  case 'recipe': return {ingredients:['1 curious stranger','2 unclaimed possibilities','6 unstable little creations',
   'a pinch of '+motif,'1 human decision'],
   steps:['Bring the question to the table.','Separate the answer from the costume.',
    'Offer six distinct forms.','Choose KEEP or SCRAPE freely.','Never bake consent into the code.']};
  case 'postcard': return {heading:'DEAR FUTURE '+motif.toUpperCase(),
   message:'The '+muse+' has arrived. '+answerLine,
   signoff:'Love, a fictional robot who cannot approve real-world work.'};
 }
 throw Error('HOLD_UNKNOWN_RENDERER');
}
function operation(round,lastKind,keepers,streak) {
 if(!round)return 'BIRTH';
 if(lastKind==='NEXT')return keepers.length>1?'CROSS':'MUTATE';
 if(streak===1)return 'CONVERGE';
 if(streak===2)return 'STOMP';
 if(streak>=3)return 'FRESH_BIRTH';
 return 'DIVERSE';
}
function dealFamily({question,answer,round,operationName,keepers,history=[]}){
 const root=digest([POLICY,question,answer,round,operationName,keepers.map(k=>k.id)]);
 const motif=word(question);
 const coverage=Object.fromEntries(RENDERERS.map(renderer=>[
  renderer, history.flatMap(f=>f.creatures).filter(c=>c.renderer===renderer).length
 ]));
 const lastFamily=history.at(-1);
 const desired=[];
 if(operationName==='MUTATE'||operationName==='CROSS'){
  // Exact kept specimens, not learned aesthetic weights, contribute ancestry.
  for(const k of (operationName==='CROSS'?keepers.slice(-2):keepers.slice(-1)))
   if(k.renderer&&!desired.includes(k.renderer))desired.push(k.renderer);
 }
 const candidates=RENDERERS.filter(r=>!desired.includes(r));
 if(operationName==='CONVERGE'){
  // Actual least-visited deterministic frontier, not merely a name.
  candidates.sort((a,b)=>coverage[a]-coverage[b]||
   pick(root,'tie-'+a,100000)-pick(root,'tie-'+b,100000));
 }else if(operationName==='STOMP'){
  const recentlySeen=new Set(lastFamily?.creatures.map(c=>c.renderer)??[]);
  candidates.sort((a,b)=>Number(recentlySeen.has(a))-Number(recentlySeen.has(b))||
   pick(root,'stomp-'+a,100000)-pick(root,'stomp-'+b,100000));
 }else{
  candidates.sort((a,b)=>pick(root,'species-'+a,100000)-pick(root,'species-'+b,100000));
 }
 desired.push(...candidates.slice(0,6-desired.length));
 const specimens=desired.map((renderer,i)=>{
  const pool=SPECIES.filter(s=>s.renderer===renderer);
  const spec=pool[pick(root,'species-'+i,pool.length)];
  const phenotypeSeed=digest([root,ROLES[i],spec.id,keepers.map(k=>k.id)]);
  const palette=PALETTES[(round*6+i)%PALETTES.length];
  const phenotype={
   schema:'jarvis.maddclown-creature/v1',
   id:phenotypeSeed.slice(7,23),familyRound:round,role:ROLES[i],renderer,
   speciesId:spec.id,species:spec.title,
   title:spec.title+' / '+motif.toUpperCase(),
   topology:TOPOLOGIES[(i+round)%TOPOLOGIES.length],
   material:MATERIALS[pick(phenotypeSeed,'material',MATERIALS.length)],
   motion:MOTIONS[pick(phenotypeSeed,'motion',MOTIONS.length)],
   palette,seed:phenotypeSeed,
   ancestry:keepers.slice(-2).map(k=>k.id),
   art:sceneParts({question,answer,species:spec,seed:phenotypeSeed,role:ROLES[i]}),
   nativeToasterExecuted:false,externalGeneration:false
  };
  return {...phenotype,creatureDigest:digest(phenotype)};
 });
 const family={
  schema:'jarvis.maddclown-family/v1',round,operation:operationName,
  policy:POLICY,root,ancestry:keepers.slice(-2).map(k=>k.id),
  frontierBefore:coverage,
  creatures:specimens,
  evidenceClass:'LOCAL_CREATIVE_SOFTWARE_ONLY'
 };
 return {...family,familyDigest:digest(family)};
}
export function replaySlots({question,answer,intents=[]}={}){
 const q=ensureQuestion(question),a=ensureAnswer(answer);
 validateIntents(intents);
 let round=0,streak=0,last='BIRTH',status='OFFERING',keepers=[],history=[];
 let family=dealFamily({question:q,answer:a,round,operationName:'BIRTH',keepers});
 const receipts=[];
 let previous=digest([POLICY,q,a]);
 for(const intent of intents){
  if(status==='KEPT'&&intent.kind!=='NEXT')throw Error('HOLD_AFTER_KEEP_NEXT_REQUIRED');
  if(status==='OFFERING'&&intent.kind==='NEXT')throw Error('HOLD_NEXT_NEEDS_KEEP');
  const beforeFamily=family;
  if(intent.kind==='KEEP'){
   const target=family.creatures.find(c=>c.id===intent.candidateId);
   if(!target)throw Error('HOLD_KEEP_EXACT_CURRENT_CREATURE_REQUIRED');
   keepers=[...keepers,{id:target.id,seed:target.seed,renderer:target.renderer,creatureDigest:target.creatureDigest,familyDigest:family.familyDigest}];
   status='KEPT';
  }else{
   if(round>=15)throw Error('HOLD_DEAL_LIMIT');
   if(intent.kind==='SCRAPE'){streak++;last='SCRAPE'}
   else if(intent.kind==='NEXT'){streak=0;last='NEXT'}
   else throw Error('HOLD_UNKNOWN_VERDICT');
   history=[...history,family];round++;
   family=dealFamily({question:q,answer:a,round,
    operationName:operation(round,last,keepers,streak),keepers,history});
   status='OFFERING';
  }
  const record={
   schema:'jarvis.maddclown-receipt/v1',sequence:receipts.length+1,
   kind:intent.kind,offeredFamilyDigest:beforeFamily.familyDigest,resultFamilyDigest:family.familyDigest,
   candidateId:intent.kind==='KEEP'?intent.candidateId:null,
   selectedOperation:family.operation,ancestorIds:family.ancestry,
   priorReceipt:previous,
   authority:'SELF_REPORTED_BROWSER_CHOICE_ONLY',
   humanOutcomeVerified:false
  };
  const receipt={...record,receiptDigest:digest(record)};
  receipts.push(receipt);previous=receipt.receiptDigest;
 }
 return {schema:'jarvis.maddclown-deck/v1',
  question:q,answer:a,
  questionDigest:sha(q),answerDigest:sha(a),
  family,round,status,keepers,receipts,
  historyFamilyDigests:history.map(f=>f.familyDigest),
  nextAllowed:status==='KEPT'?['NEXT']:['KEEP','SCRAPE'],
  focusIsVerdict:false,preferenceWeightsRecorded:false,
  humanOutcomesVerified:false,externalDispatch:false,
  sourceExecution:{nativeToaster:false,nativeCannon:false,externalAI:false},
  policy:POLICY};
}
export function inspectSlots({question,answer,intents,expectedFamilyDigest}={}){
 const deck=replaySlots({question,answer,intents});
 if(deck.family.familyDigest!==expectedFamilyDigest)throw Error('HOLD_FAMILY_REPLAY_MISMATCH');
 return {verified:'DETERMINISTIC_SOFTWARE_REPLAY_ONLY',
  familyDigest:deck.family.familyDigest,receiptCount:deck.receipts.length,
  humanAuthority:false,fieldWitness:false};
}
