import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArcade,runArcade} from '../tools/stranger-arcade.mjs';
test('new operator preserves fixed commands, local scope and explicit authorization',()=>{
 assert.equal(parseArcade(['build','--cannon','/tmp/cannon','--config','/tmp/c.json','--out','/tmp/out','--authorize','LOCAL_FICTIONAL_ONLY']).command,'build');
 for(const a of [['deploy'],['build','--cannon','x','--config','x','--out','x'],['verify','--cannon','x','--config','x','--out','x','--authorize','LOCAL_FICTIONAL_ONLY'],['serve','--cannon','x','--config','x','--out','x','--sessions','x','--shell','x'],['inspect','--cannon','x','--request','x']])assert.throws(()=>parseArcade(a));
});
test('new source lock cannot fall back to moving main or another source directory',()=>{assert.throws(()=>runArcade(['inspect','--cannon','/not/acquired']))});
test('actual new machine verifies through source-locked JAR;VIS operator', {skip:!process.env.ARCADE_CANNON||!process.env.ARCADE_CONFIG||!process.env.ARCADE_PACKET?'Requires acquired exact native machine; required in owner workflow':false},()=>{
 const r=runArcade(['verify','--cannon',process.env.ARCADE_CANNON,'--config',process.env.ARCADE_CONFIG,'--out',process.env.ARCADE_PACKET]);assert.equal(r.result.status,'FRESH_PROCESS_NATIVE_COLD_REPLAY_VERIFIED');assert.equal(r.result.coverage.executingNativeDonorRepositories,22);assert.equal(r.externalDispatch,false);
});
