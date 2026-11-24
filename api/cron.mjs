// /api/cron: once each weekday morning (vercel.json "crons"), the team hears how many reports are waiting and how old the
// oldest is, so "emailed within one business day" holds (in the instant delivery, the top-three update is what waits). Vercel calls it with Authorization: Bearer <CRON_SECRET> when
// CRON_SECRET is set; anyone else is refused.
import SITE from "../content/site.mjs";
import EMAILS from "../content/emails.mjs";
import { fill } from "../lib/scoring.mjs";
import { send, baseUrl } from "./_lib/http.mjs";
import { getStore } from "./_lib/store.mjs";
import { notifyTeam } from "./_lib/notify.mjs";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET ? String(process.env.CRON_SECRET).trim() : "";
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return send(res, 401, { error: "unauthorized" });
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();
  const { rows } = await getStore().list({ from: since, limit: 500 });
  const waiting = rows.filter((r) => !r.sent_at && !["closed", "spam", "sent"].includes(r.status)).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  if (!waiting.length) return send(res, 200, { ok: true, waiting: 0 });
  const hours = Math.round((Date.now() - Date.parse(waiting[0].created_at)) / 3600e3);
  const age = hours >= 48 ? `${Math.round(hours / 24)} days` : `${hours} hours`;
  const base = baseUrl(req, SITE);
  await notifyTeam({
    title: fill(SITE.reportDelivery === "instant" ? EMAILS.team.digestInstant : EMAILS.team.digest, { count: waiting.length, age }),
    rows: waiting.slice(0, 15).map((r) => [`${r.company}, ${r.city}`, `${r.score}/100, ${r.status}${r.booked_at ? ", call booked" : ""}, came in ${new Date(r.created_at).toISOString().slice(0, 10)}`]),
    links: base ? [["Open the admin", `${base}/admin`]] : []
  });
  return send(res, 200, { ok: true, waiting: waiting.length });
}
