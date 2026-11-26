// Tells the team about each scorecard the moment it arrives (speed to lead): an email through Resend and a message in
// Slack, the same settings the landing page uses for its leads:
//   RESEND_API_KEY      a Resend API key
//   LEAD_NOTIFY_FROM    the sender, on a domain verified in Resend, for example: Leads <leads@brand.com>
//   LEAD_NOTIFY_TO      who receives it, comma separated (the admin's Settings can name others instead)
//   SLACK_WEBHOOK_URL   a Slack incoming webhook: https://hooks.slack.com/services/...
// Both optional and independent. The email can carry the lead's PDF report (Settings: "Attach the PDF"). A notice that
// fails is logged and never fails the request. Locally, SCORECARD_OUTBOX_DIR writes the notices to files.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EMAIL, esc } from "./http.mjs";
import { sendEmail } from "./emails.mjs";

const env = (n) => (process.env[n] ? String(process.env[n]).trim() : "");
const addresses = (v) => String(v || "").split(/[,;\s]+/).map((s) => s.trim()).filter((s) => EMAIL.test(s));

/** The team's channels. teamTo (the admin's Settings) replaces LEAD_NOTIFY_TO when it holds an address. */
export function notifyConfig(teamTo) {
  const own = addresses(teamTo);
  const to = own.length ? own : addresses(env("LEAD_NOTIFY_TO"));
  const key = env("RESEND_API_KEY"), from = env("LEAD_NOTIFY_FROM"), slack = env("SLACK_WEBHOOK_URL");
  const slackOk = /^https:\/\/hooks\.slack\.com\/(services|workflows|triggers)\//.test(slack);
  const outbox = env("SCORECARD_OUTBOX_DIR");
  return {
    email: key && from && to.length ? { key, from, to } : null,
    slack: slackOk ? slack : null,
    outbox: outbox || null,
    to,
    missing: {
      email: [!key && "RESEND_API_KEY", !from && "LEAD_NOTIFY_FROM", !to.length && "LEAD_NOTIFY_TO"].filter(Boolean),
      slack: slackOk ? [] : ["SLACK_WEBHOOK_URL"]
    }
  };
}

async function post(url, { headers, body, timeoutMs = 6000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    const t = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${t.slice(0, 300)}`);
    return t;
  } finally {
    clearTimeout(timer);
  }
}
const mrkdwn = (v) => String(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

/** Sends one notice: a title line, label/value rows, links and, by email only, attachments (the lead's PDF report).
 *  Resolves to { email, slack, id, to, error }: email and slack are true when sent; id is the email's (for the log). */
export async function notifyTeam({ title, rows = [], links = [], attachments = [], teamTo = "", tags = {} }) {
  const cfg = notifyConfig(teamTo);
  const out = { email: false, slack: false, id: null, to: cfg.to, error: null };
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== "");
  const files = attachments.filter((a) => a && a.filename && a.content);
  if (cfg.outbox) {
    mkdirSync(cfg.outbox, { recursive: true });
    const id = `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = files.map((a) => {
      mkdirSync(join(cfg.outbox, "attachments"), { recursive: true });
      const file = join(cfg.outbox, "attachments", `${id}-${a.filename}`);
      writeFileSync(file, a.content);
      return { filename: a.filename, bytes: a.content.length, file };
    });
    writeFileSync(join(cfg.outbox, `${id}.json`), JSON.stringify({ team: true, id, title, rows: shown, links, to: cfg.to, attachments: saved }, null, 1));
    out.email = true;
    out.id = id;
  }
  const jobs = [];
  if (cfg.email) {
    const html = `<p style="font:600 16px sans-serif">${esc(title)}</p><table style="font:14px/1.5 sans-serif;border-collapse:collapse">${shown.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#5F7699;vertical-align:top">${esc(k)}</td><td style="padding:3px 0">${esc(v)}</td></tr>`).join("")}</table>${links.map(([k, u]) => `<p style="font:14px sans-serif"><a href="${esc(u)}">${esc(k)}</a></p>`).join("")}`;
    const text = [title, "", ...shown.map(([k, v]) => `${k}: ${v}`), "", ...links.map(([k, u]) => `${k}: ${u}`)].join("\n");
    jobs.push(sendEmail({ mode: "resend", key: cfg.email.key, from: cfg.email.from, replyTo: null }, cfg.email.to, { subject: title.slice(0, 200), text, html }, { attachments: files, tags })
      .then((id) => { out.email = true; out.id = id; }, (e) => { out.error = e.message; console.error("team email:", e.message); }));
  }
  if (cfg.slack) {
    const text = [`*${mrkdwn(title)}*`, ...shown.map(([k, v]) => `*${mrkdwn(k)}:* ${mrkdwn(v)}`), ...links.map(([k, u]) => `<${u}|${mrkdwn(k)}>`)].join("\n");
    jobs.push(post(cfg.slack, { body: { text } }).then(() => { out.slack = true; }, (e) => console.error("slack:", e.message)));
  }
  await Promise.all(jobs);
  return out;
}
