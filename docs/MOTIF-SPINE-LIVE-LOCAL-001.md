# JAR;VIS × MOTIF LIVE LOCAL 001 — the actual Reasoning Desk

**Status:** local operator research adapter on an unmerged JAR;VIS integration branch. Source is the original MOTIF Python code, *byte-for-byte*, from merged main commit 139b59d22414659d75c7ffebe9e75cbd01c25925 (Git blob e8038ab4504523f6b15ace567d1a22b36583caff). The JAR implementation does not rewrite MOTIF's reasoning algorithm.

## Run
From a JAR;VIS checkout with Node 20+ and Python 3.11+ available:

    npm test
    npm start

Open http://127.0.0.1:7789/motif on the same computer. This page is not deployed to the public website and can't be reached from another computer unless infrastructure is deliberately changed.

Enter a question, a consequential goal, three competing hypotheses and what each predicts about two observations. Click "Run three reasoning policies." JAR;VIS invokes the pinned original Python Reasoning Spine through a bounded local child process. You can then allow "Let MOTIF Ask" to suggest a discriminating observation, report its synthetic yes/no/unknown result, and optionally label the report as self-reviewed **for this exercise only**. Reports and edited questions are **not saved**: closing or refreshing the page resets them.

An answer is not inferred from natural language; the person supplies a finite explicit model. The three tested policies are fixed-order classical, strong classical information gain, and MOTIF's cost-aware finite model. Real pretrained-LLM/hybrid performance remains NOT_RUN.

## Boundaries

- Source owner: MOTIF; receiver: JAR;VIS. Original source was copied exactly once at an immutable upstream commit and Git blob is checked before each execution. CI checks the vendored file against the original upstream source byte-for-byte.
- The bridge accepts only JSON DATA with exact actions compare/analyze, not user-provided executable files, paths, commands, shell fragments, unmerged ref names or algorithms. Python runs in isolated mode with a 5-second watchdog, restricted environment variables, 16 KiB input and 128 KiB output limits.
- **Python isolated mode is not an OS security sandbox.** Only the reviewed, fixed original source code runs; never use this bridge to load arbitrary branch code. MOTIF's separate reviewed no-network Docker runner is the tool for approved unmerged branches.
- Server retains existing strict localhost binding, Host/Origin validation and anti-CSRF token; CSP uses only same-origin assets. JAR;VIS does not send case data externally or write it into the workbench journal.
- The browser maintains ephemeral reports in tab memory. A claimed source root is not real identity verification; even a self-reviewed answer isn't independently verified truth. All demonstration scenarios are fictional until independent observations are deliberately introduced and verified.
- No Git merges, pull requests, external agent actions, phone calls, asset publication, promotions, notifications or database writes occur through this UI.

## Reproducing the connection

    node --test test/motif-spine.test.mjs

The tests execute the actual original MOTIF Python source through the new Node adapter, verify source hash, check classical controls, reject malformed and oversized cases, refuse missing Python, exercise the local HTTP route with CSRF, and check that the existing workbench journal doesn't change. The dedicated cross-repo GitHub Actions workflow checks out exact original MOTIF commit, byte-compares the kernel, runs all existing JAR;VIS tests and the original MOTIF core tests.

## Follow-on

The main MOTIF repository now has a Branch Garden capable of discovering all visible remote experimental heads, inspecting source by pinned SHA and running specifically reviewed original unmerged methods in a no-network container. JAR;VIS presently uses only one pinned mainstream reasoning kernel; **it does not yet control the branch garden or execute an arbitrary experiment**. Next: a reviewed, operator-triggered branch-selection/read-only interface with explicit GRAFT/CANNON method contracts, full reproducible baseline contests and owner-local disposition. The operator may recommend a merge, but project owners still choose whether to merge.

Source continuity is stronger than copying branch names: method + SHA + role + evidence + source owner + distinct admission state.
