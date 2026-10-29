#!/usr/bin/env node
/** JAR;VIS attends a fixed CANNON experiment; it never grants another owner's authority. */
import {readFileSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const lock=JSON.parse(readFileSync(new URL('../spec/constellation-source-v1.json',import.meta.url)));
export function authorizeLocalBuild(value){
 if(value!=='LOCAL_FICTIONAL_ONLY')throw Error('HOLD: explicit LOCAL_FICTIONAL_ONLY operator authorization required');
 return true;
}
export function parseArguments(args){
 const [command,...tail]=args;
 if(!['inspect','build','verify'].includes(command)||tail.length%2)throw Error('EXPECTED_INSPECT_BUILD_OR_VERIFY');
 const options={};for(let i=0;i<tail.length;i+=2){const k=tail[i],v=tail[i+1];if(!['--cannon','--roots','--out','--authorize'].includes(k)||Object.hasOwn(options,k)||!v)throw Error('INVALID_OR_DUPLICATE_FLAG');options[k]=v}
 if(!options['--cannon'])throw Error('CANNON_CHECKOUT_REQUIRED');
 if(command!=='inspect'&&(!options['--roots']||!options['--out']))throw Error('ROOTS_AND_OUTPUT_REQUIRED');
 if(command==='inspect'&&(options['--roots']||options['--out']||options['--authorize']))throw Error('INSPECT_HAS_NO_ACTION');
 if(command==='build')authorizeLocalBuild(options['--authorize']);
 if(command==='verify'&&options['--authorize'])throw Error('VERIFY_HAS_NO_NEW_GRANT');
 return {command,options};
}
export function inspectCannon(input, selectedLock=lock){
 if(!/^[a-f0-9]{40}$/.test(selectedLock.commit??''))throw Error('HOLD: exact reviewed CANNON source lock not provisioned');
 const root=realpathSync(resolve(input));
 const git=(...argv)=>execFileSync('git',['--no-replace-objects','-C',root,...argv],{encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024}).trim();
 const checkObject=(type,oid)=>{
  const bytes=execFileSync('git',['--no-replace-objects','-C',root,'cat-file',type,oid],{maxBuffer:8*1024*1024,timeout:15000});
  if(createHash('sha1').update(type+' '+bytes.length+'\0').update(bytes).digest('hex')!==oid)throw Error('HOLD: CANNON_GIT_OBJECT_BYTES_MISMATCH');
 };
 if(git('rev-parse','HEAD')!==selectedLock.commit)throw Error('HOLD: CANNON_EXACT_PIN_MISMATCH');
 if(git('remote','get-url','origin').replace(/\.git$/,'')!=='https://github.com/'+selectedLock.repository)throw Error('HOLD: CANNON_ORIGIN_MISMATCH');
 checkObject('commit',selectedLock.commit);checkObject('tree',git('rev-parse',selectedLock.commit+'^{tree}'));
 for(const row of git('ls-tree','-rdz',selectedLock.commit).split('\0').filter(Boolean))checkObject('tree',row.split('\t')[0].split(' ')[2]);
 for(const ancestor of selectedLock.ancestry)git('merge-base','--is-ancestor',ancestor,selectedLock.commit);
 const tracked=new Set(git('ls-tree','-rz',selectedLock.commit).split('\0').filter(Boolean).map(row=>row.split('\t')[1]));
 function walk(dir,prefix=''){
  for(const e of readdirSync(dir,{withFileTypes:true})){
   if(!prefix&&['.git','node_modules'].includes(e.name))continue;
   const rel=prefix+e.name;if(e.isSymbolicLink())throw Error('HOLD: CANNON_UNTRACKED_RUNTIME_SYMLINK');
   if(e.isDirectory())walk(join(dir,e.name),rel+'/');
   else if(/\.(?:mjs|cjs|js|ts|json|py|so|node)$/i.test(e.name)&&!tracked.has(rel))throw Error('HOLD: CANNON_UNTRACKED_RUNTIME_INPUT');
  }
 }
 walk(root);let count=0;
 for(const row of git('ls-tree','-rz',selectedLock.commit).split('\0').filter(Boolean)){
  const [meta,path]=row.split('\t'),[mode,type,oid]=meta.split(' '),live=join(root,path);
  if(type!=='blob'||!['100644','100755'].includes(mode)||!lstatSync(live).isFile()||realpathSync(live)!==live)throw Error('HOLD: CANNON_NONREGULAR_SOURCE');
  const bytes=readFileSync(live);const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  if(actual!==oid)throw Error('HOLD: CANNON_TRACKED_SOURCE_BYTES_MISMATCH');count++;
 }
 const atlas=JSON.parse(readFileSync(join(root,'constellation/atlas.json')));
 return {schema:'jarvis.constellation-source-observation/v1',repository:selectedLock.repository,commit:selectedLock.commit,ancestryPreserved:true,trackedFilesChecked:count,publicRepositories:atlas.coverage.publicRepositories,privateRepositoriesWithheld:atlas.coverage.privateRepositoriesWithheld,authority:'INSPECT_ONLY',fieldVerified:false,externalDispatch:false};
}
export function run(args){
 const {command,options}=parseArguments(args);const cannon=resolve(options['--cannon']);
 const observation=inspectCannon(cannon);
 if(command==='inspect')return observation;
 const argv=[join(cannon,'scripts/constellation.mjs'),command,'--roots',resolve(options['--roots']),'--out',resolve(options['--out'])];
 if(command==='build')argv.push('--authorize','LOCAL_FICTIONAL_ONLY');
 const env={...process.env,GIT_NO_REPLACE_OBJECTS:'1'};delete env.CONSTELLATION_CHILD;
 const result=JSON.parse(execFileSync(process.execPath,argv,{encoding:'utf8',maxBuffer:4*1024*1024,timeout:180000,env,stdio:['ignore','pipe','pipe']}));
 return {schema:'jarvis.constellation-return/v1',source:observation,result,authority:'LOCAL_FICTIONAL_SOFTWARE_ONLY',foreignOwnerAdmission:false,externalDispatch:false};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2))}
 catch(error){console.error('HOLD:',String(error.stderr||error.message).slice(0,1600));process.exitCode=2}
}
