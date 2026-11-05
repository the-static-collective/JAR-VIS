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

## Environmental reality witnesses (MOTIF-015 and 016)

The reciprocal page now displays **two actual source-backed experimental receipts**, independent of the synthetic route-ranking routine:

- Archived Open-Meteo forecasts against NWS KMKT physical station reports: 88 aligned pairs; 30 held-out; raw weather MAE **1.6000°C**, adjusted MAE **1.6126°C**; adjustment **lost**.
- USGS Blue Earth, Le Sueur, and Mankato streamflow reports: 324 aligned hours; 178 train, 64 validation, 82 held-out test. Validation preferred cross-gauge regression; on the untouched test its MAE was **20.9575 cfs**, compared with **13.1402 cfs** for persistence (candidate **lost**).

The cards are checked against exact upstream Git blobs from MOTIF commit `23267b297094012d81525ddef2c5c36d6a5560b2`; GitHub CI independently checks byte equality against the same source commit. This protects against unreviewed changes in the checked-in research receipts, **not** against errors or manipulation in upstream station services. The original raw public API responses were not archived; the source-produced SHA256 fingerprints are available, but those are not standalone proof of independent agency-source verification. The research ledger **does not promote any model**.

The operator may inspect the evidence at `GET /api/reciprocal/environment`; the `POST /api/reciprocal/compare` response includes it as a separate `realityIron` sibling to the local route-proposal comparison. **Environmental measurements are not fed into the synthetic route heuristic as authority.** Instead they falsify the proxy's presumed value and create controlled future test candidates.

Both experiments returned HOLD. This is deliberate scientific pressure on the meta-diagnostic: a method that wins on validation can still fail on later physical observations. A *longer imagined plan* is not a *more accurate environmental prediction*.

The next receiver-owned admission gate must independently archive raw provider snapshots, use locked out-of-sample hydrologic episodes and reliable forecast-issue-time metadata, then compare any JAR;VIS/MOTIF proposed strategy against persistence and classical hydrology. Do not use these experimental metrics to send environmental alerts or affect public safety.

Source run: https://github.com/the-static-collective/MOTIF/actions/runs/42030670309

## MOTIF-017: learning through disagreement with itself

We then actually challenged the 016 conclusion in a **pre-registered, two-stage retrospective replay of the documented June 2024 flood**. This was not a 2024 issued flood prediction: it is archived sensor data evaluated now. Source commit `9f238548a0c1d8bcb6034df0e6992950541b40b8`; immutable proof-of-research receipts in `integrations/motif-reality-017/`.

Result (117 complete of 264 possible hours; 32 rising-flow cases):

| Frozen strategy | 2024 event test MAE |
| --- | ---: |
| Original validation winner, cross-gauge ridge | **1,293.0220 cfs** |
| Cautious origin-only out-of-distribution fallback | 1,966.8894 cfs |
| Simple persistence | 2,027.3504 cfs |

**The new cautious policy was 673.8674 cfs worse than the original method on the complete-case event subset**. This does not establish the original method as generally superior: the June 2024 flood had **only 44.32% complete joined sensor coverage**. The Rapidan dam crisis affected gauge power; the scored subset may be systematically biased toward hours with functioning sensors.

MOTIF's meta-diagnostic produced three evidence-backed *hypotheses*, not changed weights: (1) no universally best complexity level across distinct regimes, (2) excessive caution and inaction have measurable costs, and (3) the diagnostic itself may be learning from selectively observed data. It explicitly permits its own inadequacy and proposes event-blocked replication, dropout tests, and a predeclared cost of inaction.

JAR;VIS loads the exact source-owned 017 event and metadiagnostic Git blobs, verifies their integrity, and displays the new negative evidence and self-challenging question alongside 015/016. The original synthetic MOTIF-003 route comparison and separate consented local opinion journal remain independent. Nothing in this bridge automatically admits a learned rule, changes weights, contacts the public or acts as a flood warning.

**Real source-backed run and raw response archive**: https://github.com/the-static-collective/MOTIF/actions/runs/42034382151 . Source file integrity is not independent sensor authentication. Manual receiver review required before merging.

## MOTIF-019 — the evaluator questions the worth of its own questions

The local reciprocal laboratory now includes a **six-iteration evidence-driven question-kind evolution** from source-owned MOTIF-019, using two sealed Git research receipts. The new question kind is `source_health`: asking whether a sensor seems available before paying for its measurement. All source-observation timestamps are historical (a proxy for availability); no actual historical health request or real-time flood forecasts occurred.

The six-stage development loop on previously inspected 2025 USGS data selected dual-source queries at zero hypothetical cost, then chose **downstream-only** after imposing research credit costs. It retained downstream-only through the added missing-answer penalty, conditional question, historical health-probe question, and false-positive-health penalty. This is one genuine change in selected criterion, **not six trained improvements**.

The independent March 2026 historical test contained **300** downstream hours. Both upstream sources were jointly usable on only 35 hours; Blue Earth had 35 and Le Sueur 116. The frozen downstream-only policy had **185.3333 cfs MAE**. The unselected hypothetical historical health-probe option had **150.4962 cfs raw MAE**, but **261.5924 cfs-equivalent declared weighted objective** vs **213.7933** for the zero-query baseline. The outcome appropriately **HOLDs**; the unselected lower-error method cannot be retroactively admitted.

Crucially, the *price of one extra question was invented by our own evaluation*, not measured: **37.382353 cfs-equivalent**. A posthoc cost-sensitivity diagnostic shows that, on the observed 2026 sample, the historical health-probe strategy would only have won that stipulated score under a credit price below **18.8795**. This is not an empirically calibrated real-world threshold and cannot be used to revise the frozen 2026 selection.

MOTIF's new deepest question:

> Are our research-credit prices the wrong question? What actual latency, missing-answer and opportunity costs justify asking?

JAR;VIS shows this observation and the unresolved question on `/reciprocal`; its local `GET /api/reciprocal/environment` report includes `questionAboutQuestion`. Validation rejects attempts to pass 019's negative result as an independently proven improvement. The exact JSON is compared by CI to MOTIF source commit `1bb4028141eb20a8798bed338dcb3d851284de22`. Source run and temporary original raw USGS responses: https://github.com/the-static-collective/MOTIF/actions/runs/42040857789 . Neither Git hash identity nor machine-generated source hashes authenticate original agency measurements.

The physically meaningful next experiment should record actual query arrival, latency, missingness and meaningful operator-defined opportunity costs *at real issue time*, then freeze a policy before observing new future outcomes. The present implementation remains historical, non-operational, and without independent source authenticity or action authority.

## MOTIF-020 — credits-free computation witness from GHoT

JAR;VIS now displays **actual source-backed GHoT resource instrumentation** alongside MOTIF-015 through 019. The GHoT source owner measured 5 trials each of 250 repeated exact-answer tasks: full source validation on every question vs source-hash-checking and reuse of the previously validated answer.

- Full parse/validate median: **100.425 ms process CPU per 250 tasks**.
- Content-verified reuse median: **28.377 ms CPU** on the same GitHub runner and repeated workload.
- Identical answer digest; both modes read 2,426,750 bytes each per trial; parsing reduced from 250 times to 1.
- **No attributable electrical energy measured**. Joules, watts and CO₂ explicitly remain `null`. The built-in GHoT power state/scheduler was dry-run evidence, not an actual body capability, scheduling assignment or dispatch.
- No scalar token/credit price can replace actual CPU ns, IO bytes, network bytes, latency, thermal state or operator-defined urgency.

GHoT source-owned PR #135 (https://github.com/the-static-collective/GHoT/pull/135) holds the physical runner receipt; MOTIF-020 PR #40 (https://github.com/the-static-collective/MOTIF/pull/40) checks the source receipt's raw trials and composes a HELD next question, not an automatically accepted runtime optimization. JAR;VIS pins its independent MOTIF source commit `aa838a2c419edf5cb19afc15f76b5793e2fe8855` exactly and displays its receipts read-only. Its compare and response graph still use the original unchanged synthetic affordance kernel; the physical resource witness has **no extra authority**.

Next question: Can validated answer reuse reduce cost on actual operator devices without losing source freshness, accuracy or the benefit of a timely answer? Measuring process CPU on a Linux runner is not a substitute for physical watt-hours, battery drain, or real network query-latency receipts.

## MOTIF-021 — source-verified physical question integrity

GHoT-002 revealed a **real self-inflicted protocol error**: its first public USGS request used a date-only interval and accidentally stopped at midnight, falsely making three responding public river sources appear too old for a 12-hour freshness rule. That first receipt had HTTP 200 for all three, 824,285 public response bytes and about 1.567 seconds summed request time, but contained **no source observations from the intended daytime interval**.

GHoT-002 was then repaired to request **complete UTC timestamp intervals** and fail closed on date-only URLs. A second physical run discovered a recent reading at all three river stations, with 822,771 bytes returned and 1.839 seconds of summed individual HTTP request time.

The next, GHoT-003, was an independent **actually executed conditional request**, not a counterfactual replay: it asked Blue Earth only, observed public reported `2580 cfs` at `2026-11-05T14:00:00Z`, and stopped. **Exactly one HTTP GET, 270,808 body bytes, 746 ms request wall time.** Le Sueur and Mankato were **not** contacted in that run. Comparing that one-call run to the earlier three-call run does **not** establish causal network or energy savings, since they occurred at different times. Physical energy Joules are still `null`.

MOTIF-021 pins these three source-owned GHoT experimental receipts, catches the false inference, and asks whether a reasoning engine can test its *question encoding and time-window contract before consuming resources*. JAR;VIS now displays the result as `protocolIntegrity` separately from the original synthetic MOTIF route scoring. The upstream source fix was human-approved, not autonomous code evolution. The exact Git blob `b5cfe73c96ab908a8e87de73e90486fc0ab0ad66` comes from MOTIF commit `cdcec6013492bb6ccd0982ee9af9f5bf1d3200f7`.

Source-owned GitHub reviews: GHoT-002 PR #136 (https://github.com/the-static-collective/GHoT/pull/136), GHoT-003 PR #137 (https://github.com/the-static-collective/GHoT/pull/137), MOTIF-021 PR #45 (https://github.com/the-static-collective/MOTIF/pull/45). No automatic promotion, physical dispatch, flood-warning authority, token-credit pricing, independently calibrated energy measurement, or claim of generally optimal query behavior.
