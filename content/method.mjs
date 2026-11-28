// The Room-by-Room Underwrite: the report's RoomIQ pages (spec 5, docs/spec/5-method.md). The report shows the outcome
// an evidence-first underwrite works toward, the five steps that get there (the scorecard's five areas, in causal
// order), where this investor stands on each step from their own answers, the two ways to run the method (by hand, with
// the 30-day plan, or with RoomIQ's Free plan), and the first 30 days with RoomIQ. lib/report-model.mjs fills it from the
// answers; lib/report-html.mjs draws it.
//
// The product lines name only what the product shows on screen (GTM-BRIEF.md Section 3, features marked Seen or Partly
// seen), in the GTM's write-instead wording (Section 5): no accuracy, income or return claims, and the deal math is
// "informational only, not financial or lending advice". No price, trial or term: the next step is the Free plan.
export default {
  // The note at the front. The admin's Settings can replace the body with the team's own letter; a lead's page can add
  // a personal note under it
  letter: {
    title: "A note before you read",
    body: [
      "Thank you for taking the First Deal Risk Scorecard, {first_name}. Everything in this report comes from your own answers.",
      "Read the page on {primary_bottleneck} first: it's where your plan borrows the most.",
      "The Room-by-Room Underwrite in the middle of this report is how borrowed numbers become evidence. Run it by hand with the 30-day plan, or with RoomIQ's Free plan."
    ],
    profileClause: "",
    noteTitle: "For you, {first_name}",
    signoff: "The RoomIQ team",
    signed: "{name}, RoomIQ",
    signedTitle: "{name}, {title}, RoomIQ",
    kicker: "Before you start",
    contentsTitle: "In this report",
    contents: {
      invisible: "Your First Six Months: your lease-up gap, from your own numbers",
      checks: "Three Checks RoomIQ Can't Do for You: zoning, financing and insurance",
      overall: "Your Overall Score: your five areas, and what they mean",
      areas: "Your strongest and weakest areas, with what to do this week",
      method: "The Room-by-Room Underwrite: five steps, and where you stand on each",
      service: "Two ways to run it, and your first 30 days with RoomIQ",
      playbook: "The 30-day plan: a guide for each area, checklists and a weekly tracker",
      next: "Your next step"
    }
  },

  // Nothing waits on a person in this funnel (site.enrichment false): kept for the template's shape, never shown
  coming: {
    title: "Coming next",
    body: "Nothing in this report waits on our team: everything in it comes from your answers."
  },

  overview: {
    // The overview page's last two sentences, built for the pages this report carries
    nextTop3: "Next come your Deal Readiness Score, your first six months and three checks RoomIQ can't do for you.",
    nextNoTop3: "Next come your Deal Readiness Score, your first six months and three checks RoomIQ can't do for you.",
    then: "Then {items}.",
    items: {
      areas: "your strongest and weakest areas",
      method: "the Room-by-Room Underwrite that closes the gaps",
      service: "how to run it with RoomIQ's Free plan",
      playbook: "a 30-day plan you can run by hand"
    }
  },

  intro: {
    kicker: "The Room-by-Room Underwrite",
    h1: "What an evidence-first underwrite looks like",
    lead: "A first deal goes wrong at the numbers nobody checked. The Room-by-Room Underwrite checks them in order, from the rent per room to the cushion, so every number in the offer rests on evidence you can check.",
    // The template's outcome box: left out here (the lead says it), so the five steps and the recheck fit one page
    outcomeTitle: null,
    outcome: null,
    stepsTitle: "Five steps, in this order",
    chain: "The order matters. The rent and the fill time are the numbers every other one rests on. The competition sets how hard rooms are to fill. The room mix is priced from rents and fill, and the cushion is sized from all of them.",
    rhythmTitle: "And one recheck before the offer",
    rhythm: "Rents, fill speed and supply move with the seasons and with new homes. Recheck them the week you make the offer.",
    todayLabel: "Your plan today",
    startHere: "Start here"
  },

  steps: {
    rent: {
      n: 1, t: "Price each room",
      standard: "A rent for each room from rooms nearby with the same bath type and size, kept to the rooms that actually filled.",
      service: "RoomIQ shows rent and occupancy split by bath type and size for comparable properties, and a revenue estimate for the address with its comps."
    },
    fill: {
      n: 2, t: "Time the fill",
      standard: "Lease-up months from how fast comparable rooms nearby filled, with a slower case, and a launch month timed to the seasons.",
      service: "RoomIQ shows observed occupancy over 7, 30 and 90-day windows for comparable properties, and when occupancy and fill speed peak in the market."
    },
    supply: {
      n: 3, t: "Count the competition",
      standard: "Every coliving home within about 3 miles counted, with its open rooms, new listings and rent cuts.",
      service: "RoomIQ counts and maps active coliving properties within about 3 miles of any address, with listing status on its supply map."
    },
    mix: {
      n: 4, t: "Price the bath mix",
      standard: "The bath mix and the room count priced from private and shared-bath rooms nearby, and checked against the city's rule.",
      service: "RoomIQ's forecast takes the room mix you plan, private-bath rooms included, and prints the formula behind the estimate."
    },
    reserves: {
      n: 5, t: "Size the cushion",
      standard: "Reserves sized from the lease-up months the evidence supports, plus a slower case, with the deal math run on your own costs.",
      service: "RoomIQ carries the estimate into cash flow, cash-on-cash, DSCR and cap rate under your own assumptions. Informational only, not financial or lending advice."
    }
  },

  // "Where you stand on each step": today, from the answers (each answer's own sentence), next to the method's standard
  // and what RoomIQ shows. Only the questions the investor answered show
  gap: {
    kicker: "The Room-by-Room Underwrite",
    h1: "Where your plan stands on each step",
    lead: "Each step below starts from your own answers, then shows the method's standard and what RoomIQ shows for it.",
    step: "Step {n}: {t}",
    columns: { today: "Today, from your answers", standard: "The method's standard", service: "What RoomIQ shows" },
    chips: { fix: "Fix first", low: "Gap", medium: "Partly there", high: "In place" },
    fromProfile: "From outside data",
    today: {
      rentsource: {
        none: "You don't have a rent per room yet.",
        calculator: "Your rent per room comes from a platform's earnings calculator.",
        divide: "Your rent per room is a whole-home rent divided by bedrooms.",
        listings: "Your rent comes from asking rents on room listings.",
        comps: "Your rent comes from comps of nearby rooms, with how fast they filled."
      },
      rentperroom: {
        notyet: "You don't have a rent for each room yet.",
        same: "Every room has the same rent.",
        split: "You have a rough split between private and shared-bath rooms.",
        perroom: "Each room has its own rent, from nearby rooms with the same bath type and size."
      },
      rentcomps: {
        none: "You weren't sure how many nearby rooms your rent rests on.",
        few: "Your rent rests on 1 or 2 nearby rooms.",
        some: "Your rent rests on 3 to 9 nearby rooms.",
        many: "Your rent rests on 10 or more nearby rooms."
      },
      fillsource: {
        none: "You haven't looked at how fast rooms fill nearby.",
        vacancy: "Your plan assumes a vacancy percentage.",
        stories: "Your sense of fill speed comes from host stories and forum posts.",
        reports: "Your sense of fill speed comes from a platform's market reports.",
        observed: "Your fill speed comes from observed fill times of comparable rooms nearby."
      },
      occsource: {
        none: "Your plan has no occupancy figure yet.",
        rule: "Your occupancy figure is a rule of thumb.",
        average: "Your occupancy figure is a platform's market average.",
        observed: "Your occupancy figure comes from comparable rooms nearby."
      },
      launch: {
        notyet: "You haven't picked a launch month.",
        whenever: "You'll start renting whenever the work is done.",
        heard: "You plan to launch in a season you've heard is busy.",
        timed: "You plan to launch when rooms nearby fill fastest."
      },
      supply: {
        none: "You don't know how many coliving homes compete nearby.",
        some: "You think some coliving homes compete nearby.",
        counted: "You counted the coliving listings nearby.",
        known: "You know how many coliving homes compete nearby, and roughly how full they are."
      },
      newsupply: {
        none: "You don't know whether new coliving homes opened nearby.",
        think: "You think a few new coliving homes opened nearby.",
        checked: "You checked the current coliving listings nearby.",
        track: "You track the homes that open and close nearby."
      },
      pricedrops: {
        unsure: "You don't know whether rooms nearby cut their rents.",
        heard: "You've heard that rooms nearby cut their rents.",
        seen: "You've seen a few rooms nearby cut their rents.",
        checked: "You've checked recent price drops on comparable rooms."
      },
      bathmix: {
        notyet: "You haven't decided the bath mix.",
        keep: "You're keeping the current bathrooms.",
        adding: "You're adding a bathroom because it seems worth it.",
        modeled: "You modeled private against shared-bath rents nearby."
      },
      roomcount: {
        notyet: "You haven't decided how many rooms to rent.",
        max: "You plan to rent as many rooms as the house can fit.",
        current: "You plan to rent the current bedroom count.",
        checked: "Your room count is a layout checked against rents nearby."
      },
      sizemix: {
        none: "You haven't checked which room sizes rent best nearby.",
        assume: "You assume bigger rooms rent better.",
        seen: "You've seen a few listings by room size.",
        compared: "You compared rents and fill speed by room size nearby."
      },
      slowplan: {
        none: "You haven't planned for a slow lease-up.",
        lower: "If lease-up is slow, you'd lower rents.",
        weeks: "You have a few weeks of reserves for a slow lease-up.",
        sized: "Your reserves are sized from how comparable launches nearby filled."
      },
      dealmath: {
        none: "You haven't run the deal math yet.",
        defaults: "Your deal math uses a calculator's default settings.",
        mine: "Your deal math uses your own estimates.",
        evidence: "Your deal math uses rents and occupancy of comparable rooms, with your own costs."
      },
      stress: {
        no: "Your deal math doesn't test a slower lease-up.",
        vacancy: "Your deal math adds a vacancy rate on top.",
        onecase: "Your deal math tests one slower case.",
        comps: "Your deal math tests the lease-up against how comparable launches filled."
      }
    },
    // Outside data (none in this funnel)
    profile: {}
  },

  // "Two ways to run the method": by hand with the playbook, or with RoomIQ's Free plan
  ways: {
    kicker: "The Room-by-Room Underwrite",
    h1: "Two ways to run the method",
    lead: "The method works the same either way. The difference is where the evidence comes from: listings you track by hand, or RoomIQ's observed rooms.",
    self: {
      title: "Run it by hand",
      body: "The 30-day plan in this report is the method, step by step, and it's yours to keep.",
      bullets: [
        "A list of ten rooms near the house, by bath type and size",
        "A two-week fill watch on five of them",
        "A count of the coliving homes within about 3 miles",
        "Your own deal math, with a slower case"
      ],
      note: null
    },
    service: {
      title: "Run it with RoomIQ",
      body: "The same five steps for one address, in one place, with the evidence behind each number shown.",
      startTitle: "Starting takes one address",
      start: [
        { t: "Pick your market.", b: "The Free plan covers one main market." },
        { t: "Type the address.", b: "Add the bedrooms, the baths and which rooms get a private bath." },
        { t: "Run the forecast.", b: "Read the formula, the comps and the confidence label." },
        { t: "Carry it into the deal math.", b: "Cash flow, cash-on-cash, DSCR and cap rate under your own costs. Informational only." }
      ],
      listTitle: "What you see",
      list: [
        "Monthly room revenue for the address, with the formula printed",
        "Support and confidence labels, and how far away the comps are",
        "Rent and occupancy by bath type and size for comparable properties",
        "Active coliving properties within about 3 miles, mapped",
        "When occupancy and fill speed peak in the market"
      ]
    },
    wontTitle: "What RoomIQ doesn't do",
    wont: [
      { t: "No zoning check.", b: "Rules on unrelated adults differ by city: ask the city or an attorney." },
      { t: "No financing or insurance.", b: "Talk early to a lender and an insurer who know coliving." },
      { t: "No promises.", b: "An estimate shows its working; it doesn't guarantee rent or occupancy." }
    ],
    rules: "Based on observed rents and occupancy, not collected payments. Thin evidence is labeled Thin."
  },

  // "Your first 30 days with RoomIQ": the method, week by week, on the Free plan
  days: {
    kicker: "The Room-by-Room Underwrite",
    h1: "Your first 30 days with RoomIQ",
    lead: "Here is the method, week by week, with RoomIQ's Free plan.",
    phases: [
      { t: "Week 1: the forecast on your address", b: "Run the free forecast on the house. Read the formula under the number, the support and confidence labels, and how far away the comps sit." },
      { t: "Week 2: the rooms nearby", b: "Open comparable properties in the Property Analyzer: rent and occupancy by bath type and size, and their 7, 30 and 90-day windows." },
      { t: "Week 3: the competition and the seasons", b: "Check the coliving properties within about 3 miles on the map, and when occupancy and fill speed peak, before you pick a launch month." },
      { t: "Week 4: the mix and the math", b: "Re-run the forecast with the room mix you plan, carry it into cash flow under your own costs, size the cushion, then decide." }
    ],
    yourStart: "For your plan, we'd start with {primary_bottleneck}. {fit_line}",
    locations: "",
    paper: "You run more than ten houses, so the first step is a walkthrough to see what fits.",
    monthlyTitle: "What the Free plan includes",
    monthly: "One main market, 90 days of history, 5 Property Analyzer opens and 3 revenue estimates a month, with no card needed.",
    cta: "Want to go through it together first? Book a 20-minute walkthrough on your address:",
    ctaLinkText: "pick a time",
    ctaBooked: "Your walkthrough is booked: {day}, {window}. We'll go through this plan on your address then."
  }
};
