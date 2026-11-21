// JAR;VIS MOTIF SPINE LIVE LOCAL 001.
// The Python algorithm is the ORIGINAL MOTIF reasoning spine, copied byte for
// byte from a pinned source commit. This receiver owns no new reasoning method.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const MOTIF_SPINE_SOURCE_COMMIT = "139b59d22414659d75c7ffebe9e75cbd01c25925";
export const MOTIF_SPINE_BLOB_SHA1 = "e8038ab4504523f6b15ace567d1a22b36583caff";
const kernel = new URL("../integrations/motif-spine/reason_spine.py", import.meta.url);
const bridge = new URL("../integrations/motif-spine/bridge.py", import.meta.url);
const LIMIT = 16 * 1024;
const OUTPUT_LIMIT = 128 * 1024;
const delay = 5000;
const bad = (message, status = 409) => Object.assign(new Error(message), { status });

export async function inspectMotifKernel() {
  const bytes = await readFile(kernel);
  const blob = createHash("sha1").update(Buffer.from("blob " + bytes.length + "\0"))
    .update(bytes).digest("hex");
  if (blob !== MOTIF_SPINE_BLOB_SHA1)
    throw bad("HOLD: original MOTIF source differs from the reviewed commit");
  return {
    schema: "jarvis.motif-source-observation/v1",
    sourceCommit: MOTIF_SPINE_SOURCE_COMMIT,
    originalGitBlob: blob,
    localSourceVerified: true,
    experimentBranchExecution: false,
    remoteSourceRead: false,
    authority: "NONE",
  };
}

export async function runMotifSpine(caseData, {action = "compare", python = process.env.JARVIS_PYTHON || "python3"} = {}) {
  if (!["compare","analyze"].includes(action)) throw bad("Unsupported MOTIF operation", 400);
  const request = JSON.stringify({action,case:caseData});
  if (Buffer.byteLength(request,"utf8") > LIMIT)
    throw bad("HOLD: MOTIF request exceeds local size budget",413);
  const source = await inspectMotifKernel();
  const resultText = await new Promise((resolve,reject) => {
    const child = spawn(python, ["-B","-I",fileURLToPath(bridge)], {
      windowsHide:true,stdio:["pipe","pipe","pipe"],
      env: {PATH:process.env.PATH ?? "",LANG:"C.UTF-8",PYTHONDONTWRITEBYTECODE:"1",PYTHONNOUSERSITE:"1"}
    });
    let out = "", size=0, settled=false;
    const finish=(err,result)=>{
      if(settled) return;
      settled=true;clearTimeout(timer);
      err ? reject(err) : resolve(result);
    };
    const timer=setTimeout(()=>child.kill("SIGKILL"),delay);
    child.once("error",()=>finish(bad("HOLD: Python kernel unavailable")));
    child.stdout.setEncoding("utf8");
    child.stdout.on("data",chunk=>{
      size+=Buffer.byteLength(chunk,"utf8");
      if(size>OUTPUT_LIMIT)child.kill("SIGKILL");
      else out+=chunk;
    });
    // No stderr included in public errors: neither stack traces nor source data.
    child.stderr.resume();
    child.on("close",code=>{
      if(code===0 && size<=OUTPUT_LIMIT) finish(null,out);
      else finish(bad("HOLD: source rejected structured case or reached a runtime limit"));
    });
    child.stdin.on("error",()=>{});
    child.stdin.end(request);
  });
  let result;
  try { result=JSON.parse(resultText); }
  catch {throw bad("HOLD: invalid original MOTIF response");}
  if (result?.schema!=="jarvis.motif-spine-local/v1"
    || result?.method!=="ORIGINAL_MOTIF_MAIN_CODE"
    || result?.externalEffects!==false
    || result?.stored!==false
    || result?.mergePerformed!==false)
    throw bad("HOLD: MOTIF response did not match local non-action ABI");
  return {...result, source};
}
