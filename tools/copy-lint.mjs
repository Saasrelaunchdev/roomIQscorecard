#!/usr/bin/env node
// The claim rules, applied to every word a visitor, a lead or a report reader can see: the landing pages, the quiz, the
// results page, the report, the playbook and the emails (content/*.mjs). The build runs it and stops on an error; so
// does npm test. Run it alone with
//   node tools/copy-lint.mjs            (errors and warnings)
//
// Errors: a banned claim (rules/copy-rules.json, from the GTM), an em or en dash, a statistic without its source in the
// same sentence, the Meta-style hero over its word budget. Warnings: a sentence or a headline over its budget.
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const NEGATION = /\b(no|not|never|don't|doesn't|won't|isn't|aren't|can't|cannot|without|nor|none)\b|n't\b/i;
// A statistic's source, in the same sentence: "(Name 2024)" or "(Name, Survey 2024)". The names come from
// rules/copy-rules.json sources (the GTM's approved sources); without a list, any capitalized name with a year counts.
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const sourcedRe = (rules) => (rules && Array.isArray(rules.sources) && rules.sources.length ? new RegExp(`\\((${rules.sources.map(escRe).join("|")})[^)]*\\d{4}\\)`) : /\([A-Z][^)]*\b(19|20)\d{2}\)/);
// Machine values, not words
const SKIP = new Set(["v", "id", "key", "slug", "layout", "type", "kind", "area", "name", "autocomplete", "inputmode", "prefix", "img", "icon",
  "picture", "color", "form", "deepenerForm", "callForm", "qualifiedFit", "ogImage", "hideIf", "when", "fit", "callOnly", "gtm", "tieOrder",
  "strongOrder", "systemSoftwareAnswers", "ruleFlag", "invisible.jobs", "invisible.asked", "invisible.ticket", "averageTicket", "words",
  "averageSource", "endpoints", "legal", "start", "end", "v", "masterUrl", "url", "n", "min", "max", "points", "weight", "team", "rule", "reason"]);

/** Every visitor-facing string, with a key path ("landing.faq.items.0.a"). Keys starting with _ are notes. */
export function collect(modules) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === "string") { out.push({ key, text: v }); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${key}.${i}`)); return; }
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k.startsWith("_") || SKIP.has(k)) continue;
        walk(x, key ? `${key}.${k}` : k);
      }
    }
  };
  for (const [name, mod] of Object.entries(modules)) {
    // The scorecard's questions are addressed by their id (scorecard.steps.G3...), so allow entries survive reordering
    if (name === "scorecard") {
      const sc = { ...mod, steps: Object.fromEntries(mod.steps.map((s) => [s.id, s])), deepener: Object.fromEntries(mod.deepener.map((d) => [d.id, d])) };
      walk(sc, name);
    } else walk(mod, name);
  }
  return out;
}

const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
const words = (t) => t.replace(/\{[^}]+\}/g, "x").split(/\s+/).filter(Boolean).length;

/** Lints the strings: { errors: [...], warnings: [...] } as "key: message: text". */
export function lint(strings, rules, opts = {}) {
  const errors = [], warnings = [];
  const B = rules.budgets || {};
  const allowed = (key, ruleId) => (rules.allow || []).some((a) => key.startsWith(a.key) && (!a.rule || a.rule === ruleId));
  const strictHero = new Set(opts.strictHero || []);
  for (const { key, text } of strings) {
    if (/[–—]/.test(text)) errors.push(`${key}: no em or en dashes: ${text}`);
    for (const r of rules.rules) {
      if ((rules.off || []).includes(r.id)) continue;
      const re = new RegExp(r.re, "i");
      for (const s of sentences(text)) {
        if (!re.test(s)) continue;
        if (allowed(key, r.id)) continue;
        if (r.refusalOk && NEGATION.test(s)) continue;
        errors.push(`${key}: ${r.msg} (${r.id}): ${s}`);
      }
    }
    for (const s of sentences(text)) {
      if (/\d+%/.test(s) && !sourcedRe(rules).test(s)) errors.push(`${key}: a statistic needs its source in the same sentence: ${s}`);
      if (B.sentenceWords && words(s) > B.sentenceWords) warnings.push(`${key}: ${words(s)} words in one sentence (budget ${B.sentenceWords}): ${s}`);
    }
    const heroKey = /^landing\.variants\.(\d+)\.hero\.(h1|lead|leadShort)$/.exec(key);
    if (heroKey) {
      const strict = strictHero.has(Number(heroKey[1]));
      const budget = heroKey[2] === "h1" ? B.h1Words : B.heroLeadWords;
      if (budget && words(text) > budget) (strict ? errors : warnings).push(`${key}: over ${budget} words: ${text}`);
    }
    if (/\.h2$/.test(key) && B.h2Words && words(text) > B.h2Words) warnings.push(`${key}: section headline over ${B.h2Words} words: ${text}`);
    if (/^landing\.faq\.items\.\d+\.a$/.test(key) && B.faqAnswerWords && words(text) > B.faqAnswerWords) warnings.push(`${key}: FAQ answer over ${B.faqAnswerWords} words: ${text}`);
  }
  return { errors, warnings };
}

/** Loads the content and lints it. */
export async function lintAll() {
  // A module's ALL export holds every wording (lib/delivery.mjs); its default, the one in force
  const load = async (f) => { const m = await import(pathToFileURL(path.join(ROOT, "content", f)).href); return m.ALL || m.default; };
  const modules = {
    scorecard: await load("scorecard.mjs"),
    landing: await load("landing.mjs"),
    results: await load("results.mjs"),
    report: await load("report.mjs"),
    playbook: await load("playbook.mjs"),
    emails: await load("emails.mjs"),
    method: await load("method.mjs"),
    site: { booking: (await load("site.mjs")).booking }
  };
  const rules = JSON.parse(readFileSync(path.join(ROOT, "rules/copy-rules.json"), "utf8"));
  // The Meta-style hero keeps the Meta page's word budgets as errors (Deliverable 2: "The H1 is 8 words (budget 10)")
  const strictHero = modules.landing.variants.map((v, i) => (v.layout === "hero-quiz" ? i : -1)).filter((i) => i >= 0);
  return lint(collect(modules), rules, { strictHero });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings } = await lintAll();
  warnings.forEach((w) => console.log(`warn  ${w}`));
  errors.forEach((e) => console.log(`ERROR ${e}`));
  console.log(`copy-lint: ${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}
