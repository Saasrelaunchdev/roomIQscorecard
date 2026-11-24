# Running the scorecard: the team's routine

Every owner gets their report by email the moment they finish the scorecard: the PDF, built from their answers, with
the Visible Work Method and how Rempo runs it (the owner's request of 2026-11-22). Within one business day a person reads
their public Google profile and the top three, and sends the update (Deliverable 3's "checked by a person"). This is
the routine.

## Each weekday morning

The digest (Slack or email, from `/api/cron`) says how many reports are waiting for the top three and how old the
oldest is. Open `/admin`, filter by status, and work oldest first. A call booked for today comes first; Insights, "Leads
to call first", lists the qualified leads without a call, the most invisible work first.

## Building one report (about 15 minutes)

1. **Open the scorecard** in the admin. The left card is the result: the on-screen score, the report score (with the
   deepener, if answered), the four areas, fix first, urgency, the invisible work, the verdict line, the quick wins and
   the call notes. The right card is every answer in words with the seconds it took (a long pause on a question is
   worth asking about), and the call if one is booked. Below: where they are (approximate), on what, from which source,
   how long they took; the report they have, how often they opened it, and each email with whether it was delivered,
   opened or clicked.
2. **Run the search.** Search the owner's main service in their town in a private browser window (for example
   "HVAC Austin"). The three companies that come up first are the top three. Put the service, the town and today's date
   in the profile form: they print on the report, so the owner can repeat the search.
3. **Read the owner's Google profile** and fill in:
   - rating (as shown) and total reviews;
   - reviews in the last 90 days (count them by date);
   - how many days ago the newest review came in;
   - replies: of the last 30 reviews (or all of them, if fewer), how many have an owner reply, and how many you read;
   - the five checks: hours, services, photos from the last 90 days, a description, categories;
   - reviews by month for the last 12 months, oldest first, ending with this month.
4. **Read the top three** the same way (rating, total, last 90 days, newest, replies, the five checks). Their averages
   are worked out for you.
5. **Complaint themes.** If a complaint repeats in the owner's last 30 reviews, write the theme in plain words and the
   count ("a call that was not returned", 3). Themes and counts only: never a reviewer's name or words.
6. **Save the profile**, then check the two suggestions: the busy-season read (auto, or set dip, steady or none if the
   months say otherwise) and the top-three reading for the GTM gap score.
7. **Add a note if it helps** ("This lead's report"): a line for this owner, printed under the letter, and the sections
   this report carries. The claim rules check the words before they save.
8. **Preview the report** (Live preview). Read the invisible work page, the top three page, the weakest area page and
   "Where they stand on each step" against the profile. If something reads wrong, fix the profile, save, preview again.
9. **Approve and send the update.** Put your first name in "Checked by" (it prints on the cover). The PDF is printed
   first; if it prints, the report is kept as it is and the owner gets the update email with the new PDF attached.

## After sending

- The owner's link shows the report as it was last emailed. To change a sent report: Reopen, edit, send again (the owner
  keeps the report they have in between).
- "Send again" re-sends the score email (with the report), the call email or the report email, each with its PDF (never
  to an address that unsubscribed or marked an email as spam).
- If a lead's PDF did not print (the lead's page says "the link only"), the owner still got the report's link; "Send
  again" sends it with the PDF once printing works.
- Before a call: the call notes say what to bring up (higher-value ticket, paper records, 3+ locations, asks only happy
  customers, contact details missing on jobs, no website).

## Data rules (from the GTM)

- Public profile facts only, as counts, dates and themes. Never a reviewer's name or words, never a personal detail.
- No promise of reviews, ratings, rankings, calls or jobs, anywhere, including in emails you write by hand.
- No incentives tied to reviews, for taking the scorecard or anywhere else.
- Asking is the shop's; reviewing is the customer's choice.

## Settings

`/admin`, Settings: the letter at the front of every report and who signs it, the sections every report carries, who on
the team hears about leads (and whether the PDF goes with the new-lead email), and "Send a test", which emails the sample
report (a made-up shop) to you the way an owner gets it. "Preview with the sample shop" shows the report with the
settings in force.

## When something is not set up

`/admin`, Settings, lists what this deployment sees. `/api/scorecard` gives the full health report. A scorecard that
could not be saved still reaches the team by email or Slack, marked NOT SAVED, with everything in the notice.
