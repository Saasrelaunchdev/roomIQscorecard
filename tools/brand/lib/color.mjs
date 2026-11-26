// Color math for the skill's scripts, with no dependencies: sRGB <-> OKLab <-> OKLCH, WCAG contrast, OKLab distance,
// color-blindness simulation (Machado, Oliveira and Fernandes 2009, severity 1.0, in linear RGB) and the 13-step ramps
// the brand tokens are built from (the same ramps as the gtm-builder's landing page tokens, so a scorecard matches its
// landing page exactly).

export const hex2rgb = (h) => {
  h = String(h).trim().replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
export const rgb2hex = (c) => "#" + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
export const isHex = (s) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s || "").trim());
export const normHex = (s) => rgb2hex(hex2rgb(s));
export const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function linRgb2oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export const hex2oklab = (hex) => linRgb2oklab(hex2rgb(hex).map(lin));
export function rgb2oklch(rgb) {
  const [L, A, B] = linRgb2oklab(rgb.map(lin));
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
export const hex2oklch = (hex) => rgb2oklch(hex2rgb(hex));
function oklch2rgbRaw([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (c) => c.every((v) => v >= -0.0001 && v <= 1.0001);
/** OKLCH to hex; out of gamut, lightness and hue stay and chroma drops until the color exists in sRGB. */
export function oklch2hex([L, C, H]) {
  let lo = 0, hi = C, rgb = oklch2rgbRaw([L, C, H]);
  if (!inGamut(rgb)) {
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(oklch2rgbRaw([L, mid, H]))) lo = mid; else hi = mid; }
    rgb = oklch2rgbRaw([L, lo, H]);
  }
  return rgb2hex(rgb.map(gam));
}

export const luminance = (hex) => { const [r, g, b] = hex2rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** WCAG 2 contrast ratio, 1 to 21. */
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** Euclidean distance in OKLab, x100 (the unit the palette floors use). */
export const deltaE = (a, b) => { const p = hex2oklab(a), q = hex2oklab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100; };

// Machado 2009, severity 1.0, applied to linear RGB
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]
};
/** The color as a person with full protanopia, deuteranopia or tritanopia sees it, in OKLab. */
export function simulate(hex, kind) {
  const c = hex2rgb(hex).map(lin);
  const M = CVD[kind];
  const out = M.map((row) => Math.min(1, Math.max(0, row[0] * c[0] + row[1] * c[1] + row[2] * c[2])));
  return linRgb2oklab(out);
}
export const deltaECvd = (a, b, kind) => { const p = simulate(a, kind), q = simulate(b, kind); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100; };

/* ---------- Ramps: 13 steps, 25 to 975, the brand color kept exact at its nearest step ---------- */
export const STEPS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975];
const L_AT = { 25: 0.99, 50: 0.975, 100: 0.95, 200: 0.9, 300: 0.83, 400: 0.74, 500: 0.65, 600: 0.56, 700: 0.47, 800: 0.38, 900: 0.3, 950: 0.23, 975: 0.17 };
export function ramp(baseHex, { chroma = null, keep = true } = {}) {
  const [L0, C0, H] = hex2oklch(baseHex);
  const C = chroma ?? C0;
  const bell = (L) => Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, L))) ** 0.9;
  const out = {};
  for (const s of STEPS) {
    const L = L_AT[s];
    const c = chroma !== null ? C * (0.5 + 0.5 * bell(L)) : C * Math.min(1.15, bell(L) / Math.max(0.2, bell(L0)));
    out[s] = oklch2hex([L, Math.min(c, 0.37), H]);
  }
  if (keep) {
    const near = STEPS.reduce((a, s) => (Math.abs(L_AT[s] - L0) < Math.abs(L_AT[a] - L0) ? s : a), STEPS[0]);
    out[near] = normHex(baseHex);
    out.base = near;
  }
  return out;
}

/** Parses a CSS color (hex, rgb(), rgba(), hsl(), a few names) to hex, or null. */
export function cssColorToHex(v) {
  const s = String(v || "").trim().toLowerCase();
  if (isHex(s)) return normHex(s);
  if (/^#[0-9a-f]{8}$/.test(s)) return normHex(s.slice(0, 7));
  let m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (alpha < 0.5) return null;
    return rgb2hex([m[1], m[2], m[3]].map((x) => Number(x) / 255));
  }
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(s);
  if (m) {
    const h = Number(m[1]) / 360, sat = Number(m[2]) / 100, l = Number(m[3]) / 100;
    const f = (n) => { const k = (n + h * 12) % 12; const a = sat * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return rgb2hex([f(0), f(8), f(4)]);
  }
  m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(s);
  if (m) return oklch2hex([m[2] ? Number(m[1]) / 100 : Number(m[1]), Number(m[3]), Number(m[4])]);
  const NAMES = { white: "#FFFFFF", black: "#000000" };
  return NAMES[s] || null;
}
