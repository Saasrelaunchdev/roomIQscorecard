// A sample scorecard: the worked example from spec 1, section 11 (Jordan, a made-up first-time investor looking at
// houses in Atlanta: asking rents from listings, an assumed vacancy rate, a count of listings, no bath mix yet, a few
// weeks of reserves; $2,000 to $3,000 a month, about 3 months to fill, 1 month or less of reserves) with the deepener's
// answers. Used by the tests, by tools/render-sample.mjs and by the admin's test email (Settings, "Send a test"). Not a
// real person or house: never use it as proof of anything.
export const HERO = { stage: "looking", market: "atlanta", rentsource: "listings", fillsource: "vacancy", supply: "counted", bathmix: "notyet", slowplan: "weeks", carry: "2to3k", fillmonths: "m3", reserves: "m1" };
export const DEEP = { rentperroom: "split", rentcomps: "few", occsource: "rule", launch: "whenever", newsupply: "think", pricedrops: "unsure", roomcount: "max", garage: "na", dealmath: "mine", stress: "vacancy", zoning: "notyet", financing: "wholehome" };
// No outside data in this funnel (site.enrichment false)
export const PUBLIC = {};
export const ROW = {
  id: "00000000-0000-4000-8000-000000000001", token: "SAMPLEtokenSAMPLEtokenSAMPLE", created_at: "2026-11-22T15:00:00.000Z", status: "booked",
  email: "investor@example.com", first_name: "Jordan", last_name: "", company: "", city: "Atlanta", profiles: null, trade: "looking",
  answers: HERO, deepener: DEEP, deepened_at: "2026-11-22T15:05:00.000Z", public_data: PUBLIC,
  booking: { day: "2026-11-24", window: "midday", phone: "4045550134", address: "123 Example Street (made up)", consentPhone: true, consentText: false },
  report: {}
};
