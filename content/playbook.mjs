// The static playbook every report carries (spec 4, docs/spec/4-report-static-playbook.md): five guides, one per area,
// the 30-day timeline, the five-day quick start, the checklists, the weekly tracker and the final call to action.
// Every step works by hand, without RoomIQ. The rules it keeps: rooms and markets are compared, never people (no
// operator's name, listing text or photo is copied); zoning, financing and insurance go to the city, a lender and an
// insurer; the deal math is informational, not financial or lending advice. Monthly figures use 4.35 weeks a month, as
// RoomIQ prints them.
export default {
  start: {
    title: "Your Room-by-Room Underwrite Starts Here",
    lead: "The first half of this report showed where your plan borrows its numbers. This half is the plan to replace them with evidence, and it's yours to keep whether or not you ever use RoomIQ. It holds a guide for each of the five areas, a 30-day timeline, a five-day quick start, a checklist for each area and a weekly tracker.",
    howTitle: "How to Use This Report",
    how: [
      { b: "Start with the area marked Fix first.", t: "Your weakest area page named it. Read that guide first, even if another area interests you more." },
      { b: "Read the guide's core method.", t: "Each guide has one named method in four phases. Do the phases in order." },
      { b: "Use the quick start this week.", t: "Five short actions, one a day, about two hours in total." },
      { b: "Follow the 30-day timeline.", t: "The two borrowed numbers first, rent and fill, then the competition, the room mix and the reserves." },
      { b: "Track it every Friday.", t: "Fill in the weekly tracker, then take the scorecard again on day 30 and compare." }
    ],
    sectionsHead: ["Section", "What it gives you"],
    sections: [
      ["Rent Evidence guide", "The Ten-Room Rent Check: a rent for each room, from rooms nearby that filled"],
      ["Fill Speed guide", "The Two-Week Fill Watch: lease-up months from rooms you watched fill"],
      ["Nearby Supply guide", "The Three-Mile Count: the competition, how full it is, and what's new"],
      ["Room Mix guide", "The Bath Mix Test: the bathrooms and the room count, priced from rooms nearby"],
      ["Lease-up Reserves guide", "The Slow Lease-up Test: reserves that carry the house through a slow start"],
      ["30-day timeline", "Four weekly phases, the borrowed numbers first"],
      ["Quick start", "Five things to do this week"],
      ["Checklists", "Six checkable actions per area"],
      ["Weekly tracker", "Five ratings and four counts, every Friday"]
    ],
    // Printed beside the guide list: where this investor starts (dynamic)
    yourStart: "Your weakest area is {primary_bottleneck}. Start with its guide."
  },

  guides: {
    rent: {
      title: "Rent Evidence: The Ten-Room Rent Check",
      tagline: "A rent for each room, from rooms near the house that actually filled.",
      withoutHead: "With a Borrowed Rent",
      withHead: "With Rent Evidence",
      compare: [
        ["The rent per room comes from a calculator, a forum post or a whole-home rent split by bedrooms", "Each room's rent comes from rooms nearby with the same bath type and size"],
        ["Every room gets the same rent", "Private-bath and shared-bath rooms, large and small, each get their own rent"],
        ["Asking rents are treated as rents", "Only rooms that actually filled count, and the asking ones are kept apart"],
        ["Nobody can say how many rooms the number rests on", "The rent rests on a list of rooms you can show a partner or a lender"],
        ["A rent the street doesn't support shows up as empty rooms after closing", "A rent the street supports, checked before the offer"]
      ],
      method: "The Ten-Room Rent Check",
      phases: [
        { t: "Pull ten rooms", s: "Start from what rents near the house, not from what a calculator says.", b: ["List at least ten rooms for rent within about 3 miles of the house", "For each, note the weekly rent, the bath type (private or shared) and the room size", "Leave whole-home listings out: you're pricing rooms"] },
        { t: "Split by bath and size", s: "Compare like with like.", b: ["Group the rooms: private or shared bath; large, medium or small", "Note the middle rent of each group, not the highest", "If a group has fewer than three rooms, widen the search and note that you did"] },
        { t: "Keep the rooms that filled", s: "An asking rent is a hope; a filled room is evidence.", b: ["Check your list again after two weeks", "Mark which rooms are gone, and which cut their rent", "Price from the rooms that filled, and treat the rest as the top of the range"] },
        { t: "Set a rent per room", s: "Each room gets the rent its group supports.", b: ["Give each of your rooms the middle rent of its group", "Write down the rooms each rent rests on", "Recheck before the offer, because rents move with the seasons and with new supply"] }
      ],
      mistakes: [
        "Using a platform's earnings estimate as your rent",
        "Dividing a whole-home rent by the number of bedrooms",
        "Pricing every room the same, whatever its bath or size",
        "Counting asking rents as rents",
        "Pricing from the highest rent you found",
        "Using rooms from across the metro instead of near the house",
        "Copying another operator's listing photos or text into your plan"
      ],
      protocol: {
        title: "The Two-Week Recheck",
        frequency: "Once, two weeks after your first list; then again before the offer.",
        format: "Your list of rooms: weekly rent, bath type, size, and whether it's still listed.",
        review: "Which rooms filled, and at what rent? Which cut their rent?",
        classify: "Filled, still open, rent cut, or removed. Price from the filled rooms first."
      }
    },
    fill: {
      title: "Fill Speed: The Two-Week Fill Watch",
      tagline: "Lease-up months from how fast rooms nearby actually fill, not from a vacancy guess.",
      withoutHead: "With an Assumed Fill Time",
      withHead: "With Fill Evidence",
      compare: [
        ["The plan assumes a vacancy rate", "The plan uses how fast comparable rooms near the house filled"],
        ["Lease-up time is a hope: a month, maybe", "Lease-up months come from rooms you watched fill"],
        ["The launch month is whenever the work ends", "The launch is timed to the months rooms nearby fill fastest"],
        ["A metro average stands in for the street", "The street's own rooms set the number"],
        ["A slow lease-up comes as a surprise", "A slow lease-up is in the plan before the offer"]
      ],
      method: "The Two-Week Fill Watch",
      phases: [
        { t: "Pick the rooms to watch", s: "Watch rooms like yours, near the house.", b: ["Choose five to ten room listings within about 3 miles, with the bath types you plan", "Note the date you first saw each one", "Keep the list in one place"] },
        { t: "Check every few days", s: "Fill speed is a count, not an opinion.", b: ["Every few days, note which rooms are still listed", "Note any rent cut", "Keep going for at least two weeks"] },
        { t: "Read the count", s: "How many filled, how fast, and at what rent.", b: ["Count the rooms that filled within two weeks", "Note how long the slowest ones stayed open", "Compare the rooms that filled with the ones that didn't: rent, bath and size"] },
        { t: "Set your lease-up months", s: "From what you saw, plus a slower case.", b: ["Set your plan's lease-up months from the watch", "Add a slower case: the same rooms taking twice as long", "Pick a launch month when rooms nearby fill fastest, if you can"] }
      ],
      mistakes: [
        "Assuming a vacancy rate instead of counting",
        "Using a metro or national average for one street",
        "Watching rooms that don't match yours",
        "Stopping the watch after a few days",
        "Adding a vacancy rate on top of an occupancy that already counts empty rooms",
        "Planning the launch for whenever the work happens to end"
      ],
      protocol: {
        title: "The Fill Watch Log",
        frequency: "Every few days for two weeks, 10 minutes each time.",
        format: "One line per room: the date first seen, the rent, the bath type, still listed or not, any rent cut.",
        review: "After two weeks: how many filled, how fast, and at what rent.",
        classify: "Filled at the asking rent, filled after a cut, still open, or removed."
      }
    },
    supply: {
      title: "Nearby Supply: The Three-Mile Count",
      tagline: "Know the competition before you buy: how many homes, how full, and what's new.",
      withoutHead: "Without a Supply Count",
      withHead: "With a Supply Count",
      compare: [
        ["Nobody counted the coliving homes nearby", "Every coliving home within about 3 miles is on one list"],
        ["A count, with no idea how full those homes are", "Open rooms are noted next to each home"],
        ["New homes opening nearby come as a surprise", "New listings, and homes that stopped listing, are tracked"],
        ["Rent cuts nearby go unnoticed", "Rent cuts are an early warning in the plan"],
        ["A crowded pocket looks like a busy one", "Crowded and busy are told apart before the offer"]
      ],
      method: "The Three-Mile Count",
      phases: [
        { t: "Map the homes", s: "Count every coliving home within about 3 miles.", b: ["List every home with rooms for rent within about 3 miles of the house", "Note each home's room count, if it shows", "Mark them on a simple map"] },
        { t: "Note the open rooms", s: "A count says how many; open rooms say how full.", b: ["Next to each home, note how many rooms are open", "Note the bath types of the open rooms", "Many open shared-bath rooms nearby is a warning for shared-bath rooms of your own"] },
        { t: "Watch what changes", s: "Supply keeps moving after you buy.", b: ["Note new homes that started listing rooms", "Note homes that stopped", "Note rent cuts on comparable rooms"] },
        { t: "Decide what it means", s: "Filling up, or already crowded.", b: ["Few open rooms and steady rents: room for one more home", "Many open rooms and rent cuts: plan a lower rent or a slower lease-up", "Write the read into your plan, with the date"] }
      ],
      mistakes: [
        "Counting listings without noting how full they are",
        "Treating one busy home as the whole street",
        "Missing homes that list rooms only some of the time",
        "Never counting again after the first time",
        "Judging a pocket by its best home instead of its open rooms"
      ],
      protocol: {
        title: "The Monthly Supply Count",
        frequency: "Once a month, 20 minutes.",
        format: "The homes within about 3 miles: rooms open, new or closed listings, rent cuts.",
        review: "Is open supply rising or falling since last month?",
        classify: "New home, closed home, rent cut, or no change."
      }
    },
    mix: {
      title: "Room Mix: The Bath Mix Test",
      tagline: "Price the bathrooms and the room count from the rooms nearby, before any work.",
      withoutHead: "With a Mix Decided on a Hunch",
      withHead: "With a Priced Mix",
      compare: [
        ["The bath mix is decided on a hunch", "The bath mix comes from private and shared-bath rents nearby"],
        ["A bathroom is added because it seems worth it", "The house is priced both ways before the plumber is booked"],
        ["Every bedroom gets rented, whatever the rules say", "The room count fits the city's rule on unrelated adults"],
        ["The garage is converted because more rooms earn more", "The garage is priced both ways: as parking and as a room"],
        ["The biggest lever in the plan is a guess", "The biggest lever in the plan rests on rooms you can show"]
      ],
      method: "The Bath Mix Test",
      phases: [
        { t: "Split the rents", s: "Private and shared bath, from rooms nearby.", b: ["From your rent list, note the middle weekly rent of private-bath rooms and of shared-bath rooms", "Note the difference between them", "Note which group fills faster, from your fill watch"] },
        { t: "Price it both ways", s: "The baths as they are, and with one more private bath.", b: ["Weekly rent × rooms × 4.35 for the house as it is", "The same for the house with one more private bath", "The difference is the monthly revenue the change could add, at full occupancy"] },
        { t: "Check the room count", s: "More rooms is also a rules question.", b: ["Read the city's rule on unrelated adults sharing a home", "Check the room count you plan against it", "Price the garage or extra space both ways, if there is one"] },
        { t: "Weigh it against the cost", s: "Revenue is half the decision.", b: ["Get a quote for the work", "Compare the quote with the monthly difference", "Decide, and write down the rents the decision rests on"] }
      ],
      mistakes: [
        "Adding a bathroom without pricing the difference",
        "Pricing every room the same, whatever its bath",
        "Counting rooms the city's rule may not allow",
        "Converting the garage without pricing it both ways",
        "Comparing extra revenue with no quote for the work"
      ],
      protocol: {
        title: "The Before-Work Check",
        frequency: "Once, before you book any work.",
        format: "Two prices for the house: the baths as they are, and with the change.",
        review: "Does the monthly difference justify the quote?",
        classify: "Worth it, not worth it, or too few rooms nearby to tell."
      }
    },
    reserves: {
      title: "Lease-up Reserves: The Slow Lease-up Test",
      tagline: "Reserves that carry the house through a slow lease-up, sized from evidence.",
      withoutHead: "With a Hopeful Cushion",
      withHead: "With a Sized Cushion",
      compare: [
        ["Reserves are a few weeks, or whatever is left", "Reserves are the monthly cost times the lease-up months, plus a slower case"],
        ["A slow lease-up means cutting rents", "A slow lease-up is already in the plan"],
        ["The deal math runs on a calculator's defaults", "The deal math runs on your own costs and on rooms nearby"],
        ["A vacancy rate is added on top of occupancy", "Empty rooms are counted once"],
        ["The first six months are a hope", "The first six months are planned, month by month"]
      ],
      method: "The Slow Lease-up Test",
      phases: [
        { t: "Know your monthly cost", s: "What the house costs with every room empty.", b: ["Add the loan payment, taxes, insurance, utilities and upkeep", "Write down the monthly total", "This is the number every lease-up plan rests on"] },
        { t: "Set the lease-up months", s: "From your fill watch, not from a hope.", b: ["Take the months your fill watch supports", "Add a slower case: twice as long", "Write both down"] },
        { t: "Size the cushion", s: "The months of cost your reserves must carry.", b: ["Monthly cost × the slower case's months = the reserves to hold", "Compare it with the cash you'll have after the down payment and the work", "If it falls short, change the plan before the offer, not after"] },
        { t: "Run the deal math on evidence", s: "Your own costs, and the rooms nearby.", b: ["Run cash flow on rents and occupancy from comparable rooms, with your own costs", "Don't add a vacancy rate on top of an occupancy that already counts empty rooms", "Keep the slower case beside the base case"] }
      ],
      mistakes: [
        "Sizing reserves in weeks instead of months of cost",
        "Planning to cut rents if lease-up is slow",
        "Running the deal math on a calculator's defaults",
        "Counting empty rooms twice: a vacancy rate on top of observed occupancy",
        "Spending the reserves on the work"
      ],
      protocol: {
        title: "The Monthly Cushion Check",
        frequency: "Once a month until the rooms are full, 15 minutes.",
        format: "Months of reserves left, rooms filled, and the months your slower case allows.",
        review: "Are rooms filling faster or slower than the plan?",
        classify: "On plan, slower than plan, or behind the slower case."
      }
    }
  },
  guideLabels: { method: "The core method: {method}", phase: "Phase {n}: {t}", mistakes: "Common Mistakes to Eliminate", protocol: "Practice Protocol", frequency: "Frequency:", format: "Format:", review: "Review method:", classify: "Classify every result:", fromAnswers: "From your answers" },

  timeline: {
    title: "Your 30-Day Timeline",
    lead: "The two borrowed numbers first, rent and fill, because every other number follows from them. Then the competition, the room mix and the cushion.",
    focus: "Focus:",
    outcome: "By the end:",
    phases: [
      { t: "Phase 1, days 1 to 7: Price each room", focus: "Rent Evidence", area: "rent",
        b: ["List ten rooms within about 3 miles of the house", "Split them by bath type and size", "Start the two-week fill watch on five of them", "Write down your monthly carrying cost", "Note what your current rent number rests on"],
        outcome: "a rent per room you can trace to rooms nearby, and a fill watch running." },
      { t: "Phase 2, days 8 to 14: Count the competition", focus: "Nearby Supply", area: "supply",
        b: ["Count the coliving homes within about 3 miles", "Note the open rooms in each", "Note new homes and rent cuts nearby", "Check your fill watch every few days", "Read the city's rule on unrelated adults"],
        outcome: "the competition on one page, and the city's rule in hand." },
      { t: "Phase 3, days 15 to 21: Time the fill and price the mix", focus: "Fill Speed and Room Mix", area: "fill",
        b: ["Close the fill watch: how many filled, how fast", "Set your lease-up months, and a slower case", "Price the house both ways: the baths as they are, and with one more private bath", "Check the room count against the city's rule", "Pick your launch month"],
        outcome: "lease-up months from evidence, and a bath mix priced from rooms nearby." },
      { t: "Phase 4, days 22 to 30: Size the cushion", focus: "Lease-up Reserves", area: "reserves",
        b: ["Size reserves: monthly cost × the slower case's months", "Run the deal math on your own costs and on rooms nearby", "Talk to a lender who knows coliving", "Get an insurance quote that covers coliving", "Take the scorecard again on day 30"],
        outcome: "a plan where every number rests on evidence, and a second score to compare with the first." }
    ]
  },

  quickStart: {
    title: "Quick Start: 5 Things to Do This Week",
    days: [
      { t: "Day 1: Write Down Your Monthly Cost", m: "20 minutes", body: "Add up what the house will cost each month with every room empty: loan payment, taxes, insurance, utilities and upkeep. Write the total where you'll see it. Every lease-up plan rests on this number." },
      { t: "Day 2: List Ten Rooms Nearby", m: "30 minutes", body: "Find ten rooms for rent within about 3 miles of the house. For each, write the weekly rent, the bath type and the room size. Leave whole-home listings out: you're pricing rooms." },
      { t: "Day 3: Split the Rents", m: "20 minutes", body: "Group your ten rooms by bath type, private or shared, and note the middle rent of each group. The difference is your first read on the bath mix." },
      { t: "Day 4: Count the Competition", m: "30 minutes", body: "Count the coliving homes with rooms listed within about 3 miles of the house, and note how many rooms each has open. One page, with the date." },
      { t: "Day 5: Start the Fill Watch", m: "15 minutes", body: "Pick five of your ten rooms and set a reminder to check them every few days for two weeks. Which ones fill, how fast and at what rent becomes your lease-up plan." }
    ],
    total: "Total time this week: about two hours."
  },

  checklists: {
    title: "Implementation Checklists",
    head: ["Action", "How or where", "Status"],
    rent: [
      ["List ten rooms within about 3 miles", "Room listings, a spreadsheet"],
      ["Note the rent, bath type and size of each", "Your list"],
      ["Split them by bath type and size", "Your list"],
      ["Recheck after two weeks: which ones filled", "Your list"],
      ["Give each of your rooms its own rent", "Your plan"],
      ["Write down the rooms each rent rests on", "Your plan"]
    ],
    fill: [
      ["Pick five to ten rooms to watch", "Room listings near the house"],
      ["Check them every few days for two weeks", "A calendar reminder"],
      ["Count how many filled, and how fast", "Your watch log"],
      ["Set your lease-up months from the watch", "Your plan"],
      ["Add a slower case: twice as long", "Your plan"],
      ["Pick your launch month", "Your plan"]
    ],
    supply: [
      ["List the coliving homes within about 3 miles", "Room listings, a map"],
      ["Note the open rooms in each", "Your list"],
      ["Note new homes and homes that stopped listing", "Once a month"],
      ["Note rent cuts on comparable rooms", "Once a month"],
      ["Write your read: filling up or crowded", "Your plan, with the date"],
      ["Count again before the offer", "Your list"]
    ],
    mix: [
      ["Note private and shared-bath rents nearby", "Your rent list"],
      ["Price the house as it is", "Weekly rent × rooms × 4.35"],
      ["Price it with one more private bath", "Weekly rent × rooms × 4.35"],
      ["Check the room count against the city's rule", "The city code, then the city or an attorney"],
      ["Price the garage both ways, if there is one", "Your plan"],
      ["Get a quote before deciding on any work", "A contractor"]
    ],
    reserves: [
      ["Write down your monthly carrying cost", "Your plan"],
      ["Set lease-up months and a slower case", "Your fill watch"],
      ["Size reserves: cost × the slower case's months", "Your plan"],
      ["Run the deal math on your own costs", "Your spreadsheet, or RoomIQ"],
      ["Count empty rooms once, not twice", "Your deal math"],
      ["Talk to a lender who knows coliving", "Before the offer"]
    ]
  },

  tracker: {
    title: "Weekly Tracking Dashboard",
    lead: "Fill this in every Friday. Rate each area from 1 (a guess) to 5 (evidence you can show), then write the four counts.",
    head: ["Measure", "Week 1", "Week 2", "Week 3", "Week 4", "Target"],
    rows: [
      ["Rent Evidence (1 to 5)", "5"],
      ["Fill Speed (1 to 5)", "5"],
      ["Nearby Supply (1 to 5)", "5"],
      ["Room Mix (1 to 5)", "5"],
      ["Lease-up Reserves (1 to 5)", "5"],
      ["Rooms on your rent list", "10 or more"],
      ["Rooms filled in your watch", "Your count"],
      ["Coliving homes within 3 miles", "Your count"],
      ["Months of reserves", "Your slower case"]
    ],
    // The starting point, printed from this investor's scores (dynamic): the 1 to 5 rating each area's score suggests
    startLabel: "Your starting point",
    commitmentsTitle: "Commitments",
    commitments: [
      "I will price each room from rooms nearby, not from a calculator.",
      "I will count how fast rooms fill before I plan the lease-up.",
      "I will count the competition before I buy.",
      "I will price the bath mix before I book any work.",
      "I will size reserves for a slower lease-up than I hope for."
    ],
    rememberTitle: "Remember",
    remember: [
      "An asking rent is a hope; a filled room is evidence.",
      "Count empty rooms once.",
      "The city's rule comes from the city or an attorney.",
      "Every number in the offer should rest on rooms you can show."
    ]
  },

  next: {
    title: "Your Next Step",
    lead: "This report showed where your plan borrows its numbers, and gave you a 30-day plan to replace them with evidence. The by-hand way works: it takes listings, a spreadsheet and two weeks of watching. RoomIQ shows that evidence for one address in one place.",
    boxTitle: "Run a free forecast on your address",
    boxBody: "Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby. Start where your report says to: {primary_bottleneck}. The estimate prints its formula, its comps and how sure it is, and counts the coliving homes within about 3 miles. Free plan: no card needed, three forecasts a month.",
    fit: {
      rent: "For your Rent Evidence, that means a rent for each room from rooms nearby, by bath type and size.",
      fill: "For your Fill Speed, that means occupancy from comparable rooms nearby, and the months rooms fill fastest.",
      supply: "For your Nearby Supply, that means the coliving homes within about 3 miles, counted and mapped.",
      mix: "For your Room Mix, that means the bath mix you plan, entered in the forecast, because private-bath rooms change the rent.",
      reserves: "For your Lease-up Reserves, that means the estimate carried into cash flow under your own costs, beside your slower case. Informational only, not financial or lending advice.",
      callOnly: "You run more than ten houses, so we'll start with a walkthrough to see what fits."
    },
    pick: "Or book a 20-minute walkthrough on your address:",
    pickLinkText: "pick a time",
    booked: "Your walkthrough is booked: {day}, {window}. We'll email you a video link.",
    master: "Run the free forecast:",
    masterLink: "roomiq.io",
    self: "Rather do it by hand? This playbook is yours to keep."
  }
};
