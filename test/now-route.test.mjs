import test from 'node:test';
import assert from 'node:assert/strict';
import {NowRoute,inferKind,distanceMiles} from '../src/now-route.mjs';

const WASECA={lat:44.077,lon:-93.507};
const CLOSE={lat:44.08,lon:-93.50};
const FAR={lat:44.35,lon:-93.51};
let now=Date.parse('2026-11-04T15:40:00Z');
const make=()=>new NowRoute({clock:()=>now});
const fish={description:'I have extra thawing fish available now',location:WASECA,expiresMinutes:45,radiusMiles:5,coldChainAttested:true};
const hungry={description:'Could use groceries today',kind:'food',location:CLOSE,allowMatching:true,canPickup:true,estimatedTravelMinutes:12};

test('understands common resource categories and calculates actual proximity',()=>{
  assert.equal(inferKind('Some fish for neighbors'),'food');
  assert.equal(inferKind('I need a ride'),'transport');
  assert.ok(distanceMiles(WASECA,CLOSE)<1);
  assert.ok(distanceMiles(WASECA,FAR)>5);
});

test('fish scenario: offer, opt-in, private proposal, recipient consent, report, confirmation',()=>{
  now=Date.parse('2026-11-04T15:40:00Z');
  const router=make();
  const offer=router.offer(fish),need=router.need(hungry);
  assert.equal(router.rank(offer.id)[0].needId,need.id);
  const route=router.propose({offerId:offer.id,needId:need.id});
  assert.equal(route.state,'OFFERED');
  assert.equal(router.state().offers[0].state,'OPEN');
  router.respond({routeId:route.id,needId:need.id,accept:true});
  assert.equal(router.state().offers[0].state,'RESERVED');
  router.report({routeId:route.id,offerId:offer.id});
  assert.equal(router.state().routes[0].state,'REPORTED');
  assert.equal(router.state().offers[0].state,'RESERVED','report is not confirmation');
  router.confirm({routeId:route.id,needId:need.id});
  assert.equal(router.state().offers[0].state,'CLOSED');
  assert.equal(router.state().routes[0].state,'CONFIRMED');
  assert.equal(router.events.filter(e=>e.type==='RECIPIENT_CONFIRMED_HANDOFF').length,1);
  assert.equal(router.state().mode,'LOCAL_SYNTHETIC_NO_DISPATCH');
  assert.ok(!JSON.stringify(router.state()).includes('44.077'),'coarse place inputs never exposed in snapshot');
});

test('uncertain cold chain holds perishable offers, no matching',()=>{
  const router=make();
  const offer=router.offer({...fish,coldChainAttested:false}),need=router.need(hungry);
  assert.equal(offer.state,'HOLD_SAFETY');
  assert.equal(router.rank(offer.id).length,0);
  assert.throws(()=>router.propose({offerId:offer.id,needId:need.id}),/HOLD_NO_CURRENT_ELIGIBLE_MATCH/);
});

test('opt-in, distance, travel, expiry and domain are real eligibility gates',()=>{
  const router=make();
  assert.throws(()=>router.need({...hungry,allowMatching:false}),/MATCHING_OPT_IN_REQUIRED/);
  const offer=router.offer(fish);
  router.need({...hungry,location:FAR});
  router.need({...hungry,estimatedTravelMinutes:50});
  router.need({...hungry,kind:'tools'});
  router.need({...hungry,canPickup:false});
  assert.equal(router.rank(offer.id).length,0);
  const valid=router.need({...hungry,estimatedTravelMinutes:25});
  assert.equal(router.rank(offer.id)[0].needId,valid.id);
  now+=46*60_000;
  assert.equal(router.rank(offer.id).length,0);
  assert.equal(router.state().offers[0].state,'EXPIRED');
});

test('nonmatching actor cannot accept/confirm, nor can a report masquerade as receipt',()=>{
  const router=make(),offer=router.offer(fish),need=router.need(hungry);
  const route=router.propose({offerId:offer.id,needId:need.id});
  assert.throws(()=>router.report({routeId:route.id,offerId:offer.id}),/REPORT_REQUIRES_ACCEPTANCE/);
  assert.throws(()=>router.respond({routeId:route.id,needId:'stranger',accept:true}),/NOT_ROUTE_RECIPIENT/);
  router.respond({routeId:route.id,needId:need.id,accept:true});
  assert.throws(()=>router.confirm({routeId:route.id,needId:need.id}),/CONFIRM_REQUIRES_REPORT/);
  assert.throws(()=>router.report({routeId:route.id,offerId:'somebody-else'}),/NOT_OFFER_OWNER/);
});

test('decline leaves offer available for another willing recipient; no duplicate active route',()=>{
  const router=make(),offer=router.offer(fish),need=router.need(hungry);
  const route=router.propose({offerId:offer.id,needId:need.id});
  assert.equal(router.rank(offer.id).length,0);
  router.respond({routeId:route.id,needId:need.id,accept:false});
  const second=router.need({...hungry,estimatedTravelMinutes:5});
  assert.equal(router.rank(offer.id)[0].needId,second.id);
  assert.equal(router.state().routes[0].state,'DECLINED');
});

test('reject invalid/missing location and implausible windows',()=>{
  const router=make();
  assert.throws(()=>router.offer({...fish,location:null}),/INVALID_APPROXIMATE_LOCATION/);
  assert.throws(()=>router.offer({...fish,expiresMinutes:1}),/INVALID_WINDOW/);
  assert.throws(()=>router.need({...hungry,estimatedTravelMinutes:500}),/INVALID_TRAVEL_MINUTES/);
});

test('voluntary withdrawal cancels an unaccepted invitation and blocks late consent',()=>{
  const router=make(),offer=router.offer(fish),need=router.need(hungry);
  const route=router.propose({offerId:offer.id,needId:need.id});
  router.withdraw({offerId:offer.id});
  assert.equal(router.state().routes[0].state,'CANCELED');
  assert.equal(router.state().offers[0].state,'WITHDRAWN');
  assert.throws(()=>router.respond({routeId:route.id,needId:need.id,accept:true}),/ROUTE_NOT_AWAITING_RESPONSE/);
  assert.equal(router.rank(offer.id).length,0);
});
test('two competing offers cannot both reserve one opted-in need',()=>{
  const router=make(),a=router.offer(fish),b=router.offer({...fish,description:'Extra safely chilled fish'}),
    need=router.need(hungry);
  const r1=router.propose({offerId:a.id,needId:need.id});
  const r2=router.propose({offerId:b.id,needId:need.id});
  router.respond({routeId:r1.id,needId:need.id,accept:true});
  assert.throws(()=>router.respond({routeId:r2.id,needId:need.id,accept:true}),/ROUTE_NO_LONGER_AVAILABLE/);
});
