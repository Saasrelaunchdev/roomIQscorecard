// The PDF report's dynamic pages (spec 3, docs/spec/3-report-dynamic-content.md). Each page shows one variant, chosen
// from the answers by lib/report-model.mjs. Words in braces are fields (the field dictionary is at the end of the spec,
// and in lib/report-model.mjs). The checks page's words are content/checks.mjs.
import CHECKS from "./checks.mjs";

export default {
  title: "The First Deal Risk Scorecard Report",

  cover: {
    title: "The First Deal Risk Scorecard Report",
    subtitle: "How much of the plan for your {deal} rests on evidence you can check, scored across five areas, with your first six months priced from your own numbers.",
    preparedFor: "Prepared for",
    prepared: "{first_name} {last_name}, {market}",
    preparedNoLast: "{first_name}, {market}",
    checked: "Checked by {checker_first_name} at RoomIQ"
  },

  overview: {
    title: "Your Report Overview",
    heading: "Thank you for taking the First Deal Risk Scorecard",
    intro: "Your report scores your plan in the five areas below. A low score isn't a verdict on the deal: it means a number is borrowed, and borrowed numbers can be checked before an offer. A high score means the plan rests on evidence. Next come your Deal Readiness Score and your first six months.",
    sub: "Your five areas"
  },

  // Your First Six Months: the lease-up gap (spec 1, section 4), one variant per kind
  invisible: {
    title: "Your First Six Months",
    gap: { h: "Your reserves run out {uncovered_months} early", body: "You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. At {cost} a month, the {uncovered_months} your reserves don't cover come to at least {gap}." },
    exact: { h: "Your reserves just cover your plan", body: "You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs, with nothing to spare. Each month past your plan costs at least {cost}." },
    covered: { h: "Your reserves cover your plan", body: "You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs: {spare_months} to spare. Each month past your plan costs at least {cost}." },
    costOnly: { h: "Your lease-up costs at least {exposure}", body: "You expect the rooms to take {fill_months} to fill, at {cost} a month before rent comes in. You weren't sure how long your reserves would last, so check them against that number." },
    perMonth: { h: "Every empty month costs at least {cost}", body: "That's what the house costs each month before rent comes in. Your plan doesn't say yet how many months lease-up will take, and the Fill Speed guide shows how to find out." },
    monthsShort: { h: "Your reserves cover {reserve_months} of {fill_months}", body: "You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. Work out your monthly carrying cost next: it turns the other {uncovered_months} into dollars." },
    monthsCovered: { h: "Your reserves cover your lease-up months", body: "You expect the rooms to take {fill_months} to fill, and your reserves carry {reserve_months} of costs. Work out your monthly carrying cost next: it turns months into dollars." },
    none: { h: "The number to find first", body: "You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal. The Lease-up Reserves guide starts there." },
    box: {
      title: "How we worked it out",
      cost: "Monthly carrying cost: {cost}, the low end of the range you picked.",
      fill: "Months to fill: {fill_months}, as you expect them.",
      reserves: "Reserves: {reserve_months} of costs, the high end of the range you picked.",
      gap: "{cost} × ({fill_months} minus {reserve_months}) = {gap}.",
      exposure: "{cost} × {fill_months} = {exposure}.",
      low: "Costs at the low end and reserves at the high end, so the real figure is at least this large."
    },
    strip: "Your first six months, as you plan them",
    legend: { covered: "Lease-up, covered by reserves", uncovered: "Lease-up, not covered", unknown: "Lease-up", full: "Rooms full, as planned" },
    // The slower case: the same plan with lease-up taking twice as long (the playbook's own slower case)
    slowerTitle: "The slower case",
    slower: "If lease-up took twice as long as you expect, {slower_months}, your reserves would leave at least {slower_gap} uncovered.",
    slowerCovered: "If lease-up took twice as long as you expect, {slower_months}, your reserves would still cover it.",
    means: {
      title: "What this number is, and what it isn't",
      body: "It's your own plan, priced: what the house costs while rooms fill, against the cushion you hold. It isn't a forecast. It treats each lease-up month as a month the house costs its full carrying cost; rooms that fill sooner bring rent in sooner."
    }
  },

  // Three checks RoomIQ can't do for you (content/checks.mjs)
  checks: CHECKS,

  // Next to the top three: the template's enrichment page, off in this funnel (site.enrichment false), never shown
  top3: {
    title: "Next to the Market",
    h: "",
    intro: "",
    columns: { measure: "Measure", you: "You", them: "Market", read: "Read" },
    measures: {},
    reads: {},
    chips: { ahead: "Ahead or level", behind: "Behind" },
    profileChecks: {},
    themesTitle: "",
    themesFound: "",
    themesNone: "",
    themesRule: "",
    cushionTitle: "",
    cushionAbove: "",
    cushionBelow: "",
    footnote: "",
    pending: "Not used in this funnel."
  },

  overall: {
    title: "Your Overall Score",
    paragraph: "Your Deal Readiness Score is the average of your five area scores, each out of 100. It measures how much of your plan rests on evidence you can check, not the house, the market or what the deal will return. Under 40, the plan leans on borrowed numbers. From 40 to 69, part of it rests on evidence. At 70 and above, the plan rests on evidence, and the open question is whether it holds for this address.",
    deepenerYes: "Updated with your {n} extra answers.",
    deepenerNo: "Based on your {n_main} answers. Add {n} more for a sharper score:",
    deepenerLinkText: "sharpen your report",
    interpretation: {
      beginner: "Your plan leans on estimates more than evidence. That's normal for a first deal, and it's fixable before the offer. The rent per room and the fill time are the numbers every other one rests on, and right now at least one of them is borrowed. Start with {primary_bottleneck}, follow the 30-day plan from day one, and take the scorecard again on day 30.",
      intermediate: "You have part of the picture. Some of your numbers rest on evidence, and the gaps left are the ones that decide whether rooms fill. Your lowest area, {primary_bottleneck}, is where to start. Close it before the offer, and your next score will show it.",
      advanced: "You underwrite like an operator: your numbers rest on evidence most first deals skip. The open question is whether that evidence holds for this specific address. Recheck rents, fill speed and supply the week you make the offer, and keep the slower case in your deal math."
    },
    urgency: {
      critical: "At your numbers, your reserves leave {uncovered_months} uncovered, so this is the first thing to fix, before you make an offer.",
      criticalUnknown: "This is the first thing to fix, before you make an offer.",
      significant: "At your numbers, your reserves leave {uncovered_months} uncovered, so it's worth fixing before you make an offer.",
      significantUnknown: "Worth fixing before you make an offer.",
      moderate: "Treat it as a refinement, while you compare houses."
    },
    areasTitle: "Your five areas"
  },

  // Section labels used on the strongest and weakest area pages
  labels: { means: "What This Means", next: "Your Immediate Next Step", impact: "Why It Matters for the Deal", quickWins: "Your quick wins, from your answers", checks: "Your checks, from your answers" },

  /* ---------- High score pages: the strongest area ---------- */
  high: {
    rent: {
      h: "Your Rent Evidence Is Your Strongest Asset",
      means: { lead: "Your rent per room comes from rooms nearby that filled. That's the evidence most first deals skip, and every other number in the plan rests on it.",
        bullets: ["Your rent comes from rooms near the house, not a calculator", "Rooms are priced by bath type and size", "Only rooms that actually filled count", "You can show the rooms your rent rests on"] },
      next: { lead: "Rents move with new supply and the seasons. Keep the evidence current.",
        bullets: ["Recheck five rooms near the house once a month", "Recheck the whole list the week you make the offer", "Keep the asking rents apart from the rooms that filled"] },
      impact: { lead: "Rent is upstream of everything else in the plan. Because yours rests on evidence, the deal math and the reserves have something real to work with.",
        bullets: ["Your cash flow starts from rents the street supports", "Your bath mix can be priced from the same list", "A lender or partner can see what the rent rests on"] }
    },
    fill: {
      h: "Your Fill Speed Is Your Strongest Asset",
      means: { lead: "Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months something you can defend.",
        bullets: ["Your lease-up months come from rooms you watched or checked", "Occupancy comes from comparable rooms, not a rule of thumb", "Your launch month follows the seasons", "A slow lease-up is in the plan, not a surprise"] },
      next: { lead: "Fill speed changes with the season and with new supply. Recheck it before the offer.",
        bullets: ["Recheck a few rooms nearby before the offer", "Keep a slower case beside your plan", "Note which months rooms fill fastest"] },
      impact: { lead: "Your first months are when the costs run before the rent does: the costs start on day one, and rent arrives room by room. Knowing the fill speed makes that stretch plannable.",
        bullets: ["Your reserves can be sized from evidence", "Your launch can be timed to the faster months", "Your deal math starts from observed occupancy"] }
    },
    supply: {
      h: "Your Read on Nearby Supply Is Your Strongest Asset",
      means: { lead: "You know the competition: how many co-living homes compete within about 3 miles, and roughly how full they are.",
        bullets: ["You counted the homes near the house", "You know roughly how many rooms are open", "You watch for new homes and rent cuts", "You can tell a busy pocket from a crowded one"] },
      next: { lead: "Supply keeps changing after you buy. Keep the count current.",
        bullets: ["Count again once a month", "Note new homes and rent cuts", "Count again the week you make the offer"] },
      impact: { lead: "Supply sets how hard rooms are to fill and what they can ask. Because you know it, your rent and fill plans rest on the street as it is.",
        bullets: ["Your rent is set against real competition", "Your lease-up months account for the open rooms nearby", "You get early warning when the pocket gets crowded"] }
    },
    mix: {
      h: "Your Room Mix Is Your Strongest Asset",
      means: { lead: "Your bath mix and room count come from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess.",
        bullets: ["The bath mix is priced from rooms nearby", "The house is priced both ways before any work", "The room count is checked against rents nearby", "The garage or extra space is priced both ways"] },
      next: { lead: "Before the offer, check the room count against the city's rule too.",
        bullets: ["Read the city's rule on unrelated adults sharing a home", "Get a quote before you book any work", "Recheck private and shared-bath rents before the offer"] },
      impact: { lead: "Private-bath supply and shared-bath pressure are structural revenue drivers. Because your mix is priced from evidence, the biggest lever in the plan rests on rooms you can show.",
        bullets: ["Two houses with the same bedrooms can earn very different money, and yours is priced", "Work gets booked for what pays, not for what seems worth it", "The forecast can be run with the mix you plan"] }
    },
    reserves: {
      h: "Your Lease-up Reserves Are Your Strongest Asset",
      means: { lead: "Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan.",
        bullets: ["Reserves are sized in months of cost", "A slower lease-up is in the plan", "The deal math runs on your own costs and rooms nearby", "Empty rooms are counted once"] },
      next: { lead: "Keep the cushion honest as the plan changes.",
        bullets: ["Rerun the slower case when rents or supply change", "Keep the reserves apart from the money for the work", "Check the cushion monthly until the rooms are full"] },
      impact: { lead: "A sized cushion makes a slow lease-up part of the plan instead of a surprise.",
        bullets: ["Your plan has room to hold rents while rooms fill, instead of cutting them first", "A lender or partner can see the cushion and what it rests on", "The first six months are planned, month by month"] }
    }
  },

  /* ---------- Low score pages: the area to fix first. Every area 75 or higher: the refinement headline, no urgency ---------- */
  low: {
    rent: {
      h: "Your Rent Evidence Has the Most Room to Grow",
      refinement: "Your Rent Evidence Is Your Next Refinement",
      means: { lead: "Your rent per room is borrowed: a guess, a calculator, a whole-home rent split by bedrooms, or asking rents. Every figure after it inherits the guess.",
        bullets: ["The rent doesn't come from rooms near the house that filled", "Every room may have the same rent, whatever its bath", "Asking rents are counted as rents", "Nobody can say how many rooms the number rests on"] },
      next: { lead: "This week, build a list of ten rooms near the house, by bath type and size.",
        bullets: ["List ten rooms for rent within about 3 miles", "Note each weekly rent, bath type and room size", "Split them by bath type and note the middle rent of each group", "Recheck in two weeks and keep the rooms that filled"] },
      impact: { lead: "Rent is upstream of everything. Fix it and the bath mix, the deal math and the reserves have evidence to work with.",
        bullets: ["A guessed rent inflates the cash flow, the deal math and the offer", "A rent the street supports is the base the rest of the plan needs", "It's fixable this week: the rooms are listed near the house right now"] }
    },
    fill: {
      h: "Your Fill Speed Has the Most Room to Grow",
      refinement: "Your Fill Speed Is Your Next Refinement",
      means: { lead: "You don't know how fast rooms fill near the house, so your lease-up months are a guess. An assumed vacancy rate can't tell you whether filling takes three weeks or three months.",
        bullets: ["Lease-up months are a hope, not a count", "Occupancy is a rule of thumb or an average", "The launch month is whenever the work ends", "A slow lease-up isn't in the plan"] },
      next: { lead: "This week, start a two-week fill watch on rooms like yours.",
        bullets: ["Pick five room listings near the house with the bath types you plan", "Check every few days which ones are still listed", "Note any rent cuts", "After two weeks, set your lease-up months from what filled"] },
      impact: { lead: "Fill speed decides your first months of cash flow. Fix it and your reserves can be sized from evidence.",
        bullets: ["At your numbers, each month lease-up runs long costs at least {cost}", "Your reserves are only as good as the lease-up months behind them", "It's fixable in two weeks of watching rooms near the house"],
        // A bullet whose number is unknown gives way to this one
        bulletNoCount: "Every month lease-up runs long costs the full monthly carrying cost" }
    },
    supply: {
      h: "Your Read on Nearby Supply Has the Most Room to Grow",
      refinement: "Your Read on Nearby Supply Is Your Next Refinement",
      means: { lead: "You don't know how many co-living homes compete near the house, or how full they are. Supply nearby decides how hard your rooms will be to fill and what they can ask.",
        bullets: ["Nobody counted the co-living homes within about 3 miles", "There's no read on how many rooms are open", "New homes and rent cuts nearby go unnoticed", "A crowded pocket can look like a busy one"] },
      next: { lead: "This week, count the competition within about 3 miles.",
        bullets: ["List every co-living home with rooms for rent within about 3 miles", "Note how many rooms each has open", "Note any new homes and rent cuts", "Write down your read, with the date"] },
      impact: { lead: "Supply sets the ceiling on rent and the pace of the fill. Fix it and your rent and lease-up plans rest on the street as it is.",
        bullets: ["Many open rooms nearby mean a lower rent or a slower lease-up", "Few open rooms and steady rents leave room for one more home", "It's fixable in an afternoon of counting"] }
    },
    mix: {
      h: "Your Room Mix Has the Most Room to Grow",
      refinement: "Your Room Mix Is Your Next Refinement",
      means: { lead: "Your bath mix and room count aren't priced from rooms nearby yet. Private-bath and shared-bath rooms rent and fill differently, so the mix is the biggest lever you control.",
        bullets: ["The bath mix isn't decided, or was decided on a hunch", "The house hasn't been priced both ways", "The room count isn't checked against the city's rule", "The garage or extra space isn't priced both ways"] },
      next: { lead: "This week, price the house both ways from rooms nearby.",
        bullets: ["Note the middle weekly rent of private-bath and shared-bath rooms nearby", "Weekly rent × rooms × 4.35 for the house as it is", "The same with one more private bath", "Get a quote before you decide on any work"] },
      impact: { lead: "The room mix multiplies every rent in the plan. Fix it and the work you book is work that pays for itself in rent.",
        bullets: ["Two houses with the same bedrooms can earn very different money", "A bathroom added on a hunch can cost more than it brings in", "It's fixable before the offer, from the rent list you already need"] }
    },
    reserves: {
      h: "Your Lease-up Reserves Have the Most Room to Grow",
      refinement: "Your Lease-up Reserves Are Your Next Refinement",
      means: { lead: "Your reserves and deal math aren't sized for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't.",
        bullets: ["Reserves are a few weeks, or not planned", "The plan for a slow start is cutting rents", "The deal math runs on defaults or estimates", "There's no slower case beside the plan"] },
      next: { lead: "This week, size the cushion from your own numbers.",
        bullets: ["Write down your monthly carrying cost", "Set your lease-up months, and a slower case twice as long", "Multiply: monthly cost × the slower case's months", "Compare it with the cash you'll hold after the down payment and the work"] },
      impact: { lead: "The cushion decides whether a slow start is a plan or a scramble. Fix it and the first six months are planned, month by month.",
        bullets: ["At your numbers, your reserves leave at least {gap} of lease-up costs uncovered", "A room cut to fill faster keeps the lower rent after it fills", "It's fixable before the offer: it's arithmetic on numbers you already have"],
        bulletNoCount: "Every month your reserves don't cover gets paid from somewhere else" }
    },
    // Shown when the rule flag is set (the deepener: the city's rule not confirmed)
    ruleNote: {
      title: "A note on the city's rule",
      body: "You haven't confirmed your city's rule on unrelated adults sharing a home. It decides whether the plan is allowed at all, and it differs by city. Read it in the city code, then confirm it with the city or an attorney. Not legal advice."
    },
    // Kept for the template's shape: the cascade line comes from content/scorecard.mjs cascadeLines
    cascade: "Your {effect} score follows from your {cause} score."
  },

  // Small furniture
  page: "Page {n}",
  footer: "The First Deal Risk Scorecard Report · {first_name}",
  scoreOf: "{score} of 100",
  notRead: "Not read yet"
};
