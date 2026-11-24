// The team's side in a real browser: sign in, find the scorecard, read where it came from and how long it took, fill in
// the public profile, give this lead a note, preview, approve and send the update, then the owner's link shows the
// checked report; the insights draw the funnel, the map and the heatmap with tooltips; the settings save.
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

test("sign in, read the lead, fill in the profile, approve and send the update; the owner's link shows the report", { timeout: 180000 }, async () => {
  const geo = { "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "TX", "x-vercel-ip-city": "Austin" };
  const sub = await S.api("/api/scorecard", { method: "POST", headers: geo, body: submission({ email: "owner@example.com", company: "Maple Street Heating", timing: { totalMs: 71000, landingMs: 8000, backs: 1, steps: { G1: 8000, G2: 2500, Q1: 6100 } } }) });
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
  assert.match(await page.locator(".tbl").textContent(), /Maple Street Heating/);
  await page.locator(".tbl tr[data-id]", { hasText: "Maple Street Heating" }).click();
  await page.waitForSelector("#profile");
  assert.match(await page.locator(".lead-head").textContent(), /owner@example\.com/);
  assert.match(await page.locator(".card").first().textContent(), /Fix first/);
  const view = await page.locator("#view").textContent();
  assert.match(view, /Austin, TX, US/);
  assert.match(view, /1 min 11 s/);
  assert.match(view, /went back 1 time/);
  assert.match(view, /6\.1 s/, "the seconds a question took");
  assert.match(await page.locator(".tbl.mini").first().textContent(), /Score and report/, "the email log");
  // This lead's own report: a note
  await page.fill("#lead-options [name=note]", "Good talking today.");
  await page.locator("[data-options]").click();
  await page.waitForSelector(".toast");
  await page.waitForSelector("#profile");
  assert.equal(S.rows().find((r) => r.token === sub.data.token).report.options.note, "Good talking today.");
  const set = (name, v) => page.fill(`[name="${name}"]`, String(v));
  for (const [k, v] of Object.entries({ rating: 4.6, count: 87, reviews90: 5, newestDays: 40, replied: 12, sampled: 30 })) await set(`business.${k}`, v);
  await page.check('[name="business.checks.hours"]');
  for (let i = 0; i < 12; i++) await set(`months.${i}`, [6, 5, 7, 6, 2, 1, 2, 6, 7, 6, 5, 6][i]);
  await set("top3.0.name", "Sample Shop One");
  for (const [k, v] of Object.entries({ rating: 4.8, count: 412, reviews90: 31, newestDays: 3, replied: 27, sampled: 30 })) await set(`top3.0.${k}`, v);
  await page.check('[name="top3.0.checks.photos"]');
  await page.locator("#profile button[type=submit]").click();
  await page.waitForSelector(".toast");
  await page.waitForSelector("#profile");
  const row = S.rows().find((r) => r.token === sub.data.token);
  assert.equal(row.public_data.business.count, 87);
  assert.equal(row.public_data.top3[0].name, "Sample Shop One");
  assert.equal(row.public_data.business.months.length, 12);
  // The live preview (signed in), next to the report the owner already has
  const preview = await ctx.newPage();
  await preview.goto(`${S.url}/report/${sub.data.token}?live=1`);
  assert.match(await preview.locator(".ribbon").textContent(), /Live preview for the team/);
  const body = await preview.locator("body").textContent();
  assert.match(body, /Maple Street Heating, next to the top three for HVAC in Austin/);
  assert.match(body, /Good talking today\./);
  await preview.close();
  // Approve and send the update
  await page.fill("[name=checker]", "Dana");
  await page.locator("[data-send]").click();
  await page.waitForSelector(".tag.st-sent", { timeout: 90000 });
  assert.equal(S.rows().find((r) => r.token === sub.data.token).status, "sent");
  assert.ok(S.emails().some((m) => m.subject === "Your report, now with the top three near you" && m.to === "owner@example.com"));
  // The owner's link, signed out
  const owner = await browser.newPage();
  await owner.goto(`${S.url}/report/${sub.data.token}`);
  assert.match(await owner.locator(".cover h1").textContent(), /The Invisible Work Scorecard Report/);
  assert.match(await owner.locator(".cover").textContent(), /Checked by Dana at Rempo/);
  assert.equal(await owner.locator(".ribbon").count(), 0);
  await owner.close();
  // Insights: the numbers, the funnel, the map, the heatmap; a tooltip on hover and on keyboard focus
  await page.goto(`${S.url}/admin#insights`);
  await page.waitForSelector("#ins .stats");
  const ins = await page.locator("#ins").textContent();
  for (const words of ["Completed scorecards", "Question by question", "Where the leads are", "When owners take it", "Leads to call first", "Landing pages"]) assert.ok(ins.includes(words), words);
  await page.locator(".tile", { hasText: "TX" }).hover();
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
  await page.fill("#set-report [name=letter]", "We guarantee more reviews.");
  await page.locator("[data-save-report]").click();
  await page.waitForSelector(".toast.bad");
  assert.match(await page.locator(".toast.bad").textContent(), /can't go in a report/);
  await ctx.close();
});
