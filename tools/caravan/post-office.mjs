// Local opaque-file carrier; expected pin must arrive independently. No delivery or authority claim.
import {openSync,readSync,closeSync,fstatSync,constants,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {digest,transport} from './return-card.mjs';
const need=(v,m)=>{if(!v)throw Error(m)};
export function carry(source,destination,pin,size){
 need(typeof pin==='string'&&/^[a-f0-9]{64}$/.test(pin)&&Number.isSafeInteger(size)&&size>0&&size<=24000,'Invalid parcel bound');
 const fd=openSync(source,constants.O_RDONLY|(constants.O_NOFOLLOW??0)|(constants.O_NONBLOCK??0));let b;
 try{const st=fstatSync(fd);need(st.isFile()&&st.size===size,'Source size mismatch');b=Buffer.alloc(size+1);let n=0,k;while(n<b.length&&(k=readSync(fd,b,n,b.length-n,null))>0)n+=k;need(n===size,'Source changed');b=b.subarray(0,n)}finally{closeSync(fd)}
 need(digest(b)===pin,'Source digest mismatch');
 // Only accept a POSTMARK-shaped envelope. This is not cryptographic authentication.
 const p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
 need(p&&Object.keys(p).sort().join('|')==='ciphertext|header|signature'&&p.header?.schema==='postmark.parcel/v1'&&typeof p.ciphertext==='string'&&/^[A-Za-z0-9_-]+$/.test(p.ciphertext)&&typeof p.signature==='string'&&/^[A-Za-z0-9_-]+$/.test(p.signature),'Not a POSTMARK envelope');
 writeFileSync(destination,b,{flag:'wx',mode:0o600});
 const checked=transport(destination,pin,size);
 return {schema:'post-office.local-copy/v1',status:'CIPHERTEXT_BYTES_MATCH',sha256:checked.sha256,bytes:checked.bytes,uploaded:false,received:false,decrypted:false,authority:'NONE',admission:'none'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const [s,d,p,n]=process.argv.slice(2);need(process.argv.length===6&&/^\d+$/.test(n),'Usage: node post-office.mjs SOURCE NEW_DESTINATION SHA256 BYTES');console.log(JSON.stringify(carry(s,d,p,Number(n)),null,2))}catch(e){console.error('HOLD:',e.message);process.exitCode=2}}
