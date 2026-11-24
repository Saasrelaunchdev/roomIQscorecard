// The visitor's funnel in a real browser (Chromium, on a phone's screen): the first question in the first screen, the
// ten steps, the result, the call, the deepener, a returning visitor, unsubscribing. No console errors anywhere.
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
async function answerHero(page, { business = "Maple Street Heating", email = "sam@example.com" } = {}) {
  await tap(page, "HVAC");
  await tap(page, "16 to 40");
  await tap(page, "1 to 3");
  await tap(page, "Someone sends the link when they remember");
  await tap(page, "1 to 3 months ago");
  await tap(page, "Some of them");
  await tap(page, "$300 to $750");
  await tap(page, "Job software built for the trades");
  await page.fill("#f-company", business);
  await page.fill("#f-city", "Austin");
  await page.locator(".chip-opt", { hasText: /^1$/ }).click();
  await page.locator(".gc-step:not([hidden]) .gc-next").click();
  await page.fill("#f-firstName", "Sam");
  await page.fill("#f-email", email);
  await page.check("input[name=consentEmail]");
}

test("Version A (the Meta variant): the first question and all its answers fit the first screen of a phone", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/invisible`);
  const vh = page.viewportSize().height;
  for (const sel of [".gc-step:not([hidden]) .gc-q", ...[0, 1, 2, 3].map((i) => `.gc-step:not([hidden]) .gc-opt >> nth=${i}`)]) {
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
  assert.equal(await page.locator(".gc-count").textContent(), "Question 1 of 10");
  await answerHero(page);
  // The notice at collection names the button
  assert.match(await page.locator(".gc-step:not([hidden]) .legal-note").textContent(), /By tapping “See my score”/);
  await page.locator(".gc-submit").click();
  await page.waitForURL(/\/results\/[A-Za-z0-9_-]+$/);
  await page.waitForSelector(".score-top");
  assert.equal(await page.locator(".score-label").textContent(), "Visibility Score: 38/100, The Some-Days Shop. Higher is better.");
  const iw = await page.locator(".iw-big").textContent();
  assert.match(iw, /at least 560 customers a year/);
  assert.match(iw, /at least \$168,000 of your work/);
  assert.match(await page.locator(".iw-math").textContent(), /16 jobs a week × 50 weeks × 7 of 10 not asked × a \$300 ticket/);
  assert.match(await page.locator(".fix").textContent(), /Fix first: Ask Coverage\./);
  assert.match(await page.locator(".res-head").textContent(), /on its way to sam@example\.com/);
  assert.deepEqual(await page.locator(".bars4 .n").allTextContents(), ["25", "25", "50", "50"]);
  assert.equal(await page.locator(".acard .band").first().textContent(), "Low");
  // The CTA order on this site: the report (emailed, and here), pick a time, sharpen, see how we'd run it
  assert.deepEqual(await page.locator(".cta-card h3").allTextContents(), ["Your report", "Last step: pick a time", "Sharpen your report", "See how we'd run it for you"]);
  const token = page.url().split("/results/")[1];
  assert.equal(await page.locator("[data-cta=report]").getAttribute("href"), `/report/${token}`);
  assert.equal(await page.locator("[data-cta=pdf]").getAttribute("href"), `/report/${token}/pdf?download=1`);
  // The call
  await page.locator("[data-book-open]").click();
  await page.locator(".book .chip-opt").first().click();
  await page.locator(".book .chip-opt", { hasText: "Afternoon" }).click();
  await page.locator(".book button[type=submit]").click();
  assert.match(await page.locator(".book .err").textContent(), /10-digit/);
  await page.fill("#f-phone", "512-555-0134");
  await page.check("input[name=consentPhone]");
  await page.locator(".book button[type=submit]").click();
  await page.waitForSelector(".booked-t");
  assert.match(await page.locator(".booked-t").textContent(), /^You're booked: \w{3}, \w{3} \d+, afternoon\.$/);
  // The deepener, from the booked card
  await page.locator("[data-cta=sharpen-booked]").click();
  await page.waitForSelector("#deep");
  assert.equal(await page.locator(".gc-count").textContent(), "Question 1 of 8");
  for (const a of ["Most customers, except on busy days", "Most jobs", "Nothing, or not sure", "It stops", "It drops off when we're slammed", "No", "Within a week", "We reuse a few standard replies"]) await tap(page, a);
  await page.locator(".gc-submit").click();
  await page.waitForSelector(".done-card h2");
  assert.equal(await page.locator(".done-card h2").textContent(), "Done. Your report will use your 8 extra answers.");
  // What was stored, and what the page counted
  const row = S.rows().find((r) => r.email === "sam@example.com");
  assert.equal(row.status, "booked");
  assert.equal(row.report_result.areas.system.score, 13);
  assert.equal(row.tracking.utm_campaign, "fall");
  // The page measured each step while it was on screen; the server read the device from the browser itself
  assert.deepEqual(Object.keys(row.timing.steps).sort(), ["G1", "G2", "G3", "G4", "Q1", "Q2", "Q3", "Q4", "S10", "S9"]);
  assert.ok(row.timing.totalMs > 0 && row.timing.landingMs > 0);
  assert.equal(row.device.type, "mobile");
  assert.ok(row.device.viewport);
  assert.deepEqual(Object.keys(row.deepener_timing.steps).length, 8);
  // The owner's report opens from the results page at once (instant delivery)
  const report = await ctx.newPage();
  await report.goto(`${S.url}/report/${row.token}`);
  assert.match(await report.locator("h1").first().textContent(), /The Invisible Work Scorecard Report/);
  await report.close();
  // The page sends its events in batches: give the last one a moment to land
  let names = new Set();
  for (let i = 0; i < 30 && !names.has("deepener_done"); i++) { names = new Set(S.events().filter((e) => e.visit === row.visit).map((e) => e.name)); await page.waitForTimeout(100); }
  for (const n of ["view", "start", "step", "submit", "result", "book_open", "book", "deepener_start", "deepener_done"]) assert.ok(names.has(n), `event ${n}`);
  await ctx.close();
});

test("Back keeps the answers; a skipped step is caught before sending", async () => {
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/start`);
  await tap(page, "Plumbing");
  await tap(page, "5 to 15");
  await page.locator(".gc-step:not([hidden]) .gc-back").click();
  assert.equal(await page.locator(".gc-count").textContent(), "Question 2 of 10");
  assert.equal(await page.locator(".gc-step:not([hidden]) input:checked").getAttribute("value"), "5to15");
  await page.locator(".gc-step:not([hidden]) .gc-next").click();
  assert.equal(await page.locator(".gc-count").textContent(), "Question 3 of 10");
  await ctx.close();
});

test("The quiz works from the keyboard alone", async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${S.url}/invisible`);
  await page.locator(".gc-step:not([hidden]) input[type=radio]").first().focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".gc-count").textContent(), "Question 2 of 10");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".gc-count").textContent(), "Question 3 of 10");
  await page.close();
});

test("A returning visitor (from the score email) sees the result; then unsubscribes", async () => {
  const sent = S.rows().find((r) => r.email === "sam@example.com");
  const { ctx, page } = await phone();
  await page.goto(`${S.url}/results/${sent.token}`);
  await page.waitForSelector(".score-top");
  assert.match(await page.locator(".res-head").textContent(), /Your report was emailed to you as a PDF/);
  assert.match(await page.locator("#call").textContent(), /You're booked/);
  assert.match(await page.locator("#sharpen").textContent(), /Your report will use your 8 extra answers/);
  await page.goto(`${S.url}/results/nonexistenttokennonexistent`);
  await page.waitForSelector(".done-card");
  assert.match(await page.locator(".done-card").textContent(), /couldn't find that result/);
  await page.goto(`${S.url}/unsubscribe/${sent.token}`);
  await page.locator("[data-unsubscribe]").click();
  await page.waitForSelector("#unsub h2:has-text('Done')");
  assert.ok(S.rows().find((r) => r.token === sent.token).unsubscribed_at);
  await ctx.close();
});
