// Where the scorecards live. One interface, two drivers:
//   supabase  production: the tables and functions in sql/schema.sql, over Supabase's REST API with a secret key
//             (SUPABASE_URL + SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_ROLE_KEY). Only these server functions hold it,
//             never a page.
//   local     development and tests: JSON files in SCORECARD_STORE_DIR, with the same rules (token lookups, rate limits).
// Without either, the page still shows the score, and the API says what to set (GET /api/scorecard).
//
// A row is one scorecard: the contact, the answers, the results (on screen and for the report), the deepener, the call,
// time spent per question, approximate location, device, the public profile facts the team reads, the report's state,
// consent and attribution. Beside it: the analytics events, the email log and the admin's settings.
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, renameSync } from "node:fs";
import { join } from "node:path";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");
const pick = (...names) => { for (const n of names) if (env(n)) return env(n); return ""; };

export const COLUMNS = ["id", "token", "created_at", "updated_at", "form", "status", "email", "first_name", "last_name", "company", "city", "profiles",
  "trade", "visit", "variant", "answers", "result", "deepener", "deepened_at", "report_result", "booking", "booked_at", "public_data", "report",
  "sent_at", "consent", "tracking", "fit", "route", "score", "tier", "bottleneck", "ip_hash", "notes", "unsubscribed_at",
  "timing", "deepener_timing", "geo", "device", "report_views", "pdf_downloads", "report_viewed_at"];
export const STATUSES = ["new", "booked", "ready", "sent", "closed", "spam"];
export const EVENT_COLUMNS = ["visit", "variant", "name", "step", "data", "country", "region", "device", "inapp", "source", "assessment"];
export const EMAIL_STATUSES = ["sent", "failed", "delivered", "delayed", "opened", "clicked", "bounced", "complained"];
const EMAIL_RANK = { failed: 0, sent: 1, delayed: 2, delivered: 3, opened: 4, clicked: 5, bounced: 6, complained: 7 };
const EMAIL_TYPES = { "email.delivered": "delivered", "email.delivery_delayed": "delayed", "email.opened": "opened", "email.clicked": "clicked", "email.bounced": "bounced", "email.complained": "complained" };
// Rate limits, an hour at a time (the landing page's submit_lead rules): per email, per network, for the whole site
export const LIMITS = { email: 5, ip: 20, site: 500 };
const DIM_NAMES = ["view", "start", "complete", "booked", "deepener_saved"];

export class StoreError extends Error {
  constructor(message, status = 500, code = "store") { super(message); this.status = status; this.code = code; this.expose = true; }
}

export const newToken = () => randomBytes(24).toString("base64url");

/** Which driver this deployment uses, and why not when none. */
export function storeConfig() {
  const dir = env("SCORECARD_STORE_DIR");
  if (dir) return { mode: "local", dir, ok: true };
  const url = pick("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const key = pick("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  const problem = !url || !key ? "missing" : !/^https?:\/\/[^/\s]+$/.test(url) ? "bad-url" : !isSecretKey(key) ? "not-secret" : null;
  return { mode: problem ? "none" : "supabase", url, key, ok: !problem, problem };
}

/** A Supabase secret key: sb_secret_... or a legacy JWT whose role is service_role. */
export function isSecretKey(key) {
  if (/^sb_secret_/i.test(key)) return true;
  if (/^eyJ/.test(key)) {
    try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role === "service_role"; } catch { return false; }
  }
  return false;
}

export function notConnected(cfg) {
  if (cfg.problem === "bad-url") return "SUPABASE_URL is not a project URL like https://abcdefghijklmnop.supabase.co";
  if (cfg.problem === "not-secret") return "SUPABASE_SECRET_KEY holds a publishable key; the scorecard's server needs a secret key (sb_secret_...)";
  return "this deployment cannot see SUPABASE_URL and SUPABASE_SECRET_KEY: set them in Vercel, then redeploy (or SCORECARD_STORE_DIR for local development)";
}

export function getStore() {
  const cfg = storeConfig();
  if (cfg.mode === "local") return localStore(cfg.dir);
  if (cfg.mode === "supabase") return supabaseStore(cfg);
  return noStore(cfg);
}

/* ============================================================
   Shared arithmetic, so both drivers answer the same
   ============================================================ */
const inRange = (iso, from, to) => (!from || iso >= from) && (!to || iso < to);
const blank = () => Object.fromEntries(COLUMNS.map((c) => [c, null]));
const clean = (patch) => Object.fromEntries(Object.entries(patch).filter(([k, v]) => COLUMNS.includes(k) && !["id", "token", "created_at"].includes(k) && v !== undefined));
// An event as both drivers keep it: variant and step are "" when absent, data {} (the table's defaults), the rest left out
const cleanEvent = (e) => {
  const out = { visit: e.visit, variant: e.variant || "", name: e.name, step: e.step || "", data: e.data && typeof e.data === "object" ? e.data : {} };
  for (const k of EVENT_COLUMNS) if (!(k in out) && e[k] !== undefined && e[k] !== null && e[k] !== "") out[k] = e[k];
  return out;
};

/** Distinct visits per (variant, event name, step). */
export function countEvents(lines) {
  const sets = new Map();
  for (const e of lines) {
    const k = `${e.variant || ""}|${e.name}|${e.step || ""}`;
    if (!sets.has(k)) sets.set(k, new Set());
    sets.get(k).add(e.visit);
  }
  return [...sets.entries()].map(([k, s]) => { const [variant, name, step] = k.split("|"); return { variant, name, step, visits: s.size }; });
}

/** Distinct visits per (dimension, value, milestone): device, region ("US:TX"), source, in-app browser, day. */
export function dimEvents(lines) {
  const sets = new Map();
  const add = (dim, value, e) => { const k = `${dim}\u0000${value}\u0000${e.name}`; if (!sets.has(k)) sets.set(k, new Set()); sets.get(k).add(e.visit); };
  for (const e of lines) {
    if (!DIM_NAMES.includes(e.name)) continue;
    add("device", e.device || "", e);
    add("region", `${e.country || ""}:${e.region || ""}`, e);
    add("source", e.source || "", e);
    add("inapp", e.inapp || "", e);
    add("day", String(e.at || "").slice(0, 10), e);
  }
  return [...sets.entries()].map(([k, s]) => { const [dim, value, name] = k.split("\u0000"); return { dim, value, name, visits: s.size }; });
}

/** Seconds spent on each question: the median and the slowest quarter (milliseconds), from step events. */
export function stepTimesOf(lines) {
  const by = new Map();
  for (const e of lines) {
    if (e.name !== "step" && e.name !== "deepener_step") continue;
    const ms = Number(e.data && e.data.ms);
    if (!Number.isFinite(ms) || ms < 0) continue;
    if (!by.has(e.step)) by.set(e.step, []);
    by.get(e.step).push(ms);
  }
  const pct = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); const i = (s.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo)); };
  return [...by.entries()].map(([step, xs]) => ({ step, n: xs.length, median_ms: pct(xs, 0.5), p75_ms: pct(xs, 0.75) }));
}

/** An email's new state after a Resend event (the status only moves forward). */
export function applyEmailEvent(m, type, at, data) {
  const status = EMAIL_TYPES[type];
  if (!status) return null;
  const next = { ...m, events: (m.events || []).length < 100 ? [...(m.events || []), { type: status, at, data: data || {} }] : m.events };
  if ((EMAIL_RANK[status] || 0) > (EMAIL_RANK[m.status] || 0)) next.status = status;
  for (const [s, col] of [["delivered", "delivered_at"], ["opened", "opened_at"], ["clicked", "clicked_at"], ["bounced", "bounced_at"]]) if (status === s && !m[col]) next[col] = at;
  return next;
}

/* ============================================================
   The local driver: JSON documents and one line per event
   ============================================================ */
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

function localStore(dir) {
  mkdirSync(dir, { recursive: true });
  const file = (n) => join(dir, n);
  const load = (n, fallback) => { try { return JSON.parse(readFileSync(file(n), "utf8")); } catch { return fallback; } };
  const save = (n, v) => { const tmp = `${file(n)}.${process.pid}.tmp`; writeFileSync(tmp, JSON.stringify(v, null, 1)); renameSync(tmp, file(n)); };
  const lines = () => { try { return readFileSync(file("events.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
  const now = () => new Date().toISOString();
  const rows = () => load("assessments.json", []);
  return {
    mode: "local",
    async create(row) {
      return serial(() => {
        const all = rows();
        const hourAgo = Date.now() - 3600e3;
        const recent = all.filter((r) => Date.parse(r.created_at) > hourAgo);
        if ((row.email && recent.filter((r) => r.email === row.email).length >= LIMITS.email) ||
            (row.ip_hash && recent.filter((r) => r.ip_hash === row.ip_hash).length >= LIMITS.ip) || recent.length >= LIMITS.site) {
          throw new StoreError("Too many submissions. Please try again later", 429, "rate");
        }
        const t = now();
        const saved = { ...blank(), ...row, id: randomUUID(), token: row.token || newToken(), created_at: t, updated_at: t, status: row.status || "new", report_views: 0, pdf_downloads: 0 };
        all.push(saved);
        save("assessments.json", all);
        return saved;
      });
    },
    async byToken(token) { return rows().find((r) => r.token === token) || null; },
    async byId(id) { return rows().find((r) => r.id === id) || null; },
    async update(id, patch) {
      return serial(() => {
        const all = rows();
        const i = all.findIndex((r) => r.id === id);
        if (i < 0) throw new StoreError("not found", 404, "missing");
        all[i] = { ...all[i], ...clean(patch), updated_at: now() };
        save("assessments.json", all);
        return all[i];
      });
    },
    async list(opts = {}) {
      let all = rows().filter((r) => inRange(r.created_at, opts.from, opts.to));
      if (opts.status) all = all.filter((r) => r.status === opts.status);
      if (opts.q) { const q = opts.q.toLowerCase(); all = all.filter((r) => [r.company, r.email, r.first_name, r.city].some((v) => String(v || "").toLowerCase().includes(q))); }
      all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const offset = opts.offset || 0;
      return { rows: all.slice(offset, offset + (opts.limit || 100)), total: all.length };
    },
    async addEvents(list) {
      if (!list.length) return 0;
      appendFileSync(file("events.jsonl"), list.map((e) => JSON.stringify({ at: now(), ...cleanEvent(e) })).join("\n") + "\n");
      return list.length;
    },
    async eventCounts(opts = {}) { return countEvents(lines().filter((e) => inRange(e.at, opts.from, opts.to))); },
    async eventDims(opts = {}) { return dimEvents(lines().filter((e) => inRange(e.at, opts.from, opts.to))); },
    async stepTimes(opts = {}) { return stepTimesOf(lines().filter((e) => inRange(e.at, opts.from, opts.to))); },
    async eventsFor(assessment) { return lines().filter((e) => e.assessment === assessment); },
    async reportViewed(id, kind) {
      await serial(() => {
        const all = rows();
        const r = all.find((x) => x.id === id);
        if (!r) return;
        if (kind === "pdf") r.pdf_downloads = (r.pdf_downloads || 0) + 1; else r.report_views = (r.report_views || 0) + 1;
        r.report_viewed_at = now();
        save("assessments.json", all);
      });
      await this.addEvents([{ visit: `report-${id}`, name: kind === "pdf" ? "pdf_download" : "report_view", assessment: id }]);
    },
    async getSettings() { return load("settings.json", {}); },
    async saveSettings(key, value) {
      return serial(() => { const s = load("settings.json", {}); s[key] = value; save("settings.json", s); return s; });
    },
    async logEmail(entry) {
      return serial(() => {
        const all = load("emails.json", []);
        const row = { id: randomUUID(), created_at: now(), status: "sent", attachments: 0, events: [], delivered_at: null, opened_at: null, clicked_at: null, bounced_at: null, error: null, ...entry };
        all.push(row);
        save("emails.json", all);
        return row;
      });
    },
    async emailEvent(providerId, type, at, data) {
      return serial(() => {
        const all = load("emails.json", []);
        const i = all.findIndex((m) => m.provider_id && m.provider_id === providerId);
        if (i < 0) return false;
        const next = applyEmailEvent(all[i], type, at, data);
        if (!next) return false;
        all[i] = next;
        save("emails.json", all);
        // A spam complaint means no more email to that address: the lead counts as unsubscribed
        if (next.status === "complained" && next.assessment_id && !String(next.kind || "").startsWith("team")) {
          const rs = rows();
          const r = rs.find((x) => x.id === next.assessment_id);
          if (r && !r.unsubscribed_at) { r.unsubscribed_at = at; save("assessments.json", rs); }
        }
        return true;
      });
    },
    async emailsFor(assessmentId) { return load("emails.json", []).filter((m) => m.assessment_id === assessmentId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)); },
    async emailList(opts = {}) { return load("emails.json", []).filter((m) => inRange(m.created_at, opts.from, opts.to)); },
    async health() { return { ok: true, mode: "local", schema: "scorecard v2 (local files)" }; }
  };
}

/* ============================================================
   The Supabase driver: REST with the secret key (the tables have row level security on and no policies, so only this
   key reads or writes them); the insert goes through public.scorecard_submit() for its rate limits
   ============================================================ */
function supabaseStore(cfg) {
  const headers = (extra) => {
    const h = { apikey: cfg.key, accept: "application/json", ...extra };
    if (/^eyJ/.test(cfg.key)) h.authorization = `Bearer ${cfg.key}`;
    return h;
  };
  async function rest(path, { method = "GET", body, prefer, timeoutMs = 8000 } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(`${cfg.url}/rest/v1/${path}`, {
        method,
        headers: headers({ ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(prefer ? { prefer } : {}) }),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal
      });
      const text = await r.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { status: r.status, data, range: r.headers.get("content-range") };
    } catch (e) {
      throw new StoreError(e && e.name === "AbortError" ? "Supabase did not answer within 8 seconds" : `Supabase could not be reached (${(e && e.message) || "network error"})`, 503, "unreachable");
    } finally {
      clearTimeout(timer);
    }
  }
  const said = (r) => (r.data && typeof r.data === "object" ? [r.data.code, r.data.message].filter(Boolean).join(": ") : String(r.data || "")).slice(0, 200);
  const check = (r, what) => {
    if (r.status >= 200 && r.status < 300) return r;
    if (r.status === 429 || (r.data && r.data.code === "PT429")) throw new StoreError("Too many submissions. Please try again later", 429, "rate");
    const hint = r.status === 404 ? " (run sql/schema.sql in the project SUPABASE_URL names)" : r.status === 401 || r.status === 403 ? " (SUPABASE_SECRET_KEY was refused)" : "";
    throw new StoreError(`Supabase answered HTTP ${r.status} to ${what}${hint}${said(r) ? `: ${said(r)}` : ""}`, r.status === 400 ? 400 : 502, "refused");
  };
  const enc = encodeURIComponent;
  const one = (r) => (Array.isArray(r.data) ? r.data[0] || null : r.data || null);
  const range = (opts, col) => [opts.from ? `${col}=gte.${enc(opts.from)}` : null, opts.to ? `${col}=lt.${enc(opts.to)}` : null].filter(Boolean);
  const rpc = async (name, body) => check(await rest(`rpc/${name}`, { method: "POST", body }), `${name}()`).data;
  return {
    mode: "supabase",
    async create(row) { return rpc("scorecard_submit", { payload: { ...row, token: row.token || newToken() } }); },
    async byToken(token) { return one(check(await rest(`scorecard_assessments?token=eq.${enc(token)}&select=*&limit=1`), "a token lookup")); },
    async byId(id) {
      if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
      return one(check(await rest(`scorecard_assessments?id=eq.${enc(id)}&select=*&limit=1`), "a lookup"));
    },
    async update(id, patch) {
      const row = one(check(await rest(`scorecard_assessments?id=eq.${enc(id)}`, { method: "PATCH", body: { ...clean(patch), updated_at: new Date().toISOString() }, prefer: "return=representation" }), "an update"));
      if (!row) throw new StoreError("not found", 404, "missing");
      return row;
    },
    async list(opts = {}) {
      const q = ["select=*", "order=created_at.desc", `limit=${Math.min(opts.limit || 100, 1000)}`, `offset=${opts.offset || 0}`, ...range(opts, "created_at")];
      if (opts.status) q.push(`status=eq.${enc(opts.status)}`);
      if (opts.q) {
        const s = opts.q.replace(/[,()*%]/g, " ").trim();
        if (s) q.push(`or=(${["company", "email", "first_name", "city"].map((c) => `${c}.ilike.*${enc(s)}*`).join(",")})`);
      }
      const r = check(await rest(`scorecard_assessments?${q.join("&")}`, { prefer: "count=exact" }), "the list");
      const total = r.range && /\/(\d+)$/.test(r.range) ? Number(/\/(\d+)$/.exec(r.range)[1]) : (r.data || []).length;
      return { rows: r.data || [], total };
    },
    async addEvents(list) {
      if (!list.length) return 0;
      // PostgREST inserts a batch with one set of columns: every row carries them all
      const rows = list.map((e) => Object.fromEntries(EVENT_COLUMNS.map((k) => [k, e[k] === undefined || e[k] === "" ? (k === "data" ? {} : k === "variant" || k === "step" ? "" : null) : e[k]])));
      check(await rest("scorecard_events", { method: "POST", body: rows, prefer: "return=minimal" }), "the events");
      return list.length;
    },
    async eventCounts(opts = {}) { return (await rpc("scorecard_event_counts", { p_from: opts.from || null, p_to: opts.to || null })) || []; },
    async eventDims(opts = {}) { return (await rpc("scorecard_event_dims", { p_from: opts.from || null, p_to: opts.to || null })) || []; },
    async stepTimes(opts = {}) { return (await rpc("scorecard_step_times", { p_from: opts.from || null, p_to: opts.to || null })) || []; },
    async eventsFor(assessment) { return check(await rest(`scorecard_events?assessment=eq.${enc(assessment)}&select=at,name&order=at.desc&limit=200`), "a lead's events").data || []; },
    async reportViewed(id, kind) { await rpc("scorecard_report_viewed", { p_id: id, p_kind: kind === "pdf" ? "pdf" : "view" }); },
    async getSettings() {
      const r = check(await rest("scorecard_settings?select=key,value"), "the settings");
      return Object.fromEntries((r.data || []).map((x) => [x.key, x.value]));
    },
    async saveSettings(key, value) {
      check(await rest("scorecard_settings?on_conflict=key", { method: "POST", body: { key, value }, prefer: "resolution=merge-duplicates,return=minimal" }), "saving the settings");
      return this.getSettings();
    },
    async logEmail(entry) { return one(check(await rest("scorecard_emails", { method: "POST", body: entry, prefer: "return=representation" }), "the email log")); },
    async emailEvent(providerId, type, at, data) { return Boolean(await rpc("scorecard_email_event", { p_provider_id: providerId, p_type: type, p_at: at, p_data: data || {} })); },
    async emailsFor(assessmentId) { return check(await rest(`scorecard_emails?assessment_id=eq.${enc(assessmentId)}&select=*&order=created_at.desc&limit=50`), "a lead's emails").data || []; },
    async emailList(opts = {}) {
      const q = ["select=kind,status,created_at,delivered_at,opened_at,clicked_at,bounced_at,assessment_id", "limit=5000", ...range(opts, "created_at")];
      return check(await rest(`scorecard_emails?${q.join("&")}`), "the email log").data || [];
    },
    async health() {
      const r = await rest("rpc/scorecard_health", { method: "POST", body: {}, timeoutMs: 5000 });
      return r.status === 200 ? { ok: true, mode: "supabase", schema: r.data, upgrade: r.data === "scorecard v2" ? null : "Run sql/schema.sql again: it adds what this version needs." }
        : { ok: false, mode: "supabase", status: r.status, fix: r.status === 404 ? "Run sql/schema.sql in the project SUPABASE_URL names." : said(r) };
    }
  };
}

/* ============================================================
   No store: reads find nothing, writes say what to set
   ============================================================ */
function noStore(cfg) {
  const why = () => { throw new StoreError(`Storage is not set up: ${notConnected(cfg)}`, 503, "not-configured"); };
  const none = async () => [];
  return {
    mode: "none",
    create: why, update: why, saveSettings: why,
    async byToken() { return null; },
    async byId() { return null; },
    async list() { return { rows: [], total: 0 }; },
    async addEvents() { return 0; },
    eventCounts: none, eventDims: none, stepTimes: none, eventsFor: none, emailsFor: none, emailList: none,
    async reportViewed() {},
    async getSettings() { return {}; },
    async logEmail() { return null; },
    async emailEvent() { return false; },
    async health() { return { ok: false, mode: "none", problem: cfg.problem, fix: notConnected(cfg) }; }
  };
}

/** For tests: is a local store set up? */
export const localStoreExists = (dir) => existsSync(join(dir, "assessments.json"));
