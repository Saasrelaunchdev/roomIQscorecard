// A real server for the tests: tools/dev.mjs (vercel.json's rewrites, the API handlers) on a free port, with its own
// store, outbox and admin password in temporary folders. No network, no database, no email account needed.
import { mkdtempSync, readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const ADMIN_PASSWORD = "test-admin-password-123";

export async function testServer() {
  const store = mkdtempSync(path.join(tmpdir(), "sc-test-store-"));
  const outbox = mkdtempSync(path.join(tmpdir(), "sc-test-outbox-"));
  // The PDF is printed in the tests that check it (pdf(true)); elsewhere it is off, so the suite stays fast
  Object.assign(process.env, { SCORECARD_STORE_DIR: store, SCORECARD_OUTBOX_DIR: outbox, ADMIN_PASSWORD, ADMIN_LOGIN_DELAY_MS: "5", CRON_SECRET: "test-cron-secret",
    SCORECARD_PDF: "off", RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
  for (const k of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "RESEND_API_KEY", "SLACK_WEBHOOK_URL", "META_PIXEL_ID", "META_CAPI_TOKEN", "GHL_TOKEN", "SCORECARD_WEBHOOK_URLS", "LEADS_MIRROR", "LEAD_NOTIFY_TO"]) delete process.env[k];
  const { startServer } = await import("../../tools/dev.mjs");
  const { settled } = await import("../../api/_lib/background.mjs");
  const srv = await startServer({ port: 0, quiet: true });
  const url = srv.url;
  let cookie = "";
  const api = async (pathname, { method = "GET", body, headers = {}, raw = false, auth = false } = {}) => {
    const r = await fetch(url + pathname, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(method !== "GET" ? { origin: url } : {}), ...(auth && cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      redirect: "manual"
    });
    const setCookie = r.headers.get("set-cookie");
    if (setCookie && auth) cookie = setCookie.split(";")[0];
    if (raw) return r;
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, data, headers: r.headers };
  };
  const login = () => api("/api/admin?action=login", { method: "POST", body: { password: ADMIN_PASSWORD }, auth: true });
  // In the order they were written (a team notice's file name sorts differently from an email's)
  const emails = () => (existsSync(outbox) ? readdirSync(outbox).filter((f) => f.endsWith(".json")).map((f) => ({ f, t: statSync(path.join(outbox, f)).mtimeMs })).sort((a, b) => a.t - b.t || (a.f < b.f ? -1 : 1))
    .map(({ f }) => JSON.parse(readFileSync(path.join(outbox, f), "utf8"))) : []);
  const rows = () => { try { return JSON.parse(readFileSync(path.join(store, "assessments.json"), "utf8")); } catch { return []; } };
  const events = () => { try { return readFileSync(path.join(store, "events.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
  const emailLog = () => { try { return JSON.parse(readFileSync(path.join(store, "emails.json"), "utf8")); } catch { return []; } };
  const pdf = (on) => { process.env.SCORECARD_PDF = on ? "on" : "off"; };
  return { url, api, login, emails, rows, events, emailLog, settled, pdf, store, outbox, close: async () => { await settled(); await srv.close(); }, clearCookie: () => { cookie = ""; } };
}

/** Resend's webhook signing secret in the tests (a whsec_ secret is base64 after the prefix). */
export const WEBHOOK_SECRET = `whsec_${Buffer.from("test-webhook-signing-secret-32by").toString("base64")}`;

/** Svix headers for a body, signed with a secret, as Resend sends them. */
export async function svixHeaders(body, secret = WEBHOOK_SECRET, { id = `msg_${Math.random().toString(36).slice(2, 12)}`, at = Math.floor(Date.now() / 1000) } = {}) {
  const { createHmac } = await import("node:crypto");
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const sig = createHmac("sha256", key).update(`${id}.${at}.${body}`).digest("base64");
  return { "svix-id": id, "svix-timestamp": String(at), "svix-signature": `v1,${sig}`, "content-type": "application/json" };
}

/** A complete submission: the worked example (spec 1, section 11). The quiz asks for no business or city. */
export function submission(extra = {}) {
  return {
    action: "submit",
    answers: { stage: "looking", market: "atlanta", marketText: "Atlanta", rentsource: "listings", fillsource: "vacancy", supply: "counted", bathmix: "notyet", slowplan: "weeks", carry: "2to3k", fillmonths: "m3", reserves: "m1" },
    firstName: "Sam", email: `sam+${Math.random().toString(36).slice(2, 8)}@example.com`, consentEmail: true,
    visit: `visit-${Math.random().toString(36).slice(2, 10)}`, variant: "scoreapp", page: "https://scorecard.test/?utm_source=facebook", utm_source: "facebook", utm_campaign: "fall",
    ...extra
  };
}

/** The next weekday from tomorrow, as "YYYY-MM-DD" (local time, like the page). */
export function nextWeekday(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
