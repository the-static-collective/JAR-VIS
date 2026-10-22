# GENESIS 005 — FIRST LIVE GUESTS

**Source-controlled integration: implemented. Default CI: offline tests only.**
**Actual new 005 native model run: not yet executed or verified here.**

This slice provides a *real-model-capable*, operator-triggered integration of:
1. the **original exact-pinned LOADOUT compiler + effect membrane**,
2. two distinct executions of the **original bounded OpenManus ToolCallAgent worker** (one drafter and one reviewer),
3. two **original GENESIS-ELF-001 data-copy hatches** on their separately produced outputs with native ELF verification,
4. a local JAR;VIS return path that journals an operator-supplied report as **unverified testimony** and always holds publication.

The browser never runs a model, executes a subprocess, or inherits authority from a JSON report. The fixture from 004 remains separate and functional.

## What happens with a real model

```text
FICTIONAL WASECA GARDEN NEED + OFFER
  -> operator approval (on host / no browser endpoint)
  -> pinned LOADOUT compile + exact body/effect/state fence
  -> original OpenManus ToolCallAgent worker A (LOCAL_MUTATE)
  -> card.md / facts + privacy validation
  -> original ELF hatch A: VERIFIED COPY of model's card bytes
  -> separate pinned LOADOUT compile + model worker B (LOCAL_MUTATE)
  -> review.md / human-HOLD validation, fresh worker context
  -> original ELF hatch B: VERIFIED COPY of review bytes
  -> JAR;VIS native report (digest and receipts; unsigned)
  -> operator manually imports report into JAR;VIS
  -> UNVERIFIED_OPERATOR_TESTIMONY / HOLD_HUMAN_REVIEW
```

**Crucial distinction:** OpenManus workers run as **two distinct Python model processes**, each behind a native LOADOUT compiler/membrane. The native ELF hatches happen **after** the model processes to witness output bytes. Neither model actually executes *inside* an ELF occurrence; the ELF receipt intentionally declares `deterministic_fixture_not_openmanus`. The two ELF receipts are independent, not cryptographic identities, and no parent relationship is falsely claimed.

The independent reviewer is another model call with a new ToolCallAgent. A deterministic check also validates both artifacts. This does not establish impartiality, correctness, human approval, or OS sandbox confinement.

## Exact source pins

```text
LOADOUT:          dd5456d45946271e2d20d1dc6145b71576d2380b
static-workbench: 460b3788d01ec068001b5708654c045d2566532a
OpenManus:        3309bf4e416fb1c74b008f3e86494439a31bad53
```

The native runner checks each Git HEAD. The LOADOUT/OpenManus donor code is not copied into this repo. Its local executable worker lives in the pinned LOADOUT `contrib/openmanus/worker.py`, with only original bounded `read_text`, `write_text`, `calculate` and `Terminate` tools. The worker does not receive generic shell/browser/MCP/Python tools.

No broader provider tool claim is made. This is **not** an OS sandbox: Python itself, the model dependencies and Ollama are still ordinary local processes. Run only in a disposable machine/runner when handling trusted synthetic content.

## Operator invocation

Provision an Ollama instance serving `qwen2.5:3b` on loopback, the original pinned OpenManus virtualenv with requirements installed and `config/config.toml` containing the local Ollama profile, and local Git checkouts at the three exact commits.

With Python 3.12:

```bash
python3 tools/run-live-guests-005.py \
  --loadout-root /path/LOADOUT-at-pin \
  --workbench-root /path/static-workbench-at-pin \
  --openmanus-root /path/OpenManus-at-pin \
  --provider-python /path/openmanus-venv/bin/python \
  --output-root /tmp/new-jarvis-party-005 \
  --approve-local-model yes \
  --approve-elf-copies yes
```

A successful run makes `/tmp/new-jarvis-party-005/jarvis-native-005.json` with the card and review text, source hashes, two provider receipts summarized, two ELF-copy receipt digests, and all publication/admission/OS-sandbox claims explicitly `false`.

**No automatic publishing or web deployment.** The directory must be newly created and outside all source repositories. Wrong Git pins, absent model, missing writing, edited source files, malformed review, invented contacts or currencies, and failed independent ELF verification cause HOLD, never a fake deterministic model-success fallback. Nonzero exit means HOLD. Partial failed working directories should be treated as evidence of a failed attempt, not a reusable workspace.

### Opt-in GitHub Actions

The `House Party 005 — opt-in genuine local OpenManus guests` workflow is **manual only** (`workflow_dispatch`); it does not run on PRs or merges. From GitHub's Actions page, explicitly supply the required phrase `I_APPROVE_LOCAL_MODEL`. It clones exact source commits, installs a temporary OpenManus environment, starts the pinned Ollama Docker image on loopback, runs the *two new task-specific model workers*, native ELF hatches and final validation. A success publishes **only a short digest-only summary** artifact for 7 days. The complete card, model transcript, guest workspaces and Ollama files remain ephemeral in the runner. The run is a resource-intensive test and may refuse due to unavailable dependencies, infrastructure, model compliance or timeout.

Default GitHub CI only runs `npm test`, offline Python contract tests, and Python syntax checks. **A default green CI is not a claim of 005 live-model execution.**

## Return into the JAR;VIS Workbench

Start local JAR;VIS with `npm start`, open `http://127.0.0.1:7789`, locate House Party → **Return a native guest report**, and select the output JSON. The `/api/import-native` endpoint:
- requires a same-origin anti-CSRF token;
- refuses invalid scopes, modified card/review bytes, disallowed authority claims, wrong pins, incorrect context and unsupported ELF-copy metadata;
- records a local `NATIVE_REPORTED` event only after structural/digest checks;
- deduplicates by occurrence party ID, and never dispatches, publishes or certifies a model run.

**An importable JSON is forgeable.** SHA-256 proves only the JSON's internal text consistency. The UI labels every imported report **UNVERIFIED_OPERATOR_TESTIMONY**. Only a future cryptographically attributable evidence verifier with source-owned admission can legitimately upgrade provenance. Import does not prove the source ran or that a second model independently reviewed it.

## Acceptance conditions and next cuts

- Native offline contract tests prove fail-closed gates without downloading a model.
- A genuine new native 005 CI run must pass **separately** before a model-executed-005 claim is made.
- For full ELF agent-inhabitation, create an owner-authorized native ELF executor/agent lifecycle. Existing GENESIS ELF performs data-copy hatches only; do not rename copies into living agent runtimes.
- For public use, build human source verification, independently authenticated and revocable permissions from involved stewards, a receiver-local admission protocol and an explicitly authorized publication adapter.

```text
LOADOUT COMPILED != WORLD AUTHORIZED
MODEL PRODUCED BYTES != TRUE CONTENT
ELF COPIED OUTPUT != ELF RAN MODEL
JSON IMPORTED != NATIVE EXECUTION PROVEN
HOLD HUMAN REVIEW != ADMITTED PUBLICATION
```
