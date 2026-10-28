import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../commons/recent-work-v1.json',import.meta.url),'utf8'));
const states=new Set(['PUBLIC_PROTOTYPE','RESEARCH_PROPOSAL','DOCUMENTED_IMPLEMENTATION','DOCUMENTED_PROTOCOL','LOCAL_OPERATOR_PROTOTYPE']);
test('JARVIS public field registry is bounded, versioned and source pinned',()=>{
 assert.equal(data.schema,'static-collective/recent-work-feed-v1');
 assert.match(data.release,/^RECENT-\\d{4}-\\d{2}-\\d{2}-\\d{3}$/);
 assert.ok(data.entries.length>10&&data.entries.length<=24);
 assert.equal(new Set(data.entries.map(x=>x.id)).size,data.entries.length);
 for(const e of data.entries){
  assert.ok(states.has(e.state));assert.ok(e.title.length>=8&&e.title.length<=100);
  assert.ok(e.summary.length>=40&&e.summary.length<=400);
  assert.ok(e.firstCheck.length>=20&&e.firstCheck.length<=220);
  assert.ok(Array.isArray(e.tags)&&e.tags.length>=3&&e.tags.length<=20);
  for(const t of e.tags)assert.match(t,/^[a-z0-9'-]{2,30}$/);
  assert.match(e.source,/^https:\\/\\/github\\.com\\/the-static-collective\\/[A-Za-z0-9.-]+\\/blob\\/[a-f0-9]{40}\\/[A-Za-z0-9_./-]+$/);
  const u=new URL(e.publicUrl);assert.equal(u.protocol,'https:');assert.match(u.hostname,/^(?:apps|garden|night|postoffice|becoming)\\.abundent\\.org$|^webz-field-porch-theotherlucasv-1250s-projects\\.vercel\\.app$|^github\\.com$/);
 }
});
test('newest crossing and neighboring work cannot be labeled as established partner programs',()=>{
 for(const id of ['JUBILEE-001','PORCHLIGHT-001','GARDEN-001','COALITION-001']){
  const e=data.entries.find(v=>v.id===id);assert.ok(e);assert.ok(['PUBLIC_PROTOTYPE','RESEARCH_PROPOSAL'].includes(e.state));
 }
});
