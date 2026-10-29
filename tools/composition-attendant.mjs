#!/usr/bin/env node
// INSPAND-004: independent read-only JAR;VIS view into CANNON's native composer.
// The source lock is observation only. No foreign execution grant is inherited.
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const lock=JSON.parse(readFileSync(new URL('../spec/inspand-composer-source-v1.json',import.meta.url)));
const need=(x,s)=>{if(!x)throw Error('HOLD_COMPOSITION_ATTENDANT_'+s)};
const sha=(v,a='sha1')=>createHash(a).update(v).digest('hex');
function git(root,...args){
 try{return execFileSync('git',['--no-replace-objects','-C',root,...args],{timeout:20000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});}
 catch{throw Error('HOLD_COMPOSITION_ATTENDANT_GIT')};
}
export function verifyCannon(path){
 need(lock?.schema==='jarvis.composition-source-lock/v1'&&lock.repository==='the-static-collective/CANNON'
 &&lock.authority==='INSPECT_ONLY'&&lock.allowedCliOperation==='list'&&lock.ownerConsent===false,'LOCK');
 const root=realpathSync(resolve(path));
 need(lstatSync(root).isDirectory(),'NOT_DIRECTORY');
 const head=git(root,'rev-parse','HEAD').toString().trim();
 need(head===lock.commit,'HEAD_CHANGED');
 need(git(root,'remote','get-url','origin').toString().trim().replace(/\.git$/,'')==='https://github.com/'+lock.repository,'ORIGIN');
 need(git(root,'status','--porcelain','--untracked-files=all').toString().trim()==='','DIRTY');
 const raw=git(root,'cat-file','commit',head);
 need(sha(Buffer.concat([Buffer.from('commit '+raw.length+'\0'),raw]))===head,'FORGED_COMMIT');
 const proof=[];
 for(const [file,want] of Object.entries(lock.exactBlobs)){
  need(/^[a-f0-9]{40}$/.test(want),'BAD_OBJECT_PIN');
  const actual=git(root,'rev-parse','HEAD:'+file).toString().trim();
  need(actual===want,'BLOB_ID_'+file);
  const bytes=git(root,'cat-file','blob',want);
  need(sha(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]))===want,'BLOB_BYTES_'+file);
  need(readFileSync(join(root,file)).equals(bytes),'WORKTREE_'+file);
  proof.push({sourcePath:file,gitBlob:actual,contentSha256:sha(bytes,'sha256')});
 }
 return {root,source:{schema:'jarvis.composer-source-verification/v1',repository:lock.repository,
  commit:head,sourceBlobs:proof,authority:'READ_ONLY',reviewedOwnerConsent:false,automaticExecution:false}};
}
export function parse(args){
 const [operation,...rest]=args;
 need(['inspect','list'].includes(operation)&&rest.length===2&&rest[0]==='--cannon'
  &&typeof rest[1]==='string'&&rest[1].length>0,'INSPECT_OR_LIST_ONLY');
 return {operation,path:rest[1]};
}
export function run(args){
 const {operation,path}=parse(args);
 const {root,source}=verifyCannon(path);
 if(operation==='inspect')return {schema:'jarvis.composition-attendant-inspection/v1',source,
  recipes:0,action:'INSPECT_ONLY',authority:'NONE'};
 const stdout=execFileSync(process.execPath,[join(root,'scripts/reflex-composer.mjs'),'list'],
 {cwd:root,encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']});
 const result=JSON.parse(stdout);
 need(result.schema==='cannon.reflex-composition-list/v1'&&result.authority==='NONE'
  &&result.recipes?.length===1,'CANNON_DID_NOT_LIST');
 const recipe=result.recipes[0];
 need(recipe.id==='plan-proof-to-pixels-and-print/v1'&&recipe.stages.length===2
  &&recipe.edges?.length===1&&recipe.constraints?.autonomy===false
  &&recipe.constraints?.publish===false,'PROMOTED_RECIPE');
 return {schema:'jarvis.composition-invitation/v1',source,
  candidate:{id:recipe.id,title:recipe.title,stages:recipe.stages,edges:recipe.edges},
  operatorAction:'SEPARATE_PERMISSION_REQUIRED',automaticExecution:false,
  humanKeep:false,externalDispatch:false,authority:'NONE',realWorldOutcomes:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2))}
 catch(e){console.error(String(e.message||e));process.exitCode=2}
}
