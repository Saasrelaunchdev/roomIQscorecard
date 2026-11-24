// The scoring engine against spec 1 (docs/spec/1-assessment-logic.md): the worked example on screen and in the report,
// the branching, every lease-up gap variant, urgency, the bottleneck and its two-effect cascade, quick wins, the rule
// flag, fit, routing and the covered markets. If one of these fails, the scorecard no longer does what the spec says.
import { test } from "node:test";
import assert from "node:assert/strict";
import SC from "../../content/scorecard.mjs";
import {
  evaluate, areaScores, roundHalfUp, invisibleOf, urgencyOf, bottleneckOf, strongestOf, quickWinsOf, deepenerShown,
  cleanDeepener, fitOf, routeOf, gtmGapScoreOf, tierOf, bandOf, fill, money, months, gapVars, coveredOf
} from "../../lib/scoring.mjs";

// The worked example (spec 1, section 11): Jordan, a made-up first-time investor looking at houses in Atlanta
const HERO = { stage: "looking", market: "atlanta", rentsource: "listings", fillsource: "vacancy", supply: "counted", bathmix: "notyet", slowplan: "weeks", carry: "2to3k", fillmonths: "m3", reserves: "m1" };
const DEEP = { rentperroom: "split", rentcomps: "few", occsource: "rule", launch: "whenever", newsupply: "think", pricedrops: "unsure", roomcount: "max", sizemix: "assume", dealmath: "mine", stress: "vacancy", zoning: "notyet", financing: "wholehome" };
const area = (r) => Object.fromEntries(Object.entries(r.areas).map(([k, v]) => [k, v.score]));

test("worked example, on screen: 50, 25, 50, 0, 50 and a Deal Readiness Score of 35, Beginner", () => {
  const r = evaluate(SC, HERO);
  assert.equal(r.ok, true);
  assert.deepEqual(area(r), { rent: 50, fill: 25, supply: 50, mix: 0, reserves: 50 });
  assert.equal(r.scoreExact, 35);
  assert.equal(r.score, 35);
  assert.equal(r.tier, "beginner");
  assert.equal(r.tierName, "Beginner: underwriting on assumptions");
  assert.deepEqual(Object.fromEntries(Object.entries(r.areas).map(([k, v]) => [k, v.band])), { rent: "medium", fill: "low", supply: "medium", mix: "low", reserves: "medium" });
  // Room Mix is lowest, but it follows from the two borrowed numbers: the lower of them, Fill Speed, is fixed first
  assert.equal(r.bottleneck.primary, "fill");
  assert.deepEqual(r.bottleneck.cascade, { effect: "mix", cause: "fill" });
  assert.equal(r.bottleneck.secondary, "mix");
  assert.equal(r.bottleneck.lineKey, "fillVacancy");
  assert.equal(r.bottleneck.line, "An assumed vacancy rate isn't fill speed. Check how fast comparable rooms near the house actually filled.");
  assert.equal(r.bottleneck.cascadeLine, "Your Room Mix score follows from your Fill Speed score: a bath mix is priced from what rooms rent for and how fast they fill, by bath type.");
});

test("worked example, the lease-up gap: $2,000 x (3 minus 1) = $4,000; the lease-up costs $6,000", () => {
  const iw = evaluate(SC, HERO).invisible;
  assert.equal(iw.kind, "gap");
  assert.equal(iw.cost, 2000);
  assert.equal(iw.fill, 3);
  assert.equal(iw.reserves, 1);
  assert.equal(iw.uncovered, 2);
  assert.equal(iw.unasked, 2);
  assert.equal(iw.workValue, 4000);
  assert.equal(iw.exposure, 6000);
  assert.equal(money(iw.workValue), "$4,000");
  assert.deepEqual(gapVars(iw), { gap: "$4,000", cost: "$2,000", exposure: "$6,000", fill_months: "3 months", reserve_months: "1 month", uncovered_months: "2 months", spare_months: "0 months" });
});

test("worked example, with the deepener: 46, 25, 33, 13, 46 and 33 (32.5 rounded half up)", () => {
  const r = evaluate(SC, HERO, DEEP);
  assert.equal(r.deepened, true);
  assert.deepEqual(area(r), { rent: 46, fill: 25, supply: 33, mix: 13, reserves: 46 });
  assert.equal(r.areas.rent.exact, 45.833333333);
  assert.equal(r.areas.supply.exact, 33.333333333);
  assert.equal(r.areas.mix.exact, 12.5);
  assert.equal(r.areas.mix.max, 24);
  assert.equal(r.areas.mix.earned, 3);
  assert.equal(r.scoreExact, 32.5);
  assert.equal(r.score, 33);
  assert.equal(r.tier, "beginner");
  assert.equal(r.bottleneck.primary, "fill");
  assert.equal(r.bottleneck.secondary, "mix");
  assert.deepEqual(r.bottleneck.cascade, { effect: "mix", cause: "fill" });
  // The metric asks no deepener question, so it does not change
  assert.equal(r.invisible.workValue, 4000);
});

test("worked example, section 11 output: quick wins, critical urgency and the verdict line", () => {
  const screen = evaluate(SC, HERO);
  assert.deepEqual(screen.quickWins.map((q) => `${q.key}:${q.v}`), ["fillsource:vacancy", "bathmix:notyet", "rentsource:listings"]);
  assert.equal(screen.urgency, "critical");
  assert.equal(screen.verdict, "Your biggest gap is your Fill Speed: your plan assumes a vacancy rate instead of how fast rooms nearby fill. This is the first thing to fix, before you make an offer.");
  const report = evaluate(SC, HERO, DEEP);
  assert.deepEqual(report.quickWins.map((q) => `${q.key}:${q.v}`), ["zoning:notyet", "fillsource:vacancy", "occsource:rule"]);
  assert.equal(report.quickWins[0].flag, true);
  assert.equal(report.quickWins[0].text, "Read your city's rule on unrelated adults sharing a home, then confirm it with the city or an attorney");
  assert.equal(report.ruleFlag, true);
  assert.deepEqual(report.notes.report.map((n) => `${n.key}:${n.area}`), ["stress:reserves", "roomcount:mix"]);
  assert.deepEqual(report.notes.call.map((n) => n.key), ["zoning", "financing", "stress"]);
});

test("rounding is half up, at the end", () => {
  assert.equal(roundHalfUp(12.5), 13);
  assert.equal(roundHalfUp(37.5), 38);
  assert.equal(roundHalfUp((100 * 11) / 24), 46);
  assert.equal(roundHalfUp((100 * 8) / 24), 33);
  assert.equal(roundHalfUp(0.145 * 100), 15);
});

test("branching: 'I don't have one yet' hides D1 and D2; the checklist always shows", () => {
  assert.deepEqual(deepenerShown(SC, HERO).map((d) => d.id), ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "C1", "C2"], "the checklist after the scored questions");
  assert.deepEqual(deepenerShown(SC, { ...HERO, rentsource: "none" }).map((d) => d.id), ["D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "C1", "C2"]);
  // A hidden question's answer is dropped, never counted
  const { deepener } = cleanDeepener(SC, { ...HERO, rentsource: "none" }, DEEP);
  assert.equal(deepener.rentperroom, undefined);
  assert.equal(deepener.zoning, "notyet");
});

test("a skipped question, or an answer with no points, leaves both the score and the maximum", () => {
  // Rent Evidence with D1 and D2 hidden: only Q1 (0 of 12)
  const a = areaScores(SC, { ...HERO, rentsource: "none" }, { occsource: "observed" });
  assert.equal(a.rent.max, 12);
  assert.equal(a.rent.score, 0);
  // Room Mix: Q4 12 + D7 8 when D8 is left unanswered
  const b = areaScores(SC, { ...HERO, bathmix: "modeled" }, { roomcount: "checked" });
  assert.equal(b.mix.max, 20);
  assert.equal(b.mix.score, 100);
  // An option with no points (supported for questions that may not apply) counts for neither
  const sc2 = { ...SC, deepener: SC.deepener.map((d) => (d.key === "sizemix" ? { ...d, options: [...d.options, { v: "na", label: "n/a", points: null }] } : d)) };
  assert.equal(areaScores(sc2, { ...HERO, bathmix: "modeled" }, { roomcount: "checked", sizemix: "na" }).mix.max, 20);
  // The checklist never touches a score
  const c = areaScores(SC, HERO, { zoning: "confirmed", financing: "cash" });
  assert.deepEqual(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.max])), { rent: 12, fill: 12, supply: 12, mix: 12, reserves: 12 });
});

test("the lease-up gap: every variant of spec 1, section 4", () => {
  const k = (o) => invisibleOf(SC, { ...HERO, ...o });
  // Costs at the low end, "Under $2,000" at half the cap; "4 months or more" at 4; reserves at the high end
  assert.equal(k({ carry: "lt2k" }).workValue, 2000);
  assert.equal(k({ carry: "over4k", fillmonths: "m4", reserves: "none" }).workValue, 16000);
  assert.equal(k({ fillmonths: "m4", reserves: "m3" }).workValue, 2000);
  const exact = k({ fillmonths: "m1", reserves: "m1" });
  assert.equal(exact.kind, "exact");
  assert.equal(exact.workValue, 0);
  assert.equal(exact.unasked, 0);
  const covered = k({ fillmonths: "m2", reserves: "m6" });
  assert.equal(covered.kind, "covered");
  assert.equal(covered.spare, 4);
  assert.equal(covered.exposure, 4000);
  const costOnly = k({ reserves: "unsure" });
  assert.equal(costOnly.kind, "costOnly");
  assert.equal(costOnly.exposure, 6000);
  assert.equal(costOnly.workValue, null);
  assert.equal(costOnly.unasked, null);
  const perMonth = k({ fillmonths: "unsure" });
  assert.equal(perMonth.kind, "perMonth");
  assert.equal(perMonth.cost, 2000);
  assert.equal(perMonth.exposure, null);
  const short = k({ carry: "unsure" });
  assert.equal(short.kind, "monthsShort");
  assert.equal(short.unasked, 2);
  assert.equal(short.workValue, null);
  assert.equal(k({ carry: "unsure", reserves: "m3" }).kind, "monthsCovered");
  assert.equal(k({ carry: "unsure", reserves: "unsure" }).kind, "none");
  assert.equal(k({ carry: "unsure", fillmonths: "unsure" }).kind, "none");
  assert.equal(months(1), "1 month");
  assert.equal(months(4), "4 months");
});

test("urgency: uncovered months first, then Rent Evidence", () => {
  const iw = (unasked, kind = "gap") => ({ unasked, kind });
  assert.equal(urgencyOf(SC, iw(2), 100), "critical");
  assert.equal(urgencyOf(SC, iw(4), 50), "critical");
  assert.equal(urgencyOf(SC, iw(1), 100), "significant");
  // No gap: Rent Evidence decides
  assert.equal(urgencyOf(SC, iw(0, "covered"), 25), "critical");
  assert.equal(urgencyOf(SC, iw(0, "covered"), 50), "significant");
  assert.equal(urgencyOf(SC, iw(0, "exact"), 100), "moderate");
  // No count at all: the same fallback
  assert.equal(urgencyOf(SC, { unasked: null, kind: "costOnly" }, 0), "critical");
  assert.equal(urgencyOf(SC, { unasked: null, kind: "perMonth" }, 50), "significant");
  assert.equal(urgencyOf(SC, { unasked: null, kind: "none" }, 100), "moderate");
});

test("cascade: Room Mix and Lease-up Reserves follow from Rent Evidence and Fill Speed", () => {
  const areas = (rent, fillA, supply, mix, reserves) => ({ rent: { exact: rent }, fill: { exact: fillA }, supply: { exact: supply }, mix: { exact: mix }, reserves: { exact: reserves } });
  const b = bottleneckOf(SC, areas(50, 100, 50, 0, 50));
  assert.equal(b.primary, "rent");
  assert.deepEqual(b.cascade, { effect: "mix", cause: "rent" });
  assert.equal(b.secondary, "mix");
  const b2 = bottleneckOf(SC, areas(100, 50, 100, 100, 25));
  assert.equal(b2.primary, "fill");
  assert.deepEqual(b2.cascade, { effect: "reserves", cause: "fill" });
  // Ties between the causes go to Rent Evidence
  assert.equal(bottleneckOf(SC, areas(50, 50, 100, 0, 100)).primary, "rent");
  // Both causes strong: the effect itself is the primary
  const b3 = bottleneckOf(SC, areas(100, 75, 100, 25, 100));
  assert.equal(b3.primary, "mix");
  assert.equal(b3.cascade, null);
  // Nearby Supply is a fact of the street, never an effect
  const b4 = bottleneckOf(SC, areas(50, 50, 0, 100, 100));
  assert.equal(b4.primary, "supply");
  assert.equal(b4.cascade, null);
  // Ties go upstream: rent, fill, supply, mix, reserves
  assert.equal(bottleneckOf(SC, areas(50, 50, 50, 50, 50)).primary, "rent");
  assert.equal(bottleneckOf(SC, areas(100, 100, 50, 100, 50)).primary, "supply");
});

test("all strong: maintenance, the refinement area, and checks instead of quick wins", () => {
  const hero = { ...HERO, rentsource: "comps", fillsource: "observed", supply: "known", bathmix: "modeled", slowplan: "sized" };
  const r = evaluate(SC, hero);
  assert.deepEqual(area(r), { rent: 100, fill: 100, supply: 100, mix: 100, reserves: 100 });
  assert.equal(r.score, 100);
  assert.equal(r.tier, "advanced");
  assert.equal(r.bottleneck.maintenance, true);
  assert.equal(r.bottleneck.primary, "rent");
  assert.equal(r.bottleneck.lineKey, "none");
  assert.equal(r.quickWins.length, 3);
  assert.ok(r.quickWins.every((q) => q.check));
  assert.equal(r.verdict, SC.verdict.maintenance);
});

test("the rule flag puts the zoning check first for 'Not yet', 'I asked around' and 'I read a summary online'", () => {
  for (const v of ["notyet", "asked", "summary"]) {
    const r = evaluate(SC, HERO, { ...DEEP, zoning: v });
    assert.equal(r.ruleFlag, true);
    assert.equal(r.quickWins[0].key, "zoning");
    assert.equal(r.quickWins.length, 3);
  }
  for (const v of ["code", "confirmed"]) {
    const r = evaluate(SC, HERO, { ...DEEP, zoning: v });
    assert.equal(r.ruleFlag, false);
    assert.notEqual(r.quickWins[0].key, "zoning");
  }
});

test("line variants: a calculator or a whole-home rent on Rent Evidence; an assumed vacancy rate on Fill Speed", () => {
  const strongFill = { fillsource: "observed", supply: "known", bathmix: "modeled", slowplan: "sized" };
  assert.equal(evaluate(SC, { ...HERO, ...strongFill, rentsource: "calculator" }).bottleneck.lineKey, "rentCalculator");
  assert.equal(evaluate(SC, { ...HERO, ...strongFill, rentsource: "divide" }).bottleneck.lineKey, "rentDivide");
  assert.equal(evaluate(SC, { ...HERO, ...strongFill, rentsource: "none" }).bottleneck.lineKey, "rent");
  assert.equal(evaluate(SC, { ...HERO, rentsource: "comps", fillsource: "none" }).bottleneck.lineKey, "fill");
});

test("the strongest area: the highest score, ties in report order", () => {
  const areas = (rent, fillA, supply, mix, reserves) => ({ rent: { exact: rent }, fill: { exact: fillA }, supply: { exact: supply }, mix: { exact: mix }, reserves: { exact: reserves } });
  assert.equal(strongestOf(SC, areas(50, 50, 100, 100, 25)), "supply");
  assert.equal(strongestOf(SC, areas(100, 100, 100, 100, 100)), "rent");
});

test("fit, routing and covered markets (spec 1, section 10)", () => {
  assert.equal(fitOf(SC, HERO), "qualified");
  assert.equal(fitOf(SC, { ...HERO, stage: "learning" }), "learning");
  assert.equal(fitOf(SC, { ...HERO, market: "other" }), "outside");
  assert.equal(fitOf(SC, { ...HERO, market: "undecided" }), "outside");
  assert.deepEqual(routeOf(SC, HERO), { callOnly: false, why: null });
  assert.deepEqual(routeOf(SC, { ...HERO, stage: "scaling" }), { callOnly: true, why: "stage" });
  for (const m of ["dfw", "houston", "atlanta", "orlando", "jacksonville", "phoenix", "lasvegas"]) assert.equal(coveredOf(SC, { market: m }), true);
  assert.equal(coveredOf(SC, { market: "other" }), false);
  assert.equal(coveredOf(SC, { market: "undecided" }), false);
  const r = evaluate(SC, { ...HERO, stage: "operator", market: "other" });
  assert.equal(r.qualified, false);
  assert.equal(r.covered, false);
  assert.equal(r.service, "next deal");
  assert.equal(r.trade, "operator");
});

test("no outbound gap score for this scorecard", () => {
  assert.equal(gtmGapScoreOf(SC, HERO), null);
  assert.equal(evaluate(SC, HERO).gtmGapScore, null);
});

test("tiers and bands: the GTM's three tiers", () => {
  assert.equal(tierOf(SC, 0).key, "beginner");
  assert.equal(tierOf(SC, 39).key, "beginner");
  assert.equal(tierOf(SC, 40).key, "intermediate");
  assert.equal(tierOf(SC, 69).key, "intermediate");
  assert.equal(tierOf(SC, 70).key, "advanced");
  assert.equal(tierOf(SC, 100).key, "advanced");
  assert.equal(bandOf(SC, 25).key, "low");
  assert.equal(bandOf(SC, 50).key, "medium");
  assert.equal(bandOf(SC, 75).key, "high");
  assert.equal(bandOf(SC, 39.5).key, "medium");
});

test("an unanswered hero question is reported, not scored as zero", () => {
  const { carry, ...rest } = HERO;
  const r = evaluate(SC, rest);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["carry"]);
  const bad = evaluate(SC, { ...HERO, bathmix: "made-up" });
  assert.deepEqual(bad.missing, ["bathmix"]);
});

test("the quick wins never repeat words, and the rule flag needs the deepener", () => {
  const r = evaluate(SC, { ...HERO, rentsource: "none", fillsource: "none", supply: "none", bathmix: "notyet", slowplan: "none" });
  const texts = r.quickWins.map((q) => q.text);
  assert.equal(new Set(texts).size, texts.length);
  assert.equal(r.ruleFlag, false);
  assert.equal(quickWinsOf(SC, r.answers, null, r.bottleneck).length, 3);
});

test("fill leaves unknown placeholders alone", () => {
  assert.equal(fill("Hi {firstName}, {x}", { firstName: "Sam" }), "Hi Sam, {x}");
});
