// The results page (spec 2, "The results page"): the result that shows right after the quiz, and again at
// /results/<token> from the score email. Fields in braces are filled per visitor by lib/scoring.mjs.
// The deepener page (/sharpen/<token>) and the walkthrough booking's words live here too.
import SITE from "./site.mjs";
import CHECKS from "./checks.mjs";
import { forDelivery } from "../lib/delivery.mjs";

const RESULTS = {
  header: {
    thanks: "Thanks, {first_name}.",
    name: "Your First Deal Risk Scorecard",
    email: "Your full report is on its way to {email} as a PDF.",
    // A returning visitor (from the score email) sees their result without the contact line
    returning: "Your report was emailed to you as a PDF. Open it below any time."
  },
  score: {
    label: "Deal Readiness Score: {score}/100, {tier}. Higher is better.",
    intro: "Your Deal Readiness Score measures how much of your plan rests on evidence you can check, across five areas. It doesn't grade the house or the market. A low score means some numbers are borrowed: a typed rent, an assumed fill time. Each one can be checked before you make an offer."
  },

  // The lease-up gap panel: exactly one variant shows, chosen by invisibleOf() (spec 1, section 4)
  invisible: {
    gap: "At your numbers, your reserves run out {uncovered_months} before the rooms fill. That's at least {gap} of costs with no cushion behind it.",
    gapMath: "{cost} a month × ({fill_months} to fill, minus {reserve_months} of reserves) = {gap}. We used the low end of your cost range and the high end of your reserves.",
    exact: "At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with nothing to spare. Each month past your plan costs at least {cost}.",
    exactMath: "{cost} a month × {fill_months} to fill = {exposure}, against {reserve_months} of reserves. We used the low end of your cost range.",
    covered: "At your numbers, your reserves cover the {fill_months} you expect lease-up to take, with {spare_months} to spare. Each month past your plan costs at least {cost}.",
    coveredMath: "{cost} a month × {fill_months} to fill = {exposure}, against {reserve_months} of reserves. We used the low end of your cost range.",
    costOnly: "At your numbers, lease-up costs you at least {exposure} before the rooms fill. You weren't sure how long your reserves would last, so check them against that number.",
    costOnlyMath: "{cost} a month × {fill_months} to fill = {exposure}. We used the low end of your cost range.",
    perMonth: "At your numbers, every month the rooms sit empty costs you at least {cost}. Your plan doesn't say yet how many months lease-up will take, and that is the number to find.",
    perMonthMath: "We used the low end of your cost range: {cost} a month before any rent comes in.",
    monthsShort: "Your reserves cover {reserve_months} of the {fill_months} you expect lease-up to take. The other {uncovered_months} have no cushion behind them.",
    monthsCovered: "Your reserves cover the {fill_months} you expect lease-up to take. Work out your monthly carrying cost next: it turns months into dollars.",
    none: "You're not sure yet what the house will cost each month while rooms fill, or how long that takes. That's common on a first deal, and your report starts there.",
    fixFirst: "Fix first: {bottleneck}. {bottleneck_line}",
    // The six-month strip over the number (spec 1, section 4): left out when the lease-up months are not sure
    strip: "Your first six months, as you plan them.",
    stripUnsure: "",
    month: "Month {n}",
    legend: { covered: "Lease-up, covered by reserves", uncovered: "Lease-up, not covered", unknown: "Lease-up", full: "Rooms full, as planned" },
    notForecast: "Your own numbers, not a forecast: rooms that fill sooner bring rent in sooner."
  },

  summary: "Your five scores show where your plan rests on evidence and where it borrows. Start with the area marked Fix first, because the others follow from it. One area fixed well does more than five nudged.",
  areasTitle: "Your five areas",

  // Area cards: Low (0 to 39), Medium (40 to 69), High (70 to 100) (spec 1, section 6)
  cards: {
    rent: {
      low: "Your rent per room is a borrowed number: a guess, a platform's calculator or a whole-home rent split by bedrooms. Every figure after it, from cash flow to reserves, inherits the guess. The fix is a short list of rooms near the house, by bath type, with how fast they filled. It's the first thing to check before an offer.",
      medium: "Your rent comes from real room listings, which is a good start. But an asking rent is what a room hopes for, not what it filled at, and listings mix private and shared baths. Keep the rooms that actually filled, split them by bath type, and price each of your rooms from its own group.",
      high: "Your rent comes from rooms nearby that filled, which is the evidence most first deals skip. Keep it current, because rents move with new supply and the seasons. Before the offer, check that your comps sit near the house and match each room's bath type and size."
    },
    fill: {
      low: "You don't know how fast rooms fill near the house, so your lease-up months are a guess. The costs start on day one, and the rent arrives room by room. An assumed vacancy rate can't tell you whether filling takes three weeks or three months. Watching real rooms nearby can.",
      medium: "You have a sense of how rooms fill, from stories, forums or a market report. Those describe a market, not the street the house is on, and rooms a few miles apart can fill at different speeds. Check how comparable rooms near the house filled, and set your lease-up months from that.",
      high: "Your fill time comes from how comparable rooms nearby actually filled. That makes your lease-up months, and the reserves sized from them, something you can defend. Watch the month you launch in: the same room can fill faster or slower depending on the season."
    },
    supply: {
      low: "You don't know how many co-living homes compete near the house. Supply nearby decides how hard your rooms will be to fill and what they can ask. A street with many open rooms and falling rents needs a different plan from one with a few full homes. Count it before you buy.",
      medium: "You've counted the listings, which many first-time buyers never do. A count doesn't say how full those homes are, or whether more are opening. Note the open rooms in each home, and any new listings or rent cuts. That tells you whether the pocket is filling up or already crowded.",
      high: "You know the competition: how many homes, and roughly how full they are. Keep watching, because supply keeps changing after you buy. New homes opening nearby, or rooms cutting their rents, are the early signs to adjust your plan."
    },
    mix: {
      low: "You haven't priced the bath mix yet. Private-bath and shared-bath rooms rent and fill differently, so two houses with the same bedroom count can earn very different money. Deciding the mix before you see those spreads is guessing at the biggest lever you control. Compare private and shared-bath rents nearby before you plan any work.",
      medium: "You've made a call on the bathrooms, but not from the rooms nearby. Adding a bath because it seems worth it, or keeping the ones you have, can both be right. The rents of private and shared-bath rooms nearby tell you which. Price the house both ways before you book the work.",
      high: "Your bath mix comes from what private and shared-bath rooms nearby rent for. That's the structural part of the plan most first deals guess. Before the offer, check that the room count also fits the city's rule on unrelated adults sharing a home."
    },
    reserves: {
      low: "You haven't planned for a slow lease-up. If rooms take longer to fill than you expect, the costs keep running while the rent doesn't. Cutting rents is the usual reflex, and a cut room keeps the lower rent after it fills. Size your reserves from how comparable launches nearby filled, before you make the offer.",
      medium: "You have some reserves, but they aren't sized from evidence. A few weeks may cover a quick lease-up and not a slow one. Work out your monthly carrying cost, multiply it by the months lease-up could take, and set the reserves from that number.",
      high: "Your reserves are sized from how comparable launches nearby filled, which is how experienced operators plan. Keep a slower case in your deal math. Revisit it whenever rents or supply near the house change."
    }
  },

  // The recommendation under each area card (the first sentence is set in bold)
  recommendations: {
    low: "Start here. This is where your plan borrows the most, and it can be checked before an offer.",
    medium: "Tighten it. The evidence is partly there; the next step is the rooms near the house.",
    high: "Protect it. Recheck it before the offer, because rents and supply keep moving."
  },
  bandLabels: { low: "Low", medium: "Medium", high: "High" },

  // The next-step cards, in order (spec 2): by tier, and for call-only visitors. "forecast" becomes "market" outside the
  // covered markets. Never a checkout card (site.offer undecided)
  ctaOrder: ["report", "forecast", "sharpen", "call", "service"],
  ctaOrderByTier: {
    beginner: ["report", "forecast", "sharpen", "call", "service"],
    intermediate: ["forecast", "report", "sharpen", "call", "service"],
    advanced: ["call", "forecast", "report", "sharpen", "service"]
  },
  ctaOrderCallOnly: ["call", "report", "sharpen", "service"],
  cta: {
    forecast: {
      h3: "Run a free forecast on your address",
      body: "Type the address and RoomIQ estimates monthly room revenue from observed rooms nearby, with its formula, its comps and how sure it is. Free plan: no card needed, three forecasts a month.",
      button: "Run my free forecast"
    },
    market: {
      h3: "Look up the evidence in your market",
      body: "Look up any US city, ZIP or metro in RoomIQ and see how strong the evidence is for each. A coverage check runs before any estimate.",
      button: "Look up my market"
    },
    sharpen: {
      h3: "Sharpen your report",
      body: "Answer {n} more quick questions and your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. About a minute.",
      bodyN: "Answer {n} more quick questions and your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ. About a minute.",
      button: "Add {n} answers",
      buttonN: "Add {n} answers",
      done: "Your report will use your {n} extra answers."
    },
    service: {
      h3: "See how RoomIQ shows its working",
      body: "Every RoomIQ estimate prints its formula, its comps and how sure it is, and thin evidence is labeled Thin. See it on demo data first.",
      button: "See how RoomIQ works"
    },
    call: {
      h3: "Book a 20-minute walkthrough",
      body: "Bring an address. We'll run the forecast on it together and read what the evidence covers, and what it doesn't. Pick a day and a time window.",
      button: "Pick a time"
    },
    checkout: {
      h3: "Get started",
      body: "Start now.",
      button: "Get started"
    }
  },

  // The walkthrough booking (the call step: the next five business days, never the same day, no weekends)
  booking: {
    h3: "Book your walkthrough",
    lead: "A 20-minute walkthrough on your address with RoomIQ's founder. Pick a day and a time window, and we'll email you a video link.",
    day: "Pick a day",
    window: "Pick a time window (your time)",
    button: "Book my walkthrough",
    pickDay: "Pick a day for the walkthrough.",
    pickWindow: "Pick a time window.",
    phoneError: "Please enter a 10-digit US phone number.",
    consentError: "Tick the box so we can reach you about the walkthrough.",
    sending: "Booking your walkthrough",
    failed: "That didn't go through. Check your connection and try again.",
    done: "You're booked: {day}, {window}.",
    doneLine: "We'll email a video link for {hours}, your time, and call {phone} if the link doesn't work. Bring the address and the listing if you have them.",
    doneEmail: "We've emailed the details to {email}. If the time stops working, reply and we'll move it.",
    calendar: "Add to calendar",
    calendarTitle: "RoomIQ: your 20-minute walkthrough",
    calendarBody: "A 20-minute walkthrough with RoomIQ on your address and your First Deal Risk Scorecard. We'll email you a video link.",
    next: "While you wait: sharpen your report (optional, {n} taps)"
  },

  // The deepener page (/sharpen/<token>)
  deepener: {
    title: "Sharpen your report",
    lead: "{n} more quick questions, about a minute. Your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ.",
    leadN: "{n} more quick questions, about a minute. Your report goes deeper: rent by room, occupancy, new supply, the room count, your deal math and two checks outside RoomIQ.",
    label: "Sharpen your report",
    button: "Add to my report",
    sending: "Adding your answers",
    done: "Done. Your report will use your {n} extra answers.",
    doneLine: "Your sharper report is on its way to your inbox, as a PDF.",
    already: "You've already added your extra answers. Your report will use them.",
    missing: "We couldn't find that scorecard. Open the link in your score email again, or take the scorecard.",
    toResults: "Back to my score",
    toCall: "Book a 20-minute walkthrough"
  },

  // The three checks outside RoomIQ, on the results page and in the report (content/checks.mjs)
  checks: CHECKS,

  // The rule line, under every result
  ruleLine: "Zoning, financing and insurance sit outside RoomIQ. This is not legal, lending or financial advice.",
  unsubscribe: {
    h: "Unsubscribe from RoomIQ's scorecard emails",
    body: "You won't get another email from us about your scorecard.",
    button: "Unsubscribe",
    done: "Done. You won't get another email from us about your scorecard.",
    again: "Changed your mind? Take the scorecard again and tick the box."
  },
  page404: {
    h: "That page isn't here.",
    body: "The link may be old. Start the scorecard, or see how RoomIQ works.",
    button: "Score my deal"
  },
  notFound: "We couldn't find that result. Open the link in your score email again, or take the scorecard.",
  retake: "Take the scorecard",

  // The first card: the report, emailed and here
  report: {
    h3: "Your report",
    body: "Your full report is on its way to your inbox as a PDF. Open it here any time: your score, your first six months, three checks outside RoomIQ, the method and a 30-day plan.",
    button: "Open my report",
    pdf: "Download the PDF"
  },

  // The copy is written for the instant delivery (site.reportDelivery "instant"): nothing to swap
  instant: {}
};

// Every wording, for the claim rules (tools/copy-lint.mjs); the pages use the one in force
export const ALL = RESULTS;
export default forDelivery(RESULTS, SITE.reportDelivery);
