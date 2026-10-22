# JAR;VIS

**Jubilee Automation / Attention Relay / Res; Virtual / Voluntary Integration / Intelligence Stewardship / System.**

**Short name:** JAR;VIS  
**Long semantic signature:** JaAR;rvVIiSs  
**Status:** Genesis 004 — localhost attendant, public-document doors, and a bounded fixture-only House Party. **Not deployed; no actual OpenManus or ELF occurrence launched from the workbench.**

> JAR holds what matters. VIS attends to what is possible. The crossing belongs to those concerned.

JAR;VIS is an attendant across independently owned projects, not a master AI, global database, or replacement for the systems it serves. It observes fictional particulars, explains potential connections, proposes bounded actions, requests simulated authorization, and records what happened — including HOLD.

## Try the local attendant

Node.js 20+ and no third-party runtime packages required.

~~~sh
npm test
npm start
~~~

Open **http://127.0.0.1:7789** in a browser on the same machine. The interface includes an interactive field, JAR cards, a deterministic ask-the-attendant panel, proposal/approval controls, **opt-in public-document inspection for GHoT and planZ**, a House Party draft/review panel, and a replayable local history.

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
- Rules-only attendant. House Party 004 prepares a fictional Table & Road card with two separate **fixture labels**, deterministic validation, and HOLD for human review; no actual model or native ELF hatches.
- An optional CLI can cold-verify existing STACK² 029 native evidence using pinned original Workbench/LOADOUT code, but it does not launch any agent or import authority.

## Documents

- [Constitution](docs/CONSTITUTION.md)
- [Genesis 001 — First crossing](docs/GENESIS-001.md)
- [Genesis 002 — Interactive attendant](docs/GENESIS-002.md)
- [Genesis 003 — First real public-source door](docs/GENESIS-003.md)
- [Genesis 004 — House Party](docs/GENESIS-004.md)
- [Architecture](docs/ARCHITECTURE.md)
- [reLATTE compatibility boundary](docs/RELATTE-SEAM.md)
- [Particular schema](spec/particular-v0.schema.json)

## Code

- [Core crossing engine](src/engine.mjs)
- [Local journal](src/journal.mjs)
- [Workbench state machine](src/workbench.mjs)
- [Fixture House Party](src/house-party.mjs) and [optional native 029 cold verifier](tools/verify-native-029.py)
- [Allowlisted public-source inspection](src/public-doors.mjs)
- [HTTP server](src/server.mjs)
- [Interactive browser](public/index.html)
- [Automated tests](test/workbench.test.mjs)

## Native source and limitation

The source-pinned real OpenManus → ELF lineage proof already exists in experimental Workbench PR #124 and LOADOUT PR #18, but the JAR;VIS party UI **does not claim to run those agents**. See [Genesis 004](docs/GENESIS-004.md) for a precise cold verification handoff and the still-missing live task-specific integration.

## Next crossings

Authenticated and revocable human grants; versioned capability manifests or signed adverts owned by source projects; cryptographically signed, canonical reLATTE envelopes with receiver-local admission; privacy controls; durable effect idempotency; adapters to Kinship and GHoT behind explicit scopes; Abundent return portal.

**No compulsory central master. No assumed consent. No automatic authority escalation.**
