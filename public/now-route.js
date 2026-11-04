// Fictional localhost demonstration: no accounts, messaging, notification or GPS.
const zones={
  center:{lat:44.077,lon:-93.507},
  north:{lat:44.084,lon:-93.5},
  far:{lat:44.27,lon:-93.51}
};
let csrf='',state=null;
const $=id=>document.getElementById(id);
const text=(tag,value,className='')=>{
  const node=document.createElement(tag);
  node.textContent=String(value);
  if(className)node.className=className;
  return node;
};
function button(label,fn,className=''){
  const b=text('button',label,className);b.type='button';
  b.addEventListener('click',async()=>{
    b.disabled=true;
    try{await fn();await refresh();$('status').textContent='Local state updated.';}
    catch(e){$('status').textContent=e.message;}
    finally{b.disabled=false;}
  });
  return b;
}
function record(item,summary,sub,warning=false){
  const box=document.createElement('article');box.className='record';
  box.append(text('span',item.id+' · '+item.state,'tag'+(warning?' warn':'')));
  box.append(text('p',summary));
  box.append(text('p',sub,'small'));
  return box;
}
async function api(path,payload) {
  const response=await fetch('/api/now-route/'+path,{
    method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':csrf},body:JSON.stringify(payload)
  });
  const data=await response.json();
  if(!response.ok)throw Error(data.error || 'Request held.');
  return data;
}
async function refresh(){
  const res=await fetch('/api/now-route/state',{cache:'no-store'});
  if(!res.ok)throw Error('Local route unavailable.');
  state=await res.json();csrf=state.csrfToken;
  render();
}
function render(){
  for(const id of ['offers','needs','suggestions','routes'])$(id).replaceChildren();
  if(state.offers.length===0)$('offers').append(text('p','No offers yet.','small'));
  for(const o of state.offers){
    const box=record(o,o.description,o.kind+' · '+o.expiresInMinutes+' min left · '+o.radiusMiles+' mile radius'+
      (o.safety!=='NOT_APPLICABLE'?' · '+o.safety:''),o.state==='HOLD_SAFETY');
    $('offers').append(box);
  }
  if(state.needs.length===0)$('needs').append(text('p','No opted-in needs yet.','small'));
  for(const n of state.needs){
    $('needs').append(record(n,n.description,n.kind+' · self-estimated pickup '+(n.estimatedTravelMinutes??'?')+' min'));
  }
  let count=0;
  for(const [offerId,suggestions] of Object.entries(state.suggestions)){
    for(const s of suggestions){
      count++;
      const box=record({id:offerId,state:'POSSIBLE_MATCH'},'A nearby '+s.kind+' need could receive this gift.',
        'Approx. '+s.distanceMiles+' miles · self-estimated pickup '+s.estimatedTravelMinutes+' min · no identity shared');
      box.append(button('Offer to '+s.needId,()=>api('propose',{offerId,needId:s.needId})));
      $('suggestions').append(box);
    }
  }
  if(!count)$('suggestions').append(text('p','No currently eligible suggestions. Try adding a nearby opted-in need, or review any HOLD.','small'));
  for(const r of state.routes){
    const box=record({id:r.id,state:r.state},'Offer '+r.offerId+' → '+r.needId,
      'No automatic contact or delivery. Actions below simulate independent human consent.');
    if(r.state==='OFFERED'){
      box.append(button('Recipient: accept',()=>api('respond',{routeId:r.id,needId:r.needId,accept:true})));
      box.append(document.createTextNode(' '));
      box.append(button('Recipient: decline',()=>api('respond',{routeId:r.id,needId:r.needId,accept:false}),'quiet'));
    } else if(r.state==='ACCEPTED'){
      box.append(button('Donor: report handoff',()=>api('report',{routeId:r.id,offerId:r.offerId})));
    } else if(r.state==='REPORTED'){
      box.append(button('Recipient: confirm receipt',()=>api('confirm',{routeId:r.id,needId:r.needId})));
    }
    $('routes').append(box);
  }
}
$('offer').addEventListener('submit',async event=>{
  event.preventDefault();
  const f=new FormData(event.target);
  try{
    const created=await api('offer',{
      description:f.get('description'),location:zones[f.get('zone')],
      expiresMinutes:Number(f.get('expiresMinutes')),radiusMiles:Number(f.get('radiusMiles')),
      coldChainAttested:f.has('coldChainAttested')
    });
    await refresh();
    $('status').textContent=created.state==='HOLD_SAFETY'?'Offer held: food handling cannot be assumed.':'Local offer added.';
  }catch(e){$('status').textContent=e.message;}
});
$('need').addEventListener('submit',async event=>{
  event.preventDefault();
  const f=new FormData(event.target);
  try{
    await api('need',{
      description:f.get('description'),location:zones[f.get('zone')],
      allowMatching:f.has('allowMatching'),canPickup:true,
      estimatedTravelMinutes:Number(f.get('estimatedTravelMinutes')),expiresMinutes:120,maxMiles:5
    });
    await refresh();$('status').textContent='Opted-in local need added.';
  }catch(e){$('status').textContent=e.message;}
});
$('sample').addEventListener('click',async()=>{
  try{
    await api('reset',{});
    await api('offer',{description:'Extra fish, safely kept cold, available for free',
      location:zones.center,expiresMinutes:45,radiusMiles:5,coldChainAttested:true});
    await api('need',{description:'We could use groceries today',location:zones.north,
      allowMatching:true,canPickup:true,estimatedTravelMinutes:12,expiresMinutes:120,maxMiles:5});
    await refresh();$('status').textContent='FICTIONAL SAMPLE: nearby need recognized. Choose Offer to route it.';
  }catch(e){$('status').textContent=e.message;}
});
$('reset').addEventListener('click',async()=>{try{await api('reset',{});await refresh();$('status').textContent='In-memory sample cleared.';}catch(e){$('status').textContent=e.message;}});
refresh().catch(e=>{$('status').textContent=e.message;});
setInterval(()=>refresh().catch(()=>{}),2500);
