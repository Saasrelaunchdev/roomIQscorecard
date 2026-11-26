// The report as a PDF: Chromium prints the report's HTML (lib/report-html.mjs), the same file as the web view.
// On Vercel: puppeteer-core with @sparticuz/chromium (its binary is bundled with the function: vercel.json includeFiles).
// Locally and in tests: any Chromium, from CHROMIUM_PATH, or the one Playwright installs (/opt/pw-browsers/chromium).
import { existsSync } from "node:fs";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");
const LOCAL = ["/opt/pw-browsers/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];

/** Where Chromium comes from on this machine: { kind, path } or null. */
export async function chromiumFor() {
  if (env("CHROMIUM_PATH") && existsSync(env("CHROMIUM_PATH"))) return { kind: "local", path: env("CHROMIUM_PATH"), args: ["--no-sandbox", "--disable-dev-shm-usage"] };
  if (env("VERCEL") || env("AWS_LAMBDA_FUNCTION_NAME")) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return { kind: "serverless", path: await chromium.executablePath(), args: chromium.args, headless: "shell" };
  }
  const found = LOCAL.find((p) => existsSync(p));
  return found ? { kind: "local", path: found, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : null;
}

/** Whether a PDF can be printed here, without starting anything (the admin's setup panel). SCORECARD_PDF=off turns
 *  printing off (the unit tests, which check the PDF in one place only, to stay fast). */
export function pdfAvailable() {
  if (env("SCORECARD_PDF") === "off") return false;
  if (env("CHROMIUM_PATH")) return existsSync(env("CHROMIUM_PATH"));
  if (env("VERCEL") || env("AWS_LAMBDA_FUNCTION_NAME")) return true;
  return LOCAL.some((p) => existsSync(p));
}

/** Prints HTML to a US Letter PDF. Resolves to a Buffer; throws when no Chromium is available. */
export async function renderPdf(html, { timeoutMs = 45000 } = {}) {
  const where = await chromiumFor();
  if (!where) throw Object.assign(new Error("No Chromium to print the PDF with. Set CHROMIUM_PATH, or deploy to Vercel (it bundles one)."), { status: 503, expose: true });
  const puppeteer = (await import("puppeteer-core")).default;
  // @sparticuz/chromium is a headless shell build: its README launches it with headless "shell" and these arguments
  const browser = where.kind === "serverless"
    ? await puppeteer.launch({ args: await puppeteer.defaultArgs({ args: where.args, headless: "shell" }), executablePath: where.path, headless: "shell", timeout: timeoutMs })
    : await puppeteer.launch({ executablePath: where.path, args: where.args, headless: true, timeout: timeoutMs });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: timeoutMs });
    await page.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true));
    const pdf = await page.pdf({ format: "letter", printBackground: true, preferCSSPageSize: true, timeout: timeoutMs });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}
