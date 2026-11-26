// The admin's Insights (ScoreApp's: visits, starts, completions, start rate, completion rate, question drop-off, split
// tests, and more), computed from what either store gives: distinct visits per (variant, event, step), the same per
// device, state, source, in-app browser and day, the seconds each question took, the scorecards stored in the period,
// and the email log. Pure: no imports but the scorecard's content.
import SC from "../content/scorecard.mjs";

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
/** The middle value (and the value a quarter from the top with p = 0.75), or null. */
export function quantile(xs, p = 0.5) {
  const s = xs.filter((x) => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo));
}
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** The weekday (0 = Monday) and hour of a moment in a time zone, or in UTC when the zone is unknown. */
export function localSlot(iso, tz) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(d);
    const wd = WEEKDAYS.indexOf((parts.find((p) => p.type === "weekday") || {}).value);
    const h = Number((parts.find((p) => p.type === "hour") || {}).value);
    return wd >= 0 && Number.isFinite(h) ? { wd, h: h % 24 } : null;
  } catch (e) {
    return tz ? localSlot(iso, null) : null;
  }
}

/** The funnel and the split test, from the event counts; each step with the seconds it took (stepTimes). */
export function funnelOf(counts, stepTimes = []) {
  const times = Object.fromEntries((stepTimes || []).map((t) => [t.step, t]));
  const get = (name, step = "", variant = null) => counts.filter((c) => c.name === name && (c.step || "") === step && (variant === null || (c.variant || "") === variant)).reduce((s, c) => s + Number(c.visits || 0), 0);
  const variants = [...new Set(counts.map((c) => c.variant || ""))].sort();
  const steps = SC.steps.map((s, i) => ({ id: s.id, key: s.key, n: i + 1, q: s.q }));
  const one = (variant) => {
    const visits = get("view", "", variant), starts = get("start", "", variant), complete = get("complete", "", variant);
    const stepCounts = steps.map((s) => ({ ...s, answered: get("step", s.id, variant), medianMs: times[s.id] ? Number(times[s.id].median_ms) : null, p75Ms: times[s.id] ? Number(times[s.id].p75_ms) : null }));
    stepCounts.forEach((s, i) => {
      const before = i === 0 ? starts : stepCounts[i - 1].answered;
      s.dropOff = before ? Math.max(0, Math.round((1 - s.answered / before) * 1000) / 10) : null;
    });
    return {
      variant: variant === null ? "all" : variant || "(none)",
      visits, starts, complete,
      startRate: pct(starts, visits), completionRate: pct(complete, visits), finishRate: pct(complete, starts),
      results: get("result", "", variant), callOpen: get("book_open", "", variant), booked: get("booked", "", variant),
      deepenerStart: get("deepener_start", "", variant), deepenerDone: get("deepener_saved", "", variant),
      steps: stepCounts
    };
  };
  // A variant with no visits and no completions is an event without a landing page (a report view): not a page
  return { all: one(null), variants: variants.map((v) => one(v)).filter((v) => v.visits || v.complete) };
}

/** Visits by device, state, source, in-app browser and day (the analytics events), with the rates between them. */
export function dimsOf(dims) {
  const by = {};
  // An event without a source came straight in; without an app, from a regular browser
  const valueOf = (d) => (d.value ? d.value : d.dim === "source" ? "direct" : d.dim === "inapp" ? "none" : d.dim === "device" ? "unknown" : d.value || "");
  for (const d of dims || []) {
    const v = valueOf(d);
    ((by[d.dim] ||= {})[v] ||= {})[d.name] = ((by[d.dim][v] || {})[d.name] || 0) + Number(d.visits || 0);
  }
  const rows = (dim) => Object.entries(by[dim] || {}).map(([value, c]) => ({
    value, views: c.view || 0, starts: c.start || 0, complete: c.complete || 0, booked: c.booked || 0, deepened: c.deepener_saved || 0,
    startRate: pct(c.start || 0, c.view || 0), completionRate: pct(c.complete || 0, c.view || 0)
  }));
  const ranked = (dim) => rows(dim).sort((a, b) => b.complete - a.complete || b.views - a.views || (a.value < b.value ? -1 : 1));
  return {
    device: ranked("device"),
    region: ranked("region").filter((r) => r.value !== ":"),
    source: ranked("source"),
    inapp: ranked("inapp"),
    day: rows("day").filter((r) => r.value).sort((a, b) => (a.value < b.value ? -1 : 1))
  };
}

/** The email log, by kind (the score email, the report, the team's notices...): sent, delivered, opened, clicked. */
export function emailStatsOf(list) {
  const kinds = {};
  for (const m of list || []) {
    const k = m.kind || "email";
    const s = (kinds[k] ||= { kind: k, sent: 0, failed: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 });
    if (m.status === "failed") { s.failed += 1; continue; }
    s.sent += 1;
    if (m.delivered_at || ["delivered", "opened", "clicked"].includes(m.status)) s.delivered += 1;
    if (m.opened_at || ["opened", "clicked"].includes(m.status)) s.opened += 1;
    if (m.clicked_at || m.status === "clicked") s.clicked += 1;
    if (m.bounced_at || m.status === "bounced") s.bounced += 1;
    if (m.status === "complained") s.complained += 1;
  }
  const order = ["score", "sharper", "report", "report-update", "call", "test", "team-lead", "team-deepener", "team-call"];
  return Object.values(kinds).map((s) => ({ ...s, deliveredRate: pct(s.delivered, s.sent), openRate: pct(s.opened, s.delivered || s.sent), clickRate: pct(s.clicked, s.delivered || s.sent) }))
    .sort((a, b) => (order.indexOf(a.kind) + 1 || 99) - (order.indexOf(b.kind) + 1 || 99));
}

/** Who took it and what they scored, from the stored scorecards. */
export function profileOf(rows) {
  const n = rows.length;
  const tally = (f) => rows.reduce((m, r) => { const k = f(r); if (k !== null && k !== undefined && k !== "") m[k] = (m[k] || 0) + 1; return m; }, {});
  const avg = (f) => { const xs = rows.map(f).filter((x) => typeof x === "number"); return xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null; };
  const answers = {};
  for (const s of SC.steps) {
    const qs = s.options && s.type !== "fields" ? [s] : s.choice ? [{ key: s.choice.key, q: s.choice.label, options: s.choice.options }] : [];
    for (const q of qs) answers[q.key] = { q: q.q, options: q.options.map((o) => ({ v: o.v, label: o.label, count: rows.filter((r) => r.answers && r.answers[q.key] === o.v).length })) };
  }
  const hours = rows.filter((r) => r.sent_at).map((r) => (Date.parse(r.sent_at) - Date.parse(r.created_at)) / 3600e3).sort((a, b) => a - b);
  return {
    count: n,
    averageScore: avg((r) => r.score),
    areas: Object.fromEntries(SC.areas.map((a) => [a.key, avg((r) => r.result && r.result.areas && r.result.areas[a.key] ? r.result.areas[a.key].score : null)])),
    tiers: SC.tiers.map((t) => ({ key: t.key, name: t.name, count: rows.filter((r) => r.tier === t.key).length })),
    bottlenecks: SC.areas.map((a) => ({ key: a.key, name: a.name, count: rows.filter((r) => r.bottleneck === a.key).length })),
    fit: tally((r) => r.fit),
    routes: tally((r) => (!r.route ? "not recorded" : r.route.startsWith("walkthrough first") ? "walkthrough first" : r.route)),
    deepened: rows.filter((r) => r.deepened_at).length,
    booked: rows.filter((r) => r.booked_at).length,
    sent: rows.filter((r) => r.sent_at).length,
    waiting: rows.filter((r) => !r.sent_at && !["closed", "spam"].includes(r.status)).length,
    medianHoursToReport: hours.length ? Math.round(hours[Math.floor(hours.length / 2)] * 10) / 10 : null,
    sources: tally((r) => (r.tracking && (r.tracking.source || r.tracking.utm_source)) || "direct"),
    variants: tally((r) => r.variant || "(none)"),
    answers,
    ...extrasOf(rows)
  };
}

/** Where, on what, when and how long, the money on the table, the report's reach, cross-tabs and the leads to call. */
function extrasOf(rows) {
  const tally = (f) => rows.reduce((m, r) => { const k = f(r); if (k !== null && k !== undefined && k !== "") m[k] = (m[k] || 0) + 1; return m; }, {});
  const top = (obj, n = 15) => Object.entries(obj).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1)).slice(0, n);
  const iw = (r) => (r.report_result && r.report_result.invisible) || (r.result && r.result.invisible) || {};
  // Where: the state (US) or country the IP address suggests, and the city
  const us = rows.filter((r) => r.geo && r.geo.country === "US" && r.geo.region);
  const states = tally((r) => (r.geo && r.geo.country === "US" ? r.geo.region : null));
  const statesBooked = us.reduce((m, r) => { if (r.booked_at) m[r.geo.region] = (m[r.geo.region] || 0) + 1; return m; }, {});
  // When: the lead's own local time (the browser's time zone, or the one the IP address suggests)
  const hourWeek = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of rows) {
    const slot = localSlot(r.created_at, (r.tracking && r.tracking.tz) || (r.geo && r.geo.tz) || null);
    if (slot) hourWeek[slot.wd][slot.h] += 1;
  }
  // How long: the whole quiz from the first tap, and the time on the page before it
  const totals = rows.map((r) => r.timing && num(r.timing.totalMs)).filter((x) => x !== null);
  const landings = rows.map((r) => r.timing && num(r.timing.landingMs)).filter((x) => x !== null);
  const timed = rows.filter((r) => r.timing);
  const scoreBuckets = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9, count: 0 }));
  for (const r of rows) if (typeof r.score === "number") scoreBuckets[Math.min(9, Math.floor(r.score / 10))].count += 1;
  const values = rows.map((r) => num(iw(r).workValue)).filter((x) => x !== null);
  const unasked = rows.map((r) => num(iw(r).unasked)).filter((x) => x !== null);
  const label = (key, v) => { for (const s of SC.steps) { const opts = s.key === key ? s.options : s.choice && s.choice.key === key ? s.choice.options : null; if (opts) return (opts.find((o) => o.v === v) || {}).label || v; } return v; };
  const group = (f, labelOf) => {
    const g = {};
    for (const r of rows) {
      const k = f(r);
      if (k === null || k === undefined || k === "") continue;
      const x = (g[k] ||= { key: k, label: labelOf ? labelOf(k) : k, count: 0, qualified: 0, booked: 0, deepened: 0, scores: [], values: [] });
      x.count += 1;
      if (r.fit === SC.qualifiedFit) x.qualified += 1;
      if (r.booked_at) x.booked += 1;
      if (r.deepened_at) x.deepened += 1;
      if (typeof r.score === "number") x.scores.push(r.score);
      if (num(iw(r).workValue) !== null) x.values.push(iw(r).workValue);
    }
    return Object.values(g).map(({ scores, values: vs, ...x }) => ({ ...x, avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
      medianValue: quantile(vs), bookedRate: pct(x.booked, x.count) })).sort((a, b) => b.count - a.count);
  };
  return {
    geo: {
      states: Object.entries(states).map(([key, count]) => ({ key, count, booked: statesBooked[key] || 0 })).sort((a, b) => b.count - a.count),
      countries: top(tally((r) => (r.geo && r.geo.country) || null)),
      cities: top(tally((r) => (r.geo && r.geo.city ? [r.geo.city, r.geo.region].filter(Boolean).join(", ") : null)), 12),
      unknown: rows.filter((r) => !r.geo).length
    },
    devices: {
      type: tally((r) => (r.device && r.device.type) || null),
      os: tally((r) => (r.device && r.device.os) || null),
      inApp: tally((r) => (r.device ? r.device.inApp || "none" : null))
    },
    timing: {
      n: timed.length,
      medianTotalMs: quantile(totals), p75TotalMs: quantile(totals, 0.75),
      medianLandingMs: quantile(landings),
      wentBack: pct(timed.filter((r) => r.timing.backs > 0).length, timed.length),
      leftMidway: pct(timed.filter((r) => r.timing.aways > 0).length, timed.length)
    },
    hourWeek,
    scoreBuckets,
    invisible: {
      leads: values.length,
      unaskedTotal: unasked.reduce((a, b) => a + b, 0),
      valueTotal: values.reduce((a, b) => a + b, 0),
      valueMedian: quantile(values)
    },
    report: {
      emailed: rows.filter((r) => r.report && r.report.instant_at).length,
      pdfFailed: rows.filter((r) => r.report && r.report.instant_at && r.report.pdf_ok === false).length,
      viewed: rows.filter((r) => Number(r.report_views) > 0).length,
      downloaded: rows.filter((r) => Number(r.pdf_downloads) > 0).length
    },
    byTier: SC.tiers.map((t) => group((r) => r.tier).find((g) => g.key === t.key) || { key: t.key, label: t.key, count: 0, qualified: 0, booked: 0, deepened: 0, avgScore: null, medianValue: null, bookedRate: null })
      .map((g) => ({ ...g, label: (SC.tiers.find((t) => t.key === g.key) || {}).name || g.key })),
    bySegment: (SC.segments || []).map((s) => ({ field: s.field, label: s.label, groups: group((r) => (r.answers && r.answers[s.field]) || null, (k) => label(s.field, k)) })),
    byTrade: group((r) => (r.answers && r.answers.trade) || null, (k) => label("trade", k)),
    byJobs: group((r) => (r.answers && r.answers.jobs) || null, (k) => label("jobs", k)),
    byTicket: group((r) => (r.answers && r.answers.ticket) || null, (k) => label("ticket", k)),
    bySource: group((r) => (r.tracking && (r.tracking.source || r.tracking.utm_source)) || "direct"),
    byCampaign: group((r) => (r.tracking && r.tracking.utm_campaign) || null),
    hotLeads: rows.filter((r) => r.fit === SC.qualifiedFit && !r.booked_at && !r.unsubscribed_at && !["closed", "spam"].includes(r.status))
      .map((r) => ({ id: r.id, created_at: r.created_at, first_name: r.first_name, company: r.company, city: r.city, score: r.score, tier: r.tier,
        value: num(iw(r).workValue), unasked: num(iw(r).unasked), viewed: Number(r.report_views) > 0, deepened: Boolean(r.deepened_at), status: r.status }))
      .sort((a, b) => (b.value || 0) - (a.value || 0) || (a.created_at < b.created_at ? 1 : -1)).slice(0, 10)
  };
}

/** The scorecards as CSV, one row each, for a spreadsheet or a CRM import. The answer and area columns follow the
 *  content (every hero choice, every deepener question, every area), so a new scorecard needs no change here. */
export function toCsv(rows) {
  const heroKeys = [];
  for (const s of SC.steps) { if (s.options && s.type !== "fields") heroKeys.push(s.key); else if (s.choice) heroKeys.push(s.choice.key); }
  const deepKeys = SC.deepener.concat(SC.checklist || []).map((d) => d.key);
  const areaCol = (k) => (heroKeys.includes(k) || deepKeys.includes(k) ? `${k}_area` : k);
  const cols = ["created_at", "status", "first_name", "last_name", "email", "company", "city", ...heroKeys,
    "score", "tier", ...SC.areas.map((a) => areaCol(a.key)), "report_score", "bottleneck", "unasked", "work_value", "fit", "route", "deepened",
    ...deepKeys, "booked_day", "booked_window", "phone", "consent_text", "variant", "source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "sent_at", "unsubscribed",
    "city_from_ip", "state_from_ip", "country_from_ip", "device", "os", "browser", "in_app", "seconds_to_finish", "seconds_before_start", "report_views", "pdf_downloads"];
  const cell = (v) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s; };
  const lines = [cols.join(",")];
  for (const r of rows) {
    const a = r.answers || {}, d = r.deepener || {}, res = r.result || {}, rr = r.report_result || {}, t = r.tracking || {}, b = r.booking || {};
    const iw = res.invisible || {};
    const g = r.geo || {}, dv = r.device || {}, tm = r.timing || {};
    const v = {
      created_at: r.created_at, status: r.status, first_name: r.first_name, last_name: r.last_name, email: r.email, company: r.company, city: r.city,
      ...Object.fromEntries(heroKeys.map((k) => [k, a[k]])),
      score: r.score, tier: r.tier, ...Object.fromEntries(SC.areas.map((ar) => [areaCol(ar.key), res.areas && res.areas[ar.key] ? res.areas[ar.key].score : ""])),
      report_score: rr.score, bottleneck: r.bottleneck, unasked: iw.unasked, work_value: iw.workValue, fit: r.fit, route: r.route, deepened: r.deepened_at ? "yes" : "",
      ...Object.fromEntries(deepKeys.map((k) => [k, d[k]])),
      booked_day: b.day, booked_window: b.window, phone: b.phone, consent_text: b.phone ? (b.consentText ? "yes" : "no") : "",
      variant: r.variant, source: t.source, utm_source: t.utm_source, utm_medium: t.utm_medium, utm_campaign: t.utm_campaign, utm_content: t.utm_content,
      sent_at: r.sent_at, unsubscribed: r.unsubscribed_at ? "yes" : "",
      city_from_ip: g.city, state_from_ip: g.region, country_from_ip: g.country, device: dv.type, os: dv.os, browser: dv.browser, in_app: dv.inApp,
      seconds_to_finish: tm.totalMs !== undefined && tm.totalMs !== null ? Math.round(tm.totalMs / 1000) : "", seconds_before_start: tm.landingMs !== undefined && tm.landingMs !== null ? Math.round(tm.landingMs / 1000) : "",
      report_views: r.report_views, pdf_downloads: r.pdf_downloads
    };
    lines.push(cols.map((c) => cell(v[c])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
