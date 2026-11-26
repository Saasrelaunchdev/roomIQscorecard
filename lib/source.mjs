// Where a visit came from, in one plain word for the admin's analytics: the campaign's utm_source when the link had
// one, "facebook" for a Meta ad click (fbclid), the referring site's name otherwise, or "direct". Shared by the page
// (its analytics events) and the server (each lead), so both say the same thing. tools/build.mjs bundles it.

/** A referrer's site, without the mobile and link-shim prefixes (m., l., lm., www.): "l.facebook.com" is "facebook.com". */
export function refHost(ref) {
  try {
    const h = new URL(String(ref || "")).hostname.toLowerCase();
    return h.replace(/^(www|m|l|lm|mobile|out)\./, "");
  } catch (e) { return ""; }
}

/** The source of a visit: { utm_source, fbclid, referrer } as the page keeps them. */
export function sourceFrom(t) {
  const s = t && typeof t === "object" ? t : {};
  const utm = String(s.utm_source || "").trim().toLowerCase().replace(/[^a-z0-9_.+-]/g, "").slice(0, 40);
  if (utm) return utm === "fb" || utm === "ig" ? (utm === "fb" ? "facebook" : "instagram") : utm;
  if (s.fbclid) return "facebook";
  const host = refHost(s.referrer);
  if (!host) return "direct";
  if (/(^|\.)facebook\.com$/.test(host)) return "facebook";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  return host.slice(0, 40);
}
