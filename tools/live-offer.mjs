/** JAR;VIS reads a declarative proposed reLATTE cartridge, never executes arbitrary plugin code. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {propose} from '../src/live-offer-router.mjs';

const argv=process.argv.slice(2);
const offerAt=argv.indexOf('--offer'),whenAt=argv.indexOf('--when'),cartridgeAt=argv.indexOf('--cartridge');
if(offerAt===-1||!argv[offerAt+1]){
 console.error('Usage: node tools/live-offer.mjs --offer "I can play guitar for 20 minutes right now" [--when now|soon|later|unspecified] [--cartridge path-to-reviewed-json]');
 process.exitCode=2;
}else{
 const defaultPath=fileURLToPath(new URL('../cartridges/live-offer-001.json',import.meta.url));
 const file=cartridgeAt>=0&&argv[cartridgeAt+1]?resolve(argv[cartridgeAt+1]):defaultPath;
 try{
  const cartridge=JSON.parse(readFileSync(file,'utf8'));
  const plan=propose(argv[offerAt+1],cartridge,{when:whenAt>=0?argv[whenAt+1]:null});
  const output={...plan,actions:plan.actions.map(({rank,...a})=>a),operational_state:'PROPOSED_ONLY',browser_actions_not_run:true};
  process.stdout.write(JSON.stringify(output,null,2)+'\n');
 }catch(e){console.error('Cartridge refused:',e.message);process.exitCode=1;}
}
