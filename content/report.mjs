// The PDF report's dynamic pages (Deliverable 3, docs/spec/3-report-dynamic-content.md). Each page shows one variant,
// chosen from the answers and the public profile by lib/report-model.mjs. Words in braces are fields (the field
// dictionary is at the end of the spec, and in lib/report-model.mjs).
export default {
  title: "The Invisible Work Scorecard Report",

  cover: {
    title: "The Invisible Work Scorecard Report",
    subtitle: "How much of {business}'s work a homeowner can see on Google. Scored across four areas of how your shop asks for and answers reviews, next to the three shops a homeowner sees first near you.",
    preparedFor: "Prepared for",
    prepared: "{first_name} {last_name}, {business}, {city}",
    preparedNoLast: "{first_name}, {business}, {city}",
    checked: "Checked by {checker_first_name} at Rempo"
  },

  overview: {
    title: "Your Report Overview",
    heading: "Thank you for taking the Invisible Work Scorecard",
    intro: "Your report scores {business} in four areas of how your shop asks for and answers Google reviews. A low score is not a verdict on your work: it means a habit or a system has gaps, and those are fixable. A high score means most of your customers get the chance to vouch for you, where the next homeowner looks. Next come your Visibility Score, the work that never reaches Google, and how you compare with the top three near you. Then your strongest and weakest areas, and a 30-day plan you can run yourself.",
    sub: "We have scored you against the following key areas"
  },

  invisible: {
    title: "Your Invisible Work",
    known: {
      h: "{unasked} customers a year never get asked",
      body: "You told us you finish {jobs_band} jobs a week, and that {asked_band} of your last 10 customers were asked for a review. At the low end of those ranges, at least {unasked} customers a year finish a job with you without the chance to vouch for you on Google.",
      value: "At a {ticket} ticket, that is at least {work_value} of finished work with nothing on Google to show for it."
    },
    all: {
      h: "Every customer gets asked",
      body: "You told us all 10 of your last 10 customers were asked for a review. That puts you ahead on the part that matters most: every happy customer gets the chance to vouch for you. The rest of this page checks how that shows up on your public profile."
    },
    unsure: {
      h: "The number we measured for you",
      body: "You weren't sure how many of your customers get asked. Most owners aren't, because nobody counts it. So we measured what we could from your public profile, below. Start counting this week, and take the scorecard again in 30 days."
    },
    // Not worded in the spec: jobs "Not sure" with a known asked count. The same idea, about the jobs
    jobsUnsure: {
      h: "The number we measured for you",
      body: "You weren't sure how many jobs you finish in a typical week. Most owners have to look it up, because nobody counts it. So we measured what we could from your public profile, below. Count this week's jobs, and take the scorecard again in 30 days."
    },
    box: {
      title: "How we worked it out",
      line1: "{jobs} jobs a week × 50 working weeks × {not_asked} of 10 customers not asked = {unasked} customers a year.",
      line2: "{unasked} customers × a {ticket} ticket = {work_value}.",
      line3: "We used the low end of every range you picked, so the real figures are at least this large.",
      line4: "You weren't sure of your ticket, so we used the average job value for {service} from Angi, {ticket}.",
      line5: "This is the value of work you have already done. It is not a forecast, and it is not a promise of anything."
    },
    rate: {
      title: "Your reviews per 100 jobs",
      line1: "In the last 90 days you finished about {jobs_90} jobs, and {reviews_90} Google reviews came in. That is about {rate} reviews per 100 jobs.",
      line2: "Over the same 90 days, the top three near you received {top3_reviews_90} reviews each, on average.",
      behind: "You finish the work. Fewer of your customers get the chance to say so where homeowners look.",
      level: "You're keeping pace with the top three on recent reviews. The next gains are in your replies and in keeping the pace through busy season.",
      jobsUnknown: "Over the last 90 days, {reviews_90} Google reviews came in, against {top3_reviews_90} each for the top three near you, on average.",
      footnote: "Reviews per 100 jobs counts public Google reviews against the jobs you told us you finish. It measures how many customers vouch for you, not how good the work was."
    },
    months: {
      title: "Your reviews, month by month",
      caption: "Google reviews that came in each month over the last 12 months, from your public profile.",
      dipD5: "You told us asking drops off when you're slammed. Your reviews show the same pattern: {low_months} were among your quietest months on Google. If those were busy months for you, the weeks with the most customers were the weeks the fewest got asked.",
      dip: "{low_months} were among your quietest months on Google. If those were busy months for you, that is usually when asking slips.",
      steady: "Your reviews come in at a fairly even pace through the year. Keep it that way through your next busy season, when asking is most likely to slip.",
      away: "You told us asking slows down or stops when the person who handles it is out. During a two-week absence, about {jobs_x2} customers would go unasked."
    }
  },

  top3: {
    title: "Next to the Top Three",
    h: "{business}, next to the top three for {service} in {city}",
    intro: "We searched {service} in {city} on {search_date} and read the three companies that came up first. Here is how your public profile compares, measure by measure. Run the same search yourself to check it.",
    columns: { measure: "Measure", you: "{business}", them: "Top three average", read: "Read" },
    measures: {
      rating: "Star rating",
      count: "Total Google reviews",
      reviews90: "Reviews in the last 90 days",
      newest: "Newest review",
      replies: "Replies on the last 30 reviews",
      profile: "Profile completeness (5 checks)"
    },
    reads: {
      rating: {
        ahead: "Your rating is at or above theirs. Asking every customer is how it stays honest and current.",
        behind: "Your rating is below theirs. The only way to change it within Google's rules is to ask every customer, not only the happy ones."
      },
      count: {
        ahead: "You have as many reviews as they do, or more.",
        behind: "Their review count is higher. A count like theirs builds from asking after every job, week after week."
      },
      reviews90: {
        ahead: "Your recent pace matches or beats theirs.",
        behind: "They are adding reviews faster right now. This is the gap a homeowner notices first."
      },
      newest: {
        ahead: "Your newest review is as recent as theirs.",
        behind: "Their newest reviews are more recent. 74% of consumers look for reviews from the last three months (BrightLocal 2026)."
      },
      replies: {
        ahead: "You reply as often as they do, or more.",
        behind: "They reply to more of their reviews. 80% of consumers are more likely to use a business that replies to all its reviews (BrightLocal 2026)."
      },
      profile: {
        ahead: "Your profile shows everything theirs does.",
        behind: "Your profile is missing {missing_items}, which theirs show."
      }
    },
    // Chips in the table: a status never shows by colour alone
    chips: { ahead: "Ahead or level", behind: "Behind" },
    // The five profile checks, in the words the "missing" line uses
    profileChecks: {
      hours: "your hours",
      services: "your services",
      photos: "photos from the last 90 days",
      description: "a description",
      categories: "your categories"
    },
    themesTitle: "Complaint themes",
    themesFound: "{theme_count} of your last 30 reviews mention {theme}.",
    themesNone: "No complaint theme repeats in your last 30 reviews.",
    themesRule: "We report themes and counts only, never a reviewer's name or words.",
    cushionTitle: "Your star cushion",
    cushionAbove: "Your star cushion: {k} one-star reviews would take your rating under 4.5. 31% of consumers only use businesses rated 4.5 stars or higher, up from 17% (BrightLocal 2026). The more customers you ask, the bigger that cushion can grow.",
    cushionBelow: "You are {m} five-star reviews in a row from a 4.5 rating. 31% of consumers only use businesses rated 4.5 stars or higher, up from 17% (BrightLocal 2026). Whether a customer leaves a review is up to them; asking every one of them is the part you control.",
    footnote: "Public profile facts only, read on {search_date}.",
    pending: "Your public profile is read by a person before this page is filled in."
  },

  overall: {
    title: "Your Overall Score",
    paragraph: "Your Visibility Score is the average of your four area scores, each out of 100. It measures how your shop asks for and answers Google reviews, not the quality of your work and not your star rating. Under 30 means most of your work leaves no public trace. From 30 to 54, customers get asked on some days and not others. From 55 to 74, the habit is in place with one or two clear gaps. At 75 and above, almost every customer gets the chance to vouch for you, and the job is to keep it that way.",
    deepenerYes: "Updated with your {n} extra answers.",
    deepenerNo: "Based on your 10 answers. Add 8 more for a sharper score: {deepener_link}",
    interpretation: {
      openbook: "Your shop does what most don't: it asks almost every customer and answers what they say. Homeowners who look you up can see the work, and see that you listen. The risk now is quiet erosion: a new office manager, a software update or a slammed July can stop asking without anyone noticing. Your area scores show which part is strongest and which deserves a weekly check. Use the 30-day plan as a maintenance routine, not a rebuild. Take the scorecard again each quarter to make sure the number holds.",
      nearly: "You're close. Most of your customers get asked, and the habit is real. One or two areas lag the others, and in a chain like this the weakest link sets the pace for the rest. That is a process gap, not a problem with your work, and it is usually the cheapest one to close. Your lowest area, {primary_bottleneck}, is where to start. Fix it this month and your next score will reflect it.",
      somedays: "Your customers vouch for you when they're asked. The trouble is the days nobody asks, and in a busy shop that is most days. Asking that depends on memory produces reviews in bursts, then long quiet stretches that make a busy shop look slow. Replies follow the same pattern: they go out when someone has a free minute. None of this is about the quality of your work. It is a system gap, and your weakest area, {primary_bottleneck}, is the link to fix first.",
      secret: "Your work is good, and almost none of it reaches Google. Right now asking happens when someone remembers, which on a busy day means it doesn't happen at all. That makes your shop a best-kept secret: the people who used you know, and the next homeowner can't see it. This is not a skill problem, and it is not about your crews. It is the absence of a system, and a system can be set up in a week. Start with {primary_bottleneck}, and follow the 30-day plan from day one."
    },
    urgency: {
      critical: "At your numbers this touches at least {unasked} customers a year, so it is the first thing to fix, this month.",
      criticalUnknown: "This is the first thing to fix, this month.",
      significant: "It touches at least {unasked} customers a year, so it is worth fixing this month.",
      // Significant with the count unknown (not worded in the spec): the urgency words alone
      significantUnknown: "Worth fixing this month.",
      moderate: "Treat it as a refinement, when you have a week."
    },
    areasTitle: "Your four areas"
  },

  // Section labels used on the strongest and weakest area pages
  labels: { means: "What This Means", next: "Your Immediate Next Step", impact: "The Impact on Your Strategy", quickWins: "Your quick wins, from your answers", checks: "Your weekly checks, from your answers" },

  /* ---------- High score pages: the strongest area. Every one ends section 2 with a maintenance warning ---------- */
  high: {
    coverage: {
      h: "Your Ask Coverage Is Your Strongest Asset",
      means: { lead: "Most of your finished jobs end with the customer being asked for a review. That's the step most shops skip, and everything else on this report depends on it.",
        bullets: ["Customers get asked after most jobs, not only the memorable ones", "Asking reaches customers on busy days as well as quiet ones", "The same request goes to everyone, so no one is singled out", "Your job records carry a phone number or email for most customers"] },
      next: { lead: "Strengths like this erode quietly, usually when a new person joins or the software changes. Keep it by counting it.",
        bullets: ["Every Friday, compare jobs closed with requests sent; the two numbers should match", "Check that new jobs are saved with a mobile number or email", "After any software update, close a test job and confirm the request arrives"] },
      impact: { lead: "Coverage is upstream of everything else on this report. Because customers get asked, your freshness and your standing next to the top three have something to build on.",
        bullets: ["Every week, recent customers get the chance to review, which is what keeps a profile current", "You have a habit to build on: one reminder or faster replies is a small step from here", "When a homeowner compares you with the top three, they read customers who were asked, not a lucky few"] }
    },
    system: {
      h: "Your Ask System Is Your Strongest Asset",
      means: { lead: "Asking at your shop runs on a system rather than on memory. It follows up once and keeps going when someone is out, which is the hardest part to build.",
        bullets: ["Requests go out when a job closes, not when someone remembers", "A customer who misses the first request hears from you once more, then you stop", "Asking continues when the person who handles it is away", "Busy weeks don't switch it off"] },
      next: { lead: "Systems fail quietly, so the job now is noticing early. Five minutes a week is enough.",
        bullets: ["Every Friday, check requests sent against jobs closed", "Once a month, close a test job with your own phone number and confirm the request arrives", "Name who checks the numbers, and who covers when they're out"] },
      impact: { lead: "A system that runs on its own gives every other area a steady base. It is what separates a review habit from a review program.",
        bullets: ["Coverage holds in your busiest weeks, when you have the most customers to ask", "Freshness follows, because requests go out every week", "The time someone spent remembering goes to replies and to the customers who need a call"] }
    },
    freshness: {
      h: "Your Freshness Is Your Strongest Asset",
      means: { lead: "Homeowners who look you up see recent proof of your work. 74% of consumers look for reviews from the last three months (BrightLocal 2026), and yours are there.",
        bullets: ["Your newest review is recent", "Reviews keep arriving in busy weeks as well as quiet ones", "Recent reviews also show on your website", "Your profile looks as busy as your shop is"] },
      next: { lead: "Freshness is the first thing to slip when the shop gets busy. Protect it before your next peak season.",
        bullets: ["Note the date of your newest review every Friday", "Before your next busy season, decide who sends requests when the phones are ringing", "If your website shows reviews, make sure it shows recent ones rather than a fixed set"] },
      impact: { lead: "Fresh reviews tell a homeowner you are active right now, which matters most for urgent jobs like no heat or a burst pipe. They also give your replies a steady flow of customers to answer.",
        bullets: ["Your profile stays current through your busy seasons", "Recent reviews answer the first question a homeowner with no heat asks: are they still good?", "Every recent review is another chance to show that you reply"] }
    },
    replies: {
      h: "Your Replies Are Your Strongest Asset",
      means: { lead: "You answer the reviews customers leave, and homeowners can see it. 80% of consumers are more likely to use a business that replies to all its reviews (BrightLocal 2026).",
        bullets: ["Reviews get a reply within days, not weeks", "Replies are written for what each customer said", "Hard reviews get a calm, public answer", "You hear about a bad review soon after it posts"] },
      next: { lead: "Reply quality slips when volume rises or a hard review lands in a busy week. Keep both in check.",
        bullets: ["Keep review notifications on, and read every new review the day it posts", "Before replying to a hard review, call the customer if you can", "Once a month, re-read your last ten replies and retire any phrase that repeats"] },
      impact: { lead: "Replies are the part of your profile that shows how you treat people after the job. They turn every review, good or hard, into a second impression.",
        bullets: ["A calm reply to a 3-star review shows the next homeowner how you handle a problem", "Personal replies matter: 50% of consumers are put off by generic or templated replies (BrightLocal 2026)", "When more customers are asked, your reply habit is ready for whatever they write"] }
    }
  },

  /* ---------- Low score pages: the primary bottleneck. Every area 75 or higher: the refinement headline, no urgency ---------- */
  low: {
    coverage: {
      h: "Your Ask Coverage Has the Most Room to Grow",
      refinement: "Your Ask Coverage Is Your Next Refinement",
      means: { lead: "Most of your finished jobs end without anyone asking the customer for a review. That's a process gap, not a sign customers aren't happy: on a busy day the next call wins, and the ask never happens.",
        bullets: ["The review link goes out only when someone has a free minute", "Busy days, late jobs and weekend calls are the ones that get skipped", "Some job records have no mobile number or email, so there's no way to ask", "Nobody counts jobs against requests, so the gap stays out of sight"] },
      next: { lead: "This week, make one change: every finished job with a phone or email gets one request, the same way for everyone.",
        bullets: ["Get your direct review link from your Google Business Profile and save it where the office can paste it in one step", "Write one short, honest request and use it for every customer: thank them, ask for an honest review, include the link", "Send it when the job is marked complete, not at the end of the day", "On Friday, count jobs closed and requests sent, and write both numbers down"] },
      impact: { lead: "Coverage is upstream of everything else. Fix it and the other three areas have something to work with.",
        bullets: ["At your numbers, at least {unasked} customers a year go unasked today; every one you add is a new chance to be seen", "Freshness follows: recent customers who are asked are the ones who can make your profile look current", "It's fixable in a week, because your jobs are already logged and the request is the same every time"],
        // The first bullet needs the count; without it, this one stands in (not worded in the spec)
        bulletNoCount: "Every customer who goes unasked today is a chance to be seen that never comes; every one you add counts" }
    },
    system: {
      h: "Your Ask System Has the Most Room to Grow",
      refinement: "Your Ask System Is Your Next Refinement",
      means: { lead: "Asking at your shop depends on someone remembering, with no follow-up. That's a system gap: the habit works on quiet days and stops on busy ones.",
        bullets: ["Requests go out at the end of the day, if there's time", "A customer who misses the first request never hears from you again", "When the person who handles it is out, asking stops", "Your busiest weeks, with the most customers, end up your quietest on Google"] },
      next: { lead: "This week, move the ask out of anyone's memory and into the moment the job closes.",
        bullets: ["Find out whether your job software can send a review request when a job is marked complete, and switch it on", "Add one reminder three to five days later, then stop; more can feel like pressure", "Name one person who checks the numbers every Friday, rather than one person who sends every request", "Write down who covers it during vacations and sick days"] },
      impact: { lead: "A system turns asking from a good intention into something that happens every time. It's the difference between a habit and a program.",
        bullets: ["Coverage holds in busy weeks, when you have the most customers to ask", "One reminder reaches customers who meant to review and forgot", "It's fixable this week: the trigger already exists in your workflow, the moment a job is marked complete"] }
    },
    freshness: {
      h: "Your Freshness Has the Most Room to Grow",
      refinement: "Your Freshness Is Your Next Refinement",
      means: { lead: "A homeowner looking you up today sees reviews that are weeks or months old. 74% of consumers look for reviews from the last three months (BrightLocal 2026), so a busy shop can look quiet. That's a timing gap, and it follows from how often customers get asked.",
        bullets: ["Asking stops in your busiest weeks, so your newest reviews date from slow periods", "Nobody watches the date of your newest review", "Your website shows old or hand-picked reviews, or none", "Weeks pass between reviews, then a few arrive at once"] },
      next: { lead: "This week, start a steady rhythm: every finished job asked, every week, busy or slow.",
        bullets: ["Look up your own profile tonight and note the date of your newest review", "Send requests for this week's finished jobs before Friday, and do it again next week", "Put the Friday check on the calendar: newest review date, jobs closed, requests sent", "Plan for your next busy season now: decide who sends requests when the phones are ringing"] },
      impact: { lead: "Freshness is a symptom, so you fix it upstream. When asking runs every week, recent customers keep getting the chance to review.",
        bullets: ["32% of consumers look for reviews from the last two weeks (BrightLocal 2026), so a weekly rhythm matters", "Steady asking also gives your replies a steady flow to answer", "It's fixable without new tools: a weekly routine and a calendar reminder are enough to start"] }
    },
    replies: {
      h: "Your Replies Have the Most Room to Grow",
      refinement: "Your Replies Are Your Next Refinement",
      means: { lead: "Most of your reviews have no reply, so the next homeowner can't see that you listen. That's a habit gap, not a sign you don't care: replies wait for a free minute, and a free minute rarely comes.",
        bullets: ["Reviews sit unanswered for weeks, or never get a reply", "Hard reviews get no reply, or a defensive one", "Replies reuse the same few lines; 50% of consumers are put off by generic or templated replies (BrightLocal 2026)", "You find out about a bad review days after it posts"] },
      next: { lead: "This week, answer your five most recent reviews, then keep a two-day rule.",
        bullets: ["Turn on review notifications in your Google Business Profile settings so each new review reaches you the day it posts", "Reply to your five most recent unanswered reviews, two or three sentences each, in your own words", "For a hard review, call the customer first if you can, then reply calmly in public without job or personal details", "From now on, every review gets a reply within two days"] },
      impact: { lead: "Replies are the fastest area to show visible progress, because the reviews are already there. Every reply you post is read by the next homeowner.",
        bullets: ["80% of consumers are more likely to use a business that replies to all its reviews (BrightLocal 2026)", "A calm answer to a hard review shows how you handle a problem", "It's fixable this week: a backlog of recent reviews is an afternoon's work"] }
    },
    // Shown when the rule flag is set (D1 = "Customers who seemed happy")
    ruleNote: {
      title: "A note on asking",
      body: "You told us customers who seemed happy are the ones who get asked. Google's review policy doesn't allow asking only some customers. Ask every customer the same way; it's also the only way your reviews show all of your work."
    },
    cascade: "Your Freshness score is low because of your {cause} score."
  },

  // Small furniture
  page: "Page {n}",
  footer: "The Invisible Work Scorecard Report · {business}",
  scoreOf: "{score} of 100",
  notRead: "Not read yet"
};
