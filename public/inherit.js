"use strict";
const $ = (id) => document.getElementById(id);
let state = null;
let selectedId = null;
let csrf = "";
let noticeTimer;

const node = (tag, text, className = "") => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = String(text);
  if (className) el.className = className;
  return el;
};
function notice(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $("toast").hidden = true, 6500);
}
async function request(path, data) {
  const response = await fetch("/api/inheritance/" + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-jarvis-csrf": csrf },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Local operation refused");
  return result;
}
async function refresh() {
  const response = await fetch("/api/inheritance", { cache: "no-store" });
  if (!response.ok) throw new Error("Inheritance notebook is unavailable");
  state = await response.json();
  csrf = state.csrfToken;
  if (!state.records.some((r) => r.id === selectedId)) selectedId = state.records[0]?.id ?? null;
  render();
}
function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}
async function submit(form, route, transform = (v) => v, after = () => {}) {
  try {
    const fields = transform(formData(form));
    const result = await request(route, fields);
    after(result);
    form.reset();
    await refresh();
    notice("Saved in the local append-only notebook. Nothing was published.");
  } catch (e) { notice(e.message); }
}
function renderCounters() {
  const labels = [
    ["weaves", "Possible work"],
    ["commitments", "Recorded commitments"],
    ["reported", "Unverified reports"],
    ["reviewed", "Reviewed claims"],
    ["reusableCandidates", "Reusable candidates"],
    ["independentlyVerified", "Independently verified"]
  ];
  $("stats").replaceChildren(...labels.map(([key, label]) => {
    const card = node("div", "", "stat");
    card.append(node("strong", state.counters[key]), node("span", label));
    return card;
  }));
}
function renderRecords() {
  const box = $("records");
  box.replaceChildren();
  if (!state.records.length) {
    box.append(node("p", "No work recorded yet. Start with one bounded, non-sensitive need.", "empty"));
    return;
  }
  for (const r of state.records) {
    const button = node("button", "", "record" + (r.id === selectedId ? " active" : ""));
    button.type = "button";
    button.append(node("strong", r.title), node("small", r.stage.replaceAll("_", " ") + " · " + r.region));
    button.addEventListener("click", () => { selectedId = r.id; render(); });
    box.append(button);
  }
}
function step(label, value) {
  const box = node("div", "", "step");
  box.append(node("span", label), node("p", value));
  return box;
}
function renderJourney() {
  const r = state.records.find((item) => item.id === selectedId);
  $("journey").hidden = !r;
  if (!r) return;
  $("chosenTitle").textContent = r.title;
  $("chosenStatus").textContent = r.need + " · " + r.region + " · " + r.steward;
  $("timeline").replaceChildren(
    step("WEAVE", "Recorded need (possibility, not commitment)"),
    step("COMMITMENT", r.commitment ? "Steward choice asserted locally; identity not authenticated" : "Awaiting voluntary assertion"),
    step("WE'VE?", !r.report ? "No completed work reported" :
      r.report.outcome + " reported by operator — unverified. " + r.report.note),
    step("REVIEW", !r.review ? "No separate review recorded" :
      r.review.decision + " by " + r.review.reviewer + " — identity not authenticated. " + r.review.note),
    step("WE CAN", r.capability ? r.capability.method : "No reusable candidate recorded"),
    step("YOU CAN", r.capability ? r.capability.nextInvitation : "No invitation from this work yet")
  );
  $("commitSection").hidden = Boolean(r.commitment);
  $("reportSection").hidden = !r.commitment || Boolean(r.report);
  $("reviewSection").hidden = !r.report || Boolean(r.review);
  $("returnSection").hidden = r.report?.outcome !== "completed" ||
    r.review?.decision !== "accept-report" || Boolean(r.capability);
  if (!r.commitment) $("commitForm").elements.actor.value = r.steward;
  const text = !r.commitment ? "Next: record an explicitly volunteered commitment." :
    !r.report ? "Next: report the result, including blocked or partial outcomes." :
    !r.review ? "Next: record a separate review; do not mistake this for authentication." :
    r.review.decision === "needs-more" ? "HOLD: report needs more evidence; no reusable capability is admitted." :
    r.report.outcome !== "completed" ? "HOLD: partial or blocked work cannot become a completed capability." :
    !r.capability ? "Next: document a repeatable method and a voluntary invitation." :
    "Local candidate ready for inspection or export. It is not externally published or independently verified.";
  $("nextStep").textContent = text;
}
function renderReviewerNeeds() {
  const box = $("reviewerNeeds");
  box.replaceChildren();
  if (!state.reviewerSeats?.length) {
    box.append(node("p", "No active local reviewer-discovery seats. A voluntary task commitment creates one; a recorded review closes it.", "empty"));
    return;
  }
  for (const seat of state.reviewerSeats) {
    const article = node("article", "", "step");
    article.append(
      node("span", seat.priority.replaceAll("_", " ")),
      node("p", seat.reason + " · General region: " + seat.generalRegion),
      node("p", "HOLD: no person assigned, no identity verified, no external publication.")
    );
    box.append(article);
  }
}
function render() {
  renderCounters();
  renderReviewerNeeds();
  renderRecords();
  renderJourney();
}
$("newForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await submit(e.currentTarget, "propose", (data) => data, (result) => { selectedId = result.weave.id; });
});
$("commitForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await submit(e.currentTarget, "commit", (data) => ({
    weaveId: selectedId, actor: data.actor, voluntary: data.voluntary === "on"
  }));
});
for (const [id, route] of [["reportForm", "report"], ["reviewForm", "review"], ["returnForm", "return"]]) {
  $(id).addEventListener("submit", async (e) => {
    e.preventDefault();
    await submit(e.currentTarget, route, (data) => ({ ...data, weaveId: selectedId }));
  });
}
$("exportButton").addEventListener("click", () => {
  const record = state?.records.find((r) => r.id === selectedId);
  if (!record) return;
  const exported = {
    schema: "jarvis.inheritance-export/v0",
    warning: "Local unauthenticated operator assertions; NOT independently verified or publicly published",
    record
  };
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "work-inherits-local-" + record.id.slice(6) + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
});
refresh().catch((error) => notice(error.message));
