# JAR;VIS × CANNON Stranger Arcade 002 — locked native operator doorway

This experimental JAR;VIS contribution adds a **separate attendant doorway** to the native [CANNON CONSTELLATION-002 PR #49](https://github.com/the-static-collective/CANNON/pull/49) at exact commit `f99d4b0f74b117e0af034137d550e88aa3d01f26`. It stacks on JAR;VIS [PR #28](https://github.com/the-static-collective/JAR-VIS/pull/28); the original CONSTELLATION-001 attendant and its fixed #45 pin remain unchanged.

## What changed

`inspectCannon(checkout, optionalSourceLock)` now accepts an **optional** independent source lock. Its original default remains the existing CONSTELLATION-001 lock. New `tools/arcade.mjs` verifies the exact #49 commit, original tracked tree/blob bytes, source URL configuration, and immutable ancestor chain through #47 → #45 → #38 → #37 → #5 **before** any local native command. Missing or modified sources fail closed.

`inspect` is source-only. `build` delegates to **the original CANNON #49 command** with explicit `LOCAL_FICTIONAL_ONLY` authorization; `verify` cold-replays the same packet without acquiring any new grant; `challenge` accepts an explicitly prepared local request and delegates to the original fixed challenge entrypoint. No shell, unselected model, external source-code branch or user-provided module name can be substituted. The operator loopback UI/server is owned by CANNON and is not duplicated here.

CANNON's externally fetched CI artifact (SHA-256 receipt ID `c479ce4aa4bc767314507ca2198154129813e0e854302956a8f7fdf64d46ea0e`) reports **22 original executing donor repositories**, **64 verified documentary source owners**, and **69 distinct public repositories participating**. Those are exact native software claims, *not* 69 executed runtimes, 69 verified field participants or independent human testimony. A new inspect-only call reports these as **expected** counts, not observed live work; build/verify results are returned unaltered from CANNON.

## Usage

Requirements for the *native* CANNON machine: Linux x86_64, Node 24+, Python 3.11+, Git, npm. Install/acquire the exact public dependencies explicitly through CANNON's recorded instructions. After acquisition, no network or private credentials are required to build/verify.

```sh
# In this JAR;VIS branch with CANNON checked out at its exact locked #49 commit:
node tools/arcade.mjs inspect --cannon ../cannon

# One-time acquisition is always source-owned, never delegated to JAR;VIS:
node ../cannon/scripts/arcade-machine.mjs acquire --into ../arcade-inputs

# Source-verified local fictional build (no real people, physical acts or outreach):
node tools/arcade.mjs build --cannon ../cannon --config ../arcade-inputs/config.json --out ../arcade-output --authorize LOCAL_FICTIONAL_ONLY

# Independent fresh-process replay of the same fixed source bytes:
node tools/arcade.mjs verify --cannon ../cannon --config ../arcade-inputs/config.json --out ../arcade-output

# An optional new challenge requires an explicit local request file and local scope:
node tools/arcade.mjs challenge --cannon ../cannon --config ../arcade-inputs/config.json --request ../fixture-challenge.json --out ../challenge-output --authorize LOCAL_FICTIONAL_ONLY

# To operate the loopback UI, use the fixed CANNON source owner's server directly:
node ../cannon/scripts/arcade-machine.mjs serve --config ../arcade-inputs/config.json --out ../arcade-output --sessions ../arcade-sessions --port 7792
```

CANNON retains all authorization/revocation/idempotency logic. JAR;VIS does not claim its `inspect` call executes 22 owners; only real CANNON build/challenge does. The five scenarios (MIT, Voqal, Garden, Jubilee, Commons) are fictional, with consent, energy, source, rights, reviewer, institutional and physical HOLD boundaries preserved.

### For prospective reviewers

A downloadable, offline **first-boot HTML** and printable **evidence passport** exist in the source-verified CANNON artifact, together with exact manifests, original-stage results, and full cold replay instructions. The standalone HTML provides inspect-only behavior; interactive native challenges require the local CANNON server. Institution or fellowship application drafts are separate: this runner never opens or submits any portal.

No merges, deployments, outgoing messages, payments, real personal information, independently witnessed physical acts, or funder/partner endorsements occur through this integration.
