import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectCannon,run} from '../tools/constellation.mjs';
const cannon=process.env.CONSTELLATION_CANNON,roots=process.env.CONSTELLATION_ROOTS;
test('actual locked CANNON observation, local build and fresh-process replay; replacement and shadow refusal', {skip:!cannon||!roots?'Set CONSTELLATION_CANNON and CONSTELLATION_ROOTS; required in constellation CI':false},()=>{
 const dir=mkdtempSync(join(tmpdir(),'jarvis-constellation-'));
 try{
  assert.equal(inspectCannon(cannon).publicRepositories,89);
  const out=join(dir,'packet');
  const result=run(['build','--cannon',cannon,'--roots',roots,'--out',out,'--authorize','LOCAL_FICTIONAL_ONLY']);
  assert.equal(result.externalDispatch,false);assert.equal(result.foreignOwnerAdmission,false);
  const replay=run(['verify','--cannon',cannon,'--roots',roots,'--out',out]);
  assert.equal(replay.result.status,'FRESH_PROCESS_COLD_REPLAY_VERIFIED');
  const copy=join(dir,'cannon');execFileSync('git',['clone','--quiet','--no-hardlinks',cannon,copy]);
  const git=(...args)=>execFileSync('git',['-C',copy,...args],{encoding:'utf8'}).trim();
  git('remote','set-url','origin','https://github.com/the-static-collective/CANNON.git');
  assert.equal(inspectCannon(copy).commit,result.source.commit);
  mkdirSync(join(copy,'src/node_modules/shadow'),{recursive:true});writeFileSync(join(copy,'src/node_modules/shadow/package.json'),'{}');
  assert.throws(()=>inspectCannon(copy),/UNTRACKED_RUNTIME/);rmSync(join(copy,'src/node_modules'),{recursive:true});
  git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  writeFileSync(join(copy,'src/constellation/crossings.mjs'),'throw Error("GIT_REPLACE_UNPINNED_CODE");');git('add','.');
  const tree=git('write-tree'),replacement=git('commit-tree',tree,'-m','fixture replacement');git('replace',git('rev-parse','HEAD'),replacement);
  assert.throws(()=>inspectCannon(copy),/TRACKED_SOURCE_BYTES/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
