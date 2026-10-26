#!/usr/bin/env python3
"""MODAL-RETURN-001: manual, bounded proof of an external compute return.

Only a fictional fixture is sent to Modal. No persistent deployment, public
endpoint, GPU, contact data, or external write is authorized by this bridge.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import modal

app = modal.App("jarvis-return-001")

FIXTURE = {
    "schema": "jarvis.modal.work-request/v0",
    "request_id": "garden-fictional-001",
    "source_kind": "SYNTHETIC_FIXTURE",
    "text": (
        "Fictional Waseca garden test: one imaginary steward needs "
        "12 boxes of produce; a separate imaginary grower offers 20. "
        "No real inventory, participant consent, or delivery is verified."
    ),
}


@app.function(
    cpu=0.25,
    memory=256,
    timeout=60,
    max_containers=1,
    scaledown_window=2,
)
def examine_fixture(request: dict) -> dict:
    """Produce a bounded measurement, not a decision or real-world action."""
    if request.get("schema") != "jarvis.modal.work-request/v0":
        raise ValueError("UNSUPPORTED_REQUEST_SCHEMA")
    if request.get("source_kind") != "SYNTHETIC_FIXTURE":
        raise ValueError("REAL_WORLD_INPUT_HOLD")
    source = request.get("text")
    if not isinstance(source, str) or not 0 < len(source.encode("utf-8")) <= 4096:
        raise ValueError("INPUT_SIZE_HOLD")
    return {
        "schema": "jarvis.modal.compute-return/v0",
        "request_id": request["request_id"],
        "input_sha256": hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "utf8_bytes": len(source.encode("utf-8")),
        "word_count": len(source.split()),
        "source_kind": "SYNTHETIC_FIXTURE",
        "outcome": "COMPUTED",
        "disposition": "HOLD_FOR_HUMAN_REVIEW",
        "admitted": False,
        "verified_real_world_claims": False,
        "external_effects": [],
    }


@app.local_entrypoint()
def main():
    result = examine_fixture.remote(FIXTURE)
    output = Path("artifacts/modal-return-001.json")
    output.parent.mkdir(exist_ok=True, parents=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Remote computation returned; receipt written to {output}")
