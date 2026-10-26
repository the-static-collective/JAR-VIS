"""Optional bounded Modal CPU fanout. Invoke only after explicit operator action."""
from pathlib import Path

import modal
from orchard import assemble, generate_candidate, make_tasks, read_seeds, write_bundle

app = modal.App("static-cloud-orchard-001")
image = modal.Image.debian_slim(python_version="3.12").add_local_python_source("orchard")


@app.function(image=image, cpu=0.25, memory=256, timeout=60, max_containers=4)
def generate_remote(task):
    from orchard import generate_candidate
    return generate_candidate(task)


@app.local_entrypoint()
def main(out: str = "dist/cloud-orchard"):
    doc = read_seeds(Path(__file__).with_name("seed.json"))
    tasks = make_tasks(doc)
    cards = list(generate_remote.map(tasks))  # actual remote compute; max four containers
    bundle, receipt = assemble(doc, cards, mode="modal-cpu")
    path = write_bundle(out, bundle, receipt)
    print(f"Received {len(cards)} remote proposal workers. Local artifact: {path}")
