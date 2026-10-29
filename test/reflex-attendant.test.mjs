import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,inspectSource,run} from '../tools/reflex-attendant.mjs';
test('JAR;VIS only accepts inspect and discover, never foreign execution',()=>{
 assert.deepEqual(parse(['inspect','--cannon','/tmp/demo']),{mode:'inspect',opts:{'--cannon':'/tmp/demo'}});
 assert.throws(()=>parse(['build','--cannon','/tmp/demo']),/READ_ONLY/);
 assert.throws(()=>parse(['discover','--cannon','/tmp/demo','--authorize','SYNTHETIC_TEST_ONLY']),/BAD_FLAG/);
 assert.throws(()=>parse(['discover','--cannon','/tmp/demo']),/NEED/);
 assert.throws(()=>parse(['inspect','--cannon','/tmp/demo','--need','film']),/INSPECT_NO_NEED/);
});
test('no guess from an unavailable or wrong source checkout',()=>{
 assert.throws(()=>inspectSource('/tmp'),/HOLD_JARVIS_REFLEX_/);
});
test('exact original CANNON owner sources can be independently inspected and discovered',()=>{
 const path=process.env.INSPAND_CANNON;
 if(!path)return;
 const source=inspectSource(path);
 assert.equal(source.capabilitiesInspected,2);
 assert.equal(source.authority,'INSPECT_ONLY');
 assert.equal(source.automaticExecution,false);
 const discovery=run(['discover','--cannon',path,'--need','plan film visual replay']);
 assert.equal(discovery.schema,'jarvis.reflex-invitation/v1');
 assert.equal(discovery.authority,'NONE');
 assert.equal(discovery.automaticallyExecuted,false);
 assert.ok(discovery.candidates.length===2);
 assert.ok(discovery.candidates.every(x=>x.measuredTimeSavedSeconds===null));
 const empty=run(['discover','--cannon',path,'--need','housing meals']);
 assert.equal(empty.candidates.length,0);
});
