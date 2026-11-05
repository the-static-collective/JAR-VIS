// JAR;VIS-028 — local private experiment memory, never an always-on agent.
// Stores ONLY explicitly captured synthetic labeled fixture experiments using
// byte-verified original GRAFT-028 capture/replay. No server data by default.
import {
 mkdirSync,existsSync,lstatSync,readFileSync,openSync,closeSync,
 writeSync,fsyncSync,unlinkSync,fstatSync,constants
} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {
 captureExperience,verifyExperience,recallSimilar,replayExperience
} from '../integrations/investigation/graft/src/experience-memory-028.mjs';
import {verifyOriginalOrgans} from './investigation-desk.mjs';
import {identifyGap} from '../integrations/investigation/alex/api-discovery-026.mjs';
import {getSyntheticGardenCases} from './investigation-gardener-027.mjs';
import {solve} from '../integrations/investigation/planz/motif-classical.mjs';

const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const NAME='synthetic-research-memory.jsonl';
const LIMIT={max:64,bytes:8000000,line:200000};
function ensureDir(dir){
 if(typeof dir!=='string'||!path.isAbsolute(dir)||dir.length>380)
  throw Error('HOLD_028_MEMORY_PATH_INVALID');
 mkdirSync(dir,{recursive:true,mode:0o700});
 const info=lstatSync(dir);
 if(info.isSymbolicLink()||!info.isDirectory()||(info.mode&0o077)!==0)
  throw Error('HOLD_028_MEMORY_DIRECTORY_NOT_PRIVATE');
 return path.join(dir,NAME);
}
function isSafeFile(file){
 if(!existsSync(file))return false;
 const s=lstatSync(file);
 if(!s.isFile()||s.isSymbolicLink()||s.size>LIMIT.bytes||
  (s.mode&0o077)!==0)throw Error('HOLD_028_MEMORY_FILE_NOT_PRIVATE');
 return true;
}
const action=(name,cost,pre,add)=>({name,cost,pre,add,del:[]});
function nextPlan(recall){
 const failed=recall.matches.some(x=>x.prior_outcome==='HOLD_ALL_VARIANTS_FAIL');
 const selected=failed?'TEST_RECALLED_FAILURE_WITH_NEW_HOLDOUT':
  recall.matches.length?'REVALIDATE_PREVIOUS_SUCCESS_INDEPENDENTLY':
   'REQUEST_FIRST_LABELED_EXPERIMENT';
 const domain=[
  action('VERIFY_EXACT_REPLAY_RECEIPT',1,['KNOWN'],['REPLAY_CONFIRMED']),
  action(selected,2,['REPLAY_CONFIRMED'],['QUESTION_READY']),
  action('ASSUME_PRIOR_EXPERIMENT_IS_TRUTH',9,['REPLAY_CONFIRMED'],['QUESTION_READY']),
  action('HOLD_FOR_OPERATOR_REVIEW',1,['QUESTION_READY'],['DONE'])
 ];
 const result=solve(domain,['KNOWN'],['DONE']);
 if(result.status!=='PLAN_FOUND'||result.steps.includes('ASSUME_PRIOR_EXPERIMENT_IS_TRUTH'))
  throw Error('HOLD_028_UNTRUSTWORTHY_MEMORY_PLAN');
 return {steps:result.steps,cost:result.cost,question:recall.next_question,
  independent_evidence_still_required:true,production_install:false};
}
export class InvestigationMemory {
 constructor(dir){this.dir=dir;this.file=ensureDir(dir)}
 static open({journalPath}={}){
  if(typeof journalPath!=='string'||!path.isAbsolute(journalPath))
   throw Error('HOLD_028_NEEDS_LOCAL_ABSOLUTE_JOURNAL_PATH');
  return new InvestigationMemory(path.join(path.dirname(journalPath),'.investigation-memory'));
 }
 read(){
  verifyOriginalOrgans();
  if(!isSafeFile(this.file))return {records:[],tip:null};
  const raw=readFileSync(this.file,'utf8');
  if(!raw)return {records:[],tip:null};
  if(!raw.endsWith('\n'))throw Error('HOLD_028_TRUNCATED_MEMORY');
  let prev=null;const records=[],seen=new Set();
  for(const line of raw.slice(0,-1).split('\n')){
   if(line.length>LIMIT.line||records.length>=LIMIT.max)
    throw Error('HOLD_028_MEMORY_BUDGET');
   let e;
   try{e=JSON.parse(line)}catch{throw Error('HOLD_028_BAD_MEMORY_JSON')}
   if(!e||e.schema!=='jarvis028.memory-entry/v0'||
     e.sequence!==records.length+1||e.prev!==prev)
    throw Error('HOLD_028_BROKEN_MEMORY_SEQUENCE');
   const {entry_sha256,...body}=e;
   if(digest(body)!==entry_sha256)
    throw Error('HOLD_028_CHANGED_MEMORY_CHAIN');
   verifyExperience(e.record);
   if(seen.has(e.record.receipt_sha256))throw Error('HOLD_028_DUPLICATE_MEMORY');
   seen.add(e.record.receipt_sha256);
   prev=entry_sha256;records.push(e.record);
  }
  return {records,tip:prev};
 }
 append(record){
  verifyExperience(record);
  const lock=this.file+'.lock';let lockFd,fd;
  try{
   lockFd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|
    (constants.O_NOFOLLOW||0),0o600);
   const old=this.read();
   if(old.records.some(r=>r.receipt_sha256===record.receipt_sha256))
    return {status:'EXPERIMENT_ALREADY_REMEMBERED',count:old.records.length,tip:old.tip};
   if(old.records.length>=LIMIT.max)throw Error('HOLD_028_MEMORY_CAPACITY');
   const body={schema:'jarvis028.memory-entry/v0',
    sequence:old.records.length+1,prev:old.tip,record};
   const e={...body,entry_sha256:digest(body)};
   const line=Buffer.from(JSON.stringify(e)+'\n');
   if(line.length>LIMIT.line)throw Error('HOLD_028_MEMORY_LINE_TOO_LARGE');
   isSafeFile(this.file);
   fd=openSync(this.file,constants.O_WRONLY|constants.O_APPEND|constants.O_CREAT|
      (constants.O_NOFOLLOW||0),0o600);
   if(!fstatSync(fd).isFile())throw Error('HOLD_028_MEMORY_NOT_FILE');
   if(writeSync(fd,line,0,line.length,null)!==line.length)
    throw Error('HOLD_028_INCOMPLETE_MEMORY_WRITE');
   fsyncSync(fd);
   return {status:'REMEMBERED_AND_FSYNCED',count:e.sequence,tip:e.entry_sha256};
  }finally{
   if(fd!==undefined)closeSync(fd);
   if(lockFd!==undefined){closeSync(lockFd);unlinkSync(lock)}
  }
 }
 async rememberGarden(garden,{approvedSyntheticCapture=false,approvedPersistentSave=false}={}){
  if(approvedSyntheticCapture!==true||approvedPersistentSave!==true)
   throw Error('HOLD_028_TWO_DISTINCT_CAPTURE_CONSENTS_REQUIRED');
  if(!garden||garden.schema!=='jarvis027.source-garden/v0'||
    garden.status!=='HELD_SOURCE_SPECIFIC_GARDENER_RESULT'||
    garden.production_install!==false||garden.live_public_service_contacted!==false||
    !garden.discovery||!garden.comparison||garden.comparison.authority!=='none')
   throw Error('HOLD_028_UNVERIFIED_GARDEN_RESULT');
  const cases=getSyntheticGardenCases();
  const record=await captureExperience({
   source_packet:garden.discovery,cases,approvedSyntheticCapture:true});
  // Never persist a forged UI-supplied result or mutate the source owner's
  // evaluated outcome. Persist only the original matching replay.
  if(digest(record.evaluation)!==digest(garden.comparison))
   throw Error('HOLD_028_GARDEN_REPLAY_NOT_IDENTICAL');
  const persisted=this.append(record);
  return {schema:'jarvis028.memory-save/v0',status:persisted.status,
   stored_experiments:persisted.count,memory_tip_sha256:persisted.tip,
   saved_record_sha256:record.receipt_sha256,
   source_pinned:true,recorded_only_synthetic_labeled_cases:true,
   not_public_or_cloud_storage:true,external_actions:0};
 }
 async recall(question){
  if(typeof question!=='string'||question.trim().length<12||question.length>320)
   throw Error('HOLD_028_INVALID_RECALL_QUESTION');
  const scope=identifyGap(question);
  if(scope.identified_domain!=='weather')
   return {schema:'jarvis028.memory-recall/v0',status:'HOLD_NO_LABELED_RECALL_DOMAIN',
    matched:[],replayed:[],external_actions:0};
  const {records,tip}=this.read();
  const recall=recallSimilar(records,getSyntheticGardenCases(),{limit:3});
  const replayed=[];
  for(const item of recall.matches){
   const record=records.find(r=>r.receipt_sha256===item.record_sha256);
   const check=await replayExperience(record);
   replayed.push({receipt:item.record_sha256,
    status:check.status,failed_candidates:check.failed_candidates});
  }
  return {
   schema:'jarvis028.memory-recall/v0',
   status:replayed.length?'PAST_EXPERIMENTS_REPLAYED':'NO_CLOSE_PRIOR_EXPERIMENTS',
   count:records.length,memory_tip_sha256:tip,
   matched:recall.matches.map(m=>({record_sha256:m.record_sha256,
    similarity:m.score,prior_outcome:m.prior_outcome,
    failed_candidates:m.previously_failed.length,
    previous_winner:m.previous_winner,
    structural_inference_only:true})),
   replayed,plan:nextPlan(recall),
   original_evidence_not_authenticity_proof:true,
   external_actions:0,automatic_install:false
  };
 }
 summary(){
  const h=this.read();
  return {schema:'jarvis028.memory-summary/v0',
   stored_experiments:h.records.length,memory_tip_sha256:h.tip,
   local_owner_only:true,contains_only_explicit_synthetic_cases:true,
   automatically_saved:false,automatic_actions:0};
 }
}
