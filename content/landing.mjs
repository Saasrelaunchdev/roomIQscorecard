// Every word on the landing pages (Deliverable 2, docs/spec/2-landing-and-results-pages.md). Two versions, each its
// own static page, so a split test compares one thing and Meta's crawler reads each page's own words:
//   /           Version B, the ScoreApp template: hero, introduction, how it works, the four areas, the report, the FAQ,
//               the footer banner. Every button starts the scorecard.
//   /invisible  Version A, the Meta ads variant: the quiz sits in the hero card; below it, "Your free report", the
//               ScoreApp sections and the final call.
// The claim rules (rules/copy-rules.json) apply to every string here: tools/copy-lint.mjs runs on every build.
import SITE from "./site.mjs";
import { forDelivery } from "../lib/delivery.mjs";

const LANDING = {
  meta: {
    title: "The Invisible Work Scorecard | Rempo",
    description: "How much of your work can a homeowner see on Google? Ten quick taps, about a minute, free. Your Visibility Score shows right away; your full report comes by email.",
    ogImage: "/assets/og.png"
  },

  // The quiz's own words, shared by both versions
  quiz: {
    label: "Free Visibility Score",
    frame: "Ten quick taps, about a minute. Your score shows right after; your full report comes by email.",
    frameShort: "About a minute. Your score shows right after.",
    count: "Question {n} of {total}",
    back: "Back",
    next: "Next",
    close: "Close",
    pick: "Pick an answer to go on.",
    required: "Please fill this in.",
    email: "Please enter a valid email address.",
    consent: "Tick the box so we can email your score and your report.",
    profiles: "Pick how many Google profiles you have.",
    sending: "Working out your score",
    failed: "That didn't go through. Check your connection and try again.",
    stored: "Your score is below. We couldn't save your answers just now, so your report may take longer; reply to the email or try again later."
  },

  // The trust lines under the hero (Version A) and in the report section (Version B)
  trust: [
    "Free, no call needed",
    "Built from your answers and your public Google profile",
    "Checked by a person, emailed within one business day"
  ],

  // The hero's picture (each variant's hero.picture, a name in src/assets/img/) and what sits on it, in percent of the
  // picture: pins (on: lit) and one tag. Leave pins and tag out for a plain picture; leave hero.picture out for none
  // (the hero then centers its words). Rempo's: the street of six homes, two asked this week.
  scene: {
    alt: "Illustration: a street of six homes, each with a job done this week. Two of them were asked for a review.",
    pins: [{ x: 21, y: 25 }, { x: 33, y: 25, on: true }, { x: 45, y: 25 }, { x: 58, y: 25 }, { x: 71, y: 25, on: true }, { x: 85, y: 25 }],
    tag: { x: 50, y: 87, text: "Asked this week:", strong: "2 of 6" }
  },

  variants: [
    {
      id: "scoreapp",
      slug: "",
      layout: "scoreapp",
      hook: "Is your review habit strong enough to show the work you actually do?",
      hero: {
        eyebrow: "Free scorecard for HVAC and plumbing shop owners",
        h1: "Is Your Review Habit Strong Enough to Show the Work You Actually Do?",
        lead: "Good work doesn't reach Google by itself. A happy customer becomes a review only when someone asks, after every job, and on a busy day nobody has a free minute. This scorecard shows how much of your work a homeowner can see, and the one thing to fix first.",
        button: "See my Visibility Score",
        picture: "street-six"
      },
      sticky: "See my Visibility Score"
    },
    {
      id: "invisible",
      slug: "invisible",
      layout: "hero-quiz",
      hook: "How many of the jobs you finished this year left a Google review?",
      hero: {
        eyebrow: "For HVAC and plumbing shop owners",
        h1: "Your work is better. Can homeowners see it?",
        lead: "See how much of your work shows on Google, next to the top three near you. About a minute.",
        leadShort: "How much of your work shows on Google, next to the top three near you.",
        picture: "street-six"
      },
      sticky: "Get my free Visibility Score",
      // Section 2 and the final call, worded for this scorecard (Deliverable 2, "The shared sections")
      report: {
        eyebrow: "Your free report",
        h2: "Your work, next to the top three.",
        line: "Your score shows how your shop asks and replies. Your report adds what your public Google profile shows, next to the three shops a homeowner sees first.",
        points: [
          { title: "Your invisible work.", body: "How many customers a year finish a job with you without being asked, and what that work is worth.", img: "street-six" },
          { title: "Your reviews per 100 jobs.", body: "Your public reviews from the last 90 days, measured against the jobs you finish.", img: "podium" },
          { title: "Checked by a person.", body: "Someone on our team checks every report before it reaches you.", img: "team-desk" }
        ]
      },
      final: {
        h2: "Start with where you stand.",
        stack: ["If asking depends on whoever remembers.", "If a 3-star review sat in public for weeks.", "If your newest review is months old."],
        line: "Get your free Visibility Score. It takes about a minute.",
        button: "Get my free Visibility Score"
      }
    }
  ],

  /* ---------- Version B's sections (the ScoreApp template), also used below Version A's hero ---------- */
  intro: {
    h2: "Four areas. One number you've never seen.",
    body: "The Invisible Work Scorecard looks at how your shop asks for and answers Google reviews, in four areas: Ask Coverage, Ask System, Freshness and Replies. It doesn't grade your work. It shows how much of it a homeowner can see. You'll learn how many customers a year finish a job with you without being asked, what that work is worth, and which area to fix first. It takes about a minute.",
    button: "Start the scorecard"
  },
  how: {
    h2: "Ten taps now. A full report tomorrow.",
    body: "Answer ten quick questions about your jobs and how you ask for reviews. Your Visibility Score shows right away, with a score for each area and your invisible work number. Then someone on our team reads your public Google profile next to the three shops a homeowner sees first near you. Your full report arrives by email within one business day.",
    // The three beats of the "how it works" strip, in the page's own words
    steps: [
      { title: "Ten quick taps", body: "About your jobs and how you ask for reviews.", icon: "u-minute" },
      { title: "Your score right away", body: "A score for each area and your invisible work number.", icon: "u-score" },
      { title: "Your report by email", body: "Checked by a person, within one business day.", icon: "u-report" }
    ]
  },
  areasSection: {
    eyebrow: "What the scorecard measures",
    h2: "How your shop asks for and answers reviews."
  },
  reportCta: {
    h2: "Your report, checked by a person",
    body: "Your answers turn into a report built for your shop. It holds your Visibility Score, your invisible work, your reviews per 100 jobs next to the top three, and a 30-day plan you can run yourself. Someone on our team checks every report before it reaches you.",
    bullets: ["About a minute to answer", "Free, with no card and no call needed", "Emailed within one business day"],
    button: "Get my free report"
  },
  faq: {
    h2: "Straight answers",
    body: "What owners ask before they start.",
    items: [
      { q: "Is it really free?", a: "Yes. No card and no call needed. You answer ten questions, your score shows on screen, and your report comes by email." },
      { q: "Why do you ask about my ticket?", a: "To put a dollar figure on the work your customers were never asked about. We use the low end of the range you pick, so the number is never inflated." },
      { q: "Who are the top three?", a: "The three companies that show up first when someone searches your main service in your town. The search and the date are printed on your report, so you can check it." },
      { q: "Will you call me?", a: "Only if you pick a time. Your report comes by email either way." },
      { q: "Is asking for reviews allowed?", a: "Yes, when every customer gets the same honest request. No rewards, no screening out unhappy customers, and no asking them to name a tech or what to write." },
      { q: "What do you do with my answers?", a: "We use them to build your report and to follow up by email. We never contact your customers. Unsubscribe any time." }
    ],
    button: "Start the scorecard"
  },
  footerCta: {
    h2: "Your work is already good. See how much of it shows.",
    sub: "Ten taps, about a minute, free.",
    button: "See my Visibility Score"
  },

  /* ---------- Shared furniture ---------- */
  legal: {
    // The notice at collection under each form. {button} is the form's own button label, so the notice names the exact
    // button that signals agreement
    notice: "By tapping {button}, you agree to our {terms} and acknowledge our {privacy}, which explains what we collect and how we use it.",
    noticeMeta: "Unless you opt out, we also tell Meta when a form like this is sent, to measure our ads. {choices}",
    noticeSms: "Texts follow our {sms}.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    choices: "Your privacy choices",
    sms: "SMS terms",
    newTab: "(opens in a new tab)"
  },
  cookie: {
    text: "We use cookies to measure our ads, only if you allow it. {more}",
    more: "Cookie policy",
    allow: "Allow",
    decline: "Decline"
  },
  footer: {
    line: "Rempo runs the review habit for HVAC and plumbing shops: a request after every completed job, a reply for every review, and a monthly report.",
    master: "See how Rempo works",
    links: [
      { key: "terms", label: "Terms" },
      { key: "privacy", label: "Privacy" },
      { key: "cookies", label: "Cookies" },
      { key: "sms", label: "SMS terms" },
      { key: "accessibility", label: "Accessibility" },
      { key: "choices", label: "Do Not Sell or Share My Personal Information" }
    ],
    cookieSettings: "Cookie settings"
  },
  // The words that change when the PDF report is emailed right after the quiz (site.reportDelivery "instant", the
  // owner's request of 2026-11-22). The person's check stays: the top three follow within one business day.
  instant: {
    "trust.2": "Your report by email right after, as a PDF",
    "variants.1.report.points.2": { title: "Checked by a person.", body: "Your report comes by email right after you finish. Then someone on our team reads your public Google profile and adds the top three.", img: "team-desk" },
    "how.h2": "Ten taps now. Your report right after.",
    "how.body": "Answer ten quick questions about your jobs and how you ask for reviews. Your Visibility Score shows right away, and your full report follows by email as a PDF. Then someone on our team compares your public Google profile with the three shops a homeowner sees first, within one business day.",
    "how.steps.2": { title: "Your report by email", body: "A PDF right after; the top three within one business day.", icon: "u-report" },
    "reportCta.h2": "Your report, built for your shop",
    "reportCta.body": "Your answers turn into a report built for your shop: your Visibility Score, your invisible work, the method that closes the gaps, and a 30-day plan. It comes by email right after you finish. Then someone on our team adds your reviews per 100 jobs, next to the top three.",
    "reportCta.bullets.2": "Emailed right after you finish"
  }
};

// Every wording, for the claim rules (tools/copy-lint.mjs); the pages use the one in force
export const ALL = LANDING;
export default forDelivery(LANDING, SITE.reportDelivery);
