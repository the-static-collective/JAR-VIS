# POST OFFICE 004 — First outbound provider acceptance

**Date:** Monday, October 26, 2026, 14:20:04 America/Chicago (19:20:04 UTC)  
**Field decision:** account owner explicitly authorized a first outgoing self-test by saying “lets do it!”

## Actual event

An intentionally one-shot, HMAC-protected Vercel trigger invoked the existing `POST OFFICE 003` server-only Resend sender. The sender has fixed contents; recipient is the private owner test inbox configured in the server's production environment. No visitor input, recipient list, or public email addresses were used.

**Observed Vercel HTTP response:** `202 Accepted`

```json
{
  "state": "PROVIDER_ACCEPTED",
  "providerId": "01a179a7-d29f-71c8-b4b6-9abf6ae7465c",
  "delivered": false
}
```

The sender reported Resend **accepted** the self-test for processing. It did NOT independently confirm arrival in the recipient's inbox, SPF/DKIM alignment on delivered mail, reply success, or downstream community correspondence. The recipient's private destination is not shown here.

**Fixed mail identity:** `The Static Collective <us@abundent.org>`  
**Fixed reply address:** `us@abundent.org`  
**Subject:** `The Static Collective — Post Office proof 001`

The HTTP request was made exactly once by the operator. The Resend sender sets a deterministic Idempotency-Key for retry safety. **Do not retry** unless the owner explicitly requests a new test and records the original disposition.

## Safety cleanup and next gate

- The temporary `api/post-office/temporary-proof.js` route and its regression test were deleted from `the-static-collective/webZ` main after provider acceptance. Cleanup commit: `eb0f489acbe37e921230aca213820c5c2abfc1c5`.
- The permanent Post Office endpoint retains POST-only bearer authorization with fixed owner recipient and text; no general outbound messaging is enabled.
- The production `POST_OFFICE_OPERATOR_TOKEN` was rotated immediately after testing. Neither old nor current secret is published in this repository.
- A new production build has been requested from the cleanup commit so the default deployment has no temporary trigger and incorporates the rotated token.
- The original receive path `us@abundent.org` → Porkbun → owner's Proton inbox remained untouched.

**Owner's final proof:** Check the recipient inbox (including spam) for the subject above; inspect displayed From, return-path, DKIM/SPF authentication if available; reply to `us@abundent.org` and confirm reply arrival. Only then mark **DELIVERED / REPLIED** with attributable owner witness. This file does not claim those outcomes.

**Next release:** individualized opt-in/permissioned outreach from Post Office 001 drafts; no bulk broadcast or community recipient list without verified consent and delivery/suppression controls.
