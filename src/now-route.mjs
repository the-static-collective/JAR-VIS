/**
 * NOW-ROUTE-001 — local, deterministic, consent-gated physical opportunity routing.
 * Fictional/local workbench ONLY: no real identity, networking, publication, dispatch or safety verification.
 */
const KINDS = new Set(['food','transport','tools','other']);
const MAX_TEXT = 280;
const DEFAULT_WINDOW = 60;
const ERR = (message, status = 422) => Object.assign(new Error(message), {status});
const integer = (value, min, max, name) => {
  if (!Number.isInteger(value) || value < min || value > max) throw ERR('INVALID_' + name);
  return value;
};
const location = (value) => {
  if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon) ||
    Math.abs(value.lat) > 90 || Math.abs(value.lon) > 180) throw ERR('INVALID_APPROXIMATE_LOCATION');
  return {lat: value.lat, lon: value.lon};
};
const description = (value) => {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT) throw ERR('INVALID_DESCRIPTION');
  return value.trim();
};
export function inferKind(text) {
  const s = String(text || '').toLowerCase();
  if (/\b(fish|seafood|meat|chicken|milk|eggs?|groceries|food|soup|produce|vegetables?|dinner|meal|bread|fruit)\b/.test(s)) return 'food';
  if (/\b(ride|driver|transport|carpool|lift|deliver|delivery)\b/.test(s)) return 'transport';
  if (/\b(tool|repair|fix|computer|guitar|instrument|bike|equipment)\b/.test(s)) return 'tools';
  return 'other';
}
export function isColdChainItem(text) {
  return /\b(fish|seafood|meat|chicken|milk|eggs?|frozen|thaw(?:ing|ed)?|refrigerat(?:ed|ion))\b/i.test(String(text || ''));
}
export function distanceMiles(a,b) {
  const rad=Math.PI/180;
  const dLat=(b.lat-a.lat)*rad, dLon=(b.lon-a.lon)*rad;
  const v=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
  return 3958.76*2*Math.asin(Math.min(1,Math.sqrt(v)));
}
const publicOffer=(o, now)=>({
  id:o.id,description:o.description,kind:o.kind,expiresInMinutes:Math.max(0,Math.ceil((o.expiresAt-now)/60000)),
  state:o.state === 'OPEN' && now >= o.expiresAt ? 'EXPIRED' : o.state,
  safety:o.safety,canDeliver:o.canDeliver,radiusMiles:o.radiusMiles
});
const publicNeed=(n, now)=>({
  id:n.id,kind:n.kind,description:n.description,state:n.state === 'OPEN' && now >= n.expiresAt ? 'EXPIRED':n.state,
  canPickup:n.canPickup,estimatedTravelMinutes:n.estimatedTravelMinutes,
  expiresInMinutes:Math.max(0,Math.ceil((n.expiresAt-now)/60000))
});
export class NowRoute {
  constructor({clock=()=>Date.now()}={}) {
    this.clock=clock;
    this.offers=new Map();this.needs=new Map();this.routes=new Map();this.events=[];
    this.sequence=0;
  }
  id(prefix) { return prefix+'-'+String(++this.sequence).padStart(3,'0'); }
  event(type, ref) {this.events.push({type,ref,at:new Date(this.clock()).toISOString(),verified:false});}
  offer(input={}) {
    const text=description(input.description);
    const kind=input.kind || inferKind(text);
    if (!KINDS.has(kind)) throw ERR('INVALID_KIND');
    const expiresMinutes=integer(input.expiresMinutes ?? DEFAULT_WINDOW,5,240,'WINDOW');
    const radiusMiles=integer(input.radiusMiles ?? 5,1,25,'RADIUS');
    const place=location(input.location);
    const safety=kind==='food' && isColdChainItem(text) ?
      (input.coldChainAttested===true ? 'SELF_ATTESTED_NOT_VERIFIED' : 'HOLD_COLD_CHAIN_UNCONFIRMED') :
      'NOT_APPLICABLE';
    const state=safety==='HOLD_COLD_CHAIN_UNCONFIRMED' ? 'HOLD_SAFETY' : 'OPEN';
    const row={id:this.id('offer'),description:text,kind,place,
      createdAt:this.clock(),expiresAt:this.clock()+expiresMinutes*60000,
      radiusMiles,canDeliver:input.canDeliver===true,safety,state};
    this.offers.set(row.id,row);this.event('OFFER_POSTED',row.id);
    return publicOffer(row,this.clock());
  }
  need(input={}) {
    if (input.allowMatching!==true) throw ERR('MATCHING_OPT_IN_REQUIRED',403);
    const text=description(input.description);
    const kind=input.kind || inferKind(text);
    if (!KINDS.has(kind)) throw ERR('INVALID_KIND');
    const place=location(input.location);
    const maxMiles=integer(input.maxMiles ?? 5,1,25,'RADIUS');
    const expiresMinutes=integer(input.expiresMinutes ?? 120,5,240,'WINDOW');
    const canPickup=input.canPickup===true;
    const estimatedTravelMinutes=input.estimatedTravelMinutes;
    if (canPickup) integer(estimatedTravelMinutes,0,180,'TRAVEL_MINUTES');
    const row={id:this.id('need'),description:text,kind,place,
      maxMiles,expiresAt:this.clock()+expiresMinutes*60000,
      state:'OPEN',canPickup,estimatedTravelMinutes:canPickup?estimatedTravelMinutes:null};
    this.needs.set(row.id,row);this.event('NEED_OPTED_IN',row.id);
    return publicNeed(row,this.clock());
  }
  rank(offerId) {
    const offer=this.offers.get(offerId);
    if (!offer) throw ERR('UNKNOWN_OFFER',404);
    const now=this.clock();
    if (offer.state!=='OPEN' || now>=offer.expiresAt) return [];
    if ([...this.routes.values()].some(r=>r.offerId===offerId && ['OFFERED','ACCEPTED','REPORTED'].includes(r.state))) return [];
    return [...this.needs.values()].flatMap(n=>{
      if (n.state!=='OPEN'||now>=n.expiresAt||n.kind!==offer.kind) return [];
      const dist=distanceMiles(offer.place,n.place);
      if (dist>Math.min(offer.radiusMiles,n.maxMiles)) return [];
      if (!n.canPickup && !offer.canDeliver) return [];
      // A donor's offer to deliver still needs a stated travel estimate: never infer a trip from radius.
      const eta=n.canPickup?n.estimatedTravelMinutes:null;
      if (eta===null || now+eta*60000>Math.min(offer.expiresAt,n.expiresAt)) return [];
      return [{needId:n.id,kind:n.kind,distanceMiles:Math.round(dist*10)/10,
        estimatedTravelMinutes:eta,method:'RECIPIENT_PICKUP',state:'PROPOSAL_ONLY'}];
    }).sort((a,b)=>a.estimatedTravelMinutes-b.estimatedTravelMinutes ||
       a.distanceMiles-b.distanceMiles || a.needId.localeCompare(b.needId));
  }
  propose({offerId,needId}={}) {
    const offer=this.offers.get(offerId),need=this.needs.get(needId);
    if (!offer||!need) throw ERR('UNKNOWN_PARTICIPANT',404);
    if (!this.rank(offerId).some(n=>n.needId===needId)) throw ERR('HOLD_NO_CURRENT_ELIGIBLE_MATCH',409);
    const r={id:this.id('route'),offerId,needId,state:'OFFERED',createdAt:this.clock()};
    this.routes.set(r.id,r);this.event('PRIVATE_OFFER_PROPOSED',r.id);
    return this.publicRoute(r);
  }
  respond({routeId,needId,accept}={}) {
    const r=this.routes.get(routeId);
    if (!r || r.needId!==needId) throw ERR('NOT_ROUTE_RECIPIENT',403);
    if (r.state!=='OFFERED') throw ERR('ROUTE_NOT_AWAITING_RESPONSE',409);
    const o=this.offers.get(r.offerId), n=this.needs.get(needId);
    if (this.clock()>=Math.min(o.expiresAt,n.expiresAt)) throw ERR('ROUTE_EXPIRED',409);
    if (accept!==true && accept!==false) throw ERR('RESPONSE_REQUIRED');
    r.state=accept?'ACCEPTED':'DECLINED';
    if (accept) {o.state='RESERVED';n.state='RESERVED';}
    this.event(accept?'RECIPIENT_ACCEPTED':'RECIPIENT_DECLINED',r.id);
    return this.publicRoute(r);
  }
  report({routeId,offerId}={}) {
    const r=this.routes.get(routeId);
    if(!r||r.offerId!==offerId) throw ERR('NOT_OFFER_OWNER',403);
    if(r.state!=='ACCEPTED') throw ERR('REPORT_REQUIRES_ACCEPTANCE',409);
    r.state='REPORTED';this.event('HANDOFF_REPORTED_UNVERIFIED',r.id);
    return this.publicRoute(r);
  }
  confirm({routeId,needId}={}) {
    const r=this.routes.get(routeId);
    if(!r||r.needId!==needId) throw ERR('NOT_ROUTE_RECIPIENT',403);
    if(r.state!=='REPORTED') throw ERR('CONFIRM_REQUIRES_REPORT',409);
    r.state='CONFIRMED';this.offers.get(r.offerId).state='CLOSED';
    this.needs.get(r.needId).state='CLOSED';
    this.event('RECIPIENT_CONFIRMED_HANDOFF',r.id);
    return this.publicRoute(r);
  }
  publicRoute(r){return {id:r.id,offerId:r.offerId,needId:r.needId,state:r.state,
    note:'Local simulation; actor identity and physical delivery are not independently verified.'};}
  state(){
    const now=this.clock();
    return {schema:'jarvis.now-route/v1',mode:'LOCAL_SYNTHETIC_NO_DISPATCH',
      offers:[...this.offers.values()].map(o=>publicOffer(o,now)),
      needs:[...this.needs.values()].map(n=>publicNeed(n,now)),
      routes:[...this.routes.values()].map(r=>this.publicRoute(r)),
      suggestions:Object.fromEntries([...this.offers.keys()].map(id=>[id,this.rank(id)])),
      eventCount:this.events.length,
      limits:['no authentication','no contact sharing','no remote notifications','no GPS disclosure','no verified food safety','in-memory only']};
  }
  reset(){this.offers.clear();this.needs.clear();this.routes.clear();this.events=[];this.sequence=0;return this.state();}
}
