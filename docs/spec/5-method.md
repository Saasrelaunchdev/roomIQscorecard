# The First Deal Risk Scorecard: the method

RoomIQ as a method, the Room-by-Room Underwrite: its steps, where each investor stands on each step, the two ways to run it, the first 30 days with RoomIQ, and the letter at the front.

- For: RoomIQ, room-by-room underwriting for rent-by-the-room investors
- Builds on: spec 1 (the areas and their order), the GTM's product facts (GTM-BRIEF.md: the Free plan, the forecast, the Property Analyzer, the deal calculator)
- Date: 2026-11-24
- Status: specification, built and tested. `content/method.mjs` holds these words; `tests/unit/v2.test.mjs` checks the pages.

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

## 1. The method and its outcome

- Name: the Room-by-Room Underwrite.
- What it does: A first deal goes wrong at the numbers nobody checked. The Room-by-Room Underwrite checks them in order, from the rent per room to the cushion, so every number in the offer rests on evidence you can check.
- The order: The order matters. The rent and the fill time are the numbers every other one rests on. The competition sets how hard rooms are to fill. The room mix is priced from rents and fill, and the cushion is sized from all of them.

| Field | Exact text |
|---|---|
| intro · kicker | The Room-by-Room Underwrite |
| intro · h1 | What an evidence-first underwrite looks like |
| intro · lead | A first deal goes wrong at the numbers nobody checked. The Room-by-Room Underwrite checks them in order, from the rent per room to the cushion, so every number in the offer rests on evidence you can check. |
| intro · stepsTitle | Five steps, in this order |
| intro · chain | The order matters. The rent and the fill time are the numbers every other one rests on. The competition sets how hard rooms are to fill. The room mix is priced from rents and fill, and the cushion is sized from all of them. |
| intro · rhythmTitle | And one recheck before the offer |
| intro · rhythm | Rents, fill speed and supply move with the seasons and with new homes. Recheck them the week you make the offer. |
| intro · todayLabel | Your plan today |
| intro · startHere | Start here |

## 2. The steps, in causal order

Rent and fill first (every other number rests on them), then the competition, then the room mix (priced from rents and
fill), then the cushion (sized from all of them). "Done" is the method's standard; the third column is what RoomIQ
shows for that step, without promises.

| Step | Done looks like (the standard) | What RoomIQ shows |
|---|---|---|
| 1. Price each room (Rent Evidence) | A rent for each room from rooms nearby with the same bath type and size, kept to the rooms that actually filled. | RoomIQ shows rent and occupancy split by bath type and size for comparable properties, and a revenue estimate for the address with its comps. |
| 2. Time the fill (Fill Speed) | Lease-up months from how fast comparable rooms nearby filled, with a slower case, and a launch month timed to the seasons. | RoomIQ shows observed occupancy over 7, 30 and 90-day windows for comparable properties, and when occupancy and fill speed peak in the market. |
| 3. Count the competition (Nearby Supply) | Every co-living home within about 3 miles counted, with its open rooms, new listings and rent cuts. | RoomIQ counts and maps active co-living properties within about 3 miles of any address, with listing status on its supply map. |
| 4. Price the bath mix (Room Mix) | The bath mix and the room count priced from private and shared-bath rooms nearby, and checked against the city's rule. | RoomIQ's forecast takes the room mix you plan, private-bath rooms included, and prints the formula behind the estimate. |
| 5. Size the cushion (Lease-up Reserves) | Reserves sized from the lease-up months the evidence supports, plus a slower case, with the deal math run on your own costs. | RoomIQ carries the estimate into cash flow, cash-on-cash, DSCR and cap rate under your own assumptions. Informational only, not financial or lending advice. |

## 3. Where they stand on each step

Each step shows the visitor's own answers as sentences, next to the standard and what RoomIQ shows. The chip reads the
area's band: fix "Fix first", low "Gap", medium "Partly there", high "In place".

| Field | Exact text |
|---|---|
| gap · kicker | The Room-by-Room Underwrite |
| gap · h1 | Where your plan stands on each step |
| gap · lead | Each step below starts from your own answers, then shows the method's standard and what RoomIQ shows for it. |
| gap · step | Step {n}: {t} |
| gap · columns · today | Today, from your answers |
| gap · columns · standard | The method's standard |
| gap · columns · service | What RoomIQ shows |
| gap · fromProfile | From outside data |

### Q1 `rentsource`: Where does your per-room rent number come from?

| Answer | Sentence on the page |
|---|---|
| I don't have one yet | You don't have a rent per room yet. |
| A platform's earnings calculator | Your rent per room comes from a platform's earnings calculator. |
| Whole-home rent divided by bedrooms | Your rent per room is a whole-home rent divided by bedrooms. |
| Asking rents I found on room listings | Your rent comes from asking rents on room listings. |
| Comps of nearby rooms, with how fast they filled | Your rent comes from comps of nearby rooms, with how fast they filled. |

### Q2 `fillsource`: How do you know how fast rooms fill near the property?

| Answer | Sentence on the page |
|---|---|
| I haven't looked | You haven't looked at how fast rooms fill nearby. |
| I assume a vacancy percentage | Your plan assumes a vacancy percentage. |
| Host stories and forum posts | Your sense of fill speed comes from host stories and forum posts. |
| A platform's market reports | Your sense of fill speed comes from a platform's market reports. |
| Observed fill times of comparable rooms nearby | Your fill speed comes from observed fill times of comparable rooms nearby. |

### Q3 `supply`: How many co-living homes compete within about 3 miles?

| Answer | Sentence on the page |
|---|---|
| No idea | You don't know how many co-living homes compete nearby. |
| Some, I think | You think some co-living homes compete nearby. |
| I counted listings | You counted the co-living listings nearby. |
| I know the count and roughly how full they are | You know how many co-living homes compete nearby, and roughly how full they are. |

### Q4 `bathmix`: Have you decided the bath mix?

| Answer | Sentence on the page |
|---|---|
| Not yet | You haven't decided the bath mix. |
| Keeping the current bathrooms | You're keeping the current bathrooms. |
| Adding a bathroom because it seems worth it | You're adding a bathroom because it seems worth it. |
| Modeled private against shared-bath rents nearby | You modeled private against shared-bath rents nearby. |

### Q5 `slowplan`: What happens if lease-up takes longer than planned?

| Answer | Sentence on the page |
|---|---|
| I haven't planned for it | You haven't planned for a slow lease-up. |
| I'd lower rents | If lease-up is slow, you'd lower rents. |
| A few weeks of reserves | You have a few weeks of reserves for a slow lease-up. |
| Reserves sized from how comparable launches nearby filled | Your reserves are sized from how comparable launches nearby filled. |

### D1 `rentperroom`: Do you have a rent for each room, by bath type?

| Answer | Sentence on the page |
|---|---|
| Not yet | You don't have a rent for each room yet. |
| One rent for every room | Every room has the same rent. |
| A rough split, private and shared bath | You have a rough split between private and shared-bath rooms. |
| A rent per room, from nearby rooms with the same bath type and size | Each room has its own rent, from nearby rooms with the same bath type and size. |

### D2 `rentcomps`: How many nearby rooms is your rent number based on?

| Answer | Sentence on the page |
|---|---|
| None, or not sure | You weren't sure how many nearby rooms your rent rests on. |
| 1 or 2 | Your rent rests on 1 or 2 nearby rooms. |
| 3 to 9 | Your rent rests on 3 to 9 nearby rooms. |
| 10 or more | Your rent rests on 10 or more nearby rooms. |

### D3 `occsource`: Where does your plan's occupancy figure come from?

| Answer | Sentence on the page |
|---|---|
| I haven't set one | Your plan has no occupancy figure yet. |
| A rule of thumb | Your occupancy figure is a rule of thumb. |
| A platform's market average | Your occupancy figure is a platform's market average. |
| Observed occupancy of comparable rooms nearby | Your occupancy figure comes from comparable rooms nearby. |

### D4 `launch`: Have you picked the month to start renting rooms?

| Answer | Sentence on the page |
|---|---|
| Not yet | You haven't picked a launch month. |
| Whenever the work is done | You'll start renting whenever the work is done. |
| A season I've heard is busy | You plan to launch in a season you've heard is busy. |
| When rooms nearby fill fastest | You plan to launch when rooms nearby fill fastest. |

### D5 `newsupply`: Do you know whether new co-living homes opened nearby this year?

| Answer | Sentence on the page |
|---|---|
| No idea | You don't know whether new co-living homes opened nearby. |
| I think a few did | You think a few new co-living homes opened nearby. |
| I checked the current listings | You checked the current co-living listings nearby. |
| I track homes that open and close nearby | You track the homes that open and close nearby. |

### D6 `pricedrops`: Have rooms near the house been cutting their rents?

| Answer | Sentence on the page |
|---|---|
| I don't know | You don't know whether rooms nearby cut their rents. |
| I've heard so | You've heard that rooms nearby cut their rents. |
| I've seen a few drop | You've seen a few rooms nearby cut their rents. |
| I've checked recent price drops on comparable rooms | You've checked recent price drops on comparable rooms. |

### D7 `roomcount`: How did you decide how many rooms to rent?

| Answer | Sentence on the page |
|---|---|
| Not decided yet | You haven't decided how many rooms to rent. |
| As many as the house can fit | You plan to rent as many rooms as the house can fit. |
| The current bedroom count | You plan to rent the current bedroom count. |
| A layout checked against rents nearby | Your room count is a layout checked against rents nearby. |

### D8 `sizemix`: Have you checked which room sizes rent best nearby?

| Answer | Sentence on the page |
|---|---|
| Not yet | You haven't checked which room sizes rent best nearby. |
| I assume bigger rooms rent better | You assume bigger rooms rent better. |
| I've seen a few listings | You've seen a few listings by room size. |
| I compared rents and fill speed by room size nearby | You compared rents and fill speed by room size nearby. |

### D9 `dealmath`: Where do the numbers in your deal math come from?

| Answer | Sentence on the page |
|---|---|
| I haven't run the numbers yet | You haven't run the deal math yet. |
| A calculator's default settings | Your deal math uses a calculator's default settings. |
| My own estimates | Your deal math uses your own estimates. |
| Rents and occupancy of comparable rooms, with my own costs | Your deal math uses rents and occupancy of comparable rooms, with your own costs. |

### D10 `stress`: Does your deal math test a slower lease-up?

| Answer | Sentence on the page |
|---|---|
| No | Your deal math doesn't test a slower lease-up. |
| I add a vacancy rate on top | Your deal math adds a vacancy rate on top. |
| I test one slower case | Your deal math tests one slower case. |
| I test it against how comparable launches nearby filled | Your deal math tests the lease-up against how comparable launches filled. |

## 4. Two ways to run it

| Field | Exact text |
|---|---|
| ways · kicker | The Room-by-Room Underwrite |
| ways · h1 | Two ways to run the method |
| ways · lead | The method works the same either way. The difference is where the evidence comes from: listings you track by hand, or RoomIQ's observed rooms. |
| ways · self · title | Run it by hand |
| ways · self · body | The 30-day plan in this report is the method, step by step, and it's yours to keep. |
| ways · self · bullets 1 | A list of ten rooms near the house, by bath type and size |
| ways · self · bullets 2 | A two-week fill watch on five of them |
| ways · self · bullets 3 | A count of the co-living homes within about 3 miles |
| ways · self · bullets 4 | Your own deal math, with a slower case |
| ways · service · title | Run it with RoomIQ |
| ways · service · body | The same five steps for one address, in one place, with the evidence behind each number shown. |
| ways · service · startTitle | Starting takes one address |
| ways · service · start 1 · t | Pick your market. |
| ways · service · start 1 · b | The Free plan covers one main market. |
| ways · service · start 2 · t | Type the address. |
| ways · service · start 2 · b | Add the bedrooms, the baths and which rooms get a private bath. |
| ways · service · start 3 · t | Run the forecast. |
| ways · service · start 3 · b | Read the formula, the comps and the confidence label. |
| ways · service · start 4 · t | Carry it into the deal math. |
| ways · service · start 4 · b | Cash flow, cash-on-cash, DSCR and cap rate under your own costs. Informational only. |
| ways · service · listTitle | What you see |
| ways · service · list 1 | Monthly room revenue for the address, with the formula printed |
| ways · service · list 2 | Support and confidence labels, and how far away the comps are |
| ways · service · list 3 | Rent and occupancy by bath type and size for comparable properties |
| ways · service · list 4 | Active co-living properties within about 3 miles, mapped |
| ways · service · list 5 | When occupancy and fill speed peak in the market |
| ways · wontTitle | What RoomIQ doesn't do |
| ways · wont 1 · t | No zoning check. |
| ways · wont 1 · b | Rules on unrelated adults differ by city: ask the city or an attorney. |
| ways · wont 2 · t | No financing or insurance. |
| ways · wont 2 · b | Talk early to a lender and an insurer who know room rentals. |
| ways · wont 3 · t | No promises. |
| ways · wont 3 · b | An estimate shows its working; it doesn't guarantee rent or occupancy. |
| ways · rules | Based on observed rents and occupancy, not collected payments. Thin evidence is labeled Thin. |

## 5. The first 30 days with RoomIQ

From the GTM's onboarding: one address, the free forecast first, then the rooms nearby, the competition and the seasons,
then the mix and the math. Nothing is promised; the deal math is informational only.

| Field | Exact text |
|---|---|
| days · kicker | The Room-by-Room Underwrite |
| days · h1 | Your first 30 days with RoomIQ |
| days · lead | Here is the method, week by week, with RoomIQ's Free plan. |
| days · phases 1 · t | Week 1: the forecast on your address |
| days · phases 1 · b | Run the free forecast on the house. Read the formula under the number, the support and confidence labels, and how far away the comps sit. |
| days · phases 2 · t | Week 2: the rooms nearby |
| days · phases 2 · b | Open comparable properties in the Property Analyzer: rent and occupancy by bath type and size, and their 7, 30 and 90-day windows. |
| days · phases 3 · t | Week 3: the competition and the seasons |
| days · phases 3 · b | Check the co-living properties within about 3 miles on the map, and when occupancy and fill speed peak, before you pick a launch month. |
| days · phases 4 · t | Week 4: the mix and the math |
| days · phases 4 · b | Re-run the forecast with the room mix you plan, carry it into cash flow under your own costs, size the cushion, then decide. |
| days · yourStart | For your plan, we'd start with {primary_bottleneck}. {fit_line} |
| days · paper | You run more than ten houses, so the first step is a walkthrough to see what fits. |
| days · monthlyTitle | What the Free plan includes |
| days · monthly | One main market, 90 days of history, 5 Property Analyzer opens and 3 revenue estimates a month, with no card needed. |
| days · cta | Want to go through it together first? Book a 20-minute walkthrough on your address: |
| days · ctaLinkText | pick a time |
| days · ctaBooked | Your walkthrough is booked: {day}, {window}. We'll go through this plan on your address then. |

## 6. The letter at the front

The admin can rewrite it (Settings, "The report"), sign it and pick the sections; a lead's own page can change all of
it for that lead and add a personal note, printed under the letter. The claim rules apply to everything typed there.

| Field | Exact text |
|---|---|
| letter · title | A note before you read |
| letter · body 1 | Thank you for taking the First Deal Risk Scorecard, {first_name}. Everything in this report comes from your own answers. |
| letter · body 2 | Read the page on {primary_bottleneck} first: it's where your plan borrows the most. |
| letter · body 3 | The Room-by-Room Underwrite in the middle of this report is how borrowed numbers become evidence. Run it by hand with the 30-day plan, or with RoomIQ's Free plan. |
| letter · noteTitle | For you, {first_name} |
| letter · signoff | The RoomIQ team |
| letter · signed | {name}, RoomIQ |
| letter · signedTitle | {name}, {title}, RoomIQ |
| letter · kicker | Before you start |
| letter · contentsTitle | In this report |
| letter · contents · invisible | Your First Six Months: your lease-up gap, from your own numbers |
| letter · contents · checks | Three Checks RoomIQ Can't Do for You: zoning, financing and insurance |
| letter · contents · overall | Your Overall Score: your five areas, and what they mean |
| letter · contents · areas | Your strongest and weakest areas, with what to do this week |
| letter · contents · method | The Room-by-Room Underwrite: five steps, and where you stand on each |
| letter · contents · service | Two ways to run it, and your first 30 days with RoomIQ |
| letter · contents · playbook | The 30-day plan: a guide for each area, checklists and a weekly tracker |
| letter · contents · next | Your next step |

| Field | Exact text |
|---|---|
| coming · title | Coming next |
| coming · body | Nothing in this report waits on our team: everything in it comes from your answers. |

## 7. What the admin can customize

| Where | What |
|---|---|
| Settings, "The report" | The letter (placeholders {first_name}, {market}, {deal}, {primary_bottleneck}), the signer's first name and title, the sections every report carries |
| A lead's page | A note for this lead (printed under the letter), this lead's sections, who checked it (on the cover), then "Approve and send the update" |
| Settings, "The team's notices" | Who gets the new-lead, deepener and booking notices, and whether the PDF is attached |

The sections that can be switched off: the letter and contents, the method (its steps and where they stand), the two
ways to run it with the first 30 days, and the 30-day plan.
