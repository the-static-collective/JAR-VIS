// JAR;VIS PORCH-RECEIVER-009: deterministic suggestion only; NEVER a match or authority.
const vocab=Object.freeze({
  food:["food","grocer","meal","farm","garden","vegetable","bread"],
  transport:["ride","transport","car","bus","delivery","move","pickup"],
  tools:["repair","tool","equipment","device","computer","fix"],
  gathering:["meet","festival","event","church","gather","volunteer","table"],
  other:[]
});
const dirs=Object.freeze({
  food:{label:"Food and growing",resource:"https://garden.abundent.org/",note:"Explore an independent community-food prototype; no partner or provider is promised."},
  transport:{label:"Transport and logistics",resource:"",note:"Ask what distance, time and permissions a willing person would need; no transport is confirmed."},
  tools:{label:"Tools and repair",resource:"",note:"Clarify an achievable, safe first step, with equipment and permissions remaining owner-held."},
  gathering:{label:"People and gatherings",resource:"https://becoming.abundent.org/",note:"Explore open ideas and invitations; no association or volunteer enrollment implied."},
  other:{label:"General human question",resource:"https://hello.abundent.org/explore/",note:"A human reviewer should ask which smallest action would actually help."}
});
export function triage(entry){
 if(!entry||!["need","offer","question"].includes(entry.kind)||typeof entry.particular!=="string")throw Error("BOUNDED_CARD_REQUIRED");
 const words=" "+entry.particular.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu," ")+" ";
 const scores=Object.entries(vocab).filter(([k])=>k!=="other").map(([k,keywords])=>[k,keywords.filter(w=>words.includes(" "+w+" ")).length]).sort((a,b)=>b[1]-a[1]);
 const chosen=scores[0]?.[1]>0?scores[0][0]:"other";
 if(entry.area?.startsWith("Website ")&&/^Website feedback \((?:broken|confusing|idea)\): /.test(entry.particular)){
  return Object.freeze({schema:"jarvis/porch-attention-v1",classification:"website-feedback",
    topic:"website",topicLabel:"Website feedback",suggestedResource:"",
    suggestion:"Inspect the named page, reproduce the issue if possible, and reply through the private receipt. Do not assume browser or account identity.",
    disposition:"HOLD_FOR_HUMAN_REVIEW",matchClaim:false,sent:false,verified:false,
    authority:"NO_COMMITMENT_NO_MATCH_NO_PUBLICATION"});
 }
 const base=dirs[chosen];
 return Object.freeze({
  schema:"jarvis/porch-attention-v1",classification:entry.kind,topic:chosen,topicLabel:base.label,
  suggestedResource:base.resource,suggestion:base.note,
  disposition:"HOLD_FOR_HUMAN_REVIEW",matchClaim:false,sent:false,verified:false,
  authority:"NO_COMMITMENT_NO_MATCH_NO_PUBLICATION"
 });
}
