# Genesis 003 — The First Real Door

**Status:** source-reading executable; localhost only. **No live BODY, plan state, executor, or authenticated steward has been connected.**

## The crossing we actually earned

Genesis 001 introduced the semicolon authorization gate. Genesis 002 introduced a local interactive attendant and persistent simulated receipts.

Genesis 003 adds **explicit, bounded reads of independently owned public GitHub documentation**, without impersonating those projects:

- **GHoT:** requests the published `docs/EXECUTOR-PANTRY.md` from `the-static-collective/GHoT`. Extracts the exact list under **V0 executors** and marks each as a *documented executor type*, **not** a host's available capacity or a callable adapter.
- **planZ:** requests the public `README.md` from `the-static-collective/planZ`. Reports the *published plan-census purpose*, **not** an available plan API or recovered private history.
- **Kinship, reLATTE, Abundent, PENNY:** remain planned or in-process mocks and do not become connected by implication.

Both GitHub source paths are hard-coded in the server's allowlist. The user chooses to inspect; the server sends an outbound **GET** of the specified public text only. No free-form URL, URL redirection, source code execution, repository mutation, token, or private-account search is permitted.

## On the wire

~~~text
USER CLICKS "INSPECT PUBLISHED SOURCE"
            ↓
local UI → localhost POST /api/inspect-door (anti-CSRF)
            ↓
exact allowlisted repository + fixed path + HTTPS GET
            ↓
bounded text-only response (≤ 128 KiB, 5.5-second timeout)
            ↓
source-specific parser / reject unrecognized content
            ↓
SHA-256 of fetched bytes; URL, ref and observed timestamp
            ↓
DOOR_INSPECTED journal event → visible provenance + documentary cards
~~~

No discovered capability is invokable. Inspecting the source doesn't move an actuator, assign GHoT work, admit a reLATTE envelope, or update planZ.

The GitHub `main` branch is mutable. The source content hash identifies the **bytes seen on that particular read**, not a verified Git commit, cryptographic source authorship, signed human consent, or persistent runtime identity. A new read may differ. Historic observations retain their timestamp and are not labeled live.

## Try it

~~~sh
npm test
npm start
~~~

Open `http://127.0.0.1:7789` on the same machine. Scroll to **Project doors**, press **Inspect published source** on GHoT or planZ, and inspect each item's URL, SHA-256 digest, timestamp, status and documentary capability labels. These reads require internet connectivity to the public GitHub raw-content service.

Restart the attendant; the last successfully observed source snapshots remain visible in the local journal. If the source is unavailable, no new observation is created and previous observations are not upgraded to present truth.

The tests inject fake HTTP responses; **the suite never contacts GitHub**. It checks allowlisting, parsing, unavailable/malformed/oversize responses, no execution, journal integrity and restart, and HTTP anti-CSRF gating.

## Constitutional seam

~~~text
DISCOVERY ≠ TRUST
PUBLISHED DOCUMENTATION ≠ LIVE CAPABILITY
LIVE CAPABILITY ≠ EXECUTION PERMISSION
OBSERVATION ≠ ADMISSION
SOURCE HASH ≠ SOURCE SIGNATURE
RECEIPT ≠ FULFILLMENT
~~~

### Next door (not yet built)

To *act* via GHoT or query non-public planZ source, the owning project will need to **publish a versioned source-controlled capability manifest** (or a signed runtime advert), authenticate the origin/key, specify data and effect scopes, secure local consent, negotiate an independent receiver-owned admission, protect against replay, and return signed receipts. JAR;VIS must remain a consumer of owner-declared capabilities rather than mint them for other systems.

This slice intentionally avoids editing or claiming to install a manifest in GHoT or planZ. Their public documents remain canonical for their current claims.
