#!/usr/bin/env python3
"""JAR;VIS adapter to the unchanged, source-pinned MOTIF-003 affordance kernel.

The input routes come ONLY from JAR;VIS's own deterministic workshop.
This creates a hypothetical route-sequence field, not real-world affordances,
skills, proof of execution, consent, or a trained model.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from affordance import analyze_first_moves, select_first_move

SCHEMA = "jarvis.motif-reciprocal-request/v1"
ANSWER = "jarvis.motif-reciprocal-result/v1"
MAX_INPUT = 8192
TOPIC = re.compile(r"[a-z][a-z0-9_-]{0,31}\Z")
IDENT = re.compile(r"route-proposal:[0-9a-f]{64}\Z")


def require(ok, reason):
    if not ok:
        raise ValueError(reason)


def analyze(data):
    require(type(data) is dict and set(data) == {"schema", "routes", "scores", "uncertain"}, "INVALID_ENVELOPE")
    require(data["schema"] == SCHEMA and type(data["uncertain"]) is bool, "INVALID_SCHEMA")
    routes = data["routes"]
    scores = data["scores"]
    require(type(routes) is list and 1 <= len(routes) <= 6, "INVALID_ROUTE_COUNT")
    require(type(scores) is dict and 1 <= len(scores) <= 2, "INVALID_SCORE_MAP")
    require(all(type(k) is str and TOPIC.fullmatch(k) and type(v) is int and -100 <= v <= 100
                for k, v in scores.items()), "INVALID_SCORE")
    by_id = {}
    for route in routes:
        require(type(route) is dict and set(route) == {"id", "steps", "policy"}, "INVALID_ROUTE")
        ident = route["id"]
        steps = route["steps"]
        require(type(ident) is str and IDENT.fullmatch(ident) and ident not in by_id, "INVALID_ROUTE_ID")
        require(type(steps) is list and 1 <= len(steps) <= 2 and all(
            type(s) is str and s in scores for s in steps), "INVALID_ROUTE_STEPS")
        require(len(set(steps)) == len(steps), "REPEATED_ROUTE_STEP")
        require(type(route["policy"]) is str and re.fullmatch(r"[a-z][a-z-]{0,31}", route["policy"]),
                "INVALID_POLICY")
        by_id[ident] = route

    # This is a transparent synthetic state graph. An available continuation
    # represents only the next step in a JAR;VIS proposal, not an external ability.
    initial = frozenset({("phase", "start")})

    def possibilities(world, unused_verbs):
        if ("phase", "start") in world:
            for ident in sorted(by_id):
                first = by_id[ident]["steps"][0]
                yield ident, (), frozenset({("chosen", ident), ("visited", first), ("cursor", "1")})
            return
        chosen = next((v for k, v in world if k == "chosen"), None)
        cursor = next((int(v) for k, v in world if k == "cursor"), None)
        if chosen is None or cursor is None:
            return
        steps = by_id[chosen]["steps"]
        if cursor < len(steps):
            yield "continue", (chosen, steps[cursor]), frozenset(
                {("chosen", chosen), ("cursor", str(cursor + 1))}
                | {("visited", s) for s in steps[:cursor + 1]}
            )

    def utility(world, origin):
        return sum(scores.get(value, 0) for kind, value in world if kind == "visited")

    rows = analyze_first_moves(initial, None, possibilities, utility,
                               horizon=3, max_worlds=64)
    immediate = select_first_move(rows, "immediate")
    choices = select_first_move(rows, "new-choices")
    require(len(rows) == len(routes) and immediate is not None and choices is not None,
            "INCOMPLETE_SIMULATION")
    return {
        "schema": ANSWER,
        "native_kernel": "MOTIF-003",
        "field": "SYNTHETIC_ROUTE_SEQUENCES_ONLY",
        "immediate_id": immediate["operator"],
        "new_choices_id": choices["operator"],
        "disagreement": immediate["operator"] != choices["operator"],
        "first_moves": [{
            "candidate_id": row["operator"],
            "immediate_heuristic": row["immediate_delta"],
            "new_continuations": len(row["new_affordances"]),
            "remaining_states": row["reachable_after_first_move"],
            "truncated": row["truncated"],
        } for row in rows],
        "observed_external_outcomes": 0,
        "real_world_authority": False,
        "external_effect": False,
        "trained_model": False,
    }


def main():
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        require(len(raw) <= MAX_INPUT, "OVERSIZE_REQUEST")
        data = json.loads(raw)
        print(json.dumps(analyze(data), separators=(",", ":"), sort_keys=True))
    except (TypeError, ValueError, KeyError, OverflowError):
        # No user text or raw payload is logged.
        print("HOLD: INVALID_RECIPROCAL_PROPOSAL", file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
