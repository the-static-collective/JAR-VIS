import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('operator scopes are separate from worker scopes',async()=>{
 const gate=await load('backend/edge/jarvis-operator-007/index.ts');
 assert.match(gate,/\['view','enqueue','admit'\]/);
 assert.match(gate,/\['claim','return'\]/);
 assert.match(gate,/jarvis_backend_check_capability/);
});
test('browser never receives the Supabase service key or a persisted operator token',async()=>{
 const ui=await load('backend/edge/jarvis-operator-007/ui.ts');
 assert.doesNotMatch(ui,/SERVICE_ROLE_KEY|localStorage\.setItem|sessionStorage\.setItem/);
 assert.match(ui,/type="password"/);
 assert.match(ui,/textContent/);
 assert.match(ui,/confirm\(/);
});
test('capabilities are hashed, expires and revocable, ordinary users cannot issue',async()=>{
 const sql=await load('backend/migrations/007_scoped_operator_and_worker.sql');
 assert.match(sql,/token_sha256 text not null unique/);
 assert.match(sql,/extensions\.digest/);
 assert.match(sql,/expires_at>now\(\)/);
 assert.match(sql,/revoked_at is null/);
 assert.match(sql,/revoke all on function public\.jarvis_backend_issue_capability/);
});
test('worker returns are fenced to exact lease attempt and hold external effects',async()=>{
 const sql=await load('backend/migrations/007_scoped_operator_and_worker.sql');
 assert.match(sql,/attempts=p_attempt and lease_until>now\(\)/);
 assert.match(sql,/verifiedRealWorldClaims' <> 'false'/);
 assert.match(sql,/externalEffects' <> '\[\]'::jsonb/);
 const api=await load('backend/edge/jarvis-operator-007/actions.ts');
 assert.match(api,/p_attempt:b\.attempt/);
 assert.match(api,/p_worker:actor/);
});
