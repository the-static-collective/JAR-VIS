#!/usr/bin/env python3
"""HOUSE-PARTY-005: operator-triggered REAL bounded OpenManus guests.

Requires exact inspected LOADOUT, Workbench ELF and upstream OpenManus sources.
Each guest is an independently launched LOADOUT-scoped ToolCallAgent worker.
Original GENESIS-ELF-001 then hatches verified *copies of their outputs*:
an ELF copy is NOT an agent runtime, and cannot inherit credentials.

No browser invocation; no network publication; no arbitrary tools exposed by
the worker. This is not an OS-enforced sandbox. Local Ollama access is required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid

LOADOUT_SHA = "dd5456d45946271e2d20d1dc6145b71576d2380b"
WORKBENCH_SHA = "460b3788d01ec068001b5708654c045d2566532a"
OPENMANUS_SHA = "3309bf4e416fb1c74b008f3e86494439a31bad53"
SCHEMA = "jarvis.house-party-live-testimony/v0"
MAX_CARD = 3000
MAX_REVIEW = 2500
MAX_CONTEXT = 1500

CONTEXT = (
    "TABLE & ROAD / FICTIONAL GARDEN SPECIMEN ONLY\n"
    "Garden need: 12 boxes of produce; region Waseca, MN (demo).\n"
    "Grower offer: 20 boxes of produce; same demo region.\n"
    "Need ID: garden.need.produce-001\n"
    "Offer ID: garden.offer.produce-001\n"
    "Both participants are fictional. Inventory, location, consent and delivery "
    "have NOT been verified. No personally identifying or contact information.\n"
)
DRAFT_PROMPT = (
    "Read context.txt. Create card.md: a brief, warm, printable Table & Road "
    "community-card DRAFT from the supplied fictional facts only. Clearly write "
    "'DRAFT', 'fictional', 'Waseca', '12 boxes', '20 boxes', 'produce', and a "
    "sentence about human review and both participants' permission. "
    "Do not invent addresses, links, real names, fundraising/payment instructions, "
    "or claims of confirmed inventory. Write ONLY card.md, no other files. "
    "Finish using Terminate."
)
REVIEW_PROMPT = (
    "Read context.txt and card.md. As a fresh independent reviewer, inspect "
    "whether card.md accurately reflects the two numbers, fictional status, "
    "no real-world coordination, and human permission requirement. "
    "Write review.md (under 1500 chars) beginning with exactly "
    "'HOLD_HUMAN_REVIEW' if the draft is suitable only for human review, "
    "otherwise begin with 'REFUSE_DRAFT'. Explain specific findings "
    "briefly and do not invent contacts or claim publication. "
    "Write ONLY review.md, no other files. Finish using Terminate."
)

def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)

def git_head(root: Path) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=10, check=True
    )
    return result.stdout.strip()

def exact_root(path: Path, expected: str) -> Path:
    require(not path.is_symlink(), "SOURCE_SYMLINK_HOLD")
    root = path.resolve(strict=True)
    require(root.is_dir() and git_head(root) == expected, "EXACT_SOURCE_PIN_HOLD")
    return root

def within(parent: Path, child: Path) -> bool:
    return child == parent or parent in child.parents

def check_new_output(output: Path, source_roots: list[Path]) -> Path:
    require(not output.exists() and not output.is_symlink(), "OUTPUT_ALREADY_EXISTS_HOLD")
    path = output.resolve(strict=False)
    for root in source_roots:
        require(not within(root, path) and not within(path, root), "SOURCE_OUTPUT_OVERLAP_HOLD")
    require(path.parent.is_dir(), "OUTPUT_PARENT_MISSING_HOLD")
    return path

def safe_text(path: Path, limit: int) -> str:
    require(path.is_file() and not path.is_symlink(), "MISSING_OR_SYMLINK_OUTPUT_HOLD")
    raw = path.read_bytes()
    require(0 < len(raw) <= limit, "OUTPUT_TOO_LARGE_HOLD")
    return raw.decode("utf-8")

def valid_card(card: str) -> tuple[bool, tuple[str, ...]]:
    checks = {
        "synthetic_label": "fictional" in card.lower() and "draft" in card.lower(),
        "need_quantity": bool(re.search(r"\b12\s+boxes\b", card, re.I)),
        "offer_quantity": bool(re.search(r"\b20\s+boxes\b", card, re.I)),
        "region": "waseca" in card.lower(),
        "kind": "produce" in card.lower(),
        "permission": "human" in card.lower() and "permission" in card.lower(),
        "no_links": not bool(re.search(r"https?://|www\.|mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}", card, re.I)),
        "no_phone": not bool(re.search(r"(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", card)),
        "no_payment": not bool(re.search(r"cashapp|venmo|paypal|send money|donate at", card, re.I)),
        "no_false_fulfillment": not bool(re.search(r"already delivered|pickup confirmed|real inventory verified", card, re.I)),
    }
    return all(checks.values()), tuple(name for name, passed in checks.items() if not passed)

def valid_review(review: str) -> bool:
    return review.startswith("HOLD_HUMAN_REVIEW") and not bool(re.search(
        r"\b(PUBLISH_APPROVED|ALREADY_PUBLISHED|REAL_CONSENT_VERIFIED)\b", review, re.I
    ))

def make_context(directory: Path, second_card: bytes | None = None) -> None:
    directory.mkdir(mode=0o700, parents=False, exist_ok=False)
    (directory / "context.txt").write_text(CONTEXT, encoding="utf-8")
    if second_card is not None:
        (directory / "card.md").write_bytes(second_card)

def exact_workspace(workspace: Path, expected_input_names: set[str], output_name: str,
                    before: dict[str, bytes]) -> bytes:
    files = [p for p in workspace.iterdir()]
    require(all(p.is_file() and not p.is_symlink() for p in files), "OUTPUT_NOT_REGULAR_FILES_HOLD")
    require({p.name for p in files} == expected_input_names | {output_name},
            "UNAUTHORIZED_WORKSPACE_FILE_HOLD")
    for name, raw in before.items():
        require((workspace / name).read_bytes() == raw, "ORIGINAL_INPUT_CHANGED_HOLD")
    # Snapshot after effect checks exact final files. This is NOT a syscall or OS sandbox proof.
    return (workspace / output_name).read_bytes()

def fresh_guest(*, loader, workspace: Path, provider: Path, interpreter: Path,
                role: str, prompt: str, allowed_file: str) -> dict:
    from loadout.dev.compiler import compile_world
    from loadout.dev.membrane import invoke_effect
    from loadout.dev.model import (
        AdapterBody, CapabilitySpec, CapabilityRequest, CompileRequest,
        Disposition, EffectClass, EffectIntent
    )
    from loadout.dev.openmanus import (
        OPENMANUS_ADAPTER_ID, OpenManusJsonStdioAdapter
    )
    from loadout.dev.openmanus_live import (
        PINNED_BODY_ID, workspace_state_id, snapshot_workspace, build_child_env
    )

    before_files = {p.name: p.read_bytes() for p in workspace.iterdir()}
    expected_inputs = {"context.txt"} if role == "DRAFTER" else {"context.txt", "card.md"}
    require(set(before_files) == expected_inputs, "INPUT_WORKSPACE_NOT_FROZEN_HOLD")
    before = snapshot_workspace(workspace)
    precondition = workspace_state_id(before)
    body = AdapterBody(
        adapter_id=OPENMANUS_ADAPTER_ID, body_time_id=PINNED_BODY_ID,
        source_sha=OPENMANUS_SHA,
        capabilities=(CapabilitySpec("worker.mutate", EffectClass.LOCAL_MUTATE),)
    )
    compiled = compile_world(CompileRequest(
        task_id="JARVIS-HOUSE-005-" + role, task_text=prompt,
        cut_targets=frozenset({"workspace:party"}),
        requested_capabilities=(CapabilityRequest(
            "worker.mutate", EffectClass.LOCAL_MUTATE, "workspace:party",
            body_time_id=PINNED_BODY_ID
        ),), available_bodies=(body,)
    ))
    require(compiled.disposition == Disposition.COMPILED, "LOADOUT_COMPILE_REFUSED")
    intent = EffectIntent(
        capability="worker.mutate", effect=EffectClass.LOCAL_MUTATE,
        target="workspace:party", body_time_id=PINNED_BODY_ID,
        precondition_state=precondition,
        parameters_digest="sha256:" + sha(prompt.encode("utf-8")),
        parameters=(("request", prompt),)
    )
    env = build_child_env(provider, (), {})
    adapter = OpenManusJsonStdioAdapter(
        provider_command=(str(interpreter), str(loader)),
        workspace_root=workspace,
        body_time_id=PINNED_BODY_ID,
        child_env=env,
        timeout_seconds=120, max_steps=10
    )
    result = invoke_effect(
        compiled, intent, {PINNED_BODY_ID: adapter}, current_state=precondition
    )
    outcome = str(result.provider_disposition)
    reason = result.reason.value if result.reason is not None else "NO_REASON"
    term = adapter.provider_receipts[-1].termination if adapter.provider_receipts else "NO_RECEIPT"
    require(outcome == "COMPLETED" and result.semantic_authority is False and
            result.reason is None,
            "LOADOUT_EFFECT_" + outcome + "_" + reason + "_" + term)
    require(bool(adapter.provider_receipts) and
            adapter.provider_receipts[-1].disposition == "COMPLETED" and
            adapter.provider_receipts[-1].steps_executed > 0,
            "NATIVE_OPENMANUS_NO_SUCCESS_RECEIPT_HOLD")
    output = exact_workspace(workspace, expected_inputs, allowed_file, before_files)
    cap = MAX_CARD if role == "DRAFTER" else MAX_REVIEW
    require(0 < len(output) <= cap, "AGENT_OUTPUT_TOO_LARGE_HOLD")
    output.decode("utf-8")
    return {
        "guest_id": uuid.uuid4().hex,
        "role": role, "provider": "original-openmanus-worker",
        "source_pin": OPENMANUS_SHA,
        "loadout_compiled": True,
        "provider_receipt_disposition": "COMPLETED",
        "output_path": allowed_file,
        "output_sha256": sha(output),
        "output_bytes": output
    }

def original_elf_copy(workspace: Path, text: bytes, source_name: str,
                      root: Path) -> dict:
    from static_workbench.elf_genesis import _write_seed, hatch, verify
    require(len(text) <= 65536, "ELF_INPUT_TOO_LARGE_HOLD")
    context = root / (source_name + "-elf-input")
    context.mkdir(mode=0o700, parents=False, exist_ok=False)
    (context / "input.txt").write_bytes(text)
    seed = root / (source_name + "-elf-seed.json")
    _write_seed(seed, text, "copy", None)
    occurrence = hatch(seed, context, root / "elf-occurrences")
    passed, reasons = verify(seed, context, occurrence)
    require(passed and not reasons and
            (occurrence / "artifact.txt").read_bytes() == text,
            "ORIGINAL_ELF_VERIFY_REFUSED")
    receipt = json.loads((occurrence / "receipt.json").read_bytes())
    require(receipt["producer"] == "deterministic_fixture_not_openmanus" and
            receipt["semantic_authority"] is False and
            receipt["admitted"] is False,
            "ELF_RECEIPT_AUTHORITY_OVERCLAIM")
    return {
        "occurrence_id": occurrence.name,
        "original_elf_verified": True,
        "model_executed_in_elf": False,
        "receipt_sha256": sha((occurrence / "receipt.json").read_bytes()),
        "artifact_sha256": sha(text)
    }

def run_party(*, loadout_root: Path, workbench_root: Path,
              provider_root: Path, provider_python: Path, output_root: Path) -> dict:
    loadout = exact_root(loadout_root, LOADOUT_SHA)
    workbench = exact_root(workbench_root, WORKBENCH_SHA)
    provider = exact_root(provider_root, OPENMANUS_SHA)
    interpreter = provider_python.resolve(strict=True)
    require(interpreter.is_file(), "MODEL_RUNTIME_INTERPRETER_MISSING_HOLD")
    require((provider / "config/config.toml").is_file(), "OPENMANUS_MODEL_CONFIG_MISSING_HOLD")
    require((loadout / "contrib/openmanus/worker.py").is_file(), "ORIGINAL_WORKER_MISSING_HOLD")
    output = check_new_output(output_root, [loadout, workbench, provider])
    output.mkdir(mode=0o700, exist_ok=False)
    sys.path.insert(0, str(loadout / "src"))
    sys.path.insert(0, str(workbench))
    worker = loadout / "contrib/openmanus/worker.py"
    draft_space = output / "drafter"
    make_context(draft_space)
    draft = fresh_guest(
        loader=worker, workspace=draft_space, provider=provider,
        interpreter=interpreter, role="DRAFTER",
        prompt=DRAFT_PROMPT, allowed_file="card.md"
    )
    card_raw = draft.pop("output_bytes")
    card = card_raw.decode("utf-8")
    good, reasons = valid_card(card)
    require(good, "CARD_GUARDRAIL_HOLD:" + ",".join(reasons))
    draft_elf = original_elf_copy(draft_space, card_raw, "drafter", output)
    review_space = output / "reviewer"
    make_context(review_space, card_raw)
    witness = fresh_guest(
        loader=worker, workspace=review_space, provider=provider,
        interpreter=interpreter, role="REVIEWER", prompt=REVIEW_PROMPT,
        allowed_file="review.md"
    )
    review_raw = witness.pop("output_bytes")
    review = review_raw.decode("utf-8")
    require(valid_review(review), "REVIEWER_DID_NOT_RETURN_HOLD")
    review_elf = original_elf_copy(review_space, review_raw, "reviewer", output)
    require(draft_elf["occurrence_id"] != review_elf["occurrence_id"],
            "ELF_OCCURRENCE_COLLISION")
    report = {
        "schema": SCHEMA,
        "party_id": "native-" + uuid.uuid4().hex,
        "specimen": "fictional-table-road-card",
        "card": card,
        "card_sha256": sha(card_raw),
        "review": review,
        "review_sha256": sha(review_raw),
        "guests": [draft, witness],
        "elf_copies": [draft_elf, review_elf],
        "authority": {
            "human_permission_to_publish": False,
            "receiver_admission": False,
            "models_executed_within_elf": False,
            "signed_relatte_receipts": False,
            "os_sandbox_verified": False
        },
        "disposition": "HOLD_HUMAN_REVIEW",
        "native_pins": {
            "loadout": LOADOUT_SHA, "workbench": WORKBENCH_SHA,
            "openmanus": OPENMANUS_SHA
        }
    }
    (output / "jarvis-native-005.json").write_text(
        json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8"
    )
    return report

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ("loadout-root", "workbench-root", "openmanus-root",
                "provider-python", "output-root"):
        parser.add_argument("--" + key, type=Path, required=True)
    parser.add_argument("--approve-local-model", choices=("yes", "no"), required=True)
    parser.add_argument("--approve-elf-copies", choices=("yes", "no"), required=True)
    args = parser.parse_args()
    if args.approve_local_model != "yes" or args.approve_elf_copies != "yes":
        print("JARVIS_005_HOLD: affirmative local approvals required", file=sys.stderr)
        return 2
    try:
        report = run_party(
            loadout_root=args.loadout_root, workbench_root=args.workbench_root,
            provider_root=args.openmanus_root, provider_python=args.provider_python,
            output_root=args.output_root
        )
    except (ValueError, OSError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, ImportError, UnicodeError, KeyError) as error:
        # Report only bounded, ASCII gate codes; never emit provider stderr,
        # prompts, raw model output, environment variables, or workspace data.
        code = str(error)
        if not re.fullmatch(r"[A-Z0-9_.,:-]{1,140}", code):
            code = "UNCLASSIFIED_" + type(error).__name__.upper()
        print("JARVIS_005_HOLD_CODE: " + code, file=sys.stderr)
        return 2
    # Avoid printing source text and model output into routine logs.
    print(json.dumps({
        "disposition": report["disposition"],
        "party_id": report["party_id"],
        "artifact_sha256": report["card_sha256"],
        "review_sha256": report["review_sha256"],
        "original_elf_occurrence_count": len(report["elf_copies"]),
        "output": str(args.output_root / "jarvis-native-005.json")
    }, sort_keys=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
