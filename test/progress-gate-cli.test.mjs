import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
function run(obj) {
 const input=typeof obj==="string"?obj:JSON.stringify(obj);
 return spawnSync(process.execPath,["bin/progress-gate.mjs"],{input,encoding:"utf8",timeout:5000});
}
test("CLI reports structural local work without echoing the original task",()=>{
 const r=run({request:{kind:"invitation",original:"Write a volunteer invitation"},artifact:{kind:"ready-message",body:"Could one volunteer help set chairs on Friday? Please reply with availability; we'll confirm the time."},claim:"local-prepared"});
 assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).decision,"LOCAL_WORK_PREPARED");
 assert.ok(!r.stdout.includes("Write a volunteer invitation"));
});
test("CLI refuses invalid JSON and an oversized packet",()=>{
 const a=run("{malformed");assert.equal(a.status,2);
 assert.equal(JSON.parse(a.stdout).reason,"INVALID_INPUT");
 const b=run("x".repeat(16400));assert.equal(b.status,2);
 assert.equal(JSON.parse(b.stdout).reason,"INVALID_INPUT");
});
test("CLI refuses goal-mismatched output",()=>{
 const r=run({request:{kind:"repair",original:"Fix a washer"},artifact:{kind:"ready-message",body:"Could someone help fix a washing machine? Please reply if you are available."},claim:"local-prepared"});
 assert.equal(r.status,2);assert.equal(JSON.parse(r.stdout).reason,"GOAL_MISMATCH");
});
