#!/usr/bin/env node
/** JAR;VIS attends the exact CANNON #49 Stranger Arcade; it does not become the runtime or source authority. */
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {inspectCannon,authorizeLocalBuild} from './constellation.mjs';

const arcadeLock=JSON.parse(readFileSync(new URL('../spec/arcade-source-v1.json',import.meta.url)));

export function parseArcadeArgs(args){
 const [command,...rest]=args;
 if(!['inspect','build','verify','challenge'].includes(command)||rest.length%2)throw Error('HOLD_ARCADE_COMMAND_REQUIRED');
 const flags={};
 const allowed=new Set(['--cannon','--config','--out','--request','--authorize']);
 for(let i=0;i<rest.length;i+=2){
  const key=rest[i],value=rest[i+1];
  if(!allowed.has(key)||Object.hasOwn(flags,key)||typeof value!=='string'||!value)throw Error('HOLD_ARCADE_FLAG_INVALID');
  flags[key]=value;
 }
 if(!flags['--cannon'])throw Error('HOLD_EXACT_CANNON_CHECKOUT_REQUIRED');
 if(command==='inspect'){
  if(Object.keys(flags).length!==1)throw Error('HOLD_INSPECT_IS_READ_ONLY');
 }else{
  if(!flags['--config']||!flags['--out'])throw Error('HOLD_CONFIG_AND_OUTPUT_REQUIRED');
  if(command==='challenge'&&!flags['--request'])throw Error('HOLD_REQUEST_REQUIRED');
  if(command!=='challenge'&&flags['--request'])throw Error('HOLD_REQUEST_ONLY_FOR_CHALLENGE');
  if(command==='verify'&&flags['--authorize'])throw Error('HOLD_VERIFY_TAKES_NO_NEW_AUTHORIZATION');
  if(['build','challenge'].includes(command))authorizeLocalBuild(flags['--authorize']);
 }
 return {command,flags};
}

export function inspectArcade(cannon){
 if(arcadeLock.schema!=='jarvis.arcade-source-lock/v1'||arcadeLock.commit.length!==40)
  throw Error('HOLD_ARCADE_SOURCE_LOCK_INVALID');
 const old=inspectCannon(cannon,arcadeLock);
 return {
  schema:'jarvis.arcade-source-observation/v1',
  repository:old.repository,commit:old.commit,trackedFilesChecked:old.trackedFilesChecked,
  ancestryPreserved:old.ancestryPreserved,
  expectedNativeDonorOwners:arcadeLock.nativeDonorOwners,
  expectedPublicDocumentSources:arcadeLock.publicDocumentSources,
  expectedTotalParticipating:arcadeLock.participatingPublicRepositories,
  measuredNativeDonorOwners:null,measuredFieldWitnesses:null,
  status:'EXACT_SOURCE_VERIFIED_NOT_YET_EXECUTED',
  authority:'INSPECT_ONLY',fieldVerified:false,externalDispatch:false
 };
}

export function runArcade(args){
 const {command,flags}=parseArcadeArgs(args);
 const cannon=resolve(flags['--cannon']);
 const source=inspectArcade(cannon);
 if(command==='inspect')return source;
 const argv=[join(cannon,'scripts/arcade-machine.mjs'),command,
  '--config',resolve(flags['--config']),'--out',resolve(flags['--out'])];
 if(command==='challenge')argv.push('--request',resolve(flags['--request']));
 if(['build','challenge'].includes(command))argv.push('--authorize','LOCAL_FICTIONAL_ONLY');
 const env={...process.env,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.ARCADE_NATIVE_CHILD;delete env.CONSTELLATION_CHILD;delete env.NODE_OPTIONS;
 const output=execFileSync(process.execPath,argv,{
  env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,
  stdio:['ignore','pipe','pipe']
 });
 const result=JSON.parse(output);
 return {schema:'jarvis.arcade-attendant-return/v1',source,result,
  authority:'LOCAL_FICTIONAL_SOFTWARE_ONLY',foreignOwnerAdmission:false,
  independentHumanVerification:false,externalDispatch:false};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{console.log(JSON.stringify(runArcade(process.argv.slice(2)),null,2))}
 catch(error){console.error('HOLD:',String(error.stderr||error.message).slice(0,1600));process.exitCode=2}
}
