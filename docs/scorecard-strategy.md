# Scorecard strategy: The First Deal Risk Scorecard (RoomIQ)

Built from `docs/gtm-brief.md`. Starts from the client's pick, idea I1 in the Roomiqscorecards proposal (Path 1, a quiz),
and from the GTM's own Co-Living Deal Readiness spec (`deliverables/scorecard_spec.docx`,
`deliverables/lead_magnet_spec.xlsx`). Where the two differ, I1 wins, and each change is listed at the end and in
`docs/DECISIONS.md`.

## Who it is for and what it reveals

US investors before or during their first rent-by-the-room deal (the GTM's Level 2), and operators with 1 to 10
houses checking their next one (Level 1). It shows whether the deal plan rests on evidence or on borrowed numbers:
where the rent per room came from, how fast rooms fill nearby, what competes within about 3 miles, how the bath mix
was decided and how the reserves were sized. Then it turns three of their own answers into one number: the lease-up
months their reserves do not cover, in dollars.

The one sentence a buyer should be able to say at the end: "My plan runs on a guessed fill time, and if lease-up goes
the way I expect, I'm at least $4,000 short."

## The hook

**"Would your first rent-by-the-room deal survive its first six months?"** (I1's hook, verbatim; Version B's H1, 10
words.)

Variant hooks:

- Version A (Meta ads, 8 words at most): "Will your first deal survive six months?"
- Ad hooks, from the GTM's scorecard ads (one question each): "Where does your per-room rent number come from?", "How
  fast do rooms fill near the house?", "How many co-living homes compete within about 3 miles?" [assets_library.xlsx,
  Scorecard ads].
- For the landing page's buttons: "Score your next deal" (the buttons stay as they are).

## Areas, in causal order

Five areas, equal weight (20% each), as I1 lists them: "Rent evidence, fill speed, local competition, layout and
bathrooms, deal math and reserves".

| # | Key | Name | Measures | Method step |
|---|---|---|---|---|
| 1 | `rent` | Rent Evidence | whether the rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess | 1. Price each room |
| 2 | `fill` | Fill Speed | whether the plan's fill time and occupancy come from how comparable rooms nearby actually filled | 2. Time the fill |
| 3 | `supply` | Nearby Supply | whether they know how many co-living homes compete within about 3 miles, how full they are, and what is new | 3. Count the competition |
| 4 | `mix` | Room Mix | whether the bath mix and the room count were priced from private and shared-bath rooms nearby | 4. Price the bath mix |
| 5 | `reserves` | Lease-up Reserves | whether the deal math and the reserves were sized for a slow lease-up, from how comparable launches filled | 5. Size the cushion |

Why this order: rent and fill are the two borrowed numbers every pro forma starts from (the villain in the GTM's Meta
kit: "a typed rent, an assumed occupancy"). Supply sets how hard rooms are to fill and what they can ask. The room mix is
priced from rents and fill by bath type. Reserves are sized from the lease-up the first four determine.

**The cascade** (I1's aha: "A guessed rent figure inflates every number after it"): Room Mix and Lease-up Reserves follow
from Rent Evidence and Fill Speed. While Rent Evidence or Fill Speed is under 75, a weakest Room Mix or Lease-up
Reserves is never the thing to fix first: the weaker of Rent Evidence and Fill Speed is (ties: Rent Evidence), and the
effect is reported as its effect. Nearby Supply is a fact of the street, not an effect.

Tie order for fix first (upstream first): rent, fill, supply, mix, reserves. Strongest-area ties: the same order.

## The questions (eleven steps, about a minute)

Taps first, contact last. Ten taps and one short form. Five scored questions keep the GTM spec's wording, options and
points (its questions 1, 2, 3, 4 and 7), in its order (lowest points first). The GTM's zoning and financing questions
(5 and 6) become I1's unscored checklist, in the deepener and on a report page everyone gets.

| Id | Key | Kind | Question | Options (points or value) | Why it is asked |
|---|---|---|---|---|---|
| G1 | `stage` | gateway (segment) | Where are you with rent-by-the-room? | Learning, no house yet; Looking at houses; Under contract; Converting my house; I run 1 to 10 houses; More than 10 houses | the segment; "first deal" or "next deal" words; fit (learning is under the floor); call-only (more than 10 houses) |
| G2 | `market` | gateway | Where is the house, or the market you're looking at? | Dallas-Fort Worth; Houston; Atlanta; Orlando; Jacksonville; Phoenix; Las Vegas; Another US market; Not decided yet | covered market or not: the free forecast is offered only in covered markets; the city's rule on unrelated adults and the insurance line on the checklist page |
| Q1 | `rentsource` | scored, Rent Evidence, x3 | Where does your per-room rent number come from? | I don't have one yet (0); A platform's earnings calculator (1); Whole-home rent divided by bedrooms (1); Asking rents I found on room listings (2); Comps of nearby rooms, with how fast they filled (4) | rent is evidence or assumption |
| Q2 | `fillsource` | scored, Fill Speed, x3 | How do you know how fast rooms fill near the property? | I haven't looked (0); I assume a vacancy percentage (1); Host stories and forum posts (2); A platform's market reports (2); Observed fill times of comparable rooms nearby (4) | lease-up risk awareness |
| Q3 | `supply` | scored, Nearby Supply, x3 | How many co-living homes compete within about 3 miles? | No idea (0); Some, I think (1); I counted listings (2); I know the count and roughly how full they are (4) | saturation risk |
| Q4 | `bathmix` | scored, Room Mix, x3 | Have you decided the bath mix? | Not yet (0); Keeping the current bathrooms (1); Adding a bathroom because it seems worth it (2); Modeled private against shared-bath rents nearby (4) | room-segment economics |
| Q5 | `slowplan` | scored, Lease-up Reserves, x3 | What happens if lease-up takes longer than planned? | I haven't planned for it (0); I'd lower rents (1); A few weeks of reserves (2); Reserves sized from how comparable launches nearby filled (4) | reserve planning |
| G3 | `carry` | gateway (metric) | About what will the house cost you each month before rent comes in? | Under $2,000 ($1,000); $2,000 to $3,000 ($2,000); $3,000 to $4,000 ($3,000); More than $4,000 ($4,000); Not sure yet (none) | the metric's monthly cost |
| G4 | `fillmonths` | gateway (metric) | How long do you expect the rooms to take to fill? | About a month (1); About 2 months (2); About 3 months (3); 4 months or more (4); Not sure (none) | the metric's lease-up months |
| G5 | `reserves` | gateway (metric) | If no rent came in, how many months of costs could your reserves carry? | None set aside yet (0); 1 month or less (1); 2 to 3 months (3); 4 to 5 months (5); 6 months or more (6); Not sure (none) | the metric's reserve months |
| S11 | `contact` | fields | Where should we send your report? | first name, email, email consent (required) | contact last; the button says "See my score" |

Help lines: G3 "Loan payment, taxes, insurance and utilities, with every room empty. A range is fine." G5 "Cash set aside
for this house, after the down payment and the work."

Not asked, though I1 lists them as qualifiers: the address, bedrooms, bathrooms and the rent figure itself. The free
forecast asks for them in the product, where they are used; asking here would add typing before the result. The
rent's source is Q1. The walkthrough booking asks for the address, optionally.

## Scoring

- Points 0 to 4 per answer, times the question's weight: 3 for the main quiz, 2 or 1 for the deepener.
- Area score = points earned / points possible x 100 over the questions shown and answered, rounded half up.
  On screen (main quiz only) each area is 0, 25, 50 or 100: the GTM's scale gives 4 only to the evidence answer.
- An option without points (the deepener's "There's no garage or extra space", the checklist questions) leaves both
  the score and the maximum.
- **Deal Readiness Score** = the average of the five unrounded area scores, rounded half up. Higher is better.
- Tiers: the GTM's three, its ranges, names and messages [lead_magnet_spec.xlsx, Results_Tiers].

| Range | Key | Name | Descriptor | Trait | Tone |
|---|---|---|---|---|---|
| 0 to 39 | `beginner` | Beginner: underwriting on assumptions | Your numbers lean on estimates more than evidence. | the rent and the fill time are borrowed numbers; each one can be checked before an offer | direct, never shaming |
| 40 to 69 | `intermediate` | Intermediate: partial evidence | You have part of the picture. | some numbers rest on evidence; the gaps left decide whether rooms fill | encouraging |
| 70 to 100 | `advanced` | Advanced: evidence-ready | You underwrite like an operator. | the plan rests on evidence; the open question is whether it holds for this address | affirming |

- Bands for the area cards: Low 0 to 39, Medium 40 to 69, High 70 to 100. Strong at 75.

## The metric: the lease-up gap

Pattern: a reserve shortfall, built only from the buyer's three answers (G3, G4, G5). I1's number, "Carrying cost ×
months to fill, minus reserves", with reserves counted in months of the same cost.

- Monthly cost **C** from G3 (the low end of each range; half the cap for "Under $2,000"), lease-up months **N** from G4
  (the low end: "4 months or more" is 4), reserve months **M** from G5 (the high end: "2 to 3 months" is 3).
- Uncovered months = max(0, N minus M). **Lease-up gap** = C x uncovered months. Lease-up cost = C x N.
- Conservative on purpose: costs at the low end and reserves at the high end, so the gap is "at least". Each line of
  math is printed under the number.
- It treats every lease-up month as a month the house costs its full carrying cost. Rooms that fill sooner bring rent
  sooner; the report says so. No outside average is used: the research found no typical lease-up time for these metros.

Variants (`kind`), each with its own words:

| Kind | When | Says |
|---|---|---|
| `gap` | C, N and M known, uncovered months 1 or more | the plan is short by at least the gap; the math line |
| `exact` | all known, reserves equal the lease-up months | reserves just cover the plan; each month past it costs at least C |
| `covered` | all known, reserves exceed the lease-up months | reserves cover the plan with months to spare; each month past it costs at least C |
| `costOnly` | C and N known, reserves not sure | the lease-up costs at least C x N; check reserves against it |
| `perMonth` | C known, lease-up months not sure | each month the rooms sit empty costs at least C |
| `monthsShort` | C not sure, N and M known, uncovered 1 or more | reserves cover M of the N months |
| `monthsCovered` | C not sure, reserves cover N | reserves cover the N months |
| `none` | C not sure, and N or M not sure | no number: work out the monthly cost first |

The results card draws the first six months as six tiles: lease-up months covered by reserves, lease-up months not
covered, and the months the plan expects the rooms full. With N not sure the strip is left out.

Worked example (spec 1, section 11): $2,000 to $3,000, about 3 months to fill, 1 month or less of reserves: $2,000 x
(3 minus 1) = **at least $4,000** short; the lease-up costs at least $6,000.

## Urgency, the bottleneck, quick wins

- **Urgency** (the tone of the fix-first line, the report and the call notes): uncovered months 2 or more is critical,
  1 is significant, 0 is moderate. With no count (reserves or lease-up months not sure, or the cost not sure with the
  months unknown): Rent Evidence at 25 or lower is critical, otherwise significant.
- **Bottleneck**: the weakest area, ties upstream; the cascade above; every area at 75 or more means no bottleneck
  ("maintenance"), and the lowest area is the next refinement.
- **Fix-first lines** per area, plus sharper lines for two answers: a platform calculator or whole-home rent divided by
  bedrooms (Rent Evidence), an assumed vacancy percentage (Fill Speed).
- **Quick wins**: three, doable this week without RoomIQ, each under an hour, keyed by answer. The zoning rule flag
  (the deepener's "Not yet" on the city's rule) goes first.

## Fit and routing

- **Qualified** (stored, shown in the admin and the CRM, used for the Schedule event): every stage but "Still learning,
  no house yet", in a covered market.
- **Under the floor**: "Learning" or a market outside the covered list. They get the full result and report; they are
  nurture, not sales.
- **Call-only**: "More than 10 houses": the walkthrough first, no free-forecast push (the Operator plan is a
  conversation).
- **Covered markets**: the seven preset metros, until the weekly coverage check publishes its list (a setting). Outside
  them the free forecast card is replaced by "Look up your market", and the report's checklist leads.
- **Checkout**: never (no checkout in this funnel; Pro starts in the product).
- **Meta**: `ScorecardStart` when the quiz is first opened and `ScorecardComplete` when the email is sent and the score
  shown, for every completion, with the same `event_id` on the pixel and the Conversions API [the GTM's event map; decision
  10 judges $12 per completion]. Only after consent, never under Global Privacy Control, never after an opt-out.
  `Schedule` for a qualified walkthrough booking.

## Next steps: the cards, in order

| Tier | Order |
|---|---|
| Beginner | your report (with the checklist), the free forecast, sharpen your report, the walkthrough, how RoomIQ shows its working |
| Intermediate | the free forecast, your report, sharpen, the walkthrough, how RoomIQ shows its working |
| Advanced, and call-only | the walkthrough, the free forecast, your report, sharpen, how RoomIQ shows its working |

- **The free forecast**: `https://roomiq.io/dashboard`, with `src=scorecard` and the visitor's campaign values carried.
  "Free plan. No card needed. Three forecasts a month."
- **The walkthrough** (the call step): "Book a 20-minute walkthrough on your address" with the founder. The next five
  business days, never the same day, no weekends, three windows; a phone number with an unticked consent to be called, a
  separate optional box for texts; the address, optional.
- **How RoomIQ shows its working**: `https://roomiq.io/?src=scorecard` (the landing page greets the visitor: "Your
  scorecard pointed here. Run the free forecast on your address.").

## The deepener: "Sharpen your report"

Ten scored questions, two per area, and the two checklist questions. Branching: "I don't have one yet" on Q1 hides D1
and D2.

| Id | Key | Area, weight | Question | Options (points) |
|---|---|---|---|---|
| D1 | `rentperroom` | Rent Evidence, 2 | Do you have a rent for each room, by bath type? | Not yet (0); One rent for every room (1); A rough split, private and shared bath (2); A rent per room, from nearby rooms with the same bath type and size (4) |
| D2 | `rentcomps` | Rent Evidence, 1 | How many nearby rooms is your rent number based on? | None, or not sure (0); 1 or 2 (1); 3 to 9 (2); 10 or more (4) |
| D3 | `occsource` | Fill Speed, 2 | Where does your plan's occupancy figure come from? | I haven't set one (0); A rule of thumb (1); A platform's market average (2); Observed occupancy of comparable rooms nearby (4) |
| D4 | `launch` | Fill Speed, 1 | Have you picked the month to start renting rooms? | Not yet (0); Whenever the work is done (1); A season I've heard is busy (2); When rooms nearby fill fastest (4) |
| D5 | `newsupply` | Nearby Supply, 2 | Do you know whether new co-living homes opened nearby this year? | No idea (0); I think a few did (1); I checked the current listings (2); I track homes that open and close nearby (4) |
| D6 | `pricedrops` | Nearby Supply, 1 | Have rooms near the house been cutting their rents? | I don't know (0); I've heard so (1); I've seen a few drop (2); I've checked recent price drops on comparable rooms (4) |
| D7 | `roomcount` | Room Mix, 2 | How did you decide how many rooms to rent? | Not decided yet (0); As many as the house can fit (1); The current bedroom count (2); A layout checked against rents nearby (4) |
| D8 | `sizemix` | Room Mix, 1 | Have you checked which room sizes rent best nearby? | Not yet (0); I assume bigger rooms rent better (1); I've seen a few listings (2); I compared rents and fill speed by room size nearby (4) |
| D9 | `dealmath` | Lease-up Reserves, 2 | Where do the numbers in your deal math come from? | I haven't run the numbers yet (0); A calculator's default settings (1); My own estimates (2); Rents and occupancy of comparable rooms, with my own costs (4) |
| D10 | `stress` | Lease-up Reserves, 1 | Does your deal math test a slower lease-up? | No (0); I add a vacancy rate on top (1); I test one slower case (2); I test it against how comparable launches nearby filled (4) |
| C1 | `zoning` | checklist, not scored | Have you checked the city's rule on unrelated adults sharing a home? | Not yet; I asked around; I read a summary online; I checked the city code; I confirmed with the city or an attorney |
| C2 | `financing` | checklist, not scored | How will you finance the house? | Not sure yet; A loan sized on whole-home rent; Cash; A lender who works with room rentals, briefed on room income |

## Enrichment

Off (`site.enrichment: false`). The outside data that would matter (a forecast on their address) is the product's job,
and the free forecast is the next step. No update is promised.

## Delivery

Instant: the score at once, and the PDF report emailed the moment the scorecard is finished, built from the answers.

## Emails

The funnel sends the score email with the PDF (the GTM's day 0 email, rewritten for the lease-up gap), the deepener
follow-up, the walkthrough confirmation and the team's notices, through Resend. The GTM's days 2, 5 and 8 emails stay in
Loops, as the GTM planned ("Connect the email sequence through Loops"), fed by the funnel's webhook; their words are in
spec 2, section 6.

## The report (US Letter PDF, and the same as a page)

1. Cover: their first name, the scorecard, the date, the market and the stage.
2. A letter from the founder (editable in the admin, on by default).
3. Overview: the score, the tier, the five areas at a glance, what the report covers.
4. Your first six months: the lease-up gap, its math, the six-month strip, what it means and what it does not.
5. Three checks RoomIQ can't do for you: the city's rule on unrelated adults (by market, as published), financing on
   room income, insurance for renting by the room; marked with their deepener answers when given. Not legal, lending or
   insurance advice.
6. The overall score: the tier's interpretation and the urgency line.
7. The strongest area. 8. The weakest area: fix first, the quick wins, the weekly check, the cascade line.
9. The method: the Room-by-Room Underwrite, where they stand on each step, the biggest gap.
10. Two ways to run it, and the first 30 days with RoomIQ.
11. The playbook: start here, five guides, the 30-day timeline, a five-day quick start, checklists, the weekly tracker.
12. The next step.

## The method: the Room-by-Room Underwrite

- **Outcome**: an offer where every number rests on evidence you can check.
- **Steps**, one per area: 1. Price each room (rents from rooms nearby, by bath type and size). 2. Time the fill (fill
  time and occupancy from comparable rooms, the launch month from the seasons). 3. Count the competition (co-living homes
  within about 3 miles, how full, what is new). 4. Price the bath mix (private against shared bath, and the room count,
  from rooms nearby). 5. Size the cushion (reserves from the lease-up the evidence supports, plus a slower case).
- **Where they stand**: from the area's answers: not started (the hero answer scores 0 or 1), started (2), running (4).
- **Two ways to run it**: by hand, with the playbook (listings, a spreadsheet, a two-week fill watch), or with RoomIQ's
  Free plan: the forecast for the address with its formula, comps and confidence; room rents by bath type and size;
  nearby supply within about 3 miles; seasonality; the deal math under your own assumptions. "Informational only, not
  financial or lending advice."
- **The first 30 days with RoomIQ**: week 1 the free forecast on the address and how to read its labels; week 2 the
  rooms nearby by bath type and size, and their 7, 30 and 90-day windows; week 3 the supply map and the seasons; week 4
  the room mix re-run and the deal math under your own costs, then the decision.

## Landing variants and traffic

| Path | Variant | For |
|---|---|---|
| `/` | B, the ScoreApp template | organic, partners, community and event links |
| `/first-deal` | A, the quiz in the hero | Meta ads sent straight to the tool |
| `/start` | the quiz alone | the landing page's and the Meta page's score buttons (`site.scorecardUrl`), emails |

## Decisions made here (each is in docs/DECISIONS.md)

1. I1 over the GTM's seven questions: five scored areas; zoning and financing unscored (deepener and the checklist page);
   the lease-up gap as the number.
2. The GTM's three tiers, names and ranges kept (not the playbook's four): the deck, the ads and the landing page name
   them.
3. The score is the Deal Readiness Score, the name on the landing page's button; higher is better.
4. The five scored questions keep the GTM's words and points, lowest points first.
5. Five gateway questions (stage, market, monthly cost, lease-up months, reserve months); no address, bedrooms or rent
   figure in the quiz.
6. The metric's conservative bounds and its eight variants; no outside average.
7. The cascade from rent and fill to the room mix and the reserves (two effects, a small change to the template).
8. Covered markets: the seven preset metros until the coverage check's list exists.
9. Meta: ScorecardStart and ScorecardComplete for every consented completion, Schedule for qualified bookings, no Lead.
10. Emails: the funnel's own through Resend; days 2, 5 and 8 in Loops through the webhook.
11. Enrichment off; instant delivery.
12. The walkthrough: 20 minutes, the template's booking rules; the founder's hours to confirm.
