import {createHash} from 'node:crypto';

const sha=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
const actions=new Set(['ASK_WHY','BREAK_IT','REFUSE','FORK','KEEP','SCRAPE']);
export function inspectPassport(passport){
 if(!passport||typeof passport!=='object'||Array.isArray(passport))
  throw Error('HOLD_PASSPORT_OBJECT_REQUIRED');
 const {passportDigest,...payload}=passport;
 if(payload.schema!=='jarvis.stranger-evidence-passport/v1'||
    passport.publishableHumanSuccess!==false||
    passport.externalDispatch!==false||
    passport.nativeOwnersExecutedByThisRequest!==0||
    passport.externallyVerifiedHumanOutcomes!==0)
  throw Error('HOLD_PASSPORT_SCOPE_INVALID');
 if(passportDigest!==sha(JSON.stringify(payload)))throw Error('HOLD_PASSPORT_DIGEST_MISMATCH');
 return {status:'LOCAL_PACKET_BYTES_MATCH',cryptographicCustody:false,
  externalWitnessVerified:false,authorizedAction:false};
}
export function makeReviewerCard({passport,action,note='',childPassport=null}={}){
 inspectPassport(passport);
 if(!actions.has(action))throw Error('HOLD_UNKNOWN_REVIEW_ACTION');
 if(typeof note!=='string'||note.length>500||/[\x00-\x1f]/.test(note))
  throw Error('HOLD_REVIEW_NOTE_LIMIT');
 if(action==='FORK'){
  inspectPassport(childPassport);
  if(childPassport.creativeSeed===passport.creativeSeed||
     childPassport.questionDigest!==passport.questionDigest||
     childPassport.answerDigest!==passport.answerDigest)
   throw Error('HOLD_FORK_MUST_KEEP_QUESTION_AND_ANSWER');
 }else if(childPassport!==null)throw Error('HOLD_CHILD_ONLY_ON_FORK');
 const payload={
  schema:'jarvis.stranger-review-card/v1',action,
  subjectPassportDigest:passport.passportDigest,
  noteDigest:sha(note),
  noteIncludedInCard:false,
  childPassportDigest:childPassport?.passportDigest??null,
  localPacketIntegrity:inspectPassport(passport).status,
  reviewerIdentity:'NOT_AUTHENTICATED',
  humanEvidence:'NOT_ESTABLISHED',
  sourceOwnerDisposition:'UNCHANGED',
  published:false,submitted:false,dispatched:false
 };
 return {...payload,reviewCardDigest:sha(JSON.stringify(payload))};
}
