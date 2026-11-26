// The prospect's emails: the score with the PDF report (right after the quiz), the sharper report (after the deepener),
// the call (right after booking), and the checked report (when the team approves it). Sent through Resend when these
// are set in Vercel:
//   RESEND_API_KEY          a Resend API key with sending access (re_...)
//   SCORECARD_EMAIL_FROM    the sender, on a domain verified in Resend, for example: Brand <team@brand.com>
//   SCORECARD_REPLY_TO      optional: where replies go (the sender by default). Replies are welcome: the score email
//                           asks for one
// Locally and in tests, SCORECARD_OUTBOX_DIR writes each email to a JSON file instead of sending it (attachments beside
// it, in attachments/). Every email sent is logged (api/_lib/messages.mjs), and Resend's webhook (api/resend-webhook.mjs)
// adds whether it was delivered, opened or clicked.
// Every email carries who sent it, the postal address (site.postalAddress, once set), a one-click unsubscribe link and
// the privacy policy (CAN-SPAM). An unsubscribed address gets nothing more.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import EMAILS from "../../content/emails.mjs";
import SITE from "../../content/site.mjs";
import BRAND from "../../content/brand.mjs";
import { esc } from "./http.mjs";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");

export function emailConfig() {
  const outbox = env("SCORECARD_OUTBOX_DIR");
  const key = env("RESEND_API_KEY"), from = env("SCORECARD_EMAIL_FROM");
  if (outbox) return { mode: "outbox", outbox, from: from || `${BRAND.name} <team@example.com>`, replyTo: env("SCORECARD_REPLY_TO") || null };
  if (key && from) return { mode: "resend", key, from, replyTo: env("SCORECARD_REPLY_TO") || null };
  return null;
}

const filled = (t, vars) => String(t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null && vars[k] !== "" ? String(vars[k]) : m));
const hasHoles = (t) => /\{\w+\}/.test(t);
const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)])/g;

/** One email from a template: subject, preheader, text and HTML. A line still holding a placeholder is left out. */
export function compose(tpl, vars, { buttonUrl, buttonLabel } = {}) {
  const K = BRAND.colors || {};
  const lines = tpl.lines.map((l) => filled(l, vars)).filter((l) => l.trim() && !hasHoles(l));
  const footer = [SITE.company, SITE.postalAddress, vars.unsubscribe_link ? filled(EMAILS.unsubscribe, vars) : null, vars.privacy_link ? filled(EMAILS.privacy, vars) : null].filter(Boolean);
  const subject = filled(tpl.subject, vars);
  const preheader = tpl.preheader ? filled(tpl.preheader, vars) : "";
  const text = [...lines, EMAILS.signoff, "", ...footer].join("\n\n").replace(/\n{3,}/g, "\n\n");
  const para = (l) => `<p style="margin:0 0 16px;font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${K.ink}">${esc(l).replace(URL_RE, (u) => `<a href="${u}" style="color:${K.link};word-break:break-all">${u}</a>`)}</p>`;
  const button = buttonUrl && !hasHoles(buttonUrl)
    ? `<p style="margin:8px 0 22px"><a href="${esc(buttonUrl)}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:${K.accent};color:${K.onAccent};font:600 16px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;text-decoration:none">${esc(buttonLabel || "Open")}</a></p>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${K.canvas}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<div style="max-width:560px;margin:0 auto;padding:28px 22px">
<p style="margin:0 0 22px;font:700 20px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${K.ink}"><span style="display:inline-block;width:22px;height:22px;border-radius:7px;background:${K.accent};vertical-align:-4px;margin-right:8px"></span>${esc(BRAND.name)}</p>
<div style="padding:26px 24px;border-radius:16px;background:#FFFFFF;border:1px solid ${K.line}">
${lines.slice(0, 1).map(para).join("")}${button}${lines.slice(1).map(para).join("")}${para(EMAILS.signoff)}
</div>
${footer.map((f) => `<p style="margin:14px 4px 0;font:13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${K.muted}">${esc(f).replace(URL_RE, (u) => `<a href="${u}" style="color:${K.muted};word-break:break-all">${u}</a>`)}</p>`).join("")}
</div></body></html>`;
  return { subject, preheader, text, html };
}

/** Sends one email; resolves to the provider's id (Resend's, or the outbox file's), throws on failure (never with the
 *  key in it). attachments: [{ filename, content: Buffer }] (the PDF report); tags: { kind, assessment } for Resend's
 *  webhooks (letters, numbers, _ and - only). */
export async function sendEmail(cfg, to, msg, { idempotencyKey, unsubscribeUrl, attachments = [], tags = {} } = {}) {
  const files = attachments.filter((a) => a && a.filename && a.content);
  const tagList = Object.entries(tags).filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([name, value]) => ({ name, value: String(value).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256) }));
  const recipients = Array.isArray(to) ? to : [to];
  if (cfg.mode === "outbox") {
    mkdirSync(cfg.outbox, { recursive: true });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved = files.map((a) => {
      mkdirSync(join(cfg.outbox, "attachments"), { recursive: true });
      const file = join(cfg.outbox, "attachments", `${id}-${a.filename}`);
      writeFileSync(file, a.content);
      return { filename: a.filename, bytes: a.content.length, file };
    });
    writeFileSync(join(cfg.outbox, `${id}.json`), JSON.stringify({ id, to: recipients.length === 1 ? recipients[0] : recipients, from: cfg.from, replyTo: cfg.replyTo, ...msg, idempotencyKey, unsubscribeUrl, attachments: saved, tags: tagList }, null, 1));
    return id;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), files.length ? 20000 : 8000);
  try {
    const body = { from: cfg.from, to: recipients, subject: msg.subject, text: msg.text, html: msg.html };
    if (cfg.replyTo) body.reply_to = cfg.replyTo;
    if (unsubscribeUrl) body.headers = { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
    if (files.length) body.attachments = files.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") }));
    if (tagList.length) body.tags = tagList;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.key}`, "content-type": "application/json", ...(idempotencyKey ? { "idempotency-key": idempotencyKey.slice(0, 256) } : {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`Resend HTTP ${r.status}: ${t.slice(0, 300)}`);
    try { return JSON.parse(t).id || "sent"; } catch { return "sent"; }
  } finally {
    clearTimeout(timer);
  }
}
