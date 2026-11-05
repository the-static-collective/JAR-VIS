# JAR;VIS-027 — Capability Gardener and Live Public Pilot

This draft builds on the Investigation Desk in JAR;VIS-026.

## New controls on `/investigate`

**Grow + challenge candidate**: a separate approved public GitHub source search finds a source-verified OpenAPI description. GRAFT-027 derives several novel executable response-field extractors from synthetic labeled weather examples. It runs a training set, independent withheld cases and invalid-response cases, compares the results and retains the losing candidates. Original planZ computes the next review action. No advertised API service is contacted; no generated program is installed. Non-weather topics HOLD until suitable labeled examples exist.

**Authorize one public example read**: a distinct opt-in runs one public Open-Meteo non-commercial GET with its published fixed Berlin coordinates. The response is checked for location, type, response size and redirect policy. No private account, user coordinates or credentials are used. This confirms an actual *bounded* third-party live read, not automatic connection to any newly discovered server.

The HTTP routes are `POST /api/investigate/garden` and `POST /api/investigate/pilot`, protected by the original local server's anti-CSRF and host restrictions. Each requires its own explicit boolean approval. The browser displays only cited source names and bounded reports with `textContent`; it can export its local JSON report by user action.

Original ALEX-026, GRAFT-026, GRAFT-027 and planZ owners remain intact. Fourteen original donor source files are Git-blob pinned. Both operations are local experiments, not production service connectors or unattended jobs.

```sh
npm test
npm start
# http://127.0.0.1:7789/investigate
```

The complete `npm test` suite, new consent and end-to-end tests, browser syntax checks and the separate real public pilot passed in GitHub Actions. Open-Meteo data attribution and service conditions apply.

The model cannot claim unrestricted browsing, general software invention, independent source truth, automatic integration of arbitrary services or production installation based on these tests.
