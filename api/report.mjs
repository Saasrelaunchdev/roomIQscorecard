// /report/<token> and /report/<token>/pdf (vercel.json rewrites them here): the owner's report, as a web page and as a PDF.
// A report shows from the snapshot taken when it went out, so what the owner received never changes:
//   instant delivery (site.reportDelivery): the snapshot emailed with the score (or with the deepener, or the team's
//            checked update), or, while that first email is still being made, the report as it stands
//   checked delivery: nothing until the team approves and sends it; before that the link shows "on its way"
// The team (signed in to the admin) sees a live preview with ?live=1. Each time the owner opens the report or its PDF,
// the lead's counters go up (the admin shows them).
import SITE from "../content/site.mjs";
import BRAND from "../content/brand.mjs";
import { send, sendText, query, baseUrl, TOKEN, esc } from "./_lib/http.mjs";
import { getStore } from "./_lib/store.mjs";
import { isAdmin } from "./_lib/auth.mjs";
import { linksFor } from "./_lib/views.mjs";
import { reportHtml } from "../lib/report-html.mjs";
import { later } from "./_lib/background.mjs";
import { loadSettings } from "./_lib/settings.mjs";
import { modelFor, pdfOf, pdfName } from "./_lib/reports.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "method not allowed" }, { allow: "GET" });
  const q = query(req);
  const token = q.get("token") || "";
  const format = q.get("format") === "pdf" ? "pdf" : "html";
  const headers = { "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" };
  if (!TOKEN.test(token)) return sendText(res, 404, page("We couldn't find that report.", "Open the link in your email again."), undefined, headers);
  const store = getStore();
  let row;
  try { row = await store.byToken(token); } catch (e) { console.error("report:", e.message); return sendText(res, 503, page("Your report can't be opened right now.", "Please try again in a minute."), undefined, headers); }
  if (!row) return sendText(res, 404, page("We couldn't find that report.", "Open the link in your email again."), undefined, headers);
  const admin = isAdmin(req);
  const instant = SITE.reportDelivery === "instant";
  const snapshot = row.report && row.report.snapshot;
  const sent = row.status === "sent" && snapshot;
  const ready = instant ? true : Boolean(sent);
  if (!ready && !admin) {
    return sendText(res, 200, page("Your report is on its way.", `Someone on our team checks every report before it reaches you. It arrives by email ${SITE.reportTurnaround}.`), undefined, headers);
  }
  const links = linksFor(baseUrl(req, SITE), row);
  const live = !snapshot || !ready || (admin && q.get("live") === "1");
  const model = live ? modelFor(row, { links, settings: await loadSettings(store) }) : snapshot;
  if (!admin && req.method === "GET") {
    const job = later("report view", () => store.reportViewed(row.id, format === "pdf" ? "pdf" : "view"));
    if (job.mustAwait) await job.done;
  }
  const preview = !admin ? false : !ready ? true : q.get("live") === "1"
    ? (instant && snapshot ? "Live preview for the team. The owner has the version emailed to them; Approve and send updates it." : true) : false;
  const html = reportHtml(model, { preview, links: { pdf: links.pdf, results: links.results }, toolbar: format !== "pdf" });
  if (format === "html") return sendText(res, 200, html, undefined, { ...headers, "cache-control": "private, no-store" });
  try {
    const pdf = await pdfOf(model);
    res.statusCode = 200;
    res.setHeader("content-type", "application/pdf");
    res.setHeader("content-disposition", `${q.get("download") === "1" ? "attachment" : "inline"}; filename="${pdfName(row)}"`);
    res.setHeader("cache-control", "private, no-store");
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    return res.end(pdf);
  } catch (e) {
    console.error("pdf:", e && e.message);
    return sendText(res, 503, page("The PDF can't be made right now.", "The web version of your report works: open the link without /pdf, and use Print to save it."), undefined, headers);
  }
}

/** A small branded page for "on its way" and "not found". */
export function page(title, line) {
  const K = BRAND.colors || {};
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | ${esc(BRAND.name)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:${K.canvas};font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:${K.text}}main{max-width:460px;margin:24px;padding:32px 28px;border-radius:20px;background:#fff;box-shadow:0 0 0 1px ${K.line},0 30px 60px -36px rgba(10,26,51,.5)}h1{margin:0 0 10px;font-size:26px;line-height:1.15;color:${K.ink}}p{margin:0;color:${K.muted}}a{color:${K.link};font-weight:600}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(line)}</p><p style="margin-top:18px"><a href="${esc(SITE.masterUrl)}">${esc(BRAND.homeLabel)}</a></p></main></body></html>`;
}
