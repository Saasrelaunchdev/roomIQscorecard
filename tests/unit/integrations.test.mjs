// The outside systems, with fetch stubbed: what is sent to Meta (qualified only, never after an opt-out), GoHighLevel,
// the webhooks (signed), and Supabase (the REST calls the store makes). No network.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { toMeta, toGhl, toWebhooks, signature, verifySignature, toLeadsTable } from "../../api/_lib/integrations.mjs";
import { getStore, isSecretKey, StoreError } from "../../api/_lib/store.mjs";

let calls, reply;
const realFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  reply = () => ({ status: 200, body: "{}" });
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET", headers: init.headers || {}, body: init.body });
    const r = reply(String(url), init);
    return new Response(r.body, { status: r.status, headers: r.headers || {} });
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const k of ["META_PIXEL_ID", "META_CAPI_TOKEN", "META_TEST_EVENT_CODE", "GHL_TOKEN", "GHL_LOCATION_ID", "GHL_SCORECARD_FIELDS", "SCORECARD_WEBHOOK_URLS", "SCORECARD_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SCORECARD_STORE_DIR", "LEADS_MIRROR", "SUPABASE_ANON_KEY"]) delete process.env[k];
});

// A RoomIQ lead: no business, the market of the deal in the city column
const row = { id: "r1", email: "Sam@Example.com", first_name: "Sam", city: "Atlanta", company: "", visit: "visit-1", fit: "qualified",
  tracking: { fbc: "fb.1.1700000000000.abcdefghij", fbp: "fb.1.1700000000000.1234567890", gpc: false, ads_consent: "granted", utm_source: "facebook" }, answers: { stage: "looking", market: "atlanta" }, consent: { consentEmail: true } };

test("Meta: ScorecardComplete for every completion (the GTM's event map), hashed details, the browser's event id", async () => {
  process.env.META_PIXEL_ID = "123456789";
  process.env.META_CAPI_TOKEN = "secret-token";
  const ok = await toMeta({ name: "ScorecardComplete", everyone: true, eventId: "complete-abcdef123", row: { ...row, fit: "learning" }, ip: "203.0.113.9", ua: "Mozilla/5.0", sourceUrl: "https://x.test/", custom: { content_name: "scorecard" } });
  assert.equal(ok, true, "an unqualified completion still counts: decision 10 judges every completion");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/graph\.facebook\.com\/v25\.0\/123456789\/events\?access_token=secret-token$/);
  const body = JSON.parse(calls[0].body);
  const e = body.data[0];
  assert.equal(e.event_name, "ScorecardComplete");
  assert.equal(e.event_id, "complete-abcdef123");
  assert.deepEqual(e.custom_data, { content_name: "scorecard" });
  assert.match(e.user_data.em[0], /^[0-9a-f]{64}$/);
  assert.equal(e.user_data.fbc, row.tracking.fbc);
  assert.equal(e.user_data.ct, undefined, "the market of the deal is never sent as the lead's city");
  assert.equal(JSON.stringify(body).includes("sam@example.com"), false, "never the email in the clear");
});

test("Meta: Schedule only for a qualified scorecard; nothing under Global Privacy Control or after a declined notice", async () => {
  process.env.META_PIXEL_ID = "123456789";
  process.env.META_CAPI_TOKEN = "secret-token";
  assert.equal(await toMeta({ name: "Schedule", eventId: "schedule-abcdef123", row: { ...row, fit: "learning" } }), null);
  assert.equal(await toMeta({ name: "ScorecardComplete", everyone: true, eventId: "complete-abcdef123", row: { ...row, tracking: { ...row.tracking, gpc: true } } }), null);
  assert.equal(await toMeta({ name: "ScorecardComplete", everyone: true, eventId: "complete-abcdef123", row: { ...row, tracking: { ...row.tracking, ads_consent: "denied" } } }), null);
  assert.equal(calls.length, 0);
  assert.equal(await toMeta({ name: "Schedule", eventId: "schedule-abcdef123", row }), true);
  assert.equal(JSON.parse(calls[0].body).data[0].event_name, "Schedule");
  delete process.env.META_CAPI_TOKEN;
  assert.equal(await toMeta({ name: "ScorecardComplete", everyone: true, eventId: "complete-abcdef123", row }), null);
});

test("GoHighLevel: upsert the contact with the scorecard's tags and mapped fields", async () => {
  process.env.GHL_TOKEN = "pit-123";
  process.env.GHL_LOCATION_ID = "loc-1";
  process.env.GHL_SCORECARD_FIELDS = JSON.stringify({ score: "f-score", report_url: "f-report", nope: "x" });
  reply = () => ({ status: 200, body: JSON.stringify({ contact: { id: "c-9" } }) });
  const id = await toGhl({ row, tags: ["scorecard-tier-somedays"], values: { score: 38, report_url: "https://x.test/report/T", tier: "x" } });
  assert.equal(id, "c-9");
  assert.equal(calls[0].url, "https://services.leadconnectorhq.com/contacts/upsert");
  assert.equal(calls[0].headers.authorization, "Bearer pit-123");
  assert.equal(calls[0].headers.version, "2021-07-28");
  const body = JSON.parse(calls[0].body);
  assert.equal(body.locationId, "loc-1");
  assert.deepEqual(body.tags, ["scorecard-roomiq-first-deal", "scorecard-tier-somedays"]);
  assert.deepEqual(body.customFields, [{ id: "f-score", field_value: "38" }, { id: "f-report", field_value: "https://x.test/report/T" }]);
  reply = () => ({ status: 401, body: "{}" });
  assert.equal(await toGhl({ row }), false, "a failure is logged, never thrown");
});

test("Webhooks: one signed POST per URL; the signature verifies; a bad one does not", async () => {
  process.env.SCORECARD_WEBHOOK_URLS = "https://hooks.example.com/a, http://insecure.example.com/b, https://hooks.example.com/c";
  process.env.SCORECARD_WEBHOOK_SECRET = "whsec_test";
  const ok = await toWebhooks("scorecard.completed", { id: "r1", score: 38 });
  assert.equal(ok, true);
  assert.deepEqual(calls.map((c) => c.url), ["https://hooks.example.com/a", "https://hooks.example.com/c"], "only https URLs");
  const sig = calls[0].headers["x-scorecard-signature"];
  assert.equal(calls[0].headers["x-scorecard-event"], "scorecard.completed");
  assert.equal(verifySignature("whsec_test", calls[0].body, sig), true);
  assert.equal(verifySignature("wrong", calls[0].body, sig), false);
  assert.equal(verifySignature("whsec_test", calls[0].body + " ", sig), false);
  assert.equal(verifySignature("whsec_test", "{}", signature("whsec_test", "{}", Math.floor(Date.now() / 1000) - 3600)), false, "an old signature is refused");
  assert.equal(JSON.parse(calls[0].body).event, "scorecard.completed");
});

test("the shared leads table: only with LEADS_MIRROR, through submit_lead()", async () => {
  assert.equal(await toLeadsTable(row, "scorecard-roomiq-first-deal"), null);
  process.env.LEADS_MIRROR = "1";
  process.env.SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_ANON_KEY = "sb_publishable_x";
  reply = () => ({ status: 200, body: JSON.stringify("lead-uuid") });
  assert.equal(await toLeadsTable({ ...row, score: 38 }, "scorecard-roomiq-first-deal"), "lead-uuid");
  assert.equal(calls[0].url, "https://abc.supabase.co/rest/v1/rpc/submit_lead");
  const p = JSON.parse(calls[0].body).payload;
  assert.equal(p.form, "scorecard-roomiq-first-deal");
  assert.equal(p.fields.score, 38);
  assert.equal(p.meta.utm_source, "facebook");
});

test("Supabase: the secret key only; create through scorecard_submit(); reads, updates, lists, events over REST", async () => {
  assert.equal(isSecretKey("sb_secret_abc"), true);
  assert.equal(isSecretKey("sb_publishable_abc"), false);
  process.env.SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_publishable_wrong";
  assert.equal(getStore().mode, "none", "a publishable key is refused, not used");
  process.env.SUPABASE_SECRET_KEY = "sb_secret_abc";
  const store = getStore();
  assert.equal(store.mode, "supabase");
  reply = (url) => {
    if (url.endsWith("/rpc/scorecard_submit")) return { status: 200, body: JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", token: "t" }) };
    if (url.includes("scorecard_assessments?select=*&order")) return { status: 200, body: JSON.stringify([{ id: "a" }]), headers: { "content-range": "0-0/42" } };
    if (url.includes("scorecard_assessments?id=eq.")) return { status: 200, body: JSON.stringify([{ id: "11111111-1111-4111-8111-111111111111", status: "booked" }]) };
    if (url.endsWith("/scorecard_events")) return { status: 201, body: "" };
    if (url.endsWith("/rpc/scorecard_event_counts")) return { status: 200, body: JSON.stringify([{ variant: "", name: "view", step: "", visits: 3 }]) };
    return { status: 200, body: "[]" };
  };
  const saved = await store.create({ email: "a@b.co" });
  assert.equal(saved.id, "11111111-1111-4111-8111-111111111111");
  assert.equal(calls[0].headers.apikey, "sb_secret_abc");
  assert.match(JSON.parse(calls[0].body).payload.token, /^[A-Za-z0-9_-]{32}$/);
  const updated = await store.update("11111111-1111-4111-8111-111111111111", { status: "booked", id: "hack", token: "hack", unknown: 1 });
  assert.equal(updated.status, "booked");
  const patch = JSON.parse(calls[1].body);
  assert.equal("id" in patch || "token" in patch || "unknown" in patch, false, "only real columns, never the id or the token");
  assert.equal(calls[1].method, "PATCH");
  const list = await store.list({ status: "new", q: "Maple", from: "2026-11-01T00:00:00.000Z" });
  assert.equal(list.total, 42);
  assert.match(calls[2].url, /status=eq\.new/);
  assert.match(calls[2].url, /or=\(company\.ilike\.\*Maple\*/);
  assert.equal(calls[2].headers.prefer, "count=exact");
  assert.equal(await store.addEvents([{ visit: "v", name: "view" }]), 1);
  assert.deepEqual(await store.eventCounts({}), [{ variant: "", name: "view", step: "", visits: 3 }]);
  assert.equal(await store.byId("not-a-uuid"), null);
  reply = () => ({ status: 400, body: JSON.stringify({ code: "PT429", message: "Too many submissions. Please try again later" }) });
  await assert.rejects(store.create({ email: "a@b.co" }), (e) => e instanceof StoreError && e.status === 429);
  reply = () => ({ status: 404, body: JSON.stringify({ message: "function not found" }) });
  await assert.rejects(store.create({ email: "a@b.co" }), /run sql\/schema\.sql/);
});

test("the webhook carries the weakest area's name, so a follow-up email can print it without a lookup", async () => {
  const { webhookData } = await import("../../api/_lib/messages.mjs");
  const { evaluate } = await import("../../lib/scoring.mjs");
  const SCORECARD = (await import("../../content/scorecard.mjs")).default;
  const { ROW, HERO, DEEP } = await import("../../lib/sample.mjs");
  const d = webhookData(ROW, evaluate(SCORECARD, HERO, DEEP, {}), { results: "https://x.test/results/T" });
  assert.equal(d.result.bottleneck, "fill");
  assert.equal(d.result.bottleneck_name, "Fill Speed");
  assert.equal(d.deal.market_label, "Atlanta");
  assert.equal(d.result.covered, true);
});
