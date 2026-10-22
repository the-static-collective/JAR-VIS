# JAR;VIS

**Jubilee Automation / Attention Relay / Res; Virtual / Voluntary Integration / Intelligence Stewardship / System.**

**Short name:** JAR;VIS  
**Long semantic signature:** JaAR;rvVIiSs  
**Status:** Genesis 003 — executable localhost attendant with opt-in public-source discovery. **Not deployed; no runtime agents connected.**

> JAR holds what matters. VIS attends to what is possible. The crossing belongs to those concerned.

JAR;VIS is an attendant across independently owned projects, not a master AI, global database, or replacement for the systems it serves. It observes fictional particulars, explains potential connections, proposes bounded actions, requests simulated authorization, and records what happened — including HOLD.

## Try the local attendant

Node.js 20+ and no third-party runtime packages required.

~~~sh
npm test
npm start
~~~

Open **http://127.0.0.1:7789** in a browser on the same machine. The interface includes an interactive field, JAR cards, a deterministic ask-the-attendant panel, proposal/approval controls, **opt-in public-document inspection for GHoT and planZ**, and a replayable local history.

**All sample data is fictional.** Two simulated approvals require a local operator to type "MOCK YES" separately. They do not authenticate actual stewards or create real consent. The Kinship adapter only records an in-process mock message; no real broadcast or external communications take place.

~~~text
OBSERVE → UNDERSTAND → PROPOSE → AUTHORIZE → ACT → RECEIPT → RETURN
                  JAR    ;    VIS
~~~

The semicolon is the crossing: **ATTENTION ≠ AUTHORITY**.

## Local guarantees and limits

- Browser server binds to loopback only. **On explicit click**, it can perform a public, read-only GitHub HTTPS GET to two fixed project-owned documents. No external writes, broadcasts, or project execution.
- Missing, expired, or revoked demo grants cause HOLD.
- One mock proposal/action/audience, two distinct steward roles, one explicit dispatch.
- Append-only JSONL history with hash-chain validation on restart. Not signed, encrypted, or tamper-proof.
- GHoT and planZ public project documentation are now readable through two pinned doors (with source URL, SHA-256 and observation time). A document does **not** prove a live worker, plan API, trusted identity or authority. Other doors remain planned or mock.
- Rules-only attendant. No model connection; no background agent.

## Documents

- [Constitution](docs/CONSTITUTION.md)
- [Genesis 001 — First crossing](docs/GENESIS-001.md)
- [Genesis 002 — Interactive attendant](docs/GENESIS-002.md)
- [Genesis 003 — First real public-source door](docs/GENESIS-003.md)
- [Architecture](docs/ARCHITECTURE.md)
- [reLATTE compatibility boundary](docs/RELATTE-SEAM.md)
- [Particular schema](spec/particular-v0.schema.json)

## Code

- [Core crossing engine](src/engine.mjs)
- [Local journal](src/journal.mjs)
- [Workbench state machine](src/workbench.mjs)
- [Allowlisted public-source inspection](src/public-doors.mjs)
- [HTTP server](src/server.mjs)
- [Interactive browser](public/index.html)
- [Automated tests](test/workbench.test.mjs)

## Next crossings

Authenticated and revocable human grants; versioned capability manifests or signed adverts owned by source projects; cryptographically signed, canonical reLATTE envelopes with receiver-local admission; privacy controls; durable effect idempotency; adapters to Kinship and GHoT behind explicit scopes; Abundent return portal.

**No compulsory central master. No assumed consent. No automatic authority escalation.**
