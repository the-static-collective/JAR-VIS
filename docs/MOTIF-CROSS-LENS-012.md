# JAR;VIS × MOTIF Thought Room 012 — Cross-Examine a Pencil Question

**Status:** local-only, human-clicked prototype, branch stacked on JAR;VIS Thought Room 011. **Not deployed or merged.** Source owner: [MOTIF THOUGHT-012](https://github.com/the-static-collective/MOTIF/pull/134); upstream branch is also unmerged. Node.js 20+, Python 3.11+. No external actions.

## From a thought to a revisable investigation

In `/thought`, add ideas (duplicate words remain non-fungible), draw optional authored or pencil relations, then select **two idea instances** by their numbered identities. Click **Cross-examine these two ideas**. The browser sends the exact pencil selection to its loopback JAR;VIS server. JAR;VIS executes the **byte-pinned original MOTIF THOUGHT-012** Python reasoning module via the **source-owned THOUGHT-010** strict local request schema.

The initial thought is an **UNSOURCED_PENCIL_SEED**; it does not need counterfeit independent witness roots. MOTIF revisits that same idea pair through dependency, tension and affordance lenses, reporting source-typed, cited questions and preserving the original IDs. Each step may construct a THOUGHT-008 geometric projection. Geometric positions never count as source evidence. The source-only no-geometry control must generate exactly the same questions.

An example with fictional `Meal requires Venue open` and `Venue open contradicts Venue closed` should produce the original pencil question, a prerequisite-check question, and a conflicting-claims review question. It does NOT prove the venue is closed or the meal impossible. A human may choose further investigation.

## Operating boundaries

- Uses source-owned `experiments/thought-012/cross_lens.py` + `cross_lens_door.py` pinned via SHA-256, and the previously pinned five source-owner 007–010 files. No reimplementation of reasoning algorithms in JAR;VIS.
- New local `POST /api/thought/cross-check` and `GET /api/thought/cross-status` share existing loopback Host/Origin/CSRF/16-KB JSON body checks. POST is **explicit click only**; no background study.
- Every authored edge from this local single-operator UI carries the same declared root. Changing lenses **cannot** pretend to add independently witnessed evidence.
- No remote writes, email, contact, external read, Free Graph export, PEN promotion, persistent question journal, accounts, retention across runs, model call, or public deployment.
- Temporary input file mode 0600, removed after native process; `python -I -B`, 6-second process cap, 900-KB stdout cap, two concurrent operations maximum; source verification before each use.
- Response must match the exact source-owned schema and **HOLD_FOR_OPERATOR_REVIEW** gate, `UNSOURCED_PENCIL_SEED`, `QUESTION_ONLY` carrier, `PEN UNCHANGED`, external authority NONE, and source-only parity true. Otherwise it refuses.
- The plain-language question parser remains rule-based; operator selection of concepts is explicit. This is not a self-directed semantic reasoner, and results come from a single authored graph.

## Reproduce

```sh
npm test
npm start
# open http://127.0.0.1:7789/thought
```

`node --test test/thought-cross.test.mjs` exercises the actual subprocess, source pins, one-operator origin, same-label distinct concepts, malformed inputs, no-map parity and localhost CSRF (no live network).

**Scientific limit:** The multiple inspections can surface more types of unanswered questions than stopping at the association view. A comprehensive source-only control can derive exactly those questions without any geometric drawing. No accuracy or performance superiority is established; future blinded user-evaluation is needed.
