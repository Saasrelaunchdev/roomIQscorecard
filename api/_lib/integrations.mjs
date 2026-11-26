// The outside systems a scorecard reaches, each optional and each off until its settings are set in Vercel. A failure
// is logged and never fails the visitor's request.
//
//   Meta Conversions API   META_PIXEL_ID, META_CAPI_TOKEN (+ META_TEST_EVENT_CODE, META_GRAPH_VERSION). The GTM's event map
//                          (content/site.mjs metaEvents): ScorecardComplete for every completion, Schedule for qualified
//                          bookings only, with the browser's event id, never after an opt-out (Global Privacy Control or a
//                          declined cookie notice), never with the phone number, and never the market as the lead's city.
//   GoHighLevel            GHL_TOKEN, GHL_LOCATION_ID (+ GHL_SCORECARD_TAG, GHL_SCORECARD_FIELDS). Each scorecard becomes
//                          a contact in the founder's sub-account, tagged so the founder's workflows (nurture, call
//                          reminders) start on it. The same pattern as the landing page's checkout handoff.
//   Webhooks               SCORECARD_WEBHOOK_URLS (comma separated https URLs) + SCORECARD_WEBHOOK_SECRET. ScoreApp's
//                          webhook model: one POST per event, signed (x-scorecard-signature: t=<unix>,v1=<hmac-sha256 hex of
//                          "<t>.<body>">), so Zapier, Make or n8n can pass it on.
//   Shared leads table     LEADS_MIRROR=1 with SUPABASE_URL and a key: each scorecard is also stored in the landing page's
//                          public.leads through public.submit_lead(), so every lead sits in one inbox.
import { createHash, createHmac } from "node:crypto";
import SC from "../../content/scorecard.mjs";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");
const sha = (v) => createHash("sha256").update(v, "utf8").digest("hex");

async function call(url, { method = "POST", headers = {}, body, timeoutMs = 6000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method, headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body), signal: ctrl.signal });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/* ============================================================
   Meta Conversions API (ported from the landing page's meta/api/_lib/capi.mjs)
   ============================================================ */
export function capiConfig() {
  const pixelId = env("META_PIXEL_ID").replace(/\D/g, "");
  const token = env("META_CAPI_TOKEN");
  const version = /^v\d+\.\d+$/.test(env("META_GRAPH_VERSION")) ? env("META_GRAPH_VERSION") : "v25.0";
  const testCode = env("META_TEST_EVENT_CODE");
  return pixelId && token ? { pixelId, token, version, testCode } : null;
}
export const FBC = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_-]{8,500}$/;
export const FBP = /^fb\.\d\.\d{10,13}\.\d{5,25}$/;
export const EVENT_ID = /^(lead|schedule)-[A-Za-z0-9-]{6,64}$/;
const NORM = {
  em: (v) => String(v || "").trim().toLowerCase(),
  fn: (v) => String(v || "").trim().toLowerCase().normalize("NFKC").replace(/[^\p{L}]/gu, ""),
  ct: (v) => String(v || "").trim().toLowerCase().replace(/[^a-z]/g, ""),
  country: (v) => (/^[a-z]{2}$/i.test(String(v || "").trim()) ? String(v).trim().toLowerCase() : ""),
  external_id: (v) => String(v || "").trim()
};
export function userData({ email, firstName, city, country = "us", externalId, ip, ua, fbc, fbp }) {
  const u = {};
  const add = (k, v) => { const n = NORM[k](v); if (n) u[k] = [sha(n)]; };
  add("em", email); add("fn", firstName); add("ct", city); add("country", country); add("external_id", externalId);
  if (ip) u.client_ip_address = String(ip).slice(0, 64);
  if (ua) u.client_user_agent = String(ua).slice(0, 512);
  if (fbc && FBC.test(fbc)) u.fbc = fbc;
  if (fbp && FBP.test(fbp)) u.fbp = fbp;
  return u;
}
// Whether the quiz asks for the lead's own city (RoomIQ's does not: its city column holds the deal's market)
const ASKS_CITY = SC.steps.some((s) => (s.fields || []).some((f) => f.name === "city"));
/** Sends one event. everyone: true for an event the GTM counts on every completion (ScorecardComplete); otherwise
 *  only for qualified answers (Schedule). Resolves true, false (failed), or null (not set up, or not to be sent). */
export async function toMeta({ name, eventId, sourceUrl, row, ip, ua, custom, everyone = false }) {
  const cfg = capiConfig();
  const t = row.tracking || {};
  if (!cfg || (!everyone && row.fit !== "qualified") || t.gpc === true || t.ads_consent === "denied") return null;
  const event = {
    event_name: name, event_time: Math.floor(Date.now() / 1000), event_id: eventId, action_source: "website",
    user_data: userData({ email: row.email, firstName: row.first_name, city: ASKS_CITY ? row.city : "", externalId: row.visit, ip, ua, fbc: t.fbc, fbp: t.fbp }),
    ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
    ...(custom ? { custom_data: custom } : {})
  };
  const body = { data: [event], ...(cfg.testCode ? { test_event_code: cfg.testCode } : {}) };
  try {
    const r = await call(`https://graph.facebook.com/${cfg.version}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.token)}`, { body, timeoutMs: 5000 });
    if (r.status >= 300) throw new Error(`HTTP ${r.status}: ${JSON.stringify(r.data).slice(0, 300).split(cfg.token).join("[token]")}`);
    return true;
  } catch (e) { console.error("Conversions API:", e && e.message); return false; }
}

/* ============================================================
   GoHighLevel: upsert the contact, add tags, fill custom fields
   ============================================================ */
export const GHL_FIELDS = ["score", "tier", "bottleneck", "results_url", "report_url", "deepener_url", "unasked", "work_value", "booking"];
export function ghlConfig() {
  const token = env("GHL_TOKEN"), locationId = env("GHL_LOCATION_ID");
  let fields = {}, fieldsProblem = null;
  if (env("GHL_SCORECARD_FIELDS")) {
    try {
      const f = JSON.parse(env("GHL_SCORECARD_FIELDS"));
      fields = Object.fromEntries(Object.entries(f).filter(([k, v]) => GHL_FIELDS.includes(k) && typeof v === "string" && v.trim()).map(([k, v]) => [k, v.trim()]));
    } catch { fieldsProblem = "GHL_SCORECARD_FIELDS is not valid JSON like {\"score\":\"<field id>\"}"; }
  }
  return token && locationId ? { token, locationId, fields, fieldsProblem, tag: env("GHL_SCORECARD_TAG") || SC.form || "scorecard" } : null;
}
/** Creates or updates the contact; tags: the scorecard tag plus the step's own (e.g. scorecard-booked). */
export async function toGhl({ row, tags = [], values = {} }) {
  const cfg = ghlConfig();
  if (!cfg || !row.email) return null;
  const customFields = Object.entries(cfg.fields).filter(([k]) => values[k] !== undefined && values[k] !== null && values[k] !== "").map(([k, id]) => ({ id, field_value: String(values[k]) }));
  const body = {
    locationId: cfg.locationId, email: row.email, firstName: row.first_name || undefined, lastName: row.last_name || undefined,
    companyName: row.company || undefined, city: row.city || undefined, source: String(SC.name || "Scorecard").replace(/^the\s+/i, ""),
    ...(row.booking && row.booking.phone ? { phone: `+1${row.booking.phone}` } : {}),
    tags: [cfg.tag, ...tags].filter(Boolean),
    ...(customFields.length ? { customFields } : {})
  };
  try {
    const r = await call("https://services.leadconnectorhq.com/contacts/upsert", { headers: { authorization: `Bearer ${cfg.token}`, version: "2021-07-28", accept: "application/json" }, body, timeoutMs: 8000 });
    if (r.status >= 300) throw new Error(`HTTP ${r.status}: ${JSON.stringify(r.data).slice(0, 300)}`);
    return (r.data && r.data.contact && r.data.contact.id) || true;
  } catch (e) { console.error("GoHighLevel:", e && e.message); return false; }
}

/* ============================================================
   Webhooks: scorecard.completed, scorecard.deepened, scorecard.booked, report.sent
   ============================================================ */
export function webhookConfig() {
  const urls = env("SCORECARD_WEBHOOK_URLS").split(",").map((s) => s.trim()).filter((u) => /^https:\/\/[^\s]+$/.test(u));
  return urls.length ? { urls, secret: env("SCORECARD_WEBHOOK_SECRET") } : null;
}
/** The signature header for a body: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>"> */
export function signature(secret, body, t = Math.floor(Date.now() / 1000)) {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}
/** Verifies a signature header (for receivers, and the tests); five minutes of tolerance. */
export function verifySignature(secret, body, headerValue, now = Math.floor(Date.now() / 1000)) {
  const m = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(String(headerValue || ""));
  if (!m || Math.abs(now - Number(m[1])) > 300) return false;
  return signature(secret, body, Number(m[1])) === headerValue;
}
export async function toWebhooks(event, data) {
  const cfg = webhookConfig();
  if (!cfg) return null;
  const body = JSON.stringify({ event, created: new Date().toISOString(), data });
  const results = await Promise.all(cfg.urls.map(async (u) => {
    try {
      const r = await call(u, { body, headers: { "user-agent": "Scorecard-Webhook/1", "x-scorecard-event": event, ...(cfg.secret ? { "x-scorecard-signature": signature(cfg.secret, body) } : {}) }, timeoutMs: 5000 });
      if (r.status >= 300) throw new Error(`HTTP ${r.status}`);
      return true;
    } catch (e) { console.error(`webhook ${new URL(u).host}:`, e && e.message); return false; }
  }));
  return results.every(Boolean);
}

/* ============================================================
   The shared leads table (the landing page's public.leads), optional
   ============================================================ */
export async function toLeadsTable(row, form) {
  if (!/^(1|true|yes)$/i.test(env("LEADS_MIRROR"))) return null;
  const url = env("SUPABASE_URL").replace(/\/+$/, "");
  const key = env("SUPABASE_ANON_KEY") || env("SUPABASE_SECRET_KEY");
  if (!url || !key) return null;
  const payload = {
    form, email: row.email, name: row.first_name, company: row.company, ip_hash: row.ip_hash,
    consent: row.consent || {},
    fields: { ...(row.answers || {}), city: row.city, score: row.score, tier: row.tier, bottleneck: row.bottleneck, fit: row.fit, route: row.route, variant: row.variant, visit: row.visit, scorecard: row.id },
    meta: Object.fromEntries(Object.entries(row.tracking || {}).filter(([k, v]) => /^utm_|^page$|^referrer$/.test(k) && typeof v === "string"))
  };
  const headers = { apikey: key, ...(/^eyJ/.test(key) ? { authorization: `Bearer ${key}` } : {}) };
  try {
    const r = await call(`${url}/rest/v1/rpc/submit_lead`, { headers, body: { payload } });
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    return typeof r.data === "string" ? r.data : true;
  } catch (e) { console.error("leads mirror:", e && e.message); return false; }
}
