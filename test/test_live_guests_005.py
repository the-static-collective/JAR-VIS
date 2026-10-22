import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "house_party_live_005", HERE / "tools/run-live-guests-005.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class HouseParty005ContractTests(unittest.TestCase):
    def test_card_requires_source_quantities_and_privacy(self):
        good = (
            "# Table & Road (DRAFT / fictional)\n"
            "Waseca produce: 12 boxes requested, 20 boxes offered.\n"
            "Human review and each participant's permission required.\n"
        )
        self.assertEqual(module.valid_card(good), (True, ()))
        for changed in (
            good.replace("12 boxes", "13 boxes"),
            good.replace("fictional", "authentic"),
            good.replace("permission", "approval"),
            good + "\nhttps://example.org",
            good + "\nSomeone: 555-222-9999",
            good + "\nDonate at Venmo",
        ):
            self.assertFalse(module.valid_card(changed)[0])

    def test_review_is_explicit_hold_not_publication(self):
        self.assertTrue(module.valid_review("HOLD_HUMAN_REVIEW\nCheck the source."))
        for s in (
            "APPROVED\nPublish now",
            "HOLD_HUMAN_REVIEW\nALREADY_PUBLISHED",
            "HOLD_HUMAN_REVIEW\nPUBLISH_APPROVED",
        ):
            self.assertFalse(module.valid_review(s))

    def test_output_must_be_new_and_not_in_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            source.mkdir()
            out = root / "new-out"
            self.assertEqual(module.check_new_output(out, [source]), out)
            with self.assertRaisesRegex(ValueError, "OVERLAP"):
                module.check_new_output(source / "inside", [source])
            with self.assertRaisesRegex(ValueError, "OVERLAP"):
                module.check_new_output(root, [source])
            out.mkdir()
            with self.assertRaisesRegex(ValueError, "EXISTS"):
                module.check_new_output(out, [source])

    def test_workspace_output_exactly_one_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            space = Path(tmp)
            before = {"context.txt": b"synthetic source"}
            (space / "context.txt").write_bytes(before["context.txt"])
            (space / "card.md").write_bytes(b"some card")
            self.assertEqual(
                module.exact_workspace(space, {"context.txt"}, "card.md", before),
                b"some card"
            )
            (space / "extra.txt").write_bytes(b"oops")
            with self.assertRaisesRegex(ValueError, "UNAUTHORIZED"):
                module.exact_workspace(space, {"context.txt"}, "card.md", before)

    def test_negative_approvals_exit_without_launch(self):
        with self.assertRaisesRegex(ValueError, "EXACT_SOURCE_PIN"):
            module.exact_root(Path(__file__).resolve().parent, "1" * 40)


if __name__ == "__main__":
    unittest.main()
