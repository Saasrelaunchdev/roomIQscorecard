# How this scorecard follows ScoreApp

ScoreApp (Daniel Priestley's scorecard software) builds every scorecard from the same parts: a landing page, a set of
questions, a lead form, a results page with dynamic content, a results email with a PDF report, integrations, and
insights. This build has each part, written for one scorecard (RoomIQ's First Deal Risk Scorecard) rather than a
general builder: the questions, scoring and words are data in `content/`, so changing them is an edit and a build, not
code.

**How the research was done.** ScoreApp's site and help centre could not be opened directly from the build environment
(the network policy refused `www.scoreapp.com` and `support.scoreapp.com`), so the facts below come from web search
results that quote those pages. Each is listed with its source. Nothing here is from memory alone.

## The parts, side by side

| ScoreApp | What ScoreApp does | This build |
|---|---|---|
| **Landing page** | The first page a visitor sees; templates with a hook, a value proposition, credibility and a call to action. A landing page can be skipped [1][2] | Version B at `/` is the ScoreApp template (hero, introduction, how it works, the five areas, the report, FAQ, final call). Version A at `/first-deal` puts the quiz in the hero, for the Meta ads. `/start` skips the landing page (spec 2, section 1) |
| **Questions** | Multiple choice, checkbox, sliders and scales feed scoring; open text does not. Questions can be left unscored. Weight comes from bigger points [3][4] | 22 single-select questions: 5 gateway (unscored: stage, market, monthly cost, lease-up months, reserve months), 5 scored in the quiz, 10 scored in the deepener (two per area), 2 unscored checklist questions (the city's rule, financing). Points 0 to 4 x weight (spec 1, section 3) |
| **Categories** | Category scores as percentages, an overall score, tiers by percentage ranges; Low, Medium, High content per category [3][5] | Five areas at 20% each (Rent Evidence, Fill Speed, Nearby Supply, Room Mix, Lease-up Reserves); the Deal Readiness Score is their average; the GTM's three tiers (Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100); each area card has Low, Medium and High text |
| **Logic jumps** | Conditional questions route people down different paths and can drive results content [6] | "I don't have a rent yet" hides the two rent deepener questions. A skipped question leaves both the score and the maximum (spec 1, section 7) |
| **Lead form** | Before or after the questions. ScoreApp's blog finds "before" converts more leads, "after" makes people more committed; it says to test both [7][8] | After, always: taps before typing, contact details last (step 11). The button reads "See my score" |
| **Results page** | One default results page, more optional; dynamic sections per score tier; merge tags such as first name and scores; an external redirect with merge tags [9][10][5] | `/results/<token>`: the thank-you line with the first name, the Deal Readiness Score and tier, the first six months (the lease-up gap, one of eight variants, with the six-month strip), the fix-first line, five area cards (one of three variants each), the three checks outside RoomIQ, then the next steps in each tier's order (the report, the free forecast or the market lookup, sharpen, the walkthrough, see how RoomIQ works) |
| **PDF report** | A sequence of pages: front cover, overall score, category scores, individual category pages, calls to action, general content; dynamic by score; a "Report" URL per lead; a download button in the results email [11][12][13] | About 30 US Letter pages: cover, a note before you read, overview with the five area cards, your first six months, three checks, overall score, strongest area, weakest area, the Room-by-Room Underwrite and where the plan stands on each step, two ways to run it, the first 30 days with RoomIQ, then the 30-day plan (five guides, timeline, quick start, checklists, tracker, next step). A unique `/report/<token>` and `/report/<token>/pdf` per lead |
| **Results email** | Sent at once, personalised, with the PDF button [14][12] | The score email right after the quiz, with the PDF attached (instant delivery); the sharper report after the deepener |
| **Integrations** | 22+ platforms (HubSpot, GoHighLevel, Mailchimp, Slack, Zapier...), webhooks with events Quiz Started, Quiz Finished, Lead Details Updated, Lead Signed Up, a signature header, field mappings including UTM data and the report URL [15][16][17] | Slack and email notices, the Meta Conversions API, signed webhooks (`scorecard.completed`, `scorecard.deepened`, `scorecard.booked`, `report.sent`) for the Loops follow-up emails through Zapier, Make or n8n; GoHighLevel and a shared leads table are there, off unless set |
| **Insights** | Start rate (starts over visits), completion rate (completions over visits), sign-up rate, question performance to find drop-off, average scores [18] | The admin's Insights: visits, starts and start rate, completions and completion rate, walkthroughs booked, deepeners, reports opened, the lease-up gap found; question by question with drop-off; scores by tier, fix first, area; who takes it (stage, market, monthly cost); every answer; sources and campaigns |
| **Split testing** | Landing page split tests on higher plans [19] | One static page per variant (`/`, `/first-deal`), each with its own words; the Insights compare variants on start rate, completion rate and walkthroughs |
| **Tracking** | Facebook pixel and Google Analytics; UTM parameters and hidden fields captured automatically [19][20] | The Meta pixel after consent (never with Global Privacy Control): ScorecardStart when the quiz first opens, ScorecardComplete for every completion (pixel and Conversions API, one event id), Schedule for a qualified walkthrough booking (the GTM's event map); UTM and fbclid kept for the visit and stored with the lead |

## The method behind it

Priestley's scorecard marketing: a landing page whose main job is to start the questionnaire, a short set of questions
that measure and qualify, and a results page that gives a real insight and offers the next step, usually a
conversation [2][21]. Two pieces of it show up here:

- **Best-practice questions plus qualifying questions.** Priestley's model pairs best-practice questions (what the
  scorecard measures) with qualifying questions such as the current situation and the preferred solution, which
  "translate budget signals into routing decisions" [22]. Here the five scored questions measure; the gateway questions
  (stage, market, monthly cost, lease-up months, reserves) qualify, route and price the lease-up gap: "Learning, no
  house yet" or a market outside the presets is not qualified; more than 10 houses goes to the walkthrough first.
- **A clear time promise.** Sources on the method recommend stating the time ("takes less than 3 minutes") to cut
  abandonment before the start [23]. Here: "Eleven quick questions, about a minute."

Length and completion: ScoreApp's reference says scorecards of 15+ questions "typically see completion rate drops
below 50%"; a third-party summary of Outgrow's data puts 8 to 15 questions at about 45 to 65% completion [24][25]. That
is why the quiz is 11 steps and the extra depth comes from the optional deepener (spec 1, section 2).

## Where this build differs from ScoreApp, on purpose

- **A number from their own answers, not a forecast.** The lease-up gap prices the first six months from the visitor's
  own cost, lease-up and reserves, and says it is not a forecast; the forecast on their address is the next step.
- **Contact last, never first.** ScoreApp's own data favours a lead form before the questions; the landing page's rules
  and the spec put it last, for a cold audience on a phone.
- **No outcome promises.** The claim rules block accuracy, income and return claims, named platforms, prices and
  trials, and anything that reads as zoning, lending or investment advice.
- **One scorecard, as data.** No drag-and-drop builder: the spec is the scorecard, versioned in git, linted, tested and
  built.

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
