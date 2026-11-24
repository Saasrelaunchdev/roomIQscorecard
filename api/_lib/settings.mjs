// The admin's settings (the Settings tab), kept in the store (scorecard_settings) so the team changes them without a
// deploy: the report's letter and who signs it, which sections every report carries, and how the team hears about
// leads. Until the team saves, the defaults below hold. A lead can override the sections and add a note of its own
// (row.report.options, from the lead's page in the admin). Words the team types go through the same claim rules as
// the rest of the copy (tools/copy-lint.mjs), so a letter can't promise what the site never would.
import RULES from "../../rules/copy-rules.json" with { type: "json" };
import { lint, collect } from "../../tools/copy-lint.mjs";
import { str, EMAIL, HttpError } from "./http.mjs";

export const SECTIONS = ["letter", "method", "service", "playbook"];
export const DEFAULTS = {
  report: {
    letter: "",
    signerName: "",
    signerTitle: "",
    sections: { letter: true, method: true, service: true, playbook: true }
  },
  notifications: {
    teamTo: "",
    attachPdf: true,
    deepener: true,
    booking: true
  }
};

const bool = (v, d) => (typeof v === "boolean" ? v : d);
const sectionsOf = (s, d) => Object.fromEntries(SECTIONS.map((k) => [k, bool(s && s[k], d[k])]));

/** The settings in force: the saved ones over the defaults. */
export function settingsOf(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  const r = s.report && typeof s.report === "object" ? s.report : {};
  const n = s.notifications && typeof s.notifications === "object" ? s.notifications : {};
  return {
    report: {
      letter: typeof r.letter === "string" ? r.letter : DEFAULTS.report.letter,
      signerName: typeof r.signerName === "string" ? r.signerName : "",
      signerTitle: typeof r.signerTitle === "string" ? r.signerTitle : "",
      sections: sectionsOf(r.sections, DEFAULTS.report.sections)
    },
    notifications: {
      teamTo: typeof n.teamTo === "string" ? n.teamTo : "",
      attachPdf: bool(n.attachPdf, DEFAULTS.notifications.attachPdf),
      deepener: bool(n.deepener, DEFAULTS.notifications.deepener),
      booking: bool(n.booking, DEFAULTS.notifications.booking)
    }
  };
}

/** The settings from the store, never failing: a store that can't answer means the defaults. */
export async function loadSettings(store) {
  try { return settingsOf(await store.getSettings()); } catch (e) { console.error("settings:", e && e.message); return settingsOf(null); }
}

/** Refuses words that break the claim rules, naming the rule and the sentence. */
export function checkWords(fields) {
  const { errors } = lint(collect({ admin: fields }), RULES);
  if (errors.length) throw new HttpError(400, `This can't go in a report: ${errors[0].replace(/^admin\.[\w.]+: /, "")}`);
}

/** One settings key as the admin sends it, checked and trimmed: { key, value }. */
export function cleanSettings(key, v) {
  v = v && typeof v === "object" ? v : {};
  if (key === "report") {
    const value = {
      letter: str(v.letter, 1500),
      signerName: str(v.signerName, 60),
      signerTitle: str(v.signerTitle, 60),
      sections: sectionsOf(v.sections, DEFAULTS.report.sections)
    };
    checkWords({ letter: value.letter, signerName: value.signerName, signerTitle: value.signerTitle });
    return value;
  }
  if (key === "notifications") {
    const to = str(v.teamTo, 600).split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
    const bad = to.find((x) => !EMAIL.test(x));
    if (bad) throw new HttpError(400, `"${bad}" is not an email address.`);
    return { teamTo: to.join(", "), attachPdf: bool(v.attachPdf, true), deepener: bool(v.deepener, true), booking: bool(v.booking, true) };
  }
  throw new HttpError(400, "Unknown settings.");
}

/** A lead's own report options (the lead's page in the admin): a note and the sections, each "default", on or off. */
export function cleanOptions(v) {
  v = v && typeof v === "object" ? v : {};
  const note = str(v.note, 1200);
  checkWords({ note });
  const sections = {};
  for (const k of SECTIONS) if (typeof (v.sections || {})[k] === "boolean") sections[k] = v.sections[k];
  return { note, sections };
}

/** The sections one report carries: the lead's choices over the team's settings. */
export function sectionsFor(settings, options) {
  const base = (settings && settings.report && settings.report.sections) || DEFAULTS.report.sections;
  const own = (options && options.sections) || {};
  return Object.fromEntries(SECTIONS.map((k) => [k, typeof own[k] === "boolean" ? own[k] : base[k] !== false]));
}
