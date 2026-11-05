import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {investigateDesk,verifyOriginalOrgans,suggestInvestigationProviders,
 listPublicInvestigationProviders} from '../src/investigation-desk.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const question='Which books explain ancient history and philosophy?';
const sample=(question,scopes)=>({question,scopes,deep:false,depth:2});
function transports({crossrefDown=false}={}){
 const calls=[];
 const transport=async (url,options)=>{
  const u=new URL(url);
  calls.push({url:u.href,host:u.hostname,method:options.method});
  assert.equal(options.method,'GET');
  if(u.hostname==='openlibrary.org')
   return {ok:true,status:200,redirected:false,json:async()=>({docs:[
    {key:'/works/OL90909W',title:'Philosophy of the Ancient World',
     author_name:['Test Librarian'],first_publish_year:1934}
   ]})};
  if(u.hostname==='api.crossref.org')
   return {ok:!crossrefDown,status:crossrefDown?503:200,redirected:false,
    json:async()=>({message:{items:[
     {DOI:'10.5678/ancient',title:['Archaeological Evidence in Antiquity'],
      published:{'date-parts':[[2018]]}}
    ]}})};
  if(u.hostname==='www.ebi.ac.uk')
   return {ok:true,status:200,redirected:false,json:async()=>({resultList:{result:[
    {id:'98765',source:'MED',title:'Clinical genetics',doi:'10.4433/medical',pubYear:'2020'}
   ]}})};
  if(u.hostname==='api.github.com')
   return {ok:true,status:200,redirected:false,json:async()=>({items:[
    {private:false,full_name:'verified/public-project',description:'Open-source evidence tools'},
    {private:true,full_name:'hidden/private-project'}
   ]})};
  throw Error('Unexpected external destination: '+u.hostname);
 };
 return {calls,transport};
}
test('eighth donor is byte-pinned, new public research provider inventory contains seven',()=>{
 const manifest=verifyOriginalOrgans();
 assert.equal(manifest.source_count,15);
 assert.equal(manifest.source_organs_exact_pinned,true);
 const providers=listPublicInvestigationProviders();
 assert.equal(providers.length,7);
 assert.ok(providers.some(x=>x.id==='githubglobal'&&x.existing===false));
 assert.ok(providers.some(x=>x.id==='openlibrary'));
});
test('source recommendations use question content but absolutely no remote calls',()=>{
 const books=suggestInvestigationProviders(question);
 const code=suggestInvestigationProviders('Which software repositories contain executable source code?');
 const medical=suggestInvestigationProviders('Which clinical biomedical papers study genetic disease?');
 assert.ok(books.recommended.includes('openlibrary'));
 assert.ok(code.recommended.includes('githubglobal'));
 assert.ok(medical.recommended.includes('europepmc'));
 assert.equal(books.no_remote_request,true);
 assert.equal(books.explicit_operator_source_selection_required,true);
 assert.notDeepEqual(books.recommended,code.recommended);
});
test('JAR;VIS can now search new books and DOI index without requiring GitHub or deep reasoning',async()=>{
 const m=transports();
 const r=await investigateDesk(sample(question,{openlibrary:true,crossref:true}),
  {transport:m.transport,now:()=> '2026-11-05T12:00:00Z'});
 assert.equal(r.schema,'jarvis.investigation-desk/v0');
 assert.equal(r.status,'PUBLIC_EVIDENCE_LEADS_AVAILABLE');
 assert.equal(r.public_research.status,'NOT_SELECTED');
 assert.equal(r.public_leads.length,2);
 assert.equal(r.public_leads[0].provider,'openlibrary');
 assert.ok(r.public_leads.some(x=>x.url.startsWith('https://doi.org/')));
 assert.equal(r.supplemental_research.status,'PUBLIC_INDEX_LEADS');
 assert.equal(r.motif_reasoning.status,'NOT_REQUESTED');
 assert.deepEqual(m.calls.map(x=>x.host),['openlibrary.org','api.crossref.org']);
 assert.equal(r.external_writes,0);
 assert.equal(r.source_custody_verified,false);
});
test('explicitly unselected providers receive zero requests even when recommended',async()=>{
 const m=transports();
 const r=await investigateDesk(sample(question,{openlibrary:true}),
  {transport:m.transport});
 assert.ok(r.provider_recommendations.recommended.includes('openlibrary'));
 assert.deepEqual(m.calls.map(x=>x.host),['openlibrary.org']);
 assert.equal(r.supplemental_research.providers_queried.length,1);
});
test('public index outage gives traceable failure without erasing other evidence',async()=>{
 const m=transports({crossrefDown:true});
 const r=await investigateDesk(sample(question,{crossref:true,openlibrary:true}),
  {transport:m.transport});
 assert.equal(r.status,'PUBLIC_EVIDENCE_LEADS_AVAILABLE');
 assert.ok(r.supplemental_research.failures.some(x=>x.provider==='crossref'));
 assert.ok(r.public_leads.some(x=>x.provider==='openlibrary'));
});
test('strict opt-in rejects private provider keys and >4 selections before any network traffic',async()=>{
 const m=transports();
 await assert.rejects(investigateDesk(sample(question,{drive:true}),{transport:m.transport}),
  /PUBLIC_SEARCH_OPT_IN_REQUIRED/);
 await assert.rejects(investigateDesk(sample(question,
  {github:true,wikipedia:true,scholarly:true,openlibrary:true,crossref:true}),
  {transport:m.transport}),/PUBLIC_SEARCH_OPT_IN_REQUIRED/);
 await assert.rejects(investigateDesk({...sample(question,{openlibrary:true}),deep:true},
  {transport:m.transport}),/MOTIF_NATIVE_REQUIRES/);
 assert.equal(m.calls.length,0);
});
test('source suggestions are local CSRF-protected; new providers accepted only by typed API',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jarvis-provider025-'));
 let srv;
 try{
  srv=await startWorkbenchServer({
   journalPath:join(dir,'events.jsonl'),port:0,
   investigationFn:async form=>({schema:'jarvis.investigation-desk/v0',
    scopes:form.scopes,status:'TEST_SOURCE_SELECTION_ONLY'})
  });
  const meta=await (await fetch(srv.url+'/api/investigate/meta')).json();
  assert.equal(meta.providers.length,7);
  assert.equal(meta.automatic_external_search,false);
  const form=sample(question,{openlibrary:true});
  const denied=await fetch(srv.url+'/api/investigate/suggest',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({question})});
  assert.equal(denied.status,403);
  const csrf=(await (await fetch(srv.url+'/api/state')).json()).csrfToken;
  const headers={'content-type':'application/json','x-jarvis-csrf':csrf};
  const suggest=await fetch(srv.url+'/api/investigate/suggest',{
   method:'POST',headers,body:JSON.stringify({question})});
  assert.equal(suggest.status,200);
  const recommendation=await suggest.json();
  assert.ok(recommendation.recommended.includes('openlibrary'));
  assert.equal(recommendation.no_remote_request,true);
  const selected=await fetch(srv.url+'/api/investigate',{
   method:'POST',headers,body:JSON.stringify(form)});
  assert.equal(selected.status,200);
  const accepted=await selected.json();
  assert.equal(accepted.scopes.openlibrary,true);
  const deniedPrivate=await fetch(srv.url+'/api/investigate',{
   method:'POST',headers,body:JSON.stringify(sample(question,{privateDrive:true}))});
  assert.equal(deniedPrivate.status,422);
  const page=await (await fetch(srv.url+'/investigate')).text();
  assert.match(page,/Find the right sources/);
  assert.match(page,/Europe PMC/);
  const js=await(await fetch(srv.url+'/investigate.js')).text();
  assert.match(js,/apply-suggestions/);
 }finally{if(srv)await srv.close();await rm(dir,{recursive:true,force:true})}
});
