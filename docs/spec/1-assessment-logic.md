# The First Deal Risk Scorecard: assessment logic

Questions, scoring, the lease-up gap and the outcome logic.

- For: RoomIQ, room-by-room underwriting for coliving investors
- Builds on: `docs/gtm-brief.md`, `docs/scorecard-strategy.md`; the GTM's `deliverables/scorecard_spec.docx` and
  `lead_magnet_spec.xlsx`; the Roomiqscorecards proposal, idea I1
- Date: 2026-11-24
- Status: specification, ready to build. `content/scorecard.mjs` is written from this document and
  `tests/unit/scoring.test.mjs` pins section 11 to the digit.

Copy rules for every word below:

| Rule | Source |
|---|---|
| No accuracy, income, return or yield claims; the deal math is informational, not financial or lending advice | GTM-BRIEF.md, Section 5 |
| No named platform, competitor or data source; categories only | Section 5; landing page non-negotiable 2 |
| Zoning, financing and insurance are outside RoomIQ: "Not legal advice" | scorecard_spec.docx, Section 5 |
| Every statistic carries its source in the sentence; no market statistics | Section 5 |
| No em or en dashes; sentences of 28 words or fewer | skill; landing page CLAUDE.md |

## 1. Project variables

| Variable | Value |
|---|---|
| Product | RoomIQ: room-level market data and underwriting for US coliving investors |
| Audience | US investors before or during their first coliving deal; operators with 1 to 10 houses checking the next one |
| Traffic | Meta ads (through the Meta page's scorecard buttons, or straight to `/first-deal`), the production landing page's score buttons, community, events and outreach links |
| Time promise | about a minute: ten quick questions (taps, one typed market, three sliders) and one short form |
| Delivery | instant: the score on screen, the PDF report by email at once |
| Next step | a free forecast on their address (covered markets), or a 20-minute walkthrough with the founder |
| Rule line | "Zoning, financing and insurance sit outside RoomIQ. This is not legal, lending or financial advice." |

## 2. Overview and architecture

The funnel: landing page, eleven steps (ten questions, then first name and email), the result at once, an optional
deepener (twelve taps), the walkthrough booking, the PDF report.

**How each question is answered** (the owner's decision of 2026-11-26, for variety): G1 and Q1 to Q5 by tapping one
answer; G2 by typing the city or metro; G3, G4 and G5 by dragging a slider. Every answer is still one of the question's
options below, so the scoring, the metric and every page read it the same way.

Scored: five areas, one question each in the main quiz (weight 3) and two each in the deepener (weights 2 and 1).
Qualifying and the metric: five gateway questions. Unscored: two checklist questions, on the deepener page after its
scored questions.

| Area | Key | Weight | Why it exists |
|---|---|---|---|
| Rent Evidence | `rent` | 20% | the rent per room is the first borrowed number; every figure after it inherits it |
| Fill Speed | `fill` | 20% | the second borrowed number; the first months of cash flow ride on it |
| Nearby Supply | `supply` | 20% | competition within about 3 miles sets how hard rooms are to fill and what they can ask |
| Room Mix | `mix` | 20% | private and shared-bath rooms rent and fill differently: the biggest lever the buyer controls |
| Lease-up Reserves | `reserves` | 20% | the cushion and the deal math that carry the house through a slow lease-up |

## 3. Scoring and weighting

1. Each answer is worth 0 to 4 points (`maxPoints` 4), times its question's weight: main quiz 3, deepener 2 or 1.
2. The checklist's questions (C1, C2) carry no points: they never count toward a score. (The scoring also accepts an
   option without points, which leaves both the score and the maximum, for a question that may not apply.)
3. Area score = points earned / points possible x 100, over the questions shown and answered, rounded half up.
   Without the deepener, an area is its one main question: 0, 25, 50 or 100 (no main option is worth 3 points).
4. **Deal Readiness Score** = the average of the five unrounded area scores, rounded half up at the end. Higher is
   better everywhere the buyer looks.
5. Tiers: 0 to 39 Beginner, 40 to 69 Intermediate, 70 to 100 Advanced (section 8).
6. Bands for the area cards: Low 0 to 39, Medium 40 to 69, High 70 to 100. An area is strong at 75 or higher.

## 4. The metric: the lease-up gap

**Formula.** Uncovered months = max(0, N minus M). Lease-up gap = C x uncovered months. Lease-up cost = C x N.
C, N and M come from three gateway answers, mapped to keep the gap at its smallest honest value:

| G3 `carry`: about what will the house cost you each month before rent comes in? | C |
|---|---|
| Under $2,000 (`lt2k`) | $1,000 (half the cap) |
| $2,000 to $3,000 (`2to3k`) | $2,000 |
| $3,000 to $4,000 (`3to4k`) | $3,000 |
| More than $4,000 (`over4k`) | $4,000 |
| Not sure yet (`unsure`) | none |

| G4 `fillmonths`: how long do you expect the rooms to take to fill? | N |
|---|---|
| About a month (`m1`) | 1 |
| About 2 months (`m2`) | 2 |
| About 3 months (`m3`) | 3 |
| 4 months or more (`m4`) | 4 |
| Not sure (`unsure`) | none |

| G5 `reserves`: if no rent came in, how many months of costs could your reserves carry? | M |
|---|---|
| None set aside yet (`none`) | 0 |
| 1 month or less (`m1`) | 1 |
| 2 to 3 months (`m3`) | 3 |
| 4 to 5 months (`m5`) | 5 |
| 6 months or more (`m6`) | 6 |
| Not sure (`unsure`) | none |

Costs at the low end and reserves at the high end, so every figure reads "at least". Dollar figures are whole
thousands, so nothing is rounded. No outside average stands in for an unknown: the research found no typical lease-up
time for the seven metros.

**Variants** (`kind`). Exactly one shows on the results page, in the score email and on the report's metric page.
`{gap}`, `{cost}` and `{exposure}` are dollars; `{fill_months}`, `{reserve_months}`, `{uncovered_months}` and
`{spare_months}` are months with their unit ("1 month", "3 months").

| Kind | When | Results line |
|---|---|---|
| `gap` | C, N, M known; uncovered 1 or more | "At your numbers, your reserves run out {uncovered_months} before the rooms fill. That's at least {gap} of costs with no cushion behind it." |
| `exact` | C, N, M known; M = N | "At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with nothing to spare. Each month past your plan costs at least {cost}." |
| `covered` | C, N, M known; M > N | "At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with {spare_months} to spare. Each month past your plan costs at least {cost}." |
| `costOnly` | C, N known; M not sure | "At your numbers, lease-up costs you at least {exposure} before the rooms fill. You weren't sure how long your reserves would last, so check them against that number." |
| `perMonth` | C known; N not sure | "At your numbers, every month the rooms sit empty costs you at least {cost}. Your plan doesn't say yet how many months lease-up will take, and that is the number to find." |
| `monthsShort` | C not sure; N, M known; uncovered 1 or more | "Your reserves cover {reserve_months} of the {fill_months} you expect lease-up to take. The other {uncovered_months} have no cushion behind them." |
| `monthsCovered` | C not sure; N, M known; M >= N | "Your reserves cover the {fill_months} you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars." |
| `none` | C not sure; N or M not sure | "You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there." |

Math lines under the number:

| Kind | Math line |
|---|---|
| `gap` | "{cost} a month × ({fill_months} to fill, minus {reserve_months} of reserves) = {gap}. We used the low end of your cost range and the high end of your reserves." |
| `exact`, `covered` | "{cost} a month × {fill_months} to fill = {exposure}, against {reserve_months} of reserves. We used the low end of your cost range." |
| `costOnly` | "{cost} a month × {fill_months} to fill = {exposure}. We used the low end of your cost range." |
| `perMonth` | "We used the low end of your cost range: {cost} a month before any rent comes in." |

**The six-month strip** over the number: six tiles, month 1 to 6. Months 1 to min(M, N): lease-up, covered by reserves.
Months M + 1 to N: lease-up, not covered. Months N + 1 to 6: the rooms full, as planned. With M not sure, the lease-up
months show without coverage. With N not sure, the strip is left out. Its label: "Your first six months, as you plan
them."

**What it is not**: a forecast or a prediction. It treats each lease-up month as a month the house costs its full
carrying cost; rooms that fill sooner bring rent in sooner. The report says so.

## 5. Gateway questions

| Id | Key | Question | Options (key: label) | Feeds |
|---|---|---|---|---|
| G1 | `stage` | Where are you with coliving? | `learning`: Learning, no house yet; `looking`: Looking at houses; `contract`: Under contract; `own`: Converting my house; `operator`: I run 1 to 10 houses; `scaling`: More than 10 houses | the segment ("first deal" for the first four, "next deal" for operators); fit; call-only; call notes |
| G2 | `market` | Where is the house, or the market you're looking at? | typed; matched to `dfw`: Dallas-Fort Worth; `houston`: Houston; `atlanta`: Atlanta; `orlando`: Orlando; `jacksonville`: Jacksonville; `phoenix`: Phoenix; `lasvegas`: Las Vegas; else `other`: Another US market; the chip under the field answers `undecided`: Not decided yet | covered or not (section 10); the checklist page's city rule and insurance line; the report's cover; the stored city |
| G3 | `carry` | About what will the house cost you each month before rent comes in? | see section 4 | C |
| G4 | `fillmonths` | How long do you expect the rooms to take to fill? | see section 4 | N |
| G5 | `reserves` | If no rent came in, how many months of costs could your reserves carry? | see section 4 | M |

Help lines (G1 has none, so its six answers fit a phone's first screen): G2 "Just the city or metro, not the street
address." G3 "Loan payment, taxes, insurance and utilities, with every room empty. A range is fine." G4 "Counted from the
day rooms are ready to rent." G5 "Cash set aside for this house, after the down payment and the work."

**G2, typed.** A text field (placeholder "For example, Phoenix", up to 60 characters) with the seven metros as
suggestions, and a "Not decided yet" chip under it. The typed words name a preset metro when one of its aliases (the
metro's cities and suburbs, `content/scorecard.mjs`) appears in them as whole words; a state written at the end that
isn't the metro's rules it out ("Jacksonville, NC", "Dallas, GA"), and a few aliases need their state ("Arlington, TX",
"Glendale, AZ", "Henderson, NV"). Words that say no market is chosen yet ("not sure", "I don't know", "TBD", "anywhere":
`undecidedWords`, whole words) answer `undecided`, like the chip, unless a metro is also named ("Not sure, maybe Phoenix"
is Phoenix). Anything else is `other`. The words are kept as `marketText`, and as the lead's city outside the presets,
without any address: units go first ("Apt 4B", "Suite 200", "PO Box 9"), then a house number with its street up to the
street's word ("123 Main St Atlanta GA" keeps "Atlanta GA"), a numbered part with no street word (whole, between commas;
else its number), then every digit (so no house number, street or ZIP is stored). Words that name no place once cleaned
(a street alone, "123 Main St") are caught on the step, by the same rule the server applies. The server matches the
words again; it never takes the browser's key for them.

**G3 to G5, sliders.** One stop per answer, in the order above, without the "not sure" answer, which is a chip under the
slider. The slider starts in the middle and counts only once moved, tapped or set with the keys (or the chip is picked);
the answer shows above it ("$2,000 to $3,000 a month"), its first and last answers under its ends.

The contact step (S11), last: "Where should we send your report?" First name (required), email (required), and a
required box: "Email me my score, my report and the occasional underwriting tip. Unsubscribe any time." Button: "See my
score".

Step order: G1, G2, Q1, Q2, Q3, Q4, Q5, G3, G4, G5, S11.

## 6. The areas

### 6.1 Rent Evidence (`rent`)

Measures: "Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a
whole-home rent or a guess."

| Q | Key | Weight | Question | Options (points) |
|---|---|---|---|---|
| Q1 | `rentsource` | 3 | Where does your per-room rent number come from? | `none` I don't have one yet (0); `calculator` A platform's earnings calculator (1); `divide` Whole-home rent divided by bedrooms (1); `listings` Asking rents I found on room listings (2); `comps` Comps of nearby rooms, with how fast they filled (4) |
| D1 | `rentperroom` | 2 | Do you have a rent for each room, by bath type? | `notyet` Not yet (0); `same` One rent for every room (1); `split` A rough split, private and shared bath (2); `perroom` A rent per room, from nearby rooms with the same bath type and size (4) |
| D2 | `rentcomps` | 1 | How many nearby rooms is your rent number based on? | `none` None, or not sure (0); `few` 1 or 2 (1); `some` 3 to 9 (2); `many` 10 or more (4) |

| Band | Card text |
|---|---|
| Low | Your rent per room is a borrowed number: a guess, a platform's calculator or a whole-home rent split by bedrooms. Every figure after it, from cash flow to reserves, inherits the guess. The fix is a short list of rooms near the house, by bath type, with how fast they filled. It's the first thing to check before an offer. |
| Medium | Your rent comes from real room listings, which is a good start. But an asking rent is what a room hopes for, not what it filled at, and listings mix private and shared baths. Keep the rooms that actually filled, split them by bath type, and price each of your rooms from its own group. |
| High | Your rent comes from rooms nearby that filled, which is the evidence most first deals skip. Keep it current, because rents move with new supply and the seasons. Before the offer, check that your comps sit near the house and match each room's bath type and size. |

Fix-first line: "Your rent number is a guess. Check what rooms near the house rent for, by bath type, and how much evidence
stands behind it." Line variants: Q1 `calculator`: "A platform's earnings calculator is an estimate, not the rooms near
your house. Check those rooms, by bath type, before you trust it." Q1 `divide`: "Whole-home rent divided by bedrooms
isn't a room rent. Check what rooms near the house rent for, by bath type."

Quick wins: Q1 `none` "List 10 room listings within about 3 miles of the house, with each weekly rent and bath type";
`calculator` "Check the calculator's figure against 10 room listings within about 3 miles, by bath type"; `divide`
"Replace whole-home rent divided by bedrooms with 10 room listings nearby, private and shared bath kept apart";
`listings` "Check your listings again in two weeks and keep only the rooms that filled". D1 `notyet` and `same` "Give
each room its own rent, from rooms nearby with the same bath type and size"; `split` "Split your rents by room size as
well as bath type". D2 `none` and `few` "Base each room's rent on at least 5 rooms nearby, not 1 or 2".

### 6.2 Fill Speed (`fill`)

Measures: "Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from
an assumed vacancy rate."

| Q | Key | Weight | Question | Options (points) |
|---|---|---|---|---|
| Q2 | `fillsource` | 3 | How do you know how fast rooms fill near the property? | `none` I haven't looked (0); `vacancy` I assume a vacancy percentage (1); `stories` Host stories and forum posts (2); `reports` A platform's market reports (2); `observed` Observed fill times of comparable rooms nearby (4) |
| D3 | `occsource` | 2 | Where does your plan's occupancy figure come from? | `none` I haven't set one (0); `rule` A rule of thumb (1); `average` A platform's market average (2); `observed` Observed occupancy of comparable rooms nearby (4) |
| D4 | `launch` | 1 | Have you picked the month to start renting rooms? | `notyet` Not yet (0); `whenever` Whenever the work is done (1); `heard` A season I've heard is busy (2); `timed` When rooms nearby fill fastest (4) |

| Band | Card text |
|---|---|
| Low | You don't know how fast rooms fill near the house, so your lease-up months are a guess. The costs start on day one, and the rent arrives room by room. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. Watching real rooms nearby can. |
| Medium | You have a sense of how rooms fill, from stories, forums or a market report. Those describe a market, not the street the house is on, and rooms a few miles apart can fill at different speeds. Check how comparable rooms near the house filled, and set your lease-up months from that. |
| High | Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months, and the reserves sized from them, something you can defend. Watch the month you launch in: the same room can fill faster or slower depending on the season. |

Fix-first line: "You don't know how fast rooms fill nearby, and your first months of cash flow depend on it." Line
variant: Q2 `vacancy`: "An assumed vacancy rate isn't fill speed. Check how fast comparable rooms near the house actually
filled."

Quick wins: Q2 `none` "Pick 5 room listings near the house and check every few days for two weeks which ones fill";
`vacancy` "Swap the assumed vacancy rate for a count: of 5 room listings nearby, how many fill within two weeks";
`stories` "Check the stories against 5 room listings near the house: note which fill within two weeks"; `reports`
"Check the report's market figure against 5 listings near the house, because a metro average can hide a slow street".
D3 `none` and `rule` "Replace the rule of thumb with what rooms nearby show: how many are full right now"; `average`
"Check the market average against the rooms near the house". D4 `notyet` and `whenever` "Pick your launch month: find
when rooms near the house fill fastest, and finish the work before it".

### 6.3 Nearby Supply (`supply`)

Measures: "Checks whether you know how many coliving homes compete within about 3 miles, how full they are, and
what's new."

| Q | Key | Weight | Question | Options (points) |
|---|---|---|---|---|
| Q3 | `supply` | 3 | How many coliving homes compete within about 3 miles? | `none` No idea (0); `some` Some, I think (1); `counted` I counted listings (2); `known` I know the count and roughly how full they are (4) |
| D5 | `newsupply` | 2 | Do you know whether new coliving homes opened nearby this year? | `none` No idea (0); `think` I think a few did (1); `checked` I checked the current listings (2); `track` I track homes that open and close nearby (4) |
| D6 | `pricedrops` | 1 | Have rooms near the house been cutting their rents? | `unsure` I don't know (0); `heard` I've heard so (1); `seen` I've seen a few drop (2); `checked` I've checked recent price drops on comparable rooms (4) |

| Band | Card text |
|---|---|
| Low | You don't know how many coliving homes compete near the house. Supply nearby decides how hard your rooms will be to fill and what they can ask. A street with many open rooms and falling rents needs a different plan from one with a few full homes. Count it before you buy. |
| Medium | You've counted the listings, which many first-time buyers never do. A count doesn't say how full those homes are, or whether more are opening. Note the open rooms in each home, and any new listings or rent cuts. That tells you whether the pocket is filling up or already crowded. |
| High | You know the competition: how many homes, and roughly how full they are. Keep watching, because supply keeps changing after you buy. New homes opening nearby, or rooms cutting their rents, are the early signs to adjust your plan. |

Fix-first line: "Supply nearby decides how hard your rooms will be to fill. Count it before you buy."

Quick wins: Q3 `none` and `some` "Count the coliving homes with rooms listed within about 3 miles of the house";
`counted` "Next to each home you counted, note how many of its rooms are open right now". D5 `none` and `think` "Look up
which coliving homes near the house started listing rooms this year". D6 `unsure` and `heard` "Check whether rooms
near the house cut their rents in the last few months".

### 6.4 Room Mix (`mix`)

Measures: "Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or
decided on a hunch."

| Q | Key | Weight | Question | Options (points) |
|---|---|---|---|---|
| Q4 | `bathmix` | 3 | Have you decided the bath mix? | `notyet` Not yet (0); `keep` Keeping the current bathrooms (1); `adding` Adding a bathroom because it seems worth it (2); `modeled` Modeled private against shared-bath rents nearby (4) |
| D7 | `roomcount` | 2 | How did you decide how many rooms to rent? | `notyet` Not decided yet (0); `max` As many as the house can fit (1); `current` The current bedroom count (2); `checked` A layout checked against rents nearby (4) |
| D8 | `sizemix` | 1 | Have you checked which room sizes rent best nearby? | `none` Not yet (0); `assume` I assume bigger rooms rent better (1); `seen` I've seen a few listings (2); `compared` I compared rents and fill speed by room size nearby (4) |

| Band | Card text |
|---|---|
| Low | You haven't priced the bath mix yet. Private-bath and shared-bath rooms rent and fill differently, so two houses with the same bedroom count can earn very different money. Deciding the mix before you see those spreads is guessing at the biggest lever you control. Compare private and shared-bath rents nearby before you plan any work. |
| Medium | You've made a call on the bathrooms, but not from the rooms nearby. Adding a bath because it seems worth it, or keeping the ones you have, can both be right. The rents of private and shared-bath rooms nearby tell you which. Price the house both ways before you book the work. |
| High | Your bath mix comes from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. Before the offer, check that the room count also fits the city's rule on unrelated adults sharing a home. |

Fix-first line: "Bath mix is a structural revenue driver. Compare private and shared-bath rents nearby before you build."

Quick wins: Q4 `notyet` "Write down the weekly rents of 5 private-bath and 5 shared-bath rooms nearby, and the
difference"; `keep` "Price the house both ways: the baths as they are, and with one more private bath"; `adding` "Before
you book a plumber, compare private and shared-bath rents nearby". D7 `notyet` and `max` "Check the room count against
rents nearby and against the city's rule on unrelated adults". D8 `none` and `assume` "Group your nearby rooms by size
too, large, medium and small, with the rent and fill speed of each".

### 6.5 Lease-up Reserves (`reserves`)

Measures: "Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches
nearby filled."

| Q | Key | Weight | Question | Options (points) |
|---|---|---|---|---|
| Q5 | `slowplan` | 3 | What happens if lease-up takes longer than planned? | `none` I haven't planned for it (0); `lower` I'd lower rents (1); `weeks` A few weeks of reserves (2); `sized` Reserves sized from how comparable launches nearby filled (4) |
| D9 | `dealmath` | 2 | Where do the numbers in your deal math come from? | `none` I haven't run the numbers yet (0); `defaults` A calculator's default settings (1); `mine` My own estimates (2); `evidence` Rents and occupancy of comparable rooms, with my own costs (4) |
| D10 | `stress` | 1 | Does your deal math test a slower lease-up? | `no` No (0); `vacancy` I add a vacancy rate on top (1); `onecase` I test one slower case (2); `comps` I test it against how comparable launches nearby filled (4) |

| Band | Card text |
|---|---|
| Low | You haven't planned for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. Cutting rents is the usual reflex, and a cut room keeps the lower rent after it fills. Size your reserves from how comparable launches nearby filled, before you make the offer. |
| Medium | You have some reserves, but they aren't sized from evidence. A few weeks may cover a quick lease-up and not a slow one. Work out your monthly carrying cost, multiply it by the months lease-up could take, and set the reserves from that number. |
| High | Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. Keep a slower case in your deal math. Revisit it whenever rents or supply near the house change. |

Fix-first line: "Lease-up can stall. Size reserves from how comparable launches nearby actually filled."

Quick wins: Q5 `none` "Multiply your monthly carrying cost by the months you expect lease-up to take, and compare it
with your reserves"; `lower` "Write down the lowest rent per room at which the house still covers its monthly costs";
`weeks` "Turn a few weeks into a number: monthly carrying cost times the months a slow lease-up could take". D9 `none`
and `defaults` "Run your deal math on your own costs and on room rents from nearby rooms, not a calculator's defaults".
D10 `no` "Add one slower case to your deal math: the same rents, with lease-up taking twice as long"; `vacancy` "Drop the
extra vacancy rate if your occupancy already comes from rooms nearby, because it counts empty rooms twice".

### 6.6 The checklist (not scored, on the deepener page after D10)

| Q | Key | Question | Options |
|---|---|---|---|
| C1 | `zoning` | Have you checked the city's rule on unrelated adults sharing a home? | `notyet` Not yet; `asked` I asked around; `summary` I read a summary online; `code` I checked the city code; `confirmed` I confirmed with the city or an attorney |
| C2 | `financing` | How will you finance the house? | `unsure` Not sure yet; `wholehome` A loan sized on whole-home rent; `cash` Cash; `roomlender` A lender who works with coliving, briefed on room income |

The checklist's flag (`checklistFlag`): C1 `notyet`, `asked` or `summary` puts this quick win first, whatever the area
scores, and adds the note on the city's rule to the weakest area's page: "Read your city's rule on unrelated adults
sharing a home, then confirm it with the city or an attorney".

## 7. Branching

| Answer | Hides | Why |
|---|---|---|
| Q1 `none` (no rent number yet) | D1, D2 | there is no rent to split or to count comps for |

A hidden question leaves both the score and the maximum; its answer, if sent, is dropped. With D1 and D2 hidden the
deepener has ten questions; otherwise twelve.

## 8. Output framework

| Tier | Range | Name | Descriptor | Trait | Tone |
|---|---|---|---|---|---|
| `beginner` | 0 to 39 | Beginner: underwriting on assumptions | Your numbers lean on estimates more than evidence. | The rent and the fill time are borrowed numbers; each one can be checked before an offer | Direct, never shaming |
| `intermediate` | 40 to 69 | Intermediate: partial evidence | You have part of the picture. | Some numbers rest on evidence; the gaps left decide whether rooms fill | Encouraging |
| `advanced` | 70 to 100 | Advanced: evidence-ready | You underwrite like an operator. | The plan rests on evidence; the open question is whether it holds for this address | Affirming |

**Urgency** (the tone of the fix-first area in the report and the call notes), from the uncovered months:

1. Uncovered months 2 or more: critical. 1: significant.
2. Uncovered months 0, or unknown: Rent Evidence at 25 or lower is critical; at 75 or higher, moderate; otherwise
   significant.

| Urgency | Words |
|---|---|
| critical | "This is the first thing to fix, before you make an offer." |
| significant | "Worth fixing before you make an offer." |
| moderate | "A refinement, while you compare houses." |

**Verdict clauses** (the call notes: "Your biggest gap is your {area}: {clause}. {urgency words}"):

| Key | Clause |
|---|---|
| `rent` | your rent per room is a borrowed number, not rooms nearby |
| `rentCalculator` | your rent comes from a platform's calculator, not the rooms near the house |
| `rentDivide` | your rent is a whole-home rent split by bedrooms |
| `fill` | you don't know how fast rooms fill near the house |
| `fillVacancy` | your plan assumes a vacancy rate instead of how fast rooms nearby fill |
| `supply` | you don't know how many coliving homes compete within about 3 miles |
| `mix` | your bath mix isn't priced from the rooms nearby |
| `reserves` | your reserves aren't sized for a slow lease-up |
| maintenance | "Every area is 75 or higher. Your plan rests on evidence; check that it holds for this address." |

## 9. The bottleneck algorithm

1. Rank the areas by unrounded score, lowest first. Ties go upstream: rent, fill, supply, mix, reserves.
2. If every area is 75 or higher: no bottleneck ("maintenance"); the fix-first line is "Every number rests on evidence.
   Your report shows how to check it holds for this address."; the quick wins become checks (section 9, step 7).
3. The primary is the lowest area. **The cascade**: if the primary is Room Mix or Lease-up Reserves, and Rent Evidence
   or Fill Speed is under 75, the primary becomes the lower of Rent Evidence and Fill Speed (ties: Rent Evidence), and
   the effect is reported as its effect: "Your {effect} score follows from your {cause} score: {why}", where why is "a
   bath mix is priced from what rooms rent for and how fast they fill, by bath type" (Room Mix) or "reserves can only be
   sized once you know what rooms rent for and how fast they fill" (Lease-up Reserves).
4. The secondary is the lowest-ranked area that is not the primary.
5. The fix-first line is the primary's line, or its line variant when the answer matches (section 6).
6. Quick wins, three at most, never the same words twice: the rule flag first (section 6.6); then, in question order,
   every weight 3 or 2 question in the primary area scored 0 or 1; then the same in the secondary area; then every
   weight 1 question scored 0 or 1; then, while fewer than three, any other answer with quick-win words, area by area in
   the order primary, secondary, then the ranking.
7. Maintenance checks, one from each of the three lowest areas: `rent` "Once a month, recheck five rooms near the house:
   rent, bath type and whether they filled"; `fill` "Every two weeks, note which of five room listings nearby have
   filled"; `supply` "Once a month, count the coliving homes within about 3 miles and note any new ones"; `mix` "Before
   any work, price the house both ways: the baths as they are, and with one more private bath"; `reserves` "When rents or
   supply nearby change, rerun your slower lease-up case".

## 10. Fit and routing

| Rule | When | Effect |
|---|---|---|
| Qualified (`qualified`) | any stage but `learning`, and a covered market | stored with the lead; the `Schedule` event for a booked walkthrough |
| Under the floor (`learning`) | G1 `learning` | full result and report; nurture, not sales |
| Outside (`outside`) | G2 `other` or `undecided` | full result and report; no free forecast card; "Look up your market" instead |
| Call-only | G1 `scaling` | the walkthrough first; no free-forecast push |
| Covered markets | `dfw`, `houston`, `atlanta`, `orlando`, `jacksonville`, `phoenix`, `lasvegas` (until the coverage check's list) | the free forecast card |

What Meta is told: `ScorecardStart` when the quiz is first opened; `ScorecardComplete` for every completed scorecard
(email sent, score shown), from the pixel and the Conversions API with one `event_id`, `content_name: scorecard`;
`Schedule` for a qualified walkthrough booking. Only after the visitor allows it, never under Global Privacy Control,
never after an opt-out.

Notes for the call (the admin), by answer: G1 `contract` "House under contract: time-sensitive. Offer the walkthrough
this week."; `own` "Owns the house and plans to convert it."; `operator` "Already rents rooms in 1 to 10 houses: a
founding cohort candidate."; `scaling` "Runs more than 10 houses: call only, an Operator plan conversation."; `learning`
"Learning, no house in mind yet: nurture, not sales." G2 `other` "Outside the preset metros: no free forecast offered;
check coverage first."; `undecided` "No market yet: the market ranking is the next step." G3 `unsure` "Doesn't know the
monthly carrying cost yet." G5 `none` "No reserves set aside yet." C1 `notyet` "Hasn't checked the city's rule on
unrelated adults." C2 `wholehome` "Financing on whole-home rent: the loan may not count room income."; `unsure` "No
financing plan yet." D10 `vacancy` "Adds a vacancy rate on top of observed occupancy: a possible double count."

Notes on the report, by answer: D10 `vacancy` (Lease-up Reserves) "A vacancy rate on top of an occupancy figure that
already counts empty rooms counts them twice."; D7 `max` (Room Mix) "More rooms is also a zoning question: cities cap
how many unrelated adults may share a home."

## 11. The worked example

Jordan, a made-up first-time investor, looking at houses in Atlanta.

| Step | Answer | Points x weight |
|---|---|---|
| G1 `stage` | Looking at houses (`looking`) | |
| G2 `market` | Atlanta (`atlanta`) | |
| Q1 `rentsource` | Asking rents I found on room listings (`listings`) | 2 x 3 = 6 of 12 |
| Q2 `fillsource` | I assume a vacancy percentage (`vacancy`) | 1 x 3 = 3 of 12 |
| Q3 `supply` | I counted listings (`counted`) | 2 x 3 = 6 of 12 |
| Q4 `bathmix` | Not yet (`notyet`) | 0 x 3 = 0 of 12 |
| Q5 `slowplan` | A few weeks of reserves (`weeks`) | 2 x 3 = 6 of 12 |
| G3 `carry` | $2,000 to $3,000 (`2to3k`) | C = $2,000 |
| G4 `fillmonths` | About 3 months (`m3`) | N = 3 |
| G5 `reserves` | 1 month or less (`m1`) | M = 1 |

**On screen** (main quiz only):

- Areas: Rent Evidence 50, Fill Speed 25, Nearby Supply 50, Room Mix 0, Lease-up Reserves 50.
- Deal Readiness Score: (50 + 25 + 50 + 0 + 50) / 5 = 175 / 5 = **35**, Beginner: underwriting on assumptions.
- Bands: Rent Evidence Medium, Fill Speed Low, Nearby Supply Medium, Room Mix Low, Lease-up Reserves Medium.
- Lease-up gap: uncovered months = 3 minus 1 = 2; gap = $2,000 x 2 = **$4,000** (kind `gap`); lease-up cost =
  $2,000 x 3 = $6,000. The strip: month 1 covered, months 2 and 3 not covered, months 4 to 6 full.
- Urgency: 2 uncovered months: critical.
- Bottleneck: the ranking is Room Mix 0, Fill Speed 25, Rent Evidence 50, Nearby Supply 50, Lease-up Reserves 50.
  Room Mix is an effect and Fill Speed (25) is under 75, so the primary is **Fill Speed** (the lower of Rent Evidence
  50 and Fill Speed 25), with the cascade "Your Room Mix score follows from your Fill Speed score". The secondary is Room
  Mix.
- Fix-first line (Q2 `vacancy`): "An assumed vacancy rate isn't fill speed. Check how fast comparable rooms near the
  house actually filled."
- Quick wins: (1) Q2 `vacancy`, primary, weight 3, 1 point; (2) Q4 `notyet`, secondary, weight 3, 0 points; (3) Q1
  `listings`, from the fallback (Rent Evidence's quick-win words).
- Verdict: "Your biggest gap is your Fill Speed: your plan assumes a vacancy rate instead of how fast rooms nearby fill.
  This is the first thing to fix, before you make an offer."
- Route: qualified (looking, Atlanta), not call-only, covered. Cards: your report, the free forecast, sharpen, the
  walkthrough, how RoomIQ shows its working.

**With the deepener** (the report), Jordan adds:

| Q | Answer | Points x weight |
|---|---|---|
| D1 `rentperroom` | A rough split, private and shared bath (`split`) | 2 x 2 = 4 |
| D2 `rentcomps` | 1 or 2 (`few`) | 1 x 1 = 1 |
| D3 `occsource` | A rule of thumb (`rule`) | 1 x 2 = 2 |
| D4 `launch` | Whenever the work is done (`whenever`) | 1 x 1 = 1 |
| D5 `newsupply` | I think a few did (`think`) | 1 x 2 = 2 |
| D6 `pricedrops` | I don't know (`unsure`) | 0 x 1 = 0 |
| D7 `roomcount` | As many as the house can fit (`max`) | 1 x 2 = 2 |
| D8 `sizemix` | I assume bigger rooms rent better (`assume`) | 1 x 1 = 1 |
| D9 `dealmath` | My own estimates (`mine`) | 2 x 2 = 4 |
| D10 `stress` | I add a vacancy rate on top (`vacancy`) | 1 x 1 = 1 |
| C1 `zoning` | Not yet (`notyet`) | not scored |
| C2 `financing` | A loan sized on whole-home rent (`wholehome`) | not scored |

- Rent Evidence: (6 + 4 + 1) / 24 = 11 / 24 = 45.8333, shown **46**.
- Fill Speed: (3 + 2 + 1) / 24 = 6 / 24 = **25**.
- Nearby Supply: (6 + 2 + 0) / 24 = 8 / 24 = 33.3333, shown **33**.
- Room Mix: (0 + 2 + 1) / 24 = 3 / 24 = 12.5, shown **13**.
- Lease-up Reserves: (6 + 4 + 1) / 24 = 45.8333, shown **46**.
- Deal Readiness Score: (45.8333 + 25 + 33.3333 + 12.5 + 45.8333) / 5 = 162.5 / 5 = 32.5, rounded half up **33**,
  Beginner.
- Bottleneck: Room Mix 12.5 is lowest, an effect; the primary is Fill Speed (25 against Rent Evidence's 45.8333), the
  cascade from Room Mix; the secondary is Room Mix.
- Quick wins: (1) the checklist's flag, C1 `notyet`; (2) Q2 `vacancy`; (3) D3 `rule`.
- Report notes: D10 `vacancy` on Lease-up Reserves; D7 `max` on Room Mix.
- Call notes: C1 `notyet`, C2 `wholehome`, D10 `vacancy`.
- The metric and the urgency do not change: the deepener asks no metric question.

## 12. Content mapping

| Output | Field (lib/scoring.mjs `evaluate`) | Shown in |
|---|---|---|
| area scores and bands | `areas` | results bars and cards, report overview, admin |
| Deal Readiness Score, tier | `score`, `tier`, `tierName` | results, score email, report, admin, CRM |
| lease-up gap | `invisible` (`kind`, `unasked` = uncovered months, `workValue` = the gap, `cost`, `fill`, `reserves`, `exposure`, `spare`) | results metric card, score email, report page 4, admin, CSV |
| urgency | `urgency` | report, call notes |
| bottleneck, cascade, line | `bottleneck` | results fix-first line, report weakest page, method gap |
| quick wins | `quickWins` | report weakest page, score email |
| notes | `notes.report`, `notes.call` | report area pages, admin call notes |
| fit, qualified, route, covered | `fit`, `qualified`, `callOnly`, `covered` | CTA cards, Meta, admin, CRM |
| segment | `trade` (the G1 answer), `service` ("first deal" or "next deal") | admin breakdowns, copy |
