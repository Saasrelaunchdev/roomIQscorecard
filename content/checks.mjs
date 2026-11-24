// "Three checks RoomIQ can't do for you" (spec 3, the checklist page; spec 2, the results card): the city's rule on
// unrelated adults sharing a home, financing on room income, and insurance for renting by the room. I1's unscored
// checklist, shown to everyone, by market (spec 1, G2), and marked with the deepener's answers (C1, C2) when given.
//
// The city rules are definitions only, as each city's code publishes them, from GTM-BRIEF.md "External constraints"
// (the deep research, checked 2026-11-11). An address-level answer needs the city or an attorney: every line says so.
// The insurance line is the GTM's: the one rent-by-the-room program the research found excludes Houston and the
// Dallas-Fort Worth counties. Results and report both read this file.
export default {
  title: "Three checks RoomIQ can't do for you",
  lead: "RoomIQ shows the evidence for the house. These three decide whether the plan is allowed, financed and insured.",
  notAdvice: "Not legal, lending or insurance advice.",

  zoning: {
    title: "The city's rule on unrelated adults",
    byMarket: {
      dfw: "Dallas allows a household of no more than four people unrelated to the head of the household (Dallas code §51A-2.102(36)). Fort Worth allows no more than five unrelated people as one housekeeping unit, and renting rooms separately may count as a different use (Fort Worth code §9.101).",
      houston: "Houston: lodging three or more people unrelated to the owner makes a lodging facility, which needs a permit (Houston code §28-601 and following). No citywide cap on unrelated adults was found.",
      atlanta: "Atlanta: no more than six people may live together unless all are related, with exceptions for roomers and boarders (Atlanta code §16-29.001(10)(b)).",
      orlando: "Orlando publishes no cap on unrelated adults that the research found (Land Development Code, Chapter 58). Confirm it with the City's zoning office.",
      jacksonville: "Jacksonville: no household of more than five people unless all are related (Jacksonville code §656.1601).",
      phoenix: "Phoenix: no more than five people, who need not be related, as one housekeeping unit. Six or more paying to live there make a boarding house (Phoenix zoning ordinance §202).",
      lasvegas: "Las Vegas: no more than four unrelated people as one housekeeping unit; the text the research found may be dated (Las Vegas code §19.20.020).",
      other: "Rules on unrelated adults sharing a home differ by city, and some cities treat renting rooms separately as a different use.",
      undecided: "Rules on unrelated adults sharing a home differ by city. Check the rule for every market on your shortlist."
    },
    ask: "Read the rule in the city code, then confirm it for the address with the city or an attorney.",
    asOf: "As each city's code publishes it, checked in November 2026."
  },
  financing: {
    title: "Financing on room income",
    body: "Many loans are sized on the appraised whole-house rent, not on room rents.",
    ask: "Talk early to a lender who knows room rentals, and bring your rent per room with the rooms behind it."
  },
  insurance: {
    title: "Insurance for renting by the room",
    body: "Insurance is not a given: some insurers decline homes rented by the room.",
    byMarket: {
      dfw: "The one rent-by-the-room insurance program the research found excludes the Dallas-Fort Worth counties.",
      houston: "The one rent-by-the-room insurance program the research found excludes Houston."
    },
    ask: "Get a quote that covers renting by the room before you make the offer."
  },

  // The deepener's answers, as a status on each check (C1 zoning, C2 financing). No answer: the check shows "To do"
  status: {
    labels: { done: "Done", partly: "Started", todo: "To do" },
    zoning: {
      notyet: { mark: "todo", t: "You haven't checked it yet." },
      asked: { mark: "todo", t: "You asked around. Hearsay isn't the rule: read it in the code." },
      summary: { mark: "partly", t: "You read a summary online. Summaries can be dated: read the code itself." },
      code: { mark: "partly", t: "You checked the city code. Confirm it for the address with the city or an attorney." },
      confirmed: { mark: "done", t: "You confirmed it with the city or an attorney." }
    },
    financing: {
      unsure: { mark: "todo", t: "You're not sure yet how you'll finance the house." },
      wholehome: { mark: "todo", t: "You plan a loan sized on whole-home rent, which may not count your room income." },
      cash: { mark: "done", t: "You plan to pay cash, so no lender sizes the loan." },
      roomlender: { mark: "done", t: "You've briefed a lender who works with room rentals." }
    },
    noAnswer: "Add your answers in Sharpen your report to mark this check."
  }
};
