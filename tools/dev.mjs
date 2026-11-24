#!/usr/bin/env node
// The site and its API on one local server, with vercel.json's rewrites and headers, so what runs here is what Vercel
// runs. Data stays on disk: scorecards in .local/store, emails and team notices in .local/outbox (each one a JSON file).
//   node tools/dev.mjs                 http://localhost:8787  (admin password: ADMIN_PASSWORD, or "local-admin-password")
//   PORT=9000 node tools/dev.mjs
// Build first (node tools/build.mjs) after changing content, styles or the script. Tests start it with startServer().
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, "public");
const VERCEL = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon" };

/** A vercel.json source ("/report/:token/pdf", "/(results|sharpen)/(.*)") as a RegExp with named groups. */
export function toRegex(source) {
  const parts = [];
  const keep = (p) => `\u0000${parts.push(p) - 1}\u0000`;
  const s = source.replace(/\(\.\*\)/g, () => keep("(.*)")).replace(/:(\w+)/g, (m, name) => keep(`(?<${name}>[^/]+)`));
  // Groups like (results|sharpen) stay groups; every other special character is literal
  const escaped = s.replace(/[.+?^${}[\]\\*]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\u0000(\d+)\u0000/g, (m, k) => parts[Number(k)])}$`);
}
const REWRITES = VERCEL.rewrites.map((rw) => ({ re: toRegex(rw.source), dest: rw.destination }));
const HEADERS = VERCEL.headers.map((h) => ({ re: toRegex(h.source), headers: h.headers }));

/** A Web handler (export async function POST(request)), as Vercel runs it: the Node request in, the Response out. */
function webHandler(mod) {
  return async (req, res) => {
    const fn = mod[req.method];
    if (typeof fn !== "function") { res.statusCode = 405; return res.end(); }
    const chunks = [];
    if (!["GET", "HEAD"].includes(req.method)) for await (const c of req) chunks.push(c);
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v)]));
    const request = new Request(`http://${req.headers.host || "localhost"}${req.url}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    const response = await fn(request);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  };
}

export async function startServer({ port = Number(process.env.PORT) || 8787, quiet = false } = {}) {
  const handlers = {};
  for (const name of ["scorecard", "track", "report", "admin", "cron", "resend-webhook"]) {
    const mod = await import(pathToFileURL(path.join(ROOT, "api", `${name}.mjs`)).href);
    handlers[name] = mod.default || webHandler(mod);
  }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    let search = url.search;
    for (const h of HEADERS) if (h.re.test(pathname)) for (const { key, value } of h.headers) res.setHeader(key, value);
    for (const rw of REWRITES) {
      const m = rw.re.exec(pathname);
      if (!m) continue;
      const dest = rw.dest.replace(/:(\w+)/g, (x, k) => encodeURIComponent((m.groups && m.groups[k]) || ""));
      const du = new URL(dest, "http://localhost");
      pathname = du.pathname;
      // Vercel keeps the request's own query parameters on a rewrite, after the destination's
      const merged = new URLSearchParams(du.search);
      for (const [k, v] of new URLSearchParams(search)) if (!merged.has(k)) merged.append(k, v);
      search = merged.toString() ? `?${merged}` : "";
      break;
    }
    try {
      const api = /^\/api\/([\w-]+)$/.exec(pathname);
      if (api && handlers[api[1]]) {
        req.url = `${pathname}${search}`;
        return await handlers[api[1]](req, res);
      }
      let file = path.join(PUBLIC, pathname);
      if (!file.startsWith(PUBLIC)) { res.statusCode = 400; return res.end("bad path"); }
      if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!existsSync(file)) { res.statusCode = 404; res.setHeader("content-type", TYPES[".html"]); return res.end(readFileSync(path.join(PUBLIC, "404.html"))); }
      res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
      res.end(readFileSync(file));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) { res.statusCode = 500; res.end("server error"); }
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const addr = `http://localhost:${server.address().port}`;
  if (!quiet) console.log(`Scorecard on ${addr}  (admin: ${addr}/admin)`);
  return { server, url: addr, close: () => new Promise((r) => server.close(r)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.env.SCORECARD_STORE_DIR ||= path.join(ROOT, ".local", "store");
  process.env.SCORECARD_OUTBOX_DIR ||= path.join(ROOT, ".local", "outbox");
  process.env.ADMIN_PASSWORD ||= "local-admin-password";
  await startServer();
}
