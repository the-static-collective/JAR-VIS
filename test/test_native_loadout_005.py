"""Offline integration against the exact original LOADOUT model + membrane.

Uses a fake provider adapter only to prove the compiled gate; this is never
represented as native model execution or an ELF occurrence.
"""
from __future__ import annotations
import unittest

from loadout.dev.compiler import compile_world
from loadout.dev.membrane import invoke_effect
from loadout.dev.model import (
    AdapterBody, CapabilityRequest, CapabilitySpec, CompileRequest,
    Disposition, EffectClass, EffectIntent,
)
from loadout.dev.openmanus import OPENMANUS_ADAPTER_ID

PIN = "3309bf4e416fb1c74b008f3e86494439a31bad53"
BODY = f"{OPENMANUS_ADAPTER_ID}@{PIN}"

class FakeAdapter:
    body_time_id = BODY
    def __init__(self):
        self.invocations = 0
    def invoke(self, intent):
        self.invocations += 1
        return "COMPLETED", "fake-state-after"

def compile_for(target: str, cut: str = "workspace:party", effect=EffectClass.LOCAL_MUTATE):
    return compile_world(CompileRequest(
        task_id="JARVIS-005-TEST",
        task_text="test capability binding with exact named workspace",
        cut_targets=frozenset([cut]),
        requested_capabilities=(CapabilityRequest(
            "worker.mutate", effect, target, body_time_id=BODY
        ),),
        available_bodies=(AdapterBody(
            adapter_id=OPENMANUS_ADAPTER_ID, body_time_id=BODY,
            source_sha=PIN,
            capabilities=(CapabilitySpec("worker.mutate", EffectClass.LOCAL_MUTATE),)
        ),)
    ))

def intent(target: str = "workspace:party", state: str = "before") -> EffectIntent:
    return EffectIntent(
        capability="worker.mutate", effect=EffectClass.LOCAL_MUTATE,
        target=target, body_time_id=BODY,
        precondition_state=state,
        parameters_digest="sha256:" + "a" * 64,
        parameters=(("request", "bounded fictional card draft"),)
    )

class NativeLoadoutTests(unittest.TestCase):
    def test_exact_gate_reaches_only_explicitly_bound_workspace(self):
        gate = compile_for("workspace:party")
        self.assertEqual(gate.disposition, Disposition.COMPILED)
        adapter = FakeAdapter()
        receipt = invoke_effect(gate, intent(), {BODY: adapter}, current_state="before")
        self.assertEqual(receipt.provider_disposition, "COMPLETED")
        self.assertFalse(receipt.semantic_authority)
        self.assertEqual(adapter.invocations, 1)

    def test_wrong_target_and_stale_state_cannot_invoke_provider(self):
        gate = compile_for("workspace:party")
        for input_intent, current in [
            (intent(target="workspace:outside"), "before"),
            (intent(state="old-state"), "before"),
            (intent(), "new-state")
        ]:
            adapter = FakeAdapter()
            receipt = invoke_effect(gate, input_intent, {BODY: adapter}, current_state=current)
            self.assertEqual(receipt.provider_disposition, "REFUSED")
            self.assertEqual(adapter.invocations, 0)

    def test_compiler_refuses_wrong_cut_or_effect(self):
        self.assertEqual(compile_for("workspace:outside").disposition, Disposition.REFUSED)
        self.assertEqual(
            compile_for("workspace:party", effect=EffectClass.PUBLISH).disposition,
            Disposition.REFUSED
        )

if __name__ == "__main__":
    unittest.main()
