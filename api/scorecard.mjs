// /api/scorecard: where the scorecard's pages send things, and where the results page reads its result.
//
//   POST { action: "submit", answers, company, city, firstName, email, consentEmail, timing, client, ... }
//        The ten steps. Scored again here (lib/scoring.mjs), so nothing stored, emailed or sent to Meta trusts the browser.
//        Stored (api/_lib/store.mjs) with the time each question took, the approximate location and the device, then
//        answered at once ({ ok, token, result }). After the answer (api/_lib/background.mjs): the PDF report is printed
//        and emailed with the score (site.reportDelivery "instant"), the team hears about the lead (with the PDF when
//        Settings say so), then Meta's Lead (qualified only), GoHighLevel, the webhooks and the shared leads table,
//        each only when set up.
//   POST { action: "deepener", token, answers, timing } the eight optional questions; the report's scores follow them,
//                                                      and the sharper report is emailed (instant delivery)
//   POST { action: "book", token, slotDay, slotWindow, phone, address, consentPhone, consentText }    the 20-minute walkthrough
//   POST { action: "unsubscribe", token }              no more emails to this address
//   GET  ?token=...                                    the result for the results and sharpen pages (no answers, no contact)
//   GET                                                a health report: which settings this deployment sees (names and
//                                                      true or false, never a value), and what to fix
import { createHash } from "node:crypto";
import SC from "../content/scorecard.mjs";
import SITE from "../content/site.mjs";
import BRAND from "../content/brand.mjs";
import EMAILS from "../content/emails.mjs";
import RESULTS from "../content/results.mjs";
import { evaluate, cleanDeepener, deepenerShown, deepenerAll, fill, optionOf } from "../lib/scoring.mjs";
import { usPhone, dayAllowed, windowOf, phoneLabel } from "../lib/booking.mjs";
import { send, readJson, query, sameOrigin, clientIp, header, userAgent, baseUrl, deployment, str, EMAIL, TOKEN, fail, HttpError } from "./_lib/http.mjs";
import { getStore, storeConfig, notConnected, StoreError } from "./_lib/store.mjs";
import { emailConfig } from "./_lib/emails.mjs";
import { notifyConfig, notifyTeam } from "./_lib/notify.mjs";
import { toMeta, toGhl, toWebhooks, toLeadsTable, capiConfig, ghlConfig, webhookConfig, FBC, FBP, EVENT_ID } from "./_lib/integrations.mjs";
import { visitorView, publicResult, bookingView, linksFor } from "./_lib/views.mjs";
import { emailVars, prospectEmail, teamNotice, teamRows, webhookData, ghlValues, scoreEmail, who } from "./_lib/messages.mjs";
import { later } from "./_lib/background.mjs";
import { loadSettings } from "./_lib/settings.mjs";
import { makeReport, pdfName } from "./_lib/reports.mjs";
import { pdfAvailable } from "./_lib/pdf.mjs";
import { geoOf, deviceOf, timingOf, sourceFrom } from "./_lib/visitor.mjs";

const HONEYPOT = ["hp", "_hp", "honeypot", "_gotcha", "botfield"];
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET" || req.method === "HEAD") {
      const token = query(req).get("token");
      if (token) return await lookup(res, token);
      return send(res, 200, await health());
    }
    if (req.method !== "POST") return send(res, 405, { error: "method not allowed" }, { allow: "GET, POST" });
    if (!sameOrigin(req)) return send(res, 403, { error: "forbidden" });
    let body;
    try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: "invalid request" }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return send(res, 400, { error: "invalid request" });
    // A bot filled a field people never see: answer like a success, store and send nothing
    if (HONEYPOT.some((k) => typeof body[k] === "string" && body[k].trim())) return send(res, 200, { ok: true });
    switch (body.action) {
      case "submit": return await submit(req, res, body);
      case "deepener": return await deepen(req, res, body);
      case "book": return await book(req, res, body);
      case "unsubscribe": return await unsubscribe(req, res, body);
      default: return send(res, 400, { error: "Unknown action" });
    }
  } catch (e) {
    if (e instanceof StoreError && e.status === 429) return send(res, 429, { error: e.message });
    return fail(res, e);
  }
}

/* ---------- GET ?token= ---------- */
async function lookup(res, token) {
  if (!TOKEN.test(token)) return send(res, 404, { error: "not found" });
  const row = await getStore().byToken(token);
  if (!row) return send(res, 404, { error: "not found" });
  return send(res, 200, visitorView(row));
}

/* ---------- The main quiz ---------- */
// Which contact fields the quiz asks (content/scorecard.mjs steps): RoomIQ's asks no business name or city
const FIELD_NAMES = new Set(SC.steps.flatMap((s) => (s.fields || []).map((f) => f.name)));
async function submit(req, res, body) {
  const ev = evaluate(SC, body.answers || {});
  if (!ev.ok) return send(res, 400, { error: "Please answer every question", missing: ev.missing });
  const email = str(body.email, 254).toLowerCase();
  const firstName = str(body.firstName, 60);
  const company = FIELD_NAMES.has("company") ? str(body.company, 120) : "";
  // No city field: the lead's city column holds the market of the deal (a metro, never an address), for the admin's
  // lists and the team's notices: a preset metro's name, or the place typed outside the presets (lib/scoring.mjs
  // cleanPlace keeps no house number, street or ZIP). It is never sent to Meta (api/_lib/integrations.mjs)
  const market = optionOf(SC, "market", ev.answers.market);
  const covered = market && SC.markets && SC.markets.covered.includes(market.v);
  const city = FIELD_NAMES.has("city") ? str(body.city, 80) : covered ? market.label : market && market.v === "other" ? str(ev.answers.marketText, 60) : "";
  if (!email || !EMAIL.test(email)) return send(res, 400, { error: "A valid email is required" });
  if (!firstName) return send(res, 400, { error: "Your first name is required" });
  if ((FIELD_NAMES.has("company") && !company) || (FIELD_NAMES.has("city") && !city)) return send(res, 400, { error: "Your business name and city are required" });
  if (body.consentEmail !== true) return send(res, 400, { error: "Consent is required" });

  const t = body.tracking && typeof body.tracking === "object" && !Array.isArray(body.tracking) ? body.tracking : {};
  const gpc = t.gpc === true;
  const adsConsent = ["granted", "denied", "unset"].includes(t.consent) ? t.consent : "unset";
  const optedOut = gpc || adsConsent === "denied";
  const visit = /^[A-Za-z0-9_-]{6,64}$/.test(str(body.visit, 64)) ? str(body.visit, 64) : "";
  const leadEventId = EVENT_ID.test(str(t.leadEventId, 80)) ? str(t.leadEventId, 80) : `lead-${createHash("sha256").update(`${visit || email}|${SC.form}`).digest("hex").slice(0, 24)}`;
  const tracking = {
    ...Object.fromEntries(UTM.map((k) => [k, str(body[k], 300)]).filter(([, v]) => v)),
    page: str(body.page, 1000), referrer: str(body.referrer, 1000), tz: /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(str(body.tz, 64)) ? str(body.tz, 64) : "",
    ...(optedOut ? {} : { fbc: FBC.test(str(t.fbc, 600)) ? str(t.fbc, 600) : "", fbp: FBP.test(str(t.fbp, 60)) ? str(t.fbp, 60) : "" }),
    gpc, ads_consent: adsConsent, lead_event_id: leadEventId
  };
  for (const k of Object.keys(tracking)) if (tracking[k] === "") delete tracking[k];
  tracking.source = sourceFrom({ utm_source: tracking.utm_source, fbclid: tracking.fbclid, referrer: tracking.referrer });
  const ip = clientIp(req);
  const ua = userAgent(req);
  const salt = process.env.LEAD_HASH_SALT || `${BRAND.slug}-scorecard`;
  const row = {
    form: SC.form,
    status: "new",
    email, first_name: firstName, company, city,
    profiles: ev.answers.profiles, trade: ev.trade,
    visit, variant: /^[a-z0-9-]{1,40}$/.test(str(body.variant, 40)) ? str(body.variant, 40) : "",
    answers: ev.answers,
    result: trim(ev),
    report_result: trim(ev),
    consent: { consentEmail: true, noticeVersion: /^\d{4}-\d{2}-\d{2}$/.test(str(body.noticeVersion, 10)) ? str(body.noticeVersion, 10) : SITE.noticeVersion, at: new Date().toISOString() },
    tracking,
    fit: ev.fit, route: ev.callOnly ? `walkthrough first (${ev.why})` : ev.covered ? "free forecast" : "market lookup",
    score: ev.score, tier: ev.tier, bottleneck: ev.bottleneck.primary,
    ip_hash: ip ? createHash("sha256").update(`${salt}|${ip}`).digest("hex") : null,
    // What the admin's analytics read: the time each question took (as the page measured it, only while on screen),
    // the approximate location from the IP address (never the address itself), and the device
    timing: timingOf(body.timing, SC.steps.map((s) => s.id)),
    geo: geoOf(req),
    device: deviceOf(ua, body.client)
  };

  const store = getStore();
  let saved = null, reason = null;
  try {
    saved = await store.create(row);
  } catch (e) {
    if (e instanceof StoreError && (e.status === 429 || e.status === 400)) throw e;
    reason = e.message;
    console.error("store:", reason);
  }
  const base = baseUrl(req, SITE);
  const publicView = publicResult(trim(ev));
  if (!saved) {
    // Not stored: the team's notice is the only copy, so it goes before the answer, with everything in it
    const notified = await notifyTeam({
      title: `${fill(EMAILS.team.lead, { ...who({ company, city, first_name: firstName }), score: ev.score, tier: ev.tierName })} ${fill(EMAILS.team.notSaved, { reason })}`,
      rows: teamRows(row, ev), links: []
    });
    if (!(notified && (notified.email || notified.slack))) {
      return send(res, storeConfig().ok ? 502 : 503, { error: "We couldn't save your answers just now.", stored: false, result: publicView });
    }
    return send(res, 200, { ok: true, stored: false, token: null, result: publicView, deepener: { shown: [] } });
  }
  const links = linksFor(base, saved);
  const job = later("after submit", () => afterSubmit(saved, ev, { links, ip, ua, leadEventId, tracking }));
  if (job.mustAwait) await job.done;
  return send(res, 200, { ok: true, stored: true, token: saved.token, result: publicView, deepener: { shown: deepenerShown(SC, ev.answers).map((d) => d.key) }, delivery: SITE.reportDelivery });
}

/** After the answer: the report and its PDF, the owner's email, the team's notice, then the integrations. */
async function afterSubmit(saved, ev, { links, ip, ua, leadEventId, tracking }) {
  const store = getStore();
  const settings = await loadSettings(store);
  const instant = SITE.reportDelivery === "instant";
  let row = saved, pdf = null, pdfError = null;
  if (instant) {
    const made = await makeReport(row, { links, settings });
    pdf = made.pdf;
    pdfError = made.error;
    const fresh = (await store.byId(row.id)) || row;
    row = await store.update(row.id, { report: { ...(fresh.report || {}), snapshot: made.model, instant_at: new Date().toISOString(), pdf_ok: Boolean(pdf) } });
  }
  const vars = emailVars(row, ev, links);
  const files = pdf ? [{ filename: pdfName(row), content: pdf }] : [];
  const n = settings.notifications;
  const teamTitle = fill(EMAILS.team.lead, { ...who(row), score: ev.score, tier: ev.tierName });
  const teamRowsNow = teamRows(row, ev).concat(instant ? [["Report", pdf ? EMAILS.team.pdfSent : fill(EMAILS.team.pdfFailed, { reason: pdfError || "unknown" })]] : []);
  await Promise.all([
    scoreEmail(row, ev, vars, links, instant ? files : null),
    teamNotice(row, { title: teamTitle, rows: teamRowsNow, links: [["Open in the admin", links.admin], ["Their result", links.results], ["Their report", links.report]], attachments: n.attachPdf ? files : [], kind: "team-lead", settings }),
    // ScorecardComplete for every completed scorecard (the GTM's event map; decision 10 counts every completion), with the
    // browser's event id; never after an opt-out (docs/DECISIONS.md 10, 11)
    SITE.metaEvents && SITE.metaEvents.complete ? toMeta({ name: SITE.metaEvents.complete, everyone: true, eventId: leadEventId, sourceUrl: /^https?:\/\//.test(tracking.page || "") ? tracking.page : "", row, ip, ua, custom: { content_name: SITE.metaEvents.contentName || "scorecard" } }) : null,
    toGhl({ row, tags: [`scorecard-tier-${ev.tier}`, `scorecard-fit-${ev.fit}`], values: ghlValues(row, ev, links) }),
    toWebhooks("scorecard.completed", webhookData(row, ev, links)),
    toLeadsTable(row, SC.form),
    store.addEvents([{ visit: row.visit || row.id, variant: row.variant || "", name: "complete", step: "", data: { score: ev.score, tier: ev.tier, ms: row.timing && row.timing.totalMs }, ...eventDims(row) }]).catch(() => 0)
  ]);
}

/* ---------- The deepener: the optional questions ---------- */
async function deepen(req, res, body) {
  const row = await byToken(body.token);
  if (row.status === "sent") return send(res, 409, { error: "Your report has already been sent with the answers it had." });
  const { deepener, missing } = cleanDeepener(SC, row.answers || {}, body.answers || {});
  if (missing.length) return send(res, 400, { error: "Please answer every question", missing });
  const compare = row.public_data && row.public_data.compare;
  const ev = evaluate(SC, row.answers, deepener, { compare });
  const saved = await getStore().update(row.id, { deepener, deepened_at: new Date().toISOString(), report_result: trim(ev), bottleneck: ev.bottleneck.primary,
    deepener_timing: timingOf(body.timing, deepenerAll(SC).map((d) => d.id)) });
  const links = linksFor(baseUrl(req, SITE), saved);
  const job = later("after deepener", () => afterDeepener(saved, ev, links));
  if (job.mustAwait) await job.done;
  return send(res, 200, { ok: true, n: Object.keys(deepener).length });
}

/** After the deepener: the sharper report to the owner (instant delivery), the team, the integrations. */
async function afterDeepener(saved, ev, links) {
  const store = getStore();
  const settings = await loadSettings(store);
  const instant = SITE.reportDelivery === "instant";
  let row = saved, files = [];
  if (instant) {
    const made = await makeReport(row, { links, settings });
    files = made.pdf ? [{ filename: pdfName(row), content: made.pdf }] : [];
    const fresh = (await store.byId(row.id)) || row;
    row = await store.update(row.id, { report: { ...(fresh.report || {}), snapshot: made.model, instant_at: new Date().toISOString(), pdf_ok: Boolean(made.pdf) } });
  }
  const n = Object.keys(row.deepener || {}).length;
  const b = bookingView(row.booking);
  const vars = { ...emailVars(row, ev, links), n_answered: n, report_link: links.report };
  vars.call_line = b ? fill(EMAILS.report.callBooked, b) : fill(EMAILS.report.callOpen, { results_link: `${links.results}#call` });
  vars.report_line = fill(files.length ? EMAILS.sharper.reportAttached : EMAILS.sharper.reportLinked, vars);
  await Promise.all([
    instant ? prospectEmail(row, EMAILS.sharper, vars, `sharper-${row.id}-${row.deepened_at}`, links, { buttonUrl: links.report, buttonLabel: EMAILS.sharper.button, attachments: files, kind: "sharper" }) : null,
    settings.notifications.deepener ? teamNotice(row, { title: fill(EMAILS.team.deepened, { ...who(row), score: ev.score }), rows: teamRows(row, ev), links: [["Open in the admin", links.admin]], kind: "team-deepener", settings }) : null,
    toGhl({ row, tags: ["scorecard-deepened"], values: ghlValues(row, ev, links) }),
    toWebhooks("scorecard.deepened", webhookData(row, ev, links)),
    store.addEvents([{ visit: row.visit || row.id, variant: row.variant || "", name: "deepener_saved", step: "", data: {}, ...eventDims(row) }]).catch(() => 0)
  ]);
}

/* ---------- The walkthrough (the call step) ---------- */
async function book(req, res, body) {
  const row = await byToken(body.token);
  const phone = usPhone(body.phone);
  if (!phone) return send(res, 400, { error: RESULTS.booking.phoneError });
  if (body.consentPhone !== true) return send(res, 400, { error: RESULTS.booking.consentError });
  const win = windowOf(SITE.booking, body.slotWindow);
  if (!win || !dayAllowed(body.slotDay, new Date(), 14)) return send(res, 400, { error: "Please pick a day and a time" });
  const t = body.tracking && typeof body.tracking === "object" ? body.tracking : {};
  const scheduleEventId = EVENT_ID.test(str(t.scheduleEventId, 80)) ? str(t.scheduleEventId, 80) : `schedule-${createHash("sha256").update(`${row.id}|call`).digest("hex").slice(0, 24)}`;
  // The house's address is optional, typed by the buyer for the walkthrough, and kept with the booking only
  const address = SITE.booking.address ? str(body.address, SITE.booking.address.max || 200) : "";
  const booking = { day: body.slotDay, window: win.v, phone, ...(address ? { address } : {}), consentPhone: true, consentText: Boolean(SITE.booking.consentText) && body.consentText === true, tz: str(body.tz, 64), at: new Date().toISOString(), noticeVersion: SITE.noticeVersion };
  const saved = await getStore().update(row.id, { booking, booked_at: booking.at, status: ["new", "ready"].includes(row.status) ? "booked" : row.status, tracking: { ...(row.tracking || {}), schedule_event_id: scheduleEventId } });
  const ev = saved.report_result || saved.result;
  const links = linksFor(baseUrl(req, SITE), saved);
  const bv = bookingView(booking);
  const vars = { ...emailVars(saved, ev, links), day: bv.day, window: bv.window, hours: bv.hours, phone: phoneLabel(phone) };
  const ip = clientIp(req), ua = userAgent(req);
  const job = later("after booking", async () => {
    const settings = await loadSettings(getStore());
    await Promise.all([
      prospectEmail(saved, EMAILS.call, vars, `call-${saved.id}-${booking.day}-${booking.window}`, links, { kind: "call" }),
      settings.notifications.booking ? teamNotice(saved, { title: fill(EMAILS.team.call, { ...who(saved), day: bv.day, window: bv.window, hours: bv.hours, phone: phoneLabel(phone) }), rows: teamRows(saved, ev), links: [["Open in the admin", links.admin]], kind: "team-call", settings }) : null,
      SITE.metaEvents && SITE.metaEvents.schedule ? toMeta({ name: SITE.metaEvents.schedule, eventId: scheduleEventId, sourceUrl: links.results, row: saved, ip, ua, custom: { content_name: SITE.metaEvents.contentName || "scorecard", content_category: "walkthrough" } }) : null,
      toGhl({ row: saved, tags: ["scorecard-booked"], values: { ...ghlValues(saved, ev, links), booking: `${bv.day}, ${bv.window} (${bv.hours})` } }),
      toWebhooks("scorecard.booked", { ...webhookData(saved, ev, links), booking: { day: booking.day, window: booking.window, hours: win.hint, phone, address: booking.address || "", consentText: booking.consentText, tz: booking.tz } }),
      getStore().addEvents([{ visit: saved.visit || saved.id, variant: saved.variant || "", name: "booked", step: "", data: {}, ...eventDims(saved) }]).catch(() => 0)
    ]);
  });
  if (job.mustAwait) await job.done;
  return send(res, 200, { ok: true, day: bv.day, window: bv.window, hours: bv.hours, phone: phoneLabel(phone) });
}

async function unsubscribe(req, res, body) {
  const row = await byToken(body.token);
  if (!row.unsubscribed_at) await getStore().update(row.id, { unsubscribed_at: new Date().toISOString() });
  return send(res, 200, { ok: true });
}

async function byToken(token) {
  if (!TOKEN.test(String(token || ""))) throw new HttpError(404, RESULTS.notFound);
  const row = await getStore().byToken(token);
  if (!row) throw new HttpError(404, RESULTS.notFound);
  return row;
}

/** What an event about a stored lead carries for the analytics: the lead, where, on what, from where. */
const eventDims = (row) => {
  const g = row.geo || {}, d = row.device || {};
  return { assessment: row.id, country: g.country || "", region: g.region || "", device: d.type || "", inapp: d.inApp || "", source: (row.tracking && row.tracking.source) || "" };
};

/* ---------- Words and data for the emails, the notices and the integrations ---------- */
const trim = (ev) => {
  const { ok, missing, deepenerMissing, ...rest } = ev;
  return rest;
};

/* ---------- GET /api/scorecard: what this deployment sees ---------- */
async function health() {
  const cfg = storeConfig();
  const db = await getStore().health().catch((e) => ({ ok: false, fix: e.message }));
  const n = notifyConfig();
  const vars = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "RESEND_API_KEY", "SCORECARD_EMAIL_FROM", "SCORECARD_REPLY_TO", "LEAD_NOTIFY_FROM", "LEAD_NOTIFY_TO",
    "SLACK_WEBHOOK_URL", "ADMIN_PASSWORD", "META_PIXEL_ID", "META_CAPI_TOKEN", "GHL_TOKEN", "GHL_LOCATION_ID", "SCORECARD_WEBHOOK_URLS", "SCORECARD_WEBHOOK_SECRET",
    "LEADS_MIRROR", "CRON_SECRET", "LEAD_HASH_SALT", "RESEND_WEBHOOK_SECRET"];
  return {
    ready: Boolean(db.ok && (n.email || n.slack)),
    database: cfg.ok ? db : { ok: false, problem: cfg.problem, fix: notConnected(cfg) },
    prospectEmail: Boolean(emailConfig()),
    reportDelivery: SITE.reportDelivery,
    pdf: pdfAvailable(),
    teamNotices: { email: Boolean(n.email), slack: Boolean(n.slack) },
    meta: { conversionsApi: Boolean(capiConfig()), pixelOnPage: Boolean(SITE.metaPixelId) },
    goHighLevel: Boolean(ghlConfig()),
    webhooks: Boolean(webhookConfig()),
    deployment: deployment(),
    vars: Object.fromEntries(vars.map((k) => [k, Boolean(process.env[k] && String(process.env[k]).trim())]))
  };
}
