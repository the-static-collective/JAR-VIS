// Mobile-first operator porch, with NO private data or secret embedded.
// Credentials are kept in tab memory; never stored in URL or localStorage.
export const page=String.raw\`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>JAR;VIS Operator Porch</title>
<style>
:root{color-scheme:dark;font:16px system-ui;background:#101b16;color:#e7efe2}*{box-sizing:border-box}
body{margin:0}main{max-width:900px;margin:auto;padding:26px 16px 80px}
header{padding:12px 0 20px;border-bottom:1px solid #526951}
h1{font-size:clamp(2rem,8vw,3.1rem);margin:6px 0}h2{font-size:1.3rem;color:#e5dbad}
small,.muted{color:#bacbbb}section{border:1px solid #415a47;background:#1b2a21;border-radius:16px;padding:18px;margin:20px 0}
input{display:block;width:100%;padding:13px;background:#102016;border:1px solid #71856d;color:white;border-radius:9px;margin:10px 0}
button{background:#486448;border:1px solid #94af82;color:#fff;font:inherit;padding:11px 14px;border-radius:9px;cursor:pointer;margin:4px 9px 4px 0}
button:disabled{opacity:.5}.item{border-top:1px solid #3f5946;padding:14px 0;overflow-wrap:anywhere}
.item:first-child{border-top:0}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}
.status{color:#c7d8af}p{line-height:1.55}
[hidden]{display:none!important}
</style></head><body><main><header>
<small>THE STATIC COLLECTIVE / BACKEND 007 / SYNTHETIC ONLY</small>
<h1>JAR;VIS Operator Porch</h1><p>See what is waiting. Decide what to approve. Inspect what returned.</p>
</header><section><h2>Operator access</h2>
<p class="muted">Enter your private operator key. It stays in this tab's memory, never in a URL.</p>
<form id="auth"><input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="jv7_…" required>
<button type="submit">Open operator panel</button><button type="button" id="lock">Lock</button></form>
<p class="status" id="auth-state">Locked; no private records loaded.</p></section>
<div id="private" hidden>
<section><h2>Queue</h2><p id="counts"></p><button id="refresh">Refresh</button><p class="status" id="notice"></p></section>
<section><h2>New fictional task</h2><p class="muted">A proposal starts HELD. Nothing executes until you explicitly approve it.</p>
<form id="create"><input id="label" type="text" maxlength="140" placeholder="Count twelve imaginary vegetable boxes" required>
<button type="submit">Record HELD task</button></form></section>
<section><h2>Decisions</h2><div id="jobs"></div></section>
<section><h2>Receipt trail</h2><div id="receipts"></div></section>
</div><footer class="muted">Attention is not authority. Return is not admission. Fictional tasks only; no contact, publication, or external delivery.</footer>
</main><script defer src="/functions/v1/jarvis-operator-007/ui.js"></script></body></html>\`;
export const client=String.raw\`'use strict';
(()=>{let access='';
const get=id=>document.getElementById(id);
const element=(tag,text)=>{const e=document.createElement(tag);e.textContent=String(text??'');return e;};
async function send(action,args={}){
 const resp=await fetch('/functions/v1/jarvis-operator-007',{method:'POST',credentials:'omit',cache:'no-store',
 headers:{'Authorization':'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({action,...args})});
 const out=await resp.json();if(!resp.ok||!out.ok)throw Error(out.reason||'Service unavailable');return out.data;
}
const clear=()=>{access='';get('key').value='';get('private').hidden=true;get('jobs').replaceChildren();
 get('receipts').replaceChildren();get('auth-state').textContent='Locked; no private records loaded.';};
const render=data=>{
 const c=data.summary||{};get('counts').textContent='HELD '+(c.held||0)+' · READY '+(c.ready||0)+' · LEASED '+(c.leased||0)+' · RETURNED '+(c.returned||0)+' · RECEIPTS '+(c.receiptCount||0);
 const target=get('jobs');target.replaceChildren();
 for(const j of data.jobs||[]){
  const row=element('article','');row.className='item';row.append(element('strong',j.label));
  row.append(element('p',j.status+' · attempts '+j.attempts+' · '+j.id));
  if(j.worker)row.append(element('p','Worker '+j.worker));
  if(j.result)row.append(element('pre',JSON.stringify(j.result,null,2)));
  if(j.status==='HELD'){
   const button=element('button','Approve fictional work');button.type='button';
   button.addEventListener('click',async()=>{
    if(!confirm('Approve this FICTIONAL task for a synthetic worker?'))return;
    button.disabled=true;
    try{const out=await send('admit',{id:j.id});get('notice').textContent=out.ok?'Approved for synthetic execution.':'No change: '+out.reason;await refresh();}
    catch(e){get('notice').textContent=e.message;}finally{button.disabled=false;}
   });row.append(button);
  }target.append(row);
 }
 if(!(data.jobs||[]).length)target.append(element('p','No queued tasks.'));
 const rec=get('receipts');rec.replaceChildren();
 for(const r of data.receipts||[]){const p=element('div','');p.className='item';
  p.append(element('strong','#'+r.seq+' · '+r.kind));p.append(element('p',r.at+' · '+r.jobId));rec.append(p);}
 if(!(data.receipts||[]).length)rec.append(element('p','No receipts.'));
};
async function refresh(){try{render(await send('view'));get('notice').textContent='Live queue loaded.';}
 catch(e){get('notice').textContent=e.message;}}
get('auth').addEventListener('submit',async ev=>{ev.preventDefault();access=get('key').value.trim();get('key').value='';
 try{render(await send('view'));get('private').hidden=false;get('auth-state').textContent='Operator access accepted for this tab.';}
 catch(e){clear();get('auth-state').textContent='Unable to open: '+e.message;}});
get('lock').addEventListener('click',clear);get('refresh').addEventListener('click',refresh);
get('create').addEventListener('submit',async ev=>{ev.preventDefault();
 const label=get('label').value.trim();if(!label)return;
 const buf=crypto.getRandomValues(new Uint8Array(12));
 const key='fixture:panel-'+Array.from(buf,x=>x.toString(16).padStart(2,'0')).join('');
 try{const result=await send('enqueue',{key,label});get('label').value='';get('notice').textContent='Stored as '+result.status+'.';await refresh();}
 catch(e){get('notice').textContent=e.message;}
});
})();\`;
