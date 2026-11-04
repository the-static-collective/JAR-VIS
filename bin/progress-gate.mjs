#!/usr/bin/env node
// Read one optional local task receipt via stdin. No file, network or journal writes.
import { inspectProgressGate } from "../src/progress-gate.mjs";
let bytes=0,parts=[];
try{
 for await (const part of process.stdin){
  bytes+=part.length;
  if(bytes>16384)throw new Error("Too much input (16 KiB limit).");
  parts.push(part);
 }
 const source=Buffer.concat(parts).toString("utf8");
 const result=inspectProgressGate(JSON.parse(source));
 process.stdout.write(JSON.stringify({schema:"jarvis/progress-gate-result/v0",...result})+"\n");
 process.exitCode=result.decision==="LOCAL_WORK_PREPARED"||result.decision==="LOCAL_PARTIAL_WITH_ARTIFACT"?0:2;
}catch{
 process.stdout.write(JSON.stringify({schema:"jarvis/progress-gate-result/v0",decision:"HOLD",reason:"INVALID_INPUT",meaning:"No useful completion established."})+"\n");
 process.exitCode=2;
}
