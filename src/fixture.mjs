import { Jar } from "./engine.mjs";

// Entirely fictional participants and quantities. This is NOT live community data.
export const gardenJar = () => new Jar([
  {
    schema: "jarvis.particular/v0",
    id: "garden.need.produce-001",
    kind: "need",
    steward: "demo-garden-coordinator",
    category: "produce-boxes",
    region: "waseca-mn-demo",
    quantity: 12,
    unit: "boxes",
    status: "open",
    label: "Demo: 12 produce boxes needed for a community table"
  },
  {
    schema: "jarvis.particular/v0",
    id: "garden.offer.produce-001",
    kind: "offer",
    steward: "demo-local-grower",
    category: "produce-boxes",
    region: "waseca-mn-demo",
    quantity: 20,
    unit: "boxes",
    status: "open",
    label: "Demo: 20 surplus produce boxes available"
  }
]);
