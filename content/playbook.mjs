// The static playbook every report carries (Deliverable 4, docs/spec/4-report-static-playbook.md): four mastery plans,
// the 30-day timeline, the five-day quick start, the checklists, the weekly tracker and the final call to action.
// Every step keeps to Google's review policy and the FTC Consumer Review Rule: the same request to every customer, no
// rewards, no screening, no staff quotas, no suggested wording. The final page uses the routing variant.
export default {
  start: {
    title: "Your Visible Work Starts Here",
    lead: "The first half of this report showed where your work goes out of sight. This half is the plan to close those gaps, and it is yours to keep whether or not you ever work with us. It holds a guide for each of the four areas, a 30-day timeline, a five-day quick start, a checklist for each area and a weekly tracker.",
    howTitle: "How to Use This Report",
    how: [
      { b: "Start with your weakest area.", t: "Your low score page named it. Read that area's guide first, even if another area interests you more." },
      { b: "Read the guide's core method.", t: "Each guide has one named method in three or four phases. Do the phases in order." },
      { b: "Use the quick start this week.", t: "Five short actions, one a day, about an hour and 40 minutes in total." },
      { b: "Follow the 30-day timeline.", t: "One area a week, in the order that fixes causes before symptoms." },
      { b: "Track it every Friday.", t: "Fill in the weekly tracker, then take the scorecard again on day 30 and compare." }
    ],
    sectionsHead: ["Section", "What it gives you"],
    sections: [
      ["Ask Coverage guide", "The Every-Job Ask: one request after every finished job, the same for everyone"],
      ["Ask System guide", "The Hands-Off Ask: a request that runs without anyone remembering, with one follow-up"],
      ["Freshness guide", "The Steady-Week Rhythm: recent proof of your work, every week, busy or slow"],
      ["Replies guide", "The Two-Day Reply: every review answered within two days, in your own words"],
      ["30-day timeline", "Four weekly phases, causes first"],
      ["Quick start", "Five things to do this week"],
      ["Checklists", "Eight checkable actions per area"],
      ["Weekly tracker", "Four scores and four counts, every Friday"]
    ],
    // Printed beside the guide list: where this owner starts (dynamic)
    yourStart: "Your weakest area is {primary_bottleneck}. Start with its guide."
  },

  guides: {
    coverage: {
      title: "Ask Coverage: The Every-Job Ask",
      tagline: "Every happy customer gets the chance, not just the ones someone remembers.",
      withoutHead: "Without a Coverage Strategy",
      withHead: "With a Coverage Strategy",
      compare: [
        ["The link goes out when someone has a free minute, so busy days get skipped", "Every finished job with a phone or email gets one request, the same way for everyone"],
        ["Some job records have no mobile number or email, so those customers can't be asked", "Contact details are captured at booking, so every customer can be asked"],
        ["Nobody knows how many customers were asked last week", "Jobs closed and requests sent are counted every Friday"],
        ["Asking drifts toward the customers who seemed happiest, which Google's policy doesn't allow", "Everyone gets the same honest request, which keeps you inside Google's rules"],
        ["Your best work stays word of mouth, heard by one neighbour instead of every homeowner who looks you up", "More of your customers have the chance to vouch for you where homeowners look"]
      ],
      method: "The Every-Job Ask",
      phases: [
        { t: "Find your trigger", s: "Decide the exact moment a job counts as finished.", b: ["Pick the moment in your software: job marked complete, or invoice paid", "Make that moment, not the end of the day, when the request goes out", "Write the trigger down so anyone in the office knows it"] },
        { t: "Clean the contact", s: "Make sure every customer can be reached.", b: ["Check last month's jobs for missing mobile numbers and emails", "Make \"mobile or email\" a required field at booking", "Ask for consent to text at booking, in plain words"] },
        { t: "One ask for everyone", s: "Use the same honest request for every customer.", b: ["Write a short request: thank them by first name, ask for an honest review, include your direct link", "Send it to every customer, whatever you think they'll say", "Leave out rewards, discounts and any hint of what to write"] },
        { t: "Count it weekly", s: "What gets counted gets done.", b: ["Every Friday, write down jobs closed and requests sent", "If the numbers differ, find the skipped jobs and the reason", "Fix the reason, not the person"] }
      ],
      mistakes: [
        "Asking only the customers who seemed happy; Google's review policy doesn't allow it",
        "Offering a discount, a gift or a prize draw entry in return for a review",
        "Asking customers to name a technician, or suggesting what to write",
        "Setting review targets or contests for technicians",
        "Sending requests in batches at the end of the month, so the weekly count can't catch skipped jobs",
        "Texting customers without their consent, or from a business number that isn't registered with the carriers (A2P 10DLC)",
        "Blaming the person who forgot instead of fixing the trigger"
      ],
      protocol: {
        title: "The Friday Coverage Count",
        frequency: "Every Friday, 10 minutes.",
        format: "Two numbers from your job software: jobs closed this week and review requests sent this week.",
        review: "If requests are fewer than jobs, list the skipped jobs by name or job number.",
        classify: "No contact details, busy day, job closed by someone else, or other. Fix the most common reason first, then the next."
      }
    },
    system: {
      title: "Ask System: The Hands-Off Ask",
      tagline: "A request that doesn't depend on anyone remembering, with one follow-up and someone who checks.",
      withoutHead: "Without a System Strategy",
      withHead: "With a System Strategy",
      compare: [
        ["Asking happens at the end of the day, if there's time", "The request goes out when the job closes, every time"],
        ["A customer who misses the first request never hears from you again", "One reminder a few days later, then you stop"],
        ["When the person who handles it is out, asking stops", "Someone checks the numbers each Friday, and someone else covers when they're away"],
        ["Your job software's review switch is on, but nobody checks what it sends", "A monthly test catches a broken setting before customers do"],
        ["Your busiest weeks end up your quietest on Google", "Busy weeks get asked like slow weeks"]
      ],
      method: "The Hands-Off Ask",
      phases: [
        { t: "Move the ask out of memory", s: "Tie the request to the job, not to a person.", b: ["Check whether your job software can send a review request when a job closes", "If it can, switch it on and send a test to your own phone", "If it can't, use a review tool that connects to it, or send requests at a fixed time each day"] },
        { t: "Add one reminder", s: "Reach the customer who meant to and forgot.", b: ["Set one reminder three to five days after the first request", "Stop after that: more can feel like pressure", "Make sure every message has a clear way to opt out"] },
        { t: "Name an owner who checks", s: "One person checks; nobody has to remember.", b: ["Pick one person to check the numbers every Friday, not to send every request", "Name a backup for vacations and sick days", "Put both names where the office can see them"] },
        { t: "Test it monthly", s: "Find a broken setting before a customer does.", b: ["Once a month, close a test job with your own number", "Confirm the request and the reminder arrive and the link opens your review form", "Test again after any software update"] }
      ],
      mistakes: [
        "Sending several reminders until the customer gives in",
        "Trusting a software switch nobody has tested",
        "Letting one person hold the whole program in their head",
        "Sending requests from a personal phone, with no record of who was asked",
        "Switching requests off in busy season to save time",
        "Texting from a business number before carrier registration (A2P 10DLC) has cleared"
      ],
      protocol: {
        title: "The Monthly System Test",
        frequency: "Once a month, 10 minutes, plus the five-minute Friday check.",
        format: "Close a test job in your software using your own mobile number and email.",
        review: "Did the request arrive? Did the reminder arrive three to five days later? Did the link open the review form? Did the opt-out work?",
        classify: "Trigger (nothing sent), contact (sent to the wrong place), message (wrong words or no opt-out), or link (broken). Fix it the same day."
      }
    },
    freshness: {
      title: "Freshness: The Steady-Week Rhythm",
      tagline: "Recent proof of your work, every week, busy or slow.",
      withoutHead: "Without a Freshness Strategy",
      withHead: "With a Freshness Strategy",
      compare: [
        ["Your newest review dates from your last slow month", "Customers get asked every week you work"],
        ["Nobody watches the date of your newest review", "The newest review date is part of the Friday check"],
        ["Reviews arrive in bursts, then weeks of nothing", "Busy season has a plan, so asking keeps up"],
        ["Your website shows the same few reviews from years ago, or none", "Your website shows recent reviews from Google, labelled as recent, not as your full record"],
        ["A homeowner with no heat tonight has to wonder whether you're still busy", "Your profile looks as busy as your shop is"]
      ],
      method: "The Steady-Week Rhythm",
      phases: [
        { t: "Ask every week", s: "Freshness follows asking.", b: ["Send requests for every finished job, every week, busy or slow", "Never save requests up for a quiet week", "Check jobs closed against requests sent on Friday"] },
        { t: "Watch the date", s: "Know what a homeowner sees tonight.", b: ["Look up your profile every Friday and note the newest review date", "If it's older than two weeks, check that week's count for skipped jobs", "Keep a simple log: the date, the newest review, requests sent"] },
        { t: "Plan for busy season", s: "The weeks with the most customers need the most care.", b: ["Before your next peak, decide who sends requests when the phones are ringing", "Use the trigger from the Ask System guide so busy days are covered", "Look at last year's quiet months on your profile and plan for them"] },
        { t: "Show it where homeowners decide", s: "Recent proof belongs on your own site too.", b: ["Put recent reviews from Google on your website", "Present them as recent reviews, not as your whole record", "Keep them current; replace any fixed set"] }
      ],
      mistakes: [
        "Saving requests for slow weeks",
        "Asking in a burst before busy season, then stopping",
        "Copying old reviews onto your website and leaving them for years",
        "Showing only 5-star reviews on your site in a way that implies it's all of them",
        "Treating profile posts as a substitute for asking customers",
        "Judging freshness by your star rating instead of by date"
      ],
      protocol: {
        title: "The Friday Freshness Log",
        frequency: "Every Friday, 5 minutes; a monthly look back, 15 minutes.",
        format: "One line a week: the date of your newest review, the reviews that came in this week, and the requests sent.",
        review: "Once a month, line the log up against your busy and slow weeks. Where reviews dried up, check whether requests dried up first.",
        classify: "Busy-season skip, no trigger, missing contact details, or other. The first one is the most common in HVAC and plumbing; plan for it."
      }
    },
    replies: {
      title: "Replies: The Two-Day Reply",
      tagline: "Every review answered within two days, in your own words, including the hard ones.",
      withoutHead: "Without a Replies Strategy",
      withHead: "With a Replies Strategy",
      compare: [
        ["Reviews wait for a free minute, which rarely comes", "Every review gets a reply within two days"],
        ["A 3-star review sits in public for weeks", "Each reply answers what that customer said"],
        ["Replies reuse the same two lines", "Notifications put each new review in front of you the day it posts"],
        ["You find out about a bad review when a customer mentions it", "Hard reviews get a phone call first, then a calm public reply"],
        ["Hard reviews get a defensive answer, or none", "The next homeowner sees a shop that listens"]
      ],
      method: "The Two-Day Reply",
      phases: [
        { t: "See every review", s: "You can't answer what you haven't seen.", b: ["Turn on review notifications in your Google Business Profile", "Pick who reads each new review the day it posts", "Flag any 1, 2 or 3-star review for the owner the same day"] },
        { t: "Reply within two days", s: "Short, specific, personal.", b: ["Thank the customer by first name", "Mention one specific thing they said", "Keep it to two or three sentences, in your own voice"] },
        { t: "Handle hard reviews calmly", s: "The next homeowner is reading your answer, not the complaint.", b: ["Call the customer first if you can, and listen", "Reply in public without job details, prices or anything personal", "Say what you're doing about it and invite them to call the office", "Never argue, and never ask them to change the review"] },
        { t: "Clear the backlog", s: "Old silence is still visible.", b: ["Start with your most recent unanswered reviews", "Answer five a day until they're done", "Then keep the two-day rule"] }
      ],
      mistakes: [
        "Pasting the same reply on every review; 50% of consumers are put off by generic or templated replies (BrightLocal 2026)",
        "Arguing with a customer in public",
        "Mentioning job details, prices or personal information in a reply",
        "Replying only to the bad reviews",
        "Offering a refund in return for changing a review",
        "Letting a hard review sit while you decide what to say"
      ],
      protocol: {
        title: "The Daily Read and Friday Reply Check",
        frequency: "Daily, 2 minutes; every Friday, 5 minutes.",
        format: "Daily: read any new review. Friday: count the reviews that came in this week and the replies posted.",
        review: "Once a month, re-read your last ten replies out loud. Retire any phrase you've used more than twice.",
        classify: "Unanswered, late (more than two days), templated, or defensive. Fix unanswered first."
      }
    }
  },
  guideLabels: { method: "The core method: {method}", phase: "Phase {n}: {t}", mistakes: "Common Mistakes to Eliminate", protocol: "Practice Protocol", frequency: "Frequency:", format: "Format:", review: "Review method:", classify: "Classify every miss:", fromAnswers: "From your answers" },

  timeline: {
    title: "Your 30-Day Timeline",
    lead: "One area a week, causes before symptoms: first make sure every customer gets asked, then make asking run on its own, then answer everything, then make it show.",
    phases: [
      { t: "Phase 1, days 1 to 7: Stop the leak", focus: "Ask Coverage", area: "coverage",
        b: ["Count last week's jobs and review requests", "Get your direct review link and save it for the office", "Write one honest request, the same for everyone", "Send it after every finished job this week", "Make mobile or email a required booking field"],
        outcome: "every finished job this week has a request, and you know your real count." },
      { t: "Phase 2, days 8 to 14: Make it run without you", focus: "Ask System", area: "system",
        b: ["Switch on the job-close trigger, or set a fixed daily time", "Add one reminder three to five days later, then stop", "Name the Friday checker and a backup", "Close a test job with your own number", "If you text customers, register your business number with the carriers"],
        outcome: "asking runs on a system with one follow-up." },
      { t: "Phase 3, days 15 to 21: Answer everything", focus: "Replies", area: "replies",
        b: ["Turn on review notifications", "Answer your five most recent unanswered reviews", "Start the two-day rule", "Write your hard-review routine: call first, reply calmly", "Call the customer behind any hard review still open"],
        outcome: "every new review gets a reply within two days." },
      { t: "Phase 4, days 22 to 30: Make it show", focus: "Freshness", area: "freshness",
        b: ["Start the Friday freshness log", "Put recent Google reviews on your website, labelled as recent", "Write your busy-season plan", "Run the first monthly system test", "Take the scorecard again on day 30"],
        outcome: "a weekly routine that keeps your work visible, and a second score to compare with the first." }
    ],
    focus: "Focus:",
    outcome: "Expected outcome:"
  },

  quickStart: {
    title: "Quick Start: 5 Things to Do This Week",
    days: [
      { t: "Day 1: Count Last Week", m: "20 minutes", body: "Open your job software and count the jobs you finished last week. Then count how many of those customers were sent a review request. Write both numbers on a sticky note by the phone. This is your starting point, and the number to beat." },
      { t: "Day 2: Get Your Direct Review Link", m: "15 minutes", body: "Sign in to your Google Business Profile and find the option to share a link that takes customers straight to your review form. Copy it into a note the whole office can reach. Send it to your own phone and check that it opens the review form." },
      { t: "Day 3: Write One Honest Request", m: "20 minutes", body: "Write a two-sentence request: thank the customer by first name for choosing you, and ask whether they'd share an honest review, with your link. Use the same words for every customer. Leave out rewards, discounts, technician names and any hint of what to write. If you text customers, make sure you have their consent and a registered business number." },
      { t: "Day 4: Answer Five Reviews", m: "30 minutes", body: "Open your profile and find your five most recent reviews without a reply. Answer each in two or three sentences, mentioning one thing the customer said. For any hard review, call the customer first if you can, then reply calmly without job or personal details." },
      { t: "Day 5: Set Your Friday Check", m: "15 minutes", body: "Turn on review notifications in your Google Business Profile. Put a recurring 10-minute Friday slot on the calendar: jobs closed, requests sent, newest review date, replies posted. Name who does it, and who covers when they're out." }
    ],
    total: "Total time this week: about 1 hour 40 minutes."
  },

  checklists: {
    title: "Implementation Checklists",
    head: ["Action", "How or where", "Status"],
    coverage: [
      ["Count jobs closed and requests sent last week", "Job software, Friday"],
      ["Save your direct review link where the office can reach it", "Google Business Profile, a shared note"],
      ["Write one honest request, the same for everyone", "A shared note"],
      ["Send the request when a job is marked complete", "Job software"],
      ["Make mobile or email a required booking field", "Booking form, job software"],
      ["Record consent to text at booking", "Booking script"],
      ["Take any rewards, discounts or technician names out of requests", "Request wording"],
      ["Every Friday, count jobs and requests and list skipped jobs", "Friday log"]
    ],
    system: [
      ["Check whether your software can send a request when a job closes", "Software settings"],
      ["Switch it on and test it with your own number", "Job software"],
      ["Set one reminder three to five days later", "Software or review tool"],
      ["Confirm every message has an opt-out", "Message wording"],
      ["Name the Friday checker", "Where the office can see it"],
      ["Name the backup for vacations and sick days", "Where the office can see it"],
      ["Register your texting number if you text customers (A2P 10DLC)", "Your texting provider"],
      ["Run a monthly test job", "Calendar, first Monday"]
    ],
    freshness: [
      ["Note the date of your newest review", "Google Business Profile, Friday"],
      ["Start the Friday freshness log", "A shared sheet"],
      ["Send requests every week, busy or slow", "Job software"],
      ["Check last year's quiet months on your profile", "Google Business Profile"],
      ["Write the busy-season plan: who sends when the phones ring", "Where the office can see it"],
      ["Show recent Google reviews on your website", "Website"],
      ["Label them as recent reviews, not your full record", "Website"],
      ["Replace any fixed set of old reviews", "Website"]
    ],
    replies: [
      ["Turn on review notifications", "Google Business Profile settings"],
      ["Name who reads each new review the day it posts", "Office"],
      ["Answer the five most recent unanswered reviews", "Google Business Profile"],
      ["Reply to every new review within two days", "Daily"],
      ["Write your hard-review routine: call first, reply calmly", "A shared note"],
      ["Retire any reply line you've used more than twice", "Monthly"],
      ["Check that no reply mentions job details, prices or personal information", "Each reply"],
      ["Count reviews in and replies posted every Friday", "Friday log"]
    ]
  },

  tracker: {
    title: "Weekly Tracking Dashboard",
    lead: "Fill this in every Friday. Rate each area from 1 (not happening) to 5 (happens every time, without anyone remembering), then write the four counts.",
    head: ["Measure", "Week 1", "Week 2", "Week 3", "Week 4", "Target"],
    rows: [
      ["Ask Coverage (1 to 5)", "5"],
      ["Ask System (1 to 5)", "5"],
      ["Freshness (1 to 5)", "5"],
      ["Replies (1 to 5)", "5"],
      ["Jobs closed", "Your count"],
      ["Requests sent", "Same as jobs closed"],
      ["Newest review date", "Within 2 weeks"],
      ["Replies posted", "Every review"]
    ],
    // The starting point, printed from this owner's scores (dynamic): the 1 to 5 rating each area's score suggests
    startLabel: "Your starting point",
    commitmentsTitle: "Commitments",
    commitments: [
      "I will ask every customer the same way.",
      "I will count jobs and requests every Friday.",
      "I will reply to every review within two days.",
      "I will never offer a reward for a review.",
      "I will fix the reason a job was skipped, not blame the person."
    ],
    rememberTitle: "Remember",
    remember: [
      "Asking is yours. Reviewing is the customer's choice.",
      "Every customer, the same honest request.",
      "One reminder, then stop.",
      "Answer every review in your own words."
    ]
  },

  next: {
    title: "Your Next Step",
    lead: "This report showed you where your work goes out of sight, and gave you a 30-day plan to close the gaps. But a plan alone is not enough. It has to run every week, in your busiest weeks too, and that is the part most busy shops can't spare.",
    boxTitle: "Pick a time to walk through your report",
    boxBody: "In 15 minutes we'll walk through your report, starting with {primary_bottleneck}. We'll show you what Rempo would run: a request after every completed job, one reminder, and a reply written for every review. You'd also get an alert the same day a hard review posts, and a monthly report. It all runs from the software you already log jobs in. You give us access once; our team does the setup.",
    fit: {
      coverage: "For your Ask Coverage, that means every completed job with a phone or email gets the same request.",
      system: "For your Ask System, that means asking runs from the moment a job closes, with one reminder, whoever is in the office.",
      freshness: "For your Freshness, that means customers get asked every week, busy season included.",
      replies: "For your Replies, that means every review gets a reply written for what the customer said, and hard reviews reach you the same day.",
      callOnly: "Your jobs are on paper or spreadsheets, or you run three or more locations, so we'll start with a call to work out what fits."
    },
    pick: "Pick a time:",
    booked: "Your call is booked: {day}, {window}. We'll call you then.",
    master: "Or see how Rempo runs it first:",
    masterLink: "rempo.io",
    self: "Rather run it yourself? This playbook is yours to keep, and a review tool costs less. We'll tell you so."
  }
};
