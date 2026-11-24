// What each audience sees of a stored scorecard. The visitor's result page gets the score and its words, never the
// answers, the contact details or the team's notes: a results link can be forwarded.
import SC from "../../content/scorecard.mjs";
import SITE from "../../content/site.mjs";
import { deepenerShown } from "../../lib/scoring.mjs";
import { dayLabel, windowOf } from "../../lib/booking.mjs";

/** The result as the results page draws it (lib/scoring.mjs evaluate(), trimmed). */
export function publicResult(r) {
  if (!r) return null;
  return {
    score: r.score, tier: r.tier, tierName: r.tierName, tierDescriptor: r.tierDescriptor,
    areas: Object.fromEntries(Object.entries(r.areas).map(([k, a]) => [k, { score: a.score, band: a.band }])),
    invisible: r.invisible,
    bottleneck: { primary: r.bottleneck.primary, maintenance: r.bottleneck.maintenance, lineKey: r.bottleneck.lineKey, line: r.bottleneck.line, cascade: r.bottleneck.cascade },
    strongest: r.strongest,
    callOnly: r.callOnly, service: r.service, trade: r.trade, qualified: r.qualified
  };
}

/** The booked call in words: { day, window, hours, label }. */
export function bookingView(b) {
  if (!b || !b.day) return null;
  const w = windowOf(SITE.booking, b.window);
  return { day: dayLabel(b.day), window: w ? w.label.toLowerCase() : b.window, hours: w ? w.hint : "", v: b.day, w: b.window };
}

/** GET /api/scorecard?token=: what the results and sharpen pages need. */
export function visitorView(row) {
  const shown = deepenerShown(SC, row.answers || {}).map((d) => d.key);
  return {
    ok: true,
    token: row.token,
    firstName: row.first_name || "",
    business: row.company || "",
    city: row.city || "",
    result: publicResult(row.result),
    deepener: { shown, answered: row.deepener ? Object.keys(row.deepener).length : 0, done: Boolean(row.deepened_at) },
    booked: bookingView(row.booking),
    reportSent: row.status === "sent",
    reportReady: SITE.reportDelivery === "instant" || row.status === "sent",
    delivery: SITE.reportDelivery,
    unsubscribed: Boolean(row.unsubscribed_at)
  };
}

/** The admin list's columns. */
export function listView(row) {
  const r = row.report_result || row.result || {};
  const iw = r.invisible || {};
  const g = row.geo || {}, d = row.device || {}, t = row.tracking || {};
  return {
    id: row.id, created_at: row.created_at, status: row.status, first_name: row.first_name, email: row.email, company: row.company, city: row.city,
    trade: row.trade, score: row.score, tier: row.tier, report_score: r.score, bottleneck: row.bottleneck, fit: row.fit, route: row.route,
    variant: row.variant, deepened: Boolean(row.deepened_at), booked: bookingView(row.booking), sent_at: row.sent_at,
    place: [g.city, g.region].filter(Boolean).join(", ") || g.country || "", country: g.country || "", device: d.type || "", in_app: d.inApp || "",
    source: t.source || t.utm_source || "", campaign: t.utm_campaign || "", seconds: row.timing && typeof row.timing.totalMs === "number" ? Math.round(row.timing.totalMs / 1000) : null,
    value: typeof iw.workValue === "number" ? iw.workValue : null, unasked: typeof iw.unasked === "number" ? iw.unasked : null,
    report_views: Number(row.report_views) || 0, pdf_downloads: Number(row.pdf_downloads) || 0,
    report_emailed: Boolean(row.report && row.report.instant_at), pdf_ok: row.report ? row.report.pdf_ok !== false : true,
    has_public: Boolean(row.public_data && row.public_data.business && row.public_data.business.count !== undefined && row.public_data.business.count !== null && row.public_data.business.count !== ""),
    unsubscribed: Boolean(row.unsubscribed_at)
  };
}

/** Links for a scorecard, from this deployment's address. */
export function linksFor(base, row) {
  return {
    results: `${base}/results/${row.token}`,
    sharpen: `${base}/sharpen/${row.token}`,
    report: `${base}/report/${row.token}`,
    pdf: `${base}/report/${row.token}/pdf`,
    unsubscribe: `${base}/unsubscribe/${row.token}`,
    admin: `${base}/admin#lead=${row.id}`
  };
}
