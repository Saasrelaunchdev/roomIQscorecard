// Work that runs after the response: the visitor sees their score at once while the server prints the PDF, emails it,
// tells the team and the integrations. On Vercel it goes to waitUntil (@vercel/functions), which keeps the function
// alive until the work settles, up to the function's maxDuration (vercel.json). Where there is no request context
// (a Vercel runtime without one), the caller awaits the work before answering, so nothing is ever cut off. Locally and
// in tests the server is a long-running process, so the work simply continues; settled() waits for all of it.
import { waitUntil } from "@vercel/functions";

const pending = new Set();
const onVercel = () => Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/** Starts fn() in the background. Resolves nothing; returns { done, mustAwait }: await done when mustAwait is true. */
export function later(label, fn) {
  const done = Promise.resolve()
    .then(fn)
    .catch((e) => { console.error(`${label}:`, e && e.message); })
    .finally(() => pending.delete(done));
  pending.add(done);
  const ctx = globalThis[Symbol.for("@vercel/request-context")]?.get?.();
  if (ctx && typeof ctx.waitUntil === "function") {
    waitUntil(done);
    return { done, mustAwait: false };
  }
  return { done, mustAwait: onVercel() };
}

/** Waits until every background job has finished (tests, and the dev server's shutdown). */
export async function settled() {
  while (pending.size) await Promise.allSettled([...pending]);
}
