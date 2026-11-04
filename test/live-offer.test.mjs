import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {propose,validateCartridge,learn} from '../src/live-offer-router.mjs';
const cartridge=JSON.parse(readFileSync(fileURLToPath(new URL('../cartridges/live-offer-001.json',import.meta.url)),'utf8'));
test('JAR;VIS consumes source-owned declarative now-first cartridge without authority claims',()=>{assert.equal(validateCartridge(cartridge),true);const p=propose('I can play guitar for 20 minutes right now',cartridge);assert.equal(p.intent.when,'now');assert.equal(p.actions[0].id,'record-audio');assert.equal(p.actions[0].effect,'audio-file');assert.equal(cartridge.remote_execution,false);});
test('later is respected; no recording scheduled without time agreement',()=>{const p=propose('I will play guitar next week',cartridge);assert.equal(p.intent.when,'later');assert.ok(p.actions.every(x=>x.id!=='record-audio'&&x.id!=='record-video'));});
test('no untrusted action edges or priority overflow',()=>{const bad=structuredClone(cartridge);bad.actions[0].next.push('execute-server');assert.throws(()=>propose('play guitar',bad),/UNKNOWN_ACTION_EDGE/);assert.equal(learn({art:20},'art').art,20);});
