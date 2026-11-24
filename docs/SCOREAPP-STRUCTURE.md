# How this scorecard follows ScoreApp

ScoreApp (Daniel Priestley's scorecard software) builds every scorecard from the same parts: a landing page, a set of
questions, a lead form, a results page with dynamic content, a results email with a PDF report, integrations, and
insights. This build has each part, written for one scorecard (the Invisible Work Scorecard) rather than a general
builder: the questions, scoring and words are data in `content/`, so changing them is an edit and a build, not code.

**How the research was done.** ScoreApp's site and help centre could not be opened directly from the build environment
(the network policy refused `www.scoreapp.com` and `support.scoreapp.com`), so the facts below come from web search
results that quote those pages. Each is listed with its source. Nothing here is from memory alone.

## The parts, side by side

| ScoreApp | What ScoreApp does | This build |
|---|---|---|
| **Landing page** | The first page a visitor sees; templates with a hook, a value proposition, credibility and a call to action. A landing page can be skipped [1][2] | Version B at `/` is the ScoreApp template from Deliverable 2 (hero, introduction, how it works, the four areas, the report, FAQ, footer banner). Version A at `/invisible` is the Meta ads variant. `/start` skips the landing page |
| **Questions** | Multiple choice, checkbox, sliders and scales feed scoring; open text does not. Questions can be left unscored. Weight comes from bigger points [3][4] | 16 single-select questions: 4 gateway (unscored: trade, jobs, ticket, where jobs are recorded), 4 scored in the hero at 3x, 8 scored in the deepener at 2x and 1x. Points 0 to 4 x weight (Deliverable 1, section 3) |
| **Categories** | Category scores as percentages, an overall score, tiers by percentage ranges; Low, Medium, High content per category [3][5] | Four areas at 25% each (Ask Coverage, Ask System, Freshness, Replies); the Visibility Score is their average; four tiers (0-29, 30-54, 55-74, 75-100); each area card has Low (0-39), Medium (40-69) and High (70-100) text |
| **Logic jumps** | Conditional questions route people down different paths and can drive results content [6] | Q1 "All 10" hides D1; Q2 "We don't really ask" hides D3 and D4; Q4 "Never" hides D8. A skipped question leaves both the score and the maximum |
| **Lead form** | Before or after the questions. ScoreApp's blog finds "before" converts more leads, "after" makes people more committed; it says to test both [7][8] | After, always: the Meta page's rule (contact details last, taps before typing) and Deliverable 1, step 10. The button reads "See my score" |
| **Results page** | One default results page, more optional; dynamic sections per score tier; merge tags such as first name and scores; an external redirect with merge tags [9][10][5] | `/results/<token>`: the thank-you line with the first name, the Visibility Score and tier, the invisible work panel (one of six variants), the fix-first line, four area cards (one of three variants each), the CTA cards in ScoreApp's order (pick a time, sharpen, see how we'd run it) |
| **PDF report** | A sequence of pages: front cover, overall score, category scores, individual category pages, calls to action, general content; dynamic by score; a "Report" URL per lead; a download button in the results email [11][12][13] | 23 US Letter pages: cover, overview with the four area cards, your invisible work, next to the top three, overall score, strongest area, weakest area, then the static playbook (four guides, timeline, quick start, checklists, tracker, next step). A unique `/report/<token>` and `/report/<token>/pdf` per lead |
| **Results email** | Sent at once, personalised, with the PDF button [14][12] | The score email (Deliverable 2) right after the quiz; the report email when the team approves the report (Deliverable 3: "checked by a person, within one business day") |
| **Integrations** | 22+ platforms (HubSpot, GoHighLevel, Mailchimp, Slack, Zapier...), webhooks with events Quiz Started, Quiz Finished, Lead Details Updated, Lead Signed Up, a signature header, field mappings including UTM data and the report URL [15][16][17] | GoHighLevel (contact upsert with tags and mapped fields), Slack and email notices, Meta Conversions API, signed webhooks (`scorecard.completed`, `scorecard.deepened`, `scorecard.booked`, `report.sent`) for Zapier, Make or n8n, the landing page's shared leads table |
| **Insights** | Start rate (starts over visits), completion rate (completions over visits), sign-up rate, question performance to find drop-off, average scores [18] | The admin's Insights: visits, starts and start rate, completions and completion rate, calls booked, deepeners, reports sent, time to report; question by question with drop-off; scores by tier, bottleneck, area; answers to every question; sources |
| **Split testing** | Landing page split tests on higher plans [19] | One static page per variant (`/`, `/invisible`), each with its own words, as the Meta page does ("same ads, new URL"); the Insights compare variants on start rate, completion rate and calls |
| **Tracking** | Facebook pixel and Google Analytics; UTM parameters and hidden fields captured automatically [19][20] | The Meta pixel after consent (never with Global Privacy Control), Lead and Schedule for qualified answers only, the Conversions API with the same event ids; UTM and fbclid kept for the visit and stored with the lead |

## The method behind it

Priestley's scorecard marketing: a landing page whose main job is to start the questionnaire, a short set of questions
that measure and qualify, and a results page that gives a real insight and offers the next step, usually a
conversation [2][21]. Two pieces of it show up here:

- **Best-practice questions plus qualifying questions.** Priestley's model pairs best-practice questions (what the
  scorecard measures) with qualifying questions such as the current situation and the preferred solution, which
  "translate budget signals into routing decisions" [22]. Here the four scored questions measure; the gateway questions
  (jobs a week, ticket, where jobs are recorded, Google profiles) qualify and route: fewer than 5 jobs or paper records
  are not reported to Meta; paper or 3+ profiles go to a call with no checkout link.
- **A clear time promise.** Sources on the method recommend stating the time ("takes less than 3 minutes") to cut
  abandonment before the start [23]. Here: "Ten quick taps, about a minute."

Length and completion: ScoreApp's reference says scorecards of 15+ questions "typically see completion rate drops
below 50%"; a third-party summary of Outgrow's data puts 8 to 15 questions at about 45 to 65% completion [24][25]. That
is why the hero is 10 steps and the extra depth comes from the optional deepener and the team's reading of the public
profile (Deliverable 1, section 2).

## Where this build differs from ScoreApp, on purpose

- **A person checks every report.** ScoreApp generates the PDF at once. Here the score is instant and the report waits
  for the team to read the public Google profile and the top three, which a scorecard alone cannot know.
- **Contact last, never first.** ScoreApp's own data favours a lead form before the questions; the Meta page's rules and
  the spec put it last, for a cold audience on a phone.
- **No outcome promises.** The claim rules block promised reviews, rankings, prices and "instant" or "automatic".
- **One scorecard, as data.** No drag-and-drop builder: the founder's spec is the scorecard, versioned in git, linted,
  tested and built.

## Sources

1. ScoreApp Help Centre, Creating your first Scorecard: https://support.scoreapp.com/article/102-getting-started
2. ScoreApp, 4 step lead formula, and the landing page elements (hook, value proposition, credibility, call to action): https://www.scoreapp.com/4-step-lead-formula/
3. ScoreApp Help Centre, Understanding ScoreApp Scoring Logic: https://support.scoreapp.com/article/143-understanding-scoreapp-scoring-logic
4. ScoreApp Help Centre, Assigning Points to Answers: https://support.scoreapp.com/article/144-assigning-points-to-answers
5. ScoreApp Help Centre, Using Categories & Category Scores: https://support.scoreapp.com/article/146-using-categories-category-scores
6. ScoreApp Help Centre, Logic Jumps & Conditional Questions: https://support.scoreapp.com/article/150-logic-jumps-conditional-questions
7. ScoreApp Help Centre, Customise Lead Form Position and Appearance: https://support.scoreapp.com/article/186-customise-lead-form-position-and-appearance
8. ScoreApp, Quiz Lead Form: Should it go Before or After your Quiz Questions: https://www.scoreapp.com/quiz-leads-form/
9. ScoreApp Help Centre, Using Different Result Pages: https://support.scoreapp.com/article/204-using-different-result-pages
10. ScoreApp Help Centre, External Redirect for Result Pages: https://support.scoreapp.com/article/202-external-redirect-for-result-pages
11. ScoreApp Help Centre, PDF Reports Overview: https://support.scoreapp.com/article/88-pdf-reports-overview
12. ScoreApp Help Centre, Delivering the PDF Report in the Results Email: https://support.scoreapp.com/article/177-delivering-the-pdf-report-in-the-results-email
13. ScoreApp Help Centre, Integration Field Mappings: https://support.scoreapp.com/article/195-general-integration-field-mappings
14. ScoreApp Help Centre, Configuring and Editing the Results Email: https://support.scoreapp.com/article/73-editing-the-results-email
15. ScoreApp Help Centre, Webhooks Integration Guide: https://support.scoreapp.com/article/101-webhooks
16. ScoreApp, How to Build a Quiz With Webhooks: https://www.scoreapp.com/build-quiz-webhooks-scoreapp/
17. ScoreApp Help Centre, GoHighLevel & ScoreApp Integration: https://support.scoreapp.com/article/123-gohighlevel-scoreapp-integration
18. ScoreApp Help Centre, Understanding Your Insights: https://support.scoreapp.com/article/181-understanding-insights
19. Third-party comparison (involve.me) of ScoreApp's plans and features: https://www.involve.me/involveme-vs-scoreapp
20. ScoreApp Features: https://www.scoreapp.com/features/
21. Daniel Priestley, Scorecard Marketing (2nd edition): https://cdn.scoreapp.com/assets/book/Scorecard_Marketing_by_Daniel_Priestley_2nd_edition.pdf
22. Source analysis of Priestley's "$1 Million Landing Page": https://build-os.com/blogs/source-analyses/daniel-priestley-1m-landing-page
23. Key Person of Influence Scorecard (a public Priestley scorecard): https://become.keypersonofinfluence.com/scorecard
24. ScoreApp, Full Reference: https://www.scoreapp.com/llms-full.txt
25. ScoreApp, Analysing Quiz Data: https://www.scoreapp.com/analysing-quiz-data/
