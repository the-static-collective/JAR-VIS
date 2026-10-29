import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,verifyCannon,run} from '../tools/composition-attendant.mjs';
test('read-only inspection and list only, never grants CANNON execution',()=>{
 assert.equal(parse(['list','--cannon','/tmp/x']).operation,'list');
 assert.throws(()=>parse(['build','--cannon','/tmp/x']),/INSPECT_OR_LIST_ONLY/);
 assert.throws(()=>parse(['list','--cannon','/tmp/x','--authorize','SYNTHETIC_TEST_ONLY']),/INSPECT_OR_LIST_ONLY/);
 assert.throws(()=>parse(['verify','--cannon','/tmp/x']),/INSPECT_OR_LIST_ONLY/);
});
test('wrong source is refused',()=>assert.throws(()=>verifyCannon('/tmp'),/HOLD_COMPOSITION_ATTENDANT_/));
test('real pinned CANNON owner source only returns held composition invitations',()=>{
 if(!process.env.INSPAND_COMPOSER_CANNON)return;
 const d=process.env.INSPAND_COMPOSER_CANNON;
 const inspected=run(['inspect','--cannon',d]);
 assert.equal(inspected.authority,'NONE');
 assert.equal(inspected.source.authority,'READ_ONLY');
 assert.equal(inspected.source.sourceBlobs.length,2);
 const offered=run(['list','--cannon',d]);
 assert.equal(offered.schema,'jarvis.composition-invitation/v1');
 assert.equal(offered.authority,'NONE');
 assert.equal(offered.automaticExecution,false);
 assert.equal(offered.candidate.stages.length,2);
 assert.equal(offered.candidate.edges[0].adapter,'VERIFIED_RECEIPT_PLAN_ID_V1');
});
