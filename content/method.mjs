// The Visible Work Method: the report's Rempo pages (the owner's request of 2026-11-22). The report shows the outcome a
// fully visible shop works toward, the four steps that get there (the scorecard's four areas, in the order that fixes
// causes first), where this shop stands on each step from its own answers, the two ways to run the method (yourself,
// with the 30-day plan, or with Rempo's team), and the first 30 days with Rempo. lib/report-model.mjs fills it from the
// answers; lib/report-html.mjs draws it. The service lines are the landing page's own (RempoLandingPage
// meta/content/copy.json) and Deliverable 1's "Rempo features that close the gap". The claim rules apply here too
// (tools/copy-lint.mjs): the method describes what the shop does and what Rempo's team runs, never a number of reviews
// or a ranking, and no price or term while the offer is undecided.
export default {
  // The note on the overview page. The admin's Settings can replace the body with the team's own letter; a lead's
  // page can add a personal note under it.
  letter: {
    title: "A note before you read",
    body: [
      "Thank you for taking the Invisible Work Scorecard, {first_name}. Everything in this report comes from your answers{profile_clause}.",
      "Read the page on {primary_bottleneck} first: it is where the next homeowner loses sight of your work.",
      "The Visible Work Method in the middle of this report is how those gaps close. Run it yourself with the 30-day plan, or let our team run it for you."
    ],
    profileClause: " and your public Google profile",
    noteTitle: "For {business}",
    signoff: "The Rempo team",
    signed: "{name}, Rempo",
    signedTitle: "{name}, {title}, Rempo",
    kicker: "Before you start",
    contentsTitle: "In this report",
    contents: {
      invisible: "Your Invisible Work: the customers who never get asked, and what that work is worth",
      top3: "Next to the Top Three: your public profile, measure by measure",
      top3Coming: "Next to the Top Three: added within one business day",
      overall: "Your Overall Score: your four areas, and what they mean",
      areas: "Your strongest and weakest areas, with what to do this week",
      method: "The Visible Work Method: four steps, and where you stand on each",
      service: "Two ways to run it, and your first 30 days with Rempo",
      playbook: "The 30-day plan: a guide for each area, checklists and a weekly tracker",
      next: "Your next step"
    }
  },

  // When the report goes out right after the quiz (site.reportDelivery "instant"): what the team adds next
  coming: {
    title: "Coming within one business day",
    body: "Someone on our team will read your public Google profile next to the three shops a homeowner sees first for {service} in {city}. Then we'll email you this report again, with that comparison added."
  },

  overview: {
    // The overview page's last two sentences, built for the pages this report carries (lib/report-model.mjs): what
    // comes next, then the rest in order ("Then a, b, and c.")
    nextTop3: "Next come your Visibility Score, the work that never reaches Google, and how you compare with the top three near you.",
    nextNoTop3: "Next come your Visibility Score and the work that never reaches Google.",
    then: "Then {items}.",
    items: {
      areas: "your strongest and weakest areas",
      method: "the Visible Work Method that closes the gaps",
      service: "how Rempo would run it for you",
      playbook: "a 30-day plan you can run yourself"
    }
  },

  intro: {
    kicker: "The Visible Work Method",
    h1: "What a fully visible shop does",
    lead: "Keeping your work visible on Google isn't more marketing. It is one habit, run the same way every week, busy or slow, with someone who checks it.",
    outcomeTitle: "The outcome",
    outcome: "Every customer you finish a job for gets the same chance to vouch for you on Google, and every review gets an answer. A homeowner who looks you up sees an owner who asks everyone and answers everyone.",
    stepsTitle: "Four steps, in this order",
    chain: "The order matters. Asking decides how many customers get the chance. Steady asking decides how recent your reviews look. Replies decide how the next homeowner reads them. Fix the first weak link before the next.",
    rhythmTitle: "And one monthly count",
    rhythm: "Requests sent, reviews in, replies posted. What gets counted keeps running, and a slip shows within a month instead of a season.",
    todayLabel: "Your shop today",
    startHere: "Start here"
  },

  steps: {
    coverage: {
      n: 1, t: "Ask every job",
      standard: "One request after every finished job with a phone or email, the same honest request for every customer.",
      service: "A request after every completed job, from the job software you already use. Our team does the setup, and every customer gets the same request."
    },
    system: {
      n: 2, t: "Run it without remembering",
      standard: "The request goes out when the job closes, with one reminder a few days later, then it stops. Someone checks the numbers every week.",
      service: "Requests go out when a job closes, run by our team, with one reminder, then we stop. Every request shows in your monthly report."
    },
    freshness: {
      n: 3, t: "Keep it steady",
      standard: "Requests go out every week you work, busy season included, and your website shows your newest Google reviews.",
      service: "Requests every week you work, watched by our team, and your recent Google reviews shown on your website."
    },
    replies: {
      n: 4, t: "Answer every review",
      standard: "A reply written for what each customer said, within two days. Hard reviews reach you the same day, so you can call first.",
      service: "A reply written for each review, and an alert the day a hard review posts, so you can call the customer first."
    }
  },

  // "Where you stand on each step": today, from the answers (each answer's own sentence), next to the method's standard
  // and how Rempo runs it. Only the questions the owner answered show.
  gap: {
    kicker: "The Visible Work Method",
    h1: "Where {business} stands on each step",
    lead: "Each step below starts from your own answers, then shows the method's standard and how our team runs it for you.",
    step: "Step {n}: {t}",
    columns: { today: "Today, from your answers", standard: "The method's standard", service: "How Rempo runs it" },
    chips: { fix: "Fix first", low: "Gap", medium: "Partly there", high: "In place" },
    fromProfile: "From your public profile",
    today: {
      asked10: {
        all: "All 10 of your last 10 customers were asked for a review.",
        "7to9": "7 to 9 of your last 10 customers were asked for a review.",
        "4to6": "4 to 6 of your last 10 customers were asked for a review.",
        "1to3": "1 to 3 of your last 10 customers were asked for a review.",
        none: "None of your last 10 customers were asked for a review.",
        unsure: "You weren't sure how many of your last 10 customers were asked."
      },
      d1: {
        every: "Every customer with a phone or email gets asked.",
        most: "Most customers get asked, except on busy days.",
        happy: "Mostly the customers who seemed happy get asked, which Google's review policy doesn't allow.",
        remember: "Whoever someone remembers gets asked.",
        hardly: "Hardly anyone gets asked."
      },
      d2: {
        every: "Every job record has the customer's mobile number or email.",
        most: "Most job records have the customer's mobile number or email.",
        half: "About half your job records have a mobile number or email.",
        few: "Only a few job records have a mobile number or email.",
        unsure: "You weren't sure how many job records have a mobile number or email."
      },
      asks: {
        tool: "A review tool sends a request after every job, plus a reminder.",
        software: "Your job software sends a request when the job closes.",
        techs: "Your techs ask in person at the end of the job.",
        remember: "Someone sends the link when they remember.",
        none: "Customers don't really get asked yet."
      },
      d3: {
        one: "One reminder goes out a few days later, then it stops.",
        several: "Several reminders go out until a customer leaves one.",
        resend: "Someone re-sends the request if they remember.",
        nothing: "Nothing happens after the first request, or you weren't sure."
      },
      d4: {
        runs: "Asking keeps running when the person who handles it is out.",
        covers: "Someone else covers asking when the person who handles it is out.",
        slows: "Asking slows down when the person who handles it is out.",
        stops: "Asking stops when the person who handles it is out."
      },
      newest: {
        week: "Your newest Google review came in this week.",
        month: "Your newest Google review came in earlier this month.",
        "1to3": "Your newest Google review is 1 to 3 months old.",
        over3: "Your newest Google review is more than 3 months old.",
        unsure: "You weren't sure when your newest Google review came in."
      },
      d5: {
        yes: "In your busiest weeks, every job is still asked.",
        mostly: "In your busiest weeks, asking mostly keeps up.",
        drops: "Asking drops off when you're slammed.",
        unsure: "You weren't sure whether asking keeps up in busy weeks."
      },
      d6: {
        current: "Your website shows recent Google reviews, and they stay current.",
        manual: "Your website shows Google reviews that someone updates by hand.",
        no: "Your website doesn't show your Google reviews yet.",
        nosite: "You don't have a website yet.",
        unsure: "You weren't sure whether your website shows your reviews."
      },
      replies: {
        all: "You reply to every review within two days.",
        most: "You reply to most of your reviews.",
        some: "You reply to some of your reviews.",
        rarely: "You rarely reply to reviews.",
        never: "You don't reply to reviews yet."
      },
      d7: {
        sameday: "You hear about a 1, 2 or 3-star review the same day.",
        week: "You hear about a 1, 2 or 3-star review within a week.",
        mention: "You hear about a 1, 2 or 3-star review when someone mentions it.",
        later: "You hear about a 1, 2 or 3-star review much later, or you weren't sure."
      },
      d8: {
        personal: "Each reply is written for what the customer said.",
        standard: "Replies reuse a few standard lines.",
        badonly: "Only the bad reviews get a reply.",
        unsure: "You weren't sure how replies are written."
      }
    },
    // From the public profile, when the team has read it
    profile: {
      rate: "About {rate} Google reviews came in per 100 jobs over the last 90 days.",
      recent: "{reviews_90} Google reviews came in over the last 90 days, against {top3_reviews_90} each for the top three.",
      newest: "Your newest Google review came in {newest}.",
      replied: "{replied} of your last {sampled} reviews have a reply."
    }
  },

  // "Two ways to run the method": the playbook, or Rempo's team
  ways: {
    kicker: "The Visible Work Method",
    h1: "Two ways to run the method",
    lead: "The method works the same either way. The difference is who runs it every week, including the weeks you're slammed.",
    self: {
      title: "Run it yourself",
      body: "The 30-day plan in this report is the method, step by step, and it is yours to keep.",
      bullets: [
        "A request after every finished job, sent by someone in your office",
        "The weekly checks in this plan: about 40 minutes a week",
        "A reply written for every review, within two days",
        "Someone who covers it when that person is out"
      ],
      note: "Rather run it yourself? A review tool costs less, and we'll tell you so."
    },
    service: {
      title: "Rempo runs it for you",
      body: "Every completed job asked. Every review answered. You approve your messages once, then our team runs it.",
      startTitle: "Starting is four things, once",
      start: [
        { t: "Connect your job software.", b: "Our team handles the setup." },
        { t: "Give Google profile access.", b: "So every review gets its reply." },
        { t: "Send one team photo.", b: "It goes on every request." },
        { t: "Approve your texting details.", b: "Email starts first. Texts follow once registration clears, usually about a week." }
      ],
      listTitle: "Done for you, every month",
      list: [
        "Every completed job asked",
        "One reminder, then we stop",
        "Every review answered",
        "The same request to everyone",
        "Recent reviews on your website",
        "An alert the day a bad review posts",
        "A monthly report, sent to you"
      ]
    },
    wontTitle: "What we won't do",
    wont: [
      { t: "We don't remove reviews.", b: "Every review gets a calm reply instead." },
      { t: "We don't screen out unhappy customers.", b: "Everyone gets the same honest request." },
      { t: "We don't promise counts or rankings.", b: "We track both and show you every month." }
    ],
    rules: "No rewards for reviews. No suggested words. Google's rules, and ours."
  },

  // "Your first 30 days with Rempo": what happens, in order, if the owner picks the service
  days: {
    kicker: "The Visible Work Method",
    h1: "Your first 30 days with Rempo",
    lead: "Here is what happens, in order, if {business} lets our team run the method.",
    phases: [
      { t: "Week 1: four things, once", b: "You connect your job software, give Google profile access, send one team photo and approve your texting details. You approve your messages once; our team does the setup." },
      { t: "Requests start", b: "Email requests start once your software is connected. Texts follow once carrier registration clears, usually about a week." },
      { t: "Every week after", b: "Every completed job asked, with one reminder, then we stop. Every review answered. An alert the day a hard review posts, so you can call the customer first." },
      { t: "Day 30: your first monthly report", b: "Requests sent, reviews in, replies posted, and calls from your Google profile. Take the scorecard again and compare." }
    ],
    yourStart: "For {business}, we'd start with {primary_bottleneck}. {fit_line}",
    locations: "You run {profiles} Google profiles: each location gets its own requests and its own replies.",
    paper: "Your jobs are on paper or in spreadsheets, so the first step is a call to work out how finished jobs reach us.",
    monthlyTitle: "What you see every month",
    monthly: "A report sent to you: requests sent, reviews in, replies posted, and calls from your Google profile.",
    cta: "Pick a time for a 15-minute call, and we'll walk through this plan for {business}:",
    ctaBooked: "Your call is booked: {day}, {window}. We'll walk through this plan for {business} then."
  }
};
