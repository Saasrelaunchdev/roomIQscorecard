// The copy that depends on how the report reaches the owner (site.reportDelivery). A content module keeps both
// wordings: its own (the "checked" wording: the report after the team's check, within one business day) and an
// "instant" block naming each path it replaces when the PDF report is emailed right after the quiz. The module's
// default export is the copy in force; its ALL export holds both, so the claim rules check every wording.

/** The content with the delivery's wording applied. */
export function forDelivery(content, delivery) {
  const out = structuredClone(content);
  const swaps = out.instant || {};
  delete out.instant;
  if (delivery !== "instant") return out;
  for (const [path, value] of Object.entries(swaps)) {
    const keys = path.split(".");
    let o = out;
    for (const k of keys.slice(0, -1)) {
      if (!o || typeof o !== "object" || !(k in o)) throw new Error(`delivery: no ${path} to replace`);
      o = o[k];
    }
    if (!(keys[keys.length - 1] in o)) throw new Error(`delivery: no ${path} to replace`);
    o[keys[keys.length - 1]] = value;
  }
  return out;
}
