# JAR;VIS × MOTIF Thought Room 011

**Status:** Unmerged, local-only operator experiment; not deployed at any website.

This adds a human-facing **/thought** page to the actual JAR;VIS localhost server, rather than a separate CLI-only demonstration. Node.js 20+ and Python 3 are required.

## Try it

```sh
npm test
npm start
# open http://127.0.0.1:7789/thought
```

Enter an ordinary question, add your ideas by typing and pressing Enter, and optionally click two idea cards to sketch a relationship. Duplicate words remain distinct identity occurrences. By default, relationships are **PENCIL/HYPOTHESIS_ONLY**. A checkbox permits explicitly marking the edge *operator-authored*, not externally verified.

The room can inspect associations, dependencies, contradictions, conditional affordances, and a no-geometry inventory; the underlying MOTIF THOUGHT-009 router decides whether to produce up to three spatial views given typed evidence. The browser displays the first selected geometric view. When the router produces none, it may render a **clearly labeled UI-only drawing** of the ideas the user supplied, without creating new semantic links.

Results retain source-only answers, traceable selected lenses, hypotheses/questions and digests. Every result is **HOLD_FOR_OPERATOR_REVIEW**. There is no button that commits a pen conclusion or grants external authority.

## Real execution and source ownership

- `src/motif-thought-desk.mjs` invokes actual MOTIF THOUGHT-010 `door.py` via isolated local Python (`-I -B`), not a reimplementation of its graph algorithms.
- Five Python files are **vendored unaltered** under `runtime/motif-thought-010/experiments/thought-{007,008,009,010}`; every byte is verified against its hard-coded SHA-256 before execution. The owner code was first published on experimental [MOTIF PR #131](https://github.com/the-static-collective/MOTIF/pull/131), stacked on THOUGHT-009. These snapshots are not a signed or released distribution, and neither PR is merged.
- Source pinning verifies exact code identity relative to a frozen specimen; it does not authenticate authorship or correctness.
- The private input is written to a mode-0600 temporary file and deleted after the Python returns. The room creates **no persistent thought journal** and does not call a remote API, even to check availability.
- Existing JAR;VIS server binds `127.0.0.1`, checks Host/Origin, requires a local anti-CSRF token on POST, and caps JSON requests at 16 KB. The adapter further checks typed fields, caps subprocess execution at 6 seconds and output at 900 KB, and limits concurrency to 2.
- A browser request cannot supply Python paths, source origins, caller identity, export mode, arbitrary commands, verified PEN claims, or outside execution options. All inputs are constrained into `PRIVATE_LOCAL`, `export:NONE`, `allow_export:false`.
- Every edge is labeled with the **same unverified local operator origin**. Four edges written by one person are not mistaken for four independent witnesses.
- If the pin or Python is unavailable, the endpoint returns HOLD while the rest of JAR;VIS continues to run.

## Acceptance tests

`node --test test/thought-room.test.mjs` tests the real Python crossing and public-independent, private-local HTTP server; `npm test` checks existing suites. Unit fixtures are fictional; no real-world source is authenticated or task advantage established. The separate CI workflow installs Python and Node and runs the suites.

## Still outside the scope

No verified semantic interpretation from word proximity, no multimodal embedding model, no real multiuser access, no user accounts or synced memory, no Free Graph export or source-owned remote write, no production deployment, no independent PEN admission, and no evidence that graphs improve accuracy versus source-only classical baselines.

**Next engineering gate:** a reviewed, source-bound multi-witness editor and genuine user-comprehension/answer-quality tests before offering automatic pencil-to-pen promotion.
