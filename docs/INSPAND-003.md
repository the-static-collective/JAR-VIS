# INSPAND-003 — JAR;VIS attends CANNON's Reflex Library

**Status:** review-only, no external dispatch and no foreign software execution authority.

JAR;VIS reads the original CANNON PR #67 `registry/reflex-library-v1.json` and executes the **original CANNON read-only discovery** implementation. This is not a reimplementation of the capability catalog, a source-owner merge, or a new autonomous system.

Before reading, it verifies CANNON repository origin, exact commit SHA, Git object bytes for the commit and two locked source blobs, worktree bytes, and a clean source checkout. It refuses changed, missing, untracked, or unpinned source. JAR;VIS can only call `list` or `discover` through its own strictly narrower CLI; this first attendant supports `inspect` and `discover`. It **does not** forward build flags, manage roots, run native software, or authorize anything.

Example:
```bash
node tools/reflex-attendant.mjs inspect --cannon /path/to/pinned/CANNON
node tools/reflex-attendant.mjs discover --cannon /path/to/pinned/CANNON \
  --need "plan film visual replay"
```

A successful discovery yields source-backed literal-match candidate cards with exact capability IDs, unmatched human choices, source lock and authority NONE. It is safe to show these for an operator's subsequent distinct choice, but *not* to execute them automatically.

This source cut has only two synthetic capabilities. Neither meets human participation, rights, media publication, real-world benefit, or measured time-savings gates. Changes to CANNON require a newly reviewed exact source lock.

Related original source: CANNON draft INSPAND-003 PR #67; earlier native proof PRs #64 and #61; JAR;VIS donor #28. CI independently locks/reads the real source, produces a portable invitation JSON, and checks altered bytes and attempted foreign execution are refused.
