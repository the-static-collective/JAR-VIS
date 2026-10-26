# COMMUNITY-BRAIN-006 · Survivor-centered Open Seats in the actual JAR;VIS attendant

**Status:** source-bound public project planning integrated into the LOCAL JAR;VIS workbench, not a production survivor group or a live appointment/volunteer database. No identities, cases, personal documents, contact messages, automatically generated legal advice, or source-owner authorizations were imported.

## What JAR knows

The user-approved Still Here initiative proposes a consent-first, open-to-all-genders community especially responsive to isolated fathers who have experienced coercive or abusive relationships and may face difficult co-parenting or legal questions. The prior development work also includes WORKBOARD-025 (private pending contributions and reviewed-only public history), MEMORY-026 (contextual next proposals), OPEN-SEATS-027 (bottlenecks become voluntary capability invitations), and STILL-HERE-028 (privacy-first read-only design doorway).

All of these are public **project artifacts**; they do NOT prove a survivor group is operational, a moderator has been appointed, a partner has signed on, or a particular survivor has received support.

## The answer to “who do I need?”

The first three separate openings are:

1. **Founding Companion — a friend.** The first action is to ask one trusted person to critique a fictional gathering/doorway. Not an automatic volunteer, appointed director, counselor or staff member.
2. **Survivor Advocacy Consultation — qualified review.** A careful, non-identifying request for practical safeguarding design feedback. CADA's own public description is one *independent possible contact*, not a partner endorsement or guaranteed availability.
3. **Nonprofit Formation Counsel — organizational legal questions.** LegalCORPS is an independently documented *eligibility-dependent option* for startup/nonprofit brief advice. It does not establish an attorney-client relationship, nonprofit status, incorporated structure or free long-term representation.

**Individual family-law needs** are separated into their own `personal-legal-aid` lane; SMRLS is only an independent, eligibility-dependent **personal** civil/family-law assistance option. No child/custody facts or source records belong in the shared project corpus.

## The bottleneck-recursion loop

```text
NOTICE_NEED
   -> NAME_BLOCKER
   -> OPEN_CAPABILITY
   -> VOLUNTARY_INTEREST
   -> HUMAN_PERMISSION
   -> SMALL_TRIAL
   -> DOCUMENT_RETURN
   -> REVIEW_LEARNING
   -> [possibly next blocker]
```

Unfilled proposed roles include Founding Companion, professional consultations, Privacy & Safety Steward, Workboard Review Steward, Peer Presence Designer, and Chronology & Private Tools Designer. Each role records a bounded safe-first move, who can really authorize work, prohibited actions, source IDs and a status clearly indicating *unfilled or unrequested*. Interest != appointment, consulting a website != contacting the organization, source publication != admission, and a local return != evidence of a fulfilled service.

## Connected runtime

- `src/community-brain.mjs`: source-scoped deterministic projection. `communityBrain({focus})` serves one of seven fixed interests, with public source register and explicit non-appointment, non-operational labels. `communityBrainAnswer(question)` recognizes relevant questions in the existing deterministic attendant without invoking an LLM or contacting anyone.
- `src/workbench.mjs`: the local `/api/state` snapshot now contains `communityBrain`, and `/api/attend` can answer about survivor community design, first helpers, moderation, private records, and the separation of legal contexts.
- `src/server.mjs`: **GET `/api/brain?focus=start|legal|support|safety|moderate|documents|volunteer`** is intentionally a read-only fixed-key endpoint. Arbitrary query keys, unknown values, and duplicate focus parameters are rejected; the endpoint has no narrative or case-facts input.
- `public/brain.js`, `public/index.html`, `public/site.css`: browsable, source-linked Open Seats directly inside JAR;VIS localhost workbench. No browser storage, submission form, or case upload.
- `test/community-brain.test.mjs`: enforces no imaginary enrollment or representation, explicit legal separation, endpoint scope, assistant routing, source authority limits, and on-page safety notice.

Commands after checking out the branch:

```sh
npm test
npm start
# http://127.0.0.1:7789
# GET http://127.0.0.1:7789/api/brain?focus=start
```

## Sources and trust

Project source links point to the relevant draft GitHub PRs [#126](https://github.com/the-static-collective/webZ/pull/126), [#128](https://github.com/the-static-collective/webZ/pull/128), [#129](https://github.com/the-static-collective/webZ/pull/129), and [#133](https://github.com/the-static-collective/webZ/pull/133). Unmerged PRs are explicitly *proposed code*, not deployed Abundent production features.

External independent sites are:

- [CADA](https://www.cadamn.org/): organizational site says community education and services across south-central Minnesota, including Waseca.
- [LegalCORPS nonprofit assistance](https://legalcorps.org/nonprofit-organizations/): terms/eligibility vary and some services carry fees; a startup consultation is not an engagement for ongoing representation.
- [SMRLS legal services](https://www.smrls.org/legal-services): describes eligible civil/family services; individual case issues must stay with a qualified professional.

No sites were contacted by JAR;VIS. No user-specific eligibility was determined; none are official project partners.

## Safety and operational release

1. No public survivor testimony, custody evidence, case facts, identifying contact records, moderator keys, legal files, personal histories or individual volunteer dossiers in this repository, the JAR journal, webZ static public Commons, or public GRAFT indexes.
2. A survivor should not need to disclose a case or become a volunteer to receive a low-pressure informational first step. An interested friend can help design fictional sample formats without accessing any sensitive records.
3. Before any live peer support: responsible human operator, relevant expert review, safe contact/incident policies, verified and trained moderators, confidentiality/retention/deletion procedures, independent consent and conflict resolution.
4. No automatic matchmaking, bulk recruitment, proactive contacting, case-specific legal advice, or promotion of an unverified report into an accepted outcome.
5. If the community learns a useful **process lesson**, an authorized human can prepare a minimal de-identified public summary for independent review and GRAFT publication. That is a *future* handoff, not a live pipeline.
6. JAR and VIS do not own the people concerned. Missing authority means HOLD.

**Governing sentence:** When the work hits a barrier, name the missing protective capability and invite a willing helper to make one bounded next step possible. Do not make survivors pay for our organizational gaps with their private lives.
