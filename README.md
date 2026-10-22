# JAR;VIS

**Jubilee Automation / Attention Relay / Res; Virtual / Voluntary Integration / Intelligence Stewardship / System.**

**Short name:** JAR;VIS  
**Long semantic signature:** JaAR;rvVIiSs  
**Status:** Genesis 001 — bounded local demonstration, not a deployed service.

> JAR holds what matters. VIS attends to what is possible. The crossing belongs to those concerned.

JAR;VIS is an **attendant across sovereign projects**, not an AI sovereign, a global database, or a replacement for the systems it serves. It can observe available particulars, propose a useful relation, request separate permission from those concerned, and return an attributable record of its bounded action.

## First executable crossing

Genesis 001 uses a *synthetic* Waseca Garden grocery-network scenario: one surplus food offer, one compatible need, two independently provided steward approvals, a **mock** Kinship relay, and a local receipt. It uses deterministic matching rather than an LLM, and never posts to a radio station, a website, or the internet.

~~~text
OBSERVE → UNDERSTAND → PROPOSE → AUTHORIZE → ACT → RECEIPT → RETURN
                  JAR    ;    VIS
~~~

Run with Node.js 20+; there are no third-party packages:

~~~sh
npm test
npm run demo:hold
npm run demo
~~~

"demo:hold" demonstrates a proposal that **cannot** cross without authorization. "demo" prompts in the terminal for two separate, explicit mock approvals. Typing anything other than YES refuses that party's permission and holds the action. These approvals are **not authenticated signatures**; Genesis 001 runs entirely inside a trusted local demonstration.

## The division of responsibility

- **JAR** preserves particular needs and offers, owner fields, visibility, and their present state. In this specimen it is an in-memory container, not durable memory.
- **VIS** derives a *proposal* from JAR records. Intelligence, heuristics, and future models may be substituted. No proposal carries authority.
- **The semicolon** is the explicit authorization crossing. Both affected stewards must approve the exact proposal/action/audience before this demonstration can act.
- **Adapters** execute only bounded capabilities. Genesis 001 provides a mock Kinship outbox; no network connector is present.
- **Receipts** record what was *simulated*, including HOLD. They do not establish truth, admission, identity, payment, fulfillment, or real-world delivery.

## Documents and code

- [Constitution](docs/CONSTITUTION.md): the governing constraints.
- [Genesis 001](docs/GENESIS-001.md): specimen, limits, acceptance conditions.
- [Architecture](docs/ARCHITECTURE.md): contracts and project relationships.
- [reLATTE boundary](docs/RELATTE-SEAM.md): deliberate non-equivalence with signed reLATTE envelopes/receipts.
- [Particular schema](spec/particular-v0.schema.json): small JAR record model.
- [Engine](src/engine.mjs), [mock scenario](src/fixture.mjs), [CLI](src/demo.mjs), [tests](test/engine.test.mjs).

## Next legitimate crossings

Add authenticated human consent and revocation; durable local journaling; real typed reLATTE R1/R2 envelopes and R3 owner-local disposition; opt-in Kinship transport; privacy/retention policy; accessibility; and owner-controlled adapters to Abundent, GHoT, planZ, and PENNY.

**No default remote action. No assumed consent. No compulsory master node.**
