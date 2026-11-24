// The results page (Deliverable 2, "Results page"): the result that shows right after the quiz, and again at
// /results/<token> from the score email. Fields in braces are filled per visitor by lib/scoring.mjs.
// The deepener page (/sharpen/<token>) and the call step's words live here too.
import SITE from "./site.mjs";
import { forDelivery } from "../lib/delivery.mjs";

const RESULTS = {
  header: {
    thanks: "Thanks, {first_name}.",
    name: "Your Invisible Work Scorecard",
    email: "Your full report is on its way to {email}. It arrives within one business day, checked by a person.",
    // A returning visitor (from the score email) sees their result without the contact line
    returning: "Your report arrives by email within one business day, checked by a person."
  },
  score: {
    label: "Visibility Score: {score}/100, {tier}. Higher is better.",
    intro: "Your Visibility Score measures how your shop asks for and answers Google reviews. It does not grade your work: it shows how much of that work a homeowner can see when they look you up. A low score means most of your finished jobs leave no public record. A high score means almost every customer gets the chance to vouch for you."
  },

  // The invisible work panel: exactly one variant shows, chosen by invisibleOf() (Deliverable 1, section 4)
  invisible: {
    known: "At your numbers, at least {unasked} customers a year finish a job with you and are never asked for a review. That's at least {work_value} of your work with nothing on Google to show for it.",
    knownMath: "{jobs} jobs a week × 50 weeks × {not_asked} of 10 not asked × a {ticket} ticket. We used the low end of each range you picked.",
    average: "At your numbers, at least {unasked} customers a year finish a job with you and are never asked for a review. That's at least {work_value} of your work with nothing on Google to show for it.",
    averageMath: "{jobs} jobs a week × 50 weeks × {not_asked} of 10 not asked, at an average job value of {ticket} (Angi). We used the low end of each range you picked.",
    count: "At your numbers, at least {unasked} customers a year finish a job with you and are never asked for a review.",
    countMath: "{jobs} jobs a week × 50 weeks × {not_asked} of 10 not asked. We used the low end of each range you picked.",
    unsure: "You're not sure how many customers get asked. That's common, and it's the first thing your report measures: your reviews per 100 jobs, next to the top three.",
    // Not worded in the spec (it groups "asked or jobs Not sure"): without the jobs there is no "per 100 jobs", so this
    // variant says what the report can measure instead
    jobsUnsure: "You're not sure how many jobs you finish in a week. That's common. Your report measures what your public profile shows: your recent Google reviews, next to the top three.",
    all: "Every customer gets asked. Your work shows. Your report checks the rest: how fresh your reviews look and how you compare with the top three.",
    fixFirst: "Fix first: {bottleneck}. {bottleneck_line}",
    // The houses strip: of your last 10 jobs, how many were asked
    strip: "Of your last 10 jobs, {asked} were asked.",
    stripUnsure: "Of your last 10 jobs: not sure how many were asked."
  },

  summary: "Your four scores show where your work is slipping out of sight. Start with your lowest area: it is usually the cause of the others. Fixing one area well does more than nudging all four.",

  // Area cards: Low (0 to 39), Medium (40 to 69), High (70 to 100)
  cards: {
    coverage: {
      low: "Most of your finished jobs end without anyone asking the customer for a review. That's not a choice anyone made: on a busy day, the next call wins. Every job that goes unasked is a happy customer the next homeowner never hears from. This is your fastest area to fix, because your jobs are already logged, and one request after each completed job closes most of the gap.",
      medium: "Some of your customers get asked and some don't. The ones who slip through are usually from your busiest days, which have the most customers to ask. Uneven asking means your reviews arrive in bursts, then go quiet. Asking after every job, the same way for everyone, turns the bursts into steady chances.",
      high: "Almost every customer gets asked, and that is rarer than most owners think. Your work has a real chance to show on Google. Watch for new staff, busy season and changes to your job software, since those are the moments asking quietly stops. Count jobs closed against requests sent once a week to keep it this way."
    },
    system: {
      low: "Asking depends on someone remembering, so it stops when your shop gets busy. That means your best weeks, with the most happy customers, are often your quietest weeks on Google. There's no follow-up either, so a customer who meant to review and forgot never hears from you again. The fix is to move the ask out of anyone's memory and into the moment the job closes.",
      medium: "Requests go out, but nobody runs them. A request with no follow-up reaches a customer once, on a busy day of their own, and is easy to miss. If one person handles it, asking stops when they're out. Add one reminder, then stop, and have someone check the numbers each week.",
      high: "Asking runs on a system, with a follow-up, and it keeps going when someone is out. That is the hardest part to build, and you have it. Watch for the quiet failures: a software update that switches requests off, or new jobs saved without a phone or email. A five-minute weekly check of requests sent catches both."
    },
    freshness: {
      low: "A homeowner checking you tonight sees reviews that are months old. 74% of consumers look for reviews from the last three months (BrightLocal 2026). Old reviews make a busy shop look quiet, even when the vans are out every day. Freshness follows asking: when every job is asked every week, recent customers get the chance to review.",
      medium: "Your newest reviews are recent enough, but they don't arrive every week. 32% of consumers look for reviews from the last two weeks (BrightLocal 2026). The gaps usually line up with busy season, when asking drops off. Keep asking at the same pace in your busiest weeks, and show your recent reviews on your website too.",
      high: "Homeowners who look you up see recent proof of your work. That matters: 74% of consumers look for reviews from the last three months (BrightLocal 2026). Keep the pace through busy season and slow weeks alike. If your website shows reviews, keep them current rather than a hand-picked set from years ago."
    },
    replies: {
      low: "Most of your reviews have no reply, so the next homeowner can't see that you listen. 80% of consumers are more likely to use a business that replies to all its reviews (BrightLocal 2026). An unanswered 3-star review is the one they read most closely. Start with your most recent reviews, and reply to each one in your own words.",
      medium: "You reply to some reviews, often the bad ones or when there's time. The gaps are visible to anyone who scrolls. Replies that read like a template can do as much harm as none: 50% of consumers are put off by generic or templated replies (BrightLocal 2026). Aim for every review, within two days, each written for what the customer said.",
      high: "You answer your reviews, and homeowners can see it. Keep your replies personal: 50% of consumers are put off by generic or templated replies (BrightLocal 2026). The risk to watch is the hard review that lands in a busy week. Make sure you hear about it the same day, so you can call the customer before you reply."
    }
  },

  // The recommendation under each area card
  recommendations: {
    low: "Start here. This area is where most of your work goes out of sight, and it is usually the easiest to fix first.",
    medium: "Tighten it. The habit exists; the next step is making it run every week without anyone remembering.",
    high: "Protect it. Check it weekly so a busy season or a software change doesn't quietly switch it off."
  },
  bandLabels: { low: "Low", medium: "Medium", high: "High" },

  // CTA cards. On this site (the ScoreApp and master page order): 3, 1, 2. Call-only visitors see the same cards, and
  // never a checkout card. Card 4 joins once the offer is decided (site.offer).
  ctaOrder: ["call", "sharpen", "service"],
  cta: {
    sharpen: {
      h3: "Sharpen your report",
      body: "Answer eight more quick questions and your report goes deeper: who gets skipped, what happens when someone is out, and how fast you hear about a bad review. About 30 seconds.",
      // When branching shows fewer than eight questions, the count follows ({n})
      bodyN: "Answer {n} more quick questions and your report goes deeper: who gets skipped, what happens when someone is out, and how fast you hear about a bad review. About 30 seconds.",
      button: "Add 8 answers",
      buttonN: "Add {n} answers",
      done: "Your report will use your {n} extra answers.",
      img: "report"
    },
    service: {
      h3: "See how we'd run it for you",
      body: "Rempo connects to the software you already log jobs in, asks every customer after every job with one reminder, and writes a reply for every review. You see the work in a monthly report.",
      button: "See how it works",
      img: "house"
    },
    call: {
      h3: "Last step: pick a time",
      body: "Book 15 minutes to walk through your report with us: your reviews per 100 jobs next to the top three, and what we'd run first. Pick a day and a time window, and we'll call you.",
      button: "Pick a time",
      img: "podium"
    },
    checkout: {
      h3: "Get started",
      body: "Rather skip the call? Start now, and our team does the setup.",
      button: "Get started",
      img: "mark-3d"
    }
  },

  // The call step (the Meta page's booking rules: about 5 business days, never the same day, no weekends)
  booking: {
    h3: "Last step: pick a time",
    lead: "A 15-minute call to walk through your report. Pick a day and a time window, and we'll call you.",
    day: "Pick a day",
    window: "Pick a time window (your time)",
    button: "Book my call",
    pickDay: "Pick a day for the call.",
    pickWindow: "Pick a time window.",
    phoneError: "Please enter a 10-digit US phone number.",
    consentError: "Tick the box so we can call you.",
    sending: "Booking your call",
    failed: "That didn't go through. Check your connection and try again.",
    done: "You're booked: {day}, {window}.",
    doneLine: "We'll call {phone} between {hours}, your time, to walk through your report for {business}. Bring whoever runs the office: it saves you passing it all on later.",
    doneEmail: "We've emailed the details to {email}. If the time stops working, reply and we'll move it.",
    calendar: "Add to calendar",
    calendarTitle: "Rempo: your Invisible Work Scorecard report (15 minutes)",
    calendarBody: "A 15-minute call with Rempo to walk through your Invisible Work Scorecard report. We'll call you.",
    next: "While you wait: sharpen your report (optional, {n} taps)"
  },

  // The deepener page (/sharpen/<token>)
  deepener: {
    title: "Sharpen your report",
    lead: "Eight more quick questions, about 30 seconds. Your report goes deeper: who gets skipped, what happens when someone is out, and how fast you hear about a bad review.",
    leadN: "{n} more quick questions, about 30 seconds. Your report goes deeper: who gets skipped, what happens when someone is out, and how fast you hear about a bad review.",
    label: "Sharpen your report",
    button: "Add to my report",
    sending: "Adding your answers",
    done: "Done. Your report will use your {n} extra answers.",
    doneLine: "Someone on our team checks your report before it reaches you, within one business day.",
    already: "You've already added your extra answers. Your report will use them.",
    missing: "We couldn't find that scorecard. Open the link in your score email again, or take the scorecard.",
    toResults: "Back to my score",
    toCall: "Last step: pick a time"
  },

  // The GTM's rule line, under every result
  ruleLine: "Every customer gets the same request after every job: no filtering, no rewards, no staff names.",
  unsubscribe: {
    h: "Unsubscribe from Rempo's emails",
    body: "You won't get another email from us about your scorecard. If your report was on its way, we won't email it.",
    button: "Unsubscribe",
    done: "Done. You won't get another email from us.",
    again: "Changed your mind? Take the scorecard again and tick the box."
  },
  page404: {
    h: "That page isn't here.",
    body: "The link may be old. Start the scorecard, or see how Rempo works.",
    button: "See my Visibility Score"
  },
  notFound: "We couldn't find that result. Open the link in your score email again, or take the scorecard.",
  retake: "Take the scorecard",

  // The first card in the instant delivery (site.reportDelivery "instant"): the report, emailed and here
  report: {
    h3: "Your report",
    body: "Your full report is on its way to your inbox as a PDF. Open it here any time: your Visibility Score, the method that closes your gaps, and a 30-day plan.",
    button: "Open my report",
    pdf: "Download the PDF",
    img: "report"
  },

  // The words that change when the PDF report is emailed right after the quiz (site.reportDelivery "instant", the
  // owner's request of 2026-11-22). The person's check stays: the top three follow within one business day.
  instant: {
    "header.email": "Your full report is on its way to {email} as a PDF. Next, someone on our team adds how you compare with the top three near you, within one business day.",
    "header.returning": "Your report was emailed to you as a PDF. Someone on our team adds the top three near you within one business day.",
    "ctaOrder": ["report", "call", "sharpen", "service"],
    "deepener.doneLine": "Your sharper report is on its way to your inbox, as a PDF."
  }
};

// Every wording, for the claim rules (tools/copy-lint.mjs); the pages use the one in force
export const ALL = RESULTS;
export default forDelivery(RESULTS, SITE.reportDelivery);
