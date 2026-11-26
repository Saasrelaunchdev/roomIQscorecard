# The First Deal Risk Scorecard on ScoreApp: build brief and AI builder prompts

RoomIQ's First Deal Risk Scorecard is already built and tested as its own funnel (`Saasrelaunchdev/roomIQscorecard`).
This file rebuilds it in ScoreApp: prompts for ScoreApp's AI builders, the steps to do by hand, and every word. The words
come from the funnel's content files (`content/*.mjs`), written into this file by `tools/scoreapp-brief.mjs` on
2026-11-26, so ScoreApp shows what the funnel shows. Section 1 lists the few places ScoreApp needed a different route.

## How to use this file

1. **Plan.** Use ScoreApp's **Business** plan. It is the lowest plan with the PDF report, Audiences, Smart Sections, the
   Meta pixel with the Conversions API, an embedded booking calendar, a custom domain and a custom sender. Pro adds only
   split testing between the two landing pages.
2. **Work in stage order** (the table below). Each stage has a **Prompt** to paste into the named ScoreApp AI chat, or
   **By hand** steps, or both.
3. **Paste one prompt per message.** Copy everything inside the grey block, nothing outside it. ScoreApp's AI builders
   expect one brief per step, and every message spends AI credits in proportion to its length, so never paste this whole
   file into a chat.
4. **Text is final.** Words in tables and quotes are the funnel's own, already checked against RoomIQ's claim rules.
   Paste them as they are. The AI is told the same.
5. **Fill the gaps marked `[[TBD: ...]]`** before going live: the booking link, the domain, the sender, the team's
   address, the postal address for commercial email and the Meta pixel id. Nothing else is left open.

| Notation | Meaning |
|---|---|
| `{first_name}` | ScoreApp's first-name merge field. Insert it with the merge-field icon if typing it does not convert |
| `[[MERGE: ...]]` | Insert that merge field from the editor's merge-field icon, for example `[[MERGE: Lowest category name]]` (ScoreApp lists "Lowest Category Name"). If the editor does not offer it, write "your lowest area", or leave the line out where the brief says so |
| `{result_key}` | Typed exactly as shown in a link: ScoreApp swaps in each respondent's own result |
| `[[TBD: ...]]` | A value only you have. The brief says where it goes |

| Stage | What | Where in ScoreApp | How |
|---|---|---|---|
| 1 | The scorecard: questions, categories, points, tiers | Create Scorecard, Use the AI Builder | Prompt 1A, then checks and Prompt 1B |
| 2 | Two landing pages | Landing Pages (AI chat on the page) | Prompts 2A and 2B, then by hand |
| 3 | Lead form and consent | Settings, Lead Form | By hand |
| 4 | Results page | Audiences; Result Pages, AI results page | By hand (audiences), Prompts 4A and 4B |
| 5 | PDF report | PDF Reports | By hand, page by page |
| 6 | Emails | Settings, Result Email and Notifications; Integrate, Webhooks | By hand |
| 7 | Tracking, domain, sender | Settings, Tracking; Account, Domains | By hand |
| 8 | Test, then go live | Draft mode | Four test personas with expected results |

## 1. What carries over, what changes, and why

ScoreApp scores every answer as points, shows scores by tier, and personalises sections by tier, by the highest or lowest
category, or by an Audience built from answers. It does no arithmetic on answers ("ScoreApp does not currently handle
advanced formula logic", its help centre says), and it has one question flow per scorecard. Everything below follows
from those two facts.

| In the built funnel | In ScoreApp | Why |
|---|---|---|
| 11 steps: 5 gateway questions, 5 scored questions, then first name and email | The same 10 questions in the same order and words; the lead form after the questions (Form Behaviour: After Questions) | ScoreApp then shows the lead form over the masked results, which is the funnel's "contact last" rule |
| Question 2 typed (a city or metro, matched by name to the seven presets, with a "Not decided yet" chip); questions 8 to 10 as sliders over the same answers, each with a "Not sure" chip | Single-choice questions with the same answers | ScoreApp's Audiences and the Smart Section read the answer, so a fixed list keeps them exact; ScoreApp's sliders score points, and these questions score none |
| Five areas scored 0 to 100 from one question each (0, 1, 2 or 4 points) | Five categories, one scored question each, same points | Category score = points ÷ 4, so the same 0, 25, 50 or 100 |
| Deal Readiness Score = the average of the five areas | Overall score = all points ÷ 20 | Equal maximum per category makes ScoreApp's total the same average |
| Tiers Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100; area bands Low, Medium, High on the same ranges | One set of score tiers, labelled Beginner, Intermediate, Advanced, used for the overall score and every category | ScoreApp shares one tier set; the ranges are identical, so each area's Low, Medium and High text maps to one tier |
| Fix first: the lowest area; ties go to rent, then fill, supply, mix, reserves | Five small sections, each shown by an Audience "Lowest category is ...", and one for every area Advanced; categories listed in that order | ScoreApp breaks ties by the category list, which reproduces the funnel's order; an AI results page varies text by tier, not by which category is lowest |
| The cascade: a lowest Room Mix or Lease-up Reserves defers to the weaker of Rent Evidence and Fill Speed while either is under 75 | The Room Mix and Lease-up Reserves fix-first text says so in words | ScoreApp cannot compare two categories inside a section |
| The lease-up gap: monthly cost × (lease-up months minus reserve months), in dollars, eight sentence variants | One Smart Section (AI text per respondent) with the exact rules and sentences (Prompt 4B); the PDF explains the formula with a worked example | No arithmetic on answers in ScoreApp. Appendix B lists the exact sentence for every answer combination to check it against |
| The six-month strip (a picture drawn from the answers) | Not carried over; the sentence and its math line say the same | No per-answer graphics |
| The city's rule on unrelated adults for the visitor's market | On the results page, one section per preset market shown by Audience; in the PDF, a page with all seven cities | Audiences are answer-based visibility |
| Next-step cards ordered by tier; the free forecast only in covered markets, else "Look up your market" | The tier's first step on its own (Beginner: the report; Intermediate: the forecast, or the market lookup outside covered markets; Advanced: the walkthrough), then every card | The same first step per tier, without sorting cards per person |
| The walkthrough: the funnel's own form (5 business days, three windows, phone and consent) | Your booking tool's page, embedded or linked from a button, with name and email prefilled | ScoreApp books through a calendar tool |
| The deepener: 12 optional questions after the result, and a sharper report | Not carried over | One question flow per scorecard; 22 questions in one flow would cut completion (ScoreApp: 15 or more "typically see completion rate drops below 50%") |
| Answer-by-answer sentences ("Where your plan stands", quick wins, the checks' status) | The same pages, written per category tier | Tier-based content is what ScoreApp personalises |
| Meta: ScorecardStart, ScorecardComplete (pixel and server, one event id), Schedule for qualified bookings | ScoreApp's own events: ScoreappQuestionsStarted, Lead (after the lead form), ScoreappQuestionsFinished; Conversions API on; custom conversions name them for the GTM | ScoreApp's event names are fixed |
| The score email with the PDF, the team's notice, the Loops follow-ups through a signed webhook | ScoreApp's results email with the PDF button, its notification email, its webhook to Loops | Same jobs, ScoreApp's tools |
| The admin: leads, insights, settings | ScoreApp's Leads and Insights | Built in |

## 2. RoomIQ's copy rules (every stage)

Every prompt below carries these rules. Apply them to anything you type by hand, too.

```text
<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>
```

## Stage 1. The scorecard: AI Scorecard Builder

Open ScoreApp, **Create Scorecard**, **Use the AI Builder**. Paste Prompt 1A as your first message.

### 1.1 Prompt 1A (paste as your first message)

```text
<role>
You are ScoreApp's AI Scorecard Builder, configuring one scorecard for RoomIQ. The specification below is final: it
comes from a funnel that is already built, tested and approved. Reproduce it inside ScoreApp exactly. Do not improve,
shorten, expand or rephrase it.
</role>

<priority_order>
1. hard_rules  2. questions and scoring  3. copy_rules  4. everything else.
When two instructions conflict, the higher one wins. When something is not specified, choose the plainest option and
list it in your summary. Never invent content to fill a gap.
</priority_order>

<scorecard>
name: The First Deal Risk Scorecard
score_name: Deal Readiness Score (0 to 100, higher is better)
business: RoomIQ (https://roomiq.io), room-by-room underwriting for rent-by-the-room investors
audience: US investors before or during their first rent-by-the-room (co-living) deal, and owners converting a house.
  Most arrive on a phone from a Meta ad.
promise: ten quick questions and the contact step, about a minute; the score right after; the full report by email as a PDF
measures: how much of the deal plan rests on evidence the investor can check, across five areas. It does not grade the
  house, the market or what the deal will return.
result: the Deal Readiness Score, five category scores, the lowest category marked "Fix first", next steps by tier
tone: direct, plain, never shaming
</scorecard>

<hard_rules>
- Exactly 10 questions, in the order below, with the exact wording, answers and points below. Do not add, remove, merge,
  split, reorder or reword any question or answer, and do not add "Other" answers.
- Every question is single-select (one answer). No open text, sliders, checkboxes or image answers.
- Exactly 5 categories, in this order: Rent Evidence, Fill Speed, Nearby Supply, Room Mix, Lease-up Reserves.
- UNSCORED questions (1, 2, 8, 9, 10): turn scoring off. They award no points to any category.
- SCORED questions (3, 4, 5, 6, 7): each answer awards the listed points to the one category listed, and to no other.
- Score tiers, used for the overall score and for every category: Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100.
- The lead form comes AFTER the questions and asks first name and email only (no last name, phone or company).
- Show scores as percentages (0 to 100).
- No testimonials, reviews, logos, counts, statistics, prices or countdown timers anywhere.
- Do not ask questions this brief answers. If you must ask something, ask everything in one message.
</hard_rules>

<categories>
order | name | what it measures (internal description)
1 | Rent Evidence | Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess.
2 | Fill Speed | Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from an assumed vacancy rate.
3 | Nearby Supply | Checks whether you know how many co-living homes compete within about 3 miles, how full they are, and what's new.
4 | Room Mix | Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or decided on a hunch.
5 | Lease-up Reserves | Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches nearby filled.
</categories>

<questions>
# | scoring | question | answers (in this order)
1 | UNSCORED | Where are you with rent-by-the-room? | Learning, no house yet / Looking at houses / Under contract / Converting my house / I run 1 to 10 houses / More than 10 houses
2 | UNSCORED | Where is the house, or the market you're looking at? | Dallas-Fort Worth / Houston / Atlanta / Orlando / Jacksonville / Phoenix / Las Vegas / Another US market / Not decided yet
3 | SCORED: Rent Evidence | Where does your per-room rent number come from? | I don't have one yet = 0 pt / A platform's earnings calculator = 1 pt / Whole-home rent divided by bedrooms = 1 pt / Asking rents I found on room listings = 2 pt / Comps of nearby rooms, with how fast they filled = 4 pt
4 | SCORED: Fill Speed | How do you know how fast rooms fill near the property? | I haven't looked = 0 pt / I assume a vacancy percentage = 1 pt / Host stories and forum posts = 2 pt / A platform's market reports = 2 pt / Observed fill times of comparable rooms nearby = 4 pt
5 | SCORED: Nearby Supply | How many co-living homes compete within about 3 miles? | No idea = 0 pt / Some, I think = 1 pt / I counted listings = 2 pt / I know the count and roughly how full they are = 4 pt
6 | SCORED: Room Mix | Have you decided the bath mix? | Not yet = 0 pt / Keeping the current bathrooms = 1 pt / Adding a bathroom because it seems worth it = 2 pt / Modeled private against shared-bath rents nearby = 4 pt
7 | SCORED: Lease-up Reserves | What happens if lease-up takes longer than planned? | I haven't planned for it = 0 pt / I'd lower rents = 1 pt / A few weeks of reserves = 2 pt / Reserves sized from how comparable launches nearby filled = 4 pt
8 | UNSCORED | About what will the house cost you each month before rent comes in? (help text: Loan payment, taxes, insurance and utilities, with every room empty. A range is fine.) | Under $2,000 / $2,000 to $3,000 / $3,000 to $4,000 / More than $4,000 / Not sure yet
9 | UNSCORED | How long do you expect the rooms to take to fill? (help text: Counted from the day rooms are ready to rent.) | About a month / About 2 months / About 3 months / 4 months or more / Not sure
10 | UNSCORED | If no rent came in, how many months of costs could your reserves carry? (help text: Cash set aside for this house, after the down payment and the work.) | None set aside yet / 1 month or less / 2 to 3 months / 4 to 5 months / 6 months or more / Not sure
</questions>

<scoring>
- Category score = points earned in the category ÷ 4 points possible × 100. Each category has one scored question, so a
  category scores 0, 25, 50 or 100. (The answer scale is 0, 1, 2 and 4 on purpose: the best answer is evidence, worth
  twice a partial one.)
- Overall score = all points earned ÷ 20 × 100, which equals the average of the five category scores.
- Ties for the lowest category resolve to the category higher in the category list.
</scoring>

<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>

<results_outline>
The results page (its full copy comes in a later message): the overall score with its tier; a section for the first six
months; the lowest category as "Fix first"; the five category scores with tier-based text; three checks RoomIQ can't do;
next steps (the PDF report, a free forecast on the address, a 20-minute walkthrough, how RoomIQ shows its working).
</results_outline>

<branding>
Match the brand from https://roomiq.io: ink #03045E, accent #00B4D8, button #0077B6,
signal #F2B442, light ground #F3F7FF; fonts Bricolage Grotesque (headings) and
Instrument Sans (text). No stock photos of people.
</branding>

<concept>
Offer one concept only: "The First Deal Risk Scorecard" exactly as specified here. If your flow shows several concepts, I will continue with
the one named "The First Deal Risk Scorecard"; its questions must still be exactly the ones above.
</concept>

<self_check>
Before you show the questions, confirm in one short list: 10 questions in order; questions 3, 4, 5, 6, 7 scored, each
into its one category, points as listed; questions 1, 2, 8, 9, 10 unscored; 5 categories in order; tiers
0 to 39, 40 to 69, 70 to 100; lead form after the questions with first name and email; no text you invented.
</self_check>
```

### 1.2 If the builder asks follow-up questions

The builder may still ask about your business, audience, goals, leads or branding. Answer with these lines (or pick the
suggested answer that matches them).

| If it asks about | Answer |
|---|---|
| Your business | RoomIQ, room-by-room underwriting for rent-by-the-room investors. Website: https://roomiq.io |
| Your audience | US investors before or during their first rent-by-the-room deal, and owners converting a house. Most come from Meta ads on a phone. |
| Your goals | Show each investor which of their deal numbers are evidence and which are borrowed, then send them to a free forecast on their address or a 20-minute walkthrough. |
| The leads you want | Investors looking at houses, under contract, converting a house or running up to 10 houses, in a covered market. Learners are welcome but not the priority. |
| Scorecard type | A scored assessment with five categories, not a personality quiz. |
| Match your branding | Yes: https://roomiq.io |
| Which concept | Continue with "The First Deal Risk Scorecard" as specified in my first message. |

### 1.3 At "Review Questions and Scoring": check before you build

- 10 questions, in this order, with the exact words (compare with the table in Prompt 1A).
- Questions 3, 4, 5, 6, 7: scoring on; each answer scores into one category only, with the listed points (0, 1, 2 or 4).
- Questions 1, 2, 8, 9, 10: scoring off on every answer.
- Categories: Rent Evidence, Fill Speed, Nearby Supply, Room Mix, Lease-up Reserves, in this order.
- No extra question, answer, category or info screen.

Then click **Build this scorecard**.

### 1.4 Prompt 1B (only if something differs)

```text
Correct the questions and scoring to match my first message exactly. Keep everything else.
1. Restore the exact wording, order and answers of all 10 questions as listed in <questions>.
2. Questions 1, 2, 8, 9, 10: scoring off on every answer.
3. Questions 3, 4, 5, 6, 7: each answer scores only into its listed category, with exactly the listed points.
4. Remove any question, answer, category or info screen I did not list.
Reply with the corrected list of 10 questions so I can check it.
```

### 1.5 By hand after the build

| Where | Set |
|---|---|
| Settings, Score Tiers | Beginner: 0 to 39; Intermediate: 40 to 69; Advanced: 70 to 100. Suggested colors: Beginner #F2B442, Intermediate #00B4D8, Advanced #129E7B |
| Questions, Categories | Order: Rent Evidence, Fill Speed, Nearby Supply, Room Mix, Lease-up Reserves (the order decides ties for the lowest category). Category colors if offered: Rent Evidence #0077B6, Fill Speed #129E7B, Nearby Supply #E0662F, Room Mix #6250D6, Lease-up Reserves #D6457F |
| Questions, each question | Type: single choice (buttons or radio buttons). Question 2 has nine answers: use radio buttons, or a dropdown if your theme stacks nine buttons badly. Hide category names on questions (Settings, show or hide category names) |
| Questions, help text | Question 8: "Loan payment, taxes, insurance and utilities, with every room empty. A range is fine.". Question 9: "Counted from the day rooms are ready to rent.". Question 10: "Cash set aside for this house, after the down payment and the work." |
| Results page, score sections | Display Options, Overall Score Format: Percent (for the overall score and the categories) |
| Settings, General | Scorecard name: The First Deal Risk Scorecard. Keep Draft mode on until Stage 8 |

## Stage 2. Landing pages

Two landing pages, as in the funnel. Version B is the default page (the scorecard's main address). Version A is the page
for the Meta ads, at the URL key `first-deal`. Upload the picture first: `src/assets/img/neighborhood-1280.webp` from
the repository (a made-up neighborhood, the same picture the funnel and the landing page use).

### 2.1 Prompt 2A: the default landing page (Version B)

Open **Landing Pages**, the default page, and paste into its AI chat.

```text
<role>You are editing this scorecard's default landing page in ScoreApp for RoomIQ.</role>
<hard_rules>
- Use the copy below verbatim, character for character. Do not rephrase, shorten, add or translate.
- Sections in exactly this order. Remove template sections not listed here.
- Every button goes to the questions ("Go to questions"). No button opens the lead form: it comes after the questions.
- Pictures: only the neighborhood illustration I upload (made-up houses). No stock photos, no people, no logos of others.
- No testimonials, reviews, ratings, logos, counts, statistics, prices, countdown timers or "as seen in" strips.
</hard_rules>
<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>
<sections>
1. HERO (picture on the right, text on the left)
   eyebrow: Free scorecard for rent-by-the-room investors
   headline (H1): Would your first rent-by-the-room deal survive its first six months?
   lead: Every room-rental plan rests on two numbers: rent per room and how fast rooms fill. See if yours are evidence or guesses.
   button: Score my deal
   three small items under the button, with simple icons: About a minute / Free / Report by email
2. INTRODUCTION
   heading: Five areas. One number for your first six months.
   body: The First Deal Risk Scorecard checks where your plan's numbers come from, in five areas: Rent Evidence, Fill Speed, Nearby Supply, Room Mix and Lease-up Reserves. It doesn't grade the house or the market. It shows which numbers are evidence and which are borrowed. You'll also see your lease-up gap: the months your reserves don't cover, in dollars.
   button: Start the scorecard
3. HOW IT WORKS (on a dark ink ground)
   heading: Eleven taps now. Your report right after.
   body: Answer eleven quick questions about your plan and where its numbers come from. Your Deal Readiness Score shows right away, with a score for each area and your lease-up gap. Your full report follows by email as a PDF: what to check first, and how.
   step 1: Eleven quick questions. About your plan and where its numbers come from.
   step 2: Your score right away. Five area scores and your lease-up gap.
   step 3: Your report by email. A PDF right after, with a 30-day plan.
4. THE FIVE AREAS (one card per area, in this order)
   eyebrow: What the scorecard measures
   heading: Where your plan's numbers come from.
   card: Rent Evidence. Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess.
   card: Fill Speed. Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from an assumed vacancy rate.
   card: Nearby Supply. Checks whether you know how many co-living homes compete within about 3 miles, how full they are, and what's new.
   card: Room Mix. Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or decided on a hunch.
   card: Lease-up Reserves. Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches nearby filled.
5. THE REPORT
   heading: Your report, built from your answers
   body: Your answers turn into a report for your deal. It holds your Deal Readiness Score, your first six months, three checks outside RoomIQ, the method that closes your gaps and a 30-day plan. It arrives by email right after you finish.
   bullet: About a minute to answer
   bullet: Free, with no card and no call needed
   bullet: Emailed right after you finish
   button: Get my free report
6. FAQ
   heading: Straight answers
   line: What investors ask before they start.
   Q: Is it really free?
   A: Yes. No card and no call needed. You answer eleven questions, your score shows on screen, and your report comes by email as a PDF.
   Q: Why do you ask about my costs and reserves?
   A: To work out your lease-up gap: the months your reserves don't cover. We use the low end of your cost range and the high end of your reserves, so it never overstates.
   Q: Is the score a forecast?
   A: No. It scores where your plan's numbers come from, not the house or the market. A forecast on your address is a separate, free step in RoomIQ.
   Q: Do I need an address?
   A: No. The scorecard works before you have a house. If you do have one, the free forecast in RoomIQ runs on it.
   Q: Does RoomIQ check zoning or financing?
   A: No. Rules on unrelated adults sharing a home differ by city, and many loans use whole-home rent. Your report says what to ask the city, a lender and an insurer. Not legal advice.
   Q: Will you call me?
   A: Only if you book a walkthrough. Your report comes by email either way.
   Q: What do you do with my answers?
   A: We use them to build your report and to follow up by email. We never show your answers or your house in public. Unsubscribe any time.
   button: Start the scorecard
7. FINAL CALL
   heading: See your first six months before you buy.
   line: Eleven taps, about a minute, free.
   button: Score my deal
8. FOOTER
   line: RoomIQ is room-by-room underwriting for rent-by-the-room investors. The houses in our pictures and examples are made up.
   link: See how RoomIQ works (https://roomiq.io)
   links: Terms (https://roomiq.io/terms), Privacy (https://roomiq.io/privacy), Privacy choices (https://roomiq.io/privacy)
</sections>
<self_check>Before you finish: 8 sections in this order; every button goes to the questions; no text outside this
message; no em dashes.</self_check>
```

### 2.2 Prompt 2B: the Meta ads page (Version A)

**Landing Pages**, **Create**, then paste into its AI chat. Afterwards set its URL key to `first-deal` (Settings, the
wheel icon) and publish it without making it the default.

```text
<role>You are building a second landing page for this scorecard, for people arriving from a Meta ad whose first line is:
"Where does your per-room rent number come from?". The page gets them to the first question in one tap.</role>
<hard_rules>
- Use the copy below verbatim, character for character. Do not rephrase, shorten, add or translate.
- Sections in exactly this order. Remove template sections not listed here.
- Every button goes to the questions ("Go to questions"). No button opens the lead form: it comes after the questions.
- Pictures: only the neighborhood illustration I upload (made-up houses). No stock photos, no people, no logos of others.
- No testimonials, reviews, ratings, logos, counts, statistics, prices, countdown timers or "as seen in" strips.
</hard_rules>
<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>
<sections>
1. HERO (short; the button is the main thing on a phone screen)
   eyebrow: For rent-by-the-room investors
   headline (H1): Will your first deal survive six months?
   lead: Eleven quick questions. Your score, your lease-up gap and what to check before an offer.
   button: Score my first deal
   three trust lines with check icons: Free, no card and no call needed / Built from your own answers / Your report by email right after, as a PDF
2. YOUR FREE REPORT
   eyebrow: Your free report
   heading: What your report shows before you make an offer.
   line: Your score shows where your plan rests on evidence. Your report shows what to check next, and how.
   card: Your first six months. Your lease-up gap: the months your reserves don't cover, in dollars, from your own answers.
   card: Five areas, scored. Rent, fill speed, supply, room mix and reserves, with the one to fix first.
   card: Three checks outside RoomIQ. Your city's rule on unrelated adults, financing on room income, and insurance.
   button: Score my first deal
3. HOW IT WORKS: the same as the default page's section 3 (heading, body, three steps)
4. THE FIVE AREAS: the same as the default page's section 4
5. FAQ: the same as the default page's section 6
6. FINAL CALL
   heading: Start with where your deal stands.
   line: If the rent per room came from a calculator.
   line: If the vacancy rate is a guess.
   line: If nobody counted the homes nearby.
   line: Get your free Deal Readiness Score. It takes about a minute.
   button: Score my first deal
   trust lines: Free, no card and no call needed / Built from your own answers / Your report by email right after, as a PDF
7. FOOTER: the same as the default page's footer
</sections>
<self_check>Before you finish: the first screen on a phone shows the headline and the button; every button goes to the
questions; no text outside this message.</self_check>
```

### 2.3 By hand

| Where | Set |
|---|---|
| Each landing page, each button | Edit link, **Go to questions**, Save (an AI-built page can open the lead form first even when the lead form is set to After Questions). Then Publish |
| Version B | Publish, then Set as home page (the default) |
| Version A | Settings (wheel icon), URL: `first-deal`. Publish, not default. Its address: `https://<your scorecard domain>/first-deal` |
| Each page, Settings, SEO | Title: The First Deal Risk Scorecard \| RoomIQ. Description: Would your first rent-by-the-room deal survive its first six months? Eleven quick questions, about a minute, free. Your score shows right away; your report comes by email. |
| Social image | Upload `src/assets/og.png` from the repository (1200 × 630, RoomIQ's own) |
| Ads that should skip the landing page | Use `https://<your scorecard domain>/questions` (works because the lead form is after the questions) |
| Split test A against B (Pro plan only) | Experiments: the two pages, 50/50. On Business, send ads to Version A and other links to Version B |

## Stage 3. Lead form and consent (by hand)

**Settings, Lead Form.**

| Setting | Value |
|---|---|
| First name | On, required. Label: First name |
| Last name | Disabled |
| Email | On, required. Label: Email |
| Other fields | None (no phone, no company). The phone is asked only by the booking tool, with its own consent |
| Opt in | Explicit Consent (Required). Wording: Email me my score, my report and the occasional underwriting tip. Unsubscribe any time. |
| Privacy statement | By tapping "See my score", you agree to our Terms of Service and acknowledge our Privacy Policy, which explains what we collect and how we use it. |
| Privacy Policy URL | https://roomiq.io/privacy |
| Form Behaviour | After Questions |
| Lead form on the results page (the section ScoreApp adds) | Heading: Where should we send your report? Button: See my score |
| Advanced email validation | On, if your plan has it |

## Stage 4. Results page

### 4.1 By hand first: Audiences

**Audiences, Create Audience**, one per row (Business plan). They let the AI results page show a section by answers, by
which category is lowest, or by a mix of answer and tier: things its "versions by score" cannot do on their own. Create
them all before Prompt 4A. Ties for the lowest category go to the category higher in the list, as in the funnel.

| Audience name | Criteria | Used for |
|---|---|---|
| Covered market | Scorecard answer: Question 2 is any of: Dallas-Fort Worth, Houston, Atlanta, Orlando, Jacksonville, Phoenix, Las Vegas | The free forecast card (section 8) |
| Outside covered markets | Scorecard answer: Question 2 is any of: Another US market, Not decided yet | The market lookup card (section 8) |
| Intermediate, covered market | Total score tier is Intermediate AND Question 2 is any of: Dallas-Fort Worth, Houston, Atlanta, Orlando, Jacksonville, Phoenix, Las Vegas | The first step (section 7) |
| Intermediate, outside covered markets | Total score tier is Intermediate AND Question 2 is any of: Another US market, Not decided yet | The first step (section 7) |
| Fix first: Rent Evidence | Lowest category is Rent Evidence AND total score percentage is less than or equal to 99 | Fix first (section 4) |
| Fix first: Fill Speed | Lowest category is Fill Speed AND total score percentage is less than or equal to 99 | Fix first (section 4) |
| Fix first: Nearby Supply | Lowest category is Nearby Supply AND total score percentage is less than or equal to 99 | Fix first (section 4) |
| Fix first: Room Mix | Lowest category is Room Mix AND total score percentage is less than or equal to 99 | Fix first (section 4) |
| Fix first: Lease-up Reserves | Lowest category is Lease-up Reserves AND total score percentage is less than or equal to 99 | Fix first (section 4) |
| Every area Advanced | Total score percentage is greater than or equal to 100 | Fix first (section 4) |
| Market: Dallas-Fort Worth | Scorecard answer: Question 2 is Dallas-Fort Worth | The city's rule (section 6) |
| Market: Houston | Scorecard answer: Question 2 is Houston | The city's rule (section 6) |
| Market: Atlanta | Scorecard answer: Question 2 is Atlanta | The city's rule (section 6) |
| Market: Orlando | Scorecard answer: Question 2 is Orlando | The city's rule (section 6) |
| Market: Jacksonville | Scorecard answer: Question 2 is Jacksonville | The city's rule (section 6) |
| Market: Phoenix | Scorecard answer: Question 2 is Phoenix | The city's rule (section 6) |
| Market: Las Vegas | Scorecard answer: Question 2 is Las Vegas | The city's rule (section 6) |
| Market: Another US market | Scorecard answer: Question 2 is Another US market | The city's rule (section 6) |
| Market: Not decided yet | Scorecard answer: Question 2 is Not decided yet | The city's rule (section 6) |

### 4.2 Prompt 4A: build the results page

**Result Pages**: the AI builder made a results page with the scorecard. Open it and paste this into its AI chat. (If you
prefer to place every section yourself, build a **Dynamic result page** with the manual builder from the same text; a
page cannot switch builders later.)

```text
<role>You are rebuilding this scorecard's results page for RoomIQ. The content is final and comes from an approved,
tested funnel. Lay it out well; do not write new copy.</role>

<hard_rules>
- Use the copy below verbatim. Sections in exactly this order. Remove anything else on the page.
- Personalised sections hold one version per score tier: Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100.
  Say for each section whether it follows the overall score, the lowest category, or one category's own score, exactly
  as marked below.
- Show every score as a percentage.
- Leave section 3 as an empty placeholder titled "Your first six months": I will turn it into a Smart Section.
- Visibility marked "audience: <name>" means: Personalise, Who sees this, Some visitors, By audience, <name>. These
  Audiences already exist. Visibility marked "score level" means: By score level, with the tier and score named.
- Where a section must follow ONE category's own tier and a section can only vary by the overall score or the
  highest/lowest category, make three copies of it, each shown by score level to that category's tier.
- No testimonials, reviews, logos, counts, statistics, prices, countdown timers or stock photos. No AI notice except the
  one line in section 3.
</hard_rules>

<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>

<sections>
1. HEADER (everyone)
   logo, then: Thanks, {first_name}.
   heading (H1): Your First Deal Risk Scorecard
   line: Your full report is on its way to your inbox as a PDF.

2. YOUR SCORE (everyone; personalised by OVERALL score tier)
   donut chart of the overall score, percent, labelled "Deal Readiness Score"
   [Beginner 0 to 39] Beginner: underwriting on assumptions. Your numbers lean on estimates more than evidence. Higher is better.
   [Intermediate 40 to 69] Intermediate: partial evidence. You have part of the picture. Higher is better.
   [Advanced 70 to 100] Advanced: evidence-ready. You underwrite like an operator. Higher is better.
   under it, the same for all tiers: Your Deal Readiness Score measures how much of your plan rests on evidence you can check, across five areas. It doesn't grade the house or the market. A low score means some numbers are borrowed: a typed rent, an assumed fill time. Each one can be checked before you make an offer.

3. YOUR FIRST SIX MONTHS (everyone): leave as an empty placeholder, I will make it a Smart Section.
   heading: Your first six months
   small line at the end: An AI model worked these numbers out from three of your answers, with the formula in your report.

4. FIX FIRST: six small sections, exactly one shows for each person
   (audience: Fix first: Rent Evidence) Fix first: Rent Evidence. Your rent number is a guess. Check what rooms near the house rent for, by bath type, and how much evidence stands behind it.
   (audience: Fix first: Fill Speed) Fix first: Fill Speed. You don't know how fast rooms fill nearby, and your first months of cash flow depend on it.
   (audience: Fix first: Nearby Supply) Fix first: Nearby Supply. Supply nearby decides how hard your rooms will be to fill. Count it before you buy.
   (audience: Fix first: Room Mix) Fix first: Room Mix. Bath mix is a structural revenue driver. Compare private and shared-bath rents nearby before you build. Your Room Mix score follows from your Rent Evidence and Fill Speed scores: a bath mix is priced from what rooms rent for and how fast they fill, by bath type. If either of those two scored under 75, start with the lower of them (Rent Evidence if they tie).
   (audience: Fix first: Lease-up Reserves) Fix first: Lease-up Reserves. Lease-up can stall. Size reserves from how comparable launches nearby actually filled. Your Lease-up Reserves score follows from your Rent Evidence and Fill Speed scores: reserves can only be sized once you know what rooms rent for and how fast they fill. If either of those two scored under 75, start with the lower of them (Rent Evidence if they tie).
   (audience: Every area Advanced) Every number rests on evidence. Your report shows how to check it holds for this address.

5. YOUR FIVE AREAS (everyone)
   heading: Your five areas
   bar chart of the five category scores, percent, in category order
   line: Your five scores show where your plan rests on evidence and where it borrows. Start with the area marked Fix first, because the others follow from it. One area fixed well does more than five nudged.
   then one card per category, in order. Each card follows THAT CATEGORY'S OWN tier (score level on that category):
   Rent Evidence:
      [Rent Evidence Beginner] Your rent per room is a borrowed number: a guess, a platform's calculator or a whole-home rent split by bedrooms. Every figure after it, from cash flow to reserves, inherits the guess. The fix is a short list of rooms near the house, by bath type, with how fast they filled. It's the first thing to check before an offer.
         note under it: Start here. This is where your plan borrows the most, and it can be checked before an offer.
      [Rent Evidence Intermediate] Your rent comes from real room listings, which is a good start. But an asking rent is what a room hopes for, not what it filled at, and listings mix private and shared baths. Keep the rooms that actually filled, split them by bath type, and price each of your rooms from its own group.
         note under it: Tighten it. The evidence is partly there; the next step is the rooms near the house.
      [Rent Evidence Advanced] Your rent comes from rooms nearby that filled, which is the evidence most first deals skip. Keep it current, because rents move with new supply and the seasons. Before the offer, check that your comps sit near the house and match each room's bath type and size.
         note under it: Protect it. Recheck it before the offer, because rents and supply keep moving.
   Fill Speed:
      [Fill Speed Beginner] You don't know how fast rooms fill near the house, so your lease-up months are a guess. The costs start on day one, and the rent arrives room by room. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. Watching real rooms nearby can.
         note under it: Start here. This is where your plan borrows the most, and it can be checked before an offer.
      [Fill Speed Intermediate] You have a sense of how rooms fill, from stories, forums or a market report. Those describe a market, not the street the house is on, and rooms a few miles apart can fill at different speeds. Check how comparable rooms near the house filled, and set your lease-up months from that.
         note under it: Tighten it. The evidence is partly there; the next step is the rooms near the house.
      [Fill Speed Advanced] Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months, and the reserves sized from them, something you can defend. Watch the month you launch in: the same room can fill faster or slower depending on the season.
         note under it: Protect it. Recheck it before the offer, because rents and supply keep moving.
   Nearby Supply:
      [Nearby Supply Beginner] You don't know how many co-living homes compete near the house. Supply nearby decides how hard your rooms will be to fill and what they can ask. A street with many open rooms and falling rents needs a different plan from one with a few full homes. Count it before you buy.
         note under it: Start here. This is where your plan borrows the most, and it can be checked before an offer.
      [Nearby Supply Intermediate] You've counted the listings, which many first-time buyers never do. A count doesn't say how full those homes are, or whether more are opening. Note the open rooms in each home, and any new listings or rent cuts. That tells you whether the pocket is filling up or already crowded.
         note under it: Tighten it. The evidence is partly there; the next step is the rooms near the house.
      [Nearby Supply Advanced] You know the competition: how many homes, and roughly how full they are. Keep watching, because supply keeps changing after you buy. New homes opening nearby, or rooms cutting their rents, are the early signs to adjust your plan.
         note under it: Protect it. Recheck it before the offer, because rents and supply keep moving.
   Room Mix:
      [Room Mix Beginner] You haven't priced the bath mix yet. Private-bath and shared-bath rooms rent and fill differently, so two houses with the same bedroom count can earn very different money. Deciding the mix before you see those spreads is guessing at the biggest lever you control. Compare private and shared-bath rents nearby before you plan any work.
         note under it: Start here. This is where your plan borrows the most, and it can be checked before an offer.
      [Room Mix Intermediate] You've made a call on the bathrooms, but not from the rooms nearby. Adding a bath because it seems worth it, or keeping the ones you have, can both be right. The rents of private and shared-bath rooms nearby tell you which. Price the house both ways before you book the work.
         note under it: Tighten it. The evidence is partly there; the next step is the rooms near the house.
      [Room Mix Advanced] Your bath mix comes from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. Before the offer, check that the room count also fits the city's rule on unrelated adults sharing a home.
         note under it: Protect it. Recheck it before the offer, because rents and supply keep moving.
   Lease-up Reserves:
      [Lease-up Reserves Beginner] You haven't planned for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. Cutting rents is the usual reflex, and a cut room keeps the lower rent after it fills. Size your reserves from how comparable launches nearby filled, before you make the offer.
         note under it: Start here. This is where your plan borrows the most, and it can be checked before an offer.
      [Lease-up Reserves Intermediate] You have some reserves, but they aren't sized from evidence. A few weeks may cover a quick lease-up and not a slow one. Work out your monthly carrying cost, multiply it by the months lease-up could take, and set the reserves from that number.
         note under it: Tighten it. The evidence is partly there; the next step is the rooms near the house.
      [Lease-up Reserves Advanced] Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. Keep a slower case in your deal math. Revisit it whenever rents or supply near the house change.
         note under it: Protect it. Recheck it before the offer, because rents and supply keep moving.

6. THREE CHECKS ROOMIQ CAN'T DO FOR YOU: small sections in this order
   6a (everyone) heading: Three checks RoomIQ can't do for you | lead: RoomIQ shows the evidence for the house. These three decide whether the plan is allowed, financed and insured. | subheading: 1. The city's rule on unrelated adults
   6b (audience: Market: Dallas-Fort Worth) Dallas allows a household of no more than four people unrelated to the head of the household (Dallas code §51A-2.102(36)). Fort Worth allows no more than five unrelated people as one housekeeping unit, and renting rooms separately may count as a different use (Fort Worth code §9.101). Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Houston) Houston: lodging three or more people unrelated to the owner makes a lodging facility, which needs a permit (Houston code §28-601 and following). No citywide cap on unrelated adults was found. Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Atlanta) Atlanta: no more than six people may live together unless all are related, with exceptions for roomers and boarders (Atlanta code §16-29.001(10)(b)). Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Orlando) Orlando publishes no cap on unrelated adults that the research found (Land Development Code, Chapter 58). Confirm it with the City's zoning office. Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Jacksonville) Jacksonville: no household of more than five people unless all are related (Jacksonville code §656.1601). Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Phoenix) Phoenix: no more than five people, who need not be related, as one housekeeping unit. Six or more paying to live there make a boarding house (Phoenix zoning ordinance §202). Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Las Vegas) Las Vegas: no more than four unrelated people as one housekeeping unit; the text the research found may be dated (Las Vegas code §19.20.020). Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Another US market) Rules on unrelated adults sharing a home differ by city, and some cities treat renting rooms separately as a different use. Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6b (audience: Market: Not decided yet) Rules on unrelated adults sharing a home differ by city. Check the rule for every market on your shortlist. Read the rule in the city code, then confirm it for the address with the city or an attorney.
   6c (everyone) subheading: 2. Financing on room income | Many loans are sized on the appraised whole-house rent, not on room rents. Talk early to a lender who knows room rentals, and bring your rent per room with the rooms behind it.
      subheading: 3. Insurance for renting by the room | Insurance is not a given: some insurers decline homes rented by the room. Get a quote that covers renting by the room before you make the offer.
   6d (audience: Market: Dallas-Fort Worth) The one rent-by-the-room insurance program the research found excludes the Dallas-Fort Worth counties.
   6d (audience: Market: Houston) The one rent-by-the-room insurance program the research found excludes Houston.
   6e (everyone) small print: As each city's code publishes it, checked in November 2026. Not legal, lending or insurance advice.

7. YOUR FIRST STEP: four small sections, exactly one shows for each person (the tier's first step, from the GTM)
   7a (score level: overall Beginner) heading: Your report | body: Your full report is on its way to your inbox as a PDF. Open it here any time: your score, your first six months, three checks outside RoomIQ, the method and a 30-day plan. | button: Open my report | link: the PDF report link
   7b (audience: Intermediate, covered market) heading: Run a free forecast on your address | body: Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby, with its formula, its comps and how sure it is. Free plan: no card needed, three forecasts a month. | button: Run my free forecast | link: the forecast link
   7c (audience: Intermediate, outside covered markets) heading: Look up the evidence in your market | body: Look up any US city, ZIP or metro in RoomIQ and see how strong the evidence is for each. A coverage check runs before any estimate. | button: Look up my market | link: https://roomiq.io
   7d (score level: overall Advanced) heading: Book a 20-minute walkthrough | body: Bring an address. We'll run the forecast on it together and read what the evidence covers, and what it doesn't. Pick a day and a time window. | button: Pick a time | link: the booking link

8. EVERY NEXT STEP (cards side by side or stacked, no heading; one of them repeats the first step on purpose)
   8a (everyone) heading: Your report | body: Your full report is on its way to your inbox as a PDF. Open it here any time: your score, your first six months, three checks outside RoomIQ, the method and a 30-day plan. | button: Open my report | link: the PDF report link; second button: Download the PDF (the same link)
   8b (audience: Covered market) heading: Run a free forecast on your address | body: Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby, with its formula, its comps and how sure it is. Free plan: no card needed, three forecasts a month. | button: Run my free forecast | link: the forecast link
   8c (audience: Outside covered markets) heading: Look up the evidence in your market | body: Look up any US city, ZIP or metro in RoomIQ and see how strong the evidence is for each. A coverage check runs before any estimate. | button: Look up my market | link: https://roomiq.io
   8d (everyone) heading: Book a 20-minute walkthrough | body: Bring an address. We'll run the forecast on it together and read what the evidence covers, and what it doesn't. Pick a day and a time window. | button: Pick a time | link: the booking link
   8e (everyone) heading: See how RoomIQ shows its working | body: Every RoomIQ estimate prints its formula, its comps and how sure it is, and thin evidence is labeled Thin. See it on demo data first. | button: See how RoomIQ works | link: https://roomiq.io

9. FOOTER (everyone)
   Zoning, financing and insurance sit outside RoomIQ. This is not legal, lending or financial advice.
   RoomIQ is room-by-room underwriting for rent-by-the-room investors. The houses in our pictures and examples are made up.
   links: Terms (https://roomiq.io/terms), Privacy (https://roomiq.io/privacy), Privacy choices (https://roomiq.io/privacy)
</sections>

<links>
the PDF report link: https://<your scorecard domain>/results/{result_key}/pdf
the forecast link: https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=results&utm_campaign=roomiq-first-deal
the booking link: [[TBD: your booking page link, for example a Calendly event]]
</links>

<self_check>Before you finish, list: the sections in order; for each, who sees it (everyone, score level, or which
audience) and which versions it holds; every link; anything you could not set up exactly as asked; any text you did
not take from this message (there should be none).</self_check>
```

### 4.3 Prompt 4B: the "Your first six months" Smart Section

Turn section 3 into a **Smart Section** (Business or Pro) and paste this as its prompt. Then **Generate Example**, and
compare the output with Appendix B for a few answer combinations. Smart Sections send the answers and scores to
ScoreApp's AI provider, never the name or email, and spend about 1/20 of an AI credit per respondent.

```text
<role>
You write one short passage on a scorecard's results page. You compute it from three of the respondent's answers,
following the rules below exactly. You do not advise, predict, encourage or add anything.
</role>

<inputs>
You receive the respondent's answers. Use only these three:
A = the answer to "About what will the house cost you each month before rent comes in?"
B = the answer to "How long do you expect the rooms to take to fill?"
C = the answer to "If no rent came in, how many months of costs could your reserves carry?"
</inputs>

<lookup>
A -> COST (the monthly cost used, the low end of the range):
"Under $2,000" -> $1,000
"$2,000 to $3,000" -> $2,000
"$3,000 to $4,000" -> $3,000
"More than $4,000" -> $4,000
"Not sure yet" -> unknown
B -> FILL (months):
"About a month" -> 1
"About 2 months" -> 2
"About 3 months" -> 3
"4 months or more" -> 4
"Not sure" -> unknown
C -> RESERVES (months, the high end of the range):
"None set aside yet" -> 0
"1 month or less" -> 1
"2 to 3 months" -> 3
"4 to 5 months" -> 5
"6 months or more" -> 6
"Not sure" -> unknown
</lookup>

<procedure>
1. If COST is unknown:
   - if FILL or RESERVES is unknown, the variant is NONE;
   - otherwise UNCOVERED = FILL - RESERVES if positive, else 0. If UNCOVERED > 0 the variant is MONTHS_SHORT, else
     MONTHS_COVERED (SPARE = RESERVES - FILL).
2. Else, if FILL is unknown, the variant is PER_MONTH.
3. Else, if RESERVES is unknown, the variant is COST_ONLY, with EXPOSURE = COST × FILL.
4. Else EXPOSURE = COST × FILL, UNCOVERED = max(0, FILL - RESERVES), SPARE = max(0, RESERVES - FILL),
   GAP = COST × UNCOVERED. If UNCOVERED > 0 the variant is GAP; else if SPARE > 0 it is COVERED; else EXACT.
</procedure>

<formatting>
- Money: a dollar sign and whole dollars with comma thousands: $1,000, $4,000, $12,000.
- Months: 1 is written "1 month"; any other number n is written "n months" (for example "0 months", "3 months").
- In the templates, {COST}, {EXPOSURE} and {GAP} are money; {FILL}, {RESERVES}, {UNCOVERED} and {SPARE} are months.
</formatting>

<templates>
GAP
  line 1: At your numbers, your reserves run out {UNCOVERED} before the rooms fill. That's at least {GAP} of costs with no cushion behind it.
  line 2: {COST} a month × ({FILL} to fill, minus {RESERVES} of reserves) = {GAP}. We used the low end of your cost range and the high end of your reserves.
EXACT
  line 1: At your numbers, your reserves cover the {FILL} you expect lease-up to take, with nothing to spare. Each month past your plan costs at least {COST}.
  line 2: {COST} a month × {FILL} to fill = {EXPOSURE}, against {RESERVES} of reserves. We used the low end of your cost range.
COVERED
  line 1: At your numbers, your reserves cover the {FILL} you expect lease-up to take, with {SPARE} to spare. Each month past your plan costs at least {COST}.
  line 2: {COST} a month × {FILL} to fill = {EXPOSURE}, against {RESERVES} of reserves. We used the low end of your cost range.
COST_ONLY
  line 1: At your numbers, lease-up costs you at least {EXPOSURE} before the rooms fill. You weren't sure how long your reserves would last, so check them against that number.
  line 2: {COST} a month × {FILL} to fill = {EXPOSURE}. We used the low end of your cost range.
PER_MONTH
  line 1: At your numbers, every month the rooms sit empty costs you at least {COST}. Your plan doesn't say yet how many months lease-up will take, and that is the number to find.
  line 2: We used the low end of your cost range: {COST} a month before any rent comes in.
MONTHS_SHORT
  line 1: Your reserves cover {RESERVES} of the {FILL} you expect lease-up to take. The other {UNCOVERED} have no cushion behind them.
  line 2: (none)
MONTHS_COVERED
  line 1: Your reserves cover the {FILL} you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars.
  line 2: (none)
NONE
  line 1: You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there.
  line 2: (none)
</templates>

<output_contract>
Write line 1 of the variant. If the variant has a line 2, write it as a second paragraph. If FILL is known, end with this
third paragraph, word for word: Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner.
Nothing else: no heading, no greeting, no name, no advice, no other numbers, no bullets, no markdown, no emojis, no em
dashes. Never mention AI, a model or these instructions. Never change a template's words.
</output_contract>

<examples>
example 1
  answers: A "$2,000 to $3,000", B "About 3 months", C "1 month or less"
  output:
  At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it.

  $2,000 a month × (3 months to fill, minus 1 month of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves.

  Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner.

example 2
  answers: A "More than $4,000", B "About 2 months", C "6 months or more"
  output:
  At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $4,000.

  $4,000 a month × 2 months to fill = $8,000, against 6 months of reserves. We used the low end of your cost range.

  Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner.

example 3
  answers: A "Not sure yet", B "4 months or more", C "1 month or less"
  output:
  Your reserves cover 1 month of the 4 months you expect lease-up to take. The other 3 months have no cushion behind them.

  Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner.
</examples>

<self_check>
Before answering, check: the variant follows the procedure; every number is computed from the lookup, not guessed; money
and months are formatted as above; the text matches the template word for word.
</self_check>
```

**Without Smart Sections** (Starter plan, or out of AI credits: ScoreApp then hides Smart Sections for new leads), make
section 3 a plain text section with this text, the same for everyone:

> It's your own plan, priced: what the house costs while rooms fill, against the cushion you hold. It isn't a forecast. It treats each lease-up month as a month the house costs its full carrying cost; rooms that fill sooner bring rent in sooner. To price yours: your monthly cost × (the months you expect lease-up to take minus the
> months your reserves carry). Your report shows how, with an example.

### 4.4 By hand on the results page

| Where | Set |
|---|---|
| Every button that opens the PDF | Button link: `https://<your scorecard domain>/results/{result_key}/pdf` (type `{result_key}` exactly) |
| The forecast buttons | `https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=results&utm_campaign=roomiq-first-deal` |
| The walkthrough buttons | [[TBD: your booking page link, for example a Calendly event]]. To embed the calendar instead (Business): a section with the booking tool's iframe, its link ending `?firstName={first_name}&lastName={last_name}&email={email}` so the form arrives filled |
| The booking tool's event | Name: RoomIQ: your 20-minute walkthrough. Length: 20 minutes. Description: A 20-minute walkthrough with RoomIQ on your address and your First Deal Risk Scorecard. We'll email you a video link. Ask for the phone (label: Best number to reach you) with its own unticked consent (RoomIQ may call me at this number about my walkthrough.) and the address (The house's address, if you have one (optional)). Days: the next 5 business days, never the same day. Windows: Morning, 8 to 11 am; Midday, 11 am to 2 pm; Afternoon, 2 to 5 pm, in the visitor's time |
| Each personalised section | Open every tier's version and check its text (the editor shows one tier at a time; the bar at the bottom shows them all) |
| Section 2 and the cards | Display Options: Percent |
| Prefer the manual builder? | Create Result Page, Dynamic result page, with the same text: an Individual Category section set to Display Lowest with Dynamic Content on replaces the six Fix first sections, and Individual Category sections with Dynamic Content replace the score-level copies of the five cards. Make it the default page |
| Publish | Publish the page (this publishes the page, not the scorecard) |

## Stage 5. PDF report (by hand)

**PDF Reports, Create PDF report, Start without a template.** Defaults: US Letter if offered; header with the RoomIQ
mark (`brand/assets/logo/`), footer "The First Deal Risk Scorecard Report" and the page number; fonts Bricolage Grotesque and
Instrument Sans (Brand Kit, custom fonts `src/assets/fonts/`); ink #03045E, accent #00B4D8.
Build the pages below in order, then **Publish** and **Set as default**. Category pages and the overall score page need
"Enable dynamic content" on, with one version per tier.

### 5.1 Page plan

| Page | What | Type | Changes with |
|---|---|---|---|
| 1 | Front cover | Front cover | Static. |
| 2 | A note before you read | General content | Static, with merge fields. |
| 3 | Your Report Overview | Category summary (the five category scores) | Static text; the scores fill themselves. |
| 4 | Your First Six Months | General content | Static. Each reader's own figure is on their results page (Smart Section). |
| 5 | Three checks RoomIQ can't do for you | General content | Static: every preset city. |
| 6 | Your Overall Score | Overall score | Dynamic content on: one version per tier. |
| 7 | Your strongest area | Highest category page | One version per category; the reader sees their highest. |
| 8 | Your weakest area | Lowest category page | One version per category; the reader sees their lowest. If your plan lets the lowest page follow that category's tier, use the "refinement" heading for Advanced. |
| 9 | What an evidence-first underwrite looks like | General content | Static. |
| 10 | Step 1: Price each room | Category page (Rent Evidence) | Dynamic content on: one version per tier of this category. |
| 11 | Step 2: Time the fill | Category page (Fill Speed) | Dynamic content on: one version per tier of this category. |
| 12 | Step 3: Count the competition | Category page (Nearby Supply) | Dynamic content on: one version per tier of this category. |
| 13 | Step 4: Price the bath mix | Category page (Room Mix) | Dynamic content on: one version per tier of this category. |
| 14 | Step 5: Size the cushion | Category page (Lease-up Reserves) | Dynamic content on: one version per tier of this category. |
| 15 | Two ways to run the method | General content | Static. |
| 16 | Your first 30 days with RoomIQ | General content | Static. |
| 17 | Your Room-by-Room Underwrite Starts Here | General content | Static, with one merge field. |
| 18 | Rent Evidence: The Ten-Room Rent Check | General content | Static. |
| 19 | Rent Evidence: The Ten-Room Rent Check, continued | General content | Static. |
| 20 | Fill Speed: The Two-Week Fill Watch | General content | Static. |
| 21 | Fill Speed: The Two-Week Fill Watch, continued | General content | Static. |
| 22 | Nearby Supply: The Three-Mile Count | General content | Static. |
| 23 | Nearby Supply: The Three-Mile Count, continued | General content | Static. |
| 24 | Room Mix: The Bath Mix Test | General content | Static. |
| 25 | Room Mix: The Bath Mix Test, continued | General content | Static. |
| 26 | Lease-up Reserves: The Slow Lease-up Test | General content | Static. |
| 27 | Lease-up Reserves: The Slow Lease-up Test, continued | General content | Static. |
| 28 | Your 30-Day Timeline | General content | Static. |
| 29 | Quick Start: 5 Things to Do This Week | General content | Static. |
| 30 | Implementation Checklists | General content | Static (one or two pages). |
| 31 | Weekly Tracking Dashboard | General content | Static. The reader writes their starting point from their area scores (0 to 39 is 1 or 2, 40 to 69 is 3, 70 and above is 4 or 5). |
| 32 | Your Next Step | Call to action | Static, with one merge field. |

### 5.2 The pages

#### Page 1. Front cover

*Page type: Front cover. Static.*

| Field | Exact text |
|---|---|
| Title | The First Deal Risk Scorecard Report |
| Subtitle | How much of the plan for your first deal rests on evidence you can check, scored across five areas, with your first six months priced from your own numbers. |
| Prepared for | Prepared for |
| Name | {first_name} |
| Date | The report date (ScoreApp's date field) |
| Picture | The neighborhood illustration (`src/assets/img/neighborhood-1280.webp`) |


#### Page 2. A note before you read

*Page type: General content. Static, with merge fields.*

*Before you start*

## A note before you read

Thank you for taking the First Deal Risk Scorecard, {first_name}. Everything in this report comes from your own answers.

Read the page on [[MERGE: Lowest category name]] first: it's where your plan borrows the most.

The Room-by-Room Underwrite in the middle of this report is how borrowed numbers become evidence. Run it by hand with the 30-day plan, or with RoomIQ's Free plan.

The RoomIQ team

### In this report

1. Your First Six Months: your lease-up gap, from your own numbers
2. Three Checks RoomIQ Can't Do for You: zoning, financing and insurance
3. Your Overall Score: your five areas, and what they mean
4. Your strongest and weakest areas, with what to do this week
5. The Room-by-Room Underwrite: five steps, and where you stand on each
6. Two ways to run it, and your first 30 days with RoomIQ
7. The 30-day plan: a guide for each area, checklists and a weekly tracker
8. Your next step

#### Page 3. Your Report Overview

*Page type: Category summary (the five category scores). Static text; the scores fill themselves.*

## Thank you for taking the First Deal Risk Scorecard

Your report scores your plan in the five areas below. A low score isn't a verdict on the deal: it means a number is borrowed, and borrowed numbers can be checked before an offer. A high score means the plan rests on evidence. Next come your Deal Readiness Score and your first six months. Next come your Deal Readiness Score, your first six months and three checks RoomIQ can't do for you. Then your strongest and weakest areas, the Room-by-Room Underwrite that closes the gaps, how to run it with RoomIQ's Free plan, and a 30-day plan you can run by hand.

### Your five areas

| Area | What it measures |
|---|---|
| Rent Evidence | Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess. |
| Fill Speed | Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from an assumed vacancy rate. |
| Nearby Supply | Checks whether you know how many co-living homes compete within about 3 miles, how full they are, and what's new. |
| Room Mix | Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or decided on a hunch. |
| Lease-up Reserves | Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches nearby filled. |


#### Page 4. Your First Six Months

*Page type: General content. Static. Each reader's own figure is on their results page (Smart Section).*

## Your First Six Months

Your lease-up gap is your own plan, priced: what the house costs while rooms fill, against the cushion you hold.

**The formula:** monthly cost × (the months you expect lease-up to take minus the months your reserves carry). Costs at the low end of your range and reserves at the high end, so the real figure is at least this large.

| Your answer to "About what will the house cost you each month before rent comes in?" | Monthly cost used |
|---|---|
| Under $2,000 | $1,000 |
| $2,000 to $3,000 | $2,000 |
| $3,000 to $4,000 | $3,000 |
| More than $4,000 | $4,000 |
| Not sure yet | Work it out first |

| Your answer to "How long do you expect the rooms to take to fill?" | Lease-up months |
|---|---|
| About a month | 1 |
| About 2 months | 2 |
| About 3 months | 3 |
| 4 months or more | 4 |
| Not sure | Find this number |

| Your answer to "If no rent came in, how many months of costs could your reserves carry?" | Reserve months |
|---|---|
| None set aside yet | 0 |
| 1 month or less | 1 |
| 2 to 3 months | 3 |
| 4 to 5 months | 5 |
| 6 months or more | 6 |
| Not sure | Count them |

**An example, made up:** Jordan expects a house costing $2,000 to $3,000 a month, about 3 months to fill, and reserves of 1 month or less. At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. $2,000 a month × (3 months to fill, minus 1 month of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves.

**The slower case.** Double the lease-up months and price it again: a slow start is a plan, not a surprise.

**What this number is, and what it isn't.** It's your own plan, priced: what the house costs while rooms fill, against the cushion you hold. It isn't a forecast. It treats each lease-up month as a month the house costs its full carrying cost; rooms that fill sooner bring rent in sooner.

#### Page 5. Three checks RoomIQ can't do for you

*Page type: General content. Static: every preset city.*

## Three checks RoomIQ can't do for you

RoomIQ shows the evidence for the house. These three decide whether the plan is allowed, financed and insured.

### 1. The city's rule on unrelated adults

| Market | The rule as the city's code publishes it |
|---|---|
| Dallas-Fort Worth | Dallas allows a household of no more than four people unrelated to the head of the household (Dallas code §51A-2.102(36)). Fort Worth allows no more than five unrelated people as one housekeeping unit, and renting rooms separately may count as a different use (Fort Worth code §9.101). |
| Houston | Houston: lodging three or more people unrelated to the owner makes a lodging facility, which needs a permit (Houston code §28-601 and following). No citywide cap on unrelated adults was found. |
| Atlanta | Atlanta: no more than six people may live together unless all are related, with exceptions for roomers and boarders (Atlanta code §16-29.001(10)(b)). |
| Orlando | Orlando publishes no cap on unrelated adults that the research found (Land Development Code, Chapter 58). Confirm it with the City's zoning office. |
| Jacksonville | Jacksonville: no household of more than five people unless all are related (Jacksonville code §656.1601). |
| Phoenix | Phoenix: no more than five people, who need not be related, as one housekeeping unit. Six or more paying to live there make a boarding house (Phoenix zoning ordinance §202). |
| Las Vegas | Las Vegas: no more than four unrelated people as one housekeeping unit; the text the research found may be dated (Las Vegas code §19.20.020). |
| Another market | Rules on unrelated adults sharing a home differ by city, and some cities treat renting rooms separately as a different use. |

**Read the rule in the city code, then confirm it for the address with the city or an attorney.**

### 2. Financing on room income

Many loans are sized on the appraised whole-house rent, not on room rents.

**Talk early to a lender who knows room rentals, and bring your rent per room with the rooms behind it.**

### 3. Insurance for renting by the room

Insurance is not a given: some insurers decline homes rented by the room. The one rent-by-the-room insurance program the research found excludes the Dallas-Fort Worth counties. The one rent-by-the-room insurance program the research found excludes Houston.

**Get a quote that covers renting by the room before you make the offer.**

*As each city's code publishes it, checked in November 2026. Not legal, lending or insurance advice.*

#### Page 6. Your Overall Score

*Page type: Overall score. Dynamic content on: one version per tier.*

Your Deal Readiness Score is the average of your five area scores, each out of 100. It measures how much of your plan rests on evidence you can check, not the house, the market or what the deal will return. Under 40, the plan leans on borrowed numbers. From 40 to 69, part of it rests on evidence. At 70 and above, the plan rests on evidence, and the open question is whether it holds for this address.

| Tier | Label under the score | Interpretation |
|---|---|---|
| Beginner | Beginner: underwriting on assumptions. Your numbers lean on estimates more than evidence. | Your plan leans on estimates more than evidence. That's normal for a first deal, and it's fixable before the offer. The rent per room and the fill time are the numbers every other one rests on, and right now at least one of them is borrowed. Start with [[MERGE: Lowest category name]], follow the 30-day plan from day one, and take the scorecard again on day 30. |
| Intermediate | Intermediate: partial evidence. You have part of the picture. | You have part of the picture. Some of your numbers rest on evidence, and the gaps left are the ones that decide whether rooms fill. Your lowest area, [[MERGE: Lowest category name]], is where to start. Close it before the offer, and your next score will show it. |
| Advanced | Advanced: evidence-ready. You underwrite like an operator. | You underwrite like an operator: your numbers rest on evidence most first deals skip. The open question is whether that evidence holds for this specific address. Recheck rents, fill speed and supply the week you make the offer, and keep the slower case in your deal math. |


#### Page 7. Your strongest area

*Page type: Highest category page. One version per category; the reader sees their highest.*

### If the highest is Rent Evidence

## Your Rent Evidence Is Your Strongest Asset

**What This Means**

Your rent per room comes from rooms nearby that filled. That's the evidence most first deals skip, and every other number in the plan rests on it.

- Your rent comes from rooms near the house, not a calculator
- Rooms are priced by bath type and size
- Only rooms that actually filled count
- You can show the rooms your rent rests on

**Your Immediate Next Step**

Rents move with new supply and the seasons. Keep the evidence current.

- Recheck five rooms near the house once a month
- Recheck the whole list the week you make the offer
- Keep the asking rents apart from the rooms that filled

**Why It Matters for the Deal**

Rent is upstream of everything else in the plan. Because yours rests on evidence, the deal math and the reserves have something real to work with.

- Your cash flow starts from rents the street supports
- Your bath mix can be priced from the same list
- A lender or partner can see what the rent rests on

### If the highest is Fill Speed

## Your Fill Speed Is Your Strongest Asset

**What This Means**

Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months something you can defend.

- Your lease-up months come from rooms you watched or checked
- Occupancy comes from comparable rooms, not a rule of thumb
- Your launch month follows the seasons
- A slow lease-up is in the plan, not a surprise

**Your Immediate Next Step**

Fill speed changes with the season and with new supply. Recheck it before the offer.

- Recheck a few rooms nearby before the offer
- Keep a slower case beside your plan
- Note which months rooms fill fastest

**Why It Matters for the Deal**

Your first months are when the costs run before the rent does: the costs start on day one, and rent arrives room by room. Knowing the fill speed makes that stretch plannable.

- Your reserves can be sized from evidence
- Your launch can be timed to the faster months
- Your deal math starts from observed occupancy

### If the highest is Nearby Supply

## Your Read on Nearby Supply Is Your Strongest Asset

**What This Means**

You know the competition: how many co-living homes compete within about 3 miles, and roughly how full they are.

- You counted the homes near the house
- You know roughly how many rooms are open
- You watch for new homes and rent cuts
- You can tell a busy pocket from a crowded one

**Your Immediate Next Step**

Supply keeps changing after you buy. Keep the count current.

- Count again once a month
- Note new homes and rent cuts
- Count again the week you make the offer

**Why It Matters for the Deal**

Supply sets how hard rooms are to fill and what they can ask. Because you know it, your rent and fill plans rest on the street as it is.

- Your rent is set against real competition
- Your lease-up months account for the open rooms nearby
- You get early warning when the pocket gets crowded

### If the highest is Room Mix

## Your Room Mix Is Your Strongest Asset

**What This Means**

Your bath mix and room count come from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess.

- The bath mix is priced from rooms nearby
- The house is priced both ways before any work
- The room count is checked against rents nearby
- The garage or extra space is priced both ways

**Your Immediate Next Step**

Before the offer, check the room count against the city's rule too.

- Read the city's rule on unrelated adults sharing a home
- Get a quote before you book any work
- Recheck private and shared-bath rents before the offer

**Why It Matters for the Deal**

Private-bath supply and shared-bath pressure are structural revenue drivers. Because your mix is priced from evidence, the biggest lever in the plan rests on rooms you can show.

- Two houses with the same bedrooms can earn very different money, and yours is priced
- Work gets booked for what pays, not for what seems worth it
- The forecast can be run with the mix you plan

### If the highest is Lease-up Reserves

## Your Lease-up Reserves Are Your Strongest Asset

**What This Means**

Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan.

- Reserves are sized in months of cost
- A slower lease-up is in the plan
- The deal math runs on your own costs and rooms nearby
- Empty rooms are counted once

**Your Immediate Next Step**

Keep the cushion honest as the plan changes.

- Rerun the slower case when rents or supply change
- Keep the reserves apart from the money for the work
- Check the cushion monthly until the rooms are full

**Why It Matters for the Deal**

A sized cushion makes a slow lease-up part of the plan instead of a surprise.

- Your plan has room to hold rents while rooms fill, instead of cutting them first
- A lender or partner can see the cushion and what it rests on
- The first six months are planned, month by month

#### Page 8. Your weakest area

*Page type: Lowest category page. One version per category; the reader sees their lowest. If your plan lets the lowest page follow that category's tier, use the "refinement" heading for Advanced.*

### If the lowest is Rent Evidence

## Your Rent Evidence Has the Most Room to Grow

*Heading when this area is Advanced: Your Rent Evidence Is Your Next Refinement*

**This is the first thing to fix, before you make an offer.**

**What This Means**

Your rent per room is borrowed: a guess, a calculator, a whole-home rent split by bedrooms, or asking rents. Every figure after it inherits the guess.

- The rent doesn't come from rooms near the house that filled
- Every room may have the same rent, whatever its bath
- Asking rents are counted as rents
- Nobody can say how many rooms the number rests on

**Your Immediate Next Step**

This week, build a list of ten rooms near the house, by bath type and size.

- List ten rooms for rent within about 3 miles
- Note each weekly rent, bath type and room size
- Split them by bath type and note the middle rent of each group
- Recheck in two weeks and keep the rooms that filled

**Why It Matters for the Deal**

Rent is upstream of everything. Fix it and the bath mix, the deal math and the reserves have evidence to work with.

- A guessed rent inflates the cash flow, the deal math and the offer
- A rent the street supports is the base the rest of the plan needs
- It's fixable this week: the rooms are listed near the house right now

### If the lowest is Fill Speed

## Your Fill Speed Has the Most Room to Grow

*Heading when this area is Advanced: Your Fill Speed Is Your Next Refinement*

**This is the first thing to fix, before you make an offer.**

**What This Means**

You don't know how fast rooms fill near the house, so your lease-up months are a guess. An assumed vacancy rate can't tell you whether filling takes three weeks or three months.

- Lease-up months are a hope, not a count
- Occupancy is a rule of thumb or an average
- The launch month is whenever the work ends
- A slow lease-up isn't in the plan

**Your Immediate Next Step**

This week, start a two-week fill watch on rooms like yours.

- Pick five room listings near the house with the bath types you plan
- Check every few days which ones are still listed
- Note any rent cuts
- After two weeks, set your lease-up months from what filled

**Why It Matters for the Deal**

Fill speed decides your first months of cash flow. Fix it and your reserves can be sized from evidence.

- Your reserves are only as good as the lease-up months behind them
- It's fixable in two weeks of watching rooms near the house
- Every month lease-up runs long costs the full monthly carrying cost

### If the lowest is Nearby Supply

## Your Read on Nearby Supply Has the Most Room to Grow

*Heading when this area is Advanced: Your Read on Nearby Supply Is Your Next Refinement*

**This is the first thing to fix, before you make an offer.**

**What This Means**

You don't know how many co-living homes compete near the house, or how full they are. Supply nearby decides how hard your rooms will be to fill and what they can ask.

- Nobody counted the co-living homes within about 3 miles
- There's no read on how many rooms are open
- New homes and rent cuts nearby go unnoticed
- A crowded pocket can look like a busy one

**Your Immediate Next Step**

This week, count the competition within about 3 miles.

- List every co-living home with rooms for rent within about 3 miles
- Note how many rooms each has open
- Note any new homes and rent cuts
- Write down your read, with the date

**Why It Matters for the Deal**

Supply sets the ceiling on rent and the pace of the fill. Fix it and your rent and lease-up plans rest on the street as it is.

- Many open rooms nearby mean a lower rent or a slower lease-up
- Few open rooms and steady rents leave room for one more home
- It's fixable in an afternoon of counting

### If the lowest is Room Mix

## Your Room Mix Has the Most Room to Grow

*Heading when this area is Advanced: Your Room Mix Is Your Next Refinement*

**This is the first thing to fix, before you make an offer.**

Your Room Mix score follows from your Rent Evidence and Fill Speed scores: a bath mix is priced from what rooms rent for and how fast they fill, by bath type. If either of those two scored under 75, start with its page and its guide.

**What This Means**

Your bath mix and room count aren't priced from rooms nearby yet. Private-bath and shared-bath rooms rent and fill differently, so the mix is the biggest lever you control.

- The bath mix isn't decided, or was decided on a hunch
- The house hasn't been priced both ways
- The room count isn't checked against the city's rule
- The garage or extra space isn't priced both ways

**Your Immediate Next Step**

This week, price the house both ways from rooms nearby.

- Note the middle weekly rent of private-bath and shared-bath rooms nearby
- Weekly rent × rooms × 4.35 for the house as it is
- The same with one more private bath
- Get a quote before you decide on any work

**Why It Matters for the Deal**

The room mix multiplies every rent in the plan. Fix it and the work you book is work that pays for itself in rent.

- Two houses with the same bedrooms can earn very different money
- A bathroom added on a hunch can cost more than it brings in
- It's fixable before the offer, from the rent list you already need

### If the lowest is Lease-up Reserves

## Your Lease-up Reserves Have the Most Room to Grow

*Heading when this area is Advanced: Your Lease-up Reserves Are Your Next Refinement*

**This is the first thing to fix, before you make an offer.**

Your Lease-up Reserves score follows from your Rent Evidence and Fill Speed scores: reserves can only be sized once you know what rooms rent for and how fast they fill. If either of those two scored under 75, start with its page and its guide.

**What This Means**

Your reserves and deal math aren't sized for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't.

- Reserves are a few weeks, or not planned
- The plan for a slow start is cutting rents
- The deal math runs on defaults or estimates
- There's no slower case beside the plan

**Your Immediate Next Step**

This week, size the cushion from your own numbers.

- Write down your monthly carrying cost
- Set your lease-up months, and a slower case twice as long
- Multiply: monthly cost × the slower case's months
- Compare it with the cash you'll hold after the down payment and the work

**Why It Matters for the Deal**

The cushion decides whether a slow start is a plan or a scramble. Fix it and the first six months are planned, month by month.

- A room cut to fill faster keeps the lower rent after it fills
- It's fixable before the offer: it's arithmetic on numbers you already have
- Every month your reserves don't cover gets paid from somewhere else

#### Page 9. What an evidence-first underwrite looks like

*Page type: General content. Static.*

*The Room-by-Room Underwrite*

## What an evidence-first underwrite looks like

A first deal goes wrong at the numbers nobody checked. The Room-by-Room Underwrite checks them in order, from the rent per room to the cushion, so every number in the offer rests on evidence you can check.

### Five steps, in this order

1. **Price each room** (Rent Evidence). A rent for each room from rooms nearby with the same bath type and size, kept to the rooms that actually filled.
2. **Time the fill** (Fill Speed). Lease-up months from how fast comparable rooms nearby filled, with a slower case, and a launch month timed to the seasons.
3. **Count the competition** (Nearby Supply). Every co-living home within about 3 miles counted, with its open rooms, new listings and rent cuts.
4. **Price the bath mix** (Room Mix). The bath mix and the room count priced from private and shared-bath rooms nearby, and checked against the city's rule.
5. **Size the cushion** (Lease-up Reserves). Reserves sized from the lease-up months the evidence supports, plus a slower case, with the deal math run on your own costs.

The order matters. The rent and the fill time are the numbers every other one rests on. The competition sets how hard rooms are to fill. The room mix is priced from rents and fill, and the cushion is sized from all of them.

**And one recheck before the offer.** Rents, fill speed and supply move with the seasons and with new homes. Recheck them the week you make the offer.

#### Page 10. Step 1: Price each room

*Page type: Category page (Rent Evidence). Dynamic content on: one version per tier of this category.*

*The Room-by-Room Underwrite: Where your plan stands on each step*

## Step 1: Price each room

| Tier | Chip | Where your plan stands |
|---|---|---|
| Beginner | Gap | Your rent per room is a borrowed number: a guess, a platform's calculator or a whole-home rent split by bedrooms. Every figure after it, from cash flow to reserves, inherits the guess. The fix is a short list of rooms near the house, by bath type, with how fast they filled. It's the first thing to check before an offer. |
| Intermediate | Partly there | Your rent comes from real room listings, which is a good start. But an asking rent is what a room hopes for, not what it filled at, and listings mix private and shared baths. Keep the rooms that actually filled, split them by bath type, and price each of your rooms from its own group. |
| Advanced | In place | Your rent comes from rooms nearby that filled, which is the evidence most first deals skip. Keep it current, because rents move with new supply and the seasons. Before the offer, check that your comps sit near the house and match each room's bath type and size. |

**The method's standard:** A rent for each room from rooms nearby with the same bath type and size, kept to the rooms that actually filled.

**What RoomIQ shows:** RoomIQ shows rent and occupancy split by bath type and size for comparable properties, and a revenue estimate for the address with its comps.

#### Page 11. Step 2: Time the fill

*Page type: Category page (Fill Speed). Dynamic content on: one version per tier of this category.*

*The Room-by-Room Underwrite: Where your plan stands on each step*

## Step 2: Time the fill

| Tier | Chip | Where your plan stands |
|---|---|---|
| Beginner | Gap | You don't know how fast rooms fill near the house, so your lease-up months are a guess. The costs start on day one, and the rent arrives room by room. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. Watching real rooms nearby can. |
| Intermediate | Partly there | You have a sense of how rooms fill, from stories, forums or a market report. Those describe a market, not the street the house is on, and rooms a few miles apart can fill at different speeds. Check how comparable rooms near the house filled, and set your lease-up months from that. |
| Advanced | In place | Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months, and the reserves sized from them, something you can defend. Watch the month you launch in: the same room can fill faster or slower depending on the season. |

**The method's standard:** Lease-up months from how fast comparable rooms nearby filled, with a slower case, and a launch month timed to the seasons.

**What RoomIQ shows:** RoomIQ shows observed occupancy over 7, 30 and 90-day windows for comparable properties, and when occupancy and fill speed peak in the market.

#### Page 12. Step 3: Count the competition

*Page type: Category page (Nearby Supply). Dynamic content on: one version per tier of this category.*

*The Room-by-Room Underwrite: Where your plan stands on each step*

## Step 3: Count the competition

| Tier | Chip | Where your plan stands |
|---|---|---|
| Beginner | Gap | You don't know how many co-living homes compete near the house. Supply nearby decides how hard your rooms will be to fill and what they can ask. A street with many open rooms and falling rents needs a different plan from one with a few full homes. Count it before you buy. |
| Intermediate | Partly there | You've counted the listings, which many first-time buyers never do. A count doesn't say how full those homes are, or whether more are opening. Note the open rooms in each home, and any new listings or rent cuts. That tells you whether the pocket is filling up or already crowded. |
| Advanced | In place | You know the competition: how many homes, and roughly how full they are. Keep watching, because supply keeps changing after you buy. New homes opening nearby, or rooms cutting their rents, are the early signs to adjust your plan. |

**The method's standard:** Every co-living home within about 3 miles counted, with its open rooms, new listings and rent cuts.

**What RoomIQ shows:** RoomIQ counts and maps active co-living properties within about 3 miles of any address, with listing status on its supply map.

#### Page 13. Step 4: Price the bath mix

*Page type: Category page (Room Mix). Dynamic content on: one version per tier of this category.*

*The Room-by-Room Underwrite: Where your plan stands on each step*

## Step 4: Price the bath mix

| Tier | Chip | Where your plan stands |
|---|---|---|
| Beginner | Gap | You haven't priced the bath mix yet. Private-bath and shared-bath rooms rent and fill differently, so two houses with the same bedroom count can earn very different money. Deciding the mix before you see those spreads is guessing at the biggest lever you control. Compare private and shared-bath rents nearby before you plan any work. |
| Intermediate | Partly there | You've made a call on the bathrooms, but not from the rooms nearby. Adding a bath because it seems worth it, or keeping the ones you have, can both be right. The rents of private and shared-bath rooms nearby tell you which. Price the house both ways before you book the work. |
| Advanced | In place | Your bath mix comes from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. Before the offer, check that the room count also fits the city's rule on unrelated adults sharing a home. |

**The method's standard:** The bath mix and the room count priced from private and shared-bath rooms nearby, and checked against the city's rule.

**What RoomIQ shows:** RoomIQ's forecast takes the room mix you plan, private-bath rooms included, and prints the formula behind the estimate.

#### Page 14. Step 5: Size the cushion

*Page type: Category page (Lease-up Reserves). Dynamic content on: one version per tier of this category.*

*The Room-by-Room Underwrite: Where your plan stands on each step*

## Step 5: Size the cushion

| Tier | Chip | Where your plan stands |
|---|---|---|
| Beginner | Gap | You haven't planned for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. Cutting rents is the usual reflex, and a cut room keeps the lower rent after it fills. Size your reserves from how comparable launches nearby filled, before you make the offer. |
| Intermediate | Partly there | You have some reserves, but they aren't sized from evidence. A few weeks may cover a quick lease-up and not a slow one. Work out your monthly carrying cost, multiply it by the months lease-up could take, and set the reserves from that number. |
| Advanced | In place | Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. Keep a slower case in your deal math. Revisit it whenever rents or supply near the house change. |

**The method's standard:** Reserves sized from the lease-up months the evidence supports, plus a slower case, with the deal math run on your own costs.

**What RoomIQ shows:** RoomIQ carries the estimate into cash flow, cash-on-cash, DSCR and cap rate under your own assumptions. Informational only, not financial or lending advice.

#### Page 15. Two ways to run the method

*Page type: General content. Static.*

*The Room-by-Room Underwrite*

## Two ways to run the method

The method works the same either way. The difference is where the evidence comes from: listings you track by hand, or RoomIQ's observed rooms.

### Run it by hand

The 30-day plan in this report is the method, step by step, and it's yours to keep.

- A list of ten rooms near the house, by bath type and size
- A two-week fill watch on five of them
- A count of the co-living homes within about 3 miles
- Your own deal math, with a slower case

### Run it with RoomIQ

The same five steps for one address, in one place, with the evidence behind each number shown.

**Starting takes one address**

1. **Pick your market.** The Free plan covers one main market.
2. **Type the address.** Add the bedrooms, the baths and which rooms get a private bath.
3. **Run the forecast.** Read the formula, the comps and the confidence label.
4. **Carry it into the deal math.** Cash flow, cash-on-cash, DSCR and cap rate under your own costs. Informational only.

**What you see**

- Monthly room revenue for the address, with the formula printed
- Support and confidence labels, and how far away the comps are
- Rent and occupancy by bath type and size for comparable properties
- Active co-living properties within about 3 miles, mapped
- When occupancy and fill speed peak in the market

### What RoomIQ doesn't do

**No zoning check.** Rules on unrelated adults differ by city: ask the city or an attorney.

**No financing or insurance.** Talk early to a lender and an insurer who know room rentals.

**No promises.** An estimate shows its working; it doesn't guarantee rent or occupancy.

*Based on observed rents and occupancy, not collected payments. Thin evidence is labeled Thin.*

#### Page 16. Your first 30 days with RoomIQ

*Page type: General content. Static.*

*The Room-by-Room Underwrite*

## Your first 30 days with RoomIQ

Here is the method, week by week, with RoomIQ's Free plan.

1. **Week 1: the forecast on your address.** Run the free forecast on the house. Read the formula under the number, the support and confidence labels, and how far away the comps sit.
2. **Week 2: the rooms nearby.** Open comparable properties in the Property Analyzer: rent and occupancy by bath type and size, and their 7, 30 and 90-day windows.
3. **Week 3: the competition and the seasons.** Check the co-living properties within about 3 miles on the map, and when occupancy and fill speed peak, before you pick a launch month.
4. **Week 4: the mix and the math.** Re-run the forecast with the room mix you plan, carry it into cash flow under your own costs, size the cushion, then decide.

### What the Free plan includes

One main market, 90 days of history, 5 Property Analyzer opens and 3 revenue estimates a month, with no card needed.

**Want to go through it together first? Book a 20-minute walkthrough on your address:** pick a time ([[TBD: your booking page link, for example a Calendly event]])

#### Page 17. Your Room-by-Room Underwrite Starts Here

*Page type: General content. Static, with one merge field.*

*The 30-day plan*

## Your Room-by-Room Underwrite Starts Here

The first half of this report showed where your plan borrows its numbers. This half is the plan to replace them with evidence, and it's yours to keep whether or not you ever use RoomIQ. It holds a guide for each of the five areas, a 30-day timeline, a five-day quick start, a checklist for each area and a weekly tracker.

### How to Use This Report

1. **Start with the area marked Fix first.** Your weakest area page named it. Read that guide first, even if another area interests you more.
2. **Read the guide's core method.** Each guide has one named method in four phases. Do the phases in order.
3. **Use the quick start this week.** Five short actions, one a day, about two hours in total.
4. **Follow the 30-day timeline.** The two borrowed numbers first, rent and fill, then the competition, the room mix and the reserves.
5. **Track it every Friday.** Fill in the weekly tracker, then take the scorecard again on day 30 and compare.

**Your weakest area is [[MERGE: Lowest category name]]. Start with its guide.**

| Section | What it gives you |
|---|---|
| Rent Evidence guide | The Ten-Room Rent Check: a rent for each room, from rooms nearby that filled |
| Fill Speed guide | The Two-Week Fill Watch: lease-up months from rooms you watched fill |
| Nearby Supply guide | The Three-Mile Count: the competition, how full it is, and what's new |
| Room Mix guide | The Bath Mix Test: the bathrooms and the room count, priced from rooms nearby |
| Lease-up Reserves guide | The Slow Lease-up Test: reserves that carry the house through a slow start |
| 30-day timeline | Four weekly phases, the borrowed numbers first |
| Quick start | Five things to do this week |
| Checklists | Six checkable actions per area |
| Weekly tracker | Five ratings and four counts, every Friday |


#### Page 18. Rent Evidence: The Ten-Room Rent Check

*Page type: General content. Static.*

## Rent Evidence: The Ten-Room Rent Check

A rent for each room, from rooms near the house that actually filled.

| With a Borrowed Rent | With Rent Evidence |
|---|---|
| The rent per room comes from a calculator, a forum post or a whole-home rent split by bedrooms | Each room's rent comes from rooms nearby with the same bath type and size |
| Every room gets the same rent | Private-bath and shared-bath rooms, large and small, each get their own rent |
| Asking rents are treated as rents | Only rooms that actually filled count, and the asking ones are kept apart |
| Nobody can say how many rooms the number rests on | The rent rests on a list of rooms you can show a partner or a lender |
| A rent the street doesn't support shows up as empty rooms after closing | A rent the street supports, checked before the offer |

### The core method: The Ten-Room Rent Check

**Phase 1: Pull ten rooms.** Start from what rents near the house, not from what a calculator says.

- List at least ten rooms for rent within about 3 miles of the house
- For each, note the weekly rent, the bath type (private or shared) and the room size
- Leave whole-home listings out: you're pricing rooms

**Phase 2: Split by bath and size.** Compare like with like.

- Group the rooms: private or shared bath; large, medium or small
- Note the middle rent of each group, not the highest
- If a group has fewer than three rooms, widen the search and note that you did

**Phase 3: Keep the rooms that filled.** An asking rent is a hope; a filled room is evidence.

- Check your list again after two weeks
- Mark which rooms are gone, and which cut their rent
- Price from the rooms that filled, and treat the rest as the top of the range

**Phase 4: Set a rent per room.** Each room gets the rent its group supports.

- Give each of your rooms the middle rent of its group
- Write down the rooms each rent rests on
- Recheck before the offer, because rents move with the seasons and with new supply

#### Page 19. Rent Evidence: The Ten-Room Rent Check, continued

*Page type: General content. Static.*

### Common Mistakes to Eliminate

- Using a platform's earnings estimate as your rent
- Dividing a whole-home rent by the number of bedrooms
- Pricing every room the same, whatever its bath or size
- Counting asking rents as rents
- Pricing from the highest rent you found
- Using rooms from across the metro instead of near the house
- Copying another operator's listing photos or text into your plan

### Practice Protocol: The Two-Week Recheck

**Frequency:** Once, two weeks after your first list; then again before the offer.

**Format:** Your list of rooms: weekly rent, bath type, size, and whether it's still listed.

**Review method:** Which rooms filled, and at what rent? Which cut their rent?

**Classify every result:** Filled, still open, rent cut, or removed. Price from the filled rooms first.


#### Page 20. Fill Speed: The Two-Week Fill Watch

*Page type: General content. Static.*

## Fill Speed: The Two-Week Fill Watch

Lease-up months from how fast rooms nearby actually fill, not from a vacancy guess.

| With an Assumed Fill Time | With Fill Evidence |
|---|---|
| The plan assumes a vacancy rate | The plan uses how fast comparable rooms near the house filled |
| Lease-up time is a hope: a month, maybe | Lease-up months come from rooms you watched fill |
| The launch month is whenever the work ends | The launch is timed to the months rooms nearby fill fastest |
| A metro average stands in for the street | The street's own rooms set the number |
| A slow lease-up comes as a surprise | A slow lease-up is in the plan before the offer |

### The core method: The Two-Week Fill Watch

**Phase 1: Pick the rooms to watch.** Watch rooms like yours, near the house.

- Choose five to ten room listings within about 3 miles, with the bath types you plan
- Note the date you first saw each one
- Keep the list in one place

**Phase 2: Check every few days.** Fill speed is a count, not an opinion.

- Every few days, note which rooms are still listed
- Note any rent cut
- Keep going for at least two weeks

**Phase 3: Read the count.** How many filled, how fast, and at what rent.

- Count the rooms that filled within two weeks
- Note how long the slowest ones stayed open
- Compare the rooms that filled with the ones that didn't: rent, bath and size

**Phase 4: Set your lease-up months.** From what you saw, plus a slower case.

- Set your plan's lease-up months from the watch
- Add a slower case: the same rooms taking twice as long
- Pick a launch month when rooms nearby fill fastest, if you can

#### Page 21. Fill Speed: The Two-Week Fill Watch, continued

*Page type: General content. Static.*

### Common Mistakes to Eliminate

- Assuming a vacancy rate instead of counting
- Using a metro or national average for one street
- Watching rooms that don't match yours
- Stopping the watch after a few days
- Adding a vacancy rate on top of an occupancy that already counts empty rooms
- Planning the launch for whenever the work happens to end

### Practice Protocol: The Fill Watch Log

**Frequency:** Every few days for two weeks, 10 minutes each time.

**Format:** One line per room: the date first seen, the rent, the bath type, still listed or not, any rent cut.

**Review method:** After two weeks: how many filled, how fast, and at what rent.

**Classify every result:** Filled at the asking rent, filled after a cut, still open, or removed.


#### Page 22. Nearby Supply: The Three-Mile Count

*Page type: General content. Static.*

## Nearby Supply: The Three-Mile Count

Know the competition before you buy: how many homes, how full, and what's new.

| Without a Supply Count | With a Supply Count |
|---|---|
| Nobody counted the co-living homes nearby | Every co-living home within about 3 miles is on one list |
| A count, with no idea how full those homes are | Open rooms are noted next to each home |
| New homes opening nearby come as a surprise | New listings, and homes that stopped listing, are tracked |
| Rent cuts nearby go unnoticed | Rent cuts are an early warning in the plan |
| A crowded pocket looks like a busy one | Crowded and busy are told apart before the offer |

### The core method: The Three-Mile Count

**Phase 1: Map the homes.** Count every co-living home within about 3 miles.

- List every home with rooms for rent within about 3 miles of the house
- Note each home's room count, if it shows
- Mark them on a simple map

**Phase 2: Note the open rooms.** A count says how many; open rooms say how full.

- Next to each home, note how many rooms are open
- Note the bath types of the open rooms
- Many open shared-bath rooms nearby is a warning for shared-bath rooms of your own

**Phase 3: Watch what changes.** Supply keeps moving after you buy.

- Note new homes that started listing rooms
- Note homes that stopped
- Note rent cuts on comparable rooms

**Phase 4: Decide what it means.** Filling up, or already crowded.

- Few open rooms and steady rents: room for one more home
- Many open rooms and rent cuts: plan a lower rent or a slower lease-up
- Write the read into your plan, with the date

#### Page 23. Nearby Supply: The Three-Mile Count, continued

*Page type: General content. Static.*

### Common Mistakes to Eliminate

- Counting listings without noting how full they are
- Treating one busy home as the whole street
- Missing homes that list rooms only some of the time
- Never counting again after the first time
- Judging a pocket by its best home instead of its open rooms

### Practice Protocol: The Monthly Supply Count

**Frequency:** Once a month, 20 minutes.

**Format:** The homes within about 3 miles: rooms open, new or closed listings, rent cuts.

**Review method:** Is open supply rising or falling since last month?

**Classify every result:** New home, closed home, rent cut, or no change.


#### Page 24. Room Mix: The Bath Mix Test

*Page type: General content. Static.*

## Room Mix: The Bath Mix Test

Price the bathrooms and the room count from the rooms nearby, before any work.

| With a Mix Decided on a Hunch | With a Priced Mix |
|---|---|
| The bath mix is decided on a hunch | The bath mix comes from private and shared-bath rents nearby |
| A bathroom is added because it seems worth it | The house is priced both ways before the plumber is booked |
| Every bedroom gets rented, whatever the rules say | The room count fits the city's rule on unrelated adults |
| The garage is converted because more rooms earn more | The garage is priced both ways: as parking and as a room |
| The biggest lever in the plan is a guess | The biggest lever in the plan rests on rooms you can show |

### The core method: The Bath Mix Test

**Phase 1: Split the rents.** Private and shared bath, from rooms nearby.

- From your rent list, note the middle weekly rent of private-bath rooms and of shared-bath rooms
- Note the difference between them
- Note which group fills faster, from your fill watch

**Phase 2: Price it both ways.** The baths as they are, and with one more private bath.

- Weekly rent × rooms × 4.35 for the house as it is
- The same for the house with one more private bath
- The difference is the monthly revenue the change could add, at full occupancy

**Phase 3: Check the room count.** More rooms is also a rules question.

- Read the city's rule on unrelated adults sharing a home
- Check the room count you plan against it
- Price the garage or extra space both ways, if there is one

**Phase 4: Weigh it against the cost.** Revenue is half the decision.

- Get a quote for the work
- Compare the quote with the monthly difference
- Decide, and write down the rents the decision rests on

#### Page 25. Room Mix: The Bath Mix Test, continued

*Page type: General content. Static.*

### Common Mistakes to Eliminate

- Adding a bathroom without pricing the difference
- Pricing every room the same, whatever its bath
- Counting rooms the city's rule may not allow
- Converting the garage without pricing it both ways
- Comparing extra revenue with no quote for the work

### Practice Protocol: The Before-Work Check

**Frequency:** Once, before you book any work.

**Format:** Two prices for the house: the baths as they are, and with the change.

**Review method:** Does the monthly difference justify the quote?

**Classify every result:** Worth it, not worth it, or too few rooms nearby to tell.


#### Page 26. Lease-up Reserves: The Slow Lease-up Test

*Page type: General content. Static.*

## Lease-up Reserves: The Slow Lease-up Test

Reserves that carry the house through a slow lease-up, sized from evidence.

| With a Hopeful Cushion | With a Sized Cushion |
|---|---|
| Reserves are a few weeks, or whatever is left | Reserves are the monthly cost times the lease-up months, plus a slower case |
| A slow lease-up means cutting rents | A slow lease-up is already in the plan |
| The deal math runs on a calculator's defaults | The deal math runs on your own costs and on rooms nearby |
| A vacancy rate is added on top of occupancy | Empty rooms are counted once |
| The first six months are a hope | The first six months are planned, month by month |

### The core method: The Slow Lease-up Test

**Phase 1: Know your monthly cost.** What the house costs with every room empty.

- Add the loan payment, taxes, insurance, utilities and upkeep
- Write down the monthly total
- This is the number every lease-up plan rests on

**Phase 2: Set the lease-up months.** From your fill watch, not from a hope.

- Take the months your fill watch supports
- Add a slower case: twice as long
- Write both down

**Phase 3: Size the cushion.** The months of cost your reserves must carry.

- Monthly cost × the slower case's months = the reserves to hold
- Compare it with the cash you'll have after the down payment and the work
- If it falls short, change the plan before the offer, not after

**Phase 4: Run the deal math on evidence.** Your own costs, and the rooms nearby.

- Run cash flow on rents and occupancy from comparable rooms, with your own costs
- Don't add a vacancy rate on top of an occupancy that already counts empty rooms
- Keep the slower case beside the base case

#### Page 27. Lease-up Reserves: The Slow Lease-up Test, continued

*Page type: General content. Static.*

### Common Mistakes to Eliminate

- Sizing reserves in weeks instead of months of cost
- Planning to cut rents if lease-up is slow
- Running the deal math on a calculator's defaults
- Counting empty rooms twice: a vacancy rate on top of observed occupancy
- Spending the reserves on the work

### Practice Protocol: The Monthly Cushion Check

**Frequency:** Once a month until the rooms are full, 15 minutes.

**Format:** Months of reserves left, rooms filled, and the months your slower case allows.

**Review method:** Are rooms filling faster or slower than the plan?

**Classify every result:** On plan, slower than plan, or behind the slower case.


#### Page 28. Your 30-Day Timeline

*Page type: General content. Static.*

## Your 30-Day Timeline

The two borrowed numbers first, rent and fill, because every other number follows from them. Then the competition, the room mix and the cushion.

### Phase 1, days 1 to 7: Price each room

*Focus: Rent Evidence*

- List ten rooms within about 3 miles of the house
- Split them by bath type and size
- Start the two-week fill watch on five of them
- Write down your monthly carrying cost
- Note what your current rent number rests on

**By the end:** a rent per room you can trace to rooms nearby, and a fill watch running.

### Phase 2, days 8 to 14: Count the competition

*Focus: Nearby Supply*

- Count the co-living homes within about 3 miles
- Note the open rooms in each
- Note new homes and rent cuts nearby
- Check your fill watch every few days
- Read the city's rule on unrelated adults

**By the end:** the competition on one page, and the city's rule in hand.

### Phase 3, days 15 to 21: Time the fill and price the mix

*Focus: Fill Speed and Room Mix*

- Close the fill watch: how many filled, how fast
- Set your lease-up months, and a slower case
- Price the house both ways: the baths as they are, and with one more private bath
- Check the room count against the city's rule
- Pick your launch month

**By the end:** lease-up months from evidence, and a bath mix priced from rooms nearby.

### Phase 4, days 22 to 30: Size the cushion

*Focus: Lease-up Reserves*

- Size reserves: monthly cost × the slower case's months
- Run the deal math on your own costs and on rooms nearby
- Talk to a lender who knows room rentals
- Get an insurance quote that covers renting by the room
- Take the scorecard again on day 30

**By the end:** a plan where every number rests on evidence, and a second score to compare with the first.

#### Page 29. Quick Start: 5 Things to Do This Week

*Page type: General content. Static.*

## Quick Start: 5 Things to Do This Week

### Day 1: Write Down Your Monthly Cost (20 minutes)

Add up what the house will cost each month with every room empty: loan payment, taxes, insurance, utilities and upkeep. Write the total where you'll see it. Every lease-up plan rests on this number.

### Day 2: List Ten Rooms Nearby (30 minutes)

Find ten rooms for rent within about 3 miles of the house. For each, write the weekly rent, the bath type and the room size. Leave whole-home listings out: you're pricing rooms.

### Day 3: Split the Rents (20 minutes)

Group your ten rooms by bath type, private or shared, and note the middle rent of each group. The difference is your first read on the bath mix.

### Day 4: Count the Competition (30 minutes)

Count the co-living homes with rooms listed within about 3 miles of the house, and note how many rooms each has open. One page, with the date.

### Day 5: Start the Fill Watch (15 minutes)

Pick five of your ten rooms and set a reminder to check them every few days for two weeks. Which ones fill, how fast and at what rent becomes your lease-up plan.

**Total time this week: about two hours.**

#### Page 30. Implementation Checklists

*Page type: General content. Static (one or two pages).*

## Implementation Checklists

### Rent Evidence

| Action | How or where | Status |
|---|---|---|
| List ten rooms within about 3 miles | Room listings, a spreadsheet |  |
| Note the rent, bath type and size of each | Your list |  |
| Split them by bath type and size | Your list |  |
| Recheck after two weeks: which ones filled | Your list |  |
| Give each of your rooms its own rent | Your plan |  |
| Write down the rooms each rent rests on | Your plan |  |

### Fill Speed

| Action | How or where | Status |
|---|---|---|
| Pick five to ten rooms to watch | Room listings near the house |  |
| Check them every few days for two weeks | A calendar reminder |  |
| Count how many filled, and how fast | Your watch log |  |
| Set your lease-up months from the watch | Your plan |  |
| Add a slower case: twice as long | Your plan |  |
| Pick your launch month | Your plan |  |

### Nearby Supply

| Action | How or where | Status |
|---|---|---|
| List the co-living homes within about 3 miles | Room listings, a map |  |
| Note the open rooms in each | Your list |  |
| Note new homes and homes that stopped listing | Once a month |  |
| Note rent cuts on comparable rooms | Once a month |  |
| Write your read: filling up or crowded | Your plan, with the date |  |
| Count again before the offer | Your list |  |

### Room Mix

| Action | How or where | Status |
|---|---|---|
| Note private and shared-bath rents nearby | Your rent list |  |
| Price the house as it is | Weekly rent × rooms × 4.35 |  |
| Price it with one more private bath | Weekly rent × rooms × 4.35 |  |
| Check the room count against the city's rule | The city code, then the city or an attorney |  |
| Price the garage both ways, if there is one | Your plan |  |
| Get a quote before deciding on any work | A contractor |  |

### Lease-up Reserves

| Action | How or where | Status |
|---|---|---|
| Write down your monthly carrying cost | Your plan |  |
| Set lease-up months and a slower case | Your fill watch |  |
| Size reserves: cost × the slower case's months | Your plan |  |
| Run the deal math on your own costs | Your spreadsheet, or RoomIQ |  |
| Count empty rooms once, not twice | Your deal math |  |
| Talk to a lender who knows room rentals | Before the offer |  |


#### Page 31. Weekly Tracking Dashboard

*Page type: General content. Static. The reader writes their starting point from their area scores (0 to 39 is 1 or 2, 40 to 69 is 3, 70 and above is 4 or 5).*

## Weekly Tracking Dashboard

Fill this in every Friday. Rate each area from 1 (a guess) to 5 (evidence you can show), then write the four counts.

| Measure | Your starting point | Week 1 | Week 2 | Week 3 | Week 4 | Target |
|---|---|---|---|---|---|---|
| Rent Evidence (1 to 5) |  |  |  |  |  | 5 |
| Fill Speed (1 to 5) |  |  |  |  |  | 5 |
| Nearby Supply (1 to 5) |  |  |  |  |  | 5 |
| Room Mix (1 to 5) |  |  |  |  |  | 5 |
| Lease-up Reserves (1 to 5) |  |  |  |  |  | 5 |
| Rooms on your rent list |  |  |  |  |  | 10 or more |
| Rooms filled in your watch |  |  |  |  |  | Your count |
| Co-living homes within 3 miles |  |  |  |  |  | Your count |
| Months of reserves |  |  |  |  |  | Your slower case |

### Commitments

- I will price each room from rooms nearby, not from a calculator.
- I will count how fast rooms fill before I plan the lease-up.
- I will count the competition before I buy.
- I will price the bath mix before I book any work.
- I will size reserves for a slower lease-up than I hope for.

### Remember

- An asking rent is a hope; a filled room is evidence.
- Count empty rooms once.
- The city's rule comes from the city or an attorney.
- Every number in the offer should rest on rooms you can show.

#### Page 32. Your Next Step

*Page type: Call to action. Static, with one merge field.*

## Your Next Step

This report showed where your plan borrows its numbers, and gave you a 30-day plan to replace them with evidence. The by-hand way works: it takes listings, a spreadsheet and two weeks of watching. RoomIQ shows that evidence for one address in one place.

### Run a free forecast on your address

Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby. Start where your report says to: [[MERGE: Lowest category name]]. The estimate prints its formula, its comps and how sure it is, and counts the co-living homes within about 3 miles. Free plan: no card needed, three forecasts a month.

Button: Run my free forecast (https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=report&utm_campaign=roomiq-first-deal)

Or book a 20-minute walkthrough on your address: pick a time ([[TBD: your booking page link, for example a Calendly event]])

Run the free forecast: roomiq.io (https://roomiq.io)

Rather do it by hand? This playbook is yours to keep.

## Stage 6. Emails

### 6.1 Results email (Settings, Result Email)

Turn **Result Email** on. Sender: your verified address (Business plan, Account, Domains). [[TBD: sender, for example
"RoomIQ <team@your-domain>"]]. Insert the two buttons from the dynamic content menu (Links): the results button and the
PDF report button.

| Field | Exact text |
|---|---|
| Subject | Your Deal Readiness Score, and your report |
| Preheader (if the editor offers one) | Your score and your full report, as a PDF. |
| Line 1 | Hi {first_name}, |
| Line 2 | Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score and your five area scores are ready. |
| Results button | See my score |
| Line 3 | It covers your five areas, your first six months, three checks RoomIQ can't do for you, the Room-by-Room Underwrite and a 30-day plan. |
| PDF report button | Open my report |
| Line 4 | When you have an address, run a free forecast on it: https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-deal (Free plan, no card needed, three forecasts a month). |
| Line 5 | Want to go through it on your address? Book a 20-minute walkthrough: [[TBD: your booking page link, for example a Calendly event]] |
| Sign-off | The RoomIQ team |
| Footer | Privacy Policy: https://roomiq.io/privacy [[TBD: postal address, required in commercial email]] |

If your merge-field menu offers the overall score and the lowest category, you may add after line 2:
"Your Deal Readiness Score is [[MERGE: Overall score]]/100. Fix first: [[MERGE: Lowest category name]]." Leave it out otherwise:
the email cannot vary by tier.

### 6.2 Team notification (Settings, Notifications)

| Field | Exact text |
|---|---|
| To | [[TBD: the team's address]] |
| Subject | New scorecard: {first_name}, [[MERGE: Overall score]]/100 |
| Body | Insert from the merge tag icon: first name, email, the overall score and tier, the five category scores, the lowest category, and the answers to questions 1, 2, 8, 9 and 10 (stage, market, monthly cost, lease-up months, reserves). |

### 6.3 The follow-ups in Loops (days 2, 5 and 8)

The GTM planned these in Loops (`lead_magnet_spec.xlsx`, Email_Sequence). **Integrate, Webhooks, Connect**: your
automation tool's https address (Zapier, Make or n8n), a secret key, and the events **Lead Signed Up** and **Quiz
Finished**. Map ScoreApp's payload to Loops:

| Loops field | ScoreApp webhook field |
|---|---|
| email, first_name | data.email, data.first_name |
| score, tier | data.total_score (its score and tier) |
| bottleneck_name | data.lowest_category.title |
| market | data.quiz_questions: the answer to question 2 |
| covered | true when that answer is one of: Dallas-Fort Worth, Houston, Atlanta, Orlando, Jacksonville, Phoenix, Las Vegas |
| results_url, report_url | data.result_url, data.report |
| utm_source, utm_campaign | data.utm_source, data.utm_campaign |

Rules from the GTM for these emails: never promise or imply income; zoning, financing and insurance are named as outside
RoomIQ; the free forecast only in covered markets; day 2's numbers come from a real run on the day it is sent, never
invented; day 8's cohort version only while the limit is real.

**Day 2**

| Field | Exact text |
|---|---|
| Subject | What one address looks like with room-level evidence |
| Preheader | A worked example, labeled as one: rents, supply and fill nearby. |
| Line 1 | Hi {first_name}, |
| Line 2 | Your scorecard priced your first six months from your own numbers. Here is what the evidence behind those numbers looks like for one address. |
| Line 3 | An example, from a RoomIQ run on [date]: a [n]-bedroom house in [market]. |
| Line 4 | Co-living homes within about 3 miles: [n]. Shared-bath rooms nearby list for [range] a week, evidence [level]. |
| Line 5 | How comparable launches filled: [summary]. |
| Line 6 | What it doesn't tell you: the city's rule on unrelated adults, financing and insurance. Those stay with the city, a lender and an insurer. |
| Line 7 | Run the same on your address with the Free plan: three forecasts a month, no card needed. |
| Button | Try it on your address |
| Link | https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-deal-day2 |
| Send rule | Fill the brackets from a real run on a covered-market address on the day it goes out; if no run is current, skip it. When covered is false, replace line 7 and the button with "See whether RoomIQ covers your market", linking to roomiq.io. |

**Day 5**

| Field | Exact text |
|---|---|
| Subject | Three numbers to check before an offer |
| Preheader | Rent, fill speed and supply, for one address. |
| Line 1 | Hi {first_name}, |
| Line 2 | Three numbers decide a rent-by-the-room deal's first months: what rooms like yours rent for nearby, how fast comparable rooms filled, and how many homes compete within about 3 miles. |
| Line 3 | Your scorecard marked {bottleneck_name} as the one to fix first. |
| Line 4 | RoomIQ shows each number for an address and labels how much evidence stands behind it. It doesn't check zoning, arrange financing or quote insurance. |
| Line 5 | Want to go through your address together? Twenty minutes, your address, your numbers. |
| Button | Book a 20-minute walkthrough |
| Link | [[TBD: your booking page link, for example a Calendly event]] |
| Send rule | Skip when a walkthrough is booked. |

**Day 8** (version 1 only while the founding cohort has seats left and the number is published, and only to leads who
run houses; everyone else gets version 2)

| Field | Exact text |
|---|---|
| Version 1 · Subject | The founding operator cohort closes at 12 |
| Version 1 · Line 1 | Hi {first_name}, |
| Version 1 · Line 2 | The founding cohort closes at 12 operators; [m] places are left. |
| Version 1 · Button | Apply for the founding cohort |
| Version 1 · Link | The landing page's cohort section |
| Version 2 · Subject | Your free forecasts are still waiting for an address |
| Version 2 · Line 1 | Hi {first_name}, |
| Version 2 · Line 2 | Your free forecasts are still waiting for an address: three a month on the Free plan, no card needed. |
| Version 2 · Line 3 | Type the address and RoomIQ prints the estimate with its formula, its comps and how sure it is. |
| Version 2 · Button | Run my free forecast |
| Version 2 · Link | https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-deal-day8 |

## Stage 7. Tracking, domain and sender (by hand)

| Where | Set | Why |
|---|---|---|
| Settings, Tracking: Meta Pixel ID | [[TBD: RoomIQ's pixel id]] | ScoreApp then fires PageView on every page, ScoreappQuestionsStarted after the first answer, ScoreappQuestionsFinished after the last, and Lead after the lead form |
| Settings, Tracking: Conversions API | On, with the access token from Events Manager (Settings, Conversions API, Generate access token) | The same events also go server side |
| Meta Events Manager: custom conversions | "ScorecardStart" = event ScoreappQuestionsStarted, URL contains your scorecard domain. "ScorecardComplete" = event Lead, URL contains your scorecard domain | The GTM's event map counts every completion. With the lead form after the questions, Lead fires once per completion; the URL rule keeps it apart from the Meta page's own Lead (a forecast request) |
| The booking tool | Its own Meta pixel integration, firing Schedule on a booked walkthrough | ScoreApp does not see bookings made in another tool |
| Settings, Tracking, Custom Scripts (head) | Your cookie consent tool's script (for example Cookiebot or OneTrust). Mark scoreapp_session and XSRF-TOKEN essential; _score non-essential; the Meta pixel marketing | The funnel's rule: no tracking before consent, none under Global Privacy Control |
| Account, Domains | A custom domain: [[TBD: for example score.roomiq.io]] | Links, emails and the pixel's URL rule use it |
| Account, Domains: sender | [[TBD: the verified sender]] | The results email comes from RoomIQ, not scoreappmail |
| RoomIQ's landing page and Meta page | Set `scorecardUrl` to `https://<your scorecard domain>/questions` (or the default page) | Their score buttons then open the quiz |

## Stage 8. Test in draft mode, then go live

Keep **Draft mode** on (Settings, General) and take the scorecard once per persona, with an email you can read. Each
result must match this table, which was computed by the funnel's own scoring code.

| Persona | Answers (question: answer) | Overall, tier | Category scores | Fix first (section 4) | Your first six months (section 3) | Sections 6 to 8 |
|---|---|---|---|---|---|---|
| Jordan (spec 1's worked example) | 1: Looking at houses; 2: Atlanta; 3: Asking rents I found on room listings; 4: I assume a vacancy percentage; 5: I counted listings; 6: Not yet; 7: A few weeks of reserves; 8: $2,000 to $3,000; 9: About 3 months; 10: 1 month or less | 35, Beginner | Rent Evidence 50, Fill Speed 25, Nearby Supply 50, Room Mix 0, Lease-up Reserves 50 | Room Mix (the funnel's own fix-first is Fill Speed, through the cascade; the Room Mix or Reserves text says so) | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. $2,000 a month × (3 months to fill, minus 1 month of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. | First step: Your report. Market card: Run a free forecast on your address. City rule: Market: Atlanta |
| Riley, under contract, partly checked | 1: Under contract; 2: Phoenix; 3: Asking rents I found on room listings; 4: Host stories and forum posts; 5: I counted listings; 6: Keeping the current bathrooms; 7: A few weeks of reserves; 8: Not sure yet; 9: About 2 months; 10: 2 to 3 months | 45, Intermediate | Rent Evidence 50, Fill Speed 50, Nearby Supply 50, Room Mix 25, Lease-up Reserves 50 | Room Mix (the funnel's own fix-first is Rent Evidence, through the cascade; the Room Mix or Reserves text says so) | Your reserves cover the 2 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. | First step: Run a free forecast on your address. Market card: Run a free forecast on your address. City rule: Market: Phoenix |
| Sam, an operator with evidence | 1: I run 1 to 10 houses; 2: Houston; 3: Comps of nearby rooms, with how fast they filled; 4: Observed fill times of comparable rooms nearby; 5: I know the count and roughly how full they are; 6: Modeled private against shared-bath rents nearby; 7: Reserves sized from how comparable launches nearby filled; 8: $3,000 to $4,000; 9: About 2 months; 10: 6 months or more | 100, Advanced | Rent Evidence 100, Fill Speed 100, Nearby Supply 100, Room Mix 100, Lease-up Reserves 100 | none (every area Advanced): "Every number rests on evidence. Your report shows how to check it holds for this address." | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $3,000. $3,000 a month × 2 months to fill = $6,000, against 6 months of reserves. We used the low end of your cost range. Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. | First step: Book a 20-minute walkthrough. Market card: Run a free forecast on your address. City rule: Market: Houston |
| Casey, learning, market not chosen | 1: Learning, no house yet; 2: Not decided yet; 3: I don't have one yet; 4: I haven't looked; 5: No idea; 6: Not yet; 7: I haven't planned for it; 8: Not sure yet; 9: Not sure; 10: Not sure | 0, Beginner | Rent Evidence 0, Fill Speed 0, Nearby Supply 0, Room Mix 0, Lease-up Reserves 0 | Rent Evidence | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. | First step: Your report. Market card: Look up the evidence in your market. City rule: Market: Not decided yet |

For each persona also check: the tier's versions of sections 2 and 7; each category card's version; the checks section
for the persona's market; the PDF opens from the results page and from the email, with the right tier versions and the
right highest and lowest pages.

**Go live:** fill every `[[TBD]]`, publish the landing pages, the results page and the PDF, turn Draft mode off, then
send one real test from a phone and watch Events Manager's test events.

## Appendix A. Not carried over

| Feature | Why | If you want it later |
|---|---|---|
| The deepener (12 optional questions) and the sharper report | One question flow per scorecard; adding them to the main flow makes 22 questions | A second scorecard, "Sharpen your report", linked from the results page |
| The six-month strip | No per-answer graphics | None needed: the Smart Section says the same |
| Answer-specific fix-first lines (a calculator rent, a divided rent, an assumed vacancy rate) | Personalised by category, not by answer | Audiences on question 3's and 4's answers, one section each |
| The checklist questions on zoning and financing, and the checks' status | They were deepener questions | Two more questions in the main flow, unscored |
| The walkthrough's built-in form | ScoreApp books through a calendar tool | Already covered by the booking tool |
| Per-lead notes, a checker's name on the cover, the Supabase admin | ScoreApp's own leads area replaces them | ScoreApp's Leads tab |

## Appendix B. Your first six months: the exact text for every answer combination

What the funnel shows for each combination of questions 8, 9 and 10. Check the Smart Section against any row.

| Q8 monthly cost | Q9 lease-up | Q10 reserves | Variant | Exact text |
|---|---|---|---|---|
| Under $2,000 | About a month | None set aside yet | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $1,000 of costs with no cushion behind it. / $1,000 a month × (1 month to fill, minus 0 months of reserves) = $1,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About a month | 1 month or less | EXACT | At your numbers, your reserves cover the 1 month you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 1 month to fill = $1,000, against 1 month of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About a month | 2 to 3 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 1 month to fill = $1,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About a month | 4 to 5 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 1 month to fill = $1,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About a month | 6 months or more | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 5 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 1 month to fill = $1,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About a month | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $1,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $1,000 a month × 1 month to fill = $1,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | None set aside yet | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $2,000 of costs with no cushion behind it. / $1,000 a month × (2 months to fill, minus 0 months of reserves) = $2,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | 1 month or less | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $1,000 of costs with no cushion behind it. / $1,000 a month × (2 months to fill, minus 1 month of reserves) = $1,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | 2 to 3 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 2 months to fill = $2,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 2 months to fill = $2,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | 6 months or more | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 2 months to fill = $2,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 2 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $2,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $1,000 a month × 2 months to fill = $2,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | None set aside yet | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $3,000 of costs with no cushion behind it. / $1,000 a month × (3 months to fill, minus 0 months of reserves) = $3,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | 1 month or less | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $2,000 of costs with no cushion behind it. / $1,000 a month × (3 months to fill, minus 1 month of reserves) = $2,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | 2 to 3 months | EXACT | At your numbers, your reserves cover the 3 months you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 3 months to fill = $3,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 3 months to fill = $3,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | 6 months or more | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 3 months to fill = $3,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | About 3 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $3,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $1,000 a month × 3 months to fill = $3,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | None set aside yet | GAP | At your numbers, your reserves run out 4 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $1,000 a month × (4 months to fill, minus 0 months of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | 1 month or less | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $3,000 of costs with no cushion behind it. / $1,000 a month × (4 months to fill, minus 1 month of reserves) = $3,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | 2 to 3 months | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $1,000 of costs with no cushion behind it. / $1,000 a month × (4 months to fill, minus 3 months of reserves) = $1,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | 4 to 5 months | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 4 months to fill = $4,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | 6 months or more | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $1,000. / $1,000 a month × 4 months to fill = $4,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | 4 months or more | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $4,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $1,000 a month × 4 months to fill = $4,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Under $2,000 | Not sure | None set aside yet | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| Under $2,000 | Not sure | 1 month or less | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| Under $2,000 | Not sure | 2 to 3 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| Under $2,000 | Not sure | 4 to 5 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| Under $2,000 | Not sure | 6 months or more | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| Under $2,000 | Not sure | Not sure | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $1,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $1,000 a month before any rent comes in. |
| $2,000 to $3,000 | About a month | None set aside yet | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $2,000 of costs with no cushion behind it. / $2,000 a month × (1 month to fill, minus 0 months of reserves) = $2,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About a month | 1 month or less | EXACT | At your numbers, your reserves cover the 1 month you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 1 month to fill = $2,000, against 1 month of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About a month | 2 to 3 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 1 month to fill = $2,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About a month | 4 to 5 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 1 month to fill = $2,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About a month | 6 months or more | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 5 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 1 month to fill = $2,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About a month | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $2,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $2,000 a month × 1 month to fill = $2,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | None set aside yet | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $2,000 a month × (2 months to fill, minus 0 months of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | 1 month or less | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $2,000 of costs with no cushion behind it. / $2,000 a month × (2 months to fill, minus 1 month of reserves) = $2,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | 2 to 3 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 2 months to fill = $4,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 2 months to fill = $4,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | 6 months or more | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 2 months to fill = $4,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 2 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $4,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $2,000 a month × 2 months to fill = $4,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | None set aside yet | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $6,000 of costs with no cushion behind it. / $2,000 a month × (3 months to fill, minus 0 months of reserves) = $6,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | 1 month or less | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $2,000 a month × (3 months to fill, minus 1 month of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | 2 to 3 months | EXACT | At your numbers, your reserves cover the 3 months you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 3 months to fill = $6,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 3 months to fill = $6,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | 6 months or more | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 3 months to fill = $6,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | About 3 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $6,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $2,000 a month × 3 months to fill = $6,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | None set aside yet | GAP | At your numbers, your reserves run out 4 months before the rooms fill. That's at least $8,000 of costs with no cushion behind it. / $2,000 a month × (4 months to fill, minus 0 months of reserves) = $8,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | 1 month or less | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $6,000 of costs with no cushion behind it. / $2,000 a month × (4 months to fill, minus 1 month of reserves) = $6,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | 2 to 3 months | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $2,000 of costs with no cushion behind it. / $2,000 a month × (4 months to fill, minus 3 months of reserves) = $2,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | 4 to 5 months | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 4 months to fill = $8,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | 6 months or more | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $2,000. / $2,000 a month × 4 months to fill = $8,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | 4 months or more | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $8,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $2,000 a month × 4 months to fill = $8,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $2,000 to $3,000 | Not sure | None set aside yet | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $2,000 to $3,000 | Not sure | 1 month or less | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $2,000 to $3,000 | Not sure | 2 to 3 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $2,000 to $3,000 | Not sure | 4 to 5 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $2,000 to $3,000 | Not sure | 6 months or more | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $2,000 to $3,000 | Not sure | Not sure | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $2,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $2,000 a month before any rent comes in. |
| $3,000 to $4,000 | About a month | None set aside yet | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $3,000 of costs with no cushion behind it. / $3,000 a month × (1 month to fill, minus 0 months of reserves) = $3,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About a month | 1 month or less | EXACT | At your numbers, your reserves cover the 1 month you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 1 month to fill = $3,000, against 1 month of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About a month | 2 to 3 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 1 month to fill = $3,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About a month | 4 to 5 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 1 month to fill = $3,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About a month | 6 months or more | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 5 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 1 month to fill = $3,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About a month | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $3,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $3,000 a month × 1 month to fill = $3,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | None set aside yet | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $6,000 of costs with no cushion behind it. / $3,000 a month × (2 months to fill, minus 0 months of reserves) = $6,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | 1 month or less | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $3,000 of costs with no cushion behind it. / $3,000 a month × (2 months to fill, minus 1 month of reserves) = $3,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | 2 to 3 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 2 months to fill = $6,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 2 months to fill = $6,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | 6 months or more | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 2 months to fill = $6,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 2 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $6,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $3,000 a month × 2 months to fill = $6,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | None set aside yet | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $9,000 of costs with no cushion behind it. / $3,000 a month × (3 months to fill, minus 0 months of reserves) = $9,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | 1 month or less | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $6,000 of costs with no cushion behind it. / $3,000 a month × (3 months to fill, minus 1 month of reserves) = $6,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | 2 to 3 months | EXACT | At your numbers, your reserves cover the 3 months you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 3 months to fill = $9,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 3 months to fill = $9,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | 6 months or more | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 3 months to fill = $9,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | About 3 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $9,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $3,000 a month × 3 months to fill = $9,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | None set aside yet | GAP | At your numbers, your reserves run out 4 months before the rooms fill. That's at least $12,000 of costs with no cushion behind it. / $3,000 a month × (4 months to fill, minus 0 months of reserves) = $12,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | 1 month or less | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $9,000 of costs with no cushion behind it. / $3,000 a month × (4 months to fill, minus 1 month of reserves) = $9,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | 2 to 3 months | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $3,000 of costs with no cushion behind it. / $3,000 a month × (4 months to fill, minus 3 months of reserves) = $3,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | 4 to 5 months | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 4 months to fill = $12,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | 6 months or more | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $3,000. / $3,000 a month × 4 months to fill = $12,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | 4 months or more | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $12,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $3,000 a month × 4 months to fill = $12,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| $3,000 to $4,000 | Not sure | None set aside yet | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| $3,000 to $4,000 | Not sure | 1 month or less | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| $3,000 to $4,000 | Not sure | 2 to 3 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| $3,000 to $4,000 | Not sure | 4 to 5 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| $3,000 to $4,000 | Not sure | 6 months or more | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| $3,000 to $4,000 | Not sure | Not sure | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $3,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $3,000 a month before any rent comes in. |
| More than $4,000 | About a month | None set aside yet | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $4,000 a month × (1 month to fill, minus 0 months of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About a month | 1 month or less | EXACT | At your numbers, your reserves cover the 1 month you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 1 month to fill = $4,000, against 1 month of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About a month | 2 to 3 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 1 month to fill = $4,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About a month | 4 to 5 months | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 1 month to fill = $4,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About a month | 6 months or more | COVERED | At your numbers, your reserves cover the 1 month you expect lease-up to take, with 5 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 1 month to fill = $4,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About a month | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $4,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $4,000 a month × 1 month to fill = $4,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | None set aside yet | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $8,000 of costs with no cushion behind it. / $4,000 a month × (2 months to fill, minus 0 months of reserves) = $8,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | 1 month or less | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $4,000 a month × (2 months to fill, minus 1 month of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | 2 to 3 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 2 months to fill = $8,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 2 months to fill = $8,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | 6 months or more | COVERED | At your numbers, your reserves cover the 2 months you expect lease-up to take, with 4 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 2 months to fill = $8,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 2 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $8,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $4,000 a month × 2 months to fill = $8,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | None set aside yet | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $12,000 of costs with no cushion behind it. / $4,000 a month × (3 months to fill, minus 0 months of reserves) = $12,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | 1 month or less | GAP | At your numbers, your reserves run out 2 months before the rooms fill. That's at least $8,000 of costs with no cushion behind it. / $4,000 a month × (3 months to fill, minus 1 month of reserves) = $8,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | 2 to 3 months | EXACT | At your numbers, your reserves cover the 3 months you expect lease-up to take, with nothing to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 3 months to fill = $12,000, against 3 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | 4 to 5 months | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 3 months to fill = $12,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | 6 months or more | COVERED | At your numbers, your reserves cover the 3 months you expect lease-up to take, with 3 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 3 months to fill = $12,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | About 3 months | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $12,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $4,000 a month × 3 months to fill = $12,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | None set aside yet | GAP | At your numbers, your reserves run out 4 months before the rooms fill. That's at least $16,000 of costs with no cushion behind it. / $4,000 a month × (4 months to fill, minus 0 months of reserves) = $16,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | 1 month or less | GAP | At your numbers, your reserves run out 3 months before the rooms fill. That's at least $12,000 of costs with no cushion behind it. / $4,000 a month × (4 months to fill, minus 1 month of reserves) = $12,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | 2 to 3 months | GAP | At your numbers, your reserves run out 1 month before the rooms fill. That's at least $4,000 of costs with no cushion behind it. / $4,000 a month × (4 months to fill, minus 3 months of reserves) = $4,000. We used the low end of your cost range and the high end of your reserves. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | 4 to 5 months | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 1 month to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 4 months to fill = $16,000, against 5 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | 6 months or more | COVERED | At your numbers, your reserves cover the 4 months you expect lease-up to take, with 2 months to spare. Each month past your plan costs at least $4,000. / $4,000 a month × 4 months to fill = $16,000, against 6 months of reserves. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | 4 months or more | Not sure | COST_ONLY | At your numbers, lease-up costs you at least $16,000 before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. / $4,000 a month × 4 months to fill = $16,000. We used the low end of your cost range. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| More than $4,000 | Not sure | None set aside yet | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| More than $4,000 | Not sure | 1 month or less | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| More than $4,000 | Not sure | 2 to 3 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| More than $4,000 | Not sure | 4 to 5 months | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| More than $4,000 | Not sure | 6 months or more | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| More than $4,000 | Not sure | Not sure | PER_MONTH | At your numbers, every month the rooms sit empty costs you at least $4,000. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. / We used the low end of your cost range: $4,000 a month before any rent comes in. |
| Not sure yet | About a month | None set aside yet | MONTHS_SHORT | Your reserves cover 0 months of the 1 month you expect lease-up to take. The other 1 month have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About a month | 1 month or less | MONTHS_COVERED | Your reserves cover the 1 month you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About a month | 2 to 3 months | MONTHS_COVERED | Your reserves cover the 1 month you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About a month | 4 to 5 months | MONTHS_COVERED | Your reserves cover the 1 month you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About a month | 6 months or more | MONTHS_COVERED | Your reserves cover the 1 month you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About a month | Not sure | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | None set aside yet | MONTHS_SHORT | Your reserves cover 0 months of the 2 months you expect lease-up to take. The other 2 months have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | 1 month or less | MONTHS_SHORT | Your reserves cover 1 month of the 2 months you expect lease-up to take. The other 1 month have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | 2 to 3 months | MONTHS_COVERED | Your reserves cover the 2 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | 4 to 5 months | MONTHS_COVERED | Your reserves cover the 2 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | 6 months or more | MONTHS_COVERED | Your reserves cover the 2 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 2 months | Not sure | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | None set aside yet | MONTHS_SHORT | Your reserves cover 0 months of the 3 months you expect lease-up to take. The other 3 months have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | 1 month or less | MONTHS_SHORT | Your reserves cover 1 month of the 3 months you expect lease-up to take. The other 2 months have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | 2 to 3 months | MONTHS_COVERED | Your reserves cover the 3 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | 4 to 5 months | MONTHS_COVERED | Your reserves cover the 3 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | 6 months or more | MONTHS_COVERED | Your reserves cover the 3 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | About 3 months | Not sure | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | None set aside yet | MONTHS_SHORT | Your reserves cover 0 months of the 4 months you expect lease-up to take. The other 4 months have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | 1 month or less | MONTHS_SHORT | Your reserves cover 1 month of the 4 months you expect lease-up to take. The other 3 months have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | 2 to 3 months | MONTHS_SHORT | Your reserves cover 3 months of the 4 months you expect lease-up to take. The other 1 month have no cushion behind them. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | 4 to 5 months | MONTHS_COVERED | Your reserves cover the 4 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | 6 months or more | MONTHS_COVERED | Your reserves cover the 4 months you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | 4 months or more | Not sure | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. / Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |
| Not sure yet | Not sure | None set aside yet | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| Not sure yet | Not sure | 1 month or less | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| Not sure yet | Not sure | 2 to 3 months | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| Not sure yet | Not sure | 4 to 5 months | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| Not sure yet | Not sure | 6 months or more | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| Not sure yet | Not sure | Not sure | NONE | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |

## Appendix C. ScoreApp sources read

ScoreApp Help Centre (support.scoreapp.com), read on 2026-11-26: Using the AI Builder (103); Creating a Results Page with the
AI Builder (247); AI Generated Result Sections, Smart Sections (216); Understanding AI Credits (241); ScoreApp AI Tools,
what data they access (244); Connecting ScoreApp to Claude and ChatGPT, MCP (239); Adding and Editing Score Tiers (19);
Using Score Tiers to Display Dynamic Content (145); Using Categories and Category Scores (146); Assigning Points to
Answers (144); Highest-Scoring Category and Personality-Style Quizzes (147); Creating your Results Page (90); Audiences
(201); Using End Logic (203); PDF Reports Overview (88); Configuring and Editing the Results Email (73); Answer Insights
Sections (237); The Scorecard Lead Form (69); Customise Lead Form Position and Appearance (186); Creating a Landing Page
(68); Multiple Landing Pages (199); Skipping Landing Page (159); Facebook and Meta Pixel Tracking and Events (100); Google
Tag Manager Custom Events (112); Webhooks Integration Guide (101); Adding Calendly to the Results Page (78); Adding a
Download PDF Button (227); What cookies ScoreApp uses (154); Pricing and Managing Your Plan (155). ScoreApp's reference
for AI assistants: www.scoreapp.com/llms-full.txt.

Two things the help centre does not document, so this brief does not rely on them: merge fields for answers inside page
text, and the exact list of merge fields in the results email. Where they would help, the brief gives a fallback.
