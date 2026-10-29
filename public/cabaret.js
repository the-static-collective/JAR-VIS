const $=id=>document.getElementById(id);
const form=$('ask'),question=$('question'),status=$('status'),stage=$('stage');
let csrf=null,last=null,variant=0,flipTimer=null,audioContext=null,oscillators=[];
const text=(tag,value,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e};
const button=(label,action)=>{const b=text('button',label);b.type='button';b.addEventListener('click',action);return b};
function stop() {
 clearInterval(flipTimer);flipTimer=null;
 for(const o of oscillators){try{o.stop()}catch{}}
 oscillators=[];
 if(audioContext){audioContext.close().catch(()=>{});audioContext=null}
 const disk=document.querySelector('.record');if(disk)disk.classList.remove('playing');
}
async function api(path,payload){
 if(!csrf){const res=await fetch('/api/state',{cache:'no-store'});if(!res.ok)throw Error('LOCAL_CSRF_UNAVAILABLE');csrf=(await res.json()).csrfToken}
 const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':csrf},body:JSON.stringify(payload)});
 const body=await response.json();
 if(!response.ok)throw Error(body.error||'LOCAL_CABARET_HOLD');
 return body;
}
function mode(){return form.querySelector('input[name=mode]:checked').value}
function currentRequest(){return {question:question.value,mode:mode(),variant}}
function renderRadio(media){
 const root=text('div','','scene radio');
 const art=text('div','','art'),record=text('div','','record');
 record.append(text('span','GHOST\nRADIO\n92 BPM'));art.append(record);
 const details=text('div','','lyrics');details.append(text('h3','SIX-EIGHT STATIC • ORIGINAL LOCAL INSTRUMENTAL'));
 details.append(text('p',media.lyrics.join('\n')));
 const play=button('▶ PLAY THE GHOST SYNTH',async()=>{
  stop();
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context){status.textContent='HOLD: NO BROWSER WEB AUDIO SUPPORT';return}
  try{
   audioContext=new Context();await audioContext.resume();
   const bpm=media.bpm,base=audioContext.currentTime+.06;
   const duration=60/bpm;
   const master=audioContext.createGain();master.gain.value=.16;master.connect(audioContext.destination);
   for(const step of media.melody){
    const o=audioContext.createOscillator(),g=audioContext.createGain();
    o.type=step.note%3===0?'triangle':'sine';
    o.frequency.value=220*Math.pow(2,step.note/12);
    o.connect(g);g.connect(master);
    const start=base+step.beat*duration,end=start+step.length*duration;
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(.8,start+.025);
    g.gain.exponentialRampToValueAtTime(.0001,end);
    o.start(start);o.stop(end+.01);oscillators.push(o);
   }
   record.classList.add('playing');
   status.textContent='LOCAL WEB AUDIO PLAYBACK · NOT A REAL HAUNTED TOASTER RENDER';
   window.setTimeout(()=>{record.classList.remove('playing')},9500);
  }catch(e){status.textContent='HOLD: AUDIO UNAVAILABLE';stop()}
 });
 details.append(play,button('■ STOP',()=>{stop();status.textContent='AUDIO STOPPED'}));
 root.append(art,details);root.append(text('p',media.limit,'annotation'));return root;
}
function renderManga(media){
 const root=text('div','','scene'),grid=text('div','','manga');
 const glyphs=['♠','★','◉','♫'];
 for(const panel of media.panels){
  const e=text('article','','panel-comic');
  e.append(text('h4',panel.caption),text('div',glyphs[panel.decor]||'★','visual'),text('p',panel.description),text('blockquote',panel.bubble));
  grid.append(e);
 }
 root.append(grid,text('p',media.limit,'annotation'));return root;
}
function renderFlipbook(media){
 const root=text('div','','scene'),flip=text('div','','flip'),frame=text('div','','frame'),controls=text('div','','flip-controls');
 let index=0;const draw=()=>{frame.replaceChildren(text('small','FRAME '+media.frames[index].code+' / '+String(media.frames.length-1).padStart(2,'0')),text('b',media.frames[index].line));};
 function pause(){clearInterval(flipTimer);flipTimer=null;run.textContent='▶ PLAY FLIPBOOK'}
 const run=button('▶ PLAY FLIPBOOK',()=>{if(flipTimer){pause();return}
   index=0;draw();run.textContent='Ⅱ PAUSE FLIPBOOK';
   flipTimer=setInterval(()=>{if(index===media.frames.length-1){pause();return}index++;draw()},500);
 });
 controls.append(run,button('← FRAME',()=>{pause();index=(index-1+media.frames.length)%media.frames.length;draw()}),
 button('FRAME →',()=>{pause();index=(index+1)%media.frames.length;draw()}));
 draw();flip.append(frame);root.append(flip,controls,text('p',media.limit,'annotation'));return root;
}
function render(payload){
 stop();last=payload;const {creative,passport}=payload;
 $('result').hidden=false;
 $('modeTag').textContent='TRANSMISSION '+creative.stamp+' / '+creative.mode.toUpperCase()+' / VARIANT '+creative.variant;
 $('answerTitle').textContent=creative.title;
 stage.replaceChildren(creative.mode==='song'?renderRadio(creative.media):creative.mode==='manga'?renderManga(creative.media):renderFlipbook(creative.media));
 $('grounded').textContent=creative.answer.text;
 $('passportText').textContent=JSON.stringify(passport,null,2);
 status.textContent='DELIVERED: '+creative.mode.toUpperCase()+' · CREATIVE EXPRESSION ONLY · NO EXTERNAL EFFECT';
 $('verify').disabled=false;
 $('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
async function ask(){
 const payload=currentRequest();
 if(!payload.question.trim()){status.textContent='ASK A QUESTION FIRST';return}
 $('askButton').disabled=true;status.textContent='THE COWBOY IS CONSULTING HIS LITTLE RULE BOOK…';
 try{render(await api('/api/cabaret/ask',payload))}
 catch(e){status.textContent='HOLD: '+e.message}
 finally{$('askButton').disabled=false}
}
form.addEventListener('submit',e=>{e.preventDefault();variant=0;ask()});
$('reroll').addEventListener('click',()=>{variant=(variant+1)%100;ask()});
$('download').addEventListener('click',()=>{
 if(!last)return;const data=JSON.stringify(last.passport,null,2)+'\n';
 const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='jarvis-stranger-passport-'+last.creative.stamp+'.json';
 a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('readPassport').addEventListener('click',()=>{$('passportDetails').open=!$('passportDetails').open});
$('print').addEventListener('click',()=>{$('passportDetails').open=true;window.print()});
$('verify').addEventListener('click',async()=>{
 if(!last){$('verification').textContent='HOLD: ASK A QUESTION FIRST';return}
 const file=$('ledger').files[0];if(!file){$('verification').textContent='HOLD: CHOOSE A LOCAL JSON LEDGER';return}
 if(file.size>12*1024){$('verification').textContent='HOLD: LEDGER EXCEEDS LOCAL 12 KB LIMIT';return}
 let ledger;
 try{ledger=JSON.parse(await file.text())}catch{$('verification').textContent='HOLD: INVALID LEDGER JSON';return}
 $('verify').disabled=true;$('verification').textContent='SOURCE-LOCKED STRUCTURAL CHECK IN PROGRESS…';
 try{
  const response=await api('/api/cabaret/passport',{...currentRequest(),ledger});
  render(response);
  $('verification').textContent='STRUCTURAL CHECK RETURNED: '+response.verification.stage+' / '+response.verification.disposition+' (NOT AUTHENTICATED HUMAN PROOF)';
  $('passportDetails').open=true;
 }catch(e){$('verification').textContent='HOLD: '+e.message}
 finally{$('verify').disabled=false}
});
window.addEventListener('pagehide',stop);
