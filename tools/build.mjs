#!/usr/bin/env node
// Builds the site into public/ (what Vercel serves) and the report's embedded assets into lib/generated/, from the
// content (content/*.mjs), the shared logic (lib/*.mjs), the styles and the script (src/). Deterministic: the same
// sources give byte-for-byte the same output, so the committed build can be checked.
//   node tools/build.mjs           build (stops on a copy-lint error)
//   node tools/build.mjs --check   build into a temporary folder and fail if the committed output differs
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintAll } from "./copy-lint.mjs";
import SC from "../content/scorecard.mjs";
import BRAND from "../content/brand.mjs";
import SITE from "../content/site.mjs";
import LANDING from "../content/landing.mjs";
import RESULTS from "../content/results.mjs";
import * as P from "./templates/pages.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const r = (p) => path.join(ROOT, p);
const read = (p) => readFileSync(r(p), "utf8");
const CHECK = process.argv.includes("--check");
const OUT = CHECK ? mkdtempSync(path.join(tmpdir(), "scorecard-build-")) : r("public");
const GEN = CHECK ? path.join(OUT, "_generated") : r("lib/generated");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);

/* ---------- 1. The claim rules ---------- */
const { errors, warnings } = await lintAll();
if (errors.length) {
  errors.forEach((e) => console.error(`ERROR ${e}`));
  console.error(`build: ${errors.length} copy-lint errors (tools/copy-lint.mjs)`);
  process.exit(1);
}
if (!CHECK) warnings.forEach((w) => console.log(`warn  ${w}`));

/* ---------- 2. Assets: copied as they are, referenced with a content hash ---------- */
if (!CHECK) rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, "assets"), { recursive: true });
mkdirSync(GEN, { recursive: true });
const V = {};
function copyTree(src, dst, base) {
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src).sort()) {
    const s = path.join(src, f), d = path.join(dst, f);
    if (statSync(s).isDirectory()) copyTree(s, d, `${base}/${f}`);
    else { copyFileSync(s, d); V[`${base}/${f}`] = `${base}/${f}?v=${hash(readFileSync(s))}`; }
  }
}
copyTree(r("src/assets"), path.join(OUT, "assets"), "/assets");
const A = (p) => { if (!V[p]) throw new Error(`build: no asset ${p} in src/assets`); return V[p]; };
A.has = (p) => Boolean(V[p]);
// The pictures present: name -> widths (src/assets/img/<name>-<width>.webp), smallest first. Content names a picture;
// one that is missing is left out of the page, so a new brand builds before its art exists.
const IMAGES = {};
for (const k of Object.keys(V)) { const m = /^\/assets\/img\/(.+)-(\d+)\.webp$/.exec(k); if (m) (IMAGES[m[1]] ||= []).push(Number(m[2])); }
for (const w of Object.values(IMAGES)) w.sort((a, b) => a - b);
A.images = IMAGES;
P.useAssets(A);
// The brand's fonts (content/brand.mjs): one @font-face per role whose file exists, self-hosted
const FONT_FILES = Object.values(BRAND.fonts || {}).filter((f) => f && f.family && f.file && existsSync(r(`src/assets/fonts/${f.file}`)));
const fontFaces = (url, display = "swap") => FONT_FILES.map((f) => `@font-face{font-family:"${f.family}";src:url(${url(f.file)}) format("woff2");font-weight:${f.weight || "100 900"};font-display:${display}}`).join("");

/* ---------- 3. The script: the shared logic and the page script, in one function ---------- */
const strip = (f) => read(f).replace(/^export (function|const|let|class) /gm, "$1 ");
const appJs = `/* The Invisible Work Scorecard. Built by tools/build.mjs from lib/scoring.mjs, lib/booking.mjs, lib/icons.mjs, lib/quiz-markup.mjs, lib/source.mjs and src/js/app.js. */\n(function () {\n${strip("lib/scoring.mjs")}\n${strip("lib/booking.mjs")}\n${strip("lib/icons.mjs")}\n${strip("lib/quiz-markup.mjs")}\n${strip("lib/source.mjs")}\n${read("src/js/app.js").replace(/^"use strict";\n/m, "")}\n})();\n`;
writeFileSync(path.join(OUT, "assets", "app.js"), appJs);
V["/assets/app.js"] = `/assets/app.js?v=${hash(appJs)}`;
const adminJs = read("src/js/admin.js");
writeFileSync(path.join(OUT, "assets", "admin.js"), adminJs);
V["/assets/admin.js"] = `/assets/admin.js?v=${hash(adminJs)}`;

/* ---------- 4. Styles: tokens and the page's, comments dropped, inlined in every page ---------- */
const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n/g, "\n").replace(/^\s+/gm, "").trim();
// The areas' colors (content/scorecard.mjs areas[].color) as --a-<key>, for the pages and the admin
const AREA_CSS = `:root{${SC.areas.map((a) => `--a-${a.key}:${a.color};`).join("")}}`;
const CSS = fontFaces((f) => A(`/assets/fonts/${f}`)) + minCss(read("src/styles/tokens.css") + read("src/styles/site.css")) + AREA_CSS;
const ADMIN_CSS = fontFaces((f) => A(`/assets/fonts/${f}`)) + minCss(read("src/styles/tokens.css") + read("src/styles/admin.css")) + AREA_CSS;
const SYMBOLS = read("tools/templates/symbols.svg") + read("tools/templates/symbols-extra.svg").replace(/<!--[\s\S]*?-->/g, "");

/* ---------- 5. What the script needs: the scorecard (no team notes), the settings it may see, the words ---------- */
const { notes, ...scRest } = SC;
const DATA = {
  sc: { ...scRest, notes: { report: notes.report, call: {} } },
  site: {
    endpoints: SITE.endpoints, booking: SITE.booking, offer: SITE.offer, legal: SITE.legal, noticeVersion: SITE.noticeVersion,
    metaPixelId: SITE.metaPixelId, clarityId: SITE.clarityId, trackingConsent: SITE.trackingConsent, masterUrl: SITE.masterUrl, reportTurnaround: SITE.reportTurnaround, reportDelivery: SITE.reportDelivery,
    forecastUrl: SITE.forecastUrl || null, metaEvents: SITE.metaEvents || null
  },
  ui: LANDING.quiz,
  results: RESULTS,
  legal: LANDING.legal,
  brand: { name: BRAND.name, slug: BRAND.slug, homeLabel: BRAND.homeLabel, colors: BRAND.colors },
  // Every picture present, at its smallest width (the cards on the results page name them)
  img: Object.fromEntries(Object.entries(IMAGES).map(([n, ws]) => [n, A(`/assets/img/${n}-${ws[0]}.webp`)]))
};

/* ---------- 6. The pages ---------- */
const write = (rel, html) => { const f = path.join(OUT, rel); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, html); };
const base = { A, css: CSS, symbols: SYMBOLS, data: DATA };
const M = LANDING.meta;
for (const v of LANDING.variants) {
  const body = v.layout === "hero-quiz" ? P.landingA(A, v) : P.landingB(A, v);
  const desc = v.layout === "hero-quiz" ? v.hero.lead : M.description;
  write(v.slug ? `${v.slug}/index.html` : "index.html", P.shell({ ...base, title: v.layout === "hero-quiz" ? `${v.hero.h1} | ${BRAND.name}` : M.title, description: desc, path: v.slug ? `/${v.slug}` : "/", page: "landing", variant: v.id, body }));
}
write("start/index.html", P.shell({ ...base, title: M.title, description: M.description, path: "/start", page: "start", variant: "start", body: P.startPage() }));
const privatePage = (title, page, body) => P.shell({ ...base, title, description: M.description, path: "", page, body, robots: "noindex,nofollow", og: false });
write("results/index.html", privatePage(`${RESULTS.header.name} | ${BRAND.name}`, "results", P.resultsPage()));
write("sharpen/index.html", privatePage(`${RESULTS.deepener.title} | ${BRAND.name}`, "sharpen", P.sharpenPage()));
write("unsubscribe/index.html", privatePage(`${RESULTS.unsubscribe.button} | ${BRAND.name}`, "unsubscribe", P.unsubscribePage()));
write("404.html", privatePage(`Not found | ${BRAND.name}`, "404", P.notFoundPage()));
write("admin/index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Scorecard admin | ${BRAND.name}</title><link rel="icon" href="${A("/assets/favicon.svg")}" type="image/svg+xml"><style>${ADMIN_CSS}</style></head><body><div id="admin"><p style="padding:24px">Loading...</p></div><script src="${A("/assets/admin.js")}" defer></script></body></html>\n`);
write("robots.txt", ["User-agent: *", "Disallow: /results/", "Disallow: /sharpen/", "Disallow: /report/", "Disallow: /unsubscribe/", "Disallow: /admin", "Disallow: /api/", ""].join("\n"));

/* ---------- 7. The report's embedded assets: its stylesheet with the fonts inside, and its pictures ---------- */
const b64 = (p) => readFileSync(r(p)).toString("base64");
const fontData = (f) => `data:font/woff2;base64,${b64(`src/assets/fonts/${f}`)}`;
const REPORT_CSS = (fontFaces(fontData, "block") + minCss(read("src/styles/tokens.css")) + minCss(read("src/styles/report.css")))
  .replace(/__DISPLAY_FAMILY__/g, (BRAND.fonts.display || {}).family || "system-ui")
  .replace(/__TEXT_FAMILY__/g, (BRAND.fonts.text || {}).family || "system-ui");
// The report's pictures (content/brand.mjs reportImages: slot -> "<name>-<width>"), embedded; a missing one is left out
const IMG = Object.fromEntries(Object.entries(BRAND.reportImages || {}).filter(([, f]) => f && existsSync(r(`src/assets/img/${f}.webp`)))
  .map(([slot, f]) => [slot, `data:image/webp;base64,${b64(`src/assets/img/${f}.webp`)}`]));
// The brand's mark for the report's cover, kickers and toolbar
const MARK = BRAND.logo && BRAND.logo.mark && existsSync(r(`src/assets/${BRAND.logo.mark}`)) ? `data:image/svg+xml;base64,${b64(`src/assets/${BRAND.logo.mark}`)}` : "";
writeFileSync(path.join(GEN, "report-assets.mjs"), `// Generated by tools/build.mjs from src/styles/report.css, content/brand.mjs and src/assets. Do not edit: rebuild.\nexport const REPORT_CSS = ${JSON.stringify(REPORT_CSS)};\nexport const IMG = ${JSON.stringify(IMG)};\nexport const MARK = ${JSON.stringify(MARK)};\n`);

/* ---------- 7b. vercel.json: one rewrite per landing variant (content/landing.mjs slugs) ---------- */
// The variants' pages live at /<slug>/index.html; Vercel and tools/dev.mjs serve /<slug> through a rewrite. Rewrites to
// a page folder that is neither a variant nor one of the fixed pages are dropped, so renaming a variant needs no edit.
{
  const vjPath = r("vercel.json");
  const vj = JSON.parse(readFileSync(vjPath, "utf8"));
  const FIXED = new Set(["start", "results", "sharpen", "unsubscribe", "admin"]);
  const slugs = LANDING.variants.map((v) => v.slug).filter(Boolean);
  const isPage = (x) => /^\/[\w-]+$/.test(x.source) && x.destination === `${x.source}/index.html`;
  const kept = (vj.rewrites || []).filter((x) => !isPage(x) || FIXED.has(x.source.slice(1)) || slugs.includes(x.source.slice(1)));
  const missing = slugs.filter((sl) => !kept.some((x) => x.source === `/${sl}`)).map((sl) => ({ source: `/${sl}`, destination: `/${sl}/index.html` }));
  const rewrites = [...missing, ...kept];
  if (JSON.stringify(rewrites) !== JSON.stringify(vj.rewrites || [])) {
    const next = JSON.stringify({ ...vj, rewrites }, null, 2) + "\n";
    if (CHECK) { console.error("build --check: vercel.json's rewrites do not match the landing variants; run node tools/build.mjs and commit"); process.exit(1); }
    writeFileSync(vjPath, next);
  }
}

/* ---------- 8. --check: the committed output must equal this build ---------- */
if (CHECK) {
  const list = (dir, base = "") => readdirSync(dir).sort().flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? list(p, `${base}${f}/`) : [`${base}${f}`]; });
  const fresh = list(OUT).filter((f) => !f.startsWith("_generated/"));
  const committed = existsSync(r("public")) ? list(r("public")) : [];
  const diffs = [];
  for (const f of new Set([...fresh, ...committed])) {
    const a = fresh.includes(f) ? readFileSync(path.join(OUT, f)) : null;
    const b = committed.includes(f) ? readFileSync(path.join(r("public"), f)) : null;
    if (!a || !b || !a.equals(b)) diffs.push(`public/${f}`);
  }
  const g = readFileSync(path.join(GEN, "report-assets.mjs"));
  if (!existsSync(r("lib/generated/report-assets.mjs")) || !g.equals(readFileSync(r("lib/generated/report-assets.mjs")))) diffs.push("lib/generated/report-assets.mjs");
  rmSync(OUT, { recursive: true, force: true });
  if (diffs.length) {
    console.error(`build --check: the committed build is stale; run node tools/build.mjs and commit:\n  ${diffs.slice(0, 20).join("\n  ")}`);
    process.exit(1);
  }
  console.log("build --check: the committed build matches its sources");
} else {
  console.log(`build: ${Object.keys(V).length} assets, ${LANDING.variants.length} landing pages, public/ and lib/generated/ written`);
}
