# HARVEST 050 — private operator return

Source-owned adapter: [convergent-codec at fcba098](https://github.com/the-static-collective/convergent-codec/tree/fcba0981514c8891896bd56b5aa6563f68141d2f/research/harvest-050/integration). Vendored exact Git blob `5af40cb00df03d32cbd1a046f8b6f77f1c9ff726`. The Python exporter rechecks a local restored directory against a separately pinned CC1 manifest and receipt bytes, then emits a small canonical JSON card. It omits private paths, contents, approval IDs and credentials; hashes and counts remain private metadata. A receiver checks an independently obtained raw card SHA-256. A digest match does not authenticate the exporter, establish current authority, or verify a claimed recovery independently. Keep the pin separately; never derive the expected pin from the received card itself.

No network, app login, background work, UI or production activation. Node 20+; trusted local paths. No automatic writing, execution, publication, grant, or admission.

## Operator review

```sh
node tools/harvest-return.mjs jarvis RETURN.json EXPECTED_SHA256
```

Returns `HOLD_FOR_OPERATOR_REVIEW`, `authority: NONE`, `admission: none`, `executed: false`. This extends the local held-only pattern from [BRIDGE-005](BRIDGE-005.md) without pretending the public Bridge protocol accepts private data. No workbench server route added. Keep output local; operator may review it alongside the original receipt under existing permission. It does not grant recovery permissions or call GHoT, MOTIF, or any model.

