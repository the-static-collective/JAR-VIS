# REVIEW-DECISION-001 — Persistent human source-review decisions

**Live persistence:** The existing public GitHub repository `the-static-collective/JAR-VIS` is the authenticated decision ledger. No new keys or visitor accounts are introduced by the Abundent frontend. A decision is recorded on the authorized reviewer's **GitHub issue comment**, then an Actions job checks the reviewer's repository permissions and writes an append-only, publicly inspectable event to `commons/review-decisions-v1.json`.

## Exact review path
1. JAR;VIS /changes.html displays an actual candidate from `commons/change-candidates-v1.json`. The public button opens a new GitHub issue prefilled with the candidate ID, repo, from-SHA and to-SHA. The visitor must sign in to GitHub to submit the issue. The issue is a *suggestion*, not approval.
2. A **repository WRITE or ADMIN** reviewer examines GitHub's exact source comparison and any separate CI/deployment evidence.
3. The reviewer comments **exactly one** of:
   - `/jarvis-review HOLD`
   - `/jarvis-review NEEDS_EVIDENCE`
   - `/jarvis-review SOURCE_CHANGE_REVIEWED`
   - `/jarvis-review DISMISS`
4. The issue_comment workflow checks the GitHub API's actual **current repository permission** for the commenting account, not the issue author, label, user-supplied JSON, or a guessed role. `read` and `triage` do not authorize recording.
5. It matches the issue's candidate identifiers against the **currently published source review queue**. A missing candidate is not silently created. A comparison on HOLD cannot be acknowledged as reviewed.
6. The authenticated comment identifier, source pins, public GitHub account name, source issue URL, comment URL, comment time, and a digest of the issue body become a durable **append-only** decision. A second reviewer comment creates a new record without rewriting earlier events.
7. The public change-review page can display current and previous decisions. The most recent decision for a candidate is its current review disposition, never its deployment or field status.

## Trust/consent boundaries
- The GitHub issue is public. **No personal case histories, contact details, shelter addresses, client or family stories, or personal secrets.** Anyone may suggest an issue; only a GitHub-authorized repository writer can create a recorded review decision.
- `SOURCE_CHANGE_REVIEWED` says source files were reviewed, **NOT** that a feature shipped, CI passed, a service exists, somebody agreed, money or equipment was delivered, or a beneficiary confirmed useful work.
- This system does **not** update the owner-edited project catalog, field outcome ledgers, reLATTE admissions, or web deployments.
- If GitHub permission lookup, source candidates, issue metadata, or recording/push fails, no authoritative record is made. The failure should be surfaced in GitHub Actions.
- Records have a stable GitHub comment ID. Duplicate delivery of the same comment cannot duplicate a decision; later comments preserve history. The 400-record cap is a deliberate stop gate requiring a retention/archival decision; do not silently truncate past reviews.
- GitHub may restrict Issue creation or repository write access; GitHub authentication and workflow execution must be verified with a real reviewer before claiming the first persisted real decision.

## Testing
`node --test test/review-decisions.test.mjs` tests authorization, strict candidate IDs, event integrity, source-only dispositions, duplicate comments, and append-only history. Do not create a synthetic fake approved issue on the production ledger just to make the counter increase.
