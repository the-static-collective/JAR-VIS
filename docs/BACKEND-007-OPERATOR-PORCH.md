# BACKEND-007 — Operator's Porch + scoped workers

**Status:** live isolated Supabase Edge Function (`jarvis-operator-007` v1) and PostgreSQL migration applied to the existing `pantry-gate` backend on October 26, 2026. GitHub review/tests are separate receipts. **Operator access is not yet provisioned**; the site is intentionally locked until the owner generates a private operator credential.

**Operator panel:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-operator-007

## What is real

- Database-backed view of recent HELD / READY / LEASED / RETURNED synthetic tasks and append-only receipts.
- Mobile operator login accepts a `jv7_` capability key **in tab memory**; it is neither placed in a query string nor localStorage.
- Operator may enqueue **fictional rehearsal** tasks. They start HELD, and require a separate explicit approval click before becoming READY.
- Worker-specific keys **cannot** access the operator queue or approve. Operator keys **cannot** claim/return work.
- Operator approval does **not** establish human consent or authority to send mail, publish, distribute food, or represent anybody.
- Worker returns are checked against the exact lease attempt number (`attempts = p_attempt`) and must explicitly declare zero external effects, no admission, no verified real-world claims.
- Browser never sees a Supabase master credential; credentials are random, SHA-256 hashed in an RLS-closed table, expire automatically and can be revoked.
- Supabase Edge hosts the panel and API independently of Vercel build quotas.

## Owner first-login — private credential, NOT for GitHub

Open the **Supabase SQL Editor** of your existing `pantry-gate` project:

https://supabase.com/dashboard/project/kbhqacsdvjsstzyplqij/sql/new

Execute this exact statement once:

```sql
select public.jarvis_backend_issue_capability('operator','primary_operator',90) as operator_key;
```

The query returns a **single new secret** beginning with `jv7_`. Copy it into a password manager or otherwise keep it private. **Do not paste it into chat, public issues, logs, source control or a URL.** Open the Operator panel linked above and paste it into the key field. The key expires after 90 days. If the login is lost, issue another with a new actor name or revoke the previous one using a privileged, operator-owned SQL session:

```sql
select public.jarvis_backend_revoke_capability('primary_operator','operator');
```

Then create a new credential. A real multiuser system should eventually replace long-lived bearer keys with individual sign-in and approved roles.

## Worker boundary (Modal NOT connected)

When a Modal worker is legitimately provisioned, the owner can issue a **worker-only** key:

```sql
select public.jarvis_backend_issue_capability('worker','modal_worker_1',30) as worker_key;
```

Keep that secret in Modal's protected secrets, **not** source, a web page, an email, or a public notebook. It authorizes **only** `claim` and `return` for synthetic job measurements. The response includes the lease's `attempt`; the return requires the exact same attempt so stale results cannot supersede a retry.

There is **no** automatic Modal deployment, job poller, real-resource dispatch, or self-triggering correspondence in BACKEND-007. Operator-issued approval is a task state transition, not remote job execution.

## Web API

`GET /functions/v1/jarvis-operator-007`: static public HTML login shell; no private state.

`GET .../health`: public minimal availability; **not** a complete backing DB health check.

`GET .../ui.js`: static UI script, no credentials.

`POST /functions/v1/jarvis-operator-007`: JSON with bearer authorization, action `view`, `enqueue`, `admit`, `claim` or `return`. Scope checked by private database RPC. No CORS wildcard and mismatched browser origin rejected. No public mailbox send or arbitrary DB query.

## Observed evidence

- Migration `jarvis_backend_007_scoped_operator_worker_panel`: applied successfully.
- `jarvis_backend_check_capability('not-a-valid-key','operator')`: returned `authorized:false`.
- Privilege read: `anon_read=false` for `jarvis_backend_capabilities`, `anon_issue=false` for capability creation.
- `jarvis_backend_list_jobs()` projected the earlier real persisted synthetic test: 1 returned fixture; 4 receipts; 0 external effects.
- Supabase Edge Function deployed `ACTIVE` version 1; public web/curl external smoke tests were unavailable from this environment, **so browser loading and an authenticated owner interaction remain unverified**.
- Existing BACKEND-006 service API, Garden intake, survivor confidentiality, and Post Office Resend sending are unchanged.

**Next gates:** owner authenticates and witnesses panel UI; scoped worker return test with dedicated key; then connect Modal as an opt-in compute worker. No irreversible external effects without independent permission gates.
