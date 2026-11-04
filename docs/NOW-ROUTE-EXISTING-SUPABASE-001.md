# NOW-ROUTE / EXISTING SUPABASE 001

## Decision: reuse active pantry-gate infrastructure, not the separate Campfire/Jubilee authority

Verified read-only against connected Supabase on November 4, 2026:

- The ACTIVE_HEALTHY project **pantry-gate** (project ref kbhqacsdvjsstzyplqij) already hosts garden-ledger, garden-signal, reality2-waseca, workboard-history, JAR;VIS operator services, and a shared server-side quota function.
- public.garden_entries has kind, lane, body, next_step, status, consent_to_review, and withdraw_hash. It does NOT have a pickup deadline, area, transport estimate, participant pair, or independent handoff confirmation.
- garden-ledger public GET returns garden/public-overview-v1: human-approved PUBLIC records only. Anonymous POST saves explicit-review-consented submissions as private PENDING, not immediate matching offers.
- The inspected project currently has no garden_entries; it has two PUBLIC_REVIEWED reality2 stewardship records but those are not verified food offers.
- The project has zero Auth accounts and lacks circle_memberships and circle_now_offers. Therefore the BananaSpork authenticated Campfire model is not immediately available in this project.
- Existing public.garden_consume_quota(p_key,p_period,p_max) is an atomic quota RPC, not granted directly to anon. The current garden-ledger calls it server-side. A new server-side feature could reuse this without rewriting the function.

## Already implemented on this branch

A **read-only** public Garden adapter is implemented in src/pantry-gate-public-source.mjs and the CLI npm run now:existing. It connects to the *existing* garden-ledger GET endpoint, verifies the source contract, accepts only PUBLIC_REVIEWED care/commons offers and needs, and produces context cards.

It does NOT auto-match, call private sources, read PENDING submissions, claim participant permission, issue notifications or invent physical outcomes. The test file uses fictional fixtures; the live read-only CLI is opt-in.

## Smallest useful real-time reuse, no new Supabase project

For an account-free pilot, add a **separate** scoped NOW-ROUTE namespace within the same pantry-gate project (once reviewed), leaving the old Garden tables and endpoints unmodified:

1. **now_route_participations** — short OFFER/NEED, domain, approximate chosen area, pickup feasibility, expiry, explicit matching opt-in, perishable safe-storage HOLD, and a unique owner capability key (only its hash stored). Enable RLS; no public or authenticated direct-table grants. Add finite retention and abuse controls.
2. **now_route_crossings** — one offer + one need and consented transitions PROPOSED → RECIPIENT_ACCEPTED → DONOR_ACCEPTED → REPORTED → CONFIRMED, plus refusal/cancel/expiry. Enforce atomic per-offer and per-need reservation and independent owner-side capability checks; one participant's report must never mean the other's receipt.
3. **now-route-pantry Edge function** — same project/runtime, server-side service credentials only, owner-specific bearer keys, strict validation, separate namespaced keys using the existing atomic garden_consume_quota RPC, bounds against spam, and no release of addresses in discovery.
4. **Two-browser trial:** one known donor, one known recipient, both voluntarily opt in. In-app status polling can prove the route while the screens are open; background notifications, SMS and offline reach are separate future work.
5. **Optional reviewed history:** After a genuinely confirmed, consented exchange, invite an independently approved public Garden entry. Never automatically promote private data or count an API event as physical fulfillment.

## Why not put urgent fish directly into garden_entries?

The current submission is intentionally PRIVATE PENDING for a human reviewer, without a one-hour expiry, location agreement, physical pickup constraints, or separate acceptance. Treating that intake as a live match would silently change the authorization granted by contributors. That is not acceptable.

## Review and field-proof gates

- Active pantry-gate already holds unrelated real workflows and private queues. This change **does not** apply a migration, deploy an Edge function, or insert test records into that shared production project.
- Use fictional nonperishable goods first, two independent clients plus an outsider, and ensure denial of forged tokens, expired posts, competing reservations, cross-recipient requests, unauthorized withdrawals, repeated requests, and raw contact disclosures.
- Review RLS and grants; use Supabase advisors after deliberate schema changes. Do not expose service-role credentials to clients.
- Cold-chain self-attestation is not a safety certification; a 45-minute route window is a coordination deadline, not a food-safety deadline.
- Actual success requires independently attributable physical receipt; database status alone is not proof.
- BananaSpork's existing authenticated Campfire design remains a separate possible path if a compatible project, users and membership authority are provisioned deliberately.

**Status:** Existing Supabase structure inspected and reusable public feed bridge coded. Urgent private routing extension proposed, not deployed.
