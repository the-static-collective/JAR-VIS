#!/usr/bin/env node
/** JAR;VIS owns this operator door. CANNON owns its bounded native machine. */
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {inspectCannon,authorizeLocalBuild} from './constellation.mjs';
const selection=JSON.parse(readFileSync(new URL('../spec/arcade-source-v1.json',import.meta.url)));
export function parseArcade(args){
 const [command,...tail]=args;if(!['inspect','acquire','build','verify','challenge','serve'].includes(command)||tail.length%2)throw Error('ARCADE_COMMAND_REQUIRED');
 const opts={};for(let i=0;i<tail.length;i+=2){const k=tail[i];if(!['--cannon','--config','--out','--request','--sessions','--port','--authorize','--into'].includes(k)||Object.hasOwn(opts,k)||!tail[i+1])throw Error('ARCADE_INVALID_OR_DUPLICATE_FLAG');opts[k]=tail[i+1]}
 if(!opts['--cannon'])throw Error('PINNED_CANNON_REQUIRED');
 if(['build','challenge'].includes(command))authorizeLocalBuild(opts['--authorize']);
 if(['build','verify','challenge','serve'].includes(command)&&(!opts['--config']||!opts['--out']))throw Error('LOCAL_CONFIG_AND_OUTPUT_REQUIRED');
 if(command==='challenge'&&!opts['--request'])throw Error('LOCAL_REQUEST_REQUIRED');
 if(command==='serve'&&!opts['--sessions'])throw Error('LOCAL_SESSIONS_DIRECTORY_REQUIRED');
 if(command==='acquire'&&!opts['--into'])throw Error('NEW_ACQUISITION_DIRECTORY_REQUIRED');
 const allowed={inspect:['--cannon'],acquire:['--cannon','--into'],build:['--cannon','--config','--out','--authorize'],verify:['--cannon','--config','--out'],challenge:['--cannon','--config','--out','--request','--authorize'],serve:['--cannon','--config','--out','--sessions','--port']}[command];
 if(Object.keys(opts).some(k=>!allowed.includes(k)))throw Error('ARCADE_FLAG_OUTSIDE_COMMAND_SCOPE');
 return {command,opts};
}
export function runArcade(args){
 const {command,opts}=parseArcade(args),cannon=resolve(opts['--cannon']);const source=inspectCannon(cannon,selection);
 if(command==='inspect')return {schema:'jarvis.arcade-source-observation/v1',source,authority:'INSPECT_ONLY'};
 const argv=[join(cannon,'scripts/arcade-machine.mjs'),command];
 for(const [key,value] of Object.entries(opts))if(key!=='--cannon')argv.push(key,['--authorize','--port'].includes(key)?value:resolve(value));
 const env={...process.env};delete env.ARCADE_NATIVE_CHILD;delete env.CONSTELLATION_CHILD;
 const result=spawnSync(process.execPath,argv,{encoding:'utf8',timeout:command==='serve'?undefined:600000,maxBuffer:8*1024*1024,env,stdio:command==='serve'?'inherit':'pipe'});
 if(result.status!==0)throw Error('HOLD_CANNON_LOCAL_MACHINE: '+String(result.stderr||result.error?.message||result.signal).slice(0,2600));
 if(command==='serve')return null;
 return {schema:'jarvis.stranger-arcade-return/v1',source,result:JSON.parse(result.stdout),foreignOwnerAuthority:false,externalDispatch:false};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){try{const r=runArcade(process.argv.slice(2));if(r)console.log(JSON.stringify(r,null,2))}catch(e){console.error('HOLD:',e.message);process.exitCode=2}}
