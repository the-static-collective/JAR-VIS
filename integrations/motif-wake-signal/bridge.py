#!/usr/bin/env python3
"""Private loopback adapter: execute the pinned MOTIF WAKE-001 owner code."""
import importlib.util
import json
from pathlib import Path
import sys

OWNER = Path(__file__).with_name("wake.py")
SPEC = importlib.util.spec_from_file_location("motif_wake_source", OWNER)
wake = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(wake)
SCHEMA = "jarvis.wake-source-bridge/v1"


def main(payload):
    op = payload.get("op")
    if op == "ping":
        return {"ready": True, "engine": "MOTIF_WAKESIGNAL_001"}
    if op == "plan":
        return {"plan": wake.make_plan(
            payload["title"], payload["context"],
            {arm: payload[arm] for arm in wake.ARMS},
            count=payload.get("count", 100),
            seed=payload.get("seed", 2026),
            verified=payload.get("verified", False),
        )}
    if op == "state":
        plan = wake.read_plan(payload["plan_path"])
        events = wake.read_events(payload["events_path"])
        states, _seen = wake.replay(plan, events)
        return {"plan": plan, "states": states,
                "report": wake.report(plan, events), "event_count": len(events)}
    if op == "record":
        row = wake.record(
            payload["plan_path"], payload["events_path"],
            payload["slot"], payload["event"],
            consent=payload.get("contact_permission", False),
            attested=payload.get("action_attested", False),
            receipt=payload.get("receipt"),
        )
        return {"event": row}
    raise wake.Hold("unknown bridge operation")


try:
    raw = sys.stdin.buffer.read(22_000)
    if len(raw) > 20_000:
        raise wake.Hold("bridge request exceeds local budget")
    inp = json.loads(raw.decode("utf-8"))
    if not isinstance(inp, dict):
        raise wake.Hold("JSON object required")
    out = {"schema": SCHEMA, "status": "OK", **main(inp)}
except (wake.Hold, KeyError, TypeError, ValueError, OSError) as exc:
    out = {"schema": SCHEMA, "status": "HOLD", "error": str(exc)[:200]}
print(json.dumps(out, ensure_ascii=False))
