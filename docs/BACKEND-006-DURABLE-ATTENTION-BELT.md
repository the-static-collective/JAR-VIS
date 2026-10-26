# BACKEND-006 — Durable Attention Belt (synthetic live backend)

**Status:** Supabase database migration APPLIED to existing `pantry-gate` project `kbhqacsdvjsstzyplqij`, and Edge Function `jarvis-backend-006` DEPLOYED ACTIVE v1 on October 26, 2026. Node worker is pure and testable. NO Modal deployment or external effects.

## Why we built this

Vercel Hobby's deploy quotas (100 deployments / 24 hours, plus per-hour build limits) blocked webZ preview/production deployments while experiments were changing rapidly. This is a deploy frequency issue, **not** a runtime request limit. We had already built independent Supabase Edge Functions, Cloudflare DNS/front doors, and an early Modal fixture worker. This slice proves backend work can persist and run without a new Vercel build.

Backend is not synonymous with 'a huge server': it means durable state, authenticated responsibilities, work queue, idempotency, auditable receipts, and independent worker execution. Here those properties are **real** but scoped to fictional fixture measurement.

## Components

| Part | Implementation | Evidence/status |
| --- | --- | --- |
| Durable jobs | `public.jarvis_backend_jobs`, RLS closed | migration applied |
| Append-only history | `public.jarvis_backend_receipts`, UPDATE/DELETE trigger refused | migration applied |
| Queue admission | `jarvis_backend_enqueue_fixture` → HELD → manual `jarvis_backend_admit_fixture` | live database proof |
| Independent worker lease | `jarvis_backend_claim_fixture`, Postgres `FOR UPDATE SKIP LOCKED`, 90-second lease, 3-attempt cap | live database proof |
| Return | `jarvis_backend_return_fixture` stores result as UNVERIFIED; cannot return without current claimed lease | live database proof |
| Protected HTTP endpoint | `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-backend-006` | Supabase ACTIVE v1 |
| Health route | `GET /health`: public, no private queue bodies or counters | deployed, external HTTP check pending |
| Worker | `backend/worker/measure-fixture.mjs`: pure Node CPU calculation; no external network | local/CI tests |
| Modal compute | `modal/return_worker_001.py`: previous manual fictional proof | separate, not integrated |

The Edge Function public GET /health reports only whether its own database read is healthy. All POST actions are **server-to-server only** with exact service-role bearer verification. Do not put a service-role key in a browser, Modal, a repository, or share it with third-party reviewers. Next security gate: a **scoped, revocable worker capability**, not reuse of the global database master key.

## Live database proof (October 26, 2026)

An operator-invoked, **fully imaginary** test went:

`QUEUED → HELD → OPERATOR_ADMITTED → READY → LEASE_CLAIMED → LEASED → COMPUTE_RETURNED → RETURNED`

Durable job ID: `9734395a-8bdc-4334-971c-f3751f3cfaac`.

Live snapshots after completion: **1 job; 4 append-only receipts; 1 RETURNED; 0 pending; 0 external effects**. Duplicate same-key enqueue reuses the existing job, and a second claim returned `claimed:false`.

Privilege inspection: `anon` cannot SELECT jobs or EXECUTE enqueue; `authenticated` cannot SELECT jobs; `service_role` can claim. SQL checks and Supabase Edge deployment are directly observed, but we did not externally HTTP smoke-test the health route yet. Supabase security advisory reports RLS with no policies on both new tables; this is **intentional closed-by-default backend state**, not public missing-policy access.

## Failure behavior / invariants

- POST without protected bearer: HTTP 401. Unknown action: HTTP 400. No CORS authorization for public UI.
- No worker claims an unapproved job. Expired lease can be reclaimed, but retry may reexecute CPU work; any future external effect needs a separate deduplicated effect ledger.
- Returned synthetic measurements are **not** evidence of production, actual inventory, delivery, human consent or publication.
- A stale or non-owning worker cannot return after lease expiry.
- The job list and results are private; public health does not leak them.
- The new tables and code do not modify existing Garden, reviewer, Reality 2.0, MX13, or Post Office 005 deployment.

## Actual next backend crossings

1. **Scoped worker capabilities:** distribute revocable worker-only credentials, never the Supabase service-role key, to a Modal or another worker. Authenticate lease/return separately from operator admission.
2. **Operator panel:** an authenticated read-only summary showing HELD/READY/LEASED/RETURNED and receipts, then explicit approval controls; no private material displayed without authorization.
3. **Effect gateways:** split compute returns from externally effective actions (email, contact, publication). Independently verify permissions and idempotency before a real effect.
4. **Backend orchestration:** Cloudflare / Supabase route requests; Modal handles opt-in heavy CPU/GPU jobs; Vercel serves webZ front-end without compiling each backend iteration.
5. **CI batching:** stop deploying every experimental commit to Vercel. Develop on GitHub branches, run CI freely, and promote one reviewed release after limits reset. Existing preview build-limit status is not magically bypassed by this backend.

**Do not auto-deploy Modal or trigger email from this backend without explicit owner action.**

## Reproduction

Review `backend/migrations/006_durable_synthetic_belt.sql` and `backend/edge/jarvis-backend-006/index.ts`. Run `npm test` (includes BACKEND-006 invariant and fixture tests). The migration has already run; don't reapply it blindly. The public health route is strictly diagnostic.
