// Create only a fictional, public-safe rehearsal request. No network or keys.
import {writeFileSync} from 'node:fs';
const [fingerprint,file]=process.argv.slice(2);
if(process.argv.length!==4||!(/^[a-f0-9]{64}$/).test(fingerprint??'')){console.error('Usage: node request.mjs RECEIVER_FINGERPRINT NEW_REQUEST.json');process.exitCode=2}else{try{writeFileSync(file,JSON.stringify({title:'Fictional cargo offer',description:'Synthetic material for review only.',scope:'No field activity authorized.',toFingerprint:fingerprint,expiresAt:new Date(Date.now()+86400000).toISOString()},null,2)+'\n',{flag:'wx',mode:0o600});console.log('Fictional request saved. Review before signing.')}catch(e){console.error('HOLD:',e.message);process.exitCode=2}}
