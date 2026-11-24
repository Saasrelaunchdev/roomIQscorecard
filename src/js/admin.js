/* The scorecard's admin panel (/admin): the team's side of ScoreApp's dashboard, so nobody needs to open Supabase.
   Leads: every scorecard, sortable, with where it came from, on what, how long it took and what it is worth; one lead's
   page with every answer and the seconds it took, the emails and whether they were opened, the report and its views,
   the public profile form, this lead's own report options, approve and send. Insights: the funnel question by
   question, where, on what, when, from which source, the answers, scores, the money on the table, email engagement and
   the leads to call. Settings: the report's letter and sections, the team's notices, a test email, what is set up.
   Talks only to /api/admin. No framework: one file, plain DOM. Charts follow the data-viz method: one hue per chart
   (#2a78d6), a validated five-step blue ramp for the heatmap and the state map, thin marks, hover and focus tooltips,
   and a table view for every chart that has no numbers on it. */
"use strict";
(function () {
  const API = "/api/admin";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const app = $("#admin");
  // The scorecard's areas ([key, name]), from the session (content/scorecard.mjs)
  const areasList = () => (setup && setup.areas) || [];
  const CHECK_LABELS = { hours: "Hours", services: "Services", photos: "Photos (90 days)", description: "Description", categories: "Categories" };
  const STATUS = { new: "New", booked: "Call booked", ready: "Ready to send", sent: "Report sent", closed: "Closed", spam: "Spam" };
  // The report's optional sections; the brand's name comes with the session (content/brand.mjs)
  const brandName = () => (setup && setup.brand) || "us";
  // The cost-of-inaction metric's names and the segments, from content/scorecard.mjs (metric, segments)
  const metric = () => ({ name: "Cost of inaction", count: "a year", lead: ["lead", "leads"], ...((setup && setup.metric) || {}) });
  const segmentsList = () => (setup && setup.segments) || [];
  const sectionLabels = () => ({ letter: "A note before you read (the letter and the contents)", method: "The method (its steps, and where they stand on each)", service: `Two ways to run it, and the first 30 days with ${brandName()}`, playbook: "The 30-day plan (the guides, checklists and tracker)" });
  const KIND_LABELS = { score: "Score and report", sharper: "Sharper report", report: "Checked report", "report-update": "Report update", call: "Call booked", test: "Test", "team-lead": "Team: new lead", "team-deepener": "Team: deepener", "team-call": "Team: call", "team-sent": "Team: report sent" };
  const DEVICE_LABELS = { mobile: "Phone", tablet: "Tablet", desktop: "Computer" };
  const APP_LABELS = { none: "Regular browser", facebook: "Facebook app", instagram: "Instagram app", linkedin: "LinkedIn app", tiktok: "TikTok app", snapchat: "Snapchat app", "google-app": "Google app" };
  const RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"];
  let setup = {};

  async function api(action, { method = "GET", body, params } = {}) {
    const q = new URLSearchParams({ action, ...(params || {}) });
    const r = await fetch(`${API}?${q}`, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
    let data = null;
    try { data = await r.json(); } catch (e) { data = null; }
    if (r.status === 401 && action !== "login") { showLogin(); throw new Error("Sign in first."); }
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
    return data;
  }
  const toast = (msg, bad) => {
    const t = document.createElement("div");
    t.className = `toast${bad ? " bad" : ""}`;
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };
  const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`; };
  const day = (d) => d.toISOString().slice(0, 10);
  const num = (n) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("en-US"));
  const money = (n) => (n === null || n === undefined ? "" : `$${Number(n).toLocaleString("en-US")}`);
  const compact = (n) => (n === null || n === undefined ? "n/a" : Math.abs(n) >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : Math.abs(n) >= 1e4 ? `${Math.round(n / 1e3)}K` : num(n));
  const pct = (x) => (x === null || x === undefined ? "n/a" : `${x}%`);
  const secs = (ms) => { if (ms === null || ms === undefined || !Number.isFinite(Number(ms))) return "n/a"; const s = Math.round(Number(ms) / 1000); return s < 60 ? `${Math.round(Number(ms) / 100) / 10} s` : `${Math.floor(s / 60)} min ${s % 60} s`; };
  const areaName = (k) => (areasList().find((a) => a[0] === k) || [k, k || ""])[1];
  const ratio = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

  /* ---------- One tooltip for every chart: values lead, labels follow; hover and keyboard focus alike ---------- */
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);
  let shownAt = 0;
  function showTip(el, x, y) {
    const lines = String(el.dataset.tip || "").split("\n").filter(Boolean);
    if (!lines.length) return;
    shownAt = Date.now();
    tip.textContent = "";
    lines.forEach((l, i) => { const p = document.createElement(i === 0 ? "b" : "span"); p.textContent = l; tip.appendChild(p); });
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const px = x !== undefined ? x : r.left + r.width / 2, py = y !== undefined ? y : r.top;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, px - w / 2))}px`;
    tip.style.top = `${py - h - 12 < 8 ? py + 18 : py - h - 12}px`;
  }
  document.addEventListener("pointermove", (e) => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) showTip(el); });
  document.addEventListener("focusout", () => { tip.hidden = true; });
  // A scroll moves the mark away from the tooltip; the scroll that brought a mark into view (a hover, a focus) does not count
  document.addEventListener("scroll", () => { if (Date.now() - shownAt > 200) tip.hidden = true; }, true);

  /* ---------- Sign in ---------- */
  function showLogin(msg) {
    app.innerHTML = `<form class="login card"><h1>Scorecard admin</h1><p class="muted">Sign in with the admin password.</p>${setup.password === false ? `<p class="warn">ADMIN_PASSWORD is not set on this deployment. Set it in Vercel, then redeploy.</p>` : ""}` +
      `<label class="fld"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label><p class="err" role="alert">${esc(msg || "")}</p><button class="btn" type="submit">Sign in</button></form>`;
    const f = $("form", app);
    $("input", f).focus();
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await api("login", { method: "POST", body: { password: f.password.value } }); start(); }
      catch (err) { $(".err", f).textContent = err.message; }
    });
  }

  /* ---------- The shell: tabs ---------- */
  function shell(active) {
    return `<header class="top"><div class="brand"><span class="mark"></span>Scorecard admin</div><nav class="tabs">` +
      [["leads", "Leads"], ["insights", "Insights"], ["settings", "Settings"]].map(([k, l]) => `<a href="#${k}" class="${active === k ? "on" : ""}"${active === k ? ' aria-current="page"' : ""}>${l}</a>`).join("") +
      `</nav><button class="link" data-logout>Sign out</button></header><main class="body" id="view"></main>`;
  }
  function bindShell() { $("[data-logout]").addEventListener("click", async () => { await api("logout", { method: "POST" }).catch(() => {}); showLogin(); }); }

  async function route() {
    tip.hidden = true;
    const h = location.hash.slice(1);
    const [tab, rest] = h.split("=");
    if (tab === "lead" && rest) return leadView(rest);
    if (tab === "insights") return insightsView();
    if (tab === "settings" || tab === "setup") return settingsView();
    return leadsView();
  }

  /* ---------- The date range: presets first, then a custom range (one row, above everything it scopes) ---------- */
  const PRESETS = [["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["all", "All time"], ["custom", "Custom"]];
  function rangeOf(f) {
    if (f.preset === "custom") return { from: f.from, to: f.to };
    if (f.preset === "all") return {};
    const n = Number(f.preset) || 30;
    return { from: day(new Date(Date.now() - (n - 1) * 86400e3)), to: day(new Date()) };
  }
  function rangeControls(f) {
    return `<label class="sel"><span class="sr">Period</span><select name="preset">${PRESETS.map(([v, l]) => `<option value="${v}"${f.preset === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>` +
      `<span class="custom"${f.preset === "custom" ? "" : " hidden"}><input type="date" name="from" value="${esc(f.from || "")}" aria-label="From"><input type="date" name="to" value="${esc(f.to || "")}" aria-label="To"></span>`;
  }
  function bindRange(root, f, load) {
    const preset = $("[name=preset]", root);
    preset.addEventListener("change", () => { f.preset = preset.value; $(".custom", root).hidden = f.preset !== "custom"; if (f.preset !== "custom") load(); });
    $$("[name=from], [name=to]", root).forEach((i) => i.addEventListener("change", () => { f[i.name] = i.value; if (f.preset === "custom") load(); }));
  }

  /* ---------- Leads ---------- */
  const filters = { status: "", q: "", preset: "30", from: "", to: "", fit: "" };
  let sort = { key: "created_at", dir: -1 };
  let lastRows = [];
  async function leadsView() {
    app.innerHTML = shell("leads"); bindShell();
    const v = $("#view");
    v.innerHTML = `<div class="filters">${rangeControls(filters)}<select name="status" aria-label="Status"><option value="">Every status</option>${Object.entries(STATUS).map(([k, l]) => `<option value="${k}"${filters.status === k ? " selected" : ""}>${l}</option>`).join("")}</select>` +
      `<select name="fit" aria-label="Fit"><option value="">Every fit</option><option value="qualified"${filters.fit === "qualified" ? " selected" : ""}>Qualified only</option></select>` +
      `<input type="search" name="q" placeholder="Business, email, name or city" value="${esc(filters.q)}" aria-label="Search"><a class="btn ghost" data-export href="#">Export CSV</a></div><div id="list" class="list"><p class="muted">Loading...</p></div>`;
    const load = async () => {
      const list = $("#list");
      list.classList.add("loading");
      const params = { ...rangeOf(filters), ...(filters.status ? { status: filters.status } : {}), ...(filters.q ? { q: filters.q } : {}), limit: 500 };
      try {
        const d = await api("list", { params });
        lastRows = filters.fit ? d.rows.filter((r) => r.fit === filters.fit) : d.rows;
        draw(d.total);
      } catch (e) { list.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
      list.classList.remove("loading");
    };
    const draw = (total) => {
      const list = $("#list");
      list.innerHTML = lastRows.length ? table(sorted(lastRows), filters.fit ? lastRows.length : total) : `<p class="empty">No scorecards here yet.${setup.storage === "none" ? " Storage is not set up: see Settings." : ""}</p>`;
      $$("#list tr[data-id]").forEach((tr) => {
        const go = () => { location.hash = `lead=${tr.dataset.id}`; };
        tr.addEventListener("click", go);
        tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      });
      $$("#list th[data-sort]").forEach((th) => th.addEventListener("click", () => { const k = th.dataset.sort; sort = { key: k, dir: sort.key === k ? -sort.dir : -1 }; draw(total); }));
    };
    bindRange(v, filters, load);
    $$(".filters > select").forEach((el) => el.addEventListener("change", () => { filters[el.name] = el.value; load(); }));
    $(".filters input[type=search]").addEventListener("keyup", (e) => { if (e.key === "Enter") { filters.q = e.target.value.trim(); load(); } });
    $(".filters input[type=search]").addEventListener("search", (e) => { filters.q = e.target.value.trim(); load(); });
    $("[data-export]").addEventListener("click", (e) => { e.preventDefault(); const p = new URLSearchParams({ action: "export", ...rangeOf(filters) }); location.href = `${API}?${p}`; });
    load();
  }
  function sorted(rows) {
    const k = sort.key;
    const val = (r) => (k === "score" ? r.score : k === "value" ? r.value : k === "seconds" ? r.seconds : k === "views" ? r.report_views : r.created_at);
    return rows.slice().sort((a, b) => { const x = val(a), y = val(b); if (x === y) return 0; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; return (x < y ? -1 : 1) * sort.dir; });
  }
  function table(rows, total) {
    const th = (label, key) => key ? `<th data-sort="${key}" aria-sort="${sort.key === key ? (sort.dir > 0 ? "ascending" : "descending") : "none"}" class="sortable">${label}${sort.key === key ? (sort.dir > 0 ? " ↑" : " ↓") : ""}</th>` : `<th>${label}</th>`;
    return `<p class="muted count">${num(total)} scorecard${total === 1 ? "" : "s"}. Click a column with an arrow to sort.</p><div class="scroll"><table class="tbl leads"><thead><tr>${th("When", "created_at")}${th("Market")}${th("Lead")}${th("Score", "score")}${th("Fix first")}` +
      `${th(metric().name, "value")}${th("From")}${th("Time", "seconds")}${th("Report", "views")}${th("Call")}${th("Status")}</tr></thead><tbody>` +
      rows.map((r) => `<tr data-id="${esc(r.id)}" tabindex="0"><td class="nowrap">${esc(fmtDate(r.created_at))}</td><td><b>${esc(r.company || r.city || "Other or not decided")}</b>${r.company ? `<br><span class="muted">${esc(r.city)}</span>` : ""}</td>` +
        `<td>${esc(r.first_name)}<br><span class="muted">${esc(r.email)}</span></td>` +
        `<td class="nowrap"><span class="score s-${esc(r.tier)}">${esc(r.score)}</span>${r.report_score !== undefined && r.report_score !== null && r.report_score !== r.score ? `<span class="muted"> → ${esc(r.report_score)}</span>` : ""}<br><span class="tag ${r.fit === "qualified" ? "ok" : "warn"}">${esc(r.fit)}</span></td>` +
        `<td>${esc(areaName(r.bottleneck))}${r.deepened ? `<br><span class="muted">deepened</span>` : ""}</td>` +
        `<td class="num">${r.value !== null ? `<b>${esc(money(r.value))}</b>` : ""}${r.unasked !== null ? `<br><span class="muted">${esc(num(r.unasked))} ${esc(metric().count)}</span>` : ""}</td>` +
        `<td>${esc(r.source || "direct")}${r.campaign ? ` <span class="muted">/ ${esc(r.campaign)}</span>` : ""}<br><span class="muted">${esc([r.place, DEVICE_LABELS[r.device] || r.device, r.in_app ? APP_LABELS[r.in_app] || r.in_app : ""].filter(Boolean).join(" · "))}</span></td>` +
        `<td class="num">${r.seconds !== null ? esc(secs(r.seconds * 1000)) : ""}</td>` +
        `<td>${r.report_emailed ? (r.pdf_ok ? "Emailed" : "Link sent") : r.sent_at ? "Sent" : ""}${r.report_views || r.pdf_downloads ? `<br><span class="muted">${r.report_views} view${r.report_views === 1 ? "" : "s"}${r.pdf_downloads ? `, ${r.pdf_downloads} PDF` : ""}</span>` : ""}</td>` +
        `<td>${r.booked ? esc(`${r.booked.day}, ${r.booked.window}`) : ""}</td><td><span class="tag st-${esc(r.status)}">${esc(STATUS[r.status] || r.status)}</span>${r.unsubscribed ? `<br><span class="muted">unsubscribed</span>` : ""}</td></tr>`).join("") +
      `</tbody></table></div>`;
  }

  /* ---------- One scorecard ---------- */
  async function leadView(id) {
    app.innerHTML = shell("leads"); bindShell();
    const v = $("#view");
    v.innerHTML = `<p class="muted">Loading...</p>`;
    let d;
    try { d = await api("lead", { params: { id } }); } catch (e) { v.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    const row = d.row, rep = d.report, res = rep.result, pd = row.public_data || {};
    const iw = res.invisible;
    const sent = row.status === "sent";
    const vi = d.visitor;
    const t = row.tracking || {};
    v.innerHTML = `<a href="#leads" class="back">← All scorecards</a><div class="lead-head"><div><h1>${esc(row.company || row.first_name)} <span class="muted">${esc(row.city)}</span></h1>` +
      `<p>${esc(row.first_name)} ${esc(row.last_name || "")} · <a href="mailto:${esc(row.email)}">${esc(row.email)}</a>${row.booking ? ` · ${esc(row.booking.phone)}` : ""}${row.unsubscribed_at ? ` · <span class="tag warn">unsubscribed</span>` : ""}</p>` +
      `<p class="muted">Came in ${esc(fmtDate(row.created_at))} · <span class="tag st-${esc(row.status)}">${esc(STATUS[row.status] || row.status)}</span></p></div>` +
      `<div class="acts"><a class="btn ghost" href="${esc(d.links.results)}" target="_blank" rel="noopener">Their result</a><a class="btn ghost" href="${esc(d.links.report)}" target="_blank" rel="noopener">The report they have</a>` +
      `<a class="btn ghost" href="${esc(d.links.report)}?live=1" target="_blank" rel="noopener">Live preview</a><a class="btn ghost" href="${esc(d.links.pdf)}" target="_blank" rel="noopener">PDF</a></div></div>` +
      `<div class="grid2"><section class="card"><h2>Result</h2><div class="kpis"><div><b>${esc(row.score)}</b><span>On screen</span></div><div><b>${esc(res.score)}</b><span>Report${res.deepened ? " (with the extra answers)" : ""}</span></div><div><b>${esc(res.tierName)}</b><span>Tier</span></div></div>` +
      `<div class="mlist">${areasList().map(([k, n]) => meterRow(n, res.areas[k].score, 100, String(res.areas[k].score), `${n}\n${res.areas[k].score} of 100, ${res.areas[k].band}`)).join("")}</div>` +
      `<dl class="dl"><dt>Fix first</dt><dd>${res.bottleneck.maintenance ? "Maintenance: every area 75 or higher" : esc(areaName(res.bottleneck.primary))}${res.bottleneck.cascade ? ` (${esc(areaName(res.bottleneck.cascade.effect))} is its effect)` : ""}</dd><dt>Urgency</dt><dd>${esc(res.urgency)}</dd>` +
      `<dt>${esc(metric().name)}</dt><dd>${iw.unasked !== null ? `${esc(num(iw.unasked))} ${esc(metric().count)}${iw.workValue !== null ? `, <b>${esc(money(iw.workValue))}</b>` : ""}` : esc(iw.kind)}</dd><dt>Verdict</dt><dd>${esc(rep.verdict)}</dd>` +
      `<dt>Quick wins</dt><dd><ol>${rep.quickWins.map((q) => `<li>${esc(q.text)}</li>`).join("")}</ol></dd><dt>Fit, route</dt><dd>${esc(row.fit)} · ${esc(row.route)}</dd>` +
      (res.gtmGapScore !== null && res.gtmGapScore !== undefined ? `<dt>Gap score (GTM)</dt><dd>${esc(res.gtmGapScore)} <span class="muted">(top three: ${esc(rep.compare)})</span></dd>` : "") + `</dl>` +
      (rep.callNotes.length ? `<h3>Call notes</h3><ul class="notes">${rep.callNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : "") + `</section>` +
      `<section class="card"><h2>Answers <span class="muted">and the seconds each took</span></h2>${answersList(d.labels)}` +
      (d.booking ? `<h3>Walkthrough</h3><p><b>${esc(d.booking.day)}, ${esc(d.booking.window)}</b> (${esc(d.booking.hours)}, their time) · ${esc(row.booking.phone)} · texts ${row.booking.consentText ? "yes" : "no"}${row.booking.address ? `<br>The house: ${esc(row.booking.address)}` : ""}</p>` : "") + `</section></div>` +
      `<div class="grid2"><section class="card"><h2>Where, on what, how long</h2><dl class="dl">` +
      `<dt>Location</dt><dd>${esc(vi.place || "not known")} <span class="muted">(from the IP address: approximate)</span></dd><dt>Time zone</dt><dd>${esc(vi.tz || "not known")}</dd>` +
      `<dt>Device</dt><dd>${esc(vi.device || "not known")}${vi.screen ? `<br><span class="muted">${esc(vi.screen)}${vi.lang ? `, ${esc(vi.lang)}` : ""}</span>` : ""}</dd>` +
      `<dt>Source</dt><dd>${esc(vi.source || "direct")}${t.utm_campaign ? ` · campaign ${esc(t.utm_campaign)}` : ""}${t.utm_content ? ` · ad ${esc(t.utm_content)}` : ""}${t.referrer ? `<br><span class="muted">from ${esc(t.referrer)}</span>` : ""}</dd>` +
      `<dt>Landing page</dt><dd>${esc(row.variant || "(none)")}</dd>` +
      `<dt>Before the first tap</dt><dd>${esc(vi.landing || "not measured")}</dd><dt>Time to finish</dt><dd><b>${esc(vi.total || "not measured")}</b>${vi.backs ? ` · went back ${vi.backs} time${vi.backs === 1 ? "" : "s"}` : ""}${vi.aways ? ` · left the page ${vi.aways} time${vi.aways === 1 ? "" : "s"}` : ""}</dd>` +
      (vi.deepenerTotal ? `<dt>Deepener</dt><dd>${esc(vi.deepenerTotal)}</dd>` : "") + `</dl></section>` +
      `<section class="card"><h2>The report and the emails</h2>${reportState(d)}${emailLog(d.emails)}` +
      `<div class="acts small"><span class="muted">Send again:</span><button class="link" data-resend="score">Score email${d.reportState.delivery === "instant" ? " with the report" : ""}</button>${row.booking ? `<button class="link" data-resend="call">Walkthrough email</button>` : ""}${sent ? `<button class="link" data-resend="report">Report email</button>` : ""}</div>` +
      (d.activity.length ? `<details class="activity"><summary>Activity (${d.activity.length})</summary><ul>${d.activity.map((a) => `<li><span class="muted">${esc(fmtDate(a.at))}</span> ${esc(a.name.replace(/_/g, " "))}</li>`).join("")}</ul></details>` : "") + `</section></div>` +
      optionsCard(d) + (setup.enrichment === false ? "" : profileForm(d, pd)) + reviewCard(d, row, sent);
    bindLead(d);
  }
  function answersList(labels) {
    const timed = labels.filter((l) => typeof l.seconds === "number" && !l.deep);
    const slowest = timed.slice(1).reduce((m, l) => (!m || l.seconds > m.seconds ? l : m), null);
    return `<ul class="answers">${labels.map((l) => `<li class="${l.deep ? "deep" : ""}"><span>${esc(l.id)}</span><p>${esc(l.q)}</p><b>${esc(l.a || (l.deep ? "not answered" : l.fields ? "" : ""))}</b>` +
      `<em class="secs${slowest && l === slowest ? " slow" : ""}">${typeof l.seconds === "number" ? `${esc(l.seconds)} s${slowest && l === slowest ? " · slowest" : ""}` : ""}</em></li>`).join("")}</ul>` +
      (timed.length ? `<p class="muted small-note">The first question's time includes reading the page before the first tap.</p>` : "");
  }
  function reportState(d) {
    const s = d.reportState;
    const parts = [];
    if (s.delivery === "instant") parts.push(s.emailedAt ? `Emailed with the score ${esc(fmtDate(s.emailedAt))}${s.pdfOk === false ? " (the link only: the PDF did not print)" : " with the PDF"}` : "Not emailed yet");
    if (s.sentAt) parts.push(`Checked report sent ${esc(fmtDate(s.sentAt))}`);
    parts.push(`${s.views} view${s.views === 1 ? "" : "s"} of the report, ${s.downloads} PDF download${s.downloads === 1 ? "" : "s"}${s.lastViewed ? `, last ${esc(fmtDate(s.lastViewed))}` : ""}`);
    return `<ul class="facts">${parts.map((p) => `<li>${p}</li>`).join("")}</ul>`;
  }
  function emailLog(list) {
    if (!list.length) return `<p class="muted">No emails logged for this lead yet.</p>`;
    const step = (m) => [["sent", true], ["delivered", m.delivered_at], ["opened", m.opened_at], ["clicked", m.clicked_at]];
    return `<div class="scroll"><table class="tbl mini"><thead><tr><th>Email</th><th>When</th><th>What happened</th></tr></thead><tbody>${list.map((m) => `<tr><td><b>${esc(KIND_LABELS[m.kind] || m.kind)}</b><br><span class="muted">${esc(m.subject || "")}</span>${m.attachments ? `<br><span class="muted">PDF attached</span>` : ""}</td><td class="nowrap">${esc(fmtDate(m.created_at))}</td>` +
      `<td>${m.status === "failed" ? `<span class="tag warn">Failed</span> <span class="muted">${esc(m.error || "")}</span>` : m.status === "bounced" ? `<span class="tag warn">Bounced</span>` : m.status === "complained" ? `<span class="tag warn">Marked as spam</span>` :
        `<span class="steps">${step(m).map(([n, ok]) => `<span class="${ok ? "on" : ""}" title="${esc(n)}${ok && ok !== true ? ` ${fmtDate(ok)}` : ""}">${ok ? "✓ " : ""}${esc(n)}</span>`).join("")}</span>`}` +
      `${m.clicks && m.clicks.length ? `<br><span class="muted">clicked ${m.clicks.map((u) => esc(u.replace(/^https?:\/\/[^/]+/, ""))).join(", ")}</span>` : ""}</td></tr>`).join("")}</tbody></table></div>` +
      `<p class="muted small-note">Delivered, opened and clicked come from Resend's webhook (Settings shows whether it is connected).</p>`;
  }
  function optionsCard(d) {
    const o = d.options;
    return `<section class="card" id="lead-options"><h2>This lead's report <span class="muted">a personal note, and the sections it carries</span></h2>` +
      `<label class="fld"><span>A note for ${esc(d.row.company)} (printed under the letter; the claim rules apply)</span><textarea name="note" rows="3" maxlength="1200" placeholder="Good talking today. We'd start with your replies.">${esc(o.note)}</textarea></label>` +
      `<fieldset class="secs-set"><legend>Sections</legend>${Object.entries(sectionLabels()).map(([k, l]) => `<label><input type="checkbox" name="sec-${k}"${o.effective[k] ? " checked" : ""}> ${esc(l)}${typeof o.sections[k] === "boolean" ? ` <span class="tag">set for this lead</span>` : ""}</label>`).join("")}</fieldset>` +
      `<div class="acts"><button class="btn ghost" data-options>Save for this lead</button><button class="link" data-options-reset>Use the team's settings</button><a class="link" href="${esc(d.links.report)}?live=1" target="_blank" rel="noopener">Preview</a></div>` +
      `<p class="muted small-note">Changes show in the live preview at once. The investor gets them with the next email that carries the report (Approve and send, or a resend).</p></section>`;
  }

  function profileForm(d, pd) {
    const b = pd.business || {}, s = pd.search || {};
    const t3 = [0, 1, 2].map((i) => (pd.top3 || [])[i] || {});
    const months = (b.months || []).concat(Array(12).fill("")).slice(0, 12);
    const themes = [0, 1, 2].map((i) => (pd.themes || [])[i] || {});
    const n = (name, val, step = "1", ph = "") => `<input type="number" min="0" step="${step}" name="${name}" value="${val === null || val === undefined ? "" : esc(val)}" placeholder="${ph}">`;
    const checks = (prefix, c) => `<div class="checks">${d.form.checks.map((k) => `<label><input type="checkbox" name="${prefix}.checks.${k}"${c && c.checks && c.checks[k] ? " checked" : ""}>${CHECK_LABELS[k]}</label>`).join("")}</div>`;
    const profileRow = (prefix, p, withName) => `${withName ? `<label class="fld"><span>Name</span><input name="${prefix}.name" value="${esc(p.name || "")}"></label>` : ""}` +
      `<div class="row6"><label class="fld"><span>Rating</span>${n(`${prefix}.rating`, p.rating, "0.1", "4.7")}</label><label class="fld"><span>Total reviews</span>${n(`${prefix}.count`, p.count)}</label>` +
      `<label class="fld"><span>Last 90 days</span>${n(`${prefix}.reviews90`, p.reviews90)}</label><label class="fld"><span>Newest (days ago)</span>${n(`${prefix}.newestDays`, p.newestDays)}</label>` +
      `<label class="fld"><span>Replied</span>${n(`${prefix}.replied`, p.replied, "1", "of last 30")}</label><label class="fld"><span>Reviews read</span>${n(`${prefix}.sampled`, p.sampled, "1", "30")}</label></div>${checks(prefix, p)}`;
    return `<form class="card profile" id="profile"><h2>Public profile <span class="muted">read by a person, for the top-three update</span></h2>` +
      `<div class="row3"><label class="fld"><span>Search: service</span><input name="search.service" value="${esc(s.service || d.form.defaultService)}"></label><label class="fld"><span>Search: city</span><input name="search.city" value="${esc(s.city || d.form.defaultCity)}"></label><label class="fld"><span>Search date</span><input type="date" name="search.date" value="${esc(s.date || day(new Date()))}"></label></div>` +
      `<h3>${esc(d.row.company)}</h3>${profileRow("business", b, false)}<h4>Google reviews by month (oldest first)</h4><div class="months">${months.map((m, i) => `<label class="fld"><span>${esc(d.form.months[i])}</span>${n(`months.${i}`, m)}</label>`).join("")}</div>` +
      `<label class="fld inline"><span>Busy-season read</span><select name="monthsRead">${["auto", "dip", "steady", "none"].map((x) => `<option${(pd.monthsRead || "auto") === x ? " selected" : ""}>${x}</option>`).join("")}</select></label>` +
      t3.map((c, i) => `<h3>Top three: #${i + 1}</h3>${profileRow(`top3.${i}`, c, true)}`).join("") +
      `<h3>Complaint themes in the last 30 reviews <span class="muted">(themes and counts only, never a reviewer's words)</span></h3><div class="themes">${themes.map((t, i) => `<div class="row2"><label class="fld"><span>Theme</span><input name="themes.${i}.theme" value="${esc(t.theme || "")}" placeholder="a call that was not returned"></label><label class="fld"><span>Count</span>${n(`themes.${i}.count`, t.count)}</label></div>`).join("")}</div>` +
      `<label class="fld inline"><span>Top-three reading (GTM gap score)</span><select name="compare"><option value="">Suggested: ${esc(d.report.compareSuggested)}</option>${["ahead", "even", "behind", "far"].map((x) => `<option${pd.compare === x ? " selected" : ""}>${x}</option>`).join("")}</select></label>` +
      `<div class="acts"><button class="btn" type="submit">Save the profile</button></div></form>`;
  }
  function reviewCard(d, row, sent) {
    const instant = d.reportState.delivery === "instant";
    return `<section class="card review"><h2>Review and send ${instant && setup.enrichment !== false ? `<span class="muted">the update with the top three</span>` : ""}</h2><div class="row3"><label class="fld"><span>Checked by (first name, on the cover)</span><input name="checker" value="${esc((row.report && row.report.checker) || "")}"></label>` +
      `<label class="fld"><span>Last name (optional)</span><input name="last_name" value="${esc(row.last_name || "")}"></label><label class="fld"><span>Status</span><select name="status">${Object.entries(STATUS).filter(([k]) => k !== "sent" || sent).map(([k, l]) => `<option value="${k}"${row.status === k ? " selected" : ""}${k === "sent" ? " disabled" : ""}>${l}</option>`).join("")}</select></label></div>` +
      `<label class="fld"><span>Notes for the team (never shown to the lead)</span><textarea name="notes" rows="3">${esc(row.notes || "")}</textarea></label>` +
      `<div class="acts"><button class="btn ghost" data-save>Save</button><a class="btn ghost" href="${esc(d.links.report)}?live=1" target="_blank" rel="noopener">Preview the report</a>` +
      (sent ? `<button class="btn ghost" data-reopen>Reopen to edit</button><span class="tag st-sent">Sent ${esc(fmtDate(row.sent_at))}</span>` : `<button class="btn" data-send>${instant ? "Approve and send the update" : "Approve and send"}</button>`) + `</div>` +
      `${d.report.top3Available === false ? `<p class="warn">The public profile is empty: the report's Top Three page stays out until it is filled in.</p>` : ""}</section>`;
  }
  function readProfile(form) {
    const pd = { search: {}, business: { checks: {} }, top3: [0, 1, 2].map(() => ({ checks: {} })), themes: [{}, {}, {}], months: [] };
    for (const el of $$("input, select", form)) {
      if (!el.name) continue;
      const v = el.type === "checkbox" ? el.checked : el.value;
      const p = el.name.split(".");
      if (p[0] === "months") { pd.months[Number(p[1])] = v; continue; }
      if (p[0] === "compare" || p[0] === "monthsRead") { pd[p[0]] = v; continue; }
      let o = pd;
      for (let i = 0; i < p.length - 1; i++) { const k = /^\d+$/.test(p[i]) ? Number(p[i]) : p[i]; o = o[k] = o[k] || {}; }
      o[p[p.length - 1]] = v;
    }
    pd.business.months = pd.months.every((x) => x !== "" && x !== undefined) ? pd.months : [];
    delete pd.months;
    return pd;
  }
  function bindLead(d) {
    const id = d.row.id;
    const reload = () => leadView(id);
    // The outside-data form exists only with enrichment on (site.enrichment); without it the lead page binds the rest
    const profile = $("#profile");
    if (profile) profile.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await api("save", { method: "POST", body: { id, public_data: readProfile(e.target) } }); toast("Profile saved. The report follows it."); reload(); } catch (err) { toast(err.message, true); }
    });
    const oc = $("#lead-options");
    $("[data-options]", oc).addEventListener("click", async () => {
      const sections = Object.fromEntries(Object.keys(sectionLabels()).map((k) => [k, $(`[name=sec-${k}]`, oc).checked]));
      for (const k of Object.keys(sections)) if (sections[k] === d.options.defaults[k] && typeof d.options.sections[k] !== "boolean") delete sections[k];
      try { await api("options", { method: "POST", body: { id, note: $("[name=note]", oc).value, sections } }); toast("Saved for this lead."); reload(); } catch (err) { toast(err.message, true); }
    });
    $("[data-options-reset]", oc).addEventListener("click", async () => {
      try { await api("options", { method: "POST", body: { id, note: $("[name=note]", oc).value, sections: {} } }); toast("This lead follows the team's settings."); reload(); } catch (err) { toast(err.message, true); }
    });
    const review = $(".review");
    const fields = () => ({ checker: $("[name=checker]", review).value, last_name: $("[name=last_name]", review).value, notes: $("[name=notes]", review).value, status: $("[name=status]", review).value });
    const save = $("[data-save]", review);
    if (save) save.addEventListener("click", async () => {
      const f = fields();
      if (f.status === "sent") delete f.status;
      try { await api("save", { method: "POST", body: { id, ...f } }); toast("Saved."); reload(); } catch (err) { toast(err.message, true); }
    });
    const send = $("[data-send]", review);
    if (send) send.addEventListener("click", async () => {
      const f = fields();
      if (!f.checker) { toast("Add who checked the report first.", true); return; }
      if (!confirm(`Send the report to ${d.row.email}? It is kept as it is now, and the PDF goes with the email.`)) return;
      const label = send.textContent;
      send.disabled = true; send.textContent = "Printing the PDF and sending...";
      try {
        await api("save", { method: "POST", body: { id, checker: f.checker, last_name: f.last_name, notes: f.notes } });
        const r = await api("send", { method: "POST", body: { id, checker: f.checker, withoutProfile: d.report.top3Available === false && confirm("The public profile is empty. Send without the Top Three page?") } });
        toast(r.emailed ? "Sent: the investor has the report." : "Approved. The email did not go: check Settings.", !r.emailed);
        reload();
      } catch (err) { toast(err.message, true); send.disabled = false; send.textContent = label; }
    });
    const reopen = $("[data-reopen]", review);
    if (reopen) reopen.addEventListener("click", async () => {
      if (!confirm(d.reportState.delivery === "instant" ? "Reopen? The investor keeps the report they have until you send again." : "Reopen? The investor's link shows 'on its way' until you send it again.")) return;
      try { await api("reopen", { method: "POST", body: { id } }); reload(); } catch (err) { toast(err.message, true); }
    });
    $$("[data-resend]").forEach((b) => b.addEventListener("click", async () => {
      b.disabled = true;
      try { const r = await api("resend", { method: "POST", body: { id, which: b.dataset.resend } }); toast(r.ok ? "Sent." : "It did not go.", !r.ok); reload(); } catch (err) { toast(err.message, true); b.disabled = false; }
    }));
  }

  /* ---------- Chart pieces (HTML marks; one hue; hover and focus tooltips) ---------- */
  /** A meter list row: the name, the bar against its own whole, the figure. */
  function meterRow(label, value, max, figure, tipText) {
    const w = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return `<div class="mrow" tabindex="0" data-tip="${esc(tipText || `${figure}\n${label}`)}"><span class="ml">${esc(label)}</span><i class="track"><b style="width:${w}%"></b></i><em>${esc(figure)}</em></div>`;
  }
  /** Ranked horizontal bars for parts of one whole (or in their natural order): one hue, values at the tips. */
  function hbars(items, { total, order = "keep", note } = {}) {
    const list = order === "rank" ? items.slice().sort((a, b) => b.count - a.count) : items;
    const max = Math.max(1, ...list.map((i) => i.count));
    if (!list.length || list.every((i) => !i.count)) return `<p class="muted">Nothing yet in this period.</p>`;
    return `<div class="mlist">${list.map((i) => meterRow(i.label, i.count, max, `${num(i.count)}${total ? ` · ${Math.round((i.count / total) * 100)}%` : ""}`, `${num(i.count)}${total ? ` (${Math.round((i.count / total) * 100)}%)` : ""}\n${i.label}${note ? `\n${note}` : ""}`)).join("")}</div>`;
  }
  /** Columns over time or buckets: one hue, the baseline square, the cap rounded; the tooltip lists every measure. */
  function columns(items, { label, height = 150, axis } = {}) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const top = niceMax(max);
    return `<figure class="cols" aria-label="${esc(label || "")}"><div class="cplot" style="height:${height}px"><span class="gl" style="bottom:100%"><em>${esc(compact(top))}</em></span><span class="gl" style="bottom:50%"><em>${esc(compact(top / 2))}</em></span>` +
      `<div class="cbars">${items.map((i) => `<span class="cbar" tabindex="0" data-tip="${esc(i.tip)}"><b style="height:${(i.value / top) * 100}%"></b></span>`).join("")}</div></div>` +
      `<div class="caxis">${items.map((i, k) => `<span>${axis ? axis(i, k) : ""}</span>`).join("")}</div></figure>`;
  }
  const niceMax = (m) => { if (m <= 5) return Math.max(1, Math.ceil(m)); const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => f <= x) || 10) * p; };
  /** The five-step ramp for a count, 0 left empty. */
  function rampOf(v, max) {
    if (!v) return null;
    const i = Math.min(RAMP.length - 1, Math.floor((v / Math.max(1, max)) * RAMP.length - 1e-9));
    return { bg: RAMP[Math.max(0, i)], ink: i >= 2 ? "#ffffff" : "#0b0b0b" };
  }
  function scaleLegend(max, unit) {
    const steps = RAMP.map((c, i) => { const lo = Math.floor((i * max) / RAMP.length) + 1, hi = Math.floor(((i + 1) * max) / RAMP.length); return { c, label: lo >= hi ? `${hi}` : `${lo} to ${hi}` }; }).filter((s, i, a) => i === a.length - 1 || s.label !== a[i + 1].label);
    return `<div class="scale" aria-label="Scale"><span class="sw blank"></span><span>0</span>${steps.map((s) => `<span class="sw" style="background:${s.c}"></span><span>${esc(s.label)}</span>`).join("")}<span class="muted">${esc(unit)}</span></div>`;
  }

  /* The US as tiles: every state the same size, so a small state counts like a big one */
  const TILES = { AK: [0, 0], ME: [0, 11], VT: [1, 10], NH: [1, 11], WA: [2, 1], ID: [2, 2], MT: [2, 3], ND: [2, 4], MN: [2, 5], IL: [2, 6], WI: [2, 7], MI: [2, 8], NY: [2, 9], RI: [2, 10], MA: [2, 11],
    OR: [3, 1], NV: [3, 2], WY: [3, 3], SD: [3, 4], IA: [3, 5], IN: [3, 6], OH: [3, 7], PA: [3, 8], NJ: [3, 9], CT: [3, 10], CA: [4, 1], UT: [4, 2], CO: [4, 3], NE: [4, 4], MO: [4, 5], KY: [4, 6], WV: [4, 7], VA: [4, 8], MD: [4, 9], DE: [4, 10],
    AZ: [5, 2], NM: [5, 3], KS: [5, 4], AR: [5, 5], TN: [5, 6], NC: [5, 7], SC: [5, 8], DC: [5, 9], OK: [6, 4], LA: [6, 5], MS: [6, 6], AL: [6, 7], GA: [6, 8], HI: [7, 0], TX: [7, 4], FL: [7, 9] };
  function tileMap(states) {
    const by = Object.fromEntries(states.map((s) => [s.key, s]));
    const max = Math.max(1, ...states.map((s) => s.count));
    const tiles = Object.entries(TILES).map(([k, [r, c]]) => {
      const s = by[k], f = rampOf(s ? s.count : 0, max);
      const tipText = s ? `${num(s.count)} lead${s.count === 1 ? "" : "s"}\n${k}${s.booked ? `\n${s.booked} booked a call` : ""}` : `No leads\n${k}`;
      return `<span class="tile${f ? "" : " blank"}" tabindex="0" style="grid-row:${r + 1};grid-column:${c + 1}${f ? `;background:${f.bg};color:${f.ink}` : ""}" data-tip="${esc(tipText)}">${k}</span>`;
    }).join("");
    const rows = states.slice().sort((a, b) => b.count - a.count);
    return `<div class="tilemap" role="img" aria-label="Leads by state">${tiles}</div>${scaleLegend(max, "leads")}` +
      `<details class="tv"><summary>Table view</summary>${rows.length ? `<table class="tbl mini"><thead><tr><th>State</th><th>Leads</th><th>Booked a call</th></tr></thead><tbody>${rows.map((s) => `<tr><td>${esc(s.key)}</td><td>${s.count}</td><td>${s.booked}</td></tr>`).join("")}</tbody></table>` : "<p class='muted'>No US leads in this period.</p>"}</details>`;
  }
  const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hourName = (h) => (h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`);
  function heatmap(m) {
    const max = Math.max(1, ...m.flat());
    const cells = m.map((row, wd) => `<span class="hl">${WEEK[wd]}</span>${row.map((v, h) => { const f = rampOf(v, max); return `<span class="hc${f ? "" : " blank"}" tabindex="0"${f ? ` style="background:${f.bg}"` : ""} data-tip="${esc(`${v} lead${v === 1 ? "" : "s"}\n${WEEK[wd]}, ${hourName(h)} to ${hourName((h + 1) % 24)}`)}"></span>`; }).join("")}`).join("");
    const axis = `<span></span>${Array.from({ length: 24 }, (_, h) => `<span class="ha">${h % 6 === 0 ? esc(hourName(h)) : ""}</span>`).join("")}`;
    const total = m.flat().reduce((a, b) => a + b, 0);
    return `<div class="scroll"><div class="heat" role="img" aria-label="Completed scorecards by weekday and hour, in each investor's own time">${cells}${axis}</div></div>${scaleLegend(max, "leads per hour")}` +
      `<details class="tv"><summary>Table view</summary>${total ? `<div class="scroll"><table class="tbl mini"><thead><tr><th></th>${Array.from({ length: 24 }, (_, h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${m.map((row, wd) => `<tr><td>${WEEK[wd]}</td>${row.map((v) => `<td>${v || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "<p class='muted'>Nothing yet.</p>"}</details>`;
  }
  const kpi = (value, label, sub, hero) => `<div class="stat${hero ? " hero" : ""}"><span class="sl">${esc(label)}</span><b>${esc(value)}</b>${sub ? `<span class="ss">${esc(sub)}</span>` : ""}</div>`;
  const tableOf = (head, rows) => `<div class="scroll"><table class="tbl mini"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

  /* ---------- Insights ---------- */
  const insFilters = { preset: "30", from: "", to: "" };
  async function insightsView() {
    app.innerHTML = shell("insights"); bindShell();
    const v = $("#view");
    v.innerHTML = `<div class="filters">${rangeControls(insFilters)}<span class="muted">Every number below follows this period.</span></div><div id="ins"><p class="muted">Loading...</p></div>`;
    const load = async () => {
      const box = $("#ins");
      box.classList.add("loading");
      try { box.innerHTML = insights(await api("insights", { params: rangeOf(insFilters) })); }
      catch (e) { box.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
      box.classList.remove("loading");
    };
    bindRange(v, insFilters, load);
    load();
  }
  function insights(d) {
    const f = d.funnel.all, p = d.profile, dims = d.dims;
    const qualified = (p.fit && p.fit.qualified) || 0;
    const scoreMail = d.emails.find((e) => e.kind === "score");
    const emailedReports = p.report.emailed || p.sent;
    const days = fillDays(dims.day, d.range);
    // 1. The headline numbers
    let out = `<section class="card"><h2>The period at a glance</h2><div class="stats">` +
      kpi(num(p.count), "Completed scorecards", `${pct(f.completionRate)} of ${num(f.visits)} visits`, true) +
      kpi(num(f.visits), "Visits", `${num(f.starts)} started (${pct(f.startRate)})`) +
      kpi(num(qualified), "Qualified leads", `${pct(ratio(qualified, p.count))} of completed`) +
      kpi(num(p.booked), "Calls booked", `${pct(ratio(p.booked, p.count))} of completed`) +
      kpi(secs(p.timing.medianTotalMs), "Median time to finish", p.timing.n ? `from the first tap; ${num(p.timing.n)} timed` : "not measured yet") +
      kpi(p.invisible.valueTotal ? `$${compact(p.invisible.valueTotal)}` : "n/a", `${metric().name} found`, p.invisible.leads ? `${num(p.invisible.unaskedTotal)} ${metric().count}, ${num(p.invisible.leads)} ${p.invisible.leads === 1 ? metric().lead[0] : metric().lead[1]}` : "") +
      kpi(pct(ratio(p.report.viewed, emailedReports)), "Opened their report", `${num(p.report.viewed)} of ${num(emailedReports)}; ${num(p.report.downloaded)} downloaded the PDF`) +
      kpi(scoreMail ? pct(scoreMail.openRate) : "n/a", "Score emails opened", scoreMail ? `${num(scoreMail.opened)} of ${num(scoreMail.delivered || scoreMail.sent)} delivered` : "needs Resend's webhook") +
      `</div></section>`;
    // 2. Every day
    out += `<section class="card"><h2>Completed scorecards, day by day</h2>` + (days.length
      ? columns(days.map((x) => ({ value: x.complete, day: x.value, tip: `${x.complete} completed\n${x.value}\n${x.views} visits, ${x.starts} started${x.booked ? `, ${x.booked} booked` : ""}` })), { label: "Completed scorecards per day", axis: (x, k) => (k === 0 || k === days.length - 1 || days.length <= 10 ? x.day.slice(5) : "") })
      : `<p class="muted">No visits recorded in this period.</p>`) + `</section>`;
    // 3. The funnel
    const slow = f.steps.reduce((m, s) => (s.n > 1 && s.medianMs && (!m || s.medianMs > m.medianMs) ? s : m), null);
    out += `<section class="card"><h2>Question by question <span class="muted">who answered each step, where they stopped, and how long it took</span></h2>` +
      `<div class="mlist funnel">${f.steps.map((s) => meterRow(`${s.n}. ${s.q.length > 64 ? `${s.q.slice(0, 62)}…` : s.q}`, s.answered, Math.max(1, f.starts, ...f.steps.map((x) => x.answered)), `${num(s.answered)}${s.dropOff !== null ? ` · −${s.dropOff}%` : ""} · ${s.medianMs ? secs(s.medianMs) : "n/a"}${slow && s === slow ? " · slowest" : ""}`,
        `${num(s.answered)} answered\n${s.q}${s.dropOff !== null ? `\n${s.dropOff}% stopped here` : ""}${s.medianMs ? `\nMedian ${secs(s.medianMs)}, slowest quarter over ${secs(s.p75Ms)}` : ""}`)).join("")}</div>` +
      `<p class="muted small-note">Bars count visits that answered each question, out of ${num(f.starts)} that started. The first question's time includes reading the page. Time on the page before the first tap: median ${secs(p.timing.medianLandingMs)}. ${p.timing.wentBack !== null ? `${pct(p.timing.wentBack)} went back at least once; ${pct(p.timing.leftMidway)} left the page mid-quiz and came back.` : ""}</p>` +
      `<div class="flow">${[["Visits", f.visits], ["Started", f.starts], ["Completed", f.complete], ["Saw the result", f.results], ["Opened the call step", f.callOpen], ["Booked a call", f.booked], ["Started the deepener", f.deepenerStart], ["Answered the deepener", f.deepenerDone]].map(([l, n]) => `<div><b>${num(n)}</b><span>${esc(l)}</span></div>`).join("")}</div></section>`;
    // 4. Where
    out += `<div class="grid2"><section class="card"><h2>Where the leads are <span class="muted">from the IP address, approximate</span></h2>${tileMap(p.geo.states)}` +
      `<h3>Visits by state <span class="muted">and how many finished, from the analytics</span></h3>${dimTable(dims.region.slice(0, 10), regionLabel)}</section>` +
      `<section class="card"><h2>Top cities</h2>${hbars(p.geo.cities.map((c) => ({ label: c.key, count: c.count })), { total: p.count })}` +
      (p.geo.countries.length > 1 || (p.geo.countries[0] && p.geo.countries[0].key !== "US") ? `<h3>Countries</h3>${hbars(p.geo.countries.map((c) => ({ label: c.key, count: c.count })), { total: p.count })}` : "") +
      (p.geo.unknown ? `<p class="muted small-note">${num(p.geo.unknown)} without a location (sent before location was kept, or not on Vercel).</p>` : "") + `</section></div>`;
    // 5. On what, and from where
    out += `<div class="grid2"><section class="card"><h2>On what <span class="muted">and how often each finishes</span></h2>${dimMeters(dims.device, (v) => DEVICE_LABELS[v] || v || "unknown")}` +
      `<h3>Inside an app's browser</h3>${dimMeters(dims.inapp.map((x) => ({ ...x, value: x.value || "none" })), (v) => APP_LABELS[v] || v)}</section>` +
      `<section class="card"><h2>From where</h2>${dimTable(dims.source, (v) => v || "direct")}<h3>Leads by source</h3>` +
      tableOf(["Source", "Leads", "Qualified", "Booked", "Booked rate", `Median ${metric().name.toLowerCase()}`], p.bySource.map((s) => [esc(s.label), s.count, s.qualified, s.booked, pct(s.bookedRate), s.medianValue !== null ? esc(money(s.medianValue)) : ""])) +
      (p.byCampaign.length ? `<h3>By campaign</h3>${tableOf(["Campaign", "Leads", "Qualified", "Booked", "Booked rate"], p.byCampaign.map((s) => [esc(s.label), s.count, s.qualified, s.booked, pct(s.bookedRate)]))}` : "") + `</section></div>`;
    // 6. When
    out += `<section class="card"><h2>When investors take it <span class="muted">weekday and hour, in each investor's own time</span></h2>${heatmap(p.hourWeek)}</section>`;
    // 7. What they scored
    out += `<div class="grid2"><section class="card"><h2>Scores <span class="muted">${num(p.count)} scorecards, average ${p.averageScore === null ? "n/a" : p.averageScore}</span></h2>` +
      columns(p.scoreBuckets.map((b) => ({ value: b.count, from: b.from, tip: `${b.count} scorecard${b.count === 1 ? "" : "s"}\nScore ${b.from} to ${b.to}` })), { label: "Scores in bands of ten", height: 120, axis: (b) => String(b.from) }) +
      `<h3>Tiers</h3>${tableOf(["Tier", "Leads", "Booked", "Booked rate", "Deepened", `Median ${metric().name.toLowerCase()}`], p.byTier.map((t) => [esc(t.label), t.count, t.booked, pct(t.bookedRate), t.deepened, t.medianValue !== null ? esc(money(t.medianValue)) : ""]))}</section>` +
      `<section class="card"><h2>What to fix first</h2>${hbars(p.bottlenecks.map((b) => ({ label: b.name, count: b.count })), { total: p.count, order: "rank" })}` +
      `<h3>Average score by area</h3><div class="mlist">${areasList().map(([k, n]) => meterRow(n, p.areas[k] || 0, 100, p.areas[k] === null || p.areas[k] === undefined ? "n/a" : String(p.areas[k]), `${p.areas[k] ?? "n/a"} of 100\n${n}, average`)).join("")}</div>` +
      `<h3>Fit <span class="muted">qualified: the walkthrough first, and Schedule on booking</span></h3>${hbars(Object.entries(p.fit).map(([k, c]) => ({ label: k, count: c })), { total: p.count, order: "rank" })}<h3>Route</h3>${hbars(Object.entries(p.routes).map(([k, c]) => ({ label: k, count: c })), { total: p.count, order: "rank" })}</section></div>`;
    // 8. Who: the segments (content/scorecard.mjs segments)
    const segs = (p.bySegment || []).filter((s) => s.groups && s.groups.length);
    if (segs.length) out += `<section class="card"><h2>Who takes it <span class="muted">and who books</span></h2><div class="grid3">` +
      segs.map((s) => [s.label, s.groups]).map(([h, g]) => `<div><h3>${h}</h3>${tableOf([h, "Leads", "Avg score", "Booked"], g.map((x) => [esc(x.label), x.count, x.avgScore ?? "", `${x.booked} <span class="muted">${pct(x.bookedRate)}</span>`]))}</div>`).join("") + `</div></section>`;
    // 9. Every answer
    out += `<section class="card"><h2>Every answer</h2><div class="answers-grid">${Object.values(p.answers).map((a) => `<div><h3>${esc(a.q)}</h3>${hbars(a.options.map((o) => ({ label: o.label, count: o.count })), { total: p.count })}</div>`).join("")}</div></section>`;
    // 10. Email
    out += `<section class="card"><h2>Emails <span class="muted">from the log and Resend's webhook</span></h2>` + (d.emails.length
      ? tableOf(["Email", "Sent", "Failed", "Delivered", "Opened", "Clicked", "Bounced"], d.emails.map((e) => [esc(KIND_LABELS[e.kind] || e.kind), e.sent, e.failed, `${e.delivered} <span class="muted">${pct(e.deliveredRate)}</span>`, `${e.opened} <span class="muted">${pct(e.openRate)}</span>`, `${e.clicked} <span class="muted">${pct(e.clickRate)}</span>`, e.bounced + (e.complained ? ` · ${e.complained} spam` : "")]))
      : `<p class="muted">No emails sent in this period.</p>`) + `<p class="muted small-note">Opens and clicks need open and click tracking turned on for the domain in Resend; Apple Mail can count an open without one.</p></section>`;
    // 11. The leads to call
    out += `<section class="card"><h2>Leads to call first <span class="muted">qualified, no call booked yet, the highest ${esc(metric().name.toLowerCase())} first</span></h2>` + (p.hotLeads.length
      ? tableOf(["Lead", "Score", metric().name, "Opened the report", "Came in"], p.hotLeads.map((h) => [`<a href="#lead=${esc(h.id)}">${esc(h.company || h.first_name || "A lead")}</a>${h.city ? ` <span class="muted">${esc(h.city)}</span>` : ""}`, esc(h.score), h.value !== null ? esc(money(h.value)) : "", h.viewed ? "Yes" : "Not yet", esc(fmtDate(h.created_at))]))
      : `<p class="muted">Nobody waiting.</p>`) + `</section>`;
    // 12. The split test
    out += `<section class="card"><h2>Landing pages <span class="muted">the split test</span></h2>` +
      tableOf(["Variant", "Visits", "Starts", "Start rate", "Completed", "Completion rate", "Calls"], d.funnel.variants.map((x) => [`<b>${esc(x.variant)}</b>`, num(x.visits), num(x.starts), pct(x.startRate), num(x.complete), pct(x.completionRate), num(x.booked)])) + `</section>`;
    return out;
  }
  /** Every day of the period, with the days nobody came in at zero, so the axis spans the whole period. */
  function fillDays(rows, range) {
    const by = Object.fromEntries(rows.map((r) => [r.value, r]));
    const first = range && range.from ? range.from.slice(0, 10) : rows.length ? rows[0].value : null;
    const last = range && range.to ? day(new Date(Date.parse(range.to) - 86400e3)) : rows.length ? rows[rows.length - 1].value : null;
    if (!first || !last) return rows;
    const out = [];
    for (let t = Date.parse(`${first}T00:00:00Z`), end = Date.parse(`${last}T00:00:00Z`); t <= end && out.length < 400; t += 86400e3) {
      const k = new Date(t).toISOString().slice(0, 10);
      out.push(by[k] || { value: k, views: 0, starts: 0, complete: 0, booked: 0 });
    }
    return out;
  }
  function dimMeters(rows, labelOf) {
    if (!rows.length) return `<p class="muted">Nothing yet in this period.</p>`;
    return `<div class="mlist">${rows.map((r) => meterRow(labelOf(r.value), r.completionRate || 0, 100, r.views ? `${pct(r.completionRate)} of ${num(r.views)}` : `${num(r.complete)} completed`, `${r.views ? `${pct(r.completionRate)} finished` : `${num(r.complete)} completed`}\n${labelOf(r.value)}\n${num(r.views)} visits, ${num(r.starts)} started, ${num(r.complete)} completed`)).join("")}</div>` +
      `<p class="muted small-note">Each bar: the share of visits that completed the scorecard.</p>`;
  }
  /** "TX" for a US state, "ON, CA" elsewhere (the analytics keep "country:region"). */
  const regionLabel = (v) => { const [c, r] = String(v || "").split(":"); return c === "US" ? r || "US" : [r, c].filter(Boolean).join(", ") || "unknown"; };
  function dimTable(rows, labelOf) {
    if (!rows.length) return `<p class="muted">Nothing yet in this period.</p>`;
    return tableOf(["", "Visits", "Started", "Completed", "Completion rate", "Booked"], rows.map((r) => [esc(labelOf(r.value)), num(r.views), num(r.starts), num(r.complete), pct(r.completionRate), num(r.booked)]));
  }

  /* ---------- Settings ---------- */
  async function settingsView() {
    app.innerHTML = shell("settings"); bindShell();
    const v = $("#view");
    v.innerHTML = `<p class="muted">Loading...</p>`;
    let d;
    try { d = await api("settings"); } catch (e) { v.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    const r = d.settings.report, n = d.settings.notifications, s = d.setup;
    const row = (ok, name, fix) => `<li class="${ok ? "ok" : "no"}"><b aria-hidden="true">${ok ? "✓" : "✗"}</b><span>${esc(name)}<span class="sr">${ok ? " (set up)" : " (not set up)"}</span></span><em>${esc(ok ? "" : fix)}</em></li>`;
    v.innerHTML = `<section class="card" id="set-report"><h2>The report <span class="muted">every report from now on; each lead's page can change its own</span></h2>` +
      `<p class="muted">Reports go out ${d.delivery === "instant" ? (setup.enrichment === false ? "the moment a scorecard is finished, with the score" : "the moment a scorecard is finished, with the score; your team then adds the top three") : "after your team approves them"}.</p>` +
      `<label class="fld"><span>The letter at the front (leave empty for the standard one). Blank lines start paragraphs. You can use {first_name}, {market}, {deal} and {primary_bottleneck}.</span><textarea name="letter" rows="6" maxlength="1500" placeholder="Thank you for taking the First Deal Risk Scorecard, {first_name}...">${esc(r.letter)}</textarea></label>` +
      `<div class="row3"><label class="fld"><span>Signed by (first name; empty signs it "The ${esc(brandName())} team")</span><input name="signerName" maxlength="60" value="${esc(r.signerName)}"></label><label class="fld"><span>Their title (optional)</span><input name="signerTitle" maxlength="60" value="${esc(r.signerTitle)}"></label></div>` +
      `<fieldset class="secs-set"><legend>Sections in every report</legend>${Object.entries(sectionLabels()).map(([k, l]) => `<label><input type="checkbox" name="sec-${k}"${r.sections[k] ? " checked" : ""}> ${esc(l)}</label>`).join("")}</fieldset>` +
      `<div class="acts"><button class="btn" data-save-report>Save</button><a class="btn ghost" href="${API}?action=sample" target="_blank" rel="noopener">Preview with the sample investor</a></div>` +
      `<p class="muted small-note">The words go through the same claim rules as the site: no accuracy, income or return claims, no named platforms, no prices or trials, no guarantees, every statistic with its source.</p></section>` +
      `<section class="card" id="set-team"><h2>The team's notices</h2><label class="fld"><span>Who gets them (comma separated; empty uses LEAD_NOTIFY_TO${d.envTeamTo.length ? `: ${esc(d.envTeamTo.join(", "))}` : ", which is not set"})</span><input name="teamTo" value="${esc(n.teamTo)}" placeholder="you@yourdomain.com, sales@yourdomain.com"></label>` +
      `<div class="checks col"><label><input type="checkbox" name="attachPdf"${n.attachPdf ? " checked" : ""}> Attach the lead's PDF report to the new-lead email</label><label><input type="checkbox" name="deepener"${n.deepener ? " checked" : ""}> Tell us when a lead answers the deepener</label><label><input type="checkbox" name="booking"${n.booking ? " checked" : ""}> Tell us when a lead books a walkthrough</label></div>` +
      `<div class="acts"><button class="btn" data-save-team>Save</button></div></section>` +
      `<section class="card" id="set-test"><h2>Send a test</h2><p class="muted">Emails the sample report (a made-up investor) to the address you give, the way an investor gets it, with the PDF. It checks your Resend domain end to end.</p>` +
      `<div class="row3"><label class="fld"><span>Send it to</span><input type="email" name="to" autocomplete="email" placeholder="you@yourdomain.com"></label></div><div class="acts"><button class="btn ghost" data-test>Send the test</button></div></section>` +
      `<section class="card"><h2>What this deployment is set up for</h2><ul class="setup">` +
      row(s.storage !== "none", `Storage (${s.storage})`, s.storageFix || "Set SUPABASE_URL and SUPABASE_SECRET_KEY, and run sql/schema.sql") +
      row(s.passwordStrong, "A strong admin password", "Use 12 characters or more in ADMIN_PASSWORD") +
      row(s.prospectEmail, "Emails to investors (score and report, walkthrough, updates)", "Set RESEND_API_KEY and SCORECARD_EMAIL_FROM") +
      row(s.teamEmail || s.slack, "The team's notices", "Set LEAD_NOTIFY_FROM and LEAD_NOTIFY_TO (or the addresses above), or SLACK_WEBHOOK_URL") +
      row(s.pdf, "PDF reports", "Deploy to Vercel, or set CHROMIUM_PATH locally") +
      row(s.resendWebhook, "Delivered, opened and clicked (Resend's webhook)", "Add a webhook in Resend to /api/resend-webhook and set RESEND_WEBHOOK_SECRET") +
      row(s.meta, "Meta Conversions API (optional)", "Set META_PIXEL_ID and META_CAPI_TOKEN") +
      row(s.ghl, "GoHighLevel (optional)", "Set GHL_TOKEN and GHL_LOCATION_ID") +
      row(s.webhooks, "Webhooks (optional)", "Set SCORECARD_WEBHOOK_URLS and SCORECARD_WEBHOOK_SECRET") +
      `</ul><p class="muted">Full health report: <a href="/api/scorecard" target="_blank" rel="noopener">/api/scorecard</a>. Secrets live in Vercel (README, "Settings").</p></section>`;
    const rep = $("#set-report");
    $("[data-save-report]", rep).addEventListener("click", async () => {
      const value = { letter: $("[name=letter]", rep).value, signerName: $("[name=signerName]", rep).value, signerTitle: $("[name=signerTitle]", rep).value,
        sections: Object.fromEntries(Object.keys(sectionLabels()).map((k) => [k, $(`[name=sec-${k}]`, rep).checked])) };
      try { await api("settings", { method: "POST", body: { key: "report", value } }); toast("Saved. New reports use it."); } catch (err) { toast(err.message, true); }
    });
    const team = $("#set-team");
    $("[data-save-team]", team).addEventListener("click", async () => {
      const value = { teamTo: $("[name=teamTo]", team).value, attachPdf: $("[name=attachPdf]", team).checked, deepener: $("[name=deepener]", team).checked, booking: $("[name=booking]", team).checked };
      try { await api("settings", { method: "POST", body: { key: "notifications", value } }); toast("Saved."); settingsView(); } catch (err) { toast(err.message, true); }
    });
    const test = $("#set-test");
    $("[data-test]", test).addEventListener("click", async (e) => {
      const b = e.currentTarget;
      b.disabled = true; b.textContent = "Sending...";
      try { const res = await api("test-email", { method: "POST", body: { to: $("[name=to]", test).value } }); toast(res.pdf ? "Sent, with the PDF. Check the inbox (and spam)." : `Sent without the PDF${res.pdfError ? ` (${res.pdfError})` : ""}.`); }
      catch (err) { toast(err.message, true); }
      b.disabled = false; b.textContent = "Send the test";
    });
  }

  async function start() {
    const s = await api("session").catch(() => ({ authenticated: false, setup: {} }));
    setup = s.setup || {};
    if (!s.authenticated) return showLogin();
    route();
  }
  addEventListener("hashchange", () => { if ($(".top")) route(); });
  start();
})();
