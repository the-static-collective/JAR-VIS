# STRANGER CABARET-003 — Ask the Ghost Cowboy

**Status:** experimental JAR;VIS creative doorway, stacked on the actual head of [JAR;VIS SEASON-001 PR #32](https://github.com/the-static-collective/JAR-VIS/pull/32). It does not change any prior CANNON or JAR;VIS source locks. The [CANNON source-owner field witness PR #51](https://github.com/the-static-collective/CANNON/pull/51) remains an independent draft; `main` is not silently adopted. This is an entertainment and reviewer-exploration surface, not an application submission or field participant portal.

## The experience

A visitor types a question into JAR;VIS's existing, **deterministic local rules attendant**. They receive the attendant's actual answer alongside a seeded, surprising creative performance:

- **GHOST RADIO:** an original 6/8, 92-BPM synthetic melody played only on an explicit click through browser Web Audio, plus original clown-cowboy song lyrics. It does **not** claim to be a Suno song, Haunted Toaster render or MP3.
- **SIX-PANEL MANGA:** a locally drawn comic starring the ghost cowboy, haunted appliance, serious answer, permission gate and stranger's next choice. It is HTML/CSS with text bubbles, not an external image-generation call.
- **HAUNTED FLIPBOOK:** manually playable CSS/text frames that animate a goofy review and a refusal/permission boundary. It is **not** an MP4 or native video generation.

`SURPRISE ME` selects the mode from a SHA-256-derived seed. `REROLL THE COSTUME` increments a bounded seed variant. Identical question, factual answer, requested mode and variant produce the same creative object. The entertainment never hides the actual grounded answer, and never upgrades the answer's factual authority.

The underlying inspiration is Haunted Toaster's distinction between **creative possibility** and **human KEEP/SCRAPE permission**. This PR does not call or bundle Haunted Toaster's renderer, Toaster score engine, manga generators, external models or video providers. The distinct native owners keep their own release and permission requirements. This is a real working local performance **adapter**, not a false 50-repository execution claim.

## Living Evidence Passport

Every answer carries a downloadable JSON passport with a question digest, answer digest, creative seed, media kind, mode variant, a digest of the passport itself, and explicit `publishableHumanSuccess:false` / `externallyVerifiedHumanOutcomes:0` / `externalDispatch:false` fields. The raw question and factual answer are **not included in the passport**. The record describes a *local creative output*, not a proved human need or benefit.

An optional second door accepts a **local, small, JSON SEASON-001 ledger**. When and only when `SEASON_CANNON` points to the exact native checkout `63925118a42ef307fa274443fa9f81957c5a6682`, JAR;VIS delegates verification to the unchanged original CANNON source through the already-established `tools/season.mjs` exact-lock procedure. The result is an internally chain-checked **reported** stage/disposition. It is not an independently authenticated person, custody record, venue permission, or field trial. A tampered ledger returns HOLD, not a success-shaped fallback.

The browser never asks for names, stores no conversations, calls no external model endpoint, sends no mail, pays nobody, and writes no participation journal. The local server handles question and optional ledger content in memory, with optional ledger bytes temporarily kept in private OS storage and deleted after verification. No field publication is authorized.

## Run

From this JAR;VIS branch with Node 24+:

```sh
# Default local synthetic workbench; the creative show works without CANNON.
npm start
# Open http://127.0.0.1:7789/cabaret

# Optional exact-pinned source-owner check for a local ledger:
# CANNON checkout MUST be at exact commit 63925118a42ef307fa274443fa9f81957c5a6682
SEASON_CANNON=/absolute/path/to/exact/cannon npm start
```

The same localhost CSRF protection, Host and Origin checks, no-store headers and restrictive CSP as the existing JAR;VIS workbench protect the new routes. The optional ledger is limited by both the existing JSON request body bound and a separate browser file-size limit. A source checkout is never automatically acquired or fetched over the network by a question.

Test the deterministic creative engine and the actual pinned cross-repository source verifier:

```sh
node --test test/cabaret.test.mjs
SEASON_CANNON=/absolute/path/to/exact/cannon node --test test/cabaret.test.mjs
```

The dedicated CI downloads the **fixed original source** and runs this test path together with the existing JAR;VIS attendant refusal tests. Independent real-world reproduction, actual participant benefit, browser manual-audio testing on other devices and final packaging are **not** claimed by these tests.

## Stranger prompts that reveal the machinery

- Ask about community food, proof, a receipt or cooperation: compare literal JAR;VIS answer to the ridiculous generated performance.
- Select SURPRISE ME, ask twice and inspect the identical seed/mode; then use REROLL to generate a different exact costume without changing the factual answer.
- Inspect the passport and verify it does not contain the question text or assert a human outcome.
- Try a corrupt source ledger; watch the real CANNON boundary refuse it, rather than seeing success theater.
- Bring a genuinely independent reviewer to run the same source and report which claims, failures and confusing elements they can substantiate.

A **later** native creative connection could opt into the original Haunted Toaster score/KEEP contract, an admitted music artifact, a real video renderer or manga engine. Any of these would require explicit source-owned admission, actual execution, media provenance, permissions, and separate tests. Do not turn this deliberately local initial prototype into a claim that those other systems already ran.

**Design law:** The clown may improvise. The receipt may not.
