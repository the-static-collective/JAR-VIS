// WORK-THAT-INHERITS-002 · Public reviewer/steward discovery, account-free, opt-in.
// Public safe seats only; private pending applications; review never auto-verified.
import { createClient } from "npm:@supabase/supabase-js@2.78.0";
import { SITE } from "./site.ts";
const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!PROJECT_URL || !KEY) throw new Error("SERVER_CONFIGURATION_MISSING");
const db = createClient(PROJECT_URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const ORIGIN = new URL(PROJECT_URL).origin;
const HEAD = { "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "permissions-policy":"camera=(),microphone=(),geolocation=()" };
const CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; img-src 'self' data:";
const PERSONAL = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|https?:\/\/|www\./i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const LIST = {
  role: new Set(["reviewer","steward","connector"]),
  capability: new Set(["process","safety","logistics","evidence","privacy","community"]),
  availability: new Set(["one_time","weekly","flexible"]),
  independence: new Set(["no_known_conflict","possible_conflict","unsure"])
};
class Fail extends Error { constructor(message,status=400){super(message);this.status=status;} }
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...HEAD,"content-type":"application/json; charset=utf-8"}});}
function field(x,min,max,contact=false){
  if(typeof x!=="string")throw new Fail("INVALID_FIELD");
  const v=x.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
  if(v.length<min||v.length>max||(!contact&&PERSONAL.test(v)))throw new Fail("INVALID_OR_PRIVATE_FIELD");
  return v;
}
async function digest(s) {
 const b=new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
 return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
}
function token(){const b=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...b)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");}
async function bounded(req) {
 if(Number(req.headers.get("content-length")||0)>2100)throw new Fail("REQUEST_TOO_LARGE",413);
 const reader=req.body?.getReader(); if(!reader)throw new Fail("BODY_REQUIRED");
 let size=0;const parts=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2100)throw new Fail("REQUEST_TOO_LARGE",413);parts.push(value);}}
 finally {try{await reader.cancel();}catch{}reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
 try{const body=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));if(!body||typeof body!=="object"||Array.isArray(body))throw Error("shape");return body;}
 catch {throw new Fail("INVALID_JSON");}
}
async function quota(req){
 const day=new Date().toISOString().slice(0,10);
 // Gateway IP fields can be absent/spoofable: this is best effort, with global quotas.
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,64);
 const visitor=await digest("WTI002|"+day+"|"+ip+"|"+KEY);
 for(const [name,period,limit] of [
  ["inherit-global-day",day,90],
  ["inherit-visitor:"+visitor,day,4]
 ]) {
  const {data,error}=await db.rpc("garden_consume_quota",{p_key:name,p_period:period,p_max:limit});
  if(error)throw new Fail("INTAKE_QUOTA_UNAVAILABLE",503);
  if(!data)throw new Fail("INTAKE_LIMIT_REACHED",429);
 }
 return visitor;
}
async function seats(){
 const {data,error}=await db.from("inheritance_open_seats")
 .select("id,title,purpose,lane,role,reviewer_expertise,region,created_at")
 .eq("status","OPEN").eq("publication_approved",true).order("created_at",{ascending:true}).limit(30);
 if(error)throw new Fail("SEATS_UNAVAILABLE",503);
 return json({schema:"jarvis/public-reviewer-seats/v1",publication:"OWNER_APPROVED_REQUESTS_ONLY",
  admissions:"NONE",reviewerVerification:"NOT_ESTABLISHED",
  updatedAt:new Date().toISOString(),seats:data||[]});
}
async function join(b,req){
 if(b.action!=="join"||b.reviewConsent!==true||b.website)throw new Fail("CONSENT_OR_HONEYPOT_FAILED");
 if(!UUID.test(b.seatId||""))throw new Fail("INVALID_SEAT");
 const role=field(b.role,3,20),capability=field(b.capability,3,20);
 const availability=field(b.availability,3,20),independence=field(b.independence,3,30);
 for(const [key,val] of Object.entries({role,capability,availability,independence}))if(!LIST[key].has(val))throw new Fail("INVALID_CHOICE");
 const alias=field(b.alias,2,70),region=field(b.region,3,80);
 const explanation=field(b.explanation||"",0,280);
 let email=null;
 if(b.email){
  email=field(b.email,5,200,true).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Fail("INVALID_EMAIL");
  if(b.contactConsent!==true)throw new Fail("CONTACT_CONSENT_REQUIRED");
 }
 const {data:seat,error:se}=await db.from("inheritance_open_seats").select("id,role")
  .eq("id",b.seatId).eq("status","OPEN").eq("publication_approved",true).maybeSingle();
 if(se||!seat)throw new Fail("SEAT_NOT_OPEN",404);
 if(role!==seat.role)throw new Fail("ROLE_DOES_NOT_MATCH_SEAT");
 const visitor=await quota(req),withdrawKey=token();
 const {data,error}=await db.from("inheritance_interest").insert({
  seat_id:seat.id,role,alias,email,capability,region,availability,independence,explanation,
  contact_consent:Boolean(email),review_consent:true,public_listing_consent:false,
  status:"PENDING",independently_verified:false,
  withdrawal_hash:await digest(withdrawKey),rate_fingerprint:visitor
 }).select("id,created_at,status").single();
 if(error)throw new Fail("INTAKE_STORAGE_UNAVAILABLE",503);
 await db.from("inheritance_audit").insert({interest_id:data.id,action:"INTAKE_RECEIVED"});
 return json({ok:true,receipt:{id:data.id,status:"PENDING",createdAt:data.created_at},
  withdrawKey,notice:"Private pending invitation to review. No acceptance, qualification, or contact is implied. Keep this withdrawal code."},201);
}
async function withdraw(b){
 if(b.action!=="withdraw"||!UUID.test(b.id||"")||!TOKEN.test(b.withdrawKey||""))throw new Fail("INVALID_WITHDRAWAL");
 const hash=await digest(b.withdrawKey);
 const {data,error}=await db.from("inheritance_interest").update({
  alias:"Withdrawn",email:null,explanation:"",contact_consent:false,status:"WITHDRAWN"
 }).eq("id",b.id).eq("withdrawal_hash",hash).neq("status","WITHDRAWN").select("id").maybeSingle();
 if(error)throw new Fail("WITHDRAWAL_UNAVAILABLE",503);
 if(!data)throw new Fail("RECEIPT_NOT_FOUND_OR_WITHDRAWN",404);
 await db.from("inheritance_audit").insert({interest_id:data.id,action:"WITHDRAWN"});
 return json({ok:true,withdrawn:true,note:"Contact and volunteered text cleared from this record; minimal audit history remains."});
}
Deno.serve(async req=>{
 const url=new URL(req.url);
 try {
  if(req.method==="GET"){
   if(url.searchParams.get("format")==="seats")return await seats();
   return new Response(SITE,{headers:{...HEAD,"content-type":"text/html; charset=utf-8","content-security-policy":CSP}});
  }
  if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
  if(req.headers.get("origin")!==ORIGIN)return json({error:"SAME_ORIGIN_REQUIRED"},403);
  if(!(req.headers.get("content-type")||"").startsWith("application/json"))return json({error:"JSON_REQUIRED"},415);
  const b=await bounded(req);
  if(b.action==="join")return await join(b,req);
  if(b.action==="withdraw")return await withdraw(b);
  return json({error:"UNSUPPORTED_ACTION"},400);
 }catch(e){const known=e instanceof Fail;return json({error:known?e.message:"SERVICE_TEMPORARILY_UNAVAILABLE"},known?e.status:503);}
});
