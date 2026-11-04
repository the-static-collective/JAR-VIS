import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPublicGarden,fetchPublicGarden,GARDEN_PUBLIC_FEED} from '../src/pantry-gate-public-source.mjs';
import {readFileSync} from 'node:fs';

const fixture={
  schema:'garden/public-overview-v1',
  ledger:{state:'reviewed_only',entries:[
    {id:'a',kind:'offer',lane:'care',body:'I have extra canned beans for neighbors',status:'PUBLIC_REVIEWED',createdAt:'2026-11-03T14:00:00Z'},
    {id:'b',kind:'need',lane:'commons',body:'Could use canned food this week',status:'PUBLIC_REVIEWED',createdAt:'2026-11-02T14:00:00Z'},
    {id:'c',kind:'offer',lane:'care',body:'Private unreviewed fish listing',status:'PENDING',createdAt:'2026-11-03T14:00:00Z'},
    {id:'d',kind:'need',lane:'care',body:'Private withdrawn request',status:'WITHDRAWN',createdAt:'2026-11-02T14:00:00Z'},
    {id:'a',kind:'offer',lane:'care',body:'Duplicate of A',status:'PUBLIC_REVIEWED',createdAt:'2026-11-02T14:00:00Z'},
    {id:'e',kind:'question',lane:'research',body:'Not an exchange',status:'PUBLIC_REVIEWED',createdAt:'2026-11-02T14:00:00Z'}
  ]}
};
const clock=Date.parse('2026-11-04T15:00:00Z');
test('reads only explicitly reviewed public Garden care / commons offers and needs',()=>{
 const result=projectPublicGarden(fixture,{nowMs:clock});
 assert.equal(result.offers.length,1);assert.equal(result.needs.length,1);
 assert.deepEqual(result.offers.map(r=>r.sourceId),['a']);
 assert.deepEqual(result.needs.map(r=>r.sourceId),['b']);
 assert.ok(!JSON.stringify(result).includes('unreviewed'));
 assert.ok(!JSON.stringify(result).includes('withdrawn'));
 assert.equal(result.newRecordsCreated,0);
 assert.equal(result.remoteActions,false);
 assert.equal(result.offers[0].eligibleForNowRouting,false);
 assert.equal(result.offers[0].consentToPhysicalMatching,'NOT_ESTABLISHED');
 assert.match(result.routing,/HOLD/);
});
test('cannot substitute staged, unreviewed or differently shaped content for public approval',()=>{
 for(const bad of [
  {},{schema:'garden/public-overview-v1',ledger:{state:'unreviewed',entries:fixture.ledger.entries}},
  {schema:'other',ledger:fixture.ledger},
  {schema:fixture.schema,ledger:{state:'reviewed_only',entries:{}}}
 ])assert.throws(()=>projectPublicGarden(bad,{nowMs:clock}),/HOLD_UNVERIFIED_GARDEN_PROJECTION/);
});
test('public GET only; no authorization, publication, addresses or match claims',async()=>{
 let called=0;
 const fakeFetch=async (url,options)=>{
   called++;
   assert.equal(url,GARDEN_PUBLIC_FEED);assert.equal(options.method,'GET');
   assert.equal(options.cache,'no-store');
   assert.equal(options.headers.accept,'application/json');
   return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(fixture)};
 };
 const result=await fetchPublicGarden({fetchImpl:fakeFetch,nowMs:clock});
 assert.equal(called,1);
 assert.equal(result.offers.length,1);
 assert.equal(result.offers[0].area,'UNSPECIFIED');
 assert.equal(result.offers[0].when,'UNSPECIFIED');
 assert.equal(result.offers[0].verifiedHumanParticipation,false);
});
test('oversized or invalid public feeds fail closed',async()=>{
 await assert.rejects(()=>fetchPublicGarden({fetchImpl:async()=>({ok:true,headers:{get:()=>76000},text:async()=>''})}),/OVERSIZED/);
 await assert.rejects(()=>fetchPublicGarden({fetchImpl:async()=>({ok:true,headers:{get:()=>null},text:async()=>'{oops'})}),/MALFORMED/);
 await assert.rejects(()=>fetchPublicGarden({fetchImpl:async()=>({ok:false,status:502})}),/UNAVAILABLE/);
});

test('unapplied NOW-ROUTE schema isolates participation from existing Garden authority',()=>{
 const sql=readFileSync(new URL('../docs/proposals/NOW-ROUTE-PANTRY-GATE-001.sql',import.meta.url),'utf8');
 for(const phrase of [
  'CREATE TABLE public.now_route_participations',
  'CREATE TABLE public.now_route_crossings',
  'ENABLE ROW LEVEL SECURITY',
  'now_route_one_active_offer',
  'now_route_one_active_need',
  'explicit_matching_opt_in = true',
  'REVOKE ALL ON TABLE public.now_route_crossings FROM PUBLIC, anon, authenticated',
  'REVOKE ALL ON TABLE public.now_route_participations FROM PUBLIC, anon, authenticated',
 ]) assert.ok(sql.includes(phrase),'schema guard missing: '+phrase);
 assert.ok(!sql.includes('ALTER TABLE public.garden_entries'));
 assert.ok(!sql.includes('DROP TABLE'));
 assert.ok(!sql.includes('TRUNCATE'));
 assert.ok(!sql.includes('CREATE POLICY'),'no unreviewed direct client access policies');
});
