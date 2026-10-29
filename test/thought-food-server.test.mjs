import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startWorkbenchServer} from '../src/server.mjs';
test('Native local JAR;VIS workbench serves public creative thought-food and refuses inflated action',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'thought-food-server-'));
 const app=await startWorkbenchServer({journalPath:join(dir,'journal.jsonl'),port:0,cannonPath:null});
 try{
  const state=await (await fetch(app.url+'/api/state')).json();
  const cat=await fetch(app.url+'/api/thought-food/catalog').then(x=>x.json());
  assert.equal(cat.sources.length,6);assert.equal(cat.mode,'PUBLIC_IDEAS_ONLY_NO_MEDIA_CUSTODY');
  const page=await fetch(app.url+'/thought-food');assert.equal(page.status,200);
  assert.match(await page.text(),/Feed the thought furnace/);
  const post=(body,csrf=state.csrfToken)=>fetch(app.url+'/api/thought-food/compile',{
   method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':csrf},body:JSON.stringify(body)
  });
  assert.equal((await post({ids:['six-movies','machine-book'],purpose:'SECOND_TABLE'},'wrong')).status,403);
  assert.equal((await post({ids:['six-movies','machine-book'],purpose:'SECOND_TABLE',publish:true})).status,400);
  assert.equal((await post({ids:['six-movies','six-movies'],purpose:'SECOND_TABLE'})).status,422);
  const good=await post({ids:['six-movies','machine-book','festival-fork'],purpose:'SECOND_TABLE'});
  assert.equal(good.status,200);
  const result=await good.json();
  assert.equal(result.packet.payload.crossings.length,3);
  assert.equal(result.externalDispatch,false);assert.equal(result.mediaRightsGranted,false);
  assert.equal(result.humanSuccessVerified,false);
  assert.equal(result.packet.payload.applicationSubmitted,false);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
test('Public JAR;VIS thought-food user interface cannot invoke any external send or data stash',()=>{
 const html=readFileSync(new URL('../public/thought-food.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/thought-food.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(html,/second table/i);assert.match(index,/href="\/thought-food"/);
 assert.doesNotMatch(js,/localStorage|sendBeacon|sessionStorage|https?:\/\//i);
 assert.match(js,/api\/thought-food\/compile/);
});
