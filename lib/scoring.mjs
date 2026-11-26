// The scoring engine for the First Deal Risk Scorecard (spec 1, docs/spec/1-assessment-logic.md): which answers are
// valid, which deepener questions show, the five area scores, the Deal Readiness Score and tier, the lease-up gap, the
// urgency, the bottleneck (with the cascade rule), the quick wins, the rule flag, the notes, fit, routing and the
// covered-market check.
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
    // A tapped choice, a slider over the same answers ("scale") or typed words matched to one ("text")
    if (s.options && s.type !== "fields") out.push({ key: s.key, options: s.options, step: s });
    else if (s.choice) out.push({ key: s.choice.key, options: s.choice.options, step: s });
  }
  return out;
}

/* ---------- A typed market (content/scorecard.mjs G2): the place, cleaned, and the preset it names ---------- */
const STATES = { alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca", colorado: "co", connecticut: "ct",
  delaware: "de", "district of columbia": "dc", florida: "fl", georgia: "ga", hawaii: "hi", idaho: "id", illinois: "il", indiana: "in",
  iowa: "ia", kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md", massachusetts: "ma", michigan: "mi",
  minnesota: "mn", mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv", "new hampshire": "nh",
  "new jersey": "nj", "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd", ohio: "oh", oklahoma: "ok",
  oregon: "or", pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc", "south dakota": "sd", tennessee: "tn", texas: "tx",
  utah: "ut", vermont: "vt", virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi", wyoming: "wy" };
const STATE_NAMES = Object.keys(STATES).sort((a, b) => b.length - a.length);
const STATE_CODES = new Set(Object.values(STATES));

/** The typed place as kept: a city or metro, never an address. Parts of an address that start with a number (the house
 *  and street) are dropped, then every digit and "#" (house numbers, units, ZIP codes). Up to max characters. */
export function cleanPlace(text, max = 60) {
  let t = String(text == null ? "" : text).replace(/[\u0000-\u001f]+/g, " ");
  if (/\d/.test(t) && t.includes(",")) t = t.split(",").map((p) => p.trim()).filter((p) => p && !/^\d/.test(p)).join(", ");
  t = t.replace(/[0-9#]+/g, " ").replace(/\s+/g, " ").replace(/\s+,/g, ",").replace(/,+/g, ",").replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "");
  return t.slice(0, max).trim();
}

/** Lowercase words, state names as their two-letter codes ("Phoenix, Arizona" is "phoenix az"). */
function placeWords(text) {
  let n = ` ${String(text || "").toLowerCase().replace(/[^a-z]+/g, " ").trim()} `;
  for (const name of STATE_NAMES) n = n.split(` ${name} `).join(` ${STATES[name]} `);
  return n.trim();
}

/** The option a typed place names: the first preset whose aliases appear as whole words, unless the place ends in another
 *  state's code ("Jacksonville, NC", "Dallas, GA"); aliases that carry a state ("arlington tx") need it. Else otherKey. */
export function placeOf(step, text) {
  const n = placeWords(text);
  if (!n) return null;
  const words = n.split(" ");
  const state = words.length > 1 && STATE_CODES.has(words[words.length - 1]) ? words[words.length - 1] : null;
  const hay = ` ${n} `;
  for (const o of step.options) {
    if (!o.aliases || (state && o.state && state !== o.state)) continue;
    if (o.aliases.some((a) => hay.includes(` ${a} `))) return o.v;
  }
  return step.otherKey || "other";
}

/** Every question of the deepener page: the scored deepener questions, then the unscored checklist (sc.checklist), which
 *  has no area and no points, so it never counts toward a score. */
export function deepenerAll(sc) {
  return sc.deepener.concat(sc.checklist || []);
}

/** The scored questions of the hero (Q1 to Q5) and the deepener page's questions (D1 to D10, then the checklist). */
export function scoredQuestions(sc) {
  return sc.steps.filter((s) => s.kind === "scored").concat(deepenerAll(sc));
}

/** The question (hero choice, profiles, or deepener) with this key, or null. */
export function questionOf(sc, key) {
  const h = heroChoices(sc).find((c) => c.key === key);
  if (h) return h.step.options && h.step.type !== "fields" ? h.step : { key, options: h.options, q: h.step.choice.label };
  return deepenerAll(sc).find((d) => d.key === key) || null;
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
    let v = raw && typeof raw[c.key] === "string" ? raw[c.key] : "";
    const st = c.step;
    if (st.type === "text") {
      // Typed words decide the answer, whatever key came with them; without words, only the chip's answer (or, from
      // older pages and the tests, an option's key) stands
      const text = cleanPlace(raw && raw[st.textKey], st.max);
      if (text.replace(/[^a-z]/gi, "").length >= 2) { answers[st.textKey] = text; v = placeOf(st, text); }
    }
    if (c.options.some((o) => o.v === v)) answers[c.key] = v;
    else missing.push(c.key);
  }
  return { answers, missing };
}

/** Whether a deepener question shows, given the hero answers (spec 1, section 7: Q1 "I don't have one yet" hides D1
 *  and D2). */
export function isShown(question, answers) {
  if (!question.hideIf) return true;
  return !Object.entries(question.hideIf).some(([k, values]) => values.includes(answers[k]));
}

/** The deepener questions this visitor sees, in order. */
export function deepenerShown(sc, answers) {
  return deepenerAll(sc).filter((d) => isShown(d, answers));
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

/** The area scores. Per question: points (0 to 4) x weight. Per area: the sum over the questions shown and answered,
 *  divided by the area's maximum for those same questions, x 100 (spec 1, section 3). Skipped and unanswered questions,
 *  and answers with no points ("There's no garage or extra space"), leave both the score and the maximum. With no
 *  deepener, each area is its one 3x hero question. */
export function areaScores(sc, answers, deepener) {
  const all = Object.assign({}, answers, deepener || {});
  const out = {};
  for (const a of sc.areas) {
    let earned = 0, max = 0;
    const used = [];
    for (const q of scoredQuestions(sc)) {
      if (q.area !== a.key) continue;
      const isDeep = deepenerAll(sc).includes(q);
      if (isDeep && (!deepener || !isShown(q, answers))) continue;
      const o = optionOf(sc, q.key, all[q.key]);
      if (!o || typeof o.points !== "number") continue;
      earned += o.points * q.weight;
      max += sc.maxPoints * q.weight;
      used.push(q.key);
    }
    const exact = max ? clean((earned / max) * 100) : 0;
    out[a.key] = { key: a.key, name: a.name, earned, max, exact, score: roundHalfUp(exact), band: bandOf(sc, exact).key, used };
  }
  return out;
}

/** The Deal Readiness Score: the average of the unrounded area scores, rounded half up at the end. */
export function visibilityOf(sc, areas) {
  const exact = clean(sc.areas.reduce((s, a) => s + areas[a.key].exact, 0) / sc.areas.length);
  return { exact, score: roundHalfUp(exact) };
}

/** The tier for a Deal Readiness Score. */
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

/** The lease-up gap (spec 1, section 4). C, the monthly carrying cost (the low end of the range picked); N, the months
 *  the rooms are expected to take to fill (the low end); M, the months of costs the reserves carry (the high end).
 *  Uncovered months = max(0, N - M); the gap = C x uncovered months; the lease-up cost = C x N. Kept in the template's
 *  field names, which storage, the admin, the CSV and the integrations read: unasked = the uncovered months,
 *  workValue = the gap in dollars. Which variant the page, the email and the report show is `kind`:
 *  gap, exact (reserves just cover the plan), covered (with months to spare), costOnly (reserves not sure), perMonth
 *  (lease-up months not sure), monthsShort and monthsCovered (the cost not sure), none (too little to count). */
export function invisibleOf(sc, answers) {
  const t = sc.invisible;
  const pick = (map, v) => (map && Object.prototype.hasOwnProperty.call(map, v) ? map[v] : null);
  const cost = pick(t.cost, answers.carry);
  const lease = pick(t.fill, answers.fillmonths);
  const reserves = pick(t.reserves, answers.reserves);
  const base = { cost, fill: lease, reserves, horizon: t.horizon || 6, uncovered: null, spare: null, exposure: null, unasked: null, workValue: null };
  if (cost === null) {
    if (lease === null || reserves === null) return Object.assign(base, { kind: "none" });
    const uncovered = Math.max(0, lease - reserves);
    return Object.assign(base, { kind: uncovered > 0 ? "monthsShort" : "monthsCovered", uncovered, unasked: uncovered, spare: Math.max(0, reserves - lease) });
  }
  if (lease === null) return Object.assign(base, { kind: "perMonth" });
  const exposure = cost * lease;
  if (reserves === null) return Object.assign(base, { kind: "costOnly", exposure });
  const uncovered = Math.max(0, lease - reserves);
  const spare = Math.max(0, reserves - lease);
  return Object.assign(base, { kind: uncovered > 0 ? "gap" : spare > 0 ? "covered" : "exact", exposure, uncovered, spare, unasked: uncovered, workValue: cost * uncovered });
}

/** Urgency (spec 1, section 8), applied to the primary bottleneck: critical, significant or moderate. It reads one
 *  area (sc.urgency.area) and the metric's count (sc.urgency.countField, "unasked": the uncovered months). With
 *  countFirst, the count decides first (critical and significant thresholds); a count of 0 (zeroUsesArea) or no count
 *  falls back on the area: at criticalAt or below critical, at moderateAt or above moderate, otherwise unknownDefault.
 *  Without countFirst (the template's default), the area at moderateAt or above is moderate before the count is read. */
export function urgencyOf(sc, invisible, areaScore) {
  const u = sc.urgency;
  const cov = clean(areaScore);
  const moderateAt = u.moderateAt !== undefined ? u.moderateAt : u.moderateCoverage;
  const criticalAt = u.criticalAt !== undefined ? u.criticalAt : u.criticalCoverage;
  const hasModerate = typeof moderateAt === "number";
  const count = invisible[u.countField || "unasked"];
  if (!u.countFirst && hasModerate && cov >= moderateAt) return "moderate";
  if (typeof count === "number") {
    if (count >= u.critical) return "critical";
    if (count >= u.significant) return "significant";
    if (!u.zeroUsesArea) return "moderate";
  }
  if (invisible.kind === "all") return "moderate";
  if (cov <= criticalAt) return "critical";
  if (u.countFirst && hasModerate && cov >= moderateAt) return "moderate";
  return u.unknownDefault;
}

/** The areas ranked lowest first; ties go upstream first (sc.tieOrder: rent, fill, supply, mix, reserves). */
export function rankAreas(sc, areas) {
  return sc.tieOrder.slice().sort((a, b) => areas[a].exact - areas[b].exact || sc.tieOrder.indexOf(a) - sc.tieOrder.indexOf(b));
}

/** The bottleneck (spec 1, section 9): the lowest area is the primary, the next the secondary. The cascade (sc.cascade,
 *  optional: { effect, causes } or a list of them): an area that is an effect of others (Room Mix and Lease-up Reserves
 *  follow from Rent Evidence and Fill Speed) is never the thing to fix while one of its causes is under strongAt; the
 *  lowest such cause becomes the primary (ties: the first in causes), and the effect is reported as its effect. Every
 *  area at strongAt or higher: no bottleneck, "maintenance", and the lowest area is the next refinement. */
export function bottleneckOf(sc, areas) {
  const ranking = rankAreas(sc, areas);
  const maintenance = sc.areas.every((a) => areas[a.key].exact >= sc.strongAt);
  let primary = ranking[0];
  let cascade = null;
  const cascades = [].concat(sc.cascade || [], sc.cascadeAlso || []);
  const cs = cascades.find((c) => c.effect === primary);
  if (!maintenance && cs && cs.causes.some((k) => areas[k] && areas[k].exact < sc.strongAt)) {
    const cause = cs.causes.filter((k) => areas[k]).reduce((best, k) => (areas[k].exact < areas[best].exact ? k : best));
    cascade = { effect: cs.effect, cause };
    primary = cause;
  }
  const secondary = ranking.find((k) => k !== primary);
  return { primary, secondary, cascade, maintenance, ranking };
}

/** The strongest area: the highest score; ties in report order (sc.strongOrder). */
export function strongestOf(sc, areas) {
  return sc.strongOrder.slice().sort((a, b) => areas[b].exact - areas[a].exact || sc.strongOrder.indexOf(a) - sc.strongOrder.indexOf(b))[0];
}

/** Which fix-first line shows: "none" when every area is strong; else a line variant (sc.lineVariants: [{ area, key,
 *  when: { questionKey: [values] } }], for example Rent Evidence's "a platform's earnings calculator is an estimate")
 *  when its answers match; else the primary area's own line. */
export function bottleneckLineKey(sc, bottleneck, answers) {
  if (bottleneck.maintenance) return "none";
  const variant = (sc.lineVariants || []).find((v) => v.area === bottleneck.primary && Object.entries(v.when).some(([k, values]) => values.includes(answers[k])));
  return variant ? variant.key : bottleneck.primary;
}

/** The quick wins (spec 1, section 9, step 6). The rule flag first; then, in question order, every 3x or 2x question
 *  scored 0 or 1 in the primary area, then in the secondary area, then any 1x question scored 0 or 1; then, only if
 *  fewer than three, any other answer the table words as a quick win, area by area. Three at most, never the same
 *  words twice. Answers with no points never count as weak. When every area is strong, the quick wins become checks. */
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
    const isDeep = deepenerAll(sc).includes(q);
    if (isDeep && (!deepener || !isShown(q, answers))) return false;
    return Boolean(optionOf(sc, q.key, all[q.key]));
  });
  const weak = (q) => { const p = optionOf(sc, q.key, all[q.key]).points; return typeof p === "number" && p <= 1; };
  // The rule flag first: the template's (a deepener answer with quick-win words) or the checklist's (its own words)
  const cf = sc.checklistFlag;
  if (cf && deepener && [].concat(cf.v).includes(deepener[cf.key])) { seen.add(cf.text); out.push({ area: null, key: cf.key, v: deepener[cf.key], text: cf.text, flag: true }); }
  else if (sc.ruleFlag && ruleFlagOf(sc, deepener)) push(live.find((q) => q.key === sc.ruleFlag.key), true);
  for (const q of live) if (q.area === bottleneck.primary && q.weight >= 2 && weak(q)) push(q);
  for (const q of live) if (q.area === bottleneck.secondary && q.weight >= 2 && weak(q)) push(q);
  for (const q of live) if (q.weight === 1 && weak(q)) push(q);
  const byArea = [bottleneck.primary, bottleneck.secondary].concat(bottleneck.ranking);
  for (const area of byArea) for (const q of live) if (q.area === area) push(q);
  return out;
}

/** True when a rule flag is set: the template's (sc.ruleFlag: { key, v }) or the checklist's (sc.checklistFlag: { key,
 *  v: [answers] }, for RoomIQ an unconfirmed check of the city's rule on unrelated adults). */
export function ruleFlagOf(sc, deepener) {
  if (!deepener) return false;
  const cf = sc.checklistFlag;
  if (cf && [].concat(cf.v).includes(deepener[cf.key])) return true;
  const rf = sc.ruleFlag;
  return Boolean(rf && [].concat(rf.v).includes(deepener[rf.key]));
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

/** The fit stored with the lead (and the condition for Meta's Schedule event): "qualified", or the first fit rule the
 *  answers meet. */
export function fitOf(sc, answers) {
  for (const rule of sc.fit) {
    if (Object.entries(rule.when).some(([k, values]) => values.includes(answers[k]))) return rule.key;
  }
  return sc.qualifiedFit;
}

/** Routing: the walkthrough first, with no free-forecast push or checkout link (sc.callOnly: for RoomIQ, more than 10
 *  houses). */
export function routeOf(sc, answers) {
  for (const [k, values] of Object.entries(sc.callOnly)) {
    if (values.includes(answers[k])) return { callOnly: true, why: k };
  }
  return { callOnly: false, why: null };
}

/** The template's outbound gap score (higher means a bigger gap), kept in the background and never shown; null when
 *  the scorecard has none (sc.gtm null, as for RoomIQ). */
export function gtmGapScoreOf(sc, answers, compare) {
  const g = sc.gtm;
  if (!g) return null;
  const c = compare && compare in g.compare ? compare : "unchecked";
  const parts = [g.asks[answers.asks], g.newest[answers.newest], g.replies[answers.replies], g.jobs[answers.jobs], g.compare[c]];
  return parts.reduce((s, p) => s + (typeof p === "number" ? p : 0), 0);
}

/** The verdict line for the call notes: "Your biggest gap is your Fill Speed: ... This is the first thing to fix, before
 *  you make an offer." */
export function verdictOf(sc, bottleneck, lineKey, urgency) {
  if (bottleneck.maintenance) return sc.verdict.maintenance;
  const area = sc.areas.find((a) => a.key === bottleneck.primary);
  const why = sc.verdict[lineKey] || sc.verdict[bottleneck.primary];
  return `Your biggest gap is your ${area.name}: ${why}. ${sc.urgency.words[urgency]}`;
}

/** Whether the market answer is one where the free forecast is offered (sc.markets.covered); true when the scorecard
 *  lists no markets. */
export function coveredOf(sc, answers) {
  const m = sc.markets;
  return !m || !Array.isArray(m.covered) ? true : m.covered.includes(answers.market);
}

/** The cascade line ("Your Room Mix score follows from your Fill Speed score: ..."), or null. */
export function cascadeLineOf(sc, bottleneck) {
  const c = bottleneck && bottleneck.cascade;
  if (!c) return null;
  const t = (sc.cascadeLines && sc.cascadeLines[c.effect]) || sc.cascadeLine || "";
  return t ? fill(t, { cause: areaName(sc, c.cause), effect: areaName(sc, c.effect) }) : null;
}

/** Everything the screen, the email, the report and the call need, from the answers. Without a deepener this is the
 *  on-screen result (each area is its one hero question); with one, the report's ("Updated with your extra answers").
 *  ok is false when a hero question is unanswered. */
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
  // The segment question (sc.segmentKey: for RoomIQ the stage) sets the words in the copy ("first deal", "next deal")
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
    bottleneck: Object.assign({}, bottleneck, { lineKey, line: sc.bottleneckLines[lineKey], cascadeLine: cascadeLineOf(sc, bottleneck) }),
    strongest: strongestOf(sc, areas),
    quickWins: quickWinsOf(sc, answers, deepener, bottleneck),
    ruleFlag: ruleFlagOf(sc, deepener),
    notes,
    verdict: verdictOf(sc, bottleneck, lineKey, urgency),
    fit,
    qualified: fit === sc.qualifiedFit,
    callOnly: route.callOnly,
    why: route.why,
    covered: coveredOf(sc, answers),
    market: answers.market || null,
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

/** 4000 -> "$4,000". */
export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** 1560 -> "1,560". */
export function num(n) {
  return Math.round(n).toLocaleString("en-US");
}

/** 1 -> "1 month", 3 -> "3 months" (the lease-up gap's months, with their unit). */
export function months(n) {
  return n === 1 ? "1 month" : `${n} months`;
}

/** The lease-up gap's words for the copy: dollars and months with their units, null where unknown. */
export function gapVars(iw) {
  const m = (n) => (typeof n === "number" ? months(n) : null);
  const d = (n) => (typeof n === "number" ? money(n) : null);
  return {
    gap: d(iw.workValue), cost: d(iw.cost), exposure: d(iw.exposure),
    fill_months: m(iw.fill), reserve_months: m(iw.reserves), uncovered_months: m(iw.uncovered), spare_months: m(iw.spare)
  };
}
