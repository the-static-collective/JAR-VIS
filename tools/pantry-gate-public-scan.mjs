#!/usr/bin/env node
/** Explicit READ-ONLY public observation from the already deployed pantry-gate Garden ledger. */
import {fetchPublicGarden} from '../src/pantry-gate-public-source.mjs';
try{
 const result=await fetchPublicGarden();
 // This projection is approved PUBLIC data only and does not contain sensitive queue records.
 console.log(JSON.stringify(result,null,2));
 if(result.offers.length===0&&result.needs.length===0)
   console.error('HOLD: public Garden has no reviewed care/commons exchange entries; real-time participation needs a separate opt-in edge.');
}catch(error){
 console.error('HOLD_GARDEN_PUBLIC_DISCOVERY:',error.message);
 process.exitCode=1;
}
