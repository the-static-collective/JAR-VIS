/**
 * JAR;VIS Any Invitation 001 — deterministic cartridge interpreter.
 * Read-only proposal generation. No notifications, dispatch, recording, matching,
 * key material, public posting or real-world admissions.
 */
const ACTIONS=new Set(['act','offer','question','pass','fork','decline']);
const TIMES=new Set(['now','soon','open']);
const KINDS=new Set(['creative','food','transport','make','question','open']);
const REQUIRED_LAWS=[
 'INVITATION != ENROLLMENT',
 'LINK != SIGNATURE',
 'PROPAGATION != CONSENT',
 'REPLY_PREPARED != REPLY_DELIVERED',
 'NOW_PREFERRED != NOW_ASSUMED',
 'CAPABILITY != AUTHORITY',
 'FORK != ORIGINAL',
 'REFUSAL != PENALTY'
];
export function verifyInvitationCartridge(c){
 if(!c||typeof c!=='object'||Array.isArray(c)||c.schema!=='relatte.any-invitation-cartridge/v0' ||
  c.id!=='anything-invitation-chain-001'||c.authority!=='PROPOSAL_ONLY'||
  c.remote_execution!==false||c.automatic_notifications!==false||c.automatic_propagation!==false||
  c.persistent_identity!==false||c.preferred_time!=='now'||c.transport!=='PORTABLE_LINK_FRAGMENT'||
  c.external_delivery!=='NOT_IMPLEMENTED'||c.sender_reply_delivery!=='NOT_IMPLEMENTED')throw Error('UNSAFE_INVITATION_CARTRIDGE');
 if(!Array.isArray(c.time_modes)||c.time_modes.length!==3||c.time_modes.some(x=>!TIMES.has(x)))throw Error('INVALID_TIME_MODES');
 if(!Array.isArray(c.kinds)||c.kinds.length!==6||c.kinds.some(x=>!KINDS.has(x)))throw Error('INVALID_KIND_MODES');
 if(!Array.isArray(c.possible_responses)||c.possible_responses.length!==ACTIONS.size)throw Error('INVALID_RESPONSES');
 const seen=new Set();
 for(const r of c.possible_responses){
  if(!r||!ACTIONS.has(r.id)||seen.has(r.id)||typeof r.label!=='string'||!Array.isArray(r.kinds)||
    r.kinds.some(x=>!KINDS.has(x))||typeof r.needs_permission!=='boolean'||
    !['NONE_UNTIL_HUMAN_ACTION','LOCAL_REPLY_ONLY','EXPLICIT_HUMAN_SHARE','LOCAL_DERIVATIVE_ONLY','NO_RECORD'].includes(r.side_effect))
    throw Error('UNSAFE_INVITATION_ACTION');
  seen.add(r.id);
 }
 if(c.possible_responses.find(x=>x.id==='pass')?.side_effect!=='EXPLICIT_HUMAN_SHARE'||
    c.possible_responses.find(x=>x.id==='decline')?.side_effect!=='NO_RECORD'||
    c.possible_responses.find(x=>x.id==='act')?.side_effect!=='NONE_UNTIL_HUMAN_ACTION')
    throw Error('UNSAFE_INVITATION_ACTION');
 if(!Array.isArray(c.laws)||REQUIRED_LAWS.some(l=>!c.laws.includes(l)))throw Error('MISSING_INVITATION_LAW');
 if(c.learning?.mode!=='EXPLICIT_LOCAL_ONLY'||c.learning.default_enabled!==false||
   c.learning.raw_content_retention!==false)throw Error('UNSAFE_LEARNING_MODE');
 return true;
}
export function understandInvitation(words){
 const s=String(words??'').trim().slice(0,240);
 if(!s)return {words:'',lane:'open',when:'open',nowPossible:true,urgencyDeclared:false};
 const t=s.toLowerCase();
 let when='open';
 if(/\b(not now|later|next week|tomorrow|someday|eventually)\b/.test(t))when='open';
 else if(/\b(now|today|immediately|right away|currently|this minute|tonight)\b/.test(t))when='now';
 else if(/\b(soon|this week|this weekend|in a bit)\b/.test(t))when='soon';
 let lane='open';
 if(/\b(guitar|song|music|record|perform|concert|video|drum|sing)\b/.test(t))lane='creative';
 else if(/\b(food|fish|vegetables|meal|pantry|soup|grocery)\b/.test(t))lane='food';
 else if(/\b(ride|transport|deliver|bus|car)\b/.test(t))lane='transport';
 else if(/\b(fix|repair|code|build|computer|tool|equipment)\b/.test(t))lane='make';
 else if(/[?]$/.test(t)||/\b(question|why|how|what|wonder)\b/.test(t))lane='question';
 return {words:s,lane,when,nowPossible:when==='open'||when==='now',urgencyDeclared:when==='now'};
}
const WEIGHT={act:10,offer:8,question:7,fork:6,pass:5,decline:4};
export function proposeInvitationActions(words,cartridge,{when=null,feedback=null}={}){
 verifyInvitationCartridge(cartridge);
 const understanding=understandInvitation(words);
 if(when!==null){if(!TIMES.has(when))throw Error('BAD_AVAILABILITY_OVERRIDE');understanding.when=when;understanding.nowPossible=when!=='soon';understanding.urgencyDeclared=when==='now';}
 const actions=cartridge.possible_responses.filter(a=>a.kinds.includes(understanding.lane)).map(a=>{
  const boost=(understanding.when==='now'&&a.id==='act'?20:0);
  const evidence=feedback&&Number.isSafeInteger(feedback[a.id])?Math.min(5,Math.max(0,feedback[a.id])):0;
  return {id:a.id,label:a.label,rank:(WEIGHT[a.id]||0)+boost+evidence,possibleEffect:a.side_effect,needsPermission:a.needs_permission};
 }).sort((a,b)=>b.rank-a.rank||a.id.localeCompare(b.id));
 return {schema:'jarvis/any-invitation-plan/v0',input:understanding,cartridge:cartridge.id,actions,
  outcome:'PROPOSED_ONLY',remoteExecution:false,shared:false,receivedByHuman:false,
  notice:'A plan is not a delivered invitation or verified human response. Sharing requires deliberate human action.'};
}
