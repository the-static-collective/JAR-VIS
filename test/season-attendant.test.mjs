import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSeasonArgs,inspectSeason,runSeason} from '../tools/season.mjs';

test('season source lock extends native machine without pointing at main',()=>{
 const lock=JSON.parse(readFileSync(new URL('../spec/season-source-v1.json',import.meta.url)));
 assert.equal(lock.commit,'63925118a42ef307fa274443fa9f81957c5a6682');
 assert.equal(lock.ancestry[0],'f99d4b0f74b117e0af034137d550e88aa3d01f26');
 assert.equal(lock.sourceSchema,'cannon.season-witness/v1');
});
test('no inspection, verify, or demo can absorb arbitrary commands or grants',()=>{
 assert.equal(parseSeasonArgs(['inspect','--cannon','/example']).command,'inspect');
 assert.equal(parseSeasonArgs(['verify','--cannon','/example','--ledger','/local.json']).command,'verify');
 for (const args of [
  ['submit','--cannon','/example'],
  ['send','--cannon','/example'],
  ['inspect','--cannon','/example','--out','/tmp'],
  ['inspect','--cannon','/example','--authorize','LOCAL_FICTIONAL_ONLY'],
  ['verify','--cannon','/example','--ledger','/tmp','--authorize','LOCAL_FICTIONAL_ONLY'],
  ['verify','--cannon','/example'],
  ['verify','--cannon','/example','--out','/tmp'],
  ['demo','--cannon','/example','--out','/tmp'],
  ['demo','--cannon','/example','--out','/tmp','--authorize','YES'],
  ['demo','--cannon','/example','--out','/tmp','--authorize','LOCAL_FICTIONAL_ONLY','--ledger','/secrets'],
  ['demo','--cannon','/example','--out','/tmp','--authorize','LOCAL_FICTIONAL_ONLY','--cannon','/other'],
 ]) assert.throws(()=>parseSeasonArgs(args));
 assert.equal(parseSeasonArgs(['demo','--cannon','/example','--out','/tmp',
  '--authorize','LOCAL_FICTIONAL_ONLY']).command,'demo');
});
test('missing or non-CANNON source can never be silently replaced by fake native implementation',()=>{
 assert.throws(()=>inspectSeason('/not/an/exact/cannon'));
 assert.throws(()=>runSeason(['inspect','--cannon','/not/an/exact/cannon']));
});
const pinned=process.env.SEASON_CANNON;
test('authentic exact pinned source can be inspected, not promoted to human proof',
 {skip:pinned?false:'SEASON_CANNON exact checkout required'},()=>{
  const i=runSeason(['inspect','--cannon',pinned]);
  assert.equal(i.commit,'63925118a42ef307fa274443fa9f81957c5a6682');
  assert.equal(i.stageMeaning,'SELF_REPORTED_ONLY');
  assert.equal(i.verifiedHumanOutcomes,0);
  assert.equal(i.authorizedRealWorldActions,false);
  assert.equal(i.authorizedMoneyMovements,false);
  assert.equal(i.externalDispatch,false);
 });
