# HEARTBEAT-001 — The Missing Inch

**State:** portable local prototype, implemented in JAR;VIS. **Not an Abundent deployment or a live cross-project service.**

The same small cycle can describe garden pickups, park cleanup, potlucks, campus compute, or creative contributions without requiring them to share one database or one sovereign authority:

```text
DISCOVER → COMPOSE → ACT → WITNESS → RETURN
```

**Rule:** discovery is not consent; a proposal is not execution; a receipt is not physical fulfillment; an account of a result is not independent proof.

## Five phase contract

| Phase | Smallest admissible record | Boundary |
| --- | --- | --- |
| DISCOVER | Attributable NEED and OFFER (or another explicitly declared pair) | A relevant pairing is only a candidate. |
| COMPOSE | Bounded proposal with source IDs, actor roles, audience, and action | Not permission. |
| ACT | A separately authorized occurrence through a named adapter | In this prototype, only an existing local *mock Kinship relay*. |
| WITNESS | Report of what was observed, by whom, on which evidence | Unverified fixture operator testimony in this prototype. |
| RETURN | Local disposition of the occurrence, including HOLD and unknown | Does not publish, pay, notify, authenticate, or confer authority. |

The export `projectHeartbeat(...)` in `src/heartbeat.mjs` produces a `jarvis.heartbeat/v0` projection, preserving exactly five ordered phases with explicit statuses, next step, source IDs, and `realWorldFulfillment: "not-established"`. The input is independent of application routing. It can be rendered elsewhere, but it is **not** a grant verifier.

The existing JAR;VIS Genesis approval and effect code remain the sole crossing gate. A new POST `/api/heartbeat-witness` accepts only a proposal with a **previously recorded successful local mock crossing**. The note and one of `fixture-complete`, `fixture-partial`, `fixture-blocked` append an idempotent local `FIXTURE_WITNESSED` journal event. The report has `verified: false`, `physicalFulfillmentEstablished: false`, and `externalPublication: false`. Restart replays the event. A second submission returns the first witness instead of replacing history. There is no automated external communication.

## Example: somebody has a truck for three hours

1. **Discover:** human shares an OFFER of three hours of truck help and a location or availability window. A distinct source publishes an attributable NEED to move pantry supplies. Without an actual source and permission to disclose, the record stays unadmitted.
2. **Compose:** propose a named quantity, pickup, destination, scheduling window, intended audience, and human responsibilities. Separate the identity-verification and consent requirements from the match.
3. **Act:** after *actual* stewards authenticate and approve, a future delivery adapter may schedule the work. The current fixture cannot do that. An unsupported or declined action remains HOLD.
4. **Witness:** participants can report `completed`, `partial`, `blocked`, or `unknown`, with provenance and evidence when authorized. Witness statements are not silently promoted to proof.
5. **Return:** send a disposition only to authorized recipients. Make follow-up needs and corrections easy to express. No PENNY payment or credit is implied.

## Adapters are optional, authority remains local

| Neighbor | Possible typed participation | Not present yet |
| --- | --- | --- |
| GrO × Full Measure | Place-based cleanup quest and steward contribution | Live map, validated completion, points, municipal endorsement |
| Table & Road / The Garden | Need/offer cards, pickup and potluck tasks | Real inventory, outreach, RSVP, delivery |
| MSyoU / GHoT | Voluntary campus resource offer and compute task | Device admission, energy budget, remote compute |
| Static Live / music | Offer a song, performance or gear support to a gathering | Distribution rights, permission, publishing |
| Abundent | Account-free shareable invitation and return view | Live public collection or syncing |
| reLATTE | Transport a signed receipt to a receiver with separate admission | Canonical signed receipt integration |

An adapter must declare its owner, data scope, allowed action, human gates, availability, deduplication key, witness semantics, and return audience. **JAR;VIS does not confer these capabilities by mentioning them.** The provenance of a proposal must survive a rejection, a revocation, a HOLD, and a transport failure.

## Local exercise

```sh
npm test
npm start
```

Open the workbench, form the *fictional* Garden proposal, explicitly perform both `MOCK YES` controls, attempt a mock crossing, then record fixture testimony in **Heartbeat**. The return is visible locally and persists in the existing hash-chained JSONL journal. Try reporting without the mock crossing: it must fail closed.

### Release gates for reality

1. Import real needs/offers only under explicit participant-controlled sharing and retention policies; protect personal addresses.
2. Implement authenticated, independently revocable grants scoped to a specific action, audience, and expiry, not the existing fixture approvals.
3. Attach a real capability-owned adapter with safe retries and effect idempotency.
4. Build accountable witness semantics with `reported` distinct from `verified`, and return dispositions to authorized parties only.
5. Verify lifecycle behavior under declines, stale state, offline conditions, duplicate messages, and privacy removal.
6. Only then evaluate an opt-in Abundent surface and multi-project routing.

**Integrity > Continuity.** A missing return is an unknown result, not permission to invent success.
