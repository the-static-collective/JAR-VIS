const $=id=>document.getElementById(id);
const question=$('question'),status=$('status'),slots=$('slots'),stage=$('stage');
let csrf=null,deck=null,intents=[],focused=null,playing=null,activeAudio=null,activeNodes=[],interval=null,clockHandles=[];
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==null&&value!==undefined)n.textContent=String(value);return n};
const btn=(label,fn)=>{const n=el('button',label);n.type='button';n.addEventListener('click',fn);return n};
const svg=(tag,attrs={})=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node};
function cleanPlayback(){
 if(interval!==null){clearInterval(interval);interval=null}
 for(const h of clockHandles)clearTimeout(h);clockHandles=[];
 for(const n of activeNodes){try{n.stop()}catch{}}activeNodes=[];
 if(activeAudio){activeAudio.close().catch(()=>{});activeAudio=null}
 playing=null;
}
function findFocused(){return deck?.family.creatures.find(c=>c.id===focused)||null}
async function token(){
 if(csrf)return csrf;
 const response=await fetch('/api/state',{cache:'no-store'});
 if(!response.ok)throw Error('NO_LOCAL_CSRF_TOKEN');
 csrf=(await response.json()).csrfToken;return csrf
}
async function deal(candidateIntents){
 const req={question:question.value,intents:candidateIntents};
 const response=await fetch('/api/slots/deal',{method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':await token()},body:JSON.stringify(req)});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'DEAL_REFUSED');
 return data.deck;
}
async function newShow(event){
 event.preventDefault();if(!question.value.trim())return;
 status.textContent='THE CLOWN IS DEALING SIX MATERIALIZED POSSIBILITIES…';
 $('dealButton').disabled=true;
 try{
  const fresh=await deal([]);
  cleanPlayback();intents=[];focused=null;deck=fresh;render();
  $('arena').hidden=false;status.textContent='SIX CREATURES BORN. NOTHING IS KEPT UNTIL YOU KEEP IT.';
  $('arena').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){status.textContent='HOLD: '+e.message}
 finally{$('dealButton').disabled=false}
}
$('ask').addEventListener('submit',newShow);
async function verdict(kind){
 if(!deck)return;
 const candidate=kind==='KEEP'?findFocused():null;
 if(kind==='KEEP'&&!candidate){status.textContent='HOLD: FOCUS AN EXACT CREATURE FIRST';return}
 const intent=kind==='KEEP'?{kind:'KEEP',candidateId:candidate.id}:{kind};
 const proposed=[...intents,intent];
 $('keep').disabled=$('scrape').disabled=$('next').disabled=true;
 status.textContent='VERIFYING DEALER TRANSITION / '+kind+'…';
 try{
  const nextDeck=await deal(proposed);
  intents=proposed;deck=nextDeck;focused=null;cleanPlayback();render();
  status.textContent=kind==='KEEP'?'KEPT EXACT CREATURE. NO GLOBAL PREFERENCES LEARNED.':
    kind==='SCRAPE'?'SIX SCRAPED AS A FAMILY. NEXT OPERATION: '+deck.family.operation:
    'ANCESTRY OPEN. NEXT DEALER OPERATION: '+deck.family.operation;
 }catch(e){status.textContent='HOLD: '+e.message;render()}
}
$('keep').addEventListener('click',()=>verdict('KEEP'));
$('scrape').addEventListener('click',()=>verdict('SCRAPE'));
$('next').addEventListener('click',()=>verdict('NEXT'));
$('replay').addEventListener('click',()=>{const c=findFocused();if(c)renderPerformance(c)});
$('print').addEventListener('click',()=>window.print());
function stageBox(creature,description){
 const root=el('div',null,'performance');
 root.style.setProperty('--c0',creature.palette[0]);
 root.style.setProperty('--c1',creature.palette[1]);
 root.style.setProperty('--c2',creature.palette[2]);
 if(description)root.append(el('p',description,'perf-note'));
 return root
}
function label(root,text){root.append(el('small',text,'perf-note'))}
function renderRadio(c){
 const r=stageBox(c,'LOCAL BROWSER SYNTH · ORIGINAL MELODY, NOT A TOASTER RENDER');
 const record=el('div',null,'radio-record');record.append(el('span','GHOST RADIO'));r.append(record);
 r.append(el('p',c.art.lyrics.join('\n'),'radio-words'));
 r.append(btn('▶ PLAY THE 6/8 GHOST SONG',async()=>{
  cleanPlayback();try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('WEB_AUDIO_UNAVAILABLE');
   activeAudio=new AC();await activeAudio.resume();const base=activeAudio.currentTime+.06;
   const master=activeAudio.createGain();master.gain.value=.11;master.connect(activeAudio.destination);
   for(const x of c.art.melody){
    const o=activeAudio.createOscillator(),g=activeAudio.createGain();o.type=x.note%3===0?'triangle':'sine';
    o.frequency.value=220*Math.pow(2,x.note/12);o.connect(g);g.connect(master);
    const start=base+x.beat*60/c.art.bpm,stop=start+x.length*60/c.art.bpm;
    g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(.7,start+.025);
    g.gain.exponentialRampToValueAtTime(.001,stop);o.start(start);o.stop(stop+.01);activeNodes.push(o);
   }record.classList.add('spin');
   status.textContent='LOCAL SOUND. NO MUSICAL COPYRIGHT OR NATIVE AUDIO IS CLAIMED.';
  }catch(e){status.textContent='HOLD AUDIO: '+e.message;cleanPlayback()}
 }));
 r.append(btn('■ STOP AUDIO',cleanPlayback));return r;
}
function renderDrums(c){
 const r=stageBox(c,'LOCAL GENERATED 16-STEP DRUM MACHINE');
 r.append(el('h3',c.species));const grid=el('div',null,'beat-grid');
 for(const x of c.art.steps)grid.append(el('span',null,x.kick||x.snare||x.hat?'on':''));
 r.append(grid);
 r.append(btn('▶ PLAY THE CLOWN DRUMS',async()=>{
  cleanPlayback();try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('WEB_AUDIO_UNAVAILABLE');
   activeAudio=new AC();await activeAudio.resume();const start=activeAudio.currentTime+.06;
   const gain=activeAudio.createGain();gain.gain.value=.12;gain.connect(activeAudio.destination);
   for(let i=0;i<c.art.steps.length;i++){
    const x=c.art.steps[i],at=start+i*60/c.art.bpm/4;
    for(const [type,yes] of [['kick',x.kick],['snare',x.snare],['hat',x.hat]]){
     if(!yes)continue;const o=activeAudio.createOscillator(),g=activeAudio.createGain();
     o.type=type==='kick'?'sine':type==='snare'?'triangle':'square';
     o.frequency.setValueAtTime(type==='kick'?110:type==='snare'?198:700,at);
     if(type==='kick')o.frequency.exponentialRampToValueAtTime(48,at+.14);
     o.connect(g);g.connect(gain);g.gain.setValueAtTime(.0001,at);
     g.gain.exponentialRampToValueAtTime(type==='hat'?.08:.34,at+.005);
     g.gain.exponentialRampToValueAtTime(.0001,at+(type==='kick'?.18:.07));
     o.start(at);o.stop(at+.2);activeNodes.push(o)
    }
   }
  }catch(e){status.textContent='HOLD AUDIO: '+e.message;cleanPlayback()}
 }));
 r.append(btn('■ STOP',cleanPlayback));return r;
}
function renderManga(c){
 const r=stageBox(c,'BROWSER DRAWN SIX-PANEL MANGA / NO IMAGE GENERATION');
 const grid=el('div',null,'comics'),symbols=['★','☾','♣','♫','✳','↗'];
 for(const [i,x] of c.art.panels.entries()){
  const panel=el('article',null,'comic');
  panel.append(el('strong',String(i+1).padStart(2,'0')+' // '+x.heading),el('div',symbols[i],'symbol'),el('p',x.body));
  grid.append(panel)
 }r.append(grid);return r;
}
function renderFlip(c){
 const r=stageBox(c,'ANIMATED TEXT FLIPBOOK · NO MP4');
 const screen=el('div',null,'flip-screen');let i=0;
 const show=()=>screen.textContent=c.art.frames[i].line;
 show();r.append(screen);const controls=el('div',null,'interactive-choice');
 controls.append(btn('▶ PLAY',()=>{
  cleanPlayback();i=0;show();
  interval=setInterval(()=>{i++;if(i>=c.art.frames.length){cleanPlayback();return}show()},500)
 }),btn('← FRAME',()=>{cleanPlayback();i=(i+c.art.frames.length-1)%c.art.frames.length;show()}),
 btn('FRAME →',()=>{cleanPlayback();i=(i+1)%c.art.frames.length;show()}));
 r.append(controls);return r;
}
function renderAscii(c){
 const r=stageBox(c,'FICTIONAL LOCAL BBS / NOTHING TRANSMITTED');
 r.append(el('pre',c.art.lines.join('\n'),'ascii-screen'));return r;
}
function renderPoster(c){
 const r=stageBox(c,'PRINTABLE POSTER / FAKE EVENT, NO VENUE RESERVED');
 const poster=el('div',null,'poster-sheet');poster.append(el('h3',c.art.headline),el('p',c.art.subtitle),el('small',c.art.footer));
 r.append(poster);return r;
}
function renderBlueprint(c){
 const r=stageBox(c,'A FICTIONAL BUILD PLAN, NOT ENGINEERED HARDWARE');
 const s=svg('svg',{viewBox:'0 0 780 210',role:'img','aria-label':'Diagram of fictional creative stages',class:'diagram'});
 for(let i=0;i<6;i++){
  const x=10+i*129;
  if(i<5)s.append(svg('line',{x1:x+114,y1:82,x2:x+135,y2:82}));
  s.append(svg('rect',{x:x+3,y:40,width:113,height:83,rx:10}));
  const t=svg('text',{x:x+59,y:75,'text-anchor':'middle'});t.textContent=c.art.nodes[i];s.append(t)
 }
 r.append(s,el('p',c.art.caption));return r;
}
function renderConstellation(c){
 const r=stageBox(c,'SOURCE-FREE FICTIONAL CONSTELLATION · NOT A REAL RELATION GRAPH');
 const s=svg('svg',{viewBox:'0 0 800 450',role:'img','aria-label':'Fictional creative constellation',class:'diagram'});
 for(const [a,b] of c.art.edges){const x=c.art.nodes[a],y=c.art.nodes[b];
  s.append(svg('line',{x1:x.x*8,y1:x.y*4.5,x2:y.x*8,y2:y.y*4.5}))
 }for(const node of c.art.nodes){
  s.append(svg('circle',{cx:node.x*8,cy:node.y*4.5,r:22}));
  const t=svg('text',{x:node.x*8,y:node.y*4.5+5,'text-anchor':'middle'});t.textContent=node.label;s.append(t)
 }r.append(s);return r;
}
function renderZine(c){
 const r=stageBox(c,'FOUR-PAGE BROWSER ZINE');
 const z=el('div',null,'zine');
 for(const page of c.art.pages){const p=el('article',null,'zine-page');p.append(el('h3',page.heading),el('p',page.text));z.append(p)}
 r.append(z);return r;
}
function renderGamebook(c){
 const r=stageBox(c,'BRANCHING STORY / A CHOICE DOES NOT AUTHORIZE REAL WORK');
 r.append(el('h3',c.art.premise));
 const answer=el('p','Choose one fictional door.','flip-screen');
 const controls=el('div',null,'interactive-choice');
 for(const choice of c.art.choices)controls.append(btn(choice.label,()=>{answer.textContent=choice.response}));
 r.append(answer,controls);return r;
}
function renderPoem(c){
 const r=stageBox(c,'A FICTIONAL POEM, NOT A CLAIM');
 r.append(el('div',c.art.lines.join('\n'),'poem-lines'),el('p','UNMASKED ECHO: '+c.art.footnote));
 return r;
}
function renderKinetic(c){
 const r=stageBox(c,'CSS MOTION / RESPECTS REDUCED MOTION');
 const words=el('div',null,'kinetic-words');
 for(const word of c.art.words)words.append(el('b',word));
 r.append(words,el('p',c.art.caption));return r;
}
const MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',' ':'/'};
function renderSignal(c){
 const r=stageBox(c,'LOCAL FLASHING LAMP / NO EXTERNAL TRANSMISSION');
 const lamp=el('div',null,'signal-lamp');r.append(lamp,el('h3',c.art.message),el('p',c.art.meaning));
 const code=[...c.art.message].map(x=>MORSE[x]||'').join(' ').slice(0,75);
 r.append(el('small',code,'perf-note'),btn('✴ BLINK THE MESSAGE',()=>{
  cleanPlayback();
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    status.textContent='MOTION REDUCED: MORSE TEXT DISPLAYED WITHOUT BLINKING.';
    return;
  }
  const pulses=[];
  for(const ch of code){if(ch==='.')pulses.push(1,0);else if(ch==='-')pulses.push(1,1,1,0);else pulses.push(0,0)}
  let i=0;interval=setInterval(()=>{lamp.classList.toggle('lit',!!pulses[i]);i++;if(i>=pulses.length){lamp.classList.remove('lit');cleanPlayback()}},650);
 }),btn('■ STOP',()=>{cleanPlayback();lamp.classList.remove('lit')}));
 return r;
}
function renderRecipe(c){
 const r=stageBox(c,'A POETIC RECIPE ONLY, NOT FOOD SAFETY ADVICE');
 r.append(el('h3','INGREDIENTS'));const list=el('ol',null,'recipe-list');
 for(const v of c.art.ingredients)list.append(el('li',v));
 r.append(list,el('h3','INSTRUCTIONS'));
 const steps=el('ol',null,'recipe-list');for(const v of c.art.steps)steps.append(el('li',v));
 r.append(steps);return r;
}
function renderPostcard(c){
 const r=stageBox(c,'PRINTABLE FICTIONAL POSTCARD');
 const card=el('div',null,'postcard-sheet');
 card.append(el('h3',c.art.heading),el('p',c.art.message),el('p',c.art.signoff));
 r.append(card);return r;
}
const renderers={radio:renderRadio,drums:renderDrums,manga:renderManga,flipbook:renderFlip,
 ascii:renderAscii,poster:renderPoster,blueprint:renderBlueprint,
 constellation:renderConstellation,zine:renderZine,gamebook:renderGamebook,
 poem:renderPoem,kinetic:renderKinetic,signal:renderSignal,recipe:renderRecipe,postcard:renderPostcard};
const symbols={radio:'♫',drums:'♬',manga:'▦',flipbook:'▶',ascii:'⌘',poster:'✳',blueprint:'⚙',constellation:'✦',zine:'▤',gamebook:'♜',poem:'✎',kinetic:'↯',signal:'☼',recipe:'✚',postcard:'✉'};
function renderPerformance(c){
 cleanPlayback();
 $('selectedTitle').textContent=c.title;
 $('selectedMeta').textContent=c.role+' / '+c.renderer.toUpperCase()+' / '+c.topology+' / '+c.material+' / '+c.motion+' / '+c.id;
 const fn=renderers[c.renderer];if(!fn){stage.replaceChildren(el('p','HOLD: UNSUPPORTED RENDERER'));return}
 stage.replaceChildren(fn(c));
}
function focus(id){
 if(!deck)return;const c=deck.family.creatures.find(x=>x.id===id);if(!c)return;
 focused=id;for(const tile of slots.children){tile.dataset.focused=String(tile.dataset.candidate===id);
 tile.setAttribute('aria-pressed',String(tile.dataset.candidate===id))}
 $('keep').disabled=deck.status!=='OFFERING';
 renderPerformance(c);
}
function render(){
 if(!deck)return;
 const f=deck.family;slots.replaceChildren();
 $('familyTitle').textContent='SIX-UP / '+f.operation.replaceAll('_',' ');
 $('familyExplanation').textContent='Every phenotype is a distinct playable format. The machine picked the roles, materials, topology and frontier. You choose only whether to continue.';
 $('operation').textContent=f.operation;$('round').textContent='ROUND '+deck.round+' · '+f.familyDigest.slice(7,15);
 const kept=deck.status==='KEPT';
 $('keep').hidden=kept;$('scrape').hidden=kept;$('next').hidden=!kept;
 $('scrape').disabled=kept;$('keep').disabled=kept||!focused;$('next').disabled=!kept;
 for(const c of f.creatures){
  const tile=el('button',null,'creature');tile.type='button';
  tile.dataset.candidate=c.id;tile.dataset.focused='false';tile.setAttribute('aria-pressed','false');
  tile.style.setProperty('--c0',c.palette[0]);tile.style.setProperty('--c1',c.palette[1]);tile.style.setProperty('--c2',c.palette[2]);
  const top=el('div',null,'topline');top.append(el('span',c.role),el('span',c.renderer.toUpperCase()));
  const art=el('div',symbols[c.renderer]||'★','artwork');
  const desc=el('div',null,'creature-desc');desc.append(el('strong',c.species),el('small',c.topology+' • '+c.material+' • '+c.motion));
  tile.append(top,art,desc);tile.addEventListener('click',()=>focus(c.id));
  slots.append(tile);
 }
 $('grounded').textContent=deck.answer;
 $('receipt').textContent=JSON.stringify({policy:deck.policy,family:deck.family,keepers:deck.keepers,receipts:deck.receipts,
  note:'Local software identity only. No independent review or real-world effect.'},null,2);
 if(kept){
  const id=deck.keepers.at(-1)?.id;
  if(id)focus(id);
  status.textContent='EXACT CREATURE KEPT. CONTINUATION PERMISSION IS LOCAL ONLY.';
 }else{focused=null;stage.replaceChildren(el('p','SIX CREATURES ARE WAITING. PICK ONE TO PREVIEW.'));$('selectedTitle').textContent='FOCUS A CREATURE';$('selectedMeta').textContent='PREVIEW DOES NOT GRANT CONTINUATION';}
}
$('export').addEventListener('click',async()=>{
 if(!deck)return;
 const payload={
  schema:'jarvis.maddclown-public-passport/v1',policy:deck.policy,
  questionDigest:deck.questionDigest,answerDigest:deck.answerDigest,
  familyDigest:deck.family.familyDigest,operation:deck.family.operation,
  round:deck.round,candidateDigests:deck.family.creatures.map(x=>x.creatureDigest),
  kept:deck.keepers.map(k=>({candidateId:k.id,creatureDigest:k.creatureDigest,familyDigest:k.familyDigest})),
  receipts:deck.receipts.map(x=>({kind:x.kind,receiptDigest:x.receiptDigest})),
  nativeToasterExecuted:false,nativeCannonExecuted:false,
  humanOutcomesVerified:false,externalDispatch:false,publicationAuthorized:false,
  questionOrAnswerContentIncluded:false,
  note:'Unsigned, digest-only local creative evidence. Not authenticated human custody.'
 };
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 const receipt={...payload,passportDigest:'sha256:'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')};
 const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}));
 const a=el('a');a.href=url;a.download='MADD-CLOWN-'+deck.family.familyDigest.slice(7,15)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('pagehide',cleanPlayback);
