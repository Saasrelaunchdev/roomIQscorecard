// Question 2 is typed (the owner's decision of 2026-11-26): the words are matched to the seven preset metros by name,
// a state that doesn't match rules a metro out, and an address keeps only its city. The answer stays one of the
// question's options, so scoring, the lease-up gap, the checks and the report read it as before.
import { test } from "node:test";
import assert from "node:assert/strict";
import SC from "../../content/scorecard.mjs";
import { cleanPlace, placeOf, cleanHero, evaluate } from "../../lib/scoring.mjs";

const G2 = SC.steps.find((s) => s.key === "market");
const BASE = { stage: "looking", rentsource: "listings", fillsource: "vacancy", supply: "counted", bathmix: "notyet", slowplan: "weeks", carry: "2to3k", fillmonths: "m3", reserves: "m1" };

test("typed places name the preset metro they belong to, and nothing else", () => {
  const cases = [
    ["Dallas", "dfw"], ["Fort Worth, TX", "dfw"], ["Plano", "dfw"], ["Arlington, TX", "dfw"], ["Arlington VA", "other"], ["Dallas, GA", "other"],
    ["Houston", "houston"], ["Katy TX", "houston"], ["Atlanta Georgia", "atlanta"], ["Marietta", "atlanta"],
    ["Orlando, Florida", "orlando"], ["Kissimmee", "orlando"], ["Jacksonville", "jacksonville"], ["Jacksonville, NC", "other"],
    ["Scottsdale", "phoenix"], ["Glendale AZ", "phoenix"], ["Glendale", "other"], ["Phoenix, OR", "other"],
    ["Las Vegas NV", "lasvegas"], ["vegas", "lasvegas"], ["Henderson, NV", "lasvegas"], ["Henderson", "other"],
    ["Austin", "other"], ["Texas", "other"], ["Dallas-Fort Worth", "dfw"]
  ];
  for (const [text, key] of cases) assert.equal(placeOf(G2, cleanPlace(text)), key, text);
});

test("an address keeps only its city: no house number, street, unit or ZIP", () => {
  assert.equal(cleanPlace("123 Main St, Atlanta, GA 30303"), "Atlanta, GA");
  assert.equal(cleanPlace("45 Oak Ave, Boise ID 83702"), "Boise ID");
  assert.equal(cleanPlace("phoenix 85016"), "phoenix");
  assert.equal(cleanPlace("  Las   Vegas ,  NV "), "Las Vegas, NV");
  assert.equal(cleanPlace("x".repeat(80)).length, 60);
});

test("the typed words decide the answer; without words, the chip's answer or an option's key stands", () => {
  // Words win over any key sent with them
  let r = cleanHero(SC, { ...BASE, market: "undecided", marketText: "Scottsdale, AZ" });
  assert.deepEqual([r.answers.market, r.answers.marketText, r.missing.length], ["phoenix", "Scottsdale, AZ", 0]);
  r = cleanHero(SC, { ...BASE, market: "atlanta", marketText: "Boise" });
  assert.equal(r.answers.market, "other");
  // The chip
  r = cleanHero(SC, { ...BASE, market: "undecided", marketText: "" });
  assert.deepEqual([r.answers.market, r.answers.marketText], ["undecided", undefined]);
  // Older pages and the tests send the key
  assert.equal(cleanHero(SC, { ...BASE, market: "houston" }).answers.market, "houston");
  // Nothing typed, nothing picked: unanswered
  assert.deepEqual(cleanHero(SC, { ...BASE, marketText: "  " }).missing, ["market"]);
  assert.deepEqual(cleanHero(SC, { ...BASE, marketText: "7" }).missing, ["market"]);
});

test("a typed market scores and routes exactly like the preset it names", () => {
  const typed = evaluate(SC, { ...BASE, marketText: "Atlanta, GA" });
  const tapped = evaluate(SC, { ...BASE, market: "atlanta" });
  assert.deepEqual([typed.score, typed.fit, typed.covered, typed.tier], [tapped.score, tapped.fit, tapped.covered, tapped.tier]);
  const outside = evaluate(SC, { ...BASE, marketText: "Boise" });
  assert.deepEqual([outside.fit, outside.covered], ["outside", false]);
});
