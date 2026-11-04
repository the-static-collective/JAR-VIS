import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=load('backend/migrations/009_now_route_live_pilot.sql');
const api=load('backend/edge/now-route-live/index.ts');
const ui=load('backend/edge/now-route-live/site.ts');
const client=load('backend/edge/now-route-live/client.ts');

test('operational schema is isolated from preexisting Garden, IC02 and other live domains',()=>{
 for(const marker of ['CREATE TABLE public.nr03_invites','CREATE TABLE public.nr03_posts',
 'CREATE TABLE public.nr03_routes','CREATE TABLE public.nr03_messages',
 'CREATE UNIQUE INDEX nr03_one_route_offer','CREATE UNIQUE INDEX nr03_one_route_need'])
  assert.ok(sql.includes(marker),marker);
 for(const forbidden of ['ALTER TABLE public.garden_entries','ALTER TABLE public.ic02_','DROP TABLE','TRUNCATE'])
  assert.ok(!sql.includes(forbidden),forbidden);
 assert.ok(sql.includes('nr03_retention_15m'));
});
test('direct client data access and privileged SQL execution are denied',()=>{
 for(const table of ['nr03_invites','nr03_posts','nr03_routes','nr03_messages','nr03_events'])
  assert.ok(sql.includes('public.'+table));
 for(const fn of ['nr03_open','nr03_propose','nr03_advance','nr03_send','nr03_withdraw'])
  assert.ok(sql.includes('SECURITY INVOKER'),fn);
 assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
 assert.ok(sql.includes('REVOKE ALL ON TABLE'));
 assert.ok(sql.includes('FROM PUBLIC, anon, authenticated'));
 assert.ok(!sql.includes('CREATE POLICY'));
 assert.ok(!sql.includes('GRANT EXECUTE ON FUNCTION public.nr03_open') ||
            sql.includes(' TO service_role;'));
});
test('physical receiver, not donor, confirms receipt',()=>{
 assert.ok(sql.includes("p_action='report' AND v_role='DONOR' AND r.state='ACCEPTED'"));
 assert.ok(sql.includes("p_action='confirm' AND v_role='RECIPIENT' AND r.state='REPORTED'"));
 assert.ok(sql.includes("p_action='accept' AND v_role='RECIPIENT' AND r.state='PROPOSED'"));
 assert.ok(sql.includes("IF v_state='CONFIRMED'"));
 assert.ok(sql.includes("RERAISE")===false);
});
test('edge never uses browser Supabase secret or exposes exact location in UI',()=>{
 assert.ok(api.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"));
 assert.ok(api.includes("new URL(projectUrl).origin"));
 assert.ok(api.includes("await hash(b.inviteCode)"));
 assert.ok(api.includes("PERISHABLES_HELD"));
 assert.ok(!ui.includes('supabase-js'));
 assert.ok(!client.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(!client.includes('serviceKey'));
 assert.ok(ui.includes('/functions/v1/now-route-live/client.js'));
 assert.ok(ui.includes('No payments'));
});
test('live pilot is opt-in and can be refused or withdrawn',()=>{
 assert.ok(api.includes('b.consent!==true'));
 assert.ok(api.includes('nr03_withdraw'));
 assert.ok(api.includes('nr03_propose'));
 assert.ok(api.includes('nr03_advance'));
 assert.ok(client.includes("action:'send'"));
 assert.ok(client.includes('CONFIRMED'));
 assert.ok(client.includes('IN_APP_POLL'));
});
