// The ScoreApp brief (docs/scoreapp/) is written from content/*.mjs: it must not drift from the funnel it describes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("the ScoreApp brief matches the content (node tools/scoreapp-brief.mjs rewrites it)", () => {
  const r = spawnSync(process.execPath, ["tools/scoreapp-brief.mjs", "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
