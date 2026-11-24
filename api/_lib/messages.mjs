// The words and data a scorecard sends out: the email's fields, the team's notice rows, GoHighLevel's values, the
// webhooks' payload, one email to the prospect (never to an address that unsubscribed) and the team's notice, each
// written to the email log. Shared by /api/scorecard and /api/admin.
import SC from "../../content/scorecard.mjs";
import SITE from "../../content/site.mjs";
import RESULTS from "../../content/results.mjs";
import EMAILS from "../../content/emails.mjs";
import { deepenerShown, fill, money, num, areaName, optionOf } from "../../lib/scoring.mjs";
import { dayLabel, windowOf, phoneLabel } from "../../lib/booking.mjs";
import { emailConfig, compose, sendEmail } from "./emails.mjs";
import { notifyTeam } from "./notify.mjs";
import { getStore } from "./store.mjs";

/** The invisible work line for the score email: the result page's panel, in one variant. */
export function invisibleLine(ev) {
  const iw = ev.invisible;
  const vars = { unasked: iw.unasked !== null ? num(iw.unasked) : null, work_value: iw.workValue !== null ? money(iw.workValue) : null };
  return fill(RESULTS.invisible[iw.kind], vars);
}

export function emailVars(row, ev, links) {
  const shown = deepenerShown(SC, row.answers || {}).length;
  const firstWin = (ev.quickWins || [])[0];
  return {
    firstName: row.first_name, business: row.company, city: row.city, service: ev.service,
    score: ev.score, tier: ev.tierName,
    invisible_line: invisibleLine(ev),
    bottleneck: ev.bottleneck.maintenance ? "nothing urgent" : areaName(SC, ev.bottleneck.primary),
    bottleneck_line: ev.bottleneck.line,
    quick_win: firstWin && !firstWin.check ? firstWin.text : null,
    n: shown,
    deepener_link: links && !row.deepened_at && shown ? links.sharpen : null,
    results_link: links ? links.results : null,
    unsubscribe_link: links ? links.unsubscribe : null,
    privacy_link: SITE.legal.privacy
  };
}

/** Writes one email to the log (scorecard_emails), never failing the send it describes. */
async function logged(entry) {
  try { await getStore().logEmail(entry); } catch (e) { console.error("email log:", e && e.message); }
}

/** One email to the prospect, unless they unsubscribed or email is not set up. Resolves true, false or null.
 *  opts: { buttonUrl, buttonLabel, attachments: [{ filename, content }], kind: "score" | "report" | ... } */
export async function prospectEmail(row, tpl, vars, idempotencyKey, links, opts = {}) {
  const cfg = emailConfig();
  if (!cfg || row.unsubscribed_at || !row.email) return null;
  const msg = compose(tpl, vars, opts);
  const attachments = opts.attachments || [];
  const kind = opts.kind || "email";
  const entry = { assessment_id: row.id && /^[0-9a-f-]{36}$/i.test(row.id) ? row.id : null, kind, to_email: row.email, subject: msg.subject.slice(0, 300), attachments: attachments.length };
  try {
    const id = await sendEmail(cfg, row.email, msg, { idempotencyKey, unsubscribeUrl: links && links.unsubscribe, attachments, tags: { kind, assessment: entry.assessment_id } });
    await logged({ ...entry, provider_id: id && id !== "sent" ? id : null, status: "sent" });
    return true;
  } catch (e) {
    console.error("prospect email:", e && e.message);
    await logged({ ...entry, status: "failed", error: String(e && e.message || e).slice(0, 500) });
    return false;
  }
}

/** The team's notice about one lead, logged like the prospect's emails. Resolves notifyTeam()'s answer. */
export async function teamNotice(row, { title, rows, links, attachments = [], kind = "team", settings }) {
  const teamTo = settings && settings.notifications ? settings.notifications.teamTo : "";
  const assessment = row && row.id && /^[0-9a-f-]{36}$/i.test(row.id) ? row.id : null;
  const out = await notifyTeam({ title, rows, links, attachments, teamTo, tags: { kind, assessment } });
  if (out.email || out.error) {
    await logged({ assessment_id: assessment, kind, to_email: (out.to || []).join(", ").slice(0, 300), subject: title.slice(0, 300), provider_id: out.id && out.id !== "sent" ? out.id : null,
      status: out.email ? "sent" : "failed", error: out.error ? out.error.slice(0, 500) : null, attachments: out.email ? attachments.length : 0 });
  }
  return out;
}

export function teamRows(row, ev) {
  const iw = ev.invisible || {};
  const t = row.tracking || {};
  return [
    ["Name", [row.first_name, row.last_name].filter(Boolean).join(" ")],
    ["Email", row.email],
    ["Business", `${row.company}, ${row.city}`],
    [((SC.segments || []).find((s) => s.field === (SC.segmentKey || "trade")) || { label: "Segment" }).label, (optionOf(SC, SC.segmentKey || "trade", row.trade) || {}).label],
    [SC.scoreName || "Score", `${ev.score}/100, ${ev.tierName}${ev.deepened ? " (with the deepener)" : ""}`],
    ["Areas", SC.areas.map((a) => `${a.name} ${ev.areas[a.key].score}`).join(", ")],
    ["Fix first", ev.bottleneck.maintenance ? "Maintenance (every area 75 or higher)" : areaName(SC, ev.bottleneck.primary)],
    [(SC.metric && SC.metric.name) || "Cost of inaction", iw.unasked !== null && iw.unasked !== undefined ? `${num(iw.unasked)} ${(SC.metric && SC.metric.count) || "a year"}${iw.workValue !== null ? `, ${money(iw.workValue)}` : ""}` : iw.kind],
    ["Verdict", ev.verdict],
    ["Fit", ev.fit],
    ["Route", row.route],
    ["Google profiles", row.profiles],
    ["Call notes", ((ev.notes && ev.notes.call) || []).map((n) => n.text).join(" ")],
    ["Booked", row.booking ? `${dayLabel(row.booking.day)}, ${(windowOf(SITE.booking, row.booking.window) || {}).label || row.booking.window}, ${phoneLabel(row.booking.phone)}` : ""],
    ["Variant", row.variant],
    ["Source", [t.source, ...["utm_medium", "utm_campaign", "utm_content"].map((k) => t[k])].filter(Boolean).join(" / ")],
    ["Location", placeOf(row.geo)],
    ["Device", deviceLabel(row.device)],
    ["Time to finish", row.timing && Number.isFinite(row.timing.totalMs) ? duration(row.timing.totalMs) : ""]
  ];
}

/** "Austin, TX, US" from the approximate location the IP address suggests. */
export function placeOf(geo) {
  if (!geo) return "";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
}
/** "Phone, iOS, in Instagram's browser" */
export function deviceLabel(d) {
  if (!d || !d.type) return "";
  const type = { mobile: "Phone", tablet: "Tablet", desktop: "Computer" }[d.type] || d.type;
  const app = d.inApp ? `, in ${d.inApp.replace(/^\w/, (c) => c.toUpperCase()).replace("Google-app", "the Google app")}'s browser` : "";
  return `${type}, ${d.os}${d.inApp ? "" : `, ${d.browser}`}${app}`;
}
/** "48 s", "1 min 12 s", "1 h 5 min" */
export function duration(ms) {
  const s = Math.round(Number(ms) / 1000);
  if (!Number.isFinite(s) || s < 0) return "";
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}

export function ghlValues(row, ev, links) {
  const iw = ev.invisible || {};
  return {
    score: ev.score, tier: ev.tierName, bottleneck: ev.bottleneck.maintenance ? "Maintenance" : areaName(SC, ev.bottleneck.primary),
    results_url: links && links.results, report_url: links && links.report, deepener_url: links && links.sharpen,
    unasked: iw.unasked, work_value: iw.workValue !== null && iw.workValue !== undefined ? money(iw.workValue) : null
  };
}

export function webhookData(row, ev, links) {
  return {
    id: row.id, created_at: row.created_at, status: row.status,
    contact: { first_name: row.first_name, last_name: row.last_name || null, email: row.email },
    business: { name: row.company, city: row.city, trade: row.trade, profiles: row.profiles },
    answers: row.answers, deepener: row.deepener || null,
    result: {
      score: ev.score, tier: ev.tier, tier_name: ev.tierName, deepened: Boolean(ev.deepened),
      areas: Object.fromEntries(SC.areas.map((a) => [a.key, ev.areas[a.key].score])),
      bottleneck: ev.bottleneck.primary, maintenance: ev.bottleneck.maintenance, urgency: ev.urgency,
      invisible: ev.invisible, quick_wins: (ev.quickWins || []).map((q) => q.text), verdict: ev.verdict,
      fit: ev.fit, call_only: ev.callOnly, gtm_gap_score: ev.gtmGapScore
    },
    tracking: { variant: row.variant, visit: row.visit, ...Object.fromEntries(Object.entries(row.tracking || {}).filter(([k]) => /^utm_|^page$/.test(k))) },
    links
  };
}

/** The score email. files: the PDF report to attach (instant delivery; [] when it could not be printed), or null for
 *  the checked delivery's score email, which says the report follows. */
export async function scoreEmail(row, ev, vars, links, files, key = `score-${row.id}`) {
  const instant = Array.isArray(files);
  const T = instant ? EMAILS.scoreReport : EMAILS.score;
  const tpl = { ...T, lines: T.lines.map((l) => (l.includes("{deepener_link}") && vars.n !== 8 ? T.deepenerN : l)) };
  if (ev.bottleneck.maintenance) tpl.lines = tpl.lines.map((l) => (l.startsWith("Fix first") ? "{bottleneck_line}" : l));
  const v = instant ? { ...vars, report_link: links.report, report_line: fill(files.length ? T.reportAttached : T.reportLinked, { report_link: links.report }) } : vars;
  return prospectEmail(row, tpl, v, key, links, instant
    ? { buttonUrl: links.report, buttonLabel: T.button, attachments: files, kind: "score" }
    : { buttonUrl: links.results, buttonLabel: T.button, kind: "score" });
}
