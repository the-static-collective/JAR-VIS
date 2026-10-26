# POST OFFICE 001 — One real conversation at a time

**Field protocol · October 26, 2026 · Status: runnable local sender, NOT configured/authorized for production sending.**

## Ownership and boundaries

This is a **JAR;VIS outbound adapter**, not a new master contacts database. Abundent / webZ is the public invitation door; the existing Supabase contact form holds opt-in correspondence, Buttondown `luv` remains a separate newsletter experiment. Do not import contacts from a public event, scrape a roster, treat a business card as marketing-list permission, or infer a partnership. One recipient, one intended conversation, one human-approved text, one receipt.

The proposed sender is `hello@abundent.org` (the actual domain is **abundent.org**, not abundant.org). Porkbun currently has no hosted mailbox or email forwards. Cloudflare is authoritative for live DNS. Neither sender authentication, an inbox, nor sending credentials were present at inspection. Sending is not activated by this PR.

## What the runnable tool proves

`post-office/post-office.mjs` reads a **private** queue JSON. Default is PREVIEW: it transmits **nothing**. An actual send requires `--send`, a matching `POST_OFFICE_APPROVE` environment value, `EMAIL_FROM`, and a private `RESEND_API_KEY`. Every message must carry a verified recipient, a recorded follow-up basis, and approval timestamp. Subscribed mail additionally requires an unsubscribe URL. Unapproved, malformed and unverified entries HOLD.

The sender uses Resend's HTTPS API with a deterministic idempotency key. Provider-accepted messages are appended to a **private** JSONL receipt journal, protecting against re-runs. A future ISO 8601 `scheduledAt` delegates scheduling (up to 30 days) to the provider; no local cron is needed. A provider acceptance is not confirmation of inbox delivery, reading, or response. The persistent journal is local: loss of it needs operator reconciliation, especially after more than 24 hours (Resend's own idempotency window). Do not run concurrent sender instances against the same journal. No API key, journal, actual recipient, or raw contact-form export belongs in a public GitHub repo.

### Example private queue (replace the test address; do not commit real contacts)

```json
{
  "campaign": "field-introductions-2026-10-26",
  "messages": [{
    "id": "self-proof-001",
    "to": "you@example.com",
    "recipientVerified": true,
    "permission": "self-test",
    "approved": false,
    "approvedAt": null,
    "subject": "Abundent Post Office test",
    "text": "First test of the Abundent post office. Reply to verify the return path.",
    "scheduledAt": null
  }]
}
```

Use a file **outside the repository**. Flip `approved` and set `approvedAt` **only upon human approval**. The address in this specimen is not a real destination.

### Commands

```sh
# Runs immediately, requires no network or secrets
node --test post-office/post-office.test.mjs

# Prints held/ready only; no messages are sent
node post-office/post-office.mjs --queue /secure/outreach.json --receipts /secure/receipts.jsonl

# Only after a verified sending domain, sender access, real consent, and human approval
POST_OFFICE_APPROVE=field-introductions-2026-10-26 \
EMAIL_FROM='Lu <hello@abundent.org>' RESEND_API_KEY=... \
node post-office/post-office.mjs --queue /secure/outreach.json --receipts /secure/receipts.jsonl --send
```

## Launch gates (not yet met)

1. Decide receiving route: Porkbun paid mailbox ($36/year) or a free forward to a designated owner mailbox. Forwarding can **receive but not send**. If using Porkbun, apply required MX/SPF changes on **live Cloudflare DNS** after reviewing existing records. DKIM + DMARC for outbound sender must be verified independently; do not copy unprovided provider-specific records.
2. Connect a reputable authenticated outbound provider and verify `abundent.org`. API credentials stay in secrets, never chat, public code, or GitHub commit. If a provider is not authorized, retain HOLD.
3. Prepare a private list: who, verified email, why this person, where follow-up permission came from, personal draft, approved schedule. Sensitive survivor disclosures and confidential information stay off general outreach.
4. Perform a **self-test** to the owner's verified mailbox. Check provider acceptance, actual inbox arrival, and successful reply to the intended `hello@` address. Then send 1–3 individualized emails, not a blind blast.
5. Log accepted ID, delivery/bounce when supported, replies, follow-up preference, unsubscribe/suppression; never mark "delivered" from an API-accepted receipt alone.

## First invitation packet — intended as personal notes, not a newsletter blast

**Coalition of Care host/contact** — Subject: `Following up from Saturday: one practical table`. Thank them for the gathering, offer to help convert meeting material into short public-friendly updates **subject to their review**, and invite a bounded small-table exercise to discover practical needs/offers without collecting private personal stories.

**Waseca grocery organizer** — Subject: `A practical tool for the grocery effort`. Thank them for Sunday, ask for the actual current bottleneck, offer one independently produced volunteer field kit or a 10-minute fictional need-to-fulfillment demonstration. Explicitly avoid implying The Garden is the store's adopted name or the Collective represents its committee.

**Ashley / Real Life worship connection** — Subject: `Following up on Playback and the foot controller`. Lead with the actual church MIDI/iPad controller need and a concise cable/adaptor shopping list; optionally offer an introduction to a hospitality organizer for the separate community-table experiment. Do not treat the church as a project partner.

**Benya / Southern Minnesota Initiative Foundation** — Subject: `Waseca community grocery — a small practical pilot`. An individual introduction referencing the recent meeting, inviting a short conversation about locally governed grocery organizing, co-op development and accountable capacity-building; avoid claiming grant or institutional backing.

**Cherokee / Horizon Accord** — already has an active correspondence. No generic blast. If messaging, send a distinct low-pressure reply to the existing thread, honoring their careful position about new commitments.

> The outbound adapter should never launch or schedule these without source-verified addresses and explicit individualized approval. Names in this packet are **candidate relationships**, not members of an email list.

## Next real proof

PRIVATE QUEUE → DRY RUN → AUTHENTICATED SEND → PROVIDER RECEIPT → INBOX/REPLY WITNESS → HUMAN-RECORDED FOLLOW-UP. The first four become executable when sender and approvals are provisioned. The last two demand actual observation and must not be manufactured.
