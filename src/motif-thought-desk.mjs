/** JAR;VIS 011 — private operator-only MOTIF Thought Room. No persistent input or outside actions. */
import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const defaultRoot = fileURLToPath(new URL("../runtime/motif-thought-010/", import.meta.url));
const PIN = Object.freeze({
  "experiments/thought-010/door.py": "e00c341a1ba4beef1687bc337259044b1bb6c7e915f0e4991727cf9a5d074e3f",
  "experiments/thought-010/free_graph.py": "468f6de084a427f6260195b39be7b1403c0d4fda9c8d217b5e28b7d0d13409c7",
  "experiments/thought-009/router.py": "a8846c456ae45dab138a3fa935465c119a79fa286f5b62697ab98b31133ab062",
  "experiments/thought-008/multiview.py": "c7b01faad2b75afe21a41c26a1f0c2433d8b3240a770ed6922dd22b76bcde989",
  "experiments/thought-007/field.py": "881854b122ae0711304229fa7569696970e668adf47028be11d58e158643503f",
});
const GOALS = new Set(["association","dependency","tension","affordance","inventory"]);
const PREDICATES = new Set(["associated","requires","enables","contradicts","precedes"]);
const STATUSES = new Set(["HYPOTHESIS_ONLY","AUTHORED"]);
function hold(reason, status=422) { const e=new Error("HOLD: "+reason);e.status=status;return e; }
function bounded(s,what,limit) {
  if(typeof s!=="string" || !s.trim() || s.length>limit ||
     /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) throw hold("invalid "+what);
  return s.trim();
}
/** Never allow caller to choose privacy, origin, export, pen, code, subprocess or input file. */
function cleanRequest(p) {
  if(!p || typeof p!=="object" || Array.isArray(p) ||
     Object.keys(p).some(k=>!["question","ideas","relationships","goals","show_geometry"].includes(k)))
     throw hold("unsupported browser request fields");
  if(!Array.isArray(p.ideas)||p.ideas.length<1||p.ideas.length>24)throw hold("1..24 ideas required");
  const ideas=p.ideas.map(s=>bounded(s,"idea",160));
  const question=bounded(p.question,"question",300);
  const goals=p.goals??["association"];
  if(!Array.isArray(goals)||!goals.length||goals.length>5||
      new Set(goals).size!==goals.length||goals.some(x=>!GOALS.has(x)))
    throw hold("invalid goals");
  if(p.show_geometry!==undefined && typeof p.show_geometry!=="boolean")throw hold("invalid geometry option");
  const relationships=p.relationships??[];
  if(!Array.isArray(relationships)||relationships.length>120)throw hold("too many relationships");
  const rels=relationships.map((x,i)=>{
    if(!x || typeof x!=="object" || Array.isArray(x) ||
       Object.keys(x).some(k=>!["from","to","predicate","status"].includes(k)) ||
       !Number.isInteger(x.from)||!Number.isInteger(x.to)||x.from<0||x.to<0||
       x.from>=ideas.length||x.to>=ideas.length||x.from===x.to||
       !PREDICATES.has(x.predicate)||!STATUSES.has(x.status))
      throw hold("invalid relation "+i);
    return {from:x.from,to:x.to,predicate:x.predicate,status:x.status,
            origin:"jarvis:single-operator-unverified"};
  });
  return {schema:"motif.thought-door.request.v1",
    request_id:"jarvis-local:"+randomBytes(12).toString("hex"),
    caller:"jarvis-local",mode:"ideas",purpose:"Local operator thought sketch",
    question,ideas,relationships:rels,goals,privacy:"PRIVATE_LOCAL",
    show_geometry:p.show_geometry??true, max_views:Math.min(3,goals.filter(x=>x!=="inventory").length),
    phase:"ABSTRACT_PENCIL",include_views:true,export:"NONE",allow_export:false};
}
async function pinnedEntry(root){
  let real;
  try{real=await realpath(root)}catch{throw hold("reviewed MOTIF snapshot missing",503)}
  for(const [path,expected] of Object.entries(PIN)){
    let bytes;
    try{bytes=await readFile(join(real,path))}catch{throw hold("MOTIF file missing: "+path,503)}
    if(createHash("sha256").update(bytes).digest("hex")!==expected)
      throw hold("source pin mismatch: "+path,503);
  }
  return join(real,"experiments/thought-010/door.py");
}
function inspect(request,reply){
  if(!reply||reply.schema!=="motif.thought-door.reply.v1"||
      reply.request_id!==request.request_id||reply.caller!=="jarvis-local"||
      reply.status!=="PROPOSAL_ONLY"||reply.privacy!=="PRIVATE_LOCAL"||
      reply.export?.status!=="NOT_REQUESTED"||
      reply.pen_status!=="UNCHANGED"||reply.external_authority!=="NONE"||
      !Array.isArray(reply.questions)||reply.questions.some(q=>q.status!=="QUESTION_ONLY")||
      !Array.isArray(reply.selected_lenses)||reply.selected_lenses.length>3||
      !Array.isArray(reply.views)||reply.views.length>3||
      reply.views.some(v=>v.coordinate_authority!=="NONE"||v.semantic_authority!=="UNCHANGED"||
                           v.external_authority!=="NONE"||!Array.isArray(v.placements)||!Array.isArray(v.relations)||
                           v.placements.length>300||v.relations.length>120)||
      !reply.source_only_answers||typeof reply.source_only_answers!=="object"||
      typeof reply.receipt_digest!=="string"||!/^[0-9a-f]{64}$/.test(reply.receipt_digest))
    throw hold("MOTIF reply violated local authority boundary",502);
  return {schema:"jarvis.thought-room.reply.v1",status:"HOLD_FOR_OPERATOR_REVIEW",
    question:request.question,ideas:request.ideas,relationships:request.relationships,
    selected_lenses:reply.selected_lenses,questions:reply.questions,
    source_only_answers:reply.source_only_answers,selection_trace:reply.selection_trace,
    views:reply.views.map(v=>({lens:v.lens,placements:v.placements,relations:v.relations,analysis:v.analysis})),
    view_cost_units:reply.view_cost_units,source_digest:reply.source_evidence_digest,
    receipt_digest:reply.receipt_digest,pen_status:"UNCHANGED",external_authority:"NONE",
    stored:false,exported:false,sent_externally:false,warnings:reply.warnings,
    boundary:"PENCIL ONLY: geometry, authored links and source labels are not verified facts."};
}
class MotifThoughtDesk{
  constructor({root=defaultRoot,python=process.env.MOTIF_THOUGHT_PYTHON??"python3"}={}){
    this.root=resolve(root);this.python=python;this.active=0;
  }
  async status(){
    try{await pinnedEntry(this.root);
      await run(this.python,["-V"],{timeout:2000,maxBuffer:4000,env:{PATH:process.env.PATH??""}});
      return {available:true,mode:"LOCAL_PINNED_PENCIL_ONLY",stored:false,authority:"NONE"};
    }catch(e){return {available:false,mode:"HOLD",reason:e.message,stored:false,authority:"NONE"}}
  }
  async preview(payload){
    const request=cleanRequest(payload);
    if(this.active>=2)throw hold("local thought room busy",429);
    const door=await pinnedEntry(this.root);
    this.active++;
    let dir;
    try{
      dir=await mkdtemp(join(tmpdir(),"jarvis-thought-"));
      const input=join(dir,"request.json");
      await writeFile(input,JSON.stringify(request),{mode:0o600,flag:"wx"});
      const {stdout}=await run(this.python,["-I","-B",door,input],{
        timeout:6000,maxBuffer:900000,env:{PATH:process.env.PATH??"",
          PYTHONNOUSERSITE:"1",PYTHONDONTWRITEBYTECODE:"1"}});
      let reply;
      try{reply=JSON.parse(stdout)}catch{throw hold("MOTIF non-JSON reply",502)}
      return inspect(request,reply);
    }catch(e){if(e.status)throw e;throw hold("local MOTIF Python unavailable or refused",503)}
    finally{if(dir)await rm(dir,{recursive:true,force:true});this.active--}
  }
}
export {MotifThoughtDesk,cleanRequest,PIN};
