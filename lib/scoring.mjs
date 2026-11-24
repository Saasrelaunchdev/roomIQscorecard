// The scoring engine for the Invisible Work Scorecard (Deliverable 1): which answers are valid, which deepener
// questions show, the four area scores, the Visibility Score and tier, the invisible work number, the urgency, the
// bottleneck (with the cascade rule), the quick wins, the rule flag, the notes, fit, routing and the GTM gap score.
//
// Pure functions over content/scorecard.mjs: no imports, no state, no clock. One file for both sides: the server
// imports it (api/scorecard.mjs scores again, so nothing stored or sent trusts the browser), and the build inlines it
// into the page's script (tools/build.mjs drops the `export` keywords), so the score on screen and the score stored can
// never disagree. Keep it to `export function` and `export const` declarations with no imports.

/** Float noise off (0.1 + 0.2), so 37.5 stays 37.5 before rounding and comparing. */
export function clean(x) {
  return Math.round(x * 1e9) / 1e9;
}

/** Rounded half up to a whole number (37.5 -> 38, 12.5 -> 13), as section 3 asks. */
export function roundHalfUp(x) {
  return Math.floor(clean(x) + 0.5);
}

/** Every choice question of the hero: the choice steps, and the choice inside the business step (Google profiles). */
export function heroChoices(sc) {
  const out = [];
  for (const s of sc.steps) {
    if (s.type === "choice") out.push({ key: s.key, options: s.options, step: s });
    else if (s.choice) out.push({ key: s.choice.key, options: s.choice.options, step: s });
  }
  return out;
}

/** The scored questions of the hero (Q1 to Q4) and of the deepener (D1 to D8). */
export function scoredQuestions(sc) {
  return sc.steps.filter((s) => s.kind === "scored").concat(sc.deepener);
}

/** The question (hero choice, profiles, or deepener) with this key, or null. */
export function questionOf(sc, key) {
  const h = heroChoices(sc).find((c) => c.key === key);
  if (h) return h.step.type === "choice" ? h.step : { key, options: h.options, q: h.step.choice.label };
  return sc.deepener.find((d) => d.key === key) || null;
}

/** The option with value v for question key, or null. */
export function optionOf(sc, key, v) {
  const q = questionOf(sc, key);
  return (q && q.options.find((o) => o.v === v)) || null;
}

/** Keeps only hero answers that are one of the question's own options; lists the questions left unanswered. */
export function cleanHero(sc, raw) {
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
export function isShown(question, answers) {
  if (!question.hideIf) return true;
  return !Object.entries(question.hideIf).some(([k, values]) => values.includes(answers[k]));
}

/** The deepener questions this visitor sees, in order. */
export function deepenerShown(sc, answers) {
  return sc.deepener.filter((d) => isShown(d, answers));
}

/** Keeps the deepener answers that are valid and shown; a hidden question's answer is dropped (a skip never counts). */
export function cleanDeepener(sc, answers, raw) {
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
export function areaScores(sc, answers, deepener) {
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
export function visibilityOf(sc, areas) {
  const exact = clean(sc.areas.reduce((s, a) => s + areas[a.key].exact, 0) / sc.areas.length);
  return { exact, score: roundHalfUp(exact) };
}

/** The tier for a Visibility Score. */
export function tierOf(sc, score) {
  return sc.tiers.find((t) => score >= t.min && score <= t.max) || sc.tiers[0];
}

/** Low, medium or high for an area score (the area cards' variants). */
export function bandOf(sc, score) {
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
export function invisibleOf(sc, answers) {
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
export function urgencyOf(sc, invisible, areaScore) {
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
export function rankAreas(sc, areas) {
  return sc.tieOrder.slice().sort((a, b) => areas[a].exact - areas[b].exact || sc.tieOrder.indexOf(a) - sc.tieOrder.indexOf(b));
}

/** The bottleneck (section 12): the lowest area is the primary, the next the secondary. The cascade (sc.cascade, optional:
 *  { effect, causes }): an area that is a symptom of others (for Rempo, Freshness follows from asking) is never the
 *  thing to fix while one of its causes is under strongAt; the lowest such cause becomes the primary (ties: the first in
 *  causes), and the effect is reported as its effect. Every area at strongAt or higher: no bottleneck, "maintenance",
 *  and the lowest area is the next refinement. */
export function bottleneckOf(sc, areas) {
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
export function strongestOf(sc, areas) {
  return sc.strongOrder.slice().sort((a, b) => areas[b].exact - areas[a].exact || sc.strongOrder.indexOf(a) - sc.strongOrder.indexOf(b))[0];
}

/** Which fix-first line shows: "none" when every area is strong; else a line variant (sc.lineVariants: [{ area, key,
 *  when: { questionKey: [values] } }], for Rempo Ask System's "requests go out, but nobody runs them") when its answers
 *  match; else the primary area's own line. */
export function bottleneckLineKey(sc, bottleneck, answers) {
  if (bottleneck.maintenance) return "none";
  const variant = (sc.lineVariants || []).find((v) => v.area === bottleneck.primary && Object.entries(v.when).some(([k, values]) => values.includes(answers[k])));
  return variant ? variant.key : bottleneck.primary;
}

/** The quick wins (section 12, steps 3 and 4). The rule flag first; then, in question order, every 3x or 2x question
 *  scored 0 or 1 in the primary area, then in the secondary area, then any 1x question scored 0 or 1; then, only if
 *  fewer than three, any other answer the table words as a quick win (Q2 techs, D7 within a week, D8 standard
 *  replies). Three at most, never the same words twice. When every area is strong, the quick wins become checks. */
export function quickWinsOf(sc, answers, deepener, bottleneck) {
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
export function ruleFlagOf(sc, deepener) {
  return Boolean(deepener && deepener[sc.ruleFlag.key] === sc.ruleFlag.v);
}

/** The notes the answers add: to the report (by area) and to the call. */
export function notesOf(sc, answers, deepener) {
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
export function fitOf(sc, answers) {
  for (const rule of sc.fit) {
    if (Object.entries(rule.when).some(([k, values]) => values.includes(answers[k]))) return rule.key;
  }
  return sc.qualifiedFit;
}

/** Routing: a call with no checkout link for paper or spreadsheets, or 3 or more Google profiles. */
export function routeOf(sc, answers) {
  for (const [k, values] of Object.entries(sc.callOnly)) {
    if (values.includes(answers[k])) return { callOnly: true, why: k };
  }
  return { callOnly: false, why: null };
}

/** The GTM gap score (higher means a bigger gap), kept in the background and never shown. compare is the top-three
 *  reading filled from the report (ahead, even, behind, far), "unchecked" until then. */
export function gtmGapScoreOf(sc, answers, compare) {
  const g = sc.gtm;
  if (!g) return null;
  const c = compare && compare in g.compare ? compare : "unchecked";
  const parts = [g.asks[answers.asks], g.newest[answers.newest], g.replies[answers.replies], g.jobs[answers.jobs], g.compare[c]];
  return parts.reduce((s, p) => s + (typeof p === "number" ? p : 0), 0);
}

/** The verdict line for the call notes: "Your biggest gap is your Ask System: ... This is the first thing to fix, this month." */
export function verdictOf(sc, bottleneck, lineKey, urgency) {
  if (bottleneck.maintenance) return sc.verdict.maintenance;
  const area = sc.areas.find((a) => a.key === bottleneck.primary);
  const why = sc.verdict[lineKey] || sc.verdict[bottleneck.primary];
  return `Your biggest gap is your ${area.name}: ${why}. ${sc.urgency.words[urgency]}`;
}

/** Everything the screen, the email, the report and the call need, from the answers. Without a deepener this is the
 *  on-screen result (each area is its one hero question); with one, the report's (section 3: "Updated with your 8 extra
 *  answers"). ok is false when a hero question is unanswered. */
export function evaluate(sc, raw, rawDeepener, opts) {
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
export function areaName(sc, key) {
  const a = sc.areas.find((x) => x.key === key);
  return a ? a.name : key;
}

/** Fills {name} placeholders from vars; unknown names are left as they are. */
export function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

/** 168000 -> "$168,000". */
export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** 1560 -> "1,560". */
export function num(n) {
  return Math.round(n).toLocaleString("en-US");
}
