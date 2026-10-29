import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseArcadeArgs,inspectArcade,runArcade} from '../tools/arcade.mjs';

test('Stranger Arcade owner head and ancestry are immutable review pins, never main',()=>{
 const lock=JSON.parse(readFileSync(new URL('../spec/arcade-source-v1.json',import.meta.url)));
 assert.equal(lock.commit,'f99d4b0f74b117e0af034137d550e88aa3d01f26');
 assert.equal(lock.ancestry[0],'c5031495424abcd6141d546a1f85a5e781539072');
 assert.equal(lock.ancestry.length,5);
 assert.equal(lock.nativeDonorOwners,22);
});

test('inspection cannot become local execution by injecting arguments',()=>{
 const cmd=parseArcadeArgs(['inspect','--cannon','/tmp/example']);
 assert.equal(cmd.command,'inspect');
 for(const args of [
  ['serve','--cannon','/tmp/example'],
  ['inspect','--cannon','/tmp/example','--authorize','LOCAL_FICTIONAL_ONLY'],
  ['inspect','--cannon','/tmp/example','--out','/tmp/output'],
  ['verify','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out','--authorize','LOCAL_FICTIONAL_ONLY'],
  ['build','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out'],
  ['challenge','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out','--authorize','LOCAL_FICTIONAL_ONLY'],
  ['build','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out','--authorize','YES'],
  ['verify','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out','--command','anything'],
  ['verify','--cannon','/tmp/example','--cannon','/tmp/second','--config','/tmp/config','--out','/tmp/out']
 ])assert.throws(()=>parseArcadeArgs(args));
 assert.equal(parseArcadeArgs(['verify','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out']).command,'verify');
 assert.equal(parseArcadeArgs(['challenge','--cannon','/tmp/example','--config','/tmp/config','--out','/tmp/out','--request','/tmp/fictional.json','--authorize','LOCAL_FICTIONAL_ONLY']).command,'challenge');
});

test('foreign or missing checkout fails closed; no mock source substituted',()=>{
 assert.throws(()=>inspectArcade('/not/a/pinned/cannon'),/ENOENT/);
 assert.throws(()=>runArcade(['inspect','--cannon','/not/a/pinned/cannon']));
});

const pinned=process.env.ARCADE_CANNON;
test('exact pinned native CANNON source inspected without launch or field promotion',
 {skip:pinned?false:'provide ARCADE_CANNON to execute actual locked checkout in hosted CI'},
 ()=>{
  const result=runArcade(['inspect','--cannon',pinned]);
  assert.equal(result.commit,'f99d4b0f74b117e0af034137d550e88aa3d01f26');
  assert.equal(result.expectedNativeDonorOwners,22);
  assert.equal(result.expectedPublicDocumentSources,64);
  assert.equal(result.expectedTotalParticipating,69);
  assert.equal(result.measuredNativeDonorOwners,null);
  assert.equal(result.externalDispatch,false);
  assert.equal(result.fieldVerified,false);
  assert.equal(result.status,'EXACT_SOURCE_VERIFIED_NOT_YET_EXECUTED');
 });
