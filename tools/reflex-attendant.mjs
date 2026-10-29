#!/usr/bin/env node
// JAR;VIS reads CANNON's pinned published-on-branch source, not its authority.
// The only permitted foreign calls are local LIST and DISCOVER.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,realpathSync,lstatSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const lock=JSON.parse(readFileSync(new URL('../spec/inspand-reflex-source-v1.json',import.meta.url)));
function hold(cond,tag){if(!cond)throw Error('HOLD_JARVIS_REFLEX_'+tag)}
const sha=(algo,bytes)=>createHash(algo).update(bytes).digest('hex');
function git(root,args,{binary=false}={}){
 return execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:binary?undefined:'utf8',timeout:25000,maxBuffer:12*1024*1024,stdio:['ignore','pipe','pipe']});
}
export function parse(args){
 const [mode,...tail]=args;
 hold(['inspect','discover'].includes(mode)&&tail.length%2===0,'READ_ONLY');
 const opts={};
 for(let i=0;i<tail.length;i+=2){
  hold(['--cannon','--need'].includes(tail[i])&&tail[i+1]&&!Object.hasOwn(opts,tail[i]),'BAD_FLAG');
  opts[tail[i]]=tail[i+1];
 }
 hold(opts['--cannon'],'CANNON_CHECKOUT');
 if(mode==='inspect')hold(!opts['--need'],'INSPECT_NO_NEED');
 if(mode==='discover')hold(typeof opts['--need']==='string'&&opts['--need'].length>0&&opts['--need'].length<=280,'NEED');
 return {mode,opts};
}
export function inspectSource(dir){
 hold(lock.schema==='jarvis.reflex-source-lock/v1'&&lock.repository==='the-static-collective/CANNON'
   &&lock.authority==='INSPECT_ONLY'&&lock.foreignOwnerConsent===false,'LOCK');
 hold(/^[a-f0-9]{40}$/.test(lock.commit),'LOCK_COMMIT');
 const root=realpathSync(resolve(dir));
 hold(existsSync(root)&&lstatSync(root).isDirectory(),'ROOT');
 const commit=git(root,['rev-parse','HEAD']).trim();
 hold(commit===lock.commit,'HEAD_PIN');
 const origin=git(root,['remote','get-url','origin']).trim().replace(/\.git$/,'');
 hold(origin==='https://github.com/'+lock.repository,'ORIGIN');
 hold(git(root,['status','--porcelain','--untracked-files=all']).trim()==='','UNCLEAN_SOURCE');
 const object=git(root,['cat-file','commit',commit],{binary:true});
 hold(sha('sha1',Buffer.concat([Buffer.from('commit '+object.length+'\0'),object]))===commit,'COMMIT_BYTES');
 const blobs={};
 for(const [path,want] of Object.entries(lock.sourceBlobs)){
  hold(/^[a-f0-9]{40}$/.test(want),'BLOB_LOCK');
  const oid=git(root,['rev-parse','HEAD:'+path]).trim();
  hold(oid===want,'BLOB_ID_'+path);
  const bytes=git(root,['cat-file','blob',oid],{binary:true});
  hold(sha('sha1',Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]))===want,'BLOB_BYTES_'+path);
  hold(readFileSync(join(root,path)).equals(bytes),'WORKTREE_BYTES_'+path);
  blobs[path]={gitBlob:oid,sha256:sha('sha256',bytes)};
 }
 const catalog=JSON.parse(readFileSync(join(root,'registry/reflex-library-v1.json'),'utf8'));
 hold(catalog.schema==='cannon.reflex-library/v1'&&catalog.authority==='EXPERIMENT_HOLD','CATALOG_SCHEMA');
 hold(catalog.capabilities?.length===lock.executableCapabilityClaims,'CATALOG_CAPABILITIES');
 hold(catalog.capabilities.every(x=>x.owner==='CANNON'&&x.gates?.publish===false
   &&x.gates?.physical===false&&x.gates?.humanKeep===false),'CATALOG_AUTHORITY');
 return {schema:'jarvis.reflex-attendant-source/v1',repository:lock.repository,commit,
  sourceBlobs:blobs,capabilitiesInspected:catalog.capabilities.length,authority:'INSPECT_ONLY',
  sourceOwnerApprovalNotImplied:true,realWorldOutcomes:0,automaticExecution:false};
}
export function run(args){
 const {mode,opts}=parse(args);
 const source=inspectSource(opts['--cannon']);
 if(mode==='inspect')return {schema:'jarvis.reflex-inspection/v1',source,
  decision:'READ_ONLY',authority:'NONE'};
 const result=JSON.parse(execFileSync(process.execPath,
  [join(resolve(opts['--cannon']),'scripts/reflex-library.mjs'),'discover','--need',opts['--need']],
  {encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']}));
 hold(result.schema==='cannon.reflex-discovery/v1'
  &&result.authority==='NONE'&&result.automaticallySelected===false
  &&result.interpretation==='LITERAL_TOKEN_MATCH_NOT_MODEL_OR_PROOF','FOREIGN_DISCOVERY');
 hold(result.candidates.every(x=>x.unmetGate==='EXPLICIT_OPERATOR_CHOICE_AND_LOCAL_SYNTHETIC_AUTHORIZATION'
   &&x.measuredTimeSavedSeconds===null),'PROMOTED_CANDIDATE');
 return {schema:'jarvis.reflex-invitation/v1',source,query:opts['--need'],
  candidates:result.candidates,operatorAction:'REVIEW_CHOICE_NOT_EXECUTION',
  authority:'NONE',humanKeep:false,foreignAdmission:false,automaticallyExecuted:false,
  externalDispatch:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2))}
 catch(e){console.error(String(e.message||e).slice(0,1400));process.exitCode=2}
}
