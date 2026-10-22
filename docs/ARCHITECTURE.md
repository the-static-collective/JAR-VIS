# JAR;VIS: vessel, attendant, crossing

## Domains

| Domain | Owns | Does not own |
| --- | --- | --- |
| JAR | Local particular snapshots: open needs and offers | Human beings, legal title, or the original source's authority |
| VIS | Derivation of proposals from eligible records | Execution permission |
| Crossing gate | Checking that approvals match action, audience, both stewards, expiry, and snapshots | Authentication of those stewards in Genesis 001 |
| Adapter | A named bounded effect; in Genesis 001 only a mock Kinship outbox | Independent admission or outside effects |
| Receipt / return | The outcome of the attempted action and its limitations | Proof that the physical need was met |

## Stages

1. **OBSERVE** — receive existing needs/offers as explicitly sourced records.
2. **UNDERSTAND** — select only open, same-category, same-region offers with enough quantity, from a different steward. Full fills only in Genesis 001.
3. **PROPOSE** — assign a local ID bound to the proposal fields and a snapshot fingerprint of both records.
4. **AUTHORIZE** — require separately supplied grants from **both** stewards for the same proposal ID, action, audience, and non-expired scope. The proposal builder cannot manufacture grants.
5. **ACT** — send through "MockKinshipRelay" only. That object stores a process-local outbox and suppresses duplicate deliveries by proposal ID.
6. **RECEIPT** — label HOLD or MOCK_RELAYED; no claim of network transmission.
7. **RETURN** — report success, failure, or hold back to the initiator in plain language.

## Versioned boundaries

- JAR record: "jarvis.particular/v0", [schema](../spec/particular-v0.schema.json).
- VIS proposal: "jarvis.proposal/v0", local content-derived ID, not a cryptographic signature.
- Grant: "jarvis.grant/v0", **trusted-process input only**; not signed or identity-verified.
- Local receipt: "jarvis.receipt/v0", explicit "semanticEffect: none" for mock delivery. NOT reLATTE "relatte.receipt/v0".
- Relay: "kinship.mock/v0". No radio, internet, or website calls.

## Neighboring systems

- **reLATTE**: later provide signed envelopes and separately owned receiver disposition. JAR;VIS should invoke reLATTE's real code/profile rather than forge compatible-looking fields.
- **GHoT**: later request capability execution on an available body. Selection is never permission.
- **Kinship**: a future opt-in service can broadcast publicly *authorized* needs and route responses back.
- **Abundent**: a return page can show consent status, active offers, printable cards and actual delivery status supplied by responsible nodes.
- **PENNY**: possible future accounting for small contributions; no transfers, balances, or token issuance in this repo.
- **planZ**: indexes intentions and their dispositions without being the authoritative source for any action.

## Privacy and operational integrity

Records in the demo are fabricated. A real integration needs explicit sharing scopes, least-privilege matching, data minimization, expiry, authenticated approvals, revocation, auditability, local storage/replay, and abuse prevention. Never substitute a generated grant object for evidence that a human approved something.
