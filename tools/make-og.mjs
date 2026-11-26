#!/usr/bin/env node
// Draws the share image (src/assets/og.png, 1200 x 630) from the brand's pieces (content/brand.mjs: the lockup, the fonts,
// the colors), the hero variant's picture, and the landing page's own words. Run it when the headline or the picture changes, then build:
//   node tools/make-og.mjs && node tools/build.mjs
// Needs Playwright's Chromium (preinstalled in Claude Code's cloud sessions; elsewhere: npx playwright install chromium).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import LANDING from "../content/landing.mjs";
import SC from "../content/scorecard.mjs";
import BRAND from "../content/brand.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const b64 = (p) => readFileSync(path.join(ROOT, p)).toString("base64");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const v = LANDING.variants.find((x) => x.layout === "hero-quiz") || LANDING.variants[0];
const K = BRAND.colors || {};
const F = BRAND.fonts || {};
const has = (p) => existsSync(path.join(ROOT, p));
const lockup = BRAND.logo && BRAND.logo.lockup && has(`src/assets/${BRAND.logo.lockup}`) ? readFileSync(path.join(ROOT, `src/assets/${BRAND.logo.lockup}`), "utf8") : `<b style="font:700 40px var(--d)">${BRAND.name}</b>`;
const face = (role) => (F[role] && F[role].file && has(`src/assets/fonts/${F[role].file}`) ? `@font-face{font-family:"${F[role].family}";src:url(data:font/woff2;base64,${b64(`src/assets/fonts/${F[role].file}`)}) format("woff2");font-weight:${F[role].weight || "100 900"}}` : "");
const D = `"${(F.display || {}).family || "system-ui"}",system-ui,sans-serif`, T = `"${(F.text || {}).family || "system-ui"}",system-ui,sans-serif`;
// The picture: the hero variant's own (content/landing.mjs picture), at its widest width present
const IMG_DIR = path.join(ROOT, "src/assets/img");
const pics = (existsSync(IMG_DIR) && v.hero.picture ? readdirSync(IMG_DIR) : []).filter((f) => f.startsWith(`${v.hero.picture}-`) && f.endsWith(".webp")).sort((a, b) => parseInt(b.split("-").pop()) - parseInt(a.split("-").pop()));
const picture = pics.length ? `<img src="data:image/webp;base64,${b64(`src/assets/img/${pics[0]}`)}" alt="">` : "";
const html = `<!doctype html><html><head><style>
${face("display")}${face("text")}
:root{--d:${D}}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:radial-gradient(60% 70% at 88% 0%,${K.tint || "#E4F0FF"} 0%,transparent 70%),radial-gradient(50% 45% at 0% 100%,${K.canvas || "#F3F7FE"} 0%,transparent 70%),#fff;font-family:${T};color:${K.ink || "#0A1A33"};display:grid;grid-template-columns:${picture ? "600px 1fr" : "1fr"};align-items:center}
.l{padding:0 0 0 64px;display:grid;gap:22px}
.logo svg,.logo img{height:44px;width:auto}
.pill{justify-self:start;display:inline-flex;align-items:center;gap:10px;padding:9px 16px 9px 13px;border-radius:999px;background:${K.tint || "#EAF3FF"};color:${K.link || "#0057B3"};font:600 20px/1.2 ${T}}
.pill:before{content:"";width:10px;height:10px;border-radius:50%;background:${K.accent || "#1F86FF"}}
h1{margin:0;font:800 58px/1.02 ${D};letter-spacing:-.015em}
p{margin:0;font:400 25px/1.4 ${T};color:${K.muted || "#465C7E"};max-width:500px}
.btn{justify-self:start;padding:16px 26px;border-radius:14px;background:linear-gradient(135deg,${K.accent || "#1F86FF"},${K.accent2 || K.accent || "#70ADFF"});color:${K.onAccent || "#040F22"};font:650 23px/1 ${T}}
.r img{width:100%;display:block}
</style></head><body><div class="l"><div class="logo">${lockup}</div><span class="pill">${v.hero.eyebrow}</span><h1>${SC.name}</h1><p>${v.hero.leadShort || v.hero.lead}</p><span class="btn">${v.sticky}</span></div>
${picture ? `<div class="r">${picture}</div>` : ""}</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
writeFileSync(path.join(ROOT, "src/assets/og.png"), await page.screenshot({ type: "png" }));
await browser.close();
console.log("make-og: src/assets/og.png written");
