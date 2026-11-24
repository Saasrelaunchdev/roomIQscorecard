// The visitor's funnel in a real browser (Chromium, on a phone's screen): the first question in the first screen, the
// eleven steps, the result with the lease-up strip and the three checks, the walkthrough, the deepener, a returning
// visitor, unsubscribing. No console errors anywhere.
//   npm run test:e2e
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { testServer } from "../helpers/server.mjs";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
let S, browser;
const errors = [];
before(async () => { S = await testServer(); browser = await chromium.launch(); });
after(async () => { await browser.close(); await S.close(); assert.deepEqual(errors, [], "no page errors"); });

async function phone() {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  // A failed request shows as a console error; the one this file makes on purpose (an unknown token) is not a fault
  page.on("console", (m) => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400 && !/\/api\/scorecard\?token=nonexistent/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
  return { ctx, page };
}
const tap = async (page, label) => {
  await page.locator(".gc-step:not([hidden]) .gc-opt", { hasText: label }).first().click();
  await page.waitForTimeout(300);
};
// The worked example (spec 1, section 11)
async function answerHero(page, { email = "sam@example.com" } = {}) {
  await tap(page, "Looking at houses");
  await tap(page, "Atlanta");
  await tap(page, "Asking rents I found on room listings");
  await tap(page, "I assume a vacancy percentage");
  await tap(page, "I counted listings");
  await tap(page, "Not yet");
  await tap(page, "A few weeks of reserves");
  await tap(page, "$2,000 to $3,000");
  await tap(page, "About 3 months");
  await tap(page, "1 month or less");
  await page.fill("#f-firstName", "Sam");
  await page.fill("#f-email", email);
  await page.check("input[name=consentEmail]");
}

test("Version A (the Meta variant): the first question and all its answers fit the first screen of a phone", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/first-deal`);
  const vh = page.viewportSize().height;
  for (const sel of [".gc-step:not([hidden]) .gc-q", ...[0, 1, 2, 3, 4, 5].map((i) => `.gc-step:not([hidden]) .gc-opt >> nth=${i}`)]) {
    const box = await page.locator(sel).boundingBox();
    assert.ok(box && box.y + box.height <= vh, `${sel} is below the fold (${box && box.y + box.height} > ${vh})`);
  }
  await ctx.close();
});

test("Version B (the ScoreApp template): the whole funnel on a phone, with the spec's worked example", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/?utm_source=facebook&utm_campaign=fall`);
  await page.locator("[data-start]").first().click();
  await page.waitForSelector("#quiz-dlg[open]");
  assert.equal(await page.locator(".gc-count").textContent(), "Question 1 of 11");
  await answerHero(page);
  // Meta hears the GTM's event map only: ScorecardStart once the quiz is opened, no per-step events
  const sent = await page.evaluate(() => (window.__scEvents || []).map((e) => e.name));
  assert.deepEqual(sent, ["ScorecardStart"]);
  // The notice at collection names the button
  assert.match(await page.locator(".gc-step:not([hidden]) .legal-note").textContent(), /By tapping “See my score”/);
  await page.locator(".gc-submit").click();
  await page.waitForURL(/\/results\/[A-Za-z0-9_-]+$/);
  await page.waitForSelector(".score-top");
  assert.equal(await page.locator(".score-label").textContent(), "Deal Readiness Score: 35/100, Beginner: underwriting on assumptions. Higher is better.");
  const iw = await page.locator(".iw-big").textContent();
  assert.match(iw, /your reserves run out 2 months before the rooms fill/);
  assert.match(iw, /at least \$4,000 of costs with no cushion behind it/);
  assert.match(await page.locator(".iw-math").textContent(), /\$2,000 a month × \(3 months to fill, minus 1 month of reserves\) = \$4,000/);
  assert.equal(await page.locator(".months-strip").count(), 1, "the six-month strip");
  assert.deepEqual(await page.locator(".lease-key li").allTextContents(), ["Lease-up, covered by reserves", "Lease-up, not covered", "Rooms full, as planned"]);
  assert.match(await page.locator(".fix").textContent(), /Fix first: Fill Speed\. An assumed vacancy rate isn't fill speed\./);
  assert.match(await page.locator(".cascade-l").textContent(), /^Your Room Mix score follows from your Fill Speed score/);
  assert.match(await page.locator(".res-head").textContent(), /on its way to sam@example\.com as a PDF/);
  assert.deepEqual(await page.locator(".bars4 .n").allTextContents(), ["50", "25", "50", "0", "50"]);
  assert.equal(await page.locator(".acard .band").first().textContent(), "Medium");
  // The three checks outside RoomIQ, with the market's own rule
  assert.equal(await page.locator("#checks-h").textContent(), "Three checks RoomIQ can't do for you");
  assert.match(await page.locator(".checks").textContent(), /Atlanta: no more than six people may live together unless all are related/);
  // Beginner's cards, in order: the report, the free forecast, sharpen, the walkthrough, how RoomIQ shows its working
  assert.deepEqual(await page.locator(".cta-card h3").allTextContents(), ["Your report", "Run a free forecast on your address", "Sharpen your report", "Book a 20-minute walkthrough", "See how RoomIQ shows its working"]);
  const token = page.url().split("/results/")[1];
  assert.equal(await page.locator("[data-cta=report]").getAttribute("href"), `/report/${token}`);
  assert.equal(await page.locator("[data-cta=pdf]").getAttribute("href"), `/report/${token}/pdf?download=1`);
  // The free forecast carries the visit's campaign values into RoomIQ, and names the scorecard
  const forecast = new URL(await page.locator("[data-cta=forecast]").getAttribute("href"));
  assert.equal(forecast.origin + forecast.pathname, "https://roomiq.io/dashboard");
  assert.equal(forecast.searchParams.get("src"), "scorecard");
  assert.equal(forecast.searchParams.get("utm_source"), "facebook");
  assert.equal(forecast.searchParams.get("utm_campaign"), "fall");
  // The walkthrough
  await page.locator("[data-book-open]").click();
  assert.equal(await page.locator("input[name=consentText]").count(), 0, "no texts: RoomIQ publishes no SMS terms");
  await page.locator(".book .chip-opt").first().click();
  await page.locator(".book .chip-opt", { hasText: "Afternoon" }).click();
  await page.locator(".book button[type=submit]").click();
  assert.match(await page.locator(".book .err").textContent(), /10-digit/);
  await page.fill("#f-phone", "404-555-0134");
  await page.fill("#f-address", "12 Example Lane, Atlanta");
  await page.check("input[name=consentPhone]");
  await page.locator(".book button[type=submit]").click();
  await page.waitForSelector(".booked-t");
  assert.match(await page.locator(".booked-t").textContent(), /^You're booked: \w{3}, \w{3} \d+, afternoon\.$/);
  // The deepener, from the booked card
  await page.locator("[data-cta=sharpen-booked]").click();
  await page.waitForSelector("#deep");
  assert.equal(await page.locator(".gc-count").textContent(), "Question 1 of 12");
  for (const a of ["A rough split, private and shared bath", "1 or 2", "A rule of thumb", "Whenever the work is done", "I think a few did", "I don't know",
    "As many as the house can fit", "I assume bigger rooms rent better", "My own estimates", "I add a vacancy rate on top", "Not yet", "A loan sized on whole-home rent"]) await tap(page, a);
  await page.locator(".gc-submit").click();
  await page.waitForSelector(".done-card h2");
  assert.equal(await page.locator(".done-card h2").textContent(), "Done. Your report will use your 12 extra answers.");
  // What was stored, and what the page counted
  const row = S.rows().find((r) => r.email === "sam@example.com");
  assert.equal(row.status, "booked");
  assert.equal(row.booking.address, "12 Example Lane, Atlanta");
  assert.equal(row.report_result.areas.mix.score, 13);
  assert.equal(row.report_result.score, 33);
  assert.equal(row.tracking.utm_campaign, "fall");
  // The page measured each step while it was on screen; the server read the device from the browser itself
  assert.deepEqual(Object.keys(row.timing.steps).sort(), ["G1", "G2", "G3", "G4", "G5", "Q1", "Q2", "Q3", "Q4", "Q5", "S11"]);
  assert.ok(row.timing.totalMs > 0 && row.timing.landingMs > 0);
  assert.equal(row.device.type, "mobile");
  assert.ok(row.device.viewport);
  assert.deepEqual(Object.keys(row.deepener_timing.steps).length, 12);
  // The investor's report opens from the results page at once (instant delivery)
  const report = await ctx.newPage();
  await report.goto(`${S.url}/report/${row.token}`);
  assert.match(await report.locator("h1").first().textContent(), /The First Deal Risk Scorecard Report/);
  await report.close();
  // The page sends its events in batches: give the last one a moment to land
  let names = new Set();
  for (let i = 0; i < 30 && !names.has("deepener_done"); i++) { names = new Set(S.events().filter((e) => e.visit === row.visit).map((e) => e.name)); await page.waitForTimeout(100); }
  for (const n of ["view", "start", "step", "submit", "result", "book_open", "book", "deepener_start", "deepener_done"]) assert.ok(names.has(n), `event ${n}`);
  await ctx.close();
});

test("Outside the preset markets: no free forecast card, the market lookup instead", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/start`);
  await tap(page, "Learning, no house yet");
  await tap(page, "Not decided yet");
  for (const a of ["I don't have one yet", "I haven't looked", "No idea", "Not yet", "I haven't planned for it", "Not sure yet", "Not sure", "Not sure"]) await tap(page, a);
  await page.fill("#f-firstName", "Lee");
  await page.fill("#f-email", "lee@example.com");
  await page.check("input[name=consentEmail]");
  await page.locator(".gc-submit").click();
  await page.waitForURL(/\/results\/[A-Za-z0-9_-]+$/);
  await page.waitForSelector(".score-top");
  assert.match(await page.locator(".iw-big").textContent(), /You're not sure yet what the house will cost each month/);
  assert.equal(await page.locator(".months-strip").count(), 0, "no strip without the lease-up months");
  assert.equal(await page.locator("[data-cta=forecast]").count(), 0);
  assert.equal(await page.locator("[data-cta=market]").count(), 1);
  assert.match(await page.locator(".checks").textContent(), /Check the rule for every market on your shortlist/);
  const row = S.rows().find((r) => r.email === "lee@example.com");
  assert.equal(row.fit, "learning");
  assert.equal(row.route, "market lookup");
  await ctx.close();
});

test("Back keeps the answers; a skipped step is caught before sending", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/start`);
  await tap(page, "Looking at houses");
  await tap(page, "Atlanta");
  await page.locator(".gc-step:not([hidden]) .gc-back").click();
  assert.equal(await page.locator(".gc-count").textContent(), "Question 2 of 11");
  assert.equal(await page.locator(".gc-step:not([hidden]) input:checked").getAttribute("value"), "atlanta");
  await page.locator(".gc-step:not([hidden]) .gc-next").click();
  assert.equal(await page.locator(".gc-count").textContent(), "Question 3 of 11");
  await ctx.close();
});

test("The quiz works from the keyboard alone", async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${S.url}/first-deal`);
  await page.locator(".gc-step:not([hidden]) input[type=radio]").first().focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".gc-count").textContent(), "Question 2 of 11");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".gc-count").textContent(), "Question 3 of 11");
  await page.close();
});

test("A returning visitor (from the score email) sees the result; then unsubscribes", async () => {
  const sent = S.rows().find((r) => r.email === "sam@example.com");
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/results/${sent.token}`);
  await page.waitForSelector(".score-top");
  assert.match(await page.locator(".res-head").textContent(), /Your report was emailed to you as a PDF/);
  assert.match(await page.locator("#call").textContent(), /You're booked/);
  assert.match(await page.locator("#sharpen").textContent(), /Your report will use your 12 extra answers/);
  await page.goto(`${S.url}/results/nonexistenttokennonexistent`);
  await page.waitForSelector(".done-card");
  assert.match(await page.locator(".done-card").textContent(), /couldn't find that result/);
  await page.goto(`${S.url}/unsubscribe/${sent.token}`);
  await page.locator("[data-unsubscribe]").click();
  await page.waitForSelector("#unsub h2:has-text('Done')");
  assert.ok(S.rows().find((r) => r.token === sent.token).unsubscribed_at);
  await ctx.close();
});
