// PORCH-OPERATOR-009: authorized JAR;VIS attention, NOT matching or publication.
import {triage} from "./porch-triage.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PII=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[\s.()-]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}|https?:\/\/|\b(?:password|ssn|case number|account number)\b/i;
class Err extends Error {constructor(code,status=400){super(code);this.status=status}}
const positive=id=>typeof id==="string"&&UUID.test(id);
function safeReply(x){if(typeof x!=="string")throw new Err("REPLY_REQUIRED");const v=x.trim().replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ");if(v.length<12||v.length>480||PII.test(v))throw new Err("WRITE_NON_SENSITIVE_12_TO_480_CHARACTERS");return v}
async function row(db,id){if(!positive(id))throw new Err("BAD_RECEIPT");const {data,error}=await db.from("porch09_items").select("id,state,expires_at").eq("id",id).gt("expires_at",new Date().toISOString()).maybeSingle();if(error)throw new Err("STORE_UNAVAILABLE",503);if(!data)throw new Err("NOT_FOUND_OR_EXPIRED",404);return data}
export async function porchOperation(db,b){
 if(b.action==="porch-list"){
  const {data,error}=await db.from("porch09_items").select("id,kind,particular,area,when_text,next_step,state,created_at,expires_at,reply_text")
   .gt("expires_at",new Date().toISOString()).neq("state","CLOSED").order("created_at",{ascending:true}).limit(40);
  if(error)throw new Err("STORE_UNAVAILABLE",503);
  return {ok:true,schema:"jarvis/porch-operator-snapshot-v1",items:(data||[]).map(x=>({...x,attention:triage(x)})),operatorReviewRequired:true,noAutomaticMatch:true};
 }
 if(!["porch-hold","porch-reply","porch-close"].includes(b.action))throw new Err("UNKNOWN_PORCH_ACTION");
 const old=await row(db,b.id);
 const state=b.action==="porch-hold"?"HELD":b.action==="porch-reply"?"REPLY_AVAILABLE":"CLOSED";
 if(old.state==="CLOSED")throw new Err("ALREADY_CLOSED",409);
 if(b.action==="porch-reply"&&old.state!=="HELD"&&old.state!=="PENDING")throw new Err("REPLY_ALREADY_EXISTS_OR_CLOSED",409);
 const note=b.action==="porch-reply"?safeReply(b.reply):"";
 const changed={state,updated_at:new Date().toISOString()};
 if(b.action!=="porch-hold")changed.reply_text=note;
 const {data:after,error}=await db.from("porch09_items").update(changed).eq("id",old.id).eq("state",old.state)
   .select("id,state,updated_at").maybeSingle();
 if(error)throw new Err("STORE_UNAVAILABLE",503);
 if(!after)throw new Err("CONCURRENT_REVIEW_RELOAD",409);
 const event=b.action==="porch-hold"?"HELD":b.action==="porch-reply"?"REPLY_PREPARED":"CLOSED";
 const {error:recordError}=await db.from("porch09_events").insert({item_id:old.id,event_type:event,actor:"OPERATOR"});
 return {ok:true,item:after,reviewEvent:event,receiptRecorded:!recordError,
    sent:false,published:false,verifiedMatch:false,notice:"Operator-held status; no participant or partner has been contacted."};
}
