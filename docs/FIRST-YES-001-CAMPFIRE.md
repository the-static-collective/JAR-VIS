# FIRST YES 001 — an owned Firebox gives JAR;VIS one real question to prepare

**Status, October 26, 2026:** Implemented in a draft PR, browser-ready on the **same host**, cross-project tests passed against a pinned real NanaSpork SQLite backend. **Not publicly hosted, no partners contacted, no real aid or human identity verified.**

## In words anyone can use

You built your own Campfire backend. It remembers private circles, messages, small needs, and the difference between a helper's report and an owner's acceptance. Its own Attention Desk can see limited *counts*, not private conversation content, and suggest one small operational next step.

JAR;VIS now has a new door called **The First Yes Desk**. On deliberate click, it asks *your* Firebox what one next step its **current** state suggests. JAR;VIS makes a printable work card containing:

- What we actually observed (without exposing private cases or people).
- One thing we can **prepare**, not pretend to have done.
- Who must freely agree before anything happens.
- What concrete evidence would show a technical or human result.
- An **unsent, optional, plain-language invitation draft**.
- A source digest and a reminder that this is **not** a verified Jubilee fulfillment receipt.

**The operator keeps decision-making authority.** This is not a social network that assigns people. It is not a system that turns an unconfirmed milk delivery into a happy press release.

## One real click, with the backend you already own

Open a terminal in the **BananaSpork** repository:

```sh
node campfire-backend/start.mjs
```

In a separate terminal in the sibling **JAR-VIS** repository:

```sh
npm start
```

Open **http://127.0.0.1:7789**, scroll to **The First Yes Desk**, and press **Prepare one useful work card**. It will tell you the permission boundary before you can download the printable Markdown.

This flow assumes the two repositories are sibling directories. JAR;VIS finds the local operator key that the Firebox already created at `../BananaSpork/private-data/campfire/operator.key`. If they are not siblings, point it explicitly to the existing **local** key file (never copy its contents into chats or repositories):

```sh
JARVIS_CAMPFIRE_KEY_FILE=/private/path/to/operator.key npm start
```

The Firebox address is localhost port 3417 by default. JAR;VIS only permits a **loopback HTTP address** for this first version. No hosted admin URL is accepted. Its operator key never enters JAR;VIS browser code.

If the Firebox is off, the key is inaccessible, or permission is denied, the UI says so and returns **no work card**. It does not silently fall back to the fictional JAR;VIS demo or invent current project state.

## What crosses, what stays home

| Data / action | Crosses to JAR;VIS? |
| --- | --- |
| An owner-read *proposal code* and audited count summary | Read temporarily on explicit request |
| Stable, canned human explanation of the selected code | Yes, into a private printable draft |
| Private circle IDs and member identifiers | **No** — not copied into prepared card |
| Member credentials, owner operator key | **No** — used only for local HTTP authorization |
| Messages, need descriptions, personal stories, photos | **No** — never requested by the backend Attention endpoint |
| “Report accepted” → “physical aid verified” | **Never**; those are distinct things |
| Invitation sent, person assigned, public press, project decision | **No** |
| Owner Firebox database write | **No** |

No task execution or network propagation is authorized from a prepared work card. A person can reject it, edit it, or use the text as a starting point. A HOLD in the source audit remains a **HOLD**, not a normal invitation.

## Native end-to-end proof

The CI workflow **First Yes · real Firebox → JAR;VIS** pins the original NanaSpork Firebox to commit `b8c41390da3f35997d329354a467e807f603f0da` instead of faking a similar API. It starts the real backend against a private temporary SQLite file, creates two different member capabilities, posts one fictional message, opens a fictional need, records a report, separately accepts a partial quantity, and checks how JAR;VIS's proposed action changes with each step.

The test also reads the real Firebox audit state **before and after** the JAR;VIS crossing. Merely preparing a card must not change the source database. Additional regression coverage checks CSRF, localhost restriction, untrusted source schema, authority escalation attempts, forged success, private-contact injection, and no key leak in the printable result.

The source is still a **simulated community** in CI: synthetic credentials and fictional cartons do not represent real people or outcomes. The currently deployed Garden/Supabase pages are **not** connected to this private Firebox or JAR;VIS server by this branch.

## Where the next integration goes

The public `/.well-known/campfire-waggle.json` advertises capabilities, but not private Attention Desk values. An eventually deployed Abundent question doorway should route a real user's question through a **separately permissioned, narrowly scoped service**—never through an exposed administrator key or public proxy to the private counts. The current browser works only on the host computer.

Our immediate field test is: start both existing local servers, press Prepare, print one card, find one willing person who might genuinely want to shape it, and see whether anything useful happens. No actual contact is required for the technical pass.

**Principle:** ATTENTION ≠ AUTHORITY. FIRST YES ≠ CONSENT. PROPOSAL ≠ ADMISSION. REPORT ≠ DELIVERED. INTEGRITY > CONTINUITY.
