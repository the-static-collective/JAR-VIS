# WORK-THAT-INHERITS-001 — Tomorrow starts farther along

**Date:** 2026-10-26  
**Home:** JAR;VIS local operator workbench at `/inherit`  
**Status:** executable local notebook / proposed field pilot; **not deployed publicly, not a live community service**.

## Purpose

Useful work should leave a safer, better starting point for whoever arrives next.

`NEED → WEAVE → VOLUNTARY COMMITMENT → REPORTED WORK → SEPARATE REVIEW → REUSABLE CANDIDATE → INVITATION`

- **WEAVE:** a possible task, described without private person data. No one is assigned.
- **COMMIT:** an operator records the named alias's voluntary choice. The alias is not authenticated; this is *not proof of consent*.
- **WE'VE?:** an operator records a result: completed, partial, or blocked, with optional non-sensitive evidence reference. This is a **report**, not verified fulfillment.
- **REVIEW:** a second, distinct alias examines the reported outcome. A review decision is still a local assertion; identity and underlying evidence are not independently verified.
- **WE CAN:** only a *completed* report with an *accept-report* review can generate a reusable **candidate** method. The candidate is not automatically true, licensed, permitted, public, or admitted to other systems.
- **YOU CAN:** that candidate can include a voluntary next invitation. Nobody is recruited or contacted automatically.

The UI never uses an unqualified **VERIFIED** or **COMPLETED WORK** claim. One explicitly reported completion is not an independently verified achievement. The current independently-verified count is intentionally **zero**.

## Run it

```sh
npm test
npm start
# Open http://127.0.0.1:7789/inherit
```

No external library, public account, cloud database, or credentials required. The operator can create a weave, record an asserted volunteer commitment, record a result, enter a separate review, and (only when the gates pass) document a reusable method and next invitation. Every step is persisted in a second append-only, hash-chain-checked local JSONL journal at `<JARVIS_JOURNAL>.inheritance.jsonl`. It survives restart. This is **tamper-evident against accidental modification**, not a cryptographic signer, confidential vault, or protection from the machine's owner.

The operator may download a **local JSON export** per weave for inspection and handoff. That export is not a trusted provenance proof, publication, or authorization.

## First test scenario: a fictional milk route

1. **Need:** "Milk purchasing costs may rise when an existing funding source expires."
2. **Weave:** "Explore a reversible, short pilot for a community supply route."
3. **Commit:** a fictional `Volunteer A` explicitly volunteers (recorded by a demo operator).
4. **Report:** for the test, enter a fictional completed, partial, or blocked outcome; do not claim that milk was delivered.
5. **Review:** fictional `Reviewer B` records their assessment, deliberately selecting `needs-more` unless the fictional test has enough defined evidence.
6. **Return:** for an accepted *fictional completed* example, capture "confirm supplier, recipient, permitted capacity, cold-chain constraints, pickup/dropoff, and a documented handoff" as a candidate method.
7. **Invitation:** "Who would like to help evaluate the pilot's cold-chain checklist?"

A real food shelf, farmer, church or driver has **not** approved anything by virtue of this example. No need/offer from JAR;VIS's fictional `gardenJar` is silently upgraded into a real claim.

## Why a separate notebook?

The existing Genesis mock Kinship relay and Heartbeat intentionally carry only fictional needs, mock approvals and operator fixture testimony. This new board cannot borrow their consent, assert that a mock relay fulfilled a real need, or overwrite their history. It uses the common local journal primitive but a separate file and distinct `INHERIT_*` event kinds.

**JAR;VIS** = local attention, voluntary human gating, append-only return.  
**GRAFT** = potential future read-only, source-pinned reuse of reviewed *public-safe* methods; **not implemented here**.  
**The Garden / Campfire** = practical field settings for choosing a pilot, **not confirmed partners**.  
**reLATTE / CANNON** = separate receipt/admission boundaries, **not granted by this notebook**.  
**Abundent / WEBZ** = eventual public invitation doorway, **not connected here**.

## Non-negotiable limitations

- Local-only HTTP: `127.0.0.1`, Host and Origin checks, anti-CSRF for writes, bounded JSON, restrictive CSP.
- No identity verification, multi-user authentication, permission delegation, notifications, public intake, payments, external outreach, autonomous execution or auto-posting.
- Treat all user-entered notes as **operator assertions**. Two aliases are not independent human verification.
- Do not enter survivor case facts, legal records, precise locations, contact information, medical details, confidential evidence, or third-party names. The journal is not encrypted.
- All state-changing steps are serialized; one outcome and one review per weave. To correct a mistaken record, start a *new clearly labeled corrective weave* until explicit amendment/retirement receipts exist; never silently change old reports.
- No invitation is a compulsory assignment. No accidental implied commitment.
- Neither a paper print nor a hash upgrades an assertion to physical truth.

## Pilot acceptance conditions

Before a real, public **WE'VE** can be claimed, create a separate *verified* workflow with authenticated and revocable steward permission, evidence inspection by an actual independent reviewer, chain of custody, privacy safeguards, dispute/correction process, and a deliberately scoped publication gate. Test refusals, cancellations, replay, and lost connectivity. Public invitations require the originating parties' explicit permission.

**Useful-work metric for the pilot:** Did the next participant use the inherited method to avoid redoing an earlier step, while retaining an unpressured right to decline? Track outcome and avoidable rework separately from mere participation counts.

**Integrity > Continuity.** Better a blocked or unresolved result honestly returned than a fictitious success multiplying through the network.
