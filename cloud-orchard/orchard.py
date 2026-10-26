#!/usr/bin/env python3
"""Cloud Orchard 001. Deterministic, review-only speculative creative work."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LENSES = {"make", "care", "witness", "broadcast"}


def canonical_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(value):
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def read_seeds(path=ROOT / "seed.json"):
    doc = json.loads(Path(path).read_text(encoding="utf-8"))
    if doc.get("schema") != "static-collective.cloud-orchard.seed/v1":
        raise ValueError("Unrecognized seed schema")
    recipes = doc.get("recipes", [])
    lenses = doc.get("lenses", [])
    if not (1 <= len(recipes) <= 100 and 1 <= len(lenses) <= 10):
        raise ValueError("Invalid batch size")
    ids = [r["id"] for r in recipes] + ["lens:" + l["id"] for l in lenses]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate seed IDs")
    if any(l["id"] not in LENSES for l in lenses):
        raise ValueError("Unknown lens")
    return doc


def make_tasks(doc):
    return [{"recipe": recipe, "lens": lens} for recipe in doc["recipes"] for lens in doc["lenses"]]


def generate_candidate(task):
    """Pure worker: returns proposals, never an executed action or true real-world claim."""
    r, l = task["recipe"], task["lens"]
    if l["id"] not in LENSES:
        raise ValueError("Unsupported lens")
    card = {
        "id": r["id"] + "--" + l["id"],
        "title": r["title"],
        "lens": l["id"],
        "lens_title": l["title"],
        "worlds": r["worlds"],
        "proposal": r["idea"],
        "question": "What changes if we " + l["focus"] + "?",
        "first_15_minutes": r["first_step"],
        "artifact": r["artifact"],
        "increment": l["increment"],
        "materials": r["materials"],
        "review_required": r["review"],
        "human_measure": r["measure"],
        "disposition": "PROPOSAL_ONLY_HOLD",
        "source": "curated-local-seed-not-a-live-source-read",
        "score": l["weight"] + min(len(r["worlds"]), 3),
    }
    card["content_sha256"] = digest(card)
    return card


def assemble(doc, cards, mode="local", limit=40):
    if mode not in ("local", "github-actions", "modal-cpu"):
        raise ValueError("Unrecognized execution mode")
    expected = {r["id"] + "--" + l["id"] for r in doc["recipes"] for l in doc["lenses"]}
    if len(cards) != len(expected) or {x["id"] for x in cards} != expected:
        raise ValueError("Missing, repeated or extra workers")
    for card in cards:
        claim = {k: v for k, v in card.items() if k != "content_sha256"}
        if card.get("content_sha256") != digest(claim) or card["disposition"] != "PROPOSAL_ONLY_HOLD":
            raise ValueError("Worker result corrupted or promoted")
    ordered = sorted(cards, key=lambda x: (-x["score"], x["title"], x["lens"]))[:limit]
    bundle = {
        "schema": "static-collective.cloud-orchard.results/v1",
        "source_sha256": digest(doc),
        "execution_mode_reported": mode,
        "worker_count": len(cards),
        "published_count": len(ordered),
        "status": "SPECULATIVE_NOT_APPROVED_OR_DEPLOYED",
        "cards": ordered,
    }
    receipt = {
        "schema": "static-collective.cloud-orchard.receipt/v1",
        "input_sha256": digest(doc),
        "result_sha256": digest(bundle),
        "execution_mode_reported": mode,
        "worker_count": len(cards),
        "verifies": ["deterministic bytes", "all expected proposal workers returned", "no automatic promotion"],
        "does_not_verify": ["remote runner identity", "partner consent", "deployment", "proposal correctness", "human review"],
    }
    return bundle, receipt


def render_html(bundle):
    esc = lambda s: html.escape(str(s), quote=True)
    cards = []
    for c in bundle["cards"]:
        worlds = " × ".join(c["worlds"])
        cards.append(f'''<article class="card" data-lens="{esc(c['lens'])}">
  <div class="eyebrow">{esc(c['lens_title'])} · {esc(worlds)}</div>
  <h2>{esc(c['title'])}</h2><p>{esc(c['proposal'])}</p>
  <div class="detail"><strong>15-minute move</strong><p>{esc(c['first_15_minutes'])}</p></div>
  <div class="detail"><strong>What exists after</strong><p>{esc(c['artifact'])}. {esc(c['increment'])}</p></div>
  <div class="detail"><strong>Before reality changes</strong><p>{esc(c['review_required'])}</p></div>
  <div class="foot"><span>PROPOSAL / HOLD</span><code>{esc(c['content_sha256'][:12])}</code></div>
</article>''')
    content = "\n".join(cards)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cloud Orchard | Static Collective</title><style>
:root {{ color-scheme: dark; font-family: system-ui,sans-serif; background:#111916; color:#e7ecde; }}
body {{ margin:0; }} main {{ max-width:1160px; margin:auto; padding:24px; }}
header {{ border-bottom:1px solid #566852; padding:34px 0; }}
h1 {{ font-size:clamp(2.3rem,7vw,5rem);line-height:1;letter-spacing:-.07em;margin:0 0 10px; }}
header p {{ max-width:760px;color:#b9c8b4;line-height:1.6; }}
button {{ cursor:pointer;border:1px solid #899a79;background:#1c2b24;color:inherit;border-radius:100px;padding:9px 15px;margin:3px; }}
button[aria-pressed=true] {{ background:#dcdea9;color:#111916; }}
.grid {{ display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;margin-top:24px; }}
.card {{ background:#1b2821;border:1px solid #405348;border-radius:18px;padding:20px;display:flex;flex-direction:column; }}
.card[hidden] {{ display:none; }} .eyebrow {{ font-size:.75rem;letter-spacing:.1em;color:#c4cb94;text-transform:uppercase; }}
h2 {{ font-size:1.35rem;margin:14px 0 5px; }} p {{ line-height:1.5; }}
.detail {{ border-top:1px solid #405348;padding-top:10px;margin-top:10px; }}
.detail p {{ margin:6px 0; }}.detail strong {{ color:#d7dcae;font-size:.85rem; }}
.foot {{ margin-top:auto;padding-top:22px;font-size:.7rem;display:flex;justify-content:space-between;color:#c5bca5;gap:10px; }}
footer {{ font-size:.8rem;opacity:.8;padding:30px 0; }}
@media print {{ :root {{ color-scheme:light; background:white;color:black; }} button {{ display:none; }} .card {{break-inside:avoid; background:white;color:black;border:1px solid #555;}} .eyebrow,.detail strong {{color:black;}} }}
</style></head><body><main><header><div class="eyebrow">JAR;VIS · experimental compute nursery 001</div>
<h1>Cloud Orchard</h1><p>Different worlds. Small crossings. Work you can hold. These are generated <strong>candidate ideas</strong>, not accepted tasks, completed work, public services, or partner commitments. No account, tracking or network request.</p>
<nav aria-label="Filter proposals"><button data-filter="all" aria-pressed="true">All</button><button data-filter="make" aria-pressed="false">Make</button><button data-filter="care" aria-pressed="false">Care</button><button data-filter="witness" aria-pressed="false">Witness</button><button data-filter="broadcast" aria-pressed="false">Broadcast</button><button onclick="window.print()">Print</button></nav>
<p id="count" aria-live="polite"></p></header><section class="grid" aria-label="Candidate work cards">{content}</section>
<footer>Source digest: {esc(bundle['source_sha256'][:20])} · Mode (self-reported): {esc(bundle['execution_mode_reported'])} · Every card retains HOLD until reviewed by the relevant human.</footer></main>
<script>for(const b of document.querySelectorAll('button[data-filter]'))b.addEventListener('click',()=>{{const f=b.dataset.filter;let n=0;for(const c of document.querySelectorAll('.card')){{c.hidden=f!=='all'&&c.dataset.lens!==f;if(!c.hidden)n++;}}for(const v of document.querySelectorAll('button[data-filter]'))v.setAttribute('aria-pressed',String(v===b));document.getElementById('count').textContent=n+' proposed crossings';}});document.querySelector('button[data-filter]').click();</script></body></html>'''


def write_bundle(out, bundle, receipt):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "ideas.json").write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out / "receipt.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out / "index.html").write_text(render_html(bundle), encoding="utf-8")
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="dist/cloud-orchard")
    parser.add_argument("--mode", choices=["local", "github-actions"], default="local")
    args = parser.parse_args()
    doc = read_seeds()
    candidates = [generate_candidate(t) for t in make_tasks(doc)]
    bundle, receipt = assemble(doc, candidates, mode=args.mode)
    out = write_bundle(args.out, bundle, receipt)
    print(f"Prepared {len(candidates)} speculative cards: {out} (no external action)")


if __name__ == "__main__":
    main()
