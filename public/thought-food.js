// The browser only asks localhost for fixed public creative references.
const $=id=>document.getElementById(id);
let csrf=null,last=null;
const tell=v=>$('status').textContent=v;
async function boot(){
 try{
  const [state,catalog]=await Promise.all([
   fetch('/api/state').then(x=>x.json()),
   fetch('/api/thought-food/catalog').then(x=>x.json())
  ]);
  csrf=state.csrfToken;
  if(catalog.schema!=='jarvis.thought-food-catalog/v1')throw Error('Unexpected catalog');
  for(const s of catalog.sources){
   const card=document.createElement('label');card.className='card';
   const input=document.createElement('input');input.type='checkbox';input.name='source';input.value=s.id;
   input.checked=['six-movies','machine-book','festival-fork'].includes(s.id);
   const name=document.createElement('b');name.textContent=s.title+' · '+s.kind;
   const observed=document.createElement('span');observed.textContent=s.observed;
   const caveat=document.createElement('small');caveat.textContent=s.guard;
   card.append(input,name,observed,caveat);$('sources').append(card);
  }
 }catch(err){tell('Local JAR;VIS catalog unavailable. '+String(err));$('compose').disabled=true;}
}
$('compose').addEventListener('click',async()=>{
 last=null;$('save').disabled=true;$('compose').disabled=true;
 const ids=[...document.querySelectorAll('input[name="source"]:checked')].map(x=>x.value);
 try{
  const res=await fetch('/api/thought-food/compile',{method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':csrf},
   body:JSON.stringify({ids,purpose:$('purpose').value})});
  const result=await res.json();if(!res.ok)throw Error(result.error||'HOLD');
  last=result.packet;$('proof').textContent=JSON.stringify(last,null,2);
  const ideas=$('ideas');ideas.replaceChildren();
  for(const c of last.payload.crossings){
   const block=document.createElement('article');block.className='idea';
   const heading=document.createElement('strong');heading.textContent=c.pair.join(' × ');
   const text=document.createElement('p');text.textContent=c.question;
   const next=document.createElement('small');next.textContent=c.concreteNextStep;
   block.append(heading,text,next);ideas.append(block);
  }
  $('save').disabled=false;tell('Held question packet created locally; no native films/books rendered, no contact, grant or deployment.');
 }catch(err){$('ideas').replaceChildren();$('proof').textContent='HOLD';tell(String(err));}
 finally{$('compose').disabled=false;}
});
$('save').addEventListener('click',()=>{
 if(!last)return;
 const blob=new Blob([JSON.stringify(last,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='jarvis-thought-food-001-HOLD.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 tell('Public-only source-linked idea packet saved to this device. It was not published or sent.');
});
boot();
