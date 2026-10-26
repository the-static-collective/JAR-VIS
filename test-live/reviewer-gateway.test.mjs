import test from "node:test";
import assert from "node:assert/strict";

const endpoint = "https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-reviewers";
const origin = new URL(endpoint).origin;
async function json(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  return { status: res.status, body: await res.json() };
}

test("live public reviewer seat listing is redacted, private signup can be withdrawn", { timeout: 40000 }, async () => {
  if (process.env.RUN_LIVE_REVIEWER_QA !== "1") return;
  const response = await fetch(endpoint + "?format=seats", { signal: AbortSignal.timeout(12000) });
  assert.equal(response.status, 200);
  const snapshot = await response.json();
  assert.equal(snapshot.schema, "jarvis/public-reviewer-seats/v1");
  assert.equal(snapshot.admissions, "NONE");
  assert.equal(snapshot.reviewerVerification, "NOT_ESTABLISHED");
  assert.ok(snapshot.seats.length > 0);
  const seat = snapshot.seats.find((s) => s.title === "Review our first work-inheritance pilot");
  assert.ok(seat, "The Static Collective's opt-in pilot seat should be open");
  assert.equal(seat.role, "reviewer");
  assert.ok(snapshot.seats.every((s) => !Object.keys(s).some((key) => /email|applicant|withdraw|token|phone/i.test(key))));
  const crossOrigin = await fetch(endpoint, {
    method: "POST", headers: { "content-type": "application/json", "origin": "https://unexpected.invalid" },
    body: JSON.stringify({action:"join"}), signal:AbortSignal.timeout(10000)
  });
  assert.equal(crossOrigin.status, 403);

  const submission = {
    action:"join",seatId:seat.id,role:"reviewer",
    alias:"Synthetic QA Only",capability:"process",region:"Test Region",
    availability:"one_time",independence:"unsure",explanation:"Synthetic QA. Withdraw immediately.",
    email:"",contactConsent:false,reviewConsent:true,website:""
  };
  const posted = await json(endpoint,submission);
  assert.equal(posted.status,201,JSON.stringify(posted.body));
  assert.equal(posted.body.receipt.status,"PENDING");
  assert.match(posted.body.receipt.id,/^[0-9a-f-]{36}$/);
  assert.match(posted.body.withdrawKey,/^[A-Za-z0-9_-]{43}$/);
  // Never print the secret or application reference.
  const withdrawn = await json(endpoint,{action:"withdraw",
    id:posted.body.receipt.id,withdrawKey:posted.body.withdrawKey});
  assert.equal(withdrawn.status,200);
  assert.equal(withdrawn.body.withdrawn,true);
});
