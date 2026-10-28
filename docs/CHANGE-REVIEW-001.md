# CHANGE-REVIEW-001 — Evidence before interpretation

## Executable field contract
Every scheduled SOURCE-WATCH sweep compares **previously observed public** `main` branch tips to newly observed tips, on the fixed 11-repository allowlist. An unchanged tip creates **no event**. For a moved tip, GitHub's exact public compare API supplies **filenames and change types only**; commit messages, patch bodies, files' content, model-written claims, and PR bodies are deliberately not ingested into this machine. If GitHub reports divergence, pagination boundary, more than 60 changed paths, unexpected comparison, or fetch failure, the candidate is **HOLD_COMPARE**, not a summary.

The machine produces `commons/change-candidates-v1.json`. A candidate is **PENDING_REVIEW**, not completed. It consists of exact from/to SHAs, an official compare link, at most twelve paths, mechanical path-category counts, an observation timestamp and a question for a human. **Code, tests, documentation, and deployment are different facts.** A docs change does not mean a service exists; a test change does not prove tests passed. The path categories are filing aids, not claims of functionality.

The browser/backend consumer may show matching pending candidates alongside the existing owner-reviewed editorial catalog. Users can inspect GitHub compare directly; no visitor question is forwarded to GitHub by the consumer. The browser must not promote a candidate into a release, adoption, reLATTE receipt, organization partnership, safe shipment, or completed useful act.

## How to review a candidate
1. Open the exact compare link; check path(s), actual patch, and source-owning project's intended semantics.
2. Write a **precise, modest review statement**, e.g. "Two documentation files changed." Do not write "feature shipped" unless separately observed in production.
3. Check separate evidence when necessary: passing CI; deployed artifact and responding route; explicit receiver authorization; practical outcome acknowledged by appropriate humans. Keep each source distinct.
4. **HOLD** ambiguous content, failed tests, missing provenance, uncertain site approval, and sensitive information. Dismiss misleading candidates.
5. Only a separately owner-approved editorial update to `commons/recent-work-v1.json` may change public narrative. The candidate feed cannot edit this catalog.
6. A "verified useful act" requires its own actual event and independently reviewable outcome; a public Git commit is insufficient.

## Boundaries
- The queue is bounded to 24 newest comparison pairs. Do not treat it as complete source history; follow the original GitHub links.
- Repeated scans of identical observed heads do not recreate claims; previously seen pairs deduplicate by deterministic ID.
- Existing observed-source HOLD states prevent unproven comparison.
- The source observatory and reviewer queue do **not** track all branches. A branch is not canon merely because it is `main`; add another branch explicitly and review its authority separately before expanding coverage.
- Scheduled GitHub Actions execution is best-effort, not guaranteed at exact clock times. Audit its actual runs before claiming scheduled success.
