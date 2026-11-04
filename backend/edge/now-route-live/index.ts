import { createClient } from 'npm:@supabase/supabase-js@2.78.0';
import { SITE } from './site.ts';
import { CLIENT } from './client.ts';
const projectUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const db = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const zones = { center: [44.08, -93.51], north: [44.11, -93.50], south: [44.05,-93.51], east: [44.08,-93.46], west: [44.08,-93.56] };
const keyPattern = /^[a-f0-9]{64}$/;
const uuidPattern = /^[a-f0-9-]{36}$/;
function json(data, status=200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store' } }); }
function hash(value) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(buffer => Array.from(new Uint8Array(buffer), b=>b.toString(16).padStart(2,'0')).join('')); }
function makeKey() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,'0')).join(''); }
function distance(a,b) { const x=zones[a],y=zones[b]; if (!x||!y)return Infinity; const r=Math.PI/180, dl=(y[0]-x[0])*r, dn=(y[1]-x[1])*r, z=Math.sin(dl/2)**2+Math.cos(x[0]*r)*Math.cos(y[0]*r)*Math.sin(dn/2)**2; return 3958.76*2*Math.asin(Math.min(1,Math.sqrt(z))); }
const publicText = v => typeof v==='string' && v.trim().length>=8 && v.length<=180 && !/@|https?:|www\.|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/i.test(v);
Deno.serve(async req => {
 const url=new URL(req.url);
 if(req.method==='GET') {
  if(url.pathname.endsWith('/client.js'))return new Response(CLIENT,{headers:{'content-type':'text/javascript','cache-control':'no-store'}});
  if(url.pathname.endsWith('/health'))return json({ok:true,mode:'INVITE_ONLY_PILOT',physicalDeliveryVerified:false});
  return new Response(SITE,{headers:{'content-type':'text/html','cache-control':'no-store'}});
 }
 if(req.method!=='POST'||req.headers.get('origin')!==new URL(projectUrl).origin)return json({error:'ORIGIN_REQUIRED'},403);
 let b;
 try { const raw=await req.text(); if(raw.length>1800)return json({error:'TOO_LARGE'},413); b=JSON.parse(raw); }
 catch {return json({error:'INVALID_JSON'},400)}
 try {
  if(b.action==='create') {
   if(!b.consent||!['OFFER','NEED'].includes(b.role)||!['food','tools','other'].includes(b.category)||!zones[b.zone]||![30,45,60,120,180].includes(b.expiresMinutes)||!publicText(b.description)||!keyPattern.test(b.inviteCode))throw Error('INVALID_OFFER');
   if(/\b(fish|thawing|raw meat|chicken|seafood|milk|eggs|frozen)\b/i.test(b.description))throw Error('PERISHABLES_HELD');
   const owner=makeKey();
   const {data,error}=await db.rpc('nr03_open',{p_invite_hash:await hash(b.inviteCode),p_owner_hash:await hash(owner),p_role:b.role,p_category:b.category,p_summary:b.description.trim(),p_zone:b.zone,p_expire_minutes:b.expiresMinutes,p_pickup_minutes:b.role==='NEED'?b.pickupMinutes:null,p_perishable:false});
   if(error)throw Error('INVITE_OR_STORAGE_UNAVAILABLE');
   return json({ticket:{id:data,secret:owner,role:b.role}},201);
  }
  if(!keyPattern.test(b.secret||''))throw Error('PRIVATE_TICKET_REQUIRED');
  const digest=await hash(b.secret);
  const {data:p,error:e}=await db.from('nr03_posts').select('*').eq('owner_hash',digest).maybeSingle();
  if(e||!p)throw Error('TICKET_NOT_FOUND');
  if(b.action==='status') {
   const now=new Date().toISOString(), opposite=p.role==='OFFER'?'NEED':'OFFER';
   const {data:others,error:oErr}=await db.from('nr03_posts').select('*').eq('role',opposite).eq('category',p.category).eq('state','OPEN').gt('expires_at',now).limit(60);
   if(oErr)throw Error('STORE_UNAVAILABLE');
   const possible=(others||[]).filter(x=>{const offer=p.role==='OFFER'?p:x,need=p.role==='NEED'?p:x;return offer.state==='OPEN'&&need.state==='OPEN'&&Date.parse(offer.expires_at)>Date.now()&&Date.parse(need.expires_at)>Date.now()&&distance(offer.zone,need.zone)<=5&&Date.now()+need.pickup_minutes*60000<Math.min(Date.parse(offer.expires_at),Date.parse(need.expires_at))}).map(x=>({id:x.id,summary:x.summary,miles:Math.round(distance(p.zone,x.zone)*10)/10}));
   const {data:routes,error:rErr}=await db.from('nr03_routes').select('*').eq(p.role==='OFFER'?'offer_id':'need_id',p.id).limit(15);
   if(rErr)throw Error('STORE_UNAVAILABLE');
   return json({ticket:{id:p.id,role:p.role,summary:p.summary,state:p.state,expiresAt:p.expires_at},possible,routes:routes||[],delivery:'IN_APP_POLL_ONLY'});
  }
  if(b.action==='propose') {
   if(p.role!=='OFFER'||!uuidPattern.test(b.otherId||''))throw Error('INVALID_PROPOSAL');
   const {data,error}=await db.rpc('nr03_propose',{p_offer_id:p.id,p_need_id:b.otherId,p_owner_hash:digest});
   if(error)throw Error('PROPOSAL_UNAVAILABLE');
   return json({id:data,state:'PROPOSED'});
  }
  if(b.action==='advance') {
   if(!uuidPattern.test(b.routeId||'')||!['accept','decline','cancel','report','confirm','dispute'].includes(b.operation))throw Error('INVALID_ACTION');
   const {data,error}=await db.rpc('nr03_advance',{p_route_id:b.routeId,p_owner_hash:digest,p_action:b.operation});
   if(error)throw Error('TRANSITION_DENIED');
   return json({state:data,physicalOutcomeVerified:false});
  }
  if(b.action==='withdraw') {
   const {data,error}=await db.rpc('nr03_withdraw',{p_owner_hash:digest});
   if(error)throw Error('WITHDRAWAL_DENIED');
   return json({state:data});
  }
  return json({error:'UNKNOWN_ACTION'},400);
 }catch(e){return json({error:e.message||'SERVICE_UNAVAILABLE'},400)}
});
