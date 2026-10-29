#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyOffer} from '../src/cabaret/toaster-offer.mjs';
const argv=process.argv.slice(2);
try {
 if(argv.length!==2||argv[0]!=='verify-file')throw Error('HOLD_USAGE_VERIFY_FILE_ONLY');
 const input=JSON.parse(readFileSync(resolve(argv[1]),'utf8'));
 process.stdout.write(JSON.stringify(verifyOffer(input),null,2)+'\n');
}catch(e){process.stderr.write(String(e.message).slice(0,300)+'\n');process.exitCode=2}
