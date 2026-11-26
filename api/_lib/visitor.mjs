// What the scorecard learns about a visitor beyond the answers, for the admin's analytics, within what the privacy
// policy states ("browser and device type, time zone", "the general area your IP address suggests. We don't collect
// precise geolocation"):
//   geoOf()      country, state (region) and city from Vercel's IP headers. Never coordinates, never a postal code.
//   deviceOf()   phone, tablet or computer; system; browser; the in-app browser (Facebook, Instagram...); the screen.
//   timingOf()   how long each question took, the whole quiz, and the time on the page before it, as the page measured
//                (only while the page was on screen), with how often the visitor went Back or left the page mid-quiz.
import { header } from "./http.mjs";

const dec = (v) => { try { return decodeURIComponent(v); } catch { return v; } };

/** Approximate location from Vercel's headers (x-vercel-ip-*), or null off Vercel. */
export function geoOf(req) {
  const country = header(req, "x-vercel-ip-country").toUpperCase();
  const region = header(req, "x-vercel-ip-country-region").toUpperCase();
  const city = dec(header(req, "x-vercel-ip-city")).replace(/[^\p{L}\p{M} .'-]/gu, "").slice(0, 60);
  const tz = header(req, "x-vercel-ip-timezone");
  const out = {
    country: /^[A-Z]{2}$/.test(country) ? country : "",
    region: /^[A-Z0-9]{1,3}$/.test(region) ? region : "",
    city,
    tz: /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz) ? tz : ""
  };
  return out.country || out.region || out.city ? out : null;
}

/** The in-app browser a user agent names, or "" (Meta's apps say FBAN/FBAV/FB_IAB; Instagram says Instagram). */
export function inAppOf(ua) {
  const s = String(ua || "");
  if (/Instagram/i.test(s)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|\bFBMD\b/i.test(s)) return "facebook";
  if (/LinkedInApp/i.test(s)) return "linkedin";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(s)) return "tiktok";
  if (/Snapchat/i.test(s)) return "snapchat";
  if (/\bGSA\//.test(s)) return "google-app";
  return "";
}

/** Device facts from the user agent, plus what the page measured (client: { vw, vh, sw, sh, dpr, lang, touch }). */
export function deviceOf(ua, client) {
  const s = String(ua || "");
  const inApp = inAppOf(s);
  const os = /iPhone|iPad|iPod/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Windows NT/.test(s) ? "Windows" : /CrOS/.test(s) ? "ChromeOS"
    : /Mac OS X|Macintosh/.test(s) ? "macOS" : /Linux/.test(s) ? "Linux" : "Other";
  const browser = inApp ? "In-app" : /Edg\//.test(s) ? "Edge" : /SamsungBrowser/.test(s) ? "Samsung Internet" : /OPR\/|Opera/.test(s) ? "Opera"
    : /Firefox|FxiOS/.test(s) ? "Firefox" : /Chrome|CriOS/.test(s) ? "Chrome" : /Safari/.test(s) ? "Safari" : "Other";
  const c = client && typeof client === "object" ? client : {};
  const int = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : null; };
  const touch = int(c.touch, 20);
  let type = /iPad|Tablet/.test(s) || (/Android/.test(s) && !/Mobile/.test(s)) ? "tablet" : /Mobi|iPhone|iPod|Android/.test(s) ? "mobile" : "desktop";
  // iPadOS reports itself as a Mac: a Mac with a touch screen is an iPad
  if (type === "desktop" && os === "macOS" && touch > 1) type = "tablet";
  const out = { type, os, browser, inApp: inApp || null };
  const vw = int(c.vw, 10000), vh = int(c.vh, 10000), sw = int(c.sw, 10000), sh = int(c.sh, 10000);
  if (vw && vh) out.viewport = `${vw}x${vh}`;
  if (sw && sh) out.screen = `${sw}x${sh}`;
  const dpr = Number(c.dpr);
  if (Number.isFinite(dpr) && dpr > 0 && dpr <= 8) out.dpr = Math.round(dpr * 100) / 100;
  if (typeof c.lang === "string" && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/.test(c.lang)) out.lang = c.lang;
  if (touch !== null) out.touch = touch;
  return out;
}

/** The page's own timing, checked: whole milliseconds, known steps only, capped at sensible maximums. */
export function timingOf(raw, stepIds) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const int = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n), max) : null; };
  const steps = {};
  const rs = raw.steps && typeof raw.steps === "object" ? raw.steps : {};
  for (const id of stepIds) { const v = int(rs[id], 3600e3); if (v !== null) steps[id] = v; }
  const out = { totalMs: int(raw.totalMs, 4 * 3600e3), landingMs: int(raw.landingMs, 24 * 3600e3), backs: int(raw.backs, 500), aways: int(raw.aways, 500), steps };
  for (const k of ["totalMs", "landingMs", "backs", "aways"]) if (out[k] === null) delete out[k];
  return Object.keys(steps).length || out.totalMs !== undefined ? out : null;
}

/** The source the page sends with its analytics (lib/source.mjs sourceFrom): short and plain, or "". */
export const sourceOf = (v) => (typeof v === "string" && /^[A-Za-z0-9_.+-]{1,40}$/.test(v.trim()) ? v.trim().toLowerCase() : "");

/** Where a lead came from, from what the submission stored (lib/source.mjs, the same rule the page uses). */
export { sourceFrom } from "../../lib/source.mjs";
