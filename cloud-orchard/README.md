# Cloud Orchard 001 — from weaves to proposed we'ves

**Status:** experimental creative search, not a public service or an AI-agent system.

What if the Collective could send many tiny creative questions to independent compute workers, then hand back **real printable, inspectable choices** rather than a grand opaque AI response? This is an intentionally bounded first version: 10 curated cross-project ideas × 4 lenses (MAKE, CARE, WITNESS, BROADCAST) = **40 parallelizable candidate cards**.

Every card includes a 15-minute first move, the artifact it would make, and a necessary human check. A filterable, printer-friendly offline index.html, ideas.json, and receipt.json are produced for review. This is deterministic recombination from *curated sample descriptions*, **not** live repository discovery, model creativity, task completion, partner validation or public publication.

## Run it now (no account, no dependencies)

    python3 cloud-orchard/orchard.py --out dist/cloud-orchard
    python3 -m unittest discover -s cloud-orchard -p 'test_*.py' -v

Open dist/cloud-orchard/index.html. Every receipt is unsigned; SHA-256 detects change but does not prove who generated output or verify factual claims.

## Free GitHub compute

The Cloud Orchard 001 workflow runs the offline suite and packages an HTML + JSON artifact on **push or PR** to the paths for this slice. This uses standard GitHub-hosted runners and *no external AI or account secrets*. Later, from the **Actions → Cloud Orchard 001 → Run workflow** control (once this workflow is present on the default branch), choose the github option to run explicitly.

## Optional Modal real fanout — manual only

The same bounded workload can distribute to up to **4 Modal CPU containers** using generate_remote.map(tasks):

    pip install 'modal>=1.0,<2.0'
    modal setup   # only if the machine is not already authenticated
    modal run cloud-orchard/modal_orchard.py --out dist/cloud-orchard

For GitHub Actions, add repository secrets MODAL_TOKEN_ID and MODAL_TOKEN_SECRET through GitHub secret configuration (do not commit them), then manually select engine=modal. This consumes **real Modal compute and may incur costs**; it is not invoked by the PR or push workflow. No GPU, always-on server, broad network access, arbitrary source fetching or automatic deployment. max_containers=4, 0.25 CPU per task, 256 MiB memory, 60-second task timeout, 10-minute workflow ceiling; budget controls and Modal account limits remain independent.

## Why here, why this boundary

- JAR;VIS keeps attention separate from execution authority. GRAFT remains its own source owner.
- The ten pair descriptions are idea seeds, not synced facts about the current projects.
- Unverified self-reports, volunteer details and real survivor/community information are **not input**.
- No API keys, secrets, real community data, messaging, publication, media rights or direct integration are needed.
- A compute receipt proves only that a structured deterministic transformation was produced from seed bytes. execution_mode_reported is not a trusted remote-attestation claim.

## Next real crossing

Let a human choose **one card**, then replace its fictional input with a **source-owner-approved, SHA-pinned public read**. Build the smallest artifact, verify it independently, and publish only after a separate explicit choice. Model/GPU workers would be a future opt-in, metered adapter, never a silent default.
