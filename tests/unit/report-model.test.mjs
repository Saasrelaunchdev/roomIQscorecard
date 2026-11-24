// The report's model against Deliverable 3: the invisible work variants, reviews per 100 jobs, the busy-season read,
// the top-three reads, the star cushion, the overall page's urgency line, the strongest and weakest pages, the final
// page's routing variant.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, starCushion, monthsRead, topThree, suggestCompare, ageLabel, monthLabels, listWords } from "../../lib/report-model.mjs";
import { reportHtml } from "../../lib/report-html.mjs";
import { ROW, HERO, DEEP, PUBLIC } from "../fixtures/sample.mjs";

const NOW = new Date("2026-11-22T12:00:00");
const links = { sharpen: "https://x.test/sharpen/T", results: "https://x.test/results/T" };
const build = (patch = {}) => buildReport({ ...ROW, ...patch }, { links, now: NOW, checker: "Dana" });

test("the worked example's report: reviews per 100 jobs is 2.4 (Deliverable 1, section 4)", () => {
  const m = build();
  assert.equal(m.invisible.rate.jobs90, 208);
  assert.equal(m.invisible.rate.rate, 2.4);
  assert.equal(m.invisible.h, "560 customers a year never get asked");
  assert.match(m.invisible.body, /16 to 40 jobs a week, and that 1 to 3 of your last 10/);
  assert.match(m.invisible.body, /\$300 ticket, that is at least \$168,000/);
  assert.equal(m.invisible.box.length, 4);
  assert.match(m.invisible.box[0], /16 jobs a week × 50 working weeks × 7 of 10 customers not asked = 560 customers a year/);
  assert.match(m.invisible.rateBlock.lines.join(" "), /top three near you received 23.7 reviews each/);
  assert.equal(m.invisible.rateBlock.behind, true);
});

test("the invisible work page has a variant for every case", () => {
  assert.equal(build({ answers: { ...HERO, asked10: "all" }, deepener: null }).invisible.h, "Every customer gets asked");
  assert.equal(build({ answers: { ...HERO, asked10: "unsure" } }).invisible.h, "The number we measured for you");
  const avg = build({ answers: { ...HERO, ticket: "unsure" } }).invisible;
  assert.ok(avg.box.some((l) => /average job value for HVAC from Angi, \$350/.test(l)));
  const count = build({ answers: { ...HERO, trade: "other", ticket: "unsure" } }).invisible;
  assert.equal(count.box.length, 3);
  assert.ok(!/ticket/.test(count.body));
  const ju = build({ answers: { ...HERO, jobs: "unsure" } }).invisible;
  assert.match(ju.rateBlock.lines[0], /Over the last 90 days, 5 Google reviews came in, against 23.7 each/);
});

test("the busy-season read: April and May are the dip, and D5 'drops off' gets the cascade line", () => {
  const m = build();
  assert.equal(m.invisible.months.read, "dip");
  assert.deepEqual(m.invisible.months.labels, ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]);
  assert.match(m.invisible.months.text, /^You told us asking drops off when you're slammed\. Your reviews show the same pattern: April and May were/);
  const noD5 = build({ deepener: { ...DEEP, d5: "unsure" } });
  assert.match(noD5.invisible.months.text, /^April and May were among your quietest months on Google\. If those were busy months for you, that is usually when asking slips\./);
  const steady = monthsRead([5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6]);
  assert.equal(steady.kind, "steady");
  assert.equal(monthsRead([0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]).kind, null);
  // The team can override the read
  assert.equal(build({ public_data: { ...PUBLIC, monthsRead: "steady" } }).invisible.months.read, "steady");
  assert.equal(build({ public_data: { ...PUBLIC, monthsRead: "none" } }).invisible.months.text, "");
});

test("two weeks away (D4 slows down or stops): about jobs × 2 customers go unasked", () => {
  assert.match(build().invisible.away, /about 32 customers would go unasked/);
  assert.equal(build({ deepener: { ...DEEP, d4: "runs" } }).invisible.away, undefined);
});

test("the top three: six measures, each ahead or behind, the profile's missing items in words", () => {
  const t = topThree(PUBLIC);
  assert.deepEqual(t.rows.map((r) => [r.key, r.read]), [["rating", "behind"], ["count", "behind"], ["reviews90", "behind"], ["newest", "behind"], ["replies", "behind"], ["profile", "behind"]]);
  const profile = t.rows.find((r) => r.key === "profile");
  assert.equal(profile.text, "Your profile is missing photos from the last 90 days and a description, which theirs show.");
  assert.equal(t.rows.find((r) => r.key === "replies").you, "12 of 30");
  assert.equal(t.rows.find((r) => r.key === "replies").them, "27 of 30");
  assert.equal(suggestCompare(t), "far");
  const ahead = topThree({ ...PUBLIC, business: { ...PUBLIC.business, rating: 4.9, count: 500, reviews90: 40, newestDays: 1, replied: 30, checks: { hours: true, services: true, photos: true, description: true, categories: true } } });
  assert.ok(ahead.rows.every((r) => r.read === "ahead"));
  assert.equal(suggestCompare(ahead), "ahead");
  assert.equal(suggestCompare(topThree({})), "unchecked");
});

test("the star cushion (Deliverable 3): k one-star reviews to fall under 4.5, m five-star reviews to reach it", () => {
  assert.deepEqual(starCushion(4.6, 87), { kind: "above", k: 4 });
  // 4.6 x 87 + 3 = 403.2 over 90 = 4.48: still 4.5 displayed; + 4 over 91 = 4.44: under
  assert.deepEqual(starCushion(5.0, 10), { kind: "above", k: 2 });
  assert.deepEqual(starCushion(4.45, 100), { kind: "above", k: 1 });
  assert.deepEqual(starCushion(4.3, 50), { kind: "below", m: 14 });
  // (4.3 x 50 + 5 x 14) / 64 = 4.453 >= 4.45; with 13: 4.4413
  assert.deepEqual(starCushion(4.44, 100), { kind: "below", m: 2 });
  assert.equal(starCushion(null, 10), null);
  const m = build();
  assert.match(m.top3.cushion, /^Your star cushion: 4 one-star reviews would take your rating under 4\.5\. 31% of consumers/);
});

test("the overall page: the tier's interpretation names the bottleneck; the urgency line follows the count", () => {
  const m = build();
  assert.equal(m.result.tier, "somedays");
  assert.match(m.overall.interpretation, /your weakest area, Ask System, is the link to fix first/);
  assert.equal(m.overall.urgency, "At your numbers this touches at least 560 customers a year, so it is the first thing to fix, this month.");
  assert.equal(m.overall.deepenerNote, "Updated with your 8 extra answers.");
  const noDeep = build({ deepener: null, deepened_at: null });
  assert.equal(noDeep.overall.deepenerNote, "Based on your 10 answers. Add 8 more for a sharper score: https://x.test/sharpen/T");
  const unknown = build({ answers: { ...HERO, asked10: "unsure" }, deepener: null });
  assert.equal(unknown.overall.urgency, "This is the first thing to fix, this month.");
});

test("the strongest and weakest pages: never the same area; the refinement headline when every area is strong", () => {
  const m = build();
  assert.equal(m.weakest.area, "system");
  assert.equal(m.weakest.h, "Your Ask System Has the Most Room to Grow");
  assert.equal(m.strongest.area, "coverage");
  assert.deepEqual(m.weakest.quickWins.map((q) => q.key), ["asks", "d3", "d5"]);
  // All four equal: the weakest is Ask Coverage (upstream first), so the strongest is the next in report order
  const flat = build({ answers: { ...HERO, asked10: "4to6", asks: "techs", newest: "1to3", replies: "some" }, deepener: null });
  assert.equal(flat.weakest.area, "coverage");
  assert.equal(flat.strongest.area, "system");
  const strong = build({ answers: { ...HERO, asked10: "7to9", asks: "software", newest: "week", replies: "most" }, deepener: null });
  assert.equal(strong.weakest.refinement, true);
  assert.equal(strong.weakest.h, "Your Ask Coverage Is Your Next Refinement");
  assert.equal(strong.weakest.urgency, null);
  assert.equal(strong.overall.urgency, null);
});

test("the rule flag adds the note on asking to the weakest page", () => {
  const m = build({ deepener: { ...DEEP, d1: "happy" } });
  assert.equal(m.weakest.ruleNote.title, "A note on asking");
  assert.ok(m.weakest.quickWins[0].text.startsWith("Ask every customer the same way"));
});

test("the cascade: Freshness lowest with weak asking reports Freshness as the effect", () => {
  const m = build({ answers: { ...HERO, asked10: "4to6", asks: "software", newest: "over3", replies: "most" }, deepener: null });
  assert.equal(m.weakest.area, "coverage");
  assert.equal(m.weakest.cascade, "Your Freshness score is low because of your Ask Coverage score.");
});

test("the final page: the bottleneck's fit line, or the call-only line; a booked call replaces the link", () => {
  const m = build();
  assert.match(m.next.fitLine, /^For your Ask System, that means asking runs from the moment a job closes/);
  assert.equal(m.next.booked, "Your call is booked: Tue, Nov 24, midday. We'll call you then.");
  const paper = build({ answers: { ...HERO, records: "paper" }, booking: null });
  assert.match(paper.next.fitLine, /^Your jobs are on paper or spreadsheets, or you run three or more locations/);
  assert.equal(paper.next.booked, null);
  assert.equal(paper.next.bookingLink, "https://x.test/results/T#call");
});

test("the cover names the owner, the business, the town, the date and who checked it", () => {
  const m = build();
  assert.equal(m.cover.prepared, "Sam, Maple Street Heating, Austin");
  assert.equal(m.cover.checked, "Checked by Dana at Rempo");
  assert.equal(m.cover.date, "November 22, 2026");
  assert.equal(build({ last_name: "Rivera" }).cover.prepared, "Sam Rivera, Maple Street Heating, Austin");
});

test("the HTML has every page, no unfilled placeholder, and leaves out the top three until the profile is read", () => {
  const html = reportHtml(build(), { links });
  for (const h of ["The Invisible Work Scorecard Report", "Your Report Overview", "560 customers a year never get asked", "Maple Street Heating, next to the top three for HVAC in Austin",
    "The Some-Days Shop", "Your Ask Coverage Is Your Strongest Asset", "Your Ask System Has the Most Room to Grow", "Your Visible Work Starts Here",
    "Ask Coverage: The Every-Job Ask", "Ask System: The Hands-Off Ask", "Freshness: The Steady-Week Rhythm", "Replies: The Two-Day Reply",
    "Your 30-Day Timeline", "Quick Start: 5 Things to Do This Week", "Implementation Checklists", "Weekly Tracking Dashboard", "Your Next Step"]) {
    assert.ok(html.includes(h.replace(/'/g, "&#39;")), `missing: ${h}`);
  }
  assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ""), /\{[a-z_0-9]+\}/);
  const empty = reportHtml(build({ public_data: null }), {});
  assert.ok(!empty.includes("next to the top three for HVAC in Austin</h1>"));
  const preview = reportHtml(build({ public_data: null }), { preview: true });
  assert.ok(preview.includes("Preview for the team"));
});

test("a business name cannot break out of the report's style element or its HTML", () => {
  const html = reportHtml(build({ company: "</style><script>alert(1)</script>Joe's \"Pipes\"" }), {});
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
