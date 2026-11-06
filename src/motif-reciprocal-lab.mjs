/** Reciprocal diagnostic notebook: an operator's unverifiable evaluation is
 * retained only on explicit consent. Never alters JAR;VIS or MOTIF source/rules.
 * This notebook is distinct from the recursive workshop's own observations.
 */
import {createHash} from "node:crypto";
import {LocalJournal} from "./journal.mjs";
import {compareReciprocally,SOURCE_BLOB} from "./motif-reciprocal.mjs";
import {inspectRealityIron} from "./motif-reality-iron.mjs";

const digest=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
const bad=(reason,status=400)=>Object.assign(new Error("HOLD: "+reason),{status});
const LIMIT=64;
const SCHEMA="jarvis.motif-review/v1";
const CARTRIDGE="jarvis.motif-improvement-cartridge/v1";

export class ReciprocalLab {
  #journal;
  #recursive;
  #events;
  #pending=new Map();
  #tail=Promise.resolve();
  constructor(journal,recursive,events){
    this.#journal=journal;this.#recursive=recursive;this.#events=events;
  }
  static async open({journalPath,recursive}){
    if(!journalPath||!recursive)throw bad("local review journal and recursive desk required");
    const journal=await LocalJournal.open(journalPath);
    const events=[];
    for(const record of journal.list()){
      if(record.kind!=="MOTIF_RECIPROCAL_REVIEW")throw bad("unrecognized reciprocal journal event",409);
      const p=record.payload;
      if(!p||p.schema!==SCHEMA||p.kind!=="UNVERIFIED_OPERATOR_OPINION"||
         !/^[a-f0-9]{64}$/.test(p.comparisonId||"")||
         !/^route-proposal:[a-f0-9]{64}$/.test(p.candidateId||"")||
         !["helpful","not_helpful"].includes(p.outcome)||
         p.sourceBlob!==SOURCE_BLOB||p.authority!==false||
         p.questionStored!==false||Object.keys(p).length!==8)throw bad("corrupt reciprocal review payload",409);
      if(events.some(x=>x.comparisonId===p.comparisonId))throw bad("duplicate review in journal",409);
      events.push(p);
    }
    if(events.length>LIMIT)throw bad("review journal over budget",409);
    return new ReciprocalLab(journal,recursive,events);
  }
  summary(){
    return {schema:"jarvis.motif-review-state/v1",reviews:this.#events.length,
      positive:this.#events.filter(x=>x.outcome==="helpful").length,
      negative:this.#events.filter(x=>x.outcome==="not_helpful").length,
      sourceBlob:SOURCE_BLOB,unverified:true,
      storedQuestions:0,codeChanges:0,automaticPromotion:false};
  }
  #serial(fn){
    const next=this.#tail.then(fn);
    this.#tail=next.catch(()=>{});
    return next;
  }
  async compare(text){
    const result=await compareReciprocally(text,this.#recursive);
    const comparisonId=digest({schema:SCHEMA,
      baseline:result.jarvis.baseline,
      alternative:result.motif.affordanceFirst,
      source:SOURCE_BLOB,
      critique:result.peerCritique});
    const choices=[result.jarvis.baseline.candidateId,
      result.motif.affordanceFirst.candidateId];
    if(!this.#events.some(e=>e.comparisonId===comparisonId)){
      if(this.#pending.size>=32)this.#pending.delete(this.#pending.keys().next().value);
      this.#pending.set(comparisonId,new Set(choices));
    }
    const fields=(target,proposal)=>({
      schema:CARTRIDGE,target,comparisonId,sourceBlob:SOURCE_BLOB,
      proposedChange:proposal,
      evidence:this.summary(),
      method:"INDEPENDENT_FROZEN_HOLDOUT_REQUIRED",
      authority:false,externalEffect:false,status:"HELD_FOR_TEST"
    });
    const cartridges=result.improvementCandidates.map(x=>{
      const body=fields(x.target,x.proposal);
      return {...body,id:"proposal:"+digest(body)};
    });
    const realityIron=await inspectRealityIron();
    return {...result,comparisonId,cartridges,realityIron,
      operatorFeedback:this.summary(),
      reviewStatus:this.#events.some(e=>e.comparisonId===comparisonId)?
        "ALREADY_REVIEWED":"AVAILABLE_WITH_CONSENT"};
  }
  async review({comparisonId,candidateId,outcome,consent}={}){
    return this.#serial(async()=>{
      if(consent!==true)throw bad("explicit operator consent required");
      if(typeof comparisonId!=="string"||typeof candidateId!=="string"||
         !["helpful","not_helpful"].includes(outcome))throw bad("invalid opinion");
      const eligible=this.#pending.get(comparisonId);
      if(!eligible||!eligible.has(candidateId))throw bad("unknown or stale comparison",409);
      if(this.#events.some(e=>e.comparisonId===comparisonId))throw bad("comparison already reviewed",409);
      if(this.#events.length>=LIMIT)throw bad("research opinion budget exceeded",409);
      const event={schema:SCHEMA,kind:"UNVERIFIED_OPERATOR_OPINION",
        comparisonId,candidateId,outcome,sourceBlob:SOURCE_BLOB,
        authority:false,questionStored:false};
      await this.#journal.append("MOTIF_RECIPROCAL_REVIEW",event);
      this.#events.push(event);
      this.#pending.delete(comparisonId);
      return {schema:"jarvis.motif-review-receipt/v1",stored:true,
        operatorOpinionOnly:true,independentOutcomeVerified:false,
        changedRules:false,comparisonId,summary:this.summary()};
    });
  }
}
