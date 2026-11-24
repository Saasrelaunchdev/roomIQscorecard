# Running the scorecard: the team's routine

Every investor gets their report by email the moment they finish the scorecard: the PDF, built from their answers,
with the Room-by-Room Underwrite and a 30-day plan. Nothing waits on the team (instant delivery, no outside data), so
the routine is the walkthroughs, the follow-ups and a weekly look at the numbers.

## Each weekday

1. **Open `/admin`, Leads**, filtered to the last few days. New scorecards arrive with status New; the team's notice
   (email or Slack) says the same thing as it happens.
2. **Walkthroughs first.** A lead with a booking shows it in the Call column and on its page (day, window, phone,
   address if given). The confirmation email told them: "We'll email you a video link before then, and call {phone} if
   the link doesn't work." The funnel does not send that link: **email the video link the day before**, from the
   address the scorecard's emails come from.
3. **Insights, "Leads to call first"** lists qualified investors without a walkthrough, the largest lease-up gap first.
   They agreed to emails about their score and report, not to calls: the follow-up is the day 2, 5 and 8 emails in
   Loops, not a phone call.

## Before a walkthrough (about 10 minutes)

1. **Open the lead.** The left card is the result: the score, the five areas, fix first, urgency, the lease-up gap,
   the verdict and the quick wins. The right card is every answer in words with the seconds it took (a long pause is
   worth asking about), the deepener's answers if given, and the checklist (the city's rule, financing).
2. **Run the free forecast** on the address they gave, in RoomIQ, so the walkthrough starts from the estimate, its
   formula, its comps and its confidence label. No address: ask for one at the start, or walk through the market.
3. **Read their report's weakest-area page** and "Where your plan stands on each step": that is the walkthrough's
   agenda, in the method's order (rent, fill, supply, room mix, reserves).

## During the walkthrough (20 minutes)

- Show what the evidence covers and what it doesn't. Thin evidence is labeled Thin; say so.
- Say it plainly: an estimate shows its working; it doesn't guarantee rent, occupancy or a return. The deal math is
  informational only, not financial or lending advice.
- Zoning, financing and insurance sit outside RoomIQ: the city or an attorney, a lender, an insurer.
- No prices or trials unless the offer is published; the Free plan (three forecasts a month, no card) is the next step.

## After it

Set the lead's status in the admin (its page, "Review and send"), and add a line in "Notes for the team" (never shown to
the lead). To send a lead a report with a personal note: "This lead's report", write the note (the claim rules check
it), Preview, then "Approve and send the update"; the PDF is printed first, and the investor gets the update email with
it attached.

"Send again" re-sends the score email (with the report), the walkthrough email or the report email, each with its PDF,
never to an address that unsubscribed or marked an email as spam.

## Each week

- **Insights**, last 7 days: completions and completion rate by landing page (the split test), drop-off question by
  question, sources and campaigns, walkthroughs booked. Compare the cost per completion with the Meta launch plan's
  target (Events Manager counts ScorecardComplete once per completion).
- **Emails**: bounces and spam complaints in Insights, "Emails". A rising bounce rate means the sender's domain needs a
  look in Resend.

## Each month, or when the facts change

- **Covered markets.** When the weekly coverage check publishes its list, set `markets.covered` in
  `content/scorecard.mjs` (the free forecast card shows only there), build and merge.
- **The city's rules.** The checks quote each preset city's rule on unrelated adults as GTM-BRIEF.md's External
  constraints published it (checked in November 2026). Recheck them, update `content/checks.mjs` and its "checked in"
  date, build and merge.
- **The founding cohort.** The day 8 email's version 1 runs only while seats are left and the number is published
  (spec 2, section 10).

## Data rules (from the GTM)

- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- No accuracy, income, return or yield claims, anywhere, including emails written by hand and the walkthrough.
- No named platform, competitor or data source: categories only.
- The market is a metro; an address is kept only when the investor gives one for the walkthrough, and only with that
  lead. Never share one lead's answers with another.
- Not legal, lending, insurance or investment advice.

## Settings

`/admin`, Settings: the letter at the front of every report and who signs it, the sections every report carries, who on
the team hears about leads (and whether the PDF goes with the new-lead email), and "Send a test", which emails the sample
report (a made-up investor) to you the way an investor gets it. "Preview with the sample investor" shows the report with
the settings in force.

## When something is not set up

`/admin`, Settings, lists what this deployment sees. `/api/scorecard` gives the full health report. A scorecard that
could not be saved still reaches the team by email or Slack, marked NOT SAVED, with everything in the notice.
