# INSPAND-004 — JAR;VIS observes source-owned composition

This original JAR;VIS experiment independently observes the pinned CANNON Reflex Composer without importing or reimplementing CANNON's native machine logic and **without running a foreign build**.

The `spec/inspand-composer-source-v1.json` file pins a specific CANNON commit and exact original Git blob identities of its composition registry and native read-only composer program. JAR;VIS compares the checkout HEAD, origin, commit bytes, both original object digests and live source bytes; an altered source requires HOLD. It then invokes only the **original CANNON `list`** operation.

The returned invitation explains one actually typed two-stage recipe, its stages and verified output→input edge. It does not give automatic execution, permission, intellectual property rights, physical action, real-world witness claims, user time savings, or institutional endorsement.

Use `node tools/composition-attendant.mjs inspect --cannon <exact-pinned-checkout>` or `node tools/composition-attendant.mjs list --cannon <exact-pinned-checkout>`. The CLI intentionally rejects build, verify and all authorization flags; it does not compose a human or field action itself.

This is a draft separate owner-side proposal stacked on the existing JAR;VIS INSPAND-003 attendee PR #36. CANNON's source-owning counterpart is its separate draft INSPAND-004 PR #68. No merge or deployment.
