// The team's side in a real browser: sign in, find the scorecard, read where it came from and how long it took, give
// this lead a note, preview, approve and send the update, then the investor's link shows the checked report; the
// insights draw the funnel, the map and the heatmap with tooltips; the settings save. No outside-data form in this
// funnel (site.enrichment false).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { testServer, submission, ADMIN_PASSWORD } from "../helpers/server.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
let S, browser;
const errors = [];
before(async () => { S = await testServer(); browser = await chromium.launch(); });
after(async () => { await browser.close(); await S.close(); assert.deepEqual(errors, [], "no page errors"); });

test("sign in, read the lead, add a note, approve and send the update; the investor's link shows the report", { timeout: 180000 }, async () => {
  const geo = { "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "GA", "x-vercel-ip-city": "Atlanta" };
  const sub = await S.api("/api/scorecard", { method: "POST", headers: geo, body: submission({ email: "investor@example.com", firstName: "Jordan", timing: { totalMs: 71000, landingMs: 8000, backs: 1, steps: { G1: 8000, G2: 2500, Q1: 6100 } } }) });
  await S.api("/api/track", { method: "POST", headers: geo, body: { visit: "visit-e2e-1", variant: "scoreapp", source: "facebook", events: [{ name: "view" }, { name: "start" }, { name: "step", step: "G1", ms: 8000 }] } });
  await S.settled();
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(`${S.url}/admin`);
  await page.fill("input[name=password]", "wrong-password");
  await page.click("button[type=submit]");
  await page.waitForSelector(".login .err:not(:empty)");
  await page.fill("input[name=password]", ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForSelector(".tbl tr[data-id]");
  const tbl = await page.locator(".tbl").textContent();
  assert.match(tbl, /investor@example\.com/);
  assert.match(tbl, /2 uncovered months/, "the metric's count, in its own words");
  await page.locator(".tbl tr[data-id]", { hasText: "investor@example.com" }).click();
  await page.waitForSelector(".review");
  assert.equal(await page.locator("#profile").count(), 0, "no outside-data form in this funnel");
  assert.match(await page.locator(".lead-head").textContent(), /investor@example\.com/);
  assert.match(await page.locator(".lead-head h1").textContent(), /Jordan\s+Atlanta/);
  const result = await page.locator(".card").first().textContent();
  assert.match(result, /Fix first/);
  assert.match(result, /Fill Speed \(Room Mix is its effect\)/);
  assert.match(result, /2 uncovered months, \$4,000/);
  const view = await page.locator("#view").textContent();
  assert.match(view, /Atlanta, GA, US/);
  assert.match(view, /1 min 11 s/);
  assert.match(view, /went back 1 time/);
  assert.match(view, /6\.1 s/, "the seconds a question took");
  assert.match(await page.locator(".tbl.mini").first().textContent(), /Score and report/, "the email log");
  // This lead's own report: a note
  await page.fill("#lead-options [name=note]", "Good talking today.");
  await page.locator("[data-options]").click();
  await page.waitForSelector(".toast");
  await page.waitForSelector(".review");
  assert.equal(S.rows().find((r) => r.token === sub.data.token).report.options.note, "Good talking today.");
  // The live preview (signed in), next to the report the investor already has
  const preview = await ctx.newPage();
  await preview.goto(`${S.url}/report/${sub.data.token}?live=1`);
  assert.match(await preview.locator(".ribbon").textContent(), /Live preview for the team/);
  const body = await preview.locator("body").textContent();
  assert.match(body, /Your reserves run out 2 months early/);
  assert.match(body, /Good talking today\./);
  await preview.close();
  // Approve and send the update
  await page.fill("[name=checker]", "Dana");
  await page.locator("[data-send]").click();
  await page.waitForSelector(".tag.st-sent", { timeout: 90000 });
  assert.equal(S.rows().find((r) => r.token === sub.data.token).status, "sent");
  assert.ok(S.emails().some((m) => m.subject === "Your report, updated" && m.to === "investor@example.com"));
  // The investor's link, signed out
  const owner = await browser.newPage();
  await owner.goto(`${S.url}/report/${sub.data.token}`);
  assert.match(await owner.locator(".cover h1").textContent(), /The First Deal Risk Scorecard Report/);
  assert.match(await owner.locator(".cover").textContent(), /Checked by Dana at RoomIQ/);
  assert.equal(await owner.locator(".ribbon").count(), 0);
  await owner.close();
  // Insights: the numbers, the funnel, the map, the heatmap; a tooltip on hover and on keyboard focus
  await page.goto(`${S.url}/admin#insights`);
  await page.waitForSelector("#ins .stats");
  const ins = await page.locator("#ins").textContent();
  for (const words of ["Completed scorecards", "Question by question", "Where the leads are", "When investors take it", "Leads to call first", "Landing pages"]) assert.ok(ins.includes(words), words);
  await page.locator(".tile", { hasText: "GA" }).hover();
  await page.waitForSelector(".tip:not([hidden])");
  assert.match(await page.locator(".tip").textContent(), /1 lead/);
  await page.locator(".funnel .mrow").first().focus();
  assert.match(await page.locator(".tip").textContent(), /answered/);
  // Settings: the letter saves; words that break the claim rules are refused
  await page.goto(`${S.url}/admin#settings`);
  await page.waitForSelector(".setup");
  assert.match(await page.locator(".setup").textContent(), /Storage \(local\)/);
  await page.fill("#set-report [name=signerName]", "Dana");
  await page.locator("[data-save-report]").click();
  await page.waitForSelector(".toast:has-text('Saved')");
  await page.fill("#set-report [name=letter]", "Our forecasts are accurate.");
  await page.locator("[data-save-report]").click();
  await page.waitForSelector(".toast.bad");
  assert.match(await page.locator(".toast.bad").textContent(), /can't go in a report/);
  await ctx.close();
});
