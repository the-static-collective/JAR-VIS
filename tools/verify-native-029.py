#!/usr/bin/env python3
"""Cold import of *native* STACK²-029 evidence into a bounded JAR;VIS observation.

This file NEVER runs an agent or copies external evidence into JAR memory.
It imports the exact original Workbench verifier at an operator-specified checkout,
rechecks the original LOADOUT native bundle and both ELF occurrences from disk,
and emits a non-authoritative digest-only observation.

No schema field claims that OpenManus performed the ELF hatches, and no person
or project authority is conveyed. The original pinned verifier is required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

WORKBENCH_PIN = "460b3788d01ec068001b5708654c045d2566532a"
LOADOUT_PIN = "dd5456d45946271e2d20d1dc6145b71576d2380b"
UPSTREAM_PIN = "3309bf4e416fb1c74b008f3e86494439a31bad53"


def git_head(root: Path) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=10, check=True
    )
    return result.stdout.strip()


def verify_native(*, workbench_root: Path, loadout_root: Path,
                  live_bundle: Path, live_gate_summary: Path,
                  workspace: Path, lineage_root: Path) -> dict:
    for path in (workbench_root, loadout_root, live_bundle,
                 live_gate_summary, workspace, lineage_root):
        if path.is_symlink():
            raise ValueError("Source path symlink; HOLD")
    if git_head(workbench_root) != WORKBENCH_PIN:
        raise ValueError("Workbench native verifier is not at the inspected STACK2 029 pin; HOLD")
    if git_head(loadout_root) != LOADOUT_PIN:
        raise ValueError("LOADOUT native verifier is not at the original pin; HOLD")
    sys.path.insert(0, str(workbench_root.resolve()))
    from static_workbench.elf_live_lineage_029 import (
        live_source, recheck_lineage, REPORT_NAME, UPSTREAM_OPENMANUS
    )
    if UPSTREAM_OPENMANUS != UPSTREAM_PIN:
        raise ValueError("OpenManus upstream pin mismatch; HOLD")

    source, fingerprints = live_source(
        loadout_root=loadout_root, live_bundle=live_bundle,
        workspace=workspace, live_gate_summary=live_gate_summary
    )
    report = recheck_lineage(
        output=lineage_root, source_bytes=source, fingerprints=fingerprints
    )
    if not (
        report.get("live_model_occurrence") == "SPECIMEN_SCOPED_PASS"
        and report.get("live_source_verification") == "ORIGINAL_LOADOUT_RECHECK_PASS"
        and report.get("first_elf_verified") is True
        and report.get("successor_elf_verified") is True
        and report.get("first_elf_id") != report.get("successor_elf_id")
        and report.get("authority_inherited") is False
        and report.get("seedbank_admitted") is False
        and report.get("new_cryptographic_signature") is False
        and report.get("os_sandbox_verified") is False
        and report.get("elf_producer") == "deterministic_fixture_not_openmanus"
        and report.get("loadout_source_pin") == LOADOUT_PIN
        and report.get("openmanus_source_pin") == UPSTREAM_PIN
    ):
        raise ValueError("Native report does not satisfy exact non-authority constraints; HOLD")
    original_report = lineage_root / REPORT_NAME
    report_hash = hashlib.sha256(original_report.read_bytes()).hexdigest()
    return {
        "schema": "jarvis.house-party-native-observation/v0",
        "producer": "STACK2-029 original native verifier",
        "workbench_source_pin": WORKBENCH_PIN,
        "loadout_source_pin": LOADOUT_PIN,
        "openmanus_source_pin": UPSTREAM_PIN,
        "native_report_sha256": report_hash,
        "model_output_sha256": fingerprints["model_output_sha256"],
        "original_live_bundle_sha256": fingerprints["source_bundle_sha256"],
        "first_elf_receipt_sha256": report["first_elf_receipt_sha256"],
        "successor_elf_receipt_sha256": report["successor_elf_receipt_sha256"],
        "two_original_elf_hatches_verified": True,
        "original_openmanus_model_output_verified": True,
        "model_executed_inside_elf": False,
        "openmanus_authored_table_road_card": False,
        "human_authority_inherited": False,
        "new_cryptographic_signature": False,
        "published": False,
        "disposition": "HOLD_FOR_HUMAN_REVIEW",
        "description": "Cold-verified native 029 specimen, not a full agent house party or live Garden card."
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cold recheck existing real OpenManus and two original ELF hatches; no agent launch."
    )
    for name in ("workbench-root", "loadout-root", "live-bundle",
                 "live-gate-summary", "workspace", "lineage-root"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    try:
        observation = verify_native(
            workbench_root=args.workbench_root,
            loadout_root=args.loadout_root,
            live_bundle=args.live_bundle,
            live_gate_summary=args.live_gate_summary,
            workspace=args.workspace,
            lineage_root=args.lineage_root
        )
    except (OSError, ValueError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, ImportError) as error:
        print("JARVIS_NATIVE_HOLD: original evidence or verifier unavailable/mismatched", file=sys.stderr)
        return 2
    print(json.dumps(observation, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
