/**
 * Post Office 001: one-message/one-recipient, opt-in-first outreach.
 * Node 20+, zero dependencies. Store queues and receipts OUTSIDE the public repo.
 * Test: node --test post-office/post-office.test.mjs
 *
 * Prepare: node post-office/post-office.mjs --queue /private/queue.json --receipts /private/receipts.jsonl
 * Transmit: POST_OFFICE_APPROVE=<campaign> RESEND_API_KEY=... EMAIL_FROM='Lu <hello@abundent.org>' \
 *           node post-office/post-office.mjs --queue /private/queue.json --receipts /private/receipts.jsonl --send
 */
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const PERMISSIONS = new Set(['explicit-follow-up', 'subscribed', 'self-test']);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function checkMessage(m, now = new Date()) {
  if (!m || !/^[a-zA-Z0-9_.-]{3,90}$/.test(m.id ?? '')) return 'invalid-id';
  if (!EMAIL.test(m.to ?? '') || /[\r\n]/.test(m.to)) return 'invalid-or-missing-recipient';
  if (!m.recipientVerified) return 'recipient-not-verified';
  if (!PERMISSIONS.has(m.permission)) return 'no-verified-follow-up-permission';
  if (m.approved !== true || !m.approvedAt || !Number.isFinite(Date.parse(m.approvedAt))) return 'human-approval-missing';
  if (!m.subject?.trim() || /[\r\n]/.test(m.subject)) return 'invalid-subject';
  if (!m.text?.trim()) return 'empty-body';
  if (m.scheduledAt) {
    const when = Date.parse(m.scheduledAt);
    if (!Number.isFinite(when) || when <= now.getTime() || when > now.getTime() + 30 * 86400000) return 'schedule-must-be-future-within-30-days';
  }
  if (m.permission === 'subscribed' && !m.unsubscribeUrl) return 'broadcast-requires-unsubscribe';
  return null;
}

export function toPayload(m, from) {
  const text = m.permission === 'subscribed'
    ? m.text.trim() + '\n\nUnsubscribe: ' + m.unsubscribeUrl
    : m.text.trim();
  return {
    from, to: [m.to], subject: m.subject, text,
    ...(m.scheduledAt ? { scheduled_at: m.scheduledAt } : {})
  };
}

function uniqueKey(campaign, message) {
  return createHash('sha256').update(campaign + '\0' + message.id).digest('hex');
}
function parsedArgs(args) {
  const out = { send: args.includes('--send') };
  for (const key of ['queue', 'receipts']) {
    const index = args.indexOf('--' + key);
    if (index >= 0) out[key] = args[index + 1];
  }
  if (!out.queue || !out.receipts) throw new Error('--queue and --receipts are required, and must be private paths');
  if (resolve(out.queue) === resolve(out.receipts)) throw new Error('Queue and receipts must differ');
  return out;
}

export async function run({queuePath, receiptsPath, send = false, env = process.env, now = new Date(), fetcher = fetch, logger = console.log}) {
  const queued = JSON.parse(await readFile(queuePath, 'utf8'));
  if (!/^[a-zA-Z0-9_.-]{3,90}$/.test(queued.campaign ?? '')) throw new Error('Invalid campaign');
  if (!Array.isArray(queued.messages)) throw new Error('Invalid messages array');
  if (new Set(queued.messages.map(m => m.id)).size !== queued.messages.length) throw new Error('Duplicate message IDs');
  const existing = new Set();
  try {
    const journal = await readFile(receiptsPath, 'utf8');
    for (const row of journal.split('\n').filter(Boolean)) {
      const event = JSON.parse(row);
      if (event.kind === 'provider-accepted') existing.add(event.key);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (send && (!env.RESEND_API_KEY || !env.EMAIL_FROM || env.POST_OFFICE_APPROVE !== queued.campaign)) {
    throw new Error('Cannot send: set RESEND_API_KEY, EMAIL_FROM, and POST_OFFICE_APPROVE matching campaign');
  }
  const summary = {campaign: queued.campaign, ready: 0, held: 0, alreadyAccepted: 0, submitted: 0, rejected: 0, mode: send ? 'SEND' : 'PREVIEW'};
  for (const m of queued.messages) {
    const key = uniqueKey(queued.campaign, m);
    if (existing.has(key)) { summary.alreadyAccepted++; continue; }
    const hold = checkMessage(m, now);
    if (hold) { summary.held++; logger(m.id + ': HOLD (' + hold + ')'); continue; }
    summary.ready++;
    if (!send) { logger(m.id + ': READY (preview only, no transmission)'); continue; }
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': key
      },
      body: JSON.stringify(toPayload(m, env.EMAIL_FROM))
    });
    if (!response.ok) {
      summary.rejected++;
      logger(m.id + ': provider rejected (' + response.status + '); no local acceptance recorded');
      continue;
    }
    const data = await response.json();
    if (!data.id || typeof data.id !== 'string') {
      summary.rejected++; logger(m.id + ': no provider receipt ID; manual reconciliation required'); continue;
    }
    await mkdir(dirname(receiptsPath), {recursive: true});
    await appendFile(receiptsPath, JSON.stringify({
      kind: 'provider-accepted', key, id: m.id, providerId: data.id,
      scheduledAt: m.scheduledAt ?? null, recordedAt: now.toISOString()
    }) + '\n', {mode: 0o600});
    existing.add(key);
    summary.submitted++;
    logger(m.id + ': provider accepted (not a delivery confirmation)');
  }
  logger(JSON.stringify(summary));
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = parsedArgs(process.argv.slice(2));
    await run({queuePath: args.queue, receiptsPath: args.receipts, send: args.send});
  } catch (error) {
    console.error('POST OFFICE HOLD:', error.message);
    process.exitCode = 1;
  }
}
