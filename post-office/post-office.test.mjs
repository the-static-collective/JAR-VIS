import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkMessage, toPayload, run} from './post-office.mjs';

const ready = {
  id:'self-proof-001',to:'owner@example.org',recipientVerified:true, permission:'self-test',
  approved:true,approvedAt:'2026-10-26T12:00:00Z',subject:'Proof',text:'This is a test',scheduledAt:null
};

test('HOLD for missing recipient consent, human approval, or newsletter unsubscribe',()=>{
  const now=new Date('2026-10-26T17:00:00Z');
  assert.equal(checkMessage({...ready,permission:null},now),'no-verified-follow-up-permission');
  assert.equal(checkMessage({...ready,approved:false},now),'human-approval-missing');
  assert.equal(checkMessage({...ready,recipientVerified:false},now),'recipient-not-verified');
  assert.equal(checkMessage({...ready,permission:'subscribed'},now),'broadcast-requires-unsubscribe');
});
test('Scheduling forwards exact ISO timestamp; body separated by message',()=>{
 const m={...ready,scheduledAt:'2026-10-27T17:00:00Z'};
 assert.equal(checkMessage(m,new Date('2026-10-26T17:00:00Z')),null);
 assert.equal(toPayload(m,'us@abundent.org').scheduled_at,m.scheduledAt);
});
test('Preview sends nothing; approved SEND creates one provider receipt; rerun does not duplicate',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'post-office-'));
 const queue=join(dir,'queue.json'), journal=join(dir,'receipts.jsonl');
 await writeFile(queue,JSON.stringify({campaign:'proof-001', messages:[ready,{...ready,id:'held-002',approved:false}]}));
 const env={EMAIL_FROM:'Lu <us@abundent.org>',RESEND_API_KEY:'fake-key', POST_OFFICE_APPROVE:'proof-001'};
 let calls=0;const fetcher=async(url,opts)=>{calls++;assert.equal(url,'https://api.resend.com/emails');assert.ok(opts.headers['Idempotency-Key']);return{ok:true,json:async()=>({id:'provider-123'})}};
 const silent=()=>{}, opts={queuePath:queue,receiptsPath:journal,env,fetcher,logger:silent,now:new Date('2026-10-26T17:00:00Z')};
 const preview=await run({...opts,send:false});
 assert.equal(preview.ready,1);assert.equal(calls,0);
 const sent=await run({...opts,send:true});
 assert.equal(sent.submitted,1);assert.equal(sent.held,1);assert.equal(calls,1);
 const again=await run({...opts,send:true});
 assert.equal(again.alreadyAccepted,1);assert.equal(calls,1);
 assert.match(await readFile(journal,'utf8'),/provider-123/);
});
test('No send with missing explicit campaign approval',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'post-office-'));
 const queue=join(dir,'queue.json');
 await writeFile(queue,JSON.stringify({campaign:'proof-001', messages:[ready]}));
 await assert.rejects(run({queuePath:queue,receiptsPath:join(dir,'receipts'),send:true,env:{},logger:()=>{}}),/Cannot send/);
});
