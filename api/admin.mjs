// /api/admin?action=...: the team's panel (/admin). Every action but session and login needs the admin's session cookie
// (ADMIN_PASSWORD), and every POST must come from this site's own pages.
//
//   GET  session                 signed in or not, and what this deployment is set up for
//   POST login { password }      POST logout
//   GET  list ?status=&q=&from=&to=&limit=&offset=      the scorecards, newest first
//   GET  lead ?id=               one scorecard: answers, results, call notes, the report's model, links
//   POST save { id, public_data?, checker?, notes?, status?, last_name? }   the public profile facts and the review state
//   POST send { id, checker? }   approve the report: snapshot it, print the PDF, email it to the owner (attached)
//   POST reopen { id }           take a sent report back to edit it (the owner's link shows "on its way" until re-sent)
//   POST resend { id, which: "score" | "call" | "report" }
//   POST options { id, note, sections }   this lead's own report: a personal note, and which sections it carries
//   GET  insights ?from=&to=     the funnel with each question's time, the split test, where, on what, when, sources,
//                                answers, scores, the money on the table, email engagement, and the leads to call
//   GET  export ?from=&to=       the scorecards as CSV
//   GET  settings                POST settings { key: "report" | "notifications", value }   the Settings tab
//   POST test-email { to }       the sample report, emailed with its PDF, to check the sending domain end to end
//   GET  sample                  the sample report as a page, with the settings in force
import SC from "../content/scorecard.mjs";
import SITE from "../content/site.mjs";
import BRAND from "../content/brand.mjs";
import EMAILS from "../content/emails.mjs";
import { evaluate, fill, deepenerShown } from "../lib/scoring.mjs";
import { buildReport, monthLabels, CHECKS, isoDay } from "../lib/report-model.mjs";
import { reportHtml } from "../lib/report-html.mjs";
import { funnelOf, profileOf, dimsOf, emailStatsOf, toCsv } from "../lib/insights.mjs";
import { ROW as SAMPLE } from "../lib/sample.mjs";
import { send, sendText, readJson, query, sameOrigin, baseUrl, str, fail, HttpError, EMAIL } from "./_lib/http.mjs";
import { isAdmin, login, logout, passwordConfigured, passwordStrong } from "./_lib/auth.mjs";
import { getStore, storeConfig, notConnected, STATUSES } from "./_lib/store.mjs";
import { emailConfig, sendEmail, compose } from "./_lib/emails.mjs";
import { notifyConfig } from "./_lib/notify.mjs";
import { capiConfig, ghlConfig, webhookConfig, toGhl, toWebhooks } from "./_lib/integrations.mjs";
import { pdfAvailable } from "./_lib/pdf.mjs";
import { phoneLabel } from "../lib/booking.mjs";
import { listView, linksFor, bookingView } from "./_lib/views.mjs";
import { emailVars, prospectEmail, teamNotice, webhookData, teamRows, placeOf, deviceLabel, duration, scoreEmail } from "./_lib/messages.mjs";
import { loadSettings, cleanSettings, cleanOptions, sectionsFor, settingsOf, SECTIONS } from "./_lib/settings.mjs";
import { makeReport, modelFor, pdfName } from "./_lib/reports.mjs";

export default async function handler(req, res) {
  const action = query(req).get("action") || "";
  try {
    if (action === "session") return send(res, 200, { authenticated: isAdmin(req), setup: await setup() });
    if (req.method === "POST" && !sameOrigin(req)) return send(res, 403, { error: "forbidden" });
    if (action === "login") {
      if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
      if (!passwordConfigured()) return send(res, 503, { error: "ADMIN_PASSWORD is not set on this deployment. Set it in Vercel (Settings > Environment Variables), then redeploy." });
      const body = await readJson(req, 4096);
      return (await login(req, res, String(body.password || ""))) ? send(res, 200, { ok: true }) : send(res, 401, { error: "That password is not right." });
    }
    if (action === "logout") { logout(req, res); return send(res, 200, { ok: true }); }
    if (!isAdmin(req)) return send(res, 401, { error: "Sign in first." });
    const q = query(req);
    switch (action) {
      case "list": return send(res, 200, await list(q));
      case "lead": return send(res, 200, await lead(req, q.get("id")));
      case "save": return send(res, 200, await save(req, await readJson(req, 64 * 1024)));
      case "send": return send(res, 200, await approve(req, await readJson(req)));
      case "reopen": return send(res, 200, await reopen(await readJson(req)));
      case "resend": return send(res, 200, await resend(req, await readJson(req)));
      case "options": return send(res, 200, await options(await readJson(req, 16 * 1024)));
      case "settings": return send(res, 200, req.method === "POST" ? await saveSettings(await readJson(req, 16 * 1024)) : await settingsView());
      case "test-email": return send(res, 200, await testEmail(req, await readJson(req, 4096)));
      case "sample": return sendText(res, 200, await sampleReport(req), undefined, { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" });
      case "insights": return send(res, 200, await insights(q));
      case "export": return sendText(res, 200, toCsv((await getStore().list({ ...range(q), limit: 1000 })).rows), "text/csv; charset=utf-8", { "content-disposition": `attachment; filename="scorecards-${isoDay(new Date())}.csv"` });
      default: return send(res, 404, { error: "unknown action" });
    }
  } catch (e) {
    return fail(res, e);
  }
}

const range = (q) => {
  const d = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? s : null);
  const from = d(q.get("from")), to = d(q.get("to"));
  return { from: from ? `${from}T00:00:00.000Z` : null, to: to ? new Date(Date.parse(`${to}T00:00:00.000Z`) + 86400e3).toISOString() : null };
};

async function list(q) {
  const status = STATUSES.includes(q.get("status")) ? q.get("status") : null;
  const { rows, total } = await getStore().list({ ...range(q), status, q: str(q.get("q") || "", 80), limit: Math.min(Number(q.get("limit")) || 100, 500), offset: Number(q.get("offset")) || 0 });
  return { rows: rows.map(listView), total };
}

async function byId(id) {
  const row = await getStore().byId(String(id || ""));
  if (!row) throw new HttpError(404, "That scorecard was not found.");
  return row;
}

async function lead(req, id) {
  const row = await byId(id);
  const store = getStore();
  const links = linksFor(baseUrl(req, SITE), row);
  const [settings, emails, events] = await Promise.all([loadSettings(store), store.emailsFor(row.id).catch(() => []), store.eventsFor(row.id).catch(() => [])]);
  const model = modelFor(row, { links, settings });
  const own = (row.report && row.report.options) || { note: "", sections: {} };
  return {
    row: { ...row, ip_hash: undefined, report: row.report ? { ...row.report, snapshot: undefined } : null },
    links,
    booking: bookingView(row.booking),
    visitor: {
      place: placeOf(row.geo), tz: (row.tracking && row.tracking.tz) || (row.geo && row.geo.tz) || "", device: deviceLabel(row.device),
      screen: row.device && row.device.viewport ? `${row.device.viewport} window${row.device.screen ? `, ${row.device.screen} screen` : ""}` : "",
      lang: (row.device && row.device.lang) || "", source: (row.tracking && row.tracking.source) || "",
      total: row.timing && typeof row.timing.totalMs === "number" ? duration(row.timing.totalMs) : "",
      landing: row.timing && typeof row.timing.landingMs === "number" ? duration(row.timing.landingMs) : "",
      backs: row.timing ? row.timing.backs || 0 : null, aways: row.timing ? row.timing.aways || 0 : null,
      deepenerTotal: row.deepener_timing && typeof row.deepener_timing.totalMs === "number" ? duration(row.deepener_timing.totalMs) : ""
    },
    emails: emails.map((m) => ({ kind: m.kind, to: m.to_email, subject: m.subject, status: m.status, created_at: m.created_at, delivered_at: m.delivered_at, opened_at: m.opened_at, clicked_at: m.clicked_at, bounced_at: m.bounced_at, error: m.error, attachments: m.attachments,
      clicks: (m.events || []).filter((e) => e.type === "clicked" && e.data && e.data.link).map((e) => e.data.link).slice(0, 5) })),
    activity: events.map((e) => ({ at: e.at, name: e.name })).slice(0, 50),
    reportState: { delivery: SITE.reportDelivery, emailedAt: (row.report && row.report.instant_at) || null, pdfOk: row.report ? row.report.pdf_ok !== false : null, sentAt: row.sent_at,
      views: Number(row.report_views) || 0, downloads: Number(row.pdf_downloads) || 0, lastViewed: row.report_viewed_at || null },
    options: { note: own.note || "", sections: own.sections || {}, effective: sectionsFor(settings, own), defaults: settings.report.sections },
    report: {
      result: model.result, compare: model.compare, compareSuggested: model.compareSuggested, top3Available: model.top3.available,
      strongest: model.strongest.area, weakest: model.weakest.area, refinement: model.weakest.refinement,
      quickWins: model.result.quickWins, verdict: model.result.verdict, callNotes: model.result.notes.call.map((n) => n.text), reportNotes: model.result.notes.report
    },
    form: { months: monthLabels((row.public_data && row.public_data.search && row.public_data.search.date) || isoDay(new Date())).map((m) => `${m.short} ${m.year}`), checks: CHECKS, defaultService: model.fields.service, defaultCity: row.city },
    labels: labelsFor(row)
  };
}

/** The answers in words, for the lead view, each with the seconds it took (the first includes reading the page). */
function labelsFor(row) {
  const out = [];
  const all = { ...(row.answers || {}), ...(row.deepener || {}) };
  const t = (row.timing && row.timing.steps) || {}, dt = (row.deepener_timing && row.deepener_timing.steps) || {};
  const sec = (ms) => (typeof ms === "number" ? Math.round(ms / 100) / 10 : null);
  for (const s of SC.steps) {
    if (s.type === "choice") out.push({ id: s.id, q: s.q, a: (s.options.find((o) => o.v === all[s.key]) || {}).label || "", seconds: sec(t[s.id]) });
    if (s.choice) out.push({ id: "S9", q: s.choice.label, a: (s.choice.options.find((o) => o.v === all[s.choice.key]) || {}).label || "", seconds: sec(t[s.id]) });
    if (s.type === "fields" && !s.choice) out.push({ id: s.id, q: s.q || "Contact details", a: "", seconds: sec(t[s.id]), fields: true });
  }
  for (const d of SC.deepener) out.push({ id: d.id, q: d.q, a: all[d.key] ? (d.options.find((o) => o.v === all[d.key]) || {}).label : "", deep: true, seconds: sec(dt[d.id]) });
  return out;
}

/* ---------- The public profile facts: numbers kept as numbers, everything else dropped ---------- */
const num = (v, max = 1e7) => { if (v === "" || v === null || v === undefined) return null; const x = Number(v); return Number.isFinite(x) && x >= 0 && x <= max ? x : null; };
const checksOf = (c) => Object.fromEntries(CHECKS.map((k) => [k, Boolean(c && c[k])]));
function cleanProfile(p, withName) {
  p = p && typeof p === "object" ? p : {};
  return {
    ...(withName ? { name: str(p.name, 120) } : {}),
    rating: num(p.rating, 5), count: num(p.count), reviews90: num(p.reviews90, 1e5), newestDays: num(p.newestDays, 1e4),
    replied: num(p.replied, 1000), sampled: num(p.sampled, 1000), checks: checksOf(p.checks)
  };
}
export function cleanPublicData(pd) {
  pd = pd && typeof pd === "object" ? pd : {};
  const s = pd.search || {};
  const business = cleanProfile(pd.business, false);
  const months = Array.isArray(pd.business && pd.business.months) ? pd.business.months.slice(0, 12).map((v) => num(v, 1e5)) : [];
  if (months.length === 12 && months.every((v) => v !== null)) business.months = months;
  return {
    search: { service: str(s.service, 60), city: str(s.city, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(String(s.date || "")) ? s.date : "" },
    business,
    top3: (Array.isArray(pd.top3) ? pd.top3 : []).slice(0, 3).map((c) => cleanProfile(c, true)),
    themes: (Array.isArray(pd.themes) ? pd.themes : []).slice(0, 3).map((t) => ({ theme: str(t && t.theme, 80), count: num(t && t.count, 30) })).filter((t) => t.theme && t.count),
    compare: ["ahead", "even", "behind", "far"].includes(pd.compare) ? pd.compare : "",
    monthsRead: ["auto", "dip", "steady", "none"].includes(pd.monthsRead) ? pd.monthsRead : "auto"
  };
}

async function save(req, body) {
  const row = await byId(body.id);
  const patch = {};
  if (body.public_data !== undefined) patch.public_data = cleanPublicData(body.public_data);
  if (body.checker !== undefined) patch.report = { ...(row.report || {}), checker: str(body.checker, 40) };
  if (body.notes !== undefined) patch.notes = str(body.notes, 4000);
  if (body.last_name !== undefined) patch.last_name = str(body.last_name, 60);
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status) || body.status === "sent") throw new HttpError(400, "Pick a status (sending happens with Approve and send).");
    patch.status = body.status;
  }
  // The report's scores follow the GTM's top-three reading too (the gap score), so recompute them with the new facts
  const next = { ...row, ...patch };
  const model = buildReport(next, {});
  patch.report_result = (({ ok, missing, deepenerMissing, ...rest }) => rest)(evaluate(SC, next.answers, next.deepener, { compare: model.compare }));
  const saved = await getStore().update(row.id, patch);
  return { ok: true, row: listView(saved) };
}

/** The report email's words: the first checked report, or (instant delivery) the update to the report the owner has. */
function reportEmail(row, ev, links, checker, attached) {
  const update = SITE.reportDelivery === "instant" && Boolean(row.report && row.report.instant_at);
  const T = update ? EMAILS.reportUpdate : EMAILS.report;
  const vars = { ...emailVars(row, ev, links), checker, report_link: links.report, pdf_link: links.pdf };
  const b = bookingView(row.booking);
  vars.call_line = b ? fill(EMAILS.report.callBooked, b) : fill(EMAILS.report.callOpen, vars);
  vars.pdf_attached = attached ? EMAILS.report.attached : null;
  if (update) vars.report_line = fill(attached ? T.reportAttached : T.reportLinked, vars);
  return { tpl: T, vars, kind: update ? "report-update" : "report" };
}

async function approve(req, body) {
  let row = await byId(body.id);
  const store = getStore();
  const checker = str(body.checker !== undefined ? body.checker : (row.report && row.report.checker) || SITE.defaultChecker || "", 40);
  if (!checker) throw new HttpError(400, "Add who checked the report (their first name prints on the cover).");
  const links = linksFor(baseUrl(req, SITE), row);
  const settings = await loadSettings(store);
  if (!modelFor(row, { links, settings, checker }).top3.available && !body.withoutProfile) throw new HttpError(400, "The public profile is empty, so the Top Three page would be missing. Fill it in, or send anyway.");
  // The PDF must print before the owner is told it is ready; it goes with the email
  const made = await makeReport(row, { links, settings, checker });
  const model = made.model;
  if (pdfAvailable() && !made.pdf) throw new HttpError(503, `The PDF did not print (${made.error}). Nothing was sent; try again.`);
  const now = new Date().toISOString();
  row = await store.update(row.id, { status: "sent", sent_at: now, report: { ...(row.report || {}), checker, snapshot: model, approved_at: now, sent_at: now } });
  const ev = row.report_result || row.result;
  const files = made.pdf ? [{ filename: pdfName(row), content: made.pdf }] : [];
  const m = reportEmail(row, ev, links, checker, files.length > 0);
  const [emailed] = await Promise.all([
    prospectEmail(row, m.tpl, m.vars, `report-${row.id}-${now}`, links, { buttonUrl: links.report, buttonLabel: m.tpl.button, attachments: files, kind: m.kind }),
    teamNotice(row, { title: fill(EMAILS.team.sent, { business: row.company, city: row.city, checker }), rows: teamRows(row, ev), links: [["The report", links.report]], kind: "team-sent", settings }),
    toGhl({ row, tags: ["scorecard-report-sent"], values: { report_url: links.report, score: ev.score } }),
    toWebhooks("report.sent", { ...webhookData(row, ev, links), report: { checker, sent_at: now, url: links.report, pdf: links.pdf } })
  ]);
  return { ok: true, emailed: emailed === true, row: listView(row) };
}

async function reopen(body) {
  const row = await byId(body.id);
  const saved = await getStore().update(row.id, { status: row.booked_at ? "booked" : "ready", sent_at: null });
  return { ok: true, row: listView(saved) };
}

/** The PDF of the report the owner has (its snapshot), or of the report as it stands: [] when it can't print here. */
async function filesFor(row, links, settings) {
  if (!pdfAvailable()) return [];
  const snap = row.report && row.report.snapshot;
  const { pdfOf } = await import("./_lib/reports.mjs");
  try {
    const pdf = snap ? await pdfOf(snap) : (await makeReport(row, { links, settings })).pdf;
    return pdf ? [{ filename: pdfName(row), content: pdf }] : [];
  } catch (e) { console.error("pdf:", e && e.message); return []; }
}

async function resend(req, body) {
  const row = await byId(body.id);
  const links = linksFor(baseUrl(req, SITE), row);
  const ev = row.report_result || row.result;
  const vars = emailVars(row, ev, links);
  const settings = await loadSettings(getStore());
  let r = null;
  if (!["score", "call", "report"].includes(body.which)) throw new HttpError(400, "Which email?");
  if (!emailConfig()) throw new HttpError(400, "Prospect email is not set up (RESEND_API_KEY and SCORECARD_EMAIL_FROM).");
  if (row.unsubscribed_at) throw new HttpError(400, "This address unsubscribed.");
  if (body.which === "score") {
    const scoreVars = { ...vars, ...(row.result ? { score: row.result.score, tier: row.result.tierName } : {}) };
    const files = SITE.reportDelivery === "instant" ? await filesFor(row, links, settings) : null;
    r = await scoreEmail(row, ev, scoreVars, links, files, `score-resend-${row.id}-${Date.now()}`);
  } else if (body.which === "call") {
    const b = bookingView(row.booking);
    if (!b) throw new HttpError(400, "No call is booked.");
    r = await prospectEmail(row, EMAILS.call, { ...vars, ...b, phone: phoneLabel(row.booking.phone) }, `call-resend-${row.id}-${Date.now()}`, links, { kind: "call" });
  } else {
    if (row.status !== "sent") throw new HttpError(400, "The report has not been sent yet.");
    const files = await filesFor(row, links, settings);
    const m = reportEmail(row, ev, links, row.report.checker, files.length > 0);
    r = await prospectEmail(row, m.tpl, m.vars, `report-resend-${row.id}-${Date.now()}`, links, { buttonUrl: links.report, buttonLabel: m.tpl.button, attachments: files, kind: m.kind });
  }
  if (r === null) throw new HttpError(400, row.unsubscribed_at ? "This address unsubscribed." : "Prospect email is not set up (RESEND_API_KEY and SCORECARD_EMAIL_FROM).");
  return { ok: r === true };
}

async function insights(q) {
  const r = range(q);
  const store = getStore();
  const safe = (p) => p.catch((e) => { console.error("insights:", e && e.message); return []; });
  const [counts, dims, times, emails, { rows }] = await Promise.all([safe(store.eventCounts(r)), safe(store.eventDims(r)), safe(store.stepTimes(r)), safe(store.emailList(r)), store.list({ ...r, limit: 5000 })]);
  return { range: r, funnel: funnelOf(counts, times), dims: dimsOf(dims), emails: emailStatsOf(emails), profile: profileOf(rows), delivery: SITE.reportDelivery };
}

/* ---------- This lead's own report: a note and the sections ---------- */
async function options(body) {
  const row = await byId(body.id);
  const own = cleanOptions(body);
  const saved = await getStore().update(row.id, { report: { ...(row.report || {}), options: own } });
  return { ok: true, options: own, row: listView(saved) };
}

/* ---------- Settings ---------- */
async function settingsView() {
  const store = getStore();
  const saved = await store.getSettings().catch(() => ({}));
  const n = notifyConfig(settingsOf(saved).notifications.teamTo);
  return { settings: settingsOf(saved), sections: SECTIONS, delivery: SITE.reportDelivery, setup: await setup(), teamTo: n.to, envTeamTo: notifyConfig("").to };
}
async function saveSettings(body) {
  const key = String(body.key || "");
  const value = cleanSettings(key, body.value);
  await getStore().saveSettings(key, value);
  return { ok: true, ...(await settingsView()) };
}

/* ---------- The sample report with the settings in force (Settings, "Preview with the sample shop") ---------- */
async function sampleReport(req) {
  const base = baseUrl(req, SITE);
  const settings = await loadSettings(getStore());
  const model = modelFor({ ...SAMPLE, report: { checker: "Dana" } }, { links: { results: `${base}/`, sharpen: `${base}/`, report: `${base}/admin`, pdf: `${base}/admin` }, settings, checker: "Dana" });
  return reportHtml(model, { preview: "The sample report (a made-up shop), with your current settings.", toolbar: false });
}

/* ---------- Test email: the sample report, as an owner would get it ---------- */
async function testEmail(req, body) {
  const to = str(body.to, 254).toLowerCase();
  if (!EMAIL.test(to)) throw new HttpError(400, "Enter the address to send the test to.");
  const cfg = emailConfig();
  if (!cfg) throw new HttpError(400, "Prospect email is not set up: add RESEND_API_KEY and SCORECARD_EMAIL_FROM in Vercel, then redeploy.");
  const base = baseUrl(req, SITE);
  const row = { ...SAMPLE, id: null, email: to, status: "new", unsubscribed_at: null };
  const links = { ...linksFor(base, row), report: `${base}/admin`, pdf: `${base}/admin`, results: `${base}/`, sharpen: `${base}/`, unsubscribe: `${base}/` };
  const settings = await loadSettings(getStore());
  const made = await makeReport(row, { links, settings, checker: "Dana" });
  const ev = made.model.result;
  const vars = { ...emailVars(row, ev, links), report_link: links.report };
  const files = made.pdf ? [{ filename: pdfName(row), content: made.pdf }] : [];
  const T = EMAILS.scoreReport;
  const tpl = { ...T, subject: `Test: ${T.subject}`, lines: [EMAILS.team.test, ...T.lines.filter((l) => !l.includes("{deepener_link}"))] };
  const msg = compose(tpl, { ...vars, report_line: fill(files.length ? T.reportAttached : T.reportLinked, { report_link: links.report }) }, { buttonUrl: links.report, buttonLabel: T.button });
  let id = null;
  try {
    id = await sendEmail(cfg, to, msg, { attachments: files, tags: { kind: "test" } });
  } catch (e) {
    await getStore().logEmail({ kind: "test", to_email: to, subject: msg.subject.slice(0, 300), status: "failed", error: String(e.message || e).slice(0, 500) }).catch(() => null);
    throw new HttpError(502, `Resend refused the email: ${String(e.message || e).replace(/^Resend /, "").slice(0, 200)}`);
  }
  await getStore().logEmail({ kind: "test", to_email: to, subject: msg.subject.slice(0, 300), provider_id: id && id !== "sent" ? id : null, status: "sent", attachments: files.length }).catch(() => null);
  return { ok: true, pdf: files.length > 0, pdfError: made.error };
}

async function setup() {
  const s = storeConfig();
  const n = notifyConfig();
  return {
    password: passwordConfigured(), passwordStrong: passwordStrong(),
    storage: s.mode, storageFix: s.ok ? null : notConnected(s),
    prospectEmail: Boolean(emailConfig()), teamEmail: Boolean(n.email), slack: Boolean(n.slack),
    meta: Boolean(capiConfig()), ghl: Boolean(ghlConfig()), webhooks: Boolean(webhookConfig()),
    pdf: pdfAvailable(), resendWebhook: Boolean(process.env.RESEND_WEBHOOK_SECRET && String(process.env.RESEND_WEBHOOK_SECRET).trim()),
    delivery: SITE.reportDelivery,
    brand: BRAND.name,
    areas: SC.areas.map((a) => [a.key, a.name]),
    metric: { name: "Cost of inaction", count: "a year", lead: ["lead", "leads"], ...(SC.metric || {}) },
    segments: (SC.segments || []).map((s) => [s.field, s.label]),
    enrichment: SITE.enrichment !== false
  };
}
