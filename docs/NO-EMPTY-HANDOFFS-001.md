# NO EMPTY HANDOFFS 001 — do the doable

**Origin:** FIRST CIRCLE 001 field screenshot (2026-11-03). A person asked for "Advice on fixing something." The UI proposed "Make a simple invitation." The input, suggestion, and card formed a loop, but the broken object was not one inch closer to being fixed. That is a **coordination loop**, not useful completion.

## Portable principle

**Do the work inside the system's actual capability before assigning work to the person. Never treat a ticket to do something as the thing done.**

A useful answer must change the visitor's actionable state. The criterion is not length, polish, clicks, saved cards, number of branches, or receipt count. The criterion is what new usable thing exists after the interaction.

Four truthful exits:

1. **LOCAL_WORK_PREPARED** — a complete answer, diagnosis procedure, runnable test, ready-to-send draft, playable rule set, or real artifact is present now. This does not prove external outcomes.
2. **LOCAL_PARTIAL** — something concrete is delivered AND the missing capability, evidence, or permission is explicit.
3. **NEEDS_DESTINATION_REVIEW / HOLD** — real-world consequence depends on a separately authorized actor, a receiver-owned receipt, or independent verification.
4. **EMPTY_HANDOFF / HOLD** — the UI asks the visitor to make the thing it could have prepared itself, or makes another card about making a card.

The human may own the last consequential step. That is not an excuse to skip the preparatory work.

## Task semantics (not metadata semantics)

```text
repair request → narrowing question → bounded check / honest limit → report
volunteer request → complete ready-to-send ask → human sends → human confirms
meal help → actual recipe / constraints → person cooks → reports
software bug → code patch + tests → reviewer reviews → authorized deployment
song request → lyrics/audio/demo/arrangement → musician chooses
photograph sale → actual caption/listing/licensing draft → human approves release
event design → runnable event agenda and script → organizer approves / uses
skill exchange → actual skill executable or complete procedure → local recipient reviews
survivor support → privacy-safe, requested artifact/referral → informed human choice
recursive workshop → new usable method or bounded task execution → independent evidence
```

A task whose requested output **is** an invitation passes when the invitation is actually written, usable, and accurately scoped. A task to repair an object fails if the only output is "make an invitation."

## Failure gates

- **Goal mismatch:** the produced deliverable answers a different verb than the original request.
- **Meta-work:** next action is "create a request, invitation, card, plan, ticket, or form" when the system can produce it now.
- **Burden export:** the system asks the human to restate already supplied facts or manually perform a deterministic transformation.
- **Unperformed-effect laundering:** "sent," "booked," "matched," "repaired," "published" or "verified" appears without a destination-native receipt.
- **Recursive no-op:** completing the suggested action yields another suggestion of the same kind without new information, material, or consequence.
- **False closure:** a locally produced artifact is described as a solved external need.

## Implemented opt-in audit

`src/useful-delta.mjs` exports `inspectUsefulDelta` and `test/useful-delta.test.mjs` exercises examples. The audit is intentionally **a structural refusal**, not a classifier of truth or human value. A malicious or hollow 30-character document could still pass; real usefulness requires task-specific tests and human review. It is **not hooked into JAR;VIS dispatch**. The existing JAR;VIS authority and consent gates remain unchanged.

The webZ First Circle 002 sibling experiment replaces the "write a step" picker with bounded ready work, preserves older cards, distinguishes local guide/draft/unresolved, and keeps reports self-attested. That specific source is owned by webZ, not by this document.

## Measurable human test

Give a first-time visitor one task. Do not explain the interface. Ask after two minutes: **"What usable thing do you have now that you did not have at the start?"** Record the artifact and the gap. If the reply is "a card telling me to make a card," fail.

The audit reports **prepared work**, not actual usefulness, and cannot grant global authority. Source projects choose whether to adopt the pattern.

**Short law: NO EMPTY HANDOFFS. Deliver the inch you can do; witness the inch you cannot.**
