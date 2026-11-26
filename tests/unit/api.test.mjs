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
  assert.equal(r.data.result.score, 35, "the browser's numbers are never trusted");
  assert.deepEqual(r.data.deepener.shown, ["rentperroom", "rentcomps", "occsource", "launch", "newsupply", "pricedrops", "roomcount", "sizemix", "dealmath", "stress", "zoning", "financing"]);
  assert.equal(r.data.result.covered, true);
  assert.equal(r.data.result.market, "atlanta");
  assert.equal(r.data.delivery, "instant");
  let row = S.rows().find((x) => x.token === r.data.token);
  assert.equal(row.score, 35);
  assert.equal(row.tier, "beginner");
  assert.equal(row.bottleneck, "fill");
  assert.equal(row.fit, "qualified");
  assert.equal(row.route, "free forecast");
  assert.equal(row.trade, "looking", "the segment: where they are with rent-by-the-room");
  assert.equal(row.city, "Atlanta", "the market of the deal stands in for a city");
  assert.equal(row.company, "");
  assert.equal(row.email, body.email.toLowerCase());
  assert.equal(row.tracking.utm_source, "facebook");
  assert.equal(row.tracking.source, "facebook");
  assert.equal(row.consent.consentEmail, true);
  assert.equal(row.result.invisible.unasked, 2);
  assert.equal(row.result.invisible.workValue, 4000);
  assert.match(row.ip_hash || "", /^[0-9a-f]{64}$|^$/);
  // After the answer: the report, its emails, the counters
  await S.settled();
  row = S.rows().find((x) => x.token === r.data.token);
  assert.ok(row.report.snapshot, "the report the owner was sent is kept");
  assert.ok(row.report.instant_at);
  assert.equal(row.report.pdf_ok, false, "no PDF in this test (SCORECARD_PDF=off): the email carries the link");
  const mail = S.emails().slice(before);
  const score = mail.find((m) => m.subject === "Your Deal Readiness Score: 35/100, and your report");
  assert.ok(score, "the score email, with the report");
  assert.equal(score.to, body.email.toLowerCase());
  assert.match(score.text, /your reserves run out 2 months before the rooms fill\. That's at least \$4,000 of costs with no cushion behind it\./);
  assert.match(score.text, /Fix first: Fill Speed\. An assumed vacancy rate isn't fill speed\./);
  assert.match(score.text, /Start this week: Swap the assumed vacancy rate for a count/);
  assert.match(score.text, /Your full report is online here: http:\/\/localhost:\d+\/report\//);
  assert.match(score.text, /the Room-by-Room Underwrite and a 30-day plan/);
  assert.match(score.text, /run a free forecast on it: https:\/\/roomiq\.io\/dashboard\?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-deal/);
  assert.match(score.text, /Answer 12 more quick questions here: http:\/\/localhost:\d+\/sharpen\//);
  assert.match(score.text, /Book a 20-minute walkthrough: http:\/\/localhost:\d+\/results\/[A-Za-z0-9_-]+#call/);
  assert.match(score.text, /Unsubscribe: http:\/\/localhost:\d+\/unsubscribe\//);
  assert.match(score.html, /<a href="http:\/\/localhost:\d+\/report\//);
  assert.deepEqual(score.attachments, []);
  const team = mail.find((m) => m.team && /New scorecard: Sam, Atlanta\. 35\/100, Beginner: underwriting on assumptions\./.test(m.title));
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
  assert.match(page, /The First Deal Risk Scorecard Report/);
  assert.match(page, /Your reserves run out 2 months early/);
  assert.match(page, /Three checks RoomIQ can&#39;t do for you/);
  assert.match(page, /Atlanta: no more than six people may live together unless all are related/);
  assert.match(page, /What an evidence-first underwrite looks like/);
  assert.doesNotMatch(page, /Coming within one business day/, "nothing waits on the team");
  assert.doesNotMatch(page, /Preview for the team/);
});

test("submit: the time each question took, the approximate location, the device", async () => {
  const timing = { totalMs: 64321.4, landingMs: 9000, backs: 1, aways: 2, steps: { G1: 9100, G2: 3200, Q1: 4100, X9: 5, S11: 99999999 } };
  const client = { vw: 390, vh: 664, sw: 390, sh: 844, dpr: 3, lang: "en-US", touch: 5 };
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92";
  const headers = { "user-agent": ua, "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "TX", "x-vercel-ip-city": "San%20Antonio", "x-vercel-ip-timezone": "America/Chicago" };
  const r = await S.api("/api/scorecard", { method: "POST", body: submission({ timing, client, utm_source: "", page: "https://scorecard.test/", referrer: "https://l.instagram.com/" }), headers });
  assert.equal(r.status, 200);
  const row = S.rows().find((x) => x.token === r.data.token);
  assert.deepEqual(row.timing, { totalMs: 64321, landingMs: 9000, backs: 1, aways: 2, steps: { G1: 9100, G2: 3200, Q1: 4100, S11: 3600000 } }, "known steps only, whole milliseconds, capped");
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
  const team = S.emails().reverse().find((m) => m.team && m.rows.some(([k, v]) => k === "Location" && v === "San Antonio, TX, US"));
  assert.ok(team.rows.some(([k, v]) => k === "Market" && v === "Atlanta"));
  assert.ok(team.rows.some(([k, v]) => k === "Location" && v === "San Antonio, TX, US"));
  assert.ok(team.rows.some(([k, v]) => k === "Device" && v === "Phone, iOS, in Instagram's browser"));
  assert.ok(team.rows.some(([k, v]) => k === "Time to finish" && v === "1 min 4 s"));
});

test("submit: what is refused, and the honeypot", async () => {
  const missing = submission();
  delete missing.answers.carry;
  let r = await S.api("/api/scorecard", { method: "POST", body: missing });
  assert.equal(r.status, 400);
  assert.deepEqual(r.data.missing, ["carry"]);
  r = await submit({ answers: { ...submission().answers, bathmix: "made-up" } });
  assert.equal(r.status, 400);
  r = await submit({ email: "not-an-email" });
  assert.equal(r.status, 400);
  r = await submit({ consentEmail: false });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /Consent/);
  r = await submit({ firstName: "" });
  assert.equal(r.status, 400);
  // No business or city field in this quiz: a missing company is no reason to refuse
  r = await submit({ company: "" });
  assert.equal(r.status, 200);
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
  assert.equal(r.data.result.score, 35);
  assert.equal(r.data.result.invisible.workValue, 4000);
  assert.equal(r.data.result.bottleneck.cascadeLine, "Your Room Mix score follows from your Fill Speed score: a bath mix is priced from what rooms rent for and how fast they fill, by bath type.");
  assert.equal(JSON.stringify(r.data).includes("@example.com"), false);
  assert.equal("answers" in r.data, false);
  assert.equal(r.data.reportReady, true);
  assert.equal(r.data.delivery, "instant");
  assert.equal((await S.api("/api/scorecard?token=doesnotexistdoesnotexist12")).status, 404);
  assert.equal((await S.api("/api/scorecard?token=bad")).status, 404);
});

test("the deepener: the report's scores follow it; a hidden question can't be answered", async () => {
  const { data } = await submit();
  let r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: data.token, answers: { rentperroom: "split" } } });
  assert.equal(r.status, 400);
  assert.ok(r.data.missing.includes("rentcomps"));
  await S.settled();
  const before = S.emails().length;
  const DEEP = { rentperroom: "split", rentcomps: "few", occsource: "rule", launch: "whenever", newsupply: "think", pricedrops: "unsure", roomcount: "max", sizemix: "assume", dealmath: "mine", stress: "vacancy", zoning: "notyet", financing: "wholehome" };
  r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: data.token, answers: DEEP,
    timing: { totalMs: 21000, steps: { D1: 2500, D2: 3000, Q1: 1 } } } });
  assert.equal(r.status, 200);
  assert.equal(r.data.n, 12);
  await S.settled();
  const sharper = S.emails().slice(before).find((m) => m.subject === "Your sharper report: 33/100");
  assert.ok(sharper, "the sharper report goes to the investor");
  assert.match(sharper.text, /Thanks for the 12 extra answers/);
  assert.match(sharper.text, /Fix first: Fill Speed\./);
  assert.match(sharper.text, /The updated report is online here: http:\/\/localhost:\d+\/report\//);
  assert.match(sharper.text, /Book a 20-minute walkthrough: http:\/\/localhost:\d+\/results\/[A-Za-z0-9_-]+#call/);
  const row = S.rows().find((x) => x.token === data.token);
  assert.deepEqual(row.deepener_timing, { totalMs: 21000, steps: { D1: 2500, D2: 3000 } });
  assert.equal(row.report.snapshot.deepened, true, "the investor's report now carries the extra answers");
  assert.equal(row.report_result.areas.mix.score, 13);
  assert.equal(row.report_result.score, 33);
  assert.equal(row.bottleneck, "fill");
  assert.equal(row.score, 35, "the on-screen score stays");
  const view = await S.api(`/api/scorecard?token=${data.token}`);
  assert.equal(view.data.deepener.done, true);
  // Q1 "I don't have one yet" hides D1 and D2
  const none = await submit({ answers: { ...submission().answers, rentsource: "none" } });
  assert.deepEqual(none.data.deepener.shown, ["occsource", "launch", "newsupply", "pricedrops", "roomcount", "sizemix", "dealmath", "stress", "zoning", "financing"]);
  r = await S.api("/api/scorecard", { method: "POST", body: { action: "deepener", token: none.data.token, answers: DEEP } });
  assert.equal(r.status, 200);
  assert.equal(r.data.n, 10);
});

test("the walkthrough: weekdays only, a US number and consent; the address optional; the booking email goes out", async () => {
  const { data } = await submit();
  const base = { action: "book", token: data.token, slotDay: nextWeekday(), slotWindow: "midday", phone: "(512) 555-0134", address: "  12 Example Lane, Atlanta  ", consentPhone: true, consentText: true };
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
  assert.equal(row.booking.address, "12 Example Lane, Atlanta");
  assert.equal(row.booking.consentText, false, "no texts: RoomIQ publishes no SMS terms");
  await S.settled();
  const call = S.emails().slice(before).find((m) => /^You're booked: /.test(m.subject || ""));
  assert.ok(call);
  assert.match(call.text, /You're booked for a 20-minute walkthrough on /);
  assert.match(call.text, /call \(512\) 555-0134 if the link doesn't work\./);
  const team = S.emails().slice(before).find((m) => m.team && /^Walkthrough booked: Sam, Atlanta\./.test(m.title));
  assert.ok(team.rows.some(([k, v]) => k === "Walkthrough address" && v === "12 Example Lane, Atlanta"));
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
  assert.match(html, /Would your first rent-by-the-room deal survive its first six months\?/);
  assert.equal((html.match(/class="gc-step"/g) || []).length, 11, "the eleven steps are in the page");
  const ads = await (await S.api("/first-deal", { raw: true })).text();
  assert.match(ads, /Will your first deal survive six months\?/);
  const start = await (await S.api("/start", { raw: true })).text();
  assert.equal((start.match(/class="gc-step"/g) || []).length, 11, "the quiz alone");
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

test("admin: the list, a lead, approve and send (the PDF attached), the report's access", { timeout: 180000 }, async () => {
  await S.login();
  const { data } = await submit({ firstName: "Robin", email: "robin@example.com", answers: { ...submission().answers, market: "phoenix", marketText: "Phoenix" },
    timing: { totalMs: 58000, landingMs: 12000, backs: 0, aways: 0, steps: { G1: 12000, G2: 2500, Q1: 3900 } } });
  await S.settled();
  const list = await S.api("/api/admin?action=list&q=Robin", { auth: true });
  assert.equal(list.status, 200);
  const item = list.data.rows.find((x) => x.first_name === "Robin");
  assert.ok(item);
  assert.equal(item.city, "Phoenix");
  assert.equal(item.seconds, 58);
  assert.equal(item.value, 4000);
  assert.equal(item.unasked, 2);
  assert.equal(item.source, "facebook");
  assert.equal(item.report_emailed, true);
  const lead = await S.api(`/api/admin?action=lead&id=${item.id}`, { auth: true });
  assert.equal(lead.status, 200);
  assert.equal(lead.data.report.result.score, 35);
  assert.equal(lead.data.labels.find((l) => l.id === "G1").a, "Looking at houses");
  assert.equal(lead.data.labels.find((l) => l.id === "G2").a, "Phoenix");
  assert.equal(lead.data.labels.find((l) => l.id === "Q1").seconds, 3.9);
  assert.equal(lead.data.visitor.total, "58 s");
  assert.ok(lead.data.emails.some((m) => m.kind === "score" && m.status === "sent"), "the lead's emails, from the log");
  assert.ok(lead.data.reportState.emailedAt);
  assert.equal(lead.data.row.report.snapshot, undefined, "the snapshot stays on the server");
  assert.equal(lead.data.options.effective.playbook, true);
  // The investor already has the report (instant delivery): their link shows it, never "on its way"
  S.clearCookie();
  let page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The First Deal Risk Scorecard Report/);
  assert.match(page, /Phoenix: no more than five people, who need not be related/);
  assert.doesNotMatch(page, /Your report is on its way/);
  await S.login();
  // The team's notes and who checked it
  let r = await S.api("/api/admin?action=save", { method: "POST", body: { id: item.id, checker: "Dana", notes: "Walkthrough on Tuesday." }, auth: true });
  assert.equal(r.status, 200);
  const row = S.rows().find((x) => x.id === item.id);
  assert.equal(row.report.checker, "Dana");
  assert.equal(row.report_result.gtmGapScore, null, "no outbound gap score in this funnel");
  // The team's live preview, signed in, next to what the investor has
  page = await (await S.api(`/report/${data.token}?live=1`, { raw: true, auth: true })).text();
  assert.match(page, /Live preview for the team/);
  assert.match(page, /Your First Six Months/);
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
  assert.ok(sent.report.snapshot && sent.report.snapshot.fields.first_name === "Robin");
  assert.equal(sent.report.snapshot.fields.market, "Phoenix");
  const mail = S.emails().slice(before).find((m) => m.subject === "Your report, updated");
  assert.ok(mail, "the update to the report the investor has");
  assert.match(mail.text, /Dana at RoomIQ has updated your First Deal Risk Scorecard report\./);
  if (printing) {
    assert.equal(mail.attachments.length, 1);
    assert.equal(mail.attachments[0].filename, `${scorecardFileName()}-Robin.pdf`);
    assert.equal(readFileSync(mail.attachments[0].file).subarray(0, 5).toString(), "%PDF-");
    assert.match(mail.text, /The updated report is attached as a PDF/);
  }
  // Now anyone with the link sees the checked report, from the snapshot, and each view is counted
  S.clearCookie();
  page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The First Deal Risk Scorecard Report/);
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
  assert.ok(counted.report_views >= 2, "the investor's views are counted");
  if (printing) assert.equal(counted.pdf_downloads, 1);
  // Reopen: in the instant delivery the investor keeps the report they were sent
  await S.login();
  r = await S.api("/api/admin?action=reopen", { method: "POST", body: { id: item.id }, auth: true });
  assert.equal(r.status, 200);
  S.clearCookie();
  page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /The First Deal Risk Scorecard Report/);
});

test("admin: a lead's own report: a note, and the sections it carries; the claim rules apply", async () => {
  await S.login();
  const { data } = await submit({ firstName: "Noah" });
  await S.settled();
  const id = S.rows().find((x) => x.token === data.token).id;
  let r = await S.api("/api/admin?action=options", { method: "POST", body: { id, note: "Good talking today.\n\nWe'd start with your fill watch.", sections: { playbook: false, method: true, bogus: true } }, auth: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.deepEqual(r.data.options, { note: "Good talking today.\n\nWe'd start with your fill watch.", sections: { method: true, playbook: false } });
  const page = await (await S.api(`/report/${data.token}?live=1`, { raw: true, auth: true })).text();
  assert.match(page, /For you, Noah/);
  assert.match(page, /We&#39;d start with your fill watch\./);
  assert.doesNotMatch(page, /Your Room-by-Room Underwrite Starts Here/, "no playbook in this lead's report");
  assert.match(page, /Where your plan stands on each step/);
  r = await S.api("/api/admin?action=options", { method: "POST", body: { id, note: "We guarantee a sold-out house in 30 days." }, auth: true });
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
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "report", value: { letter: "RoomIQ gives accurate forecasts and higher returns." } }, auth: true });
  assert.equal(r.status, 400);
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "notifications", value: { teamTo: "sales@example.com, not-an-email" } }, auth: true });
  assert.equal(r.status, 400);
  r = await S.api("/api/admin?action=settings", { method: "POST", body: { key: "notifications", value: { teamTo: "sales@example.com; owner@example.com", attachPdf: false } }, auth: true });
  assert.equal(r.status, 200);
  assert.equal(r.data.settings.notifications.teamTo, "sales@example.com, owner@example.com");
  // The next lead: the letter, signed; no RoomIQ "two ways" pages; the team's notice to the new addresses
  const { data } = await submit({ firstName: "Lee" });
  await S.settled();
  const page = await (await S.api(`/report/${data.token}`, { raw: true })).text();
  assert.match(page, /Hi Lee, thanks for taking the scorecard\./);
  assert.match(page, /Start with Fill Speed\./);
  assert.match(page, /Dana, Founder, RoomIQ/);
  assert.doesNotMatch(page, /Two ways to run the method/);
  const team = S.emails().reverse().find((m) => m.team && /New scorecard: Lee, Atlanta/.test(m.title));
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
  const mail = S.emails().slice(before).find((m) => /^Test: Your Deal Readiness Score/.test(m.subject || ""));
  assert.ok(mail);
  assert.equal(mail.to, "owner@example.com");
  assert.match(mail.text, /This is the sample report, for a made-up investor/);
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
    const { data } = await submit({ firstName: "Pat" });
    await S.settled();
    const mail = S.emails().slice(before);
    const score = mail.find((m) => m.subject === "Your Deal Readiness Score: 35/100, and your report");
    assert.equal(score.attachments.length, 1);
    assert.equal(score.attachments[0].filename, `${scorecardFileName()}-Pat.pdf`);
  assert.equal(scorecardFileName(), String(SC_NAME).replace(/^the\s+/i, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    assert.ok(score.attachments[0].bytes > 50000);
    assert.equal(readFileSync(score.attachments[0].file).subarray(0, 5).toString(), "%PDF-");
    assert.match(score.text, /Your full report is attached as a PDF, and it's online here: /);
    const team = mail.find((m) => m.team && /New scorecard: Pat, Atlanta/.test(m.title));
    assert.equal(team.attachments.length, 1, "the team gets the PDF too (Settings: Attach the PDF)");
    assert.ok(team.rows.some(([k, v]) => k === "Report" && /went to the investor/.test(v)));
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
  assert.equal(r.data.profile.tiers.length, 3);
  assert.ok(r.data.funnel.all.steps.find((x) => x.id === "Q1").medianMs > 0, "each question's time");
  assert.ok(r.data.dims.device.some((d) => d.value === "mobile"));
  assert.ok(r.data.dims.region.some((d) => d.value === "US:TX" || d.value === "US:CA"));
  assert.ok(r.data.emails.some((e) => e.kind === "score" && e.sent >= 1));
  assert.ok(r.data.profile.geo.states.some((x) => x.key === "TX"));
  assert.ok(r.data.profile.timing.medianTotalMs > 0);
  assert.equal(r.data.profile.hourWeek.length, 7);
  assert.ok(r.data.profile.invisible.valueTotal >= 4000);
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
  // Instant delivery with no outside data: every report went out with the score, so nothing waits and nothing is sent
  assert.equal(r.data.waiting, 0);
  assert.equal(r.data.skipped, "nothing waits on the team");
  assert.equal(S.emails().slice(before).filter((m) => m.team).length, 0);
});
