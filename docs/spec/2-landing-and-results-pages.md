# The First Deal Risk Scorecard: landing and results pages

Every word on the landing pages, the quiz, the results page, the walkthrough step, the deepener page and the emails, with the follow-up emails for Loops and the picture slots.

- For: RoomIQ, room-by-room underwriting for rent-by-the-room investors
- Builds on: spec 1 (`docs/spec/1-assessment-logic.md`), the GTM's landing page and Meta page copy, `lead_magnet_spec.xlsx` (Email_Sequence) and `scorecard_spec.docx` Section 4
- Date: 2026-11-24
- Status: specification, built and tested. `content/landing.mjs`, `content/results.mjs`, `content/emails.mjs`, `content/checks.mjs` and `content/site.mjs` (booking) hold these words; `tests/e2e/funnel.e2e.mjs` and the copy lint check them.

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

## 1. How to use this document

Copy appears in two-column tables: the left column names the field (its path in the content file named in each
section), the right column is the exact text. To change a word, change it in the content file, then run
`node tools/build.mjs` and `npm test` (the copy lint fails on a broken rule).

Three pages serve the quiz:

| Page | What it is | For |
|---|---|---|
| `/first-deal` | Version A: the quiz in the hero, its first question inside a phone's first screen | the Meta ads (decision 16) |
| `/` | Version B: ScoreApp's template (hero, introduction, how it works, the five areas, the report, FAQ, final call) | links that need the explanation first |
| `/start` | The quiz alone (ScoreApp's "skip the landing page") | the landing page's and the Meta page's score buttons, the follow-up emails |

The score's name, the tiers' names and descriptors, the fix-first lines, the verdict and the quick wins are in spec 1
(sections 8 and 9); the result page prints them as written there.

## 2. Landing page, Version A: `/first-deal` (the Meta ads page)

The ad's first line asks where the rent number comes from, and the page answers with the quiz: its first question sits
in the hero. Everything else on the page backs that one tap.

| Field | Exact text |
|---|---|
| hook | Where does your per-room rent number come from? |
| hero · eyebrow | For rent-by-the-room investors |
| hero · h1 | Will your first deal survive six months? |
| hero · lead | Eleven quick questions. Your score, your lease-up gap and what to check before an offer. |
| hero · leadShort | Your score, your lease-up gap and what to check before an offer. |
| hero · picture | neighborhood |
| sticky | Score my first deal |
| report · eyebrow | Your free report |
| report · h2 | What your report shows before you make an offer. |
| report · line | Your score shows where your plan rests on evidence. Your report shows what to check next, and how. |
| report · points 1 · title | Your first six months. |
| report · points 1 · body | Your lease-up gap: the months your reserves don't cover, in dollars, from your own answers. |
| report · points 2 · title | Five areas, scored. |
| report · points 2 · body | Rent, fill speed, supply, room mix and reserves, with the one to fix first. |
| report · points 3 · title | Three checks outside RoomIQ. |
| report · points 3 · body | Your city's rule on unrelated adults, financing on room income, and insurance. |
| final · h2 | Start with where your deal stands. |
| final · stack 1 | If the rent per room came from a calculator. |
| final · stack 2 | If the vacancy rate is a guess. |
| final · stack 3 | If nobody counted the homes nearby. |
| final · line | Get your free Deal Readiness Score. It takes about a minute. |
| final · button | Score my first deal |

The quiz card in the hero (`content/landing.mjs` `quiz`): phones show the short line, wider screens the long one.

| Field | Exact text |
|---|---|
| label | Free Deal Readiness Score |
| frame | Eleven quick questions, about a minute. Your score shows right after; your report comes by email. |
| frameShort | About a minute. Your score shows right after. |

Trust lines under the card:

| Field | Exact text |
|---|---|
| trust 1 | Free, no card and no call needed |
| trust 2 | Built from your own answers |
| trust 3 | Your report by email right after, as a PDF |

## 3. Landing page, Version B: `/` (the ScoreApp template)

| Field | Exact text |
|---|---|
| hook | Would your first rent-by-the-room deal survive its first six months? |
| hero · eyebrow | Free scorecard for rent-by-the-room investors |
| hero · h1 | Would your first rent-by-the-room deal survive its first six months? |
| hero · lead | Every room-rental plan rests on two numbers: rent per room and how fast rooms fill. See if yours are evidence or guesses. |
| hero · button | Score my deal |
| hero · picture | neighborhood |
| sticky | Score my deal |

### Introduction

| Field | Exact text |
|---|---|
| h2 | Five areas. One number for your first six months. |
| body | The First Deal Risk Scorecard checks where your plan's numbers come from, in five areas: Rent Evidence, Fill Speed, Nearby Supply, Room Mix and Lease-up Reserves. It doesn't grade the house or the market. It shows which numbers are evidence and which are borrowed. You'll also see your lease-up gap: the months your reserves don't cover, in dollars. |
| button | Start the scorecard |

### How it works

| Field | Exact text |
|---|---|
| h2 | Eleven taps now. Your report right after. |
| body | Answer eleven quick questions about your plan and where its numbers come from. Your Deal Readiness Score shows right away, with a score for each area and your lease-up gap. Your full report follows by email as a PDF: what to check first, and how. |
| steps 1 · title | Eleven quick questions |
| steps 1 · body | About your plan and where its numbers come from. |
| steps 1 · icon | u-minute |
| steps 2 · title | Your score right away |
| steps 2 · body | Five area scores and your lease-up gap. |
| steps 2 · icon | u-score |
| steps 3 · title | Your report by email |
| steps 3 · body | A PDF right after, with a 30-day plan. |
| steps 3 · icon | u-report |

### The five areas (one card each, from `content/scorecard.mjs` areas)

| Field | Exact text |
|---|---|
| eyebrow | What the scorecard measures |
| h2 | Where your plan's numbers come from. |

| Area | Card text |
|---|---|
| Rent Evidence | Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess. |
| Fill Speed | Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from an assumed vacancy rate. |
| Nearby Supply | Checks whether you know how many co-living homes compete within about 3 miles, how full they are, and what's new. |
| Room Mix | Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or decided on a hunch. |
| Lease-up Reserves | Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches nearby filled. |

### The report

| Field | Exact text |
|---|---|
| h2 | Your report, built from your answers |
| body | Your answers turn into a report for your deal. It holds your Deal Readiness Score, your first six months, three checks outside RoomIQ, the method that closes your gaps and a 30-day plan. It arrives by email right after you finish. |
| bullets 1 | About a minute to answer |
| bullets 2 | Free, with no card and no call needed |
| bullets 3 | Emailed right after you finish |
| button | Get my free report |

### FAQ

| Field | Exact text |
|---|---|
| h2 | Straight answers |
| body | What investors ask before they start. |
| button | Start the scorecard |

| Question | Answer |
|---|---|
| Is it really free? | Yes. No card and no call needed. You answer eleven questions, your score shows on screen, and your report comes by email as a PDF. |
| Why do you ask about my costs and reserves? | To work out your lease-up gap: the months your reserves don't cover. We use the low end of your cost range and the high end of your reserves, so it never overstates. |
| Is the score a forecast? | No. It scores where your plan's numbers come from, not the house or the market. A forecast on your address is a separate, free step in RoomIQ. |
| Do I need an address? | No. The scorecard works before you have a house. If you do have one, the free forecast in RoomIQ runs on it. |
| Does RoomIQ check zoning or financing? | No. Rules on unrelated adults sharing a home differ by city, and many loans use whole-home rent. Your report says what to ask the city, a lender and an insurer. Not legal advice. |
| Will you call me? | Only if you book a walkthrough. Your report comes by email either way. |
| What do you do with my answers? | We use them to build your report and to follow up by email. We never show your answers or your house in public. Unsubscribe any time. |

### Final call

| Field | Exact text |
|---|---|
| h2 | See your first six months before you buy. |
| sub | Eleven taps, about a minute, free. |
| button | Score my deal |

## 4. Shared by every page

| Field | Exact text |
|---|---|
| meta · title | The First Deal Risk Scorecard \| RoomIQ |
| meta · description | Would your first rent-by-the-room deal survive its first six months? Eleven quick questions, about a minute, free. Your score shows right away; your report comes by email. |
| meta · ogImage | /assets/og.png |

### The notice at collection, the cookie banner and the footer

The notice sits above the last step's button and names it. The Meta sentence shows only when a pixel is set; the texts
sentence only when a texts consent is configured (it is not: `site.booking.consentText` is empty).

| Field | Exact text |
|---|---|
| legal · notice | By tapping {button}, you agree to our {terms} and acknowledge our {privacy}, which explains what we collect and how we use it. |
| legal · noticeMeta | Unless you opt out, we also tell Meta when a scorecard is finished, to measure our ads. {choices} |
| legal · noticeSms | Texts follow our {sms}. |
| legal · terms | Terms of Service |
| legal · privacy | Privacy Policy |
| legal · choices | Your privacy choices |
| legal · sms | SMS terms |
| legal · newTab | (opens in a new tab) |

| Field | Exact text |
|---|---|
| cookie · text | We use cookies to measure our ads, only if you allow it. {more} |
| cookie · more | Privacy Policy |
| cookie · allow | Allow |
| cookie · decline | Decline |

| Field | Exact text |
|---|---|
| footer · line | RoomIQ is room-by-room underwriting for rent-by-the-room investors. The houses in our pictures and examples are made up. |
| footer · master | See how RoomIQ works |
| footer · links 1 · key | terms |
| footer · links 1 · label | Terms |
| footer · links 2 · key | privacy |
| footer · links 2 · label | Privacy |
| footer · links 3 · key | choices |
| footer · links 3 · label | Privacy choices |
| footer · cookieSettings | Cookie settings |

| Field | Exact text |
|---|---|
| picture · alt | Illustration of a made-up neighborhood of houses along a street. |

## 5. The quiz

Eleven steps, one per screen, about a minute: five gateway questions (G1 to G5), five scored questions (Q1 to Q5) and
the contact step (S11). Points and what each answer feeds are in spec 1; here are the words.

| Step | Question | Answers |
|---|---|---|
| G1 `stage` | Where are you with rent-by-the-room? | Learning, no house yet / Looking at houses / Under contract / Converting my house / I run 1 to 10 houses / More than 10 houses |
| G2 `market` | Where is the house, or the market you're looking at? | Dallas-Fort Worth / Houston / Atlanta / Orlando / Jacksonville / Phoenix / Las Vegas / Another US market / Not decided yet |
| Q1 `rentsource` | Where does your per-room rent number come from? | I don't have one yet / A platform's earnings calculator / Whole-home rent divided by bedrooms / Asking rents I found on room listings / Comps of nearby rooms, with how fast they filled |
| Q2 `fillsource` | How do you know how fast rooms fill near the property? | I haven't looked / I assume a vacancy percentage / Host stories and forum posts / A platform's market reports / Observed fill times of comparable rooms nearby |
| Q3 `supply` | How many co-living homes compete within about 3 miles? | No idea / Some, I think / I counted listings / I know the count and roughly how full they are |
| Q4 `bathmix` | Have you decided the bath mix? | Not yet / Keeping the current bathrooms / Adding a bathroom because it seems worth it / Modeled private against shared-bath rents nearby |
| Q5 `slowplan` | What happens if lease-up takes longer than planned? | I haven't planned for it / I'd lower rents / A few weeks of reserves / Reserves sized from how comparable launches nearby filled |
| G3 `carry` | About what will the house cost you each month before rent comes in? _(help: Loan payment, taxes, insurance and utilities, with every room empty. A range is fine.)_ | Under $2,000 / $2,000 to $3,000 / $3,000 to $4,000 / More than $4,000 / Not sure yet |
| G4 `fillmonths` | How long do you expect the rooms to take to fill? _(help: Counted from the day rooms are ready to rent.)_ | About a month / About 2 months / About 3 months / 4 months or more / Not sure |
| G5 `reserves` | If no rent came in, how many months of costs could your reserves carry? _(help: Cash set aside for this house, after the down payment and the work.)_ | None set aside yet / 1 month or less / 2 to 3 months / 4 to 5 months / 6 months or more / Not sure |

The contact step (S11):

| Field | Exact text |
|---|---|
| q | Where should we send your report? |
| fields 1 · name | firstName |
| fields 1 · label | First name |
| fields 1 · autocomplete | given-name |
| fields 1 · required | true |
| fields 1 · max | 60 |
| fields 2 · name | email |
| fields 2 · label | Email |
| fields 2 · type | email |
| fields 2 · autocomplete | email |
| fields 2 · inputmode | email |
| fields 2 · required | true |
| fields 2 · max | 254 |
| consent · name | consentEmail |
| consent · label | Email me my score, my report and the occasional underwriting tip. Unsubscribe any time. |
| consent · required | true |
| button | See my score |

The quiz's own words (buttons, errors, progress):

| Field | Exact text |
|---|---|
| count | Question {n} of {total} |
| back | Back |
| next | Next |
| close | Close |
| pick | Pick an answer to go on. |
| required | Please fill this in. |
| email | Please enter a valid email address, like name@example.com. |
| consent | Tick the box so we can email your score and your report. |
| profiles | Pick an answer to go on. |
| sending | Working out your score |
| failed | That didn't go through. Check your connection and try again. |
| stored | Your score is below. We couldn't save your answers just now, so your report may not arrive; please try again later. |

## 6. The results page (`/results/<token>`)

### The top: thanks, the score and the first six months

| Field | Exact text |
|---|---|
| header · thanks | Thanks, {first_name}. |
| header · name | Your First Deal Risk Scorecard |
| header · email | Your full report is on its way to {email} as a PDF. |
| header · returning | Your report was emailed to you as a PDF. Open it below any time. |

| Field | Exact text |
|---|---|
| score · label | Deal Readiness Score: {score}/100, {tier}. Higher is better. |
| score · intro | Your Deal Readiness Score measures how much of your plan rests on evidence you can check, across five areas. It doesn't grade the house or the market. A low score means some numbers are borrowed: a typed rent, an assumed fill time. Each one can be checked before you make an offer. |

The metric panel shows one variant, chosen by the lease-up gap's kind (spec 1, section 4), with its math line, the
six-month strip and its legend:

| Field | Exact text |
|---|---|
| invisible · gap | At your numbers, your reserves run out {uncovered_months} before the rooms fill. That's at least {gap} of costs with no cushion behind it. |
| invisible · gapMath | {cost} a month × ({fill_months} to fill, minus {reserve_months} of reserves) = {gap}. We used the low end of your cost range and the high end of your reserves. |
| invisible · exact | At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with nothing to spare. Each month past your plan costs at least {cost}. |
| invisible · exactMath | {cost} a month × {fill_months} to fill = {exposure}, against {reserve_months} of reserves. We used the low end of your cost range. |
| invisible · covered | At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with {spare_months} to spare. Each month past your plan costs at least {cost}. |
| invisible · coveredMath | {cost} a month × {fill_months} to fill = {exposure}, against {reserve_months} of reserves. We used the low end of your cost range. |
| invisible · costOnly | At your numbers, lease-up costs you at least {exposure} before the rooms fill. You weren't sure how long your reserves would last, so check them against that number. |
| invisible · costOnlyMath | {cost} a month × {fill_months} to fill = {exposure}. We used the low end of your cost range. |
| invisible · perMonth | At your numbers, every month the rooms sit empty costs you at least {cost}. Your plan doesn't say yet how many months lease-up will take, and that is the number to find. |
| invisible · perMonthMath | We used the low end of your cost range: {cost} a month before any rent comes in. |
| invisible · monthsShort | Your reserves cover {reserve_months} of the {fill_months} you expect lease-up to take. The other {uncovered_months} have no cushion behind them. |
| invisible · monthsCovered | Your reserves cover the {fill_months} you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars. |
| invisible · none | You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there. |
| invisible · fixFirst | Fix first: {bottleneck}. {bottleneck_line} |
| invisible · strip | Your first six months, as you plan them. |
| invisible · month | Month {n} |
| invisible · legend · covered | Lease-up, covered by reserves |
| invisible · legend · uncovered | Lease-up, not covered |
| invisible · legend · unknown | Lease-up |
| invisible · legend · full | Rooms full, as planned |
| invisible · notForecast | Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner. |

### The five area cards

| Field | Exact text |
|---|---|
| summary | Your five scores show where your plan rests on evidence and where it borrows. Start with the area marked Fix first, because the others follow from it. One area fixed well does more than five nudged. |
| areasTitle | Your five areas |

| Card | Exact text |
|---|---|
| Rent Evidence, low | Your rent per room is a borrowed number: a guess, a platform's calculator or a whole-home rent split by bedrooms. Every figure after it, from cash flow to reserves, inherits the guess. The fix is a short list of rooms near the house, by bath type, with how fast they filled. It's the first thing to check before an offer. |
| Rent Evidence, medium | Your rent comes from real room listings, which is a good start. But an asking rent is what a room hopes for, not what it filled at, and listings mix private and shared baths. Keep the rooms that actually filled, split them by bath type, and price each of your rooms from its own group. |
| Rent Evidence, high | Your rent comes from rooms nearby that filled, which is the evidence most first deals skip. Keep it current, because rents move with new supply and the seasons. Before the offer, check that your comps sit near the house and match each room's bath type and size. |
| Fill Speed, low | You don't know how fast rooms fill near the house, so your lease-up months are a guess. The costs start on day one, and the rent arrives room by room. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. Watching real rooms nearby can. |
| Fill Speed, medium | You have a sense of how rooms fill, from stories, forums or a market report. Those describe a market, not the street the house is on, and rooms a few miles apart can fill at different speeds. Check how comparable rooms near the house filled, and set your lease-up months from that. |
| Fill Speed, high | Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months, and the reserves sized from them, something you can defend. Watch the month you launch in: the same room can fill faster or slower depending on the season. |
| Nearby Supply, low | You don't know how many co-living homes compete near the house. Supply nearby decides how hard your rooms will be to fill and what they can ask. A street with many open rooms and falling rents needs a different plan from one with a few full homes. Count it before you buy. |
| Nearby Supply, medium | You've counted the listings, which many first-time buyers never do. A count doesn't say how full those homes are, or whether more are opening. Note the open rooms in each home, and any new listings or rent cuts. That tells you whether the pocket is filling up or already crowded. |
| Nearby Supply, high | You know the competition: how many homes, and roughly how full they are. Keep watching, because supply keeps changing after you buy. New homes opening nearby, or rooms cutting their rents, are the early signs to adjust your plan. |
| Room Mix, low | You haven't priced the bath mix yet. Private-bath and shared-bath rooms rent and fill differently, so two houses with the same bedroom count can earn very different money. Deciding the mix before you see those spreads is guessing at the biggest lever you control. Compare private and shared-bath rents nearby before you plan any work. |
| Room Mix, medium | You've made a call on the bathrooms, but not from the rooms nearby. Adding a bath because it seems worth it, or keeping the ones you have, can both be right. The rents of private and shared-bath rooms nearby tell you which. Price the house both ways before you book the work. |
| Room Mix, high | Your bath mix comes from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. Before the offer, check that the room count also fits the city's rule on unrelated adults sharing a home. |
| Lease-up Reserves, low | You haven't planned for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. Cutting rents is the usual reflex, and a cut room keeps the lower rent after it fills. Size your reserves from how comparable launches nearby filled, before you make the offer. |
| Lease-up Reserves, medium | You have some reserves, but they aren't sized from evidence. A few weeks may cover a quick lease-up and not a slow one. Work out your monthly carrying cost, multiply it by the months lease-up could take, and set the reserves from that number. |
| Lease-up Reserves, high | Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. Keep a slower case in your deal math. Revisit it whenever rents or supply near the house change. |

Under each card, by band:

| Field | Exact text |
|---|---|
| recommendations · low | Start here. This is where your plan borrows the most, and it can be checked before an offer. |
| recommendations · medium | Tighten it. The evidence is partly there; the next step is the rooms near the house. |
| recommendations · high | Protect it. Recheck it before the offer, because rents and supply keep moving. |

| Field | Exact text |
|---|---|
| band label · low | Low |
| band label · medium | Medium |
| band label · high | High |

### The next steps (cards, in order by tier)

The free forecast card shows in a covered market (the seven preset metros, decision 9); outside them it becomes
"Look up your market".

| Who | Order |
|---|---|
| Beginner | report, forecast, sharpen, call, service |
| Intermediate | forecast, report, sharpen, call, service |
| Advanced | call, forecast, report, sharpen, service |
| More than 10 houses (call only) | call, report, sharpen, service |
| Default | report, forecast, sharpen, call, service |

| Field | Exact text |
|---|---|
| cta · forecast · h3 | Run a free forecast on your address |
| cta · forecast · body | Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby, with its formula, its comps and how sure it is. Free plan: no card needed, three forecasts a month. |
| cta · forecast · button | Run my free forecast |
| cta · market · h3 | Look up the evidence in your market |
| cta · market · body | Look up any US city, ZIP or metro in RoomIQ and see how strong the evidence is for each. A coverage check runs before any estimate. |
| cta · market · button | Look up my market |
| cta · sharpen · h3 | Sharpen your report |
| cta · sharpen · body | Answer {n} more quick questions and your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. About a minute. |
| cta · sharpen · bodyN | Answer {n} more quick questions and your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. About a minute. |
| cta · sharpen · button | Add {n} answers |
| cta · sharpen · buttonN | Add {n} answers |
| cta · sharpen · done | Your report will use your {n} extra answers. |
| cta · service · h3 | See how RoomIQ shows its working |
| cta · service · body | Every RoomIQ estimate prints its formula, its comps and how sure it is, and thin evidence is labeled Thin. See it on demo data first. |
| cta · service · button | See how RoomIQ works |
| cta · call · h3 | Book a 20-minute walkthrough |
| cta · call · body | Bring an address. We'll run the forecast on it together and read what the evidence covers, and what it doesn't. Pick a day and a time window. |
| cta · call · button | Pick a time |
| cta · checkout · h3 | Get started |
| cta · checkout · body | Start now. |
| cta · checkout · button | Get started |

| Field | Exact text |
|---|---|
| report card · h3 | Your report |
| report card · body | Your full report is on its way to your inbox as a PDF. Open it here any time: your score, your first six months, three checks outside RoomIQ, the method and a 30-day plan. |
| report card · button | Open my report |
| report card · pdf | Download the PDF |

### The checks card: three checks RoomIQ can't do for you

The same words print on the report's checks page (spec 3, section 5). The city's rule shows for the visitor's market;
"Not legal, lending or insurance advice" closes it.

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

| Field | Exact text |
|---|---|
| ruleLine | Zoning, financing and insurance sit outside RoomIQ. This is not legal, lending or financial advice. |
| retake | Take the scorecard |
| notFound | We couldn't find that result. Open the link in your score email again, or take the scorecard. |

## 7. The walkthrough step (`#call` on the results page)

Twenty minutes, by video, on their address. The next 5 business days, never the same day, no weekends; three
windows in the visitor's own time; a phone with its own unticked consent; the address optional.

| Field | Exact text |
|---|---|
| booking · h3 | Book your walkthrough |
| booking · lead | A 20-minute walkthrough on your address with RoomIQ's founder. Pick a day and a time window, and we'll email you a video link. |
| booking · day | Pick a day |
| booking · window | Pick a time window (your time) |
| booking · button | Book my walkthrough |
| booking · pickDay | Pick a day for the walkthrough. |
| booking · pickWindow | Pick a time window. |
| booking · phoneError | Please enter a 10-digit US phone number. |
| booking · consentError | Tick the box so we can reach you about the walkthrough. |
| booking · sending | Booking your walkthrough |
| booking · failed | That didn't go through. Check your connection and try again. |
| booking · done | You're booked: {day}, {window}. |
| booking · doneLine | We'll email a video link for {hours}, your time, and call {phone} if the link doesn't work. Bring the address and the listing if you have them. |
| booking · doneEmail | We've emailed the details to {email}. If the time stops working, reply and we'll move it. |
| booking · calendar | Add to calendar |
| booking · calendarTitle | RoomIQ: your 20-minute walkthrough |
| booking · calendarBody | A 20-minute walkthrough with RoomIQ on your address and your First Deal Risk Scorecard. We'll email you a video link. |
| booking · next | While you wait: sharpen your report (optional, {n} taps) |

| Window | Hint |
|---|---|
| Morning | 8 to 11 am |
| Midday | 11 am to 2 pm |
| Afternoon | 2 to 5 pm |

| Field | Exact text |
|---|---|
| site.booking · minutes | 20 |
| site.booking · phone · name | phone |
| site.booking · phone · label | Best number to reach you |
| site.booking · phone · prefix | +1 |
| site.booking · phone · autocomplete | tel-national |
| site.booking · phone · inputmode | tel |
| site.booking · consentPhone · name | consentPhone |
| site.booking · consentPhone · label | RoomIQ may call me at this number about my walkthrough. |
| site.booking · consentPhone · required | true |
| site.booking · address · name | address |
| site.booking · address · label | The house's address, if you have one (optional) |
| site.booking · address · autocomplete | street-address |
| site.booking · address · max | 200 |

## 8. The deepener page (`/sharpen/<token>`)

Ten scored questions (two per area) and the two checklist questions, about a minute. The rent questions hide when the
visitor has no rent yet.

| Field | Exact text |
|---|---|
| deepener · title | Sharpen your report |
| deepener · lead | {n} more quick questions, about a minute. Your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. |
| deepener · leadN | {n} more quick questions, about a minute. Your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. |
| deepener · label | Sharpen your report |
| deepener · button | Add to my report |
| deepener · sending | Adding your answers |
| deepener · done | Done. Your report will use your {n} extra answers. |
| deepener · doneLine | Your sharper report is on its way to your inbox, as a PDF. |
| deepener · already | You've already added your extra answers. Your report will use them. |
| deepener · missing | We couldn't find that scorecard. Open the link in your score email again, or take the scorecard. |
| deepener · toResults | Back to my score |
| deepener · toCall | Book a 20-minute walkthrough |

| Step | Question | Answers |
|---|---|---|
| D1 `rentperroom` | Do you have a rent for each room, by bath type? _(hidden when rentsource is none)_ | Not yet / One rent for every room / A rough split, private and shared bath / A rent per room, from nearby rooms with the same bath type and size |
| D2 `rentcomps` | How many nearby rooms is your rent number based on? _(hidden when rentsource is none)_ | None, or not sure / 1 or 2 / 3 to 9 / 10 or more |
| D3 `occsource` | Where does your plan's occupancy figure come from? | I haven't set one / A rule of thumb / A platform's market average / Observed occupancy of comparable rooms nearby |
| D4 `launch` | Have you picked the month to start renting rooms? | Not yet / Whenever the work is done / A season I've heard is busy / When rooms nearby fill fastest |
| D5 `newsupply` | Do you know whether new co-living homes opened nearby this year? | No idea / I think a few did / I checked the current listings / I track homes that open and close nearby |
| D6 `pricedrops` | Have rooms near the house been cutting their rents? | I don't know / I've heard so / I've seen a few drop / I've checked recent price drops on comparable rooms |
| D7 `roomcount` | How did you decide how many rooms to rent? | Not decided yet / As many as the house can fit / The current bedroom count / A layout checked against rents nearby |
| D8 `sizemix` | Have you checked which room sizes rent best nearby? | Not yet / I assume bigger rooms rent better / I've seen a few listings / I compared rents and fill speed by room size nearby |
| D9 `dealmath` | Where do the numbers in your deal math come from? | I haven't run the numbers yet / A calculator's default settings / My own estimates / Rents and occupancy of comparable rooms, with my own costs |
| D10 `stress` | Does your deal math test a slower lease-up? | No / I add a vacancy rate on top / I test one slower case / I test it against how comparable launches nearby filled |
| C1 `zoning` | Have you checked the city's rule on unrelated adults sharing a home? | Not yet / I asked around / I read a summary online / I checked the city code / I confirmed with the city or an attorney |
| C2 `financing` | How will you finance the house? | Not sure yet / A loan sized on whole-home rent / Cash / A lender who works with room rentals, briefed on room income |

## 9. The emails the funnel sends (Resend)

Each email's lines are filled per visitor; a line whose field is empty is left out. Every email ends with the sign-off,
the unsubscribe line and the privacy line; commercial emails need the postal address (`site.postalAddress`, not set).

| Field | Exact text |
|---|---|
| signoff | The RoomIQ team |
| unsubscribe | Don't want these emails? Unsubscribe: {unsubscribe_link} |
| privacy | Privacy Policy: {privacy_link} |

### The score email, when the report follows later (not used: delivery is instant) (`score`)

| Field | Exact text |
|---|---|
| subject | Your Deal Readiness Score: {score}/100 |
| preheader | {tier}. Higher is better. |
| lines 1 | Hi {firstName}, |
| lines 2 | Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score is {score}/100: {tier}. Higher is better. |
| lines 3 | {invisible_line} |
| lines 4 | Fix first: {bottleneck}. {bottleneck_line} |
| lines 5 | Start this week: {quick_win}. |
| lines 6 | Your full report is on its way to you by email. |
| lines 7 | Want a sharper report? Answer {n} more quick questions here: {deepener_link} |
| lines 8 | Your score, any time: {results_link} |
| deepenerN | Want a sharper report? Answer {n} more quick questions here: {deepener_link} |
| button | See my score |

### The score email with the PDF (day 0) (`scoreReport`)

| Field | Exact text |
|---|---|
| subject | Your Deal Readiness Score: {score}/100, and your report |
| preheader | {tier}. Your full report is attached as a PDF. |
| lines 1 | Hi {firstName}, |
| lines 2 | Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score is {score}/100: {tier}. Higher is better. |
| lines 3 | {invisible_line} |
| lines 4 | Fix first: {bottleneck}. {bottleneck_line} |
| lines 5 | Start this week: {quick_win}. |
| lines 6 | {report_line} |
| lines 7 | It covers your five areas, your first six months, three checks RoomIQ can't do for you, the Room-by-Room Underwrite and a 30-day plan. |
| lines 8 | {forecast_line} |
| lines 9 | Want a sharper report? Answer {n} more quick questions here: {deepener_link} |
| lines 10 | Want to go through it on your address? Book a 20-minute walkthrough: {booking_link} |
| deepenerN | Want a sharper report? Answer {n} more quick questions here: {deepener_link} |
| reportAttached | Your full report is attached as a PDF, and it's online here: {report_link} |
| reportLinked | Your full report is online here: {report_link} |
| forecastCovered | When you have an address, run a free forecast on it: {forecast_link} (Free plan, no card needed, three forecasts a month). |
| forecastOutside | See how strong the evidence is in your market: {forecast_link} |
| button | Open my report |

### After the deepener: the sharper report (`sharper`)

| Field | Exact text |
|---|---|
| subject | Your sharper report: {score}/100 |
| preheader | Updated with your {n_answered} extra answers. |
| lines 1 | Hi {firstName}, |
| lines 2 | Thanks for the {n_answered} extra answers. Your report now uses all of them: your Deal Readiness Score is {score}/100, {tier}. |
| lines 3 | Fix first: {bottleneck}. {bottleneck_line} |
| lines 4 | {report_line} |
| lines 5 | {call_line} |
| reportAttached | The updated report is attached as a PDF, and it's online here: {report_link} |
| reportLinked | The updated report is online here: {report_link} |
| button | Open my report |

### The report, updated (a resend from the admin) (`reportUpdate`)

| Field | Exact text |
|---|---|
| subject | Your report, updated |
| preheader | Your First Deal Risk Scorecard report, updated by our team. |
| lines 1 | Hi {firstName}, |
| lines 2 | {checker} at RoomIQ has updated your First Deal Risk Scorecard report. |
| lines 3 | {report_line} |
| lines 4 | {call_line} |
| reportAttached | The updated report is attached as a PDF, and it's online here: {report_link} |
| reportLinked | Read the updated report here: {report_link} |
| button | Read my report |

### The report email (a resend with the booking state) (`report`)

| Field | Exact text |
|---|---|
| subject | Your First Deal Risk Scorecard report is ready |
| preheader | Your score, your first six months and a 30-day plan. |
| lines 1 | Hi {firstName}, |
| lines 2 | Your First Deal Risk Scorecard report is ready. |
| lines 3 | Read it here: {report_link} |
| lines 4 | Or download the PDF: {pdf_link} |
| lines 5 | {pdf_attached} |
| lines 6 | It starts with your Deal Readiness Score, {score}/100, and your first six months. Then three checks RoomIQ can't do for you, and a 30-day plan you can run yourself. |
| lines 7 | {call_line} |
| attached | The PDF is attached to this email too. |
| callBooked | We'll go through it on your walkthrough: {day}, {window}. |
| callOpen | Want to go through it on your address? Book a 20-minute walkthrough: {results_link} |
| button | Read my report |

### The walkthrough confirmation (`call`)

| Field | Exact text |
|---|---|
| subject | You're booked: {day}, {window} |
| preheader | A 20-minute walkthrough on your address. |
| lines 1 | Hi {firstName}, |
| lines 2 | You're booked for a 20-minute walkthrough on {day}, {window} ({hours}, your time). |
| lines 3 | We'll email you a video link before then, and call {phone} if the link doesn't work. |
| lines 4 | Bring the address and the listing if you have them. We'll run the forecast on it together and read what the evidence covers, and what it doesn't. |
| lines 5 | If the time stops working, reply and we'll move it. |

### The team's notices

| Field | Exact text |
|---|---|
| team · lead | New scorecard: {business}, {city}. {score}/100, {tier}. |
| team · deepened | Deepener answered: {business}, {city}. Report score {score}/100. |
| team · call | Walkthrough booked: {business}, {city}. {day}, {window} ({hours}, their time). {phone} |
| team · sent | Report sent: {business}, {city}, checked by {checker}. |
| team · pdfSent | The PDF report went to the investor with the score. |
| team · pdfFailed | The PDF could not be printed ({reason}); the investor got the report's link instead. |
| team · test | Test: the scorecard's emails reach this address. This is the sample report, for a made-up investor. |
| team · digest | {count} reports are waiting. The oldest came in {age} ago. |
| team · digestInstant | {count} reports are waiting for the team. The oldest came in {age} ago. |
| team · notSaved | NOT SAVED to the database ({reason}). Everything is in this notice. |

## 10. The follow-up emails in Loops: days 2, 5 and 8

The GTM's sequence (`lead_magnet_spec.xlsx`, Email_Sequence; drafts in `scorecard_spec.docx` Section 4) has four
emails. Day 0 is the funnel's own score email (section 9, with the PDF). Days 2, 5 and 8 run in Loops, as the GTM
planned (decision 13), started by the funnel's webhook (`SCORECARD_WEBHOOK_URLS`, signed with
`SCORECARD_WEBHOOK_SECRET`). Connect it to Loops through the owner's automation tool, mapping: `contact.email`,
`contact.first_name`, `result.score`, `result.tier_name`, `result.bottleneck_name`, `deal.market_label`,
`result.covered` and `links.results`. The booking webhook (`event: booking`) ends the sequence.

Rules from the GTM's Section 5 for these emails: never promise or imply income; zoning, financing and insurance are
named as outside RoomIQ; the free forecast only in covered markets; email 2's numbers come from a real run at send time,
never invented; email 4's urgency only if a real limit exists.

### Day 2: one address with room-level evidence

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
| Send rule | Fill the brackets from a real run on a covered-market address on the day it goes out. If no run is current, skip this email. Outside covered markets (result.covered false), send the same email with line 7 and the button replaced by: "See whether RoomIQ covers your market", linking to roomiq.io. |

### Day 5: three numbers to check before an offer

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
| Link | {links.results}#call |
| Send rule | Skip when a walkthrough is booked. |

### Day 8: the reminder

Version 1 only while the founding cohort has seats left and the number is published (the landing page's
`seatsLeft`), and only to leads who run houses (stage "I run 1 to 10 houses"). Everyone else gets version 2. This
keeps the GTM's rule: urgency only when the limit is real.

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

## 11. Pictures and icons

| Slot | What shows | Source |
|---|---|---|
| Landing hero (both versions), share image, report cover | A made-up neighborhood of houses along a street | The landing page's story-film poster, as `src/assets/img/neighborhood-640/960/1280.webp` (`brand/brand.json` images); the share image is drawn by `tools/make-og.mjs` |
| Area icons (landing, results, report, admin) | Rent Evidence: a magnifying glass over a dollar sign. Fill Speed: a house with four rooms, three lit. Nearby Supply: a pin in a dashed ring with three houses. Room Mix: a floor plan of four rooms, one a bathroom. Lease-up Reserves: a stack of coins beside an hourglass | Drawn as SVG in `lib/icons.mjs` in the brand's ink and accent |
| Utility icons | A stopwatch (about a minute), a price tag (free), a donut (score right away), a clipboard with an envelope (report by email) | `lib/icons.mjs` |
| Six-month strip | Six month tiles: covered (outlined), uncovered (amber), rooms full (ink), unknown (dashed) | `lib/icons.mjs` `monthsStrip` |

Every house and number in a picture is made up, and the footer says so. A new picture, if wanted, follows the poster's
style: "Isometric illustration of a quiet American residential street with single-family houses, flat colors in deep
navy (#03045E), blue (#0077B6) and cyan (#00B4D8) accents on white, soft shadows, no people's faces, no text, no
logos, no real addresses." Save it in `src/assets/img/` at 640, 960 and 1280 wide (WebP), and name it in the variant's
`hero.picture`.
