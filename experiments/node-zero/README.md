# NODE ZERO — JAR;VIS × Garden × Static Live, v0.1

A zero-cost, dependency-free browser specimen for a voluntary **need → offer → acceptance → reported work → requester confirmation** cycle. Each tab is one local node. Local presence and packets travel between tabs on the **same website origin** using BroadcastChannel; all imported events enter a receiver-controlled HOLD inbox. JSON export/import provides a manual cross-device path. Static Live makes an HTML/print bulletin from reviewed notes and shared Garden entries. No remote backend, AI API, tracking, credentials, third-party scripts, or payments.

## Standalone source in this branch

This experimental branch carries a **single self-contained `index.html`** with embedded CSS and JavaScript. Open it from an HTTPS static site or on localhost. The separately downloadable source kit contains the modular `core.mjs`, `app.mjs`, `style.css`, and Node tests; those files are not committed here. This branch is not merged into `main`.

## Start

```bash
cd node-zero
python3 -m http.server 8787
# Open http://localhost:8787/ in TWO separate tabs.
```

The files can also be opened locally by some browsers, but automatic cross-tab discovery depends on same-origin BroadcastChannel and is best tested over localhost/HTTPS. On a phone, use a normal HTTPS static host to test tab-to-tab discovery. **Two different devices are not discovered automatically.** Exchange JSON bundles manually; the receiver must review and admit each packet.

## Two-tab field rehearsal

1. Tab A: rename **Request desk**, create a fictional need, click **Share to room**.
2. Tab B: rename **Volunteer desk**, visit **Ledger**, review incoming `need.opened`, **Keep on this node**; go Garden and click **Offer help**.
3. Tab A: review incoming `offer.proposed` in Ledger, Keep, return Garden and **Accept this offer**.
4. Tab B: Keep the `offer.accepted` packet, Garden → **Report work**. It is only a self-report.
5. Tab A: Keep the `fulfillment.reported` packet, Garden → **Review / confirm report**. It is only the requester's assertion, not independent proof.
6. Tab A: **Static Live** → add meeting observations → **Compose bulletin** → Download printable HTML.

For true human use, don't claim a real exchange until an actual person has voluntarily participated and the requester has independently confirmed the material result. The software cannot verify that itself.

## Design boundaries

- **Authority:** local aliases are **not identities**, self-attested actions are **not signed reLATTE crossing receipts**. A copied JSON packet can be forged. No independent reviewer, actor authentication, signatures, identity verification, or delivery confirmation beyond participant assertions.
- **Privacy:** stored in the browser's unencrypted localStorage. Do not enter contact information, exact pickup addresses, minors' information, legal/medical records, sensitive needs, confidential meeting details, or third-party names. Other same-origin tabs can potentially access the storage; anyone with the exported JSON can read its content.
- **No remote exchange:** same-origin BroadcastChannel only works among tabs sharing a browsing storage partition, not across devices. File transfer is an out-of-band manual step.
- **Peer discovery:** temporary self-declared capabilities, not permissions or availability guarantees.
- **Receiver consent:** broadcasts reach a receiver's inbox as HOLD; they do not join its ledger without action.
- **Persistence:** events are stored per session-tab node ID. The session identity may not survive closing the tab; **export JSON before closing**. Reloading the same tab typically retains it.
- **Scope:** no authenticated shared Campfire, real Garden/Help Slip backend, Supabase writes, autonomous AI, uploads, publishing, email, payments, or external actions.
- **Storage/event caps:** maximum 1,000 events; 250 incoming packets and 2 MB imports. No cryptographic audit chain. JSON bundles are untrusted data.
- **Projection:** designed for one basic fulfillment per need. Multiple competing offers and corrections/disputes require a future protocol revision. Report and confirmation are intentionally distinct from physical proof.

## Relationship to existing source-owned projects

- JAR;VIS: bounded attention / proposal / witness patterns. This specimen does not modify the local Genesis mock relay or inherit notebook.
- BananaSpork / Garden: compatible *conceptual lifecycle* (`need.opened → offer.pledged → offer.accepted → fulfillment.reported → fulfillment.confirmed`), **not** its authenticated RPCs or canonical BananaGram envelopes.
- reLATTE: manual packets are **not** reLATTE-signed envelopes or signed receiving dispositions.
- Static Live: printable human-reviewed bulletin is a first artifact, **not** a live recording, transcription, or publication service.

## Test

```bash
node --test test/core.test.mjs # run from the separately downloadable modular kit
```

To host it on a free static site, publish this branch's standalone `index.html` under a single HTTPS directory. Do not enable public Garden intake without a consent, safety, abuse moderation, and authenticated authority design.