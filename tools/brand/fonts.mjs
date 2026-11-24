#!/usr/bin/env node
// Gets the brand's two fonts as self-hosted woff2 files, one per role (display.woff2 for headings, text.woff2 for body),
// the way the template loads them. A variable font is preferred: one file covers every weight. Sources, in order:
//   1. a file the extraction already found (brand.json fonts.<role>.file, or --from)
//   2. the npm registry: the Fontsource package (@fontsource-variable/<id>, else @fontsource/<id>), its tarball read
//      in Node; the newest version published 14 days ago or more
//   3. Google Fonts (the css2 API, then the woff2 it names)
//   4. jsDelivr's copy of the Fontsource package
// Writes the files and fonts.json (each role's family, source, version, license, weights and sha256), so the project
// records where its fonts came from. Fontsource and Google Fonts serve open-licensed fonts (mostly SIL OFL 1.1); a
// commercial font must come from the brand's own files (source 1).
//
//   node fonts.mjs --brand brand/brand.json --dir src/assets/fonts
//   node fonts.mjs --family "Space Grotesk" --role display --dir src/assets/fonts [--weight 700] [--subset latin]
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import path from "node:path";

export const fontId = (family) => String(family).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const isWoff2 = (buf) => buf && buf.length > 1000 && buf.subarray(0, 4).toString() === "wOF2";

/** The files in a .tar buffer (ustar): [{ name, data }]. */
export function untar(buf) {
  const out = [];
  let i = 0;
  while (i + 512 <= buf.length) {
    const header = buf.subarray(i, i + 512);
    if (header.every((b) => b === 0)) break;
    const str = (a, b) => header.subarray(a, b).toString("utf8").replace(/\0.*$/s, "");
    const name = str(0, 100), prefix = str(345, 500);
    const size = parseInt(str(124, 136).trim() || "0", 8);
    const type = String.fromCharCode(header[156] || 48);
    const full = prefix ? `${prefix}/${name}` : name;
    if (type === "0" || type === "\0") out.push({ name: full, data: buf.subarray(i + 512, i + 512 + size) });
    i += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

async function getJson(url) { const r = await fetch(url, { headers: { accept: "application/json" } }); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.json(); }
async function getBuf(url, headers = {}) { const r = await fetch(url, { headers }); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); }

/** The newest version of an npm package published at least minAgeDays ago (the latest, if none is that old). */
export function pickVersion(doc, minAgeDays = 14, now = Date.now()) {
  const latest = doc["dist-tags"] && doc["dist-tags"].latest;
  const cutoff = now - minAgeDays * 86400000;
  const stable = Object.keys(doc.versions || {}).filter((v) => !/-/.test(v) && doc.time && doc.time[v] && Date.parse(doc.time[v]) <= cutoff);
  const cmp = (a, b) => { const pa = a.split(".").map(Number), pb = b.split(".").map(Number); for (let k = 0; k < 3; k++) if (pa[k] !== pb[k]) return pa[k] - pb[k]; return 0; };
  return stable.sort(cmp).pop() || latest;
}

/** A woff2 from the Fontsource package on the npm registry. */
export async function fromFontsource(family, { role = "text", weight = null, subset = "latin", minAgeDays = 14 } = {}) {
  const id = fontId(family);
  const tries = [];
  for (const variable of weight ? [false] : [true, false]) {
    const pkg = `${variable ? "@fontsource-variable" : "@fontsource"}/${id}`;
    try {
      const doc = await getJson(`https://registry.npmjs.org/${pkg.replace("/", "%2F")}`);
      const version = pickVersion(doc, minAgeDays);
      const meta = doc.versions[version];
      const files = untar(gunzipSync(await getBuf(meta.dist.tarball)));
      const want = variable
        ? [`${id}-${subset}-wght-normal.woff2`, `${id}-${subset}-full-normal.woff2`, `${id}-${subset}-standard-normal.woff2`]
        : [weight || (role === "display" ? 700 : 400), role === "display" ? 800 : 500, 600, 400].map((w) => `${id}-${subset}-${w}-normal.woff2`);
      for (const name of want) {
        const hit = files.find((f) => f.name === `package/files/${name}`);
        if (hit && isWoff2(hit.data)) {
          const w = variable ? variableRange(files, name) : /-(\d{3})-normal/.exec(name)[1];
          return { buf: Buffer.from(hit.data), source: `npm ${pkg}@${version} (${name})`, version, license: meta.license || "see the package", weight: w, variable };
        }
      }
      tries.push(`${pkg}@${version}: no ${want[0]}`);
    } catch (e) { tries.push(`${pkg}: ${e.message}`); }
  }
  throw new Error(tries.join("; "));
}
/** The weight range the package's CSS gives the file (a variable font's wght axis: "100 900", "400 700"...). */
function variableRange(files, fileName) {
  for (const css of files.filter((f) => /\.css$/.test(f.name))) {
    const text = css.data.toString();
    const at = text.indexOf(`files/${fileName}`);
    if (at < 0) continue;
    const block = text.slice(text.lastIndexOf("@font-face", at), at);
    const w = /font-weight:\s*([^;]+);/.exec(block);
    if (w) return w[1].trim();
  }
  return "100 900";
}

/** A woff2 from Google Fonts' css2 API (a variable range when the family has one). */
export async function fromGoogle(family, { role = "text", weight = null, subset = "latin" } = {}) {
  const ua = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" };
  const fam = encodeURIComponent(family).replace(/%20/g, "+");
  const urls = weight ? [`https://fonts.googleapis.com/css2?family=${fam}:wght@${weight}&display=swap`] : [`https://fonts.googleapis.com/css2?family=${fam}:wght@100..900&display=swap`, `https://fonts.googleapis.com/css2?family=${fam}:wght@${role === "display" ? 700 : 400}&display=swap`];
  const errors = [];
  for (const u of urls) {
    try {
      const css = (await getBuf(u, ua)).toString();
      // Each block is preceded by a /* subset */ comment
      const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map((m) => ({ subset: m[1], body: m[2] }));
      const block = blocks.find((b) => b.subset === subset) || blocks[blocks.length - 1];
      const src = block && /url\(([^)]+\.woff2)\)/.exec(block.body);
      if (!src) { errors.push(`${u}: no woff2`); continue; }
      const buf = await getBuf(src[1]);
      const w = (/font-weight:\s*([^;]+);/.exec(block.body) || [, "400"])[1].trim();
      return { buf, source: `Google Fonts (${src[1]})`, version: null, license: "see fonts.google.com (mostly SIL OFL 1.1)", weight: w, variable: /\d+\s+\d+/.test(w) };
    } catch (e) { errors.push(e.message); }
  }
  throw new Error(errors.join("; "));
}

export async function fromJsdelivr(family, { subset = "latin" } = {}) {
  const id = fontId(family);
  const u = `https://cdn.jsdelivr.net/npm/@fontsource-variable/${id}/files/${id}-${subset}-wght-normal.woff2`;
  const buf = await getBuf(u);
  return { buf, source: `jsDelivr (${u})`, version: "latest", license: "SIL OFL 1.1 (Fontsource)", weight: "100 900", variable: true };
}

/** The woff2 for one role: a local file first, then the open sources. */
export async function getFont({ family, role = "text", from = null, weight = null, subset = "latin", minAgeDays = 14 }) {
  if (from && existsSync(from)) {
    const buf = readFileSync(from);
    if (isWoff2(buf)) return { buf, source: `the brand's file (${from})`, version: null, license: "the brand's own", weight: weight || "100 900", variable: !weight };
  }
  if (!family) throw new Error(`${role}: no family and no file`);
  const errors = [];
  for (const get of [fromFontsource, fromGoogle, fromJsdelivr]) {
    try { const r = await get(family, { role, weight, subset, minAgeDays }); if (isWoff2(r.buf)) return r; errors.push(`${get.name}: not a woff2`); }
    catch (e) { errors.push(`${get.name}: ${e.message}`); }
  }
  throw new Error(`${role} (${family}): ${errors.join(" | ")}`);
}

/** Both roles from brand.json; writes <dir>/display.woff2, <dir>/text.woff2 and <dir>/fonts.json. */
export async function fontsFromBrand(brandPath, dir, { subset = null } = {}) {
  const brand = JSON.parse(readFileSync(brandPath, "utf8"));
  const base = path.dirname(path.resolve(brandPath));
  const F = brand.fonts || {};
  mkdirSync(dir, { recursive: true });
  const record = {};
  for (const role of ["display", "text"]) {
    const f = F[role] || (role === "text" ? F.display : F.text);
    if (!f || (!f.family && !f.file)) { record[role] = { family: null, note: "none in brand.json: the system font is used" }; continue; }
    const from = f.file ? path.resolve(base, f.file) : null;
    const single = f.weight && !/\d+\s+\d+/.test(String(f.weight)) && from && existsSync(from);
    const r = await getFont({ family: f.family, role, from: single ? null : from, subset: subset || (brand.subsets && brand.subsets[0]) || "latin" }).catch(async (e) => {
      if (from && existsSync(from)) return getFont({ family: null, role, from, weight: String(f.weight || "400") });
      throw e;
    });
    writeFileSync(path.join(dir, `${role}.woff2`), r.buf);
    record[role] = { family: f.family || null, file: `${role}.woff2`, source: r.source, version: r.version, license: r.license, weight: String(r.weight), variable: r.variable, sha256: sha(r.buf), bytes: r.buf.length };
  }
  writeFileSync(path.join(dir, "fonts.json"), JSON.stringify(record, null, 2) + "\n");
  return record;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
  const dir = opt("dir");
  try {
    if (opt("brand") && dir) {
      const rec = await fontsFromBrand(opt("brand"), dir, { subset: opt("subset") });
      for (const [role, r] of Object.entries(rec)) console.log(`${role}: ${r.family || "-"} ${r.source ? `from ${r.source}, weights ${r.weight}, ${Math.round(r.bytes / 1024)} KB, ${r.license}` : r.note}`);
      console.log(`wrote ${dir}/display.woff2, text.woff2 and fonts.json`);
    } else if (opt("family") && dir) {
      const role = opt("role") || "text";
      const r = await getFont({ family: opt("family"), role, from: opt("from"), weight: opt("weight"), subset: opt("subset") || "latin" });
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, `${role}.woff2`), r.buf);
      console.log(`${role}: ${opt("family")} from ${r.source}, weights ${r.weight}, ${Math.round(r.buf.length / 1024)} KB, ${r.license}`);
    } else {
      console.error('usage: node fonts.mjs --brand brand/brand.json --dir src/assets/fonts | --family "Name" --role display|text --dir <dir> [--weight 700] [--from file.woff2] [--subset latin]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`fonts: ${e.message}`);
    console.error("Give the brand's own woff2 files (--from, or brand.json fonts.<role>.file), or allow the npm registry or fonts.googleapis.com in the environment's network.");
    process.exit(1);
  }
}
