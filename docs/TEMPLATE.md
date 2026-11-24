# This project started from the scorecard funnel template

The Scorecard Funnel Creator skill copied this codebase from its template and then rewrote what belongs to this project.
Until it has, the template's worked example (Rempo's Invisible Work Scorecard) is what you see.

| Belongs to the project (the skill rewrites it) | Shared infrastructure (kept as it is) |
|---|---|
| `content/*.mjs`: every word, the questions, the scoring rules, the brand, the method | `api/`, `api/_lib/`: the functions, storage, emails, PDF, analytics, integrations |
| `docs/spec/`: the spec the content is built from | `lib/insights.mjs`, `lib/booking.mjs`, `lib/quiz-markup.mjs`, `lib/source.mjs`, `lib/delivery.mjs` |
| `lib/scoring.mjs`: the metric, the bottleneck, quick wins, fit and routing (where the spec differs) | `tools/`: build, dev server, copy lint, share image |
| `lib/report-model.mjs`, `lib/report-html.mjs`: the report's project-specific pages | `src/js/app.js`, `src/js/admin.js`: the quiz engine, the results page, the admin |
| `src/styles/tokens.css`, `src/assets/`: the brand | `src/styles/site.css`, `admin.css`, `report.css`: the components |
| `rules/copy-rules.json`: the go-to-market's claim rules | `sql/schema.sql`: the tables (prefix `scorecard_`) |
| `tests/unit/scoring.test.mjs`, `report-model.test.mjs`: the spec's worked examples | the rest of `tests/` |
| README.md, CLAUDE.md, `docs/OPERATIONS.md`, `docs/DECISIONS.md` | |

The skill's reference `06-template-architecture.md` maps every file, its contract and how to adapt it.

## What the template generalized from RempoScorecard

Exported from `Saasrelaunchdev/RempoScorecard` at `53f4a10` (2026-11-22), then made brand-agnostic:

- **The brand is data**: `content/brand.mjs` (name, slug, logo files, fonts, report pictures, the colors outside the
  stylesheet); fonts are `display.woff2` and `text.woff2`; tokens come from `brand/brand.json` (the skill's
  `brand-tokens.mjs`); no company name in code (titles, emails, the report, the admin, the cookie, analytics events,
  the calendar file and the consent key follow the brand).
- **Pictures are optional**: found by name; a missing one leaves its place out (the hero centers its words, cards drop
  their image), so a new brand builds before its art exists.
- **The scorecard is data where Rempo's was code**: the hero scene (`landing.scene`), the metric's labels and the
  segments (`scorecard.metric`, `scorecard.segments`), the urgency area and count, the cascade, the line variants,
  the segment key, the scorecard's own name in file names, the CRM source and ad events, the form id (the scaffold
  sets `scorecard-<slug>`), the reporting schema (`<slug>_reports`), statistic sources (`rules/copy-rules.json`
  sources), `vercel.json`'s rewrites (they follow the landing variants), the area count in headings.
- **Enrichment can be off** (`site.enrichment: false`): no profile form, no "update" promise, no enrichment page.
- **Neutral integrations**: webhook headers `x-scorecard-*`, user agent `Scorecard-Webhook/1`.
- **Replies' color** is violet (#6250D6): orange sat too close to Freshness's amber for the palette floor.

The metric's formula stays Rempo's in `lib/scoring.mjs` `invisibleOf` (marked PROJECT HOOK), with its copy in
`content/results.mjs` and `content/report.mjs`: the skill rewrites both per project.
