// The report's model (spec 3): every field in the spec's field dictionary, and which variant each page shows, computed
// from a stored scorecard (the answers, the deepener). lib/report-html.mjs draws it; the admin previews it; a sent
// report keeps a snapshot of it, so what the investor received never changes afterwards. The template's outside-data
// page (public_data, below) is off in this funnel (site.enrichment false); its code stays for the template's shape.
//
// public_data, as the admin saves it:
//   search    { service, city, date }                  the search the top three come from ("HVAC in Austin", 2026-11-23)
//   business  { rating, count, reviews90, newestDays, replied, sampled, checks: {hours, services, photos, description,
//               categories}, months: [12 counts, oldest first, ending with the search month] }
//   top3      [ { name, rating, count, reviews90, newestDays, replied, sampled, checks } x 3 ]
//   themes    [ { theme, count } ]                     complaint themes in the last 30 reviews (themes and counts only)
//   compare   ahead | even | behind | far | ""        the GTM's top-three reading ("" means the suggestion is used)
//   monthsRead auto | dip | steady | none
import SC from "../content/scorecard.mjs";
import REPORT from "../content/report.mjs";
import PLAYBOOK from "../content/playbook.mjs";
import METHOD from "../content/method.mjs";
import SITE from "../content/site.mjs";
import { evaluate, deepenerShown, fill, money, num, areaName, optionOf, clean, gapVars, months } from "./scoring.mjs";
import { dayLabel, windowOf } from "./booking.mjs";

export const CHECKS = ["hours", "services", "photos", "description", "categories"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const n = (v) => (v === "" || v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const mean = (xs) => { const ys = xs.filter(isNum); return ys.length ? ys.reduce((s, x) => s + x, 0) / ys.length : null; };
const one = (x) => (isNum(x) ? (Math.round(x * 10) / 10).toFixed(1) : "");
const whole = (x) => (isNum(x) ? String(Math.round(x)) : "");

/** "today", "3 days ago", "5 weeks ago", "4 months ago" */
export function ageLabel(days) {
  if (!isNum(days)) return "";
  const d = Math.max(0, Math.round(days));
  if (d === 0) return "today";
  if (d < 14) return `${d} day${d === 1 ? "" : "s"} ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  const m = Math.round(d / 30.4);
  return `${m} month${m === 1 ? "" : "s"} ago`;
}

/** The star cushion (Deliverable 3): k one-star reviews that take the displayed rating under 4.5, or m five-star
 *  reviews in a row to reach 4.5. Exact arithmetic in hundredths, so 4.45 is never 4.4499999. */
export function starCushion(rating, count) {
  if (!isNum(rating) || !isNum(count) || count <= 0) return null;
  const r = Math.round(rating * 100), N = Math.round(count);
  if (r >= 445) {
    // smallest k with (r*N + 100k) / (N + k) < 445  ->  k > N(r - 445) / 345
    const k = Math.floor((N * (r - 445)) / 345) + 1;
    return { kind: "above", k };
  }
  // smallest m with (r*N + 500m) / (N + m) >= 445  ->  m >= N(445 - r) / 55
  const m = Math.ceil((N * (445 - r)) / 55);
  return { kind: "below", m };
}

/** The months' labels: the 12 months ending with the search month, oldest first ("Dec" ... "Nov"). */
export function monthLabels(searchDate) {
  const m = /^(\d{4})-(\d{2})/.exec(String(searchDate || ""));
  const end = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    out.push({ short: MONTHS[d.getMonth()].slice(0, 3), long: MONTHS[d.getMonth()], year: d.getFullYear() });
  }
  return out;
}

/** The busy-season read: the two quietest months, and whether they are a dip (their average under half the monthly
 *  average) or the year is steady. Under 6 reviews in 12 months there is nothing to read. */
export function monthsRead(values) {
  const vs = (values || []).map(n);
  if (vs.length !== 12 || vs.some((v) => v === null)) return { kind: null, low: [] };
  const total = vs.reduce((s, v) => s + v, 0);
  const order = vs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const low = [order[0][1], order[1][1]].sort((a, b) => a - b);
  if (total < 6) return { kind: null, low };
  const avg = total / 12;
  const lowAvg = (vs[low[0]] + vs[low[1]]) / 2;
  return { kind: lowAvg < avg * 0.5 ? "dip" : "steady", low };
}

/** The six top-three measures, each with both figures and a read (ahead or level, behind). */
export function topThree(pd) {
  const b = (pd && pd.business) || {};
  const t3 = ((pd && pd.top3) || []).filter((c) => c && (c.name || n(c.rating) !== null || n(c.count) !== null));
  const avg = (k) => mean(t3.map((c) => n(c[k])));
  const rate = (c) => (n(c.replied) !== null && n(c.sampled) ? n(c.replied) / n(c.sampled) : null);
  const checks = (c) => CHECKS.filter((k) => c && c.checks && c.checks[k]).length;
  const rows = [];
  const add = (key, you, them, ahead, youLabel, themLabel, extra = {}) => {
    const known = you !== null && them !== null;
    rows.push({ key, label: REPORT.top3.measures[key], you: youLabel, them: themLabel, read: known ? (ahead ? "ahead" : "behind") : null, ...extra });
  };
  const yr = n(b.rating), tr = avg("rating");
  add("rating", yr, tr, yr !== null && tr !== null && clean(yr) >= clean(tr) - 1e-9, yr !== null ? one(yr) : "", tr !== null ? one(tr) : "");
  const yc = n(b.count), tc = avg("count");
  add("count", yc, tc, yc !== null && tc !== null && yc >= Math.round(tc), yc !== null ? num(yc) : "", tc !== null ? num(tc) : "");
  const y9 = n(b.reviews90), t9 = avg("reviews90");
  add("reviews90", y9, t9, y9 !== null && t9 !== null && y9 >= t9 - 1e-9, y9 !== null ? whole(y9) : "", t9 !== null ? (Number.isInteger(t9) ? whole(t9) : one(t9)) : "");
  const yn = n(b.newestDays), tn = avg("newestDays");
  add("newest", yn, tn, yn !== null && tn !== null && yn <= tn + 1e-9, ageLabel(yn), ageLabel(tn));
  const yrr = rate(b), trr = mean(t3.map(rate));
  add("replies", yrr, trr, yrr !== null && trr !== null && yrr >= trr - 1e-9,
    yrr !== null ? `${whole(n(b.replied))} of ${whole(n(b.sampled))}` : "", trr !== null ? `${Math.round(trr * 30)} of 30` : "");
  // Profile: an item counts as "theirs" when at least two of the three show it
  const theirs = CHECKS.filter((k) => t3.filter((c) => c.checks && c.checks[k]).length >= 2);
  const missing = theirs.filter((k) => !(b.checks && b.checks[k]));
  const hasChecks = Boolean(b.checks) && t3.length > 0;
  add("profile", hasChecks ? checks(b) : null, hasChecks ? mean(t3.map(checks)) : null, missing.length === 0,
    hasChecks ? `${checks(b)} of 5` : "", hasChecks ? `${one(mean(t3.map(checks)))} of 5` : "", { missing });
  for (const r of rows) {
    const reads = REPORT.top3.reads[r.key];
    r.text = r.read ? fill(reads[r.read], { missing_items: listWords(r.missing ? r.missing.map((k) => REPORT.top3.profileChecks[k]) : []) }) : "";
  }
  return { rows, available: rows.some((r) => r.read), count: t3.length, averages: { rating: tr, count: tc, reviews90: t9, newestDays: tn, replyRate: trr } };
}

/** The GTM's top-three reading, suggested from the measures: none behind ahead, 1 to 2 even, 3 to 4 behind, 5 to 6 far. */
export function suggestCompare(top3) {
  const known = top3.rows.filter((r) => r.read);
  if (!known.length) return "unchecked";
  const behind = known.filter((r) => r.read === "behind").length;
  return behind === 0 ? "ahead" : behind <= 2 ? "even" : behind <= 4 ? "behind" : "far";
}

/** "a, b and c" */
export function listWords(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const SECTIONS = ["letter", "method", "service", "playbook"];
// The questions behind each step of the method, in the order "Today, from your answers" lists them
export const STEP_QUESTIONS = Object.fromEntries(SC.areas.map((a) => [a.key,
  [...SC.steps.filter((q) => q.kind === "scored" && q.area === a.key), ...SC.deepener.filter((q) => q.area === a.key)].map((q) => q.key)]));
const unfilled = (t) => String(t).replace(/\{\w+\}/g, "").replace(/\s{2,}/g, " ").trim();
/** "a", "a and b" stays readable with an "and" inside an item: "a, b, and c" */
const series = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`);

/** The whole model for one scorecard. links: { sharpen, results, report, pdf }. now: the report's date. options: the
 *  letter, the signature, the note and the sections (see the top of this file). */
export function buildReport(row, { links = {}, now = new Date(), checker, options = {} } = {}) {
  const sections = Object.fromEntries(SECTIONS.map((k) => [k, !(options.sections && options.sections[k] === false)]));
  const delivery = options.delivery || SITE.reportDelivery;
  const pd = row.public_data || {};
  const top3 = topThree(pd);
  const compare = pd.compare || suggestCompare(top3);
  const ev = evaluate(SC, row.answers || {}, row.deepener || null, { compare });
  const iw = ev.invisible;
  const service = (pd.search && pd.search.service) || ev.service;
  const city = (pd.search && pd.search.city) || row.city || "";
  const searchDate = (pd.search && pd.search.date) || isoDay(now);
  const shown = deepenerShown(SC, row.answers || {}).length;
  const answeredDeep = row.deepener ? Object.keys(row.deepener).length : 0;
  const answers = row.answers || {};
  const marketOpt = optionOf(SC, "market", answers.market);
  const stageOpt = optionOf(SC, SC.segmentKey || "stage", answers[SC.segmentKey || "stage"]);
  const gv = gapVars(iw);
  // The slower case (the playbook's own): the same plan with lease-up taking twice as long
  const slowerMonths = isNum(iw.fill) ? iw.fill * 2 : null;
  const slowerGap = isNum(iw.cost) && slowerMonths !== null && isNum(iw.reserves) ? iw.cost * Math.max(0, slowerMonths - iw.reserves) : null;
  const f = {
    business: row.company || "", city, service,
    first_name: row.first_name || "", last_name: row.last_name || "",
    market: marketOpt ? (answers.market === "other" ? "a market outside the presets" : answers.market === "undecided" ? "market not decided yet" : marketOpt.label) : (row.city || ""),
    stage: stageOpt ? stageOpt.label : "", deal: ev.service || "deal",
    date: longDate(now), search_date: longDate(parseDay(searchDate) || now),
    checker_first_name: checker || (row.report && row.report.checker) || SITE.defaultChecker || "",
    ...gv,
    unasked: iw.unasked !== null ? num(iw.unasked) : null, work_value: iw.workValue !== null ? money(iw.workValue) : null,
    slower_months: slowerMonths !== null ? months(slowerMonths) : null, slower_gap: slowerGap !== null ? money(slowerGap) : null,
    primary_bottleneck: areaName(SC, ev.bottleneck.primary),
    n_main: SC.steps.filter((st) => st.type === "choice").length,
    deepener_link: links.sharpen || "", booking_link: links.results ? `${links.results}#call` : ""
  };

  /* ---------- Your First Six Months: the lease-up gap (spec 1, section 4) ---------- */
  const IV = REPORT.invisible;
  const variant = IV[iw.kind] || IV.none;
  const inv = { kind: iw.kind, h: fill(variant.h, f), body: fill(variant.body, f), fill: iw.fill, reserves: iw.reserves, horizon: iw.horizon || 6 };
  if (isNum(iw.cost) || isNum(iw.fill) || isNum(iw.reserves)) {
    const B = IV.box;
    inv.box = [isNum(iw.cost) ? fill(B.cost, f) : null, isNum(iw.fill) ? fill(B.fill, f) : null, isNum(iw.reserves) ? fill(B.reserves, f) : null,
      iw.kind === "gap" ? fill(B.gap, f) : isNum(iw.exposure) ? fill(B.exposure, f) : null, isNum(iw.cost) ? B.low : null].filter(Boolean);
  }
  if (slowerGap !== null) inv.slower = { title: IV.slowerTitle, text: fill(slowerGap > 0 ? IV.slower : IV.slowerCovered, f) };
  inv.means = IV.means;
  inv.strip = isNum(iw.fill) ? { label: IV.strip, legend: IV.legend } : null;

  /* ---------- Three checks RoomIQ can't do for you (content/checks.mjs) ---------- */
  const K = REPORT.checks;
  const dz = row.deepener && row.deepener.zoning, df = row.deepener && row.deepener.financing;
  const statusOf = (map, v) => (v && map[v] ? { mark: map[v].mark, label: K.status.labels[map[v].mark], text: map[v].t } : { mark: "todo", label: K.status.labels.todo, text: K.status.noAnswer });
  const mk = answers.market || "other";
  const checks = K ? {
    title: K.title, lead: K.lead, notAdvice: K.notAdvice,
    items: [
      { key: "zoning", title: K.zoning.title, body: K.zoning.byMarket[mk] || K.zoning.byMarket.other, ask: K.zoning.ask, note: K.zoning.asOf, status: statusOf(K.status.zoning, dz) },
      { key: "financing", title: K.financing.title, body: K.financing.body, ask: K.financing.ask, status: statusOf(K.status.financing, df) },
      { key: "insurance", title: K.insurance.title, body: [K.insurance.body, (K.insurance.byMarket && K.insurance.byMarket[mk]) || ""].filter(Boolean).join(" "), ask: K.insurance.ask, status: null }
    ]
  } : null;
  const b = pd.business || {};
  const reviews90 = n(b.reviews90);
  const t3r90 = top3.averages.reviews90;

  /* ---------- Next to the Top Three ---------- */
  const themes = (pd.themes || []).filter((t) => t && String(t.theme || "").trim() && n(t.count));
  const cushion = starCushion(n(b.rating), n(b.count));
  const T = REPORT.top3;
  const top = {
    h: fill(T.h, f), intro: fill(T.intro, f), rows: top3.rows, available: top3.available,
    youHead: fill(T.columns.you, f),
    themes: themes.length ? themes.map((t) => fill(T.themesFound, { theme_count: n(t.count), theme: String(t.theme).trim() })) : top3.available ? [T.themesNone] : [],
    cushion: cushion ? fill(cushion.kind === "above" ? T.cushionAbove : T.cushionBelow, cushion) : null,
    cushionKind: cushion && cushion.kind,
    footnote: fill(T.footnote, f)
  };

  /* ---------- Your Overall Score ---------- */
  const O = REPORT.overall;
  // The uncovered months name the urgency only when there are some (a covered plan's urgency comes from Rent Evidence)
  const counted = isNum(iw.unasked) && iw.unasked > 0;
  const urgencyText = ev.bottleneck.maintenance ? null
    : ev.urgency === "critical" ? fill(counted ? O.urgency.critical : O.urgency.criticalUnknown, f)
    : ev.urgency === "significant" ? fill(counted ? O.urgency.significant : O.urgency.significantUnknown, f)
    : O.urgency.moderate;
  const overall = {
    paragraph: O.paragraph,
    deepenerNote: ev.deepened ? fill(O.deepenerYes, { n: answeredDeep }) : shown ? fill(O.deepenerNo, { ...f, n: shown }) : null,
    deepenerLink: !ev.deepened && shown && f.deepener_link ? f.deepener_link : null,
    interpretation: fill(O.interpretation[ev.tier], f),
    urgency: urgencyText
  };

  /* ---------- The strongest and the weakest areas ---------- */
  const primary = ev.bottleneck.primary;
  let strongest = ev.strongest;
  if (strongest === primary) {
    const rest = SC.strongOrder.filter((k) => k !== primary);
    strongest = rest.sort((a, z) => ev.areas[z].exact - ev.areas[a].exact || SC.strongOrder.indexOf(a) - SC.strongOrder.indexOf(z))[0];
  }
  const low = REPORT.low[primary];
  const weakest = {
    area: primary,
    h: ev.bottleneck.maintenance ? low.refinement : low.h,
    refinement: ev.bottleneck.maintenance,
    urgency: urgencyText,
    cascade: ev.bottleneck.cascadeLine || null,
    means: low.means,
    next: low.next,
    // A bullet whose number is unknown, or a gap of nothing, gives way to the area's bulletNoCount (or is left out)
    impact: { lead: low.impact.lead, bullets: low.impact.bullets.map((x) => {
      const out = fill(x, f);
      const empty = /\{\w+\}/.test(out) || (x.includes("{gap}") && !(isNum(iw.workValue) && iw.workValue > 0));
      return empty ? low.impact.bulletNoCount || null : out;
    }).filter(Boolean) },
    quickWins: ev.quickWins,
    // The rule note only when the quick wins don't already carry the flag (checklistFlag puts it first): never twice on a page
    ruleNote: ev.ruleFlag && !ev.quickWins.some((q) => q.flag) ? REPORT.low.ruleNote : null
  };

  /* ---------- The playbook's dynamic lines and the final page ---------- */
  const booking = row.booking && row.booking.day ? { day: dayLabel(row.booking.day), window: ((windowOf(SITE.booking, row.booking.window) || {}).label || "").toLowerCase() } : null;
  const notesByArea = {};
  for (const note of ev.notes.report) (notesByArea[note.area] ||= []).push(note.text);
  for (const q of ev.quickWins) if (!q.check) (notesByArea[q.area] ||= []).push(q.text.endsWith(".") ? q.text : `${q.text}.`);
  const P = PLAYBOOK.next;
  const next = {
    boxBody: fill(P.boxBody, f),
    fitLine: ev.callOnly ? P.fit.callOnly : P.fit[primary],
    booked: booking ? fill(P.booked, booking) : null,
    bookingLink: f.booking_link
  };

  /* ---------- The letter, and what comes next in the instant delivery ---------- */
  const L = METHOD.letter;
  const lf = { ...f, profile_clause: top3.available ? L.profileClause : "" };
  const letterBody = String(options.letter || "").trim()
    ? String(options.letter).trim().split(/\n\s*\n/).map((p) => unfilled(fill(p.replace(/\s*\n\s*/g, " "), lf))).filter(Boolean)
    : L.body.map((p) => fill(p, lf));
  const signer = options.signer || {};
  const letter = sections.letter ? {
    title: L.title,
    body: letterBody,
    note: String(options.note || "").trim() ? { title: fill(L.noteTitle, f), body: String(options.note).trim().split(/\n\s*\n/).map((p) => unfilled(fill(p.replace(/\s*\n\s*/g, " "), lf))).filter(Boolean) } : null,
    sign: signer.name ? fill(signer.title ? L.signedTitle : L.signed, { name: signer.name, title: signer.title }) : L.signoff
  } : null;
  // The update with outside data (site.enrichment): promised only where a person will add it
  const coming = SITE.enrichment !== false && delivery === "instant" && !top3.available ? { title: METHOD.coming.title, body: fill(METHOD.coming.body, f) } : null;

  /* ---------- The Visible Work Method ---------- */
  const all = { ...(row.answers || {}), ...(row.deepener || {}) };
  const MI = METHOD.intro, G = METHOD.gap;
  const chipOf = (k) => (k === primary && !ev.bottleneck.maintenance ? "fix" : ev.areas[k].band);
  const steps = SC.strongOrder.map((k) => {
    const st = METHOD.steps[k];
    const today = STEP_QUESTIONS[k].filter((q) => all[q] !== undefined && G.today[q] && G.today[q][all[q]]).map((q) => G.today[q][all[q]]);
    // Outside data would add lines here (the template's public profile); this funnel has none
    const profile = [];
    return {
      key: k, n: st.n, t: st.t, name: areaName(SC, k), color: (SC.areas.find((a) => a.key === k) || {}).color,
      standard: st.standard, service: st.service, score: ev.areas[k].score, band: ev.areas[k].band,
      chip: chipOf(k), chipLabel: G.chips[chipOf(k)], first: k === primary && !ev.bottleneck.maintenance, today, profile
    };
  });
  const method = sections.method ? {
    intro: { ...MI },
    steps,
    gap: { kicker: G.kicker, h1: fill(G.h1, f), lead: G.lead, step: G.step, columns: G.columns, fromProfile: G.fromProfile }
  } : null;

  /* ---------- Two ways to run it, and the first 30 days with the service ---------- */
  const D = METHOD.days;
  const daysLines = [];
  // Call-only (more than ten houses): the walkthrough first
  if (ev.callOnly) daysLines.push(D.paper);
  else daysLines.push(fill(D.yourStart, { ...f, fit_line: PLAYBOOK.next.fit[primary] }).trim());
  const servicePages = sections.service ? {
    ways: METHOD.ways,
    days: { kicker: D.kicker, h1: D.h1, lead: fill(D.lead, f), phases: D.phases, yourStart: daysLines, monthlyTitle: D.monthlyTitle, monthly: D.monthly,
      cta: booking ? fill(D.ctaBooked, { ...booking, business: f.business }) : fill(D.cta, f), booked: Boolean(booking), bookingLink: f.booking_link }
  } : null;

  /* ---------- The overview's last sentences follow the pages present ---------- */
  const O2 = METHOD.overview;
  const items = [O2.items.areas, sections.method ? O2.items.method : null, sections.service ? O2.items.service : null, sections.playbook ? O2.items.playbook : null].filter(Boolean);
  const nextSentences = `${top3.available ? O2.nextTop3 : O2.nextNoTop3} ${fill(O2.then, { items: series(items) })}`;
  const overviewIntro = fill(REPORT.overview.intro, f).replace(/ Next come[\s\S]*$/, ` ${nextSentences}`);

  return {
    fields: f,
    sections,
    delivery,
    letter,
    coming,
    method,
    service: servicePages,
    result: ev,
    compare,
    compareSuggested: suggestCompare(top3),
    areas: SC.areas.map((a) => ({ key: a.key, name: a.name, color: a.color, description: a.description, score: ev.areas[a.key].score, band: ev.areas[a.key].band, notes: ev.notes.report.filter((x) => x.area === a.key).map((x) => x.text) })),
    cover: {
      title: REPORT.cover.title,
      subtitle: fill(REPORT.cover.subtitle, f),
      prepared: fill(f.last_name ? REPORT.cover.prepared : REPORT.cover.preparedNoLast, f),
      date: f.date,
      checked: f.checker_first_name ? fill(REPORT.cover.checked, f) : null
    },
    overview: { ...REPORT.overview, intro: overviewIntro },
    invisible: inv,
    checks,
    top3: top,
    enrichment: SITE.enrichment !== false,
    overall,
    strongest: { area: strongest, ...REPORT.high[strongest] },
    weakest,
    yourStart: fill(PLAYBOOK.start.yourStart, f),
    notesByArea,
    // The tracker's starting point: each area's score as a 1 to 5 rating (0 -> 1, 25 -> 2, 50 -> 3, 75 -> 4, 100 -> 5)
    startRatings: Object.fromEntries(SC.areas.map((a) => [a.key, Math.min(5, Math.max(1, Math.round(ev.areas[a.key].exact / 25) + 1))])),
    next,
    deepened: ev.deepened,
    deepenerShown: shown
  };
}

export function isoDay(d) {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
/** "November 23, 2026" */
export function longDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
