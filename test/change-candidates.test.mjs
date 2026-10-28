import test from 'node:test';import assert from 'node:assert/strict';
import {inspectMovement,generateCandidates,validateQueue,category} from '../tools/change-candidates.mjs';
import {WATCHED} from '../tools/sync-source-observations.mjs';
const A='a'.repeat(40),B='b'.repeat(40),T='2026-10-28T18:55:00Z';
const obs=(sha)=>({schema:'static-collective/source-observations-v1',scannedAt:T,
 sources:WATCHED.map(w=>({repo:w.repo,ref:'main',status:'OBSERVED_HEAD',sha}))});
const compare=new Response(JSON.stringify({status:'ahead',base_commit:{sha:A},merge_base_commit:{sha:A},
 total_commits:1,commits:[{sha:B}],files:[
 {filename:'docs/JUBILEE.md',status:'modified'},
 {filename:'src/worker.mjs',status:'modified'},
 {filename:'test/worker.test.mjs',status:'added'}]}));
const mock=async(url)=>{assert.match(url,/^https:\/\/api\.github\.com\/repos\/the-static-collective\//);return new Response(await compare.clone().text())};
test('categorize file paths, not commit messages or user assertions',()=>{
 assert.equal(category('docs/JUBILEE.md'),'DOCUMENTATION');assert.equal(category('test/worker.test.mjs'),'TESTS');
 assert.equal(category('src/worker.mjs'),'SOURCE_CODE');assert.equal(category('.github/workflows/build.yml'),'CONFIGURATION');
});
test('bounded fast-forward becomes pending-review filenames, never automatically admitted work',async()=>{
 const r=await inspectMovement('webZ',A,B,T,{fetcher:mock});
 assert.equal(r.state,'PENDING_REVIEW');assert.equal(r.admission,'NOT_ADMITTED');assert.equal(r.totalFiles,3);
 assert.equal(r.files.length,3);assert.equal(r.categoryCounts.DOCUMENTATION,1);
 assert.equal(r.categoryCounts.TESTS,1);
 assert.ok(!JSON.stringify(r).includes('partner confirmed'));
});
test('only actually moved observed heads produce candidates; repeated scans deduplicate',async()=>{
 const baseline=obs(A),next=obs(A);next.sources[0].sha=B;
 const first=await generateCandidates({previous:baseline,current:next,fetcher:mock});
 assert.equal(first.candidates.length,1);assert.equal(first.candidates[0].repo,'webZ');
 const again=await generateCandidates({previous:baseline,current:next,queue:first,fetcher:()=>{throw Error('must not refetch')}});
 assert.equal(again.candidates.length,1);validateQueue(again);
});
test('failed, diverged, truncated and invalid API response HOLD, never false code facts',async()=>{
 for(const reply of [
  new Response('maintenance',{status:503}),
  new Response(JSON.stringify({status:'diverged',base_commit:{sha:A},merge_base_commit:{sha:A},total_commits:1,files:[]})),
  new Response(JSON.stringify({status:'ahead',base_commit:{sha:A},merge_base_commit:{sha:A},total_commits:1,files:new Array(60).fill({filename:'foo.js',status:'modified'})})),
  new Response(JSON.stringify({status:'ahead',base_commit:{sha:A},merge_base_commit:{sha:A},total_commits:1,files:[{filename:'../secrets',status:'modified'}]}))
 ]){
  const r=await inspectMovement('webZ',A,B,T,{fetcher:async()=>reply});
  assert.equal(r.state,'HOLD_COMPARE');assert.equal(r.files.length,0);
 }
});
test('unobserved or held sources never become candidate movements',async()=>{
 const prev=obs(A),next=obs(B);next.sources[0].status='HOLD';next.sources[0].sha=null;
 const result=await generateCandidates({previous:prev,current:next,fetcher:()=>{throw Error('no fetch')}});
 assert.equal(result.candidates.length,0);
});
