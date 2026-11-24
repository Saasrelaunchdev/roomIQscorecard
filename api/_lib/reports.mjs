// One place that turns a stored scorecard into its report: the model (lib/report-model.mjs) with the team's settings
// and the lead's own options, the HTML (lib/report-html.mjs) and the PDF (api/_lib/pdf.mjs). The submit, the deepener,
// the admin's Approve and send, its resend and its test email all use it, so every copy of a report is the same file.
import SITE from "../../content/site.mjs";
import SC from "../../content/scorecard.mjs";
import { buildReport } from "../../lib/report-model.mjs";
import { reportHtml } from "../../lib/report-html.mjs";
import { renderPdf, pdfAvailable } from "./pdf.mjs";
import { sectionsFor } from "./settings.mjs";

/** The scorecard's name without a leading "The", as a file name: "Invisible-Work-Scorecard" */
export const scorecardFileName = () => String(SC.name || "Scorecard").replace(/^the\s+/i, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Scorecard";
/** "Invisible-Work-Scorecard-Maple-Street-Heating.pdf" */
export function pdfName(row) {
  const name = String((row && row.company) || "report").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "report";
  return `${scorecardFileName()}-${name}.pdf`;
}

/** What the report model needs from the settings and the lead: the letter, the signature, the sections, the note. */
export function reportOptions(row, settings) {
  const r = (settings && settings.report) || {};
  const own = (row && row.report && row.report.options) || {};
  return {
    letter: r.letter || "",
    signer: { name: r.signerName || "", title: r.signerTitle || "" },
    note: own.note || "",
    sections: sectionsFor(settings, own),
    delivery: SITE.reportDelivery
  };
}

/** The model for one scorecard (what the owner sees), from the row, its links and the settings in force. */
export function modelFor(row, { links = {}, settings, checker, now } = {}) {
  return buildReport(row, { links, checker: checker !== undefined ? checker : row.report && row.report.checker, now: now || new Date(), options: reportOptions(row, settings) });
}

/** The model, and its PDF when one can be printed here: { model, pdf, error }. A PDF that fails leaves pdf null and
 *  says why, so the email can still go with the report's link. */
export async function makeReport(row, opts = {}) {
  const model = modelFor(row, opts);
  if (opts.pdf === false || !pdfAvailable()) return { model, pdf: null, error: opts.pdf === false ? null : "no Chromium here" };
  try {
    return { model, pdf: await renderPdf(reportHtml(model, { preview: false, toolbar: false })), error: null };
  } catch (e) {
    console.error("pdf:", e && e.message);
    return { model, pdf: null, error: String(e && e.message || e).slice(0, 300) };
  }
}

/** The PDF of a stored snapshot (or a fresh model), for the report link's /pdf. */
export async function pdfOf(model) {
  return renderPdf(reportHtml(model, { preview: false, toolbar: false }));
}
