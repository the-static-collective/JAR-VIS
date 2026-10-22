import { mkdir, readFile, open } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

const PREFIX = "JARVIS-G002-JOURNAL-V0|";
const copy = (v) => structuredClone(v);
const digest = (event) => createHash("sha256").update(PREFIX + JSON.stringify(event)).digest("hex");

export class LocalJournal {
  #path;
  #events;
  #tail = Promise.resolve();
  constructor(path, events) { this.#path = path; this.#events = events; }
  static async open(path) {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    let data;
    try { data = await readFile(path, "utf8"); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      data = "";
    }
    if (data && !data.endsWith("\n")) throw new Error("Journal has an incomplete final record; refusing startup");
    const events = [];
    for (const line of data.split("\n").filter(Boolean)) {
      let event;
      try { event = JSON.parse(line); }
      catch { throw new Error("Malformed journal JSON; refusing startup"); }
      const { id, ...body } = event;
      const previous = events.at(-1);
      if (body.schema !== "jarvis.local-event/v0" ||
          body.seq !== events.length + 1 ||
          body.prev !== (previous?.id ?? null) ||
          typeof id !== "string" || id !== "jarvis-event-v0:" + digest(body)) {
        throw new Error("Journal chain verification failed at record " + (events.length + 1));
      }
      events.push(event);
    }
    return new LocalJournal(path, events);
  }
  list() { return copy(this.#events); }
  append(kind, payload, at = new Date().toISOString()) {
    const perform = async () => {
      const body = {
        schema: "jarvis.local-event/v0",
        seq: this.#events.length + 1,
        prev: this.#events.at(-1)?.id ?? null,
        kind,
        payload: copy(payload),
        at
      };
      const event = { ...body, id: "jarvis-event-v0:" + digest(body) };
      const file = await open(this.#path, "a", 0o600);
      try {
        await file.writeFile(JSON.stringify(event) + "\n", "utf8");
        await file.sync();
      } finally { await file.close(); }
      this.#events.push(event);
      return copy(event);
    };
    const result = this.#tail.then(perform);
    this.#tail = result.catch(() => {});
    return result;
  }
}
