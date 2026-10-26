import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { measureSyntheticClaim } from '../backend/worker/measure-fixture.mjs';

const good={
  claimed:true,synthetic:true,workKind:'SYNTHETIC_MEASURE',
  id:'9734395a-8bdc-4334-971c-f3751f3cfaac',
  label:'Fictional garden: measure twelve boxes, no participant'
};
test('fixture computes stable, attributable measurement, not claims about the world',()=>{
  const r=measureSyntheticClaim(good);
  assert.equal(r.wordCount,7);
  assert.equal(r.utf8Bytes,Buffer.byteLength(good.label));
  assert.match(r.inputSha256,/^[0-9a-f]{64}$/);
  assert.equal(r.verifiedRealWorldClaims,false);
  assert.equal(r.admitted,false);
  assert.deepEqual(r.externalEffects,[]);
});
test('unapproved, unclaimed or external jobs cannot enter worker',()=>{
  for(const candidate of [{...good,claimed:false},{...good,synthetic:false},
    {...good,workKind:'REAL_EMAIL'},{...good,label:1},{...good,id:'fake'}]){
    assert.throws(()=>measureSyntheticClaim(candidate),/FIXTURE_OR_LEASE_REQUIRED/);
  }
});
test('backend database belt has atomic lease and immutable receipt gates',async()=>{
  const sql=await readFile(new URL('../backend/migrations/006_durable_synthetic_belt.sql',import.meta.url),'utf8');
  assert.match(sql,/FOR UPDATE SKIP LOCKED/i);
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON TABLE public\.jarvis_backend_jobs FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/RECEIPTS_APPEND_ONLY/);
  assert.match(sql,/approved_at IS NOT NULL/);
  assert.match(sql,/kind='SYNTHETIC_MEASURE'/);
});
test('Edge API has no public operator route or user-specified mail destination',async()=>{
  const source=await readFile(new URL('../backend/edge/jarvis-backend-006/index.ts',import.meta.url),'utf8');
  assert.match(source,/authorized\(req\.headers\.get\('authorization'\)\)/);
  assert.match(source,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source,/pathname\.endsWith\('\/health'\)/);
  assert.doesNotMatch(source,/api\.resend\.com|fetch\('https:\/\/|Deno\.env\.get\('RESEND_API_KEY'/);
});
