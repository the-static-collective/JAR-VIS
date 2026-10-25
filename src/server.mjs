import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Workbench } from "./workbench.mjs";

const staticFiles = new Map([
  ["/", [new URL("../public/index.html", import.meta.url), "text/html; charset=utf-8"]],
  ["/app.js", [new URL("../public/app.js", import.meta.url), "text/javascript; charset=utf-8"]],
  ["/site.css", [new URL("../public/site.css", import.meta.url), "text/css; charset=utf-8"]]
]);
const headers = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};
const reply = (res, status, body, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { ...headers, "content-type": type });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
};

async function readJson(req) {
  if (!req.headers["content-type"]?.startsWith("application/json")) {
    throw Object.assign(new Error("JSON content-type required"), { status: 415 });
  }
  let total = 0;
  const parts = [];
  for await (const part of req) {
    total += part.length;
    if (total > 16 * 1024) throw Object.assign(new Error("Body too large"), { status: 413 });
    parts.push(part);
  }
  let value;
  try { value = JSON.parse(Buffer.concat(parts).toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid JSON body"), { status: 400 }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("Expected JSON object"), { status: 400 });
  }
  return value;
}

export async function startWorkbenchServer({ journalPath, port = 7789, workbench } = {}) {
  if (!workbench && !journalPath) throw new Error("journalPath required");
  const app = workbench ?? await Workbench.open({ journalPath });
  const csrf = randomBytes(24).toString("hex");
  let boundPort;
  const server = createServer(async (req, res) => {
    try {
      const host = req.headers.host;
      const allowed = new Set(["127.0.0.1:" + boundPort, "localhost:" + boundPort]);
      if (!allowed.has(host)) return reply(res, 403, { error: "Untrusted Host header" });
      const origin = req.headers.origin;
      if (origin && (new URL(origin).protocol !== "http:" || !allowed.has(new URL(origin).host))) {
        return reply(res, 403, { error: "Cross-origin request refused" });
      }
      const pathname = new URL(req.url, "http://" + host).pathname;
      if (req.method === "GET") {
        if (pathname === "/api/state") return reply(res, 200, { ...app.state(), csrfToken: csrf });
        if (pathname === "/api/health") return reply(res, 200, { ok: true, mode: "localhost-mock" });
        const staticEntry = staticFiles.get(pathname);
        if (!staticEntry) return reply(res, 404, { error: "Not found" });
        const [path, type] = staticEntry;
        return reply(res, 200, await readFile(path, "utf8"), type);
      }
      if (req.method !== "POST") return reply(res, 405, { error: "Unsupported method" });
      if (req.headers["x-jarvis-csrf"] !== csrf) {
        return reply(res, 403, { error: "Missing or invalid local anti-CSRF token" });
      }
      const body = await readJson(req);
      if (pathname === "/api/propose") return reply(res, 200, await app.proposeNeed(body.needId));
      if (pathname === "/api/grant") return reply(res, 200, await app.grant(body));
      if (pathname === "/api/dispatch") return reply(res, 200, await app.dispatch(body.proposalId));
      if (pathname === "/api/attend") return reply(res, 200, app.attend(body.text));
      if (pathname === "/api/heartbeat-witness") return reply(res, 200, await app.witnessMock(body));
      if (pathname === "/api/inspect-door") return reply(res, 200, await app.inspectDoor(body.doorId));
      if (pathname === "/api/house-party") return reply(res, 200, await app.hostFixtureParty());
      if (pathname === "/api/import-native") return reply(res, 200, await app.importNativeReport(body));
      return reply(res, 404, { error: "Not found" });
    } catch (error) {
      const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status : 500;
      if (status === 500) console.error("[JAR;VIS] Internal request failure:", error);
      return reply(res, status, { error: status === 500 ? "Internal error" : error.message });
    }
  });
  server.requestTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  boundPort = server.address().port;
  return {
    app,
    url: "http://127.0.0.1:" + boundPort,
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()))
  };
}
