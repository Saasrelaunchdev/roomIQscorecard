// Draws the report (specs 3, 4 and 5) from its model (lib/report-model.mjs) as one HTML document: the PDF
// (Chromium prints it, api/_lib/pdf.mjs) and the web view at /report/<token> are the same file. Fonts, styles and
// pictures are embedded (lib/generated/report-assets.mjs, written by the build), so the PDF needs no network.
import REPORT from "../content/report.mjs";
import PLAYBOOK from "../content/playbook.mjs";
import METHOD from "../content/method.mjs";
import SC from "../content/scorecard.mjs";
import SITE from "../content/site.mjs";
import { ICONS, icon, strongBadge, fixBadge, housesStrip, donut, monthsChart, monthsStrip, monthsStates, AREA_COLORS, useAreas, usePalette } from "./icons.mjs";
import { REPORT_CSS, IMG, MARK } from "./generated/report-assets.mjs";
import BRAND from "../content/brand.mjs";
useAreas(SC);
usePalette(BRAND.colors);
import { fill } from "./scoring.mjs";

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// A CSS string (the footer's business name): quotes and backslashes escaped, and < > as CSS escapes, so nothing
// can close the <style> element it sits in
const cssStr = (v) => `"${String(v).replace(/[\\"]/g, (c) => `\\${c}`).replace(/[\n\r]/g, " ").replace(/</g, "\\3c ").replace(/>/g, "\\3e ")}"`;
const linkify = (t) => esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (u) => `<a href="${u}">${u}</a>`);
const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
const ALERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg>`;
const XMARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
const SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
const areaName = (k) => (SC.areas.find((a) => a.key === k) || {}).name || k;
const img = (key, cls = "banner") => (IMG[key] ? `<img class="${cls}" src="${IMG[key]}" alt="">` : "");
/** The brand's mark (content/brand.mjs logo.mark, embedded by the build); nothing when the brand has none. */
const mark = (size = 40) => (MARK ? `<img class="mark" src="${MARK}" width="${size}" height="${size}" alt="">` : "");
const TEXT_FONT = `"${(BRAND.fonts && BRAND.fonts.text && BRAND.fonts.text.family) || "system-ui"}",sans-serif`;
let uid = 0;
const kicker = (t) => `<div class="kicker">${mark(16, `k${++uid}`)}<span>${esc(t)}</span></div>`;
const ticks = (items, color) => `<ul class="ticks"${color ? ` style="--c:${color}"` : ""}>${items.map((x) => `<li>${TICK}<span>${esc(x)}</span></li>`).join("")}</ul>`;

/** The whole report. opts: { preview, links: { pdf, results }, toolbar } */
export function reportHtml(model, opts = {}) {
  uid = 0;
  const f = model.fields;
  const title = [REPORT.title, f.business || [f.first_name, f.last_name].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  const pageCss = `@page{@bottom-left{content:${cssStr(fill(REPORT.footer, f))};font:500 7.5pt ${TEXT_FONT};color:${(BRAND.colors && BRAND.colors.ink500) || "#7990B5"}}@bottom-right{content:"Page " counter(page);font:600 7.5pt ${TEXT_FONT};color:${(BRAND.colors && BRAND.colors.ink500) || "#7990B5"}}}@page:first{@bottom-left{content:none}@bottom-right{content:none}}`;
  const on = model.sections || { letter: false, method: false, service: false, playbook: true };
  const sheets = [cover(model), on.letter ? letter(model) : "", overview(model), invisible(model), checksPage(model), topThree(model, opts), overall(model), strongest(model), weakest(model),
    ...(model.method ? [methodIntro(model), methodGap(model)] : []),
    ...(model.service ? [ways(model), firstDays(model)] : []),
    ...(on.playbook !== false ? [playStart(model), ...SC.areas.map((a) => guide(model, a.key)), timeline(), quickStart(), checklists(), tracker(model)] : []),
    nextStep(model)].filter(Boolean);
  const bar = opts.toolbar === false ? "" : `<div class="bar no-print"><a class="brand" href="${esc(SITE.masterUrl)}">${mark(26)}${esc(BRAND.name)}</a><div class="acts">` +
    (opts.links && opts.links.pdf ? `<a class="btn btn-p" href="${esc(opts.links.pdf)}">Download PDF</a>` : "") +
    `<button class="btn btn-l" type="button" onclick="window.print()">Print</button>` +
    (opts.links && opts.links.results && !model.next.booked ? `<a class="btn btn-l" href="${esc(opts.links.results)}#call">Pick a time</a>` : "") + `</div></div>`;
  const ribbon = opts.preview ? `<p class="ribbon no-print">${esc(typeof opts.preview === "string" ? opts.preview : "Preview for the team. The investor sees this only after it is approved and sent.")}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${esc(title)}</title><style>${REPORT_CSS}${pageCss}</style></head><body>${bar}${ribbon}<main class="doc">${sheets.join("")}</main></body></html>`;
}

/* ---------- 1. Cover ---------- */
function cover(m) {
  const c = m.cover;
  return `<section class="sheet cover"><div class="cover-sky"><div class="logo">${mark(34)}${esc(BRAND.name)}</div><h1>${esc(c.title)}</h1><p>${esc(c.subtitle)}</p></div>` +
    `<div class="cover-art">${img("cover", "")}</div>` +
    `<div class="cover-foot"><dl><dt>${esc(REPORT.cover.preparedFor)}</dt><dd>${esc(c.prepared)}</dd><dt style="margin-top:6px">Date</dt><dd>${esc(c.date)}</dd></dl>` +
    (c.checked ? `<span class="checked">${SHIELD}${esc(c.checked)}</span>` : "") + `</div></section>`;
}

/* ---------- 2. Overview ---------- */
function overview(m) {
  const o = m.overview;
  const comingHere = m.coming && !m.letter ? comingBox(m.coming) : "";
  return `<section class="sheet">${kicker(o.title)}<h1 class="h1">${esc(o.heading)}</h1><p class="lead mt-s">${esc(o.intro)}</p>${comingHere}` +
    `<h2 class="h2 mt-l">${esc(o.sub)}</h2><div class="areas mt-s">${m.areas.map((a) => areaCard(a)).join("")}</div></section>`;
}
const comingBox = (c) => `<div class="callout blue mt">${CLOCK}<span><b>${esc(c.title)}.</b> ${esc(c.body)}</span></div>`;

/* ---------- 1b. A note before you read: the letter, the lead's own note, and what is in the report ---------- */
function letter(m) {
  const l = m.letter, L = METHOD.letter, C = L.contents;
  const items = [C.invisible, m.checks ? C.checks : null, m.top3.available ? C.top3 : m.coming ? C.top3Coming : null, C.overall, C.areas,
    m.method ? C.method : null, m.service ? C.service : null, m.sections && m.sections.playbook === false ? null : C.playbook, C.next].filter(Boolean);
  return `<section class="sheet">${kicker(L.kicker)}<h1 class="h1">${esc(l.title)}</h1><div class="letter mt">${l.body.map((p) => `<p>${esc(p)}</p>`).join("")}<p class="sign">${esc(l.sign)}</p></div>` +
    (l.note ? `<div class="note-box keep"><h3>${esc(l.note.title)}</h3>${l.note.body.map((p) => `<p>${esc(p)}</p>`).join("")}</div>` : "") +
    (m.coming ? comingBox(m.coming) : "") +
    `<div class="contents keep"><h2 class="h2">${esc(L.contentsTitle)}</h2><ol>${items.map((t) => { const [h, rest] = splitTitle(t); return `<li><span><b>${esc(h)}</b>${rest ? `: ${esc(rest)}` : ""}</span></li>`; }).join("")}</ol></div>` +
    (l.note ? "" : img("letter", "banner letter-art")) + `</section>`;
}
const splitTitle = (t) => { const i = t.indexOf(": "); return i < 0 ? [t, ""] : [t.slice(0, i), t.slice(i + 2)]; };
function areaCard(a) {
  return `<div class="area" style="--c:${a.color}">${icon(a.key, 44)}<h3>${esc(a.name)}</h3><p>${esc(a.description)}</p>` +
    `<div class="meter"><i><b style="--w:${a.score}%"></b></i><span class="n">${a.score}</span><span class="chip ${a.band}">${esc(bandWord(a.band))}</span></div>` +
    a.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("") + `</div>`;
}
const bandWord = (b) => ({ low: "Low", medium: "Medium", high: "High" })[b] || b;

/* ---------- 3. Your Invisible Work ---------- */
function invisible(m) {
  const iw = m.invisible, I = REPORT.invisible;
  let out = `<section class="sheet">${kicker(I.title)}<div class="iw-head"><h1 class="h1">${esc(iw.h)}</h1><p class="lead">${esc(iw.body)}</p></div>`;
  if (iw.strip) {
    const states = monthsStates(iw.fill, iw.reserves, iw.horizon);
    out += `<div class="lease-wrap keep"><p class="lease-t">${esc(iw.strip.label)}</p>${monthsStrip(iw.fill, iw.reserves, { horizon: iw.horizon, label: `${iw.strip.label}: ${states.map((st) => iw.strip.legend[st]).join(", ")}` })}` +
      `<ul class="lease-key">${states.map((st) => `<li class="k-${st}"><i></i>${esc(iw.strip.legend[st])}</li>`).join("")}</ul></div>`;
  }
  const box = iw.box ? `<div class="box"><h3>${esc(I.box.title)}</h3><ol>${iw.box.map((l) => `<li><span>${esc(l)}</span></li>`).join("")}</ol></div>` : "";
  const slower = iw.slower ? `<div class="block tight"><h3 class="h3">${esc(iw.slower.title)}</h3><p>${esc(iw.slower.text)}</p></div>` : "";
  if (box && slower) out += `<div class="two iw-two">${box}${slower}</div>`;
  else out += box ? `<div class="mt-s">${box}</div>` : slower;
  out += `<div class="callout blue mt">${ALERT}<span><b>${esc(iw.means.title)}.</b> ${esc(iw.means.body)}</span></div>`;
  return out + `</section>`;
}

/* ---------- 3b. Three checks RoomIQ can't do for you (content/checks.mjs) ---------- */
function checksPage(m) {
  const c = m.checks;
  if (!c) return "";
  const item = (it, i) => `<div class="chk keep"><span class="chk-n">${i + 1}</span><div><h3>${esc(it.title)}${it.status ? ` <span class="chip ${it.status.mark === "done" ? "ahead" : it.status.mark === "partly" ? "mid" : "behind"}">${it.status.mark === "done" ? TICK : ALERT}${esc(it.status.label)}</span>` : ""}</h3>` +
    `<p>${esc(it.body)}</p>${it.note ? `<p class="small">${esc(it.note)}</p>` : ""}<p class="chk-ask"><b>${esc(it.ask)}</b></p>${it.status ? `<p class="small">${esc(it.status.text)}</p>` : ""}</div></div>`;
  return `<section class="sheet">${kicker(c.title)}<h1 class="h1">${esc(c.title)}</h1><p class="lead mt-s">${esc(c.lead)}</p><div class="chks mt">${c.items.map(item).join("")}</div>` +
    `<p class="small mt">${esc(c.notAdvice)}</p></section>`;
}

/* ---------- 4. Next to the Top Three ---------- */
function topThree(m, opts) {
  const t = m.top3;
  if (!t.available) {
    if (!opts.preview || m.enrichment === false) return "";
    return `<section class="sheet">${kicker(REPORT.top3.title)}<h1 class="h1">${esc(t.h)}</h1><div class="callout mt">${ALERT}<span>${esc(REPORT.top3.pending)} Fill in the public profile in the admin.</span></div></section>`;
  }
  const C = REPORT.top3.columns;
  const rows = t.rows.filter((r) => r.you || r.them).map((r) => `<tr><td class="m">${esc(r.label)}</td><td class="v" data-h="${esc(t.youHead)}">${esc(r.you || REPORT.notRead)}</td><td class="v them" data-h="${esc(C.them)}">${esc(r.them || REPORT.notRead)}</td>` +
    `<td class="r">${r.read ? `<span class="chip ${r.read}">${r.read === "ahead" ? TICK : ALERT}${esc(REPORT.top3.chips[r.read])}</span><br>${esc(r.text)}` : ""}</td></tr>`).join("");
  return `<section class="sheet">${kicker(REPORT.top3.title)}<h1 class="h1">${esc(t.h)}</h1><p class="lead mt-s">${esc(t.intro)}</p>` +
    `<table class="t3"><thead><tr><th>${esc(C.measure)}</th><th class="you">${esc(t.youHead)}</th><th>${esc(C.them)}</th><th>${esc(C.read)}</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<div class="two">` +
    (t.themes.length ? `<div class="box"><h3>${esc(REPORT.top3.themesTitle)}</h3>${t.themes.map((x) => `<p>${esc(x)}</p>`).join("")}<p class="small mt-s">${esc(REPORT.top3.themesRule)}</p></div>` : "") +
    (t.cushion ? `<div class="box"><h3>${esc(REPORT.top3.cushionTitle)}</h3><p>${esc(t.cushion)}</p></div>` : "") +
    `</div><p class="small mt">${esc(t.footnote)}</p></section>`;
}

/* ---------- 5. Your Overall Score ---------- */
function overall(m) {
  const r = m.result, o = m.overall;
  const tier = SC.tiers.find((t) => t.key === r.tier);
  const scoreName = SC.scoreName || "Score";
  return `<section class="sheet">${kicker(REPORT.overall.title)}<div class="score-card">${donut(r.score, { label: `${scoreName} ${r.score} out of 100` })}<div><div class="tier">${esc(tier.name)}</div><p class="desc">${esc(tier.descriptor)}</p>` +
    `<p class="of">${esc(fill(REPORT.scoreOf, { score: r.score }))} · ${esc(scoreName)}</p>${o.deepenerNote ? `<span class="note-line"><span>${linkify(o.deepenerNote)}${o.deepenerLink ? ` <a href="${esc(o.deepenerLink)}">${esc(REPORT.overall.deepenerLinkText || o.deepenerLink)}</a>` : ""}</span></span>` : ""}</div></div>` +
    `<p class="mt">${esc(o.paragraph)}</p><h2 class="h2 mt">${esc(REPORT.overall.areasTitle)}</h2><div class="bars mt-s">` +
    m.areas.map((a) => `<div class="row" style="--c:${a.color}"><b>${esc(a.name)}</b><i><span style="--w:${a.score}%"></span></i><span class="n">${a.score}</span></div>`).join("") +
    `</div><p class="mt">${esc(o.interpretation)}</p>${o.urgency ? `<div class="urgency">${CLOCK}<span>${esc(o.urgency)}</span></div>` : ""}</section>`;
}

/* ---------- 6. Your strongest area ---------- */
function strongest(m) {
  const s = m.strongest, color = AREA_COLORS[s.area], score = m.result.areas[s.area].score;
  return `<section class="sheet" style="--c:${color}"><div class="area-head">${strongBadge(s.area)}<div><h1 class="h1">${esc(s.h)}</h1><p class="score">${esc(areaName(s.area))}: ${score} of 100</p></div></div>` +
    section(REPORT.labels.means, s.means, color) + section(REPORT.labels.next, s.next, color) + section(REPORT.labels.impact, s.impact, color) + `</section>`;
}
function section(label, part, color, extra = "") {
  return `<div class="sec" style="--c:${color}"><h3>${esc(label)}</h3><p class="lead">${esc(part.lead)}</p>${ticks(part.bullets, color)}${extra}</div>`;
}

/* ---------- 7. Your weakest area ---------- */
function weakest(m) {
  const w = m.weakest, color = AREA_COLORS[w.area], score = m.result.areas[w.area].score;
  const isChecks = w.quickWins.length && w.quickWins[0].check;
  const wins = w.quickWins.length ? `<div class="wins"><h4>${esc(isChecks ? REPORT.labels.checks : REPORT.labels.quickWins)}</h4><ol>${w.quickWins.map((q) => `<li><span>${esc(q.text)}</span></li>`).join("")}</ol></div>` : "";
  return `<section class="sheet" style="--c:${color}"><div class="area-head">${fixBadge(w.area)}<div><h1 class="h1">${esc(w.h)}</h1><p class="score">${esc(areaName(w.area))}: ${score} of 100</p></div></div>` +
    (w.urgency ? `<div class="urgency">${CLOCK}<span>${esc(w.urgency)}</span></div>` : "") +
    (w.cascade ? `<div class="callout blue">${ALERT}<span>${esc(w.cascade)}</span></div>` : "") +
    section(REPORT.labels.means, w.means, color) + section(REPORT.labels.next, w.next, color, wins) + section(REPORT.labels.impact, w.impact, color) +
    (w.ruleNote ? `<div class="callout mt">${ALERT}<span><b>${esc(w.ruleNote.title)}.</b> ${esc(w.ruleNote.body)}</span></div>` : "") + `</section>`;
}

/* ---------- 8. The Room-by-Room Underwrite (content/method.mjs) ---------- */
function methodIntro(m) {
  const I = m.method.intro;
  const rows = m.method.steps.map((st) => `<div class="mstep keep" style="--c:${st.color}"><span class="mnum">${st.n}</span><div class="mbody"><h3>${esc(st.t)}${st.first ? ` <span class="start-here">${esc(I.startHere)}</span>` : ""}</h3>` +
    `<p class="muted">${esc(st.name)}</p><p>${esc(st.standard)}</p></div><div class="mtoday"><span class="lbl">${esc(I.todayLabel)}</span>` +
    `<div class="meter"><i><b style="--w:${st.score}%"></b></i><span class="n">${st.score}</span></div><span class="chip ${chipClass(st.chip)}">${chipIcon(st.chip)}${esc(st.chipLabel)}</span></div></div>`).join("");
  return `<section class="sheet">${kicker(I.kicker)}<h1 class="h1">${esc(I.h1)}</h1><p class="lead mt-s">${esc(I.lead)}</p>` +
    (I.outcome ? `<div class="outcome keep"><h3>${esc(I.outcomeTitle)}</h3><p>${esc(I.outcome)}</p></div>` : "") +
    `<h2 class="h2 mt">${esc(I.stepsTitle)}</h2><div class="msteps mt-s">${rows}</div><p class="chain">${esc(I.chain)}</p>` +
    `<div class="callout blue">${CLOCK}<span><b>${esc(I.rhythmTitle)}.</b> ${esc(I.rhythm)}</span></div></section>`;
}
const chipClass = (c) => (c === "fix" ? "behind" : c === "high" ? "ahead" : c === "medium" ? "mid" : "behind");
const chipIcon = (c) => (c === "high" ? TICK : ALERT);

function methodGap(m) {
  const G = m.method.gap;
  const blocks = m.method.steps.map((st) => {
    const today = st.today.length || st.profile.length
      ? `<ul class="dots">${st.today.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>${st.profile.length ? `<p class="from">${esc(G.fromProfile)}</p><ul class="dots">${st.profile.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}`
      : "";
    return `<div class="gap keep" style="--c:${st.color}"><div class="gap-h">${icon(st.key, 34)}<h3>${esc(fill(G.step || "Step {n}: {t}", { n: st.n, t: st.t }))}</h3><span class="n">${esc(st.name)} ${st.score}</span>` +
      `<span class="chip ${chipClass(st.chip)}">${chipIcon(st.chip)}${esc(st.chipLabel)}</span></div><div class="gap-cols">` +
      `<div><h4>${esc(G.columns.today)}</h4>${today}</div><div><h4>${esc(G.columns.standard)}</h4><p>${esc(st.standard)}</p></div>` +
      `<div class="service"><h4>${mark(14)}${esc(G.columns.service)}</h4><p>${esc(st.service)}</p></div></div></div>`;
  });
  // More than four steps don't fit one page: split them evenly (five: three, then two) rather than leave one alone
  const split = blocks.length > 4 ? Math.ceil(blocks.length / 2) : blocks.length;
  const more = blocks.length > split ? `<section class="sheet">${kicker(G.kicker)}${G.more ? `<h2 class="h2">${esc(G.more)}</h2>` : ""}<div class="gaps mt-s">${blocks.slice(split).join("")}</div></section>` : "";
  return `<section class="sheet">${kicker(G.kicker)}<h1 class="h1">${esc(G.h1)}</h1><p class="lead mt-s">${esc(G.lead)}</p><div class="gaps mt">${blocks.slice(0, split).join("")}</div></section>` + more;
}

function ways(m) {
  const W = m.service.ways;
  const self = `<div class="way"><h3>${esc(W.self.title)}</h3><p>${esc(W.self.body)}</p>${ticks(W.self.bullets)}${W.self.note ? `<p class="small mt-s">${esc(W.self.note)}</p>` : ""}</div>`;
  const service = `<div class="way service"><h3>${mark(20)}${esc(W.service.title)}</h3><p>${esc(W.service.body)}</p><h4>${esc(W.service.startTitle)}</h4>` +
    `<ol class="four">${W.service.start.map((x) => `<li><span><b>${esc(x.t)}</b> ${esc(x.b)}</span></li>`).join("")}</ol><h4>${esc(W.service.listTitle)}</h4>${ticks(W.service.list, "var(--c-accent)")}</div>`;
  return `<section class="sheet">${kicker(W.kicker)}<h1 class="h1">${esc(W.h1)}</h1><p class="lead mt-s">${esc(W.lead)}</p><div class="ways mt">${self}${service}</div>` +
    `<div class="wont keep"><h2 class="h2">${esc(W.wontTitle)}</h2><div class="wont-row">${W.wont.map((x) => `<div><b>${esc(x.t)}</b><p>${esc(x.b)}</p></div>`).join("")}</div><p class="small mt-s">${esc(W.rules)}</p></div></section>`;
}

function firstDays(m) {
  const d = m.service.days;
  return `<section class="sheet">${kicker(d.kicker)}<h1 class="h1">${esc(d.h1)}</h1><p class="lead mt-s">${esc(d.lead)}</p><div class="timeline">` +
    d.phases.map((p, i) => `<div class="ph" style="--c:var(--c-accent)"><span class="dot">${i + 1}</span><div><h4>${esc(p.t)}</h4><p>${esc(p.b)}</p></div></div>`).join("") + `</div>` +
    d.yourStart.map((l) => `<div class="callout blue">${TICK}<span>${esc(l)}</span></div>`).join("") +
    `<div class="box mt keep"><h3>${esc(d.monthlyTitle)}</h3><p>${esc(d.monthly)}</p></div>` +
    `<div class="next-box keep"><p>${esc(d.cta)}${!d.booked && d.bookingLink ? ` <a href="${esc(d.bookingLink)}">${esc(METHOD.days.ctaLinkText || d.bookingLink)}</a>` : ""}</p></div></section>`;
}

/* ---------- 9. The playbook ---------- */
function playStart(m) {
  const s = PLAYBOOK.start;
  return `<section class="sheet">${kicker("The 30-day plan")}<h1 class="h1">${esc(s.title)}</h1><p class="lead mt-s">${esc(s.lead)}</p>` +
    `<h2 class="h2 mt">${esc(s.howTitle)}</h2><ol class="how">${s.how.map((h) => `<li><span><b>${esc(h.b)}</b> ${esc(h.t)}</span></li>`).join("")}</ol>` +
    `<p class="start-line">${esc(m.yourStart)}</p>` +
    `<table class="grid-t"><thead><tr>${s.sectionsHead.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.sections.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table></section>`;
}

function guide(m, key) {
  const g = PLAYBOOK.guides[key], L = PLAYBOOK.guideLabels, color = AREA_COLORS[key];
  const notes = (m.notesByArea[key] || []);
  return `<section class="sheet" style="--c:${color}"><div class="guide-head">${icon(key, 52)}<h1 class="h1">${esc(g.title)}</h1></div><p class="tagline">${esc(g.tagline)}</p>` +
    (notes.length ? `<div class="callout blue">${TICK}<span><b>${esc(L.fromAnswers)}:</b> ${notes.map(esc).join(" ")}</span></div>` : "") +
    `<div class="vs"><div class="hd without">${esc(g.withoutHead)}</div><div class="hd with">${esc(g.withHead)}</div>${g.compare.map(([a, b]) => `<div class="without">${esc(a)}</div><div class="with">${esc(b)}</div>`).join("")}</div>` +
    `<h2 class="h2 mt">${esc(fill(L.method, { method: g.method }))}</h2><div class="phases">${g.phases.map((p, i) => `<div class="phase"><h4>${esc(fill(L.phase, { n: i + 1, t: p.t }))}</h4><em>${esc(p.s)}</em><ul>${p.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>` +
    `<div class="keep"><h2 class="h2 mt">${esc(L.mistakes)}</h2><ul class="mistakes">${g.mistakes.map((x) => `<li>${XMARK}<span>${esc(x)}</span></li>`).join("")}</ul>` +
    `<div class="protocol"><h4>${esc(L.protocol)}: ${esc(g.protocol.title)}</h4><p><b>${esc(L.frequency)}</b> ${esc(g.protocol.frequency)}</p><p><b>${esc(L.format)}</b> ${esc(g.protocol.format)}</p><p><b>${esc(L.review)}</b> ${esc(g.protocol.review)}</p><p><b>${esc(L.classify)}</b> ${esc(g.protocol.classify)}</p></div></div></section>`;
}

function timeline() {
  const t = PLAYBOOK.timeline;
  return `<section class="sheet">${kicker("The 30-day plan")}<h1 class="h1">${esc(t.title)}</h1><p class="lead mt-s">${esc(t.lead)}</p><div class="timeline">` +
    t.phases.map((p, i) => `<div class="ph" style="--c:${AREA_COLORS[p.area]}"><span class="dot">${i + 1}</span><div><h4>${esc(p.t)}</h4><p class="focus">${esc(t.focus)} ${esc(p.focus)}</p><ul>${p.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="out"><b>${esc(t.outcome)}</b> ${esc(p.outcome)}</p></div></div>`).join("") +
    `</div></section>`;
}

function quickStart() {
  const q = PLAYBOOK.quickStart;
  return `<section class="sheet">${kicker("The 30-day plan")}<h1 class="h1">${esc(q.title)}</h1>${img("quickStart")}<div class="days">` +
    q.days.map((d, i) => `<div class="day"><span class="d">${i + 1}</span><div><h4>${esc(d.t)}<small>${esc(d.m)}</small></h4><p>${esc(d.body)}</p></div></div>`).join("") +
    `</div><p class="total">${esc(q.total)}</p></section>`;
}

function checklists() {
  const c = PLAYBOOK.checklists;
  return `<section class="sheet">${kicker("The 30-day plan")}<h1 class="h1">${esc(c.title)}</h1>` + SC.areas.map((a) =>
    `<div class="keep"><div class="check-h">${icon(a.key, 30)}<h2 class="h2">${esc(a.name)}</h2></div><table class="grid-t check-t"><thead><tr>${c.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    c[a.key].map(([x, y]) => `<tr><td>${esc(x)}</td><td>${esc(y)}</td><td class="s"><span></span></td></tr>`).join("") + `</tbody></table></div>`).join("") + `</section>`;
}

function tracker(m) {
  const t = PLAYBOOK.tracker;
  const startFor = (i) => (i < SC.areas.length ? m.startRatings[SC.areas[i].key] : "");
  return `<section class="sheet">${kicker("The 30-day plan")}<h1 class="h1">${esc(t.title)}</h1><p class="lead mt-s">${esc(t.lead)}</p>` +
    `<table class="grid-t tracker"><thead><tr>${t.head.slice(0, 1).map((h) => `<th>${esc(h)}</th>`).join("")}<th>${esc(t.startLabel)}</th>${t.head.slice(1).map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    t.rows.map(([label, target], i) => `<tr><td>${esc(label)}</td><td class="start">${startFor(i)}</td><td></td><td></td><td></td><td></td><td>${esc(target)}</td></tr>`).join("") + `</tbody></table>` +
    `<div class="cols"><div class="list-box"><h4>${esc(t.commitmentsTitle)}</h4><ul>${t.commitments.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` +
    `<div class="list-box"><h4>${esc(t.rememberTitle)}</h4><ul>${t.remember.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></section>`;
}

function nextStep(m) {
  const P = PLAYBOOK.next, n = m.next;
  return `<section class="sheet">${kicker("Your next step")}<h1 class="h1">${esc(P.title)}</h1>${img("next")}<p class="lead">${esc(P.lead)}</p>` +
    `<div class="next-box"><h3>${esc(P.boxTitle)}</h3><p>${esc(n.boxBody)}</p><p class="fit">${esc(n.fitLine)}</p>` +
    (n.booked ? `<p class="pick">${esc(n.booked)}</p>` : n.bookingLink ? `<p class="pick">${esc(P.pick)} <a href="${esc(n.bookingLink)}">${esc(P.pickLinkText || n.bookingLink)}</a></p>` : "") + `</div>` +
    `<div class="after"><p><b>${esc(P.master)}</b> <a href="${esc(forecastLink())}">${esc(P.masterLink)}</a></p><p>${esc(P.self)}</p></div></section>`;
}
/** The free forecast (site.forecastUrl), with src=scorecard and the scorecard as the source, as every report link into RoomIQ. */
function forecastLink() {
  try {
    const u = new URL(SITE.forecastUrl || SITE.masterUrl);
    u.searchParams.set("src", "scorecard");
    u.searchParams.set("utm_source", "scorecard");
    u.searchParams.set("utm_medium", "report");
    u.searchParams.set("utm_campaign", SC.id);
    return u.href;
  } catch (e) { return SITE.masterUrl; }
}
