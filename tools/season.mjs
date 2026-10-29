#!/usr/bin/env node
/** JAR;VIS observes, rather than owns, a CANNON SEASON-001 evidence ledger. */
import {readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {inspectCannon, authorizeLocalBuild} from './constellation.mjs';

const seasonLock=JSON.parse(readFileSync(new URL('../spec/season-source-v1.json',import.meta.url)));

export function parseSeasonArgs(args) {
 const [command,...tail]=args;
 if (!['inspect','verify','demo'].includes(command)||tail.length%2)
  throw Error('HOLD_SEASON_COMMAND_REQUIRED');
 const flags={};
 const allowed=new Set(['--cannon','--ledger','--out','--authorize']);
 for (let i=0;i<tail.length;i+=2) {
  const key=tail[i], value=tail[i+1];
  if (!allowed.has(key)||Object.hasOwn(flags,key)||typeof value!=='string'||!value)
   throw Error('HOLD_SEASON_FLAG_INVALID');
  flags[key]=value;
 }
 if (!flags['--cannon']) throw Error('HOLD_EXACT_CANNON_CHECKOUT_REQUIRED');
 const expected=command==='inspect' ? ['--cannon'] :
  command==='verify' ? ['--cannon','--ledger'] :
   ['--cannon','--out','--authorize'];
 if (Object.keys(flags).sort().join('|')!==expected.sort().join('|'))
  throw Error('HOLD_SEASON_SCOPE_REQUIRED');
 if (command==='demo') authorizeLocalBuild(flags['--authorize']);
 return {command,flags};
}
export function inspectSeason(cannon) {
 if (seasonLock.schema!=='jarvis.season-source-lock/v1'||
     seasonLock.sourceSchema!=='cannon.season-witness/v1')
  throw Error('HOLD_SEASON_LOCK_INVALID');
 const observed=inspectCannon(cannon, seasonLock);
 return {
  schema:'jarvis.season-source-observation/v1',
  repository:observed.repository,
  commit:observed.commit,
  trackedFilesChecked:observed.trackedFilesChecked,
  ancestryPreserved:observed.ancestryPreserved,
  stageMeaning:'SELF_REPORTED_ONLY',
  verifiedHumanOutcomes:0,
  authority:'SOURCE_INSPECTION_ONLY',
  authorizedRealWorldActions:false,
  authorizedMoneyMovements:false,
  externalDispatch:false
 };
}
export function runSeason(args) {
 const {command,flags}=parseSeasonArgs(args);
 const cannon=resolve(flags['--cannon']);
 const source=inspectSeason(cannon);
 if (command==='inspect') return source;
 const argv=[join(cannon,'scripts/season-witness.mjs'),command,
  resolve(flags[command==='verify'?'--ledger':'--out'])];
 const env={...process.env,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.NODE_OPTIONS;delete env.ARCADE_NATIVE_CHILD;delete env.CONSTELLATION_CHILD;
 const stdout=execFileSync(process.execPath,argv,{
  encoding:'utf8',env,stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:2*1024*1024
 });
 const result=JSON.parse(stdout);
 return {
  schema:'jarvis.season-attendant-return/v1',
  source, result,
  status:command==='demo'?'FICTIONAL_DEMONSTRATION_ONLY':'OFFLINE_INSPECTION_ONLY',
  independentHumanVerification:false,
  authorizedRealWorldActions:false,
  authorizedMoneyMovements:false,
  externalDispatch:false
 };
}
if (process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
 try {console.log(JSON.stringify(runSeason(process.argv.slice(2)),null,2))}
 catch(error) {console.error('HOLD:',String(error.stderr||error.message).slice(0,1600));process.exitCode=2}
}
