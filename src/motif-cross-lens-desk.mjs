/** Local-only THOUGHT-012 instrument; all source-graph claims are provisional. */
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MotifThoughtDesk, cleanRequest } from './motif-thought-desk.mjs';

const run = promisify(execFile);
const defaultRoot = fileURLToPath(new URL('../runtime/motif-thought-010/', import.meta.url));
const OWNED = Object.freeze({
  'experiments/thought-012/cross_lens.py':'aef6449517bea81957bc6d47750bfdf6661d400ebffcf681ed4b6189fefe52b8',
  'experiments/thought-012/cross_lens_door.py':'c4d6420e99dc439f5a10fc1f809d07859a9464eacb45a6bb480829e61a587a85'
});
function hold(why,status=422){ const e=new Error('HOLD: '+why); e.status=status;return e; }
function validRequest(p){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>
    !['question','ideas','relationships','show_geometry','seed_a','seed_b'].includes(k)))
    throw hold('unknown field in cross-lens request');
  const {seed_a,seed_b,...fields}=p;
  const request=cleanRequest({...fields,goals:['association','dependency','tension','affordance']});
  if(!Number.isSafeInteger(seed_a)||!Number.isSafeInteger(seed_b)||
     seed_a<0||seed_b<0||seed_a===seed_b||seed_a>=request.ideas.length||seed_b>=request.ideas.length)
    throw hold('choose two distinct idea indices');
  return {request,seed_a,seed_b};
}
async function checkPin(root,python){
  // Check pre-existing source-owned THOUGHT-007..010 files through existing JAR;VIS gate.
  const original=await new MotifThoughtDesk({root,python}).status();
  if(original?.available!==true)throw hold('MOTIF base source unavailable',503);
  const full=await realpath(root).catch(()=>{throw hold('MOTIF snapshot missing',503)});
  for(const [name,expected] of Object.entries(OWNED)){
    const bytes=await readFile(join(full,name)).catch(()=>{throw hold('cross-lens source missing: '+name,503)});
    if(createHash('sha256').update(bytes).digest('hex')!==expected)
      throw hold('cross-lens source pin mismatch: '+name,503);
  }
  return join(full,'experiments/thought-012/cross_lens_door.py');
}
function inspect(request,seed_a,seed_b,r){
  if(!r||r.schema!=='motif.thought-cross-door.reply.v1'||
     r.request_id!==request.request_id||r.caller!=='jarvis-local'||
     r.status!=='HOLD_FOR_OPERATOR_REVIEW'||r.privacy!=='PRIVATE_LOCAL'||
     r.pen_status!=='UNCHANGED'||r.external_authority!=='NONE'||
     r.no_map_question_parity!==true||r.source_roots_authenticated!==false||
     r.stored!==false||r.exported!==false||r.sent_externally!==false||
     !Array.isArray(r.question_pair_indices)||r.question_pair_indices[0]!==seed_a||
     r.question_pair_indices[1]!==seed_b||
     r.initial_question?.kind!=='operator_pencil_seed'||
     r.initial_question?.evidence_class!=='UNSOURCED_PENCIL_SEED'||
     !Array.isArray(r.initial_question?.witness_relation_ids)||
     r.initial_question.witness_relation_ids.length!==0||
     !Array.isArray(r.carried_questions)||r.carried_questions.length>120||
     r.carried_questions.some(q=>q.status!=='QUESTION_ONLY'||q.external_authority!=='NONE')||
     !Array.isArray(r.steps)||r.steps.length>3||
     r.steps.some(s=>s.geometry_used_for_evidence!==false||s.pen_promotion!==false||
       s.external_authority!=='NONE'||s.survival!=='QUESTION_ONLY'||!Array.isArray(s.new_question_ids))||
     !Array.isArray(r.visited_lenses)||r.visited_lenses.length!==r.steps.length||
     r.visited_lenses.some(l=>!['dependency','tension','affordance'].includes(l))||
     !/^[a-f0-9]{64}$/.test(r.source_evidence_digest??''))
    throw hold('invalid source-owned cross-lens authority receipt',502);
  return {schema:'jarvis.thought-cross-room.reply.v1',status:'HOLD_FOR_OPERATOR_REVIEW',
    ideas:request.ideas,question:request.question,question_pair_indices:[seed_a,seed_b],
    initial_question:r.initial_question,carried_questions:r.carried_questions,
    steps:r.steps,visited_lenses:r.visited_lenses,source_digest:r.source_evidence_digest,
    no_map_question_parity:true,pen_status:'UNCHANGED',external_authority:'NONE',
    stored:false,exported:false,sent_externally:false,
    warning:'ONE OPERATOR / ONE DECLARED SOURCE. Changing lenses is not independent corroboration.'};
}
export class MotifCrossLensDesk {
  constructor({root=defaultRoot,python=process.env.MOTIF_THOUGHT_PYTHON??'python3'}={}){
    this.root=resolve(root);this.python=python;this.active=0;
  }
  async status(){
    try{await checkPin(this.root,this.python);return {available:true,mode:'SOURCE_PINNED_CROSS_LENS',authority:'NONE',stored:false}}
    catch(e){return {available:false,mode:'HOLD',reason:e.message,authority:'NONE',stored:false}}
  }
  async inspect(payload){
    const {request,seed_a,seed_b}=validRequest(payload);
    if(this.active>=2)throw hold('local cross-lens room busy',429);
    const script=await checkPin(this.root,this.python);
    this.active++;let dir;
    try{
      dir=await mkdtemp(join(tmpdir(),'jarvis-cross-lens-'));
      const input=join(dir,'request.json');
      await writeFile(input,JSON.stringify(request),{flag:'wx',mode:0o600});
      const {stdout}=await run(this.python,['-I','-B',script,input,
        '--seed-a',String(seed_a),'--seed-b',String(seed_b),'--steps','3'],{
        timeout:6000,maxBuffer:900000,env:{PATH:process.env.PATH??'',
          PYTHONNOUSERSITE:'1',PYTHONDONTWRITEBYTECODE:'1'}});
      let r;try{r=JSON.parse(stdout)}catch{throw hold('invalid local Python JSON response',502)}
      return inspect(request,seed_a,seed_b,r);
    }catch(e){if(e.status)throw e;throw hold('local cross-lens instrument unavailable or refused',503)}
    finally{if(dir)await rm(dir,{recursive:true,force:true});this.active--}
  }
}
export {validRequest,OWNED};
