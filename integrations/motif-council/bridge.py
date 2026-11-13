#!/usr/bin/env python3
"""Local JAR;VIS receiver for the *original* pinned MOTIF Source Council 002.

Operator-invoked: discovers public MOTIF Git refs and reads a bounded handful
of original source documents. The person's question stays local. Public Git
queries contain only a fixed repository URL and public ref names.
Nothing is merged, imported for execution, published or saved.
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
from motif.branch_garden import HoldError  # noqa: E402
from motif.source_council import inspect_candidates  # noqa: E402

PUBLIC_REPO = "https://github.com/the-static-collective/MOTIF.git"
MAX_INPUT = 4096
MAX_OUTPUT = 128_000


def inspect():
    raw = sys.stdin.buffer.read(MAX_INPUT + 1)
    if len(raw) > MAX_INPUT:
        raise HoldError("HOLD_OVERSIZED_REQUEST")
    try:
        payload = json.loads(raw)
    except (UnicodeDecodeError, ValueError) as exc:
        raise HoldError("HOLD_INVALID_REQUEST") from exc
    if not isinstance(payload, dict) or set(payload) != {"action", "question", "budget"}:
        raise HoldError("HOLD_UNRECOGNIZED_ACTION_SCHEMA")
    if payload["action"] != "investigate":
        raise HoldError("HOLD_UNRECOGNIZED_ACTION")
    question, budget = payload["question"], payload["budget"]
    if (not isinstance(question, str) or
        len(question) < 3 or len(question) > 180 or
        not question.strip() or any(ord(c) < 32 for c in question)):
        raise HoldError("HOLD_QUERY_REQUIRED")
    if type(budget) is not int or budget not in (1, 2, 3):
        raise HoldError("HOLD_INSPECTION_BUDGET")

    # Git runs against a temporary repo with an immutable, literal public remote.
    # Never inspect user's local Git configuration, credentials or working tree.
    with tempfile.TemporaryDirectory(prefix="jarvis-motif-council-") as temp:
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
            ["git", "-c", "init.templateDir=/dev/null", "init", "-q", temp],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=6, env=env,
        )
        subprocess.run(
            ["git", "-C", temp, "remote", "add", "origin", PUBLIC_REPO],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=6, env=env,
        )
        # The original source uses subprocess inherited environment. Supply
        # bounded Git configuration only for this process, then restore.
        saved = {key: os.environ.get(key) for key in env if key.startswith("GIT_")}
        try:
            for key, value in env.items():
                if key.startswith("GIT_"):
                    os.environ[key] = value
            result = inspect_candidates(temp, question, budget)
        finally:
            for key, original in saved.items():
                if original is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = original

    # Only the original Source Council's source-attributed cards, no raw
    # source text or repository credentials. Source content is untrusted.
    return {
        "schema": "jarvis.motif-source-council/v1",
        "owner": "the-static-collective/MOTIF",
        "originalCouncil": result,
        "codeExecutedFromExperimentalBranches": False,
        "networkPurpose": "PUBLIC_GIT_SOURCE_READ_ONLY",
        "questionTransmittedToGitHub": False,
        "requiresExplicitUserAction": True,
        "externalWrites": False,
        "storage": "NONE",
        "mergePerformed": False,
    }


if __name__ == "__main__":
    try:
        out = inspect()
        result = json.dumps(out, ensure_ascii=True, separators=(",", ":"))
        if len(result.encode("utf-8")) > MAX_OUTPUT:
            raise HoldError("HOLD_RESPONSE_TOO_LARGE")
        print(result)
    except (HoldError, OSError, ValueError, subprocess.SubprocessError):
        print(json.dumps({
            "schema": "jarvis.motif-source-council/v1",
            "disposition": "HOLD_ORIGINAL_SOURCE_UNAVAILABLE",
            "codeExecutedFromExperimentalBranches": False,
            "externalWrites": False,
            "mergePerformed": False,
        }))
        raise SystemExit(2)
