# WORK-THAT-INHERITS-003 — One Operator Desk, Separate Authorities

**Live operator UI:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-operator

**Public opt-in role porch:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-reviewers

**Source:** `live/reviewer-operator/index.ts`, `live/reviewer-operator/site.ts`, `live/reviewer-operator/policy.mjs`.

## What was actually cross-mashed

| Donor | Adopted | Explicitly *not* inherited |
|---|---|---|
| Reality 2.0 operator | Expiring SHA-256 hashed 32-byte bearer capability, private triage queue, explicit human commands | Its original REVIEW_PUBLISH_PROGRESS privilege does **not** by itself authorize reviewer access |
| Workboard | Review-before-publication, recorded human attention and private pending replies | No automatic public conversation posts |
| Garden / First Yes | Opt-in individual roles, private withdrawal receipts, no third-party partner claims | No automatically accepted field tasks |
| JAR;VIS 001–002 | Review-discovery tasks, stage gates, signed-off claims distinguished from real evidence | No fictional work elevated into genuine accomplishment |
| GRAFT | Future source-pinned public-safe returns | No automatic import/publication |

This is an *operator view of a single existing live reviewer-intake backend*, with links to sibling rooms. It is not a universal superuser token and does not impersonate other systems.

## What the operator can do

A previously authorized bootstrap key from the Waseca Reality 2.0 operator may now pass a **separate explicit** `inheritance_operator_grants` check, after passing its original unrevoked/expiry checks.

Grant: `REVIEW_TRIAGE`, **expires November 9, 2026**, or sooner if the parent capability is revoked. It was deliberately granted to the already existing owner bootstrap operator ID. This is a cross-scope grant: a compromised bootstrap token would be able to triage reviewer applications as well as access its original Waseca moderation permissions until revoked. Treat it accordingly.

Use the private UI and paste the existing **43-character** key into the password field. It is held in page memory only and cleared on reload/lock; neither URL, localStorage, nor cookies store it. If the token is lost, **do not paste it in GitHub/chat**. Issue a new scoped capability using your Supabase administrator procedure, or revoke/replace the legacy token through a separate owner-controlled workflow. The current UI does not silently bootstrap new authority.

The authenticated desk displays:
- Current private volunteer applications (up to 100) and count by state. Their emails are visible only if the individual separately consented to contact.
- Publicly approved open role requests.
- Current stage and conflict self-report; the operator can record a screening result or put conflicts on HOLD.
- Explicit manual **invitation-recorded** and **acceptance-recorded** steps. These require separate checkboxes asserting the human act really happened outside the system. Nothing here emails, texts, introduces, or enrolls anybody.
- Metadata-only recent actions. A participant's withdrawal clears alias, explanation, and email in the intake; withdrawn applications are excluded from operator listings.

All transitions are guarded by the shared `policy.mjs` also tested offline:
`PENDING → SCREENING → (conflict check) → INVITED → ACCEPTED → CLOSED`, with `DECLINED` and `CONFLICT_HOLD` available. These are private coordination statuses, **not independently verified physical work or authenticated personal identity**.

## Separate grant and transaction boundaries

Three layers must all agree for a private command:

1. Expected same-origin POST + JSON size/format restrictions.
2. High-entropy unexpired, unrevoked Reality 2.0 operator hash.
3. A **separate active and unrevoked** `REVIEW_TRIAGE` grant for that exact key ID.

The browser GET serves only the UI shell. `POST action=list` requires all three gates before returning applicant data. Plain visitor GET and bogus bearer headers cannot read it. The public intake API serves owner-approved role descriptions, not private submissions.

State changes are compare-and-swap guarded and use the stored `public.inheritance_commit_triage` service-role-only RPC to perform the update and audit insert **in the same database transaction**. An audit failure aborts the data change.

The API never sets `independently_verified` true, never publishes private applicant data, and never upgrades accepting an invitation to proof of a completed task.

## Safety and limitations

- No private survivor case details, legal evidence, health information, identifying third-party stories, or precise addresses in onboarding, review notes, or public work cards.
- Role candidates are self-reported and **not** vetted reviewers merely because an operator chose `ACCEPTED`.
- General region/skills and a distinct alias alone are **not** sufficient independent review. For high-stakes tasks, use specific credentials, conflict screening, consent, separation of roles, and real evidence before claiming verification.
- A bearer token is not user-level account authentication or multifactor auth. Do not scale this triage system to sensitive records without a proper authenticated steward identity scheme and a revocation protocol.
- No unprotected operator actions, automatic contact, public publishing, case intake, donation handling, funding transfer or other external authority is added.
- User-controlled withdrawal should win over stale operator updates; guarded stage comparison and `status<>'WITHDRAWN'` enforce this.
- If the queue reaches 100, the UI warns that pagination is needed. Do not infer more applications are absent.
- Revocation is available by revoking the specific `inheritance_operator_grants` row or the parent operator key. Do not delete immutable audit records.

## Verification

The existing public role portal had one synthetic application successfully submitted and withdrawn in its prior end-to-end test. No live non-synthetic application had been received when the operator desk was introduced.

This operator feature additionally needs automated public-shell/unauthorized-POST tests, separate scoped-key integration testing using an intentionally temporary key, and independent review of the full gate before adding sensitive tasks. Never expose a live operator credential in repository tests.

**Integrity > Continuity. Proposal ≠ Permission. Application ≠ Admission. Review ≠ Proof.**
