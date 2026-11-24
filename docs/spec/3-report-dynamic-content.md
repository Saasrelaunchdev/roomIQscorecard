# The First Deal Risk Scorecard: report, dynamic content

The report's pages that change with the answers: the cover, the overview, the first six months, the checks, the overall score, the strongest and weakest areas, and the field dictionary.

- For: RoomIQ, room-by-room underwriting for rent-by-the-room investors
- Builds on: spec 1 (the outcomes), spec 2 (the checks' words)
- Date: 2026-11-24
- Status: specification, built and tested. `content/report.mjs` and `content/checks.mjs` hold these words; `tests/unit/report-model.test.mjs` pins the variants and their math.

Every visitor-facing word below follows RoomIQ's claim rules (`rules/copy-rules.json`, from GTM-BRIEF.md Section 5
and the production landing page's non-negotiables). `tools/copy-lint.mjs` checks every word in `content/` on every
build and test run:

| Rule | What it means |
|---|---|
| accuracy | No accuracy claim before the 90-day backtest: say the estimate shows its working (decision 8) |
| income | No income, return or yield promise; the deal math is informational, not financial or lending advice |
| return-figure | No return, yield or cash-on-cash figure |
| best-markets | Write 'markets ranked by RoomIQ's Market Score', never 'the best markets to invest in' |
| collected | It is observed listing data: 'observed rents and occupancy, not collected payments' |
| named-platform | No named platform, data source or competitor: categories only |
| partnership | No implied partnership or endorsement |
| only | No 'only', 'first' or 'leading' claim |
| price-compare | No price comparison: publish the plans as they are |
| time-saved | No time-saved figure: nobody has timed the product flow |
| offer-terms | No price, trial or term in the funnel: the next step is the Free plan |
| determination | RoomIQ makes no zoning, compliance, insurance or flood determination and gives no advice |
| guarantee | No guarantee of any outcome |
| advice | Nothing that reads as investment advice |
| hype | Banned words (GTM-BRIEF.md Section 5, mechanics) |

Word budgets: H1 up to 10 words (Version A's within the landing page's 8), hero leads 26, H2s
9, FAQ answers 35, any sentence 28. No em or en dashes anywhere. Words in braces
are filled per visitor; spec 3, section 9 lists every field.

## 1. How the report is put together

A US Letter PDF of about 30 pages, the same as a page at `/report/<token>`. Delivery is instant
(`site.reportDelivery`): the PDF is built from the answers and emailed with the score the moment the scorecard is
finished; the deepener sends an updated one. Enrichment is off (`site.enrichment`), so the template's "Next to the top
three" page never shows and nothing waits on the team.

| Page | What it is | What chooses the variant | Words in |
|---|---|---|---|
| 1 | Cover | nothing: the reader's name, market and the date | report.cover |
| 2 | A note before you read: the letter and the contents | the admin's letter, signer and sections (spec 5) | method.letter |
| 3 | Your Report Overview | the area scores | report.overview, method.overview |
| 4 | Your First Six Months | the lease-up gap's kind (spec 1, section 4) | report.invisible |
| 5 | Three checks RoomIQ can't do for you | the market (the city's rule) and the checklist answers (the status chips) | content/checks.mjs, report.checks |
| 6 | Your Overall Score | the tier; the urgency; whether the deepener was answered | report.overall |
| 7 | Your strongest area | the strongest area (spec 1, section 9) | report.high |
| 8 | Your weakest area: fix first | the bottleneck, its cascade, the quick wins from the answers | report.low |
| 9 to 11 | The Room-by-Room Underwrite and where your plan stands (steps 1 to 3, then 4 and 5) | each step's score and the answers' own sentences | content/method.mjs (spec 5) |
| 12 | Two ways to run the method | nothing | method.ways (spec 5) |
| 13 | Your first 30 days with RoomIQ | the weakest area; whether a walkthrough is booked | method.days (spec 5) |
| 14 to 30 | The 30-day plan: start here, five guides (two pages each), the timeline, the quick start, the checklists, the tracker, your next step | the weakest area, the answers ("From your answers", the tracker's starting points), a covered market, a booking | content/playbook.mjs (spec 4) |

Every page carries the running footer and the page number:

| Field | Exact text |
|---|---|
| title | The First Deal Risk Scorecard Report |
| page | Page {n} |
| footer | The First Deal Risk Scorecard Report · {first_name} |
| scoreOf | {score} of 100 |
| notRead | Not read yet |

## 2. Cover

| Field | Exact text |
|---|---|
| cover · title | The First Deal Risk Scorecard Report |
| cover · subtitle | How much of the plan for your {deal} rests on evidence you can check, scored across five areas, with your first six months priced from your own numbers. |
| cover · preparedFor | Prepared for |
| cover · prepared | {first_name} {last_name}, {market} |
| cover · preparedNoLast | {first_name}, {market} |
| cover · checked | Checked by {checker_first_name} at RoomIQ |

## 3. Overview

The intro's last two sentences list the pages this report carries (from `content/method.mjs` overview).

| Field | Exact text |
|---|---|
| overview · title | Your Report Overview |
| overview · heading | Thank you for taking the First Deal Risk Scorecard |
| overview · intro | Your report scores your plan in the five areas below. A low score isn't a verdict on the deal: it means a number is borrowed, and borrowed numbers can be checked before an offer. A high score means the plan rests on evidence. Next come your Deal Readiness Score and your first six months. |
| overview · sub | Your five areas |

| Field | Exact text |
|---|---|
| method.overview · nextTop3 | Next come your Deal Readiness Score, your first six months and three checks RoomIQ can't do for you. |
| method.overview · nextNoTop3 | Next come your Deal Readiness Score, your first six months and three checks RoomIQ can't do for you. |
| method.overview · then | Then {items}. |
| method.overview · items · areas | your strongest and weakest areas |
| method.overview · items · method | the Room-by-Room Underwrite that closes the gaps |
| method.overview · items · service | how to run it with RoomIQ's Free plan |
| method.overview · items · playbook | a 30-day plan you can run by hand |

## 4. Your First Six Months

One variant per kind of lease-up gap (spec 1, section 4), with the strip, the box with the math, the slower case and
what the number is and isn't.

| Field | Exact text |
|---|---|
| invisible · title | Your First Six Months |
| invisible · gap · h | Your reserves run out {uncovered_months} early |
| invisible · gap · body | You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. At {cost} a month, the {uncovered_months} your reserves don't cover come to at least {gap}. |
| invisible · exact · h | Your reserves just cover your plan |
| invisible · exact · body | You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs, with nothing to spare. Each month past your plan costs at least {cost}. |
| invisible · covered · h | Your reserves cover your plan |
| invisible · covered · body | You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs: {spare_months} to spare. Each month past your plan costs at least {cost}. |
| invisible · costOnly · h | Your lease-up costs at least {exposure} |
| invisible · costOnly · body | You expect the rooms to take {fill_months} to fill, at {cost} a month before rent comes in. You weren't sure how long your reserves would last, so check them against that number. |
| invisible · perMonth · h | Every empty month costs at least {cost} |
| invisible · perMonth · body | That's what the house costs each month before rent comes in. Your plan doesn't say yet how many months lease-up will take, and the Fill Speed guide shows how to find out. |
| invisible · monthsShort · h | Your reserves cover {reserve_months} of {fill_months} |
| invisible · monthsShort · body | You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. Work out your monthly carrying cost next: it turns the other {uncovered_months} into dollars. |
| invisible · monthsCovered · h | Your reserves cover your lease-up months |
| invisible · monthsCovered · body | You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. Work out your monthly carrying cost next: it turns months into dollars. |
| invisible · none · h | The number to find first |
| invisible · none · body | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal. The Lease-up Reserves guide starts there. |
| invisible · box · title | How we worked it out |
| invisible · box · cost | Monthly carrying cost: {cost}, the low end of the range you picked. |
| invisible · box · fill | Months to fill: {fill_months}, as you expect them. |
| invisible · box · reserves | Reserves: {reserve_months} of costs, the high end of the range you picked. |
| invisible · box · gap | {cost} × ({fill_months} minus {reserve_months}) = {gap}. |
| invisible · box · exposure | {cost} × {fill_months} = {exposure}. |
| invisible · box · low | Costs at the low end and reserves at the high end, so the real figure is at least this large. |
| invisible · strip | Your first six months, as you plan them |
| invisible · legend · covered | Lease-up, covered by reserves |
| invisible · legend · uncovered | Lease-up, not covered |
| invisible · legend · unknown | Lease-up |
| invisible · legend · full | Rooms full, as planned |
| invisible · slowerTitle | The slower case |
| invisible · slower | If lease-up took twice as long as you expect, {slower_months}, your reserves would leave at least {slower_gap} uncovered. |
| invisible · slowerCovered | If lease-up took twice as long as you expect, {slower_months}, your reserves would still cover it. |
| invisible · means · title | What this number is, and what it isn't |
| invisible · means · body | It's your own plan, priced: what the house costs while rooms fill, against the cushion you hold. It isn't a forecast. It treats each lease-up month as a month the house costs its full carrying cost; rooms that fill sooner bring rent in sooner. |

## 5. Three checks RoomIQ can't do for you

The words are spec 2's, section 6 (`content/checks.mjs`): the city's rule for the market, financing on room income and
insurance, each with its status from the deepener's checklist answers. The page's own frame:

| Field | Exact text |
|---|---|
| checks · title | Three checks RoomIQ can't do for you |
| checks · lead | RoomIQ shows the evidence for the house. These three decide whether the plan is allowed, financed and insured. |
| checks · notAdvice | Not legal, lending or insurance advice. |
| checks · zoning · title | The city's rule on unrelated adults |
| checks · zoning · byMarket · dfw | Dallas allows a household of no more than four people unrelated to the head of the household (Dallas code §51A-2.102(36)). Fort Worth allows no more than five unrelated people as one housekeeping unit, and renting rooms separately may count as a different use (Fort Worth code §9.101). |
| checks · zoning · byMarket · houston | Houston: lodging three or more people unrelated to the owner makes a lodging facility, which needs a permit (Houston code §28-601 and following). No citywide cap on unrelated adults was found. |
| checks · zoning · byMarket · atlanta | Atlanta: no more than six people may live together unless all are related, with exceptions for roomers and boarders (Atlanta code §16-29.001(10)(b)). |
| checks · zoning · byMarket · orlando | Orlando publishes no cap on unrelated adults that the research found (Land Development Code, Chapter 58). Confirm it with the City's zoning office. |
| checks · zoning · byMarket · jacksonville | Jacksonville: no household of more than five people unless all are related (Jacksonville code §656.1601). |
| checks · zoning · byMarket · phoenix | Phoenix: no more than five people, who need not be related, as one housekeeping unit. Six or more paying to live there make a boarding house (Phoenix zoning ordinance §202). |
| checks · zoning · byMarket · lasvegas | Las Vegas: no more than four unrelated people as one housekeeping unit; the text the research found may be dated (Las Vegas code §19.20.020). |
| checks · zoning · byMarket · other | Rules on unrelated adults sharing a home differ by city, and some cities treat renting rooms separately as a different use. |
| checks · zoning · byMarket · undecided | Rules on unrelated adults sharing a home differ by city. Check the rule for every market on your shortlist. |
| checks · zoning · ask | Read the rule in the city code, then confirm it for the address with the city or an attorney. |
| checks · zoning · asOf | As each city's code publishes it, checked in November 2026. |
| checks · financing · title | Financing on room income |
| checks · financing · body | Many loans are sized on the appraised whole-house rent, not on room rents. |
| checks · financing · ask | Talk early to a lender who knows room rentals, and bring your rent per room with the rooms behind it. |
| checks · insurance · title | Insurance for renting by the room |
| checks · insurance · body | Insurance is not a given: some insurers decline homes rented by the room. |
| checks · insurance · byMarket · dfw | The one rent-by-the-room insurance program the research found excludes the Dallas-Fort Worth counties. |
| checks · insurance · byMarket · houston | The one rent-by-the-room insurance program the research found excludes Houston. |
| checks · insurance · ask | Get a quote that covers renting by the room before you make the offer. |
| checks · status · labels · done | Done |
| checks · status · labels · partly | Started |
| checks · status · labels · todo | To do |
| checks · status · zoning · notyet · mark | todo |
| checks · status · zoning · notyet · t | You haven't checked it yet. |
| checks · status · zoning · asked · mark | todo |
| checks · status · zoning · asked · t | You asked around. Hearsay isn't the rule: read it in the code. |
| checks · status · zoning · summary · mark | partly |
| checks · status · zoning · summary · t | You read a summary online. Summaries can be dated: read the code itself. |
| checks · status · zoning · code · mark | partly |
| checks · status · zoning · code · t | You checked the city code. Confirm it for the address with the city or an attorney. |
| checks · status · zoning · confirmed · mark | done |
| checks · status · zoning · confirmed · t | You confirmed it with the city or an attorney. |
| checks · status · financing · unsure · mark | todo |
| checks · status · financing · unsure · t | You're not sure yet how you'll finance the house. |
| checks · status · financing · wholehome · mark | todo |
| checks · status · financing · wholehome · t | You plan a loan sized on whole-home rent, which may not count your room income. |
| checks · status · financing · cash · mark | done |
| checks · status · financing · cash · t | You plan to pay cash, so no lender sizes the loan. |
| checks · status · financing · roomlender · mark | done |
| checks · status · financing · roomlender · t | You've briefed a lender who works with room rentals. |
| checks · status · noAnswer | Add your answers in Sharpen your report to mark this check. |

## 6. Your Overall Score

| Field | Exact text |
|---|---|
| overall · title | Your Overall Score |
| overall · paragraph | Your Deal Readiness Score is the average of your five area scores, each out of 100. It measures how much of your plan rests on evidence you can check, not the house, the market or what the deal will return. Under 40, the plan leans on borrowed numbers. From 40 to 69, part of it rests on evidence. At 70 and above, the plan rests on evidence, and the open question is whether it holds for this address. |
| overall · deepenerYes | Updated with your {n} extra answers. |
| overall · deepenerNo | Based on your {n_main} answers. Add {n} more for a sharper score: |
| overall · deepenerLinkText | sharpen your report |
| overall · interpretation · beginner | Your plan leans on estimates more than evidence. That's normal for a first deal, and it's fixable before the offer. The rent per room and the fill time are the numbers every other one rests on, and right now at least one of them is borrowed. Start with {primary_bottleneck}, follow the 30-day plan from day one, and take the scorecard again on day 30. |
| overall · interpretation · intermediate | You have part of the picture. Some of your numbers rest on evidence, and the gaps left are the ones that decide whether rooms fill. Your lowest area, {primary_bottleneck}, is where to start. Close it before the offer, and your next score will show it. |
| overall · interpretation · advanced | You underwrite like an operator: your numbers rest on evidence most first deals skip. The open question is whether that evidence holds for this specific address. Recheck rents, fill speed and supply the week you make the offer, and keep the slower case in your deal math. |
| overall · urgency · critical | At your numbers, your reserves leave {uncovered_months} uncovered, so this is the first thing to fix, before you make an offer. |
| overall · urgency · criticalUnknown | This is the first thing to fix, before you make an offer. |
| overall · urgency · significant | At your numbers, your reserves leave {uncovered_months} uncovered, so it's worth fixing before you make an offer. |
| overall · urgency · significantUnknown | Worth fixing before you make an offer. |
| overall · urgency · moderate | Treat it as a refinement, while you compare houses. |
| overall · areasTitle | Your five areas |

## 7. Strongest area pages (one per area)

### Strongest: Rent Evidence

| Field | Exact text |
|---|---|
| h | Your Rent Evidence Is Your Strongest Asset |
| means · lead | Your rent per room comes from rooms nearby that filled. That's the evidence most first deals skip, and every other number in the plan rests on it. |
| means · bullets 1 | Your rent comes from rooms near the house, not a calculator |
| means · bullets 2 | Rooms are priced by bath type and size |
| means · bullets 3 | Only rooms that actually filled count |
| means · bullets 4 | You can show the rooms your rent rests on |
| next · lead | Rents move with new supply and the seasons. Keep the evidence current. |
| next · bullets 1 | Recheck five rooms near the house once a month |
| next · bullets 2 | Recheck the whole list the week you make the offer |
| next · bullets 3 | Keep the asking rents apart from the rooms that filled |
| impact · lead | Rent is upstream of everything else in the plan. Because yours rests on evidence, the deal math and the reserves have something real to work with. |
| impact · bullets 1 | Your cash flow starts from rents the street supports |
| impact · bullets 2 | Your bath mix can be priced from the same list |
| impact · bullets 3 | A lender or partner can see what the rent rests on |

### Strongest: Fill Speed

| Field | Exact text |
|---|---|
| h | Your Fill Speed Is Your Strongest Asset |
| means · lead | Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months something you can defend. |
| means · bullets 1 | Your lease-up months come from rooms you watched or checked |
| means · bullets 2 | Occupancy comes from comparable rooms, not a rule of thumb |
| means · bullets 3 | Your launch month follows the seasons |
| means · bullets 4 | A slow lease-up is in the plan, not a surprise |
| next · lead | Fill speed changes with the season and with new supply. Recheck it before the offer. |
| next · bullets 1 | Recheck a few rooms nearby before the offer |
| next · bullets 2 | Keep a slower case beside your plan |
| next · bullets 3 | Note which months rooms fill fastest |
| impact · lead | Your first months are when the costs run before the rent does: the costs start on day one, and rent arrives room by room. Knowing the fill speed makes that stretch plannable. |
| impact · bullets 1 | Your reserves can be sized from evidence |
| impact · bullets 2 | Your launch can be timed to the faster months |
| impact · bullets 3 | Your deal math starts from observed occupancy |

### Strongest: Nearby Supply

| Field | Exact text |
|---|---|
| h | Your Read on Nearby Supply Is Your Strongest Asset |
| means · lead | You know the competition: how many co-living homes compete within about 3 miles, and roughly how full they are. |
| means · bullets 1 | You counted the homes near the house |
| means · bullets 2 | You know roughly how many rooms are open |
| means · bullets 3 | You watch for new homes and rent cuts |
| means · bullets 4 | You can tell a busy pocket from a crowded one |
| next · lead | Supply keeps changing after you buy. Keep the count current. |
| next · bullets 1 | Count again once a month |
| next · bullets 2 | Note new homes and rent cuts |
| next · bullets 3 | Count again the week you make the offer |
| impact · lead | Supply sets how hard rooms are to fill and what they can ask. Because you know it, your rent and fill plans rest on the street as it is. |
| impact · bullets 1 | Your rent is set against real competition |
| impact · bullets 2 | Your lease-up months account for the open rooms nearby |
| impact · bullets 3 | You get early warning when the pocket gets crowded |

### Strongest: Room Mix

| Field | Exact text |
|---|---|
| h | Your Room Mix Is Your Strongest Asset |
| means · lead | Your bath mix and room count come from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. |
| means · bullets 1 | The bath mix is priced from rooms nearby |
| means · bullets 2 | The house is priced both ways before any work |
| means · bullets 3 | The room count is checked against rents nearby |
| means · bullets 4 | The garage or extra space is priced both ways |
| next · lead | Before the offer, check the room count against the city's rule too. |
| next · bullets 1 | Read the city's rule on unrelated adults sharing a home |
| next · bullets 2 | Get a quote before you book any work |
| next · bullets 3 | Recheck private and shared-bath rents before the offer |
| impact · lead | Private-bath supply and shared-bath pressure are structural revenue drivers. Because your mix is priced from evidence, the biggest lever in the plan rests on rooms you can show. |
| impact · bullets 1 | Two houses with the same bedrooms can earn very different money, and yours is priced |
| impact · bullets 2 | Work gets booked for what pays, not for what seems worth it |
| impact · bullets 3 | The forecast can be run with the mix you plan |

### Strongest: Lease-up Reserves

| Field | Exact text |
|---|---|
| h | Your Lease-up Reserves Are Your Strongest Asset |
| means · lead | Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. |
| means · bullets 1 | Reserves are sized in months of cost |
| means · bullets 2 | A slower lease-up is in the plan |
| means · bullets 3 | The deal math runs on your own costs and rooms nearby |
| means · bullets 4 | Empty rooms are counted once |
| next · lead | Keep the cushion honest as the plan changes. |
| next · bullets 1 | Rerun the slower case when rents or supply change |
| next · bullets 2 | Keep the reserves apart from the money for the work |
| next · bullets 3 | Check the cushion monthly until the rooms are full |
| impact · lead | A sized cushion makes a slow lease-up part of the plan instead of a surprise. |
| impact · bullets 1 | Your plan has room to hold rents while rooms fill, instead of cutting them first |
| impact · bullets 2 | A lender or partner can see the cushion and what it rests on |
| impact · bullets 3 | The first six months are planned, month by month |

## 8. Weakest area pages (one per area)

The quick wins come from the answers (spec 1, section 9); the cascade line shows when the weakest area follows from a
weaker borrowed number. When the city's rule is unconfirmed, it is the first quick win, said once.

### Weakest: Rent Evidence

| Field | Exact text |
|---|---|
| h | Your Rent Evidence Has the Most Room to Grow |
| refinement | Your Rent Evidence Is Your Next Refinement |
| means · lead | Your rent per room is borrowed: a guess, a calculator, a whole-home rent split by bedrooms, or asking rents. Every figure after it inherits the guess. |
| means · bullets 1 | The rent doesn't come from rooms near the house that filled |
| means · bullets 2 | Every room may have the same rent, whatever its bath |
| means · bullets 3 | Asking rents are counted as rents |
| means · bullets 4 | Nobody can say how many rooms the number rests on |
| next · lead | This week, build a list of ten rooms near the house, by bath type and size. |
| next · bullets 1 | List ten rooms for rent within about 3 miles |
| next · bullets 2 | Note each weekly rent, bath type and room size |
| next · bullets 3 | Split them by bath type and note the middle rent of each group |
| next · bullets 4 | Recheck in two weeks and keep the rooms that filled |
| impact · lead | Rent is upstream of everything. Fix it and the bath mix, the deal math and the reserves have evidence to work with. |
| impact · bullets 1 | A guessed rent inflates the cash flow, the deal math and the offer |
| impact · bullets 2 | A rent the street supports is the base the rest of the plan needs |
| impact · bullets 3 | It's fixable this week: the rooms are listed near the house right now |

### Weakest: Fill Speed

| Field | Exact text |
|---|---|
| h | Your Fill Speed Has the Most Room to Grow |
| refinement | Your Fill Speed Is Your Next Refinement |
| means · lead | You don't know how fast rooms fill near the house, so your lease-up months are a guess. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. |
| means · bullets 1 | Lease-up months are a hope, not a count |
| means · bullets 2 | Occupancy is a rule of thumb or an average |
| means · bullets 3 | The launch month is whenever the work ends |
| means · bullets 4 | A slow lease-up isn't in the plan |
| next · lead | This week, start a two-week fill watch on rooms like yours. |
| next · bullets 1 | Pick five room listings near the house with the bath types you plan |
| next · bullets 2 | Check every few days which ones are still listed |
| next · bullets 3 | Note any rent cuts |
| next · bullets 4 | After two weeks, set your lease-up months from what filled |
| impact · lead | Fill speed decides your first months of cash flow. Fix it and your reserves can be sized from evidence. |
| impact · bullets 1 | At your numbers, each month lease-up runs long costs at least {cost} |
| impact · bullets 2 | Your reserves are only as good as the lease-up months behind them |
| impact · bullets 3 | It's fixable in two weeks of watching rooms near the house |
| impact · bulletNoCount | Every month lease-up runs long costs the full monthly carrying cost |

### Weakest: Nearby Supply

| Field | Exact text |
|---|---|
| h | Your Read on Nearby Supply Has the Most Room to Grow |
| refinement | Your Read on Nearby Supply Is Your Next Refinement |
| means · lead | You don't know how many co-living homes compete near the house, or how full they are. Supply nearby decides how hard your rooms will be to fill and what they can ask. |
| means · bullets 1 | Nobody counted the co-living homes within about 3 miles |
| means · bullets 2 | There's no read on how many rooms are open |
| means · bullets 3 | New homes and rent cuts nearby go unnoticed |
| means · bullets 4 | A crowded pocket can look like a busy one |
| next · lead | This week, count the competition within about 3 miles. |
| next · bullets 1 | List every co-living home with rooms for rent within about 3 miles |
| next · bullets 2 | Note how many rooms each has open |
| next · bullets 3 | Note any new homes and rent cuts |
| next · bullets 4 | Write down your read, with the date |
| impact · lead | Supply sets the ceiling on rent and the pace of the fill. Fix it and your rent and lease-up plans rest on the street as it is. |
| impact · bullets 1 | Many open rooms nearby mean a lower rent or a slower lease-up |
| impact · bullets 2 | Few open rooms and steady rents leave room for one more home |
| impact · bullets 3 | It's fixable in an afternoon of counting |

### Weakest: Room Mix

| Field | Exact text |
|---|---|
| h | Your Room Mix Has the Most Room to Grow |
| refinement | Your Room Mix Is Your Next Refinement |
| means · lead | Your bath mix and room count aren't priced from rooms nearby yet. Private-bath and shared-bath rooms rent and fill differently, so the mix is the biggest lever you control. |
| means · bullets 1 | The bath mix isn't decided, or was decided on a hunch |
| means · bullets 2 | The house hasn't been priced both ways |
| means · bullets 3 | The room count isn't checked against the city's rule |
| means · bullets 4 | The garage or extra space isn't priced both ways |
| next · lead | This week, price the house both ways from rooms nearby. |
| next · bullets 1 | Note the middle weekly rent of private-bath and shared-bath rooms nearby |
| next · bullets 2 | Weekly rent × rooms × 4.35 for the house as it is |
| next · bullets 3 | The same with one more private bath |
| next · bullets 4 | Get a quote before you decide on any work |
| impact · lead | The room mix multiplies every rent in the plan. Fix it and the work you book is work that pays for itself in rent. |
| impact · bullets 1 | Two houses with the same bedrooms can earn very different money |
| impact · bullets 2 | A bathroom added on a hunch can cost more than it brings in |
| impact · bullets 3 | It's fixable before the offer, from the rent list you already need |

### Weakest: Lease-up Reserves

| Field | Exact text |
|---|---|
| h | Your Lease-up Reserves Have the Most Room to Grow |
| refinement | Your Lease-up Reserves Are Your Next Refinement |
| means · lead | Your reserves and deal math aren't sized for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. |
| means · bullets 1 | Reserves are a few weeks, or not planned |
| means · bullets 2 | The plan for a slow start is cutting rents |
| means · bullets 3 | The deal math runs on defaults or estimates |
| means · bullets 4 | There's no slower case beside the plan |
| next · lead | This week, size the cushion from your own numbers. |
| next · bullets 1 | Write down your monthly carrying cost |
| next · bullets 2 | Set your lease-up months, and a slower case twice as long |
| next · bullets 3 | Multiply: monthly cost × the slower case's months |
| next · bullets 4 | Compare it with the cash you'll hold after the down payment and the work |
| impact · lead | The cushion decides whether a slow start is a plan or a scramble. Fix it and the first six months are planned, month by month. |
| impact · bullets 1 | At your numbers, your reserves leave at least {gap} of lease-up costs uncovered |
| impact · bullets 2 | A room cut to fill faster keeps the lower rent after it fills |
| impact · bullets 3 | It's fixable before the offer: it's arithmetic on numbers you already have |
| impact · bulletNoCount | Every month your reserves don't cover gets paid from somewhere else |

| Field | Exact text |
|---|---|
| low · ruleNote · title | A note on the city's rule |
| low · ruleNote · body | You haven't confirmed your city's rule on unrelated adults sharing a home. It decides whether the plan is allowed at all, and it differs by city. Read it in the city code, then confirm it with the city or an attorney. Not legal advice. |
| low · cascade | Your {effect} score follows from your {cause} score. |

### Labels

| Field | Exact text |
|---|---|
| labels · means | What This Means |
| labels · next | Your Immediate Next Step |
| labels · impact | Why It Matters for the Deal |
| labels · quickWins | Your quick wins, from your answers |
| labels · checks | Your checks, from your answers |

### The template's enrichment page (off)

Kept for the template's shape; it never prints in this funnel.

| Field | Exact text |
|---|---|
| top3 · title | Next to the Market |
| top3 · columns · measure | Measure |
| top3 · columns · you | You |
| top3 · columns · them | Market |
| top3 · columns · read | Read |
| top3 · chips · ahead | Ahead or level |
| top3 · chips · behind | Behind |
| top3 · pending | Not used in this funnel. |

## 9. Field dictionary

Every placeholder the report, the results page and the emails fill, with Jordan's values (the worked example in
spec 1, section 11, with the deepener's answers).

| Field | Where it comes from, and Jordan's value |
|---|---|
| {business} | The company: never asked in this funnel, so empty (kept for the template's shape). Jordan: (empty) |
| {city} | The market's name when it is a preset metro, else empty. Jordan: Atlanta |
| {service} | "first deal" or "next deal", from the stage (G1). Jordan: first deal |
| {first_name} | The contact step's first name. Jordan: Jordan |
| {last_name} | Never asked: empty. Jordan: (empty) |
| {market} | The market's label (G2): a preset metro, "a market outside the presets" or "market not decided yet". Jordan: Atlanta |
| {stage} | The stage's label (G1). Jordan: Looking at houses |
| {deal} | "first deal" or "next deal". Jordan: first deal |
| {date} | The report's date. Jordan: November 22, 2026 |
| {search_date} | The report's date (the template's field). Jordan: November 22, 2026 |
| {checker_first_name} | Who checked the report, from the admin's "Checked by"; empty prints no line. Jordan: (empty) |
| {gap} | The lease-up gap in dollars: cost x uncovered months. Jordan: $4,000 |
| {cost} | The monthly carrying cost used: the low end of the range picked (G3). Jordan: $2,000 |
| {exposure} | Cost x the expected lease-up months. Jordan: $6,000 |
| {fill_months} | The expected lease-up months (G4). Jordan: 3 months |
| {reserve_months} | The months of costs the reserves carry (G5), at the high end of the range. Jordan: 1 month |
| {uncovered_months} | Lease-up months minus reserve months, when positive. Jordan: 2 months |
| {spare_months} | Reserve months minus lease-up months, when positive. Jordan: 0 months |
| {unasked} | The uncovered months as a number (the template's count field). Jordan: 2 |
| {work_value} | The gap in dollars (the template's name for the metric's value). Jordan: $4,000 |
| {slower_months} | The slower case: twice the expected lease-up months. Jordan: 6 months |
| {slower_gap} | Cost x (twice the lease-up months minus the reserve months), never below zero. Jordan: $10,000 |
| {primary_bottleneck} | The weakest area's name: fix first (spec 1, section 9). Jordan: Fill Speed |
| {n_main} | The quiz answers the score uses: 10. Jordan: 10 |
| {deepener_link} | The deepener page's link. Jordan: https://score.example.com/sharpen/T |
| {booking_link} | The results page's walkthrough step. Jordan: https://score.example.com/results/T#call |

### The emails' fields (`api/_lib/messages.mjs` emailVars)

| Field | Where it comes from, and Jordan's value |
|---|---|
| {firstName} | The contact step's first name. Jordan: Jordan |
| {business} | Empty: never asked. Jordan: (empty) |
| {city} | The market's name or empty. Jordan: Atlanta |
| {service} | "first deal" or "next deal", from the stage. Jordan: first deal |
| {score} | The Deal Readiness Score. Jordan: 33 |
| {tier} | The tier's name. Jordan: Beginner: underwriting on assumptions |
| {invisible_line} | The results page's lease-up sentence for the gap's kind (spec 2, section 6). Jordan: At your numbers, your reserves run out 2 months before the rooms fill. That's at least $4,000 of costs with no cushion behind it. |
| {forecast_link} | The free forecast's link, with the campaign parameters. Jordan: https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-deal |
| {forecast_line} | The forecast sentence: covered market or outside. Jordan: When you have an address, run a free forecast on it: https://roomiq.io/dashboard?src=scorecard&utm_source=scorecard&utm_medium=email&utm_campaign=roomiq-first-d |
| {booking_link} | The results page's walkthrough step. Jordan: https://score.example.com/results/T#call |
| {bottleneck} | The weakest area's name. Jordan: Fill Speed |
| {bottleneck_line} | The fix-first line for the weakest area and the answer behind it (spec 1, section 9). Jordan: An assumed vacancy rate isn't fill speed. Check how fast comparable rooms near the house actually filled. |
| {quick_win} | The first quick win (spec 1, section 9). Jordan: Read your city's rule on unrelated adults sharing a home, then confirm it with the city or an attorney |
| {n} | The deepener questions this visitor sees. Jordan: 12 |
| {results_link} | The results page. Jordan: https://score.example.com/results/T |
| {unsubscribe_link} | One-click unsubscribe. Jordan: https://score.example.com/unsubscribe/T |
| {privacy_link} | The privacy policy. Jordan: https://roomiq.io/privacy |

### The results page's own fields

| Field | Where it comes from |
|---|---|
| {email} | The address the report went to |
| {n} | How many deepener questions this visitor sees, or answered |
| {day}, {window}, {hours} | The booked walkthrough's day, window name and hours, in the visitor's time |
