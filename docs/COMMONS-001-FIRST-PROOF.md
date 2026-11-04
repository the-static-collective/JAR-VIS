# COMMONS-001 — One real exchange → one reusable method

The **existing** NOW-ROUTE-003 invitation-only pilot is the physical exchange coordinator. This work does not create a new marketplace, move the Garden's data, or broaden its food-safety boundaries.

## A two-person field run

1. Use the already deployed NOW-ROUTE link with **two distinct one-time invites**, one for OFFER and one for NEED, on separate devices/browsers.
2. Both people independently opt in to the same category and broad Waseca area. Use safe, shelf-stable food or another allowed physical good; do not enter home addresses or phone numbers.
3. The giver proposes. The recipient accepts or declines. Coordinate a public meeting location through the existing private in-app notes.
4. After an actual handoff, the giver selects **Report physical handoff**. Only the recipient can then choose **Confirm I received it** or **I did not receive it**.
5. **Only after the recipient confirms** does a *Save reusable workflow* button appear. It downloads a JSON cartridge recording the generic steps and safeguards, not the people or their exchange details.

An offer posted is not delivery. A potential match is not an agreement. An accepted route is not a physical handoff. Two separate participant statements are **not** independently verified field evidence.

## Portable method, not a success story

The cartridge uses the `jarvis.commons-workflow-cartridge/v1` format with a constrained category, seven procedural steps and explicit limits. The payload contains **no human descriptions, locations, messages, keys, receipts or identifiers**. It cannot reopen a post, dispatch messages, enroll anyone, authorize a payment, or certify a real physical outcome. It is an independently reusable *recipe*, not an automatic clone of anyone's consent.

The backend status response supplies only the non-sensitive category needed for the export. Everything else is generated locally in the browser after the server returns `CONFIRMED`.

## Deploy/verification boundary

This change is proposed on a review branch layered on the existing NOW-ROUTE-003 draft PR. The live Edge function is **not** modified by opening this PR. Static unit checks:

```sh
node --test test/commons-001.test.mjs
node --test test/now-route-live.test.mjs
```

The original PR's smoke workflow verifies the deployed entry, origin refusal and invalid-ticket denial. That is not a two-person field test. End-to-end physical outcomes are not simulated or asserted by this change.

## One useful result to measure

Record the **count of distinct, recipient-confirmed exchanges per operator-hour** only after voluntary real-world activity; segregate such self-attested results from independently witnessed outcomes. Do not publish private receipts or participant details for the sake of a metric.
