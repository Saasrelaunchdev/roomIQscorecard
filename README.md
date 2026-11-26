# The First Deal Risk Scorecard

RoomIQ's self-assessment funnel for rent-by-the-room investors before or during their first deal: idea I1, First Deal
Risk, from Path 1 of the Roomiqscorecards proposal, picked by the client. Built with the Scorecard Funnel Creator on
ScoreApp's structure: a landing page, eleven quick questions, the Deal Readiness Score and the lease-up gap on screen
right away, the PDF report by email the moment they finish (with the Room-by-Room Underwrite and a 30-day plan), and two
next steps: a free forecast on their address, or a 20-minute walkthrough. It is its own project (this repository, its
own Vercel project) and shares the production landing page's brand, claim rules and consent wording.

**Status: built and tested, not deployed yet.** The steps to put it live are under [Deploy](#deploy).

The thinking behind it, in order:

| Document | What it holds |
|---|---|
| [`docs/gtm-brief.md`](docs/gtm-brief.md) | What the go-to-market says about the buyer, the offer, the claim rules and the channels, with sources |
| [`docs/scorecard-strategy.md`](docs/scorecard-strategy.md) | Why this scorecard fits this buyer: the areas, the lease-up gap, the tiers, the next steps |
| [`docs/spec/1-assessment-logic.md`](docs/spec/1-assessment-logic.md) | The questions, points and weights, branching, the five areas, tiers, the lease-up gap, urgency, the bottleneck, fit and routing, and the worked example to the digit |
| [`docs/spec/2-landing-and-results-pages.md`](docs/spec/2-landing-and-results-pages.md) | Every word on the landing pages, the quiz, the results page, the walkthrough step, the deepener and the emails, and the Loops follow-ups |
| [`docs/spec/3-report-dynamic-content.md`](docs/spec/3-report-dynamic-content.md) | The report's pages that change with the answers, and the field dictionary |
| [`docs/spec/4-report-static-playbook.md`](docs/spec/4-report-static-playbook.md) | The 30-day plan every report carries |
| [`docs/spec/5-method.md`](docs/spec/5-method.md) | RoomIQ as a method: the Room-by-Room Underwrite |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Choices made where the sources were silent, waiting for the owner's confirmation |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | The team's routine |
| [`docs/SCOREAPP-STRUCTURE.md`](docs/SCOREAPP-STRUCTURE.md) | How each part of ScoreApp maps to this build, with the research behind it |
| [`docs/scoreapp/first-deal-risk-scoreapp-brief.md`](docs/scoreapp/first-deal-risk-scoreapp-brief.md) | The same scorecard for ScoreApp: prompts for its AI builders, the steps to do by hand and every word, written from `content/` by `node tools/scoreapp-brief.mjs` |

## The funnel

```
Landing page (/ is the ScoreApp template; /first-deal puts the quiz in the hero, for the Meta ads; /start is the quiz alone)
  └─▶ 11 steps, about a minute: where they are (a tap), the market (typed, matched to the preset metros), 5 scored
      questions (rent, fill, supply, bath mix, a slow lease-up; taps), the monthly cost, the lease-up months and the
      reserves (sliders), first name and email (contact is always last)
        └─▶ POST /api/scorecard (scored again on the server), stored with the seconds each question took, the
            approximate location (Vercel's IP headers) and the device; answered at once with the score
              └─ right after the answer: the PDF report is printed (about 30 Letter pages) and kept
                 ├─ the investor's email: the score, the lease-up gap, fix first, one quick win, the PDF attached
                 ├─ the team's notice (email with the PDF, Slack), signed webhooks (the Loops follow-ups)
                 └─ Meta: ScorecardComplete for every completion (pixel and Conversions API, one event id), after consent
        └─▶ /results/<token>: the Deal Readiness Score and tier, the first six months (the lease-up gap and its strip),
            five area cards, three checks RoomIQ can't do, then the next steps in the tier's order: the report, the
            free forecast (a covered market) or the market lookup, sharpen the report, the walkthrough, how RoomIQ works
              ├─ the walkthrough: the next 5 business days, three windows, a phone with its consent, the address
              │  optional ─▶ the confirmation email; Meta told Schedule for a qualified booking
              └─ the deepener (/sharpen/<token>): 10 scored and 2 checklist questions ─▶ the sharper report, with its PDF
        └─▶ Resend's webhook (/api/resend-webhook): each email delivered, opened, clicked or bounced, in the admin
```

## Pages and endpoints

| Address | What it is |
|---|---|
| `/` | Version B, the ScoreApp template: hero, introduction, how it works, the five areas, the report, FAQ, final call. Every button opens the quiz |
| `/first-deal` | Version A, for the Meta ads: the quiz's first question in the hero, the free report's three points, the final call |
| `/start` | The quiz alone (ScoreApp's "skip the landing page"): the landing page's and the Meta page's score buttons point here |
| `/results/<token>` | The result: on screen right after the quiz, and again from the score email |
| `/sharpen/<token>` | The deepener: up to 12 optional questions (10 when the visitor has no rent yet) |
| `/report/<token>`, `/report/<token>/pdf` | The report the investor was sent, as a page and as a PDF (each view counted). `?live=1` gives a signed-in admin the live preview |
| `/unsubscribe/<token>` | One-click unsubscribe (also in each email's `List-Unsubscribe` header) |
| `/admin` | The team's panel: Leads (every scorecard, one lead's page), Insights (the analytics), Settings (the report, the team's notices, a test email, setup) |
| `/api/scorecard` | `POST` submit, deepener, book, unsubscribe; `GET ?token=` a result; `GET` the health report |
| `/api/track` | The pages' own analytics (first party, no cookies, nothing personal) |
| `/api/admin` | The admin's API (password session) |
| `/api/cron` | The weekday digest of reports waiting on the team. With instant delivery and no outside data nothing waits, so it answers and sends nothing |
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

It writes `.local/sample-report.html` and `.local/sample-report.pdf` from the spec's worked example (Jordan, a made-up
investor looking at houses in Atlanta).

## Deploy

Vercel's production branch is `main`: production is whatever `main` holds. Never promote a branch's preview to
production.

1. **Supabase.** Use the project RoomIQ's landing page forms will use, or a new one. SQL Editor, New query, paste all of
   [`sql/schema.sql`](sql/schema.sql), Run. It is safe to run again, every table in it starts with `scorecard_`, and
   the readable view lives in the private schema `roomiq_first_deal_reports`. Then Project Settings, API Keys, create
   a secret key named "scorecard" and use it for `SUPABASE_SECRET_KEY` below, so it can be revoked on its own.
2. **Vercel.** New project from `Saasrelaunchdev/roomIQscorecard`. Framework preset "Other"; `vercel.json` sets the
   build (`node tools/build.mjs`), the output folder (`public/`), the functions (with the bundled Chromium for PDFs),
   rewrites, headers and the cron. Node 22. Settings, Git: production branch `main`.
3. **Settings** (Vercel, Settings, Environment Variables): the table below. Then redeploy.
4. **Resend.** Verify the sending domain, then pick the sender (`SCORECARD_EMAIL_FROM`, for example
   `RoomIQ <team@your-domain>`). Webhooks, Add endpoint: `https://<your-domain>/api/resend-webhook`, events
   `email.delivered`, `email.delivery_delayed`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`;
   copy its signing secret into `RESEND_WEBHOOK_SECRET`. For opens and clicks, turn on open and click tracking for the
   domain (Domains, your domain, Configuration).
5. **Domain.** Point a subdomain (for example `score.roomiq.io`) at the project, then set `url` in `content/site.mjs`
   to it, build and commit, so canonical links, the share image and the emails use it.
6. **Check** `https://<your-domain>/api/scorecard`: it says which settings this deployment sees (names and true or
   false, never a value) and whether the database answers. Sign in to `/admin`, open Settings, and send yourself the
   test email (the sample report with its PDF). Then take the scorecard on a phone.
7. **Link it.** Set `scorecardUrl` to `https://<your-domain>/start` in the landing page's `SITE` data
   (`Saasrelaunchdev/RoomIQproductionlandingpage`) and in the Meta page's: their score buttons then open the quiz,
   with the campaign parameters carried.
8. **Meta** (when the ads run). Set `metaPixelId` in `content/site.mjs` and `META_PIXEL_ID`, `META_CAPI_TOKEN` in
   Vercel. Events Manager's test events should show ScorecardStart when the quiz opens, ScorecardComplete once per
   completion (browser and server, deduplicated), Schedule only for a qualified booking, and nothing after Decline.
9. **Loops** (the day 2, 5 and 8 emails). Point `SCORECARD_WEBHOOK_URLS` at the automation that feeds Loops, and build
   the three emails from spec 2, section 10.

The built site is committed (`public/`, `lib/generated/`), and Vercel builds it again with the same result:
`npm test` fails if the committed build differs from its sources.

## Settings

| Variable | Needed for | Notes |
|---|---|---|
| `SUPABASE_URL` | Storage | The project URL, `https://<ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Storage | The secret key (`sb_secret_...`, or the legacy `service_role`). Server only; a publishable key is refused |
| `ADMIN_PASSWORD` | The admin | 12 characters or more. Changing it signs everyone out. `ADMIN_SESSION_SECRET` optional |
| `RESEND_API_KEY` | Every email | A Resend key with sending access |
| `SCORECARD_EMAIL_FROM` | Emails to investors | On a domain verified in Resend. `SCORECARD_REPLY_TO` optional |
| `LEAD_NOTIFY_FROM`, `LEAD_NOTIFY_TO` | The team's email notices | The admin's Settings can name other recipients |
| `RESEND_WEBHOOK_SECRET` | Delivered, opened, clicked | The signing secret of the Resend webhook (`whsec_...`) |
| `CRON_SECRET` | The weekday digest | Any long random string; Vercel sends it to `/api/cron` |
| `SLACK_WEBHOOK_URL` | The team's Slack notices | Optional |
| `LEAD_HASH_SALT` | Rate limits | Optional; salts the hashed IP |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | Meta Conversions API | Optional until the ads run. `META_TEST_EVENT_CODE`, `META_GRAPH_VERSION` optional. Also set `metaPixelId` in `content/site.mjs` for the browser pixel |
| `SCORECARD_WEBHOOK_URLS`, `SCORECARD_WEBHOOK_SECRET` | Webhooks (the Loops follow-ups) | Comma-separated https URLs; each POST is signed (below) |
| `GHL_TOKEN`, `GHL_LOCATION_ID` | GoHighLevel | Optional, not in RoomIQ's plan. `GHL_SCORECARD_TAG`, `GHL_SCORECARD_FIELDS` as the template documents |
| `LEADS_MIRROR` | A shared leads table | Optional. `1` also stores each scorecard through a `submit_lead()` function in the same Supabase project, if one exists |

Locally and in tests: `SCORECARD_STORE_DIR` (a folder instead of Supabase), `SCORECARD_OUTBOX_DIR` (emails to files,
attachments beside them), `CHROMIUM_PATH` (the Chromium that prints PDFs; Vercel bundles one through
`@sparticuz/chromium`), `SCORECARD_PDF=off` (no PDFs, as most unit tests run).

Site settings that are not secrets live in `content/site.mjs`: the URL, the legal pages, the postal address for
commercial email (`postalAddress`, not set yet), `reportDelivery` ("instant"), `enrichment` (off), the walkthrough's
days and windows (`booking`), the free forecast's link (`forecastUrl`), and the Meta event names (`metaEvents`).

### What the scorecard keeps about each visitor

The answers; the seconds each question took, counted only while the page was on screen; the time before the first tap;
how often they went back or left the page mid-quiz; the country, state and city Vercel's IP headers suggest, and the time
zone (never coordinates, a postal code or the IP address itself: the IP is kept only hashed, for rate limits); phone,
tablet or computer, the system, the browser and the app whose browser it is; the screen size and language; the source
(the campaign, a Meta click, the referring site, or direct). The market is a preset metro, never an address; the
walkthrough's address is optional and kept only with the booking. The analytics events carry no answers and no contact
details.

## The admin

- **Leads:** every scorecard, filtered by period, status and fit, searchable, sortable by date, score, lease-up gap,
  time and report views, with the market, where each came from and on what. A lead's page: the result, every answer
  with its seconds, where, on what and how long, the walkthrough if booked, the report they have (emailed when, viewed
  how often), each email and whether it was delivered, opened or clicked, and this lead's own report (a personal note,
  the sections, who checked it), with approve and send.
- **Insights:** the period at a glance (completed, visits, qualified, walkthroughs booked, median time, the lease-up
  gap found, reports opened, emails opened), completed scorecards day by day, the funnel question by question with the
  time each took, a map of the states, devices and in-app browsers, sources and campaigns, an hour by weekday heatmap
  in each investor's own time, scores and tiers, what to fix first, who takes it and who books (stage, market, monthly
  cost), every answer, email engagement, the leads to call first, the split test.
- **Settings:** the report's letter, who signs it and the sections every report carries; who on the team hears about
  leads and whether the PDF goes with it; a test email; what this deployment is set up for.

## The report

Built from the answers: the cover; a note before you read (the team's letter, this lead's own note, the contents); the
overview; your first six months (the lease-up gap, the strip, the math, the slower case); three checks RoomIQ can't do
for you (the city's rule on unrelated adults for the market, financing on room income, insurance); your overall score;
your strongest and weakest areas; the Room-by-Room Underwrite (five steps in causal order, and where the plan stands on
each from its own answers, next to the method's standard and what RoomIQ shows); two ways to run it (by hand, or with
RoomIQ); your first 30 days with RoomIQ; the 30-day plan (five guides, the timeline, the quick start, checklists, the
weekly tracker); your next step. The words are in `content/report.mjs`, `content/checks.mjs`, `content/method.mjs` and
`content/playbook.mjs`; the team's own words, from Settings or a lead's page, pass the same claim rules before they save.

### Webhooks

Events: `scorecard.completed`, `scorecard.deepened`, `scorecard.booked`, `report.sent`. Each is one POST with
`{ event, created, data }` (the contact, the deal's stage and market, the answers, the result with the weakest area's
name, the links), and the headers `x-scorecard-event` and
`x-scorecard-signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>">` signed with `SCORECARD_WEBHOOK_SECRET`.
`verifySignature()` in `api/_lib/integrations.mjs` shows the check (five minutes of tolerance).

## Changing the words, the questions or the scoring

Everything a visitor reads is in `content/`; the scoring is `lib/scoring.mjs`, one file for the browser and the server.

- Change a label freely; never change an option key (`v`) that has data behind it.
- Every word passes the claim rules in `rules/copy-rules.json` (from the go-to-market): no accuracy, income or return
  claims, no named platforms or competitors, no price or trial, nothing that reads as zoning, lending or investment
  advice, no em or en dashes. `node tools/copy-lint.mjs` checks; the build stops on an error.
- Then `node tools/build.mjs`, `npm test`, commit (the built `public/` and `lib/generated/` too).
- The covered markets (where the free forecast is offered) are `markets.covered` in `content/scorecard.mjs`.

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

- `npm test`: the scoring against spec 1's worked example to the digit, every branch, the lease-up gap's variants,
  urgency, the bottleneck and its cascades, quick wins and the checklist flag; the report model (the first six months,
  the checks, the slower case, the pages' variants); the API over HTTP (validation, scoring again on the server, the
  emails and their PDF, the walkthrough's rules, unsubscribe, analytics, the admin, approve and send, the report's
  access, timing, location and device, settings, Resend's signed webhook); the integrations with fetch stubbed (the
  Meta events, signed webhooks, the Supabase REST calls); the claim rules over every word; the committed build
  matching its sources.
- `npm run test:e2e`: the funnel in Chromium on a phone (the first question in the first screen, the eleven steps,
  the result, the report link, the walkthrough, the deepener, keyboard use), and the admin through to a sent update.
- `npm run test:sql`: `sql/schema.sql` in a throwaway local Postgres: runs twice, rate limits, the analytics
  functions, report views, email events moving forward only, a spam complaint, the settings, the reading view, the
  public roles locked out.

## Project layout

```
content/          every word, the questions and scoring rules, the settings (edit here)
lib/              scoring, booking, report model and HTML, insights, icons, quiz markup, the source rule, the sample
                  (shared by browser and server)
lib/generated/    the report's embedded fonts and pictures (built; do not edit)
src/              styles, the page script, the admin script, fonts and pictures
brand/            the design system taken from RoomIQ's landing page (brand.json, the logos, how to rebuild the tokens)
tools/            build, dev server, copy lint, sample report, share image, page templates
api/              the Vercel functions; api/_lib their helpers (store, emails, notices, integrations, PDF, auth, the
                  visitor's location, device and timing, settings, reports, work after the response)
public/           the built site Vercel serves (built; do not edit)
sql/schema.sql    the Supabase tables and functions
tests/            unit, end-to-end and SQL tests
docs/             the brief, the strategy, the spec, the ScoreApp mapping, operations, decisions
```
