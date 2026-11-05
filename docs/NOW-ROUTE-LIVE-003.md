# NOW-ROUTE 003 — Live invitation-only field pilot

## Deployment
Active on the existing pantry-gate Supabase project, not a new instance.
Public entry: https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/now-route-live
Edge function now-route-live, ACTIVE v3. Migration now_route_003_invite_only_exchange was applied.
Existing Garden, IC02, Jubilee and operator schemas remain unchanged.

## DEX-inspired but not a financial exchange
Maker: short-lived gift OFFER. Taker: opted-in NEED. Matching: deterministic approximate five-mile radius, common category, travel feasibility and expiration. Postgres ensures single active reservation. Donor proposes, recipient accepts, donor reports the handoff, recipient independently confirms or disputes. Cryptographic-strength one-use invitations and local private tickets give scoped authority. No money, wallet, ledger settlement, token or blockchain is involved.

## First two-person proof
Two participants open the same link on separate devices. Each has a different private invitation: one OFFER, one NEED. Create compatible shelf-stable goods examples, select approximate Waseca areas, and keep the page open. Updates poll every eight seconds. The offeror proposes, the recipient accepts, they may exchange in-app notes to coordinate a public meeting point, and separately report and confirm after the physical handoff.

## Boundaries
Invite-only. No public contacts or addresses. No real-person identity verification, no guarantee of physical receipt, no offline push or SMS. Fish, thawing food and other known perishables are blocked in this first pilot; a food offer also requires a shelf-stable declaration. Participant statements are not independent safety proof. Posts expire after 30–180 minutes. A scheduled database job removes expired records after seven days. All new tables have row-level security and no direct browser grants. Service-side quotas reuse the preexisting Garden counter under nr03-prefixed keys.

## Maturity and outstanding evidence
Source files: backend/edge/now-route-live and backend/migrations/009_now_route_live_pilot.sql. CI confirms the deployed health response and HTML page; actual two-person creation and handoff have not been observed yet. The database is a coordinator, not a decentralized network. No independent witness has attested an exchange.
