# WORK-THAT-INHERITS-002 — reviewer discovery as useful work

**Live public pilot:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-reviewers

**Abundent doorway (when deployed):** https://abundent.org/tomorrow/

**Canonical task:** https://github.com/the-static-collective/JAR-VIS/issues/16

## Actually operating

- An existing, owner-controlled Supabase **pantry-gate** project has three new private RLS tables: `inheritance_open_seats`, `inheritance_interest`, `inheritance_audit` (migration `work_that_inherits_reviewer_discovery_002`). Anonymous/authenticated roles have no direct Data API privileges.
- Four carefully bounded, **Static Collective–owned** public roles are offered: process review of the first inheritance pilot, hypothetical cold-chain review, privacy review, and the job of finding reviewers. No real external partner, delivery or approval is asserted.
- The `work-inherits-reviewers` Edge Function serves both the public page and a **restricted projection of owner-approved open seats**. No applicant profiles or private notes are publicly served.
- A person may submit a voluntary, scoped application for one role. Alias, skill, general region, time capacity and possible conflicts help an operator find a *candidate*. Private contact email is optional and explicitly consented; applications default to `PENDING`, `independently_verified=false`, never public.
- A 32-byte withdrawal token is returned once, its hash stored. Withdrawing clears the contact email, alias and explanation, marks the record withdrawn and leaves only minimal audit data.
- Global and best-effort visitor quotas reuse the established `garden_consume_quota` RPC. No raw IP is stored; only salted daily hash. No safety guarantee against determined abuse is implied.
- Local JAR;VIS now emits a **reviewer discovery seat** from the moment an inheritance work item records a stated voluntary commitment, not only after work ends. These seats stay local/HOLD and do not automatically publish tasks or sensitive notes.

## Why the reviewer belongs in the task

A reported result requires somebody to examine it. If that person is missing, **finding the reviewer becomes the next bounded volunteer opportunity**. Their onboarding asks: Which skill? How much time? Any potential relationship/conflict? Which kind of work do they want to care for?

A reviewer application does **not** establish credentials, independence or authority. A different alias alone is meaningless. Next stages require operator screening, actual identity assurance proportional to the risk, a specific conflict check, and separate human acceptance of the particular assignment. A provider/policy expert and an independent eyewitness are not interchangeable.

The process does not publish anyone's identity, allocate access to survivor or legal evidence, initiate outside contact, or upgrade an operator assertion into real-world proof.

## Operator discovery (authenticated database administration only)

The public site intentionally has **no unprotected moderation endpoint**. After the first valid application, a trusted operator with appropriate project rights can query private metadata:

```sql
select s.title, i.id, i.alias, i.role, i.capability, i.region,
       i.availability, i.independence, i.status, i.created_at
from public.inheritance_interest i
join public.inheritance_open_seats s on s.id=i.seat_id
where i.status in ('PENDING','SCREENING')
order by i.created_at asc
limit 50;
```

This is a **candidate discovery queue**, not a reviewer directory. Do not export private email addresses or response notes to public GitHub issues, GRAFT, prompts, or reusable artifacts. Inspect contact information only for an authorized follow-up, and ask permission before introducing third parties.

A public seat is created only after review of its public-safe wording, ownership and relevance. A new task **does not auto-publish** a reviewer request. If the task is blocked for lack of review, leave that bottleneck visible.

## Live QA and boundaries

Live GET for page and four open seats was independently observed, returning HTTP 200 and only safe fields. A reversible no-email synthetic POST→withdraw smoke test lives in `test-live/reviewer-gateway.test.mjs`, which runs for the `feat/reviewer-weave-002` pull request. The main test suite remains offline and does not depend on the live service.

No independently reviewed community work has yet been established. No authorized real food-supply, church or survivor-work pilot has begun through this feature. It is a real open invitation and privately persisted interest queue, not a real-world outcome engine.

### Needed before broader use

1. Verify POST / withdrawal in CI and handle any failures. Perform Supabase security advisor review.
2. Add authenticated, least-privilege, auditable operator interface for screening and single-task reviewer assignment, with conflict and credential checks. Do not reuse unrelated administrator capabilities silently.
3. Provide practical retention / deletion schedules, incident response, and withdrawal procedures; never ingest sensitive evidence into this intake.
4. Create a real-world first pilot only with the owner and participants' explicit voluntary permissions.
5. Make reviewed, public-safe *method* returns available to GRAFT by exact source pin and an explicit publication decision.
6. Record outcome metrics: did the next person avoid repeat work and improve a recipient's situation? Keep `HOLD` distinct from `verified`.

**Integrity > Continuity · Discovery ≠ Independence · Review ≠ Proof · Proposal ≠ Admission.**
