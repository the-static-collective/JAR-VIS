#!/usr/bin/env node
import {inspectHarmonyPublic,composeHarmonyCandidate} from '../src/harmony-public.mjs';
const id=process.argv[2]||'food';
try{
 const obs=await inspectHarmonyPublic();
 const candidate=composeHarmonyCandidate(obs,id);
 process.stdout.write(JSON.stringify(candidate,null,2)+'\n');
}catch(err){
 process.stderr.write('HOLD: public catalog unavailable or not admissible for review. '+err.message+'\n');
 process.exitCode=1;
}
