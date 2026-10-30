# PORCH-RECEIVER-009: One knock, one accountable answer

**Ownership:** Abundent's staged human porch (the-static-collective repo) and JAR;VIS's private operator desk. This is NOT the webZ sovereign invitation rehearsal, the Waseca Reality2 intake, or the Commons organizational inbox.

## Scope and evidence

1. Human voluntarily composes a **non-sensitive**, no-contact need / offer / question in the first-party browser.
2. They may choose **Send privately for review** with informed consent; this is a distinct opt-in from preparing a note, copying, saving or emailing.
3. The backend accepts a bounded public-safe card (not emails/case histories), returns a receipt UUID and one-time random withdrawal/view key. Store only its SHA-256 hash. Client must give the person a printable/copyable receipt: not in a URL or telemetry.
4. Received requests remain **PENDING**; JAR;VIS may apply deterministic suggestions (need/offer/question and potential public-safe next action), but **cannot match, respond, contact, publish or promise help automatically**.
5. A separately authenticated JAR;VIS operator may HOLD, prepare a limited public-safe reply for the submitter, or CLOSE. Every operator action is audited; no action establishes actual volunteer or partner acceptance.
6. The submitter can check their status and read an approved note using their receipt, or withdraw (delete) before expiration. No notifications or auto-referrals. A receipt is storage acknowledgment, not receipt of help.
7. Private text is not exposed in public dashboards, model prompts, GitHub issues, or public APIs. Direct anon/authenticated database grants are revoked, with RLS enabled. Service-role keys remain in Edge Functions.

## Input contract

POST `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/porch-receiver-009`
- submit: `{action:"submit",kind:"need|offer|question",particular,area,when,next,consent:true,website:""}`.
- status: `{action:"status",receiptId,receiptKey}`
- withdraw: `{action:"withdraw",receiptId,receiptKey}`

Allowed browser origins: `https://hello.abundent.org`, `https://abundent.org`, and the staging project's stable Vercel hostname. No cookies or sessionStorage; receipt key must not appear in query/fragment/history. Body limit 2500 UTF-8 bytes. Basic email, phone, full street address and URL filters are a **weak preventative measure**, NOT a guarantee that no sensitive data is submitted. Do not solicit such information. No personal identifiers, medical, legal/case details, minors' details or precise addresses.

**Private storage:** public.porch09_items; events metadata; hashed rate buckets. 30-day hard database expiry maintained by a daily `pg_cron` job; verify the actual scheduled job, don't presume deletion just from a timestamp column.

## JAR;VIS operator

Existing `jarvis-operator-008` Supabase Auth cookie and membership protects the action. Operator identity enrollment is a **separate human-controlled bootstrap gate**; no public/anonymous reviewer access. Allowed actions:
- `porch-list`: private queue and rule-based **suggested** next step, no external AI model access.
- `porch-hold`: mark held, no contact.
- `porch-reply`: public-safe note shown only to receipt holder; no promise of action.
- `porch-close`: close unanswered or resolved; status remains factual.
All writes return observed state; no unapproved dissemination or service dispatch.

## Status language

`PENDING` = stored, unreviewed. `HELD` = operator reviewed and no response yet. `REPLY_AVAILABLE` = an operator wrote a note; not a verified match. `CLOSED` = no further handling offered. `WITHDRAWN` = row deleted, no user-submitted text available. `EXPIRED` = scheduled deletion / inaccessible after 30 days. There is **no fabricated matching**.

## Boundary gates

Do not configure automatic notifications, email ingestion, public matching or LLM processing without separate explicit review of content retention, safety, provider consent, abuse management and operator authorization. Existing us@abundent.org forwarding is an **independent** email route, not automatically imported into this database.
