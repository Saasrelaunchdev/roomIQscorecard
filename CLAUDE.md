# Rules for working on this repository

The First Deal Risk Scorecard: RoomIQ's self-assessment funnel (landing pages, quiz, results, deepener, call step, PDF
report, emails, admin), built from the spec in `docs/spec/`. README.md explains how it works and how to run it. These
rules apply to every session and every task.

## Why these rules exist

When several sessions work on several branches and each branch's preview is promoted to production on its own, the
live site shows whichever branch was promoted last, and earlier work seems to vanish. One branch, merged every time,
makes that impossible.

## Rule 1. One branch: `main`

- `main` is the only source of truth and the only branch that deploys to production (Vercel's production branch).
- A session's own branch only carries work to `main`. It starts from the latest `main` and is merged back into `main`
  at the end of the same task. Work that is not on `main` is not done.
- Never promote or redeploy a branch's preview to production in Vercel, and never advise the owner to.

**Start of every session:** `git fetch origin main && git merge origin/main`, then list branches that hold work `main`
lacks: `git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | while read b; do n=$(git rev-list --count origin/main..$b); [ "$n" -gt 0 ] && echo "$b: $n"; done`.
Tell the owner about any such branch before new work.

**End of every task:** merge `origin/main` again, rebuild (`node tools/build.mjs`), run every check below, push the
branch, open a pull request into `main` and merge it with "Create a merge commit" (never squash or rebase). Then check
that `git rev-list --count origin/main..HEAD` prints `0`. If the owner says a task is a preview only, leave the pull
request open and say so plainly.

## Rule 2. No update undoes an earlier update unless the owner explicitly asks

- Each change the owner asked for stays until the owner explicitly asks to undo that specific change. A new task, a
  redesign, a merge or a cleanup is not permission to remove, revert or reword earlier work.
- Before changing a file, look at its history (`git log --oneline -10 -- <file>`) and at the decisions below.
- When merging, keep both sides; never resolve a conflict by taking one whole side of a source file. Never rebuild a
  generated file by hand: merge its sources, then build.
- Never force-push `main`, rewrite its history or reset it.
- The tests pin the spec: `tests/unit/scoring.test.mjs` (the spec's worked example, to the digit),
  `tests/unit/report-model.test.mjs` (the report's math and variants), the copy rules over every word. If one fails,
  an earlier decision has been undone: restore it. Change a pinned test only when the owner asks, in the same commit,
  naming the decision.

## Owner decisions (do not undo unless the owner explicitly asks)

| Date | Decision | Where |
|---|---|---|
| 2026-11-24 | The First Deal Risk Scorecard is RoomIQ's scorecard funnel, built from the go-to-market with the Scorecard Funnel Creator: the strategy in `docs/scorecard-strategy.md`, the spec in `docs/spec/` | `docs/`, `content/` |
| 2026-11-24 | The scorecard is idea I1, First Deal Risk, from Path 1 (a quiz) of the Roomiqscorecards proposal, for investors before or during their first rent-by-the-room deal, picked by the client | `docs/scorecard-strategy.md`, `content/` |
| 2026-11-24 | The funnel lives in Saasrelaunchdev/roomIQscorecard, its own repository, built with the Scorecard Funnel Creator as RoomIQ's own ScoreApp-style funnel | the repository |
| 2026-11-24 | Built and tested, stopped before deploy: the owner sets up Vercel, Supabase and Resend from README.md, "Deploy" | `README.md` |
| 2026-11-28 | The founder's revision: the scorecard says "coliving" instead of "rent-by-the-room" (and "co-living" is spelled "coliving") in every word of it: the landing pages, the quiz, the results, the checks, the report, the share image, the ScoreApp brief and the specs. What counts as the term is decision 26 in `docs/DECISIONS.md` | `content/`, `docs/spec/`, `src/assets/og.png`, `tests/unit/api.test.mjs`, `tests/unit/report-model.test.mjs` |
| 2026-11-26 | Question 2 (the market) is typed, not tapped: the words are matched by name to the seven preset metros (else another US market), with a "Not decided yet" chip. Questions 8 to 10 (monthly cost, lease-up months, reserves) are sliders over the same answers, each with a "Not sure" chip. Every answer keeps its key, so the scoring, the lease-up gap and the report read them as before | `content/scorecard.mjs` G2 to G5, `lib/scoring.mjs` (placeOf, cleanPlace), `lib/quiz-markup.mjs`, `src/js/app.js`, `tests/unit/market.test.mjs` |

Choices made where the spec was silent are in `docs/DECISIONS.md`, waiting for the owner's confirmation; once confirmed,
move them into this table.

## Generated files: rebuild them, never edit them by hand

| Output | Source | Build |
|---|---|---|
| `public/` (the site Vercel serves) | `content/`, `lib/`, `src/`, `tools/templates/` | `node tools/build.mjs` |
| `lib/generated/report-assets.mjs` (the report's embedded fonts and pictures) | `src/styles/report.css`, `content/brand.mjs`, `src/assets/` | `node tools/build.mjs` |
| `src/assets/og.png` (the share image) | `content/landing.mjs`, `content/brand.mjs`, the brand files | `node tools/make-og.mjs`, then build |
| `src/styles/tokens.css` (the colors) | `brand/brand.json` | the skill's `brand-tokens.mjs` (see `brand/README.md`) |
| `docs/scoreapp/first-deal-risk-scoreapp-brief.md` (the ScoreApp build brief) | `content/*.mjs`, `lib/scoring.mjs` | `node tools/scoreapp-brief.mjs` |

`npm test` fails when the committed build differs from its sources (`node tools/build.mjs --check`).

## Checks (all must pass before merging into `main`)

```bash
npm install
npm test             # scoring, report model, API, integrations, copy rules, build freshness
npm run test:e2e     # the funnel and the admin in Chromium
npm run test:sql     # sql/schema.sql in a local Postgres
```

## Other repositories

- `Saasrelaunchdev/roomIQGTMBuild` (the go-to-market: `GTM-BRIEF.md`, `deliverables/scorecard_spec.docx`, `deliverables/lead_magnet_spec.xlsx`)
- `Saasrelaunchdev/RoomIQproductionlandingpage` (the brand, and the page whose scorecard buttons link here once `site.scorecardUrl` is set)
- `Saasrelaunchdev/Roomiqscorecards` (the scorecard proposal: Path 1, idea I1, First Deal Risk)
- `Saasrelaunchdev/RoomIQGTMWalkthrough` (the walkthrough deck)

They are read-only references for work here. Never commit to them from work on this repository.
