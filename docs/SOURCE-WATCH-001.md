# SOURCE-WATCH-001 — Continuously observed, never automatically admitted

**This is an executable, scheduled public-commit observatory.** Every six hours (GitHub Actions schedule is best effort), and on explicit workflow dispatch, the job reads 11 *explicitly allowlisted* public repository branch tips. It records the exact SHA, claimed committer timestamp, link, scan timestamp, and a bounded list of movements from prior verified observations.

**The boundary:** `main != canon`. A branch tip is only evidence that a public Git ref was observed at that time; neither its code correctness nor deployed behavior has been checked. No commit message, issue body, person record, partner agreement, private data, or visitor question enters the feed. A moved ref is not a delivered service, signed contract, a test passing, or a verified accomplishment. Operator-owned editorial entries in `commons/recent-work-v1.json` remain separate and cannot be promoted automatically.

If fetching a source fails, that source becomes **HOLD**, retaining only an explicitly *stale* last-known SHA. If all sources fail, the job does not publish. A digest of the exact manifest bytes is computed by the public consumer; source provenance remains repo-owned. The bounded event list is not a comprehensive Git history; GitHub repository history is the evidence of changes.

The public-facing JAR;VIS backend may read `commons/source-observations-v1.json` and display a repo's last observed head beside a relevant editorial entry, or HOLD on a stale/missing feed. It must not use a move as permission to contact people or to execute a tool. No key is needed to ask questions; the scheduler uses GitHub's built-in restricted write token for this repository only.

To trigger manually: GitHub Actions > **Public source observatory (pointer-only)** > Run workflow. For a new candidate source, manually inspect and add it to the hardcoded `WATCHED` allowlist and tests. The script intentionally excludes its own JAR-VIS repository to prevent a self-triggering evidence loop.
