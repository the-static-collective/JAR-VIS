import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../backend/edge/now-route-live/client.ts', import.meta.url),'utf8');
const edge = readFileSync(new URL('../backend/edge/now-route-live/index.ts', import.meta.url),'utf8');
const site = readFileSync(new URL('../backend/edge/now-route-live/site.ts', import.meta.url),'utf8');
const literal = source.match(/^export const CLIENT = ("[\s\S]*");\s*$/);
assert.ok(literal,'Edge client must be a standalone JSON-string literal');
const client = JSON.parse(literal[1]);
const start = client.indexOf('function buildWorkflowCartridge(');
const finish = client.indexOf('\nfunction saveWorkflowCartridge(',start);
assert.ok(start > -1 && finish > start,'pure method generator is present');
const generator = new Function(client.slice(start,finish)+';return buildWorkflowCartridge;')();

test('only a recipient-confirmed exchange can produce a reusable workflow',()=>{
 for(const state of ['PROPOSED','ACCEPTED','REPORTED','DISPUTED','DECLINED','CANCELED','EXPIRED','']) {
  assert.throws(()=>generator('food',state),/WORKFLOW_NOT_CONFIRMED/);
 }
 for(const category of ['perishable','milk','housing','','__proto__']) {
  assert.throws(()=>generator(category,'CONFIRMED'),/WORKFLOW_NOT_CONFIRMED/);
 }
 for(const category of ['food','tools','other']) {
  const card=generator(category,'CONFIRMED');
  assert.equal(card.schema,'jarvis.commons-workflow-cartridge/v1');
  assert.equal(card.category,category);
  assert.equal(card.type,'PORTABLE_METHOD_ONLY');
  assert.equal(card.execution,'HUMAN_OPT_IN_REQUIRED');
  assert.match(card.observation,/NOT_INDEPENDENTLY_VERIFIED/);
  assert.equal(card.steps.length,7);
 }
});
test('a portable method contains no live participant information or authority',()=>{
 const c=generator('food','CONFIRMED');
 const serialized=JSON.stringify(c);
 for(const sensitive of ['ticket','owner_hash','secret','summary','description','address','coordinate','latitude','longitude','note','message','routeId','personId','phone','email']) {
  assert.ok(!Object.keys(c).some(k=>k.toLowerCase()===sensitive.toLowerCase()),sensitive);
 }
 assert.ok(!serialized.includes('64-character invitation'));
 assert.ok(!serialized.includes('recipient_verified'));
 assert.equal(c.outcome,'REUSABLE_PROCESS_NOT_AUTOMATIC_DELIVERY');
});
test('browser exposes method only after confirmed and server includes safe category',()=>{
 assert.match(client,/if\(r\.state==='CONFIRMED'\)\{\s*card\.append\(button\('Save reusable workflow'/);
 assert.match(client,/saveWorkflowCartridge\(p\.category,r\.state\)/);
 assert.match(edge,/ticket:\{id:p\.id,role:p\.role,category:p\.category,/);
 assert.match(site,/recipient-confirmed exchange/);
 assert.match(client,/URL\.revokeObjectURL/);
 assert.ok(!edge.includes('TWO_PARTICIPANT_SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED')); // backend never claims proof
});
