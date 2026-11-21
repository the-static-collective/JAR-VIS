# JAR;VIS × MOTIF WAKE SIGNAL 001 — Human Invitation Desk

**Implementation:** standalone localhost desk at \`/wake\`, stacked on JAR;VIS main (no other experimental PR assumed). **Not deployed**, not a public intake page, not a matching engine.

## Source ownership and runtime

The local Node server invokes the **exact byte-pinned** \`experiments/wake-signal/wake.py\` from MOTIF commit \`efe133f0db12b439b9c483eace13601cf8c03285\` (MOTIF draft PR #64). Git blob SHA: \`bcf090b510ad41ed59264e6864ffbd24edfce28e\`. The single file is vendored unchanged at \`integrations/motif-wake-signal/wake.py\`. A small Python JSON bridge invokes this original source for plan, state, and event validation. Changes to owner bytes produce HOLD, not silent divergence. Python 3.10+ and Node 20+ are needed.

Run locally:

    npm test
    npm start

Open \`http://127.0.0.1:7789/wake\` on the operator's computer.

## Workflow

1. Operator selects a **sample idea** (Fellowship welcome table, Garden support, Commons) or enters an original local opportunity. Presets are **illustrative drafts**, never confirmed live opportunities or automatic imports from a third-party source.
2. Fill one shared context and three distinct concrete asks: **SMALL**, **CREATIVE**, **AUTONOMOUS**. Choose a seed; 3–100 shuffled assignments, 100 by default. The locally generated messages contain no identities or recipient addresses.
3. Leave **Opportunity independently confirmed** unchecked for a dry rehearsal. If it really exists, an operator can create a **separate** study after confirming it, with the checkbox selected. This is a human assertion, not source verification. A previously unverified study never silently upgrades itself.
4. Select a slot; manually copy or download its invitation **only for consented, appropriate outreach**. No recipient address, name, health condition or individual profiling is collected.
5. Manually record \`offered\` only when contact was permitted, then optionally \`replied\`, then \`action\` and \`novel_action\` with attestations and nonpersonal evidence IDs. \`declined\` / \`opted_out\` are terminal; leave people alone. No response remains **unknown**.
6. Inspect per-arm aggregate counts and optionally download the *aggregate* research report. A record of action is **operator testimony**, not independent field proof; this interface cannot verify recipients' identity or their voluntary consent.
7. More campaigns can be started; each has its own files in the local JAR;VIS journal adjacent \`.wake-signal/\` directory. No automatic merge with existing Garden/Commons/reLATTE data; no remote sync or public feed.

## Explicit boundaries

- No bulk sends, push notifications, invitations to scraped contacts, new public accounts, permission inference, identity search, leaderboards, AFK labels, personality scores, or manipulation optimization.
- No durable contact list or stored real names. Invitation text and event counters are local-only. The UI never captures recipient identifiers. Do not enter personal stories, exact pickup locations, confidential evidence or sensitive data into operator text.
- A HOLD, refusal or opt-out is not a defect to be optimized away.
- The 100-slot split is descriptive, not causal proof. No significance test or reward optimizer is run. Selection bias remains if not all assigned invitations are offered.
- JAR;VIS endpoint is **loopback-only**, has same-host and origin checks, a random CSRF token for writes, response security headers, source integrity checks and a per-desk serialized write queue. Source ledger is a **single-operator local append log, not a secure multiwriter store** and not independently signed.
- Existing JAR;VIS services, NOW-ROUTE live Supabase, remote Commons, messaging apps and other MOTIF branches are **not** connected by this experiment. Source/CI success does not prove a live human trial.

## Next acceptance gate

A human operator reviews copy and the opt-in process, tests on a phone or laptop as feasible, asks permission through appropriate real channels, and logs **one actual consented opportunity with a verifiable, nonpersonal evidence reference**. Only then evaluate whether any message was useful in practice.
