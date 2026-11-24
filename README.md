# The Invisible Work Scorecard

Rempo's self-assessment funnel for HVAC and plumbing shop owners, built on ScoreApp's structure: a landing page, ten
quick questions, a score on screen right away, the PDF report by email a minute later (with the Visible Work Method:
where the shop stands, how to close the gaps, and how Rempo runs it), a person's update with the top three within one
business day, and a 15-minute call as the next step. It is its own project (this repository, its own Vercel project) and shares the
landing page's brand, copy rules, consent wording and lead-handling patterns.

The spec is the founder's four deliverables, kept in [`docs/spec/`](docs/spec/):

| Deliverable | What it defines | Where it lives in the code |
|---|---|---|
| 1. [Assessment logic](docs/spec/1-assessment-logic.md) | 16 questions, points and weights, branching, the four areas, tiers, the invisible work math, urgency, the bottleneck algorithm, fit and routing | `content/scorecard.mjs`, `lib/scoring.mjs` |
| 2. [Landing and results pages](docs/spec/2-landing-and-results-pages.md) | Every word on the two landing versions, the results page and its variants, the CTA cards, the score email | `content/landing.mjs`, `content/results.mjs`, `content/emails.mjs` |
| 3. [PDF report, dynamic content](docs/spec/3-report-dynamic-content.md) | Cover, overview, invisible work, top three, overall score, strongest and weakest areas, the field dictionary | `content/report.mjs`, `lib/report-model.mjs`, `lib/report-html.mjs` |
| 4. [PDF report, static playbook](docs/spec/4-report-static-playbook.md) | Four mastery plans, the 30-day timeline, quick start, checklists, tracker, the final call to action | `content/playbook.mjs`, `lib/report-html.mjs` |

The owner's second request (storage in Supabase, emails through Resend with the PDF, an admin with analytics, a report
built around Rempo's method) added `content/method.mjs` (the report's Rempo pages), `api/resend-webhook.mjs`, and the
analytics in `lib/insights.mjs` and `src/js/admin.js`.

How each part of ScoreApp maps to this build, with the research behind it: [`docs/SCOREAPP-STRUCTURE.md`](docs/SCOREAPP-STRUCTURE.md).
The team's daily routine: [`docs/OPERATIONS.md`](docs/OPERATIONS.md). Choices the founder should confirm:
[`docs/DECISIONS.md`](docs/DECISIONS.md).

## The funnel

```
Landing page (/ is the ScoreApp template; /invisible is the Meta ads variant with the quiz in the hero)
  └─▶ 10 steps, about a minute: trade, jobs a week, 4 scored questions, ticket, where jobs are recorded,
      business and town, first name and email (contact is always last)
        └─▶ POST /api/scorecard (scored again on the server), stored with the seconds each question took, the
            approximate location (Vercel's IP headers) and the device; answered at once with the score
              └─ right after the answer (waitUntil): the PDF report is printed (about 29 Letter pages) and kept
                 ├─ the owner's email: the score, the invisible work line, fix first, one quick win, the PDF attached
                 ├─ the team's notice (email with the PDF, Slack), GoHighLevel tagged, webhooks fired
                 └─ Meta told about a Lead only when the answers qualify (5+ jobs a week, jobs in software)
        └─▶ /results/<token>: Visibility Score and tier, the invisible work panel, four area cards, then "Your report"
            (open it, download the PDF), "Last step: pick a time", "Sharpen your report", "See how we'd run it"
              ├─ the call: next 5 weekdays, a time window, phone and consent ─▶ the call email
              └─ the deepener (/sharpen/<token>): 8 optional questions ─▶ the sharper report, emailed with its PDF
        └─▶ within one business day the team reads the public Google profile and the top three (admin), approves
              └─▶ the update email, with the new PDF: the report now with the top three
        └─▶ Resend's webhook (/api/resend-webhook): each email delivered, opened, clicked, bounced, in the admin
```

## Pages and endpoints

| Address | What it is |
|---|---|
| `/` | Version B, the ScoreApp template: hero, four areas, how it works, the report, FAQ, footer banner. Every button opens the quiz |
| `/invisible` | Version A, the Meta ads variant: the quiz in the hero card, the free report's three points, the final call |
| `/start` | The quiz alone (ScoreApp's "skip the landing page"), for links from rempo.io and the nurture emails |
| `/results/<token>` | The result: on screen right after the quiz, and again from the score email |
| `/sharpen/<token>` | The deepener: the eight optional questions (fewer when branching hides some) |
| `/report/<token>`, `/report/<token>/pdf` | The report the owner was sent, as a page and as a PDF (each view counted). `?live=1` gives a signed-in admin the live preview |
| `/unsubscribe/<token>` | One-click unsubscribe (also in each email's `List-Unsubscribe` header) |
| `/admin` | The team's panel: Leads (every scorecard, one lead's page), Insights (the analytics), Settings (the report, the team's notices, a test email, setup) |
| `/api/scorecard` | `POST` submit, deepener, book, unsubscribe; `GET ?token=` a result; `GET` the health report |
| `/api/track` | The pages' own analytics (first party, no cookies, nothing personal) |
| `/api/admin` | The admin's API (password session) |
| `/api/cron` | The weekday digest of reports waiting for the top three (Vercel cron, `CRON_SECRET`) |
| `/api/resend-webhook` | Resend's events for each email (signed, `RESEND_WEBHOOK_SECRET`); `GET` says whether it is set up |

## Run it locally

```bash
npm install
```

```bash
node tools/build.mjs
```

```bash
node tools/dev.mjs
```

Open http://localhost:8787 (the admin is http://localhost:8787/admin, password `local-admin-password` unless
`ADMIN_PASSWORD` is set). Scorecards are kept in `.local/store/`, and every email and team notice is written to
`.local/outbox/` as a JSON file instead of being sent. Rebuild after changing content, styles or the page script.

To see the report without a database:

```bash
node tools/render-sample.mjs
```

It writes `.local/sample-report.html` and `.local/sample-report.pdf` from the spec's worked example.

## Deploy

1. **Supabase.** Use the landing page's project (recommended: one place for every lead, nothing to pay twice). SQL
   Editor, New query, paste all of [`sql/schema.sql`](sql/schema.sql), Run. It is safe to run again (the second
   version upgrades the first in place), every name in it starts with `scorecard_`, and it leaves the landing page's
   `public.leads`, `public.purchases` and `rempo_reports.meta_leads` alone. Then Project Settings, API Keys, create a
   secret key named "scorecard" and use it for `SUPABASE_SECRET_KEY` below, so it can be revoked on its own. Nobody
   needs to open Supabase after that: the admin shows everything. (A spreadsheet-like view for the curious:
   `rempo_reports.scorecard_leads`.)
2. **Vercel.** New project from this repository. Framework preset "Other"; `vercel.json` sets the build
   (`node tools/build.mjs`), the output folder (`public/`), the functions, rewrites, headers and the cron. Node 22.
3. **Settings** (Vercel, Settings, Environment Variables), the table below. Then redeploy.
4. **Resend.** The domain is verified already. Pick the sender (`SCORECARD_EMAIL_FROM`, for example
   `Rempo <team@rempo.io>`). Then Webhooks, Add endpoint: `https://<your-domain>/api/resend-webhook`, events
   `email.delivered`, `email.delivery_delayed`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`;
   copy its signing secret into `RESEND_WEBHOOK_SECRET`. For opens and clicks, turn on open and click tracking for the
   domain (Domains, your domain, Configuration).
5. **Check** `https://<your-domain>/api/scorecard`: it says which settings this deployment sees (names and true or
   false, never a value) and whether the database answers. Then sign in to `/admin`, open Settings, and send yourself
   the test email (the sample report with its PDF).
6. **Domain.** Point a domain (for example `scorecard.rempo.io`) at the project, then set `url` in
   `content/site.mjs` to it, build and commit, so canonical links and emails use it.

The built site is committed (`public/`, `lib/generated/`), and Vercel builds it again with the same result:
`npm test` fails if the committed build differs from its sources.

## Settings

| Variable | Needed for | Notes |
|---|---|---|
| `SUPABASE_URL` | Storage | The project URL, `https://<ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Storage | The secret key (`sb_secret_...`, or the legacy `service_role`). Server only; a publishable key is refused |
| `ADMIN_PASSWORD` | The admin | 12 characters or more. Changing it signs everyone out. `ADMIN_SESSION_SECRET` optional |
| `RESEND_API_KEY` | Every email | A Resend key with sending access |
| `SCORECARD_EMAIL_FROM` | Emails to owners | On a domain verified in Resend, for example `Rempo <team@rempo.io>`. `SCORECARD_REPLY_TO` optional |
| `LEAD_NOTIFY_FROM`, `LEAD_NOTIFY_TO` | The team's email notices | The landing page's names, so one setup serves both. The admin's Settings can name other recipients |
| `RESEND_WEBHOOK_SECRET` | Delivered, opened, clicked | The signing secret of the Resend webhook (`whsec_...`) |
| `SLACK_WEBHOOK_URL` | The team's Slack notices | Optional |
| `CRON_SECRET` | The weekday digest | Any long random string; Vercel sends it to `/api/cron` |
| `LEAD_HASH_SALT` | Rate limits | Optional; salts the hashed IP |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | Meta Conversions API | Optional. `META_TEST_EVENT_CODE`, `META_GRAPH_VERSION` optional. Also set `metaPixelId` in `content/site.mjs` for the browser pixel |
| `GHL_TOKEN`, `GHL_LOCATION_ID` | GoHighLevel | Optional. `GHL_SCORECARD_TAG` (default `scorecard-roomiq-first-deal`), `GHL_SCORECARD_FIELDS` (JSON: `score`, `tier`, `bottleneck`, `results_url`, `report_url`, `deepener_url`, `unasked`, `work_value`, `booking` to custom field ids) |
| `SCORECARD_WEBHOOK_URLS`, `SCORECARD_WEBHOOK_SECRET` | Webhooks | Optional. Comma-separated https URLs; each POST is signed (below) |
| `LEADS_MIRROR` | The shared leads table | Optional. `1` also stores each scorecard in the landing page's `public.leads` through `submit_lead()` (needs `SUPABASE_ANON_KEY` or the secret key) |

Locally and in tests: `SCORECARD_STORE_DIR` (a folder instead of Supabase), `SCORECARD_OUTBOX_DIR` (emails to files,
attachments beside them), `CHROMIUM_PATH` (the Chromium that prints PDFs; Vercel bundles one through
`@sparticuz/chromium`), `SCORECARD_PDF=off` (no PDFs, as most unit tests run).

The report's delivery is a site setting, not a secret: `reportDelivery` in `content/site.mjs` ("instant", the default
since the owner's request; "checked" holds every report for the team, as the first version did). The pages, emails and
report link follow it after a build.

### What the scorecard keeps about each visitor

The answers; the seconds each question took, counted only while the page was on screen; the time before the first tap;
how often they went back or left the page mid-quiz; the country, state and city Vercel's IP headers suggest, and the time
zone (never coordinates, a postal code or the IP address itself: the IP is kept only hashed, for rate limits); phone,
tablet or computer, the system, the browser and the app whose browser it is (Facebook, Instagram); the screen size and
language; the source (the campaign, a Meta click, the referring site, or direct). All within what the landing page's
privacy policy states. The analytics events carry no answers and no contact details.

## The admin

- **Leads:** every scorecard, filtered by period, status and fit, searchable, sortable by date, score, invisible work,
  time and report views, with where each came from and on what. A lead's page: the result, every answer with its
  seconds, where, on what and how long, the report they have (emailed when, viewed how often), each email and whether
  it was delivered, opened or clicked, this lead's own report (a personal note, the sections), the public profile form,
  approve and send.
- **Insights:** the period at a glance (completed, visits, qualified, calls, median time, the invisible work found,
  reports opened, emails opened), completed scorecards day by day, the funnel question by question with the time each
  took, a map of the states, top cities, devices and in-app browsers with their completion rates, sources and
  campaigns, an hour by weekday heatmap in each owner's own time, scores and tiers, what to fix first, who takes it and
  who books (trade, jobs, ticket), every answer, email engagement, the leads to call first, the split test.
- **Settings:** the report's letter, who signs it and the sections every report carries; who on the team hears about
  leads and whether the PDF goes with it; a test email; what this deployment is set up for.

## The report

Built from the answers (and the public profile once the team reads it): the cover; a note before you read (the team's
letter, this lead's own note, the contents); the overview; your invisible work; next to the top three (with the
update); your overall score; your strongest and weakest areas; the Visible Work Method (the outcome a fully visible
shop works toward, the four steps in the order that fixes causes first, and where this shop stands on each step from
its own answers next to the method's standard and how Rempo runs it); two ways to run the method (yourself, or with
Rempo's team: the four things once, what is done every month, what we won't do); your first 30 days with Rempo; the
30-day plan (Deliverable 4); your next step. The words are in `content/report.mjs`, `content/method.mjs` and
`content/playbook.mjs`; the team's own words, from Settings or a lead's page, pass the same claim rules before they save.

### Webhooks

Events: `scorecard.completed`, `scorecard.deepened`, `scorecard.booked`, `report.sent`. Each is one POST with
`{ event, created, data }` (the contact, the business, the answers, the result, the links), and the headers
`x-rempo-event` and `x-rempo-signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>">` signed with
`SCORECARD_WEBHOOK_SECRET`. `verifySignature()` in `api/_lib/integrations.mjs` shows the check (five minutes of tolerance).

## Changing the words, the questions or the scoring

Everything a visitor reads is in `content/`; the scoring is `lib/scoring.mjs`, one file for the browser and the server.

- Change a label freely; never change an option key (`v`) that has data behind it. Q2, Q3, Q4, G2 and G4 keep the Meta
  page's keys, so the GTM gap score compares with earlier data.
- Every word passes the claim rules in `rules/copy-rules.json` (from the go-to-market build): no promised reviews or
  rankings, no price or terms, no "instant" or "automatic", every statistic with its source in the same sentence, no em
  or en dashes. `node tools/copy-lint.mjs` checks; the build stops on an error.
- Then `node tools/build.mjs`, `npm test`, commit (the built `public/` and `lib/generated/` too).

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run test:sql
```

- `npm test`: the scoring against the spec's worked examples, every branch, the invisible work cases, urgency, the
  bottleneck and its cascade, quick wins; the report model (reviews per 100 jobs, the star cushion, the busy-season
  read, the top-three reads); the API over HTTP (validation, scoring again on the server, emails, the call's rules,
  unsubscribe, analytics, the admin, approve and send with a real PDF, the report's access, the instant report and its
  emails, timing, location and device, settings and a lead's own report, the test email, Resend's signed webhook, the
  PDF attached to the owner's and the team's email); the second version's parts one by one (`v2.test.mjs`); the
  integrations with fetch stubbed (Meta only for qualified answers, GoHighLevel, signed webhooks, the Supabase REST
  calls); the claim rules over every word; the committed build matching its sources.
- `npm run test:e2e`: the funnel in Chromium on a phone (the first question in the first screen, the ten steps, the
  result, the report link, the call, the deepener, the timing the page measured, keyboard use), and the admin through
  to a sent update, the insights' tooltips and the settings.
- `npm run test:sql`: `sql/schema.sql` in a throwaway local Postgres: the first version upgraded in place, runs twice,
  rate limits, the analytics functions, report views, email events moving forward only, a spam complaint, the
  settings, the reading view, the public roles locked out.

## Project layout

```
content/          every word, the questions and scoring rules, the settings (edit here)
lib/              scoring, booking, report model and HTML, insights, icons, quiz markup, the source rule, the sample
                  (shared by browser and server)
lib/generated/    the report's embedded fonts and pictures (built; do not edit)
src/              styles, the page script, the admin script, fonts and illustrations
tools/            build, dev server, copy lint, sample report, share image, page templates
api/              the Vercel functions; api/_lib their helpers (store, emails, notices, integrations, PDF, auth, the
                  visitor's location, device and timing, settings, reports, work after the response)
public/           the built site Vercel serves (built; do not edit)
sql/schema.sql    the Supabase tables and functions
tests/            unit, end-to-end and SQL tests
docs/             the spec, the ScoreApp mapping, operations, decisions, image prompts
```
