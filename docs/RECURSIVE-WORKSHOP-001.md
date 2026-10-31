# RECURSIVE-WORKSHOP-001 — JAR;VIS × Static OS × Haunted Toaster

**Status: IMPLEMENTED in the JAR;VIS localhost operator workbench.** Proposal-only, offline. Not deployed at `hello.abundent.org`, not an AI-model self-improvement claim, and not connected to an autonomous GHoT executor or third-party community participants.

## What is wired

Open the local JAR;VIS service with `npm start`, then visit `http://127.0.0.1:7789/workshop`.

- JAR;VIS receives a short question locally, with no automatic log of the raw words.
- A frozen, source-pinned **Static OS RECOMPOSER-001/002** Python runtime compiles a new bounded typed operator graph with source-owned route choices.
- The same source produces a Haunted Toaster **inspired** witness memory projection, pressure capsule, evidence refs, and family of candidate routes.
- The visitor may choose an independent public link, preview a plain-text action card, save it, or explicitly retain a content-addressed **observation that the card was generated**, NOT that it was used.
- A voluntary helpful/not-helpful verdict can update future preference policy. An additionally opted-in previously proposed two-route macro may become a reusable typed graph. No changes to arbitrary executable code.
- A separate, append-only JAR;VIS local journal records only confirmed state transitions and source-bound artifact receipt hashes, not the question.
- Next question compiles afresh from that local history. All proposals remain `PROPOSAL_ONLY`. No email, volunteer matching, deployment, speech, radio, or execution is ever triggered by the engine.

**Do not confuse:** produced artifact ≠ proven useful; clicked link ≠ agreed project; memory ≠ wisdom; signed hash ≠ signer authority; Static OS experiment ≠ production booted Static OS.

## Exact source pin

JAR;VIS ships a frozen local *read-only runtime snapshot* of source-owned Static OS experiment `experiment/recomposer-002-toaster-witness` at commit

`e25bb810295c79b2b663f8bd8f8b5fe278c82914`

The pinned upstream code lives in PR #98 (recomposition) and PR #99 (Toaster-style witness memory). JAR;VIS keeps the actual Python algorithms exactly as written in Static OS, rather than reimplementing the source-owned compilers in JavaScript. The small JSON bridge is source-owned too. On open, JAR;VIS verifies each pinned Git blob digest; if the snapshot was altered, it refuses. CI independently checks exact byte identity against the pinned Static OS commit.

JAR;VIS is only the localhost attendant, UI and permission/persistence boundary. Source publication and code integrity are different from granting external action authority. The wrapper launches the fixed bridge with Python `-B -I`, a five-second subprocess time budget, and a bounded JSON envelope. It never downloads or executes visitor-supplied code.

Source-owned provenance:
- `the-static-collective/static-os`, `question_first/recomposer.py`
- `the-static-collective/static-os`, `question_first/recomposer_witness.py`
- `the-static-collective/static-os`, `scripts/recomposer-bridge.py`
- Conceptual memory pattern: `the-static-collective/the-haunted-toaster`, `src/full-measure/src/memory/*`

No Haunted Toaster render receipt, image, creative score, user judgment or file is imported. The Toaster remains authoritative over its actual outputs.

## Local data

`JARVIS_JOURNAL` determines the main journal path. This feature writes its separate local journal at `JARVIS_JOURNAL + ".recursive.jsonl"` **only after an explicit feedback or remember-card action**. Read-only proposals do not create a history event. The records do not contain the question but contain topic choices, digest-linked plans and user feedback. A single local operator controls this notebook; it is not suitable as a public multi-user learning service.

The journal replays with the existing JAR;VIS content chain and independently revalidates the Static OS memory state. Hash chains are not signatures and do not protect against a local operator deliberately rewriting the whole file. With missing Python, modified snapshot or invalid journal, the recursive service returns HOLD instead of stopping the unrelated JAR;VIS workbench.

There are explicit limits on input length, size, source graph size, feedback history, artifact observation count, subprocess runtime and reply bytes. You can remove the journal to reset the local learning history, after backing it up if desired.

## Operator and safety boundaries

- The human-origin question is only processed by the local source runtime, not uploaded or automatically persisted.
- Origin/Host validation and anti-CSRF protections from JAR;VIS's existing localhost server apply to every POST.
- No passwords, exact locations, medical details, or other people's personal data should be entered; the route engine is not a secure secrets vault.
- The current UI offers only a small fixed source-owned catalogue of public Abundent doors. It cannot invent missing capabilities or infer actual partner availability.
- Unknown questions remain uncertain; source-owned candidate families are proposals, not a live generative model.
- All feedback is self-reported and may be mistaken. There is currently no held-out evaluation demonstrating improved performance or intelligence.
- No automatic learning across unrelated website visitors or remote user identities; this is a **single-operator local research feature**.

## Verification

```sh
npm test
# Specifically:
node --test test/recursive-workshop.test.mjs
```

CI obtains the **exact** source-owned Static OS commit and checks snapshot equality, so future edits to the upstream experiment cannot silently change this runtime.

## Future gate

The web Hello entrance could later use a **read-only proposal adapter** after a public consent and data-retention design, but should not inherit this local journal or silently transmit user words to a remote model. GHoT could later provide separately admitted real capabilities, but discovery is not authorization. A proper advancement test must compare candidate configurations on held-out cases and reject regressions before calling the machine more intelligent.

**Law: QUESTION ≠ COMMAND · PROPOSAL ≠ ACCEPTANCE · INFLUENCE ≠ AUTHORITY · LOCAL WITNESS ≠ REAL-WORLD OUTCOME.**
