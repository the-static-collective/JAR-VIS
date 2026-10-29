#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderKeptAudio} from '../src/cabaret/creature-audio.mjs';
try {
 const args=process.argv.slice(2);
 if(args.length!==5||args[0]!=='render-wav'||args[1]!=='--offer'||args[3]!=='--out')
  throw Error('HOLD_USAGE_RENDER_WAV_OFFER_OUT');
 const offer=JSON.parse(readFileSync(resolve(args[2]),'utf8'));
 const result=renderKeptAudio(offer),out=resolve(args[4]);
 writeFileSync(out,result.wav,{flag:'wx',mode:0o600});
 writeFileSync(out+'.receipt.json',JSON.stringify(result.receipt,null,2)+'\n',{flag:'wx',mode:0o600});
 process.stdout.write(JSON.stringify(result.receipt,null,2)+'\n');
}catch(e){process.stderr.write('HOLD: '+String(e.message).slice(0,350)+'\n');process.exitCode=2}
