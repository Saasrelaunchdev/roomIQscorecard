# The spec

The First Deal Risk Scorecard's five documents, written from the go-to-market (`docs/gtm-brief.md`) and the strategy
(`docs/scorecard-strategy.md`). `content/*.mjs` holds the same words and rules; the tests pin the worked example and
the copy rules, so the spec, the content and the tests agree.

| Document | What it defines | Content | Pinned by |
|---|---|---|---|
| [1. Assessment logic](1-assessment-logic.md) | The questions, points and weights, branching, the five areas, tiers, the lease-up gap, urgency, the bottleneck, fit and routing, the worked example | `content/scorecard.mjs`, `lib/scoring.mjs` | `tests/unit/scoring.test.mjs` |
| [2. Landing and results pages](2-landing-and-results-pages.md) | Every word on the landing pages, the quiz, the results page, the walkthrough step, the deepener and the emails; the Loops follow-ups; the picture slots | `content/landing.mjs`, `content/results.mjs`, `content/emails.mjs`, `content/checks.mjs`, `content/site.mjs` | `tests/e2e/funnel.e2e.mjs`, the copy lint |
| [3. Report, dynamic content](3-report-dynamic-content.md) | The report's pages that change with the answers, the field dictionary | `content/report.mjs` | `tests/unit/report-model.test.mjs` |
| [4. Report, static playbook](4-report-static-playbook.md) | The 30-day plan: five guides, the timeline, the quick start, checklists, the tracker, the next step | `content/playbook.mjs` | the copy lint |
| [5. The method](5-method.md) | The Room-by-Room Underwrite: its steps, where each investor stands, two ways to run it, the first 30 days, the letter | `content/method.mjs` | `tests/unit/v2.test.mjs` |

To change a word, change it in the content file and in the spec together, then `node tools/build.mjs` and `npm test`.
