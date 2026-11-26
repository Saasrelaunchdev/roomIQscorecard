// The call step's rules (the Meta page's booking, lib/gapcheck.mjs there): the next few weekdays from tomorrow, never the
// same day, no weekends; three time windows in the visitor's own time; a US phone number. Pure functions over
// content/site.mjs's booking settings; inlined into the page's script by the build, imported by the server.
// Keep it to `export function` declarations with no imports.

/** "2026-11-10" for a date, in its own (local) calendar. */
export function isoDay(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The call days on offer: the next `days` weekdays, starting tomorrow. Labels like "Tue, Nov 10". */
export function bookingDays(booking, now) {
  const out = [];
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (out.length < booking.days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w === 0 || w === 6) continue;
    out.push({ v: isoDay(d), label: `${DOW[w]}, ${MON[d.getMonth()]} ${d.getDate()}` });
  }
  return out;
}

/** The label for a stored day ("2026-11-10" to "Tue, Nov 10"), or the value itself if it is not a date. */
export function dayLabel(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  if (!m) return String(v || "");
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

/** True when day is a weekday from tomorrow to `maxAhead` days out, as seen from `now` (the server allows a day either
 *  side for time zones: today counts, since it may already be tomorrow where the visitor is). */
export function dayAllowed(day, now, maxAhead) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isoDay(d) !== day) return false;
  const w = d.getDay();
  if (w === 0 || w === 6) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((d - today) / 86400000);
  return diff >= 0 && diff <= maxAhead;
}

/** The booking window with value v, or null. */
export function windowOf(booking, v) {
  return booking.windows.find((w) => w.v === v) || null;
}

/** US phone digits: 10 digits, or 11 starting with 1. Returns the 10 digits, or "" when it is not a US number. */
export function usPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return d.slice(1);
  return d.length === 10 ? d : "";
}

/** "(512) 555-0134" */
export function phoneLabel(d) {
  const p = usPhone(d);
  return p ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : String(d || "");
}

/** An .ics calendar file for the call: the window's start and end on that day, floating local time (the visitor's). */
export function icsFor({ day, window, title, body, uid, org = "Scorecard", host = "scorecard" }) {
  const d = String(day).replace(/-/g, "");
  const t = (h) => `${String(h).padStart(2, "0")}0000`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escIcs = (s) => String(s).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${String(org).replace(/[^\w .-]/g, "")}//Scorecard//EN`, "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${uid}@${String(host).replace(/[^\w.-]/g, "")}`, `DTSTAMP:${stamp}`, `DTSTART:${d}T${t(window.start)}`, `DTEND:${d}T${t(window.end)}`,
    `SUMMARY:${escIcs(title)}`, `DESCRIPTION:${escIcs(body)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
