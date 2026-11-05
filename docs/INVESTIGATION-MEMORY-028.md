# JAR;VIS-028 — Memory of Failure

**Human-facing private, local, opt-in experiment memory** in the Investigation Desk. Stacked on JAR;VIS-027, not merged or deployed.

## Using the page

Open `http://127.0.0.1:7789/investigate` with the JAR;VIS development server running locally.

1. Ask a supported weather/API research question and select **Grow + challenge candidate**. JAR;VIS runs the GRAFT-027 source-owned gardener against labeled **synthetic** weather fixtures and an explicitly approved public GitHub source proposal.
2. A new **Remember this synthetic experiment** button is enabled **only for a completed valid garden experiment**. Clicking separately approves capturing the source-referenced synthetic fixtures **and persisting the resulting experiment to a private on-disk ledger**. The server binds the consent to the most recent original garden receipt and **reruns GRAFT's evaluator**, refusing a mismatched or forged outcome. Nothing is stored by merely asking or by looking at a result.
3. **Recall and replay related experiments** uses only the device's saved synthetic research records, no network. The original **GRAFT-028** engine ranks related JSON structures, re-executes the prior tests, and presents both failures and successes. Original planZ chooses a next question appropriate to the replayed evidence. Different source domains return **HOLD** until a labeled experiment family exists.
4. Restart the local server using the **same journal path**. The owner-private research ledger remains available at `<journal-directory>/.investigation-memory/synthetic-research-memory.jsonl`. This path is **local**, not shared to GitHub/Drive/cloud by default.

New API routes:
- `GET /api/investigate/memory` returns only local ledger count/tip.
- `POST /api/investigate/memory/remember` requires a valid local anti-CSRF token, matching last garden digest, `approvedSyntheticCapture:true` **and** `approvedPersistentSave:true`.
- `POST /api/investigate/memory/recall` requires anti-CSRF and a supported question. No remote search.

The source owner GRAFT-028 module is byte-for-byte pinned and the existing fourteen original ALEX/planZ/GRAFT donor imports still verify (fifteen total). Memory is stored in a mode-0700 private folder and mode-0600 append-only file with a checksum chain and fsync. Corruption, broken links and duplicate records HOLD; no automatic repair.

### Honest limitations

- The local research memory has a maximum of **64 experiments**. It stores synthetic cases and public specification metadata—not personal secrets, private records, email, conversation history or bank details.
- It does **not** remember information globally across ChatGPT chats, synchronize to your phone, or run in the background.
- Structural similarity can identify a familiar experimental pattern, but not independent source testimony or proof of the correct real-world answer.
- A checksum chain is not authenticated against malicious local rewriting; executable replay checks internal consistency.
- No autonomous promotion of generated code. Production remains unchanged.

Test via `npm test`; the new suite exercises consent gating, source pins, owner-private persistence, corruption refusal, exact replay after constructing a fresh store object, and the full browser/HTTP workflow across a real local-server restart.
