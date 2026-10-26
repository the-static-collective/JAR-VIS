// WORK-THAT-INHERITS-003 · CROSSPANEL OPERATOR / explicitly scoped, private.
import { createClient } from "npm:@supabase/supabase-js@2.78.0";
import { SITE } from "./site.ts";
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
const WORK = {
 start:["PENDING","SCREENING","REVIEW_STARTED"],
 conflict_clear:["SCREENING","SCREENING","CONFLICT_CLEARED"],
 conflict_hold:["SCREENING","SCREENING","CONFLICT_HOLD"],
 invite:["SCREENING","INVITED","INVITATION_REQUESTED"],
 accept:["INVITED","ACCEPTED","ACCEPTANCE_RECORDED"],
 decline:[null,"DECLINED","DECLINED"],
 close:[null,"CLOSED","CLOSED"]
};
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
 if(typeof b.id!=="string"||!UUID.test(b.id)||typeof b.decision!=="string"||!(b.decision in WORK))throw new Err("INVALID_TRIAGE");
 const [required,to,audit]=WORK[b.decision];
 const explanation=note(b.note),now=new Date().toISOString();
 const {data:current,error:ce}=await db.from("inheritance_interest")
 .select("id,role,status,independence,conflict_disposition,contact_consent").eq("id",b.id).maybeSingle();
 if(ce)throw new Err("PRIVATE_READ_UNAVAILABLE",503);
 if(!current||current.status==="WITHDRAWN")throw new Err("MISSING_OR_WITHDRAWN",404);
 if((required&&current.status!==required)||
   (!required&&!(b.decision==="decline"?["PENDING","SCREENING","INVITED","ACCEPTED"].includes(current.status):
      ["ACCEPTED","DECLINED"].includes(current.status))))
   throw new Err("INVALID_STAGE_FOR_TRANSITION",409);
 if(b.decision==="invite"){
  if(current.conflict_disposition!=="NO_KNOWN_CONFLICT_REVIEWED")throw new Err("CONFLICT_REVIEW_REQUIRED",409);
  if(b.humanContactConfirmed!==true)throw new Err("HUMAN_INVITATION_ATTESTATION_REQUIRED",400);
 }
 if(b.decision==="accept"&&b.humanConsentConfirmed!==true)throw new Err("RECIPIENT_ACCEPTANCE_ATTESTATION_REQUIRED",400);
 if(b.decision==="conflict_clear"&&b.conflictCheckConfirmed!==true)throw new Err("CONFLICT_SCREENING_ATTESTATION_REQUIRED",400);
 const updates: Record<string, unknown> = {status:to,triage_note:explanation,triage_actor:"scoped:"+op.id,triaged_at:now};
 if(b.decision==="conflict_clear")updates.conflict_disposition="NO_KNOWN_CONFLICT_REVIEWED";
 if(b.decision==="conflict_hold")updates.conflict_disposition="CONFLICT_HOLD";
 if(b.decision==="invite")updates.invitation_recorded_at=now;
 if(b.decision==="accept")updates.acceptance_recorded_at=now;
 // No action can ever set 'independently_verified' to true.
 const {data:changed,error:we}=await db.from("inheritance_interest").update(updates).eq("id",b.id)
   .eq("status",current.status).select("id,status,conflict_disposition,independently_verified").maybeSingle();
 if(we)throw new Err("TRIAGE_STORAGE_UNAVAILABLE",503);
 if(!changed)throw new Err("STALE_OR_WITHDRAWN",409);
 // Audit is best-effort: user action is preserved even if audit write fails.
 await db.from("inheritance_audit").insert({interest_id:b.id,action:audit,actor:"scoped:"+op.id,note:""});
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
