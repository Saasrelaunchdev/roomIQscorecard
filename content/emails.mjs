// The emails. Plain words from a person; replies welcome (they go to SCORECARD_REPLY_TO, or the sender). The claim rules
// apply here too (tools/copy-lint.mjs). Placeholders are filled by api/_lib/emails.mjs; a line whose placeholder has no
// value is left out, so one template covers every variant.
export default {
  // Right after the quiz (Deliverable 2, "The score email"). Lines 1 to 7 are the spec's, in order; "Start this week"
  // carries the first quick win (Deliverable 1, section 13: the score email has "the first"), and the last line links
  // back to the result.
  score: {
    subject: "Your Visibility Score: {score}/100",
    preheader: "{tier}. Higher is better.",
    lines: [
      "Hi {firstName},",
      "Thanks for taking the Invisible Work Scorecard. Your Visibility Score is {score}/100: {tier}. Higher is better.",
      "{invisible_line}",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "Start this week: {quick_win}.",
      "Your full report is next. We'll compare {business} with the top three for {service} in {city} and email it to you within one business day.",
      "Want a sharper report? Answer 8 more quick questions here: {deepener_link}",
      "Want to walk through it together? Reply with a good time for a 15-minute call.",
      "Your score, any time: {results_link}"
    ],
    // When branching shows fewer than eight deepener questions
    deepenerN: "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
    // Already deepened (sent again from the admin): no deepener line
    button: "See my score"
  },

  // Right after the quiz when the PDF report goes with it (site.reportDelivery "instant", the owner's request of
  // 2026-11-22): the score email's lines, the report attached and linked, and what the team adds next. {report_line}
  // is reportAttached, or reportLinked when the PDF could not be printed.
  scoreReport: {
    subject: "Your Visibility Score: {score}/100, and your report",
    preheader: "{tier}. Your full report is attached as a PDF.",
    lines: [
      "Hi {firstName},",
      "Thanks for taking the Invisible Work Scorecard. Your Visibility Score is {score}/100: {tier}. Higher is better.",
      "{invisible_line}",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "Start this week: {quick_win}.",
      "{report_line}",
      "It covers your four areas, the Visible Work Method that closes the gaps, how Rempo would run it for {business}, and a 30-day plan.",
      "Next, someone on our team will compare {business} with the top three for {service} in {city}, and email you the update within one business day.",
      "Want a sharper report? Answer 8 more quick questions here: {deepener_link}",
      "Want to walk through it together? Reply with a good time for a 15-minute call."
    ],
    deepenerN: "Want a sharper report? Answer {n} more quick questions here: {deepener_link}",
    reportAttached: "Your full report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "Your full report is online here: {report_link}",
    button: "Open my report"
  },

  // After the deepener, in the instant delivery: the report again, with the extra answers in it
  sharper: {
    subject: "Your sharper report: {score}/100",
    preheader: "Updated with your {n_answered} extra answers.",
    lines: [
      "Hi {firstName},",
      "Thanks for the {n_answered} extra answers. Your report now uses all of them: your Visibility Score is {score}/100, {tier}.",
      "Fix first: {bottleneck}. {bottleneck_line}",
      "{report_line}",
      "{call_line}"
    ],
    reportAttached: "The updated report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "The updated report is online here: {report_link}",
    button: "Open my report"
  },

  // When the team sends the checked update in the instant delivery: the top three added to a report the owner has
  reportUpdate: {
    subject: "Your report, now with the top three near you",
    preheader: "{business}, next to the top three for {service} in {city}.",
    lines: [
      "Hi {firstName},",
      "Your report for {business} has been updated. {checker} at Rempo read your public Google profile and the top three for {service} in {city}, and added them.",
      "{report_line}",
      "New in this version: how {business} compares with the top three, measure by measure.",
      "{call_line}"
    ],
    reportAttached: "The updated report is attached as a PDF, and it's online here: {report_link}",
    reportLinked: "Read the updated report here: {report_link}",
    button: "Read my report"
  },

  // When the team approves and sends the report
  report: {
    subject: "Your Invisible Work Scorecard report is ready",
    preheader: "{business}, next to the top three for {service} in {city}.",
    lines: [
      "Hi {firstName},",
      "Your report for {business} is ready. {checker} at Rempo checked it before it came to you.",
      "Read it here: {report_link}",
      "Or download the PDF: {pdf_link}",
      "{pdf_attached}",
      "It starts with your Visibility Score, {score}/100, and the work that never reaches Google. Then how you compare with the top three for {service} in {city}, and a 30-day plan you can run yourself.",
      "{call_line}"
    ],
    // When the PDF is attached to this email ({pdf_attached}); without it, the line is left out
    attached: "The PDF is attached to this email too.",
    callBooked: "We'll walk through it on your call: {day}, {window}.",
    callOpen: "Want to walk through it together? Pick a time for a 15-minute call: {results_link}",
    button: "Read my report"
  },

  // Right after the call step (the Meta page's call email, for this scorecard)
  call: {
    subject: "You're booked: {day}, {window}",
    preheader: "A 15-minute call to walk through your report.",
    lines: [
      "Hi {firstName},",
      "You're booked for a 15-minute call on {day}, {window} ({hours}, your time). We'll call {phone}.",
      "Can you reply YES to confirm?",
      "We'll walk through your report for {business} and what we'd run for you. Bring whoever runs the office: it saves you passing it all on later.",
      "If the time stops working, reply and we'll move it."
    ]
  },

  signoff: "The Rempo team",
  unsubscribe: "Don't want these emails? Unsubscribe: {unsubscribe_link}",
  privacy: "Privacy Policy: {privacy_link}",

  // The team's notices (email and Slack): internal, not sent to prospects
  team: {
    lead: "New scorecard: {business}, {city}. {score}/100, {tier}.",
    deepened: "Deepener answered: {business}, {city}. Report score {score}/100.",
    call: "Call booked: {business}, {city}. {day}, {window} ({hours}, their time). {phone}",
    sent: "Report sent: {business}, {city}, checked by {checker}.",
    // The instant delivery: what the owner received with the score
    pdfSent: "The PDF report went to the owner with the score.",
    pdfFailed: "The PDF could not be printed ({reason}); the owner got the report's link instead.",
    test: "Test: the scorecard's emails reach this address. This is the sample report, for a made-up shop.",
    digest: "{count} reports are waiting. The oldest came in {age} ago.",
    // The instant delivery: the owners have their report; the top-three update is what waits
    digestInstant: "{count} reports are waiting for the top three. The oldest came in {age} ago.",
    notSaved: "NOT SAVED to the database ({reason}). Everything is in this notice."
  }
};
