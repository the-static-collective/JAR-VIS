# Genesis 002 — The Attendant Workbench

**Status:** executable localhost-only prototype. **Not deployed.**  
**Previous:** [Genesis 001](GENESIS-001.md).

## The actual demonstration

The same fictional Garden need and offer are now available through a browser interface served by a Node.js HTTP process on **127.0.0.1**. It provides five screens/sections:

1. **Field**: synthetic needs, offers, proposal and mock-relay counters.
2. **JAR**: source-labeled particulars; no authority inferred.
3. **VIS**: a deterministic ask-and-explain attendant; no model connection, no unbounded tools.
4. **The semicolon**: proposal inspection, two independently triggered *simulated* grants, revocation before crossing, an explicit attempt, and HOLD/MOCK_RELAYED outcomes.
5. **Doors / history**: descriptive project directory (none connected) and local append-only receipt timeline.

## Running

Requirements: Node.js 20+, no third-party dependencies.

~~~sh
npm install
npm test
npm start
~~~

Open **http://127.0.0.1:7789** on the same computer as the Node.js process. No remote host interface is exposed. The journal is created at ".local/jarvis-events.jsonl" (gitignored).

Alternative environment configuration:

~~~sh
JARVIS_PORT=7791 JARVIS_JOURNAL=/path/to/local/jarvis.jsonl npm start
~~~

### Walk-through

1. Click **Form proposal**. This observes a fictional 12-box need and 20-box offer; it does not relay anything.
2. Click **Attempt mock crossing** *without grants*. It returns HOLD; no mock outbox entry.
3. Click **Simulate YES** for the first demo steward and type "MOCK YES". The journal notes that the **local demonstrator** pressed the button, not that a real person approved.
4. Do the same for the second demo steward. Approval for both roles remains **unauthenticated simulation**, time-limited to 10 minutes.
5. Click **Attempt mock crossing**. It records an in-process Kinship mock message; it never calls a live service.
6. Refresh or restart: journal replay reconstructs proposals, approvals and the prior mock outbox. Duplicate dispatch returns the original outcome.

Other useful tests: revoke one mock grant before dispatch; allow a grant to expire; ask VIS about Kinship or consent; corrupt the journal in a disposable test path and see startup refuse replay.

## Journal design

Append-only JSONL with sequence numbers, previous-event ID links, deterministic SHA-256 event IDs and fsync for each append. Startup verifies the chain before serving.

A hash chain detects *accidental or unsophisticated* modification. **It is not cryptographic authorship, a trusted audit trail, tamper-proof against a privileged local actor, nor crash-atomic transaction storage.** This prototype assumes only one server process writes a given journal. No real confidential information should be placed inside it.

Revocation prevents *future* simulated crossings; it cannot undo a crossing already recorded. HOLD outcomes are journaled without treating them as approval.

## Local HTTP boundary

- Binds to loopback only; checks Host and Origin.
- Anti-CSRF token required on all POST requests.
- Small JSON-only request bodies; strict route allowlist; no file uploads or arbitrary execution.
- Same-origin JavaScript/CSS/HTML with a restrictive content security policy.
- No authentication, human identity assertions, encryption, background crawling, GitHub access, or actual communications.

A loopback browser application is **not safe to expose publicly** without an identity/authorization overhaul and hardened persistence and transport. Do not reverse-proxy or deploy it to a public hostname.

## Project boundaries

Every listed door is deliberately marked fixture, mock, or planned. There is no actual reading from GitHub, planZ, GHoT, reLATTE, Kinship, PENNY, or Abundent. The simulated "garden ↔ grower" match is not an operational food-rescue program.

To integrate external systems, a later slice must define owner-signed capability manifests, actual stewards and permissions, privacy-safe local previews, effect budgets, receiver-local disposition, signed reLATTE envelopes, and a revocable consent lifecycle. An LLM can eventually suggest plans but cannot grant its own permissions.

> ATTENTION ≠ AUTHORITY. SIMULATED YES ≠ REAL CONSENT. RECEIPT ≠ FULFILLMENT.
