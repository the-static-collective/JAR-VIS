# MODAL-RETURN-001 — JAR;VIS compute seam

**Status: PROPOSED / UNRUN / NO MODAL AUTHENTICATION YET**

This is a minimum reproducible, manual-only bridge:

```text
JAR;VIS GitHub repo → opt-in GitHub Actions → Modal CPU function
    → JSON compute-return artifact → review → possible later integration
```

The first job exercises real remote computation on one explicitly fictional
Garden fixture. It computes a source digest, byte count, and word count and
returns a machine-readable receipt with `admitted: false`. It is **not** an
AI model, partner contact, production worker, source sync, public deployment,
or evidence of real inventory or consent.

## Human-owned one-time setup

1. In the **Modal workspace**, create a dedicated API token (ideally an
   appropriately scoped service-user token, if your plan supports it).
   Do not paste tokens into a chat, Git history, issues, or PRs.
2. In GitHub, go to **the-static-collective/JAR-VIS → Settings → Secrets
   and variables → Actions → New repository secret**. Add separately:
   `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`.
3. Review and merge the PR with this workflow. GitHub Actions
   `workflow_dispatch` becomes available on the default branch.
4. Open **Actions → Modal Return 001 (manual) → Run workflow** on `main`.
5. Download the `modal-return-001-receipt` workflow artifact. Read the
   receipt and the Modal usage dashboard before authorizing larger jobs.

Alternatively, from an authenticated local terminal you can run
`modal run modal/return_worker_001.py`; it writes
`artifacts/modal-return-001.json` locally.

## Guardrails

- Trigger: **manual only**, never on push/PR, no recurrence.
- Only fixed synthetic text crosses to Modal; max input 4096 UTF-8 bytes.
- Requests marked as real are refused; no personal/partner data.
- CPU 0.25 core, RAM 256 MiB, max one container, 60-second remote timeout,
  2-second idle scale-down, and 10-minute GitHub job timeout.
- No GPU, HTTP endpoint, volume, scheduled task, secret attachment to the
  remote function, external network calls from the function, or automatic
  writeback to GitHub/Abundent.
- GitHub action runs with read-only repository permissions.
- Credentials stay in GitHub Actions secrets; logs and artifacts must not
  include them. Rotate or revoke the token when it is no longer needed.
- Workspace budgets/limits are still the independent monetary guardrail;
  check the difference between a spend limit and an alert/threshold.

## Next work after first successful receipt

Add a distinct explicit **GRAFT public-source compute request** (pin source
SHA, scope and consent, validate outputs, return provenance + content hash).
Only then consider an optional GPU worker for transcription/embeddings or a
revocable, authenticated Vercel-to-Modal API. All real-world work and publication
remain separate approval and verification steps. No inferred authorization.
