import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {attendNourishBanana,PINS} from "../src/nourish-banana-attention.mjs";
const flags=["privatePantry","claimedFulfillment","disclosureFalse","unknownExtraField","quantityWithoutUnit","zeroQuantity","emptyRequirements","wrongSchema"];
const fixture=()=>({
 schema:"voqal-017/nourish-bananaspork-native-crossing-v1",
 mode:"SYNTHETIC_OFFLINE_TWO_SOURCE_OWNERS",
 sourcePins:{nourish:PINS.nourish,bananaSpork:PINS.bananaSpork},
 nativeFunctionsExecuted:[
  "Nourish-Kids:REVIEWED_RECIPES",
  "Nourish-Kids:evaluateRecipe",
  "Nourish-Kids:createFulfillmentEnvelopeV0",
  "BananaSpork:admitHelpSlipCarrier",
  "BananaSpork:HelpSlipHoldStore.holdImportedHelpSlip",
  "BananaSpork:buildCampfirePourPreview",
  "BananaSpork:pourHeldRequirement",
  "BananaSpork:projectHelpSlipResidual"
 ],
 example:{recipeId:"SYNTH-RECIPE-DO-NOT-ECHO",serves:2,available:["rice"],missing:["beans"],unknownUnshared:["PRIVATE-UNKNOWN-CHILD-EXAMPLE"]},
 crossing:{
  sourceStatus:"unmet",bananaAdmission:"admitted",payloadHash:"a".repeat(64),
  holdCaseCreated:true,duplicateCreatedNewCase:false,arrivals:2,sourceRequirementCount:1,
  pourPreview:{title:"SYNTHETIC BEANS",summary:"SYNTHETIC BEANS",requestedItems:["SYNTHETIC BEANS"],unitLabel:"cup",targetUnits:.5,visibility:"circle"},
  negativeCases:flags.map(caseName=>({case:caseName,reason:"REFUSED_UNTRUSTED_PAYLOAD"})),
  attemptedPublish:"authority_failed",linkedAfterAuthorityFailure:0,confirmedUnits:0,remainingQuantity:.5
 },
 actual:{households:0,childrenFed:0,ingredientsDelivered:0,mealsMade:0,partners:0,realMembershipVerified:0},
 effects:{network:false,resourceDispatch:false,contact:false,liveWrite:false,grantSubmit:false},
 nextAllowed:"separate, willing human review",
 warning:"Synthetic code only"
});
const change=fn=>{const x=fixture();fn(x);return x;};
test("JAR;VIS receives only a held redacted attention card, not family or recipe details",()=>{
 const card=attendNourishBanana(fixture());
 assert.equal(card.state,"HOLD_FOR_OPERATOR_REVIEW");
 assert.equal(card.attention,"SIMULATED_SOFTWARE_PROOF_ONLY");
 assert.equal(card.source.proofCommit,PINS.webZ);
 assert.equal(card.witnessedByCode.hostileMutationsRefused,8);
 assert.equal(card.witnessedByCode.confirmedUnits,0);
 assert.equal(card.witnessedByCode.actualChildrenFed,0);
 assert.equal(card.nextHumanGates.length,5);
 assert.equal(card.externalEffects,false);
 const exported=JSON.stringify(card);
 for(const fragment of ["PRIVATE-UNKNOWN-CHILD-EXAMPLE","SYNTH-RECIPE-DO-NOT-ECHO","SYNTHETIC BEANS","rice","beans","childName","householdId"]){
  assert(!exported.includes(fragment),fragment);
 }
 assert(card.forbidden.includes("AUTONOMOUS_OUTREACH"));
});
test("every attempt to smuggle real-world authority into the fixture is held",()=>{
 const variants=[
  x=>{x.actual.childrenFed=1;},
  x=>{x.effects.contact=true;},
  x=>{x.effects.network=true;},
  x=>{x.crossing.attemptedPublish="shared";},
  x=>{x.crossing.confirmedUnits=1;},
  x=>{x.crossing.linkedAfterAuthorityFailure=1;},
  x=>{x.crossing.negativeCases.pop();},
  x=>{x.crossing.negativeCases[0].reason="";},
  x=>{x.crossing.duplicateCreatedNewCase=true;},
  x=>{x.crossing.sourceStatus="fulfilled";},
  x=>{x.crossing.sourceRequirementCount=2;},
  x=>{x.sourcePins.bananaSpork="bad";},
  x=>{x.sourcePins.nourish="bad";},
  x=>{x.sourcePins.rogue="owner";},
  x=>{x.privatePantry=["unexpected"];},
  x=>{x.schema="jarvis/auto-authorize";},
  x=>{x.crossing.pourPreview.visibility="public";},
  x=>{x.example.unknownUnshared.push("secret");}
 ];
 for(const mutation of variants)assert.throws(()=>attendNourishBanana(change(mutation)),/JARVIS_HOLD/);
});
test("the operator only runs a pinned script, never invokes a receiving owner's authority API",()=>{
 const script=readFileSync(new URL("../tools/attend-nourish-banana-018.mjs",import.meta.url),"utf8");
 assert.match(script,/JARVIS_SOURCE_ORIGIN_REFUSED/);
 assert.match(script,/JARVIS_SOURCE_PIN_REFUSED/);
 assert.match(script,/JARVIS_SOURCE_DIRTY_REFUSED/);
 assert.match(script,/nourish-banana-native-crossing\.mts/);
 assert.match(script,/execFileSync/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bexec\s*\(|\bshell:\s*true|SupabaseClient|smtp|sendMail/);
});

test("JAR;VIS exposes a localhost-only review door without a food intake or external dispatch",()=>{
 const html=readFileSync(new URL("../public/nourish.html",import.meta.url),"utf8");
 const server=readFileSync(new URL("../src/server.mjs",import.meta.url),"utf8");
 const homepage=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
 assert.match(server,/\["\/nourish", \[new URL\("\.\.\/public\/nourish\.html"/);
 assert.match(homepage,/href="\/nourish"/);
 assert.match(html,/No real family participation/);
 assert.match(html,/no text input and cannot run code/i);
 assert.doesNotMatch(html,/<form\b|<input\b|<textarea\b|<script\b/i);
 assert.match(html,/HOLD/);
});
