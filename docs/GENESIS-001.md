# Genesis 001 — The Garden Need Crossing

**Status:** bounded executable proof, local only.

## Particular

A fabricated Waseca Garden network has an open need for 12 produce boxes. A separate participant has an open offer of 20 produce boxes in the same region. No identifiable real people, donors, or shops appear in the fixture.

## Sequence and observable outcomes

~~~text
two JAR records
  ↓ observe
eligibility: open + same category + same region + enough volume
  ↓ understand
VIS proposes one possible relation
  ↓ propose
both stewards asked to approve that exact mock broadcast
  ├─ missing or invalid grant → HOLD receipt → RETURN
  └─ both valid grants → mock Kinship outbox → MOCK_RELAYED receipt → RETURN
~~~

A text prompt with two separate YES answers represents **only** a local, unauthenticated demo of explicit permission. In the no-grant path, the outbox remains empty.

## Acceptance conditions

- A proposal does not send anything.
- One steward cannot bind the other.
- Expired, wrong-audience, wrong-action, or wrong-proposal grants cause HOLD.
- Changed needs or offers invalidate the old proposal.
- A mismatched or insufficient offer cannot become a proposal.
- A duplicate dispatch does not duplicate the mock outbox record.
- HOLD and mock delivery produce distinct, labeled receipts.
- No network or radio service is called.

## Run

~~~sh
npm test
npm run demo:hold
npm run demo
~~~

## What is *not* proven

No proof of actual need, identity, intent, signed authorization, authorization revocation, stable storage, journal replay, trusted timestamps, cryptographic canonicalization, transport, successful contact, inventory reservation, pickup, payment, or physical fulfillment.

Specifically the generated ID and receipt formats are **local JAR;VIS experimental types**. Do not label them reLATTE-signed or Kinship-delivered.

## Next edge

Implement an authenticated consent/admission organ before replacing the mock relay with a real communication channel. Map its verified crossing into reLATTE through versioned adapters and enforce receiver-local disposition. Add reproducible restart tests, replay protection, revocation, and scoped public/private data projection.
