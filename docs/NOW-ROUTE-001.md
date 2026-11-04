# NOW-ROUTE-001 — Physical generosity, routed now

## Source and maturity

**Owner:** JAR;VIS workbench (the-static-collective/JAR-VIS) — a proposed extension, not an authority claim over Garden, reLATTE or Jubilee.

**Executable:** src/now-route.mjs, mounted on the existing localhost-only JAR;VIS workbench at /now-route; no external packages or real accounts.

**Maturity:** local **synthetic demonstration** only. In-memory events reset on restart. It does not contact other people, send notifications, access real physical locations, verify safety, prove identity, or make deliveries. UI controls simulate both people from one local browser; clicking Recipient: accept is not authentic second-person consent. No Supabase migration or production website change is performed.

**Start:** On a machine capable of the existing JAR;VIS Node 20+ runtime, run npm start, open http://127.0.0.1:7789/now-route, then select **Try fictional fish example**. It adds a fictional refrigerated fish offer at an approximate example location and a nearby opted-in fictional grocery need. Click Offer to need, Recipient: accept, Donor: report handoff, then Recipient: confirm receipt. You can use the two input panels to try other cases. The screen refreshes local workbench state every 2.5 seconds. All instances and people are simulated.

## The useful crossing

Paula's example: fish that will not fit in her freezer can go to a nearby neighbor instead of sitting unused. Recognize a tangible food item, a rough location, pickup capacity, an available window, a local matching need, and *two independent choices*.

The route:

1. **OFFER** — describe the gift, approximate neighborhood, radius, pickup window, and any required safe-storage attestation. No identities or addresses are inferred.
2. **OPT-IN NEED** — a separate party describes a compatible need, opts in, chooses approximate area, and self-estimates whether pickup fits the time window.
3. **SUGGEST** — deterministic domain, approximate Haversine distance, consent, travel estimate and clock gates produce proposals. No auto-outreach.
4. **PROPOSE** — the giver creates a specific private invitation. A proposal is not acceptance.
5. **RESPOND** — the intended recipient accepts or declines. Acceptance reserves the local example offer; decline frees it for other suggestions. Competing proposals cannot reserve one need twice.
6. **REPORT** — the fictional giver marks a handoff as reported. This **does not** close the offer or count as fulfillment.
7. **CONFIRM** — the fictional recipient independently confirms, at which point the offer and need close in the local simulation. Neither checkbox proves a physical delivery.

Expiry prevents new suggestions or late acceptance. Reporting a previously accepted exchange remains possible after the matching window, because the delivery receipt is separate from matching eligibility.

## Safety / control boundaries

- A cold-chain item (e.g. fish, meat, milk or eggs) goes to **HOLD_SAFETY** unless the offeror explicitly self-attests suitable cold handling. This is a *filter*, not verified food safety. Unsafe or unknown storage should not be published or transferred. An available-for-45-minutes window is a coordination deadline, **not a food-safety rule**.
- Only participants explicitly opting into matching appear as need candidates. No accounts are accessed, no identities or addresses are disclosed, and no GPS permission is requested. Input is fictional local data; don't enter real private information.
- Matching requires a stated travel estimate; neither a five-mile radius nor a willingness to deliver proves transportation feasibility. This specimen only routes recipient pickup; a separate consented driver/delivery contract is a future edge.
- Existing localhost host and CSRF rules are reused. This is **not** safe to expose to the internet, as it has no authenticated user roles, durable opt-in, notification permissions, anti-abuse controls, or resource safety verification. Do not treat simulation actors as real people.
- This workbench does not modify Garden's Jubilee ledger or reLATTE authority records. A local event count is not a signed receipt or independently verified occurrence. A production receiver must preserve need opened → offer pledged → offer accepted → fulfillment reported → fulfillment confirmed without conflating source and receiver claims.

## Tests

Run: node --test test/now-route.test.mjs test/now-route-http.test.mjs

Checks time and proximity, matching opt-in, cold-chain HOLD, mismatched kinds, lack of pickup feasibility, expiry, privacy of snapshot, separate report and confirmation, decline and retry, duplicate reservations, and localhost CSRF.

## Next real-world threshold (not yet crossed)

1. An authenticated, opt-in, appropriately moderated **two-account** field test, with persistent reversible offers, report/confirmation ownership, expiration job and member-scoped authorization.
2. Location privacy: approximate-area matching, not public coordinates; exchange actual pickup details only after independent consent. Explicit withdrawal, contact limits, block/report, and no public household-need disclosure.
3. Real notifications only after device-specific opt-in; avoid sending a sensitive need or person's location in a push preview.
4. Source-owner review for Garden/BananaSpork adapter. Existing Help Slip return and Campfire lifecycles must remain authoritative, not automatically overwritten by this demo.
5. Safe physical handling policy for donated food, especially perishable items and food-shelf distribution restrictions. This specimen makes no claims about the policies of the specific food shelf.
6. A **physical two-human receipt**, with independently attributable offer, acceptance, reported handoff and recipient confirmation, before claiming any successful field exchange.

## Governing principle

**Immediate human benefit is the objective; a new connection is an optional consequence.**

A matching suggestion is not a delivery. A gift is not a debt. No one owes reciprocation, recruitment, or public testimony.
