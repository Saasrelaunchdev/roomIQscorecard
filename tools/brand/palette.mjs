#!/usr/bin/env node
// Checks a categorical palette (the scorecard's area colors) or suggests one, so color never carries identity alone
// and neighbors stay apart for everyone. Computed, never eyeballed:
//   contrast against the surface (marks: 3:1, or the areas must always be labelled, which the template does)
//   OKLab distance between neighbors under normal vision (15 or more, a hard floor)
//   the same under simulated protanopia and deuteranopia (Machado 2009): 8 or more is the target, 6 to 8 needs labels
//   OKLCH lightness 0.43 to 0.77 and chroma 0.10 or more, so a color reads as a color and not as gray
//
//   node palette.mjs check "#2A78D6,#EB6834,#1BAF7A,#E87BA4" [--surface "#FFFFFF"] [--pairs adjacent|all] [--json]
//   node palette.mjs suggest --count 4 [--near "#1F86FF"] [--surface "#FFFFFF"] [--json]
// check exits 1 on a hard failure. suggest prints the best passing order of the validated pool, starting near the
// brand's primary hue (--near), as JSON with --json.
import { contrast, deltaE, deltaECvd, hex2oklch, isHex, normHex } from "./lib/color.mjs";

// A pool of categorical hues that pass the lightness and chroma bands on a white surface (blue, orange, aqua, yellow,
// magenta, green, violet, red: the common validated categorical set)
export const POOL = ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100", "#E87BA4", "#008300", "#6250D6", "#E34948"];

export function checkPalette(colors, { surface = "#FFFFFF", pairs = "adjacent" } = {}) {
  const c = colors.map(normHex);
  const rows = [];
  let fail = 0, warn = 0;
  const add = (level, check, detail) => { rows.push({ level, check, detail }); if (level === "FAIL") fail++; if (level === "WARN") warn++; };
  const band = c.filter((h) => { const [L] = hex2oklch(h); return L < 0.43 || L > 0.77; });
  add(band.length ? "WARN" : "PASS", "Lightness band", band.length ? `outside OKLCH L 0.43 to 0.77: ${band.join(", ")}` : `all ${c.length} inside`);
  const dull = c.filter((h) => hex2oklch(h)[1] < 0.1);
  add(dull.length ? "WARN" : "PASS", "Chroma floor", dull.length ? `reads as gray (C < 0.10): ${dull.join(", ")}` : `all ${c.length} at 0.10 or more`);
  const list = [];
  if (pairs === "all") { for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) list.push([c[i], c[j]]); }
  else for (let i = 0; i + 1 < c.length; i++) list.push([c[i], c[i + 1]]);
  if (list.length) {
    const normal = list.map(([a, b]) => ({ a, b, d: deltaE(a, b) })).sort((x, y) => x.d - y.d)[0];
    add(normal.d < 15 ? "FAIL" : "PASS", "Normal-vision distance", `closest ${pairs} pair ${normal.a} / ${normal.b}: ${normal.d.toFixed(1)} (floor 15)`);
    const cvd = list.flatMap(([a, b]) => ["protan", "deutan"].map((k) => ({ a, b, k, d: deltaECvd(a, b, k) }))).sort((x, y) => x.d - y.d)[0];
    add(cvd.d < 6 ? "FAIL" : cvd.d < 8 ? "WARN" : "PASS", "Color-blind distance", `closest ${pairs} pair ${cvd.a} / ${cvd.b} (${cvd.k}): ${cvd.d.toFixed(1)} (target 8, floor 6 with labels)`);
  }
  const low = c.map((h) => [h, contrast(h, surface)]).filter(([, r]) => r < 3);
  add(low.length ? "WARN" : "PASS", "Contrast with the surface", low.length ? `under 3:1 on ${surface}: ${low.map(([h, r]) => `${h} ${r.toFixed(2)}`).join(", ")} (label every area, as the template does)` : `all ${c.length} at 3:1 or more on ${surface}`);
  return { colors: c, rows, fail, warn, ok: fail === 0 };
}

const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** The best passing order of `count` colors from the pool (and the brand's own color, when it passes the bands). */
export function suggestPalette(count, { near = null, surface = "#FFFFFF", pool = POOL } = {}) {
  const candidates = pool.map(normHex);
  if (near && isHex(near)) {
    const [L, C] = hex2oklch(near);
    if (L >= 0.43 && L <= 0.77 && C >= 0.1 && !candidates.includes(normHex(near))) candidates.unshift(normHex(near));
  }
  const nearHue = near && isHex(near) ? hex2oklch(near)[2] : null;
  let best = null;
  const score = (seq) => {
    const r = checkPalette(seq, { surface });
    if (!r.ok) return null;
    let minCvd = Infinity, minNormal = Infinity;
    for (let i = 0; i + 1 < seq.length; i++) {
      minNormal = Math.min(minNormal, deltaE(seq[i], seq[i + 1]));
      for (const k of ["protan", "deutan"]) minCvd = Math.min(minCvd, deltaECvd(seq[i], seq[i + 1], k));
    }
    const lowContrast = seq.filter((h) => contrast(h, surface) < 3).length;
    const startGap = nearHue === null ? 0 : hueGap(hex2oklch(seq[0])[2], nearHue);
    // Fewer warnings, then the first color nearest the brand, then the widest color-blind gap, then contrast
    return [r.warn, Math.round(startGap / 20), -Math.min(minCvd, 12), lowContrast, -minNormal];
  };
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };
  const walk = (seq, rest) => {
    if (seq.length === count) {
      const s = score(seq);
      if (s && (!best || better(s, best.s))) best = { seq: seq.slice(), s };
      return;
    }
    for (let i = 0; i < rest.length; i++) walk([...seq, rest[i]], rest.filter((_, j) => j !== i));
  };
  walk([], candidates);
  return best ? { colors: best.seq, report: checkPalette(best.seq, { surface }) } : null;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
  const json = args.includes("--json");
  const print = (r) => {
    if (json) return console.log(JSON.stringify(r, null, 2));
    console.log(`Palette ${r.colors.join(", ")}`);
    for (const row of r.rows) console.log(`  [${row.level}] ${row.check.padEnd(28)} ${row.detail}`);
    console.log(r.ok ? (r.warn ? "  passes, with warnings (keep every area labelled)" : "  passes") : "  FAILS: change the colors or their order");
  };
  if (args[0] === "check") {
    const colors = String(args[1] || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!colors.length || !colors.every(isHex)) { console.error("usage: node palette.mjs check \"#hex,#hex,...\" [--surface #hex] [--pairs adjacent|all]"); process.exit(2); }
    const r = checkPalette(colors, { surface: opt("surface", "#FFFFFF"), pairs: opt("pairs", "adjacent") });
    print(r);
    process.exit(r.ok ? 0 : 1);
  } else if (args[0] === "suggest") {
    const count = Number(opt("count", "4"));
    const r = suggestPalette(count, { near: opt("near", null), surface: opt("surface", "#FFFFFF") });
    if (!r) { console.error(`No passing order of ${count} colors in the pool: use fewer areas, or label and add texture`); process.exit(1); }
    if (json) console.log(JSON.stringify(r, null, 2)); else print(r.report);
  } else {
    console.error("usage: node palette.mjs check \"#hex,...\" | suggest --count N [--near #brandPrimary]");
    process.exit(2);
  }
}
