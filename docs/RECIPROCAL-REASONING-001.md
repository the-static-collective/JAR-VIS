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

## MOTIF-023: The human goal handshake

The new `/goal` localhost page and `POST /api/reciprocal/goal` create a **human-facing, local-only dialogue about what counts as enough**. This differs from the old reciprocal comparison: the user's bounded original text is supplied through a **source-pinned Python MOTIF-023 process on their own device**, not a hosted model. The text is never saved, sent to a public sensor, passed to GHoT, or used to train a model. CSRF, localhost binding, body size checks, source Git-blob verification and Python process timeouts apply.

The initial narrow research distinction is whether **one recent USGS public river report** is enough or whether **reports specifically from both Blue Earth and Le Sueur** are needed. Source-owned GHoT-004 made one versus two real public GETs for those different completion contracts. These are *historical measurements*, not forecasts of resources for the next task. If the request doesn't specify an age threshold, the dialogue asks for one (1, 6, 12 or 24 hours). Only the 12h contracts have source-backed prior execution evidence. Unknown requests and high-stakes flood/bridge/road safety requests HOLD rather than invent a source or an answer.

The actual protocol is `ASK_ONE_DECISIVE_QUESTION` → `CONFIRM_REQUIRED` → `READY_HELD_NO_EXECUTION`. A user confirms the **exact SHA-256-identified evidence contract**, not a vague preference. Even after confirmation, **no public-source requests, external work, code changes or authority transfer occur**. The last status is a HELD research plan until a separate execution adapter is built and explicitly authorized.

The finite parser does not have general natural-language comprehension. In particular, it refuses ordinary nonriver community needs rather than claiming broad utility. Synthetic tests verify conflicting answers, uncertainty about recency, named-source preservation, no question persistence, exact-contract consent, and the localhost API's CSRF gate. The upstream MOTIF Python source commit is `5051af387eb05f1611d7f12e473dab58078719cb`, and its physical evidence is pinned at upstream Git blob `ee545add1b71f97eb3fae2e5151398f81814a89b`.

To try it locally, run `npm test`, `npm start` and open `http://127.0.0.1:7789/goal`. No public deployment. The unresolved next question is whether **real people** agree that this is the right clarification and the right definition of done.

## MOTIF-024 — Two examples, or show what enough means in your own words

The earlier `/goal` page asked abstractly about one or two river sources. This version makes that question concrete by offering **exactly two illustrative finished-answer examples**:

- **A:** A single USGS public river discharge report from any one of three fixed gauges, timestamped within the last 12 hours, would be enough.
- **B:** Distinct recent discharge reports from **both** the Blue Earth and Le Sueur gauges, each within the last 12 hours.

Each card asks **"Would this be enough?"**, plus a separate **"Or type your own example"** field. The human can correct the interpretation before and after a draft contract is shown. A clear custom example such as "One report from within the last 6 hours would be enough" creates a **different** formal contract, without falsely inheriting the older 12-hour GHoT-004 resource measurements. A custom description with no time cutoff triggers one explicit follow-up rather than assuming 12 hours. Unsupported, negative, high-stakes or semantically ambiguous custom examples remain HELD, and the person's original wording is never silently overwritten.

Correcting a draft produces a **new SHA-256 contract identifier**; old confirmation is no longer valid. The page requires fresh acknowledgment for the corrected meaning. This is **in-session correction**, not memory or autonomous model training. The corrections and raw user input are not sent to any cloud service or saved to the local review journal. Even approved goals remain `READY_HELD_NO_EXECUTION`. There is no query to USGS, no execution, no bill, and no inferred electrical energy measurement.

The new source-owned kernel is `MOTIF/experiments/024/goal_examples.py` at immutable commit `66dbc1a1b566609a4fc7cf0764bc374e31842d15` (Git blob `b5f8b21a13819ff6eb7c3ce06f02b71966f5cc06`), vendored byte-identically at `integrations/experiments/024/goal_examples.py`. JAR;VIS's local-only `POST /api/reciprocal/examples` uses a bounded subprocess with exact source integrity checks, localhost Host/Origin/CSRF restrictions, and no persistence. Node integration tests confirm two alternative examples, arbitrary typed example, required age clarification, revision invalidate/reconfirm, hold for unsafe requests, and no journal writes.

The interface is still **limited to this small river research grammar**, not a general human-goal understanding model. It has no evidence from actual human-participant evaluations that these examples reduce misunderstanding or improve user outcomes; that remains an independent test. See [MOTIF-024 PR #53](https://github.com/the-static-collective/MOTIF/pull/53).

From this experimental branch, run `npm test` then `npm start` and open `http://127.0.0.1:7789/goal`. The page is not a public deployment.

## MOTIF-025: Composable examples across community and technical goals

The local human-facing `/goal` interaction now runs an experimental general **completion-criterion composer** rather than presenting two fixed river examples. A bounded source-owned cartridge registry offers two specific, visibly competing definitions of "enough" for supported contexts: **donated coffee for gatherings, volunteer staffing, community events, grocery exchange, websites and research**. Multiple overlapping categories and unrecognized requests get transparent, generic possibilities, **not a fabricated declaration of understanding**. Public river-report requests still travel through the unchanged MOTIF-024→023→022 source-evidence chain. No older physical measurement is falsely transplanted to donation or other real-world outcomes.

A person saying *"Can we get free coffee donated for our fellowship event?"* sees:
- **A / immediate outcome:** one donor confirms supply for the next gathering, with quantity, contact and pickup/handoff.
- **B / repeatable outcome:** a donor commits to coffee for at least two gatherings, with schedule, quantity and pickup/handoff.
- **Or type your own example:** the person can state an entirely different completion condition. This raw user text is returned only to the **same local page for exact confirmation**, labeled `HUMAN_TYPED_UNINTERPRETED`. It is not inferred to be technically validated or stored in persistent files.

Selecting a proposed result forms a **new SHA-256 evidence contract**. Editing the goal, choosing the other example, or typing a different criterion changes the digest and invalidates prior approval. The human confirms the *exact proposed definition*, not permission to perform it; status remains `READY_HELD_NO_EXECUTION`. Repeated-event requests cannot silently become one-time milestones. Safety and emergency decisions HOLD.

**Trust boundary:** `POST /api/reciprocal/compose` uses the existing local server's Host/Origin/CSRF defenses and a short-lived Python subprocess. JS source pin `src/motif-composable-goals.mjs` verifies source-owned MOTIF-025 byte identity to commit `1c3c6d3474c096ce2403902a1bc5a19f1633c344` and Git blob `47a3425c6a42bd028a836ac136223f5503e7ad9d`, together with older 024/023/022/GHoT physical-receipt pins. GitHub CI independently checks the copied file's exact upstream bytes, native source syntax and the Node integration tests.

This is a **finite cartridge-based reasoning framework**, not a new large language model and not demonstrated unconstrained example generation. No donor has actually been contacted, no physical service completed, no notification dispatched, no source query made and no network/credit/energy savings claimed for these community tasks. Human-participant feedback and objective task-completion usefulness are not yet measured. The next stage should ask real people whether a proposed option was a helpful representation of *their* intended outcome, and record a private, opt-in correction receipt without treating it as permanent authority.

This development is on [MOTIF-025 PR #56](https://github.com/the-static-collective/MOTIF/pull/56) and the stacked experimental JAR;VIS branch, **not merged or deployed**.

## MOTIF-026 — From a confirmed goal to four **real local work artifacts**

Human-defined success is not the same as permission to take action. The `/goal` page now has a **second explicit button**, shown **only after** the person's SHA-256-identified completion contract is confirmed:

> **Yes — prepare my local work kit.**

This authorizes only `PREPARE_LOCAL_PACKET_ONLY`, not contacting donors, publishing invitations, retrieving environmental data, deploying apps, sending email or collecting money.

The local JAR;VIS `POST /api/reciprocal/prepare-work` endpoint independently verifies the person's original text, selected example or custom wording, accepted exact SHA-256 goal digest, `consent:true` and the exact action. It calls the source-pinned MOTIF-026 `prepare_work.py` via bounded **local Python** only. A contract whose meaning has changed since confirmation **HOLDS**, as does missing or wrong action permission. Neither the user input nor the resulting materials are persisted to JAR;VIS's journal.

On success, JAR;VIS's own deterministic, offline `src/motif-goal-workpacket.mjs` renders **four actual, inspectable text-based files in server memory**:

1. **Action checklist (.txt)** — human-accountable steps and what remains unverified.
2. **CSV tracker (.csv)** — blank structured columns, no invented donors, commitments, verified matches, or completed results.
3. **Unsent contact draft (.txt)** — a *draft only*, with no real recipient, no delivery and no implicit third-party authority.
4. **Printable HTML work page (.html)** — escaped user-provided text, task checklist, and places for real evidence/witness.

The browser presents each for review and provides a separate **Download this file** click. Nothing downloads automatically, and no file is saved to the operator's device until that click. There are no hosted LLM calls or paid token/credit costs. Attribution of electrical Joules remains unknown, and the physical-source river branch still does not issue a public USGS GET or safety instruction.

The source-owned recipe at `MOTIF/experiments/026/prepare_work.py` is pinned to upstream commit `a4af07cb48c201d22e34b5569496a4ac1d3deb58` and blob `529b0cea7259b1314122d6e0a5d8331f16713180`. JAR;VIS's CI checks the exact bytes and new negative tests, rendering, signature binding, XSS escaping, localhost-only CSRF, and no review-journal mutation.

**No real-world outcome is claimed.** Preparing materials is useful work but not a confirmed coffee donation, volunteer arrangement, public website or energy savings. Future outbound actions must require their own independently reviewed capability, separate permission and evidence of actual delivery.

To reproduce on the experimental branch:

```sh
npm test
npm start
# open http://127.0.0.1:7789/goal
```

**Research status:** Source-owned experiment and UI review branch, not merged or publicly deployed.

## MOTIF-027 — The Last Inch: choosing an actual local application

The next frontier moves from producing useful standalone materials toward **explicitly selected application handoffs**, without treating goal approval as permission to contact anyone.

When the user confirms an exact completion contract on local `/goal`, the page offers **Show my available local actions**. That calls a source-owned deterministic capability router, not a hosted LLM. Only supported local options are presented for that specific domain:

- **Local work kit**: MOTIF-026's separate preparation grant, producing checklist, CSV tracker, unsent draft and printable page. The user must click to download individual files.
- **Static OS local workshop prefill**: an explicit button transfers the human's original question to the existing `/workshop` text box as a *one-use local browser URL fragment*. The receiving browser script immediately removes the fragment from the address bar. **It does not run `Recompose`, record feedback, create files or save any work**; the operator reviews and clicks separately.
- **Mail-app composer handoff**: supported only for community/outreach domains such as donated coffee, volunteers, gatherings and local food exchange. The person must **type exactly one recipient** and review a subject/body. No donor or contact is inferred from a search, scraped, or assumed to exist.

The mail-app path is deliberately **three-stage, user controlled**:

1. Person enters a recipient, subject and body and clicks **Preview exact email draft**. The source verifies the same already-confirmed goal and returns a digest of **goal ID + recipient + subject + full message**, *without* an outgoing link.
2. A separate **Authorize opening a draft in my email app** button replays those exact bytes with `open_consent:true` and `open_permission:"OPEN_LOCAL_MAIL_COMPOSER_ONLY"`. If the recipient, subject, body or goal ID changed, the source **holds** and requires a new preview.
3. The UI reveals **Open my email application (unsent draft)**. Only this final link is a `mailto:` URI that the person explicitly clicks. The mail app may or may not be installed, can ask to sign in, and may still require a send click. **Opening or preparing a mail draft is not proof of sending or delivery.**

Underneath, `POST /api/reciprocal/handoff` runs the byte-pinned MOTIF-027 `capability_handoff.py` source through the same bounded local Python bridge, behind existing localhost Host/Origin/CSRF requirements. JAR;VIS independently verifies source identity, domain-appropriate route, exact encoded `mailto:` subject/body/recipient, no SMTP, no network sends, no journal mutation and no invented delivery receipts. It does **not** connect Proton, Gmail, Google Drive or any email provider and holds no sender credentials.

MOTIF source: `the-static-collective/MOTIF`, commit `073d1ffb70a8389a9727dfe0d50db6d0605164b2`, Git blob `475a0c6db2d3c97f4a8928e0deb7a9bd3c0da2e8`. It is still in an experimental PR, not merged or publicly deployed.

Run `npm test`, then `npm start`, and use `http://127.0.0.1:7789/goal`. The Python source relies on MOTIF-026/025/024/023/022 source-pinned local dependencies. The separate source-owner tests validate invalid recipients, header injection, stale goal and mail preview digests, missing consent and no asserted delivery.

**Scientific and capability limit:** This is a functioning bridge into a user's **own existing mail application composer** or a **local workshop input**, not an authenticated email sender, verified outreach event, validated donation, automatically executable GRAFT capability, autonomous multi-app access or guaranteed operator benefit. No external power/energy Joules were measured, no purchased model tokens were used, and no assertion of general natural language understanding is made.
