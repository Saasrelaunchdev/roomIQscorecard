# The First Deal Risk Scorecard: report, static playbook

The 30-day plan every report carries: how to use it, one guide per area with a named method, the timeline, the quick start, the checklists, the weekly tracker and the next step.

- For: RoomIQ, room-by-room underwriting for coliving investors
- Builds on: spec 1 (the areas), spec 5 (the method the guides run)
- Date: 2026-11-24
- Status: specification, built and tested. `content/playbook.mjs` holds these words; `tests/unit/report-model.test.mjs` and the copy lint check them.

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

The plan is worth doing without RoomIQ: every step works with listings, a spreadsheet and two weeks of watching. It
never names a platform, never promises a rent, a fill time or a return, and sends zoning, financing and insurance to
the city, a lender and an insurer.

## 1. Start here

| Field | Exact text |
|---|---|
| start · title | Your Room-by-Room Underwrite Starts Here |
| start · lead | The first half of this report showed where your plan borrows its numbers. This half is the plan to replace them with evidence, and it's yours to keep whether or not you ever use RoomIQ. It holds a guide for each of the five areas, a 30-day timeline, a five-day quick start, a checklist for each area and a weekly tracker. |
| start · howTitle | How to Use This Report |
| start · how 1 · b | Start with the area marked Fix first. |
| start · how 1 · t | Your weakest area page named it. Read that guide first, even if another area interests you more. |
| start · how 2 · b | Read the guide's core method. |
| start · how 2 · t | Each guide has one named method in four phases. Do the phases in order. |
| start · how 3 · b | Use the quick start this week. |
| start · how 3 · t | Five short actions, one a day, about two hours in total. |
| start · how 4 · b | Follow the 30-day timeline. |
| start · how 4 · t | The two borrowed numbers first, rent and fill, then the competition, the room mix and the reserves. |
| start · how 5 · b | Track it every Friday. |
| start · how 5 · t | Fill in the weekly tracker, then take the scorecard again on day 30 and compare. |
| start · sectionsHead 1 | Section |
| start · sectionsHead 2 | What it gives you |
| start · sections 1 1 | Rent Evidence guide |
| start · sections 1 2 | The Ten-Room Rent Check: a rent for each room, from rooms nearby that filled |
| start · sections 2 1 | Fill Speed guide |
| start · sections 2 2 | The Two-Week Fill Watch: lease-up months from rooms you watched fill |
| start · sections 3 1 | Nearby Supply guide |
| start · sections 3 2 | The Three-Mile Count: the competition, how full it is, and what's new |
| start · sections 4 1 | Room Mix guide |
| start · sections 4 2 | The Bath Mix Test: the bathrooms and the room count, priced from rooms nearby |
| start · sections 5 1 | Lease-up Reserves guide |
| start · sections 5 2 | The Slow Lease-up Test: reserves that carry the house through a slow start |
| start · sections 6 1 | 30-day timeline |
| start · sections 6 2 | Four weekly phases, the borrowed numbers first |
| start · sections 7 1 | Quick start |
| start · sections 7 2 | Five things to do this week |
| start · sections 8 1 | Checklists |
| start · sections 8 2 | Six checkable actions per area |
| start · sections 9 1 | Weekly tracker |
| start · sections 9 2 | Five ratings and four counts, every Friday |
| start · yourStart | Your weakest area is {primary_bottleneck}. Start with its guide. |

## 2. One guide per area

Each guide: a comparison of the borrowed number and the evidence, a named method in four phases, the common mistakes
and a practice protocol. "From your answers" prints the visitor's own first step from the quick wins.

| Field | Exact text |
|---|---|
| labels · method | The core method: {method} |
| labels · phase | Phase {n}: {t} |
| labels · mistakes | Common Mistakes to Eliminate |
| labels · protocol | Practice Protocol |
| labels · frequency | Frequency: |
| labels · format | Format: |
| labels · review | Review method: |
| labels · classify | Classify every result: |
| labels · fromAnswers | From your answers |

### Rent Evidence: The Ten-Room Rent Check

| Field | Exact text |
|---|---|
| title | Rent Evidence: The Ten-Room Rent Check |
| tagline | A rent for each room, from rooms near the house that actually filled. |
| withoutHead | With a Borrowed Rent |
| withHead | With Rent Evidence |
| method | The Ten-Room Rent Check |

| With a Borrowed Rent | With Rent Evidence |
|---|---|
| The rent per room comes from a calculator, a forum post or a whole-home rent split by bedrooms | Each room's rent comes from rooms nearby with the same bath type and size |
| Every room gets the same rent | Private-bath and shared-bath rooms, large and small, each get their own rent |
| Asking rents are treated as rents | Only rooms that actually filled count, and the asking ones are kept apart |
| Nobody can say how many rooms the number rests on | The rent rests on a list of rooms you can show a partner or a lender |
| A rent the street doesn't support shows up as empty rooms after closing | A rent the street supports, checked before the offer |

**The core method: The Ten-Room Rent Check**

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

**Common Mistakes to Eliminate**

- Using a platform's earnings estimate as your rent
- Dividing a whole-home rent by the number of bedrooms
- Pricing every room the same, whatever its bath or size
- Counting asking rents as rents
- Pricing from the highest rent you found
- Using rooms from across the metro instead of near the house
- Copying another operator's listing photos or text into your plan

**Practice Protocol: The Two-Week Recheck**

| Field | Exact text |
|---|---|
| protocol · frequency | Once, two weeks after your first list; then again before the offer. |
| protocol · format | Your list of rooms: weekly rent, bath type, size, and whether it's still listed. |
| protocol · review | Which rooms filled, and at what rent? Which cut their rent? |
| protocol · classify | Filled, still open, rent cut, or removed. Price from the filled rooms first. |

### Fill Speed: The Two-Week Fill Watch

| Field | Exact text |
|---|---|
| title | Fill Speed: The Two-Week Fill Watch |
| tagline | Lease-up months from how fast rooms nearby actually fill, not from a vacancy guess. |
| withoutHead | With an Assumed Fill Time |
| withHead | With Fill Evidence |
| method | The Two-Week Fill Watch |

| With an Assumed Fill Time | With Fill Evidence |
|---|---|
| The plan assumes a vacancy rate | The plan uses how fast comparable rooms near the house filled |
| Lease-up time is a hope: a month, maybe | Lease-up months come from rooms you watched fill |
| The launch month is whenever the work ends | The launch is timed to the months rooms nearby fill fastest |
| A metro average stands in for the street | The street's own rooms set the number |
| A slow lease-up comes as a surprise | A slow lease-up is in the plan before the offer |

**The core method: The Two-Week Fill Watch**

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

**Common Mistakes to Eliminate**

- Assuming a vacancy rate instead of counting
- Using a metro or national average for one street
- Watching rooms that don't match yours
- Stopping the watch after a few days
- Adding a vacancy rate on top of an occupancy that already counts empty rooms
- Planning the launch for whenever the work happens to end

**Practice Protocol: The Fill Watch Log**

| Field | Exact text |
|---|---|
| protocol · frequency | Every few days for two weeks, 10 minutes each time. |
| protocol · format | One line per room: the date first seen, the rent, the bath type, still listed or not, any rent cut. |
| protocol · review | After two weeks: how many filled, how fast, and at what rent. |
| protocol · classify | Filled at the asking rent, filled after a cut, still open, or removed. |

### Nearby Supply: The Three-Mile Count

| Field | Exact text |
|---|---|
| title | Nearby Supply: The Three-Mile Count |
| tagline | Know the competition before you buy: how many homes, how full, and what's new. |
| withoutHead | Without a Supply Count |
| withHead | With a Supply Count |
| method | The Three-Mile Count |

| Without a Supply Count | With a Supply Count |
|---|---|
| Nobody counted the coliving homes nearby | Every coliving home within about 3 miles is on one list |
| A count, with no idea how full those homes are | Open rooms are noted next to each home |
| New homes opening nearby come as a surprise | New listings, and homes that stopped listing, are tracked |
| Rent cuts nearby go unnoticed | Rent cuts are an early warning in the plan |
| A crowded pocket looks like a busy one | Crowded and busy are told apart before the offer |

**The core method: The Three-Mile Count**

**Phase 1: Map the homes.** Count every coliving home within about 3 miles.

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

**Common Mistakes to Eliminate**

- Counting listings without noting how full they are
- Treating one busy home as the whole street
- Missing homes that list rooms only some of the time
- Never counting again after the first time
- Judging a pocket by its best home instead of its open rooms

**Practice Protocol: The Monthly Supply Count**

| Field | Exact text |
|---|---|
| protocol · frequency | Once a month, 20 minutes. |
| protocol · format | The homes within about 3 miles: rooms open, new or closed listings, rent cuts. |
| protocol · review | Is open supply rising or falling since last month? |
| protocol · classify | New home, closed home, rent cut, or no change. |

### Room Mix: The Bath Mix Test

| Field | Exact text |
|---|---|
| title | Room Mix: The Bath Mix Test |
| tagline | Price the bathrooms and the room count from the rooms nearby, before any work. |
| withoutHead | With a Mix Decided on a Hunch |
| withHead | With a Priced Mix |
| method | The Bath Mix Test |

| With a Mix Decided on a Hunch | With a Priced Mix |
|---|---|
| The bath mix is decided on a hunch | The bath mix comes from private and shared-bath rents nearby |
| A bathroom is added because it seems worth it | The house is priced both ways before the plumber is booked |
| Every bedroom gets rented, whatever the rules say | The room count fits the city's rule on unrelated adults |
| The garage is converted because more rooms earn more | The garage is priced both ways: as parking and as a room |
| The biggest lever in the plan is a guess | The biggest lever in the plan rests on rooms you can show |

**The core method: The Bath Mix Test**

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

**Common Mistakes to Eliminate**

- Adding a bathroom without pricing the difference
- Pricing every room the same, whatever its bath
- Counting rooms the city's rule may not allow
- Converting the garage without pricing it both ways
- Comparing extra revenue with no quote for the work

**Practice Protocol: The Before-Work Check**

| Field | Exact text |
|---|---|
| protocol · frequency | Once, before you book any work. |
| protocol · format | Two prices for the house: the baths as they are, and with the change. |
| protocol · review | Does the monthly difference justify the quote? |
| protocol · classify | Worth it, not worth it, or too few rooms nearby to tell. |

### Lease-up Reserves: The Slow Lease-up Test

| Field | Exact text |
|---|---|
| title | Lease-up Reserves: The Slow Lease-up Test |
| tagline | Reserves that carry the house through a slow lease-up, sized from evidence. |
| withoutHead | With a Hopeful Cushion |
| withHead | With a Sized Cushion |
| method | The Slow Lease-up Test |

| With a Hopeful Cushion | With a Sized Cushion |
|---|---|
| Reserves are a few weeks, or whatever is left | Reserves are the monthly cost times the lease-up months, plus a slower case |
| A slow lease-up means cutting rents | A slow lease-up is already in the plan |
| The deal math runs on a calculator's defaults | The deal math runs on your own costs and on rooms nearby |
| A vacancy rate is added on top of occupancy | Empty rooms are counted once |
| The first six months are a hope | The first six months are planned, month by month |

**The core method: The Slow Lease-up Test**

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

**Common Mistakes to Eliminate**

- Sizing reserves in weeks instead of months of cost
- Planning to cut rents if lease-up is slow
- Running the deal math on a calculator's defaults
- Counting empty rooms twice: a vacancy rate on top of observed occupancy
- Spending the reserves on the work

**Practice Protocol: The Monthly Cushion Check**

| Field | Exact text |
|---|---|
| protocol · frequency | Once a month until the rooms are full, 15 minutes. |
| protocol · format | Months of reserves left, rooms filled, and the months your slower case allows. |
| protocol · review | Are rooms filling faster or slower than the plan? |
| protocol · classify | On plan, slower than plan, or behind the slower case. |

## 3. The 30-day timeline

| Field | Exact text |
|---|---|
| timeline · title | Your 30-Day Timeline |
| timeline · lead | The two borrowed numbers first, rent and fill, because every other number follows from them. Then the competition, the room mix and the cushion. |
| timeline · focus | Focus: |
| timeline · outcome | By the end: |
| timeline · phases 1 · t | Phase 1, days 1 to 7: Price each room |
| timeline · phases 1 · focus | Rent Evidence |
| timeline · phases 1 · area | rent |
| timeline · phases 1 · b 1 | List ten rooms within about 3 miles of the house |
| timeline · phases 1 · b 2 | Split them by bath type and size |
| timeline · phases 1 · b 3 | Start the two-week fill watch on five of them |
| timeline · phases 1 · b 4 | Write down your monthly carrying cost |
| timeline · phases 1 · b 5 | Note what your current rent number rests on |
| timeline · phases 1 · outcome | a rent per room you can trace to rooms nearby, and a fill watch running. |
| timeline · phases 2 · t | Phase 2, days 8 to 14: Count the competition |
| timeline · phases 2 · focus | Nearby Supply |
| timeline · phases 2 · area | supply |
| timeline · phases 2 · b 1 | Count the coliving homes within about 3 miles |
| timeline · phases 2 · b 2 | Note the open rooms in each |
| timeline · phases 2 · b 3 | Note new homes and rent cuts nearby |
| timeline · phases 2 · b 4 | Check your fill watch every few days |
| timeline · phases 2 · b 5 | Read the city's rule on unrelated adults |
| timeline · phases 2 · outcome | the competition on one page, and the city's rule in hand. |
| timeline · phases 3 · t | Phase 3, days 15 to 21: Time the fill and price the mix |
| timeline · phases 3 · focus | Fill Speed and Room Mix |
| timeline · phases 3 · area | fill |
| timeline · phases 3 · b 1 | Close the fill watch: how many filled, how fast |
| timeline · phases 3 · b 2 | Set your lease-up months, and a slower case |
| timeline · phases 3 · b 3 | Price the house both ways: the baths as they are, and with one more private bath |
| timeline · phases 3 · b 4 | Check the room count against the city's rule |
| timeline · phases 3 · b 5 | Pick your launch month |
| timeline · phases 3 · outcome | lease-up months from evidence, and a bath mix priced from rooms nearby. |
| timeline · phases 4 · t | Phase 4, days 22 to 30: Size the cushion |
| timeline · phases 4 · focus | Lease-up Reserves |
| timeline · phases 4 · area | reserves |
| timeline · phases 4 · b 1 | Size reserves: monthly cost × the slower case's months |
| timeline · phases 4 · b 2 | Run the deal math on your own costs and on rooms nearby |
| timeline · phases 4 · b 3 | Talk to a lender who knows coliving |
| timeline · phases 4 · b 4 | Get an insurance quote that covers coliving |
| timeline · phases 4 · b 5 | Take the scorecard again on day 30 |
| timeline · phases 4 · outcome | a plan where every number rests on evidence, and a second score to compare with the first. |

## 4. Quick start: five things this week

| Field | Exact text |
|---|---|
| quickStart · title | Quick Start: 5 Things to Do This Week |
| quickStart · days 1 · t | Day 1: Write Down Your Monthly Cost |
| quickStart · days 1 · m | 20 minutes |
| quickStart · days 1 · body | Add up what the house will cost each month with every room empty: loan payment, taxes, insurance, utilities and upkeep. Write the total where you'll see it. Every lease-up plan rests on this number. |
| quickStart · days 2 · t | Day 2: List Ten Rooms Nearby |
| quickStart · days 2 · m | 30 minutes |
| quickStart · days 2 · body | Find ten rooms for rent within about 3 miles of the house. For each, write the weekly rent, the bath type and the room size. Leave whole-home listings out: you're pricing rooms. |
| quickStart · days 3 · t | Day 3: Split the Rents |
| quickStart · days 3 · m | 20 minutes |
| quickStart · days 3 · body | Group your ten rooms by bath type, private or shared, and note the middle rent of each group. The difference is your first read on the bath mix. |
| quickStart · days 4 · t | Day 4: Count the Competition |
| quickStart · days 4 · m | 30 minutes |
| quickStart · days 4 · body | Count the coliving homes with rooms listed within about 3 miles of the house, and note how many rooms each has open. One page, with the date. |
| quickStart · days 5 · t | Day 5: Start the Fill Watch |
| quickStart · days 5 · m | 15 minutes |
| quickStart · days 5 · body | Pick five of your ten rooms and set a reminder to check them every few days for two weeks. Which ones fill, how fast and at what rent becomes your lease-up plan. |
| quickStart · total | Total time this week: about two hours. |

## 5. Checklists

| Field | Exact text |
|---|---|
| checklists · title | Implementation Checklists |

### Rent Evidence

| Action | How or where |
|---|---|
| List ten rooms within about 3 miles | Room listings, a spreadsheet |
| Note the rent, bath type and size of each | Your list |
| Split them by bath type and size | Your list |
| Recheck after two weeks: which ones filled | Your list |
| Give each of your rooms its own rent | Your plan |
| Write down the rooms each rent rests on | Your plan |

### Fill Speed

| Action | How or where |
|---|---|
| Pick five to ten rooms to watch | Room listings near the house |
| Check them every few days for two weeks | A calendar reminder |
| Count how many filled, and how fast | Your watch log |
| Set your lease-up months from the watch | Your plan |
| Add a slower case: twice as long | Your plan |
| Pick your launch month | Your plan |

### Nearby Supply

| Action | How or where |
|---|---|
| List the coliving homes within about 3 miles | Room listings, a map |
| Note the open rooms in each | Your list |
| Note new homes and homes that stopped listing | Once a month |
| Note rent cuts on comparable rooms | Once a month |
| Write your read: filling up or crowded | Your plan, with the date |
| Count again before the offer | Your list |

### Room Mix

| Action | How or where |
|---|---|
| Note private and shared-bath rents nearby | Your rent list |
| Price the house as it is | Weekly rent × rooms × 4.35 |
| Price it with one more private bath | Weekly rent × rooms × 4.35 |
| Check the room count against the city's rule | The city code, then the city or an attorney |
| Price the garage both ways, if there is one | Your plan |
| Get a quote before deciding on any work | A contractor |

### Lease-up Reserves

| Action | How or where |
|---|---|
| Write down your monthly carrying cost | Your plan |
| Set lease-up months and a slower case | Your fill watch |
| Size reserves: cost × the slower case's months | Your plan |
| Run the deal math on your own costs | Your spreadsheet, or RoomIQ |
| Count empty rooms once, not twice | Your deal math |
| Talk to a lender who knows coliving | Before the offer |

## 6. The weekly tracker

| Field | Exact text |
|---|---|
| tracker · title | Weekly Tracking Dashboard |
| tracker · lead | Fill this in every Friday. Rate each area from 1 (a guess) to 5 (evidence you can show), then write the four counts. |
| tracker · head 1 | Measure |
| tracker · head 2 | Week 1 |
| tracker · head 3 | Week 2 |
| tracker · head 4 | Week 3 |
| tracker · head 5 | Week 4 |
| tracker · head 6 | Target |
| tracker · rows 1 1 | Rent Evidence (1 to 5) |
| tracker · rows 1 2 | 5 |
| tracker · rows 2 1 | Fill Speed (1 to 5) |
| tracker · rows 2 2 | 5 |
| tracker · rows 3 1 | Nearby Supply (1 to 5) |
| tracker · rows 3 2 | 5 |
| tracker · rows 4 1 | Room Mix (1 to 5) |
| tracker · rows 4 2 | 5 |
| tracker · rows 5 1 | Lease-up Reserves (1 to 5) |
| tracker · rows 5 2 | 5 |
| tracker · rows 6 1 | Rooms on your rent list |
| tracker · rows 6 2 | 10 or more |
| tracker · rows 7 1 | Rooms filled in your watch |
| tracker · rows 7 2 | Your count |
| tracker · rows 8 1 | Coliving homes within 3 miles |
| tracker · rows 8 2 | Your count |
| tracker · rows 9 1 | Months of reserves |
| tracker · rows 9 2 | Your slower case |
| tracker · startLabel | Your starting point |
| tracker · commitmentsTitle | Commitments |
| tracker · commitments 1 | I will price each room from rooms nearby, not from a calculator. |
| tracker · commitments 2 | I will count how fast rooms fill before I plan the lease-up. |
| tracker · commitments 3 | I will count the competition before I buy. |
| tracker · commitments 4 | I will price the bath mix before I book any work. |
| tracker · commitments 5 | I will size reserves for a slower lease-up than I hope for. |
| tracker · rememberTitle | Remember |
| tracker · remember 1 | An asking rent is a hope; a filled room is evidence. |
| tracker · remember 2 | Count empty rooms once. |
| tracker · remember 3 | The city's rule comes from the city or an attorney. |
| tracker · remember 4 | Every number in the offer should rest on rooms you can show. |

## 7. Your next step

The box offers the free forecast in a covered market and the market lookup outside them; the walkthrough line shows
until one is booked, then the booking.

| Field | Exact text |
|---|---|
| next · title | Your Next Step |
| next · lead | This report showed where your plan borrows its numbers, and gave you a 30-day plan to replace them with evidence. The by-hand way works: it takes listings, a spreadsheet and two weeks of watching. RoomIQ shows that evidence for one address in one place. |
| next · boxTitle | Run a free forecast on your address |
| next · boxBody | Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby. Start where your report says to: {primary_bottleneck}. The estimate prints its formula, its comps and how sure it is, and counts the coliving homes within about 3 miles. Free plan: no card needed, three forecasts a month. |
| next · fit · rent | For your Rent Evidence, that means a rent for each room from rooms nearby, by bath type and size. |
| next · fit · fill | For your Fill Speed, that means occupancy from comparable rooms nearby, and the months rooms fill fastest. |
| next · fit · supply | For your Nearby Supply, that means the coliving homes within about 3 miles, counted and mapped. |
| next · fit · mix | For your Room Mix, that means the bath mix you plan, entered in the forecast, because private-bath rooms change the rent. |
| next · fit · reserves | For your Lease-up Reserves, that means the estimate carried into cash flow under your own costs, beside your slower case. Informational only, not financial or lending advice. |
| next · fit · callOnly | You run more than ten houses, so we'll start with a walkthrough to see what fits. |
| next · pick | Or book a 20-minute walkthrough on your address: |
| next · pickLinkText | pick a time |
| next · booked | Your walkthrough is booked: {day}, {window}. We'll email you a video link. |
| next · master | Run the free forecast: |
| next · masterLink | roomiq.io |
| next · self | Rather do it by hand? This playbook is yours to keep. |

