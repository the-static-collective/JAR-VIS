import copy
import json
import tempfile
import unittest

from orchard import assemble, digest, generate_candidate, make_tasks, read_seeds, write_bundle


class OrchardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = read_seeds()
        cls.cards = [generate_candidate(t) for t in make_tasks(cls.doc)]

    def test_speculative_output_is_bounded(self):
        self.assertEqual(len(self.cards), 40)
        self.assertTrue(all(c["disposition"] == "PROPOSAL_ONLY_HOLD" for c in self.cards))
        self.assertTrue(all(c["review_required"] for c in self.cards))

    def test_reproducible_reordered_parallel_results(self):
        a, r = assemble(self.doc, self.cards, mode="modal-cpu")
        b, r2 = assemble(self.doc, self.cards[::-1], mode="modal-cpu")
        self.assertEqual(digest(a), digest(b))
        self.assertEqual(r, r2)

    def test_missing_worker_fails_closed(self):
        with self.assertRaises(ValueError):
            assemble(self.doc, self.cards[:-1])

    def test_worker_change_fails_closed(self):
        cards = copy.deepcopy(self.cards)
        cards[0]["disposition"] = "VERIFIED"
        with self.assertRaises(ValueError):
            assemble(self.doc, cards)

    def test_html_escape_and_output(self):
        bundle, receipt = assemble(self.doc, self.cards)
        with tempfile.TemporaryDirectory() as tmp:
            out = write_bundle(tmp, bundle, receipt)
            self.assertTrue((out / "index.html").exists())
            self.assertEqual(json.loads((out / "receipt.json").read_text())["result_sha256"], digest(bundle))
            html = (out / "index.html").read_text()
            self.assertIn("Every card retains HOLD", html)
            self.assertIn("aria-pressed", html)


if __name__ == "__main__":
    unittest.main()
