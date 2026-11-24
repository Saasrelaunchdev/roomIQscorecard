// The scorecard's icons and small graphics as inline SVG, drawn from the prompts in Deliverables 2 and 3: flat, two
// colours (the brand's ink for the main shapes, its accent for the highlights: PAL below), rounded, no gradients, no shadows,
// legible at 48 px. One set for the landing page, the results page, the report and the admin.
// Server-side and build-time only (the browser gets them already in the HTML, or as strings in its data).

// The drawings' colors, by role. usePalette(BRAND.colors) sets them from the brand (content/brand.mjs), on the server
// (lib/report-html.mjs) and in the page (src/js/app.js), so the icons, the houses, the donut and the months chart wear
// the brand's ink and accent. The defaults are the worked example's.
export const PAL = { ink: "#0A1A33", accent: "#1F86FF", star: "#F9CE14", line: "#E8EFF9", line2: "#D3DFF1", ink300: "#B7C9E5", ink400: "#94ACD2", ink500: "#7990B5", signal: "#F5A524", chart: "#2A78D6" };
export function usePalette(colors) {
  for (const k of Object.keys(PAL)) if (colors && typeof colors[k] === "string" && /^#[0-9a-f]{3,8}$/i.test(colors[k])) PAL[k] = colors[k];
}
// The areas' colors and names, from content/scorecard.mjs (areas[].color): useAreas(SC) fills them, on the server
// (lib/report-html.mjs) and in the page (src/js/app.js). Kept as objects so the bundled page script needs no import.
export const AREA_COLORS = {};
export const AREA_NAMES = {};
export function useAreas(sc) {
  for (const a of sc.areas) { AREA_COLORS[a.key] = a.color; AREA_NAMES[a.key] = a.name; }
}

const svg = (body, label, size = 48) =>
  `<svg class="icn" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

/** A five-point star centred at (cx, cy). */
export function starPath(cx, cy, R, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + "Z";
}

/** A gear: teeth around a ring, a hole in the middle (even-odd fill). */
function gearPath(cx, cy, outer, inner, hole, teeth) {
  let d = "";
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[a - step * 0.22, outer], [a + step * 0.22, outer], [a + step * 0.32, inner], [a + step * 0.68, inner]];
    for (const [ang, rad] of pts) d += `${d ? "L" : "M"}${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
  }
  d += "Z";
  d += `M${cx + hole} ${cy}A${hole} ${hole} 0 1 0 ${cx - hole} ${cy}A${hole} ${hole} 0 1 0 ${cx + hole} ${cy}Z`;
  return d;
}

/** The four category icons and the four utility icons. */
export const ICONS = {
  // A simple house with a small star above its roof and a check mark on the door
  coverage: (s) => svg(
    `<path d="${starPath(24, 7.5, 5.2, 2.3)}" fill="${PAL.accent}"/>` +
    `<path d="M24 14.5 41.5 27H6.5Z" fill="${PAL.ink}" stroke="${PAL.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<rect x="10" y="26" width="28" height="17" rx="2.5" fill="${PAL.ink}"/>` +
    `<rect x="19" y="30.5" width="10" height="12.5" rx="2" fill="#fff"/>` +
    `<path d="M20.8 36.8l2.4 2.4 4.2-4.6" fill="none" stroke="${PAL.accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`, "Ask Coverage", s),
  // A gear with a paper plane leaving it to the upper right
  system: (s) => svg(
    `<path d="${gearPath(18.5, 29.5, 14.5, 11, 4.6, 8)}" fill="${PAL.ink}" fill-rule="evenodd"/>` +
    `<path d="M28.5 15.6 45.2 4.8 39.6 21.4 35 17.2Z" fill="${PAL.accent}"/>` +
    `<path d="M35 17.2 45.2 4.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`, "Ask System", s),
  // A calendar page with one square filled and a small star in it
  freshness: (s) => {
    let cells = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 11 + c * 7, y = 21 + r * 6.4;
      cells += r === 1 && c === 2
        ? `<rect x="${x - 0.6}" y="${y - 0.6}" width="6.4" height="5.6" rx="1.4" fill="${PAL.accent}"/><path d="${starPath(x + 2.6, y + 2.25, 2.3, 1)}" fill="#fff"/>`
        : `<rect x="${x}" y="${y}" width="5.2" height="4.4" rx="1.1" fill="#fff" opacity=".92"/>`;
    }
    return svg(`<rect x="15" y="5" width="3.4" height="9" rx="1.7" fill="${PAL.ink}"/><rect x="29.6" y="5" width="3.4" height="9" rx="1.7" fill="${PAL.ink}"/>` +
      `<rect x="7" y="9.5" width="34" height="33" rx="4.5" fill="${PAL.ink}"/>` + cells, "Freshness", s);
  },
  // A speech bubble with a check mark inside, a smaller bubble behind it
  replies: (s) => svg(
    `<path d="M24 6h14a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-1v4l-5-4h-8a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5Z" fill="${PAL.accent}"/>` +
    `<path d="M11 14h18a6.5 6.5 0 0 1 6.5 6.5v8A6.5 6.5 0 0 1 29 35H17l-7 6v-6.3A6.5 6.5 0 0 1 4.5 28.5v-8A6.5 6.5 0 0 1 11 14Z" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6"/>` +
    `<path d="M13 24.6l4.4 4.4 8.6-8.6" fill="none" stroke="${PAL.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`, "Replies", s),
  // RoomIQ's five areas. Rent Evidence: a magnifying glass over a dollar sign (the rent checked against rooms nearby)
  rent: (s) => svg(
    `<path d="M29.4 29.4 41.5 41.5" stroke="${PAL.ink}" stroke-width="6.5" stroke-linecap="round"/>` +
    `<circle cx="20" cy="20" r="14" fill="#fff" stroke="${PAL.ink}" stroke-width="4.2"/>` +
    `<path d="M24.6 15.4c-.9-1.4-2.6-2.1-4.6-2.1-2.6 0-4.5 1.3-4.5 3.3s2 2.9 4.5 3.4 4.8 1.4 4.8 3.6-2.2 3.6-4.8 3.6c-2.1 0-4-.9-4.9-2.4M20 10.6v2.7M20 27.2v2.6" fill="none" stroke="${PAL.accent}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`, "Rent Evidence", s),
  // Fill Speed: a house with four rooms, three of them lit (filled), one still empty
  fill: (s) => svg(
    `<path d="M24 5.5 43 20.5H5Z" fill="${PAL.ink}" stroke="${PAL.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<rect x="8.5" y="19" width="31" height="24" rx="3" fill="${PAL.ink}"/>` +
    `<rect x="12.5" y="23" width="10" height="7.5" rx="1.6" fill="${PAL.accent}"/><rect x="25.5" y="23" width="10" height="7.5" rx="1.6" fill="${PAL.accent}"/>` +
    `<rect x="12.5" y="32.5" width="10" height="7.5" rx="1.6" fill="${PAL.accent}"/><rect x="25.5" y="32.5" width="10" height="7.5" rx="1.6" fill="#fff"/>`, "Fill Speed", s),
  // Nearby Supply: a pin inside a ring (about 3 miles) with three houses on it
  supply: (s) => {
    const house = (x, y, r) => `<path d="M${x} ${y - r}L${x + r} ${y - r * 0.1}V${y + r * 0.9}H${x - r}V${y - r * 0.1}Z" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`;
    return svg(
      `<circle cx="24" cy="26" r="15" fill="none" stroke="${PAL.ink}" stroke-width="2.6" stroke-dasharray="4.2 3.6"/>` +
      house(24, 11.5, 5.2) + house(11, 33.5, 5.2) + house(37, 33.5, 5.2) +
      `<path d="M24 33.8c-.6 0-1-.3-1.4-.8-2.8-3.3-5.1-6.3-5.1-9.3a6.5 6.5 0 0 1 13 0c0 3-2.3 6-5.1 9.3-.4.5-.8.8-1.4.8Z" fill="${PAL.accent}"/>` +
      `<circle cx="24" cy="23.7" r="2.4" fill="#fff"/>`, "Nearby Supply", s);
  },
  // Room Mix: a floor plan of four rooms, one of them a bathroom (a drop of water)
  mix: (s) => svg(
    `<rect x="5" y="7" width="38" height="34" rx="4.5" fill="${PAL.ink}"/>` +
    `<rect x="8.5" y="10.5" width="14" height="12.5" rx="1.6" fill="#fff"/><rect x="25.5" y="10.5" width="14" height="12.5" rx="1.6" fill="${PAL.accent}"/>` +
    `<rect x="8.5" y="26" width="14" height="11.5" rx="1.6" fill="#fff"/><rect x="25.5" y="26" width="14" height="11.5" rx="1.6" fill="#fff"/>` +
    `<path d="M32.5 12.6c2.3 2.9 3.6 4.8 3.6 6.4a3.6 3.6 0 0 1-7.2 0c0-1.6 1.3-3.5 3.6-6.4Z" fill="#fff"/>` +
    `<rect x="11" y="31" width="9" height="4" rx="1.2" fill="${PAL.ink}"/><rect x="11" y="28.4" width="3.6" height="2.6" rx="1" fill="${PAL.ink}"/>`, "Room Mix", s),
  // Lease-up Reserves: a stack of coins beside an hourglass (money set aside for the months the rooms take to fill)
  reserves: (s) => svg(
    `<rect x="4" y="33.5" width="22" height="7.5" rx="3.75" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6"/>` +
    `<rect x="5.5" y="26.5" width="22" height="7.5" rx="3.75" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6"/>` +
    `<rect x="4" y="19.5" width="22" height="7.5" rx="3.75" fill="${PAL.ink}" stroke="#fff" stroke-width="1.6"/>` +
    `<rect x="29" y="6.5" width="15" height="3.4" rx="1.7" fill="${PAL.ink}"/><rect x="29" y="38.1" width="15" height="3.4" rx="1.7" fill="${PAL.ink}"/>` +
    `<path d="M31 9.9h11c0 6-4.6 8.2-4.6 14.1S42 32.1 42 38.1H31c0-6 4.6-8.2 4.6-14.1S31 15.9 31 9.9Z" fill="${PAL.accent}"/>` +
    `<path d="M33.6 38.1c.6-2.6 2.9-4 2.9-6.3 0 2.3 2.3 3.7 2.9 6.3Z" fill="#fff"/>`, "Lease-up Reserves", s),
  // A stopwatch with the hand at one minute
  "u-minute": (s) => svg(
    `<rect x="20.5" y="3.5" width="7" height="4.5" rx="1.6" fill="${PAL.ink}"/><rect x="35.5" y="9.2" width="4.4" height="4.4" rx="1.2" transform="rotate(45 37.7 11.4)" fill="${PAL.ink}"/>` +
    `<circle cx="24" cy="27" r="17" fill="${PAL.ink}"/><circle cx="24" cy="27" r="12.6" fill="#fff"/>` +
    `<path d="M24 27V16.4" stroke="${PAL.accent}" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="27" r="2.6" fill="${PAL.ink}"/>`, "About a minute", s),
  // A price tag with a zero on it
  "u-free": (s) => svg(
    `<path d="M6 9.5A3.5 3.5 0 0 1 9.5 6h12.2a3.5 3.5 0 0 1 2.5 1l16.6 16.6a3.5 3.5 0 0 1 0 5L28.6 40.8a3.5 3.5 0 0 1-5 0L7 24.2a3.5 3.5 0 0 1-1-2.5Z" fill="${PAL.ink}"/>` +
    `<circle cx="14" cy="14" r="3" fill="#fff"/><ellipse cx="26.4" cy="25.8" rx="4.4" ry="6" transform="rotate(-45 26.4 25.8)" fill="none" stroke="${PAL.accent}" stroke-width="3"/>`, "Free", s),
  // A donut chart three quarters filled, with a small spark at the end of the arc
  "u-score": (s) => svg(
    `<circle cx="24" cy="26" r="15" fill="none" stroke="${PAL.ink}" stroke-width="7" opacity=".18"/>` +
    `<path d="M24 11a15 15 0 1 1-15 15" fill="none" stroke="${PAL.ink}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M9 12.5l1.3 3.2 3.2 1.3-3.2 1.3L9 21.5l-1.3-3.2-3.2-1.3 3.2-1.3Z" fill="${PAL.accent}"/>`, "Score right away", s),
  // A clipboard with a small bar chart and an envelope tucked behind it
  "u-report": (s) => svg(
    `<rect x="22" y="22" width="22" height="16" rx="2.5" fill="${PAL.accent}"/><path d="M22.8 23.5 33 31l10.2-7.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<rect x="6" y="7" width="24" height="34" rx="3.5" fill="${PAL.ink}"/><rect x="12.5" y="4" width="11" height="6" rx="2" fill="${PAL.ink}" stroke="#fff" stroke-width="1.4"/>` +
    `<rect x="10" y="13" width="16" height="24" rx="1.6" fill="#fff"/>` +
    `<rect x="12.5" y="27" width="3" height="7" rx=".8" fill="${PAL.accent}"/><rect x="16.8" y="22" width="3" height="12" rx=".8" fill="${PAL.accent}"/><rect x="21.1" y="18" width="3" height="16" rx=".8" fill="${PAL.accent}"/>`, "Report by email", s)
};

/** An area's icon: its own drawing when ICONS has one (the worked example's four), else a neutral one: the area's
 *  initial on a tint of its color, so a new project's areas show something before their icons are drawn. */
export const icon = (key, size = 48) => {
  if (ICONS[key]) return ICONS[key](size);
  const c = AREA_COLORS[key] || PAL.accent;
  const name = AREA_NAMES[key] || String(key || "?");
  const initial = name.replace(/^(ask|the)\s+/i, "").charAt(0).toUpperCase() || "?";
  return svg(`<rect x="3" y="3" width="42" height="42" rx="13" fill="${c}" fill-opacity=".16"/><rect x="3" y="3" width="42" height="42" rx="13" fill="none" stroke="${c}" stroke-width="2.5"/>` +
    `<text x="24" y="31.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="21" font-weight="700" fill="${PAL.ink}">${initial}</text>`, name, size);
};

/** The strongest area badge: a rounded shield in the area's colour with a white star and an upward chevron. */
export function strongBadge(area, size = 84) {
  const c = AREA_COLORS[area] || PAL.accent;
  return `<svg class="badge" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M24 3.5 40 9.6v12.6c0 10.6-6.8 18.6-16 22.3C14.8 40.8 8 32.8 8 22.2V9.6Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${starPath(24, 20.5, 7.6, 3.3)}" fill="#fff"/><path d="M18.5 34.5 24 29.5l5.5 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** The weakest area badge: a rounded square in the area's colour with a white wrench crossing a small plus sign. */
export function fixBadge(area, size = 84) {
  const c = AREA_COLORS[area] || PAL.accent;
  return `<svg class="badge" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="4" y="4" width="40" height="40" rx="11" fill="${c}"/>` +
    `<path d="M30.8 12.2a7 7 0 0 0-8.6 8.9L13 30.3a2.6 2.6 0 0 0 3.7 3.7l9.2-9.2a7 7 0 0 0 8.9-8.6l-4.2 4.2-3.7-1-1-3.7Z" fill="#fff"/>` +
    `<path d="M33.5 29.5v8M29.5 33.5h8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
}

/** The houses strip: of the last 10 jobs, how many were asked. Lit houses carry a review card with stars; the rest
 *  carry an empty dashed card. asked null: every card is a question mark. */
export function housesStrip(asked, { width = 560, label = "" } = {}) {
  const n = 10, gap = 6, w = (width - gap * (n - 1)) / n, h = w * 1.25;
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = i * (w + gap), lit = asked !== null && i < asked;
    const roofY = h * 0.42, bodyY = h * 0.6;
    const house = `<path d="M${x + w / 2} ${h * 0.34}L${x + w * 0.96} ${roofY + h * 0.18}H${x + w * 0.04}Z" fill="${lit ? PAL.ink : PAL.ink400}"/>` +
      `<rect x="${x + w * 0.14}" y="${bodyY}" width="${w * 0.72}" height="${h * 0.38}" rx="${w * 0.06}" fill="${lit ? PAL.ink : PAL.ink300}"/>` +
      `<rect x="${x + w * 0.42}" y="${bodyY + h * 0.14}" width="${w * 0.16}" height="${h * 0.24}" rx="${w * 0.03}" fill="${lit ? PAL.star : PAL.line}"/>`;
    const cardW = w * 0.86, cardH = h * 0.22, cx = x + (w - cardW) / 2, cy = 0;
    const card = lit
      ? `<rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="${cardH * 0.28}" fill="#fff" stroke="${PAL.line2}"/>` +
        [0, 1, 2].map((k) => `<path d="${starPath(cx + cardW * (0.26 + k * 0.24), cy + cardH / 2, cardH * 0.26, cardH * 0.11)}" fill="${PAL.star}"/>`).join("")
      : `<rect x="${cx + 0.75}" y="${cy + 0.75}" width="${cardW - 1.5}" height="${cardH - 1.5}" rx="${cardH * 0.28}" fill="none" stroke="${PAL.ink400}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
        (asked === null ? `<text x="${cx + cardW / 2}" y="${cy + cardH * 0.72}" text-anchor="middle" font-size="${cardH * 0.7}" font-weight="700" fill="${PAL.ink500}">?</text>` : "");
    out += card + house;
  }
  return `<svg class="houses" viewBox="0 0 ${width} ${h.toFixed(1)}" width="100%" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

/** The lease-up strip (spec 1, section 4): the first `horizon` months as the buyer plans them. fillM = the months the
 *  rooms are expected to take to fill (the lease-up), reservesM = the months of costs the reserves carry (null: not
 *  sure). Lease-up months covered by reserves are outlined in the accent, uncovered ones are amber (the signal: the one
 *  thing that needs the buyer's eye), the months after the lease-up are ink: the rooms full, as planned. The number in
 *  each tile is the month; the page prints the legend beside it, so no state depends on color alone. */
export function monthsStrip(fillM, reservesM, { horizon = 6, width = 360, label = "" } = {}) {
  const n = horizon, gap = 6, w = (width - gap * (n - 1)) / n, h = 46;
  let out = "";
  for (let i = 0; i < n; i++) {
    const m = i + 1, x = i * (w + gap);
    const state = m > fillM ? "full" : reservesM === null || reservesM === undefined ? "unknown" : m <= reservesM ? "covered" : "uncovered";
    const fillC = state === "full" ? PAL.ink : state === "uncovered" ? PAL.signal : state === "covered" ? "#FFFFFF" : PAL.line;
    const stroke = state === "covered" ? PAL.accent : state === "unknown" ? PAL.ink400 : "none";
    const dash = state === "unknown" ? ' stroke-dasharray="5 4"' : "";
    out += `<rect x="${(x + 1.5).toFixed(1)}" y="1.5" width="${(w - 3).toFixed(1)}" height="${h - 3}" rx="10" fill="${fillC}" stroke="${stroke}" stroke-width="3"${dash}/>` +
      `<text x="${(x + w / 2).toFixed(1)}" y="${h / 2 + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${state === "full" ? "#FFFFFF" : PAL.ink}">${m}</text>`;
  }
  return `<svg class="months-strip" viewBox="0 0 ${width} ${h}" width="100%" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

/** The strip's states, in order, for its legend: which of covered, uncovered, unknown and full appear. */
export function monthsStates(fillM, reservesM, horizon = 6) {
  const seen = [];
  for (let m = 1; m <= horizon; m++) {
    const s = m > fillM ? "full" : reservesM === null || reservesM === undefined ? "unknown" : m <= reservesM ? "covered" : "uncovered";
    if (!seen.includes(s)) seen.push(s);
  }
  return seen;
}

/** The score donut: the Visibility Score as an arc out of 100, the number in the middle. */
export function donut(score, { size = 168, stroke = 16, color = PAL.accent, track = PAL.line, label = "" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, len = (Math.max(0, Math.min(100, score)) / 100) * c;
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${len.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="donut-n">${score}</text></svg>`;
}

/** Twelve monthly bars; the two quietest months marked (amber, with their label bold). */
export function monthsChart(values, labels, low = [], { width = 600, height = 170, color = PAL.chart, lowColor = PAL.signal } = {}) {
  const max = Math.max(1, ...values);
  const pad = 22, bw = (width - 8) / 12, ch = height - pad - 18;
  let out = `<line x1="0" x2="${width}" y1="${height - pad}" y2="${height - pad}" stroke="${PAL.line2}"/>`;
  values.forEach((v, i) => {
    const bh = (v / max) * ch, x = 4 + i * bw + bw * 0.18, y = height - pad - bh;
    const isLow = low.includes(i);
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(bh, v ? 2 : 0).toFixed(1)}" rx="3" fill="${isLow ? lowColor : color}"/>` +
      `<text x="${(x + bw * 0.32).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" class="mc-v">${v}</text>` +
      `<text x="${(x + bw * 0.32).toFixed(1)}" y="${height - 5}" text-anchor="middle" class="mc-l${isLow ? " low" : ""}">${labels[i]}</text>`;
  });
  return `<svg class="months" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Google reviews by month" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

