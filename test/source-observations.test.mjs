import test from 'node:test';import assert from 'node:assert/strict';
import {WATCHED,collect,validateSnapshot} from '../tools/sync-source-observations.mjs';
const SHA_A='a'.repeat(40),SHA_B='b'.repeat(40),NOW='2026-10-28T18:00:00Z';
const fake=(sha=SHA_A,date='2026-10-27T11:00:00Z')=>new Response(JSON.stringify({sha,commit:{committer:{date}}}),{status:200});
test('only explicitly approved public repositories are watched; self-commit loop is excluded',()=>{
 assert.ok(WATCHED.length>=10);assert.ok(!WATCHED.some(w=>w.repo==='JAR-VIS'));
 assert.ok(WATCHED.every(w=>w.ref==='main'&&w.tags.length>=2));
});
test('initial read is a source pointer observation, not work or partner proof',async()=>{
 const got=await collect({fetcher:async()=>fake(),now:()=>NOW});
 assert.equal(got.sources.length,WATCHED.length);assert.equal(got.events.length,0);
 assert.ok(got.sources.every(s=>s.status==='OBSERVED_HEAD'&&s.claim==='PUBLIC_REF_ONLY_NOT_CANON_OR_FIELD_EVIDENCE'));
 assert.ok(!JSON.stringify(got).includes('commitMessage'));validateSnapshot(got);
});
test('identical heads are not new completions, moved heads are distinct bounded events',async()=>{
 const old=await collect({fetcher:async()=>fake(),now:()=>NOW});
 const same=await collect({fetcher:async()=>fake(),previous:old,now:()=>NOW});
 assert.equal(same.events.length,0);
 const moved=await collect({fetcher:async(url)=>url.includes('/webZ/')?fake(SHA_B):fake(),previous:same,now:()=>NOW});
 assert.equal(moved.events.length,1);assert.equal(moved.events[0].kind,'REF_MOVED');
 assert.match(moved.events[0].meaning,/No execution/);assert.equal(moved.events[0].repo,'webZ');
});
test('unavailable and malicious source cannot be presented as a fresh success',async()=>{
 const old=await collect({fetcher:async()=>fake(),now:()=>NOW});
 const bad=await collect({fetcher:async(url)=>url.includes('/reLATTE/')?new Response('oh no',{status:503}):fake(),previous:old,now:()=>NOW});
 const hold=bad.sources.find(s=>s.repo==='reLATTE');assert.equal(hold.status,'HOLD');assert.equal(hold.sha,null);
 assert.equal(hold.lastKnownSha,SHA_A);assert.ok(!bad.events.some(e=>e.repo==='reLATTE'));
 const tampered=structuredClone(bad);tampered.sources[0].status='VERIFIED_COMPLETE';assert.throws(()=>validateSnapshot(tampered));
});
test('the feed cannot be steered to private or attacker-controlled repositories',async()=>{
 const paths=[];await collect({fetcher:async(url)=>{paths.push(url);return fake()},now:()=>NOW});
 assert.equal(new Set(paths).size,WATCHED.length);
 assert.ok(paths.every(url=>url.startsWith('https://api.github.com/repos/the-static-collective/')));
});
