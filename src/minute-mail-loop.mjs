#!/usr/bin/env node
// JAR;VIS-MINUTE-001: NEW creative objective -> actual original planZ
// iterative plans -> TWO ORIGINAL native Haunted Toaster films via CANNON
// -> original lemonPRESS local kit DRAFT -> JAR;VIS evidence review
// -> original lemonPRESS revised FINAL -> cold replay and source ledger.
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,mkdtempSync,renameSync,rmSync,
 existsSync,lstatSync,realpathSync} from "node:fs";
import {join,resolve,dirname,basename} from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const LOCK=JSON.parse(readFileSync(join(ROOT,"registry/minute-mail-source-lock-v1.json")));
const BRIEF=JSON.parse(readFileSync(join(ROOT,"registry/minute-mail-new-brief-v1.json")));
const sha=x=>createHash("sha256").update(x).digest("hex");
const js=x=>JSON.stringify(x,null,2)+"\n";
const hold=(v,x)=>{if(!v)throw Error("JARVIS_MINUTE_HOLD_"+x)};
function command(bin,args,timeout=720000){
 try{return execFileSync(bin,args,{encoding:"utf8",timeout,maxBuffer:14*1024*1024,
  stdio:["ignore","pipe","pipe"]}).trim()}
 catch(e){throw Error("JARVIS_MINUTE_CHILD_"+String(e.stderr??e.message).slice(0,1200))}
}
function folder(p){
 const x=resolve(p);hold(existsSync(x)&&lstatSync(x).isDirectory()
  &&!lstatSync(x).isSymbolicLink(),"DIRECTORY");return realpathSync(x);
}
function original(id,root){
 const src=LOCK.owners.find(x=>x.id===id);hold(src,"ORIGINAL_ID");
 hold(command("git",["-C",root,"rev-parse","HEAD"])===src.commit
  &&command("git",["-C",root,"remote","get-url","origin"]).replace(/\.git$/,"")==="https://github.com/"+src.repo,
  "ORIGINAL_COMMIT_"+id);
 const status=command("git",["-C",root,"status","--porcelain","--untracked-files=normal"]);
 hold(!status,"OWNER_DIRTY_"+id);
 for(const [rel,blob] of Object.entries(src.files)){
  const bytes=readFileSync(join(root,rel));
  const live=createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
  hold(live===blob&&command("git",["-C",root,"rev-parse","HEAD:"+rel])===blob,"ORIGINAL_BLOB_"+rel);
 }
 return {id,repo:src.repo,commit:src.commit,sourceBlobCount:Object.keys(src.files).length};
}
export function editorialReview(input,draft,proofBytes,finalBytes){
 hold(input?.schema==="jarvis.minute-mail-kit-source/v1"
  &&draft?.schema==="lemonpress.minute-mail-kit/v1"&&draft.version==="draft"
  &&input.media.proof.sha256===sha(proofBytes)
  &&input.media.revised.sha256===sha(finalBytes)
  &&draft.originalProofFilmSha256===sha(proofBytes)
  &&draft.revisedNativeFilmSha256===sha(finalBytes)
  &&draft.sourceSha256===sha(js(input))
  &&draft.published===false&&draft.tracksPeople===false
  &&draft.rightsGranted===false,"EDITORIAL_REVIEW_SOURCE");
 return {schema:"jarvis.minute-mail-editorial-review/v1",
  status:"REVISE_CLARITY_WITH_SOURCE_EVIDENCE",
  sourceSha256:sha(js(input)),draftReceiptSha256:draft.receiptSha256,
  firstVideoChecked:true,secondVideoChecked:true,releaseAllowed:false,
  instructions:"Make a short generous action invitation visible without requiring personal data. Keep the draft source and revised source independently cited.",
  noIdentityOrExternalPublishing:true};
}
export function verifyFinal({intent,plans,returns,confirmations,media,draft,final}){
 hold(intent?.schema==="planz.minute-mail-creative-intent/v1"
  &&plans?.length===4&&returns?.length===4&&confirmations?.length===4
  &&plans.map(x=>x.stage).join("|")==="PROOF_FILM|REVISED_FILM|KIT_DRAFT|KIT_FINAL",
  "FOUR_DISTINCT_STAGES");
 hold(plans.every((p,i)=>returns[i].planSha256===p.planSha256
  &&confirmations[i].planSha256===p.planSha256
  &&confirmations[i].receiptSha256===returns[i].nativeArtifactSha256
  &&p.rightsGranted===false&&returns[i].published===false),"LINEAGE");
 hold(/^[a-f0-9]{64}$/.test(media.proofSha256)
  &&/^[a-f0-9]{64}$/.test(media.revisedSha256)
  &&media.proofSha256!==media.revisedSha256
  &&draft?.version==="draft"&&final?.version==="final"
  &&final.previousDraftSha256===draft.receiptSha256
  &&final.originalProofFilmSha256===media.proofSha256
  &&final.revisedNativeFilmSha256===media.revisedSha256
  &&final.published===false&&final.tracksPeople===false
  &&final.rightsGranted===false,"FULL_LOCAL_PACKAGE");
 return {schema:"jarvis.novel-minute-mail-produced/v1",status:"FINISHED_LOCAL_CREATIVE_ARTIFACT_REVIEW_HELD",
  originalOwners:["JAR-VIS","planZ","CANNON","the-haunted-toaster","lemonPRESS"],
  novelty:"NEW_ART_AND_TWO_NEW_SYNTHESIZED_SOURCE_AUDIO_PASSES_NOT_GENESIS",
  rounds:4,nativeVideoRenders:2,originalEditorialPasses:2,
  proofFilmSha256:media.proofSha256,revisedFilmSha256:media.revisedSha256,
  finalKitReceiptSha256:final.receiptSha256,
  originalObjectiveSha256:sha(BRIEF.objective),
  humansHelpedVerified:0,published:false,rightsGranted:false,
  backgroundAutonomy:false,modelWasInvoked:false};
}
function status(out,mode,expected){
 const x=JSON.parse(command(process.execPath,out,900000));
 hold(x.status===expected,"CHILD_"+mode+"_"+expected);
 return x;
}
async function operate(args){
 const [mode,...f]=args;
 hold(["inspect","build","verify"].includes(mode)&&f.length%2===0,"USAGE");
 const o={};for(let i=0;i<f.length;i+=2){
  hold(["--planz","--cannon","--toaster","--lemonpress","--out","--authorize"].includes(f[i])
   &&f[i+1]&&!Object.hasOwn(o,f[i]),"FLAG");o[f[i]]=f[i+1]}
 if(mode==="inspect"){
  hold(f.length===0,"INSPECT");return {project:LOCK.project,
   originalObjective:BRIEF.objective,stages:4,executed:false,
   originalGenesisMediaUsed:false,externalActions:0};
 }
 const names=["--planz","--cannon","--toaster","--lemonpress","--out"];
 hold(names.every(k=>o[k])&&Object.keys(o).every(k=>names.includes(k)||(mode==="build"&&k==="--authorize"))
  &&(mode==="build"?o["--authorize"]==="SYNTHETIC_TEST_ONLY":!o["--authorize"]),"GRANT");
 const sources={planz:folder(o["--planz"]),cannon:folder(o["--cannon"]),
  toaster:folder(o["--toaster"]),lemonpress:folder(o["--lemonpress"])};
 const sourceOwners=Object.entries(sources).map(([id,path])=>original(id,path));
 const pz=await import(pathToFileURL(join(sources.planz,"reactor/minute-mail.mjs")).href);
 const {startCreativeBrief,planNext,confirmReturn}=pz;
 hold(typeof startCreativeBrief==="function"&&typeof planNext==="function"
  &&typeof confirmReturn==="function","ORIGINAL_PLANZ");
 const root=resolve(o["--out"]),parent=folder(dirname(root));
 const build=mode==="build";
 hold(build?!existsSync(root):existsSync(root)&&lstatSync(root).isDirectory(),"OUTPUT");
 const temporary=mkdtempSync(join(parent,".minute-mail-loop-"));
 const dest=build?temporary:root;
 const save=(name,obj)=>{
  const file=join(dest,name),content=js(obj);
  if(build)writeFileSync(file,content,{flag:"wx"});
  else hold(readFileSync(file,"utf8")===content,"FILE_TAMPER_"+name);
 };
 const read=n=>JSON.parse(readFileSync(join(dest,n)));
 try{
  const intent=startCreativeBrief(BRIEF.objective);save("intent.json",intent);
  save("brief.json",BRIEF);
  let previous=null,prior=null;
  const plans=[],returns=[],confirmations=[];
  let kitSource=null;
  const media={};
  let draft=null,final=null;
  for(let n=0;n<4;n++){
   const plan=planNext(intent,n,previous,prior);
   save("plan-"+n+".json",plan);
   let digest;
   if(n<2){
    const outputName=n===0?"proof-native":"revised-native";
    const output=join(dest,outputName);
    const cli=join(sources.cannon,"scripts/minute-mail-native.mjs");
    const base=[cli,"--plan",join(dest,"plan-"+n+".json"),
     "--toaster",sources.toaster,"--out",output];
    if(build){
     const result=JSON.parse(command(process.execPath,[cli,"build",...base.slice(1),
      "--authorize","SYNTHETIC_TEST_ONLY"],720000));
     hold(result.status==="NEW_ORIGINAL_TOASTER_FILM_VERIFIED","NATIVE_RENDER_"+n);
    }
    const native=JSON.parse(command(process.execPath,[cli,"verify",...base.slice(1)],120000));
    hold(native.status==="MINUTE_ORIGINAL_COLD_VERIFIED"
     &&native.round===n,"NATIVE_COLD_"+n);
    const proof=read(outputName+"/native-proof.json");
    digest=sha(readFileSync(join(output,"native-proof.json")));
    const nativeFile=readFileSync(join(output,"minute-mail.mp4"));
    hold(native.videoSha256===sha(nativeFile)
     &&proof.nativeMedia.videoSha256===sha(nativeFile)
     &&proof.genesisFramesUsed===false,"ORIGINAL_NATIVE_BYTES_"+n);
    media[n===0?"proofSha256":"revisedSha256"]=sha(nativeFile);
    if(n===1){
     if(build){
      mkdirSync(join(dest,"media"));
      copyFileSync(join(dest,"proof-native/minute-mail.mp4"),join(dest,"media/proof-film.mp4"));
      copyFileSync(join(dest,"revised-native/minute-mail.mp4"),join(dest,"media/revised-film.mp4"));
     }
     hold(sha(readFileSync(join(dest,"media/proof-film.mp4")))===media.proofSha256
      &&sha(readFileSync(join(dest,"media/revised-film.mp4")))===media.revisedSha256,
      "LOCAL_FILM_COPIES");
     kitSource={schema:"jarvis.minute-mail-kit-source/v1",project:BRIEF.project,
      title:intent.workingTitle,intent,
      media:{proof:{file:"proof-film.mp4",sha256:media.proofSha256},
       revised:{file:"revised-film.mp4",sha256:media.revisedSha256}},
      sourcePlanSha256:plans[0].planSha256,
      revisionPlanSha256:plan.planSha256,originalNativeReceiptsVerified:true,
      publicRelease:false,rightsGranted:false};
     save("kit-source.json",kitSource);
    }
   }else{
    kitSource??=read("kit-source.json");
    const version=n===2?"draft":"final",out=join(dest,"kit-"+version);
    const cli=join(sources.lemonpress,"scripts/minute-mail-house.mjs");
    let reviewFile;
    if(n===3){
     draft=read("kit-draft/receipt.json");
     const feedback=editorialReview(kitSource,draft,
      readFileSync(join(dest,"media/proof-film.mp4")),
      readFileSync(join(dest,"media/revised-film.mp4")));
     save("editorial-review.json",feedback);
     reviewFile=join(dest,"editorial-review.json");
    }
    const base=[cli,"--input",join(dest,"kit-source.json"),
     "--version",version,"--out",out];
    if(reviewFile)base.push("--review",reviewFile);
    if(build){
     const built=JSON.parse(command(process.execPath,[cli,"build",...base.slice(1),
      "--authorize","LOCAL_DRAFT_ONLY"],60000));
     hold(built.status==="LEMON_MINUTE_KIT_BUILT_LOCAL","KIT_BUILT_"+n);
    }
    const checked=JSON.parse(command(process.execPath,[cli,"verify",...base.slice(1)],60000));
    hold(checked.status==="LEMON_MINUTE_KIT_COLD_VERIFIED","KIT_COLD_"+n);
    const record=read("kit-"+version+"/receipt.json");
    digest=sha(readFileSync(join(out,"receipt.json")));
    hold(record.version===version&&record.published===false
     &&record.rightsGranted===false,"KIT_OWNER_PROOF");
    if(n===2)draft=record;else final=record;
   }
   const returned={schema:"jarvis.minute-mail-return/v1",
    round:n,kind:plan.expectedReturn,planSha256:plan.planSha256,
    nativeArtifactSha256:digest,published:false,rightsGranted:false};
   const confirmation=confirmReturn(plan,returned);
   save("return-"+n+".json",returned);
   save("confirmation-"+n+".json",confirmation);
   plans.push(plan);returns.push(returned);confirmations.push(confirmation);
   previous=plan;prior=returned;
  }
  const artifact=verifyFinal({intent,plans,returns,confirmations,media,draft,final});
  const body={...artifact,sourceOwners};
  const manifest={...body,manifestSha256:sha(js(body))};
  save("production-manifest.json",manifest);
  const home='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lost Minute Post Office</title><meta http-equiv="refresh" content="0;url=kit-final/index.html"><h1>THE LOST MINUTE POST OFFICE</h1><p><a href="kit-final/index.html">Enter the original local post office</a></p><p>Nothing tracked or published externally.</p></html>\n';
  if(build)writeFileSync(join(dest,"index.html"),home,{flag:"wx"});
  else hold(readFileSync(join(dest,"index.html"),"utf8")===home,"INDEX_TAMPER");
  if(build)renameSync(temporary,root);
  return {status:build?"JARVIS_NEW_CREATIVE_ARTIFACT_FINISHED_LOCAL":"JARVIS_NEW_CREATIVE_ARTIFACT_COLD_REPLAYED",
   originalNewObjective:true,sourceOwnerCount:5,
   planReturns:4,nativeRenders:2,editorialPasses:2,
   finalVideoSha256:media.revisedSha256,finalKitReceiptSha256:final.receiptSha256,
   manifestSha256:manifest.manifestSha256,
   published:false,humansHelpedClaimed:0};
 }finally{if(build)rmSync(temporary,{recursive:true,force:true})}
}
export {operate};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 operate(process.argv.slice(2)).then(x=>console.log(js(x)))
  .catch(e=>{console.error(String(e.message??e).slice(0,1600));process.exitCode=2});
}
