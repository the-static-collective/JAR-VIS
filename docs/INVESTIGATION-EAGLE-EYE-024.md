# JAR;VIS 024 — Investigation Desk × ALEX Eagle Eye × MOTIF

**Location:** `http://127.0.0.1:7789/investigate`, after `npm start`.

This is a **human-facing working local source-research room**, proposed on a draft branch for review. **Not deployed publicly**; a browser on a different phone cannot simply access the laptop's loopback server. Production, public multi-user access, network authentication and cross-device transport are future work.

## What is real

- Ask a new question in ordinary language. The simple interface presents sample prompts but accepts questions of 10–320 characters.
- Deliberately choose which external PUBLIC services receive the question:
  - **GitHub:** ALEX's new **Eagle Eye** source-owning scanner enumerates up to three 100-repository catalog pages of the Collective's public GitHub **account**, ranks candidate repositories from public metadata, opens 2–6 public repositories, reads at most three bounded eligible code/docs files each at exact commit and Git blob, and cites exact path and line numbers. It is **not** still restricted to MOTIF-023's five historical repository choices.
  - **Wikipedia:** optional public search results, clearly marked **index leads**, not authenticated original evidence.
  - **OpenAlex:** optional public scholarly metadata; no full-text paper reading, automatic paid key, or proof of paper findings.
- ALEX returns a checksummed machine-readable **research packet** with search limits, opened/unopened source counts, source SHAs, search leads and failed-source results. Browser download is an explicit local action. Question text is **not automatically persisted** in the JAR;VIS journal.
- Optionally run native MOTIF-023 reasoning: source-owned original **ALEX-023**, real **planZ** STRIPS uniform-cost classical planner, and source-owned original **GRAFT-023** bounded executable template composer. The two-round circuit executes actual compiled local source-review code, observes gaps, asks another question, acquires further verified PUBLIC GitHub sources and executes a second module. It returns HOLD when source/read/custody checks fail.
- The seven exact imported original donor code blobs are Git SHA-1 checked **before outbound research**. The original source-owner repositories are untouched.

## Scope and limitations

**Eagle Eye is broader discovery, not unlimited surveillance or general Google search.** Source inventory can include public GitHub repos beyond the previous five, plus two optional public knowledge indexes. The GitHub source selection is deliberately constrained by relevance and file/line budgets. A search miss is never proof that a source or answer does not exist. A commit/blob SHA proves the public bytes examined, *not* that two human witnesses have independent origins. Public repository search can disclose information that was accidentally committed; obvious secret/email line patterns are excluded as a first-pass precaution, not as a complete leakage detector.

**The native MOTIF-023 classical-plan branch remains scoped to its five original public repositories.** Broad ALEX-024 hits are shown alongside the native MOTIF source-ownership circuit, but are **not silently imported as planZ authenticated testimony or generalized arbitrary capabilities**. A future source-owner upgrade can add a reviewed adapter for broader evidence-genealogy packets.

The local workbench uses its existing loopback host/Origin restrictions, CSRF requirement, narrow JSON body cap and content security policy. The browser only contacts `/api/investigate` on the same local origin. The server uses read-only, fixed public provider hosts and a bounded 50-second request budget. It sends the question to outside services **only if the operator checks those boxes**. Authentication for private Google Drive, email, Supabase, Dropbox, and external organization accounts is **not connected**; no "wherever" capability reaches them by implication.

No model or human-source conclusion is treated as a fact; no real-world witness contacted; no code deployed; no GitHub repos edited by the running application; no automatic source-owner approval or public publishing; no research packet saved remotely.

## Reproduce

```bash
npm test
npm start
# Open http://127.0.0.1:7789/investigate
```

Source contract tests cover exact imported Git blob hashes, actual original MOTIF-023 classical plan/compiled capability execution via a simulated public GitHub API, opt-in public Wiki/OpenAlex search, private-source refusal, malicious source-byte integrity failure, CSRF and localhost-only server behavior.

The new Actions workflow also performs **actual read-only live GitHub public research** and runs native two-round source analysis. Its retained JSON artifact is inspectable without publishing private records.

## User-facing return

The desk shows what was *inspected*, exact public citations, failed providers and incomplete coverage; when requested, the actual planZ plan and GRAFT research module result, source gaps, and a next useful question. It does **not** simply suggest that the user create another invitation. The response can be downloaded as a local JSON evidence packet, preserving where each claim came from.

**ALEX may discover; planZ may propose; GRAFT may execute limited local analysis; JAR;VIS presents the results. Authority stays with the relevant source owners and people.**
