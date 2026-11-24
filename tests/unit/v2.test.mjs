// The second version's parts, one at a time: what the server reads about a visitor (location, device, timing,
// source), Resend's webhook signature, the copy that follows the report's delivery, the Rempo pages of the report and
// the team's settings, and the admin's analytics. The API tests (api.test.mjs) run them together.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { geoOf, deviceOf, timingOf, inAppOf } from "../../api/_lib/visitor.mjs";
import { sourceFrom, refHost } from "../../lib/source.mjs";
import { verifySvix, eventData } from "../../api/resend-webhook.mjs";
import { forDelivery } from "../../lib/delivery.mjs";
import { buildReport } from "../../lib/report-model.mjs";
import { reportHtml } from "../../lib/report-html.mjs";
import { cleanSettings, cleanOptions, sectionsFor, settingsOf } from "../../api/_lib/settings.mjs";
import { dimsOf, emailStatsOf, localSlot, quantile, funnelOf } from "../../lib/insights.mjs";
import { applyEmailEvent } from "../../api/_lib/store.mjs";
import SITE from "../../content/site.mjs";
import EMAILS from "../../content/emails.mjs";
import LANDING, { ALL as LANDING_ALL } from "../../content/landing.mjs";
import RESULTS from "../../content/results.mjs";
import { ROW, HERO } from "../fixtures/sample.mjs";

const req = (headers) => ({ headers });

test("the owner's decision of 2026-11-22: the PDF report goes out with the score; a person adds the top three", () => {
  assert.equal(SITE.reportDelivery, "instant");
  assert.ok(EMAILS.scoreReport.lines.some((l) => /within one business day/.test(l)), "the score email says the top three follow");
  assert.match(EMAILS.scoreReport.reportAttached, /attached as a PDF/);
  assert.match(LANDING.trust[2], /right after, as a PDF/);
  assert.match(RESULTS.header.email, /as a PDF/);
  assert.equal(RESULTS.ctaOrder[0], "report");
  // The checked wording is kept for switching back (site.reportDelivery "checked"), and both wordings are linted
  assert.match(LANDING_ALL.trust[2], /Checked by a person, emailed within one business day/);
  assert.equal(forDelivery(LANDING_ALL, "checked").trust[2], "Checked by a person, emailed within one business day");
});

test("location: country, state and city from Vercel's headers; nothing precise; junk dropped", () => {
  assert.deepEqual(geoOf(req({ "x-vercel-ip-country": "us", "x-vercel-ip-country-region": "tx", "x-vercel-ip-city": "San%20Antonio", "x-vercel-ip-timezone": "America/Chicago" })),
    { country: "US", region: "TX", city: "San Antonio", tz: "America/Chicago" });
  assert.equal(geoOf(req({})), null, "off Vercel: no location");
  const odd = geoOf(req({ "x-vercel-ip-country": "<script>", "x-vercel-ip-country-region": "TOOLONG", "x-vercel-ip-city": "S%C3%A3o%20Paulo%3Cb%3E", "x-vercel-ip-timezone": "Not a zone!" }));
  assert.deepEqual(odd, { country: "", region: "", city: "São Paulob", tz: "" });
  assert.equal(geoOf(req({ "x-vercel-ip-city": "%E0%A4%A" })).city, "EAA", "a broken encoding never throws (letters only are kept)");
});

test("device: phone, tablet or computer; the system; the browser; the app whose browser it is", () => {
  const iphoneIg = deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92", { vw: 390, vh: 664, sw: 390, sh: 844, dpr: 3, lang: "en-US", touch: 5 });
  assert.deepEqual(iphoneIg, { type: "mobile", os: "iOS", browser: "In-app", inApp: "instagram", viewport: "390x664", screen: "390x844", dpr: 3, lang: "en-US", touch: 5 });
  const fb = deviceOf("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/en_US;FBAV/440.0.0.0]");
  assert.equal(fb.type, "mobile"); assert.equal(fb.os, "Android"); assert.equal(fb.inApp, "facebook");
  assert.equal(deviceOf("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36").type, "tablet", "Android without Mobile is a tablet");
  assert.equal(deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", { touch: 5 }).type, "tablet", "an iPad says it is a Mac");
  const mac = deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", { touch: 0 });
  assert.deepEqual([mac.type, mac.os, mac.browser, mac.inApp], ["desktop", "macOS", "Safari", null]);
  assert.equal(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0").browser, "Edge");
  assert.equal(inAppOf("Mozilla/5.0 ... GSA/330.0"), "google-app");
  assert.equal(deviceOf("", { lang: "<script>", vw: -1, dpr: 99 }).lang, undefined, "the page's numbers are checked too");
});

test("timing: known steps only, whole milliseconds, capped; nothing when the page sent nothing", () => {
  assert.deepEqual(timingOf({ totalMs: 64321.4, landingMs: 9000, backs: 2, aways: 1, steps: { G1: 9100.6, X9: 5, Q1: -3, S10: 1e12 } }, ["G1", "Q1", "S10"]),
    { totalMs: 64321, landingMs: 9000, backs: 2, aways: 1, steps: { G1: 9101, S10: 3600000 } });
  assert.equal(timingOf(null, ["G1"]), null);
  assert.equal(timingOf({ steps: {} }, ["G1"]), null);
  assert.equal(timingOf([1, 2], ["G1"]), null);
});

test("source: the campaign, a Meta click, the referring site, or direct; both sides say the same", () => {
  assert.equal(sourceFrom({ utm_source: "Facebook" }), "facebook");
  assert.equal(sourceFrom({ utm_source: "fb" }), "facebook");
  assert.equal(sourceFrom({ utm_source: "ig" }), "instagram");
  assert.equal(sourceFrom({ fbclid: "abc" }), "facebook");
  assert.equal(sourceFrom({ referrer: "https://l.facebook.com/l.php?u=x" }), "facebook");
  assert.equal(sourceFrom({ referrer: "https://www.google.com/" }), "google");
  assert.equal(sourceFrom({ referrer: "https://www.google.co.uk/" }), "google");
  assert.equal(sourceFrom({ referrer: "https://m.yelp.com/biz/x" }), "yelp.com");
  assert.equal(sourceFrom({}), "direct");
  assert.equal(refHost("not a url"), "");
});

test("Resend's webhook: a Svix signature over id.timestamp.body; another secret, an old timestamp or a changed body fails", () => {
  const secret = `whsec_${Buffer.from("unit-test-signing-secret-32bytes").toString("base64")}`;
  const body = Buffer.from(JSON.stringify({ type: "email.opened", data: { email_id: "re_1" } }));
  const now = Date.UTC(2026, 10, 22, 12) ;
  const sign = (b, ts, key = secret) => createHmac("sha256", Buffer.from(key.slice(6), "base64")).update(`msg_1.${ts}.`).update(b).digest("base64");
  const ts = Math.floor(now / 1000);
  const H = (sig, t = ts) => new Map([["svix-id", "msg_1"], ["svix-timestamp", String(t)], ["svix-signature", sig]]);
  assert.deepEqual(verifySvix(body, H(`v1,${sign(body, ts)}`), secret, now), { ok: true });
  assert.equal(verifySvix(body, H(`v1,bm9wZQ== v1,${sign(body, ts)}`), secret, now).ok, true, "one of several signatures is enough (key rotation)");
  assert.equal(verifySvix(body, H(`v1,${sign(body, ts)}`), `whsec_${Buffer.from("another-secret-another-secret-12").toString("base64")}`, now).ok, false);
  assert.equal(verifySvix(body, H(`v1,${sign(body, ts - 600)}`, ts - 600), secret, now).ok, false, "older than five minutes");
  assert.equal(verifySvix(Buffer.from("{}"), H(`v1,${sign(body, ts)}`), secret, now).ok, false, "a changed body");
  assert.equal(verifySvix(body, new Map(), secret, now).ok, false);
  assert.deepEqual(eventData({ click: { link: "https://x.test/a", ipAddress: "1.2.3.4", userAgent: "x" } }), { link: "https://x.test/a" }, "never the reader's IP or browser");
});

test("an email's state only moves forward, and keeps when each step happened", () => {
  let m = { status: "sent", events: [] };
  m = applyEmailEvent(m, "email.opened", "2026-11-22T12:00:00Z", {});
  m = applyEmailEvent(m, "email.delivered", "2026-11-22T11:59:00Z", {});
  assert.equal(m.status, "opened");
  assert.equal(m.delivered_at, "2026-11-22T11:59:00Z");
  assert.equal(m.opened_at, "2026-11-22T12:00:00Z");
  assert.equal(applyEmailEvent(m, "email.sent", "x", {}), null, "not an event the log keeps");
});

test("the report's Rempo pages: the method from the answers, the two ways, the first 30 days; the letter and the note", () => {
  const m = buildReport(ROW, { links: { results: "https://x.test/results/T" }, now: new Date("2026-11-22T12:00:00"), checker: "Dana",
    options: { letter: "Hi {first_name},\n\nstart with {primary_bottleneck}. {unknown_field}", signer: { name: "Dana", title: "Founder" }, note: "Good talking today.", delivery: "instant" } });
  assert.deepEqual(m.sections, { letter: true, method: true, service: true, playbook: true });
  assert.deepEqual(m.letter.body, ["Hi Sam,", "start with Ask System."], "the team's letter, its fields filled, an unknown one dropped");
  assert.equal(m.letter.sign, "Dana, Founder, Rempo");
  assert.deepEqual(m.letter.note.body, ["Good talking today."]);
  assert.equal(m.coming, null, "the top three are in: nothing promised next");
  const steps = Object.fromEntries(m.method.steps.map((s) => [s.key, s]));
  assert.equal(steps.system.chip, "fix", "the first weak link is the one to fix");
  assert.equal(steps.system.first, true);
  assert.deepEqual(steps.coverage.today, ["1 to 3 of your last 10 customers were asked for a review.", "Most customers get asked, except on busy days.", "Most job records have the customer's mobile number or email."]);
  assert.deepEqual(steps.replies.profile, ["12 of your last 30 reviews have a reply."]);
  assert.match(m.service.days.yourStart[0], /^For Maple Street Heating, we'd start with Ask System\./);
  assert.match(m.overview.intro, /the Visible Work Method that closes the gaps, how Rempo would run it for you, and a 30-day plan you can run yourself\.$/);
  const html = reportHtml(m, {});
  for (const h of ["A note before you read", "What a fully visible shop does", "Where Maple Street Heating stands on each step", "Two ways to run the method", "Your first 30 days with Rempo", "Your Visible Work Starts Here"]) assert.ok(html.includes(h), h);
  assert.ok(html.includes("We don&#39;t remove reviews."), "what Rempo won't do");
});

test("the report's sections: off means left out; the first version's report stays as it was", () => {
  const lean = buildReport({ ...ROW, public_data: null, deepener: null }, { options: { sections: { letter: false, method: false, service: false }, delivery: "instant" } });
  assert.equal(lean.letter, null); assert.equal(lean.method, null); assert.equal(lean.service, null);
  assert.ok(lean.coming, "the instant report says the top three come next");
  const html = reportHtml(lean, {});
  assert.ok(html.includes("Coming within one business day"));
  assert.ok(!html.includes("What a fully visible shop does") && html.includes("Your Visible Work Starts Here"));
  // With the top three and the playbook, and none of the new pages, the overview reads exactly as before
  const before = buildReport(ROW, { options: { sections: { method: false, service: false }, delivery: "checked" } });
  assert.match(before.overview.intro, / Next come your Visibility Score, the work that never reaches Google, and how you compare with the top three near you\. Then your strongest and weakest areas, and a 30-day plan you can run yourself\.$/);
  // A snapshot taken by the first version (no sections in it) still draws, with the playbook and without the new pages
  const old = { ...before };
  delete old.sections; delete old.method; delete old.service; delete old.letter; delete old.coming;
  const oldHtml = reportHtml(old, {});
  assert.ok(oldHtml.includes("Your Visible Work Starts Here") && !oldHtml.includes("A note before you read"));
});

test("settings: checked words, real addresses, the sections a lead's report carries", () => {
  assert.throws(() => cleanSettings("report", { letter: "We guarantee more reviews in a month." }), /can't go in a report/);
  assert.throws(() => cleanSettings("report", { letter: "Rempo — always on." }), /dash/);
  assert.throws(() => cleanSettings("report", { letter: "74% of homeowners read reviews." }), /source/);
  assert.equal(cleanSettings("report", { letter: "74% of consumers look for recent reviews (BrightLocal 2026)." }).letter.length > 0, true);
  assert.throws(() => cleanSettings("notifications", { teamTo: "a@example.com, nope" }), /not an email/);
  assert.equal(cleanSettings("notifications", { teamTo: "a@example.com; b@example.com" }).teamTo, "a@example.com, b@example.com");
  assert.throws(() => cleanSettings("other", {}), /Unknown/);
  assert.throws(() => cleanOptions({ note: "Rempo is instant." }), /can't go in a report/);
  const settings = settingsOf({ report: { sections: { playbook: false } } });
  assert.deepEqual(sectionsFor(settings, { sections: { playbook: true, method: false } }), { letter: true, method: false, service: true, playbook: true });
  assert.deepEqual(sectionsFor(settings, {}), { letter: true, method: true, service: true, playbook: false });
});

test("analytics: dimensions merged and rated; email engagement; the lead's local hour; quantiles", () => {
  const d = dimsOf([{ dim: "source", value: "", name: "view", visits: 4 }, { dim: "source", value: "direct", name: "view", visits: 6 }, { dim: "source", value: "direct", name: "complete", visits: 2 },
    { dim: "device", value: "mobile", name: "view", visits: 10 }, { dim: "device", value: "mobile", name: "complete", visits: 4 }, { dim: "region", value: ":", name: "view", visits: 3 },
    { dim: "day", value: "2026-11-21", name: "view", visits: 2 }, { dim: "day", value: "2026-11-20", name: "view", visits: 1 }]);
  assert.deepEqual(d.source.map((x) => [x.value, x.views, x.complete, x.completionRate]), [["direct", 10, 2, 20]], "no source means direct");
  assert.equal(d.device[0].completionRate, 40);
  assert.deepEqual(d.region, [], "an event without a place is not a state");
  assert.deepEqual(d.day.map((x) => x.value), ["2026-11-20", "2026-11-21"]);
  const e = emailStatsOf([{ kind: "score", status: "clicked", delivered_at: "x" }, { kind: "score", status: "delivered", delivered_at: "x" }, { kind: "score", status: "failed" }, { kind: "team-lead", status: "sent" }]);
  assert.deepEqual(e.map((x) => [x.kind, x.sent, x.failed, x.delivered, x.opened, x.clicked, x.openRate]), [["score", 2, 1, 2, 1, 1, 50], ["team-lead", 1, 0, 0, 0, 0, 0]]);
  assert.deepEqual(localSlot("2026-11-23T15:30:00Z", "America/Chicago"), { wd: 0, h: 9 }, "Monday, 9 am in Austin");
  assert.deepEqual(localSlot("2026-11-23T15:30:00Z", "Nowhere/Real"), { wd: 0, h: 15 }, "an unknown zone falls back to UTC");
  assert.equal(quantile([1, 2, 3, 4]), 3);
  assert.equal(quantile([]), null);
  const f = funnelOf([{ variant: "a", name: "view", step: "", visits: 10 }, { variant: "", name: "report_view", step: "", visits: 3 }], [{ step: "Q1", median_ms: 4200, p75_ms: 6000 }]);
  assert.deepEqual(f.variants.map((v) => v.variant), ["a"], "a report view is not a landing page");
  assert.equal(f.all.steps.find((s) => s.id === "Q1").medianMs, 4200);
});

test("the sample is the worked example (the admin's test email uses it)", () => {
  assert.deepEqual(ROW.answers, HERO);
  assert.equal(buildReport(ROW, {}).result.score, 38);
});
