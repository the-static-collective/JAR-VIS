#!/usr/bin/env node
// Public exact-pin opt-in research observation, NOT a MOTIF agent invocation.
import {inspectMotifReciprocal} from "../src/motif-reciprocal.mjs";
const result=await inspectMotifReciprocal();
process.stdout.write(JSON.stringify(result,null,2)+"\n");
