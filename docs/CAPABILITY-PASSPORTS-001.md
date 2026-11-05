# Capability Passports 001 — source-owned inventory for human-first JAR;VIS

**Status:** public descriptive discovery, not tool execution, authentication, service discovery, or a real-time availability system.

## Why
The visitor says, "I have extra fish" or "my phone doesn't charge." They should not need to understand GHoT, Garden, reLATTE or repository names before receiving useful assistance.

**Rule:** Do the useful local work first. When coordination is genuinely necessary, expose a relevant, independently owned tool as a *possibility*, never as an auto-accepted transfer.

## Contract
Each consenting repository owns `capabilities/passport.v1.json` with `schema: jarvis.capability-passport/v1`, exact `repository` name, `version`, `authority: PUBLIC_DESCRIPTION_ONLY_NOT_RUNTIME_OR_PERMISSION`, `availability: NOT_OBSERVED`, and up to 12 `capabilities`.

A capability entry contains:

- `id`: repository-namespace-scoped stable identifier.
- `title`: what the *person* could do, not a technical class or API name.
- `intents`: bounded literal search hints, not an AI prompt.
- `readiness`: exactly `LOCAL_BROWSER`, `SOURCE_REVIEW`, `LOCAL_OPERATOR`, `LOCAL_LIBRARY`, `LOCAL_APP_UNVERIFIED`, `DOCUMENTED_ONLY`, or `RESEARCH_ONLY`.
- `delivers`: the specific human-readable useful result a tool *may* support, with nonclaims.
- `entry.kind`: `WEBZ_LOCAL_LINK` for relative first-party rooms, or `SOURCE_REFERENCE` for a project-owned GitHub document.
- `entry.href`: explicit next door. Neither a link nor the passport proves a live service.
- `sourcePath`: a checked-in path owned by the source repo.
- `requires`: the missing consent, runtime, data or human gate in plain language.

The index at `commons/capability-index-v1.json` is a **reviewed bounded allowlist** of owner repo paths. The webZ browser fetches **only** the exact index URL and exact passport locations derived from that index; it rejects unexpected owners, paths, schemas, fields, excessive size, unsafe URLs and incompatible versions. It never `eval`s passport content or runs repository code. No visitor request text is transmitted to GitHub, persisted in this route, or placed in URLs. GitHub may nevertheless see the visitor's IP on a public document fetch; disclose that before/at discovery.

## Priority and composition

1. **NOW:** run already-installed local useful-work routines (webZ First Circle work code) and render the result before asynchronous discovery.
2. **DISCOVER:** read published, source-owned passports (GET only, short bounded timeout) and rank literal intent matches locally.
3. **COMPOSE:** offer at most three genuinely relevant, distinct project-owned *optional next doors*. Prefer a usable local browser tool to a purely documented developer library when scores are similar. Never construct a claim of a functioning backend merely because its manifesto loaded.
4. **RETURN:** only a human-selected tool may open; it remains separately governed. A real-world need stays unresolved until appropriate independently attributable evidence appears.

If the network is unavailable, the local answer remains immediately useful and the passport inventory stays **unavailable**, not silently replaced with fabricated live matches.

## Acceptance proof
- Passports from five owner repos have independent versioned source paths.
- A real browser can fetch the reviewed index and combine published descriptions in the same interaction, **without submitting the question**.
- An input such as "I have extra fish to share" gives an actual local draft and discovers a source-owned surplus instrument; no fake receiver, volunteer, spoilage guarantee, or delivery is generated.
- A modified/oversized/untrusted passport is excluded. Every accepted link is a safe first-party relative route or project-owned GitHub source.
- A stale asynchronous response from a previous question cannot append suggestions to a newer answer.
- Android/mobile, CORS and full offline fallback are tested with deterministic fixtures. **Two human devices, live partner availability, external actions, and independent benefit remain unproven.**

This does not replace GHoT's separately scoped executable adapter manifest, reLATTE's signed crossing, or owner-controlled protocol definitions. **DISCOVERY IS NOT PERMISSION.**
