// The emails. Plain words from a person; replies welcome (they go to SCORECARD_REPLY_TO, or the sender). The claim rules
// apply here too (tools/copy-lint.mjs). Placeholders are filled by api/_lib/emails.mjs; a line whose placeholder has no
// value is left out, so one template covers every variant.
//
// The funnel sends these through Resend. The GTM's follow-up emails on days 2, 5 and 8 run in Loops, fed by the
// webhook (docs/DECISIONS.md 13); their words are in docs/spec/2-landing-and-results-pages.md, section 6.
export default {
  // Right after the quiz, in the "checked" delivery (not used while site.reportDelivery is "instant")
  score: {
    subject: "Your Deal Readiness Score: {score}/100",
    preheader: "{tier}. Higher is better.",
    lines: [
      "Hi {firstName},",
      "Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score is {score}/100: {tier}. Higher is better.",
      "{invisible_line}",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "Start this week: {quick_win}.",
      "Your full report is on its way to you by email.",
      "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
      "Your score, any time: {results_link}"
    ],
    deepenerN: "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
    button: "See my score"
  },

  // Right after the quiz, with the PDF report (site.reportDelivery "instant"): the GTM's day 0 email, rewritten for the
  // lease-up gap. {report_line} is reportAttached, or reportLinked when the PDF could not be printed. {forecast_line} is
  // the free forecast in a covered market, or the market lookup outside one
  scoreReport: {
    subject: "Your Deal Readiness Score: {score}/100, and your report",
    preheader: "{tier}. Your full report is attached as a PDF.",
    lines: [
      "Hi {firstName},",
      "Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score is {score}/100: {tier}. Higher is better.",
      "{invisible_line}",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "Start this week: {quick_win}.",
      "{report_line}",
      "It covers your five areas, your first six months, three checks RoomIQ can't do for you, the Room-by-Room Underwrite and a 30-day plan.",
      "{forecast_line}",
      "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
      "Want to go through it on your address? Book a 20-minute walkthrough: {booking_link}"
    ],
    deepenerN: "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
    reportAttached: "Your full report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "Your full report is online here: {report_link}",
    forecastCovered: "When you have an address, run a free forecast on it: {forecast_link} (Free plan, no card needed, three forecasts a month).",
    forecastOutside: "See how strong the evidence is in your market: {forecast_link}",
    button: "Open my report"
  },

  // After the deepener, in the instant delivery: the report again, with the extra answers in it
  sharper: {
    subject: "Your sharper report: {score}/100",
    preheader: "Updated with your {n_answered} extra answers.",
    lines: [
      "Hi {firstName},",
      "Thanks for the {n_answered} extra answers. Your report now uses all of them: your Deal Readiness Score is {score}/100, {tier}.",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "{report_line}",
      "{call_line}"
    ],
    reportAttached: "The updated report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "The updated report is online here: {report_link}",
    button: "Open my report"
  },

  // When the team sends an updated report from the admin (no enrichment in this funnel, so rarely used)
  reportUpdate: {
    subject: "Your report, updated",
    preheader: "Your First Deal Risk Scorecard report, updated by our team.",
    lines: [
      "Hi {firstName},",
      "{checker} at RoomIQ has updated your First Deal Risk Scorecard report.",
      "{report_line}",
      "{call_line}"
    ],
    reportAttached: "The updated report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "Read the updated report here: {report_link}",
    button: "Read my report"
  },

  // When the team approves and sends the report (the "checked" delivery; not used while delivery is "instant")
  report: {
    subject: "Your First Deal Risk Scorecard report is ready",
    preheader: "Your score, your first six months and a 30-day plan.",
    lines: [
      "Hi {firstName},",
      "Your First Deal Risk Scorecard report is ready.",
      "Read it here: {report_link}",
      "Or download the PDF: {pdf_link}",
      "{pdf_attached}",
      "It starts with your Deal Readiness Score, {score}/100, and your first six months. Then three checks RoomIQ can't do for you, and a 30-day plan you can run yourself.",
      "{call_line}"
    ],
    // When the PDF is attached to this email ({pdf_attached}); without it, the line is left out
    attached: "The PDF is attached to this email too.",
    callBooked: "We'll go through it on your walkthrough: {day}, {window}.",
    callOpen: "Want to go through it on your address? Book a 20-minute walkthrough: {results_link}",
    button: "Read my report"
  },

  // Right after the walkthrough is booked
  call: {
    subject: "You're booked: {day}, {window}",
    preheader: "A 20-minute walkthrough on your address.",
    lines: [
      "Hi {firstName},",
      "You're booked for a 20-minute walkthrough on {day}, {window} ({hours}, your time).",
      "We'll email you a video link before then, and call {phone} if the link doesn't work.",
      "Bring the address and the listing if you have them. We'll run the forecast on it together and read what the evidence covers, and what it doesn't.",
      "If the time stops working, reply and we'll move it."
    ]
  },

  signoff: "The RoomIQ team",
  unsubscribe: "Don't want these emails? Unsubscribe: {unsubscribe_link}",
  privacy: "Privacy Policy: {privacy_link}",

  // The team's notices (email and Slack): internal, not sent to prospects. {business} is the lead's first name and
  // {city} the market of the deal (this quiz asks for no business or city)
  team: {
    lead: "New scorecard: {business}, {city}. {score}/100, {tier}.",
    deepened: "Deepener answered: {business}, {city}. Report score {score}/100.",
    call: "Walkthrough booked: {business}, {city}. {day}, {window} ({hours}, their time). {phone}",
    sent: "Report sent: {business}, {city}, checked by {checker}.",
    // The instant delivery: what the investor received with the score
    pdfSent: "The PDF report went to the investor with the score.",
    pdfFailed: "The PDF could not be printed ({reason}); the investor got the report's link instead.",
    test: "Test: the scorecard's emails reach this address. This is the sample report, for a made-up investor.",
    digest: "{count} reports are waiting. The oldest came in {age} ago.",
    digestInstant: "{count} reports are waiting for the team. The oldest came in {age} ago.",
    notSaved: "NOT SAVED to the database ({reason}). Everything is in this notice."
  }
};
