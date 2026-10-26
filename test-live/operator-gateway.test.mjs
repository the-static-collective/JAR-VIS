import test from "node:test";
import assert from "node:assert/strict";
const endpoint="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-operator";
const sameOrigin=new URL(endpoint).origin;
const call=async (headers,body={action:"list"})=>{
 const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",...headers},
   body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 return {status:res.status,body:await res.json()};
};
test("live reviewer operator: public page is NOT a private data endpoint", {timeout:15000}, async()=>{
 if(process.env.RUN_LIVE_OPERATOR_QA!=="1")return;
 const res=await fetch(endpoint,{signal:AbortSignal.timeout(12000)});
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/JAR;VIS · Stewardship Operator/);
 assert.match(html,/PRIVATE · EXPLICIT GRANT REQUIRED/);
 assert.doesNotMatch(html,/<input[^>]+value=["'][A-Za-z0-9_-]{43}["']/);
 assert.doesNotMatch(html,/Synthetic QA Only/);
});
test("live reviewer operator: no credential, old scope alone or wrong origin never opens queue", {timeout:30000}, async()=>{
 if(process.env.RUN_LIVE_OPERATOR_QA!=="1")return;
 const absent=await call({origin:sameOrigin});
 assert.equal(absent.status,401);
 assert.equal(absent.body.error,"OPERATOR_KEY_REQUIRED");
 const bogus=await call({origin:sameOrigin,authorization:"Bearer "+"z".repeat(43)});
 assert.equal(bogus.status,403);
 assert.equal(bogus.body.error,"KEY_INVALID_OR_EXPIRED");
 const cross=await call({origin:"https://attacker.example"});
 assert.equal(cross.status,403);
 assert.equal(cross.body.error,"SAME_ORIGIN_REQUIRED");
 const noOrigin=await call({});
 assert.equal(noOrigin.status,403);
 assert.equal(noOrigin.body.error,"SAME_ORIGIN_REQUIRED");
 const getPrivate=await fetch(endpoint+"?format=data",{signal:AbortSignal.timeout(12000)});
 assert.equal(getPrivate.status,405);
});
