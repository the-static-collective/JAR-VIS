// JAR;VIS public-source Investigation Desk.
// The browser speaks only to this user's local JAR;VIS server.
// All external search calls happen on the loopback service, with explicit scope.
(()=>{
 const $=id=>document.getElementById(id);
 const form=$('questionForm'),status=$('status'),button=$('run');
 let latest=null;
 const div=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  return el;
 };
 const safeUrl=url=>{
  try{
   const u=new URL(url);
   return u.protocol==='https:'&&
    ['github.com','en.wikipedia.org','openalex.org','doi.org'].includes(u.hostname)?u.href:null;
  }catch{return null}
 };
 const clear=el=>el.replaceChildren();
 const p=(text,cls)=>div('p',cls,text);
 const pretty=n=>Number(n||0).toLocaleString();
 function leadNode(item){
  const outer=div('article','lead');
  let title=item.title||'Public research lead';
  if(item.kind==='github_source')title=(item.repository||'Public source')+
   ' · '+(item.path||'document')+':'+item.line;
  const kind=item.kind==='github_source'?'GIT SOURCE · COMMIT & BLOB PINNED':
   item.kind==='research_index'?'SCHOLARLY INDEX · METADATA':
   'ENCYCLOPEDIA · INDEX RESULT';
  outer.append(div('div','kind',kind));
  const url=safeUrl(item.url);
  if(url){
   const a=div('a','',title);
   a.href=url;a.target='_blank';a.rel='noopener noreferrer';
   outer.append(a);
  }else outer.append(div('strong','',title));
  if(item.source_commit)outer.append(p('Source commit '+item.source_commit.slice(0,14)+
    ' · blob '+String(item.git_blob||'').slice(0,14)));
  if(item.year)outer.append(p('Publication year '+item.year));
  if(item.excerpt)outer.append(p(item.excerpt,'excerpt'));
  return outer;
 }
 function showWarnings(result){
  const box=$('warnings');clear(box);
  const e=result.public_research;
  const lines=[
   'Search scope is partial. Results are research leads, not verified independent testimony.'
  ];
  if(e.catalog&&e.catalog.enumerated)
   lines.push('GitHub public catalog: '+pretty(e.catalog.enumerated)+
    ' discovered; '+pretty(e.catalog.selected)+' repositories selected for file inspection.'+
    (e.catalog.complete?'':' More catalog pages may exist.'));
  if(e.results_truncated)
   lines.push('The results list was truncated by a fixed safety and attention budget.');
  for(const f of e.failures||[])
   lines.push('Source limitation ('+f.provider+
    (f.repository?' · '+f.repository:'')+'): '+f.status);
  for(const line of lines)box.append(p(line));
 }
 function renderPlan(r){
  const box=$('plan');clear(box);
  if(!r||r.status==='NOT_REQUESTED'){
   box.append(p('The extended MOTIF circuit was not requested. Eagle Eye source discovery has run independently. Enable “Run MOTIF’s reasoning circuit” for classical planning and executable source-review proposals.','empty'));
   return;
  }
  const first=r.first;
  if(!first||first.status!=='EXECUTED_FINITE_MOTIF_CAPABILITY'){
   const fail=div('div','card');
   fail.append(div('strong','',r.status||'MOTIF held its investigation'));
   fail.append(p('The source-owned MOTIF-023 reasoning chain could not establish a suitable research packet. Eagle Eye leads remain available independently.'));
   if(first?.packet?.errors?.length)fail.append(p('Some pinned source collections could not be verified.'));
   box.append(fail);return;
  }
  const phases=[['FIRST RESEARCH ROUND',r.first],['SECOND RESEARCH ROUND',r.second]];
  for(const [title,stage] of phases){
   const card=div('article','card');
   card.append(div('strong','',title));
   if(!stage||stage.status!=='EXECUTED_FINITE_MOTIF_CAPABILITY'){
    card.append(p('HOLD — this round did not yield an executable, source-checked candidate.'));
    box.append(card);continue;
   }
   const plan=stage.plan,obs=stage.observation;
   card.append(p('Classical plan: '+(plan.mode||'source review')+
    ' · declared cost '+(plan.total_declared_cost??'unavailable')+
    ' · '+pretty(stage.packet.sources?.length)+' public sources'));
   const ol=div('ol');
   for(const action of (plan.steps||[]).slice(0,10))ol.append(div('li','',action.replaceAll('_',' ').toLowerCase()));
   card.append(ol);
   card.append(p('Generated executable: '+(stage.compiled?.mode||'unknown')+
    ' · '+pretty(obs?.visible_source_location_count)+
    ' source locations · read-only review'));
   if(obs?.next_discriminating_question)
    card.append(p('Unresolved: '+obs.next_discriminating_question));
   box.append(card);
  }
  if(r.feedback_plan){
   const section=div('article','card');
   section.append(div('strong','','PLANNING AFTER OBSERVATION'));
   section.append(p('The second investigation was selected from observed gaps, not a prewritten answer.'));
   section.append(p('Next question: '+r.feedback_plan.next_question));
   box.append(section);
  }
 }
 function render(data){
  latest=data;
  $('result').hidden=false;
  const stats=$('stats');clear(stats);
  const e=data.public_research;
  for(const [value,label] of [
   [e.catalog?.enumerated||0,'PUBLIC REPOS IN CATALOG'],
   [e.catalog?.selected||0,'REPOS EXAMINED'],
   [e.source_documents?.reduce((n,s)=>n+s.documents.length,0)||0,'FILES VERIFIED'],
   [e.hits?.length||0,'RESEARCH LEADS']
  ]){
   const card=div('div','stat');card.append(div('strong','',pretty(value)));
   card.append(div('span','',label));stats.append(card);
  }
  showWarnings(data);
  const sources=$('sources');clear(sources);
  if(!e.hits?.length)sources.append(p('No verifiable public leads in this bounded search. Try another question, greater GitHub depth, or opt into another public provider.','empty'));
  else for(const hit of e.hits)sources.append(leadNode(hit));
  renderPlan(data.motif_reasoning);
  const next=$('next');clear(next);
  next.append(div('strong','','QUESTIONS WORTH ASKING NEXT'));
  for(const question of data.next_questions||[])next.append(p(question));
  $('download').disabled=false;
  $('result').scrollIntoView({behavior:'smooth',block:'start'});
 }
 async function getCsrf(){
  const response=await fetch('/api/state',{cache:'no-store'});
  if(!response.ok)throw Error('Local workbench unavailable');
  const state=await response.json();
  if(typeof state.csrfToken!=='string')throw Error('Local form protection unavailable');
  return state.csrfToken;
 }
 async function search(){
  const question=$('question').value.trim();
  const scopes={github:$('github').checked,wikipedia:$('wikipedia').checked,
   scholarly:$('scholarly').checked};
  if(!Object.values(scopes).some(Boolean))throw Error('Select at least one public search provider.');
  if($('deep').checked&&!scopes.github)
   throw Error('MOTIF’s two-round GitHub reasoning requires the GitHub provider to be selected.');
  const payload={question,scopes,depth:Number($('depth').value),deep:$('deep').checked};
  const csrf=await getCsrf();
  const response=await fetch('/api/investigate',{method:'POST',cache:'no-store',
   headers:{'content-type':'application/json','x-jarvis-csrf':csrf},
   body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'The public-source inquiry was held.');
  if(result.schema!=='jarvis.investigation-desk/v0')
   throw Error('Unrecognized source-research response');
  return result;
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  button.disabled=true;$('download').disabled=true;
  status.textContent='Checking public sources and preserving their origins…';
  try{
   const response=await search();
   render(response);
   status.textContent='Research packet ready. No external action or private-source search was performed.';
  }catch(error){
   status.textContent=error?.message||'The investigation was held.';
  }finally{button.disabled=false}
 });
 for(const sample of document.querySelectorAll('[data-question]')){
  sample.addEventListener('click',()=>{
   $('question').value=sample.dataset.question;
   $('question').focus();
  });
 }
 $('download').addEventListener('click',()=>{
  if(!latest)return;
  const content=JSON.stringify(latest,null,2);
  const blob=new Blob([content],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='jarvis-eagle-eye-'+String(latest.receipt_sha256||'packet').slice(0,12)+'.json';
  document.body.append(a);
  a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
 });
})();
