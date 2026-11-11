# JARVIS-STUDIO-001 — The six-repository return-loop screening film

**Experiment:** JAR;VIS actually plans and supervises a complete **local review artifact**—a two-video microfilm screening package, original lemonPRESS poster/program, four source-linked plan/receipt returns and finished manifest. This is a bounded human-authorized research workflow, not an autonomous production company, model-directed shell or licensed public release.

## Actual six source owners and their jobs

| Repository | Genuine contribution | Source/authority limit |
| --- | --- | --- |
| **JAR;VIS** | Starts with an actual film brief, chooses an evidence-tested route, writes each return, checks the next required step, independently reviews editorial draft and assembles an inspectable local package | Source-owned coordinator, deterministic, synthetic-only; no independent human approval claim |
| **planZ** | Original `reactor/production-return.mjs` compiles **four distinct rounds**, each bound to the exact hash of the prior receipt; refuses advancing without a real evidence return | Planner proposes next work, does not approve/execute code |
| **CANNON** | Original source-locked `creative-route-switchyard.mjs` selects/executes/independently verifies two different proven native media routes | Exact original pinned route source, local explicit grant only; no generic adapter |
| **PlayDeck** | Original Genesis001 Remotion renders a genuine PNG first, and moving video/audio second | This is a four-second moving excerpt, not the entire independently proven 266-second Genesis |
| **Haunted Toaster** | Its original pinned renderer makes checkpoint film; its original VSPantry/foreign material renderer makes the moving transformation and original Dogram/video receipts | Correct owner versions for checkpoint vs motion; no rights inference |
| **lemonPRESS** | New original source-owned `src/screening-program.mjs` creates a screening poster, playable two-film HTML program and original receipt, **twice**: draft, then revised final responding to JAR;VIS source/rights review | Local experimental film program, *not* vinyl manufacturing, publication, master copy or licensed print distribution |

Original independently reviewable source owner branches:
- CANNON INSPAND-018  PR #89, commit `18381a447db3310927e003ec36989840133e98b8`.
- planZ PLANZ-PRODUCTION-001 draft PR #40, commit `aac8349ee9be9cdbeae37f15fe13de7405ff11fd`.
- lemonPRESS SCREENING-RETURN-001 draft PR #65, commit `f60429311ba2d5fec3b1442ab783025872987a12`.
- PlayDeck original `a7cf718421e767fd382a01894063c3eeba3d2930`.
- Haunted Toaster original checkpoint `3652c2a96b6b287cda316d1c92daadf7c7417eaf`; moving-video owner with correct pixel-range fix `a3ce7b1349a940325cb72362e818ce907a95f35c`.

## Genuine multiple-repository, multiple-pass creative feedback loop

```text
                 JAR;VIS PROJECT BRIEF
                         ↓
             planZ ROUND 0 — checkpoint
                         ↓
             CANNON selects original route
                  PlayDeck STILL
                  Toaster video + Dogram
                         ↓
             JAR;VIS verifies native receipt
                         ↶
             planZ ROUND 1 — moving source
                         ↓
             CANNON selects different route
                  PlayDeck motion + audio
                  Haunted Toaster VSPantry
                  original Toaster video + Dogram
                         ↓
             JAR;VIS verifies two real MP4s
                         ↶
             planZ ROUND 2 — editorial draft
                         ↓
             original lemonPRESS draft compiler
                  program.html, poster.svg,
                  program.md, owner receipt
                         ↓
             JAR;VIS checks source media hashes,
             distinct source and output videos,
             native source receipts and rights hold
                         ↶
             planZ ROUND 3 — REVISED EDITION
                         ↓
             original lemonPRESS FINAL compiler
                  requires exact JAR;VIS draft
                  review and SHA identities
                         ↓
             JAR;VIS reviews final package,
             replays all four original source
             owners, creates final index/manifest
                         ↓
             FINISHED LOCAL SCREENING ARTIFACT
                 HOLD: NOT PUBLIC RELEASE
```

A "return" is a real source/production artifact with SHA-256, matched to the prior PlanZ round. The next round is computed **after** that evidence appears. This is materially more than an imaginary dependency graph or cosmetic repeated planning.

## Exactly what a finished artifact means

The output `index.html` links to the original lemonPRESS final `screening-final/program.html`; playable `media/original-playdeck-excerpt.mp4` and `media/original-toaster-digested-playdeck.mp4` are locally included. The film program also contains its original poster `screening-final/poster.svg`, production notes, media SHA256 lineage, original source checkpoint receipts and authentic original Toaster/Dogram records. A structured `production-manifest.json` certifies which original software owners contributed, their exact pinned commits, **four rounds, two actual native media render phases, two original editorial phases**, complete replay and nonpublication status.

The compiled video is the **four-second short** in original PlayDeck Genesis001. The independently verified full 266-second Genesis whole banana from prior INSPAND-017 is separately selectable in CANNON's creative switchyard; it is **not re-rendered** as part of the four-round microfilm package because that is much more expensive and unnecessary to demonstrate the repeated planning/creative handoff here.

## Reproduction

```bash
node src/creative-studio-cycle.mjs inspect

node src/creative-studio-cycle.mjs build \
  --planz /path/to/pinned/planz \
  --cannon /path/to/pinned/CANNON \
  --lemonpress /path/to/pinned/lemonPRESS \
  --playdeck /path/to/pinned/playdeck \
  --toaster-still /path/to/pinned/HauntedToaster-checkpoint \
  --toaster-motion /path/to/pinned/HauntedToaster-video \
  --out /tmp/jarvis-studio-final \
  --authorize SYNTHETIC_TEST_ONLY

node src/creative-studio-cycle.mjs verify \
  --planz /path/to/pinned/planz \
  --cannon /path/to/pinned/CANNON \
  --lemonpress /path/to/pinned/lemonPRESS \
  --playdeck /path/to/pinned/playdeck \
  --toaster-still /path/to/pinned/HauntedToaster-checkpoint \
  --toaster-motion /path/to/pinned/HauntedToaster-video \
  --out /tmp/jarvis-studio-final
```

The source contracts are locked by Git origin, exact Git commit and exact Git blob; receipt hashes are independently checked. The full pipeline fails if source, native video bytes, original Toaster receipt, original planZ return, lemonPRESS reviewer/draft or final program differs. A separate workflow step deliberately corrupts a real transformed video, demands rejection, restores original bytes and cold verifies again.

## What is **not** established

No broad model autonomy (JAR;VIS plan compiler here is deterministic, not an LLM), no source-owner merged changes, no publicly licensed soundtrack, no general arbitrary visual-story generation, no human panel acceptance, no actual time-savings measurement, no external delivery, no autonomous repetition, no vinyl manufacturing, and no publication or sharing rights. "Finished" here refers to a **self-contained local playback/review artifact**, not a commercially cleared finished film.

**Pass criterion:** source-owning planZ and lemonPRESS tests must be GREEN; the original JAR;VIS GitHub Actions job must actually execute two CANNON/PlayDeck/Toaster native routes, accept only actual original receipts and generate the final original lemonPRESS program. A plan alone is not the finished output.
