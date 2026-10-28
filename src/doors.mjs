// Capability directory only. These entries DO NOT read the named project's private state.
export const doors = Object.freeze([
  {
    id: "garden", title: "The Garden", family: "PARTICULARS",
    status: "fixture", role: "Need / offer records; current specimen contains invented Waseca data.",
    capability: "Read fictional local particulars", connected: false
  },
  {
    id: "kinship", title: "Kinship", family: "BROADCAST",
    status: "mock", role: "Proposed live-need signal and response door.",
    capability: "In-process mock broadcast only", connected: false
  },
  {
    id: "relatte", title: "reLATTE", family: "CROSSINGS",
    status: "planned", role: "Signed envelopes, receiver-owned disposition, and portable receipts.",
    capability: "Not connected; no signatures emitted", connected: false
  },
  {
    id: "ghot", title: "GHoT", family: "EXECUTION",
    status: "public source", role: "Read its published executor-pantries documentation. No live BODY is contacted.",
    capability: "Read-only public documentation; runtime unobserved", connected: false, sourceReadable: true
  },
  {
    id: "planz", title: "planZ", family: "INTENT",
    status: "public source", role: "Inspect a reviewed public plan subset, known blockers and next human gates. Local project authority remains external.",
    capability: "Opt-in read-only public plan index; no plan execution", connected: false, sourceReadable: true
  },
  {
    id: "abundent", title: "Abundent", family: "RETURN",
    status: "planned", role: "A public-facing return address for authorized cards and responses.",
    capability: "Not connected", connected: false
  },
  {
    id: "penny", title: "PENNY", family: "CONTRIBUTION",
    status: "planned", role: "An optional future accounting interface for small contributions.",
    capability: "Not connected; no financial actions", connected: false
  }
]);
