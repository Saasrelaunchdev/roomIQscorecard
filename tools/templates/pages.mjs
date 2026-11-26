// The pages, as HTML strings, built by tools/build.mjs from the content (content/*.mjs). The quiz's markup comes from
// lib/quiz-markup.mjs, the same templates the browser uses for the deepener. A: assets map ("/assets/x" -> hashed URL).
import SC from "../../content/scorecard.mjs";
import SITE from "../../content/site.mjs";
import LANDING from "../../content/landing.mjs";
import RESULTS from "../../content/results.mjs";
import BRAND from "../../content/brand.mjs";
import { quizCardHtml, legalNoteHtml, escHtml as esc, useIcon as ic } from "../../lib/quiz-markup.mjs";
import { icon } from "../../lib/icons.mjs";

// The build hands over its asset map (A: "/assets/x" -> hashed URL, with A.has() and A.images: name -> widths)
let ASSETS = null;
export const useAssets = (A) => { ASSETS = A; };
/** The brand's lockup (content/brand.mjs), for the header, the quiz dialog and the footer (onDark). */
function logo(onDark = false) {
  const L = BRAND.logo || {};
  const file = (onDark && L.lockupOnDark) || L.lockup;
  if (!file || !ASSETS || !ASSETS.has(`/assets/${file}`)) return `<span class="wordmark">${esc(BRAND.name)}</span>`;
  return `<img src="${ASSETS(`/assets/${file}`)}" alt="${esc(BRAND.name)}" width="${L.width || 200}" height="${L.height || 60}">`;
}
const tracking = () => Boolean(SITE.metaPixelId || SITE.clarityId);

export function pic(A, name, sizes, alt, cls = "", extra = "") {
  const widths = (A.images || {})[name];
  if (!widths || !widths.length) return "";
  const srcset = widths.map((w) => `${A(`/assets/img/${name}-${w}.webp`)} ${w}w`).join(", ");
  return `<img${cls ? ` class="${cls}"` : ""} src="${A(`/assets/img/${name}-${widths[0]}.webp`)}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" decoding="async"${extra}>`;
}

/** The hero's picture with its pins and tag (content/landing.mjs scene), or "" when the variant has no picture. */
export function heroScene(A, H, lazy) {
  const S = LANDING.scene || {};
  const img = H && H.picture ? pic(A, H.picture, "(min-width: 900px) 600px, 100vw", S.alt || "", "pic", lazy ? ' loading="lazy"' : ' fetchpriority="high"') : "";
  if (!img) return "";
  const pins = (S.pins || []).map((p) => `<span class="pin ask${p.on ? " on" : ""}" style="--x:${p.x}%;--y:${p.y}%" aria-hidden="true">${ic(p.icon || "i-check")}</span>`).join("");
  const tag = S.tag ? `<span class="scene-tag" style="--x:${S.tag.x}%;--y:${S.tag.y}%" aria-hidden="true">${esc(S.tag.text)}${S.tag.strong ? ` <b>${esc(S.tag.strong)}</b>` : ""}</span>` : "";
  return `<figure class="hero-vis"><div class="scene">${img}${pins}${tag}</div></figure>`;
}

export function shell({ A, css, symbols, title, description, path, page, variant = "", body, data, robots, og = true }) {
  const canonical = SITE.url ? `${SITE.url}${path}` : null;
  const ogImage = SITE.url ? `${SITE.url}${A("/assets/og.png")}` : A("/assets/og.png");
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${robots ? `<meta name="robots" content="${robots}">` : ""}${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="${A("/assets/favicon.svg")}" type="image/svg+xml">
${Object.values(BRAND.fonts || {}).filter((f) => f && f.file && A.has(`/assets/fonts/${f.file}`)).map((f) => `<link rel="preload" href="${A(`/assets/fonts/${f.file}`)}" as="font" type="font/woff2" crossorigin>`).join("\n")}
${og ? `<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${esc(ogImage)}"><meta name="twitter:card" content="summary_large_image">` : ""}
<style>${css}</style>
</head>
<body data-page="${page}" data-variant="${esc(variant)}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>
<a class="skip-link" href="#main">Skip to content</a>
${body}
<script type="application/json" id="sc-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script src="${A("/assets/app.js")}" defer></script>
</body>
</html>
`;
}

export const header = (extra = "") => `<header class="hdr"><div class="wrap"><a class="brand" href="${esc(SITE.masterUrl)}">${logo()}</a>${extra}</div></header>`;

export function footer() {
  const F = LANDING.footer;
  const links = F.links.map((l) => `<a href="${esc(SITE.legal[l.key])}">${esc(l.label)}</a>`).join("");
  return `<footer class="foot"><div class="wrap foot-grid"><a class="brand" href="${esc(SITE.masterUrl)}">${logo(true)}</a>` +
    `<p>${esc(F.line)} <a href="${esc(SITE.masterUrl)}">${esc(F.master)}</a></p><nav class="foot-legal" aria-label="Legal">${links}${tracking() ? `<button type="button" class="foot-btn" data-cookie-settings>${esc(F.cookieSettings)}</button>` : ""}</nav>` +
    `<p class="foot-small">${esc(SITE.company || BRAND.name)} · ${esc(BRAND.homeLabel || "")}</p></div></footer>`;
}

function cookieNotice() {
  if (!tracking()) return "";
  const C = LANDING.cookie;
  return `<div class="cookie" id="cookie-notice" role="region" aria-label="Cookies" hidden><p>${esc(C.text).replace("{more}", `<a href="${esc(SITE.legal.cookies)}">${esc(C.more)}</a>`)}</p><div class="cookie-btns"><button type="button" class="btn btn-line" data-consent="denied">${esc(C.decline)}</button><button type="button" class="btn btn-line" data-consent="granted">${esc(C.allow)}</button></div></div>`;
}

/** The hero quiz card, from the scorecard's ten steps. */
export function heroQuiz(id = "quiz") {
  const contact = SC.steps.find((s) => s.last);
  const legalHtml = legalNoteHtml(LANDING.legal, SITE.legal, contact.button, Boolean(SITE.metaPixelId));
  return quizCardHtml(SC.steps, LANDING.quiz, { id, label: LANDING.quiz.label, frame: LANDING.quiz.frame, frameShort: LANDING.quiz.frameShort, button: contact.button, legalHtml, kind: "hero" });
}

const trustList = () => `<ul class="trust">${LANDING.trust.map((t) => `<li>${ic("i-check")}${esc(t)}</li>`).join("")}</ul>`;
const startBtn = (label, cls = "btn btn-primary") => `<button type="button" class="${cls}" data-start>${esc(label)}${ic("i-arrow")}</button>`;
const faqHtml = () => `<div class="faq">${LANDING.faq.items.map((x) => `<details><summary>${esc(x.q)}${ic("i-down")}</summary><p class="ans">${esc(x.a)}</p></details>`).join("")}</div>`;
const utilChips = () => `<ul class="chips-u">${[["u-minute", "About a minute"], ["u-free", "Free"], ["u-report", "Report by email"]].map(([k, t]) => `<li>${icon(k, 30)}${esc(t)}</li>`).join("")}</ul>`;

/* ---------- The shared sections (Version B's, also under Version A's hero) ---------- */
export function introSection() {
  const I = LANDING.intro;
  return `<section class="sec" id="intro" aria-labelledby="intro-h"><div class="wrap"><div class="sec-head"><h2 class="h2" id="intro-h">${esc(I.h2)}</h2><p class="lead">${esc(I.body)}</p></div>` +
    `<div class="sec-cta">${startBtn(I.button)}</div></div></section>`;
}
export function howSection() {
  const H = LANDING.how;
  return `<section class="sec ink" id="how" aria-labelledby="how-h"><div class="wrap"><div class="sec-head"><h2 class="h2" id="how-h">${esc(H.h2)}</h2><p class="lead" style="color:var(--c-neutral-300)">${esc(H.body)}</p></div>` +
    `<ol class="beats">${H.steps.map((s) => `<li class="beat">${icon(s.icon, 52)}<b>${esc(s.title)}</b><span>${esc(s.body)}</span></li>`).join("")}</ol></div></section>`;
}
export function areasSection() {
  const S = LANDING.areasSection;
  return `<section class="sec tint" id="areas" aria-labelledby="areas-h"><div class="wrap"><div class="sec-head"><p class="eyebrow">${esc(S.eyebrow)}</p><h2 class="h2" id="areas-h">${esc(S.h2)}</h2></div>` +
    `<div class="areas-grid">${SC.areas.map((a) => `<article class="area-card" style="--a:var(--a-${a.key})">${icon(a.key, 52)}<h3>${esc(a.name)}</h3><p>${esc(a.description)}</p></article>`).join("")}</div></div></section>`;
}
export function reportSection(A) {
  const R = LANDING.reportCta;
  const icons = ["u-minute", "u-free", "u-report"];
  const W = [46, 30, 64, 52, 38, 58];
  const bars = SC.areas.map((a, i) => `<i style="--a:var(--a-${a.key});--w:${W[i % W.length]}%"></i>`).join("");
  return `<section class="sec" id="report" aria-labelledby="report-h"><div class="wrap two-col"><div><h2 class="h2" id="report-h">${esc(R.h2)}</h2><p class="lead" style="margin-top:14px">${esc(R.body)}</p>` +
    `<ul class="ticks-l">${R.bullets.map((b, i) => `<li>${icon(icons[i], 30)}<span>${esc(b)}</span></li>`).join("")}</ul><div class="sec-cta">${startBtn(R.button)}</div></div>` +
    `<div class="report-vis" aria-hidden="true">${pic(A, "report", "(min-width: 900px) 360px, 70vw", "", "", ' loading="lazy"')}<div class="mini-rep"><div class="t"></div><div class="bar-l">${bars}</div></div></div></div></section>`;
}
export function faqSection() {
  const Q = LANDING.faq;
  return `<section class="sec tint" id="faq" aria-labelledby="faq-h"><div class="wrap"><div class="sec-head"><h2 class="h2" id="faq-h">${esc(Q.h2)}</h2><p class="lead">${esc(Q.body)}</p></div>${faqHtml()}<div class="sec-cta">${startBtn(Q.button)}</div></div></section>`;
}

/* ---------- Version B: the ScoreApp template ---------- */
export function landingB(A, v) {
  const H = v.hero, F = LANDING.footerCta;
  const quiz = `<dialog class="dlg" id="quiz-dlg" aria-labelledby="quiz-dlg-t"><div class="dlg-in"><div class="dlg-head"><span class="brand" id="quiz-dlg-t" aria-label="${esc(SC.name)}">${logo()}</span>` +
    `<button type="button" class="dlg-x" data-close aria-label="${esc(LANDING.quiz.close)}">${ic("i-x")}</button></div>${heroQuiz("quiz")}</div></dialog>`;
  const vis = heroScene(A, H, false);
  return header() + `<main id="main"><section class="hero story" id="top" aria-labelledby="hero-h"><div class="wrap hero-grid${vis ? "" : " no-vis"}"><div class="hero-copy">` +
    `<p class="pill">${esc(H.eyebrow)}</p><h1 class="display long" id="hero-h">${esc(H.h1)}</h1><p class="lead">${esc(H.lead)}</p>` +
    `<div class="hero-cta">${startBtn(H.button)}</div>${utilChips()}</div>${vis}</div></section>` +
    introSection() + howSection() + areasSection() + reportSection(A) + faqSection() +
    `<section class="banner-cta ink" aria-labelledby="close-h"><div class="wrap"><h2 class="h2" id="close-h">${esc(F.h2)}</h2><p>${esc(F.sub)}</p>${startBtn(F.button, "btn btn-white")}</div></section>` +
    `</main>` + footer() + `<div class="sticky-bar" id="sticky" aria-hidden="true">${startBtn(v.sticky)}</div>` + quiz + cookieNotice();
}

/* ---------- Version A: the Meta ads variant, the quiz in the hero ---------- */
export function landingA(A, v) {
  const H = v.hero, R = v.report, F = v.final;
  const vis = heroScene(A, H, true);
  return header() + `<main id="main"><section class="hero quiz story" id="top" aria-labelledby="hero-h"><div class="wrap hero-grid${vis ? "" : " no-vis"}"><div class="hero-copy">` +
    `<p class="pill">${esc(H.eyebrow)}</p><h1 class="display" id="hero-h">${esc(H.h1)}</h1>` +
    (H.leadShort ? `<p class="lead m-hide">${esc(H.lead)}</p><p class="lead m-only">${esc(H.leadShort)}</p>` : `<p class="lead">${esc(H.lead)}</p>`) +
    `</div><div class="hero-card">${heroQuiz("quiz")}<div style="margin-top:16px">${trustList()}</div></div>${vis}</div></section>` +
    `<section class="sec" id="free-report" aria-labelledby="fr-h"><div class="wrap"><div class="sec-head"><p class="eyebrow">${esc(R.eyebrow)}</p><h2 class="h2" id="fr-h">${esc(R.h2)}</h2><p class="lead">${esc(R.line)}</p></div>` +
    `<div class="pts">${R.points.map((p) => { const im = pic(A, p.img, "(min-width: 900px) 360px, 64px", "", "", ' loading="lazy"'); return `<article class="pt${im ? "" : " no-img"}">${im ? `<span class="pt-img">${im}</span>` : ""}<h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></article>`; }).join("")}</div>` +
    `<div class="sec-cta">${startBtn(F.button)}</div></div></section>` +
    howSection() + areasSection() + faqSection() +
    `<section class="sec story" id="close" aria-labelledby="close-h"><div class="wrap narrow"><h2 class="h2" id="close-h">${esc(F.h2)}</h2><ul class="stack">${F.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><p class="lead">${esc(F.line)}</p>` +
    `<div class="sec-cta">${startBtn(F.button)}</div><div style="margin-top:18px">${trustList()}</div></div></section>` +
    `</main>` + footer() + `<div class="sticky-bar" id="sticky" aria-hidden="true">${startBtn(v.sticky)}</div>` + cookieNotice();
}

/* ---------- /start: the quiz alone (ScoreApp's "skip the landing page"), for links from the main site and emails ---------- */
export function startPage() {
  return header() + `<main id="main" class="mini story"><div class="wrap">${heroQuiz("quiz")}<div style="max-width:600px;margin:16px auto 0">${trustList()}</div></div></main>` + footer() + cookieNotice();
}

/* ---------- The pages the script fills: results, sharpen, unsubscribe ---------- */
const skeleton = `<div class="card skeleton" aria-hidden="true"><i style="width:40%"></i><i style="width:85%"></i><i style="width:70%"></i><i style="width:90%"></i></div>`;
export function resultsPage() {
  return header() + `<main id="main" class="res"><div class="wrap"><div class="res-wrap" id="results" aria-live="polite">${skeleton}<noscript><p class="card">Turn on JavaScript to see your score. Your report comes by email either way.</p></noscript></div></div></main>` + footer() + cookieNotice();
}
export function sharpenPage() {
  return header() + `<main id="main" class="mini story"><div class="wrap" id="sharpen">${skeleton}</div></main>` + footer();
}
export function unsubscribePage() {
  const U = RESULTS.unsubscribe;
  return header() + `<main id="main" class="mini"><div class="wrap"><div class="gc done-card" id="unsub" style="max-width:560px;margin:24px auto"><h2>${esc(U.h)}</h2>` +
    `<p class="muted">${esc(U.body)}</p><button type="button" class="btn btn-primary" data-unsubscribe>${esc(U.button)}</button><p class="err" role="alert"></p></div></div></main>` + footer();
}
export function notFoundPage() {
  const N = RESULTS.page404;
  return header() + `<main id="main" class="mini"><div class="wrap"><div class="gc done-card" style="max-width:560px;margin:24px auto"><h2>${esc(N.h)}</h2><p class="muted">${esc(N.body)}</p>` +
    `<a class="btn btn-primary" href="/">${esc(N.button)}</a><a class="link-btn" href="${esc(SITE.masterUrl)}">${esc(BRAND.homeLabel)}</a></div></div></main>` + footer();
}
