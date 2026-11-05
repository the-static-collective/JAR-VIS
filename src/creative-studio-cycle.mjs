#!/usr/bin/env node
/**
 * JAR;VIS-STUDIO-001: an ACTUAL bounded multi-owner production cycle:
 * JAR;VIS brief → planZ round → CANNON original PlayDeck/Toaster checkpoint
 * → planZ evidence replan → CANNON moving video → planZ replan →
 * lemonPRESS draft → JAR;VIS evidence review → planZ replan →
 * lemonPRESS final → local packaged playable screening artifact.
 * NO background autonomy, private user data, external publishing, or new rights.
 */
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {copyFileSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,
 rmSync,renameSync,existsSync,lstatSync,realpathSync,readdirSync} from "node:fs";
import {resolve,join,dirname,basename} from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const LOCK=JSON.parse(readFileSync(join(ROOT,"registry/studio-return-source-lock-v1.json"),"utf8"));
const sha=x=>createHash("sha256").update(x).digest("hex");
const pretty=x=>JSON.stringify(x,null,2)+"\n";
function hold(ok,reason){if(!ok)throw Error("HOLD_JARVIS_STUDIO_"+reason);}
function directory(p){
 const x=resolve(p);hold(existsSync(x)&&lstatSync(x).isDirectory()&&!lstatSync(x).isSymbolicLink(),"DIRECTORY");
 return realpathSync(x);
}
function command(exe,args,timeout=7200000){
 try{return execFileSync(exe,args,{cwd:ROOT,encoding:"utf8",
  stdio:["ignore","pipe","pipe"],timeout,maxBuffer:20*1024*1024}).trim();}
 catch(e){throw Error("HOLD_JARVIS_STUDIO_ORIGINAL_COMMAND_"+String(e.stderr||e.message).slice(0,1100));}
}
function git(root,...args){return command("git",["--no-replace-objects","-C",root,...args],20000);}
function owner(name,path){
 const row=LOCK.sourceOwners.find(x=>x.id===name);hold(row,"UNKNOWN_OWNER");
 const root=directory(path);
 hold(git(root,"rev-parse","HEAD")===row.commit
  &&git(root,"remote","get-url","origin").replace(/\.git$/,"")==="https://github.com/"+row.repo,"OWNER_COMMIT_ORIGIN_"+name);
 const changes=git(root,"status","--porcelain","--untracked-files=normal").split("\n").filter(Boolean);
 hold(changes.every(x=>x==="?? node_modules/"||x==="?? out/"
  ||x==="?? packages/render-remotion/out/"),"OWNER_SOURCE_DIRTY_"+name);
 const files=[];
 for(const [rel,blob] of Object.entries(row.files)){
  const file=join(root,rel),bytes=readFileSync(file);
  const real=createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
  hold(realpathSync(file)===file&&real===blob
   &&git(root,"rev-parse","HEAD:"+rel)===blob,"OWNER_SOURCE_BLOB_"+rel);
  files.push({path:rel,originalGitBlob:blob,sha256:sha(bytes)});
 }
 return {name,repo:row.repo,commit:row.commit,files};
}
export function projectBrief(){
 return {schema:"jarvis.creative-production-brief/v1",
  projectId:"GENESIS-RETURN-001",requestedArtifact:"LOCAL_SCREENING_PACKAGE",
  objective:"Produce an original PlayDeck moving microfilm, transform it with original Haunted Toaster, then compose a source-linked lemonPRESS screening edition.",
  owner:"the-static-collective/JAR-VIS",
  productionStyle:"ITERATIVE_TWO_NATIVE_MEDIA_PASSES_AND_TWO_EDITORIAL_PASSES",
  approval:"SYNTHETIC_TEST_ONLY",publish:false,rightsGranted:false,
  performerContacted:false,modelDelegatedExecution:false,
  audience:"LOCAL_OPERATOR_REVIEW_ONLY"};
}
export function makeReturn(plan,artifactSha256){
 hold(plan?.schema==="planz.creative-production-round/v1"
  &&/^[a-f0-9]{64}$/.test(plan.roundSha256)
  &&/^[a-f0-9]{64}$/.test(artifactSha256),"PHASE_RETURN_INPUT");
 return {schema:"jarvis.production-return/v1",
  round:plan.round,route:plan.route,parentRoundSha256:plan.roundSha256,
  artifactSha256,status:"SOURCE_NATIVE_VERIFIED",
  published:false,rightsGranted:false,realWorldActions:0};
}
export function editorialReview(input,draft,sourceMedia,transformedMedia){
 hold(input?.schema==="jarvis.screening-source/v1"
  &&draft?.schema==="lemonpress.screening-program/v1"
  &&draft.version==="draft"
  &&draft.sourceSha256===sha(pretty(input))
  &&draft.originalMediaSha256===sha(sourceMedia)
  &&draft.transformedMediaSha256===sha(transformedMedia)
  &&input.media.originalScene.sha256===sha(sourceMedia)
  &&input.media.finishedScene.sha256===sha(transformedMedia)
  &&draft.published===false&&draft.rightsGranted===false,"EDITORIAL_SOURCE");
 return {schema:"jarvis.screening-editorial-return/v1",
  decision:"REVISE_WITH_VERIFIED_ORIGIN_AND_OUTPUT",
  sourceSha256:sha(pretty(input)),draftReceiptSha256:draft.receiptSha256,
  mediaHashesVerified:true,publishingAllowed:false,
  review:"Make provenance and two distinct original videos explicit; keep all rights/publication boundaries.",
  realWorldActions:0};
}
function runCannon(mode,root,plan,output,playdeck,toaster){
 const args=[join(root,"scripts/creative-route-switchyard.mjs"),mode,
  "--plan",plan,"--playdeck",playdeck,"--toaster",toaster,"--out",output];
 if(mode==="run")args.push("--authorize","SYNTHETIC_TEST_ONLY");
 const out=JSON.parse(command(process.execPath,args));
 hold(mode==="run"?
  out.status==="SWITCHYARD_NATIVE_ROUTE_EXECUTED_VERIFIED":
  out.status==="ORIGINAL_NATIVE_SWITCHYARD_COLD_VERIFIED","CANNON_RUN_"+mode);
 return out;
}
function planCannon(root,route,file){
 const out=JSON.parse(command(process.execPath,[
  join(root,"scripts/creative-route-switchyard.mjs"),"plan",
  "--route",route,"--out",file],45000));
 hold(out.status==="PINNED_UNEXECUTED_PLAN"&&out.route===route,"CANNON_PLAN");
 return out;
}
function runLemon(mode,root,version,input,out,review){
 const argv=[join(root,"scripts/screening-program.mjs"),mode,
  "--input",input,"--version",version,"--out",out];
 if(version==="final")argv.push("--review",review);
 if(mode==="build")argv.push("--authorize","LOCAL_DRAFT_ONLY");
 const result=JSON.parse(command(process.execPath,argv,60000));
 hold(result.version===version&&result.published===false&&
  result.status===(mode==="build"?"SCREENING_PROGRAM_LOCAL_ONLY":"SCREENING_PROGRAM_COLD_VERIFIED"),
  "LEMONPRESS_"+mode+"_"+version);
 return result;
}
function readJSON(path){return JSON.parse(readFileSync(path,"utf8"));}
function eqFile(file,obj){hold(readFileSync(file,"utf8")===pretty(obj),"EXACT_PACKET_"+basename(file));}
function verifyMedia(out,sourceProof){
 const media=join(out,"media");
 const src=readFileSync(join(media,"original-playdeck-excerpt.mp4"));
 const rendered=readFileSync(join(media,"original-toaster-digested-playdeck.mp4"));
 hold(sha(src)===sourceProof.media.originalScene.sha256
  &&sha(rendered)===sourceProof.media.finishedScene.sha256
  &&src.length>10000&&rendered.length>10000,"ORIGINAL_FILM_MEDIA");
 return {sourceSha256:sha(src),renderedSha256:sha(rendered)};
}
export function finalContract({plans,returns,confirmations,screeningFinal,media}){
 hold(plans?.length===4&&returns?.length===4&&confirmations?.length===4,"FOUR_REAL_ROUNDS");
 hold(plans.map(p=>p.route).join("|")==="CHECKPOINT_STILL|MOVING_EXCERPT|SCREENING_DRAFT|SCREENING_FINAL","PHASES");
 hold(plans.every((p,i)=>returns[i].parentRoundSha256===p.roundSha256
  &&confirmations[i].roundSha256===p.roundSha256
  &&confirmations[i].originalEvidenceSha256===returns[i].artifactSha256
  &&returns[i].status==="SOURCE_NATIVE_VERIFIED"),"RETURN_CHAIN");
 hold(screeningFinal?.schema==="lemonpress.screening-program/v1"
  &&screeningFinal.version==="final"&&screeningFinal.previousDraftSha256
  &&screeningFinal.originalMediaSha256===media.sourceSha256
  &&screeningFinal.transformedMediaSha256===media.renderedSha256
  &&screeningFinal.published===false&&screeningFinal.rightsGranted===false,
  "FINAL_ORIGINAL_HOUSE");
 return {schema:"jarvis.completed-creative-production/v1",
  state:"LOCAL_ARTIFACT_COMPLETE_REVIEW_HELD",
  projectId:"GENESIS-RETURN-001",
  actualRepos:["the-static-collective/JAR-VIS","the-static-collective/planZ",
   "the-static-collective/CANNON","the-static-collective/playdeck",
   "the-static-collective/the-haunted-toaster","the-static-collective/lemonPRESS"],
  passes:4,actualNativeMediaRenders:2,originalEditorialPasses:2,
  sourceMediaSha256:media.sourceSha256,transformedMediaSha256:media.renderedSha256,
  finalScreeningReceiptSha256:screeningFinal.receiptSha256,
  lastPlanSha256:plans[3].roundSha256,
  distinctPlanReturnReceipts:returns.map(r=>r.artifactSha256),
  allSourcesVerified:true,
  publicPublishingApproved:false,distributionRightsVerified:false,
  physicalActivities:0,autonomousExecution:false,
  humanTimeSavedSeconds:null};
}
function packageHTML(){
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JAR;VIS Studio: Genesis Return Loop</title><style>body{background:#101b21;color:#e8ddca;font:18px/1.5 system-ui;max-width:44rem;margin:4rem auto;padding:1rem}a{color:#dfb876}code{overflow-wrap:anywhere}</style><h1>GENESIS: THE RETURN LOOP</h1><p>A playable local screening artifact assembled by six source-owning repositories, with two native media production passes and two lemonPRESS editorial passes.</p><p><a href="screening-final/program.html">Open the finished local screening program</a></p><p><a href="media/original-toaster-digested-playdeck.mp4">Watch the transformation</a></p><p>Local review only. Source rights and distribution permissions are not established.</p></html>\n';
}
export async function operate(argv){
 const [mode,...flags]=argv;
 hold(["inspect","build","verify"].includes(mode)&&flags.length%2===0,"USAGE");
 const options={};
 for(let i=0;i<flags.length;i+=2){
  const k=flags[i],v=flags[i+1];
  hold(["--planz","--cannon","--lemonpress","--playdeck","--toaster-still",
   "--toaster-motion","--out","--authorize"].includes(k)&&v&&!Object.hasOwn(options,k),"FLAGS");
  options[k]=v;
 }
 if(mode==="inspect"){
  hold(Object.keys(options).length===0,"INSPECT_READ_ONLY");
  return {schema:LOCK.schema,projectId:LOCK.project,plannedRounds:4,
   originalOwnerCount:6,automaticallyExecuted:false,publication:false};
 }
 const required=["--planz","--cannon","--lemonpress","--playdeck","--toaster-still",
  "--toaster-motion","--out"];
 hold(required.every(k=>options[k])&&Object.keys(options).every(k=>
  required.includes(k)||(mode==="build"&&k==="--authorize"))
  &&(mode!=="build"||options["--authorize"]==="SYNTHETIC_TEST_ONLY"),"ARGUMENTS_OR_AUTHORIZATION");
 const sources={
  planz:directory(options["--planz"]),cannon:directory(options["--cannon"]),
  lemonpress:directory(options["--lemonpress"]),
  playdeck:directory(options["--playdeck"]),
  still:directory(options["--toaster-still"]),
  motion:directory(options["--toaster-motion"])
 };
 const owners=["planz","cannon","lemonpress"].map(n=>owner(n,sources[n]));
 const planSource=await import(pathToFileURL(join(sources.planz,"reactor/production-return.mjs")).href);
 const {compileProductionRound,confirmRound}=planSource;
 hold(typeof compileProductionRound==="function"&&typeof confirmRound==="function","ORIGINAL_PLANZ");
 const out=resolve(options["--out"]),parent=directory(dirname(out));
 const build=mode==="build";
 hold(build?!existsSync(out):existsSync(out)&&lstatSync(out).isDirectory()
  &&!lstatSync(out).isSymbolicLink(),"DESTINATION");
 const temporary=mkdtempSync(join(parent,".jarvis-studio-"));
 const dest=build?temporary:out;
 try{
  const brief=projectBrief();
  if(build)writeFileSync(join(dest,"brief.json"),pretty(brief),{flag:"wx"});
  else eqFile(join(dest,"brief.json"),brief);
  const plans=[],returns=[],confirmations=[];
  let previous=null,feedback=null,screeningSource=null,finalReceipt=null;
  for(let round=0;round<4;round++){
   const planned=compileProductionRound({brief,round,previous,evidence:feedback});
   const planFile=join(dest,"plan-"+round+".json");
   if(build)writeFileSync(planFile,pretty(planned),{flag:"wx"});
   else eqFile(planFile,planned);
   let artifactSha;
   if(round<2){
    const route=round===0?"CHECKPOINT_STILL":"MOVING_EXCERPT";
    const nativePlan=join(dest,"cannon-"+round+".json");
    const nativeOut=join(dest,round===0?"checkpoint":"moving");
    const receiver=round===0?sources.still:sources.motion;
    if(build){
     planCannon(sources.cannon,route,nativePlan);
     runCannon("run",sources.cannon,nativePlan,nativeOut,sources.playdeck,receiver);
    }
    const native=runCannon("verify",sources.cannon,nativePlan,nativeOut,sources.playdeck,receiver);
    const nativeReceipt=readJSON(join(nativeOut,"switchyard-receipt.json"));
    hold(nativeReceipt.route===route&&nativeReceipt.status==="NATIVE_ORIGINAL_SOURCE_REPLAYED"
     &&nativeReceipt.rightsApproved===false&&nativeReceipt.published===false,
     "NATIVE_RECEIPT_"+round);
    artifactSha=sha(readFileSync(join(nativeOut,"switchyard-receipt.json")));
    if(round===1){
     const scene=readFileSync(join(nativeOut,"native/original-playdeck-excerpt.mp4"));
     const output=readFileSync(join(nativeOut,"native/original-toaster-digested-playdeck.mp4"));
     const sHash=sha(scene),oHash=sha(output);
     hold(nativeReceipt.nativeEvidence.sourceMediaSha256===sHash
      &&nativeReceipt.nativeEvidence.toasterVideoSha256===oHash,"NATIVE_MOTION_PROOF");
     screeningSource={schema:"jarvis.screening-source/v1",projectId:brief.projectId,
      sourceRoute:"CHECKPOINT_STILL",finalRoute:"MOVING_EXCERPT",
      returns:{checkpoint:returns[0],moving:makeReturn(planned,artifactSha)},
      media:{originalScene:{name:"original-playdeck-excerpt.mp4",sha256:sHash},
       finishedScene:{name:"original-toaster-digested-playdeck.mp4",sha256:oHash}},
      authority:"REVIEW_ONLY",publishingAllowed:false};
     if(build){
      mkdirSync(join(dest,"media"));copyFileSync(join(nativeOut,"native/original-playdeck-excerpt.mp4"),join(dest,"media/original-playdeck-excerpt.mp4"));
      copyFileSync(join(nativeOut,"native/original-toaster-digested-playdeck.mp4"),join(dest,"media/original-toaster-digested-playdeck.mp4"));
      writeFileSync(join(dest,"screening-source.json"),pretty(screeningSource),{flag:"wx"});
     }else eqFile(join(dest,"screening-source.json"),screeningSource);
     verifyMedia(dest,screeningSource);
    }
   }else{
    screeningSource??=readJSON(join(dest,"screening-source.json"));
    const version=round===2?"draft":"final";
    const editionDir=join(dest,"screening-"+version);
    const input=join(dest,"screening-source.json");
    let reviewPath;
    if(version==="final"){
     const draft=readJSON(join(dest,"screening-draft/receipt.json"));
     const scene=readFileSync(join(dest,"media/original-playdeck-excerpt.mp4"));
     const result=readFileSync(join(dest,"media/original-toaster-digested-playdeck.mp4"));
     const reviewed=editorialReview(screeningSource,draft,scene,result);
     reviewPath=join(dest,"editorial-review.json");
     if(build)writeFileSync(reviewPath,pretty(reviewed),{flag:"wx"});
     else eqFile(reviewPath,reviewed);
    }
    if(build)runLemon("build",sources.lemonpress,version,input,editionDir,reviewPath);
    runLemon("verify",sources.lemonpress,version,input,editionDir,reviewPath);
    finalReceipt=readJSON(join(editionDir,"receipt.json"));
    hold(finalReceipt.version===version&&finalReceipt.published===false
     &&finalReceipt.rightsGranted===false,"FINAL_HOUSE_HOLD");
    artifactSha=sha(readFileSync(join(editionDir,"receipt.json")));
   }
   const rec=makeReturn(planned,artifactSha);
   const confirm=confirmRound({plan:planned,evidence:rec});
   if(build){
    writeFileSync(join(dest,"return-"+round+".json"),pretty(rec),{flag:"wx"});
    writeFileSync(join(dest,"confirmation-"+round+".json"),pretty(confirm),{flag:"wx"});
   }else{
    eqFile(join(dest,"return-"+round+".json"),rec);
    eqFile(join(dest,"confirmation-"+round+".json"),confirm);
   }
   plans.push(planned);returns.push(rec);confirmations.push(confirm);
   previous=planned;feedback=rec;
  }
  const media=verifyMedia(dest,screeningSource);
  const core=finalContract({plans,returns,confirmations,screeningFinal:finalReceipt,media});
  const manifestBody={...core,sourceOwners:owners};
  const manifest={...manifestBody,manifestSha256:sha(pretty(manifestBody))};
  if(build){
   writeFileSync(join(dest,"production-manifest.json"),pretty(manifest),{flag:"wx"});
   writeFileSync(join(dest,"index.html"),packageHTML(),{flag:"wx"});
   renameSync(temporary,out);
  }else{
   eqFile(join(dest,"production-manifest.json"),manifest);
   hold(readFileSync(join(dest,"index.html"),"utf8")===packageHTML(),"INDEX_TAMPER");
  }
  return {status:build?"JARVIS_STUDIO_COMPLETE_LOCAL_FILM_AND_SCREENING_PROGRAM":
   "JARVIS_STUDIO_COLD_SOURCE_NATIVE_LOOP_VERIFIED",
   projectId:brief.projectId,distinctOriginalRepos:6,phaseReturns:returns.length,
   nativeMediaPasses:2,editorialPasses:2,
   finalOutputSha256:media.renderedSha256,
   manifestSha256:manifest.manifestSha256,
   release:"HOLD_FOR_HUMAN_RIGHTS_AND_REVIEW"};
 }finally{if(build)rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 operate(process.argv.slice(2)).then(x=>console.log(pretty(x)))
  .catch(e=>{console.error(String(e.message??e).slice(0,1800));process.exitCode=2});
}
