// JAR;VIS SOURCE-OWNED METHOD TOURNAMENT 003
// Execute only original, exact Git-blob-reviewed MOTIF tournament code.
// The experimental method is run by MOTIF's own fixed Docker profile,
// never imported into the JAR;VIS web process.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

export const MOTIF_TOURNAMENT_SOURCE_COMMIT="9135a4592fecf7461e20c8248455726aa7f4c403";
export const REVIEWED_DONOR_SHA="586be3530d2b5b4d41f810515f9c457d2a27a371";
const base=new URL("../integrations/motif-council/",import.meta.url);
const bridge=new URL("trial_bridge.py",base);
const originals=Object.freeze({
  "motif/method_tournament.py":"175b7250b4629250febd4d646b27d0fdf9b67072",
  "motif/branch_runner.py":"04ccf9701f7ee5cab32ec751ea338dcda7793290",
  "experiments/method-tournament-003/evaluate.cjs":"404da89e15fef856c0d296bf4966a241b22c701e",
  "experiments/method-tournament-003/fixtures.v1.json":"32a50cf8191a05d457802726ef9d75a1e56a3d31",
});
const LIMIT=4096,OUTPUT_LIMIT=196000;
const bad=(message,status=409)=>Object.assign(new Error(message),{status});

export async function inspectMotifTournament(){
  const hashes=[];
  for(const [path,original] of Object.entries(originals)){
    const bytes=await readFile(new URL(path,base));
    const blob=createHash("sha1")
      .update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
    if(blob!==original)throw bad("HOLD: original MOTIF tournament code or fixture changed");
    hashes.push({path,gitBlob:blob});
  }
  return {
    schema:"jarvis.motif-method-tournament-source/v1",
    sourceCommit:MOTIF_TOURNAMENT_SOURCE_COMMIT,
    reviewedDonorCommit:REVIEWED_DONOR_SHA,
    originalFiles:hashes,
    originalCodeVerified:true,
    publicSourceAccessOnlyAfterExplicitRequest:true,
    automaticExecution:false,
    automaticMerge:false,
    methodInstalled:false,
    deployment:"LOCAL_RESEARCH_ONLY"
  };
}

export async function runMotifTournament(question,{
  execute=false,python=process.env.JARVIS_PYTHON||"python3",
  timeoutMs=90000
}={}){
  if(typeof question!=="string"||question.length<3||question.length>180||
    !question.trim()||/[\x00-\x1f\x7f]/.test(question))
    throw bad("A short printable method-research question is required",400);
  if(typeof execute!=="boolean")throw bad("Unknown trial action",400);
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>120000)
    throw bad("Invalid trial deadline",400);
  const source=await inspectMotifTournament();
  const request=JSON.stringify({action:execute?"evaluate":"preview",question});
  if(Buffer.byteLength(request)>LIMIT)throw bad("Research request too large",413);
  const stdout=await new Promise((resolve,reject)=>{
    const child=spawn(python,["-B","-I",fileURLToPath(bridge)],{
      stdio:["pipe","pipe","pipe"],windowsHide:true,
      env:{
        PATH:process.env.PATH||"/usr/bin:/bin",
        HOME:"/nonexistent",LANG:"C.UTF-8",
        PYTHONDONTWRITEBYTECODE:"1",PYTHONNOUSERSITE:"1",
        GIT_CONFIG_NOSYSTEM:"1",GIT_CONFIG_GLOBAL:"/dev/null",
        GIT_TERMINAL_PROMPT:"0",GIT_ALLOW_PROTOCOL:"https",
        GIT_NO_REPLACE_OBJECTS:"1",
        DOCKER_CONFIG:"/nonexistent",
      }
    });
    let out="",size=0,settled=false;
    const finish=(err,result)=>{
      if(settled)return;settled=true;clearTimeout(timer);
      err?reject(err):resolve(result);
    };
    const timer=setTimeout(()=>child.kill("SIGKILL"),timeoutMs);
    child.once("error",()=>finish(bad("HOLD: local reviewed runner unavailable")));
    child.stdout.setEncoding("utf8");
    child.stdout.on("data",chunk=>{
      size+=Buffer.byteLength(chunk,"utf8");
      if(size>OUTPUT_LIMIT)child.kill("SIGKILL");
      else out+=chunk;
    });
    child.stderr.resume(); // Never expose local paths or Git diagnostics to the browser.
    child.once("close",code=>{
      if(code===0 && size<=OUTPUT_LIMIT)finish(null,out);
      else finish(bad("HOLD: original MOTIF source, Git or reviewed sandbox unavailable"));
    });
    child.stdin.on("error",()=>{});
    child.stdin.end(request);
  });
  let result;
  try{result=JSON.parse(stdout);}catch{throw bad("HOLD: invalid reviewed method response");}
  const original=result?.original_motif;
  if(result.schema!=="jarvis.motif-method-tournament-local/v1" ||
     result.action!==(execute?"evaluate":"preview") ||
     result.externalWrites!==false || result.humanDataUsed!==false ||
     result.methodInstalled!==false || result.automaticMerge!==false ||
     !original || original.source?.sha!==REVIEWED_DONOR_SHA ||
     original.source?.ref!=="experiment/reciprocal-004-ecosystem-crosswire-20261112" ||
     original.automatic_merge!==false || original.method_installed!==false)
    throw bad("HOLD: unacceptable source provenance or method authority");
  if(execute){
    if(original.status!=="ORIGINAL_DONOR_EXECUTED_AND_STRONG_CLASSICAL_TOURNAMENT_COMPLETE"||
       original.scorecard?.schema!=="motif.method-tournament-scorecard/v1"||
       original.scorecard?.reliable_improvement_over_strong_classical!==false||
       original.scorecard?.aggregate_on_proposed_only?.candidate_minus_strong_correct!==0||
       !Array.isArray(original.scorecard?.aggregate_on_proposed_only?.cases_regressing_vs_global)||
       !original.scorecard.aggregate_on_proposed_only.cases_regressing_vs_global.length||
       original.held_receipt?.content?.method_installed!==false ||
       original.held_receipt?.content?.automatic_merge!==false)
      throw bad("HOLD: independent transfer verdict or retention policy failed");
  }else if(original.status!=="PREVIEW_NO_DONOR_EXECUTION"){
    throw bad("HOLD: unexpected source-execution state");
  }
  return {
    ...result, source,
    disposition:execute?"REVIEWED_METHOD_TESTED_RETAINED_HELD":"REVIEWED_METHOD_PREVIEW_ONLY",
    publiclyDeployed:false,
    operatorMustApproveEachTrial:true,
  };
}
