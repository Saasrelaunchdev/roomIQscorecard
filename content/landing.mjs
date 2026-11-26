// Every word on the landing pages (spec 2, docs/spec/2-landing-and-results-pages.md). Two versions, each its own
// static page, so a split test compares one thing and Meta's crawler reads each page's own words:
//   /            Version B, the ScoreApp template: hero, introduction, how it works, the five areas, the report, the
//                FAQ, the footer banner. Every button starts the scorecard.
//   /first-deal  Version A, for Meta ads sent straight to the tool: the quiz sits in the hero card; below it, "Your
//                free report", the ScoreApp sections and the final call.
// /start is the quiz alone (the landing page's and the Meta page's score buttons, and emails).
// The claim rules (rules/copy-rules.json) apply to every string here: tools/copy-lint.mjs runs on every build.
import SITE from "./site.mjs";
import { forDelivery } from "../lib/delivery.mjs";

const LANDING = {
  meta: {
    title: "The First Deal Risk Scorecard | RoomIQ",
    description: "Would your first rent-by-the-room deal survive its first six months? Eleven quick questions, about a minute, free. Your score shows right away; your report comes by email.",
    ogImage: "/assets/og.png"
  },

  // The quiz's own words, shared by both versions
  quiz: {
    label: "Free Deal Readiness Score",
    frame: "Eleven quick questions, about a minute. Your score shows right after; your report comes by email.",
    frameShort: "About a minute. Your score shows right after.",
    count: "Question {n} of {total}",
    back: "Back",
    next: "Next",
    close: "Close",
    pick: "Pick an answer to go on.",
    required: "Please fill this in.",
    email: "Please enter a valid email address, like name@example.com.",
    consent: "Tick the box so we can email your score and your report.",
    profiles: "Pick an answer to go on.",
    sending: "Working out your score",
    failed: "That didn't go through. Check your connection and try again.",
    stored: "Your score is below. We couldn't save your answers just now, so your report may not arrive; please try again later."
  },

  // The trust lines under the hero (Version A) and in the report section (Version B)
  trust: [
    "Free, no card and no call needed",
    "Built from your own answers",
    "Your report by email right after, as a PDF"
  ],

  // The hero's picture: the story film's poster, an illustrated, made-up neighborhood (src/assets/img/neighborhood-*)
  scene: {
    alt: "Illustration of a made-up neighborhood of houses along a street."
  },

  variants: [
    {
      id: "scoreapp",
      slug: "",
      layout: "scoreapp",
      hook: "Would your first rent-by-the-room deal survive its first six months?",
      hero: {
        eyebrow: "Free scorecard for rent-by-the-room investors",
        h1: "Would your first rent-by-the-room deal survive its first six months?",
        lead: "Every room-rental plan rests on two numbers: rent per room and how fast rooms fill. See if yours are evidence or guesses.",
        button: "Score my deal",
        picture: "neighborhood"
      },
      sticky: "Score my deal"
    },
    {
      id: "firstdeal",
      slug: "first-deal",
      layout: "hero-quiz",
      hook: "Where does your per-room rent number come from?",
      hero: {
        eyebrow: "For rent-by-the-room investors",
        h1: "Will your first deal survive six months?",
        lead: "Eleven quick questions. Your score, your lease-up gap and what to check before an offer.",
        leadShort: "Your score, your lease-up gap and what to check before an offer.",
        picture: "neighborhood"
      },
      sticky: "Score my first deal",
      report: {
        eyebrow: "Your free report",
        h2: "What your report shows before you make an offer.",
        line: "Your score shows where your plan rests on evidence. Your report shows what to check next, and how.",
        points: [
          { title: "Your first six months.", body: "Your lease-up gap: the months your reserves don't cover, in dollars, from your own answers." },
          { title: "Five areas, scored.", body: "Rent, fill speed, supply, room mix and reserves, with the one to fix first." },
          { title: "Three checks outside RoomIQ.", body: "Your city's rule on unrelated adults, financing on room income, and insurance." }
        ]
      },
      final: {
        h2: "Start with where your deal stands.",
        stack: ["If the rent per room came from a calculator.", "If the vacancy rate is a guess.", "If nobody counted the homes nearby."],
        line: "Get your free Deal Readiness Score. It takes about a minute.",
        button: "Score my first deal"
      }
    }
  ],

  /* ---------- Version B's sections (the ScoreApp template), also used below Version A's hero ---------- */
  intro: {
    h2: "Five areas. One number for your first six months.",
    body: "The First Deal Risk Scorecard checks where your plan's numbers come from, in five areas: Rent Evidence, Fill Speed, Nearby Supply, Room Mix and Lease-up Reserves. It doesn't grade the house or the market. It shows which numbers are evidence and which are borrowed. You'll also see your lease-up gap: the months your reserves don't cover, in dollars.",
    button: "Start the scorecard"
  },
  how: {
    h2: "Eleven taps now. Your report right after.",
    body: "Answer eleven quick questions about your plan and where its numbers come from. Your Deal Readiness Score shows right away, with a score for each area and your lease-up gap. Your full report follows by email as a PDF: what to check first, and how.",
    // The three beats of the "how it works" strip, in the page's own words
    steps: [
      { title: "Eleven quick questions", body: "About your plan and where its numbers come from.", icon: "u-minute" },
      { title: "Your score right away", body: "Five area scores and your lease-up gap.", icon: "u-score" },
      { title: "Your report by email", body: "A PDF right after, with a 30-day plan.", icon: "u-report" }
    ]
  },
  areasSection: {
    eyebrow: "What the scorecard measures",
    h2: "Where your plan's numbers come from."
  },
  reportCta: {
    h2: "Your report, built from your answers",
    body: "Your answers turn into a report for your deal. It holds your Deal Readiness Score, your first six months, three checks outside RoomIQ, the method that closes your gaps and a 30-day plan. It arrives by email right after you finish.",
    bullets: ["About a minute to answer", "Free, with no card and no call needed", "Emailed right after you finish"],
    button: "Get my free report"
  },
  faq: {
    h2: "Straight answers",
    body: "What investors ask before they start.",
    items: [
      { q: "Is it really free?", a: "Yes. No card and no call needed. You answer eleven questions, your score shows on screen, and your report comes by email as a PDF." },
      { q: "Why do you ask about my costs and reserves?", a: "To work out your lease-up gap: the months your reserves don't cover. We use the low end of your cost range and the high end of your reserves, so it never overstates." },
      { q: "Is the score a forecast?", a: "No. It scores where your plan's numbers come from, not the house or the market. A forecast on your address is a separate, free step in RoomIQ." },
      { q: "Do I need an address?", a: "No. The scorecard works before you have a house. If you do have one, the free forecast in RoomIQ runs on it." },
      { q: "Does RoomIQ check zoning or financing?", a: "No. Rules on unrelated adults sharing a home differ by city, and many loans use whole-home rent. Your report says what to ask the city, a lender and an insurer. Not legal advice." },
      { q: "Will you call me?", a: "Only if you book a walkthrough. Your report comes by email either way." },
      { q: "What do you do with my answers?", a: "We use them to build your report and to follow up by email. We never show your answers or your house in public. Unsubscribe any time." }
    ],
    button: "Start the scorecard"
  },
  footerCta: {
    h2: "See your first six months before you buy.",
    sub: "Eleven taps, about a minute, free.",
    button: "Score my deal"
  },

  /* ---------- Shared furniture ---------- */
  legal: {
    // The notice at collection under each form. {button} is the form's own button label, so the notice names the exact
    // button that signals agreement
    notice: "By tapping {button}, you agree to our {terms} and acknowledge our {privacy}, which explains what we collect and how we use it.",
    noticeMeta: "Unless you opt out, we also tell Meta when a scorecard is finished, to measure our ads. {choices}",
    noticeSms: "Texts follow our {sms}.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    choices: "Your privacy choices",
    sms: "SMS terms",
    newTab: "(opens in a new tab)"
  },
  cookie: {
    text: "We use cookies to measure our ads, only if you allow it. {more}",
    more: "Privacy Policy",
    allow: "Allow",
    decline: "Decline"
  },
  footer: {
    line: "RoomIQ is room-by-room underwriting for rent-by-the-room investors. The houses in our pictures and examples are made up.",
    master: "See how RoomIQ works",
    links: [
      { key: "terms", label: "Terms" },
      { key: "privacy", label: "Privacy" },
      { key: "choices", label: "Privacy choices" }
    ],
    cookieSettings: "Cookie settings"
  },
  // The copy is written for the instant delivery (site.reportDelivery "instant"): nothing to swap
  instant: {}
};

// Every wording, for the claim rules (tools/copy-lint.mjs); the pages use the one in force
export const ALL = LANDING;
export default forDelivery(LANDING, SITE.reportDelivery);
