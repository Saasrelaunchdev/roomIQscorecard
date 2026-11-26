// The First Deal Risk Scorecard: every question, answer, point, weight, branch, tier and rule from spec 1
// (docs/spec/1-assessment-logic.md). Read by the page (the quiz and the score on screen), by the server (it scores
// again, so nothing stored, emailed or sent to Meta trusts the browser) and by the report.
//
// Option keys (v) are what is stored. Change a label freely; never change a key that has data behind it. The five
// scored questions keep the GTM's Deal Readiness wording and points (deliverables/scorecard_spec.docx, questions 1, 2,
// 3, 4 and 7), in its order, lowest points first.
export default {
  id: "roomiq-first-deal",
  name: "The First Deal Risk Scorecard",
  scoreName: "Deal Readiness Score",
  // The form name each completed scorecard is stored under (and mirrored into the shared leads table, if set up)
  form: "scorecard-roomiq-first-deal",
  deepenerForm: "scorecard-roomiq-first-deal-deepener",
  callForm: "scorecard-roomiq-first-deal-walkthrough",

  /* ---------- The five areas: equal weight, 20% each, in causal order (spec 1, section 2) ---------- */
  // Colors: the landing page's own (brand blue, buyer green, market orange, money pink) and a violet; checked with
  // tools/brand/palette.mjs (normal and color-blind distance, lightness, chroma, 3:1 on white)
  areas: [
    { key: "rent", name: "Rent Evidence", color: "#0077B6",
      description: "Checks whether your rent per room comes from rooms nearby, by bath type and size, or from a calculator, a whole-home rent or a guess." },
    { key: "fill", name: "Fill Speed", color: "#129E7B",
      description: "Measures whether your fill time and occupancy come from how comparable rooms nearby actually filled, or from an assumed vacancy rate." },
    { key: "supply", name: "Nearby Supply", color: "#E0662F",
      description: "Checks whether you know how many co-living homes compete within about 3 miles, how full they are, and what's new." },
    { key: "mix", name: "Room Mix", color: "#6250D6",
      description: "Assesses whether your bath mix and room count were priced from private and shared-bath rooms nearby, or decided on a hunch." },
    { key: "reserves", name: "Lease-up Reserves", color: "#D6457F",
      description: "Evaluates whether your reserves and deal math are sized for a slow lease-up, from how comparable launches nearby filled." }
  ],

  // Ties for the bottleneck go upstream first; ties for the strongest area go in the same order (spec 1, section 9)
  tieOrder: ["rent", "fill", "supply", "mix", "reserves"],
  strongOrder: ["rent", "fill", "supply", "mix", "reserves"],
  // Each answer is worth 0 to 4 points, times its question's weight (3x main quiz, 2x or 1x deepener)
  maxPoints: 4,
  // Every area at or above this is "all strong": no bottleneck, the verdict is maintenance
  strongAt: 75,

  /* ---------- The main quiz: eleven steps, about a minute (spec 1, sections 5 and 6). Contact is always last ---------- */
  steps: [
    {
      id: "G1", key: "stage", kind: "gateway", type: "choice", layout: "grid",
      q: "Where are you with rent-by-the-room?",
      options: [
        { v: "learning", label: "Learning, no house yet", service: "first deal" },
        { v: "looking", label: "Looking at houses", service: "first deal" },
        { v: "contract", label: "Under contract", service: "first deal" },
        { v: "own", label: "Converting my house", service: "first deal" },
        { v: "operator", label: "I run 1 to 10 houses", service: "next deal" },
        { v: "scaling", label: "More than 10 houses", service: "next deal" }
      ]
    },
    {
      // Typed, not tapped (the owner's decision of 2026-11-26). The answer is still one of the options below: the preset
      // metro the typed words name (lib/scoring.mjs placeOf, by its aliases; a state that doesn't match rules a metro
      // out), else "undecided" when the words say no market is chosen yet (undecidedWords, whole words), else "other".
      // The chip answers "undecided". The words are kept, units, house numbers, streets and ZIP codes removed
      // (lib/scoring.mjs cleanPlace), as answers.marketText, and as the lead's city outside the presets
      id: "G2", key: "market", kind: "gateway", type: "text",
      q: "Where is the house, or the market you're looking at?",
      help: "Just the city or metro, not the street address.",
      placeholder: "For example, Phoenix",
      textKey: "marketText", otherKey: "other", undecided: "undecided", max: 60,
      undecidedWords: ["not sure", "unsure", "dont know", "don t know", "do not know", "idk", "dunno", "no idea", "no clue", "undecided",
        "not decided", "havent decided", "haven t decided", "deciding", "not yet", "tbd", "unknown", "none", "n a", "na", "anywhere",
        "everywhere", "nowhere", "any", "open", "flexible", "usa", "united states", "nationwide"],
      options: [
        { v: "dfw", label: "Dallas-Fort Worth", state: "tx", aliases: ["dallas", "fort worth", "ft worth", "dfw", "plano", "irving", "garland", "frisco", "mckinney", "denton", "grand prairie", "mesquite", "carrollton", "richardson", "lewisville", "flower mound", "mansfield", "keller", "grapevine", "southlake", "rowlett", "rockwall", "prosper", "wylie", "euless", "coppell", "arlington tx", "allen tx"] },
        { v: "houston", label: "Houston", state: "tx", aliases: ["houston", "htx", "katy", "sugar land", "pearland", "the woodlands", "woodlands", "humble", "baytown", "league city", "conroe", "missouri city", "friendswood", "tomball", "kingwood", "atascocita", "galveston", "rosenberg", "bellaire", "deer park", "spring tx", "cypress tx", "pasadena tx", "richmond tx"] },
        { v: "atlanta", label: "Atlanta", state: "ga", aliases: ["atlanta", "atl", "marietta", "sandy springs", "alpharetta", "kennesaw", "lawrenceville", "peachtree city", "peachtree corners", "east point", "stone mountain", "dunwoody", "johns creek", "snellville", "conyers", "douglasville", "stockbridge", "mcdonough", "tucker", "norcross", "suwanee", "buford", "cumming", "acworth", "lilburn", "smyrna ga", "roswell ga", "decatur ga", "duluth ga", "college park ga"] },
        { v: "orlando", label: "Orlando", state: "fl", aliases: ["orlando", "kissimmee", "winter park", "winter garden", "altamonte springs", "apopka", "oviedo", "ocoee", "clermont", "lake mary", "windermere", "celebration", "longwood", "casselberry", "maitland", "winter springs", "lake nona", "sanford fl", "st cloud fl", "saint cloud fl"] },
        { v: "jacksonville", label: "Jacksonville", state: "fl", aliases: ["jacksonville", "jax", "orange park", "ponte vedra", "fernandina beach", "jacksonville beach", "neptune beach", "fleming island", "middleburg", "yulee", "st augustine", "saint augustine", "atlantic beach fl"] },
        { v: "phoenix", label: "Phoenix", state: "az", aliases: ["phoenix", "phx", "mesa", "scottsdale", "tempe", "chandler", "gilbert", "goodyear", "avondale", "buckeye", "queen creek", "maricopa", "apache junction", "fountain hills", "cave creek", "sun city", "paradise valley", "laveen", "litchfield park", "tolleson", "el mirage", "ahwatukee", "glendale az", "peoria az", "surprise az"] },
        { v: "lasvegas", label: "Las Vegas", state: "nv", aliases: ["las vegas", "vegas", "north las vegas", "summerlin", "boulder city", "sunrise manor", "henderson nv", "spring valley nv", "enterprise nv", "paradise nv"] },
        { v: "other", label: "Another US market" },
        { v: "undecided", label: "Not decided yet" }
      ]
    },
    {
      id: "Q1", key: "rentsource", kind: "scored", type: "choice", area: "rent", weight: 3,
      q: "Where does your per-room rent number come from?",
      options: [
        { v: "none", label: "I don't have one yet", points: 0 },
        { v: "calculator", label: "A platform's earnings calculator", points: 1 },
        { v: "divide", label: "Whole-home rent divided by bedrooms", points: 1 },
        { v: "listings", label: "Asking rents I found on room listings", points: 2 },
        { v: "comps", label: "Comps of nearby rooms, with how fast they filled", points: 4 }
      ]
    },
    {
      id: "Q2", key: "fillsource", kind: "scored", type: "choice", area: "fill", weight: 3,
      q: "How do you know how fast rooms fill near the property?",
      options: [
        { v: "none", label: "I haven't looked", points: 0 },
        { v: "vacancy", label: "I assume a vacancy percentage", points: 1 },
        { v: "stories", label: "Host stories and forum posts", points: 2 },
        { v: "reports", label: "A platform's market reports", points: 2 },
        { v: "observed", label: "Observed fill times of comparable rooms nearby", points: 4 }
      ]
    },
    {
      id: "Q3", key: "supply", kind: "scored", type: "choice", area: "supply", weight: 3,
      q: "How many co-living homes compete within about 3 miles?",
      options: [
        { v: "none", label: "No idea", points: 0 },
        { v: "some", label: "Some, I think", points: 1 },
        { v: "counted", label: "I counted listings", points: 2 },
        { v: "known", label: "I know the count and roughly how full they are", points: 4 }
      ]
    },
    {
      id: "Q4", key: "bathmix", kind: "scored", type: "choice", area: "mix", weight: 3,
      q: "Have you decided the bath mix?",
      options: [
        { v: "notyet", label: "Not yet", points: 0 },
        { v: "keep", label: "Keeping the current bathrooms", points: 1 },
        { v: "adding", label: "Adding a bathroom because it seems worth it", points: 2 },
        { v: "modeled", label: "Modeled private against shared-bath rents nearby", points: 4 }
      ]
    },
    {
      id: "Q5", key: "slowplan", kind: "scored", type: "choice", area: "reserves", weight: 3,
      q: "What happens if lease-up takes longer than planned?",
      options: [
        { v: "none", label: "I haven't planned for it", points: 0 },
        { v: "lower", label: "I'd lower rents", points: 1 },
        { v: "weeks", label: "A few weeks of reserves", points: 2 },
        { v: "sized", label: "Reserves sized from how comparable launches nearby filled", points: 4 }
      ]
    },
    {
      id: "G3", key: "carry", kind: "gateway", type: "scale", unsure: "unsure", format: "{label} a month",
      q: "About what will the house cost you each month before rent comes in?",
      help: "Loan payment, taxes, insurance and utilities, with every room empty. A range is fine.",
      options: [
        { v: "lt2k", label: "Under $2,000" },
        { v: "2to3k", label: "$2,000 to $3,000" },
        { v: "3to4k", label: "$3,000 to $4,000" },
        { v: "over4k", label: "More than $4,000" },
        { v: "unsure", label: "Not sure yet" }
      ]
    },
    {
      id: "G4", key: "fillmonths", kind: "gateway", type: "scale", unsure: "unsure",
      q: "How long do you expect the rooms to take to fill?",
      help: "Counted from the day rooms are ready to rent.",
      options: [
        { v: "m1", label: "About a month" },
        { v: "m2", label: "About 2 months" },
        { v: "m3", label: "About 3 months" },
        { v: "m4", label: "4 months or more" },
        { v: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "G5", key: "reserves", kind: "gateway", type: "scale", unsure: "unsure",
      q: "If no rent came in, how many months of costs could your reserves carry?",
      help: "Cash set aside for this house, after the down payment and the work.",
      options: [
        { v: "none", label: "None set aside yet" },
        { v: "m1", label: "1 month or less" },
        { v: "m3", label: "2 to 3 months" },
        { v: "m5", label: "4 to 5 months" },
        { v: "m6", label: "6 months or more" },
        { v: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "S11", key: "contact", kind: "fields", type: "fields", last: true,
      q: "Where should we send your report?",
      fields: [
        { name: "firstName", label: "First name", autocomplete: "given-name", required: true, max: 60 },
        { name: "email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", required: true, max: 254 }
      ],
      consent: { name: "consentEmail", label: "Email me my score, my report and the occasional underwriting tip. Unsubscribe any time.", required: true },
      button: "See my score"
    }
  ],

  /* ---------- The report deepener: ten scored questions, two per area, and the unscored checklist (spec 1, section 6) ---------- */
  deepener: [
    {
      id: "D1", key: "rentperroom", area: "rent", weight: 2,
      q: "Do you have a rent for each room, by bath type?",
      hideIf: { rentsource: ["none"] },
      options: [
        { v: "notyet", label: "Not yet", points: 0 },
        { v: "same", label: "One rent for every room", points: 1 },
        { v: "split", label: "A rough split, private and shared bath", points: 2 },
        { v: "perroom", label: "A rent per room, from nearby rooms with the same bath type and size", points: 4 }
      ]
    },
    {
      id: "D2", key: "rentcomps", area: "rent", weight: 1,
      q: "How many nearby rooms is your rent number based on?",
      hideIf: { rentsource: ["none"] },
      options: [
        { v: "none", label: "None, or not sure", points: 0 },
        { v: "few", label: "1 or 2", points: 1 },
        { v: "some", label: "3 to 9", points: 2 },
        { v: "many", label: "10 or more", points: 4 }
      ]
    },
    {
      id: "D3", key: "occsource", area: "fill", weight: 2,
      q: "Where does your plan's occupancy figure come from?",
      options: [
        { v: "none", label: "I haven't set one", points: 0 },
        { v: "rule", label: "A rule of thumb", points: 1 },
        { v: "average", label: "A platform's market average", points: 2 },
        { v: "observed", label: "Observed occupancy of comparable rooms nearby", points: 4 }
      ]
    },
    {
      id: "D4", key: "launch", area: "fill", weight: 1,
      q: "Have you picked the month to start renting rooms?",
      options: [
        { v: "notyet", label: "Not yet", points: 0 },
        { v: "whenever", label: "Whenever the work is done", points: 1 },
        { v: "heard", label: "A season I've heard is busy", points: 2 },
        { v: "timed", label: "When rooms nearby fill fastest", points: 4 }
      ]
    },
    {
      id: "D5", key: "newsupply", area: "supply", weight: 2,
      q: "Do you know whether new co-living homes opened nearby this year?",
      options: [
        { v: "none", label: "No idea", points: 0 },
        { v: "think", label: "I think a few did", points: 1 },
        { v: "checked", label: "I checked the current listings", points: 2 },
        { v: "track", label: "I track homes that open and close nearby", points: 4 }
      ]
    },
    {
      id: "D6", key: "pricedrops", area: "supply", weight: 1,
      q: "Have rooms near the house been cutting their rents?",
      options: [
        { v: "unsure", label: "I don't know", points: 0 },
        { v: "heard", label: "I've heard so", points: 1 },
        { v: "seen", label: "I've seen a few drop", points: 2 },
        { v: "checked", label: "I've checked recent price drops on comparable rooms", points: 4 }
      ]
    },
    {
      id: "D7", key: "roomcount", area: "mix", weight: 2,
      q: "How did you decide how many rooms to rent?",
      options: [
        { v: "notyet", label: "Not decided yet", points: 0 },
        { v: "max", label: "As many as the house can fit", points: 1 },
        { v: "current", label: "The current bedroom count", points: 2 },
        { v: "checked", label: "A layout checked against rents nearby", points: 4 }
      ]
    },
    {
      id: "D8", key: "sizemix", area: "mix", weight: 1,
      q: "Have you checked which room sizes rent best nearby?",
      options: [
        { v: "none", label: "Not yet", points: 0 },
        { v: "assume", label: "I assume bigger rooms rent better", points: 1 },
        { v: "seen", label: "I've seen a few listings", points: 2 },
        { v: "compared", label: "I compared rents and fill speed by room size nearby", points: 4 }
      ]
    },
    {
      id: "D9", key: "dealmath", area: "reserves", weight: 2,
      q: "Where do the numbers in your deal math come from?",
      options: [
        { v: "none", label: "I haven't run the numbers yet", points: 0 },
        { v: "defaults", label: "A calculator's default settings", points: 1 },
        { v: "mine", label: "My own estimates", points: 2 },
        { v: "evidence", label: "Rents and occupancy of comparable rooms, with my own costs", points: 4 }
      ]
    },
    {
      id: "D10", key: "stress", area: "reserves", weight: 1,
      q: "Does your deal math test a slower lease-up?",
      options: [
        { v: "no", label: "No", points: 0 },
        { v: "vacancy", label: "I add a vacancy rate on top", points: 1 },
        { v: "onecase", label: "I test one slower case", points: 2 },
        { v: "comps", label: "I test it against how comparable launches nearby filled", points: 4 }
      ]
    }
  ],

  /* ---------- The checklist: I1's unscored zoning and financing checks (spec 1, section 6.6) ---------- */
  // Asked on the deepener page after its scored questions (lib/scoring.mjs deepenerAll). No area, no points: they feed
  // the report's "Three checks RoomIQ can't do for you" page, the rule flag and the call notes
  checklist: [
    {
      id: "C1", key: "zoning", kind: "checklist",
      q: "Have you checked the city's rule on unrelated adults sharing a home?",
      options: [
        { v: "notyet", label: "Not yet" },
        { v: "asked", label: "I asked around" },
        { v: "summary", label: "I read a summary online" },
        { v: "code", label: "I checked the city code" },
        { v: "confirmed", label: "I confirmed with the city or an attorney" }
      ]
    },
    {
      id: "C2", key: "financing", kind: "checklist",
      q: "How will you finance the house?",
      options: [
        { v: "unsure", label: "Not sure yet" },
        { v: "wholehome", label: "A loan sized on whole-home rent" },
        { v: "cash", label: "Cash" },
        { v: "roomlender", label: "A lender who works with room rentals, briefed on room income" }
      ]
    }
  ],

  /* ---------- Tiers: the Deal Readiness Score, higher is better (spec 1, section 8; the GTM's Results_Tiers) ---------- */
  tiers: [
    { key: "beginner", n: 1, min: 0, max: 39, name: "Beginner: underwriting on assumptions", descriptor: "Your numbers lean on estimates more than evidence.",
      trait: "The rent and the fill time are borrowed numbers; each one can be checked before an offer", tone: "Direct, never shaming" },
    { key: "intermediate", n: 2, min: 40, max: 69, name: "Intermediate: partial evidence", descriptor: "You have part of the picture.",
      trait: "Some numbers rest on evidence; the gaps left decide whether rooms fill", tone: "Encouraging" },
    { key: "advanced", n: 3, min: 70, max: 100, name: "Advanced: evidence-ready", descriptor: "You underwrite like an operator.",
      trait: "The plan rests on evidence; the open question is whether it holds for this address", tone: "Affirming" }
  ],

  // The area cards' three variants: on screen each area is 0, 25, 50 or 100, so 0 and 25 show Low, 50 Medium, 100 High
  bands: [
    { key: "low", min: 0, max: 39 },
    { key: "medium", min: 40, max: 69 },
    { key: "high", min: 70, max: 100 }
  ],

  /* ---------- The lease-up gap (spec 1, section 4): the buyer's own answers, kept at their smallest honest value ---------- */
  // Read only by lib/scoring.mjs invisibleOf (the template's name for the metric hook). Costs use the low end of each
  // range ("Under $2,000" is half the cap), lease-up months the low end, reserves the high end: the gap always understates
  invisible: {
    horizon: 6, // the strip's months: "Would your first deal survive its first six months?"
    cost: { lt2k: 1000, "2to3k": 2000, "3to4k": 3000, over4k: 4000, unsure: null },
    fill: { m1: 1, m2: 2, m3: 3, m4: 4, unsure: null },
    reserves: { none: 0, m1: 1, m3: 3, m5: 5, m6: 6, unsure: null }
  },

  /* ---------- Urgency (spec 1, section 8): from the uncovered months, else from Rent Evidence ---------- */
  urgency: {
    area: "rent",
    countField: "unasked",   // invisibleOf's uncovered months
    countFirst: true,        // the count decides first; the area only when the count is 0 or unknown
    zeroUsesArea: true,
    critical: 2,             // 2 or more uncovered months
    significant: 1,          // 1 uncovered month
    criticalAt: 25,          // no gap or unknown: Rent Evidence at 25 or lower is critical
    moderateAt: 75,          // no gap or unknown: Rent Evidence at 75 or higher is moderate
    unknownDefault: "significant",
    words: {
      critical: "This is the first thing to fix, before you make an offer.",
      significant: "Worth fixing before you make an offer.",
      moderate: "A refinement, while you compare houses."
    }
  },

  /* ---------- The fix-first line on screen and in the score email (spec 1, section 6) ---------- */
  bottleneckLines: {
    rent: "Your rent number is a guess. Check what rooms near the house rent for, by bath type, and how much evidence stands behind it.",
    rentCalculator: "A platform's earnings calculator is an estimate, not the rooms near your house. Check those rooms, by bath type, before you trust it.",
    rentDivide: "Whole-home rent divided by bedrooms isn't a room rent. Check what rooms near the house rent for, by bath type.",
    fill: "You don't know how fast rooms fill nearby, and your first months of cash flow depend on it.",
    fillVacancy: "An assumed vacancy rate isn't fill speed. Check how fast comparable rooms near the house actually filled.",
    supply: "Supply nearby decides how hard your rooms will be to fill. Count it before you buy.",
    mix: "Bath mix is a structural revenue driver. Compare private and shared-bath rents nearby before you build.",
    reserves: "Lease-up can stall. Size reserves from how comparable launches nearby actually filled.",
    none: "Every number rests on evidence. Your report shows how to check it holds for this address."
  },
  // Sharper lines for two answers (lib/scoring.mjs bottleneckLineKey)
  lineVariants: [
    { area: "rent", key: "rentCalculator", when: { rentsource: ["calculator"] } },
    { area: "rent", key: "rentDivide", when: { rentsource: ["divide"] } },
    { area: "fill", key: "fillVacancy", when: { fillsource: ["vacancy"] } }
  ],
  // The cascade (spec 1, section 9): Room Mix and Lease-up Reserves follow from the two borrowed numbers. While Rent
  // Evidence or Fill Speed is under strongAt, a weakest Room Mix or Reserves is never fixed first: the lower of the two
  // causes is, and the effect is reported as its effect
  // cascade is the template's one effect; cascadeAlso adds the second (lib/scoring.mjs bottleneckOf reads both)
  cascade: { effect: "mix", causes: ["rent", "fill"] },
  cascadeAlso: [{ effect: "reserves", causes: ["rent", "fill"] }],
  cascadeLines: {
    mix: "Your Room Mix score follows from your {cause} score: a bath mix is priced from what rooms rent for and how fast they fill, by bath type.",
    reserves: "Your Lease-up Reserves score follows from your {cause} score: reserves can only be sized once you know what rooms rent for and how fast they fill."
  },
  // The segment question that sets the words: "first deal" or "next deal"
  segmentKey: "stage",
  // How the admin, the analytics, the CSV and the team's notice name the metric: name is the money figure
  // (invisibleOf's workValue, the gap), count the count's unit (its unasked, the uncovered months)
  metric: { name: "Lease-up gap", count: "uncovered months", lead: ["investor", "investors"] },
  // The answers the admin's "Who takes it" breakdown groups leads by, with their headings
  segments: [{ field: "stage", label: "Where they are" }, { field: "market", label: "Market" }, { field: "carry", label: "Monthly cost" }],
  defaultService: "next deal",
  // The verdict line for the call notes: "Your biggest gap is your {area}: {why}. {urgency}"
  verdict: {
    rent: "your rent per room is a borrowed number, not rooms nearby",
    rentCalculator: "your rent comes from a platform's calculator, not the rooms near the house",
    rentDivide: "your rent is a whole-home rent split by bedrooms",
    fill: "you don't know how fast rooms fill near the house",
    fillVacancy: "your plan assumes a vacancy rate instead of how fast rooms nearby fill",
    supply: "you don't know how many co-living homes compete within about 3 miles",
    mix: "your bath mix isn't priced from the rooms nearby",
    reserves: "your reserves aren't sized for a slow lease-up",
    maintenance: "Every area is 75 or higher. Your plan rests on evidence; check that it holds for this address."
  },

  /* ---------- Quick wins (spec 1, section 6): one specific thing to do this week, without RoomIQ, per weak answer ---------- */
  quickWins: {
    rentsource: {
      none: "List 10 room listings within about 3 miles of the house, with each weekly rent and bath type",
      calculator: "Check the calculator's figure against 10 room listings within about 3 miles, by bath type",
      divide: "Replace whole-home rent divided by bedrooms with 10 room listings nearby, private and shared bath kept apart",
      listings: "Check your listings again in two weeks and keep only the rooms that filled"
    },
    rentperroom: {
      notyet: "Give each room its own rent, from rooms nearby with the same bath type and size",
      same: "Give each room its own rent, from rooms nearby with the same bath type and size",
      split: "Split your rents by room size as well as bath type"
    },
    rentcomps: {
      none: "Base each room's rent on at least 5 rooms nearby, not 1 or 2",
      few: "Base each room's rent on at least 5 rooms nearby, not 1 or 2"
    },
    fillsource: {
      none: "Pick 5 room listings near the house and check every few days for two weeks which ones fill",
      vacancy: "Swap the assumed vacancy rate for a count: of 5 room listings nearby, how many fill within two weeks",
      stories: "Check the stories against 5 room listings near the house: note which fill within two weeks",
      reports: "Check the report's market figure against 5 listings near the house, because a metro average can hide a slow street"
    },
    occsource: {
      none: "Replace the rule of thumb with what rooms nearby show: how many are full right now",
      rule: "Replace the rule of thumb with what rooms nearby show: how many are full right now",
      average: "Check the market average against the rooms near the house"
    },
    launch: {
      notyet: "Pick your launch month: find when rooms near the house fill fastest, and finish the work before it",
      whenever: "Pick your launch month: find when rooms near the house fill fastest, and finish the work before it"
    },
    supply: {
      none: "Count the co-living homes with rooms listed within about 3 miles of the house",
      some: "Count the co-living homes with rooms listed within about 3 miles of the house",
      counted: "Next to each home you counted, note how many of its rooms are open right now"
    },
    newsupply: {
      none: "Look up which co-living homes near the house started listing rooms this year",
      think: "Look up which co-living homes near the house started listing rooms this year"
    },
    pricedrops: {
      unsure: "Check whether rooms near the house cut their rents in the last few months",
      heard: "Check whether rooms near the house cut their rents in the last few months"
    },
    bathmix: {
      notyet: "Write down the weekly rents of 5 private-bath and 5 shared-bath rooms nearby, and the difference",
      keep: "Price the house both ways: the baths as they are, and with one more private bath",
      adding: "Before you book a plumber, compare private and shared-bath rents nearby"
    },
    roomcount: {
      notyet: "Check the room count against rents nearby and against the city's rule on unrelated adults",
      max: "Check the room count against rents nearby and against the city's rule on unrelated adults"
    },
    sizemix: {
      none: "Group your nearby rooms by size too, large, medium and small, with the rent and fill speed of each",
      assume: "Group your nearby rooms by size too, large, medium and small, with the rent and fill speed of each"
    },
    slowplan: {
      none: "Multiply your monthly carrying cost by the months you expect lease-up to take, and compare it with your reserves",
      lower: "Write down the lowest rent per room at which the house still covers its monthly costs",
      weeks: "Turn a few weeks into a number: monthly carrying cost times the months a slow lease-up could take"
    },
    dealmath: {
      none: "Run your deal math on your own costs and on room rents from nearby rooms, not a calculator's defaults",
      defaults: "Run your deal math on your own costs and on room rents from nearby rooms, not a calculator's defaults"
    },
    stress: {
      no: "Add one slower case to your deal math: the same rents, with lease-up taking twice as long",
      vacancy: "Drop the extra vacancy rate if your occupancy already comes from rooms nearby, because it counts empty rooms twice"
    },
  },
  quickWinCount: 3,
  // The template's rule flag (a deepener answer that puts its quick win first): not used here. RoomIQ's flag is on the
  // checklist (checklistFlag, below)
  ruleFlag: null,
  // The checklist's flag (spec 1, section 6.6): an unconfirmed check of the city's rule puts this quick win first,
  // whatever the area scores, and adds the note on the city's rule to the weakest area's page
  checklistFlag: {
    key: "zoning",
    v: ["notyet", "asked", "summary"],
    text: "Read your city's rule on unrelated adults sharing a home, then confirm it with the city or an attorney"
  },
  // All strong (every area 75 or higher): the quick wins become checks, one from each of the lowest areas
  checks: {
    rent: "Once a month, recheck five rooms near the house: rent, bath type and whether they filled",
    fill: "Every two weeks, note which of five room listings nearby have filled",
    supply: "Once a month, count the co-living homes within about 3 miles and note any new ones",
    mix: "Before any work, price the house both ways: the baths as they are, and with one more private bath",
    reserves: "When rents or supply nearby change, rerun your slower lease-up case"
  },

  /* ---------- Notes: lines the answers add to the report and to the call (spec 1, section 10) ---------- */
  notes: {
    report: {
      stress: { vacancy: { area: "reserves", text: "A vacancy rate on top of an occupancy figure that already counts empty rooms counts them twice." } },
      roomcount: { max: { area: "mix", text: "More rooms is also a zoning question: cities cap how many unrelated adults may share a home." } }
    },
    call: {
      stage: {
        learning: "Learning, no house in mind yet: nurture, not sales.",
        contract: "House under contract: time-sensitive. Offer the walkthrough this week.",
        own: "Owns the house and plans to convert it.",
        operator: "Already rents rooms in 1 to 10 houses: a founding cohort candidate.",
        scaling: "Runs more than 10 houses: call only, an Operator plan conversation."
      },
      market: {
        other: "Outside the preset metros: no free forecast offered; check coverage first.",
        undecided: "No market yet: the market ranking is the next step."
      },
      carry: { unsure: "Doesn't know the monthly carrying cost yet." },
      reserves: { none: "No reserves set aside yet." },
      zoning: { notyet: "Hasn't checked the city's rule on unrelated adults." },
      financing: {
        wholehome: "Financing on whole-home rent: the loan may not count room income.",
        unsure: "No financing plan yet."
      },
      stress: { vacancy: "Adds a vacancy rate on top of observed occupancy: a possible double count." }
    }
  },

  /* ---------- Markets (spec 1, section 10): where the free forecast is offered ---------- */
  // Covered markets: the seven preset metros until the weekly coverage check publishes its list (docs/DECISIONS.md 9)
  markets: {
    covered: ["dfw", "houston", "atlanta", "orlando", "jacksonville", "phoenix", "lasvegas"]
  },

  /* ---------- Fit: stored with the lead, and the condition for Meta's Schedule event. Everyone gets the score, report and walkthrough ---------- */
  fit: [
    { key: "learning", when: { stage: ["learning"] } },
    { key: "outside", when: { market: ["other", "undecided"] } }
  ],
  qualifiedFit: "qualified",
  // Routing: the walkthrough first, no free-forecast push
  callOnly: { stage: ["scaling"] },

  // The template's outbound gap score (compatibility with an earlier Meta survey): not used by RoomIQ
  gtm: null
};
