// /api/track: the pages' own analytics (ScoreApp's Insights): page views, starts, each step answered and how long it
// took, the result seen, the call cards tapped, the deepener. First party, no cookies: a random visit id kept for the
// browser session, the landing variant, the step. Nothing personal: no answers, no contact details, no IP address.
// From the request itself each event also keeps what the privacy policy names: the country and state the IP address
// suggests (never the address, never a city here), phone, tablet or computer, and the app whose browser it is
// (Facebook, Instagram), so the admin can say where visits come from, on what, and where they stop.
//   POST { visit, variant, source, events: [{ name, step, ms }] }   (navigator.sendBeacon sends it as text/plain JSON)
import { send, readJson, sameOrigin, str, clientIp, userAgent } from "./_lib/http.mjs";
import { getStore } from "./_lib/store.mjs";
import { geoOf, deviceOf, sourceOf } from "./_lib/visitor.mjs";

// The report's views and PDF downloads are counted by the server when the report opens (api/report.mjs), not here
export const EVENTS = new Set(["view", "start", "step", "submit", "result", "cta", "book_open", "book", "deepener_view", "deepener_start", "deepener_step", "deepener_done"]);
const TIMED = new Set(["step", "deepener_step"]);
const MAX = 40;
// A light brake per network on this instance: analytics only, so a flood is dropped quietly, never an error
const seen = new Map();
function allowed(ip) {
  const minute = Math.floor(Date.now() / 60000);
  const k = `${ip}|${minute}`;
  const n = (seen.get(k) || 0) + 1;
  seen.set(k, n);
  if (seen.size > 5000) for (const key of [...seen.keys()]) if (!key.endsWith(`|${minute}`)) seen.delete(key);
  return n <= 120;
}

/** What the request says about where and on what, for every event it carries. */
export function contextOf(req, body) {
  const geo = geoOf(req) || {};
  const dev = deviceOf(userAgent(req));
  return { country: geo.country || "", region: geo.region || "", device: dev.type, inapp: dev.inApp || "", source: sourceOf(body && body.source) };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" }, { allow: "POST" });
  if (!sameOrigin(req)) return send(res, 403, { error: "forbidden" });
  let body;
  try { body = await readJson(req, 16 * 1024); } catch { return send(res, 400, { error: "invalid request" }); }
  const visit = str(body && body.visit, 64);
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(visit)) return send(res, 400, { error: "invalid visit" });
  const variant = /^[a-z0-9-]{0,40}$/.test(str(body.variant, 40)) ? str(body.variant, 40) : "";
  const ctx = contextOf(req, body);
  const events = (Array.isArray(body.events) ? body.events : []).slice(0, MAX)
    .filter((e) => e && EVENTS.has(e.name))
    .map((e) => {
      const ms = Number(e.ms);
      const data = TIMED.has(e.name) && Number.isFinite(ms) && ms >= 0 ? { ms: Math.min(Math.round(ms), 3600e3) } : {};
      return { visit, variant, name: e.name, step: /^[A-Za-z0-9_-]{0,24}$/.test(str(e.step, 24)) ? str(e.step, 24) : "", data, ...ctx };
    });
  if (!allowed(clientIp(req) || "local")) return send(res, 200, { ok: true, n: 0 });
  try {
    const n = await getStore().addEvents(events);
    return send(res, 200, { ok: true, n });
  } catch (e) {
    console.error("track:", e && e.message);
    return send(res, 200, { ok: false });
  }
}
