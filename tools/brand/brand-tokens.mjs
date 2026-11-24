#!/usr/bin/env node
// brand.json -> the scorecard's design tokens. The same algorithm as the gtm-builder's landing page (tools/tokens.mjs),
// so a scorecard built from a GTM matches its landing page exactly: from three brand colors (ink, primary, signal) and
// a neutral tint, four 13-step OKLCH ramps (25 to 975, the brand color kept exact at its nearest step), then the
// semantic tokens for the light and dark themes. Every text and UI pair is checked against WCAG 2.2 AA; where a pair
// would fail, the token walks along its ramp to the nearest step that passes, and the report says so. A pair that
// cannot pass fails the run (exit 1), so a page never ships unreadable text.
//
//   node brand-tokens.mjs --brand brand/brand.json --out src/styles/tokens.css [--brand-mjs content/brand.mjs] [--light-only] [--check]
//
// --brand-mjs also writes the colors block of content/brand.mjs (the emails, the share image and the drawings use it)
// and the name, the fonts' families and the logo files when brand.json has them.
// brand.json: { name, colors: { ink, primary, signal, neutral? }, light?: { token: "ramp-step" | "#hex" }, dark?: {...},
//   fonts?: { display: { family, file? }, text: { family, file? } }, radius?: { card, screen, button }, logo?: {...} }
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { STEPS, ramp, contrast, isHex, normHex } from "./lib/color.mjs";

export function buildTokens(brand, { lightOnly = false } = {}) {
  if (!brand || !brand.colors) throw new Error("brand.json needs colors: { ink, primary, signal }");
  const C = brand.colors;
  for (const k of ["ink", "primary"]) if (!isHex(C[k])) throw new Error(`brand.json colors.${k} must be a hex color`);
  const signalHex = isHex(C.signal) ? C.signal : "#F5A524";
  const ink = ramp(C.ink), primary = ramp(C.primary), signal = ramp(signalHex);
  const neutralHue = C.neutral && isHex(C.neutral) ? C.neutral : C.ink;
  const neutral = ramp(neutralHue, { chroma: 0.018, keep: false });
  const RAMPS = { ink, primary, neutral, signal };
  const get = (ref) => {
    if (!ref) return null;
    if (String(ref).startsWith("#")) return normHex(ref);
    const [name, step] = String(ref).split("-");
    if (!RAMPS[name] || !RAMPS[name][step]) throw new Error(`brand.json: unknown color "${ref}"`);
    return RAMPS[name][step];
  };
  const report = [];
  let failed = 0;
  function pick(name, from, dir, grounds, min, label) {
    const r = RAMPS[name];
    const order = dir > 0 ? STEPS.filter((s) => s >= from) : STEPS.filter((s) => s <= from).reverse();
    for (const s of order) {
      const worst = Math.min(...grounds.map((g) => contrast(r[s], g)));
      if (worst >= min) { report.push([label, `${name}-${s}`, r[s], worst.toFixed(2), min]); return r[s]; }
    }
    failed++;
    report.push([label, "FAIL", "-", "-", min]);
    return r[order[order.length - 1]];
  }
  function verify(label, fg, grounds, min) {
    const worst = Math.min(...grounds.map((g) => contrast(fg, g)));
    if (worst < min) failed++;
    report.push([label, worst >= min ? "ok" : "FAIL", fg, worst.toFixed(2), min]);
  }
  const up = (s, n) => STEPS[Math.max(0, STEPS.indexOf(s) - n)], down = (s, n) => STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(s) + n)];
  function fillFor(accent, o, darkOn, lightOn, mode) {
    if (o["accent-fill"]) { const f = get(o["accent-fill"]); return { fill: f, end: f, on: contrast(darkOn, f) >= contrast(lightOn, f) ? darkOn : lightOn }; }
    const r = primary, base = r.base;
    const tries = [];
    for (const on of [darkOn, lightOn]) {
      const dir = on === lightOn ? 1 : -1;
      const order = dir > 0 ? STEPS.filter((s) => s >= base) : STEPS.filter((s) => s <= base).reverse();
      for (const s of order) {
        const end = r[dir > 0 ? down(s, 1) : up(s, 1)];
        if (contrast(on, r[s]) >= 4.5 && contrast(on, end) >= 4.5) { tries.push({ fill: r[s], end, on, dist: Math.abs(STEPS.indexOf(s) - STEPS.indexOf(base)), step: s }); break; }
      }
    }
    tries.sort((a, b) => a.dist - b.dist || contrast(b.on, b.fill) - contrast(a.on, a.fill));
    const best = tries[0] || { fill: accent, end: accent, on: lightOn, step: base };
    report.push([`${mode} button fill under ${best.on === lightOn ? "white" : "dark"} text`, `primary-${best.step}`, best.fill, contrast(best.on, best.fill).toFixed(2), 4.5]);
    return best;
  }
  function theme(mode) {
    const o = brand[mode] || {};
    const t = {};
    if (mode === "light") {
      t.bg = get(o.bg) || "#FFFFFF";
      t.surface = get(o.surface) || neutral[25];
      t["surface-2"] = get(o["surface-2"]) || neutral[50];
      t.line = get(o.line) || neutral[100];
      t["line-strong"] = get(o["line-strong"]) || neutral[200];
      t.heading = get(o.heading) || ink[ink.base];
      t.text = get(o.text) || ink[975];
      const g = [t.bg, t.surface, t["surface-2"]];
      t["text-2"] = get(o["text-2"]) || pick("neutral", 600, 1, g, 4.5, "light text-2 on bg/surfaces");
      t.accent = get(o.accent) || primary[primary.base];
      t["accent-text"] = get(o["accent-text"]) || pick("primary", Math.max(primary.base, 500), 1, g, 4.5, "light accent-text on bg/surfaces");
      t["signal-text"] = get(o["signal-text"]) || pick("signal", Math.max(signal.base, 600), 1, g, 4.5, "light signal-text on bg/surfaces");
      t.device = get(o.device) || ink[975];
      t.shadow = get(o.shadow) || ink[ink.base];
    } else {
      t.bg = get(o.bg) || ink[950];
      t.surface = get(o.surface) || ink[900];
      t["surface-2"] = get(o["surface-2"]) || ink[800];
      t.line = get(o.line) || ink[800];
      t["line-strong"] = get(o["line-strong"]) || ink[700];
      t.heading = get(o.heading) || "#FFFFFF";
      t.text = get(o.text) || neutral[100];
      const g = [t.bg, t.surface];
      t["text-2"] = get(o["text-2"]) || pick("neutral", 500, -1, [...g, t["surface-2"]], 4.5, "dark text-2 on bg/surfaces");
      t.accent = get(o.accent) || primary[primary.base];
      t["accent-text"] = get(o["accent-text"]) || pick("primary", Math.min(primary.base, 400), -1, g, 4.5, "dark accent-text on bg/surface");
      t["signal-text"] = get(o["signal-text"]) || pick("signal", Math.min(signal.base, 300), -1, g, 4.5, "dark signal-text on bg/surface");
      t.device = get(o.device) || "#000000";
      t.shadow = get(o.shadow) || "#000000";
    }
    t.signal = get(o.signal) || signal[signal.base];
    t.screen = get(o.screen) || "#FFFFFF";
    t.focus = get(o.focus) || t["accent-text"];
    const darkOn = ink[975], lightOn = "#FFFFFF";
    const fill = fillFor(t.accent, o, darkOn, lightOn, mode);
    t["accent-fill"] = fill.fill;
    t["on-accent"] = get(o["on-accent"]) || fill.on;
    t["on-signal"] = contrast(darkOn, t.signal) >= contrast(lightOn, t.signal) ? darkOn : lightOn;
    t["logo-ink"] = get(o["logo-ink"]) || (mode === "light" ? ink[ink.base] : "#FFFFFF");
    t["logo-accent"] = get(o["logo-accent"]) || t.accent;
    verify(`${mode} text on bg`, t.text, [t.bg, t.surface], 7);
    verify(`${mode} heading on bg`, t.heading, [t.bg, t.surface], 7);
    verify(`${mode} on-accent on accent-fill`, t["on-accent"], [t["accent-fill"], t["accent-fill-2"] = fill.end], 4.5);
    verify(`${mode} on-signal on signal`, t["on-signal"], [t.signal], 4.5);
    verify(`${mode} line-strong as a control edge`, t["line-strong"], [t.bg], 1.3);
    verify(`${mode} accent as a UI mark on bg`, t.accent, [t.bg], 2);
    return t;
  }
  const light = theme("light"), dark = theme("dark");
  const P = primary, I = ink, b = P.base;
  const grad = {
    forward: `linear-gradient(135deg, ${light["accent-fill"]} 0%, ${light["accent-fill-2"]} 100%)`,
    ink: `linear-gradient(160deg, ${I[800]} 0%, ${I[900]} 45%, ${I[975]} 100%)`
  };
  const canvas = {
    light: `radial-gradient(60% 50% at 85% 0%, ${P[100]} 0%, transparent 70%), radial-gradient(50% 45% at 0% 100%, ${neutral[50]} 0%, transparent 70%), ${light.bg}`,
    dark: `radial-gradient(60% 50% at 85% 0%, color-mix(in srgb, ${P[b]} 22%, transparent) 0%, transparent 70%), radial-gradient(55% 50% at 0% 100%, ${I[900]} 0%, transparent 70%), ${I[975]}`
  };
  const lines = [];
  lines.push(`/* Design tokens for ${brand.name || "the brand"}. Generated from brand/brand.json by the Scorecard Funnel Creator's brand-tokens.mjs`);
  lines.push(`   (the gtm-builder landing page's algorithm): edit brand.json, then run the tool again. Do not edit by hand. */`);
  lines.push(":root {");
  for (const [name, r] of Object.entries(RAMPS)) for (const s of STEPS) lines.push(`  --c-${name}-${s}: ${r[s]};`);
  lines.push(`  --c-grad-forward: ${grad.forward};`);
  lines.push(`  --c-grad-ink: ${grad.ink};`);
  const F = brand.fonts || {}, R = brand.radius || {};
  const stack = (f, fb) => (f && f.family ? `"${f.family}",${fb}` : fb);
  lines.push(`  --f-display: ${stack(F.display, "system-ui,sans-serif")};`);
  lines.push(`  --f-text: ${stack(F.text, 'system-ui,-apple-system,"Segoe UI",sans-serif')};`);
  lines.push(`  --f-stretch: ${(F.display && F.display.stretch) || "100%"};`);
  lines.push(`  --f-stretch-sm: ${(F.display && F.display.stretchSmall) || "100%"};`);
  lines.push(`  --r-card: ${R.card ?? 20}px;`);
  lines.push(`  --r-screen: ${R.screen ?? 28}px;`);
  lines.push(`  --r-btn: ${R.button ?? 12}px;`);
  lines.push("}");
  const block = (sel, t, scheme, cv) => {
    lines.push(`${sel} {`);
    lines.push(`  color-scheme: ${scheme};`);
    for (const [k, v] of Object.entries(t)) lines.push(`  --c-${k}: ${v};`);
    lines.push(`  --c-grad-canvas: ${cv};`);
    lines.push("}");
  };
  block(':root, [data-theme="light"]', light, "light", canvas.light);
  // The scorecard's pages are light (a short funnel opened on a phone, often in an app's browser); --light-only drops
  // the dark theme's block, which nothing in the template reads
  if (!lightOnly) block('[data-theme="dark"]', dark, "dark", canvas.dark);
  // Brand extras: the rating stars' gold, and any other named color brand.json lists under extras (a logo's gradient
  // stops, say), each as --c-<name>. The area colors come from content/scorecard.mjs, injected by the build.
  const extras = { star: "#F9CE14", ...(brand.extras || {}) };
  lines.push(":root {");
  lines.push("  /* Brand extras (the area colors come from content/scorecard.mjs, injected by the build) */");
  for (const [k, v] of Object.entries(extras)) if (isHex(v) && /^[a-z][a-z0-9-]*$/.test(k)) lines.push(`  --c-${k}: ${normHex(v)};`);
  lines.push("}");
  const css = lines.join("\n") + "\n";
  // The colors outside the stylesheet (content/brand.mjs colors): the emails, the share image, the drawings
  const colors = {
    ink: light.heading, text: light.text, muted: ink[600], link: light["accent-text"], accent: light.accent, accent2: light["accent-fill-2"],
    onAccent: light["on-accent"], canvas: ink[50], line: ink[100], tint: P[100], line2: ink[200], ink300: ink[300], ink400: ink[400], ink500: ink[500],
    signal: light.signal, star: normHex((brand.extras && brand.extras.star) || "#F9CE14"), chart: (brand.extras && brand.extras.chart && normHex(brand.extras.chart)) || "#2A78D6"
  };
  return { css, colors, report, failed, bases: { ink: ink.base, primary: primary.base, signal: signal.base }, themes: { light, dark }, ramps: RAMPS };
}

/**
 * Writes content/brand.mjs's colors block, keeping its comments; and, when given, the name, the slug, the home label,
 * the fonts' families and weights, and the logo block ({ lockup, lockupOnDark, mark, width, height }: files in
 * src/assets/, null for a missing one).
 */
export function patchBrandMjs(source, brand, colors, { slug = null, homeLabel = null, logo = null } = {}) {
  let s = source;
  const objBlock = (key, obj, indent = "  ") => `${key}: {\n${Object.entries(obj).map(([k, v]) => `${indent}  ${k}: ${JSON.stringify(v)}`).join(",\n")}\n${indent}}`;
  s = s.replace(/colors: \{[\s\S]*?\n  \}/, objBlock("colors", colors));
  if (brand.name) s = s.replace(/name: "[^"]*",( \/\/)/, `name: ${JSON.stringify(brand.name)},$1`);
  if (slug) s = s.replace(/slug: "[^"]*",( \/\/)/, `slug: ${JSON.stringify(slug)},$1`);
  if (homeLabel) s = s.replace(/homeLabel: "[^"]*",( \/\/)/, `homeLabel: ${JSON.stringify(homeLabel)},$1`);
  const F = brand.fonts || {};
  for (const role of ["display", "text"]) {
    if (F[role] && F[role].family) s = s.replace(new RegExp(`(${role}: \\{ family: )"[^"]*"`), `$1${JSON.stringify(F[role].family)}`);
    if (F[role] && F[role].weight) s = s.replace(new RegExp(`(${role}: \\{ family: "[^"]*", file: "[^"]*", weight: )"[^"]*"`), `$1${JSON.stringify(String(F[role].weight))}`);
  }
  if (logo) s = s.replace(/logo: \{[\s\S]*?\n  \}/, objBlock("logo", logo));
  return s;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
  const brandPath = opt("brand"), out = opt("out"), brandMjs = opt("brand-mjs");
  if (!brandPath || !out) { console.error("usage: node brand-tokens.mjs --brand brand/brand.json --out src/styles/tokens.css [--brand-mjs content/brand.mjs] [--check]"); process.exit(2); }
  const brand = JSON.parse(readFileSync(brandPath, "utf8"));
  const r = buildTokens(brand, { lightOnly: args.includes("--light-only") });
  console.log(`ramps: ink ${brand.colors.ink} at ${r.bases.ink}, primary ${brand.colors.primary} at ${r.bases.primary}, signal ${brand.colors.signal || "#F5A524 (default)"} at ${r.bases.signal}`);
  for (const [label, ref, hex, ratio, min] of r.report) console.log(`  ${String(label).padEnd(40)} ${String(ref).padEnd(14)} ${String(hex).padEnd(9)} ${ratio} (min ${min})`);
  if (r.failed) { console.error(`tokens: ${r.failed} pair(s) fail WCAG AA. Change brand.json (a darker ink, a different accent) and rerun.`); process.exit(1); }
  if (args.includes("--check")) {
    const prev = existsSync(out) ? readFileSync(out, "utf8") : "";
    if (prev !== r.css) { console.error(`${out} is stale: run brand-tokens.mjs again`); process.exit(1); }
    console.log("tokens: current");
  } else {
    writeFileSync(out, r.css);
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
    if (brandMjs) {
      writeFileSync(brandMjs, patchBrandMjs(readFileSync(brandMjs, "utf8"), brand, r.colors));
      console.log(`wrote the colors (and name and font families) into ${path.relative(process.cwd(), brandMjs)}`);
    }
  }
}
