#!/usr/bin/env node
// Renders the sample report (lib/sample.mjs: the spec's worked example and a made-up profile) to
// .local/sample-report.html and .local/sample-report.pdf, to check the report's design without a database:
//   node tools/render-sample.mjs            (needs a Chromium for the PDF: CHROMIUM_PATH, or Playwright's)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROW } from "../lib/sample.mjs";
import { buildReport } from "../lib/report-model.mjs";
import { reportHtml } from "../lib/report-html.mjs";
import { renderPdf } from "../api/_lib/pdf.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(ROOT, ".local");
mkdirSync(out, { recursive: true });
const links = { sharpen: "https://example.com/sharpen/SAMPLE", results: "https://example.com/results/SAMPLE", report: "https://example.com/report/SAMPLE", pdf: "https://example.com/report/SAMPLE/pdf" };
const model = buildReport(ROW, { links, now: new Date("2026-11-22T12:00:00"), checker: "Dana" });
writeFileSync(path.join(out, "sample-report.html"), reportHtml(model, { links }));
const pdf = await renderPdf(reportHtml(model, { toolbar: false }));
writeFileSync(path.join(out, "sample-report.pdf"), pdf);
console.log(`render-sample: .local/sample-report.html and .local/sample-report.pdf (${Math.round(pdf.length / 1024)} KB)`);
