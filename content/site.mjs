// Site settings, read by the build (the pages), by the server (the API, emails, the report) and by the admin.
// null means "not decided yet": the page leaves the thing out. Fill a value, run `node tools/build.mjs`, commit.
// Secrets never go here: they are Vercel environment variables (README.md, "Settings").
export default {
  name: "RoomIQ",
  product: "RoomIQ: room-by-room underwriting for coliving investors",

  // This scorecard's own address once its domain points at Vercel, with no path (for example
  // "https://score.roomiq.io"). Sets canonical links, the share image's full URL and the links in emails. Until then
  // the server uses the address the request came in on.
  url: null,

  // The main site (the production landing page, once it serves roomiq.io): the "How RoomIQ shows its working" card and
  // the footer link. The landing page greets visitors who arrive with src=scorecard.
  masterUrl: "https://roomiq.io",
  // The app's free forecast (the Free plan: no card, three forecasts a month), as every "Run a free forecast" button on
  // the landing page links to it. The results page adds src=scorecard and the visitor's campaign values.
  forecastUrl: "https://roomiq.io/dashboard",

  // RoomIQ's legal pages (the landing page's footer links). No cookie, SMS or accessibility page is published, so the
  // cookie notice points to the privacy policy and the walkthrough offers no text messages (booking.consentText null).
  legal: {
    hub: "https://roomiq.io/privacy",
    terms: "https://roomiq.io/terms",
    privacy: "https://roomiq.io/privacy",
    cookies: "https://roomiq.io/privacy",
    sms: null,
    choices: "https://roomiq.io/privacy",
    accessibility: null
  },
  // The version of the consent and policy wording, stored with every lead. RoomIQ publishes none yet: set it to the
  // date of roomiq.io's privacy policy (YYYY-MM-DD) once known (docs/DECISIONS.md 20).
  noticeVersion: null,

  // Legal name and city for the footer and the emails, for example "RoomIQ Inc., Austin, Texas"
  company: null,
  // The postal address commercial email must carry (CAN-SPAM). The prospect emails add it when set: set it before the
  // first email goes out (docs/OPERATIONS.md)
  postalAddress: null,

  // Kept for the template's "checked" delivery; with instant delivery and no enrichment, nothing waits for a person
  reportTurnaround: "within one business day",
  // How the report reaches the buyer: "instant", the PDF report emailed the moment the scorecard is finished, built from
  // the answers (docs/DECISIONS.md 12)
  reportDelivery: "instant",
  // No outside data is added after the scorecard: the next step is the buyer's own free forecast
  enrichment: false,
  // The report's checker when the admin leaves the field empty (not shown with instant delivery)
  defaultChecker: null,

  // No checkout in this funnel: Pro starts inside the product. No price, trial or term appears anywhere in the funnel
  offer: { decided: false, checkoutUrl: null },

  // The walkthrough (the call step): a 20-minute video call with the founder, the next 5 business days, never the same
  // day, no weekends, three windows in the visitor's time (docs/DECISIONS.md 14)
  booking: {
    days: 5,
    windows: [
      { v: "morning", label: "Morning", hint: "8 to 11 am", start: 8, end: 11 },
      { v: "midday", label: "Midday", hint: "11 am to 2 pm", start: 11, end: 14 },
      { v: "afternoon", label: "Afternoon", hint: "2 to 5 pm", start: 14, end: 17 }
    ],
    minutes: 20,
    phone: { name: "phone", label: "Best number to reach you", prefix: "+1", autocomplete: "tel-national", inputmode: "tel" },
    // Consent in RoomIQ's name and for this number (a written agreement to be called)
    consentPhone: { name: "consentPhone", label: "RoomIQ may call me at this number about my walkthrough.", required: true },
    // No texts: RoomIQ publishes no SMS terms (set a box here, and legal.sms, to offer them)
    consentText: null,
    // The house to walk through, optional: typed by the buyer, kept with the booking, never shown in public
    address: { name: "address", label: "The house's address, if you have one (optional)", autocomplete: "street-address", max: 200 }
  },

  // Advertising and analytics tools load only when an id is set, only after the visitor taps Allow in the cookie
  // notice ("opt-in"), and never with Global Privacy Control
  metaPixelId: null,
  clarityId: null,
  trackingConsent: "opt-in",
  // The events Meta hears, as the GTM's event map names them (meta-launch ads_content.py EVENTS): the quiz opened for
  // the first time, and every completed scorecard (pixel and Conversions API, one event_id). Schedule goes only with a
  // qualified walkthrough booking. null turns an event off (docs/DECISIONS.md 10)
  metaEvents: { start: "ScorecardStart", complete: "ScorecardComplete", schedule: "Schedule", contentName: "scorecard" },

  // Where the page and the admin send things
  endpoints: { scorecard: "/api/scorecard", track: "/api/track", admin: "/api/admin" }
};
