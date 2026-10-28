import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../commons/recent-work-v1.json',import.meta.url),'utf8'));
const states=new Set(['PUBLIC_PROTOTYPE','RESEARCH_PROPOSAL','DOCUMENTED_IMPLEMENTATION','DOCUMENTED_PROTOCOL','LOCAL_OPERATOR_PROTOTYPE']);
const publicHosts=new Set(['apps.abundent.org','garden.abundent.org','night.abundent.org','postoffice.abundent.org','becoming.abundent.org','webz-field-porch-theotherlucasv-1250s-projects.vercel.app','github.com']);
test('JARVIS public field registry is bounded, versioned and source pinned',()=>{
 assert.equal(data.schema,'static-collective/recent-work-feed-v1');
 assert.match(data.release,/^RECENT-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}$/);
 assert.ok(data.entries.length>10&&data.entries.length<=24);
 assert.equal(new Set(data.entries.map(x=>x.id)).size,data.entries.length);
 for(const e of data.entries){
  assert.ok(states.has(e.state));assert.ok(e.title.length>=8&&e.title.length<=100);
  assert.ok(e.summary.length>=40&&e.summary.length<=400);
  assert.ok(e.firstCheck.length>=20&&e.firstCheck.length<=220);
  assert.ok(Array.isArray(e.tags)&&e.tags.length>=3&&e.tags.length<=20);
  for(const tag of e.tags)assert.match(tag,/^[a-z0-9'-]{2,30}$/);
  const source=new URL(e.source),parts=source.pathname.split('/').filter(Boolean);
  assert.equal(source.protocol,'https:');assert.equal(source.hostname,'github.com');
  assert.equal(parts[0],'the-static-collective');assert.equal(parts[2],'blob');
  assert.match(parts[3],/^[a-f0-9]{40}$/);assert.ok(parts.length>=5);
  const u=new URL(e.publicUrl);assert.equal(u.protocol,'https:');
  assert.ok(publicHosts.has(u.hostname));assert.ok(!u.username&&!u.password&&!u.search&&!u.hash);
 }
});
test('newest crossing and neighboring work cannot be labeled as established partner programs',()=>{
 for(const id of ['JUBILEE-001','PORCHLIGHT-001','GARDEN-001','COALITION-001']){
  const e=data.entries.find(v=>v.id===id);
  assert.ok(e);assert.ok(['PUBLIC_PROTOTYPE','RESEARCH_PROPOSAL'].includes(e.state));
 }
});
