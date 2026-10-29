# SUNO SONG GARDEN 001 — JAR;VIS × official Suno MCP × Living Hymnal

**Status: executable offline handoff / draft experiment.** JAR;VIS does **not** yet authenticate to Suno, call an MCP tool, spend a credit, generate music, or publish a song. The official Suno MCP beta launched October 28, 2026; access is subject to Suno early-access authorization.

## The already-owned work

- **[Static Live Living Hymnal 001, draft PR #38](https://github.com/the-static-collective/static-live/pull/38)** owns a local-only church seed garden with review, publication gates and stage-packet exports. Use it rather than making a second congregation database in JAR;VIS.
- **[Church Commons 003–005](https://github.com/the-static-collective/static-live/pulls)** covers local withdrawal, short-lived publication leases, and a two-laptop *test kit*. This Suno adapter must not override those local decisions.
- **JAR;VIS** prepares a bounded private-generation handoff and receives a clearly unverified operator observation. Source rights, pastoral admission and eventual performance stay with the people responsible.
- **Official Suno MCP:** https://suno.com/mcp and https://api.suno.com/mcp ; works with authorized MCP clients, including Claude Code, Claude and ChatGPT (subject to host permissions), with existing Suno credits. No API key is required, but Suno OAuth authorization and beta access are.

## Run the actual local proof (Node.js 20+; zero dependencies)

~~~sh
npm test
node tools/suno-song-garden.mjs prepare examples/suno-song-garden-001/fixture.json > /tmp/suno-handoff.json
~~~

Inspect `/tmp/suno-handoff.json`. It contains a source-bound candidate prompt, a content digest, and an explicit no-effect receipt.

To use a Suno MCP host **after Suno approves beta access**, register the remote server in that host. For Claude Code, Suno documents:

~~~sh
claude mcp add --transport http suno https://api.suno.com/mcp
# In Claude Code: /mcp then complete Suno sign-in and consent.
~~~

The operator reviews the handoff, confirms the actual credits/rights in the host, and **manually pastes** the `prompt` into the authenticated conversation. Confirm ONE private candidate, never automatic publication. The adapter deliberately does not assume undocumented MCP tool names or bypass OAuth.

When the operator personally observes a created song at a canonical `suno.com/song/...` URL, optionally record **only a reported, unverified pointer**:

~~~sh
node tools/suno-song-garden.mjs receipt /tmp/suno-handoff.json \
  'https://suno.com/song/REPLACE-WITH-REAL-SONG-ID' 'Checked by operator; no archive export verified' \
  > /tmp/suno-observation.json
~~~

This is not an official Suno receipt, track download, church adoption, clearance, or a playable Static Live stage packet. Independent checks are needed for the actual song URL, download/export rights, stems, click, cues, and musicians.

## Operator gates (do not mistake these for verified credentials)

The input records **operator-supplied references** to four distinct prior human decisions: contributor permission, rights review, private-generation approval and approval to spend Suno credits. All are required; a withdrawn source HOLDs. References are **not authenticated by this module**, so no real church approval or consent follows from filling in JSON.

A reviewed, authorized private-generation seed may be considered without authorizing publication, cross-church sharing, streaming, or worship-team adoption. Private prayer details, personal identifying information, congregational contact lists, child submissions and testimonials must not be handed to an external AI without separate appropriate consent and safety review. The demo uses fictional material only.

## A bounded first meeting with Ashley / church worship leadership

The church's expressed interest is **exploratory**, not permission or partnership. Offer one voluntary, low-friction exercise: an adult contributor supplies a short, nonprivate theme or chorus; church reviewers decide whether it is suitable to test; an operator selects ONE candidate and separately authorizes Suno credits; real worship musicians listen and decide whether anything is worth arranging. Nothing appears in church media, Sunday services or playlists without local approval.

Possible workflow:

```text
human seed (Living Hymnal, private HOLD)
   → contributor permission + separate local review
   → JAR;VIS Suno handoff (local, no network)
   → authenticated MCP client + human click (uses Suno credits)
   → operator song URL report (not verification)
   → independently inspect audio, rights, lyrics, source and access
   → local church ADMIT / REFUSE
   → Static Live stage packet + click/stems only when actual assets exist
   → voluntary human performance (not an AI claim)
```

If the source withdraws, no new handoffs should be prepared; prior generated copies require a **separate** provider-side deletion, recipient action or licensing decision. This CLI does not delete content on Suno.

## Proof and remaining work

The Node tests exercise deterministic content bindings, required rights and credit gates, withdrawal, unknown fields, maliciously misleading URLs and the unverified-receipt boundary. No network is contacted.

For an actual *native JAR;VIS → Suno MCP invocation*, the next isolated crossing is to register a host-supported OAuth-capable MCP transport after beta admission, inspect the **live tool manifest**, add explicit cost/usage confirmation, avoid storing tokens in public logs, and test exactly one private fixture first. Only then could automated invocation be described as working. Do not treat having the endpoint URL as completed connection.

**Laws:** SEED ≠ SONG · SUNO ACCESS ≠ CREDIT AUTHORIZATION · PRIVATE GENERATION ≠ PUBLICATION · REPORTED URL ≠ VERIFIED SONG · SOURCE ADMISSION ≠ CHURCH ADOPTION · STAGE METADATA ≠ REAL AUDIO.


## Dual-MCP composition: JAR;VIS and Suno in the SAME AI host

This branch now also provides a real **local JAR;VIS MCP stdio server** (`tools/suno-song-garden-mcp.mjs`). It exposes one read-only tool, `jarvis_prepare_private_suno_seed`; that tool reads a single **operator-maintained** local file, checks review references/withdrawal, and gives the assistant a private Suno prompt. It never generates music. The separate official Suno remote MCP performs the actual generation only when authenticated and approved by the human.

For Claude Code while your working directory is this repository:

~~~sh
claude mcp add jarvis-song-garden -- node tools/suno-song-garden-mcp.mjs
claude mcp add --transport http suno https://api.suno.com/mcp
# Start Claude Code and use /mcp to authenticate with Suno.
~~~

The equivalent two-server configuration is saved as `examples/suno-song-garden-001/claude-code.mcp.json` for inspection; it is **not silently installed** into your Claude settings. With beta access, the operator can ask: **"Use jarvis_prepare_private_suno_seed for sample-church.porch-light-001; show me the private candidate and credit implications, then request my confirmation before using Suno."** Both tools are in one host session; the host is the orchestration layer.

The MCP server defaults to the included **fictional** seed. To use a different locally approved seed, point `JARVIS_SUNO_GARDEN_SEED_PATH` to a private JSON file **only after** establishing actual contributor consent, independent church review, and credit authorization. This path is deliberately taken from the trusted local environment, **never from an AI tool argument**. Withdrawal is checked again on every call. Do not use a shared computer or agent with access to confidential congregational seeds without appropriate identity and security controls.

**Proof boundary:** local JAR;VIS MCP works in test fixtures, but a two-server OAuth-authenticated generation in Claude Code, real Suno song receipt, church review, and live stage performance have not yet been demonstrated.
