/* The Invisible Work Scorecard. Built by tools/build.mjs from lib/scoring.mjs, lib/booking.mjs, lib/icons.mjs, lib/quiz-markup.mjs, lib/source.mjs and src/js/app.js. */
(function () {
// The scoring engine for the Invisible Work Scorecard (Deliverable 1): which answers are valid, which deepener
// questions show, the four area scores, the Visibility Score and tier, the invisible work number, the urgency, the
// bottleneck (with the cascade rule), the quick wins, the rule flag, the notes, fit, routing and the GTM gap score.
//
// Pure functions over content/scorecard.mjs: no imports, no state, no clock. One file for both sides: the server
// imports it (api/scorecard.mjs scores again, so nothing stored or sent trusts the browser), and the build inlines it
// into the page's script (tools/build.mjs drops the `export` keywords), so the score on screen and the score stored can
// never disagree. Keep it to `export function` and `export const` declarations with no imports.

/** Float noise off (0.1 + 0.2), so 37.5 stays 37.5 before rounding and comparing. */
function clean(x) {
  return Math.round(x * 1e9) / 1e9;
}

/** Rounded half up to a whole number (37.5 -> 38, 12.5 -> 13), as section 3 asks. */
function roundHalfUp(x) {
  return Math.floor(clean(x) + 0.5);
}

/** Every choice question of the hero: the choice steps, and the choice inside the business step (Google profiles). */
function heroChoices(sc) {
  const out = [];
  for (const s of sc.steps) {
    if (s.type === "choice") out.push({ key: s.key, options: s.options, step: s });
    else if (s.choice) out.push({ key: s.choice.key, options: s.choice.options, step: s });
  }
  return out;
}

/** The scored questions of the hero (Q1 to Q4) and of the deepener (D1 to D8). */
function scoredQuestions(sc) {
  return sc.steps.filter((s) => s.kind === "scored").concat(sc.deepener);
}

/** The question (hero choice, profiles, or deepener) with this key, or null. */
function questionOf(sc, key) {
  const h = heroChoices(sc).find((c) => c.key === key);
  if (h) return h.step.type === "choice" ? h.step : { key, options: h.options, q: h.step.choice.label };
  return sc.deepener.find((d) => d.key === key) || null;
}

/** The option with value v for question key, or null. */
function optionOf(sc, key, v) {
  const q = questionOf(sc, key);
  return (q && q.options.find((o) => o.v === v)) || null;
}

/** Keeps only hero answers that are one of the question's own options; lists the questions left unanswered. */
function cleanHero(sc, raw) {
  const answers = {};
  const missing = [];
  for (const c of heroChoices(sc)) {
    const v = raw && typeof raw[c.key] === "string" ? raw[c.key] : "";
    if (c.options.some((o) => o.v === v)) answers[c.key] = v;
    else missing.push(c.key);
  }
  return { answers, missing };
}

/** Whether a deepener question shows, given the hero answers (section 10: Q1 All 10 hides D1; Q2 "We don't really
 *  ask" hides D3 and D4; Q4 Never hides D8). */
function isShown(question, answers) {
  if (!question.hideIf) return true;
  return !Object.entries(question.hideIf).some(([k, values]) => values.includes(answers[k]));
}

/** The deepener questions this visitor sees, in order. */
function deepenerShown(sc, answers) {
  return sc.deepener.filter((d) => isShown(d, answers));
}

/** Keeps the deepener answers that are valid and shown; a hidden question's answer is dropped (a skip never counts). */
function cleanDeepener(sc, answers, raw) {
  const deepener = {};
  const missing = [];
  for (const d of deepenerShown(sc, answers)) {
    const v = raw && typeof raw[d.key] === "string" ? raw[d.key] : "";
    if (d.options.some((o) => o.v === v)) deepener[d.key] = v;
    else missing.push(d.key);
  }
  return { deepener, missing };
}

/** The four area scores. Per question: points (0 to 4) x weight. Per area: the sum over the questions shown and
 *  answered, divided by the area's maximum for those same questions, x 100 (section 3). Skipped and unanswered
 *  questions leave both the score and the maximum. With no deepener, each area is its one 3x hero question. */
function areaScores(sc, answers, deepener) {
  const all = Object.assign({}, answers, deepener || {});
  const out = {};
  for (const a of sc.areas) {
    let earned = 0, max = 0;
    const used = [];
    for (const q of scoredQuestions(sc)) {
      if (q.area !== a.key) continue;
      const isDeep = sc.deepener.includes(q);
      if (isDeep && (!deepener || !isShown(q, answers))) continue;
      const o = optionOf(sc, q.key, all[q.key]);
      if (!o) continue;
      earned += o.points * q.weight;
      max += sc.maxPoints * q.weight;
      used.push(q.key);
    }
    const exact = max ? clean((earned / max) * 100) : 0;
    out[a.key] = { key: a.key, name: a.name, earned, max, exact, score: roundHalfUp(exact), band: bandOf(sc, exact).key, used };
  }
  return out;
}

/** The Visibility Score: the average of the four unrounded area scores, rounded half up at the end. */
function visibilityOf(sc, areas) {
  const exact = clean(sc.areas.reduce((s, a) => s + areas[a.key].exact, 0) / sc.areas.length);
  return { exact, score: roundHalfUp(exact) };
}

/** The tier for a Visibility Score. */
function tierOf(sc, score) {
  return sc.tiers.find((t) => score >= t.min && score <= t.max) || sc.tiers[0];
}

/** Low, medium or high for an area score (the area cards' variants). */
function bandOf(sc, score) {
  const s = roundHalfUp(score);
  return sc.bands.find((b) => s >= b.min && s <= b.max) || sc.bands[0];
}

/* =====================================================================================================================
   PROJECT HOOK: the cost-of-inaction metric. This is the one function most projects rewrite (with the matching
   "invisible" copy in content/results.mjs and content/report.mjs): it turns a few gateway answers into the number the
   result leads with. It returns { kind, ...fields }: kind picks the copy variant, the fields fill its placeholders.
   The skill's reference 03-scorecard-playbook.md has a library of metric patterns.
   ===================================================================================================================== */

/** The invisible work (section 4). jobs x 50 weeks x (10 - asked) / 10, rounded down to the nearest 10; times the
 *  ticket, rounded down to the nearest $1,000. Which variant the screen shows is `kind`:
 *  known (count, value, math line), average (value at the Angi average), count (count only), all (every customer is
 *  asked: no number), unsure (asked not sure: no number), jobsUnsure (jobs not sure: no number). */
function invisibleOf(sc, answers) {
  const t = sc.invisible;
  const jobs = answers.jobs in t.jobs ? t.jobs[answers.jobs] : null;
  const asked = answers.asked10 in t.asked ? t.asked[answers.asked10] : null;
  let ticket = answers.ticket in t.ticket ? t.ticket[answers.ticket] : null;
  let ticketFrom = ticket !== null ? "band" : null;
  if (ticket === null && answers.ticket === "unsure") {
    const avg = t.averageTicket[answers.trade];
    if (typeof avg === "number") { ticket = avg; ticketFrom = "average"; }
  }
  const base = { jobs, asked, notAsked: asked === null ? null : 10 - asked, ticket, ticketFrom, unasked: null, workValue: null };
  if (asked === 10) return Object.assign(base, { kind: "all" });
  if (asked === null) return Object.assign(base, { kind: "unsure" });
  if (jobs === null) return Object.assign(base, { kind: "jobsUnsure" });
  const unasked = Math.floor((jobs * t.weeks * (10 - asked)) / 10 / 10) * 10;
  if (ticket === null) return Object.assign(base, { kind: "count", unasked });
  const workValue = Math.floor((unasked * ticket) / 1000) * 1000;
  return Object.assign(base, { kind: ticketFrom === "average" ? "average" : "known", unasked, workValue });
}

/** Urgency (section 11), applied to the primary bottleneck: critical, significant or moderate. It reads one area (the
 *  urgency area, sc.urgency.area, the first area by default) and the metric's count (sc.urgency.countField, "unasked"
 *  by default): the area at moderateAt or above is always moderate; else the count against critical and significant;
 *  with no count, the area at criticalAt or below is critical, otherwise unknownDefault. */
function urgencyOf(sc, invisible, areaScore) {
  const u = sc.urgency;
  const cov = clean(areaScore);
  const moderateAt = u.moderateAt !== undefined ? u.moderateAt : u.moderateCoverage;
  const criticalAt = u.criticalAt !== undefined ? u.criticalAt : u.criticalCoverage;
  const count = invisible[u.countField || "unasked"];
  if (cov >= moderateAt) return "moderate";
  if (typeof count === "number") {
    if (count >= u.critical) return "critical";
    if (count >= u.significant) return "significant";
    return "moderate";
  }
  if (invisible.kind === "all") return "moderate";
  if (cov <= criticalAt) return "critical";
  return u.unknownDefault;
}

/** The areas ranked lowest first; ties go upstream first (Ask Coverage, Ask System, Replies, Freshness). */
function rankAreas(sc, areas) {
  return sc.tieOrder.slice().sort((a, b) => areas[a].exact - areas[b].exact || sc.tieOrder.indexOf(a) - sc.tieOrder.indexOf(b));
}

/** The bottleneck (section 12): the lowest area is the primary, the next the secondary. The cascade (sc.cascade, optional:
 *  { effect, causes }): an area that is a symptom of others (for Rempo, Freshness follows from asking) is never the
 *  thing to fix while one of its causes is under strongAt; the lowest such cause becomes the primary (ties: the first in
 *  causes), and the effect is reported as its effect. Every area at strongAt or higher: no bottleneck, "maintenance",
 *  and the lowest area is the next refinement. */
function bottleneckOf(sc, areas) {
  const ranking = rankAreas(sc, areas);
  const maintenance = sc.areas.every((a) => areas[a.key].exact >= sc.strongAt);
  let primary = ranking[0];
  let cascade = null;
  const cs = sc.cascade;
  if (!maintenance && cs && primary === cs.effect && cs.causes.some((k) => areas[k] && areas[k].exact < sc.strongAt)) {
    const cause = cs.causes.filter((k) => areas[k]).reduce((best, k) => (areas[k].exact < areas[best].exact ? k : best));
    cascade = { effect: cs.effect, cause };
    primary = cause;
  }
  const secondary = ranking.find((k) => k !== primary);
  return { primary, secondary, cascade, maintenance, ranking };
}

/** The strongest area: the highest score; ties in report order (Ask Coverage, Ask System, Freshness, Replies). */
function strongestOf(sc, areas) {
  return sc.strongOrder.slice().sort((a, b) => areas[b].exact - areas[a].exact || sc.strongOrder.indexOf(a) - sc.strongOrder.indexOf(b))[0];
}

/** Which fix-first line shows: "none" when every area is strong; else a line variant (sc.lineVariants: [{ area, key,
 *  when: { questionKey: [values] } }], for Rempo Ask System's "requests go out, but nobody runs them") when its answers
 *  match; else the primary area's own line. */
function bottleneckLineKey(sc, bottleneck, answers) {
  if (bottleneck.maintenance) return "none";
  const variant = (sc.lineVariants || []).find((v) => v.area === bottleneck.primary && Object.entries(v.when).some(([k, values]) => values.includes(answers[k])));
  return variant ? variant.key : bottleneck.primary;
}

/** The quick wins (section 12, steps 3 and 4). The rule flag first; then, in question order, every 3x or 2x question
 *  scored 0 or 1 in the primary area, then in the secondary area, then any 1x question scored 0 or 1; then, only if
 *  fewer than three, any other answer the table words as a quick win (Q2 techs, D7 within a week, D8 standard
 *  replies). Three at most, never the same words twice. When every area is strong, the quick wins become checks. */
function quickWinsOf(sc, answers, deepener, bottleneck) {
  const n = sc.quickWinCount;
  if (bottleneck.maintenance) {
    return bottleneck.ranking.slice(0, n).map((area) => ({ area, key: null, v: null, text: sc.checks[area], check: true }));
  }
  const all = Object.assign({}, answers, deepener || {});
  const out = [];
  const seen = new Set();
  const push = (q, flag) => {
    if (out.length >= n || !q) return;
    const text = sc.quickWins[q.key] && sc.quickWins[q.key][all[q.key]];
    if (!text || seen.has(text)) return;
    const o = optionOf(sc, q.key, all[q.key]);
    seen.add(text);
    out.push({ area: q.area, key: q.key, v: all[q.key], text, weight: q.weight, points: o ? o.points : null, ...(flag ? { flag: true } : {}) });
  };
  const live = scoredQuestions(sc).filter((q) => {
    const isDeep = sc.deepener.includes(q);
    if (isDeep && (!deepener || !isShown(q, answers))) return false;
    return Boolean(optionOf(sc, q.key, all[q.key]));
  });
  const points = (q) => optionOf(sc, q.key, all[q.key]).points;
  const rf = sc.ruleFlag;
  if (deepener && deepener[rf.key] === rf.v) push(live.find((q) => q.key === rf.key), true);
  for (const q of live) if (q.area === bottleneck.primary && q.weight >= 2 && points(q) <= 1) push(q);
  for (const q of live) if (q.area === bottleneck.secondary && q.weight >= 2 && points(q) <= 1) push(q);
  for (const q of live) if (q.weight === 1 && points(q) <= 1) push(q);
  const byArea = [bottleneck.primary, bottleneck.secondary].concat(bottleneck.ranking);
  for (const area of byArea) for (const q of live) if (q.area === area) push(q);
  return out;
}

/** True when the rule flag is set (D1 = "Customers who seemed happy"). */
function ruleFlagOf(sc, deepener) {
  return Boolean(deepener && deepener[sc.ruleFlag.key] === sc.ruleFlag.v);
}

/** The notes the answers add: to the report (by area) and to the call. */
function notesOf(sc, answers, deepener) {
  const all = Object.assign({}, answers, deepener || {});
  const report = [];
  const call = [];
  for (const [key, byValue] of Object.entries(sc.notes.report)) {
    const n = byValue[all[key]];
    if (n) report.push({ key, v: all[key], area: n.area, text: n.text });
  }
  for (const [key, byValue] of Object.entries(sc.notes.call)) {
    const t = byValue[all[key]];
    if (t) call.push({ key, v: all[key], text: t });
  }
  return { report, call };
}

/** What Meta is told: "qualified", or the first fit rule the answers meet. */
function fitOf(sc, answers) {
  for (const rule of sc.fit) {
    if (Object.entries(rule.when).some(([k, values]) => values.includes(answers[k]))) return rule.key;
  }
  return sc.qualifiedFit;
}

/** Routing: a call with no checkout link for paper or spreadsheets, or 3 or more Google profiles. */
function routeOf(sc, answers) {
  for (const [k, values] of Object.entries(sc.callOnly)) {
    if (values.includes(answers[k])) return { callOnly: true, why: k };
  }
  return { callOnly: false, why: null };
}

/** The GTM gap score (higher means a bigger gap), kept in the background and never shown. compare is the top-three
 *  reading filled from the report (ahead, even, behind, far), "unchecked" until then. */
function gtmGapScoreOf(sc, answers, compare) {
  const g = sc.gtm;
  if (!g) return null;
  const c = compare && compare in g.compare ? compare : "unchecked";
  const parts = [g.asks[answers.asks], g.newest[answers.newest], g.replies[answers.replies], g.jobs[answers.jobs], g.compare[c]];
  return parts.reduce((s, p) => s + (typeof p === "number" ? p : 0), 0);
}

/** The verdict line for the call notes: "Your biggest gap is your Ask System: ... This is the first thing to fix, this month." */
function verdictOf(sc, bottleneck, lineKey, urgency) {
  if (bottleneck.maintenance) return sc.verdict.maintenance;
  const area = sc.areas.find((a) => a.key === bottleneck.primary);
  const why = sc.verdict[lineKey] || sc.verdict[bottleneck.primary];
  return `Your biggest gap is your ${area.name}: ${why}. ${sc.urgency.words[urgency]}`;
}

/** Everything the screen, the email, the report and the call need, from the answers. Without a deepener this is the
 *  on-screen result (each area is its one hero question); with one, the report's (section 3: "Updated with your 8 extra
 *  answers"). ok is false when a hero question is unanswered. */
function evaluate(sc, raw, rawDeepener, opts) {
  const { answers, missing } = cleanHero(sc, raw);
  const dp = rawDeepener ? cleanDeepener(sc, answers, rawDeepener) : null;
  const deepener = dp && Object.keys(dp.deepener).length ? dp.deepener : null;
  const areas = areaScores(sc, answers, deepener);
  const vis = visibilityOf(sc, areas);
  const tier = tierOf(sc, vis.score);
  const invisible = invisibleOf(sc, answers);
  const bottleneck = bottleneckOf(sc, areas);
  const urgency = urgencyOf(sc, invisible, areas[(sc.urgency && sc.urgency.area) || sc.areas[0].key].exact);
  const lineKey = bottleneckLineKey(sc, bottleneck, answers);
  const route = routeOf(sc, answers);
  const fit = fitOf(sc, answers);
  // The segment question (sc.segmentKey: for Rempo the trade) names the service in the copy ("HVAC in Austin")
  const segKey = sc.segmentKey || "trade";
  const trade = optionOf(sc, segKey, answers[segKey]);
  const notes = notesOf(sc, answers, deepener);
  return {
    ok: missing.length === 0,
    missing,
    answers,
    deepener,
    deepened: Boolean(deepener),
    deepenerMissing: dp ? dp.missing : null,
    areas,
    score: vis.score,
    scoreExact: vis.exact,
    tier: tier.key,
    tierName: tier.name,
    tierDescriptor: tier.descriptor,
    invisible,
    urgency,
    bottleneck: Object.assign({}, bottleneck, { lineKey, line: sc.bottleneckLines[lineKey] }),
    strongest: strongestOf(sc, areas),
    quickWins: quickWinsOf(sc, answers, deepener, bottleneck),
    ruleFlag: ruleFlagOf(sc, deepener),
    notes,
    verdict: verdictOf(sc, bottleneck, lineKey, urgency),
    fit,
    qualified: fit === sc.qualifiedFit,
    callOnly: route.callOnly,
    why: route.why,
    trade: answers[segKey] || null,
    service: trade && trade.service ? trade.service : sc.defaultService || "",
    gtmGapScore: gtmGapScoreOf(sc, answers, opts && opts.compare)
  };
}

/** The area's display name. */
function areaName(sc, key) {
  const a = sc.areas.find((x) => x.key === key);
  return a ? a.name : key;
}

/** Fills {name} placeholders from vars; unknown names are left as they are. */
function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

/** 168000 -> "$168,000". */
function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** 1560 -> "1,560". */
function num(n) {
  return Math.round(n).toLocaleString("en-US");
}

// The call step's rules (the Meta page's booking, lib/gapcheck.mjs there): the next few weekdays from tomorrow, never the
// same day, no weekends; three time windows in the visitor's own time; a US phone number. Pure functions over
// content/site.mjs's booking settings; inlined into the page's script by the build, imported by the server.
// Keep it to `export function` declarations with no imports.

/** "2026-11-10" for a date, in its own (local) calendar. */
function isoDay(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The call days on offer: the next `days` weekdays, starting tomorrow. Labels like "Tue, Nov 10". */
function bookingDays(booking, now) {
  const out = [];
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (out.length < booking.days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w === 0 || w === 6) continue;
    out.push({ v: isoDay(d), label: `${DOW[w]}, ${MON[d.getMonth()]} ${d.getDate()}` });
  }
  return out;
}

/** The label for a stored day ("2026-11-10" to "Tue, Nov 10"), or the value itself if it is not a date. */
function dayLabel(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  if (!m) return String(v || "");
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

/** True when day is a weekday from tomorrow to `maxAhead` days out, as seen from `now` (the server allows a day either
 *  side for time zones: today counts, since it may already be tomorrow where the visitor is). */
function dayAllowed(day, now, maxAhead) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isoDay(d) !== day) return false;
  const w = d.getDay();
  if (w === 0 || w === 6) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((d - today) / 86400000);
  return diff >= 0 && diff <= maxAhead;
}

/** The booking window with value v, or null. */
function windowOf(booking, v) {
  return booking.windows.find((w) => w.v === v) || null;
}

/** US phone digits: 10 digits, or 11 starting with 1. Returns the 10 digits, or "" when it is not a US number. */
function usPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return d.slice(1);
  return d.length === 10 ? d : "";
}

/** "(512) 555-0134" */
function phoneLabel(d) {
  const p = usPhone(d);
  return p ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : String(d || "");
}

/** An .ics calendar file for the call: the window's start and end on that day, floating local time (the visitor's). */
function icsFor({ day, window, title, body, uid, org = "Scorecard", host = "scorecard" }) {
  const d = String(day).replace(/-/g, "");
  const t = (h) => `${String(h).padStart(2, "0")}0000`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escIcs = (s) => String(s).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${String(org).replace(/[^\w .-]/g, "")}//Scorecard//EN`, "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${uid}@${String(host).replace(/[^\w.-]/g, "")}`, `DTSTAMP:${stamp}`, `DTSTART:${d}T${t(window.start)}`, `DTEND:${d}T${t(window.end)}`,
    `SUMMARY:${escIcs(title)}`, `DESCRIPTION:${escIcs(body)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

// The scorecard's icons and small graphics as inline SVG, drawn from the prompts in Deliverables 2 and 3: flat, two
// colours (the brand's ink for the main shapes, its accent for the highlights: PAL below), rounded, no gradients, no shadows,
// legible at 48 px. One set for the landing page, the results page, the report and the admin.
// Server-side and build-time only (the browser gets them already in the HTML, or as strings in its data).

// The drawings' colors, by role. usePalette(BRAND.colors) sets them from the brand (content/brand.mjs), on the server
// (lib/report-html.mjs) and in the page (src/js/app.js), so the icons, the houses, the donut and the months chart wear
// the brand's ink and accent. The defaults are the worked example's.
const PAL = { ink: "#0A1A33", accent: "#1F86FF", star: "#F9CE14", line: "#E8EFF9", line2: "#D3DFF1", ink300: "#B7C9E5", ink400: "#94ACD2", ink500: "#7990B5", signal: "#F5A524", chart: "#2A78D6" };
function usePalette(colors) {
  for (const k of Object.keys(PAL)) if (colors && typeof colors[k] === "string" && /^#[0-9a-f]{3,8}$/i.test(colors[k])) PAL[k] = colors[k];
}
// The areas' colors and names, from content/scorecard.mjs (areas[].color): useAreas(SC) fills them, on the server
// (lib/report-html.mjs) and in the page (src/js/app.js). Kept as objects so the bundled page script needs no import.
const AREA_COLORS = {};
const AREA_NAMES = {};
function useAreas(sc) {
  for (const a of sc.areas) { AREA_COLORS[a.key] = a.color; AREA_NAMES[a.key] = a.name; }
}

const svg = (body, label, size = 48) =>
  `<svg class="icn" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

/** A five-point star centred at (cx, cy). */
function starPath(cx, cy, R, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + "Z";
}

/** A gear: teeth around a ring, a hole in the middle (even-odd fill). */
function gearPath(cx, cy, outer, inner, hole, teeth) {
  let d = "";
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[a - step * 0.22, outer], [a + step * 0.22, outer], [a + step * 0.32, inner], [a + step * 0.68, inner]];
    for (const [ang, rad] of pts) d += `${d ? "L" : "M"}${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
  }
  d += "Z";
  d += `M${cx + hole} ${cy}A${hole} ${hole} 0 1 0 ${cx - hole} ${cy}A${hole} ${hole} 0 1 0 ${cx + hole} ${cy}Z`;
  return d;
}

/** The four category icons and the four utility icons. */
const ICONS = {
  // A simple house with a small star above its roof and a check mark on the door
  coverage: (s) => svg(
    `<path d="${starPath(24, 7.5, 5.2, 2.3)}" fill="${PAL.accent}"/>` +
    `<path d="M24 14.5 41.5 27H6.5Z" fill="${PAL.ink}" stroke="${PAL.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<rect x="10" y="26" width="28" height="17" rx="2.5" fill="${PAL.ink}"/>` +
    `<rect x="19" y="30.5" width="10" height="12.5" rx="2" fill="#fff"/>` +
    `<path d="M20.8 36.8l2.4 2.4 4.2-4.6" fill="none" stroke="${PAL.accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`, "Ask Coverage", s),
  // A gear with a paper plane leaving it to the upper right
  system: (s) => svg(
    `<path d="${gearPath(18.5, 29.5, 14.5, 11, 4.6, 8)}" fill="${PAL.ink}" fill-rule="evenodd"/>` +
    `<path d="M28.5 15.6 45.2 4.8 39.6 21.4 35 17.2Z" fill="${PAL.accent}"/>` +
    `<path d="M35 17.2 45.2 4.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`, "Ask System", s),
  // A calendar page with one square filled and a small star in it
  freshness: (s) => {
    let cells = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 11 + c * 7, y = 21 + r * 6.4;
      cells += r === 1 && c === 2
        ? `<rect x="${x - 0.6}" y="${y - 0.6}" width="6.4" height="5.6" rx="1.4" fill="${PAL.accent}"/><path d="${starPath(x + 2.6, y + 2.25, 2.3, 1)}" fill="#fff"/>`
        : `<rect x="${x}" y="${y}" width="5.2" height="4.4" rx="1.1" fill="#fff" opacity=".92"/>`;
    }
    return svg(`<rect x="15" y="5" width="3.4" height="9" rx="1.7" fill="${PAL.ink}"/><rect x="29.6" y="5" width="3.4" height="9" rx="1.7" fill="${PAL.ink}"/>` +
      `<rect x="7" y="9.5" width="34" height="33" rx="4.5" fill="${PAL.ink}"/>` + cells, "Freshness", s);
  },
  // A speech bubble with a check mark inside, a smaller bubble behind it
  replies: (s) => svg(
    `<path d="M24 6h14a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-1v4l-5-4h-8a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5Z" fill="${PAL.accent}"/>` +
    `<path d="M11 14h18a6.5 6.5 0 0 1 6.5 6.5v8A6.5 6.5 0 0 1 29 35H17l-7 6v-6.3A6.5 6.5 0 0 1 4.5 28.5v-8A6.5 6.5 0 0 1 11 14Z" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6"/>` +
    `<path d="M13 24.6l4.4 4.4 8.6-8.6" fill="none" stroke="${PAL.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`, "Replies", s),
  // A stopwatch with the hand at one minute
  "u-minute": (s) => svg(
    `<rect x="20.5" y="3.5" width="7" height="4.5" rx="1.6" fill="${PAL.ink}"/><rect x="35.5" y="9.2" width="4.4" height="4.4" rx="1.2" transform="rotate(45 37.7 11.4)" fill="${PAL.ink}"/>` +
    `<circle cx="24" cy="27" r="17" fill="${PAL.ink}"/><circle cx="24" cy="27" r="12.6" fill="#fff"/>` +
    `<path d="M24 27V16.4" stroke="${PAL.accent}" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="27" r="2.6" fill="${PAL.ink}"/>`, "About a minute", s),
  // A price tag with a zero on it
  "u-free": (s) => svg(
    `<path d="M6 9.5A3.5 3.5 0 0 1 9.5 6h12.2a3.5 3.5 0 0 1 2.5 1l16.6 16.6a3.5 3.5 0 0 1 0 5L28.6 40.8a3.5 3.5 0 0 1-5 0L7 24.2a3.5 3.5 0 0 1-1-2.5Z" fill="${PAL.ink}"/>` +
    `<circle cx="14" cy="14" r="3" fill="#fff"/><ellipse cx="26.4" cy="25.8" rx="4.4" ry="6" transform="rotate(-45 26.4 25.8)" fill="none" stroke="${PAL.accent}" stroke-width="3"/>`, "Free", s),
  // A donut chart three quarters filled, with a small spark at the end of the arc
  "u-score": (s) => svg(
    `<circle cx="24" cy="26" r="15" fill="none" stroke="${PAL.ink}" stroke-width="7" opacity=".18"/>` +
    `<path d="M24 11a15 15 0 1 1-15 15" fill="none" stroke="${PAL.ink}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M9 12.5l1.3 3.2 3.2 1.3-3.2 1.3L9 21.5l-1.3-3.2-3.2-1.3 3.2-1.3Z" fill="${PAL.accent}"/>`, "Score right away", s),
  // A clipboard with a small bar chart and an envelope tucked behind it
  "u-report": (s) => svg(
    `<rect x="22" y="22" width="22" height="16" rx="2.5" fill="${PAL.accent}"/><path d="M22.8 23.5 33 31l10.2-7.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<rect x="6" y="7" width="24" height="34" rx="3.5" fill="${PAL.ink}"/><rect x="12.5" y="4" width="11" height="6" rx="2" fill="${PAL.ink}" stroke="#fff" stroke-width="1.4"/>` +
    `<rect x="10" y="13" width="16" height="24" rx="1.6" fill="#fff"/>` +
    `<rect x="12.5" y="27" width="3" height="7" rx=".8" fill="${PAL.accent}"/><rect x="16.8" y="22" width="3" height="12" rx=".8" fill="${PAL.accent}"/><rect x="21.1" y="18" width="3" height="16" rx=".8" fill="${PAL.accent}"/>`, "Report by email", s)
};

/** An area's icon: its own drawing when ICONS has one (the worked example's four), else a neutral one: the area's
 *  initial on a tint of its color, so a new project's areas show something before their icons are drawn. */
const icon = (key, size = 48) => {
  if (ICONS[key]) return ICONS[key](size);
  const c = AREA_COLORS[key] || PAL.accent;
  const name = AREA_NAMES[key] || String(key || "?");
  const initial = name.replace(/^(ask|the)\s+/i, "").charAt(0).toUpperCase() || "?";
  return svg(`<rect x="3" y="3" width="42" height="42" rx="13" fill="${c}" fill-opacity=".16"/><rect x="3" y="3" width="42" height="42" rx="13" fill="none" stroke="${c}" stroke-width="2.5"/>` +
    `<text x="24" y="31.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="21" font-weight="700" fill="${PAL.ink}">${initial}</text>`, name, size);
};

/** The strongest area badge: a rounded shield in the area's colour with a white star and an upward chevron. */
function strongBadge(area, size = 84) {
  const c = AREA_COLORS[area] || PAL.accent;
  return `<svg class="badge" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M24 3.5 40 9.6v12.6c0 10.6-6.8 18.6-16 22.3C14.8 40.8 8 32.8 8 22.2V9.6Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${starPath(24, 20.5, 7.6, 3.3)}" fill="#fff"/><path d="M18.5 34.5 24 29.5l5.5 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** The weakest area badge: a rounded square in the area's colour with a white wrench crossing a small plus sign. */
function fixBadge(area, size = 84) {
  const c = AREA_COLORS[area] || PAL.accent;
  return `<svg class="badge" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="4" y="4" width="40" height="40" rx="11" fill="${c}"/>` +
    `<path d="M30.8 12.2a7 7 0 0 0-8.6 8.9L13 30.3a2.6 2.6 0 0 0 3.7 3.7l9.2-9.2a7 7 0 0 0 8.9-8.6l-4.2 4.2-3.7-1-1-3.7Z" fill="#fff"/>` +
    `<path d="M33.5 29.5v8M29.5 33.5h8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
}

/** The houses strip: of the last 10 jobs, how many were asked. Lit houses carry a review card with stars; the rest
 *  carry an empty dashed card. asked null: every card is a question mark. */
function housesStrip(asked, { width = 560, label = "" } = {}) {
  const n = 10, gap = 6, w = (width - gap * (n - 1)) / n, h = w * 1.25;
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = i * (w + gap), lit = asked !== null && i < asked;
    const roofY = h * 0.42, bodyY = h * 0.6;
    const house = `<path d="M${x + w / 2} ${h * 0.34}L${x + w * 0.96} ${roofY + h * 0.18}H${x + w * 0.04}Z" fill="${lit ? PAL.ink : PAL.ink400}"/>` +
      `<rect x="${x + w * 0.14}" y="${bodyY}" width="${w * 0.72}" height="${h * 0.38}" rx="${w * 0.06}" fill="${lit ? PAL.ink : PAL.ink300}"/>` +
      `<rect x="${x + w * 0.42}" y="${bodyY + h * 0.14}" width="${w * 0.16}" height="${h * 0.24}" rx="${w * 0.03}" fill="${lit ? PAL.star : PAL.line}"/>`;
    const cardW = w * 0.86, cardH = h * 0.22, cx = x + (w - cardW) / 2, cy = 0;
    const card = lit
      ? `<rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="${cardH * 0.28}" fill="#fff" stroke="${PAL.line2}"/>` +
        [0, 1, 2].map((k) => `<path d="${starPath(cx + cardW * (0.26 + k * 0.24), cy + cardH / 2, cardH * 0.26, cardH * 0.11)}" fill="${PAL.star}"/>`).join("")
      : `<rect x="${cx + 0.75}" y="${cy + 0.75}" width="${cardW - 1.5}" height="${cardH - 1.5}" rx="${cardH * 0.28}" fill="none" stroke="${PAL.ink400}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
        (asked === null ? `<text x="${cx + cardW / 2}" y="${cy + cardH * 0.72}" text-anchor="middle" font-size="${cardH * 0.7}" font-weight="700" fill="${PAL.ink500}">?</text>` : "");
    out += card + house;
  }
  return `<svg class="houses" viewBox="0 0 ${width} ${h.toFixed(1)}" width="100%" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

/** The score donut: the Visibility Score as an arc out of 100, the number in the middle. */
function donut(score, { size = 168, stroke = 16, color = PAL.accent, track = PAL.line, label = "" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, len = (Math.max(0, Math.min(100, score)) / 100) * c;
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${len.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="donut-n">${score}</text></svg>`;
}

/** Twelve monthly bars; the two quietest months marked (amber, with their label bold). */
function monthsChart(values, labels, low = [], { width = 600, height = 170, color = PAL.chart, lowColor = PAL.signal } = {}) {
  const max = Math.max(1, ...values);
  const pad = 22, bw = (width - 8) / 12, ch = height - pad - 18;
  let out = `<line x1="0" x2="${width}" y1="${height - pad}" y2="${height - pad}" stroke="${PAL.line2}"/>`;
  values.forEach((v, i) => {
    const bh = (v / max) * ch, x = 4 + i * bw + bw * 0.18, y = height - pad - bh;
    const isLow = low.includes(i);
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(bh, v ? 2 : 0).toFixed(1)}" rx="3" fill="${isLow ? lowColor : color}"/>` +
      `<text x="${(x + bw * 0.32).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" class="mc-v">${v}</text>` +
      `<text x="${(x + bw * 0.32).toFixed(1)}" y="${height - 5}" text-anchor="middle" class="mc-l${isLow ? " low" : ""}">${labels[i]}</text>`;
  });
  return `<svg class="months" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Google reviews by month" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}


// The quiz's markup: one question per step, a tap answers, contact details last. One set of string templates for the
// build (the hero's ten steps are in the page's HTML, so the first question shows before any script runs) and for the
// browser (the deepener's steps, which depend on the hero's answers). Inlined into the page's script by the build:
// keep it to `export function` declarations with no imports.

function escHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function useIcon(id, cls) {
  return `<svg class="${cls || "ic"}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

/** The notice at collection under a form, naming its own button. links: { terms, privacy, choices }. */
function legalNoteHtml(legal, links, button, withMeta) {
  const a = (href, label) => `<a href="${escHtml(href)}" target="_blank" rel="noopener">${escHtml(label)}<span class="sr-only"> ${escHtml(legal.newTab)}</span></a>`;
  let out = escHtml(legal.notice).replace("{button}", `“${escHtml(button)}”`).replace("{terms}", a(links.terms, legal.terms)).replace("{privacy}", a(links.privacy, legal.privacy));
  if (withMeta) out += " " + escHtml(legal.noticeMeta).replace("{choices}", a(links.choices, legal.choices));
  return `<p class="legal-note">${out}</p>`;
}

function nav(ui, i, last, button) {
  return `<p class="err" role="alert"></p><div class="gc-nav"><button type="button" class="gc-back"${i === 0 ? " hidden" : ""}>${useIcon("i-back")}${escHtml(ui.back)}</button>` +
    (last ? `<button type="submit" class="btn btn-primary gc-next gc-submit">${escHtml(button)}</button>` : `<button type="button" class="btn btn-primary gc-next">${escHtml(ui.next)}${useIcon("i-arrow")}</button>`) + `</div>`;
}

/** One step. step: a choice ({ key, q, options, layout }) or fields ({ key, q, fields, choice, consent }). */
function stepHtml(step, i, total, ui, opts) {
  const hidden = i === 0 ? "" : " hidden";
  const id = step.id || step.key;
  const last = i === total - 1;
  const button = (opts && opts.button) || step.button || ui.next;
  const head = `<legend class="gc-q" tabindex="-1">${escHtml(step.q)}</legend>`;
  if (step.type === "fields") {
    let body = "";
    for (const f of step.fields) {
      const help = f.help ? `<p class="help" id="h-${f.name}">${escHtml(f.help)}</p>` : "";
      body += `<div class="field"><label for="f-${f.name}">${escHtml(f.label)}</label>${help}<input id="f-${f.name}" name="${f.name}" type="${f.type || "text"}"` +
        `${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ""}${f.inputmode ? ` inputmode="${f.inputmode}"` : ""}${f.max ? ` maxlength="${f.max}"` : ""}` +
        `${f.required ? " required" : ""}${f.help ? ` aria-describedby="h-${f.name}"` : ""}></div>`;
    }
    if (step.choice) {
      body += `<div><span class="group-l" id="l-${step.choice.key}">${escHtml(step.choice.label)}</span><div class="chips" role="radiogroup" aria-labelledby="l-${step.choice.key}">` +
        step.choice.options.map((o) => `<label class="chip-opt"><input type="radio" name="${step.choice.key}" value="${escHtml(o.v)}"><span>${escHtml(o.label)}</span></label>`).join("") + `</div></div>`;
    }
    if (step.consent) {
      body += `<label class="consent"><input type="checkbox" name="${step.consent.name}"${step.consent.required ? " required" : ""}><span>${escHtml(step.consent.label)}</span></label>`;
    }
    if (last && opts && opts.legalHtml) body += opts.legalHtml;
    return `<fieldset class="gc-step" data-step="${i}" data-kind="fields" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}${body}${nav(ui, i, last, button)}</fieldset>`;
  }
  const grid = step.layout === "grid" ? " grid" : "";
  const options = step.options.map((o) => `<label class="gc-opt"><input type="radio" name="${escHtml(step.key)}" value="${escHtml(o.v)}"><span>${escHtml(o.label)}</span></label>`).join("");
  return `<fieldset class="gc-step" data-step="${i}" data-kind="choice" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}<div class="gc-opts${grid}">${options}</div>${nav(ui, i, last && !(opts && opts.autoSubmit === false), button)}</fieldset>`;
}

/** The whole card. opts: { id, label, frame, frameShort, button, legalHtml, kind } */
function quizCardHtml(steps, ui, opts) {
  const n = steps.length;
  const count = escHtml(ui.count).replace("{n}", "1").replace("{total}", String(n));
  return `<div class="gc" id="${opts.id || "quiz"}" data-quiz="${escHtml(opts.kind || "hero")}" data-total="${n}">` +
    `<div class="gc-top"><span class="gc-label">${useIcon("i-file")}${escHtml(opts.label)}</span><span class="gc-count" aria-live="polite">${count}</span></div>` +
    `<div class="gc-bar" aria-hidden="true"><i style="--p:${Math.round(100 / n)}%"></i></div>` +
    (opts.frame ? `<p class="gc-frame">${opts.frameShort ? `<span class="m-hide">${escHtml(opts.frame)}</span><span class="m-only">${escHtml(opts.frameShort)}</span>` : escHtml(opts.frame)}</p>` : "") +
    `<form class="gc-form" novalidate><div class="hp" aria-hidden="true"><label>Leave this empty<input name="hp" tabindex="-1" autocomplete="off"></label></div>` +
    steps.map((s, i) => stepHtml(s, i, n, ui, opts)).join("") + `</form></div>`;
}

// Where a visit came from, in one plain word for the admin's analytics: the campaign's utm_source when the link had
// one, "facebook" for a Meta ad click (fbclid), the referring site's name otherwise, or "direct". Shared by the page
// (its analytics events) and the server (each lead), so both say the same thing. tools/build.mjs bundles it.

/** A referrer's site, without the mobile and link-shim prefixes (m., l., lm., www.): "l.facebook.com" is "facebook.com". */
function refHost(ref) {
  try {
    const h = new URL(String(ref || "")).hostname.toLowerCase();
    return h.replace(/^(www|m|l|lm|mobile|out)\./, "");
  } catch (e) { return ""; }
}

/** The source of a visit: { utm_source, fbclid, referrer } as the page keeps them. */
function sourceFrom(t) {
  const s = t && typeof t === "object" ? t : {};
  const utm = String(s.utm_source || "").trim().toLowerCase().replace(/[^a-z0-9_.+-]/g, "").slice(0, 40);
  if (utm) return utm === "fb" || utm === "ig" ? (utm === "fb" ? "facebook" : "instagram") : utm;
  if (s.fbclid) return "facebook";
  const host = refHost(s.referrer);
  if (!host) return "direct";
  if (/(^|\.)facebook\.com$/.test(host)) return "facebook";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  return host.slice(0, 40);
}

/* The Invisible Work Scorecard: the pages' script. tools/build.mjs wraps it in one function with lib/scoring.mjs,
   lib/booking.mjs, lib/icons.mjs and lib/quiz-markup.mjs, so the score on screen is the server's score.
   One script, by page (body[data-page]): the landing pages and /start run the quiz; /results/<token> shows the result
   and the call step; /sharpen/<token> runs the deepener; /unsubscribe/<token> unsubscribes. */

const DATA = JSON.parse(document.getElementById("sc-data").textContent);
const SC = DATA.sc, SITE = DATA.site, UI = DATA.ui, RES = DATA.results, LEGAL = DATA.legal;
const BRAND_SLUG = (DATA.brand && DATA.brand.slug) || "scorecard";
useAreas(SC);
usePalette(DATA.brand && DATA.brand.colors);
const PAGE = document.body.dataset.page, VARIANT = document.body.dataset.variant || "";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const root = document.documentElement;
root.classList.remove("no-js");
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!REDUCE) root.classList.add("motion");
const esc = escHtml;
const ic = (id) => useIcon(id);
/** A template's text escaped, its placeholders filled with bold, escaped values. */
const fillHtml = (t, vars) => esc(t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? `<b>${esc(vars[k])}</b>` : m));

/* ---------- Session storage (it can throw in private modes: the page then just forgets on reload) ---------- */
const ss = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* not kept */ } }
};
const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
let visit = ss.get("sc-visit");
if (!visit) { visit = newId(); ss.set("sc-visit", visit); }
const ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src"];
const attr = Object.assign({}, ss.get("sc-attr"));
const qs = new URLSearchParams(location.search);
ATTR.forEach((k) => { const v = qs.get(k); if (v) attr[k] = v.slice(0, 300); });
if (qs.get("fbclid") && !attr.fbclidAt) attr.fbclidAt = Date.now();
if (!attr.referrer && document.referrer && !document.referrer.startsWith(location.origin)) attr.referrer = document.referrer.slice(0, 500);
ss.set("sc-attr", attr);
// The landing variant this visit came through, kept for the results page and the deepener
if (VARIANT) ss.set("sc-variant", VARIANT);
const variantNow = () => VARIANT || ss.get("sc-variant") || "";

/* ---------- Consent: advertising and analytics tools only after Allow, never with Global Privacy Control ---------- */
const GPC = navigator.globalPrivacyControl === true;
// The visitor's cookie choice, kept in their browser under the brand's slug ("rempo-consent")
const CONSENT_KEY = `${BRAND_SLUG}-consent`;
function readConsent() { try { const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); return c && (c.ads === "granted" || c.ads === "denied") ? c : null; } catch (e) { return null; } }
function writeConsent(ads) { try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, ads, at: new Date().toISOString(), src: "notice" })); } catch (e) { /* asked again next visit */ } }
const consentState = () => (GPC ? "denied" : (readConsent() || {}).ads || "unset");
const adsAllowed = () => { const s = consentState(); return s === "granted" || (s === "unset" && SITE.trackingConsent === "notice"); };
function loadTrackers() {
  if (window.__scTrackers || !adsAllowed()) return;
  window.__scTrackers = true;
  if (SITE.metaPixelId) {
    try {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", SITE.metaPixelId);
      window.fbq("track", "PageView");
    } catch (e) { /* tracking never breaks the page */ }
  }
  if (SITE.clarityId) {
    try { (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", SITE.clarityId); } catch (e) { /* never breaks the page */ }
  }
}
const notice = document.getElementById("cookie-notice");
if (notice) {
  if (!GPC && !readConsent()) notice.hidden = false;
  $$("[data-consent]", notice).forEach((b) => b.addEventListener("click", () => {
    writeConsent(b.dataset.consent);
    notice.hidden = true;
    if (b.dataset.consent === "granted") loadTrackers(); else if (window.__scTrackers) location.reload();
  }));
}
$$("[data-cookie-settings]").forEach((b) => b.addEventListener("click", () => { if (notice) { notice.hidden = false; const f = $("[data-consent]", notice); if (f) f.focus(); } }));
loadTrackers();

/* ---------- Events: Meta (only once allowed; Lead and Schedule only for qualified answers), the dataLayer, and the
   page's own analytics (/api/track: first party, no cookies, nothing personal) ---------- */
const STANDARD = ["Lead", "Schedule", "InitiateCheckout"];
window.__scEvents = window.__scEvents || [];
function pixel(name, params, eventID) {
  const p = Object.assign({ variant: variantNow() }, params || {});
  window.__scEvents.push({ name, params: p, eventID: eventID || null });
  if (adsAllowed() && typeof window.fbq === "function") {
    try { window.fbq(STANDARD.includes(name) ? "track" : "trackCustom", name, p, eventID ? { eventID } : undefined); } catch (e) { /* never breaks the page */ }
  }
  (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: `${BRAND_SLUG}_${name}` }, p));
}
let queue = [];
let flushTimer = null;
/** One analytics event: its name, the step, and for an answered step how long it took (extra: { ms }). */
function hit(name, step, extra) {
  const e = Object.assign({ name, step: step || "" }, extra || {});
  queue.push(e);
  window.__scHits = (window.__scHits || []).concat([e]);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 1200);
}
function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ visit, variant: variantNow(), source: sourceFrom(attr), events: queue.splice(0, 40) });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(SITE.endpoints.track, new Blob([body], { type: "text/plain" }))) return;
  } catch (e) { /* fall through */ }
  fetch(SITE.endpoints.track, { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true }).catch(() => {});
}
addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
const cookie = (n) => { const m = document.cookie.match(`(?:^|; )${n}=([^;]*)`); return m ? decodeURIComponent(m[1]) : ""; };
const fbc = () => cookie("_fbc") || (attr.fbclid ? `fb.1.${attr.fbclidAt || Date.now()}.${attr.fbclid}` : "");
const tracking = (extra) => {
  const out = consentState() === "denied";
  return Object.assign({ fbc: out ? "" : fbc(), fbp: out ? "" : cookie("_fbp"), gpc: GPC, consent: consentState() }, extra);
};
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } };
/** The screen and the language, for the admin's device view (the privacy policy's "browser and device type"). */
const clientInfo = () => {
  try { return { vw: innerWidth, vh: innerHeight, sw: screen.width, sh: screen.height, dpr: devicePixelRatio, lang: navigator.language || "", touch: navigator.maxTouchPoints || 0 }; } catch (e) { return {}; }
};

/* ---------- Sending ---------- */
async function post(body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(SITE.endpoints.scorecard, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    let data = null;
    try { data = await r.json(); } catch (e) { data = null; }
    return { ok: r.ok && data && data.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  } finally { clearTimeout(timer); }
}
const tokenFromPath = (prefix) => { const m = new RegExp(`^/${prefix}/([A-Za-z0-9_-]{5,64})/?$`).exec(location.pathname); return m ? m[1] : ""; };
const spinner = (label) => `<span class="spin" aria-hidden="true"></span><span>${esc(label)}</span>`;

/* ============================================================
   The quiz engine: one step at a time; a tap answers and moves on; fields are checked before moving on
   ============================================================ */
function makeQuiz(card, { onSubmit, onStep, onStart, kind }) {
  const form = $(".gc-form", card);
  const steps = $$(".gc-step", form);
  const N = steps.length;
  const counter = $(".gc-count", card);
  const bar = $(".gc-bar i", card);
  let at = 0, started = false, busy = false;
  const values = {};
  // The clock runs only while the page is on screen: each step's time (the first one's includes reading the page
  // before the first tap), the time before the first answer, the whole quiz from the first answer to the last, how
  // often the visitor went Back, and how often they left the page mid-quiz (to look a number up, say)
  const now = () => performance.now();
  const clock = { steps: {}, backs: 0, aways: 0, hidden: 0, hiddenAt: document.visibilityState === "hidden" ? now() : null, openAt: null, first: null, sent: {} };
  const onScreen = () => now() - clock.hidden - (clock.hiddenAt !== null ? now() - clock.hiddenAt : 0);
  function stopClock() {
    if (clock.openAt === null) return;
    const id = steps[at].dataset.id;
    clock.steps[id] = (clock.steps[id] || 0) + (now() - clock.openAt);
    clock.openAt = null;
  }
  const startClock = () => { clock.openAt = document.visibilityState === "hidden" ? null : now(); };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopClock();
      if (clock.hiddenAt === null) clock.hiddenAt = now();
      if (started && !busy) clock.aways += 1;
    } else {
      if (clock.hiddenAt !== null) { clock.hidden += now() - clock.hiddenAt; clock.hiddenAt = null; }
      startClock();
    }
  });
  const stepMs = (id) => Math.round((clock.steps[id] || 0) + (clock.openAt !== null && steps[at].dataset.id === id ? now() - clock.openAt : 0));
  function timing() {
    const out = { steps: {}, backs: clock.backs, aways: clock.aways };
    steps.forEach((s) => { const ms = stepMs(s.dataset.id); if (ms > 0) out.steps[s.dataset.id] = ms; });
    if (clock.first !== null) { out.landingMs = Math.round(clock.first); out.totalMs = Math.round(onScreen() - clock.first); }
    return out;
  }
  function show(i, focus) {
    stopClock();
    at = Math.max(0, Math.min(N - 1, i));
    startClock();
    steps.forEach((s, k) => { s.hidden = k !== at; s.classList.toggle("enter", k === at); });
    if (counter) counter.textContent = UI.count.replace("{n}", at + 1).replace("{total}", N);
    if (bar) bar.style.setProperty("--p", `${Math.round(((at + 1) / N) * 100)}%`);
    if (focus) {
      const s = steps[at];
      const first = s.dataset.kind === "fields" ? $("input:not([type=checkbox]):not([type=radio])", s) : $(".gc-q", s);
      if (first) first.focus({ preventScroll: true });
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight * 0.5) card.scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
    }
  }
  const err = (s, msg) => { const e = $(".err", s); if (e) e.textContent = msg || ""; };
  function check(s) {
    err(s, "");
    if (s.dataset.kind === "choice") {
      const picked = $("input:checked", s);
      $(".gc-opts", s).setAttribute("aria-invalid", picked ? "false" : "true");
      if (!picked) { err(s, UI.pick); return false; }
      return true;
    }
    for (const inp of $$(".field input", s)) {
      inp.setAttribute("aria-invalid", "false");
      const v = inp.value.trim();
      if (inp.required && !v) { inp.setAttribute("aria-invalid", "true"); err(s, UI.required); inp.focus(); return false; }
      if (inp.type === "email" && v && !/^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/.test(v)) { inp.setAttribute("aria-invalid", "true"); err(s, UI.email); inp.focus(); return false; }
    }
    const chips = $(".chips", s);
    if (chips && !$("input:checked", chips)) { chips.setAttribute("aria-invalid", "true"); err(s, UI.profiles); return false; }
    if (chips) chips.setAttribute("aria-invalid", "false");
    const consent = $(".consent input[required]", s);
    if (consent && !consent.checked) { err(s, UI.consent); consent.focus(); return false; }
    return true;
  }
  function collect() {
    for (const inp of $$("input", form)) {
      if (inp.name === "hp") continue;
      if (inp.type === "radio") { if (inp.checked) values[inp.name] = inp.value; }
      else if (inp.type === "checkbox") values[inp.name] = inp.checked;
      else values[inp.name] = inp.value.trim();
    }
    return values;
  }
  function answered(s) {
    if (!started) { started = true; clock.first = onScreen(); if (onStart) onStart(); }
    s.dataset.answered = "1";
    // A step's time goes out with its first answer only; a changed answer adds to the total sent with the quiz
    const id = s.dataset.id;
    const ms = clock.sent[id] ? undefined : stepMs(id);
    clock.sent[id] = true;
    if (onStep) onStep(s, at, ms);
  }
  form.addEventListener("change", (e) => {
    const s = e.target.closest(".gc-step");
    if (!s || e.target.type !== "radio" || s.dataset.kind !== "choice") return;
    err(s, "");
    $(".gc-opts", s).setAttribute("aria-invalid", "false");
    const isLast = steps.indexOf(s) === N - 1;
    answered(s);
    if (!isLast) setTimeout(() => { if (!s.hidden) show(steps.indexOf(s) + 1, true); }, REDUCE ? 0 : 220);
    else { const b = $(".gc-submit", s); if (b) b.focus(); }
  });
  form.addEventListener("click", (e) => {
    const s = e.target.closest(".gc-step");
    if (!s) return;
    if (e.target.closest(".gc-back")) { clock.backs += 1; show(steps.indexOf(s) - 1, true); return; }
    const next = e.target.closest(".gc-next:not(.gc-submit)");
    if (next && check(s)) { if (s.dataset.kind === "fields") answered(s); show(steps.indexOf(s) + 1, true); }
  });
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.target.type === "checkbox") return;
    const s = e.target.closest(".gc-step");
    if (steps.indexOf(s) === N - 1) return;
    e.preventDefault();
    if (check(s)) { answered(s); show(steps.indexOf(s) + 1, true); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const s = steps[N - 1];
    // Every step must be answered: a skipped one (a step shown again after Back) takes the visitor there
    for (let k = 0; k < N; k++) { if (!check(steps[k])) { show(k, true); return; } }
    if ($("input[name=hp]", form) && $("input[name=hp]", form).value) return;
    answered(s);
    busy = true;
    card.classList.add("gc-sending");
    const btn = $(".gc-submit", s);
    const label = btn.innerHTML;
    btn.innerHTML = spinner(kind === "deepener" ? RES.deepener.sending : UI.sending);
    btn.setAttribute("aria-busy", "true");
    try { await onSubmit(collect(), (msg) => err(s, msg), timing()); }
    finally { busy = false; card.classList.remove("gc-sending"); btn.innerHTML = label; btn.removeAttribute("aria-busy"); }
  });
  show(0, false);
  return { show, collect, steps, timing };
}

/* ============================================================
   The hero quiz: the landing pages and /start
   ============================================================ */
function heroQuiz(card) {
  const scored = SC.steps;
  return makeQuiz(card, {
    kind: "hero",
    onStart() { hit("start"); pixel("GapCheckStart", {}); },
    onStep(s, i, ms) { hit("step", s.dataset.id, ms !== undefined ? { ms } : null); pixel("GapCheckStep", { step: i + 1, name: s.dataset.key }); },
    async onSubmit(v, fail, timing) {
      const answers = {};
      for (const c of heroChoices(SC)) if (typeof v[c.key] === "string") answers[c.key] = v[c.key];
      const local = evaluate(SC, answers);
      const leadEventId = `lead-${visit.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40)}`;
      const body = Object.assign({ action: "submit", answers, company: v.company, city: v.city, firstName: v.firstName, email: v.email, consentEmail: v.consentEmail === true,
        visit, variant: variantNow(), page: location.href.slice(0, 1000), referrer: attr.referrer || "", tz: tz(), noticeVersion: SITE.noticeVersion,
        timing, client: clientInfo(), tracking: tracking({ leadEventId }) }, Object.fromEntries(ATTR.filter((k) => attr[k]).map((k) => [k, attr[k]])));
      const r = await post(body);
      hit("submit");
      if (r.ok && r.data.token) {
        if (local.qualified) pixel("Lead", { content_name: String(SC.name || "Scorecard").replace(/^the\s+/i, ""), content_category: local.tier }, leadEventId);
        pixel("ScorecardDone", { fit: local.fit, tier: local.tier });
        ss.set(`sc-r-${r.data.token}`, { fresh: true, email: v.email, firstName: v.firstName, business: v.company, city: v.city, result: r.data.result, deepener: r.data.deepener, at: Date.now() });
        flush();
        location.assign(`/results/${r.data.token}`);
        return;
      }
      if (r.status === 400 || r.status === 429) { fail((r.data && r.data.error) || UI.failed); return; }
      if (r.status === 0) { fail(UI.failed); return; }
      // Not saved (the store or the network failed after the notices): the score still shows, from the same scoring
      ss.set("sc-r-local", { fresh: true, local: true, email: v.email, firstName: v.firstName, business: v.company, city: v.city, result: (r.data && r.data.result) || publicView(local), at: Date.now() });
      flush();
      location.assign("/results/local");
    }
  });
}
/** The browser's own result, trimmed like the server's (api/_lib/views.mjs publicResult). */
function publicView(r) {
  return { score: r.score, tier: r.tier, tierName: r.tierName, tierDescriptor: r.tierDescriptor, areas: Object.fromEntries(Object.entries(r.areas).map(([k, a]) => [k, { score: a.score, band: a.band }])),
    invisible: r.invisible, bottleneck: { primary: r.bottleneck.primary, maintenance: r.bottleneck.maintenance, lineKey: r.bottleneck.lineKey, line: r.bottleneck.line }, callOnly: r.callOnly, service: r.service };
}

function landing() {
  hit("view");
  const card = $("#quiz");
  if (!card) return;
  heroQuiz(card);
  const dlg = $("#quiz-dlg");
  const sticky = $("#sticky");
  const openQuiz = () => {
    if (dlg) {
      if (!dlg.open) { dlg.showModal(); document.body.classList.add("sheet-open"); }
      setTimeout(() => { const s = $$(".gc-step", card).find((x) => !x.hidden); const q = s && $(".gc-q", s); if (q) q.focus({ preventScroll: true }); }, 60);
    } else {
      card.scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
      setTimeout(() => { const s = $$(".gc-step", card).find((x) => !x.hidden); const q = s && $(".gc-q", s); if (q) q.focus({ preventScroll: true }); }, REDUCE ? 0 : 450);
    }
  };
  $$("[data-start]").forEach((b) => b.addEventListener("click", openQuiz));
  if (dlg) {
    const close = () => { dlg.close(); };
    $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", close));
    dlg.addEventListener("close", () => document.body.classList.remove("sheet-open"));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  }
  // The sticky bar (phones): once the hero's action is off screen, and never over the quiz or the close
  if (sticky && "IntersectionObserver" in window) {
    const hero = $(".hero-cta") || card;
    const closeSec = $(".banner-cta") || $("#close");
    let heroOut = false, closeIn = false;
    const update = () => { const on = heroOut && !closeIn && !(dlg && dlg.open); sticky.classList.toggle("show", on); sticky.setAttribute("aria-hidden", on ? "false" : "true"); };
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(hero);
    if (closeSec) new IntersectionObserver(([e]) => { closeIn = e.isIntersecting; update(); }).observe(closeSec);
    if (dlg) dlg.addEventListener("close", update);
  }
}

/* ============================================================
   The results page
   ============================================================ */
const areaOf = (k) => SC.areas.find((a) => a.key === k);
async function resultsPage() {
  const token = tokenFromPath("results");
  const box = $("#results");
  if (!token) { box.innerHTML = notFound(); return; }
  let view = ss.get(`sc-r-${token}`);
  if (!view && token !== "local") {
    try {
      const r = await fetch(`${SITE.endpoints.scorecard}?token=${encodeURIComponent(token)}`, { headers: { accept: "application/json" } });
      const d = await r.json();
      if (r.ok && d.ok) view = { fresh: false, firstName: d.firstName, business: d.business, city: d.city, result: d.result, deepener: d.deepener, booked: d.booked };
    } catch (e) { view = null; }
  }
  if (!view || !view.result) { box.innerHTML = notFound(); return; }
  renderResults(box, token, view);
  hit("result");
  pixel("ScoreShown", { tier: view.result.tier });
  if (view.fresh) { view.fresh = false; ss.set(`sc-r-${token}`, view); }
}
const notFound = () => `<div class="card done-card"><h2 class="h3">${esc(RES.notFound)}</h2><a class="btn btn-primary" href="/">${esc(RES.retake)}</a></div>`;

function renderResults(box, token, view) {
  const r = view.result, local = token === "local";
  const tier = SC.tiers.find((t) => t.key === r.tier) || {};
  const iw = r.invisible;
  const num0 = (n) => (n === null || n === undefined ? null : num(n));
  const ivars = { unasked: num0(iw.unasked), work_value: iw.workValue !== null && iw.workValue !== undefined ? money(iw.workValue) : null, jobs: iw.jobs, not_asked: iw.notAsked, ticket: iw.ticket ? money(iw.ticket) : null };
  const mathKey = { known: "knownMath", average: "averageMath", count: "countMath" }[iw.kind];
  // The ten-unit strip over the metric (Rempo's houses: of the last 10 jobs, how many were asked); content without a
  // strip line leaves it out
  const stripLabel = !RES.invisible.strip ? "" : iw.asked === null || iw.asked === undefined ? RES.invisible.stripUnsure : RES.invisible.strip.replace("{asked}", iw.asked);
  const strip = stripLabel ? `${housesStrip(iw.asked === undefined ? null : iw.asked, { label: stripLabel })}<p class="houses-l">${esc(stripLabel)}</p>` : "";
  const areaWord = ["", "one", "two", "three", "four", "five", "six"][SC.areas.length] || String(SC.areas.length);
  const fixHtml = r.bottleneck.maintenance
    ? `<p class="fix ok">${ic("i-check")}<span>${esc(r.bottleneck.line)}</span></p>`
    : `<p class="fix">${ic("i-alert")}<span>${fillHtml(RES.invisible.fixFirst, { bottleneck: areaOf(r.bottleneck.primary).name, bottleneck_line: null }).replace("{bottleneck_line}", esc(r.bottleneck.line))}</span></p>`;
  const deepShown = (view.deepener && view.deepener.shown) || [];
  const deepDone = view.deepener && view.deepener.done;
  const nDeep = deepShown.length;
  const header = `<div class="res-head"><p class="thanks">${esc(RES.header.thanks.replace("{first_name}", view.firstName || ""))}</p><h1>${esc(RES.header.name)}</h1>` +
    `<p>${esc(view.email ? RES.header.email.replace("{email}", view.email) : RES.header.returning)}</p></div>`;
  const scoreCard = `<section class="card" aria-labelledby="score-l"><div class="score-top">${donut(r.score, { label: `${SC.scoreName || "Score"} ${r.score} out of 100` })}<div>` +
    `<span class="tier-chip t-${esc(r.tier)}">${esc(tier.name)}</span><p class="score-label" id="score-l">${esc(RES.score.label.replace("{score}", r.score).replace("{tier}", tier.name))}</p><p class="score-desc">${esc(tier.descriptor)}</p></div></div>` +
    `<p class="score-intro">${esc(RES.score.intro)}</p></section>`;
  const iwCard = `<section class="card iw" aria-label="${esc((SC.metric && SC.metric.name) || "Your result")}">${strip}` +
    `<p class="iw-big">${fillHtml(RES.invisible[iw.kind], ivars)}</p>${mathKey ? `<p class="iw-math">${esc(fill(RES.invisible[mathKey], ivars))}</p>` : ""}${fixHtml}</section>`;
  const bars = `<section class="card" aria-labelledby="bars-h"><h2 class="h3" id="bars-h" style="margin-bottom:14px">${esc(RES.areasTitle || `Your ${areaWord} areas`)}</h2><div class="bars4">` +
    SC.areas.map((a) => `<div class="row" style="--a:var(--a-${a.key})"><span>${esc(a.name)}</span><i><span style="--w:${r.areas[a.key].score}%"></span></i><span class="n">${r.areas[a.key].score}</span></div>`).join("") +
    `</div><p class="res-summary" style="margin-top:16px">${esc(RES.summary)}</p></section>`;
  const cards = `<div class="acards">${SC.areas.map((a) => {
    const band = r.areas[a.key].band;
    return `<article class="acard" style="--a:var(--a-${a.key})"><div class="acard-h">${icon(a.key, 44)}<h3>${esc(a.name)}</h3><span class="n">${r.areas[a.key].score}</span></div>` +
      `<span class="band ${band}">${esc(RES.bandLabels[band])}</span><p>${esc(RES.cards[a.key][band])}</p><p class="rec"><b>${esc(RES.recommendations[band].split(". ")[0])}.</b> ${esc(RES.recommendations[band].split(". ").slice(1).join(". "))}</p></article>`;
  }).join("")}</div>`;
  const C = RES.cta;
  const ctaHtml = {
    report: () => RES.report ? `<section class="cta-card" id="report"><div class="cta-top">${imgTag(RES.report.img)}<h3>${esc(RES.report.h3)}</h3></div><p>${esc(RES.report.body)}</p>` +
      `<div class="cta-row"><a class="btn btn-primary" href="/report/${esc(token)}" data-cta="report">${esc(RES.report.button)}</a><a class="btn btn-line" href="/report/${esc(token)}/pdf?download=1" data-cta="pdf">${esc(RES.report.pdf)}</a></div></section>` : "",
    call: () => `<section class="cta-card main" id="call"><div class="cta-top">${imgTag(C.call.img)}<h3>${esc(C.call.h3)}</h3></div><div data-call>${view.booked ? bookedHtml(view.booked, view) : `<p>${esc(C.call.body)}</p><button type="button" class="btn btn-primary" data-book-open>${esc(C.call.button)}</button>`}</div></section>`,
    sharpen: () => nDeep ? `<section class="cta-card" id="sharpen"><div class="cta-top">${imgTag(C.sharpen.img)}<h3>${esc(C.sharpen.h3)}</h3></div>` +
      (deepDone ? `<p class="done-l">${ic("i-check")}${esc(C.sharpen.done.replace("{n}", view.deepener.answered || nDeep))}</p>`
        : `<p>${esc(nDeep === 8 ? C.sharpen.body : C.sharpen.bodyN.replace("{n}", nDeep))}</p><a class="btn btn-line" href="/sharpen/${esc(token)}" data-cta="sharpen">${esc(nDeep === 8 ? C.sharpen.button : C.sharpen.buttonN.replace("{n}", nDeep))}</a>`) + `</section>` : "",
    service: () => `<section class="cta-card"><div class="cta-top">${imgTag(C.service.img)}<h3>${esc(C.service.h3)}</h3></div><p>${esc(C.service.body)}</p><a class="btn btn-line" href="${esc(SITE.masterUrl)}" data-cta="service">${esc(C.service.button)}</a></section>`,
    checkout: () => SITE.offer && SITE.offer.decided && SITE.offer.checkoutUrl && !r.callOnly ? `<section class="cta-card"><div class="cta-top">${imgTag(C.checkout.img)}<h3>${esc(C.checkout.h3)}</h3></div><p>${esc(C.checkout.body)}</p><a class="btn btn-line" href="${esc(checkoutUrl())}" data-cta="checkout">${esc(C.checkout.button)}</a></section>` : ""
  };
  const order = local ? ["service"] : RES.ctaOrder.concat(["checkout"]);
  box.innerHTML = header + (local ? `<p class="warn">${esc(UI.stored)}</p>` : "") + scoreCard + iwCard + bars + cards +
    `<div class="ctas">${order.map((k) => ctaHtml[k]()).join("")}</div><p class="rule">${esc(RES.ruleLine)}</p>`;
  const h = $("h1", box);
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  $$("[data-cta]", box).forEach((a) => a.addEventListener("click", () => { hit("cta", a.dataset.cta); if (a.dataset.cta === "checkout") pixel("InitiateCheckout", {}); }));
  const open = $("[data-book-open]", box);
  if (open) open.addEventListener("click", () => openBooking(box, token, view));
  if (location.hash === "#call" && !view.booked && open) openBooking(box, token, view);
}
const imgTag = (k) => (DATA.img && DATA.img[k] ? `<img src="${esc(DATA.img[k])}" alt="" loading="lazy">` : "");
const checkoutUrl = () => { const u = new URL(SITE.offer.checkoutUrl, location.href); u.searchParams.set("visit", visit); ATTR.forEach((k) => { if (attr[k]) u.searchParams.set(k, attr[k]); }); return u.href; };

/* ---------- The call step ---------- */
function openBooking(box, token, view) {
  const holder = $("[data-call]", box);
  const B = RES.booking, bk = SITE.booking;
  const days = bookingDays(bk, new Date());
  hit("book_open");
  pixel("CallStepOpen", {});
  holder.innerHTML = `<form class="book" novalidate><p class="muted">${esc(B.lead)}</p>` +
    `<div><span class="group-l" id="l-day">${esc(B.day)}</span><div class="chips" role="radiogroup" aria-labelledby="l-day">${days.map((d) => `<label class="chip-opt"><input type="radio" name="slotDay" value="${d.v}"><span>${esc(d.label)}</span></label>`).join("")}</div></div>` +
    `<div><span class="group-l" id="l-win">${esc(B.window)}</span><div class="chips" role="radiogroup" aria-labelledby="l-win">${bk.windows.map((w) => `<label class="chip-opt"><input type="radio" name="slotWindow" value="${w.v}"><span>${esc(w.label)}<small>${esc(w.hint)}</small></span></label>`).join("")}</div></div>` +
    `<div class="field"><label for="f-phone">${esc(bk.phone.label)}</label><div class="phone-in"><span>${esc(bk.phone.prefix)}</span><input id="f-phone" name="phone" type="tel" autocomplete="${bk.phone.autocomplete}" inputmode="${bk.phone.inputmode}" maxlength="20" required></div></div>` +
    `<label class="consent"><input type="checkbox" name="consentPhone" required><span>${esc(bk.consentPhone.label)}</span></label>` +
    `<label class="consent"><input type="checkbox" name="consentText"><span>${esc(bk.consentText.label)}</span></label>` +
    legalNoteHtml(LEGAL, SITE.legal, B.button, Boolean(SITE.metaPixelId)) + `<p class="legal-note">${esc(LEGAL.noticeSms).replace("{sms}", `<a href="${esc(SITE.legal.sms)}" target="_blank" rel="noopener">${esc(LEGAL.sms)}</a>`)}</p>` +
    `<p class="err" role="alert"></p><button type="submit" class="btn btn-primary btn-block">${esc(B.button)}</button></form>`;
  const form = $("form", holder);
  const err = $(".err", form);
  const first = $("input", form);
  if (first) first.focus({ preventScroll: true });
  holder.closest(".cta-card").scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const fd = new FormData(form);
    const day = fd.get("slotDay"), win = fd.get("slotWindow"), phone = usPhone(fd.get("phone"));
    if (!day) { err.textContent = B.pickDay; return; }
    if (!win) { err.textContent = B.pickWindow; return; }
    if (!phone) { err.textContent = B.phoneError; $("#f-phone", form).focus(); return; }
    if (!fd.get("consentPhone")) { err.textContent = B.consentError; return; }
    const btn = $("button[type=submit]", form);
    const label = btn.innerHTML;
    btn.innerHTML = spinner(B.sending);
    btn.disabled = true;
    const scheduleEventId = `schedule-${token.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40)}`;
    const r = await post({ action: "book", token, slotDay: day, slotWindow: win, phone, consentPhone: true, consentText: Boolean(fd.get("consentText")), tz: tz(), tracking: tracking({ scheduleEventId }) });
    btn.innerHTML = label;
    btn.disabled = false;
    if (!r.ok) { err.textContent = (r.data && r.data.error) || B.failed; return; }
    hit("book");
    flush();
    pixel("CallRequested", {});
    if (view.result.qualified !== false && !view.local) pixel("Schedule", { content_name: "Scorecard call" }, scheduleEventId);
    view.booked = { day: r.data.day, window: r.data.window, hours: r.data.hours, phone: r.data.phone, v: day, w: win };
    ss.set(`sc-r-${token}`, view);
    holder.innerHTML = bookedHtml(view.booked, view);
    const t = $(".booked-t", holder);
    if (t) t.focus();
  });
}
function bookedHtml(b, view) {
  const B = RES.booking;
  const nDeep = ((view.deepener && view.deepener.shown) || []).length;
  const deepDone = view.deepener && view.deepener.done;
  const lines = `<p>${esc(fill(B.doneLine, { phone: b.phone || "you", hours: b.hours, business: view.business || "your business" }))}</p>${view.email ? `<p class="muted">${esc(B.doneEmail.replace("{email}", view.email))}</p>` : ""}`;
  return `<div class="booked"><div class="booked-h"><svg class="done-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><h4 class="booked-t" tabindex="-1">${esc(fill(B.done, { day: b.day, window: b.window }))}</h4></div>${b.phone ? lines : ""}` +
    (b.v && b.w ? `<button type="button" class="link-btn" data-ics="${esc(b.v)}|${esc(b.w)}">${ic("i-calendar")}${esc(B.calendar)}</button>` : "") +
    (nDeep && !deepDone ? `<a class="btn btn-line" href="/sharpen/${esc(tokenFromPath("results"))}" data-cta="sharpen-booked">${esc(B.next.replace("{n}", nDeep))}</a>` : "") + `</div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ics]");
  if (!b) return;
  const [day, w] = b.dataset.ics.split("|");
  const win = windowOf(SITE.booking, w);
  if (!win) return;
  const ics = icsFor({ day, window: win, title: RES.booking.calendarTitle, body: RES.booking.calendarBody, uid: `${visit}-${day}`, org: (DATA.brand && DATA.brand.name) || "Scorecard", host: BRAND_SLUG });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${BRAND_SLUG}-call.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
});

/* ============================================================
   The deepener: /sharpen/<token>
   ============================================================ */
async function sharpenPage() {
  const token = tokenFromPath("sharpen");
  const box = $("#sharpen");
  const D = RES.deepener;
  let view = null;
  try {
    const r = await fetch(`${SITE.endpoints.scorecard}?token=${encodeURIComponent(token)}`, { headers: { accept: "application/json" } });
    const d = await r.json();
    if (r.ok && d.ok) view = d;
  } catch (e) { view = null; }
  if (!view) { box.innerHTML = `<div class="gc done-card"><h2>${esc(D.missing)}</h2><a class="btn btn-primary" href="/">${esc(RES.retake)}</a></div>`; return; }
  const links = `<div class="sec-cta" style="margin-top:4px"><a class="btn btn-line" href="/results/${esc(token)}">${esc(D.toResults)}</a>${view.booked ? "" : `<a class="btn btn-primary" href="/results/${esc(token)}#call">${esc(D.toCall)}</a>`}</div>`;
  if (view.deepener.done) { box.innerHTML = `<div class="gc done-card"><h2>${esc(D.already)}</h2>${links}</div>`; return; }
  hit("deepener_view");
  const steps = SC.deepener.filter((d) => view.deepener.shown.includes(d.key)).map((d) => Object.assign({ type: "choice" }, d));
  const n = steps.length;
  box.innerHTML = quizCardHtml(steps, UI, { id: "deep", label: D.label, frame: n === 8 ? D.lead : D.leadN.replace("{n}", n), button: D.button, kind: "deepener" });
  makeQuiz($("#deep"), {
    kind: "deepener",
    onStart() { hit("deepener_start"); pixel("DeepenerStart", {}); },
    onStep(s, i, ms) { hit("deepener_step", s.dataset.id, ms !== undefined ? { ms } : null); },
    async onSubmit(v, fail, timing) {
      const answers = {};
      steps.forEach((s) => { if (typeof v[s.key] === "string") answers[s.key] = v[s.key]; });
      const r = await post({ action: "deepener", token, answers, timing });
      if (!r.ok) { fail((r.data && r.data.error) || UI.failed); return; }
      hit("deepener_done");
      flush();
      pixel("DeepenerDone", {});
      const cached = ss.get(`sc-r-${token}`);
      if (cached) { cached.deepener = Object.assign({}, cached.deepener, { done: true, answered: r.data.n }); ss.set(`sc-r-${token}`, cached); }
      box.innerHTML = `<div class="gc done-card"><div class="booked-h"><svg class="done-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><h2 tabindex="-1">${esc(D.done.replace("{n}", r.data.n))}</h2></div><p class="muted">${esc(D.doneLine)}</p>${links}</div>`;
      $("h2", box).focus();
    }
  });
}

/* ============================================================
   Unsubscribe: /unsubscribe/<token>
   ============================================================ */
function unsubscribePage() {
  const token = tokenFromPath("unsubscribe");
  const b = $("[data-unsubscribe]");
  if (!b) return;
  b.addEventListener("click", async () => {
    const r = await post({ action: "unsubscribe", token });
    const card = $("#unsub");
    if (r.ok) card.innerHTML = `<h2>${esc(RES.unsubscribe.done)}</h2><p class="muted">${esc(RES.unsubscribe.again)}</p>`;
    else $(".err", card).textContent = (r.data && r.data.error) || UI.failed;
  });
}

/* ---------- Start ---------- */
if (PAGE === "landing" || PAGE === "start") landing();
else if (PAGE === "results") resultsPage();
else if (PAGE === "sharpen") sharpenPage();
else if (PAGE === "unsubscribe") unsubscribePage();

})();
