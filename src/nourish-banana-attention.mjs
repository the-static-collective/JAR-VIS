// JAR;VIS — attention is not authority. Accept only the exact synthetic source-native VOQAL-017 receipt.
import {createHash} from "node:crypto";
export const PINS=Object.freeze({
 webZ:"38dbeb6b0acca96854bb8fcc84abbce326b9716a",
 nourish:"669d9750d62c670cfd3894fcffe367af83e85374",
 bananaSpork:"f4c4067b5896eb5eb20a7498f89da38f04731d73",
});
const requiredBad=["privatePantry","claimedFulfillment","disclosureFalse","unknownExtraField","quantityWithoutUnit","zeroQuantity","emptyRequirements","wrongSchema"];
const actualFields=["households","childrenFed","ingredientsDelivered","mealsMade","partners","realMembershipVerified"];
const effectFields=["network","resourceDispatch","contact","liveWrite","grantSubmit"];
function exactKeys(value,keys){
 return value&&typeof value==="object"&&!Array.isArray(value)&&
 Object.keys(value).sort().join("|")===keys.slice().sort().join("|");
}
function guard(condition,label){if(!condition)throw Error("JARVIS_HOLD_"+label);}
export function attendNourishBanana(receipt){
 guard(exactKeys(receipt,["schema","mode","sourcePins","nativeFunctionsExecuted","example","crossing","actual","effects","nextAllowed","warning"]),"ROOT_SHAPE");
 guard(receipt.schema==="voqal-017/nourish-bananaspork-native-crossing-v1"&&receipt.mode==="SYNTHETIC_OFFLINE_TWO_SOURCE_OWNERS","SOURCE_KIND");
 guard(exactKeys(receipt.sourcePins,["nourish","bananaSpork"])&&receipt.sourcePins.nourish===PINS.nourish&&receipt.sourcePins.bananaSpork===PINS.bananaSpork,"SOURCE_PINS");
 guard(Array.isArray(receipt.nativeFunctionsExecuted)&&receipt.nativeFunctionsExecuted.length===8&&receipt.nativeFunctionsExecuted.some(x=>x==="BananaSpork:admitHelpSlipCarrier")&&receipt.nativeFunctionsExecuted.some(x=>x==="Nourish-Kids:evaluateRecipe"),"NATIVE_CODE");
 guard(exactKeys(receipt.actual,actualFields)&&actualFields.every(k=>receipt.actual[k]===0),"REAL_WORLD_EFFECT_CLAIM");
 guard(exactKeys(receipt.effects,effectFields)&&effectFields.every(k=>receipt.effects[k]===false),"SIDE_EFFECT_CLAIM");
 guard(exactKeys(receipt.example,["recipeId","serves","available","missing","unknownUnshared"])&&receipt.example.available?.length===1&&receipt.example.missing?.length===1&&receipt.example.unknownUnshared?.length===1,"SYNTHETIC_RECIPE");
 const c=receipt.crossing;
 guard(exactKeys(c,["sourceStatus","bananaAdmission","payloadHash","holdCaseCreated","duplicateCreatedNewCase","arrivals","sourceRequirementCount","pourPreview","negativeCases","attemptedPublish","linkedAfterAuthorityFailure","confirmedUnits","remainingQuantity"]),"CROSSING_SHAPE");
 guard(c.sourceStatus==="unmet"&&c.bananaAdmission==="admitted"&&c.holdCaseCreated===true&&c.duplicateCreatedNewCase===false&&c.arrivals===2&&c.sourceRequirementCount===1,"LOCAL_HOLD");
 guard(typeof c.payloadHash==="string"&&/^[a-f0-9]{64}$/.test(c.payloadHash),"SOURCE_HASH");
 guard(c.attemptedPublish==="authority_failed"&&c.linkedAfterAuthorityFailure===0&&c.confirmedUnits===0&&Number.isFinite(c.remainingQuantity)&&c.remainingQuantity>0,"NO_AUTHORITY");
 guard(exactKeys(c.pourPreview,["title","summary","requestedItems","unitLabel","targetUnits","visibility"])&&
 c.pourPreview.visibility==="circle"&&c.pourPreview.requestedItems?.length===1&&
 Number.isFinite(c.pourPreview.targetUnits)&&c.pourPreview.targetUnits>0&&
 typeof c.pourPreview.unitLabel==="string"&&c.pourPreview.unitLabel.length<30,"PREVIEW");
 guard(Array.isArray(c.negativeCases)&&c.negativeCases.length===8&&
 requiredBad.every(name=>c.negativeCases.some(item=>exactKeys(item,["case","reason"])&&item.case===name&&typeof item.reason==="string"&&item.reason.length>2)),"RECEIVER_REFUSALS");
 guard(typeof receipt.nextAllowed==="string"&&typeof receipt.warning==="string","WARNING");
 const originalProofSha256=createHash("sha256").update(JSON.stringify(receipt)).digest("hex");
 return {
  schema:"jarvis/nourish-banana-attention-v1",
  title:"Tonight's dinner → Tomorrow's independent table",
  state:"HOLD_FOR_OPERATOR_REVIEW",
  attention:"SIMULATED_SOFTWARE_PROOF_ONLY",
  source:{
   proofOrigin:"the-static-collective/webZ",
   proofCommit:PINS.webZ,
   originalOwners:[
    {repo:"the-static-collective/Nourish-Kids",commit:PINS.nourish,role:"one selected unmet ingredient"},
    {repo:"the-static-collective/BananaSpork",commit:PINS.bananaSpork,role:"receiver admits then holds and refuses unauthorized POUR"}
   ],
   proofSha256:originalProofSha256
  },
  witnessedByCode:{
   independentOwnerFunctionsInvoked:8,
   hostileMutationsRefused:8,
   duplicateArrivalsReducedToHeldCases:1,
   originRequirementsDisclosed:1,
   unauthorizedPublicationRefused:true,
   confirmedUnits:0,
   actualChildrenFed:0
  },
  nextHumanGates:[
   {id:"CARE_DESIGN",status:"UNMET",question:"Would willing caregivers consider an account-free, privacy-safe meal table useful? Pay for substantive co-design; do not recruit a child."},
   {id:"FOOD_SAFETY_ACCESS",status:"UNMET",question:"Will an independent qualified reviewer assess dietary, food-handling, accessibility and safeguarding boundaries before a real pilot?"},
   {id:"HOST_PERMISSION",status:"UNMET",question:"Will an authorized food steward and host grant specific permission, separately from any individual conversation or Coalition core-team role?"},
   {id:"RECIPIENT_CONFIRMATION",status:"UNMET",question:"If a voluntary act occurs, how can the consenting recipient independently confirm what was really received without publishing household identity?"},
   {id:"SECOND_TABLE_FREEDOM",status:"UNMET",question:"Can interested participants run a second table, change its method or refuse founder control?"}
  ],
  suggestedQuestion:"What is the smallest voluntary, safe, caregiver-chosen need that could be independently confirmed by the person it helps?",
  allowed:["READ_INSPECT","HUMAN_REVIEW","REFUSE","DOWNLOAD_HELD_REDACTED_CARD"],
  forbidden:["AUTOMATIC_NEED_OPEN","PUBLIC_CHILD_PROFILE","AI_FOOD_SAFETY_CERTIFICATION","RESOURCE_DISPATCH","PARTNER_ENDORSEMENT","AUTONOMOUS_OUTREACH","GRANT_SUBMISSION","BOOK_OF_ACTS_PROMOTION"],
  externalEffects:false,
  realParticipants:0,
  note:"Original source executed under pinned Git commits. Hash and code success verify software only, never human need, consent, food delivery or successor community."
 };
}
