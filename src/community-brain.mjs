// COMMUNITY-BRAIN-006 · Reviewed PUBLIC program design, not survivor testimony.
// JAR remembers capacity gaps; VIS suggests small bounded invitations.
// ATTENTION ≠ AUTHORITY. No live volunteers, legal representation, peer group,
// identities, case files, partner agreements, or contact intake exist here.

export const COMMUNITY_BRAIN_SCHEMA = "jarvis.community-brain/v1";
export const LOOPS = Object.freeze([
  "NOTICE_NEED","NAME_BLOCKER","OPEN_CAPABILITY","VOLUNTARY_INTEREST",
  "HUMAN_PERMISSION","SMALL_TRIAL","DOCUMENT_RETURN","REVIEW_LEARNING"
]);

const source=(id,url,claim,kind="PUBLIC_PROJECT_DOCUMENT")=>Object.freeze({id,url,claim,kind,
  notEvidenceOf:"live service, identity, completed outcome, authorization or partner agreement"});
export const BRAIN_SOURCES=Object.freeze([
 source("SH-028","https://github.com/the-static-collective/webZ/pull/133",
   "Proposed Still Here survivor-first doorway, private-by-default prototype, seven fictional-only design exercises"),
 source("SEATS-027","https://github.com/the-static-collective/webZ/pull/129",
   "Proposed reusable Workboard bottleneck → missing capability → voluntary open seat loop"),
 source("MEMORY-026","https://github.com/the-static-collective/webZ/pull/128",
   "Proposed source-bound Workboard next-action projections from reviewed public comments"),
 source("WORKBOARD-025","https://github.com/the-static-collective/webZ/pull/126",
   "Human-reviewed public discussion model and private pending submissions; no live moderator console"),
 source("CADA-ORG","https://www.cadamn.org/",
   "CADA says it serves south-central Minnesota, including Waseca, with advocacy and community education",
   "INDEPENDENT_ORGANIZATION_WEBSITE"),
 source("LEGALCORPS-ORG","https://legalcorps.org/nonprofit-organizations/",
   "LegalCORPS describes Minnesota nonprofit startup/brief advice and eligibility-dependent assistance",
   "INDEPENDENT_ORGANIZATION_WEBSITE"),
 source("SMRLS-ORG","https://www.smrls.org/legal-services",
   "SMRLS describes eligibility-dependent civil and family legal assistance",
   "INDEPENDENT_ORGANIZATION_WEBSITE")
]);

const gates=[
 {
  id:"founding-companion", title:"Founding Companion", lane:"program-building",priority:1,
  category:"FRIEND_OR_TRUSTED_COLLABORATOR",
  blocker:"A second trusted person is needed to challenge and shape the first small experiment.",
  safeFirst:"Ask one trusted friend to review a fictional first-gathering format and identify where it feels unsafe, confusing or unhelpful.",
  return:"One corrected invitation, one safeguarding objection, and one smaller trial to test.",
  authority:"A friend may co-design; they do not automatically become a facilitator, moderator, director, or legal adviser.",
  prohibited:"Do not solicit case histories, identify survivors, launch a peer group or claim the friend has agreed.",
  status:"OPEN_INVITATION_UNFILLED",requiresHumanApproval:true,sourceIds:["SH-028","SEATS-027"]
 },
 {
  id:"survivor-advocate",title:"Survivor Advocacy Consultation",lane:"safeguarding",priority:2,
  category:"INDEPENDENT_PROFESSIONAL_INPUT",
  blocker:"Confidentiality, safe engagement, abuse dynamics and referral boundaries need experienced review.",
  safeFirst:"Draft a no-identifying-details request for a consultation on designing a safe, voluntary, father-inclusive peer community. CADA is one independent possible contact.",
  return:"A source-attributed checklist of safeguarding concerns and any advice explicitly authorized for reuse.",
  authority:"The advocate or organization chooses whether to respond or collaborate; discussion creates no partnership.",
  prohibited:"No unsolicited survivor referrals, actual case documents, pressure to use services, or organizational endorsement claims.",
  status:"CONSULTATION_NOT_REQUESTED",requiresHumanApproval:true,sourceIds:["SH-028","CADA-ORG"]
 },
 {
  id:"nonprofit-counsel",title:"Nonprofit Formation Counsel",lane:"governance",priority:3,
  category:"INDEPENDENT_PROFESSIONAL_INPUT",
  blocker:"Organizational duties, liability, confidentiality, governance and the best legal structure require qualified advice.",
  safeFirst:"Request an eligibility-dependent brief nonprofit/startup consultation; ask whether an informal project or fiscal sponsor is more appropriate before incorporation. LegalCORPS is an independent possible option.",
  return:"A dated list of legal structure and liability questions, with the lawyer's advice kept in its proper confidential custody.",
  authority:"Only qualified counsel advises on organizational law; a website cannot appoint counsel or promise free representation.",
  prohibited:"Do not claim incorporated or tax-exempt status, privilege, attorney engagement, free full representation or funding.",
  status:"CONSULTATION_NOT_REQUESTED",requiresHumanApproval:true,sourceIds:["LEGALCORPS-ORG","SH-028"]
 },
 {
  id:"personal-legal-aid",title:"Personal Family-Law Assistance (Separate)",lane:"personal-private",priority:4,
  category:"INDEPENDENT_PERSONAL_OPTION",
  blocker:"Individual parenting/custody matters are legally distinct from the group and need case-specific qualified advice.",
  safeFirst:"Consider an independent eligibility check with a qualified family-law legal aid provider such as SMRLS; do not transfer facts about the case into JAR;VIS.",
  return:"Personal next steps stay with the individual, not the project's shared knowledge, activity reports, or recruitment statistics.",
  authority:"Only a qualified legal professional retained for the case can advise or represent the individual.",
  prohibited:"No case intake or custody adjudication; do not merge personal evidence with volunteer recruiting, group governance or public GRAFT.",
  status:"PRIVATE_OPTION_NOT_ENROLLED",requiresHumanApproval:true,sourceIds:["SMRLS-ORG"]
 },
 {
  id:"privacy-steward",title:"Privacy & Safety Steward",lane:"safeguarding",priority:5,
  category:"FICTIONAL_ONLY_DESIGN_SEAT",
  blocker:"The group lacks an operator-approved safe-use policy for monitored devices, confidentiality and information minimization.",
  safeFirst:"Use fictional device-monitoring and oversharing scenarios to draft a data-minimization and incident-response checklist.",
  return:"A reviewable rule set distinguishing what must never be collected, what needs consent, and how to report a safety problem.",
  authority:"A responsible operator and qualified safeguarding reviewers must approve procedures before real participation.",
  prohibited:"No credentials, identities, private submissions, participant matching, case files or implied safety guarantee.",
  status:"OPEN_DESIGN_SEAT_UNFILLED",requiresHumanApproval:true,sourceIds:["SH-028"]
 },
 {
  id:"review-steward",title:"Human Review / Moderation Steward",lane:"safeguarding",priority:6,
  category:"FICTIONAL_ONLY_DESIGN_SEAT",
  blocker:"Workboard's private submission queue has no appointed moderator and no dedicated authenticated review console.",
  safeFirst:"Evaluate fictional posts and draft publish / redact / decline / withdraw / appeal criteria with privacy and fairness checks.",
  return:"A rubric for operator approval and a list of technical moderation-console requirements.",
  authority:"Only the operator may explicitly authorize vetted and supervised reviewers to see private submissions.",
  prohibited:"No live moderation, database access, automatic publication, volunteer impersonation or treating interest as appointment.",
  status:"KNOWN_IMPLEMENTATION_GAP_UNFILLED",requiresHumanApproval:true,sourceIds:["WORKBOARD-025","SEATS-027","SH-028"]
 },
 {
  id:"peer-presence",title:"Peer Presence Designer",lane:"support-design",priority:7,
  category:"FICTIONAL_ONLY_DESIGN_SEAT",
  blocker:"A safe format for being heard without having to prove or disclose everything has not been operationally established.",
  safeFirst:"Role-play a fictional ten-minute listening session with opt-out, no disclosure demand and appropriate boundaries.",
  return:"A short consent-first listening script for qualified review.",
  authority:"Live peer matching requires a vetted responsible operator and separate informed consent.",
  prohibited:"No unsupervised matchmaking, diagnosing people, hearing live disclosures or promising confidentiality.",
  status:"OPEN_DESIGN_SEAT_UNFILLED",requiresHumanApproval:true,sourceIds:["SH-028"]
 },
 {
  id:"chronology-designer",title:"Chronology & Private Tools Designer",lane:"private-tools",priority:8,
  category:"FICTIONAL_ONLY_DESIGN_SEAT",
  blocker:"Survivors need private, source-conscious documentation tools that do not expose records to a public AI or graph.",
  safeFirst:"On fictional examples, separate observed events, reported claims, inferences and outstanding questions; test a local-only template.",
  return:"A reproducible local-only template and an explicit data-retention and threat-model note.",
  authority:"Survivors control originals and sharing; an authorized professional determines evidentiary use.",
  prohibited:"Do not import testimony, screenshots, children’s details, custody records or contacts into public JAR;VIS/GRAFT.",
  status:"OPEN_DESIGN_SEAT_UNFILLED",requiresHumanApproval:true,sourceIds:["SH-028"]
 }
].map(x=>Object.freeze({...x,sourceIds:Object.freeze(x.sourceIds)})));

export const BRAIN_SEATS=Object.freeze(gates);
const seatIndex=new Map(BRAIN_SEATS.map(x=>[x.id,x]));
const ROUTES=Object.freeze({
 start:["founding-companion","survivor-advocate","nonprofit-counsel"],
 legal:["nonprofit-counsel","personal-legal-aid"],
 support:["founding-companion","survivor-advocate","privacy-steward","peer-presence"],
 safety:["privacy-steward","survivor-advocate","review-steward"],
 moderate:["review-steward","privacy-steward"],
 documents:["chronology-designer","privacy-steward"],
 volunteer:["founding-companion","review-steward","peer-presence"]
});
const COPY=x=>structuredClone(x);
export function communityBrain({focus="start"}={}){
 if(!Object.hasOwn(ROUTES,focus))throw new Error("Unknown brain focus");
 const selected=ROUTES[focus].map(id=>seatIndex.get(id));
 const neededSources=new Set(selected.flatMap(s=>s.sourceIds));
 return COPY({
  schema:COMMUNITY_BRAIN_SCHEMA,
  title:"Still Here × JAR;VIS · from bottleneck to open seat",
  focus,mission:"Make a survivor-centered, father-inclusive community possible without requiring public disclosure or proof. All genders welcome.",
  phase:"INDEPENDENT_PROTOTYPE_UNSTAFFED",
  sourcePosture:"EDITORIAL_PUBLIC_PROJECT_AND_INDEPENDENT_OPTION",
  membershipConfirmed:0,rolesFilled:0,legalRepresentation:false,peerSupportOperating:false,
  contactsMadeByJarvis:0,backendWrite:false,automaticMatching:false,
  separation:"Personal legal/custody records must never enter shared group memory or recruitment.",
  next: selected.map(({id,title,lane,category,blocker,safeFirst,return:returned,authority,prohibited,status,requiresHumanApproval,sourceIds})=>({
   id,title,lane,category,blocker,safeFirst,return:returned,authority,prohibited,status,requiresHumanApproval,sourceIds
  })),
  sources:BRAIN_SOURCES.filter(s=>neededSources.has(s.id)),
  flow:COPY(LOOPS),
  coreLaw:"When work hits a bottleneck, name the missing capability, invite a voluntary bounded contribution, and let the actual authority owner decide. Survivors owe no stories.",
  safety:"No intake, no case search, no active group, no direct contact, no emergency response or legal advice. A draft role is not a position.",
  sourceScope:"Static curated sources as of 2026-10-26; check external organizations' current services and eligibility directly."
 });
}
export const BRAIN_FOCI=Object.freeze(Object.keys(ROUTES));
export function routeCommunityIntent(question){
 if(typeof question!=="string"||question.length>500)return null;
 const q=question.toLowerCase();
 if(!/(still here|survivor|survivors|domestic abus|abusive relationship|support group|father.*support|dads?.*support|peer support|founding companion|moderation role|recruitment bottleneck|free counsel|legal aid.*group)/i.test(q))return null;
 if(/custody|personal legal|family law/.test(q))return "legal";
 if(/moderator|moderation|review steward|approve posts/.test(q))return "moderate";
 if(/blackstar|chronology|evidence|documentation/.test(q))return "documents";
 if(/privacy|confidential|safety|safeguard/.test(q))return "safety";
 if(/friend|lawyer|counsel|who do i need|start|founder|first/.test(q))return "start";
 return "support";
}
export function communityBrainAnswer(question){
 const focus=routeCommunityIntent(question);
 if(!focus)return null;
 const b=communityBrain({focus});
 const steps=b.next.slice(0,3).map(s=>s.title+": "+s.safeFirst).join(" ");
 return {
  schema:"jarvis.attention/v0",
  answer:"Still Here is an unstaffed independent design prototype. Proposed next openings: "+steps+
    " None is filled or authorized; eligibility and participation are unverified. No case histories belong in this shared brain. Find public prototype/role design at the source links, and keep personal legal needs separate.",
  mode:"deterministic-local-source-scoped",
  limits:"Public planning only; no case intake, live support, legal advice, volunteered persons, sourced approval, or external contact",
  brain:{focus,phase:b.phase,sourceIds:b.sources.map(s=>s.id),authority:"NONE",next:b.next.map(x=>x.id)}
 };
}
