#!/usr/bin/env python3
"""Source-pinned, local-only JAR;VIS receiver for original MOTIF Reasoning Spine.

No imports of unpinned branches, no Git read, no network, no persistence, and
no candidate code execution. User-controlled input is JSON DATA only.
"""
import importlib.util
import json
import sys
from pathlib import Path

SOURCE = Path(__file__).with_name("reason_spine.py")
MAX_IN = 16_384
MAX_OUT = 128_000


def run():
    incoming = sys.stdin.buffer.read(MAX_IN + 1)
    if len(incoming) > MAX_IN:
        raise ValueError("source input budget exceeded")
    request = json.loads(incoming)
    if not isinstance(request, dict) or set(request) != {"action", "case"}:
        raise ValueError("expected action and case")
    if request["action"] not in ("compare", "analyze"):
        raise ValueError("unknown action")

    spec = importlib.util.spec_from_file_location("motif_original_reason_spine", SOURCE)
    if not spec or not spec.loader:
        raise RuntimeError("missing original MOTIF")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if request["action"] == "compare":
        result = module.comparison(request["case"])
    else:
        result = module.analyze(request["case"])
    return {
        "schema": "jarvis.motif-spine-local/v1",
        "method": "ORIGINAL_MOTIF_MAIN_CODE",
        "sourceReview": "SOURCE_PINNED_BUT_NOT_AUTONOMOUS_AI",
        "results": result,
        "sourceExecution": "PINNED_LOCAL_RESEARCH_ONLY",
        "unmergedArbitraryBranchExecution": False,
        "externalEffects": False,
        "stored": False,
        "mergePerformed": False,
    }


if __name__ == "__main__":
    try:
        payload = run()
        output = json.dumps(payload, separators=(",", ":"), ensure_ascii=True)
        if len(output) > MAX_OUT:
            raise ValueError("source output budget exceeded")
        print(output)
    except (ValueError, KeyError, TypeError, RuntimeError, OSError, json.JSONDecodeError):
        print(json.dumps({
            "schema": "jarvis.motif-spine-local/v1",
            "disposition": "HOLD_INVALID_OR_UNAVAILABLE_SOURCE_CASE",
            "externalEffects": False, "stored": False,
        }))
        sys.exit(2)
