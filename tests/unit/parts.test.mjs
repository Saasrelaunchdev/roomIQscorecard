// The smaller parts: the call's days and phone, the calendar file, the insights' arithmetic, the CSV, the emails'
// composition, the claim rules over every word, and the committed build matching its sources.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SITE from "../../content/site.mjs";
import EMAILS from "../../content/emails.mjs";
import { bookingDays, dayAllowed, usPhone, phoneLabel, icsFor, dayLabel } from "../../lib/booking.mjs";
import { funnelOf, profileOf, toCsv } from "../../lib/insights.mjs";
import { compose } from "../../api/_lib/emails.mjs";
import { lintAll, lint, collect } from "../../tools/copy-lint.mjs";
import { evaluate } from "../../lib/scoring.mjs";
import SC from "../../content/scorecard.mjs";
import { HERO } from "../fixtures/sample.mjs";

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

test("the call's days: the next five weekdays from tomorrow, never the same day, no weekends", () => {
  const fri = new Date(2026, 10, 20, 15, 0); // a Friday afternoon
  const days = bookingDays(SITE.booking, fri);
  assert.deepEqual(days.map((d) => d.v), ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"]);
  assert.equal(days[0].label, "Mon, Nov 23");
  assert.equal(dayAllowed("2026-11-23", fri, 14), true);
  assert.equal(dayAllowed("2026-11-21", fri, 14), false, "Saturday");
  assert.equal(dayAllowed("2026-11-19", fri, 14), false, "the past");
  assert.equal(dayAllowed("2026-12-31", fri, 14), false, "too far out");
  assert.equal(dayAllowed("2026-02-30", fri, 400), false, "not a date");
  assert.equal(dayLabel("2026-11-24"), "Tue, Nov 24");
});

test("phones and the calendar file", () => {
  assert.equal(usPhone("(512) 555-0134"), "5125550134");
  assert.equal(usPhone("+1 512 555 0134"), "5125550134");
  assert.equal(usPhone("555-0134"), "");
  assert.equal(phoneLabel("5125550134"), "(512) 555-0134");
  const ics = icsFor({ day: "2026-11-24", window: { start: 11, end: 14 }, title: "Rempo: a call, today", body: "Line one\nLine two", uid: "u1" });
  assert.match(ics, /DTSTART:20261124T110000\r\nDTEND:20261124T140000/);
  assert.match(ics, /SUMMARY:Rempo: a call\\, today/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
});

test("insights: start rate, completion rate and drop-off, per variant", () => {
  const counts = [
    { variant: "scoreapp", name: "view", step: "", visits: 100 }, { variant: "scoreapp", name: "start", step: "", visits: 40 },
    { variant: "scoreapp", name: "step", step: "G1", visits: 40 }, { variant: "scoreapp", name: "step", step: "G2", visits: 30 },
    { variant: "scoreapp", name: "complete", step: "", visits: 20 }, { variant: "invisible", name: "view", step: "", visits: 50 },
    { variant: "invisible", name: "start", step: "", visits: 25 }
  ];
  const f = funnelOf(counts);
  assert.equal(f.all.visits, 150);
  assert.equal(f.all.starts, 65);
  const s = f.variants.find((v) => v.variant === "scoreapp");
  assert.equal(s.startRate, 40);
  assert.equal(s.completionRate, 20);
  assert.equal(s.finishRate, 50);
  assert.equal(s.steps[0].dropOff, 0);
  assert.equal(s.steps[1].dropOff, 25);
  assert.equal(f.variants.find((v) => v.variant === "invisible").startRate, 50);
});

test("insights: the scorecards' profile, and the CSV (formula injection guarded)", () => {
  const r = evaluate(SC, HERO);
  const rows = [{ created_at: "2026-11-20T10:00:00.000Z", sent_at: "2026-11-21T10:00:00.000Z", status: "sent", answers: HERO, result: r, report_result: r, score: 35, tier: "beginner", bottleneck: "fill", fit: "qualified", route: "free forecast", tracking: { utm_source: "facebook" }, company: "=HYPERLINK(\"x\")", email: "a@b.co", first_name: "Sam, Jr." }];
  const p = profileOf(rows);
  assert.equal(p.count, 1);
  assert.equal(p.averageScore, 35);
  assert.equal(p.tiers.find((t) => t.key === "beginner").count, 1);
  assert.equal(p.medianHoursToReport, 24);
  assert.equal(p.answers.carry.options.find((o) => o.v === "2to3k").count, 1);
  assert.equal(p.invisible.valueTotal, 4000);
  assert.equal(p.invisible.unaskedTotal, 2);
  const csv = toCsv(rows);
  const [head, line] = csv.trim().split("\r\n");
  assert.match(head, /^created_at,status,first_name/);
  assert.ok(line.includes('"\'=HYPERLINK(""x"")"'), "a cell starting with = is quoted and defused");
  assert.ok(line.includes('"Sam, Jr."'));
});

test("emails: a line whose placeholder has no value is left out; values are escaped in the HTML; the footer is there", () => {
  const msg = compose(EMAILS.score, { firstName: "Sam <b>", score: 35, tier: "Beginner: underwriting on assumptions", invisible_line: "Line.", bottleneck: "Fill Speed", bottleneck_line: "Fix it.",
    quick_win: null, business: "", service: "first deal", city: "Atlanta", deepener_link: null, results_link: "https://x.test/results/T", unsubscribe_link: "https://x.test/unsubscribe/T", privacy_link: "https://roomiq.io/privacy" },
    { buttonUrl: "https://x.test/results/T", buttonLabel: "See my score" });
  assert.equal(msg.subject, "Your Deal Readiness Score: 35/100");
  assert.doesNotMatch(msg.text, /Start this week|sharper report|\{/);
  assert.match(msg.text, /Unsubscribe: https:\/\/x\.test\/unsubscribe\/T/);
  assert.match(msg.text, /Privacy Policy: https:\/\/roomiq\.io\/privacy/);
  assert.match(msg.html, /Sam &lt;b&gt;/);
  assert.match(msg.html, /href="https:\/\/x\.test\/results\/T"/);
});

test("the claim rules pass over every word, and catch what they should", async () => {
  const { errors } = await lintAll();
  assert.deepEqual(errors, []);
  const rules = (await import("../../rules/copy-rules.json", { with: { type: "json" } })).default;
  const bad = lint(collect({ results: { a: "Get accurate rent forecasts for any address.", b: "Find cash-flowing deals fast.", c: "Check your rents — always.", d: "84% of rooms fill in a month.",
    e: "RoomIQ is not a zoning check.", f: "Pro is $45 a month.", g: "Room data powered by a listing platform.", h: "Compare with PadSplit's calculator." } }), rules);
  assert.equal(bad.errors.length, 7);
  assert.ok(bad.errors.some((e) => /\(accuracy\)/.test(e)));
  assert.ok(bad.errors.some((e) => /\(income\)/.test(e)));
  assert.ok(bad.errors.some((e) => /em or en dashes/.test(e)));
  assert.ok(bad.errors.some((e) => /source in the same sentence/.test(e)));
  assert.ok(bad.errors.some((e) => /\(offer-terms\)/.test(e)));
  assert.ok(bad.errors.some((e) => /\(partnership\)/.test(e)));
  assert.ok(bad.errors.some((e) => /\(named-platform\)/.test(e)));
  assert.ok(!bad.errors.some((e) => /zoning check/.test(e)), "a sentence that refuses the claim passes");
});

test("the committed build matches its sources (node tools/build.mjs --check)", () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, "tools/build.mjs"), "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.match(out, /matches its sources/);
});
