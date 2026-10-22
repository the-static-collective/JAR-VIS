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
    status: "planned", role: "Capability and body discovery without assigning authority to a processor.",
    capability: "Not connected", connected: false
  },
  {
    id: "planz", title: "planZ", family: "INTENT",
    status: "planned", role: "Plan census and dispositions; a source index, not an authority engine.",
    capability: "Not connected", connected: false
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
