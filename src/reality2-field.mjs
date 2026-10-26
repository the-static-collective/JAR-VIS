// Reality 2.0 / Waseca: read-only, reviewed-only opportunity inlet for JAR;VIS.
// This is an independent source observation, never an instruction stream, consent, or task assignment.
export const FIELD_ENDPOINT="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-waseca?action=jarvis";
const KINDS=new Set(["need","offer","table","stewardship","feedback","return"]);
const PROGRESS=new Set(["OPEN","NEEDS_STEWARD","BLOCKED","IN_PROGRESS"]);
const lanes=new Set(["food","practical","arts","tools","care","other","site"]);
function boundedString(s,max){return typeof s==="string"?s.slice(0,max):"";}
export function acceptReviewedPacket(packet){
 if(!packet||packet.schema!=="reality2/jarvis-opportunities-v1"||packet.reviewedOnly!==true||packet.source!=="reality2-waseca-001"||!Array.isArray(packet.entries))
  throw new Error("NOT_A_REVIEWED_REALITY2_PACKET");
 const entries=[];
 for(const e of packet.entries.slice(0,50)){
  if(!e||e.verification!=="PUBLICATION_REVIEW_ONLY"||!KINDS.has(e.kind)||!PROGRESS.has(e.progress)||!lanes.has(e.lane))
   continue;
  if(typeof e.title!=="string"||e.title.length<12||e.title.length>110)continue;
  if(typeof e.id!=="string"||!/^[a-f0-9-]{36}$/i.test(e.id))continue;
  entries.push(Object.freeze({
   id:e.id,kind:e.kind,lane:e.lane,progress:e.progress,
   title:boundedString(e.title,110),nextStep:boundedString(e.nextStep,420),
   source:"reality2-waseca-001",evidence:"HUMAN_REVIEWED_PUBLICATION_ONLY",
   role:"candidate",notACommand:true
  }));
 }
 return Object.freeze({asOf:boundedString(packet.observedAt,40),status:"REVIEWED_PUBLIC_PROPOSALS",
  candidates:entries,notices:["Reading this does not accept work, contact people, publish, or validate field claims."]});
}
export async function readReviewedField(fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetcher(FIELD_ENDPOINT,{method:"GET",signal:controller.signal,
   headers:{accept:"application/json"}});
  if(!response.ok)throw new Error("REALITY2_FIELD_UNAVAILABLE");
  return acceptReviewedPacket(await response.json());
 }finally{clearTimeout(timer);}
}
export function proposeNextUsefulThing(packet){
 const p=packet?.candidates;
 if(!Array.isArray(p))throw new Error("REVIEWED_PACKET_REQUIRED");
 const candidate=p.find(x=>x.kind==="feedback"&&x.progress==="BLOCKED")
  ||p.find(x=>x.progress==="NEEDS_STEWARD")||p.find(x=>x.kind==="feedback")||p[0]||null;
 return candidate?{type:"PROPOSAL_NOT_ASSIGNMENT",candidateId:candidate.id,
  what:candidate.title,possibleNextStep:candidate.nextStep||"Ask a willing human what help would be useful.",
  requires:["explicit human decision","independent owner consent","a real outcome receipt"]}:
  {type:"NO_REVIEWED_CANDIDATE",possibleNextStep:"Invite a voluntary, privacy-safe card or bug report; never manufacture a case."};
}
