// The Invisible Work Scorecard: every question, answer, point, weight, branch, tier and rule from Deliverable 1
// (docs/spec/1-assessment-logic.md). Read by the page (the quiz and the score on screen), by the server (it scores
// again, so nothing stored, emailed or sent to Meta trusts the browser) and by the report.
//
// Option keys (v) are what is stored. Change a label freely; never change a key that has data behind it. Q2, Q3, Q4,
// G2 and G4 keep the option keys of the Meta page's Gap Check (RempoLandingPage meta/content/survey.mjs: asks, newest,
// replies, jobs, records), so the GTM gap score (gtm, below) compares with the outbound Gap Report and earlier Meta data.
export default {
  id: "roomiq-first-deal",
  name: "The First Deal Risk Scorecard",
  scoreName: "Visibility Score",
  // The form name each completed scorecard is stored under (and mirrored into the shared leads table, if set up)
  form: "scorecard-roomiq-first-deal",
  deepenerForm: "scorecard-deepener",
  callForm: "scorecard-call",

  /* ---------- The four areas: equal weight, 25% each (Deliverable 1, section 2) ---------- */
  areas: [
    { key: "coverage", name: "Ask Coverage", color: "#2A78D6",
      description: "Measures how many of your finished jobs end with the customer being asked for a Google review." },
    { key: "system", name: "Ask System", color: "#1BAF7A",
      description: "Evaluates whether asking runs on a system, with one follow-up, or depends on someone remembering on a busy day." },
    { key: "freshness", name: "Freshness", color: "#EDA100",
      description: "Checks whether a homeowner looking you up today sees recent proof of your work, on Google and on your website." },
    { key: "replies", name: "Replies", color: "#6250D6",
      description: "Assesses how quickly and how personally your shop answers the reviews customers leave, including the hard ones." }
  ],

  // Ties for the bottleneck go upstream first (section 12, step 1). Ties for the strongest area go in report order
  // (Deliverable 3, high score pages).
  tieOrder: ["coverage", "system", "replies", "freshness"],
  strongOrder: ["coverage", "system", "freshness", "replies"],
  // Each answer is worth 0 to 4 points, times its question's weight (3x hero, 2x or 1x deepener)
  maxPoints: 4,
  // Every area at or above this is "all strong": no bottleneck, the verdict is Maintenance (section 12, step 6)
  strongAt: 75,

  /* ---------- The hero: ten steps, about a minute (sections 5 to 9). Contact is always last. ---------- */
  steps: [
    {
      id: "G1", key: "trade", kind: "gateway", type: "choice", layout: "grid",
      q: "What's your trade?",
      options: [
        { v: "hvac", label: "HVAC", service: "HVAC" },
        { v: "plumbing", label: "Plumbing", service: "plumbing" },
        { v: "both", label: "HVAC and plumbing", service: "HVAC and plumbing" },
        { v: "other", label: "Another home service", service: "home services" }
      ]
    },
    {
      id: "G2", key: "jobs", kind: "gateway", type: "choice", layout: "grid",
      q: "About how many jobs do you finish in a typical week?",
      options: [
        { v: "lt5", label: "Fewer than 5" },
        { v: "5to15", label: "5 to 15" },
        { v: "16to40", label: "16 to 40" },
        { v: "over40", label: "More than 40" },
        { v: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "Q1", key: "asked10", kind: "scored", type: "choice", area: "coverage", weight: 3, layout: "grid",
      q: "Think of your last 10 finished jobs. How many of those customers were asked for a Google review?",
      options: [
        { v: "all", label: "All 10", points: 4 },
        { v: "7to9", label: "7 to 9", points: 3 },
        { v: "4to6", label: "4 to 6", points: 2 },
        { v: "1to3", label: "1 to 3", points: 1 },
        { v: "none", label: "None", points: 0 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    },
    {
      id: "Q2", key: "asks", kind: "scored", type: "choice", area: "system", weight: 3,
      q: "How do customers get asked for a Google review today?",
      options: [
        { v: "tool", label: "A review tool sends a request after every job, plus a reminder", points: 4 },
        { v: "software", label: "Our job software sends a request when the job closes", points: 3 },
        { v: "techs", label: "Our techs ask in person at the end of the job", points: 2 },
        { v: "remember", label: "Someone sends the link when they remember", points: 1 },
        { v: "none", label: "We don't really ask", points: 0 }
      ]
    },
    {
      id: "Q3", key: "newest", kind: "scored", type: "choice", area: "freshness", weight: 3,
      q: "When did your most recent Google review come in?",
      options: [
        { v: "week", label: "This week", points: 4 },
        { v: "month", label: "Earlier this month", points: 3 },
        { v: "1to3", label: "1 to 3 months ago", points: 2 },
        { v: "over3", label: "More than 3 months ago", points: 1 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    },
    {
      id: "Q4", key: "replies", kind: "scored", type: "choice", area: "replies", weight: 3,
      q: "How often do you reply to your Google reviews?",
      options: [
        { v: "all", label: "Every review, within two days", points: 4 },
        { v: "most", label: "Most of them", points: 3 },
        { v: "some", label: "Some of them", points: 2 },
        { v: "rarely", label: "Rarely", points: 1 },
        { v: "never", label: "Never", points: 0 }
      ]
    },
    {
      id: "G3", key: "ticket", kind: "gateway", type: "choice", layout: "grid",
      q: "What's a typical ticket for one of your jobs?",
      options: [
        { v: "lt300", label: "Under $300" },
        { v: "300to750", label: "$300 to $750" },
        { v: "750to2000", label: "$750 to $2,000" },
        { v: "over2000", label: "More than $2,000" },
        { v: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "G4", key: "records", kind: "gateway", type: "choice",
      q: "Where are your finished jobs recorded?",
      options: [
        { v: "fieldsoftware", label: "Job software built for the trades" },
        { v: "crm", label: "Another CRM or booking system with customer phone or email" },
        { v: "paper", label: "Paper or spreadsheets" },
        { v: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "S9", key: "business", kind: "fields", type: "fields",
      q: "Which business should we look up?",
      fields: [
        { name: "company", label: "Business name", help: "As it shows on Google.", autocomplete: "organization", required: true, max: 120 },
        { name: "city", label: "City or town", help: "Where your customers search for you.", autocomplete: "address-level2", required: true, max: 80 }
      ],
      choice: {
        key: "profiles", label: "How many Google profiles (locations) do you have?",
        options: [
          { v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3to9", label: "3 to 9" }, { v: "10plus", label: "10 or more" }
        ]
      }
    },
    {
      id: "S10", key: "contact", kind: "fields", type: "fields", last: true,
      q: "Where should we send your report?",
      fields: [
        { name: "firstName", label: "First name", autocomplete: "given-name", required: true, max: 60 },
        { name: "email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", required: true, max: 254 }
      ],
      consent: { name: "consentEmail", label: "Email me my score and my report, and the occasional tip. Unsubscribe any time.", required: true },
      button: "See my score"
    }
  ],

  /* ---------- The report deepener: eight optional questions, two per area (sections 6 to 9) ---------- */
  deepener: [
    {
      id: "D1", key: "d1", area: "coverage", weight: 2,
      q: "When customers do get asked, who usually gets asked?",
      hideIf: { asked10: ["all"] },
      options: [
        { v: "every", label: "Every customer with a phone or email", points: 4 },
        { v: "most", label: "Most customers, except on busy days", points: 3 },
        { v: "happy", label: "Customers who seemed happy with the job", points: 1 },
        { v: "remember", label: "Whoever someone remembers", points: 1 },
        { v: "hardly", label: "Hardly anyone", points: 0 }
      ]
    },
    {
      id: "D2", key: "d2", area: "coverage", weight: 1,
      q: "How many of your job records have the customer's mobile number or email?",
      options: [
        { v: "every", label: "Every job", points: 4 },
        { v: "most", label: "Most jobs", points: 3 },
        { v: "half", label: "About half", points: 2 },
        { v: "few", label: "Only a few", points: 1 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    },
    {
      id: "D3", key: "d3", area: "system", weight: 2,
      q: "If a customer doesn't leave a review after the first request, what happens next?",
      hideIf: { asks: ["none"] },
      options: [
        { v: "one", label: "One reminder a few days later, then we stop", points: 4 },
        { v: "several", label: "Several reminders until they leave one", points: 2 },
        { v: "resend", label: "Someone re-sends it if they remember", points: 1 },
        { v: "nothing", label: "Nothing, or not sure", points: 0 }
      ]
    },
    {
      id: "D4", key: "d4", area: "system", weight: 1,
      q: "If the person who handles reviews is out for two weeks, what happens to asking?",
      hideIf: { asks: ["none"] },
      options: [
        { v: "runs", label: "It keeps running without them", points: 4 },
        { v: "covers", label: "Someone else covers it", points: 3 },
        { v: "slows", label: "It slows down", points: 1 },
        { v: "stops", label: "It stops", points: 0 }
      ]
    },
    {
      id: "D5", key: "d5", area: "freshness", weight: 2,
      q: "In your busiest weeks, does asking keep up with the jobs?",
      options: [
        { v: "yes", label: "Yes, every job is still asked", points: 4 },
        { v: "mostly", label: "Mostly", points: 3 },
        { v: "drops", label: "It drops off when we're slammed", points: 1 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    },
    {
      id: "D6", key: "d6", area: "freshness", weight: 1,
      q: "Does your website show your recent Google reviews?",
      options: [
        { v: "current", label: "Yes, recent ones, and they stay current", points: 4 },
        { v: "manual", label: "Yes, but someone updates them by hand", points: 2 },
        { v: "no", label: "No", points: 1 },
        { v: "nosite", label: "We don't have a website", points: 1 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    },
    {
      id: "D7", key: "d7", area: "replies", weight: 2,
      q: "When a 1, 2 or 3-star review posts, when do you usually find out?",
      options: [
        { v: "sameday", label: "The same day", points: 4 },
        { v: "week", label: "Within a week", points: 2 },
        { v: "mention", label: "When a customer or someone on the team mentions it", points: 1 },
        { v: "later", label: "Much later, or not sure", points: 0 }
      ]
    },
    {
      id: "D8", key: "d8", area: "replies", weight: 1,
      q: "When you do reply, how are replies written?",
      hideIf: { replies: ["never"] },
      options: [
        { v: "personal", label: "Each one written for what the customer said", points: 4 },
        { v: "standard", label: "We reuse a few standard replies", points: 2 },
        { v: "badonly", label: "We only reply to the bad ones", points: 1 },
        { v: "unsure", label: "Not sure", points: 0 }
      ]
    }
  ],

  /* ---------- Tiers: the Visibility Score, higher is better (section 11; Deliverable 3, score display labels) ---------- */
  tiers: [
    { key: "secret", n: 1, min: 0, max: 29, name: "The Best-Kept Secret", descriptor: "Great work, almost none of it on Google.",
      trait: "Great work, almost none of it on Google. Asking runs on memory or not at all", tone: "Urgent, never shaming" },
    { key: "somedays", n: 2, min: 30, max: 54, name: "The Some-Days Shop", descriptor: "Asked on good days, quiet on busy ones.",
      trait: "Customers get asked on good days, not busy ones; replies wait for a free minute", tone: "Concerned" },
    { key: "nearly", n: 3, min: 55, max: 74, name: "The Nearly Visible Shop", descriptor: "A good habit with one or two clear gaps.",
      trait: "The habit is there; one or two clear gaps remain", tone: "Encouraging" },
    { key: "openbook", n: 4, min: 75, max: 100, name: "The Open Book", descriptor: "Almost every job shows on Google.",
      trait: "Almost every job shows; the work is keeping it that way", tone: "Affirming" }
  ],

  // The area cards' three variants (Deliverable 2): on screen each area is 0, 25, 50, 75 or 100, so 0 and 25 show Low,
  // 50 shows Medium, and 75 and 100 show High
  bands: [
    { key: "low", min: 0, max: 39 },
    { key: "medium", min: 40, max: 69 },
    { key: "high", min: 70, max: 100 }
  ],

  /* ---------- The invisible work calculation (section 4): the owner's own answers, the low end of every range ---------- */
  invisible: {
    weeks: 50,
    // Jobs and ticket use the low end of each band, asked the high end, so the figures always understate
    jobs: { lt5: 2, "5to15": 5, "16to40": 16, over40: 41, unsure: null },
    asked: { all: 10, "7to9": 9, "4to6": 6, "1to3": 3, none: 0, unsure: null },
    ticket: { lt300: 150, "300to750": 300, "750to2000": 750, over2000: 2000, unsure: null },
    // "Not sure" on the ticket: the Angi average job value, labelled as an average. No dollar figure for another home service
    averageTicket: { hvac: 350, both: 350, plumbing: 338, other: null },
    averageSource: "Angi"
  },

  /* ---------- Urgency (section 11): how many customers the gap touches ---------- */
  urgency: {
    // The area urgency reads (Ask Coverage) and the metric's count it compares (invisibleOf: unasked customers a year)
    area: "coverage",
    countField: "unasked",
    critical: 500,          // 500 or more unasked customers a year, or the count is unknown and Ask Coverage is 25 or lower
    criticalCoverage: 25,
    significant: 150,       // 150 to 499
    moderateCoverage: 75,   // Ask Coverage 75 or higher is always moderate
    // Not covered by the spec: the count is unknown and Ask Coverage is between 26 and 74. Worth fixing this month.
    unknownDefault: "significant",
    words: {
      critical: "This is the first thing to fix, this month.",
      significant: "Worth fixing this month.",
      moderate: "A refinement, when you have a week."
    }
  },

  /* ---------- The fix-first line on screen and in the score email (Deliverable 2) ---------- */
  bottleneckLines: {
    coverage: "Most of your finished jobs end without anyone asking. One request after every job closes most of the gap.",
    system: "Asking depends on someone remembering, so it stops when you're busiest. Send it when the job closes instead.",
    systemSoftware: "Requests go out, but nobody runs them. Add one reminder and check the numbers weekly.",
    freshness: "Your newest reviews are older than homeowners look for. It follows from asking every week, busy or slow.",
    replies: "Homeowners can't see you answer. Reply to every review within two days, each in your own words.",
    none: "Nothing urgent. Your report shows how to keep it running."
  },
  // Line variants: when Ask System is the bottleneck and Q2 says requests already go out, the line becomes "Requests go
  // out, but nobody runs them" (lib/scoring.mjs bottleneckLineKey)
  lineVariants: [{ area: "system", key: "systemSoftware", when: { asks: ["software", "tool"] } }],
  // The cascade (section 12): Freshness is a symptom of asking, so while Ask Coverage or Ask System is under strongAt,
  // the lower of those is fixed first and Freshness is reported as its effect
  cascade: { effect: "freshness", causes: ["coverage", "system"] },
  // The segment question that names the service in the copy ("HVAC in Austin"), and the words when it has none
  segmentKey: "trade",
  // How the admin, the analytics, the CSV and the team's notice name the cost-of-inaction metric (the results page and
  // the report word it in content/results.mjs and content/report.mjs): name is the money figure (lib/scoring.mjs
  // invisibleOf's workValue), count the count's unit (its unasked), lead what one lead is (one shop, many shops).
  metric: { name: "Invisible work", count: "unasked customers a year", lead: ["shop", "shops"] },
  // The answers the admin's "Who takes it" breakdown groups leads by (question ids), with their headings
  segments: [{ field: "trade", label: "Trade" }, { field: "jobs", label: "Jobs a week" }, { field: "ticket", label: "Typical ticket" }],
  defaultService: "home services",
  // The verdict line for the call notes (section 12, worked example): "Your biggest gap is your {area}: {why}. {urgency}"
  verdict: {
    coverage: "most of your finished jobs end without anyone asking for a review",
    system: "asking depends on someone remembering, and it stops when you're busiest",
    systemSoftware: "requests go out, but nobody runs them",
    freshness: "your newest reviews are older than homeowners look for",
    replies: "homeowners can't see you answer",
    maintenance: "Every area is 75 or higher. Your work shows; a weekly five-minute check keeps it that way."
  },
  cascadeLine: "Your Freshness score is low because of your {cause} score.",

  /* ---------- Quick wins (section 12): one specific behaviour per weak answer ---------- */
  // question key -> answer -> the report's wording. Answers the spec's table leaves out but that score 0 on a 3x or 2x
  // question use the nearest behaviour, so a weak answer is never silently dropped: Q1 "Not sure" (count it this week),
  // D1 "Hardly anyone" (tie it to the job), D5 "Not sure" (keep asking in busy weeks). Marked "(nearest)".
  quickWins: {
    asked10: {
      "1to3": "Send one request after every finished job this week, the same way for everyone, and count jobs against requests on Friday",
      none: "Send one request after every finished job this week, the same way for everyone, and count jobs against requests on Friday",
      unsure: "Send one request after every finished job this week, the same way for everyone, and count jobs against requests on Friday" // (nearest)
    },
    d1: {
      happy: "Ask every customer the same way; asking only the happy ones breaks Google's review policy",
      remember: "Tie the request to the moment the job is marked complete, not to anyone's memory",
      hardly: "Tie the request to the moment the job is marked complete, not to anyone's memory" // (nearest)
    },
    d2: {
      half: "Capture a mobile number or email at booking",
      few: "Capture a mobile number or email at booking"
    },
    asks: {
      remember: "Move the ask out of memory: send it when the job closes in your software",
      none: "Move the ask out of memory: send it when the job closes in your software",
      techs: "Keep the in-person thanks, and follow it with a text or email that has your review link"
    },
    d3: {
      nothing: "Add one reminder three to five days later, then stop",
      resend: "Add one reminder three to five days later, then stop"
    },
    newest: {
      over3: "Look up your own profile tonight, note the date of your newest review, and check it every Friday",
      unsure: "Look up your own profile tonight, note the date of your newest review, and check it every Friday"
    },
    d5: {
      drops: "Keep sending requests in your busiest weeks; that is when you have the most customers to ask",
      unsure: "Keep sending requests in your busiest weeks; that is when you have the most customers to ask" // (nearest)
    },
    replies: {
      rarely: "Reply to your five most recent reviews this week, each in your own words",
      never: "Reply to your five most recent reviews this week, each in your own words"
    },
    d7: {
      week: "Turn on review notifications on your Google Business Profile so a hard review reaches you the day it posts",
      mention: "Turn on review notifications on your Google Business Profile so a hard review reaches you the day it posts",
      later: "Turn on review notifications on your Google Business Profile so a hard review reaches you the day it posts"
    },
    d8: {
      standard: "Retire the template: write two sentences that answer what each customer actually said"
    }
  },
  quickWinCount: 3,
  // The rule flag (section 12, step 4): D1 = "Customers who seemed happy" puts this first, whatever the area scores
  ruleFlag: { key: "d1", v: "happy" },
  // All strong (every area 75 or higher): the quick wins become checks, one from each of the lowest areas
  checks: {
    coverage: "Every Friday, compare jobs closed with requests sent; the two numbers should match",
    system: "Once a month, close a test job with your own phone number and confirm the request arrives",
    freshness: "Note the date of your newest review every Friday",
    replies: "Keep review notifications on, and read every new review the day it posts"
  },

  /* ---------- Notes: lines the answers add to the report and to the call (sections 6 to 10) ---------- */
  notes: {
    // On the report (the area's card on the overview page and its guide in the playbook)
    report: {
      d3: { several: { area: "system", text: "One reminder, then stop: more can feel like pressure, and anyone can reply STOP." } },
      d8: { standard: { area: "replies", text: "50% of consumers are put off by generic or templated replies (BrightLocal 2026)." } }
    },
    // For the team before the call (the admin's call notes)
    call: {
      jobs: { lt5: "Under the 5-jobs-a-week floor: Meta was not told about this lead." },
      ticket: { "750to2000": "Ticket $750 to $2,000: a higher-value account.", over2000: "Ticket over $2,000: a higher-value account." },
      records: {
        paper: "Jobs on paper or spreadsheets: call only, no checkout link; offer the Jumpstart.",
        unsure: "Not sure where jobs are recorded: check the connection on the call before any monthly charge."
      },
      profiles: { "3to9": "3 to 9 Google profiles: call only (Local Authority).", "10plus": "10 or more Google profiles: call only (Local Authority)." },
      d1: { happy: "Asks only customers who seemed happy: explain that Google's review policy needs the same request for everyone." },
      d2: { half: "Only about half of job records have a mobile number or email.", few: "Only a few job records have a mobile number or email." },
      d6: { nosite: "No website: the website is a later service." }
    }
  },

  /* ---------- Fit: decides only what Meta is told (pixel conditioning). Everyone gets the score, report and call ---------- */
  fit: [
    { key: "under-floor", when: { jobs: ["lt5"] } },
    { key: "no-software", when: { records: ["paper"] } }
  ],
  qualifiedFit: "qualified",
  // Routing: a call with no checkout link (section 10)
  callOnly: { records: ["paper"], profiles: ["3to9", "10plus"] },

  /* ---------- The GTM gap score, kept in the background (section 3, compatibility). Higher means a bigger gap. Never shown ---------- */
  gtm: {
    asks: { none: 25, remember: 20, techs: 15, software: 8, tool: 3 },
    newest: { week: 0, month: 6, "1to3": 14, over3: 20, unsure: 12 },
    replies: { all: 0, most: 4, some: 8, rarely: 12, never: 15 },
    jobs: { lt5: 3, "5to15": 8, "16to40": 12, over40: 15, unsure: 8 },
    // The old "compare with the top three" question is no longer asked: filled from the report, "unchecked" until then
    compare: { ahead: 0, even: 8, behind: 18, far: 25, unchecked: 15 }
  }
};
