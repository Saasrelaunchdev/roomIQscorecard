# Go-to-market brief: RoomIQ, for the First Deal Risk Scorecard

Sources read (all read-only, on 2026-11-24):

- `Saasrelaunchdev/roomIQGTMBuild`, branch `main`: `GTM-BRIEF.md` (Sections 1 to 5), `deliverables/scorecard_spec.docx`,
  `deliverables/lead_magnet_spec.xlsx` (Overview, Questions, Results_Tiers, Email_Sequence, Score_Test),
  `deliverables/icp_dashboard.xlsx`, `deliverables/buying_committee.xlsx`, `deliverables/customer_journey.xlsx`,
  `deliverables/assets_library.xlsx`, `deliverables/positioning_statements.docx`,
  `gtm-docs/RoomIQ_Value_Proposition_Framework_End-user.docx`, `docs/research/2026-11-11-gtm-deep-research.md`,
  `walkthrough/BRIEF.md` (slides 12 to 14). Branch `claude/blissful-hawking-0wvh7y`: `meta-launch/PLAN.md` and
  `meta-launch/build/ads_content.py` (the Meta launch kit, not yet merged into `main`).
- `Saasrelaunchdev/Roomiqscorecards`: `index.html`, "RoomIQ Scorecard Options" (the proposal). The client picked Path 1
  (a quiz) and idea I1, First Deal Risk.
- `Saasrelaunchdev/RoomIQproductionlandingpage`: `index.html` (page v5), `CHANGELOG.md`, `CLAUDE.md`.

Facts are cited like `[GTM-BRIEF.md, Section 5]`. Anything inferred is marked **Assumption**.

## The product

RoomIQ is room-level market data and underwriting software for US rent-by-the-room investors. You pick a market,
benchmark comparable properties, and estimate an address's revenue and deal returns, with the evidence behind each
number shown [GTM-BRIEF.md, Section 1, one-liner]. Its category is real estate investment analytics: rental market data
and property underwriting software [Section 1]. The workflow runs Dashboard (discover a market), Property Analyzer
(comparable properties), Property Predictor (underwrite an address), Deal Calculator (financed returns), then My
Underwrites (save and re-run) [Section 1]. The unit of analysis is the room: rent per room per week, occupancy room by
room, rooms split by bath type and size [Section 1].

It replaces a guessed rent figure in a spreadsheet: "It replaces the spreadsheet cell where the rent used to be a
guess" [landing page v5, comparison section]. The forecast prints its formula, "Price x rooms x occupancy x 4.35 weeks"
[GTM-BRIEF.md, Section 5, process proof].

## The ICPs

| ICP | Fills it in | Buys | Floor | Triggers | Top pains (their words, or the GTM's) | Channels |
|---|---|---|---|---|---|---|
| Level 1: small co-living operators, owner-operated, about 1 to 10 homes [icp_dashboard.xlsx, ICP] | the owner-operator, sometimes a virtual assistant | the owner (often the same person) | past at least one lease-up | evaluating the next property; new supply nearby; an occupancy dip; a lender asking for numbers | pricing rooms as new supply arrives; holding occupancy; lenders valuing on whole-home rent; insurers declining room rentals; "judging whether the next house will fill" | operator communities, co-living podcasts, BiggerPockets [buying_committee.xlsx, ICP1_Personas] |
| Level 2: individual investors entering rent-by-the-room for the first time, and operators scaling past about 10 homes [icp_dashboard.xlsx, ICP] | the investor running the numbers on a first by-the-room deal | the same person, with a spouse or partner | before or during the first deal | a co-living podcast or BiggerPockets episode; a platform earnings estimate; a candidate house; short-term rental restrictions in their city | "no rent-by-the-room comps to underwrite from"; platform estimates "for illustration only"; zoning uncertainty; financing on per-room income [icp_dashboard.xlsx, ICP]; drivers: "confidence the numbers are real before an offer", "not losing the down payment on a bad first deal" [buying_committee.xlsx, ICP2_Personas] | Meta feeds, BiggerPockets forums and podcasts, Reddit, Facebook investor groups, creator courses [ICP2_Personas; assets_library.xlsx] |
| Run 2: lenders, brokers and acquisition analysts | | | | | | after the 90-day backtest, never blended in [GTM-BRIEF.md, Run order] |

## The ICP this scorecard serves, and why

**Level 2 investors before or during their first rent-by-the-room deal.** The client picked idea I1, First Deal Risk,
whose card reads "Investors before or during their first deal" [Roomiqscorecards proposal, Path 1, Investors]. The
GTM's own scorecard targets the same people: "Level 2: individual investors weighing a first or next rent-by-the-room
deal. Also Level 1 operators checking a next acquisition" [scorecard_spec.docx, Section 1]. Their engagement model is
self-serve: "Meta ads and community content, then the live Free plan (3 forecasts a month), then Pro at $45 a month"
[icp_dashboard.xlsx, Best Engagement Model]. They answer from memory in a minute: one person, their own deal.

Level 1 operators checking a next house can take it too, and the words say "this deal" wherever "first" would not fit
them. A first question records where the visitor stands, so operators reach the founding cohort and scaling operators
reach a call. The operator scorecards in the proposal (O1 to O3) wait for a second build.

## Their problem, in their words

"Everyone says rooms cash-flow better, but every number I find comes from someone selling something"
[customer_journey.xlsx, 1. Problem Awareness]. "Is there a way to see what rooms near this house actually rent for?"
[2. Solution Discovery]. A first deal rests on two borrowed numbers, a typed rent and an assumed occupancy: "The right
formula, running on two borrowed numbers" [landing page v5, napkin math; meta-launch/PLAN.md, the villain].

What it costs: the first months of carrying cost, paid while rooms fill, and a deal underwritten on rent that the
rooms nearby do not support. The proposal's number for I1: "Carrying cost × months to fill, minus reserves", and its
aha: "A guessed rent figure inflates every number after it" [proposal, I1]. No typical lease-up time can be cited:
the research found none for the seven metros ("typical new-home lease-up... NOT FOUND") [deep research, Occupancy, days
to fill]. So the number is built only from the buyer's own answers.

What they believe causes the risk: the market, or the house. The scorecard's insight sits in the gap: the risk is in the
evidence behind the plan, which they can check before an offer.

## The mechanism

From the product's workflow and process proof [GTM-BRIEF.md, Sections 1, 3 and 5]:

1. Room rents from observed rooms nearby, split by bath type and size (room-segment economics, C14, seen).
2. How rooms fill: occupancy, 7, 30 and 90-day windows, seasonality (C15, C03, seen).
3. Nearby supply: active co-living properties within about 3 miles of any address, with listing status (C21, C06, seen).
4. The room and bath mix, entered in the forecast, because "private-bath supply and shared-bath pressure are
   structural revenue drivers" (the baseline profile, C27, seen).
5. The deal math under the buyer's own assumptions: cash flow, cash-on-cash, DSCR and cap rate (C31, partly seen), with a
   stability test across evidence windows (C28, seen).

Features seen only as a button (per-room rent guidance C25, cohort lease-up outcomes C26, bedroom layout C22, garage
conversion C30) are described only in the GTM's own feature words, never as outputs [GTM-BRIEF.md, Section 3, rule for
Button only features].

## The alternatives

Platform earnings calculators, deal analyzers built for whole homes, room-rate market passes, a coliving course with an
AI comp tool, and doing it by hand (listings, a spreadsheet, a forum thread) [GTM-BRIEF.md, Section 2;
positioning_statements.docx]. Rules: categories only, never names, in public copy [landing page CLAUDE.md,
Non-negotiable 2; meta-launch/PLAN.md, decision 4]. No "only", "first" or "leading" claims; no price comparisons
[GTM-BRIEF.md, Section 5].

## The offer and the next steps

- **Free plan** (live): $0, no card, one main market, 90 days of history, 5 Analyzer opens and 3 revenue estimates a
  month [GTM-BRIEF.md, Classification, Motion; landing page v5, pricing]. Copy may say "Free plan. No card needed.
  Three forecasts a month." [landing page v5, hero].
- **Pro**: $45 a month or $450 a year; Portfolio and Operator above it [decision 3]. The scorecard names no price: its
  next step is free.
- **Next step after the score**: a free forecast on their address [proposal, I1, Next step], in a covered market only;
  "outside them, the results page offers the checklist instead" [scorecard_spec.docx, Section 5]. By tier: Beginner,
  the underwriting checklist; Intermediate, a free forecast; Advanced, "Book a 20-minute walkthrough on your address"
  [lead_magnet_spec.xlsx, Results_Tiers].
- **The walkthrough**: a 20-minute video call with the founder that runs the forecast on an address the prospect
  brings [assets_library.xlsx, Bottom of Funnel].
- **The founding operator cohort**: 12 seats, Pro at $30 a month locked for 24 months [decision 2]. Seats left is
  `{TBD}` [landing page v5]; urgency only if a real limit exists [scorecard_spec.docx, Section 5].
- Links: the app's free forecast at `https://roomiq.io/dashboard` [landing page v5, every "Run a free forecast"
  button]; contact `marcel@roomiq.io` [landing page SITE data].

## Proof that may be cited

None. The proof table is empty until a founding operator signs a citation clause [GTM-BRIEF.md, Section 5, proof
set]. Process proof (the printed formula, labeled support and confidence, local and expanded comps apart) may be used in
copy, never as a proof point [Section 5]. Third-party figures only attributed, with their source in the sentence.

## Voice

Plain, direct, for one person investing their own money. Short sentences (the landing page holds headlines to 8 words,
the line under to 16, other sentences to 20, FAQ answers to 35) [landing page CLAUDE.md, Non-negotiable 4]. Their words:
"rooms", "rent-by-the-room", "comps", "lease-up", "fill", "bath type", "the house", "an offer", "reserves", "carrying
cost". Honest about limits: "A sharper view. Not a crystal ball." [decision 7]. Example lines: "Same formula. Four inputs
you can check." and "No tool can promise that, and RoomIQ doesn't." [landing page v5].

## Claim rules

From GTM-BRIEF.md Section 5 (the do-not-write table and the banned list):

- No accuracy claims ("accurate", "predicts", "investor-grade", "lender-ready", any error percentage) before the 90-day
  backtest; write "shows its working".
- No income, return, yield or cash-flow promises ("find cash-flowing deals"); the deal math is "informational only, not
  financial or lending advice".
- No "best markets"; no "real occupancy", "rent collected" or "rental income data" (it is observed listing data).
- No named data-source platform, "powered by", "official", "partner of".
- No "only", "first", "leading"; no price comparisons; no time-saved figures ("in minutes").
- No market statistics without a source; third-party figures attributed in the same sentence.
- No zoning, compliance, flood or insurance determination: "Not legal advice", "for screening".
- No customer counts, dataset sizes, testimonials, logos or results attributed to using RoomIQ.
- No host names, listing titles, listing photos or exact addresses in anything public; every example house is made up
  and says so.
- No em or en dashes; avoid leverage, unlock, seamless, robust, streamline, cutting-edge, empower.

## Compliance

- **Housing ad rules**: every paid campaign under Meta's housing special ad category; nothing targets by age, gender or
  ZIP [decision 9]. The funnel asks for the market (a metro), never targets by it.
- **Consent**: email consent with the score [scorecard_spec.docx, Section 5]; the Meta pixel only after consent, never
  under Global Privacy Control [meta-launch/PLAN.md, Definition of done].
- **Data the funnel must not collect** (**Assumption**, from decision 9 and the skill's privacy rule): nothing about protected classes (age, gender, family); location from the IP only
  as country, region and city.
- **Legal pages**: `https://roomiq.io/privacy`, `https://roomiq.io/terms`; privacy choices at
  `https://roomiq.io/privacy` [landing page SITE data]. The notice version to store with each lead is not published:
  `{TBD}`.
- **Commercial email**: an unsubscribe link and a postal address; RoomIQ's postal address is not in the sources: `{TBD}`.
- **Not advice**: zoning and financing are named as outside RoomIQ; "Not legal or financial advice" [scorecard_spec.docx,
  Section 5].

## Traffic and variants

- **Meta ads** (Campaign 1, the first channel): the C2 cold scorecard ad set sends people to the Meta page's scorecard
  variant (`?v=score`), whose buttons link to this tool through `SITE.scorecardUrl` with campaign parameters carried. It
  optimizes for `ScorecardComplete`, judged at $12 per completion [meta-launch/PLAN.md, decisions 3 and 6;
  ads_content.py, C2; GTM-BRIEF.md decision 10].
- **Events the tool must send** to the same Meta dataset: `ScorecardStart` ("Scorecard opened for the first time",
  pixel) and `ScorecardComplete` ("Scorecard email sent, score shown", pixel and Conversions API with the same
  `event_id`), both with `content_name: scorecard` [ads_content.py, EVENTS].
- **The production landing page**: "Score your next deal" (hero, sticky bar) and "Get my Deal Readiness Score" (final
  section) link here once `site.scorecardUrl` is set [landing page CHANGELOG, v5].
- **Community, events, podcasts and outreach** link to the scorecard [assets_library.xlsx].

So: a quiz-only entry (`/start`) for the landing pages' buttons and links, a ScoreApp-style page (`/`) for organic and
partners, and a Meta-style page with the quiz in the hero (`/first-deal`) for direct paid traffic.

## Open questions (each became a decision in docs/DECISIONS.md)

1. The proposal's Path 1 says "Quiz on ScoreApp"; this build is RoomIQ's own funnel made with the Scorecard Funnel
   Creator, as the owner asked.
2. The GTM's seven-question Deal Readiness spec against the proposal's I1 (five scored areas; zoning and financing as an
   unscored checklist; a dollar figure): I1 wins where they differ.
3. The covered-market list is `{TBD}` (the weekly coverage check); the seven preset metros stand in until it exists.
4. The score's name, the tiers (the GTM's three, not the playbook's four), the metric's exact formula and its variants.
5. Which Meta events, given the GTM's event map against the skill's "qualified leads only" default.
6. The email tool: the GTM's plan names Loops; the template sends through Resend.
7. The postal address, the notice version, the domain, the sender address and the founder's walkthrough hours.
