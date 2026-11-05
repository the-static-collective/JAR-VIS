# RECIPROCAL REASONING 001 — JAR;VIS × MOTIF

**Status:** Proposal-only, local implementation. Not a self-modifying AI, an autonomous agent, an action executor, a public service, or evidence that a method improves general reasoning.

## Try it

With Node.js 20+ and Python 3.10+ installed:

```sh
npm test
npm start
# open http://127.0.0.1:7789/reciprocal
```

The browser submits one local question to JAR;VIS's existing source-pinned Static OS Recursive Workshop. JAR;VIS constructs a bounded candidate family (up to six proposal-only route sequences). **Only the topic route names, local heuristic scores and candidate IDs cross to MOTIF.** No raw question is passed into the MOTIF Python process. No raw question or comparison is saved automatically. An optional explicit operator opinion about the comparison can be stored in a separate local hash-chained journal; it is not independent proof of real-world success.

The unchanged, locally bundled MOTIF-003 `experiments/003/affordance.py` algorithm (upstream Git blob `db25da0d50a9c8e2cd87aa576a22f969405737cf`) analyzes a synthetic field where selecting a route makes its next step available. Two predeclared policies compare (a) immediate workshop relevance score against (b) number of newly available *synthetic route continuations*. The ranking may disagree with JAR;VIS's original baseline and is returned as **a proposed alternative only**. The local adapter is `integrations/motif-003/bridge.py`; Node host is `src/motif-reciprocal.mjs`.

Both peers then issue bounded critiques and held-for-test improvement candidates:

- **MOTIF → JAR;VIS:** When a differently ordered route creates a simulated continuation, ask whether that alternative is useful in independently evaluated tasks before considering a router change.
- **JAR;VIS → MOTIF:** A continuation count only measures the shape of the supplied sequence. It is *not* verified opportunity, new skill, causation, or human usefulness. Improve the metric and evaluate out of sample.

## Proven / not proven

**Implemented:** optional consented, bounded local opinion journal (64 records maximum); per-comparison anti-replay; source-pinned, content-addressed HELD_FOR_TEST improvement-cartridge export; feedback summary on subsequent questions, but **no automatic change to any reasoning weights**. Also: exact source-blob verification before each native call, isolated Python invocation with output/time budgets, strict input schema, deterministic native affordance search, an HTTP route with existing local Host/Origin/CSRF constraints, UI, tests, and two-way *diagnostic proposals*.

**Not implemented:** independently verified evaluation of the operator's reports, automatic code modification, meta-learning, independent witness verification, dynamic causal inference, model benchmarking on held-out human tasks, real-world action dispatch, federated shared memory, authenticated users, persistent improvement cycles or self-correcting runtime deployment.

The result is intentionally *not* called improved intelligence: a multi-step route will structurally have more continuation moves than a single-step route. That's a useful falsification test for the simplistic metric. The bridge must not promote its own score into a source of truth.

## Admission gate for RECIPROCAL-002

Before methods may improve anything automatically, freeze evaluation tasks and strong baseline methods; record independent outcomes with consent and provenance; compare task success, cost, decision quality, time-to-action, errors, and unnecessary question loops; HOLD on regression. Code changes remain human-reviewed PRs, and source-specific authorities remain at their sources.

**Law:** question ≠ command · source pin ≠ author identity · route continuation ≠ capability · observed output ≠ observed effect · peer agreement ≠ independent truth · recommendation ≠ authority.

## Operator feedback and improvement-cartridge contract

The optional `POST /api/reciprocal/review` endpoint accepts only a comparison issued by the same local process, one of its specific candidate IDs, an operator `helpful` / `not_helpful` assessment, and `consent:true`. It refuses arbitrary/mismatched candidates, repeated assessment, and journal overflow. The accepted event is explicitly `UNVERIFIED_OPERATOR_OPINION`, not independent human task success. Raw questions are never journaled. The separate local file is `JARVIS_JOURNAL + ".motif-reviews.jsonl"`.

For each comparison the bridge also produces two content-addressed `jarvis.motif-improvement-cartridge/v1` JSON objects with `HELD_FOR_TEST` status, a source blob pin, proposed adjustment, explicit evidence limitations and a required independent evaluation method. The user can export them via the browser, but **nothing imports, admits or applies them automatically**.

This establishes an inspectable *feedback cycle* without claiming that feedback is currently making either model more accurate. The next milestone is a proper frozen evaluation loop with independent observation and tests that can reject both the routing policy and the affordance diagnostic.
