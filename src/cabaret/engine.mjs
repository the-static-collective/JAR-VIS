import {createHash} from 'node:crypto';

const MODES=['song','manga','flipbook'];
const SIGNAL=['midnight','garden','starlight','blueprint','porchlight','circuit','cowboy','echo','lantern','drum'];
const NOTE=[0,2,3,5,7,10,12,14,15,17,19,22];
const sha=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
function requireQuestion(question) {
 if(typeof question!=='string'||question.trim().length<2||question.length>500||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(question))throw Error('HOLD_QUESTION_MUST_BE_2_TO_500_CHARACTERS');
 return question.trim().replace(/\s+/g,' ');
}
function validVariant(n){if(!Number.isInteger(n)||n<0||n>99)throw Error('HOLD_VARIANT_OUT_OF_RANGE');return n}
function exactMode(mode){if(!['surprise',...MODES].includes(mode))throw Error('HOLD_UNKNOWN_CABARET_MODE');return mode}
function short(s,limit=132){return s.length>limit?s.slice(0,limit-1).trimEnd()+'…':s}
function token(question) {
 const words=question.toLowerCase().match(/[a-z]{3,18}/g)||[];
 const excluded=new Set(['what','would','could','should','have','from','with','there','this','that','about','they','then','when','where','does','your','some','like','please','make','thing','really','want','know','the','and']);
 return words.find(w=>!excluded.has(w))||'mystery';
}
function num(seed,offset){return Number.parseInt(seed.slice(offset,offset+8),16)>>>0}
export function composeCabaret({question,mode='surprise',variant=0,answer}={}) {
 const clean=requireQuestion(question);
 exactMode(mode);validVariant(variant);
 if(typeof answer!=='string'||answer.length<1||answer.length>6000)throw Error('HOLD_GROUNDED_ATTENDANT_ANSWER_REQUIRED');
 const questionDigest=sha(clean);
 const answerDigest=sha(answer);
 const seed=sha(JSON.stringify(['jarvis.cabaret/v1',questionDigest,answerDigest,variant]));
 const selected=mode==='surprise'?MODES[num(seed,7)%MODES.length]:mode;
 const motif=token(clean);
 const muse=SIGNAL[num(seed,14)%SIGNAL.length];
 const stamp=seed.slice(7,15).toUpperCase();
 const title=selected==='song'?'GHOST RADIO: '+motif.toUpperCase():
  selected==='manga'?'THE COWBOY AND THE '+motif.toUpperCase():
  'THE LAST '+muse.toUpperCase()+' TRANSMISSION';
 let media;
 if(selected==='song'){
  const melody=Array.from({length:24},(_,i)=>({
   beat:i*0.5, note:NOTE[(num(seed,(i%5)*5+7)+i*3)%NOTE.length], 
   length:i%3===0?0.42:0.28
  }));
  media={kind:'browser-synth-song/v1',bpm:92,meter:'6/8',melody,
   lyrics:[
    'I asked the ghost about '+motif,
    'He tipped his hat to the '+muse+' light',
    'The wires went humming in six-eight time',
    'And the answer came back riding tonight',
    'Hold what is true, let the rest pass by',
    'Ask it again; let the little sparks fly.'
   ],
   limit:'Original deterministic melody and lyrics; local browser synthesizer, not Haunted Toaster audio render.'};
 } else if(selected==='manga'){
  const frames=[
   ['01 // ARRIVAL','The ghost cowboy enters the '+muse+' station.','hello, little '+motif+'…'],
   ['02 // THE ASK','A stranger arrives carrying one good question.',short(clean,86)],
   ['03 // THE TOASTER','A haunted appliance lights up. Clown circuitry giggles.','BRRR-DING!'],
   ['04 // THE ANSWER','JAR;VIS gives a grounded answer, not an invented miracle.',short(answer,110)],
   ['05 // THE HOLD','Nobody gets a permission slip from a comic book.','HOLD ≠ FAILURE'],
   ['06 // THE DOOR','The stranger chooses what to try next.','YOUR MOVE, PARTNER']
  ];
  media={kind:'six-panel-manga/v1',panels:frames.map(([caption,description,bubble],i)=>({
    number:i+1,caption,description,bubble,decor:((num(seed,(i%4)*6+7)+i)%4)
  })),limit:'Original browser-drawn comic panels; no external image model or video renderer.'};
 } else {
  media={kind:'css-flipbook/v1',fps:2,frames:[
   ['00','A question rides into the '+muse+' desert.'],
   ['01','COWBOY BOOTING…'],
   ['02','The toaster throws a pixel party.'],
   ['03','FACT CHECK: WATCH THE ATTENDANT'],
   ['04',short(answer,110)],
   ['05','HUMAN PERMISSION? NOT IMPLIED.'],
   ['06','The proof stays separate from the performance.'],
   ['07','THE NEXT DOOR IS YOURS.']
  ].map(([code,line],i)=>({code,line,index:i})),
  limit:'Animated CSS/text flipbook, not a generated MP4 or native Haunted Toaster render.'};
 }
 return {
  schema:'jarvis.stranger-cabaret/v1',mode:selected,requestedMode:mode,variant,
  title,stamp,motif,seed,questionDigest,answerDigest,
  answer:{text:answer,source:'JAR;VIS existing deterministic local attendant',mode:'local-rules-not-general-knowledge'},
  media,creativeAuthority:'LOCAL_FICTIONAL_EXPRESSION_ONLY',
  sourceExecution:{cannonNativeRan:false,hauntedToasterRan:false,externalVideoRan:false,llmRan:false},
  humanOutcomesVerified:false,externalDispatch:false
 };
}
export function makePassport(creative, witness=null) {
 if(creative?.schema!=='jarvis.stranger-cabaret/v1')throw Error('HOLD_CREATIVE_ARTIFACT_REQUIRED');
 if(witness!==null && (witness?.schema!=='jarvis.season-attendant-return/v1' ||
    witness.status!=='OFFLINE_INSPECTION_ONLY' ||
    witness.result?.schema!=='cannon.season-witness-inspection/v1' ||
    witness.result?.authorizedRealWorldActions!==false))throw Error('HOLD_SOURCE_VERIFIED_WITNESS_REQUIRED');
 const payload={
  schema:'jarvis.stranger-evidence-passport/v1',
  scope:'LOCAL_CREATIVE_EXPERIMENT_NOT_HUMAN_SUCCESS',
  questionDigest:creative.questionDigest,
  answerDigest:creative.answerDigest,
  creativeSeed:creative.seed,
  mediaKind:creative.media.kind,
  variant:creative.variant,
  answerAuthority:creative.answer.source,
  nativeOwnersExecutedByThisRequest:0,
  externallyVerifiedHumanOutcomes:0,
  sourceVerification:witness?{
   sourceCommit:witness.source.commit,
   sourceObservation:witness.source.schema,
   caseId:witness.result.caseId,
   receipt:witness.result.receipt,
   recordedStage:witness.result.stage,
   disposition:witness.result.disposition,
   humanEvidenceStatus:witness.result.evidenceMeaning
  }:{disposition:'HOLD_NO_SOURCE_LEDGER_VERIFIED'},
  privacy:'QUESTION_AND_ANSWER_CONTENT_NOT_STORED_IN_PASSPORT',
  authorizedMoneyMovements:false,externalDispatch:false,publishableHumanSuccess:false
 };
 return {...payload,passportDigest:sha(JSON.stringify(payload))};
}
