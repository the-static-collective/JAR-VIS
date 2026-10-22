# reLATTE seam — compatibility is not resemblance

reLATTE already defines "relatte.crossing-envelope/v0" and "relatte.receipt/v0" with Project0-aligned RFC 8785 canonicalization, P-256 signatures, domain-separated hashes, and owner-local HOLD/ADMIT/REFUSE/RETURN semantics.

Genesis 001 **does not implement that profile**. In particular, "jarvis.proposal/v0" is not a signed reLATTE envelope, "jarvis.grant/v0" is not identity proof, and "jarvis.receipt/v0" is not "relatte.receipt/v0".

Potential future adapter:

1. Start from an operator-approved JAR;VIS proposal and narrowly scoped source-world authority.
2. Have the owner-side reLATTE signer construct a valid envelope with the source's actual key custody and canonicalization. Preserve the payload and privacy/audience policy.
3. Send via a replaceable transport; ACK means only received at transport level.
4. Receiver verifies, **RECEIVEs**, then locally HOLDs, ADMITS, REFUSES, or RETURNs according to its law.
5. Associate the reLATTE crossing ID and signed disposition receipt with the original JAR;VIS proposal without renaming one as the other.
6. Present receiver admission, mock transport, and actual external fulfillment as distinct claims.

Canonical references: the-static-collective/reLATTE "spec/IDENTITY-SIGNATURE-PROFILE-V0.md" and "docs/LOCAL-RECEIVER-001.md".

> RECEIVED != ADMITTED; PROPOSAL != ADMISSION; MOCK_RELAYED != DELIVERED.
