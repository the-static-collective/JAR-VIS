/**
 * NOW-ROUTE ↔ existing pantry-gate Garden public projection.
 *
 * The existing Garden ledger publishes ONLY records reviewed by a human.
 * This adapter never retrieves or promotes PENDING/withdrawn/private records,
 * never assumes matching permissions, and never treats a public proposal as a
 * physical handoff. It is usable now without a schema migration.
 */
export const GARDEN_PUBLIC_FEED = 'https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/garden-ledger';
const SOURCE = 'garden/public-overview-v1';
const validText = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
export function projectPublicGarden(feed, {nowMs=Date.now()}={}) {
  if (!feed || feed.schema!==SOURCE || feed.ledger?.state!=='reviewed_only' ||
      !Array.isArray(feed.ledger.entries)) throw Error('HOLD_UNVERIFIED_GARDEN_PROJECTION');
  if (!Number.isFinite(nowMs)) throw Error('INVALID_CLOCK');
  const entries=[];
  const seen=new Set();
  for(const row of feed.ledger.entries.slice(0,35)) {
    if (!row || row.status!=='PUBLIC_REVIEWED' || !['offer','need'].includes(row.kind) ||
        !['care','commons'].includes(row.lane) ||
        !validText(row.body,300) || !validText(row.id,80) ||
        !Number.isFinite(Date.parse(row.createdAt)) ||
        Date.parse(row.createdAt)>nowMs || seen.has(row.id)) continue;
    seen.add(row.id);
    entries.push(Object.freeze({
      source:'pantry-gate.garden-ledger',
      sourceId:row.id,
      kind:row.kind,
      lane:row.lane,
      summary:row.body,
      reviewedPublic:true,
      createdAt:row.createdAt,
      when:'UNSPECIFIED',
      area:'UNSPECIFIED',
      consentToPhysicalMatching:'NOT_ESTABLISHED',
      eligibleForNowRouting:false,
      verifiedHumanParticipation:false
    }));
  }
  const offers=entries.filter(e=>e.kind==='offer');
  const needs=entries.filter(e=>e.kind==='need');
  return Object.freeze({
    schema:'jarvis/pantry-gate-public-discovery/v1',
    source:GARDEN_PUBLIC_FEED,
    observedAt:new Date(nowMs).toISOString(),
    offers,
    needs,
    routing:'HOLD_MISSING_TIMING_LOCATION_AND_PARTICIPANT_CONSENT',
    remoteActions:false,
    newRecordsCreated:0,
    note:'Reviewed Garden public summaries only. No fresh offer, recipient consent, pickup window, safety or delivery is established. These are contextual discovery, NOT automatically matchable NOW-ROUTE posts.'
  });
}
export async function fetchPublicGarden({fetchImpl=fetch,timeoutMs=6500,nowMs=Date.now()}={}) {
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>12000)throw Error('INVALID_TIMEOUT');
  const response=await fetchImpl(GARDEN_PUBLIC_FEED,{
    method:'GET',
    headers:{accept:'application/json'},
    cache:'no-store',
    signal:AbortSignal.timeout(timeoutMs)
  });
  if(!response.ok)throw Error('HOLD_GARDEN_FEED_UNAVAILABLE');
  const headerSize=Number(response.headers?.get?.('content-length')||0);
  if(headerSize>75000)throw Error('HOLD_OVERSIZED_GARDEN_FEED');
  const raw=await response.text();
  if(raw.length>75000)throw Error('HOLD_OVERSIZED_GARDEN_FEED');
  let feed;
  try{feed=JSON.parse(raw);}catch{throw Error('HOLD_MALFORMED_GARDEN_FEED');}
  return projectPublicGarden(feed,{nowMs});
}
