import test from "node:test";import assert from "node:assert/strict";import {triage} from "../src/porch-triage.mjs";
test("one mundane food need is an uncommitted suggestion",()=>{const x=triage({kind:"need",particular:"I need someone to explain the local garden."});assert.equal(x.topic,"food");assert.equal(x.matchClaim,false);assert.equal(x.sent,false);assert.equal(x.disposition,"HOLD_FOR_HUMAN_REVIEW")});
test("an offer is not automatically paired",()=>{const x=triage({kind:"offer",particular:"I can give a person a ride to a meeting."});assert.equal(x.classification,"offer");assert.equal(x.topic,"transport");assert.equal(x.verified,false)});
test("unrelated question remains held",()=>{const x=triage({kind:"question",particular:"What can I do on Tuesdays?"});assert.equal(x.topic,"other");assert.match(x.authority,/NO_MATCH/)});
test("deliberately reject unknown cards",()=>{assert.throws(()=>triage({kind:"resident",particular:"x"}));assert.throws(()=>triage({kind:"need"}))});
