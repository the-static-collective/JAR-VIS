# CARAVAN 001 — local portable room
Optional standalone CLI in existing JAR;VIS PR #79. Node 22+, no npm dependency or network. Run from tools/caravan. See private conversation package CARAVAN-001.zip for full walkthrough, HARVEST runtime and reproducible cross-process trial. No production or JAR;VIS server changes.

- node caravan.mjs init Alpha "Fictional room"
- node request.mjs RECEIVER_FINGERPRINT request.json
- node caravan.mjs offer Alpha request.json
- node caravan.mjs export Alpha OFFER_DIGEST offer.json
- node caravan.mjs import Beta offer.json
- node caravan.mjs reply Beta OFFER_DIGEST HOLD "No activity authorized."
- node caravan.mjs export Beta RESPONSE_DIGEST response.json
- node caravan.mjs import Alpha response.json
- node caravan.mjs status Alpha
- node caravan.mjs backup Alpha alpha-backup.json
- node caravan.mjs restore Alpha-Recovered alpha-backup.json EXPECTED_SHA256

Each room created independently. Compare full fingerprints out of band. Hidden passphrase prompt on each command; never put credentials in commands/chat. Restore only into fresh root; restored identity is same key, never operate both copies concurrently. Public-safe signed plaintext exports only, no private data. AES-256-GCM encrypted vault, PBKDF2-SHA256 600000, fresh salt and IV, adapted from webZ Outbox vault blob 5e94bc62fa40df936f78d731e5ad067a90cf8d13. Key briefly exportable in memory at creation; nonextractable on unlock. No security audit, trusted time, key rotation/revocation, antirollback, encrypted transmission, secure erase or crash-proof journal. Trusted local quiescent filesystem, restrict access, no shared/sync directories. Do not delete stale lock until verifying no live process. No passphrase recovery. 64 packets / 1 MiB plaintext bound.

Exact source donor webZ PR #258 commit 0a0311db595f65c3ce4f542a8b4db126c85e4c6d, protocol and Foundry blobs 3bbb66b92305dae295a8717a39ed5d5f5b752709 and 0daa32efd8240c81f4f48be618821898bebcbe35. Local CLI and custody blobs 00df8ff856192ce32b6e9fbd2fbc86cf29cce863 and de1f7355a92a5b90e14f80148ff710fc23480a90 verified upstream. node --test tests/*.test.mjs: 16/16 inherited tests passed locally. Separate portable.py (package only) ran 22 assertions across 24 CLI invocations, distinct fictional keys, signed addressed offer/HOLD, tamper/duplicate/wrong password rejection, restart, backup restore, actual parity-reconstructed encrypted vault and same-key restore. HARVEST 2 files exact, 1 regenerated, 3 ephemeral assents, missing assent refused; MEMENTO local contact recorded, duplicate refused. Private package 56941 bytes SHA256 2c74e96337cafe9e508d466a22e3c3f44a91a61cd3ddb8bcfa89a3cba8590f17. Test private keys and encrypted backups not packaged. No real device test, Windows/Mac acceptance, native reLATTE translation, StaticID, Fileport delivery, GHoT resource integration or CI. Reviewed reLATTE protocol and receiver (receiver stores private JWK on disk), not executed. No reusable launcher found in scoped JAR;VIS search; new shell wrappers. No deployment/merge. admission:none.
