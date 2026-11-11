/** Local, proposal-only reciprocal crossing between JAR;VIS and source-owned MOTIF-003.
 * The native MOTIF algorithm is byte-pinned. Neither peer acquires execution,
 * learning, publication, or authority through this comparison.
 */
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

export const SOURCE_REPO = "the-static-collective/MOTIF";
export const SOURCE_PATH = "experiments/003/affordance.py";
export const SOURCE_BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf";
export const SCHEMA = "jarvis.motif-reciprocal/v1";
const sourceUrl=new URL("../integrations/motif-003/affordance.py",import.meta.url);
const bridgeUrl=new URL("../integrations/motif-003/bridge.py",import.meta.url);
const fail=(reason,status=409)=>Object.assign(new Error("HOLD: "+reason),{status});

export async function verifyMotifSource() {
  const raw=await readFile(sourceUrl);
  const header=Buffer.from("blob "+raw.length+"\0");
  const digest=createHash("sha1").update(header).update(raw).digest("hex");
  if(digest!==SOURCE_BLOB)throw fail("MOTIF source pin changed");
  return true;
}

export async function callMotif(payload,{python=process.env.JARVIS_PYTHON||"python3"}={}) {
  await verifyMotifSource();
  const input=JSON.stringify(payload);
  if(Buffer.byteLength(input)>8192)throw fail("request too large",413);
  let output;
  try {
    output=await new Promise((resolve,reject)=>{
      const child=spawn(python,["-B","-I",fileURLToPath(bridgeUrl)],{
        stdio:["pipe","pipe","pipe"],windowsHide:true,
        env:{PATH:process.env.PATH||"",PYTHONDONTWRITEBYTECODE:"1"}
      });
      let data="",size=0,settled=false;
      const timer=setTimeout(()=>child.kill("SIGKILL"),3500);
      const finish=(error,value)=>{
        if(settled)return;settled=true;clearTimeout(timer);
        error?reject(error):resolve(value);
      };
      child.on("error",finish);
      child.stdout.on("data",chunk=>{
        size+=chunk.length;
        if(size>32768)child.kill("SIGKILL");else data+=chunk.toString("utf8");
      });
      child.stderr.on("data",()=>{}); // Never echo source payload or stderr.
      child.on("close",code=>code===0&&size<=32768?
        finish(null,data):finish(fail("MOTIF bridge unavailable or refused")));
      child.stdin.on("error",()=>{});
      child.stdin.end(input);
    });
  }catch {throw fail("MOTIF bridge unavailable or refused");}
  let result;
  try{result=JSON.parse(output);}catch{throw fail("invalid MOTIF reply");}
  if(result?.schema!=="jarvis.motif-reciprocal-result/v1"||
      result.native_kernel!=="MOTIF-003"||
      result.external_effect!==false||result.real_world_authority!==false||
      result.trained_model!==false||result.observed_external_outcomes!==0||
      !Array.isArray(result.first_moves))throw fail("MOTIF response contract failed");
  return result;
}

/** Never accepts client-supplied routes: source is the already-pinned local JAR;VIS desk. */
export async function compareReciprocally(text,recursive,{python}={}) {
  if(typeof text!=="string"||text.trim().length<2||text.length>320||
     /[\x00-\x1f\x7f]/.test(text))throw fail("short printable question required",400);
  if(!recursive||typeof recursive.ask!=="function")throw fail("JAR;VIS local desk unavailable");
  const jarvis=await recursive.ask(text);
  const {plan,family}=jarvis;
  if(plan?.schema!=="static-os.recomposer-plan/v0"||
     family?.schema!=="static-os.witness-candidate-family/v0"||
     family.source_plan_id!==plan.plan_id||
     !Array.isArray(family.candidates)||!family.candidates.length||
     !Array.isArray(plan.topics)||!plan.topics.length)throw fail("unrecognized JAR;VIS proposal");
  const routes=family.candidates.map(x=>({
    id:x.candidate_id,steps:x.routes,policy:x.policy
  }));
  const motif=await callMotif({
    schema:"jarvis.motif-reciprocal-request/v1",
    routes,scores:plan.ranked_scores,uncertain:plan.uncertain
  },{python});
  const indexes=new Map(family.candidates.map(x=>[x.candidate_id,x]));
  if(!indexes.has(motif.immediate_id)||!indexes.has(motif.new_choices_id)||
      motif.first_moves.length!==routes.length||
      motif.first_moves.some(row=>!indexes.has(row.candidate_id)))throw fail("MOTIF returned unknown route");
  const baseline=family.candidates[0], alternative=indexes.get(motif.new_choices_id);
  const different=baseline.candidate_id!==alternative.candidate_id;
  const safeRoute=x=>({policy:x.policy,routes:[...x.routes],candidateId:x.candidate_id});
  return {
    schema:SCHEMA,mode:"LOCAL_PROPOSAL_ONLY",
    sources:{jarvis:"STATIC_OS_PINNED_RECOMPOSER",motif:"MOTIF-003_BLOB:"+SOURCE_BLOB},
    jarvis:{baseline:safeRoute(baseline),uncertain:plan.uncertain},
    motif:{
      immediate:safeRoute(indexes.get(motif.immediate_id)),
      affordanceFirst:safeRoute(alternative),
      syntheticFirstMoves:motif.first_moves,
      heuristicDisagreement:motif.disagreement
    },
    peerCritique:{
      motifToJarvis:different?
        "A different route sequence unlocks another simulated continuation; test whether it is useful before changing the router.":
        "No distinct route-sequence recommendation emerged; consider asking a more discriminating question.",
      jarvisToMotif:"A counted continuation is only a proposed next step, not a real-world skill or verified benefit. Avoid treating route length as intelligence."
    },
    improvementCandidates:[
      {target:"JARVIS",status:"HELD_FOR_TEST",proposal:"Compare baseline against proposed alternative on independent, consented task outcomes; keep existing router until it improves."},
      {target:"MOTIF",status:"HELD_FOR_TEST",proposal:plan.uncertain?
        "Current topic classification is uncertain. Add an explicit uncertainty question and frozen evaluation before inventing capabilities.":
        "Replace route-length proxy with measured action feasibility, independent outcome evidence and strong equal-budget baselines."}
    ],
    assessment:{
      status:"UNVALIDATED_RESEARCH_PROPOSAL",
      independentOutcomes:0,modelWeightUpdates:0,automaticPromotion:false,
      questionStored:false,externalEffect:false,dispatch:false,
      limitation:"MOTIF-003 is run on JAR;VIS's proposed route sequences, not on a physical-world causal model."
    }
  };
}
