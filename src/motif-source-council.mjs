// JAR;VIS Source Council 002: native, source-pinned MOTIF branch evidence.
//
// Only on explicit operator request: run ORIGINAL MOTIF Source Council against
// a fixed public Git remote from a temporary repository. No raw user question
// is passed as a Git argument or sent to GitHub. No arbitrary branch code runs.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const COUNCIL_SOURCE_COMMIT="90e41d18a04ae2aaae0a16ded61199415488250f";
const blobs=Object.freeze({
  "__init__.py":"2b422500d551bb0b4c3afcecceb25e048652cac9",
  "branch_garden.py":"0f9773ad5ca0204ef38a673674cd08a7e281cd2f",
  "branch_source.py":"969151b9ac82e340278ed72d368e2819b8d57b4e",
  "source_council.py":"76245e3afbed517e04c2bebd62ef62aba05f4e38",
});
const root=new URL("../integrations/motif-council/motif/",import.meta.url);
const bridge=new URL("../integrations/motif-council/bridge.py",import.meta.url);
const LIMIT=4096, OUTPUT_LIMIT=128000, DEFAULT_TIMEOUT_MS=45000;
const bad=(message,status=409)=>Object.assign(new Error(message),{status});

export async function inspectMotifCouncil() {
  const observed=[];
  for (const [file,expected] of Object.entries(blobs)) {
    const bytes=await readFile(new URL(file,root));
    const gitBlob=createHash("sha1")
      .update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
    if (gitBlob!==expected)
      throw bad("HOLD: original Source Council file differs from its immutable source commit");
    observed.push({path:"motif/"+file,gitBlob});
  }
  return {
    schema:"jarvis.motif-source-council-source/v1",
    owner:"the-static-collective/MOTIF",
    sourceCommit:COUNCIL_SOURCE_COMMIT,
    originals:observed,
    verified:true,
    privateDataSentExternally:false,
    humanOutreach:false,
    automaticExecution:false,
    automaticMerge:false,
  };
}

function validInput(question,budget) {
  if (typeof question!=="string" || question.length<3 || question.length>180 ||
      !question.trim() || /[\x00-\x1f\x7f]/.test(question))
    throw bad("Use a short, printable research question (3–180 characters)",400);
  if (!Number.isInteger(budget) || budget<1 || budget>3)
    throw bad("Use an investigation budget from 1 to 3 branches",400);
}

export async function runMotifCouncil(question,{
  budget=2,python=process.env.JARVIS_PYTHON || "python3",
  timeoutMs=DEFAULT_TIMEOUT_MS
}={}) {
  validInput(question,budget);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs<100 || timeoutMs>60000)
    throw bad("Invalid research time limit",400);
  const source=await inspectMotifCouncil();
  const input=JSON.stringify({action:"investigate",question,budget});
  if(Buffer.byteLength(input,"utf8")>LIMIT)throw bad("HOLD: request too large",413);
  const output=await new Promise((resolve,reject)=>{
    const child=spawn(python,["-B","-I",fileURLToPath(bridge)],{
      windowsHide:true,stdio:["pipe","pipe","pipe"],
      env:{
        PATH:process.env.PATH??"",
        HOME:"/nonexistent",
        LANG:"C.UTF-8",
        PYTHONDONTWRITEBYTECODE:"1",
        PYTHONNOUSERSITE:"1",
        GIT_CONFIG_NOSYSTEM:"1",
        GIT_CONFIG_GLOBAL:"/dev/null",
        GIT_TERMINAL_PROMPT:"0",
        GIT_ALLOW_PROTOCOL:"https"
      }
    });
    let out="",size=0,settled=false;
    const finish=(error,result)=>{
      if(settled)return;
      settled=true;clearTimeout(timer);
      error?reject(error):resolve(result);
    };
    const timer=setTimeout(()=>child.kill("SIGKILL"),timeoutMs);
    child.once("error",()=>finish(bad("HOLD: local Python/Git research runtime unavailable")));
    child.stdout.setEncoding("utf8");
    child.stdout.on("data",chunk=>{
      size+=Buffer.byteLength(chunk,"utf8");
      if(size>OUTPUT_LIMIT)child.kill("SIGKILL");
      else out+=chunk;
    });
    child.stderr.resume(); // Never echo stderr, which may contain source URLs or local paths.
    child.once("close",code=>{
      if(code===0 && size<=OUTPUT_LIMIT)finish(null,out);
      else finish(bad("HOLD: original Source Council could not inspect this public source"));
    });
    child.stdin.on("error",()=>{});
    child.stdin.end(input);
  });
  let result;
  try{result=JSON.parse(output);}
  catch{throw bad("HOLD: malformed Source Council response");}
  if (result?.schema!=="jarvis.motif-source-council/v1" ||
      result?.externalWrites!==false ||
      result?.storage!=="NONE" ||
      result?.questionTransmittedToGitHub!==false ||
      result?.codeExecutedFromExperimentalBranches!==false ||
      result?.mergePerformed!==false ||
      result?.originalCouncil?.schema!=="motif.source-council-selection/v1" ||
      result?.originalCouncil?.automatic_merge!==false ||
      result?.originalCouncil?.automatic_branch_execution!==false)
    throw bad("HOLD: unrecognized Source Council authority claims");
  const cards=result.originalCouncil.candidates;
  if(!Array.isArray(cards) || cards.length>budget ||
     cards.some(x=>x?.automatic_merge!==false ||
        x?.executable!==false || !/^[0-9a-f]{40}$/.test(x.commit) ||
        !(/^[A-Za-z0-9._/-]{1,220}$/.test(x.branch) &&\n          !x.branch.includes("..") && !x.branch.includes("//") &&\n          !x.branch.startsWith(".") && x.branch!=="main")))
    throw bad("HOLD: unrecognized candidate or source reference");
  return {...result,source,
    disposition:"HELD_UNMERGED_SOURCE_LEADS",
    adoptionAllowed:false,requestedExecution:false};
}
