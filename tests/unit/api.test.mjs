// The API end to end, over HTTP, against tools/dev.mjs with a local store and an outbox: what a visitor sends, what is
// stored, what is emailed, who can read what. The browser is in tests/e2e.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { testServer, submission, nextWeekday, svixHeaders } from "../helpers/server.mjs";
import { pdfAvailable } from "../../api/_lib/pdf.mjs";
import { scorecardFileName } from "../../api/_lib/reports.mjs";
import { default as SCORECARD } from "../../content/scorecard.mjs";
const SC_NAME = SCORECARD.name;

let S;
before(async () => { S = await testServer(); });
after(async () => { await S.close(); });

const submit = (extra) => S.api("/api/scorecard", { method: "POST", body: submission(extra) });

test("submit: scored again on the server, stored, answered at once; then the score email with the report, the team told", async () => {
  const before = S.emails().length;
  const body = submission({ score: 99, result: { score: 99 } });
  const r = await S.api("/api/scorecard", { method: "POST", body });
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
  assert.match(r.data.token, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(r.data.result.score, 38, "the browser's numbers are never trusted");
  assert.deepEqual(r.data.deepener.shown, ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"]);
  assert.equal(r.data.delivery, "instant");
  let row = S.rows().find((x) => x.token === r.data.token);
  assert.equal(row.score, 38);
  assert.equal(row.tier, "somedays");
  assert.equal(row.bottleneck, "coverage");
  assert.equal(row.fit, "qualified");
  assert.equal(row.route, "call or checkout");
  assert.equal(row.email, body.email.toLowerCase());
  assert.equal(row.tracking.utm_source, "facebook");
  assert.equal(row.tracking.source, "facebook");
  assert.equal(row.consent.consentEmail, true);
  assert.equal(row.result.invisible.unasked, 560);
  assert.match(row.ip_hash || "", /^[0-9a-f]{64}$|^$/);
  // After the answer: the report, its emails, the counters
  await S.settled();
  row = S.rows().find((x) => x.token === r.data.token);
  assert.ok(row.report.snapshot, "the report the owner was sent is kept");
  assert.ok(row.report.instant_at);
  assert.equal(row.report.pdf_ok, false, "no PDF in this test (SCORECARD_PDF=off): the email carries the link");
  const mail = S.emails().slice(before);
  const score = mail.find((m) => m.subject === "Your Visibility Score: 38/100, and your report");
  assert.ok(score, "the score email, with the report");
  assert.equal(score.to, body.email.toLowerCase());
  assert.match(score.text, /at least 560 customers a year/);
  assert.match(score.text, /Fix first: Ask Coverage\./);
  assert.match(score.text, /Your full report is online here: http:\/\/localhost:\d+\/report\//);
  assert.match(score.text, /the Visible Work Method that closes the gaps/);
  assert.match(score.text, /Next, someone on our team will compare Maple Street Heating with the top three for HVAC in Austin/);
  assert.match(score.text, /Answer 8 more quick questions here: http:\/\/localhost:\d+\/sharpen\//);
  assert.match(score.text, /Unsubscribe: http:\/\/localhost:\d+\/unsubscribe\//);
  assert.match(score.html, /<a href="http:\/\/localhost:\d+\/report\//);
  assert.deepEqual(score.attachments, []);
  const team = mail.find((m) => m.team && /New scorecard: Maple Street Heating, Austin\. 38\/100/.test(m.title));
  assert.ok(team, "the team's notice");
  assert.ok(team.rows.some(([k, v]) => k === "Report" && /could not be printed/.test(v)));
  assert.ok(team.links.some(([k]) => k === "Their report"));
  // Every email is in the log, with the id the provider gave it
  const log = S.emailLog().filter((m) => m.assessment_id === row.id);
  assert.ok(log.some((m) => m.kind === "score" && m.status === "sent" && m.provider_id === score.id && m.to_email === row.email));
  assert.ok(log.some((m) => m.kind === "team-lead" && m.status === "sent"));
  const complete = S.events().find((e) => e.name === "complete" && e.visit === body.visit);
  assert.ok(complete, "the completion is counted server side");
  assert.equal(complete.assessment, row.id);
  assert.equal(complete.source, "facebook");
  // The owner's link works at once, with the comparison promised next
  const page = await (await S.api(`/report/${r.data.token}`, { raw: true })).text();
  assert.match(page, /The Invisible Work Scorecard Report/);
  assert.match(page, /Coming within one business day/);
  assert.match(page, /What a fully visible shop does/);
  assert.doesNotMatch(page, /Preview for the team/);
});

test("submit: the time each question took, the approximate location, the device", async () => {
  const timing = { totalMs: 64321.4, landingMs: 9000, backs: 1, aways: 2, steps: { G1: 9100, G2: 3200, Q1: 4100, X9: 5, S10: 99999999 } };
  const client = { vw: 390, vh: 664, sw: 390, sh: 844, dpr: 3, lang: "en-US", touch: 5 };
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92";
  const headers = { "user-agent": ua, "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "TX", "x-vercel-ip-city": "San%20Antonio", "x-vercel-ip-timezone": "America/Chicago" };
  const r = await S.api("/api/scorecard", { method: "POST", body: submission({ timing, client, utm_source: "", page: "https://scorecard.test/", referrer: "https://l.instagram.com/" }), headers });
  assert.equal(r.status, 200);
  const row = S.rows().find((x) => x.token === r.data.token);
  assert.deepEqual(row.timing, { totalMs: 64321, landingMs: 9000, backs: 1, aways: 2, steps: { G1: 9100, G2: 3200, Q1: 4100, S10: 3600000 } }, "known steps only, whole milliseconds, capped");
  assert.deepEqual(row.geo, { country: "US", region: "TX", city: "San Antonio", tz: "America/Chicago" });
  assert.equal(row.device.type, "mobile");
  assert.equal(row.device.os, "iOS");
  assert.equal(row.device.inApp, "instagram");
  assert.equal(row.device.viewport, "390x664");
  assert.equal(row.device.lang, "en-US");
  assert.equal(row.tracking.source, "instagram", "the referrer names the source when the link had no utm_source");
  // Nothing precise: no coordinates, no postal code, no IP address
  assert.equal(JSON.stringify(row).match(/latitude|longitude|postal|"ip"/), null);
  await S.settled();
  const team = S.emails().reverse().find((m) => m.team && m.rows.some(([k, v]) => k === "Business" && /Maple Street Heating/.test(v)));
  assert.ok(team.rows.some(([k, v]) => k === "Location" && v === "San Antonio, TX, US"));
  assert.ok(team.rows.some(([k, v]) => k === "Device" && v === "Phone, iOS, in Instagram's browser"));
  assert.ok(team.rows.some(([k, v]) => k === "Time to finish" && v === "1 min 4 s"));
});

test("submit: what is refused, and the honeypot", async () => {
  const missing = submission();
  delete missing.answers.jobs;
  let r = await S.api("/api/scorecard", { method: "POST", body: missing });
  assert.equal(r.status, 400);
  assert.deepEqual(r.data.missing, ["jobs"]);
  r = await submit({ answers: { ...submission().answers, asks: "made-up" } });
  assert.equal(r.status, 400);
  r = await submit({ email: "not-an-email" });
  assert.equal(r.status, 400);
  r = await submit({ consentEmail: false });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /Consent/);
  r = await submit({ company: "" });
  assert.equal(r.status, 400);
  const n = S.rows().length;
  r = await submit({ hp: "I am a bot" });
  assert.equal(r.status, 200);
  assert.equal(S.rows().length, n, "a bot's submission is answered like a success and dropped");
  r = await S.api("/api/scorecard", { method: "POST", body: submission(), headers: { origin: "https://evil.example" } });
  assert.equal(r.status, 403);
  r = await S.api("/api/scorecard", { method: "POST", body: { action: "nope" } });
  assert.equal(r.status, 400);
});

test("submit: five an hour per email, then refused", async () => {
  const email = `limit-${Date.now()}@example.com`;
  for (let i = 0; i < 5; i++) assert.equal((await submit({ email })).status, 200);
  const r = await submit({ email });
  assert.equal(r.status, 429);
});

test("the result by token: the score and its words, never the answers or the email", async () => {
  const { data } = await submit();
  const r = await S.api(`/api/scorecard?token=${data.token}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.firstName, "Sam");
  assert.equal(r.data.result.score, 38);
  assert.equal(r.data.result.invisible.workValue, 168000);
  assert.equal(JSON.stringify(r.data).includes("@example.com"), false);
  assert.equal("answers" in r.data, false);
  assert.equal(r.data.reportReady, true);
  assert.equal(r.data.delivery, "instant");
  assert.equal((await S.api("/api/scorecard?token=doesnotexistdoesnotexist12")).status, 404);
  assert.equal((await S.api("/api/scorecard?token=bad")).status, 404);
});

test("the deepener: the report's scores follow it; a hidden question can't be answered", async () => {
  const { data } = await submit();
  let r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: data.token, answers: { d1: "most" } } });
  assert.equal(r.status, 400);
  assert.ok(r.data.missing.includes("d2"));
  await S.settled();
  const before = S.emails().length;
  r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: data.token, answers: { d1: "most", d2: "most", d3: "nothing", d4: "stops", d5: "drops", d6: "no", d7: "week", d8: "standard" },
    timing: { totalMs: 21000, steps: { D1: 2500, D2: 3000, Q1: 1 } } } });
  assert.equal(r.status, 200);
  assert.equal(r.data.n, 8);
  await S.settled();
  const sharper = S.emails().slice(before).find((m) => m.subject === "Your sharper report: 38/100");
  assert.ok(sharper, "the sharper report goes to the owner");
  assert.match(sharper.text, /Thanks for the 8 extra answers/);
  assert.match(sharper.text, /Fix first: Ask System\./);
  assert.match(sharper.text, /The updated report is online here: http:\/\/localhost:\d+\/report\//);
  assert.match(sharper.text, /Pick a time for a 15-minute call: http:\/\/localhost:\d+\/results\/[A-Za-z0-9_-]+#call/);
  const row = S.rows().find((x) => x.token === data.token);
  assert.deepEqual(row.deepener_timing, { totalMs: 21000, steps: { D1: 2500, D2: 3000 } });
  assert.equal(row.report.snapshot.deepened, true, "the owner's report now carries the extra answers");
  assert.equal(row.report_result.areas.system.score, 13);
  assert.equal(row.report_result.score, 38);
  assert.equal(row.bottleneck, "system");
  assert.equal(row.score, 38, "the on-screen score stays");
  const view = await S.api(`/api/scorecard?token=${data.token}`);
  assert.equal(view.data.deepener.done, true);
  // Q2 "We don't really ask" hides D3 and D4
  const none = await submit({ answers: { ...submission().answers, asks: "none" } });
  assert.deepEqual(none.data.deepener.shown, ["d1", "d2", "d5", "d6", "d7", "d8"]);
  r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: none.data.token, answers: { d1: "most", d2: "most", d3: "one", d4: "runs", d5: "yes", d6: "current", d7: "sameday", d8: "personal" } } });
  assert.equal(r.status, 200);
  assert.equal(r.data.n, 6);
});

test("the call: weekdays only, a US number and consent; the call email goes out", async () => {
  const { data } = await submit();
  const base = { action: "book", token: data.token, slotDay: nextWeekday(), slotWindow: "midday", phone: "(512) 555-0134", consentPhone: true, consentText: false };
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { ...base, phone: "555" } })).status, 400);
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { ...base, consentPhone: false } })).status, 400);
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { ...base, slotWindow: "midnight" } })).status, 400);
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { ...base, slotDay: "2020-01-06" } })).status, 400);
  const sat = new Date(); while (sat.getDay() !== 6) sat.setDate(sat.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { ...base, slotDay: `${sat.getFullYear()}-${p(sat.getMonth() + 1)}-${p(sat.getDate())}` } })).status, 400);
  const before = S.emails().length;
  const r = await S.api("/api/scorecard", { method: "POST", body: base });
  assert.equal(r.status, 200);
  assert.equal(r.data.window, "midday");
  assert.equal(r.data.phone, "(512) 555-0134");
  const row = S.rows().find((x) => x.token === data.token);
  assert.equal(row.status, "booked");
  assert.equal(row.booking.phone, "5125550134");
  await S.settled();
  const call = S.emails().slice(before).find((m) => /^You're booked: /.test(m.subject || ""));
  assert.ok(call);
  assert.match(call.text, /We'll call \(512\) 555-0134\./);
  assert.match(call.text, /Can you reply YES to confirm\?/);
});

test("unsubscribe: no more emails to that address", async () => {
  const { data } = await submit();
  await S.settled();
  assert.equal((await S.api("/api/scorecard", { method: "POST", body: { action: "unsubscribe", token: data.token } })).status, 200);
  const row = S.rows().find((x) => x.token === data.token);
  assert.ok(row.unsubscribed_at);
  const before = S.emails().length;
  await S.api("/api/scorecard", { method: "POST", body: { action: "book", token: data.token, slotDay: nextWeekday(), slotWindow: "morning", phone: "5125550134", consentPhone: true } });
  await S.settled();
  assert.equal(S.emails().slice(before).filter((m) => !m.team).length, 0);
});

test("analytics: known events kept, unknown dropped, nothing personal", async () => {
  const n = S.events().length;
  let r = await S.api("/api/track", { method: "POST", body: JSON.stringify({ visit: "visit-abc123", variant: "invisible", events: [{ name: "view" }, { name: "step", step: "G1" }, { name: "hack", step: "x" }, { name: "start", step: "<script>" }] }), headers: { "content-type": "text/plain" } });
  assert.equal(r.status, 200);
  const added = S.events().slice(n);
  assert.deepEqual(added.map((e) => [e.name, e.step, e.variant]), [["view", "", "invisible"], ["step", "G1", "invisible"], ["start", "", "invisible"]]);
  r = await S.api("/api/track", { method: "POST", body: { visit: "x", events: [] } });
  assert.equal(r.status, 400);
  // Where, on what, from where, and how long a step took: from the request, never from what the page claims
  const m = S.events().length;
  r = await S.api("/api/track", { method: "POST", body: JSON.stringify({ visit: "visit-def456", variant: "invisible", source: "facebook", events: [{ name: "step", step: "Q1", ms: 4200.6 }, { name: "view", ms: 99 }, { name: "deepener_step", step: "D1", ms: 99999999 }] }),
    headers: { "content-type": "text/plain", "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "CA", "user-agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/en_US;FBAV/440.0.0.0]" } });
  const timed = S.events().slice(m);
  assert.deepEqual(timed.map((e) => [e.name, e.data, e.country, e.region, e.device, e.inapp, e.source]), [
    ["step", { ms: 4201 }, "US", "CA", "mobile", "facebook", "facebook"],
    ["view", {}, "US", "CA", "mobile", "facebook", "facebook"],
    ["deepener_step", { ms: 3600000 }, "US", "CA", "mobile", "facebook", "facebook"]
  ]);
});

test("pages: the rewrites serve the right shells, with the right robots rules", async () => {
  const home = await S.api("/", { raw: true });
  const html = await home.text();
  assert.match(html, /Is Your Review Habit Strong Enough to Show the Work You Actually Do\?/);
  assert.equal((html.match(/class="gc-step"/g) || []).length, 10, "the ten steps are in the page");
  const inv = await (await S.api("/invisible", { raw: true })).text();
  assert.match(inv, /Your work is better\. Can homeowners see it\?/);
  const res = await S.api("/results/abcdefghijklmnopqrstuvwxyz", { raw: true });
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(await res.text(), /name="robots" content="noindex,nofollow"/);
  assert.equal((await S.api("/no-such-page", { raw: true })).status, 404);
  const robots = await (await S.api("/robots.txt", { raw: true })).text();
  assert.match(robots, /Disallow: \/results\//);
});

test("health: names and true or false, never a value", async () => {
  const r = await S.api("/api/scorecard");
  assert.equal(r.status, 200);
  assert.equal(r.data.database.mode, "local");
  assert.equal(r.data.vars.ADMIN_PASSWORD, true);
  assert.equal(r.data.vars.RESEND_WEBHOOK_SECRET, true);
  assert.equal(r.data.reportDelivery, "instant");
  assert.equal(JSON.stringify(r.data).includes("test-admin-password"), false);
});

test("admin: signed out is refused; a wrong password is refused; the right one signs in", async () => {
  S.clearCookie();
  assert.equal((await S.api("/api/admin?action=list", { auth: true })).status, 401);
  assert.equal((await S.api("/api/admin?action=login", { method: "POST", body: { password: "nope" }, auth: true })).status, 401);
  const r = await S.login();
  assert.equal(r.status, 200);
  const s = await S.api("/api/admin?action=session", { auth: true });
  assert.equal(s.data.authenticated, true);
  assert.equal(s.data.setup.storage, "local");
});

test("admin: the list, a lead, the public profile, approve and send (the PDF attached), the report's access", { timeout: 180000 }, async () => {
  await S.login();
  const { data } = await submit({ firstName: "Robin", company: "Pipe Dream Plumbing", email: "robin@example.com", answers: { ...submission().answers, trade: "plumbing" },
    timing: { totalMs: 58000, landingMs: 12000, backs: 0, aways: 0, steps: { G1: 12000, G2: 2500, Q1: 3900 } } });
  await S.settled();
  const list = await S.api("/api/admin?action=list&q=Pipe%20Dream", { auth: true });
  assert.equal(list.status, 200);
  const item = list.data.rows.find((x) => x.company === "Pipe Dream Plumbing");
  assert.ok(item);
  assert.equal(item.seconds, 58);
  assert.equal(item.value, 168000);
  assert.equal(item.source, "facebook");
  assert.equal(item.report_emailed, true);
  const lead = await S.api(`/api/admin?action=lead&id=${item.id}`, { auth: true });
  assert.equal(lead.status, 200);
  assert.equal(lead.data.report.result.score, 38);
  assert.equal(lead.data.labels.find((l) => l.id === "G1").a, "Plumbing");
  assert.equal(lead.data.labels.find((l) => l.id === "Q1").seconds, 3.9);
  assert.equal(lead.data.visitor.total, "58 s");
  assert.equal(lead.data.form.months.length, 12);
  assert.ok(lead.data.emails.some((m) => m.kind === "score" && m.status === "sent"), "the lead's emails, from the log");
  assert.ok(lead.data.reportState.emailedAt);
  assert.equal(lead.data.row.report.snapshot, undefined, "the snapshot stays on the server");
  assert.equal(lead.data.options.effective.playbook, true);
  // The owner already has the report (instant delivery): their link shows it, never "on its way"
  S.clearCookie();
  let page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The Invisible Work Scorecard Report/);
  assert.doesNotMatch(page, /Your report is on its way/);
  await S.login();
  // The profile
  const pd = { search: { service: "plumbing", city: "Austin", date: "2026-11-22" },
    business: { rating: "4.4", count: "40", reviews90: "3", newestDays: "75", replied: "5", sampled: "30", checks: { hours: true }, months: [1, 1, 0, 2, 1, 0, 0, 1, 2, 1, 1, 0] },
    top3: [{ name: "One", rating: 4.8, count: 300, reviews90: 25, newestDays: 2, replied: 25, sampled: 30, checks: { hours: true, services: true, photos: true, description: true, categories: true } }],
    themes: [{ theme: "a call that was not returned", count: "2" }, { theme: "", count: 1 }], compare: "", monthsRead: "auto", junk: "dropped" };
  let r = await S.api("/api/admin?action=save", { method: "POST", body: { id: item.id, public_data: pd, checker: "Dana", notes: "Owner prefers mornings." }, auth: true });
  assert.equal(r.status, 200);
  const row = S.rows().find((x) => x.id === item.id);
  assert.equal(row.public_data.business.rating, 4.4);
  assert.equal(row.public_data.themes.length, 1);
  assert.equal("junk" in row.public_data, false);
  assert.equal(row.report.checker, "Dana");
  // The GTM gap score now carries the top-three reading (suggested: far behind on every measure)
  assert.equal(row.report_result.gtmGapScore, 20 + 14 + 8 + 12 + 25);
  // The team's live preview, signed in, next to what the owner has
  page = await (await S.api(`/report/${data.token}?live=1`, { raw: true, auth: true })).text();
  assert.match(page, /Live preview for the team/);
  assert.match(page, /Pipe Dream Plumbing, next to the top three for plumbing in Austin/);
  // Approve and send: the update, with the PDF attached when one can print here
  S.pdf(pdfAvailable() || Boolean(process.env.CHROMIUM_PATH));
  const printing = (() => { try { return pdfAvailable(); } catch { return false; } })();
  if (!printing) S.pdf(false);
  const before = S.emails().length;
  r = await S.api("/api/admin?action=send", { method: "POST", body: { id: item.id }, auth: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.emailed, true);
  const sent = S.rows().find((x) => x.id === item.id);
  assert.equal(sent.status, "sent");
  assert.ok(sent.report.snapshot && sent.report.snapshot.fields.business === "Pipe Dream Plumbing");
  assert.ok(sent.report.snapshot.top3.available);
  const mail = S.emails().slice(before).find((m) => m.subject === "Your report, now with the top three near you");
  assert.ok(mail, "the update to the report the owner has");
  assert.match(mail.text, /Dana at Rempo read your public Google profile and the top three for plumbing in Austin/);
  if (printing) {
    assert.equal(mail.attachments.length, 1);
    assert.equal(mail.attachments[0].filename, `${scorecardFileName()}-Pipe-Dream-Plumbing.pdf`);
    assert.equal(readFileSync(mail.attachments[0].file).subarray(0, 5).toString(), "%PDF-");
    assert.match(mail.text, /The updated report is attached as a PDF/);
  }
  // Now anyone with the link sees the checked report, from the snapshot, and each view is counted
  S.clearCookie();
  page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The Invisible Work Scorecard Report/);
  assert.match(page, /Pipe Dream Plumbing, next to the top three/);
  assert.doesNotMatch(page, /Preview for the team/);
  if (printing) {
    const pdf = await S.api(`/report/${data.token}/pdf`, { raw: true });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get("content-type"), "application/pdf");
    const bytes = Buffer.from(await pdf.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  }
  S.pdf(false);
  await S.settled();
  const counted = S.rows().find((x) => x.id === item.id);
  assert.ok(counted.report_views >= 2, "the owner's views are counted");
  if (printing) assert.equal(counted.pdf_downloads, 1);
  // Reopen: in the instant delivery the owner keeps the report they were sent
  await S.login();
  r = await S.api("/api/admin?action=reopen", { method: "POST", body: { id: item.id }, auth: true });
  assert.equal(r.status, 200);
  S.clearCookie();
  page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The Invisible Work Scorecard Report/);
});

test("admin: a lead's own report: a note, and the sections it carries; the claim rules apply", async () => {
  await S.login();
  const { data } = await submit({ company: "Note Test Heating" });
  await S.settled();
  const id = S.rows().find((x) => x.token === data.token).id;
  let r = await S.api("/api/admin?action=options", { method: "POST", body: { id, note: "Good talking today.\n\nWe'd start with your replies.", sections: { playbook: false, method: true, bogus: true } }, auth: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.deepEqual(r.data.options, { note: "Good talking today.\n\nWe'd start with your replies.", sections: { method: true, playbook: false } });
  const page = await (await S.api(`/report/${data.token}?live=1`, { raw: true, auth: true })).text();
  assert.match(page, /For Note Test Heating/);
  assert.match(page, /We&#39;d start with your replies\./);
  assert.doesNotMatch(page, /Your Visible Work Starts Here/, "no playbook in this lead's report");
  assert.match(page, /Where Note Test Heating stands on each step/);
  r = await S.api("/api/admin?action=options", { method: "POST", body: { id, note: "We guarantee more reviews in 30 days." }, auth: true });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /can't go in a report/);
});

test("admin: settings: the letter and its signature, the sections, the team's address; checked words only", async () => {
  await S.login();
  let r = await S.api("/api/admin?action=settings", { auth: true });
  assert.equal(r.status, 200);
  assert.equal(r.data.settings.report.sections.method, true);
  assert.equal(r.data.settings.notifications.attachPdf, true);
  assert.equal(r.data.delivery, "instant");
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "report", value: { letter: "Hi {first_name}, thanks for taking the scorecard.\n\nStart with {primary_bottleneck}.", signerName: "Dana", signerTitle: "Founder", sections: { service: false } } }, auth: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.settings.report.signerName, "Dana");
  assert.equal(r.data.settings.report.sections.service, false);
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "report", value: { letter: "Rempo is instant and gets you more reviews." } }, auth: true });
  assert.equal(r.status, 400);
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "notifications", value: { teamTo: "sales@example.com, not-an-email" } }, auth: true });
  assert.equal(r.status, 400);
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "notifications", value: { teamTo: "sales@example.com; owner@example.com", attachPdf: false } }, auth: true });
  assert.equal(r.status, 200);
  assert.equal(r.data.settings.notifications.teamTo, "sales@example.com, owner@example.com");
  // The next lead: the letter, signed; no Rempo pages; the team's notice to the new addresses
  const { data } = await submit({ firstName: "Lee", company: "Letter Test Plumbing" });
  await S.settled();
  const page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /Hi Lee, thanks for taking the scorecard\./);
  assert.match(page, /Start with Ask Coverage\./);
  assert.match(page, /Dana, Founder, Rempo/);
  assert.doesNotMatch(page, /Two ways to run the method/);
  const team = S.emails().reverse().find((m) => m.team && /Letter Test Plumbing/.test(m.title));
  assert.deepEqual(team.to, ["sales@example.com", "owner@example.com"]);
  // Back to the defaults, for the other tests
  await S.api("/api/admin?action=settings", { method: "POST", body: { key: "report", value: {} }, auth: true });
  await S.api("/api/admin?action=settings", { method: "POST", body: { key: "notifications", value: {} }, auth: true });
});

test("admin: the test email sends the sample report to the address given", async () => {
  await S.login();
  assert.equal((await S.api("/api/admin?action=test-email", { method: "POST", body: { to: "nope" }, auth: true })).status, 400);
  const before = S.emails().length;
  const r = await S.api("/api/admin?action=test-email", { method: "POST", body: { to: "Owner@Example.com" }, auth: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const mail = S.emails().slice(before).find((m) => /^Test: Your Visibility Score/.test(m.subject || ""));
  assert.ok(mail);
  assert.equal(mail.to, "owner@example.com");
  assert.match(mail.text, /This is the sample report, for a made-up shop/);
  assert.ok(S.emailLog().some((m) => m.kind === "test" && m.to_email === "owner@example.com"));
});

test("the Resend webhook: signed events move each email forward; anything else is refused", async () => {
  const { data } = await submit();
  await S.settled();
  const row = S.rows().find((x) => x.token === data.token);
  const score = S.emailLog().find((m) => m.assessment_id === row.id && m.kind === "score");
  const post = async (type, extra = {}, opts = {}) => {
    const body = JSON.stringify({ type, created_at: new Date().toISOString(), data: { email_id: score.provider_id, ...extra } });
    const headers = opts.headers || await svixHeaders(body, opts.secret, opts);
    return S.api("/api/resend-webhook", { method: "POST", body, headers });
  };
  let r = await post("email.delivered");
  assert.equal(r.status, 200);
  assert.equal(r.data.matched, true);
  r = await post("email.opened");
  r = await post("email.clicked", { click: { link: "https://scorecard.test/report/x", ipAddress: "1.2.3.4" } });
  r = await post("email.delivered");
  let m = S.emailLog().find((x) => x.id === score.id);
  assert.equal(m.status, "clicked", "a late delivered never moves it back");
  assert.ok(m.delivered_at && m.opened_at && m.clicked_at);
  assert.equal(m.events.find((e) => e.type === "clicked").data.link, "https://scorecard.test/report/x");
  assert.equal(JSON.stringify(m.events).includes("1.2.3.4"), false, "no reader's IP address is kept");
  // Refused: unsigned, the wrong secret, an old timestamp; ignored: an event that is not about an email
  assert.equal((await post("email.opened", {}, { headers: { "content-type": "application/json" } })).status, 400);
  assert.equal((await post("email.opened", {}, { secret: `whsec_${Buffer.from("another-secret-another-secret-12").toString("base64")}` })).status, 400);
  assert.equal((await post("email.opened", {}, { at: Math.floor(Date.now() / 1000) - 3600 })).status, 400);
  const other = JSON.stringify({ type: "contact.created", data: {} });
  r = await S.api("/api/resend-webhook", { method: "POST", body: other, headers: await svixHeaders(other) });
  assert.equal(r.status, 200);
  assert.equal(r.data.ignored, "contact.created");
  // A spam complaint unsubscribes the lead
  r = await post("email.complained");
  assert.equal(r.status, 200);
  assert.ok(S.rows().find((x) => x.id === row.id).unsubscribed_at);
  assert.equal((await S.api("/api/resend-webhook")).data.configured, true);
});

test("the PDF report goes with the score email, to the owner and the team", { timeout: 120000, skip: !pdfAvailableWithout() && "no Chromium here" }, async () => {
  S.pdf(true);
  try {
    const before = S.emails().length;
    const { data } = await submit({ company: "Pdf Test Heating" });
    await S.settled();
    const mail = S.emails().slice(before);
    const score = mail.find((m) => m.subject === "Your Visibility Score: 38/100, and your report");
    assert.equal(score.attachments.length, 1);
    assert.equal(score.attachments[0].filename, `${scorecardFileName()}-Pdf-Test-Heating.pdf`);
  assert.equal(scorecardFileName(), String(SC_NAME).replace(/^the\s+/i, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    assert.ok(score.attachments[0].bytes > 50000);
    assert.equal(readFileSync(score.attachments[0].file).subarray(0, 5).toString(), "%PDF-");
    assert.match(score.text, /Your full report is attached as a PDF, and it's online here: /);
    const team = mail.find((m) => m.team && /Pdf Test Heating/.test(m.title));
    assert.equal(team.attachments.length, 1, "the team gets the PDF too (Settings: Attach the PDF)");
    assert.ok(team.rows.some(([k, v]) => k === "Report" && /went to the owner/.test(v)));
    const row = S.rows().find((x) => x.token === data.token);
    assert.equal(row.report.pdf_ok, true);
    assert.equal(S.emailLog().find((m) => m.assessment_id === row.id && m.kind === "score").attachments, 1);
  } finally { S.pdf(false); }
});

/** Whether a Chromium is on this machine, whatever SCORECARD_PDF says. */
function pdfAvailableWithout() {
  const was = process.env.SCORECARD_PDF;
  delete process.env.SCORECARD_PDF;
  try { return pdfAvailable(); } finally { if (was !== undefined) process.env.SCORECARD_PDF = was; }
}

test("admin: sending needs who checked it", async () => {
  await S.login();
  const { data } = await submit();
  const id = S.rows().find((x) => x.token === data.token).id;
  const r = await S.api("/api/admin?action=send", { method: "POST", body: { id, checker: "" }, auth: true });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /who checked/);
});

test("admin: insights and the CSV export", async () => {
  await S.login();
  const r = await S.api("/api/admin?action=insights", { auth: true });
  assert.equal(r.status, 200);
  assert.ok(r.data.funnel.all.complete >= 1);
  assert.ok(r.data.profile.count >= 1);
  assert.equal(r.data.profile.tiers.length, 4);
  assert.ok(r.data.funnel.variants.some((v) => v.variant === "invisible"));
  assert.ok(r.data.funnel.all.steps.find((x) => x.id === "Q1").medianMs > 0, "each question's time");
  assert.ok(r.data.dims.device.some((d) => d.value === "mobile"));
  assert.ok(r.data.dims.region.some((d) => d.value === "US:TX" || d.value === "US:CA"));
  assert.ok(r.data.emails.some((e) => e.kind === "score" && e.sent >= 1));
  assert.ok(r.data.profile.geo.states.some((x) => x.key === "TX"));
  assert.ok(r.data.profile.timing.medianTotalMs > 0);
  assert.equal(r.data.profile.hourWeek.length, 7);
  assert.ok(r.data.profile.invisible.valueTotal >= 168000);
  assert.ok(Array.isArray(r.data.profile.hotLeads));
  const csv = await S.api("/api/admin?action=export", { raw: true, auth: true });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  const text = await csv.text();
  assert.match(text.split("\r\n")[0], /^created_at,status,first_name/);
  assert.match(text.split("\r\n")[0], /,source,.*,state_from_ip,.*,seconds_to_finish,/);
});

test("the daily digest needs Vercel's cron secret", async () => {
  assert.equal((await S.api("/api/cron")).status, 401);
  const before = S.emails().length;
  const r = await S.api("/api/cron", { headers: { authorization: "Bearer test-cron-secret" } });
  assert.equal(r.status, 200);
  assert.ok(r.data.waiting >= 1);
  assert.ok(S.emails().slice(before).some((m) => m.team && /reports are waiting for the top three/.test(m.title)));
});
