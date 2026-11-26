// /api/resend-webhook: Resend tells the scorecard what happened to each email it sent (setup: README.md, "Email"):
//   email.delivered, email.delivery_delayed, email.opened, email.clicked, email.bounced, email.complained
// Each event updates that email's line in the log (scorecard_emails), so the admin shows, per lead and in total,
// whether the score email and the report reached the owner, were opened, and which link was clicked. A spam complaint
// also unsubscribes the lead. The status only moves forward (opened never goes back to delivered).
//
// Resend signs every delivery the Svix way: svix-id, svix-timestamp and svix-signature headers, an HMAC-SHA256 of
// "id.timestamp.body" with the endpoint's signing secret (RESEND_WEBHOOK_SECRET, whsec_...). Anything unsigned, signed
// with another secret or older than five minutes is refused. Written as a Web handler (POST(request)) because the
// signature covers the exact bytes Resend sent, and only the raw body has them (the landing page's Stripe webhook
// does the same).
import { createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "./_lib/store.mjs";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
const TOLERANCE_S = 300;

/** Checks a Svix signature: { ok, reason }. headers: a Headers object (or anything with get()). */
export function verifySvix(raw, headers, secret, nowMs = Date.now()) {
  const id = headers.get("svix-id"), ts = headers.get("svix-timestamp"), sig = headers.get("svix-signature");
  if (!id || !ts || !sig) return { ok: false, reason: "the svix headers are missing" };
  const t = Number(ts);
  if (!Number.isFinite(t) || Math.abs(nowMs / 1000 - t) > TOLERANCE_S) return { ok: false, reason: "the timestamp is outside the five-minute window" };
  const secrets = String(secret).split(/[\s,]+/).filter(Boolean);
  for (const s of secrets) {
    const key = Buffer.from(s.replace(/^whsec_/, ""), "base64");
    if (!key.length) continue;
    const expected = createHmac("sha256", key).update(`${id}.${ts}.`).update(raw).digest();
    for (const part of sig.split(" ")) {
      const [version, value] = part.split(",");
      if (version !== "v1" || !value) continue;
      const got = Buffer.from(value, "base64");
      if (got.length === expected.length && timingSafeEqual(got, expected)) return { ok: true };
    }
  }
  return { ok: false, reason: "no signature matches the signing secret" };
}

/** What the log keeps from an event: the link clicked, the bounce's kind. Never the email's content. */
export function eventData(d) {
  const out = {};
  if (d && d.click && d.click.link) out.link = String(d.click.link).slice(0, 300);
  if (d && d.bounce) out.bounce = { type: String(d.bounce.type || "").slice(0, 40), subType: String(d.bounce.subType || "").slice(0, 40), message: String(d.bounce.message || "").slice(0, 300) };
  return out;
}

export async function POST(request) {
  const raw = Buffer.from(await request.arrayBuffer());
  const secret = env("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    console.error("resend-webhook: RESEND_WEBHOOK_SECRET is not set, so the event is refused; Resend will send it again");
    return json(503, { error: "not configured" });
  }
  const check = verifySvix(raw, request.headers, secret);
  if (!check.ok) return json(400, { error: `signature check failed: ${check.reason}` });
  let event;
  try { event = JSON.parse(raw.toString("utf8")); } catch { return json(400, { error: "invalid JSON" }); }
  const id = event && event.data && event.data.email_id;
  if (!id || !/^email\./.test(String(event.type || ""))) return json(200, { received: true, ignored: event && event.type });
  const at = /^\d{4}-\d{2}-\d{2}T/.test(String(event.created_at || "")) ? event.created_at : new Date().toISOString();
  try {
    const matched = await getStore().emailEvent(String(id), String(event.type), at, eventData(event.data));
    return json(200, { received: true, matched });
  } catch (e) {
    console.error("resend-webhook:", event.type, e && e.message);
    return json(500, { error: "not recorded yet; Resend will send it again" });
  }
}

// Whether the endpoint is set up, without a secret in sight
export async function GET() {
  return json(200, { ok: true, configured: Boolean(env("RESEND_WEBHOOK_SECRET")) });
}
