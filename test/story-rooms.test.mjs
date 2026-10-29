import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_SOURCES,composeStoryRooms,verifyStoryRooms} from '../src/story-rooms.mjs';
test('story sources are distinct canon/candidates and independently attributable',()=>{
 assert.equal(STORY_SOURCES.length,8);
 assert.equal(STORY_SOURCES.filter(s=>s.state==='FIXED_FICTIONAL_CANON').length,1);
 for(const s of STORY_SOURCES){assert.ok(s.url.startsWith('https://'));assert.ok(s.boundary.length>40);}
 assert.match(STORY_SOURCES.find(s=>s.id==='pet-sitter').boundary,/substitute/);
 assert.match(STORY_SOURCES.find(s=>s.id==='renji-game').boundary,/not amnesiac/);
 assert.match(STORY_SOURCES.find(s=>s.id==='octopus-mutation').boundary,/not admitted/);
});
test('actual bounded film/game/book/octopus ideation: four lenses, no canon or human inflation',()=>{
 const p=composeStoryRooms({ids:['collective-movie','pet-sitter','deuce-stream','renji-game','octopus-rooms']});
 assert.equal(p.payload.branches.length,10);
 assert.equal(p.payload.planCandidates.length,10);
 for(const b of p.payload.branches){assert.equal(b.cuts.length,4);assert.equal(b.status,'CROSS_MEDIA_PROPOSAL_NOT_STORY_CANON');}
 assert.equal(p.payload.mediaEnginesExecuted,0);assert.equal(p.payload.humanOutcomes,0);
 assert.equal(p.payload.newStoryCanonDeclared,false);
 assert.equal(verifyStoryRooms(p).mayExecute,false);
 assert.deepEqual(p,composeStoryRooms({ids:['collective-movie','pet-sitter','deuce-stream','renji-game','octopus-rooms']}));
});
test('altered canon, fake completed productions and source tampering are rejected',()=>{
 const p=composeStoryRooms();
 for(const bad of [
  {...p,digest:'sha256:'+'0'.repeat(64)},
  {...p,payload:{...p.payload,newStoryCanonDeclared:true}},
  {...p,payload:{...p.payload,sourceReferences:[{...p.payload.sourceReferences[0],state:'FORGED_REAL_CIVILIZATION'},...p.payload.sourceReferences.slice(1)]}},
  {...p,payload:{...p.payload,planCandidates:[]}},
  {...p,published:true}
 ])assert.throws(()=>verifyStoryRooms(bad),/STORY_ROOMS_HOLD/);
 for(const ids of [[],['pet-sitter'],['pet-sitter','pet-sitter'],['bogus','renji-game']])
  assert.throws(()=>composeStoryRooms({ids}),/STORY_ROOMS_HOLD/);
});
