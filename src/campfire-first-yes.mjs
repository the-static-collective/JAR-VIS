/**
 * FIRST-YES-001 · read one privately authorized Campfire Attention Desk card
 * and shape an unsent, operator-reviewed JAR;VIS work kit.
 *
 * This bridge never gets a membership capability, body of a private message,
 * household case history, recipient record, or original help receipt.
 * It calls the operator-only READ endpoint; it NEVER calls any write endpoint.
 * Importing "attention" does not import authority.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

export const FIRST_YES_SCHEMA='jarvis.campfire-first-yes/v0';
export const SOURCE_SCHEMA='campfire.operator-attention/v0';
const ALLOWED = Object.freeze({
  HALT_INTEGRITY: {
    heading:'Protect the logbook before taking another step',
    observed:'The Firebox reported that its local audit chain did not pass.',
    work:'Prepare a private incident checklist. Stop recruiting, changing memberships, or reporting outcomes until the operator checks the original records.',
    permission:'The operator responsible for the machine must authorize the investigation and any recovery.',
    proof:'A independently reviewed, coherent local record and documented restoration decision.',
    ask:'Is it appropriate to pause this pilot and review the Firebox integrity result privately?'
  },
  FIRST_CIRCLE: {
    heading:'Open one tiny, voluntary Campfire',
    observed:'The Firebox currently has no Campfire circles.',
    work:'Prepare a harmless two-person message test and a one-paragraph invitation. Do not create a room or send invitations here.',
    permission:'Each tester must freely opt in before receiving their own one-use invitation.',
    proof:'One actual circle opened deliberately; no participant was enrolled without choosing to join.',
    ask:'Would you be interested in trying a small, fictional private messaging experiment? No personal stories or obligations.'
  },
  NEEDS_OWNER: {
    heading:'Invite a willing keeper for an ownerless room',
    observed:'The Firebox reports a private circle with no active owner key.',
    work:'Draft an owner-role invitation that explains what the responsibility is and that declining is welcome.',
    permission:'A distinct person must agree to hold the owner role before receiving a private invitation.',
    proof:'The person redeems their own owner capability. A capability is not proof of human identity.',
    ask:'Would you want to be the keeper for a small Campfire test? It is completely fine to decline.'
  },
  INVITE_TEST_MEMBER: {
    heading:'Invite a second independent Campfire tester',
    observed:'A private room has an owner but no active separate member capability.',
    work:'Draft one short, optional invitation describing a harmless message test; keep its actual one-use secret out of this kit.',
    permission:'Ask a willing tester before the operator issues an invite; no tokens are shared with JAR;VIS.',
    proof:'A distinct member capability is redeemed and the tester independently observes a harmless message.',
    ask:'Would you like to try sending one harmless message in a private Campfire? No commitment beyond the test.'
  },
  FIRST_CONVERSATION: {
    heading:'Test the first real two-way conversation',
    observed:'A Campfire has active owner and member capabilities but no saved message.',
    work:'Write a two-message test script and a restart/refresh checklist without names or personal information.',
    permission:'Both separate members choose whether to post their own harmless test messages.',
    proof:'Messages are visible to separate members after refresh and excluded from unrelated circles.',
    ask:'Could two willing members each send one fictional test message and verify they can both read the result?'
  },
  TEST_ONE_NEED: {
    heading:'Prepare one small fictional Help Slip experiment',
    observed:'A Campfire has messages but no recorded need.',
    work:'Draft a fictional need with an example quantity, reporting question, and owner-acceptance checklist. Do not open a real need here.',
    permission:'The room owner decides whether to open a harmless test need; no helper is assigned automatically.',
    proof:'The helper report leaves residual unchanged; a separate owner acceptance changes only explicitly accepted units.',
    ask:'Would this Campfire like to try a fictional need, report, and separate acceptance to check the boundaries?'
  },
  REVIEW_REPORTED_HELP: {
    heading:'Ask an owner to examine one unresolved report',
    observed:'A helper report still has quantity that an owner capability has not accepted.',
    work:'Prepare a short, neutral review checklist: what was reported, what is unknown, and whether to accept a portion, decline, or leave unresolved.',
    permission:'Only the actual need owner chooses how to respond. A report alone is not evidence of physical delivery.',
    proof:'An authorized owner decision is recorded or the need remains unresolved; real delivery needs separate evidence.',
    ask:'Would the need owner like to review a pending report? It is fine to leave it unresolved.'
  },
  HUMAN_WITNESS_GAP: {
    heading:'Prepare a question about independent confirmation',
    observed:'At least one quantity was accepted by an owner credential; physical provision is still unverified.',
    work:'Prepare a private witness-evidence checklist, not a public success announcement.',
    permission:'The actual recipient and source owner control whether any independent verification is appropriate.',
    proof:'A separately authorized human and source-owner review; never infer delivery from a button click.',
    ask:'What independent observation, if any, could responsibly verify the reported action?'
  },
  PROTECT_LOGBOOK: {
    heading:'Protect the community logbook',
    observed:'No independently verified backup-and-restore result is available for this Firebox.',
    work:'Prepare a protected, offline backup checklist and a fictional restore drill before entering important data.',
    permission:'Only the machine operator determines where the private logbook and encryption key may be stored.',
    proof:'A separately documented, successful restore drill. Reading the status screen is not a backup.',
    ask:'Could the operator schedule a harmless backup-and-restore rehearsal using a test copy?'
  },
  CHECK_WITH_PEOPLE: {
    heading:'Ask what would genuinely help',
    observed:'Limited software counts reveal no specific unmet operational step.',
    work:'Draft one open, permission-first question for willing participants rather than invent a community need.',
    permission:'People choose their own involvement, including saying no.',
    proof:'One voluntarily chosen concrete question; no assignment or assumed urgency.',
    ask:'Is there one small useful experiment someone here would actually welcome?'
  }
});
export const FIRST_YES_CODES=Object.freeze(Object.keys(ALLOWED));
const HOLD=new Set(['HALT_INTEGRITY']);
const fingerprint=value=>createHash('sha256').update(
 'FIRST-YES-001|'+JSON.stringify(value)).digest('hex');
const safeAnswer=value=>{
 if(typeof value!=='string')throw Error('QUESTION_REQUIRED');
 const t=value.trim().replace(/\s+/g,' ');
 if(t.length<12||t.length>240)throw Error('QUESTION_LENGTH');
 // This is a printable, possibly portable card, not the place to type sensitive cases.
 if(/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d(). -]{9,}\d|https?:\/\/|www\.|bearer\s+[-\w]{20}/i.test(t))
   throw Error('PRIVATE_CONTACT_OR_LINK_REFUSED');
 return t;
};
function validate(source){
 if(!source||source.schema!==SOURCE_SCHEMA||
    source.mode!=='READ_ONLY_OPERATOR_BRIEF'||
    source.basis!=='SOURCE_DATABASE_COUNTS_NOT_MESSAGES')
   throw Error('UNTRUSTED_CAMPFIRE_ATTENTION');
 if(!source.authority||Object.values(source.authority).some(v=>v!==false)||
    source.authority.execute!==false||source.authority.inviteSent!==false||
    source.authority.humanVerified!==false||source.authority.provisionVerified!==false||
    source.authority.knowledgePublished!==false)
   throw Error('AUTHORITY_IMPORT_REFUSED');
 const c=source.next24Hours;
 if(!c||!Object.hasOwn(ALLOWED,c.code)||c.standing!=='PROPOSAL_NOT_ACTION'||
    c.canExecute!==false||c.hasConsent!==false)
   throw Error('SOURCE_NOT_PROPOSAL');
 if(!['LOCAL_HASH_CHAIN_INTACT','LOCAL_AUDIT_FAILED'].includes(source.auditState))
   throw Error('INVALID_SOURCE_AUDIT');
 if(source.auditState==='LOCAL_AUDIT_FAILED'&&c.code!=='HALT_INTEGRITY')
   throw Error('FAILED_INTEGRITY_MUST_HALT');
 if(source.auditState==='LOCAL_HASH_CHAIN_INTACT'&&c.code==='HALT_INTEGRITY')
   throw Error('CONFLICTING_SOURCE_INTEGRITY');
 if(!Array.isArray(source.otherOptions)||source.otherOptions.length>4)
   throw Error('UNBOUNDED_ALTERNATIVES');
 const n=source.countContext;
 if(!n||!['circles','messages','needs','reports','ownerAcceptances']
 .every(k=>Number.isSafeInteger(n[k])&&n[k]>=0))
   throw Error('INVALID_COUNT_CONTEXT');
 return c.code;
}
export function composeFirstYes(source,{question='What useful thing could we prepare in the next 24 hours?',observedAt=new Date().toISOString()}={}){
 const code=validate(source),q=safeAnswer(question);
 if(typeof observedAt!=='string'||Number.isNaN(Date.parse(observedAt)))
   throw Error('INVALID_OBSERVATION_TIME');
 const desc=ALLOWED[code],held=HOLD.has(code);
 const sourceDigest=fingerprint({
  schema:source.schema,basis:source.basis,code,scopeType:
   source.next24Hours.scope==='operator'?'operator':'private-circle',
  countContext:source.countContext,auditState:source.auditState,
  authority:source.authority
 });
 const kit={
  schema:FIRST_YES_SCHEMA,
  standing:held?'HOLD_SOURCE_INTEGRITY':'LOCAL_DRAFT_NOT_SENT',
  operatorQuestion:q,
  firstYes:{
   code,heading:desc.heading,observed:desc.observed,
   prepare:desc.work,permission:desc.permission,
   whatWouldCount:desc.proof,voluntaryInvitationDraft:held?null:desc.ask
  },
  provenance:{
   from:SOURCE_SCHEMA,observedAt,sourceDigest:'sha256:'+sourceDigest,
   status:'LIVE_OWNER_STATUS_READ_NOT_INDEPENDENT_CONFIRMATION',
   visibility:'PRIVATE_OPERATOR_ONLY',
   sampleData:undefined
  },
  boundaries:{
   authorization:'NONE_IMPORTED',humanConsentObtained:false,
   preparedOnly:true,workPerformed:false,invitationSent:false,
   personalDataImported:false,verifiedPhysicalFulfillment:false,
   published:false,requestUsed:'ADMIN_READ_ONLY',
   backendMutation:false
  },
  nextGate:held?'OPERATOR_MUST_INVESTIGATE_LOCAL_LOGBOOK':
   'HUMAN_REVIEWS_ARTIFACT_AND_CHOOSES_WHETHER_TO_ACT'
 };
 return Object.freeze(kit);
}
export function renderFirstYes(kit){
 if(kit?.schema!==FIRST_YES_SCHEMA||!['LOCAL_DRAFT_NOT_SENT','HOLD_SOURCE_INTEGRITY'].includes(kit.standing))
  throw Error('INVALID_FIRST_YES_KIT');
 const c=kit.firstYes;
 const lines=[
  '# The First Yes · One useful step',
  '',
  '**Status:** '+kit.standing+' · This document has not been sent, approved or executed.',
  '**Source:** '+kit.provenance.from+' (owner-read, not independently witnessed)',
  '**Observed:** '+kit.provenance.observedAt,
  '**Source fingerprint:** '+kit.provenance.sourceDigest,
  '',
  '## What we are asking',
  kit.operatorQuestion,
  '',
  '## One possibility',
  c.heading,
  '',
  '**Why it appeared:** '+c.observed,
  '',
  '**What can be prepared now:** '+c.prepare,
  '',
  '**Whose permission is required:** '+c.permission,
  '',
  '**What would count as evidence:** '+c.whatWouldCount,
  '',
  '## Voluntary, unsent invitation draft',
  c.voluntaryInvitationDraft??'No invitation: integrity is in HOLD.',
  '',
  '## Stewardship boundary',
  'No contact was made, no membership granted, no task assigned, no data published,',
  'and no physical-world aid was verified. Review this draft before sharing anything.',
  'The private Firebox remains the only owner of Campfire messages and help records.',
  '',
  '## Return questions',
  'Did a real person freely agree to consider this?  ______________________________',
  'What was actually prepared?                  ______________________________',
  'What independent evidence exists?            ______________________________',
  'What must remain unresolved?                 ______________________________',
  '',
  'Fruit = verified or accurately attributed result; Seed = next possibility; Compost = what changed or failed.',
  'A filled-in card is not a source-owned receipt.'
 ];
 return lines.join('\n')+'\n';
}
export function makeCampfireFirstYesBridge({
 baseUrl='http://127.0.0.1:3417',
 keyFile=process.env.JARVIS_CAMPFIRE_KEY_FILE||
  join(resolve(process.env.CAMPFIRE_DATA_DIR||'../BananaSpork/private-data/campfire'),'operator.key'),
 fetcher=fetch,readSecret=readFile
}={}){
 const url=new URL(baseUrl);
 const acceptedHost=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
 if(!acceptedHost||url.protocol!=='http:'||url.username||url.password||url.search||url.hash||
    url.pathname!=='/'||!url.port&&url.hostname==='localhost'&&baseUrl.includes('@'))
  throw Error('LOCAL_OWNER_FIREBOX_ONLY');
 const endpoint=url.origin+'/v1/admin/attention';
 return {
  async prepare(question){
   let secret;
   try{secret=(await readSecret(keyFile,'utf8')).trim();}
   catch{throw Object.assign(Error('FIREBOX_OPERATOR_KEY_UNAVAILABLE'),{status:503});}
   if(!/^[A-Za-z0-9_-]{32,128}$/.test(secret))
    throw Object.assign(Error('FIREBOX_OPERATOR_KEY_INVALID'),{status:503});
   let result;
   try{
    result=await fetcher(endpoint,{
     method:'GET',redirect:'error',cache:'no-store',
     headers:{Authorization:'Bearer '+secret,Accept:'application/json'},
     signal:AbortSignal.timeout(4500)
    });
   }catch{throw Object.assign(Error('FIREBOX_NOT_REACHABLE'),{status:503});}
   if(!result.ok)throw Object.assign(Error('FIREBOX_PRIVATE_READ_DENIED'),{status:503});
   if(!result.headers.get('content-type')?.includes('application/json'))
    throw Object.assign(Error('FIREBOX_UNEXPECTED_RESPONSE'),{status:503});
   let body='';
   if(!result.body)throw Error('FIREBOX_EMPTY_RESPONSE');
   const stream=result.body.getReader();
   const decoder=new TextDecoder();
   try{
    for(;;){
     const {done,value}=await stream.read();
     if(done)break;
     if(body.length+value.length>32_768)throw Error('FIREBOX_RESPONSE_TOO_LARGE');
     body+=decoder.decode(value,{stream:true});
    }
    body+=decoder.decode();
   }finally{stream.releaseLock();}
   let parsed;
   try{parsed=JSON.parse(body);}catch{throw Error('FIREBOX_INVALID_JSON');}
   if(parsed.ok!==true)throw Error('FIREBOX_REJECTED_READ');
   const kit=composeFirstYes(parsed,{question});
   return {...kit,markdown:renderFirstYes(kit)};
  },
  location:'LOCAL_PRIVATE_OWNER_READ_ONLY',
  dataFlow:'FIREBOX_TO_JARVIS_PREPARED_DRAFT_ONLY'
 };
}
