#!/usr/bin/env node
/**
 * sql/schema.sql in a throwaway local Postgres (the landing page's checkout/tests/check-sql.mjs pattern), next to the
 * landing page's own public.leads, the way it runs in the shared Supabase project:
 *   it upgrades a version 1 install, then runs again cleanly; scorecard_submit() stores, checks and rate-limits; the
 *   server's role reads and updates; the new columns take JSON; event counts, dimensions and step times add up; report
 *   views are counted; Resend's events move an email's status forward only; settings upsert; the reading view works; the
 *   website's roles (anon, authenticated) can read nothing and call nothing.
 *
 * Needs Postgres installed locally (initdb, pg_ctl, psql). Without it, prints SKIPPED and exits 0.
 *   node tests/sql/check-sql.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, chmodSync, copyFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SQL = fileURLToPath(new URL("../../sql/schema.sql", import.meta.url));
const SQL_V1 = fileURLToPath(new URL("./schema-v1.sql", import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, info = "") => { if (cond) { pass++; console.log(`ok   ${name}`); } else { fail++; console.log(`FAIL ${name}${info ? `: ${info}` : ""}`); } };
const skip = (why) => { console.log(`SKIPPED check-sql: ${why}`); process.exit(0); };
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const bin = (() => {
  const r = "/usr/lib/postgresql";
  if (existsSync(r)) for (const v of readdirSync(r).sort().reverse()) if (existsSync(join(r, v, "bin", "initdb"))) return join(r, v, "bin");
  try { const d = sh("pg_config", ["--bindir"]).trim(); if (existsSync(join(d, "initdb"))) return d; } catch { /* none */ }
  return null;
})();
if (!bin) skip("no local Postgres");
const root = process.getuid && process.getuid() === 0;
if (root) { try { sh("id", ["postgres"]); } catch { skip("running as root with no postgres user"); } }
const run = (args) => (root ? sh("runuser", ["-u", "postgres", "--", ...args]) : sh(args[0], args.slice(1)));

const port = await new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const dir = mkdtempSync(join(tmpdir(), "rempo-scorecard-sql-"));
chmodSync(dir, 0o777);
const data = join(dir, "data");
const file = (src, name) => { const f = join(dir, name); copyFileSync(src, f); chmodSync(f, 0o644); return f; };
const sqlFile = file(SQL, "schema.sql");
const v1File = file(SQL_V1, "schema-v1.sql");
// The rows a statement prints, without psql's command tags (SET, UPDATE 1, INSERT 0 6)
const psql = (sql, role) => run([join(bin, "psql"), "-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", role ? `set role ${role}; ${sql}` : sql])
  .split("\n").filter((l) => !/^(SET|UPDATE \d+|INSERT \d+ \d+|DELETE \d+)$/.test(l)).join("\n").trim();
const psqlFile = (f) => run([join(bin, "psql"), "-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-f", f]);
const fails = (sql, role, re) => { try { psql(sql, role); return false; } catch (e) { return re.test(String(e.stderr || e.message)); } };
const lit = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
const submit = (o) => JSON.parse(psql(`select public.scorecard_submit(${lit(o)})`, "service_role").split("\n").pop());
const row = (n, extra = {}) => ({ token: `tok${String(n).padStart(3, "0")}abcdefghijklmnopqrstuvwx`, email: `Owner${n}@Example.com`, first_name: "Sam", company: "Maple Street Heating", city: "Austin",
  answers: { trade: "hvac", jobs: "16to40" }, result: { score: 38, invisible: { unasked: 560, workValue: 168000 } }, score: 38, tier: "somedays", fit: "qualified", ip_hash: `ip-${n}`, ...extra });

try {
  run([join(bin, "initdb"), "-D", data, "-U", "postgres", "--auth=trust", "-E", "UTF8"]);
  run([join(bin, "pg_ctl"), "-D", data, "-l", join(dir, "server.log"), "-o", `-p ${port} -k ${dir} -c listen_addresses=''`, "-w", "start"]);
  // The roles a Supabase project has, and the landing page's table beside ours
  psql("create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;");
  psql("create table public.leads (id uuid primary key default gen_random_uuid(), email text); insert into public.leads (email) values ('landing@example.com');");
  // A version 1 install with a scorecard in it, then version 2 over it
  psqlFile(v1File);
  psql(`select public.scorecard_submit(${lit(row(900))})`, "service_role");
  psqlFile(sqlFile);
  let twice = true;
  try { psqlFile(sqlFile); } catch { twice = false; }
  ok("version 2 upgrades a version 1 install, and runs again cleanly", twice);
  ok("the version 1 scorecard is still there, with the new columns' defaults", psql("select report_views, pdf_downloads, timing is null from public.scorecard_assessments where token like 'tok900%'") === "0|0|t");
  ok("the landing page's table is untouched", psql("select count(*), min(email) from public.leads") === "1|landing@example.com");
  ok("scorecard_health() answers scorecard v2", psql("select public.scorecard_health()", "service_role").split("\n").pop() === "scorecard v2");

  const first = submit(row(1, { timing: { totalMs: 64000, steps: { G1: 3000 } }, geo: { country: "US", region: "TX", city: "Austin" }, device: { type: "mobile", inApp: "facebook" } }));
  ok("a scorecard is stored and returned, with its id, status new and the default form", Boolean(first.id) && first.status === "new" && first.form === "scorecard-roomiq-first-deal", JSON.stringify(first).slice(0, 200));
  ok("the email is lowercased", first.email === "owner1@example.com");
  ok("timing, location and device are kept as JSON", psql("select timing->>'totalMs', geo->>'region', device->>'inApp' from public.scorecard_assessments where token = 'tok001abcdefghijklmnopqrstuvwx'") === "64000|TX|facebook");
  ok("a missing token is refused", fails(`select public.scorecard_submit(${lit({ ...row(2), token: "short" })})`, "service_role", /token is required/));
  ok("a missing email is refused", fails(`select public.scorecard_submit(${lit({ ...row(3), email: "" })})`, "service_role", /valid email/));

  let five = true;
  for (let i = 0; i < 5; i++) { try { submit(row(10 + i, { email: "Busy@example.com" })); } catch { five = false; } }
  ok("five scorecards from one email in an hour are stored", five);
  ok("the sixth from that email in the same hour is refused (rate limit)", fails(`select public.scorecard_submit(${lit(row(20, { email: "busy@example.com" }))})`, "service_role", /Too many submissions/));

  psql("update public.scorecard_assessments set status = 'booked', booking = '{\"day\":\"2026-11-24\"}' where token = 'tok001abcdefghijklmnopqrstuvwx'", "service_role");
  ok("the server updates a scorecard; updated_at follows", psql("select status, booking->>'day', updated_at > created_at from public.scorecard_assessments where token = 'tok001abcdefghijklmnopqrstuvwx'", "service_role") === "booked|2026-11-24|t");
  ok("a status outside the list is refused", fails("update public.scorecard_assessments set status = 'maybe' where token = 'tok001abcdefghijklmnopqrstuvwx'", "service_role", /scorecard_status_check/));

  psql(`insert into public.scorecard_events (visit, variant, name, step, data, country, region, device, inapp, source) values
    ('v1','scoreapp','view','','{}','US','TX','mobile','facebook','facebook'),('v1','scoreapp','view','','{}','US','TX','mobile','facebook','facebook'),
    ('v2','scoreapp','view','','{}','US','CA','desktop',null,'google'),('v1','scoreapp','start','','{}','US','TX','mobile','facebook','facebook'),
    ('v1','scoreapp','step','G1','{"ms":3000}','US','TX','mobile','facebook','facebook'),('v2','scoreapp','step','G1','{"ms":5000}','US','CA','desktop',null,'google'),
    ('v3','invisible','step','G1','{"ms":10000}','US','TX','mobile',null,null),('v3','invisible','view','','{}',null,null,null,null,null)`, "service_role");
  const counts = psql("select variant || ':' || name || ':' || step || '=' || visits from public.scorecard_event_counts(null, null) order by 1", "service_role").split("\n");
  ok("event counts are distinct visits per variant, event and step", counts.includes("scoreapp:view:=2") && counts.includes("invisible:view:=1") && counts.includes("scoreapp:step:G1=2"), counts.join(" "));
  ok("event counts respect the period", psql("select count(*) from public.scorecard_event_counts(now() + interval '1 day', null)", "service_role") === "0");
  const dims = psql("select dim || '|' || value || '|' || name || '=' || visits from public.scorecard_event_dims(null, null) order by 1", "service_role").split("\n");
  ok("dimensions: views by device, state, source and in-app browser", dims.includes("device|mobile|view=1") && dims.includes("region|US:TX|view=1") && dims.includes("region|US:CA|view=1") &&
    dims.includes("source|google|view=1") && dims.includes("inapp|facebook|view=1") && dims.includes("region|:|view=1"), dims.join(" "));
  ok("step times: the median and the slowest quarter per question", psql("select step || ':' || n || ':' || median_ms || ':' || p75_ms from public.scorecard_step_times(null, null)", "service_role") === "G1:3:5000:7500");

  psql(`select public.scorecard_report_viewed('${first.id}', 'view'); select public.scorecard_report_viewed('${first.id}', 'view'); select public.scorecard_report_viewed('${first.id}', 'pdf');`, "service_role");
  ok("report views and PDF downloads are counted, and logged as events", psql(`select report_views, pdf_downloads, report_viewed_at is not null from public.scorecard_assessments where id = '${first.id}'`) === "2|1|t" &&
    psql(`select count(*) from public.scorecard_events where assessment = '${first.id}' and name in ('report_view','pdf_download')`) === "3");

  psql(`insert into public.scorecard_emails (assessment_id, kind, to_email, subject, provider_id, attachments) values ('${first.id}', 'score', 'owner1@example.com', 'Your Visibility Score: 38/100', 're_1', 1)`, "service_role");
  const ev = (type) => psql(`select public.scorecard_email_event('re_1', '${type}', now(), '{}'::jsonb)`, "service_role");
  ok("Resend's events: delivered then opened move the status forward", ev("email.delivered") === "t" && ev("email.opened") === "t" && psql("select status, delivered_at is not null, opened_at is not null, jsonb_array_length(events) from public.scorecard_emails where provider_id = 're_1'") === "opened|t|t|2");
  ok("a late 'delivered' never moves an opened email back", ev("email.delivered") === "t" && psql("select status from public.scorecard_emails where provider_id = 're_1'") === "opened");
  ok("an unknown email or event type changes nothing", psql("select public.scorecard_email_event('re_unknown', 'email.opened', now(), '{}'::jsonb)", "service_role") === "f" && ev("email.sent") === "f");
  ok("an email row follows its scorecard's deletion (set null), never blocks it", psql(`select confdeltype from pg_constraint where conrelid = 'public.scorecard_emails'::regclass and contype = 'f'`) === "n");
  // A spam complaint about the owner's email unsubscribes the lead; one about a team notice does not
  psql(`insert into public.scorecard_emails (assessment_id, kind, to_email, subject, provider_id) values ('${first.id}', 'team-lead', 'team@example.com', 'New scorecard', 're_team')`, "service_role");
  ok("a complaint about a team notice leaves the lead subscribed", psql("select public.scorecard_email_event('re_team', 'email.complained', now(), '{}'::jsonb)", "service_role") === "t" &&
    psql(`select unsubscribed_at is null from public.scorecard_assessments where id = '${first.id}'`) === "t");
  ok("a spam complaint about the owner's email unsubscribes the lead", ev("email.complained") === "t" &&
    psql(`select unsubscribed_at is not null from public.scorecard_assessments where id = '${first.id}'`) === "t" && psql("select status from public.scorecard_emails where provider_id = 're_1'") === "complained");

  psql(`insert into public.scorecard_settings (key, value) values ('report', '{"signer":"Ali"}') on conflict (key) do update set value = excluded.value`, "service_role");
  psql(`insert into public.scorecard_settings (key, value) values ('report', '{"signer":"Dana"}') on conflict (key) do update set value = excluded.value`, "service_role");
  ok("settings upsert by key", psql("select value->>'signer' from public.scorecard_settings where key = 'report'") === "Dana");

  ok("the reading view flattens a scorecard", psql("select business, state_from_ip, device, unasked_customers_a_year, invisible_work_dollars, seconds_to_finish from roomiq_first_deal_reports.scorecard_leads where email = 'owner1@example.com'") === "Maple Street Heating|TX|mobile|560|168000|64");

  for (const [role, sql, what] of [["anon", "select count(*) from public.scorecard_assessments", "the scorecards"], ["authenticated", "select count(*) from public.scorecard_events", "the events"],
    ["anon", "select count(*) from public.scorecard_emails", "the emails"], ["anon", "select count(*) from public.scorecard_settings", "the settings"],
    ["anon", "select count(*) from roomiq_first_deal_reports.scorecard_leads", "the reading view"]]) {
    ok(`${role} cannot read ${what}`, fails(sql, role, /permission denied/));
  }
  for (const fn of [`public.scorecard_submit(${lit(row(30))})`, "public.scorecard_event_dims(null, null)", "public.scorecard_step_times(null, null)", `public.scorecard_report_viewed('${first.id}', 'view')`, "public.scorecard_email_event('re_1', 'email.clicked', now(), '{}'::jsonb)"]) {
    ok(`anon cannot call ${fn.split("(")[0]}()`, fails(`select ${fn}`, "anon", /permission denied/));
  }
} catch (e) {
  fail++;
  console.log(`FAIL setup: ${String(e.stderr || e.message).slice(0, 800)}`);
} finally {
  try { run([join(bin, "pg_ctl"), "-D", data, "-m", "immediate", "stop"]); } catch { /* already down */ }
  rmSync(dir, { recursive: true, force: true });
}
console.log(`check-sql: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
