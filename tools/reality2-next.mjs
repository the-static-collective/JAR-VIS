import {readReviewedField,proposeNextUsefulThing} from "../src/reality2-field.mjs";
try{
 const packet=await readReviewedField();
 console.log(JSON.stringify({source:"Reality 2.0 Waseca public reviewed feed",asOf:packet.asOf,
  candidates:packet.candidates.length,next:proposeNextUsefulThing(packet)},null,2));
}catch(e){console.error("Reviewed field unavailable:",e.message);process.exitCode=1;}
