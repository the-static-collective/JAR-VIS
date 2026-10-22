"use strict";
const $ = (query) => document.querySelector(query);
let state = null;
let csrfToken = "";
let chosen = null;
let toastTimeout;

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = String(text);
  return n;
}
function replace(selector, ...children) { $(selector).replaceChildren(...children); }
function toast(message) {
  const target = $("#toast");
  target.textContent = message;
  target.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { target.hidden = true; }, 6500);
}
async function call(route, payload) {
  const response = await fetch(route, {
    method: "POST",
    headers: { "content-type": "application/json", "x-jarvis-csrf": csrfToken },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Command refused");
  return body;
}
async function refresh() {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to observe local field");
  state = await response.json();
  csrfToken = state.csrfToken;
  if (!chosen && state.proposals.length) chosen = state.proposals[0].id;
  render();
}
async function command(action) {
  try { await action(); await refresh(); }
  catch (error) { toast(error.message); }
}
function fieldCard(p) {
  const card = el("article", "particular-card " + (p.kind === "offer" ? "offer" : ""));
  const top = el("div", "particular-top");
  top.append(el("strong", "", p.kind.toUpperCase() + " · " + p.steward), el("span", "record-status", p.status));
  card.append(top, el("h3", "", p.label));
  const meta = el("div", "particular-meta");
  for (const text of [p.quantity + " " + p.unit, p.region, p.category]) meta.append(el("span", "", text));
  card.append(meta);
  return card;
}
function renderParticulars() {
  replace("#particularList", ...state.particulars.needs.concat(state.particulars.offers).map(fieldCard));
}
function cell(label, value) {
  const div = el("div");
  div.append(el("small", "", label), el("strong", "", value));
  return div;
}
function renderProposal() {
  const p = state.proposals.find((entry) => entry.id === chosen) || state.proposals[0];
  const inspector = $("#proposalInspector");
  const controls = $("#grantControls");
  const button = $("#dispatchButton");
  if (!p) {
    const empty = el("div", "empty-state");
    empty.append(el("span", "", ";"), el("strong", "", "No proposal formed yet."),
      el("p", "", "Use “Form proposal” to ask VIS to find a match. Discovery alone does not cross the gate."));
    inspector.replaceChildren(empty);
    controls.replaceChildren(el("p", "", "Form a proposal to see mock-grant controls."));
    button.disabled = true;
    return;
  }
  chosen = p.id;
  const complete = Boolean(p.outcome);
  const head = el("div", "proposal-head");
  head.append(el("h3", "", "Garden ↔ Grower"), el("span", "badge",
    complete ? "MOCK RELAY RECORDED" : p.approvedBy.length === 2 ? "GATE READY — DEMO" : "WAITING FOR APPROVAL"));
  const grid = el("div", "proposal-data");
  const rows = [
    ["NEED ID", p.needId], ["OFFER ID", p.offerId],
    ["ACTION", p.action], ["AUDIENCE", p.audience],
    ["SIMULATED APPROVALS", p.approvedBy.length + " of 2"],
    ["RESULT", p.outcome?.receipt?.kind || "NOT EXECUTED"]
  ];
  for (const [label, value] of rows) grid.append(cell(label, value));
  inspector.replaceChildren(head,
    el("p", "proposal-line", p.reason + ". Both demo stewards must approve the exact mock action and audience."),
    grid, el("p", "proposal-id", "Proposal: " + p.id));
  const grants = p.stewards.map((steward) => {
    const approved = p.approvedBy.includes(steward);
    const row = el("div", "grant-item");
    const body = el("div");
    body.append(el("strong", "", steward), el("small", "", approved ? "MOCK APPROVED" : "No active mock grant"));
    const action = el("button", "mini-button " + (approved ? "revoked" : ""), approved ? "Revoke" : "Simulate YES");
    action.type = "button";
    action.disabled = complete;
    action.addEventListener("click", () => mockGrant(steward, approved ? "revoke" : "approve"));
    row.append(body, action);
    return row;
  });
  controls.replaceChildren(...grants);
  button.disabled = complete;
  button.textContent = complete ? "Mock crossing recorded ✓" : "Attempt mock crossing ↗";
  if (complete) $("#returnMessage").textContent = p.outcome.returnText;
}
function renderDoors() {
  replace("#doorGrid", ...state.doors.map((door) => {
    const card = el("article", "door");
    const head = el("div", "door-head");
    head.append(el("span", "", door.family), el("small", "", door.status.toUpperCase()));
    card.append(head, el("h3", "", door.title), el("p", "", door.role), el("div", "door-cap", door.capability));
    if (door.sourceReadable) {
      const action = el("button", "mini-button source-button", "Inspect published source ↗");
      action.type = "button";
      action.addEventListener("click", () => command(async () => {
        const result = await call("/api/inspect-door", { doorId: door.id });
        toast("READ only: " + result.observation.repository + " — no authority or execution admitted.");
      }));
      card.append(action);
    }
    const observed = state.sourceObservations.find((item) => item.doorId === door.id);
    if (observed) {
      card.append(el("p", "source-meta", "LAST READ · " + new Date(observed.observedAt).toLocaleString()));
    }
    return card;
  }));
  const region = $("#doorObservation");
  const observations = state.sourceObservations;
  if (!observations.length) {
    region.replaceChildren(el("p", "description", "No external source has been read. Inspect GHoT or planZ explicitly to request a public GitHub document."));
    return;
  }
  const heading = el("h3", "", "Source observations · read only");
  const notice = el("p", "description", "Previously retrieved public text only. No repository writes, live executor discovery, signed trust, or admission. Re-inspect to check for changes.");
  const readings = observations.map((reading) => {
    const article = el("article", "observation");
    article.append(el("h4", "", reading.repository + " · " + new Date(reading.observedAt).toLocaleString()));
    const source = el("a", "source-link", reading.source);
    source.href = reading.source;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    article.append(source, el("p", "source-digest", "SHA-256 of published bytes: " + reading.contentSha256));
    const list = el("div", "observed-caps");
    for (const cap of reading.capabilities) {
      const row = el("div", "observed-cap");
      row.append(el("strong", "", cap.label), el("span", "", cap.kind + " · runtime not observed · cannot execute"));
      list.append(row);
    }
    article.append(list);
    return article;
  });
  region.replaceChildren(heading, notice, ...readings);
}
function renderEvents() {
  if (!state.events.length) { replace("#eventList", el("p", "description", "No events recorded; nothing crossed.")); return; }
  replace("#eventList", ...state.events.map((event) => {
    const item = el("article", "event");
    item.append(el("div", "event-marker " + (event.kind === "HELD" ? "held" : ""),
      event.kind === "CROSSED" ? "↗" : event.kind === "HELD" ? "⋮" : "•"));
    const main = el("div");
    main.append(el("strong", "", event.kind.replaceAll("_", " ")),
      el("small", "", "Event " + event.seq + " · " + (event.subject || "—")));
    item.append(main, el("time", "", new Date(event.at).toLocaleString()));
    return item;
  }));
}
function render() {
  for (const [key, id] of [
    ["needs", "#needCount"], ["offers", "#offerCount"],
    ["proposals", "#proposalCount"], ["mockRelays", "#relayCount"]
  ]) $(id).textContent = state.counters[key];
  renderParticulars();
  renderProposal();
  renderDoors();
  renderEvents();
}
async function mockGrant(steward, decision) {
  if (decision === "approve") {
    const response = window.prompt("SIMULATION ONLY. You are NOT authenticating " + steward +
      ".\nTo record a mock approval for this exact proposal, type MOCK YES:");
    if (response !== "MOCK YES") return toast("No mock approval was recorded.");
  } else if (!window.confirm("Revoke this local mock grant?")) return;
  await command(async () => {
    await call("/api/grant", { proposalId: chosen, steward, decision });
    $("#returnMessage").textContent = decision === "approve"
      ? "A local simulated grant was recorded, not an identity-verified approval."
      : "Mock grant revoked. The gate returns to HOLD.";
    toast(decision === "approve" ? "MOCK grant recorded. Not real consent." : "Mock grant revoked.");
  });
}
function addChat(who, message) {
  const entry = el("div", "chat-entry " + (who === "YOU" ? "user-entry" : ""));
  entry.append(el("strong", "", who), el("p", "", message));
  $("#attendantLog").append(entry);
  $("#attendantLog").scrollTop = $("#attendantLog").scrollHeight;
}
async function ask(question) {
  addChat("YOU", question);
  try {
    const answer = await call("/api/attend", { text: question });
    addChat("JAR;VIS · RULES ONLY", answer.answer);
  } catch (error) { toast(error.message); }
}
$("#scanButton").addEventListener("click", () => command(async () => {
  const record = state?.particulars?.needs?.[0];
  if (!record) throw new Error("No local need is available");
  const result = await call("/api/propose", { needId: record.id });
  chosen = result.proposal.id;
  $("#returnMessage").textContent = result.reused
    ? "Existing proposal reused; no message sent."
    : "Proposal formed. It has no authority and has not been relayed.";
  toast(result.reused ? "Existing proposal reopened." : "Proposal formed, no action sent.");
  location.hash = "crossing";
}));
$("#dispatchButton").addEventListener("click", () => command(async () => {
  const result = await call("/api/dispatch", { proposalId: chosen });
  $("#returnMessage").textContent = result.returnText;
  toast(result.receipt.kind === "HOLD"
    ? "HOLD — no mock relay recorded."
    : "Only the local mock Kinship outbox was updated.");
}));
$("#askForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#askInput");
  const text = input.value.trim();
  if (text) { input.value = ""; ask(text); }
});
document.querySelectorAll("[data-ask]").forEach((button) => {
  button.addEventListener("click", () => ask(button.dataset.ask));
});
refresh().catch((error) => toast(error.message + " — check the local server."));
