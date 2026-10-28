# JAR;VIS ↔ planZ Attention 001 (2026-10-28)

**What is integrated:** A local JAR;VIS operator can press **planZ → Inspect current plan index**. JAR;VIS reads exactly one allowlisted public, versioned planZ JSON file from the owner repo, enforces length/schema/status/URL/privacy limits, hashes the exact bytes, and appends its observation to its local hash-chained journal. On subsequent questions, deterministic topical matching can show a reviewed plan's next **human** gate, blockers, owner-source issue, and index status.

**What is NOT integrated:** There is no live GitHub issues crawler, source-repo write, plan admission, agent execution, partner contact, financial transfer, field delivery verification, universal state, public visitor analytics or automatic overnight sync. planZ's feed is a manually reviewed **subset** of the global census. A public plan record is never a current donor/volunteer/client record.

## Operator flow
1. Review the source [planZ publication](https://github.com/the-static-collective/planZ/blob/main/public/attention-v1.json).
2. Start localhost JAR;VIS (`npm test && npm start`).
3. In **Project doors**, choose **planZ → Inspect current plan index**. If read fails, the prior snapshot remains intact and nothing is admitted.
4. Ask e.g. "What planZ task is blocked in Ghana?" or "What is open in Waseca?" The operator question stays in the local process and never goes to GitHub; only the fixed owner-public feed is read at explicit inspection.
5. Click the source issue; determine whether the actual owner has admitted or refused work. JAR;VIS may show the proposal and next review, not promote it to a completed act.

## Gate laws
`ISSUE != APPROVAL` · `INDEX != FULL CENSUS` · `README != API` · `PROPOSAL != ACT` · `CODE MERGE != FIELD COMPLETION` · `JAR ATTENTION != PLANZ AUTHORITY`.

The UI uses text-only DOM nodes for remote descriptions. The local endpoint remains POST+CSRF+loopback and has no arbitrary URL input; schema failures refuse new observation. Test with `node --test test/planz-attention.test.mjs`.
