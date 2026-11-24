// The scoring engine against Deliverable 1 (docs/spec/1-assessment-logic.md): the worked example on screen and in the
// report, the branching, the invisible work cases, urgency, the bottleneck and its cascade, quick wins, the rule flag,
// fit, routing and the GTM gap score. If one of these fails, the scorecard no longer does what the spec says.
import { test } from "node:test";
import assert from "node:assert/strict";
import SC from "../../content/scorecard.mjs";
import {
  evaluate, areaScores, roundHalfUp, invisibleOf, urgencyOf, bottleneckOf, strongestOf, quickWinsOf, deepenerShown,
  cleanDeepener, fitOf, routeOf, gtmGapScoreOf, tierOf, bandOf, fill, money
} from "../../lib/scoring.mjs";

// The worked example (section 3): an HVAC shop, 16 to 40 jobs a week, tickets of $300 to $750, jobs in job software,
// one location
const HERO = { trade: "hvac", jobs: "16to40", asked10: "1to3", asks: "remember", newest: "1to3", replies: "some", ticket: "300to750", records: "fieldsoftware", profiles: "1" };
const DEEP = { d1: "most", d2: "most", d3: "nothing", d4: "stops", d5: "drops", d6: "no", d7: "week", d8: "standard" };
const area = (r) => Object.fromEntries(Object.entries(r.areas).map(([k, v]) => [k, v.score]));

test("worked example, on screen: 25, 25, 50, 50 and a Visibility Score of 38 (37.5 rounded half up)", () => {
  const r = evaluate(SC, HERO);
  assert.equal(r.ok, true);
  assert.deepEqual(area(r), { coverage: 25, system: 25, freshness: 50, replies: 50 });
  assert.equal(r.scoreExact, 37.5);
  assert.equal(r.score, 38);
  assert.equal(r.tier, "somedays");
  assert.equal(r.tierName, "The Some-Days Shop");
  // The tie between Coverage and System at 25 goes upstream first
  assert.equal(r.bottleneck.primary, "coverage");
  assert.equal(r.bottleneck.secondary, "system");
  assert.equal(r.bottleneck.line, SC.bottleneckLines.coverage);
});

test("worked example, invisible work: 560 customers a year and $168,000 (section 4)", () => {
  const iw = evaluate(SC, HERO).invisible;
  assert.equal(iw.kind, "known");
  assert.equal(iw.jobs, 16);
  assert.equal(iw.notAsked, 7);
  assert.equal(iw.ticket, 300);
  assert.equal(iw.unasked, 560);
  assert.equal(iw.workValue, 168000);
  assert.equal(money(iw.workValue), "$168,000");
});

test("worked example, with the deepener: 50, 13, 38, 50; still 38; the bottleneck becomes Ask System (section 3)", () => {
  const r = evaluate(SC, HERO, DEEP);
  assert.equal(r.deepened, true);
  assert.deepEqual(area(r), { coverage: 50, system: 13, freshness: 38, replies: 50 });
  assert.equal(r.areas.system.exact, 12.5);
  assert.equal(r.areas.freshness.exact, 37.5);
  assert.equal(r.score, 38);
  assert.equal(r.tier, "somedays");
  assert.equal(r.bottleneck.primary, "system");
  assert.equal(r.bottleneck.secondary, "freshness");
  assert.equal(r.bottleneck.cascade, null);
});

test("worked example, section 12 output: the three quick wins, critical urgency and the verdict line", () => {
  const r = evaluate(SC, HERO, DEEP);
  assert.deepEqual(r.quickWins.map((q) => q.key), ["asks", "d3", "d5"]);
  assert.equal(r.quickWins[0].text, "Move the ask out of memory: send it when the job closes in your software");
  assert.equal(r.quickWins[1].text, "Add one reminder three to five days later, then stop");
  assert.ok(r.quickWins[2].text.startsWith("Keep sending requests in your busiest weeks"));
  assert.equal(r.urgency, "critical");
  assert.equal(r.verdict, "Your biggest gap is your Ask System: asking depends on someone remembering, and it stops when you're busiest. This is the first thing to fix, this month.");
});

test("rounding is half up, at the end (section 3)", () => {
  assert.equal(roundHalfUp(12.5), 13);
  assert.equal(roundHalfUp(37.5), 38);
  assert.equal(roundHalfUp(2.5), 3);
  assert.equal(roundHalfUp((100 * 7) / 12), 58);
  // 0.145 x 100 is 14.499999999999998 in floating point; the true value is 14.5, which rounds up
  assert.equal(roundHalfUp(0.145 * 100), 15);
});

test("branching: Q1 All 10 hides D1; Q2 'We don't really ask' hides D3 and D4; Q4 Never hides D8 (section 10)", () => {
  assert.deepEqual(deepenerShown(SC, HERO).map((d) => d.id), ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"]);
  assert.deepEqual(deepenerShown(SC, { ...HERO, asked10: "all" }).map((d) => d.id), ["D2", "D3", "D4", "D5", "D6", "D7", "D8"]);
  assert.deepEqual(deepenerShown(SC, { ...HERO, asks: "none" }).map((d) => d.id), ["D1", "D2", "D5", "D6", "D7", "D8"]);
  assert.deepEqual(deepenerShown(SC, { ...HERO, replies: "never" }).map((d) => d.id), ["D1", "D2", "D3", "D4", "D5", "D6", "D7"]);
  // A hidden question's answer is dropped, never counted
  const { deepener } = cleanDeepener(SC, { ...HERO, asks: "none" }, DEEP);
  assert.equal("d3" in deepener, false);
  assert.equal("d4" in deepener, false);
});

test("a skipped question leaves both the score and the maximum (section 3)", () => {
  const hero = { ...HERO, asks: "none" };
  const a = areaScores(SC, hero, { d1: "most", d2: "most", d5: "drops", d6: "no", d7: "week", d8: "standard" });
  // Ask System: only Q2 is shown (0 of 12), not 0 of 24
  assert.equal(a.system.max, 12);
  assert.equal(a.system.score, 0);
  const b = areaScores(SC, { ...HERO, asked10: "all" }, { d2: "every" });
  // Ask Coverage: Q1 12 + D2 4 = 16 of 16 (D1 hidden)
  assert.equal(b.coverage.max, 16);
  assert.equal(b.coverage.score, 100);
});

test("invisible work: every case of section 4", () => {
  assert.equal(invisibleOf(SC, { ...HERO, asked10: "all" }).kind, "all");
  assert.equal(invisibleOf(SC, { ...HERO, asked10: "unsure" }).kind, "unsure");
  assert.equal(invisibleOf(SC, { ...HERO, jobs: "unsure" }).kind, "jobsUnsure");
  const avg = invisibleOf(SC, { ...HERO, ticket: "unsure" });
  assert.equal(avg.kind, "average");
  assert.equal(avg.ticket, 350);
  assert.equal(avg.workValue, 196000);
  assert.equal(invisibleOf(SC, { ...HERO, trade: "plumbing", ticket: "unsure" }).ticket, 338);
  const count = invisibleOf(SC, { ...HERO, trade: "other", ticket: "unsure" });
  assert.equal(count.kind, "count");
  assert.equal(count.unasked, 560);
  assert.equal(count.workValue, null);
  // Fewer than 5 jobs uses 2; more than 40 uses 41; the count rounds down to the nearest 10
  assert.equal(invisibleOf(SC, { ...HERO, jobs: "lt5", asked10: "none" }).unasked, 100);
  assert.equal(invisibleOf(SC, { ...HERO, jobs: "over40", asked10: "7to9" }).unasked, 200);
  // The value rounds down to the nearest $1,000: 70 customers x $150 = $10,500 -> $10,000
  assert.equal(invisibleOf(SC, { ...HERO, jobs: "lt5", asked10: "1to3", ticket: "lt300" }).workValue, 10000);
});

test("urgency (section 11): critical, significant, moderate", () => {
  const iw = (unasked, kind = "known") => ({ unasked, kind });
  assert.equal(urgencyOf(SC, iw(560), 25), "critical");
  assert.equal(urgencyOf(SC, iw(500), 25), "critical");
  assert.equal(urgencyOf(SC, iw(499), 25), "significant");
  assert.equal(urgencyOf(SC, iw(150), 50), "significant");
  assert.equal(urgencyOf(SC, iw(140), 25), "moderate");
  // Ask Coverage 75 or higher is moderate whatever the count
  assert.equal(urgencyOf(SC, iw(200), 75), "moderate");
  // Count unknown: critical at Ask Coverage 25 or lower
  assert.equal(urgencyOf(SC, { unasked: null, kind: "unsure" }, 0), "critical");
  assert.equal(urgencyOf(SC, { unasked: null, kind: "jobsUnsure" }, 25), "critical");
  assert.equal(urgencyOf(SC, { unasked: null, kind: "jobsUnsure" }, 50), "significant");
  assert.equal(urgencyOf(SC, { unasked: null, kind: "all" }, 100), "moderate");
});

test("cascade: Freshness lowest with Coverage or System under 75 makes the lower of those two the primary", () => {
  const areas = (c, s, f, r) => ({ coverage: { exact: c }, system: { exact: s }, freshness: { exact: f }, replies: { exact: r } });
  const b = bottleneckOf(SC, areas(50, 75, 25, 100));
  assert.equal(b.primary, "coverage");
  assert.deepEqual(b.cascade, { effect: "freshness", cause: "coverage" });
  assert.equal(b.secondary, "freshness");
  const b2 = bottleneckOf(SC, areas(75, 50, 25, 100));
  assert.equal(b2.primary, "system");
  // Both upstream areas strong: Freshness itself is the primary
  const b3 = bottleneckOf(SC, areas(75, 75, 25, 100));
  assert.equal(b3.primary, "freshness");
  assert.equal(b3.cascade, null);
  // Ties go upstream first: Coverage, System, Replies, Freshness
  assert.equal(bottleneckOf(SC, areas(50, 50, 50, 50)).primary, "coverage");
  assert.equal(bottleneckOf(SC, areas(100, 100, 50, 50)).primary, "replies");
});

test("all strong: Maintenance, the refinement area, and checks instead of quick wins", () => {
  const hero = { ...HERO, asked10: "7to9", asks: "software", newest: "week", replies: "most" };
  const r = evaluate(SC, hero);
  assert.deepEqual(area(r), { coverage: 75, system: 75, freshness: 100, replies: 75 });
  assert.equal(r.bottleneck.maintenance, true);
  assert.equal(r.bottleneck.primary, "coverage");
  assert.equal(r.bottleneck.lineKey, "none");
  assert.equal(r.quickWins.length, 3);
  assert.ok(r.quickWins.every((q) => q.check));
  assert.equal(r.tier, "openbook");
});

test("the rule flag puts 'Ask every customer the same way' first, whatever the area scores", () => {
  const r = evaluate(SC, HERO, { ...DEEP, d1: "happy" });
  assert.equal(r.ruleFlag, true);
  assert.equal(r.quickWins[0].key, "d1");
  assert.equal(r.quickWins[0].flag, true);
  assert.ok(r.quickWins[0].text.startsWith("Ask every customer the same way"));
  assert.equal(r.quickWins.length, 3);
});

test("the Ask System line has a software variant when requests already go out", () => {
  const r = evaluate(SC, { ...HERO, asked10: "all", asks: "software", newest: "week", replies: "all" }, { d2: "every", d3: "nothing", d4: "stops", d5: "yes", d6: "current", d7: "sameday", d8: "personal" });
  assert.equal(r.bottleneck.primary, "system");
  assert.equal(r.bottleneck.lineKey, "systemSoftware");
});

test("the strongest area: the highest score, ties in report order", () => {
  const areas = (c, s, f, r) => ({ coverage: { exact: c }, system: { exact: s }, freshness: { exact: f }, replies: { exact: r } });
  assert.equal(strongestOf(SC, areas(50, 50, 75, 75)), "freshness");
  assert.equal(strongestOf(SC, areas(100, 100, 100, 100)), "coverage");
});

test("fit and routing (section 10)", () => {
  assert.equal(fitOf(SC, HERO), "qualified");
  assert.equal(fitOf(SC, { ...HERO, jobs: "lt5" }), "under-floor");
  assert.equal(fitOf(SC, { ...HERO, records: "paper" }), "no-software");
  assert.deepEqual(routeOf(SC, HERO), { callOnly: false, why: null });
  assert.deepEqual(routeOf(SC, { ...HERO, records: "paper" }), { callOnly: true, why: "records" });
  assert.deepEqual(routeOf(SC, { ...HERO, profiles: "3to9" }), { callOnly: true, why: "profiles" });
});

test("the GTM gap score keeps the old points, with the top-three reading 'unchecked' (15) until the report fills it", () => {
  assert.equal(gtmGapScoreOf(SC, HERO), 20 + 14 + 8 + 12 + 15);
  assert.equal(gtmGapScoreOf(SC, HERO, "behind"), 20 + 14 + 8 + 12 + 18);
  assert.equal(evaluate(SC, HERO).gtmGapScore, 69);
});

test("tiers and bands", () => {
  assert.equal(tierOf(SC, 0).key, "secret");
  assert.equal(tierOf(SC, 29).key, "secret");
  assert.equal(tierOf(SC, 30).key, "somedays");
  assert.equal(tierOf(SC, 54).key, "somedays");
  assert.equal(tierOf(SC, 55).key, "nearly");
  assert.equal(tierOf(SC, 75).key, "openbook");
  assert.equal(bandOf(SC, 25).key, "low");
  assert.equal(bandOf(SC, 50).key, "medium");
  assert.equal(bandOf(SC, 75).key, "high");
  assert.equal(bandOf(SC, 39.5).key, "medium");
});

test("an unanswered hero question is reported, not scored as zero", () => {
  const { jobs, ...rest } = HERO;
  const r = evaluate(SC, rest);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["jobs"]);
  const bad = evaluate(SC, { ...HERO, asks: "made-up" });
  assert.deepEqual(bad.missing, ["asks"]);
});

test("fill leaves unknown placeholders alone", () => {
  assert.equal(fill("Hi {firstName}, {x}", { firstName: "Sam" }), "Hi Sam, {x}");
});
