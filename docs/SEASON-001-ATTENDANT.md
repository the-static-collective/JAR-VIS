# JAR;VIS SEASON-001 — field-witness doorway

This experimental attendant adds a **separate** doorway to [CANNON's SEASON-001 draft PR #51](https://github.com/the-static-collective/CANNON/pull/51) at immutable commit `63925118a42ef307fa274443fa9f81957c5a6682`. It stacks directly on JAR;VIS's existing [Stranger Arcade PR #31](https://github.com/the-static-collective/JAR-VIS/pull/31) and leaves its independently pinned native 22-owner runner unchanged.

The CANNON owner implements an append-only evidence ladder, SHA-256 receipts, consent HOLD, issuer-only release, refusal and withdrawal. JAR;VIS **does not copy the implementation**. It uses the existing JAR;VIS `inspectCannon` operation to verify exact CANNON Git commit, source tree, tracked file bytes, origin and immutable ancestor chain before delegating to three fixed source-owner CLI operations.

Only these actions are available:

- `inspect`: exact source inspection; no output file, grant or foreign execution.
- `verify`: read and inspect a local dossier using original CANNON source; no new grant.
- `demo`: generate fictional local-only test dossiers, with explicit `LOCAL_FICTIONAL_ONLY` authorization. No participant records or outreach.

```sh
# CANNON checkout MUST be at the exact SEASON-001 pin, with full Git ancestry.
node tools/season.mjs inspect --cannon ../cannon
node tools/season.mjs demo --cannon ../cannon --out ../season-demo --authorize LOCAL_FICTIONAL_ONLY
node tools/season.mjs verify --cannon ../cannon --ledger ../season-demo/fictional-garden.json
```

The `verify` command checks the ledger's internal chain and structural rules. It cannot authenticate independent witnesses or confirm a real-world outcome. No stage in this pilot authorizes venue use, human experimentation, contact, publication, payment, disbursement, or application submission. Existing current and proposed institutional applications remain drafts until a human explicitly chooses to finalize and submit them.

**Next season plan:** invite a genuine outsider to cold-replay a technical build; preserve their objections; secure separately documented human safeguards, local stewardship and site permissions before any bounded community trial; assess whether someone actually benefited; grow into music/food gatherings and optional festival branches only on evidence and participants' voluntary choices. The large festival remains a proposed event, not a venue booking or confirmed funded outcome.

Review-only draft PR. No merge or deployment requested. This wrapper's tests are narrower than CANNON's native machine suite.
