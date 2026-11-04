# JAR;VIS ANY INVITATION 001 — a cartridge, not a broadcasting license

The source-owned declarative cartridge at `cartridges/any-invitation-001.json` allows JAR;VIS to propose six distinct routes for *any* kind of invitation: act now, offer to help, ask, pass intentionally, fork an independent invitation, or decline.

`src/any-invitation.mjs` is a strict, deterministic interpreter. It classifies a short, public-safe phrase into a broad topic and explicit or unexpressed availability, then proposes action paths. **NOW gets priority only when the person states or selects it.** The machine always leaves open the possibility of doing something immediately.

The cartridge cannot introduce new executable action IDs, remote delivery, automatic notifications, referral mining, hidden social ranking, privileged endpoints, or authenticated claims. Every output is marked `PROPOSED_ONLY`. A user-created link and its ancestry are never treated as signed authority. Optional click-derived ranking signals are caller-provided and are not persisted.

This cartridge is derived from the experimental webZ invitation chain; it does not itself serve a website or post messages. The active webZ link engine remains authoritative for its own browser UI. JAR;VIS is a consumer of reviewed semantics, not a new network sovereign.

Run `node --test test/any-invitation.test.mjs`.
