/* The First Deal Risk Scorecard: the pages' script. tools/build.mjs wraps it in one function with lib/scoring.mjs,
   lib/booking.mjs, lib/icons.mjs and lib/quiz-markup.mjs, so the score on screen is the server's score.
   One script, by page (body[data-page]): the landing pages and /start run the quiz; /results/<token> shows the result
   and the call step; /sharpen/<token> runs the deepener; /unsubscribe/<token> unsubscribes. */

"use strict";
const DATA = JSON.parse(document.getElementById("sc-data").textContent);
const SC = DATA.sc, SITE = DATA.site, UI = DATA.ui, RES = DATA.results, LEGAL = DATA.legal;
const BRAND_SLUG = (DATA.brand && DATA.brand.slug) || "scorecard";
useAreas(SC);
usePalette(DATA.brand && DATA.brand.colors);
const PAGE = document.body.dataset.page, VARIANT = document.body.dataset.variant || "";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const root = document.documentElement;
root.classList.remove("no-js");
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!REDUCE) root.classList.add("motion");
const esc = escHtml;
const ic = (id) => useIcon(id);
/** A template's text escaped, its placeholders filled with bold, escaped values. */
const fillHtml = (t, vars) => esc(t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? `<b>${esc(vars[k])}</b>` : m));

/* ---------- Session storage (it can throw in private modes: the page then just forgets on reload) ---------- */
const ss = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* not kept */ } }
};
const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
let visit = ss.get("sc-visit");
if (!visit) { visit = newId(); ss.set("sc-visit", visit); }
const ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src"];
const attr = Object.assign({}, ss.get("sc-attr"));
const qs = new URLSearchParams(location.search);
ATTR.forEach((k) => { const v = qs.get(k); if (v) attr[k] = v.slice(0, 300); });
if (qs.get("fbclid") && !attr.fbclidAt) attr.fbclidAt = Date.now();
if (!attr.referrer && document.referrer && !document.referrer.startsWith(location.origin)) attr.referrer = document.referrer.slice(0, 500);
ss.set("sc-attr", attr);
// The landing variant this visit came through, kept for the results page and the deepener
if (VARIANT) ss.set("sc-variant", VARIANT);
const variantNow = () => VARIANT || ss.get("sc-variant") || "";

/* ---------- Consent: advertising and analytics tools only after Allow, never with Global Privacy Control ---------- */
const GPC = navigator.globalPrivacyControl === true;
// The visitor's cookie choice, kept in their browser under the brand's slug ("roomiq-first-deal-consent")
const CONSENT_KEY = `${BRAND_SLUG}-consent`;
function readConsent() { try { const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); return c && (c.ads === "granted" || c.ads === "denied") ? c : null; } catch (e) { return null; } }
function writeConsent(ads) { try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, ads, at: new Date().toISOString(), src: "notice" })); } catch (e) { /* asked again next visit */ } }
const consentState = () => (GPC ? "denied" : (readConsent() || {}).ads || "unset");
const adsAllowed = () => { const s = consentState(); return s === "granted" || (s === "unset" && SITE.trackingConsent === "notice"); };
function loadTrackers() {
  if (window.__scTrackers || !adsAllowed()) return;
  window.__scTrackers = true;
  if (SITE.metaPixelId) {
    try {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", SITE.metaPixelId);
      window.fbq("track", "PageView");
    } catch (e) { /* tracking never breaks the page */ }
  }
  if (SITE.clarityId) {
    try { (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", SITE.clarityId); } catch (e) { /* never breaks the page */ }
  }
}
const notice = document.getElementById("cookie-notice");
if (notice) {
  if (!GPC && !readConsent()) notice.hidden = false;
  $$("[data-consent]", notice).forEach((b) => b.addEventListener("click", () => {
    writeConsent(b.dataset.consent);
    notice.hidden = true;
    if (b.dataset.consent === "granted") loadTrackers(); else if (window.__scTrackers) location.reload();
  }));
}
$$("[data-cookie-settings]").forEach((b) => b.addEventListener("click", () => { if (notice) { notice.hidden = false; const f = $("[data-consent]", notice); if (f) f.focus(); } }));
loadTrackers();

/* ---------- Events: Meta (only once allowed), the dataLayer, and the page's own analytics (/api/track: first party,
   no cookies, nothing personal). Meta hears the GTM's event map only (site.metaEvents): ScorecardStart when the quiz is
   first opened, ScorecardComplete for every completed scorecard (with the server's Conversions API, one event_id), and
   Schedule for a qualified walkthrough booking ---------- */
const STANDARD = ["Lead", "Schedule", "InitiateCheckout"];
const ME = SITE.metaEvents || {};
/** One of the GTM's Meta events, by kind (start, complete, schedule); off when site.metaEvents names none. */
function metaEvent(kind, params, eventID) {
  const name = ME[kind];
  if (!name) return;
  pixel(name, Object.assign({ content_name: ME.contentName || "scorecard" }, params || {}), eventID);
}
window.__scEvents = window.__scEvents || [];
function pixel(name, params, eventID) {
  const p = Object.assign({ variant: variantNow() }, params || {});
  window.__scEvents.push({ name, params: p, eventID: eventID || null });
  if (adsAllowed() && typeof window.fbq === "function") {
    try { window.fbq(STANDARD.includes(name) ? "track" : "trackCustom", name, p, eventID ? { eventID } : undefined); } catch (e) { /* never breaks the page */ }
  }
  (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: `${BRAND_SLUG}_${name}` }, p));
}
let queue = [];
let flushTimer = null;
/** One analytics event: its name, the step, and for an answered step how long it took (extra: { ms }). */
function hit(name, step, extra) {
  const e = Object.assign({ name, step: step || "" }, extra || {});
  queue.push(e);
  window.__scHits = (window.__scHits || []).concat([e]);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 1200);
}
function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ visit, variant: variantNow(), source: sourceFrom(attr), events: queue.splice(0, 40) });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(SITE.endpoints.track, new Blob([body], { type: "text/plain" }))) return;
  } catch (e) { /* fall through */ }
  fetch(SITE.endpoints.track, { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true }).catch(() => {});
}
addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
const cookie = (n) => { const m = document.cookie.match(`(?:^|; )${n}=([^;]*)`); return m ? decodeURIComponent(m[1]) : ""; };
const fbc = () => cookie("_fbc") || (attr.fbclid ? `fb.1.${attr.fbclidAt || Date.now()}.${attr.fbclid}` : "");
const tracking = (extra) => {
  const out = consentState() === "denied";
  return Object.assign({ fbc: out ? "" : fbc(), fbp: out ? "" : cookie("_fbp"), gpc: GPC, consent: consentState() }, extra);
};
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } };
/** The screen and the language, for the admin's device view (the privacy policy's "browser and device type"). */
const clientInfo = () => {
  try { return { vw: innerWidth, vh: innerHeight, sw: screen.width, sh: screen.height, dpr: devicePixelRatio, lang: navigator.language || "", touch: navigator.maxTouchPoints || 0 }; } catch (e) { return {}; }
};

/* ---------- Sending ---------- */
async function post(body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(SITE.endpoints.scorecard, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    let data = null;
    try { data = await r.json(); } catch (e) { data = null; }
    return { ok: r.ok && data && data.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  } finally { clearTimeout(timer); }
}
const tokenFromPath = (prefix) => { const m = new RegExp(`^/${prefix}/([A-Za-z0-9_-]{5,64})/?$`).exec(location.pathname); return m ? m[1] : ""; };
const spinner = (label) => `<span class="spin" aria-hidden="true"></span><span>${esc(label)}</span>`;

/* ============================================================
   The quiz engine: one step at a time; a tap answers and moves on; fields are checked before moving on
   ============================================================ */
function makeQuiz(card, { onSubmit, onStep, onStart, kind }) {
  const form = $(".gc-form", card);
  const steps = $$(".gc-step", form);
  const N = steps.length;
  const counter = $(".gc-count", card);
  const bar = $(".gc-bar i", card);
  let at = 0, started = false, busy = false;
  const values = {};
  // The clock runs only while the page is on screen: each step's time (the first one's includes reading the page
  // before the first tap), the time before the first answer, the whole quiz from the first answer to the last, how
  // often the visitor went Back, and how often they left the page mid-quiz (to look a number up, say)
  const now = () => performance.now();
  const clock = { steps: {}, backs: 0, aways: 0, hidden: 0, hiddenAt: document.visibilityState === "hidden" ? now() : null, openAt: null, first: null, sent: {} };
  const onScreen = () => now() - clock.hidden - (clock.hiddenAt !== null ? now() - clock.hiddenAt : 0);
  function stopClock() {
    if (clock.openAt === null) return;
    const id = steps[at].dataset.id;
    clock.steps[id] = (clock.steps[id] || 0) + (now() - clock.openAt);
    clock.openAt = null;
  }
  const startClock = () => { clock.openAt = document.visibilityState === "hidden" ? null : now(); };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopClock();
      if (clock.hiddenAt === null) clock.hiddenAt = now();
      if (started && !busy) clock.aways += 1;
    } else {
      if (clock.hiddenAt !== null) { clock.hidden += now() - clock.hiddenAt; clock.hiddenAt = null; }
      startClock();
    }
  });
  const stepMs = (id) => Math.round((clock.steps[id] || 0) + (clock.openAt !== null && steps[at].dataset.id === id ? now() - clock.openAt : 0));
  function timing() {
    const out = { steps: {}, backs: clock.backs, aways: clock.aways };
    steps.forEach((s) => { const ms = stepMs(s.dataset.id); if (ms > 0) out.steps[s.dataset.id] = ms; });
    if (clock.first !== null) { out.landingMs = Math.round(clock.first); out.totalMs = Math.round(onScreen() - clock.first); }
    return out;
  }
  function show(i, focus) {
    stopClock();
    at = Math.max(0, Math.min(N - 1, i));
    startClock();
    steps.forEach((s, k) => { s.hidden = k !== at; s.classList.toggle("enter", k === at); });
    if (counter) counter.textContent = UI.count.replace("{n}", at + 1).replace("{total}", N);
    if (bar) bar.style.setProperty("--p", `${Math.round(((at + 1) / N) * 100)}%`);
    if (focus) {
      const s = steps[at];
      const first = s.dataset.kind === "fields" ? $("input:not([type=checkbox]):not([type=radio])", s) : $(".gc-q", s);
      if (first) first.focus({ preventScroll: true });
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight * 0.5) card.scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
    }
  }
  const err = (s, msg) => { const e = $(".err", s); if (e) e.textContent = msg || ""; };
  function check(s) {
    err(s, "");
    if (s.dataset.kind === "choice") {
      const picked = $("input:checked", s);
      $(".gc-opts", s).setAttribute("aria-invalid", picked ? "false" : "true");
      if (!picked) { err(s, UI.pick); return false; }
      return true;
    }
    for (const inp of $$(".field input", s)) {
      inp.setAttribute("aria-invalid", "false");
      const v = inp.value.trim();
      if (inp.required && !v) { inp.setAttribute("aria-invalid", "true"); err(s, UI.required); inp.focus(); return false; }
      if (inp.type === "email" && v && !/^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/.test(v)) { inp.setAttribute("aria-invalid", "true"); err(s, UI.email); inp.focus(); return false; }
    }
    const chips = $(".chips", s);
    if (chips && !$("input:checked", chips)) { chips.setAttribute("aria-invalid", "true"); err(s, UI.profiles); return false; }
    if (chips) chips.setAttribute("aria-invalid", "false");
    const consent = $(".consent input[required]", s);
    if (consent && !consent.checked) { err(s, UI.consent); consent.focus(); return false; }
    return true;
  }
  function collect() {
    for (const inp of $$("input", form)) {
      if (inp.name === "hp") continue;
      if (inp.type === "radio") { if (inp.checked) values[inp.name] = inp.value; }
      else if (inp.type === "checkbox") values[inp.name] = inp.checked;
      else values[inp.name] = inp.value.trim();
    }
    return values;
  }
  function answered(s) {
    if (!started) { started = true; clock.first = onScreen(); if (onStart) onStart(); }
    s.dataset.answered = "1";
    // A step's time goes out with its first answer only; a changed answer adds to the total sent with the quiz
    const id = s.dataset.id;
    const ms = clock.sent[id] ? undefined : stepMs(id);
    clock.sent[id] = true;
    if (onStep) onStep(s, at, ms);
  }
  form.addEventListener("change", (e) => {
    const s = e.target.closest(".gc-step");
    if (!s || e.target.type !== "radio" || s.dataset.kind !== "choice") return;
    err(s, "");
    $(".gc-opts", s).setAttribute("aria-invalid", "false");
    const isLast = steps.indexOf(s) === N - 1;
    answered(s);
    if (!isLast) setTimeout(() => { if (!s.hidden) show(steps.indexOf(s) + 1, true); }, REDUCE ? 0 : 220);
    else { const b = $(".gc-submit", s); if (b) b.focus(); }
  });
  form.addEventListener("click", (e) => {
    const s = e.target.closest(".gc-step");
    if (!s) return;
    if (e.target.closest(".gc-back")) { clock.backs += 1; show(steps.indexOf(s) - 1, true); return; }
    const next = e.target.closest(".gc-next:not(.gc-submit)");
    if (next && check(s)) { if (s.dataset.kind === "fields") answered(s); show(steps.indexOf(s) + 1, true); }
  });
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.target.type === "checkbox") return;
    const s = e.target.closest(".gc-step");
    if (steps.indexOf(s) === N - 1) return;
    e.preventDefault();
    if (check(s)) { answered(s); show(steps.indexOf(s) + 1, true); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const s = steps[N - 1];
    // Every step must be answered: a skipped one (a step shown again after Back) takes the visitor there
    for (let k = 0; k < N; k++) { if (!check(steps[k])) { show(k, true); return; } }
    if ($("input[name=hp]", form) && $("input[name=hp]", form).value) return;
    answered(s);
    busy = true;
    card.classList.add("gc-sending");
    const btn = $(".gc-submit", s);
    const label = btn.innerHTML;
    btn.innerHTML = spinner(kind === "deepener" ? RES.deepener.sending : UI.sending);
    btn.setAttribute("aria-busy", "true");
    try { await onSubmit(collect(), (msg) => err(s, msg), timing()); }
    finally { busy = false; card.classList.remove("gc-sending"); btn.innerHTML = label; btn.removeAttribute("aria-busy"); }
  });
  show(0, false);
  return { show, collect, steps, timing };
}

/* ============================================================
   The hero quiz: the landing pages and /start
   ============================================================ */
function heroQuiz(card) {
  const scored = SC.steps;
  return makeQuiz(card, {
    kind: "hero",
    onStart() {
      hit("start");
      // "Scorecard opened for the first time": once per visit
      if (!ss.get("sc-started")) { ss.set("sc-started", true); metaEvent("start"); }
    },
    onStep(s, i, ms) { hit("step", s.dataset.id, ms !== undefined ? { ms } : null); },
    async onSubmit(v, fail, timing) {
      const answers = {};
      for (const c of heroChoices(SC)) if (typeof v[c.key] === "string") answers[c.key] = v[c.key];
      const local = evaluate(SC, answers);
      // The completion's event id: the browser's pixel and the server's Conversions API send the same one
      const leadEventId = `complete-${visit.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40)}`;
      const body = Object.assign({ action: "submit", answers, company: v.company, city: v.city, firstName: v.firstName, email: v.email, consentEmail: v.consentEmail === true,
        visit, variant: variantNow(), page: location.href.slice(0, 1000), referrer: attr.referrer || "", tz: tz(), noticeVersion: SITE.noticeVersion,
        timing, client: clientInfo(), tracking: tracking({ leadEventId }) }, Object.fromEntries(ATTR.filter((k) => attr[k]).map((k) => [k, attr[k]])));
      const r = await post(body);
      hit("submit");
      if (r.ok && r.data.token) {
        metaEvent("complete", {}, leadEventId);
        ss.set(`sc-r-${r.data.token}`, { fresh: true, email: v.email, firstName: v.firstName, business: v.company, city: v.city, result: r.data.result, deepener: r.data.deepener, at: Date.now() });
        flush();
        location.assign(`/results/${r.data.token}`);
        return;
      }
      if (r.status === 400 || r.status === 429) { fail((r.data && r.data.error) || UI.failed); return; }
      if (r.status === 0) { fail(UI.failed); return; }
      // Not saved (the store or the network failed after the notices): the score still shows, from the same scoring
      ss.set("sc-r-local", { fresh: true, local: true, email: v.email, firstName: v.firstName, business: v.company, city: v.city, result: (r.data && r.data.result) || publicView(local), at: Date.now() });
      flush();
      location.assign("/results/local");
    }
  });
}
/** The browser's own result, trimmed like the server's (api/_lib/views.mjs publicResult). */
function publicView(r) {
  return { score: r.score, tier: r.tier, tierName: r.tierName, tierDescriptor: r.tierDescriptor, areas: Object.fromEntries(Object.entries(r.areas).map(([k, a]) => [k, { score: a.score, band: a.band }])),
    invisible: r.invisible, bottleneck: { primary: r.bottleneck.primary, maintenance: r.bottleneck.maintenance, lineKey: r.bottleneck.lineKey, line: r.bottleneck.line, cascadeLine: r.bottleneck.cascadeLine || null },
    callOnly: r.callOnly, service: r.service, qualified: r.qualified, covered: r.covered !== false, market: r.market || null };
}

function landing() {
  hit("view");
  const card = $("#quiz");
  if (!card) return;
  heroQuiz(card);
  const dlg = $("#quiz-dlg");
  const sticky = $("#sticky");
  const openQuiz = () => {
    if (dlg) {
      if (!dlg.open) { dlg.showModal(); document.body.classList.add("sheet-open"); }
      setTimeout(() => { const s = $$(".gc-step", card).find((x) => !x.hidden); const q = s && $(".gc-q", s); if (q) q.focus({ preventScroll: true }); }, 60);
    } else {
      card.scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
      setTimeout(() => { const s = $$(".gc-step", card).find((x) => !x.hidden); const q = s && $(".gc-q", s); if (q) q.focus({ preventScroll: true }); }, REDUCE ? 0 : 450);
    }
  };
  $$("[data-start]").forEach((b) => b.addEventListener("click", openQuiz));
  if (dlg) {
    const close = () => { dlg.close(); };
    $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", close));
    dlg.addEventListener("close", () => document.body.classList.remove("sheet-open"));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  }
  // The sticky bar (phones): once the hero's action is off screen, and never over the quiz or the close
  if (sticky && "IntersectionObserver" in window) {
    const hero = $(".hero-cta") || card;
    const closeSec = $(".banner-cta") || $("#close");
    let heroOut = false, closeIn = false;
    const update = () => { const on = heroOut && !closeIn && !(dlg && dlg.open); sticky.classList.toggle("show", on); sticky.setAttribute("aria-hidden", on ? "false" : "true"); };
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(hero);
    if (closeSec) new IntersectionObserver(([e]) => { closeIn = e.isIntersecting; update(); }).observe(closeSec);
    if (dlg) dlg.addEventListener("close", update);
  }
}

/* ============================================================
   The results page
   ============================================================ */
const areaOf = (k) => SC.areas.find((a) => a.key === k);
async function resultsPage() {
  const token = tokenFromPath("results");
  const box = $("#results");
  if (!token) { box.innerHTML = notFound(); return; }
  let view = ss.get(`sc-r-${token}`);
  if (!view && token !== "local") {
    try {
      const r = await fetch(`${SITE.endpoints.scorecard}?token=${encodeURIComponent(token)}`, { headers: { accept: "application/json" } });
      const d = await r.json();
      if (r.ok && d.ok) view = { fresh: false, firstName: d.firstName, business: d.business, city: d.city, result: d.result, deepener: d.deepener, booked: d.booked };
    } catch (e) { view = null; }
  }
  if (!view || !view.result) { box.innerHTML = notFound(); return; }
  renderResults(box, token, view);
  hit("result");
  if (view.fresh) { view.fresh = false; ss.set(`sc-r-${token}`, view); }
}
const notFound = () => `<div class="card done-card"><h2 class="h3">${esc(RES.notFound)}</h2><a class="btn btn-primary" href="/">${esc(RES.retake)}</a></div>`;

function renderResults(box, token, view) {
  const r = view.result, local = token === "local";
  const tier = SC.tiers.find((t) => t.key === r.tier) || {};
  const iw = r.invisible;
  // The lease-up gap (spec 1, section 4): its words, its math line and the six-month strip
  const ivars = gapVars(iw);
  const mathKey = { gap: "gapMath", exact: "exactMath", covered: "coveredMath", costOnly: "costOnlyMath", perMonth: "perMonthMath" }[iw.kind];
  const I = RES.invisible;
  let strip = "";
  if (I.strip && typeof iw.fill === "number") {
    const states = monthsStates(iw.fill, iw.reserves, iw.horizon || 6);
    const said = states.map((st) => I.legend[st]).join(", ");
    strip = `<div class="lease"><p class="houses-l">${esc(I.strip)}</p>${monthsStrip(iw.fill, iw.reserves, { horizon: iw.horizon || 6, label: `${I.strip} ${said}.` })}` +
      `<ul class="lease-key">${states.map((st) => `<li class="k-${st}"><i aria-hidden="true"></i>${esc(I.legend[st])}</li>`).join("")}</ul></div>`;
  }
  const areaWord = ["", "one", "two", "three", "four", "five", "six"][SC.areas.length] || String(SC.areas.length);
  const cascadeHtml = r.bottleneck.cascadeLine ? `<p class="cascade-l">${esc(r.bottleneck.cascadeLine)}</p>` : "";
  const fixHtml = r.bottleneck.maintenance
    ? `<p class="fix ok">${ic("i-check")}<span>${esc(r.bottleneck.line)}</span></p>`
    : `<p class="fix">${ic("i-alert")}<span>${fillHtml(I.fixFirst, { bottleneck: areaOf(r.bottleneck.primary).name, bottleneck_line: null }).replace("{bottleneck_line}", esc(r.bottleneck.line))}</span></p>${cascadeHtml}`;
  const deepShown = (view.deepener && view.deepener.shown) || [];
  const deepDone = view.deepener && view.deepener.done;
  const nDeep = deepShown.length;
  const header = `<div class="res-head"><p class="thanks">${esc(RES.header.thanks.replace("{first_name}", view.firstName || ""))}</p><h1>${esc(RES.header.name)}</h1>` +
    `<p>${esc(view.email ? RES.header.email.replace("{email}", view.email) : RES.header.returning)}</p></div>`;
  const scoreCard = `<section class="card" aria-labelledby="score-l"><div class="score-top">${donut(r.score, { label: `${SC.scoreName || "Score"} ${r.score} out of 100` })}<div>` +
    `<span class="tier-chip t-${esc(r.tier)}">${esc(tier.name)}</span><p class="score-label" id="score-l">${esc(RES.score.label.replace("{score}", r.score).replace("{tier}", tier.name))}</p><p class="score-desc">${esc(tier.descriptor)}</p></div></div>` +
    `<p class="score-intro">${esc(RES.score.intro)}</p></section>`;
  const iwCard = `<section class="card iw" aria-label="${esc((SC.metric && SC.metric.name) || "Your result")}">${strip}` +
    `<p class="iw-big">${fillHtml(I[iw.kind], ivars)}</p>${mathKey ? `<p class="iw-math">${esc(fill(I[mathKey], ivars))}</p>` : ""}` +
    (strip && I.notForecast ? `<p class="iw-note">${esc(I.notForecast)}</p>` : "") + `${fixHtml}</section>`;
  const bars = `<section class="card" aria-labelledby="bars-h"><h2 class="h3" id="bars-h" style="margin-bottom:14px">${esc(RES.areasTitle || `Your ${areaWord} areas`)}</h2><div class="bars4">` +
    SC.areas.map((a) => `<div class="row" style="--a:var(--a-${a.key})"><span>${esc(a.name)}</span><i><span style="--w:${r.areas[a.key].score}%"></span></i><span class="n">${r.areas[a.key].score}</span></div>`).join("") +
    `</div><p class="res-summary" style="margin-top:16px">${esc(RES.summary)}</p></section>`;
  const cards = `<div class="acards">${SC.areas.map((a) => {
    const band = r.areas[a.key].band;
    return `<article class="acard" style="--a:var(--a-${a.key})"><div class="acard-h">${icon(a.key, 44)}<h3>${esc(a.name)}</h3><span class="n">${r.areas[a.key].score}</span></div>` +
      `<span class="band ${band}">${esc(RES.bandLabels[band])}</span><p>${esc(RES.cards[a.key][band])}</p><p class="rec"><b>${esc(RES.recommendations[band].split(". ")[0])}.</b> ${esc(RES.recommendations[band].split(". ").slice(1).join(". "))}</p></article>`;
  }).join("")}</div>`;
  const C = RES.cta;
  const ctaHtml = {
    report: () => RES.report ? `<section class="cta-card" id="report"><div class="cta-top">${imgTag(RES.report.img)}<h3>${esc(RES.report.h3)}</h3></div><p>${esc(RES.report.body)}</p>` +
      `<div class="cta-row"><a class="btn btn-primary" href="/report/${esc(token)}" data-cta="report">${esc(RES.report.button)}</a><a class="btn btn-line" href="/report/${esc(token)}/pdf?download=1" data-cta="pdf">${esc(RES.report.pdf)}</a></div></section>` : "",
    call: () => `<section class="cta-card main" id="call"><div class="cta-top">${imgTag(C.call.img)}<h3>${esc(C.call.h3)}</h3></div><div data-call>${view.booked ? bookedHtml(view.booked, view) : `<p>${esc(C.call.body)}</p><button type="button" class="btn btn-primary" data-book-open>${esc(C.call.button)}</button>`}</div></section>`,
    sharpen: () => nDeep ? `<section class="cta-card" id="sharpen"><div class="cta-top">${imgTag(C.sharpen.img)}<h3>${esc(C.sharpen.h3)}</h3></div>` +
      (deepDone ? `<p class="done-l">${ic("i-check")}${esc(C.sharpen.done.replace("{n}", view.deepener.answered || nDeep))}</p>`
        : `<p>${esc(C.sharpen.bodyN.replace("{n}", nDeep))}</p><a class="btn btn-line" href="/sharpen/${esc(token)}" data-cta="sharpen">${esc(C.sharpen.buttonN.replace("{n}", nDeep))}</a>`) + `</section>` : "",
    service: () => `<section class="cta-card"><div class="cta-top">${imgTag(C.service.img)}<h3>${esc(C.service.h3)}</h3></div><p>${esc(C.service.body)}</p><a class="btn btn-line" href="${esc(handOff(SITE.masterUrl))}" data-cta="service">${esc(C.service.button)}</a></section>`,
    // The free forecast in a covered market; outside one, "Look up my market" (never the forecast card)
    forecast: () => r.covered !== false
      ? `<section class="cta-card main" id="forecast"><div class="cta-top">${imgTag(C.forecast.img)}<h3>${esc(C.forecast.h3)}</h3></div><p>${esc(C.forecast.body)}</p><a class="btn btn-primary" href="${esc(handOff(SITE.forecastUrl || SITE.masterUrl))}" data-cta="forecast">${esc(C.forecast.button)}</a></section>`
      : `<section class="cta-card" id="market"><div class="cta-top">${imgTag(C.market.img)}<h3>${esc(C.market.h3)}</h3></div><p>${esc(C.market.body)}</p><a class="btn btn-line" href="${esc(handOff(SITE.forecastUrl || SITE.masterUrl))}" data-cta="market">${esc(C.market.button)}</a></section>`,
    checkout: () => SITE.offer && SITE.offer.decided && SITE.offer.checkoutUrl && !r.callOnly ? `<section class="cta-card"><div class="cta-top">${imgTag(C.checkout.img)}<h3>${esc(C.checkout.h3)}</h3></div><p>${esc(C.checkout.body)}</p><a class="btn btn-line" href="${esc(checkoutUrl())}" data-cta="checkout">${esc(C.checkout.button)}</a></section>` : ""
  };
  // The cards in order: by tier, call-only visitors the walkthrough first (content/results.mjs)
  const order = local ? ["forecast", "service"] : (r.callOnly && RES.ctaOrderCallOnly) || (RES.ctaOrderByTier && RES.ctaOrderByTier[r.tier]) || RES.ctaOrder;
  box.innerHTML = header + (local ? `<p class="warn">${esc(UI.stored)}</p>` : "") + scoreCard + iwCard + bars + cards + checksCard(r) +
    `<div class="ctas">${order.concat(["checkout"]).map((k) => (ctaHtml[k] ? ctaHtml[k]() : "")).join("")}</div><p class="rule">${esc(RES.ruleLine)}</p>`;
  const h = $("h1", box);
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  $$("[data-cta]", box).forEach((a) => a.addEventListener("click", () => { hit("cta", a.dataset.cta); if (a.dataset.cta === "checkout") pixel("InitiateCheckout", {}); }));
  const open = $("[data-book-open]", box);
  if (open) open.addEventListener("click", () => openBooking(box, token, view));
  if (location.hash === "#call" && !view.booked && open) openBooking(box, token, view);
}
const imgTag = (k) => (DATA.img && DATA.img[k] ? `<img src="${esc(DATA.img[k])}" alt="" loading="lazy">` : "");
const checkoutUrl = () => { const u = new URL(SITE.offer.checkoutUrl, location.href); u.searchParams.set("visit", visit); ATTR.forEach((k) => { if (attr[k]) u.searchParams.set(k, attr[k]); }); return u.href; };
/** A link into RoomIQ (the free forecast, the main site): src=scorecard, and the visit's campaign values carried, as the
 *  landing page carries them; when the visit came with none, the scorecard names itself as the source. */
const handOff = (url) => {
  const u = new URL(url, location.href);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => { if (attr[k]) u.searchParams.set(k, attr[k]); });
  u.searchParams.set("src", "scorecard");
  if (!u.searchParams.has("utm_source")) { u.searchParams.set("utm_source", "scorecard"); u.searchParams.set("utm_medium", "results"); u.searchParams.set("utm_campaign", SC.id); }
  return u.href;
};
/** "Three checks RoomIQ can't do for you" (content/checks.mjs): the city's rule for the market picked, financing and
 *  insurance. A results link can be forwarded, so it shows the market's rule and never an answer. */
function checksCard(r) {
  const K = RES.checks;
  if (!K) return "";
  const m = r.market || "other";
  const zoning = K.zoning.byMarket[m] || K.zoning.byMarket.other;
  const ins = (K.insurance.byMarket && K.insurance.byMarket[m]) || "";
  const item = (title, body, ask) => `<li><h3>${esc(title)}</h3><p>${esc(body)}</p><p class="chk-ask">${esc(ask)}</p></li>`;
  return `<section class="card checks" aria-labelledby="checks-h"><h2 class="h3" id="checks-h">${esc(K.title)}</h2><p class="muted">${esc(K.lead)}</p><ol class="checks-l">` +
    item(K.zoning.title, zoning, K.zoning.ask) + item(K.financing.title, K.financing.body, K.financing.ask) + item(K.insurance.title, [K.insurance.body, ins].filter(Boolean).join(" "), K.insurance.ask) +
    `</ol><p class="small">${esc(K.zoning.asOf)} ${esc(K.notAdvice)}</p></section>`;
}

/* ---------- The call step ---------- */
function openBooking(box, token, view) {
  const holder = $("[data-call]", box);
  const B = RES.booking, bk = SITE.booking;
  const days = bookingDays(bk, new Date());
  hit("book_open");
  holder.innerHTML = `<form class="book" novalidate><p class="muted">${esc(B.lead)}</p>` +
    `<div><span class="group-l" id="l-day">${esc(B.day)}</span><div class="chips" role="radiogroup" aria-labelledby="l-day">${days.map((d) => `<label class="chip-opt"><input type="radio" name="slotDay" value="${d.v}"><span>${esc(d.label)}</span></label>`).join("")}</div></div>` +
    `<div><span class="group-l" id="l-win">${esc(B.window)}</span><div class="chips" role="radiogroup" aria-labelledby="l-win">${bk.windows.map((w) => `<label class="chip-opt"><input type="radio" name="slotWindow" value="${w.v}"><span>${esc(w.label)}<small>${esc(w.hint)}</small></span></label>`).join("")}</div></div>` +
    `<div class="field"><label for="f-phone">${esc(bk.phone.label)}</label><div class="phone-in"><span>${esc(bk.phone.prefix)}</span><input id="f-phone" name="phone" type="tel" autocomplete="${bk.phone.autocomplete}" inputmode="${bk.phone.inputmode}" maxlength="20" required></div></div>` +
    (bk.address ? `<div class="field"><label for="f-address">${esc(bk.address.label)}</label><input id="f-address" name="address" type="text" autocomplete="${esc(bk.address.autocomplete)}" maxlength="${bk.address.max || 200}"></div>` : "") +
    `<label class="consent"><input type="checkbox" name="consentPhone" required><span>${esc(bk.consentPhone.label)}</span></label>` +
    (bk.consentText ? `<label class="consent"><input type="checkbox" name="consentText"><span>${esc(bk.consentText.label)}</span></label>` : "") +
    legalNoteHtml(LEGAL, SITE.legal, B.button, Boolean(SITE.metaPixelId)) +
    (bk.consentText && SITE.legal.sms ? `<p class="legal-note">${esc(LEGAL.noticeSms).replace("{sms}", `<a href="${esc(SITE.legal.sms)}" target="_blank" rel="noopener">${esc(LEGAL.sms)}</a>`)}</p>` : "") +
    `<p class="err" role="alert"></p><button type="submit" class="btn btn-primary btn-block">${esc(B.button)}</button></form>`;
  const form = $("form", holder);
  const err = $(".err", form);
  const first = $("input", form);
  if (first) first.focus({ preventScroll: true });
  holder.closest(".cta-card").scrollIntoView({ block: "start", behavior: REDUCE ? "auto" : "smooth" });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const fd = new FormData(form);
    const day = fd.get("slotDay"), win = fd.get("slotWindow"), phone = usPhone(fd.get("phone"));
    if (!day) { err.textContent = B.pickDay; return; }
    if (!win) { err.textContent = B.pickWindow; return; }
    if (!phone) { err.textContent = B.phoneError; $("#f-phone", form).focus(); return; }
    if (!fd.get("consentPhone")) { err.textContent = B.consentError; return; }
    const btn = $("button[type=submit]", form);
    const label = btn.innerHTML;
    btn.innerHTML = spinner(B.sending);
    btn.disabled = true;
    const scheduleEventId = `schedule-${token.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40)}`;
    const address = String(fd.get("address") || "").trim().slice(0, 200);
    const r = await post({ action: "book", token, slotDay: day, slotWindow: win, phone, address, consentPhone: true, consentText: Boolean(fd.get("consentText")), tz: tz(), tracking: tracking({ scheduleEventId }) });
    btn.innerHTML = label;
    btn.disabled = false;
    if (!r.ok) { err.textContent = (r.data && r.data.error) || B.failed; return; }
    hit("book");
    flush();
    if (view.result.qualified !== false && !view.local) metaEvent("schedule", { content_category: "walkthrough" }, scheduleEventId);
    view.booked = { day: r.data.day, window: r.data.window, hours: r.data.hours, phone: r.data.phone, v: day, w: win };
    ss.set(`sc-r-${token}`, view);
    holder.innerHTML = bookedHtml(view.booked, view);
    const t = $(".booked-t", holder);
    if (t) t.focus();
  });
}
function bookedHtml(b, view) {
  const B = RES.booking;
  const nDeep = ((view.deepener && view.deepener.shown) || []).length;
  const deepDone = view.deepener && view.deepener.done;
  const lines = `<p>${esc(fill(B.doneLine, { phone: b.phone || "you", hours: b.hours, business: view.business || "your business" }))}</p>${view.email ? `<p class="muted">${esc(B.doneEmail.replace("{email}", view.email))}</p>` : ""}`;
  return `<div class="booked"><div class="booked-h"><svg class="done-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><h4 class="booked-t" tabindex="-1">${esc(fill(B.done, { day: b.day, window: b.window }))}</h4></div>${b.phone ? lines : ""}` +
    (b.v && b.w ? `<button type="button" class="link-btn" data-ics="${esc(b.v)}|${esc(b.w)}">${ic("i-calendar")}${esc(B.calendar)}</button>` : "") +
    (nDeep && !deepDone ? `<a class="btn btn-line" href="/sharpen/${esc(tokenFromPath("results"))}" data-cta="sharpen-booked">${esc(B.next.replace("{n}", nDeep))}</a>` : "") + `</div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ics]");
  if (!b) return;
  const [day, w] = b.dataset.ics.split("|");
  const win = windowOf(SITE.booking, w);
  if (!win) return;
  const ics = icsFor({ day, window: win, title: RES.booking.calendarTitle, body: RES.booking.calendarBody, uid: `${visit}-${day}`, org: (DATA.brand && DATA.brand.name) || "Scorecard", host: BRAND_SLUG });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${BRAND_SLUG}-walkthrough.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
});

/* ============================================================
   The deepener: /sharpen/<token>
   ============================================================ */
async function sharpenPage() {
  const token = tokenFromPath("sharpen");
  const box = $("#sharpen");
  const D = RES.deepener;
  let view = null;
  try {
    const r = await fetch(`${SITE.endpoints.scorecard}?token=${encodeURIComponent(token)}`, { headers: { accept: "application/json" } });
    const d = await r.json();
    if (r.ok && d.ok) view = d;
  } catch (e) { view = null; }
  if (!view) { box.innerHTML = `<div class="gc done-card"><h2>${esc(D.missing)}</h2><a class="btn btn-primary" href="/">${esc(RES.retake)}</a></div>`; return; }
  const links = `<div class="sec-cta" style="margin-top:4px"><a class="btn btn-line" href="/results/${esc(token)}">${esc(D.toResults)}</a>${view.booked ? "" : `<a class="btn btn-primary" href="/results/${esc(token)}#call">${esc(D.toCall)}</a>`}</div>`;
  if (view.deepener.done) { box.innerHTML = `<div class="gc done-card"><h2>${esc(D.already)}</h2>${links}</div>`; return; }
  hit("deepener_view");
  const steps = deepenerAll(SC).filter((d) => view.deepener.shown.includes(d.key)).map((d) => Object.assign({ type: "choice" }, d));
  const n = steps.length;
  box.innerHTML = quizCardHtml(steps, UI, { id: "deep", label: D.label, frame: D.leadN.replace("{n}", n), button: D.button, kind: "deepener" });
  makeQuiz($("#deep"), {
    kind: "deepener",
    onStart() { hit("deepener_start"); },
    onStep(s, i, ms) { hit("deepener_step", s.dataset.id, ms !== undefined ? { ms } : null); },
    async onSubmit(v, fail, timing) {
      const answers = {};
      steps.forEach((s) => { if (typeof v[s.key] === "string") answers[s.key] = v[s.key]; });
      const r = await post({ action: "deepener", token, answers, timing });
      if (!r.ok) { fail((r.data && r.data.error) || UI.failed); return; }
      hit("deepener_done");
      flush();
      const cached = ss.get(`sc-r-${token}`);
      if (cached) { cached.deepener = Object.assign({}, cached.deepener, { done: true, answered: r.data.n }); ss.set(`sc-r-${token}`, cached); }
      box.innerHTML = `<div class="gc done-card"><div class="booked-h"><svg class="done-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><h2 tabindex="-1">${esc(D.done.replace("{n}", r.data.n))}</h2></div><p class="muted">${esc(D.doneLine)}</p>${links}</div>`;
      $("h2", box).focus();
    }
  });
}

/* ============================================================
   Unsubscribe: /unsubscribe/<token>
   ============================================================ */
function unsubscribePage() {
  const token = tokenFromPath("unsubscribe");
  const b = $("[data-unsubscribe]");
  if (!b) return;
  b.addEventListener("click", async () => {
    const r = await post({ action: "unsubscribe", token });
    const card = $("#unsub");
    if (r.ok) card.innerHTML = `<h2>${esc(RES.unsubscribe.done)}</h2><p class="muted">${esc(RES.unsubscribe.again)}</p>`;
    else $(".err", card).textContent = (r.data && r.data.error) || UI.failed;
  });
}

/* ---------- Start ---------- */
if (PAGE === "landing" || PAGE === "start") landing();
else if (PAGE === "results") resultsPage();
else if (PAGE === "sharpen") sharpenPage();
else if (PAGE === "unsubscribe") unsubscribePage();
