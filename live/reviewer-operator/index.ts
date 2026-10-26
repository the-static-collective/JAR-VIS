// WORK-THAT-INHERITS-003 · CROSSPANEL OPERATOR / explicitly scoped, private.
import { createClient } from "npm:@supabase/supabase-js@2.78.0";
import { SITE } from "./site.ts";
import { planTriage, TRIAGE_DECISIONS } from "./policy.mjs";
const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if(!PROJECT_URL || !SERVICE_KEY) throw new Error("OPERATOR_CONFIGURATION_REQUIRED");
const db = createClient(PROJECT_URL, SERVICE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const ORIGIN = new URL(PROJECT_URL).origin;
const HEAD = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","cross-origin-resource-policy":"same-origin","permissions-policy":"camera=(), microphone=(), geolocation=(), payment=()"};
const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'none'; img-src 'self' data:";
const TOKEN = /^Bearer ([A-Za-z0-9_-]{43})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PII = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[-. ]?\d{4}|https?:\/\/|www\.|\b(?:ssn|social security|password|private key|auth token|api key)\b/i;

class Err extends Error{ constructor(msg,status=400){super(msg);this.status=status;} }
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEAD});
async function hash(x){const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(x)));return [...b].map(n=>n.toString(16).padStart(2,"0")).join("");}
function note(v){if(typeof v!=="string")throw new Err("NOTE_REQUIRED");const s=v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();if(s.length<8||s.length>120||PII.test(s))throw new Err("WRITE_NON_SENSITIVE_8_TO_120_CHARACTER_NOTE");return s;}
async function readJSON(req){
 if(Number(req.headers.get("content-length")||0)>1600)throw new Err("BODY_TOO_LARGE",413);
 const reader=req.body?.getReader();if(!reader)throw new Err("BODY_REQUIRED");let size=0;const parts=[];
 try{for(;;){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>1600)throw new Err("BODY_TOO_LARGE",413);parts.push(x.value);}}
 finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 const buf=new Uint8Array(size);let pos=0;for(const p of parts){buf.set(p,pos);pos+=p.byteLength;}
 try{const b=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buf));if(!b||typeof b!=="object"||Array.isArray(b))throw Error();return b;}
 catch{throw new Err("INVALID_JSON");}
}
async function auth(req){
 const m=TOKEN.exec(req.headers.get("authorization")||"");
 if(!m)throw new Err("OPERATOR_KEY_REQUIRED",401);
 const h=await hash(m[1]), now=new Date().toISOString();
 const {data:key,error:ke}=await db.from("reality2_operator_keys").select("id,label,expires_at").eq("token_hash",h)
   .is("revoked_at",null).gt("expires_at",now).maybeSingle();
 if(ke)throw new Err("AUTH_LOOKUP_UNAVAILABLE",503);
 if(!key)throw new Err("KEY_INVALID_OR_EXPIRED",403);
 // Intentional permission boundary: legacy moderation authority is NEVER sufficient alone.
 const {data:grant,error:ge}=await db.from("inheritance_operator_grants")
 .select("operator_key_id,permission,expires_at").eq("operator_key_id",key.id)
 .eq("permission","REVIEW_TRIAGE").is("revoked_at",null).gt("expires_at",now).maybeSingle();
 if(ge)throw new Err("GRANT_LOOKUP_UNAVAILABLE",503);
 if(!grant)throw new Err("NO_INHERITANCE_TRIAGE_GRANT",403);
 return {id:key.id,display:"Scoped operator / "+key.label,expiresAt:grant.expires_at};
}
async function listing(){
 const [q,s,a]=await Promise.all([
  db.from("inheritance_interest").select("id,seat_id,role,alias,email,contact_consent,capability,region,availability,independence,explanation,status,independently_verified,created_at,triage_note,triage_actor,triaged_at,conflict_disposition,invitation_recorded_at,acceptance_recorded_at")
   .neq("status","WITHDRAWN").order("created_at",{ascending:true}).limit(100),
  db.from("inheritance_open_seats").select("id,title,purpose,lane,role,reviewer_expertise,region,status,publication_approved").order("created_at",{ascending:true}).limit(50),
  db.from("inheritance_audit").select("created_at,interest_id,action,actor").order("created_at",{ascending:false}).limit(25)
 ]);
 if(q.error||s.error||a.error)throw new Err("PRIVATE_QUEUE_UNAVAILABLE",503);
 const entries=(q.data||[]).map(x=>({...x,email:x.contact_consent?x.email:null,
  independently_verified:false,volunteerAssignmentAuthorized:false}));
 return {schema:"jarvis/reviewer-operator-003",mode:"PRIVATE_SCOPED_TRIAGE_ONLY",
   admission:"NONE",evidenceVerification:"NOT_ESTABLISHED",
   applications:entries,seats:s.data||[],events:a.data||[],
   counters:{pending:entries.filter(x=>x.status==="PENDING").length,
    screening:entries.filter(x=>x.status==="SCREENING").length,
    invited:entries.filter(x=>x.status==="INVITED").length,
    acceptedUnverified:entries.filter(x=>x.status==="ACCEPTED").length,
    unverified:entries.length,verified:0},
   truncated:entries.length===100};
}
async function triage(op,b){
 if(typeof b.id!=="string"||!UUID.test(b.id)||typeof b.decision!=="string"||!TRIAGE_DECISIONS.includes(b.decision))throw new Err("INVALID_TRIAGE");
 const explanation=note(b.note),now=new Date().toISOString();
 const {data:current,error:ce}=await db.from("inheritance_interest")
 .select("id,role,status,independence,conflict_disposition,contact_consent").eq("id",b.id).maybeSingle();
 if(ce)throw new Err("PRIVATE_READ_UNAVAILABLE",503);
 if(!current||current.status==="WITHDRAWN")throw new Err("MISSING_OR_WITHDRAWN",404);
 const plan=planTriage(current,b.decision,b);
 if(!plan.allowed)throw new Err(plan.why,["INVALID_STAGE_FOR_TRANSITION","CONFLICT_REVIEW_REQUIRED","MISSING_OR_WITHDRAWN"].includes(plan.why)?409:400);
 // One SQL transaction: compare-and-swap the stage, then append its audit.
 // A failed audit rolls back the update. The RPC is granted only to service_role.
 const {data,error:we}=await db.rpc("inheritance_commit_triage",{
  p_id:b.id,p_expected:current.status,p_status:plan.patch.status,
  p_conflict:plan.patch.conflict_disposition||null,p_actor:"scoped:"+op.id,
  p_note:explanation,p_audit_action:plan.audit,
  p_invited:b.decision==="invite",p_accepted:b.decision==="accept"
 });
 if(we)throw new Err(we.message?.includes("STALE_OR_WITHDRAWN")?"STALE_OR_WITHDRAWN":"TRIAGE_STORAGE_UNAVAILABLE",
    we.message?.includes("STALE_OR_WITHDRAWN")?409:503);
 const changed=Array.isArray(data)?data[0]:null;
 if(!changed)throw new Err("STALE_OR_WITHDRAWN",409);
 return {ok:true,id:changed.id,status:changed.status,conflict:changed.conflict_disposition,
   independentlyVerified:false,publiclyPublished:false,
   reminder:"Recorded operator assertion only; no automatic outreach, reviewer admission or completed work."};
}
Deno.serve(async req=>{
 const u=new URL(req.url);
 if(req.method==="GET" && u.searchParams.get("format")!=="data")
  return new Response(SITE,{headers:{...HEAD,"content-type":"text/html; charset=utf-8","content-security-policy":CSP}});
 if(req.method!=="POST")return reply({error:"POST_ONLY"},405);
 if(req.headers.get("origin")!==ORIGIN)return reply({error:"SAME_ORIGIN_REQUIRED"},403);
 if(!(req.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"JSON_REQUIRED"},415);
 try{
  const op=await auth(req);
  const b=await readJSON(req);
  if(b.action==="me")return reply({ok:true,display:op.display,scope:"REVIEW_TRIAGE",expiresAt:op.expiresAt,
    limits:"No identity verification, publication, emails, assignment or external approval."});
  if(b.action==="list")return reply(await listing());
  if(b.action==="triage")return reply(await triage(op,b));
  throw new Err("INVALID_ACTION");
 }catch(e){return reply({error:e instanceof Err?e.message:"OPERATOR_SERVICE_UNAVAILABLE"},e instanceof Err?e.status:503);}
});
