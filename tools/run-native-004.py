#!/usr/bin/env python3
"""Operator-controlled native OpenManus -> original ELF lineage rehearsal.

This is NOT a Table & Road card authoring pipeline, nor does OpenManus
execute within the original ELF occurrences. The original frozen model
specimen is still required. This wrapper invokes exact inspected source
projects, not a copied or expanded version of their providers.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

WORKBENCH_PIN = "460b3788d01ec068001b5708654c045d2566532a"
LOADOUT_PIN = "dd5456d45946271e2d20d1dc6145b71576d2380b"
OPENMANUS_PIN = "3309bf4e416fb1c74b008f3e86494439a31bad53"


def head(folder: Path) -> str:
    return subprocess.run(
        ["git", "-C", str(folder), "rev-parse", "HEAD"],
        text=True, capture_output=True, check=True, timeout=10
    ).stdout.strip()


def outside(path: Path, root: Path) -> bool:
    return not (path == root or root in path.parents or path in root.parents)


def run_native(*, workbench: Path, loadout: Path, provider: Path,
               provider_python: Path, output: Path) -> dict:
    roots = [p.resolve(strict=True) for p in (workbench, loadout, provider)]
    for folder, expected in zip(roots, (WORKBENCH_PIN, LOADOUT_PIN, OPENMANUS_PIN)):
        if not folder.is_dir() or head(folder) != expected:
            raise ValueError("Source checkout not at inspected pin; HOLD")
    python = provider_python.resolve(strict=True)
    if not python.is_file():
        raise ValueError("Original OpenManus environment interpreter missing; HOLD")
    if output.exists() or output.is_symlink():
        raise ValueError("Output path already exists; HOLD")
    result = output.resolve(strict=False)
    if not result.is_absolute() or not all(outside(result, folder) for folder in roots):
        raise ValueError("Output overlaps source checkout; HOLD")
    # An intentional, private working directory. No external publishing.
    result.mkdir(parents=True, mode=0o700, exist_ok=False)
    child = result / "live-child"
    child.mkdir(mode=0o700)
    evidence = result / "live-evidence"
    lineage = result / "elf-lineage"
    # Minimal allowlist. Do not forward cloud API credentials to model harness.
    env = {k: os.environ[k] for k in ("PATH", "HOME", "LANG", "LC_ALL", "VIRTUAL_ENV")
           if k in os.environ}
    env["PYTHONPATH"] = str(roots[0])
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    def call(args: list[str], timeout: int) -> None:
        proc = subprocess.run(
            [sys.executable, *args], cwd=roots[0], env=env,
            capture_output=True, text=True, timeout=timeout, check=False
        )
        if proc.returncode:
            # Do not emit provider transcripts, model answers or user paths.
            raise ValueError("Native pinned donor returned HOLD (output withheld)")
    call([
        "-m", "static_workbench.elf_live_027",
        "--loadout-root", str(roots[1]),
        "--provider-checkout", str(roots[2]),
        "--provider-python", str(python),
        "--workspace", str(child),
        "--output", str(evidence),
        "--model-config-class", "local-ollama",
        "--timeout-seconds", "90",
        "--max-steps", "8",
        "--approve-live-provider", "yes"
    ], timeout=210)
    call([
        "-m", "static_workbench.elf_live_lineage_029",
        "--loadout-root", str(roots[1]),
        "--live-bundle", str(evidence / "openmanus-live-001.json"),
        "--workspace", str(child),
        "--live-gate-summary", str(evidence / "elf-live-gate-summary.json"),
        "--output", str(lineage),
        "--approve-hatch", "yes"
    ], timeout=120)
    # No test-only simulator or summary-trust substitute. A second independent
    # process imports the original Workbench verifier and checks original bytes.
    verify_script = Path(__file__).with_name("verify-native-029.py")
    checked = subprocess.run([
        sys.executable, str(verify_script),
        "--workbench-root", str(roots[0]),
        "--loadout-root", str(roots[1]),
        "--live-bundle", str(evidence / "openmanus-live-001.json"),
        "--live-gate-summary", str(evidence / "elf-live-gate-summary.json"),
        "--workspace", str(child),
        "--lineage-root", str(lineage)
    ], cwd=roots[0], env=env, capture_output=True, text=True, timeout=90, check=False)
    if checked.returncode != 0:
        raise ValueError("Cold native witness refused output; HOLD")
    result_json = json.loads(checked.stdout)
    if result_json.get("schema") != "jarvis.house-party-native-observation/v0":
        raise ValueError("Cold native witness returned an unrecognized shape; HOLD")
    return result_json


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run the exact old native specimen (not a Garden card) under explicit operator control."
    )
    for arg in ("workbench-root", "loadout-root", "openmanus-root",
                "provider-python", "output-root"):
        parser.add_argument("--" + arg, required=True, type=Path)
    parser.add_argument("--approve-live-model", required=True, choices=["yes", "no"])
    parser.add_argument("--approve-elf-copies", required=True, choices=["yes", "no"])
    args = parser.parse_args()
    if args.approve_live_model != "yes" or args.approve_elf_copies != "yes":
        print("JARVIS_NATIVE_HOLD: separate affirmative approvals required", file=sys.stderr)
        return 2
    try:
        output = run_native(
            workbench=args.workbench_root,
            loadout=args.loadout_root,
            provider=args.openmanus_root,
            provider_python=args.provider_python,
            output=args.output_root
        )
    except (OSError, ValueError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, json.JSONDecodeError) as error:
        print("JARVIS_NATIVE_HOLD: original pinned rehearsal did not fully verify", file=sys.stderr)
        return 2
    print(json.dumps(output, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
