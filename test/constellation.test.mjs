import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeLocalBuild,parseArguments,inspectCannon} from '../tools/constellation.mjs';

test('the attendant cannot authorize external work or bypass denied/revoked consent',()=>{
 assert.equal(authorizeLocalBuild('LOCAL_FICTIONAL_ONLY'),true);
 for(const value of [undefined,'','YES','OUTREACH','REVOKED'])assert.throws(()=>authorizeLocalBuild(value),/HOLD/);
});
test('runner uses fixed argv contract and rejects duplicate flags, unknown actions and injected execution fields',()=>{
 const p=parseArguments(['build','--cannon','/tmp/cannon','--roots','/tmp/roots.json','--out','/tmp/packet','--authorize','LOCAL_FICTIONAL_ONLY']);
 assert.equal(p.command,'build');assert.equal(p.options['--authorize'],'LOCAL_FICTIONAL_ONLY');
 for(const args of [['deploy'],['build','--shell','anything'],['build','--cannon','a','--cannon','b'],['build','--authorize','LOCAL_FICTIONAL_ONLY']])assert.throws(()=>parseArguments(args));
});
test('unavailable CANNON is HOLD, never substituted with moving main or mock results',()=>{
 assert.throws(()=>inspectCannon('/not/an/acquired/constellation'));
});
