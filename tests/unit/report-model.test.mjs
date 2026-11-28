// The report's model against spec 3: the lease-up page and every variant of it, the slower case, the three checks
// outside RoomIQ, the overall page's urgency line, the strongest and weakest pages, the cascade, the rule flag, the
// final page's routing variant, the cover, and the whole HTML.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, ageLabel, monthLabels, listWords } from "../../lib/report-model.mjs";
import { reportHtml } from "../../lib/report-html.mjs";
import { ROW, HERO, DEEP } from "../fixtures/sample.mjs";

const NOW = new Date("2026-11-22T12:00:00");
const links = { sharpen: "https://x.test/sharpen/T", results: "https://x.test/results/T" };
const build = (patch = {}) => buildReport({ ...ROW, ...patch }, { links, now: NOW, checker: "Dana" });
const screenOnly = (answers) => build({ answers: { ...HERO, ...answers }, deepener: null, deepened_at: null });

test("the worked example's first six months: $2,000 × (3 months minus 1 month) = $4,000 (spec 1, section 11)", () => {
  const m = build();
  assert.equal(m.invisible.kind, "gap");
  assert.equal(m.invisible.h, "Your reserves run out 2 months early");
  assert.equal(m.invisible.body, "You expect the rooms to take 3 months to fill, and your reserves carry 1 month of costs. At $2,000 a month, the 2 months your reserves don't cover come to at least $4,000.");
  assert.deepEqual(m.invisible.box, [
    "Monthly carrying cost: $2,000, the low end of the range you picked.",
    "Months to fill: 3 months, as you expect them.",
    "Reserves: 1 month of costs, the high end of the range you picked.",
    "$2,000 × (3 months minus 1 month) = $4,000.",
    "Costs at the low end and reserves at the high end, so the real figure is at least this large."
  ]);
  // The slower case: the same plan, lease-up twice as long: $2,000 × (6 minus 1) = $10,000
  assert.equal(m.invisible.slower.text, "If lease-up took twice as long as you expect, 6 months, your reserves would leave at least $10,000 uncovered.");
  assert.equal(m.invisible.fill, 3);
  assert.equal(m.invisible.reserves, 1);
  assert.equal(m.invisible.strip.label, "Your first six months, as you plan them");
  assert.equal(m.fields.gap, "$4,000");
  assert.equal(m.fields.market, "Atlanta");
  assert.equal(m.fields.deal, "first deal");
});

test("the first six months page has a variant for every case", () => {
  assert.equal(screenOnly({ fillmonths: "m1", reserves: "m1" }).invisible.h, "Your reserves just cover your plan");
  const covered = screenOnly({ fillmonths: "m2", reserves: "m6" }).invisible;
  assert.equal(covered.h, "Your reserves cover your plan");
  assert.match(covered.body, /4 months to spare\. Each month past your plan costs at least \$2,000\./);
  assert.equal(covered.slower.text, "If lease-up took twice as long as you expect, 4 months, your reserves would still cover it.");
  const costOnly = screenOnly({ reserves: "unsure" }).invisible;
  assert.equal(costOnly.h, "Your lease-up costs at least $6,000");
  assert.equal(costOnly.slower, undefined, "no slower case without the reserves");
  assert.equal(screenOnly({ fillmonths: "unsure" }).invisible.h, "Every empty month costs at least $2,000");
  assert.equal(screenOnly({ fillmonths: "unsure" }).invisible.strip, null, "no strip without the lease-up months");
  assert.equal(screenOnly({ carry: "unsure" }).invisible.h, "Your reserves cover 1 month of 3 months");
  assert.equal(screenOnly({ carry: "unsure", reserves: "m3" }).invisible.h, "Your reserves cover your lease-up months");
  const none = screenOnly({ carry: "unsure", reserves: "unsure" }).invisible;
  assert.equal(none.h, "The number to find first");
  assert.equal(screenOnly({ carry: "unsure", fillmonths: "unsure", reserves: "unsure" }).invisible.box, undefined);
});

test("the three checks outside RoomIQ: the market's rule, financing and insurance, marked by the deepener", () => {
  const m = build();
  const [zoning, financing, insurance] = m.checks.items;
  assert.equal(m.checks.title, "Three checks RoomIQ can't do for you");
  assert.match(zoning.body, /^Atlanta: no more than six people may live together unless all are related/);
  assert.deepEqual(zoning.status, { mark: "todo", label: "To do", text: "You haven't checked it yet." });
  assert.equal(financing.status.mark, "todo");
  assert.match(financing.status.text, /whole-home rent/);
  assert.equal(insurance.status, null);
  assert.equal(insurance.body, "Insurance is not a given: some insurers decline coliving homes.");
  // Houston and Dallas-Fort Worth: the insurance program's exclusion; the market's own rule
  const dfw = build({ answers: { ...HERO, market: "dfw" } });
  assert.match(dfw.checks.items[0].body, /Dallas allows a household of no more than four people/);
  assert.match(dfw.checks.items[2].body, /excludes the Dallas-Fort Worth counties/);
  const other = build({ answers: { ...HERO, market: "other" } });
  assert.match(other.checks.items[0].body, /^Rules on unrelated adults sharing a home differ by city/);
  // Confirmed answers are marked done; no deepener asks to add them
  const done = build({ deepener: { ...DEEP, zoning: "confirmed", financing: "roomlender" } });
  assert.equal(done.checks.items[0].status.mark, "done");
  assert.equal(done.checks.items[1].status.label, "Done");
  const noDeep = build({ deepener: null, deepened_at: null });
  assert.equal(noDeep.checks.items[0].status.text, "Add your answers in Sharpen your report to mark this check.");
});

test("the overall page: the tier's interpretation names the bottleneck; the urgency line follows the uncovered months", () => {
  const m = build();
  assert.equal(m.result.tier, "beginner");
  assert.equal(m.result.score, 33);
  assert.match(m.overall.interpretation, /Start with Fill Speed, follow the 30-day plan from day one/);
  assert.equal(m.overall.urgency, "At your numbers, your reserves leave 2 months uncovered, so this is the first thing to fix, before you make an offer.");
  assert.equal(m.overall.deepenerNote, "Updated with your 12 extra answers.");
  const noDeep = build({ deepener: null, deepened_at: null });
  assert.equal(noDeep.overall.deepenerNote, "Based on your 10 answers. Add 12 more for a sharper score:");
  assert.equal(noDeep.overall.deepenerLink, "https://x.test/sharpen/T");
  // Covered: no months to name; Rent Evidence (50) decides: significant
  assert.equal(screenOnly({ reserves: "m6" }).overall.urgency, "Worth fixing before you make an offer.");
  // Unknown reserves with a weak Rent Evidence: critical, without a count
  assert.equal(screenOnly({ reserves: "unsure", rentsource: "calculator" }).overall.urgency, "This is the first thing to fix, before you make an offer.");
});

test("the strongest and weakest pages: never the same area; the refinement headline when every area is strong", () => {
  const m = build();
  assert.equal(m.weakest.area, "fill");
  assert.equal(m.weakest.h, "Your Fill Speed Has the Most Room to Grow");
  assert.equal(m.strongest.area, "rent");
  assert.equal(m.strongest.h, "Your Rent Evidence Is Your Strongest Asset");
  assert.deepEqual(m.weakest.quickWins.map((q) => q.key), ["zoning", "fillsource", "occsource"]);
  assert.equal(m.weakest.impact.bullets[0], "At your numbers, each month lease-up runs long costs at least $2,000");
  assert.equal(screenOnly({ carry: "unsure" }).weakest.impact.bullets[0], "Every month lease-up runs long costs the full monthly carrying cost");
  // All five equal: the weakest is Rent Evidence (upstream first), so the strongest is the next in report order
  const flat = screenOnly({ rentsource: "listings", fillsource: "stories", supply: "counted", bathmix: "adding", slowplan: "weeks" });
  assert.equal(flat.weakest.area, "rent");
  assert.equal(flat.strongest.area, "fill");
  const strong = screenOnly({ rentsource: "comps", fillsource: "observed", supply: "known", bathmix: "modeled", slowplan: "sized" });
  assert.equal(strong.weakest.refinement, true);
  assert.equal(strong.weakest.h, "Your Rent Evidence Is Your Next Refinement");
  assert.equal(strong.weakest.urgency, null);
  assert.equal(strong.overall.urgency, null);
  // The reserves page: a covered plan never says "at least $0"
  const reserves = screenOnly({ rentsource: "comps", fillsource: "observed", supply: "known", bathmix: "modeled", slowplan: "none", fillmonths: "m2", reserves: "m6" });
  assert.equal(reserves.weakest.area, "reserves");
  assert.equal(reserves.weakest.impact.bullets[0], "Every month your reserves don't cover gets paid from somewhere else");
});

test("the rule flag puts the city's rule first among the quick wins, and says it once", () => {
  const m = build({ deepener: { ...DEEP, zoning: "asked" } });
  assert.ok(m.weakest.quickWins[0].text.startsWith("Read your city's rule on unrelated adults"));
  assert.equal(m.weakest.ruleNote, null);
  const confirmed = build({ deepener: { ...DEEP, zoning: "confirmed" } });
  assert.ok(!confirmed.weakest.quickWins.some((q) => q.flag));
  assert.equal(confirmed.weakest.ruleNote, null);
});

test("the cascade: a weakest Room Mix or Lease-up Reserves is reported as the effect of the weaker borrowed number", () => {
  const m = build();
  assert.equal(m.weakest.cascade, "Your Room Mix score follows from your Fill Speed score: a bath mix is priced from what rooms rent for and how fast they fill, by bath type.");
  const r = screenOnly({ rentsource: "comps", fillsource: "stories", supply: "known", bathmix: "modeled", slowplan: "none" });
  assert.equal(r.weakest.area, "fill");
  assert.equal(r.weakest.cascade, "Your Lease-up Reserves score follows from your Fill Speed score: reserves can only be sized once you know what rooms rent for and how fast they fill.");
});

test("the final page: the bottleneck's fit line, or the call-only line; a booked walkthrough replaces the link", () => {
  const m = build();
  assert.equal(m.next.fitLine, "For your Fill Speed, that means occupancy from comparable rooms nearby, and the months rooms fill fastest.");
  assert.equal(m.next.booked, "Your walkthrough is booked: Tue, Nov 24, midday. We'll email you a video link.");
  assert.match(m.next.boxBody, /Start where your report says to: Fill Speed\./);
  const scaling = build({ answers: { ...HERO, stage: "scaling" }, booking: null });
  assert.equal(scaling.next.fitLine, "You run more than ten houses, so we'll start with a walkthrough to see what fits.");
  assert.equal(scaling.next.booked, null);
  assert.equal(scaling.next.bookingLink, "https://x.test/results/T#call");
  assert.equal(scaling.service.days.yourStart[0], "You run more than ten houses, so the first step is a walkthrough to see what fits.");
});

test("the cover names the investor, the market, the date and who checked it", () => {
  const m = build();
  assert.equal(m.cover.prepared, "Jordan, Atlanta");
  assert.equal(m.cover.checked, "Checked by Dana at RoomIQ");
  assert.equal(m.cover.date, "November 22, 2026");
  assert.match(m.cover.subtitle, /^How much of the plan for your first deal rests on evidence you can check/);
  assert.equal(build({ last_name: "Rivera" }).cover.prepared, "Jordan Rivera, Atlanta");
  assert.equal(build({ answers: { ...HERO, market: "undecided" } }).cover.prepared, "Jordan, market not decided yet");
  assert.match(build({ answers: { ...HERO, stage: "operator" } }).cover.subtitle, /your next deal/);
});

test("the HTML has every page and no unfilled placeholder; no outside-data page", () => {
  const html = reportHtml(build(), { links });
  for (const h of ["The First Deal Risk Scorecard Report", "Your Report Overview", "Your First Six Months", "Your reserves run out 2 months early", "The slower case",
    "Three checks RoomIQ can't do for you", "Beginner: underwriting on assumptions", "Your Rent Evidence Is Your Strongest Asset", "Your Fill Speed Has the Most Room to Grow",
    "What an evidence-first underwrite looks like", "Where your plan stands on each step", "Two ways to run the method", "Your first 30 days with RoomIQ",
    "Your Room-by-Room Underwrite Starts Here", "Rent Evidence: The Ten-Room Rent Check", "Fill Speed: The Two-Week Fill Watch", "Nearby Supply: The Three-Mile Count",
    "Room Mix: The Bath Mix Test", "Lease-up Reserves: The Slow Lease-up Test", "Your 30-Day Timeline", "Quick Start: 5 Things to Do This Week",
    "Implementation Checklists", "Weekly Tracking Dashboard", "Your Next Step"]) {
    assert.ok(html.includes(h.replace(/'/g, "&#39;")), `missing: ${h}`);
  }
  assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ""), /\{[a-z_0-9]+\}/);
  assert.ok(!html.includes("Next to the Market"), "no outside-data page in this funnel");
  assert.ok(html.includes('class="months-strip"'), "the six-month strip");
  assert.ok(html.includes("utm_campaign=roomiq-first-deal"), "the free forecast link names the scorecard");
  const preview = reportHtml(build(), { preview: true });
  assert.ok(preview.includes("Preview for the team"));
});

test("a name cannot break out of the report's style element or its HTML", () => {
  const html = reportHtml(build({ first_name: "</style><script>alert(1)</script>Jo's \"House\"" }), {});
  assert.equal(html.includes("<script>alert(1)"), false);
  assert.equal((html.match(/<\/style>/g) || []).length, 1);
  assert.ok(html.includes("&lt;/style&gt;&lt;script&gt;"));
});

test("small helpers", () => {
  assert.equal(ageLabel(0), "today");
  assert.equal(ageLabel(1), "1 day ago");
  assert.equal(ageLabel(40), "6 weeks ago");
  assert.equal(ageLabel(200), "7 months ago");
  assert.equal(monthLabels("2026-01-15")[11].short, "Jan");
  assert.equal(monthLabels("2026-01-15")[0].year, 2025);
  assert.equal(listWords(["a", "b", "c"]), "a, b and c");
});
