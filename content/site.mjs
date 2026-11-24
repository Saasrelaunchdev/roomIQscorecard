// Site settings, read by the build (the pages), by the server (the API, emails, the report) and by the admin.
// null means "not decided yet": the page leaves the thing out. Fill a value, run `node tools/build.mjs`, commit.
// Secrets never go here: they are Vercel environment variables (README.md, "Settings").
export default {
  name: "RoomIQ",
  product: "Rempo: the Done For You Review Engine",

  // This scorecard's own address once its domain points at Vercel, with no path (for example
  // "https://scorecard.rempo.io"). Sets canonical links, the share image's full URL and the links in emails. Until then
  // the server uses the address the request came in on.
  url: null,

  // The master page (rempo.io): card 2 "See how we'd run it for you" and the footer link
  masterUrl: "https://roomiq.io",

  // The legal pages are the master page's (RempoLandingPage builds them into /legal). The forms link to them in the
  // notice at collection; the footer links to all of them.
  legal: {
    hub: "https://rempo.io/legal",
    terms: "https://rempo.io/legal/terms",
    privacy: "https://rempo.io/legal/privacy",
    cookies: "https://rempo.io/legal/cookies",
    sms: "https://rempo.io/legal/sms",
    choices: "https://rempo.io/legal/privacy-choices",
    accessibility: "https://rempo.io/legal/accessibility"
  },
  // The version of the consent and policy wording, stored with every lead. Keep it equal to noticeVersion in the
  // landing page's legal-src/settings.mjs.
  noticeVersion: "2026-11-08",

  // Legal name and city for the footer and the emails, for example "Rempo LLC, San Diego, California"
  company: null,
  // The postal address commercial email must carry (CAN-SPAM). The prospect emails add it when set.
  postalAddress: null,

  // When the report arrives (Deliverable 2: "within one business day, checked by a person")
  reportTurnaround: "within one business day",
  // How the report reaches the owner. "instant" (the owner's request of 2026-11-22): the PDF report is emailed the
  // moment the scorecard is finished, built from the answers; then a person reads the public Google profile and sends
  // the update with the top three, within reportTurnaround. "checked": no report until the team approves and sends
  // it (the first version). The pages, the emails and the report link follow this setting; rebuild after a change.
  reportDelivery: "instant",
  // Outside data a person adds after the scorecard (Rempo's: the lead's public Google profile next to the top three),
  // entered in the admin's profile form and sent as an update. false hides the form and the update; the report is then
  // built from the answers alone.
  enrichment: true,
  // The report's checker when the admin leaves the field empty ("Checked by {checker_first_name} at Rempo")
  defaultChecker: null,

  // The offer is undecided, so no price, guarantee or term appears anywhere. When decided: decided true, and the
  // checkout link (card 4 "Get started" joins the results page, never for call-only visitors).
  offer: { decided: false, checkoutUrl: null },

  // The call step (Meta PLAN.md, booking rules): the next 5 business days, never the same day, no weekends
  booking: {
    days: 5,
    windows: [
      { v: "morning", label: "Morning", hint: "8 to 11 am", start: 8, end: 11 },
      { v: "midday", label: "Midday", hint: "11 am to 2 pm", start: 11, end: 14 },
      { v: "afternoon", label: "Afternoon", hint: "2 to 5 pm", start: 14, end: 17 }
    ],
    minutes: 15,
    phone: { name: "phone", label: "Best number to call", prefix: "+1", autocomplete: "tel-national", inputmode: "tel" },
    // Consent in Rempo's name and for this number (a written agreement to be called). Texts: a separate, optional,
    // unticked box with what carriers check for (A2P 10DLC, CTIA)
    consentPhone: { name: "consentPhone", label: "Rempo may call me at this number about my report and Rempo's service.", required: true },
    consentText: { name: "consentText", label: "Rempo may text this number to confirm or move my call, up to 3 texts. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Not required to book.", required: false }
  },

  // Advertising and analytics tools load only when an id is set, only after the visitor taps Allow in the cookie
  // notice ("opt-in"), and never with Global Privacy Control. Meta is told about a Lead or a Schedule only when the
  // answers qualify (fit), the same pixel conditioning as the Meta page.
  metaPixelId: null,
  clarityId: null,
  trackingConsent: "opt-in",

  // Where the page and the admin send things
  endpoints: { scorecard: "/api/scorecard", track: "/api/track", admin: "/api/admin" }
};
