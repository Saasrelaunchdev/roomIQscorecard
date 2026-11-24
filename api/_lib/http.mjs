// Plain Node http helpers, so the same handlers run on Vercel and in the local dev and test servers (tools/dev.mjs).
// Files under api/_lib are helpers, not endpoints.

export const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");

export function send(res, status, data, extra = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export function sendText(res, status, body, type = "text/html; charset=utf-8", extra = {}) {
  res.statusCode = status;
  res.setHeader("content-type", type);
  res.setHeader("x-content-type-options", "nosniff");
  if (!res.getHeader("cache-control")) res.setHeader("cache-control", "no-store");
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.end(body);
}

/** The query string as URLSearchParams (Vercel parses req.query too; this works everywhere). */
export function query(req) {
  const i = String(req.url || "").indexOf("?");
  return new URLSearchParams(i >= 0 ? req.url.slice(i + 1) : "");
}

/** The request body as an object. Vercel parses JSON into req.body; a plain Node server leaves the stream. Accepts
 *  text/plain JSON too (navigator.sendBeacon). */
export async function readJson(req, limit = 32 * 1024) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
    const s = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    if (s.length > limit) throw Object.assign(new Error("too large"), { status: 413 });
    return JSON.parse(s || "{}");
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

export const host = (req) => String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
export const header = (req, n) => String(req.headers[n] || "").split(",")[0].trim();
/** A header whose value may hold commas (the user agent: "(KHTML, like Gecko)"), whole. */
export const userAgent = (req) => String(req.headers["user-agent"] || "").slice(0, 512);
export const clientIp = (req) => header(req, "x-forwarded-for") || header(req, "x-real-ip") || "";

/** A state-changing request must come from this site's own pages (a browser always sends Origin with a POST). */
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || origin === "null") return !origin;
  try { return new URL(origin).host === host(req); } catch { return false; }
}

/** This deployment's address: site.url when set, else the address the request came in on. */
export function baseUrl(req, site) {
  if (site && site.url) return String(site.url).replace(/\/+$/, "");
  const h = host(req);
  if (!h) return "";
  const proto = header(req, "x-forwarded-proto") || (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h) ? "http" : "https");
  return `${proto}://${h}`;
}

/** Which deployment is answering (never a secret). */
export function deployment() {
  const sha = env("VERCEL_GIT_COMMIT_SHA");
  return { env: env("VERCEL_ENV") || "local", branch: env("VERCEL_GIT_COMMIT_REF") || null, commit: sha ? sha.slice(0, 7) : null };
}

export const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const EMAIL = /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/;
export const TOKEN = /^[A-Za-z0-9_-]{24,64}$/;
export const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** A failed request, answered in words the person can act on, never with a stack or a secret. */
export function fail(res, e) {
  const status = (e && e.status) || 500;
  if (status >= 500) console.error(e && (e.stack || e.message));
  send(res, status, { error: status >= 500 ? (e && e.expose ? e.message : "Something went wrong on our side.") : e.message || "invalid request" });
}

export class HttpError extends Error {
  constructor(status, message, expose = true) { super(message); this.status = status; this.expose = expose; }
}
