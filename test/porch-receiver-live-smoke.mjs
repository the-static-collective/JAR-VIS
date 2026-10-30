// Safe, one-shot synthetic submission to the public (origin-checked) receiver.
// Never logs the private receipt key; always attempts to withdraw in finally.
import assert from "node:assert/strict";
const URL="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/porch-receiver-009";
const origin="https://hello.abundent.org";
const send=async(body,headers={})=>{
 const response=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json","Origin":origin,...headers},body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(15000)});
 const out=await response.json();
 return {status:response.status,out};
};
let id=null,key=null;
try{
 const blocked=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"status"}),signal:AbortSignal.timeout(15000)});
 assert.equal(blocked.status,403,"no-origin clients fail closed");
 const created=await send({action:"submit",kind:"question",particular:"Synthetic test note: how can we verify this private porch review flow?",area:"online",when:"Just exploring",next:"A synthetic status check.",consent:true,website:""});
 assert.equal(created.status,201,"public explicit consent creates receipt");
 assert.equal(created.out.state,"PENDING");
 id=created.out.receiptId;key=created.out.receiptKey;
 assert.match(key,/^[A-Za-z0-9_-]{43}$/);
 console.log("Synthetic private note received; receipt secret suppressed.");
 const status=await send({action:"status",receiptId:id,receiptKey:key});
 assert.equal(status.status,200);assert.equal(status.out.state,"PENDING");
 const wrong=await send({action:"status",receiptId:id,receiptKey:"A".repeat(43)});
 assert.equal(wrong.status,404,"wrong key cannot see a pending note");
 console.log("Private key guard and status projection pass.");
}finally{
 if(id&&key){
   const withdrawn=await send({action:"withdraw",receiptId:id,receiptKey:key});
   assert.equal(withdrawn.status,200,"synthetic note removed");
   const gone=await send({action:"status",receiptId:id,receiptKey:key});
   assert.equal(gone.status,404,"withdrawn note cannot be read");
   console.log("Synthetic note withdrawn; no content or secret logged.");
 }
}

const operatorBase="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-operator-008";
const health=await fetch(operatorBase+"/health",{signal:AbortSignal.timeout(15000)});
const operatorHome=await fetch(operatorBase,{signal:AbortSignal.timeout(15000)});
console.log("Operator route health/home HTTP statuses:",health.status,operatorHome.status);
assert.equal(operatorHome.status,200,"existing operator root is reachable");
const protectedCall=await fetch(operatorBase,{method:"POST",headers:{"Origin":"https://kbhqacsdvjsstzyplqij.supabase.co","Content-Type":"application/json"},body:JSON.stringify({action:"porch-list"}),signal:AbortSignal.timeout(15000)});
assert.equal(protectedCall.status,401,"anonymous visitor cannot access JAR;VIS operator review queue");
console.log("Operator login gate blocks anonymous review; original operator still responds.");
