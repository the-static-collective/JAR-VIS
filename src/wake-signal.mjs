// WAKE SIGNAL JAR;VIS: exact source-owned Python (not a forked JS interpretation).
// Local-only: no sending, profiles, contact lookup, automatic follow-ups or claims of agency.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { chmod, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const MOTIF_WAKE_COMMIT = "efe133f0db12b439b9c483eace13601cf8c03285";
export const MOTIF_WAKE_BLOB = "bcf090b510ad41ed59264e6864ffbd24edfce28e";
export const WAKE_BRIDGE_SCHEMA = "jarvis.wake-source-bridge/v1";
const PYTHON_FILE = new URL("../integrations/motif-wake-signal/wake.py", import.meta.url);
const BRIDGE_FILE = new URL("../integrations/motif-wake-signal/bridge.py", import.meta.url);
const ID = /^[0-9a-f]{20}$/;
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const safeId = id => {
  if(typeof id !== "string" || !ID.test(id)) throw fail("HOLD: invalid study id", 400);
  return id;
};

export async function verifyPinnedWake() {
  const bytes = await readFile(PYTHON_FILE);
  const hash = createHash("sha1")
    .update(Buffer.from("blob " + bytes.length + "\0")).update(bytes).digest("hex");
  if(hash !== MOTIF_WAKE_BLOB) throw fail("HOLD: MOTIF WAKE source bytes changed; review the pin",409);
  return true;
}

async function ownerCall(payload,{python=process.env.JARVIS_PYTHON || "python3"}={}) {
  await verifyPinnedWake();
  const input = JSON.stringify(payload);
  if(Buffer.byteLength(input)>20_000)throw fail("HOLD: input exceeds budget",413);
  let raw;
  try {
    raw = await new Promise((resolve,reject)=>{
      const child = spawn(python,["-B","-I",fileURLToPath(BRIDGE_FILE)],{
        stdio:["pipe","pipe","pipe"], windowsHide:true,
        env:{...process.env,PYTHONDONTWRITEBYTECODE:"1"}
      });
      let output="",size=0,settled=false;
      const timer=setTimeout(()=>child.kill("SIGKILL"),7000);
      const done=(error,value)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        if(error)reject(error);else resolve(value);
      };
      child.on("error",done);
      child.stdout.setEncoding("utf8");
      child.stdout.on("data",chunk=>{
        size+=Buffer.byteLength(chunk);output+=chunk;
        if(size>1024*1024)child.kill("SIGKILL");
      });
      child.stderr.on("data",()=>{}); // Never expose visitor text in stderr.
      child.on("close",code=>code===0&&size<=1024*1024?
        done(null,output):done(new Error("bridge failed")));
      child.stdin.on("error",()=>{});
      child.stdin.end(input);
    });
  }catch{
    throw fail("HOLD: pinned local Python WAKE engine unavailable",409);
  }
  let output;
  try{ output=JSON.parse(raw); }
  catch{ throw fail("HOLD: source returned invalid JSON",409); }
  if(output?.schema!==WAKE_BRIDGE_SCHEMA)throw fail("HOLD: unexpected source ABI",409);
  if(output.status==="HOLD")throw fail("HOLD: "+output.error,409);
  if(output.status!=="OK")throw fail("HOLD: source refused operation",409);
  return output;
}

export class WakeDesk {
  #directory;
  #queue=Promise.resolve();
  constructor(directory){this.#directory=directory}
  static async open({directory}) {
    if(typeof directory!=="string" || !directory)throw fail("Directory required",400);
    await verifyPinnedWake();
    await ownerCall({op:"ping"});
    await mkdir(directory,{recursive:true,mode:0o700});
    return new WakeDesk(directory);
  }
  #planPath(id){return join(this.#directory,safeId(id)+".plan.json")}
  #eventsPath(id){return join(this.#directory,safeId(id)+".events.jsonl")}
  #exclusive(fn){
    const result=this.#queue.then(fn);
    this.#queue=result.catch(()=>{});
    return result;
  }
  async #studies(){
    const entries=(await readdir(this.#directory)).filter(x=>ID.test(x.slice(0,20)) && x.endsWith(".plan.json"));
    if(entries.length>30)throw fail("HOLD: study capacity reached; archive locally",409);
    const studies=[];
    for(const name of entries){
      const path=join(this.#directory,name);
      const [raw,meta]=await Promise.all([readFile(path,"utf8"),stat(path)]);
      let parsed;
      try{ parsed=JSON.parse(raw); }
      catch{ throw fail("HOLD: damaged study file",409); }
      const id=name.slice(0,20);
      if(parsed.study_id!==id || !parsed.spec || typeof parsed.spec.title!=="string")
        throw fail("HOLD: study identity mismatch",409);
      studies.push({studyId:id,title:parsed.spec.title,
        verifiedOpportunity:parsed.spec.verified_opportunity,
        count:parsed.spec.count, createdAt:meta.birthtime.toISOString(),
        modifiedAt:meta.mtimeMs});
    }
    studies.sort((a,b)=>b.modifiedAt-a.modifiedAt || a.studyId.localeCompare(b.studyId));
    return studies.map(({modifiedAt,...rest})=>rest);
  }
  async state(studyId=null){
    const studies=await this.#studies();
    const id=studyId==null ? (studies[0]?.studyId || null) : safeId(studyId);
    if(!id)return {schema:"jarvis.wake-desk/v1",sourceCommit:MOTIF_WAKE_COMMIT,
      studies,active:null,externalDelivery:false,automatedContact:false};
    if(!studies.some(x=>x.studyId===id))throw fail("HOLD: study not found",404);
    const result=await ownerCall({op:"state",plan_path:this.#planPath(id),
      events_path:this.#eventsPath(id)});
    return {schema:"jarvis.wake-desk/v1",sourceCommit:MOTIF_WAKE_COMMIT,
      studies,active:{...result,studyId:id},
      externalDelivery:false,automatedContact:false};
  }
  async create({title,context,small,creative,autonomous,count=100,seed=2026,
    verifiedOpportunity=false}={}){
    return this.#exclusive(async()=>{
      if(typeof verifiedOpportunity!=="boolean")throw fail("HOLD: verification must be explicit",400);
      if(!Number.isSafeInteger(count)||count<3||count>100)
        throw fail("HOLD: JAR;VIS pilot permits 3–100 assignments",400);
      if(!Number.isSafeInteger(seed)||seed<0||seed>999999999)
        throw fail("HOLD: enter a seed between 0 and 999999999",400);
      const {plan}=await ownerCall({op:"plan",title,context,small,creative,autonomous,
        count,seed,verified:verifiedOpportunity});
      const id=safeId(plan.study_id);
      const files=await this.#studies();
      if(!files.some(x=>x.studyId===id)&&files.length>=30)
        throw fail("HOLD: study capacity reached",409);
      try{await writeFile(this.#planPath(id),JSON.stringify(plan,null,2)+"\n",
        {flag:"wx",mode:0o600});}
      catch(error){if(error.code!=="EEXIST")throw error;}
      return this.state(id);
    });
  }
  async record({studyId,slot,event,contactPermission=false,
    actionAttested=false,receipt=null}={}){
    return this.#exclusive(async()=>{
      const id=safeId(studyId);
      if(typeof slot!=="string" || !/^P[0-9]{3}$/.test(slot))
        throw fail("HOLD: unknown invitation slot",400);
      if(!["offered","replied","action","novel_action","declined","opted_out"].includes(event))
        throw fail("HOLD: invalid event",400);
      if(typeof contactPermission!=="boolean"||typeof actionAttested!=="boolean")
        throw fail("HOLD: checkboxes must be boolean",400);
      // Ensure source-verified plan is present before it can append an event file.
      const existing=await this.state(id);
      if(!existing.active)throw fail("HOLD: missing study",404);
      await ownerCall({op:"record",plan_path:this.#planPath(id),
        events_path:this.#eventsPath(id),slot,event,
        contact_permission:contactPermission,action_attested:actionAttested,receipt});
      await chmod(this.#eventsPath(id),0o600);
      return this.state(id);
    });
  }
}
