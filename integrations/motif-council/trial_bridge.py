#!/usr/bin/env python3
"""JAR;VIS controlled receiver for ORIGINAL pinned MOTIF Method Tournament 003.

Only two fixed actions: preview a source-owned profile or explicitly execute
the original reviewed method inside the original bounded Docker runner.
Git origin is a fixed public repository. Questions never enter Git arguments.
No repo writes, no human records, no automatic method admission or merging.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from motif.method_tournament import run  # noqa: E402
from motif.branch_garden import HoldError  # noqa: E402

PUBLIC_REPO = "https://github.com/the-static-collective/MOTIF.git"
MAX_INPUT = 4096
MAX_OUTPUT = 196000


def request_trial():
    raw = sys.stdin.buffer.read(MAX_INPUT + 1)
    if len(raw) > MAX_INPUT:
        raise HoldError("HOLD_INPUT_BUDGET")
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise HoldError("HOLD_INVALID_JSON") from exc
    if not isinstance(payload, dict) or set(payload) != {"action", "question"}:
        raise HoldError("HOLD_UNRECOGNIZED_TRIAL_COMMAND")
    action, question = payload["action"], payload["question"]
    if action not in ("preview", "evaluate"):
        raise HoldError("HOLD_NOT_A_REVIEWED_EXECUTION_ACTION")
    if (not isinstance(question, str) or
        not 3 <= len(question) <= 180 or
        not question.strip() or
        any(ord(x) < 32 or ord(x) == 127 for x in question)):
        raise HoldError("HOLD_INVALID_QUESTION")
    # Use a *new*, disposable Git repository for each original-source read,
    # never the operator's working tree, local credentials or Git config.
    with tempfile.TemporaryDirectory(prefix="jarvis-motif-tournament-") as scratch:
        env = os.environ.copy()
        env.update({
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_ALLOW_PROTOCOL": "https",
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_PROTOCOL_FROM_USER": "0",
            "GIT_NO_REPLACE_OBJECTS": "1",
        })
        subprocess.run(
            ["git", "-c", "init.templateDir=/dev/null", "init", "-q", scratch],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=6, env=env,
        )
        subprocess.run(
            ["git", "-C", scratch, "remote", "add", "origin", PUBLIC_REPO],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=6, env=env,
        )
        # Source-owned Git subprocess calls inherit these fixed scoped values.
        old_env = {key: os.environ.get(key) for key in env if key.startswith("GIT_")}
        try:
            for key, value in env.items():
                if key.startswith("GIT_"):
                    os.environ[key] = value
            original = run(scratch, question, action == "evaluate")
        finally:
            for key, previous in old_env.items():
                if previous is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = previous

    return {
        "schema": "jarvis.motif-method-tournament-local/v1",
        "original_motif": original,
        "action": action,
        "candidateSource": "ORIGINAL_REVIEWED_UNMERGED_MOTIF_RESEARCH",
        "externalWrites": False,
        "humanDataUsed": False,
        "methodInstalled": False,
        "automaticMerge": False,
        "serverJournalChanged": False,
    }


if __name__ == "__main__":
    try:
        output = json.dumps(request_trial(), separators=(",", ":"), ensure_ascii=True)
        if len(output.encode("utf-8")) > MAX_OUTPUT:
            raise HoldError("HOLD_OUTPUT_BUDGET")
        print(output)
    except (HoldError, OSError, ValueError, TypeError, subprocess.SubprocessError):
        print(json.dumps({
            "schema": "jarvis.motif-method-tournament-local/v1",
            "disposition": "HOLD_REVIEWED_RESEARCH_RUNTIME_UNAVAILABLE",
            "externalWrites": False, "methodInstalled": False,
            "automaticMerge": False
        }))
        sys.exit(2)
