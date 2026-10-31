// JAR;VIS RECURSIVE-WORKSHOP-001
// Runs the frozen, source-pinned Static OS typed recomposer. No competing
// implementation of Static OS or Haunted Toaster's authoritative renderer.
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LocalJournal } from "./journal.mjs";

const runFile = promisify(execFile);
const bridgeUrl = new URL("../integrations/static-os-recomposer/scripts/recomposer-bridge.py", import.meta.url);
const sourceUrls = Object.freeze([
  [new URL("../integrations/static-os-recomposer/question_first/recomposer.py", import.meta.url), "8b6c8ec2de2dc6a6b0e75c7b8d6d9e9abc254f33"],
  [new URL("../integrations/static-os-recomposer/question_first/recomposer_witness.py", import.meta.url), "f8086d2a2f7c0c8cf6f791c25948b91decc05f1e"],
  [bridgeUrl, "696c750293fa69294b1ea91551a1ba9511efd2c1"]
]);
export const SOURCE_COMMIT = "e25bb810295c79b2b663f8bd8f8b5fe278c82914"; // upstream frozen snapshot
export const SCHEMA = "jarvis.recursive-workshop/v1";
const copy = value => structuredClone(value);
const bad = (message, status=400) => Object.assign(new Error(message), {status});
const digest = b => createHash("sha256").update(b).digest("hex");
const OBSERVATION_LIMIT = 80;
const EVENT_LIMIT = 64;

export async function verifyPinnedKernel() {
  for (const [url, expected] of sourceUrls) {
    const bytes = await readFile(url);
    const label = Buffer.from("blob " + bytes.length + "\0");
    const actual = createHash("sha1").update(label).update(bytes).digest("hex");
    if (actual !== expected) throw bad("HOLD: Static OS source snapshot changed; review before running",409);
  }
  return true;
}

export async function callStaticOS(payload, {python = process.env.JARVIS_PYTHON || "python3"} = {}) {
  const input = JSON.stringify(payload);
  if (Buffer.byteLength(input, "utf8") > 150_000) throw bad("HOLD: source request exceeds budget", 413);
  let stdout;
  try {
    const output = await runFile(python, ["-B", "-I", fileURLToPath(bridgeUrl)], {
      input, encoding:"utf8", timeout: 5000, maxBuffer: 1024 * 1024,
      windowsHide: true, env: {...process.env, PYTHONDONTWRITEBYTECODE:"1"}
    });
    stdout = output.stdout;
  } catch(error) {
    // No stderr or input returned: these could contain private content.
    throw bad("HOLD: local Static OS recomposer unavailable or refused the proposal",409);
  }
  let result;
  try { result = JSON.parse(stdout); }
  catch { throw bad("HOLD: invalid Static OS response",409); }
  if (result?.schema !== "static-os.recomposer-bridge/v0") throw bad("HOLD: unexpected Static OS ABI",409);
  return result;
}

export function draftCard(plan, topic) {
  if (!plan || !Array.isArray(plan.topics) || !plan.topics.includes(topic) ||
      !Array.isArray(plan.doors) || !Array.isArray(plan.operators)) {
    throw bad("HOLD: route not present in current proposal");
  }
  const index = plan.topics.indexOf(topic);
  const uri = plan.doors[index];
  if (!/^https:\/\/(garden\.abundent\.org|table\.abundent\.org|connections\.abundent\.org|abundent\.org)\/[a-z/_-]*$/.test(uri)) {
    throw bad("HOLD: destination not in allowed public door catalogue");
  }
  const lines = [
    "JAR;VIS // ONE LITTLE WORKSHOP CARD",
    "A PROPOSAL. NOT A PROMISE.",
    "",
    "Try this door: " + topic.toUpperCase(),
    "Where to begin: " + uri,
    "Plan: " + plan.plan_id,
    "",
    "Ask one person. Make one small thing. Record what actually happened.",
    "Nothing was sent, volunteered, booked or assigned by this card.",
    "Only an explicit separate action can retain a record of this card."
  ];
  return lines.join("\n") + "\n";
}

export class RecursiveWorkshop {
  #journal;
  #tail = Promise.resolve();
  #state;
  #artifacts = [];
  constructor(journal, state, artifacts) {
    this.#journal = journal; this.#state=state; this.#artifacts=artifacts;
  }
  static async open({journalPath}) {
    await verifyPinnedKernel();
    const journal = await LocalJournal.open(journalPath);
    let state = (await callStaticOS({action:"genesis"})).state;
    const artifacts = [];
    for(const event of journal.list()) {
      if(event.kind === "RECOMPOSER_FEEDBACK") {
        state = event.payload.state;
      } else if(event.kind === "RECOMPOSER_ARTIFACT") {
        artifacts.push(event.payload.receipt);
      } else throw bad("HOLD: unexpected event in recursive workshop journal",409);
    }
    const verified = (await callStaticOS({action:"inspect",state})).state;
    if(JSON.stringify(state)!==JSON.stringify(verified)) throw bad("HOLD: replay mismatch",409);
    if(state.revision > EVENT_LIMIT || artifacts.length > OBSERVATION_LIMIT) {
      throw bad("HOLD: workshop learning budget exceeded",409);
    }
    // Every artifact is rechecked by Static OS when compiling a new plan.
    if(artifacts.length) await callStaticOS({action:"compile",state,
      text:"a question",artifact_receipts:artifacts});
    return new RecursiveWorkshop(journal, state, artifacts);
  }
  #exclusive(fn) {
    const result = this.#tail.then(fn);
    this.#tail = result.catch(()=>{});
    return result;
  }
  summary() {
    return {
      schema:SCHEMA,
      mode:"LOCAL_OPERATOR_EXPERIMENT",
      engine:"STATIC_OS_PINNED_PYTHON",
      sourceCommit:SOURCE_COMMIT,
      feedbackEvents:this.#state.revision,
      artifactObservations:this.#artifacts.length,
      recipes:this.#state.recipes.length,
      consentRequired:true,
      storesRawQuestion:false,
      machineMayContactOthers:false,
      automaticPromotion:false,
      testingOnly:true
    };
  }
  async ask(text) {
    if(typeof text !== "string" || text.trim().length < 2 || text.length > 320 ||
      /[\x00-\x1f\x7f]/.test(text)) throw bad("Enter a short question (2–320 printable characters)");
    // No journaling of visitor text or unsuccessful proposals.
    const result=await callStaticOS({action:"compile",state:this.#state,
      text,artifact_receipts:this.#artifacts});
    return {schema:SCHEMA,plan:result.plan,family:result.family,
      memory:this.summary(),stored:false,dispatched:false,
      note:"Local typed proposals only. No AI, external action or automatic saving."};
  }
  async feedback({plan,selected,outcome,consent,promoteRecipe=false}={}) {
    return this.#exclusive(async()=>{
      if(consent !== true) throw bad("HOLD: explicit consent needed for local learning");
      if(this.#state.revision >= EVENT_LIMIT) throw bad("HOLD: learning-event budget reached",409);
      const result=await callStaticOS({action:"feedback",state:this.#state,
        plan,selected,outcome,consent:true,promote_recipe:promoteRecipe===true});
      if(result.state?.revision !== this.#state.revision+1)
        throw bad("HOLD: unexpected revision",409);
      // Serial journal write happens before in-memory state changes.
      await this.#journal.append("RECOMPOSER_FEEDBACK",{state:result.state});
      this.#state = result.state;
      return {schema:SCHEMA,memory:this.summary(),saved:true,
        note:"Saved local operator feedback, not independent proof of success."};
    });
  }
  async rememberCard({plan,topic,consent}={}) {
    return this.#exclusive(async()=>{
      if(consent !== true) throw bad("HOLD: explicit consent needed to retain a card observation");
      if(this.#artifacts.length >= OBSERVATION_LIMIT) throw bad("HOLD: artifact-observation budget reached",409);
      if(plan?.state_revision !== this.#state.revision || plan?.state_head !== this.#state.head)
        throw bad("HOLD: stale card",409);
      const card = draftCard(plan,topic);
      const hash = digest(Buffer.from(card,"utf8"));
      const result=await callStaticOS({action:"artifact",state:this.#state,
        plan,topic,output_sha256:hash,consent:true});
      if(this.#artifacts.some(r=>r.observation_id===result.receipt.observation_id))
        return {schema:SCHEMA,reused:true,receipt:result.receipt,memory:this.summary(),card};
      await this.#journal.append("RECOMPOSER_ARTIFACT",{receipt:result.receipt});
      this.#artifacts.push(result.receipt);
      return {schema:SCHEMA,receipt:result.receipt,memory:this.summary(),card,
        note:"Recorded this generated card, not proof it was used by anyone."};
    });
  }
}
