// A sample scorecard: the worked example from Deliverable 1 (an HVAC shop, 16 to 40 jobs a week, $300 to $750 tickets,
// job software, one location) with its deepener answers, plus a made-up public profile for a made-up shop. Used by the
// tests, by tools/render-sample.mjs and by the admin's test email (Settings, "Send a test"). Not a real business: never
// use it as proof of anything.
export const HERO = { trade: "hvac", jobs: "16to40", asked10: "1to3", asks: "remember", newest: "1to3", replies: "some", ticket: "300to750", records: "fieldsoftware", profiles: "1" };
export const DEEP = { d1: "most", d2: "most", d3: "nothing", d4: "stops", d5: "drops", d6: "no", d7: "week", d8: "standard" };
export const PUBLIC = {
  search: { service: "HVAC", city: "Austin", date: "2026-11-22" },
  business: { rating: 4.6, count: 87, reviews90: 5, newestDays: 40, replied: 12, sampled: 30,
    checks: { hours: true, services: true, photos: false, description: false, categories: true },
    months: [6, 5, 7, 6, 2, 1, 2, 6, 7, 6, 5, 6] },
  top3: [
    { name: "Sample Shop One", rating: 4.8, count: 412, reviews90: 31, newestDays: 3, replied: 27, sampled: 30, checks: { hours: true, services: true, photos: true, description: true, categories: true } },
    { name: "Sample Shop Two", rating: 4.7, count: 268, reviews90: 22, newestDays: 5, replied: 24, sampled: 30, checks: { hours: true, services: true, photos: true, description: true, categories: true } },
    { name: "Sample Shop Three", rating: 4.9, count: 190, reviews90: 18, newestDays: 2, replied: 30, sampled: 30, checks: { hours: true, services: true, photos: true, description: true, categories: true } }
  ],
  themes: [{ theme: "a call that was not returned", count: 3 }],
  compare: "",
  monthsRead: "auto"
};
export const ROW = {
  id: "00000000-0000-4000-8000-000000000001", token: "SAMPLEtokenSAMPLEtokenSAMPLE", created_at: "2026-11-22T15:00:00.000Z", status: "booked",
  email: "owner@example.com", first_name: "Sam", last_name: "", company: "Maple Street Heating", city: "Austin", profiles: "1", trade: "hvac",
  answers: HERO, deepener: DEEP, deepened_at: "2026-11-22T15:05:00.000Z", public_data: PUBLIC,
  booking: { day: "2026-11-24", window: "midday", phone: "5125550134", consentPhone: true, consentText: false },
  report: { checker: "Dana" }
};
