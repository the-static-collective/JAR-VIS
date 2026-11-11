# CONSTELLATION-001 — source-pinned local evidence attendant

This owner-local CLI attends CANNON's review-only CONSTELLATION-001 experiment. It observes its exact source-locked commit and preserved #38 → #37 → #5 ancestry, verifies CANNON tracked bytes, and can invoke a bounded local fictional build only with explicit operator authorization.

The source lock is in `spec/constellation-source-v1.json`. Never replace it with moving main or a PR number. No private records, contacts, models, remote operations or physical actions are accepted.

```sh
# From this exact JAR;VIS contribution commit; CANNON acquired at the locked SHA.
node tools/constellation.mjs inspect --cannon ../cannon

# Acquire CANNON's exact donors once (explicit network step):
node ../cannon/scripts/constellation-acquire.mjs --into ../constellation-donors

node tools/constellation.mjs build --cannon ../cannon --roots ../constellation-donors/roots.json --out ../constellation-output --authorize LOCAL_FICTIONAL_ONLY

node tools/constellation.mjs verify --cannon ../cannon --roots ../constellation-donors/roots.json --out ../constellation-output
```

Open the generated `first-boot.html`: choose MIT Living Suitcase, Voqal First Circle or another institution's evidence-review doorway; inspect exact receipts and source-owned gates; explicitly authorize the fictional walkthrough, refuse or revoke it; download its evidence JSON or print the briefs. The browser presents the already computed original donor results and runs only a local fictional narrative. Node/Python source execution happens in the CLI build, not inside the browser.

CANNON's immutable donor pins include a separate unchanged JAR;VIS source cut. This attendant branch does not rewrite that donor's results or require it to adopt the new runner. The original ten-checkout/nine-donor experiment remains independently executable without this CLI.

All receiver policies and check-ins are fictional software exercises. reLATTE's ephemeral local test signatures are verified and destroyed during each run. Retained receipts are deterministic unsigned software-result hashes, not institutional endorsement, authenticated human consent, survivor review, retained signed custody, physical hardware, measured power or witnessed Deeds. All source-owner gates remain local; JAR;VIS grants no sovereignty over another project.

No external operation is dispatched. Build authorization is for local software only. Verification performs exact-byte recomputation in a fresh process; an independent human reviewer is still needed. Missing pins, source mutations, absent runtime/dependency or denied authorization produce HOLD/REFUSE rather than substituted mocks. No install or discovery happens during build/replay.

Run the complete JAR;VIS suite with `npm test`. CANNON's integration suite and independent donor tests are documented in its `docs/CONSTELLATION-001.md`. This branch's CI also checks out the exact locked CANNON contribution and exercises this actual runner.
