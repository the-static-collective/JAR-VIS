# LIVE OFFER 001 — deterministic cartridge consumer

`node tools/live-offer.mjs --offer "I can play guitar for 20 minutes right now"`

This real JAR;VIS Node tool reads `cartridges/live-offer-001.json`, validates the proposal-only data contract, interprets stated timing/domain, and returns a ranked action tree. It **never executes** the actions or infers a human commitment. A `--when later` override respects operator choice; optional `--cartridge` accepts another locally reviewed JSON of the same constrained schema. Source-owned execution of browser media and private human review remains in `the-static-collective/webZ/jubilee/live/`; JAR;VIS outputs **plans**, not signed reLATTE crossings or verified outcomes. `node --test test/live-offer.test.mjs` checks its boundaries.
