# JAR;VIS × MOTIF ORG-001 — Local diagnostic handoff

**Status:** Draft, local-only receiver. Source MOTIF draft experiment: [ORG-001](https://github.com/the-static-collective/MOTIF/pull/282); this integration does not assume it is merged, canonical, or field-verified.

### Operator steps

1. With a consenting local dataset, run MOTIF's ORG-001 Python specimen and redirect its JSON output to a local file.
2. Inside this JAR;VIS project run:

        node bin/motif-org001.mjs /path/to/local-motif-org001-report.json

3. Review the returned HOLD_FOR_OPERATOR_REVIEW IDs and conditional modeled numbers. Independently inspect the source documents and contact/consent requirements. Nothing has been admitted or sent.

The receiver verifies *shape and restrictive state*, not the true provenance or mathematical correctness of the file. It advertises a pinned source commit for **manual comparison**; a user-controlled JSON file is not a signature, attestation, authorization, or externally validated receipt. It intentionally strips free-form action text from its normal CLI output to reduce accidental disclosure/instruction-following. There is no live API route, network access, server mutation, database write, automatic follow-up, approval, or third-party message.

Reproduce tests with:

    node --test test/motif-org001.test.mjs

### Respective ownership

- MOTIF owns local diagnosis and conditional counterfactual math.
- JAR;VIS owns operator-facing HOLD triage. It may suggest a review, never impersonate a steward.
- reLATTE and Project0 would need their *own* crossing/receiver decision for durable receipts or shared semantics.
- Garden/Porchlight remains independently governed and is not implicitly connected.

### Next falsifier

Construct a fully source-pinned and independently verified fixture transfer between both repositories, then an opt-in field pilot with actual before/after evidence. Never equate quicker meetings, fewer emails, or administrative throughput with verified care delivered.