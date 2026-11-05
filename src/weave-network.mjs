/**
 * JAR;VIS NETWORK WEAVE 002 — portable, voluntary opportunity handoffs.
 *
 * Existing source owners remain sovereign. This module composes:
 *   source-labelled operator opportunity -> native Any Invitation proposals
 *   -> exact MOTIF WAKE study -> optional unsigned HOLD carrier
 *   -> a separate, explicitly human-reviewed local draft.
 *
 * No remote read/write, person matching, notification, public upload or receiver admission.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { LocalJournal } from "./journal.mjs";
import { proposeInvitationActions, verifyInvitationCartridge } from "./any-invitation.mjs";

const bad=(reason,status=409)=>Object.assign(new Error("HOLD: "+reason),{status});
const sha=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const isObject=x=>x&&typeof x==="object"&&!Array.isArray(x);
const WORDS=["small","creative","autonomous"];
const KINDS=new Set(["food","creative","transport","make","question","open"]);
const TIMES=new Set(["now","soon","open"]);
const studyRe=/^[0-9a-f]{20}$/;
const receiptRe=/^[0-9a-f]{64}$/;
const txt=(value,field,max=500)=>{
 if(typeof value!=="string"||!value.trim()||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))
   throw bad(field+" must be readable, present, and at most "+max+" characters",400);
 const text=value.trim();
 if(/(?:https?:\/\/|mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d ()-]{7,}\d))/i.test(text))
   throw bad("do not put contacts, phone numbers or links into opportunity text",400);
 return text;
};

/**
 * Descriptive source atlas, inspected against owner-public GitHub sources.
 * Every 'road' below means thematic adjacency only, not an integration or
 * institutional partnership. Null sourceURL = operator context only.
 */
export const NETWORK=Object.freeze([
 {id:"fellowship",label:"Fellowship / local gathering",scope:"HUMAN_ORGANIZED",sourceURL:"https://github.com/the-static-collective/webZ/blob/main/docs/JUBILEE-CIRCUIT-001.md",maturity:"ILLUSTRATIVE_CONTEXT_NOT_PARTNER",tags:["creative","open","question"],note:"Human-led activities; no church is automatically enrolled."},
 {id:"coalition",label:"Coalition of Care / neighbors",scope:"HUMAN_ORGANIZED",sourceURL:null,maturity:"OPERATOR_CONTEXT_ONLY",tags:["open","question","make"],note:"No institutional enrollment, verified mandate or access is inferred."},
 {id:"garden",label:"Garden / NanaSpork",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/BananaSpork/blob/main/README.md",maturity:"SOURCE_DESCRIPTIVE",tags:["food","open","make"],note:"Help Slip review and Campfire authority remain with Garden/Jubilee."},
 {id:"seven-table",label:"The Seventh Table / invitation chain",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/webZ/pull/121",maturity:"UNMERGED_SOURCE_BRANCH",tags:["open","question","creative"],note:"Up to two invites / ambassador model; source branch does not imply public enrollment."},
 {id:"now-route",label:"NOW-ROUTE / local exchange",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/JAR-VIS/pull/55",maturity:"EXPERIMENTAL_LIVE_CLAIM_NOT_FIELD_PROOF",tags:["food","transport","open"],note:"Separate time-bounded invite-only authority. No perishable food or private location import."},
 {id:"commons",label:"AI × Human Commons / shared build",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/JAR-VIS/blob/main/docs/AI-HUMAN-COMMONS-017.md",maturity:"HELD_REVIEW_DISTINCT",tags:["make","creative","question"],note:"Public admitted read / scoped HELD proposals, not direct publication."},
 {id:"work-inherits",label:"Tomorrow's Work / stewardship",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/JAR-VIS/blob/main/docs/WORK-THAT-INHERITS-001.md",maturity:"LOCAL_OPERATOR",tags:["open","make","question"],note:"Operator-recorded reports are not independent verification."},
 {id:"webz",label:"webZ / portable crossing",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/webZ/blob/main/README.md",maturity:"SOURCE_DESCRIPTIVE",tags:["open","question","creative"],note:"Crossing is traveler choice; a copied link is not a credential."},
 {id:"relatte",label:"reLATTE / sovereign crossing",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/reLATTE/blob/main/README.md",maturity:"EXPERIMENTAL_PROTOCOL",tags:["open","make","question"],note:"A source checksum is not signature, consent, truth or admission."},
 {id:"jubilee",label:"Book of Acts / Jubilee Engine",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/Jubilee-Engine-VM/blob/main/README.md",maturity:"SOURCE_DESCRIPTIVE",tags:["open","question","make"],note:"Unconfirmed activity is never automatically compiled as a receipt."},
 {id:"static-os",label:"Static OS / local work",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/static-os",maturity:"SOURCE_DESCRIPTIVE",tags:["make","open"],note:"Local composition is not remote execution or delegated authority."},
 {id:"ghot",label:"GHoT / heterogeneous devices",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/GHoT",maturity:"SOURCE_DESCRIPTIVE",tags:["make","transport"],note:"Computing capability and physical custody require their own review."},
 {id:"free-graph",label:"Free Graph / possible relations",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/free-graph",maturity:"SOURCE_DESCRIPTIVE",tags:["question","open","make"],note:"Candidate edges do not declare people connected or outcomes achieved."},
 {id:"full-measure",label:"Full Measure / participation world",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/full-measure-world-layer",maturity:"SOURCE_DESCRIPTIVE",tags:["creative","open"],note:"World participation is not consent to a real-world action."},
 {id:"memento",label:"MEMENTO / inheritance",scope:"SOURCE_ORGAN",sourceURL:"https://github.com/the-static-collective/MEMENTO",maturity:"SOURCE_DESCRIPTIVE",tags:["creative","question","open"],note:"Tradition and uptake do not confer current authority."},
]);
const byId=new Map(NETWORK.map(n=>[n.id,n]));
export function networkAtlas() {
 return NETWORK.map(({tags,...rest})=>({...rest,tags:[...tags],connectedToWake:false}));
}
function routeCandidates(source,kind){
 return NETWORK.filter(n=>n.id!==source.id).map(n=>{
   const shared=n.tags.filter(t=>t===kind || (kind==="open"&&t==="open"));
   return {id:n.id,label:n.label,reason:shared.length?
    "Thematic overlap: "+shared.join(", "):"No declared thematic overlap",
     thematicFit:shared.length>0,connected:false,admitted:false,
     destinationReviewRequired:true};
 }).sort((a,b)=>Number(b.thematicFit)-Number(a.thematicFit)||a.id.localeCompare(b.id)).slice(0,8);
}
const CARTRIDGE_URL=new URL("../cartridges/any-invitation-001.json",import.meta.url);
async function invitationCartridge(){
 const c=JSON.parse(await readFile(CARTRIDGE_URL,"utf8"));
 verifyInvitationCartridge(c);
 return c;
}
function normalize(raw){
 if(!isObject(raw))throw bad("typed packet required",400);
 const source=byId.get(raw.sourceNode);
 if(!source)throw bad("source node not in inspected atlas",400);
 const target=raw.targetNode==null||raw.targetNode===""?null:byId.get(raw.targetNode);
 if(raw.targetNode!=null&&raw.targetNode!==""&&!target)throw bad("unknown destination node",400);
 if(target&&target.id===source.id)throw bad("source and destination must be distinct",400);
 if(!KINDS.has(raw.kind))throw bad("unknown opportunity kind",400);
 if(!TIMES.has(raw.when))throw bad("unknown availability",400);
 if(!isObject(raw.asks))throw bad("SMALL/CREATIVE/AUTONOMOUS asks required",400);
 const asks=Object.fromEntries(WORDS.map(k=>[k,txt(raw.asks[k],k)]));
 const parentStudyId=raw.parentStudyId||null;
 const parentSlot=raw.parentSlot||null;
 if(parentStudyId!==null&&!studyRe.test(parentStudyId))throw bad("bad parent study id",400);
 if((parentStudyId===null)!==(parentSlot===null))throw bad("parent study and slot must travel together",400);
 if(parentSlot!==null&&!/^P[0-9]{3}$/.test(parentSlot))throw bad("bad parent slot",400);
 return {
  schema:"jarvis.weave-opportunity/v1", sourceNode:source.id,sourceURL:source.sourceURL,
  targetNode:target?.id||null,kind:raw.kind,when:raw.when,
  title:txt(raw.title,"title",180),
  context:txt(raw.context,"context",500),
  asks,parentStudyId,parentSlot,
  privacy:"OPERATOR_ENTERED_NONPERSONAL",
  authority:"PROPOSAL_ONLY"
 };
}
export function validateCarrier(carrier){
 if(!isObject(carrier)||carrier.schema!=="jarvis.weave-handoff/v1"||
   carrier.recipientDisposition!=="HOLD_FOR_INDEPENDENT_REVIEW"||
   carrier.externalDelivery!==false||carrier.signed!==false||carrier.admitted!==false||
   !receiptRe.test(carrier.payloadSha256||"") || !isObject(carrier.payload) ||
   !studyRe.test(carrier.originStudyId||""))
   throw bad("invalid foreign carrier or false authority claims",400);
 if(!byId.has(carrier.sourceNode)||!byId.has(carrier.targetNode)||
   carrier.sourceNode===carrier.targetNode)throw bad("unknown route in foreign carrier",400);
 // Only canonical fields are accepted; no payloads smuggling external commands.
 const allowed=new Set(["schema","payload","payloadSha256","originStudyId","sourceNode","targetNode",
   "recipientDisposition","externalDelivery","signed","admitted"]);
 if(Object.keys(carrier).some(k=>!allowed.has(k)))throw bad("foreign carrier contains unexpected fields",400);
 const normalized=normalize(carrier.payload);
 if(carrier.payloadSha256!==sha(normalized)||normalized.sourceNode!==carrier.sourceNode||
   normalized.targetNode!==carrier.targetNode||
   JSON.stringify(normalized)!==JSON.stringify(carrier.payload))throw bad("foreign carrier checksum or provenance mismatch",400);
 return normalized;
}

export class NetworkWeave {
 #wake;#journal;#tail=Promise.resolve();
 constructor(wake,journal){this.#wake=wake;this.#journal=journal}
 static async open({wake,journalPath}){
  if(!wake || !journalPath)throw bad("wake and journal required",400);
  const journal=await LocalJournal.open(journalPath);
  const instance=new NetworkWeave(wake,journal);
  await instance.state();
  return instance;
 }
 #exclusive(fn){const x=this.#tail.then(fn);this.#tail=x.catch(()=>{});return x}
 #entries(){
   const list=this.#journal.list(),known=new Set(),rows=[];
   for(const e of list){
     if(!["WAKE_WEAVE_ADMITTED","WAKE_WEAVE_RECEIVED_DRAFT"].includes(e.kind))
       throw bad("unexpected event in weave journal");
     const p=e.payload;
     if(!isObject(p)||!studyRe.test(p.studyId||"")||
        !receiptRe.test(p.packetSha256||"")||!byId.has(p.sourceNode)||
        (p.targetNode!==null&&!byId.has(p.targetNode))||
        p.sourceNode===p.targetNode||
        (p.parentStudyId!==null&&!studyRe.test(p.parentStudyId||""))||
        (p.parentStudyId===null? p.parentSlot!==null:!/^P[0-9]{3}$/.test(p.parentSlot||""))||
        p.disposition!=="LOCAL_STUDY_ONLY"||
        !KINDS.has(p.kind)||!TIMES.has(p.when)||
        known.has(p.studyId)||
        (p.parentStudyId&&!known.has(p.parentStudyId))||
        p.parentStudyId===p.studyId)throw bad("weave ledger event inconsistent with local graph");
     if(e.kind==="WAKE_WEAVE_RECEIVED_DRAFT" &&
       (!studyRe.test(p.foreignOriginStudyId||"") ||
        !byId.has(p.foreignSourceNode) ||
        p.sourceNode===p.foreignSourceNode ||
        p.targetNode!==null || p.parentStudyId!==null))
       throw bad("foreign draft cannot impersonate local admission or parenthood");
     if(e.kind==="WAKE_WEAVE_ADMITTED" &&
       (Object.hasOwn(p,"foreignOriginStudyId")||Object.hasOwn(p,"foreignSourceNode")))
       throw bad("local study cannot claim a foreign inbound receipt");
     known.add(p.studyId);
     rows.push({...p,at:e.at});
   }
   return rows;
 }
 async state(){
  const entries=this.#entries();
  const studies=(await this.#wake.state()).studies;
  const ids=new Set(studies.map(s=>s.studyId));
  if(entries.some(e=>!ids.has(e.studyId)))throw bad("weave ledger references missing WAKE study");
  return {schema:"jarvis.network-weave/v1",atlas:networkAtlas(),
   edges:entries,studyCount:studies.length,
   externalDelivery:false,remoteReceiverConnected:false,
   connectionsClaimed:0,
   note:"Semantic routing proposals and local operator assertions, not relationships, field proof or automated network exchange."};
 }
 async preview(raw){
  const payload=normalize(raw);
  const source=byId.get(payload.sourceNode);
  const suggestions=routeCandidates(source,payload.kind);
  const c=await invitationCartridge();
  const question=payload.context+" "+payload.title;
  const plan=proposeInvitationActions(question,c,{when:payload.when});
  return {schema:"jarvis.weave-preview/v1",payload,packetSha256:sha(payload),
   source:{id:source.id,label:source.label,sourceURL:source.sourceURL,maturity:source.maturity},
   destination:payload.targetNode?byId.get(payload.targetNode).label:null,
   suggestedReceivers:suggestions,invitationRoutes:plan.actions,
   disposition:"HOLD_FOR_HUMAN_REVIEW",effects:[],
   ownerVerification:false,externalContact:false,readForeignSource:false,
   note:"These are descriptive affinities, not verified links, live imports or permissions."};
 }
 async #confirmParent(payload){
  if(!payload.parentStudyId)return;
  const ancestors=this.#entries();
  const parent=ancestors.find(x=>x.studyId===payload.parentStudyId);
  if(!parent)throw bad("parent must be a locally reviewed weave study");
  const state=await this.#wake.state(payload.parentStudyId);
  if(state.active.states[payload.parentSlot]!=="NOVEL_ACTION")
    throw bad("parent requires recorded operator-attested unplanned action before forking");
 }
 async admit({packet,packetSha256,reviewed=false,sourceReuseApproved=false,
   verifiedOpportunity=false,count=100,seed=2026}={}){
  return this.#exclusive(async()=>{
   if(reviewed!==true||sourceReuseApproved!==true)
     throw bad("operator review and permission to carry this particular wording required");
   if(typeof verifiedOpportunity!=="boolean")throw bad("opportunity assertion must be boolean",400);
   const preview=await this.preview(packet);
   if(packetSha256!==preview.packetSha256)throw bad("stale preview; review exact changed text",409);
   await this.#confirmParent(preview.payload);
   const p=preview.payload;
   const planResult=await this.#wake.create({title:p.title,context:p.context,
    small:p.asks.small,creative:p.asks.creative,autonomous:p.asks.autonomous,
    verifiedOpportunity,count,seed});
   const studyId=planResult.active.studyId;
   const entries=this.#entries();
   const already=entries.find(e=>e.studyId===studyId);
   if(already){
     if(already.packetSha256!==packetSha256||already.sourceNode!==p.sourceNode||
       already.kind!==p.kind||already.when!==p.when||
       already.targetNode!==p.targetNode||already.parentStudyId!==p.parentStudyId||
       already.parentSlot!==p.parentSlot)throw bad("same study has different declared lineage; create distinct content",409);
     return {reused:true,studyId,sourceNode:p.sourceNode,
       targetNode:p.targetNode,disposition:"LOCAL_STUDY_ONLY",
       reviewRequiredAtDestination:true,externalDelivery:false};
   }
   await this.#journal.append("WAKE_WEAVE_ADMITTED",{
    studyId,packetSha256,sourceNode:p.sourceNode,targetNode:p.targetNode,
    kind:p.kind,when:p.when,
    parentStudyId:p.parentStudyId,parentSlot:p.parentSlot,
    disposition:"LOCAL_STUDY_ONLY"
   });
   return {reused:false,studyId,sourceNode:p.sourceNode,
    targetNode:p.targetNode,disposition:"LOCAL_STUDY_ONLY",
    reviewRequiredAtDestination:true,externalDelivery:false};
  });
 }
 async prepareCarrier({studyId,targetNode,humanShareReviewed=false}={}){
  if(humanShareReviewed!==true)throw bad("separate human approval to export public-safe content required");
  if(!studyRe.test(studyId||""))throw bad("invalid study id",400);
  const target=byId.get(targetNode);
  if(!target)throw bad("unknown target organ",400);
  const link=this.#entries().find(x=>x.studyId===studyId);
  if(!link)throw bad("only reviewed weave studies may export carriers");
  if(link.sourceNode===targetNode)throw bad("target cannot equal source",400);
  const state=await this.#wake.state(studyId);
  const spec=state.active.plan.spec;
  const payload=normalize({sourceNode:link.sourceNode,targetNode:target.id,
    kind:link.kind,when:link.when,title:spec.title,context:spec.context,asks:spec.actions,
    parentStudyId:link.parentStudyId,parentSlot:link.parentSlot});
  return {schema:"jarvis.weave-handoff/v1",payload,payloadSha256:sha(payload),
    originStudyId:studyId,sourceNode:link.sourceNode,targetNode:target.id,
    recipientDisposition:"HOLD_FOR_INDEPENDENT_REVIEW",
    externalDelivery:false,signed:false,admitted:false};
 }
 async inspectCarrier(carrier){
  const normalized=validateCarrier(carrier);
  return {schema:"jarvis.weave-receipt/v1",payloadSha256:carrier.payloadSha256,
    sourceNode:normalized.sourceNode,targetNode:normalized.targetNode,
    originStudyId:carrier.originStudyId,selectedTitle:normalized.title,
    disposition:"HOLD_FOR_INDEPENDENT_REVIEW",
    externallyAuthenticated:false,sourceVerified:false,receivedAuthority:false};
 }
 async receiveCarrier({carrier,independentlyReviewed=false,localOperatorApproved=false,
   count=3,seed=2026}={}){
  return this.#exclusive(async()=>{
   if(independentlyReviewed!==true||localOperatorApproved!==true)
      throw bad("independent local receiver review required");
   const p=validateCarrier(carrier);
   const target=byId.get(p.targetNode);
   // Never call the original source authority verified or treat packet as real
   // opportunity: every imported campaign is a NEW, unverified local draft.
   const state=await this.#wake.create({title:p.title,context:p.context,
      small:p.asks.small,creative:p.asks.creative,autonomous:p.asks.autonomous,
      verifiedOpportunity:false,count,seed});
   const studyId=state.active.studyId;
   const existing=this.#entries().find(e=>e.studyId===studyId);
   const expected={studyId,packetSha256:carrier.payloadSha256,
     sourceNode:target.id,targetNode:null,kind:p.kind,when:p.when,
     parentStudyId:null,parentSlot:null,
     foreignOriginStudyId:carrier.originStudyId,foreignSourceNode:p.sourceNode,
     disposition:"LOCAL_STUDY_ONLY"};
   if(existing){
     if(existing.packetSha256!==expected.packetSha256 ||
        existing.kind!==expected.kind||existing.when!==expected.when ||
        existing.foreignOriginStudyId!==expected.foreignOriginStudyId ||
        existing.foreignSourceNode!==expected.foreignSourceNode)
        throw bad("already recorded study is not this foreign lineage");
   }else{
     await this.#journal.append("WAKE_WEAVE_RECEIVED_DRAFT",expected);
   }
   return {schema:"jarvis.weave-received-draft/v1",studyId,
     reused:Boolean(existing),receivedBy:target.id,sourceNode:p.sourceNode,
     checkedPacket:carrier.payloadSha256,storedAs:"LOCAL_UNVERIFIED_DRAFT",
     recipientDisposition:"HOLD_FOR_LOCAL_OPERATOR",
     remotelyAdmitted:false,externalDelivery:false};
  });
 }
}
