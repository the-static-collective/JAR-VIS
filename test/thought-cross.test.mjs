import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,cp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MotifCrossLensDesk,validRequest,OWNED} from '../src/motif-cross-lens-desk.mjs';
import {startWorkbenchServer} from '../src/server.mjs';

const seed={question:'How might food and a meal connect?',
 ideas:['Food','Meal','Venue open','Venue closed'],seed_a:0,seed_b:1,
 relationships:[{from:1,to:2,predicate:'requires',status:'AUTHORED'},
   {from:2,to:3,predicate:'contradicts',status:'AUTHORED'}]};
async function sandbox(fn){const dir=await mkdtemp(join(tmpdir(),'jarvis-cross-012-'));
 try{return await fn(dir)}finally{await rm(dir,{recursive:true,force:true})}}

test('source-owned 012 files are byte pinned and original 011 still available',async()=>{
 const status=await new MotifCrossLensDesk().status();
 assert.equal(status.available,true,JSON.stringify(status));
 assert.equal(Object.keys(OWNED).length,2);
});
test('real MOTIF 012 Python receives a manual pencil and rotates',async()=>{
 const result=await new MotifCrossLensDesk().inspect(seed);
 assert.equal(result.status,'HOLD_FOR_OPERATOR_REVIEW');
 assert.equal(result.initial_question.evidence_class,'UNSOURCED_PENCIL_SEED');
 assert.deepEqual(result.visited_lenses,['dependency','tension','affordance']);
 assert.deepEqual(new Set(result.carried_questions.map(q=>q.kind)),
   new Set(['operator_pencil_seed','verify_prerequisite','resolve_tension']));
 assert.equal(result.no_map_question_parity,true);
 assert.equal(result.pen_status,'UNCHANGED');
 assert.equal(result.stored,false);
});
test('same word remains two distinct manifestations',async()=>{
 const result=await new MotifCrossLensDesk().inspect({...seed,ideas:['Home','Home','Venue open','Venue closed']});
 assert.deepEqual(result.question_pair_indices,[0,1]);
 assert.equal(result.ideas[0],result.ideas[1]);
 assert.notEqual(result.initial_question.topic[0],result.initial_question.topic[1]);
});
test('without an authored edge an operator may sketch, but no facts appear',async()=>{
 const r=await new MotifCrossLensDesk().inspect({...seed,relationships:[]});
 assert.equal(r.carried_questions.length,1);
 assert.deepEqual(r.initial_question.witness_relation_ids,[]);
});
test('untrusted browser cannot set origin, export, Python path, or PEN',()=>{
 for(const x of [{...seed,export:'FREE_GRAPH_V0'}, {...seed,caller:'system'},
   {...seed,pen_status:'PEN_SCOPED'},{...seed,source_roots_authenticated:true},
   {...seed,seed_b:0},{...seed,seed_a:'0'},{...seed,seed_a:99}])
   assert.throws(()=>validRequest(x),/HOLD/);
});
test('modified source cannot silently run',()=>sandbox(async dir=>{
 const root=new URL('../runtime/motif-thought-010/',import.meta.url);
 const dest=join(dir,'source');await cp(root,dest,{recursive:true});
 const file=join(dest,'experiments/thought-012/cross_lens_door.py');
 await writeFile(file,await readFile(file,'utf8')+'\n# modification');
 const desk=new MotifCrossLensDesk({root:dest});
 assert.equal((await desk.status()).available,false);
 await assert.rejects(desk.inspect(seed),/pin mismatch/);
}));
test('no map yields exactly the same carried questions',async()=>{
 const desk=new MotifCrossLensDesk();
 const a=await desk.inspect({...seed,show_geometry:false});
 const b=await desk.inspect({...seed,show_geometry:true});
 assert.deepEqual(a.carried_questions,b.carried_questions);
});
test('real localhost HTTP crossing respects CSRF and returns HOLD',()=>sandbox(async dir=>{
 const app=await startWorkbenchServer({journalPath:join(dir,'events.jsonl'),port:0});
 try{
  const status=await(await fetch(app.url+'/api/thought/cross-status')).json();
  assert.equal(status.available,true);
  const csrf=(await(await fetch(app.url+'/api/state')).json()).csrfToken;
  const denied=await fetch(app.url+'/api/thought/cross-check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(seed)});
  assert.equal(denied.status,403);
  const allowed=await fetch(app.url+'/api/thought/cross-check',{method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':csrf},body:JSON.stringify(seed)});
  assert.equal(allowed.status,200);
  const out=await allowed.json();
  assert.equal(out.external_authority,'NONE');assert.equal(out.carried_questions.length,3);
 }finally{await app.close()}
}));
