import { createHash } from "node:crypto";

// Every outbound destination is fixed by code, not supplied by a browser.
// Public GitHub documents are evidence of *published descriptions*, not live authority.
const SOURCES = Object.freeze({
  ghot: Object.freeze({
    id: "ghot",
    repository: "the-static-collective/GHoT",
    ref: "main",
    path: "docs/EXECUTOR-PANTRY.md",
    documentKind: "documented-executors"
  }),
  planz: Object.freeze({
    id: "planz",
    repository: "the-static-collective/planZ",
    ref: "main",
    path: "README.md",
    documentKind: "published-purpose"
  })
});
const LIMIT = 128 * 1024;
const ID = /^[a-z][a-z0-9-]{0,31}$/;
export const publicDoorIds = Object.freeze(Object.keys(SOURCES));
export const sourceForDoor = (id) => Object.hasOwn(SOURCES, id) ? SOURCES[id] : null;

function parseGhot(text) {
  const section = text.match(/^## V0 executors\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  if (!section) throw new Error("Expected GHoT executor section not found; do not infer capability");
  const labels = section[1].split("\n").map((line) => line.match(/^\s*-\s+([A-Za-z0-9.+ /-]{1,55})\s*$/)?.[1]?.trim())
    .filter(Boolean);
  if (!labels.length || labels.length > 32 || new Set(labels).size !== labels.length) {
    throw new Error("Invalid published executor list");
  }
  return labels.map((label, index) => ({
    id: "ghot.pantry.executor." + String(index + 1).padStart(2, "0"),
    label,
    kind: "documented-executor-type",
    runtimeAvailability: "not-observed",
    callable: false,
    sourceClaim: "Listed under GHoT Executor Pantry / V0 executors"
  }));
}
function parsePlanz(text) {
  if (!text.includes("Global plan census, archaeology, and disposition for the Static Collective.") ||
      !text.includes("provenance-preserving index and recovery surface")) {
    throw new Error("Expected planZ purpose statements not found");
  }
  return [{
    id: "planz.published-purpose",
    label: "Plan census, archaeology, and disposition",
    kind: "documented-project-purpose",
    runtimeAvailability: "not-observed",
    callable: false,
    sourceClaim: "planZ README project purpose; no machine-readable plan API is declared"
  }];
}
async function boundedText(response) {
  const headerLength = response.headers?.get("content-length");
  if (headerLength && Number(headerLength) > LIMIT) throw new Error("Public document exceeds size limit");
  const type = response.headers?.get("content-type") ?? "";
  if (type && !/^(text\/plain|text\/markdown|application\/octet-stream)/i.test(type)) {
    throw new Error("Unexpected public document content type");
  }
  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const chunks = [];
  let n = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      n += value.byteLength;
      if (n > LIMIT) throw new Error("Public document exceeds size limit");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), n);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return { text: decoder.decode(bytes), bytes };
}
export async function inspectPublicDoor(id, {
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
  timeoutMs = 5500
} = {}) {
  if (typeof id !== "string" || !ID.test(id)) throw new Error("Invalid door ID");
  const profile = sourceForDoor(id);
  if (!profile) throw new Error("Door is not allowlisted for public-source inspection");
  const [owner, repo] = profile.repository.split("/");
  const url = new URL("https://raw.githubusercontent.com/");
  url.pathname = "/" + [owner, repo, profile.ref, profile.path].join("/");
  const response = await fetchImpl(url.href, {
    method: "GET",
    redirect: "error",
    headers: { accept: "text/plain" },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response || !response.ok || response.redirected ||
      response.url && response.url !== url.href) {
    throw new Error("Pinned public-source request did not return an exact successful response");
  }
  const { text, bytes } = await boundedText(response);
  const capabilities = id === "ghot" ? parseGhot(text) : parsePlanz(text);
  return {
    schema: "jarvis.public-door-observation/v0",
    doorId: id,
    repository: profile.repository,
    source: url.href,
    sourcePath: profile.path,
    ref: profile.ref,
    contentSha256: createHash("sha256").update(bytes).digest("hex"),
    observedAt: now(),
    access: "public-read-only",
    credibility: "published-source-text-not-authenticated-runtime",
    admission: "none",
    runtimeConnected: false,
    capabilities
  };
}
