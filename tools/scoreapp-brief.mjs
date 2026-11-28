#!/usr/bin/env node
// Writes docs/scoreapp/first-deal-risk-scoreapp-brief.md: the brief that rebuilds this funnel in ScoreApp, as prompts for
// ScoreApp's AI builders and steps to do by hand, with every word taken from content/*.mjs so ScoreApp shows what this
// funnel shows. Where ScoreApp cannot do what the funnel does (arithmetic on answers, the deepener, the walkthrough form),
// the brief says what it does instead (section 1). Run it again after any content change:
//   node tools/scoreapp-brief.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SC from "../content/scorecard.mjs";
import LANDING from "../content/landing.mjs";
import RESULTS from "../content/results.mjs";
import REPORT from "../content/report.mjs";
import METHOD from "../content/method.mjs";
import PLAYBOOK from "../content/playbook.mjs";
import CHECKS from "../content/checks.mjs";
import EMAILS from "../content/emails.mjs";
import SITE from "../content/site.mjs";
import BRAND from "../content/brand.mjs";
import { evaluate, invisibleOf, gapVars, fill } from "../lib/scoring.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "docs/scoreapp/first-deal-risk-scoreapp-brief.md");
const DATE = "2026-11-26";

/* ---------------------------------------------------------------- helpers */
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s*\n+\s*/g, " ");
const table = (head, rows) => `| ${head.join(" | ")} |\n|${head.map(() => "---").join("|")}|\n${rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n")}\n`;
const kv = (rows) => table(["Field", "Exact text"], rows);
const bullets = (xs) => xs.map((x) => `- ${x}`).join("\n");
const areas = SC.areas;
const areaName = (k) => areas.find((a) => a.key === k).name;
const step = (id) => SC.steps.find((s) => s.id === id);
const MERGE_LOWEST = "[[MERGE: Lowest category name]]";

// The build's placeholders, as ScoreApp writes them. {first_name} is ScoreApp's own merge field; the lowest category's
// name comes from the merge-field menu. Any other placeholder must be handled where the text is used.
function sa(text) {
  const out = String(text).replace(/\{first_name\}/g, "{first_name}").replace(/\{firstName\}/g, "{first_name}").replace(/\{primary_bottleneck\}/g, MERGE_LOWEST);
  const left = out.match(/\{(?!first_name\})[a-z_]+\}/gi);
  if (left) throw new Error(`scoreapp-brief: unhandled placeholder ${left.join(", ")} in: ${text}`);
  return out;
}
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`);

// ScoreApp has one set of score tiers for the overall score and every category: the GTM's three, which match the
// funnel's area bands (low, medium, high) range for range.
const TIERS = SC.tiers.map((t, i) => ({ ...t, label: t.name.split(":")[0], band: ["low", "medium", "high"][i] }));
const BAND = Object.fromEntries(TIERS.map((t) => [t.band, t]));

const HERO_STEPS = SC.steps.filter((s) => s.kind !== "fields");
const SCORED = HERO_STEPS.filter((s) => s.kind === "scored");
const CONTACT = SC.steps.find((s) => s.kind === "fields");
const N = (s) => HERO_STEPS.indexOf(s) + 1; // the question's position in ScoreApp
const COVERED = SC.markets.covered;
const G2 = step("G2"), G3 = step("G3"), G4 = step("G4"), G5 = step("G5");
const label = (q, v) => q.options.find((o) => o.v === v).label;
const coveredLabels = COVERED.map((v) => label(G2, v));
const outsideLabels = G2.options.filter((o) => !COVERED.includes(o.v)).map((o) => o.label);
const FORECAST = (campaign) => `${SITE.forecastUrl}?src=scorecard&utm_source=scorecard&utm_medium=${campaign}&utm_campaign=${SC.id}`;

const RULES = `<copy_rules>
- American English. Short sentences, 28 words or fewer. No em dashes or en dashes anywhere: use commas, colons or "to".
- Never claim accuracy, precision or a prediction ("accurate", "predicts", "lender-ready", "investor-grade").
- Never promise or imply income, returns, yield, cash flow, occupancy or a fill time. No return, yield or cash-on-cash figures.
- Never name a platform, data source, competitor or partner. Use categories ("a platform's calculator", "room listings").
- RoomIQ's numbers are observed listing data: "observed rents and occupancy, not collected payments".
- Zoning, financing and insurance sit outside RoomIQ. Never say RoomIQ checks them. "Not legal, lending or financial advice."
- No prices, trials, discounts or plan terms, except the published line "Free plan: no card needed, three forecasts a month."
- No testimonials, reviews, ratings, customer logos, customer counts, statistics or "trusted by" lines. No countdown timers.
- Every house, number and picture in an example is made up and says so.
- Banned words: leverage, unlock, seamless, robust, streamline, cutting-edge, empower, guarantee, risk-free, safe investment.
- Tone: direct and plain, never shaming. A low score means a number is borrowed, and borrowed numbers can be checked.
</copy_rules>`;

/* ---------------------------------------------------------------- the lease-up gap, exactly as the funnel computes it */
const I = RESULTS.invisible;
const MATH = { gap: "gapMath", exact: "exactMath", covered: "coveredMath", costOnly: "costOnlyMath", perMonth: "perMonthMath" };
function leaseUp(answers) {
  const iw = invisibleOf(SC, answers);
  const vars = gapVars(iw);
  const lines = [fill(I[iw.kind], vars)];
  if (MATH[iw.kind]) lines.push(fill(I[MATH[iw.kind]], vars));
  if (typeof iw.fill === "number") lines.push(I.notForecast);
  return { kind: iw.kind, lines };
}
const KIND_NAME = { gap: "GAP", exact: "EXACT", covered: "COVERED", costOnly: "COST_ONLY", perMonth: "PER_MONTH", monthsShort: "MONTHS_SHORT", monthsCovered: "MONTHS_COVERED", none: "NONE" };
// The templates with the Smart Section's own variable names
const SMART_VARS = { cost: "{COST}", fill_months: "{FILL}", reserve_months: "{RESERVES}", uncovered_months: "{UNCOVERED}", spare_months: "{SPARE}", exposure: "{EXPOSURE}", gap: "{GAP}" };
const smart = (t) => fill(t, SMART_VARS);

/* ---------------------------------------------------------------- test personas, scored by the funnel's own code */
const PERSONAS = [
  { name: "Jordan (spec 1's worked example)", answers: { stage: "looking", market: "atlanta", rentsource: "listings", fillsource: "vacancy", supply: "counted", bathmix: "notyet", slowplan: "weeks", carry: "2to3k", fillmonths: "m3", reserves: "m1" } },
  { name: "Riley, under contract, partly checked", answers: { stage: "contract", market: "phoenix", rentsource: "listings", fillsource: "stories", supply: "counted", bathmix: "keep", slowplan: "weeks", carry: "unsure", fillmonths: "m2", reserves: "m3" } },
  { name: "Sam, an operator with evidence", answers: { stage: "operator", market: "houston", rentsource: "comps", fillsource: "observed", supply: "known", bathmix: "modeled", slowplan: "sized", carry: "3to4k", fillmonths: "m2", reserves: "m6" } },
  { name: "Casey, learning, market not chosen", answers: { stage: "learning", market: "undecided", rentsource: "none", fillsource: "none", supply: "none", bathmix: "notyet", slowplan: "none", carry: "unsure", fillmonths: "unsure", reserves: "unsure" } }
];
function scoreAppView(p) {
  const ev = evaluate(SC, p.answers, null, {});
  const scores = Object.fromEntries(areas.map((a) => [a.key, ev.areas[a.key].score]));
  const min = Math.min(...Object.values(scores));
  const lowest = areas.find((a) => scores[a.key] === min).key; // ScoreApp: ties go to the category higher in the list
  const tier = TIERS.find((t) => ev.score >= t.min && ev.score <= t.max);
  const lowTier = TIERS.find((t) => min >= t.min && min <= t.max);
  return { ev, scores, lowest, tier, lowTier, lease: leaseUp(p.answers), covered: COVERED.includes(p.answers.market) };
}

/* ================================================================= the document */
const out = [];
const H = (s) => out.push(s);

H(`# The First Deal Risk Scorecard on ScoreApp: build brief and AI builder prompts

RoomIQ's First Deal Risk Scorecard is already built and tested as its own funnel (\`Saasrelaunchdev/roomIQscorecard\`).
This file rebuilds it in ScoreApp: prompts for ScoreApp's AI builders, the steps to do by hand, and every word. The words
come from the funnel's content files (\`content/*.mjs\`), written into this file by \`tools/scoreapp-brief.mjs\` on
${DATE}, so ScoreApp shows what the funnel shows. Section 1 lists the few places ScoreApp needed a different route.

## How to use this file

1. **Plan.** Use ScoreApp's **Business** plan. It is the lowest plan with the PDF report, Audiences, Smart Sections, the
   Meta pixel with the Conversions API, an embedded booking calendar, a custom domain and a custom sender. Pro adds only
   split testing between the two landing pages.
2. **Work in stage order** (the table below). Each stage has a **Prompt** to paste into the named ScoreApp AI chat, or
   **By hand** steps, or both.
3. **Paste one prompt per message.** Copy everything inside the grey block, nothing outside it. ScoreApp's AI builders
   expect one brief per step, and every message spends AI credits in proportion to its length, so never paste this whole
   file into a chat.
4. **Text is final.** Words in tables and quotes are the funnel's own, already checked against RoomIQ's claim rules.
   Paste them as they are. The AI is told the same.
5. **Fill the gaps marked \`[[TBD: ...]]\`** before going live: the booking link, the domain, the sender, the team's
   address, the postal address for commercial email and the Meta pixel id. Nothing else is left open.

| Notation | Meaning |
|---|---|
| \`{first_name}\` | ScoreApp's first-name merge field. Insert it with the merge-field icon if typing it does not convert |
| \`[[MERGE: ...]]\` | Insert that merge field from the editor's merge-field icon, for example \`${MERGE_LOWEST}\` (ScoreApp lists "Lowest Category Name"). If the editor does not offer it, write "your lowest area", or leave the line out where the brief says so |
| \`{result_key}\` | Typed exactly as shown in a link: ScoreApp swaps in each respondent's own result |
| \`[[TBD: ...]]\` | A value only you have. The brief says where it goes |

| Stage | What | Where in ScoreApp | How |
|---|---|---|---|
| 1 | The scorecard: questions, categories, points, tiers | Create Scorecard, Use the AI Builder | Prompt 1A, then checks and Prompt 1B |
| 2 | Two landing pages | Landing Pages (AI chat on the page) | Prompts 2A and 2B, then by hand |
| 3 | Lead form and consent | Settings, Lead Form | By hand |
| 4 | Results page | Audiences; Result Pages, AI results page | By hand (audiences), Prompts 4A and 4B |
| 5 | PDF report | PDF Reports | By hand, page by page |
| 6 | Emails | Settings, Result Email and Notifications; Integrate, Webhooks | By hand |
| 7 | Tracking, domain, sender | Settings, Tracking; Account, Domains | By hand |
| 8 | Test, then go live | Draft mode | Four test personas with expected results |
`);

/* ---------------------------------------------------------------- 1. mapping */
H(`## 1. What carries over, what changes, and why

ScoreApp scores every answer as points, shows scores by tier, and personalises sections by tier, by the highest or lowest
category, or by an Audience built from answers. It does no arithmetic on answers ("ScoreApp does not currently handle
advanced formula logic", its help centre says), and it has one question flow per scorecard. Everything below follows
from those two facts.

${table(["In the built funnel", "In ScoreApp", "Why"], [
  ["11 steps: 5 gateway questions, 5 scored questions, then first name and email", "The same 10 questions in the same order and words; the lead form after the questions (Form Behaviour: After Questions)", "ScoreApp then shows the lead form over the masked results, which is the funnel's \"contact last\" rule"],
  ["Question 2 typed (a city or metro, matched by name to the seven presets, with a \"Not decided yet\" chip); questions 8 to 10 as sliders over the same answers, each with a \"Not sure\" chip", "Single-choice questions with the same answers", "ScoreApp's Audiences and the Smart Section read the answer, so a fixed list keeps them exact; ScoreApp's sliders score points, and these questions score none"],
  ["Five areas scored 0 to 100 from one question each (0, 1, 2 or 4 points)", "Five categories, one scored question each, same points", "Category score = points ÷ 4, so the same 0, 25, 50 or 100"],
  ["Deal Readiness Score = the average of the five areas", "Overall score = all points ÷ 20", "Equal maximum per category makes ScoreApp's total the same average"],
  ["Tiers Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100; area bands Low, Medium, High on the same ranges", "One set of score tiers, labelled Beginner, Intermediate, Advanced, used for the overall score and every category", "ScoreApp shares one tier set; the ranges are identical, so each area's Low, Medium and High text maps to one tier"],
  ["Fix first: the lowest area; ties go to rent, then fill, supply, mix, reserves", "Five small sections, each shown by an Audience \"Lowest category is ...\", and one for every area Advanced; categories listed in that order", "ScoreApp breaks ties by the category list, which reproduces the funnel's order; an AI results page varies text by tier, not by which category is lowest"],
  ["The cascade: a lowest Room Mix or Lease-up Reserves defers to the weaker of Rent Evidence and Fill Speed while either is under 75", "The Room Mix and Lease-up Reserves fix-first text says so in words", "ScoreApp cannot compare two categories inside a section"],
  ["The lease-up gap: monthly cost × (lease-up months minus reserve months), in dollars, eight sentence variants", "One Smart Section (AI text per respondent) with the exact rules and sentences (Prompt 4B); the PDF explains the formula with a worked example", "No arithmetic on answers in ScoreApp. Appendix B lists the exact sentence for every answer combination to check it against"],
  ["The six-month strip (a picture drawn from the answers)", "Not carried over; the sentence and its math line say the same", "No per-answer graphics"],
  ["The city's rule on unrelated adults for the visitor's market", "On the results page, one section per preset market shown by Audience; in the PDF, a page with all seven cities", "Audiences are answer-based visibility"],
  ["Next-step cards ordered by tier; the free forecast only in covered markets, else \"Look up your market\"", "The tier's first step on its own (Beginner: the report; Intermediate: the forecast, or the market lookup outside covered markets; Advanced: the walkthrough), then every card", "The same first step per tier, without sorting cards per person"],
  ["The walkthrough: the funnel's own form (5 business days, three windows, phone and consent)", "Your booking tool's page, embedded or linked from a button, with name and email prefilled", "ScoreApp books through a calendar tool"],
  ["The deepener: 12 optional questions after the result, and a sharper report", "Not carried over", "One question flow per scorecard; 22 questions in one flow would cut completion (ScoreApp: 15 or more \"typically see completion rate drops below 50%\")"],
  ["Answer-by-answer sentences (\"Where your plan stands\", quick wins, the checks' status)", "The same pages, written per category tier", "Tier-based content is what ScoreApp personalises"],
  ["Meta: ScorecardStart, ScorecardComplete (pixel and server, one event id), Schedule for qualified bookings", "ScoreApp's own events: ScoreappQuestionsStarted, Lead (after the lead form), ScoreappQuestionsFinished; Conversions API on; custom conversions name them for the GTM", "ScoreApp's event names are fixed"],
  ["The score email with the PDF, the team's notice, the Loops follow-ups through a signed webhook", "ScoreApp's results email with the PDF button, its notification email, its webhook to Loops", "Same jobs, ScoreApp's tools"],
  ["The admin: leads, insights, settings", "ScoreApp's Leads and Insights", "Built in"]
])}`);

/* ---------------------------------------------------------------- 2. rules */
H(`## 2. RoomIQ's copy rules (every stage)

Every prompt below carries these rules. Apply them to anything you type by hand, too.

\`\`\`text
${RULES}
\`\`\`
`);

/* ---------------------------------------------------------------- stage 1 */
const qRows = HERO_STEPS.map((s) => {
  const scored = s.kind === "scored";
  const ans = s.options.map((o) => scored ? `${o.label} = ${o.points} pt` : o.label).join(" / ");
  return `${N(s)} | ${scored ? `SCORED: ${areaName(s.area)}` : "UNSCORED"} | ${s.q}${s.help && s.type !== "text" ? ` (help text: ${s.help})` : ""} | ${ans}`;
}).join("\n");
const catRows = areas.map((a, i) => `${i + 1} | ${a.name} | ${a.description}`).join("\n");

H(`## Stage 1. The scorecard: AI Scorecard Builder

Open ScoreApp, **Create Scorecard**, **Use the AI Builder**. Paste Prompt 1A as your first message.

### 1.1 Prompt 1A (paste as your first message)

\`\`\`text
<role>
You are ScoreApp's AI Scorecard Builder, configuring one scorecard for RoomIQ. The specification below is final: it
comes from a funnel that is already built, tested and approved. Reproduce it inside ScoreApp exactly. Do not improve,
shorten, expand or rephrase it.
</role>

<priority_order>
1. hard_rules  2. questions and scoring  3. copy_rules  4. everything else.
When two instructions conflict, the higher one wins. When something is not specified, choose the plainest option and
list it in your summary. Never invent content to fill a gap.
</priority_order>

<scorecard>
name: ${SC.name}
score_name: ${SC.scoreName} (0 to 100, higher is better)
business: RoomIQ (${SITE.masterUrl}), ${SITE.product.replace(/^RoomIQ: /, "")}
audience: US investors before or during their first coliving deal, and owners converting a house.
  Most arrive on a phone from a Meta ad.
promise: ten quick questions and the contact step, about a minute; the score right after; the full report by email as a PDF
measures: how much of the deal plan rests on evidence the investor can check, across five areas. It does not grade the
  house, the market or what the deal will return.
result: the ${SC.scoreName}, five category scores, the lowest category marked "Fix first", next steps by tier
tone: direct, plain, never shaming
</scorecard>

<hard_rules>
- Exactly 10 questions, in the order below, with the exact wording, answers and points below. Do not add, remove, merge,
  split, reorder or reword any question or answer, and do not add "Other" answers.
- Every question is single-select (one answer). No open text, sliders, checkboxes or image answers.
- Exactly 5 categories, in this order: ${areas.map((a) => a.name).join(", ")}.
- UNSCORED questions (${HERO_STEPS.filter((s) => s.kind !== "scored").map(N).join(", ")}): turn scoring off. They award no points to any category.
- SCORED questions (${SCORED.map(N).join(", ")}): each answer awards the listed points to the one category listed, and to no other.
- Score tiers, used for the overall score and for every category: ${TIERS.map((t) => `${t.label} ${t.min} to ${t.max}`).join(", ")}.
- The lead form comes AFTER the questions and asks first name and email only (no last name, phone or company).
- Show scores as percentages (0 to 100).
- No testimonials, reviews, logos, counts, statistics, prices or countdown timers anywhere.
- Do not ask questions this brief answers. If you must ask something, ask everything in one message.
</hard_rules>

<categories>
order | name | what it measures (internal description)
${catRows}
</categories>

<questions>
# | scoring | question | answers (in this order)
${qRows}
</questions>

<scoring>
- Category score = points earned in the category ÷ 4 points possible × 100. Each category has one scored question, so a
  category scores 0, 25, 50 or 100. (The answer scale is 0, 1, 2 and 4 on purpose: the best answer is evidence, worth
  twice a partial one.)
- Overall score = all points earned ÷ 20 × 100, which equals the average of the five category scores.
- Ties for the lowest category resolve to the category higher in the category list.
</scoring>

${RULES}

<results_outline>
The results page (its full copy comes in a later message): the overall score with its tier; a section for the first six
months; the lowest category as "Fix first"; the five category scores with tier-based text; three checks RoomIQ can't do;
next steps (the PDF report, a free forecast on the address, a 20-minute walkthrough, how RoomIQ shows its working).
</results_outline>

<branding>
Match the brand from ${SITE.masterUrl}: ink ${BRAND.colors.ink}, accent ${BRAND.colors.accent}, button ${BRAND.colors.accent2},
signal ${BRAND.colors.signal}, light ground ${BRAND.colors.canvas}; fonts ${BRAND.fonts.display.family} (headings) and
${BRAND.fonts.text.family} (text). No stock photos of people.
</branding>

<concept>
Offer one concept only: "${SC.name}" exactly as specified here. If your flow shows several concepts, I will continue with
the one named "${SC.name}"; its questions must still be exactly the ones above.
</concept>

<self_check>
Before you show the questions, confirm in one short list: 10 questions in order; questions ${SCORED.map(N).join(", ")} scored, each
into its one category, points as listed; questions ${HERO_STEPS.filter((s) => s.kind !== "scored").map(N).join(", ")} unscored; 5 categories in order; tiers
${TIERS.map((t) => `${t.min} to ${t.max}`).join(", ")}; lead form after the questions with first name and email; no text you invented.
</self_check>
\`\`\`

### 1.2 If the builder asks follow-up questions

The builder may still ask about your business, audience, goals, leads or branding. Answer with these lines (or pick the
suggested answer that matches them).

${table(["If it asks about", "Answer"], [
  ["Your business", `RoomIQ, ${SITE.product.replace(/^RoomIQ: /, "")}. Website: ${SITE.masterUrl}`],
  ["Your audience", "US investors before or during their first coliving deal, and owners converting a house. Most come from Meta ads on a phone."],
  ["Your goals", "Show each investor which of their deal numbers are evidence and which are borrowed, then send them to a free forecast on their address or a 20-minute walkthrough."],
  ["The leads you want", "Investors looking at houses, under contract, converting a house or running up to 10 houses, in a covered market. Learners are welcome but not the priority."],
  ["Scorecard type", "A scored assessment with five categories, not a personality quiz."],
  ["Match your branding", `Yes: ${SITE.masterUrl}`],
  ["Which concept", `Continue with "${SC.name}" as specified in my first message.`]
])}
### 1.3 At "Review Questions and Scoring": check before you build

${bullets([
  "10 questions, in this order, with the exact words (compare with the table in Prompt 1A).",
  `Questions ${SCORED.map(N).join(", ")}: scoring on; each answer scores into one category only, with the listed points (0, 1, 2 or 4).`,
  `Questions ${HERO_STEPS.filter((s) => s.kind !== "scored").map(N).join(", ")}: scoring off on every answer.`,
  `Categories: ${areas.map((a) => a.name).join(", ")}, in this order.`,
  "No extra question, answer, category or info screen."
])}

Then click **Build this scorecard**.

### 1.4 Prompt 1B (only if something differs)

\`\`\`text
Correct the questions and scoring to match my first message exactly. Keep everything else.
1. Restore the exact wording, order and answers of all 10 questions as listed in <questions>.
2. Questions ${HERO_STEPS.filter((s) => s.kind !== "scored").map(N).join(", ")}: scoring off on every answer.
3. Questions ${SCORED.map(N).join(", ")}: each answer scores only into its listed category, with exactly the listed points.
4. Remove any question, answer, category or info screen I did not list.
Reply with the corrected list of 10 questions so I can check it.
\`\`\`

### 1.5 By hand after the build

${table(["Where", "Set"], [
  ["Settings, Score Tiers", TIERS.map((t) => `${t.label}: ${t.min} to ${t.max}`).join("; ") + ". Suggested colors: Beginner " + BRAND.colors.signal + ", Intermediate " + BRAND.colors.accent + ", Advanced " + areas.find((a) => a.key === "fill").color],
  ["Questions, Categories", `Order: ${areas.map((a) => a.name).join(", ")} (the order decides ties for the lowest category). Category colors if offered: ${areas.map((a) => `${a.name} ${a.color}`).join(", ")}`],
  ["Questions, each question", "Type: single choice (buttons or radio buttons). Question 2 has nine answers: use radio buttons, or a dropdown if your theme stacks nine buttons badly. Hide category names on questions (Settings, show or hide category names)"],
  ["Questions, help text", HERO_STEPS.filter((s) => s.help && s.type !== "text").map((s) => `Question ${N(s)}: "${s.help}"`).join(". ") || "None"],
  ["Results page, score sections", "Display Options, Overall Score Format: Percent (for the overall score and the categories)"],
  ["Settings, General", "Scorecard name: " + SC.name + ". Keep Draft mode on until Stage 8"]
])}`);

/* ---------------------------------------------------------------- stage 2 */
const B = LANDING.variants.find((v) => v.layout === "scoreapp");
const A = LANDING.variants.find((v) => v.layout === "hero-quiz");
const lpRules = `<hard_rules>
- Use the copy below verbatim, character for character. Do not rephrase, shorten, add or translate.
- Sections in exactly this order. Remove template sections not listed here.
- Every button goes to the questions ("Go to questions"). No button opens the lead form: it comes after the questions.
- Pictures: only the neighborhood illustration I upload (made-up houses). No stock photos, no people, no logos of others.
- No testimonials, reviews, ratings, logos, counts, statistics, prices, countdown timers or "as seen in" strips.
</hard_rules>`;
H(`## Stage 2. Landing pages

Two landing pages, as in the funnel. Version B is the default page (the scorecard's main address). Version A is the page
for the Meta ads, at the URL key \`${A.slug}\`. Upload the picture first: \`src/assets/img/neighborhood-1280.webp\` from
the repository (a made-up neighborhood, the same picture the funnel and the landing page use).

### 2.1 Prompt 2A: the default landing page (Version B)

Open **Landing Pages**, the default page, and paste into its AI chat.

\`\`\`text
<role>You are editing this scorecard's default landing page in ScoreApp for RoomIQ.</role>
${lpRules}
${RULES}
<sections>
1. HERO (picture on the right, text on the left)
   eyebrow: ${B.hero.eyebrow}
   headline (H1): ${B.hero.h1}
   lead: ${B.hero.lead}
   button: ${B.hero.button}
   three small items under the button, with simple icons: About a minute / Free / Report by email
2. INTRODUCTION
   heading: ${LANDING.intro.h2}
   body: ${LANDING.intro.body}
   button: ${LANDING.intro.button}
3. HOW IT WORKS (on a dark ink ground)
   heading: ${LANDING.how.h2}
   body: ${LANDING.how.body}
${LANDING.how.steps.map((s, i) => `   step ${i + 1}: ${s.title}. ${s.body}`).join("\n")}
4. THE FIVE AREAS (one card per area, in this order)
   eyebrow: ${LANDING.areasSection.eyebrow}
   heading: ${LANDING.areasSection.h2}
${areas.map((a) => `   card: ${a.name}. ${a.description}`).join("\n")}
5. THE REPORT
   heading: ${LANDING.reportCta.h2}
   body: ${LANDING.reportCta.body}
${LANDING.reportCta.bullets.map((b) => `   bullet: ${b}`).join("\n")}
   button: ${LANDING.reportCta.button}
6. FAQ
   heading: ${LANDING.faq.h2}
   line: ${LANDING.faq.body}
${LANDING.faq.items.map((f) => `   Q: ${f.q}\n   A: ${f.a}`).join("\n")}
   button: ${LANDING.faq.button}
7. FINAL CALL
   heading: ${LANDING.footerCta.h2}
   line: ${LANDING.footerCta.sub}
   button: ${LANDING.footerCta.button}
8. FOOTER
   line: ${LANDING.footer.line}
   link: ${LANDING.footer.master} (${SITE.masterUrl})
   links: Terms (${SITE.legal.terms}), Privacy (${SITE.legal.privacy}), Privacy choices (${SITE.legal.choices})
</sections>
<self_check>Before you finish: 8 sections in this order; every button goes to the questions; no text outside this
message; no em dashes.</self_check>
\`\`\`

### 2.2 Prompt 2B: the Meta ads page (Version A)

**Landing Pages**, **Create**, then paste into its AI chat. Afterwards set its URL key to \`${A.slug}\` (Settings, the
wheel icon) and publish it without making it the default.

\`\`\`text
<role>You are building a second landing page for this scorecard, for people arriving from a Meta ad whose first line is:
"${A.hook}". The page gets them to the first question in one tap.</role>
${lpRules}
${RULES}
<sections>
1. HERO (short; the button is the main thing on a phone screen)
   eyebrow: ${A.hero.eyebrow}
   headline (H1): ${A.hero.h1}
   lead: ${A.hero.lead}
   button: ${A.sticky}
   three trust lines with check icons: ${LANDING.trust.join(" / ")}
2. YOUR FREE REPORT
   eyebrow: ${A.report.eyebrow}
   heading: ${A.report.h2}
   line: ${A.report.line}
${A.report.points.map((p) => `   card: ${p.title} ${p.body}`).join("\n")}
   button: ${A.sticky}
3. HOW IT WORKS: the same as the default page's section 3 (heading, body, three steps)
4. THE FIVE AREAS: the same as the default page's section 4
5. FAQ: the same as the default page's section 6
6. FINAL CALL
   heading: ${A.final.h2}
${A.final.stack.map((s) => `   line: ${s}`).join("\n")}
   line: ${A.final.line}
   button: ${A.final.button}
   trust lines: ${LANDING.trust.join(" / ")}
7. FOOTER: the same as the default page's footer
</sections>
<self_check>Before you finish: the first screen on a phone shows the headline and the button; every button goes to the
questions; no text outside this message.</self_check>
\`\`\`

### 2.3 By hand

${table(["Where", "Set"], [
  ["Each landing page, each button", "Edit link, **Go to questions**, Save (an AI-built page can open the lead form first even when the lead form is set to After Questions). Then Publish"],
  ["Version B", "Publish, then Set as home page (the default)"],
  ["Version A", `Settings (wheel icon), URL: \`${A.slug}\`. Publish, not default. Its address: \`https://<your scorecard domain>/${A.slug}\``],
  ["Each page, Settings, SEO", `Title: ${LANDING.meta.title}. Description: ${LANDING.meta.description}`],
  ["Social image", "Upload `src/assets/og.png` from the repository (1200 × 630, RoomIQ's own)"],
  ["Ads that should skip the landing page", "Use `https://<your scorecard domain>/questions` (works because the lead form is after the questions)"],
  ["Split test A against B (Pro plan only)", "Experiments: the two pages, 50/50. On Business, send ads to Version A and other links to Version B"]
])}`);

/* ---------------------------------------------------------------- stage 3 */
const consentField = CONTACT.consent;
H(`## Stage 3. Lead form and consent (by hand)

**Settings, Lead Form.**

${table(["Setting", "Value"], [
  ["First name", `On, required. Label: ${CONTACT.fields.find((f) => f.name === "firstName").label}`],
  ["Last name", "Disabled"],
  ["Email", `On, required. Label: ${CONTACT.fields.find((f) => f.name === "email").label}`],
  ["Other fields", "None (no phone, no company). The phone is asked only by the booking tool, with its own consent"],
  ["Opt in", `Explicit Consent (Required). Wording: ${consentField.label}`],
  ["Privacy statement", sa(LANDING.legal.notice.replace("{button}", `"${CONTACT.button}"`).replace("{terms}", "Terms of Service").replace("{privacy}", "Privacy Policy"))],
  ["Privacy Policy URL", SITE.legal.privacy],
  ["Form Behaviour", "After Questions"],
  ["Lead form on the results page (the section ScoreApp adds)", `Heading: ${CONTACT.q} Button: ${CONTACT.button}`],
  ["Advanced email validation", "On, if your plan has it"]
])}`);

/* ---------------------------------------------------------------- stage 4 */
const audRows = [
  ["Covered market", "Scorecard answer: Question 2 is any of: " + coveredLabels.join(", "), "The free forecast card (section 8)"],
  ["Outside covered markets", "Scorecard answer: Question 2 is any of: " + outsideLabels.join(", "), "The market lookup card (section 8)"],
  ["Intermediate, covered market", "Total score tier is Intermediate AND Question 2 is any of: " + coveredLabels.join(", "), "The first step (section 7)"],
  ["Intermediate, outside covered markets", "Total score tier is Intermediate AND Question 2 is any of: " + outsideLabels.join(", "), "The first step (section 7)"],
  ...areas.map((a) => [`Fix first: ${a.name}`, `Lowest category is ${a.name} AND total score percentage is less than or equal to 99`, "Fix first (section 4)"]),
  ["Every area Advanced", "Total score percentage is greater than or equal to 100", "Fix first (section 4)"],
  ...G2.options.map((o) => [`Market: ${o.label}`, `Scorecard answer: Question 2 is ${o.label}`, "The city's rule (section 6)"])
];
const tierBlock = (fn) => TIERS.map((t) => `   [${t.label} ${t.min} to ${t.max}] ${fn(t)}`).join("\n");
const fixLine = (k) => {
  const base = `Fix first: ${areaName(k)}. ${SC.bottleneckLines[k]}`;
  if (k === "mix" || k === "reserves") {
    const why = SC.cascadeLines[k].replace(/\{cause\} score/, "Rent Evidence and Fill Speed scores").replace("follows from your", "follows from your");
    return `${base} ${why} If either of those two scored under 75, start with the lower of them (Rent Evidence if they tie).`;
  }
  return base;
};
const ctaCard = (c, link) => `heading: ${c.h3} | body: ${c.body} | button: ${c.button} | link: ${link}`;
const BOOKING = "[[TBD: your booking page link, for example a Calendly event]]";
const PDF_LINK = "https://<your scorecard domain>/results/{result_key}/pdf";

H(`## Stage 4. Results page

### 4.1 By hand first: Audiences

**Audiences, Create Audience**, one per row (Business plan). They let the AI results page show a section by answers, by
which category is lowest, or by a mix of answer and tier: things its "versions by score" cannot do on their own. Create
them all before Prompt 4A. Ties for the lowest category go to the category higher in the list, as in the funnel.

${table(["Audience name", "Criteria", "Used for"], audRows)}
### 4.2 Prompt 4A: build the results page

**Result Pages**: the AI builder made a results page with the scorecard. Open it and paste this into its AI chat. (If you
prefer to place every section yourself, build a **Dynamic result page** with the manual builder from the same text; a
page cannot switch builders later.)

\`\`\`text
<role>You are rebuilding this scorecard's results page for RoomIQ. The content is final and comes from an approved,
tested funnel. Lay it out well; do not write new copy.</role>

<hard_rules>
- Use the copy below verbatim. Sections in exactly this order. Remove anything else on the page.
- Personalised sections hold one version per score tier: Beginner 0 to 39, Intermediate 40 to 69, Advanced 70 to 100.
  Say for each section whether it follows the overall score, the lowest category, or one category's own score, exactly
  as marked below.
- Show every score as a percentage.
- Leave section 3 as an empty placeholder titled "Your first six months": I will turn it into a Smart Section.
- Visibility marked "audience: <name>" means: Personalise, Who sees this, Some visitors, By audience, <name>. These
  Audiences already exist. Visibility marked "score level" means: By score level, with the tier and score named.
- Where a section must follow ONE category's own tier and a section can only vary by the overall score or the
  highest/lowest category, make three copies of it, each shown by score level to that category's tier.
- No testimonials, reviews, logos, counts, statistics, prices, countdown timers or stock photos. No AI notice except the
  one line in section 3.
</hard_rules>

${RULES}

<sections>
1. HEADER (everyone)
   logo, then: ${sa(RESULTS.header.thanks)}
   heading (H1): ${RESULTS.header.name}
   line: Your full report is on its way to your inbox as a PDF.

2. YOUR SCORE (everyone; personalised by OVERALL score tier)
   donut chart of the overall score, percent, labelled "${SC.scoreName}"
${tierBlock((t) => `${t.name}. ${t.descriptor} Higher is better.`)}
   under it, the same for all tiers: ${RESULTS.score.intro}

3. YOUR FIRST SIX MONTHS (everyone): leave as an empty placeholder, I will make it a Smart Section.
   heading: Your first six months
   small line at the end: An AI model worked these numbers out from three of your answers, with the formula in your report.

4. FIX FIRST: six small sections, exactly one shows for each person
${areas.map((a) => `   (audience: Fix first: ${a.name}) ${fixLine(a.key)}`).join("\n")}
   (audience: Every area Advanced) ${SC.bottleneckLines.none}

5. YOUR FIVE AREAS (everyone)
   heading: ${RESULTS.areasTitle}
   bar chart of the five category scores, percent, in category order
   line: ${RESULTS.summary}
   then one card per category, in order. Each card follows THAT CATEGORY'S OWN tier (score level on that category):
${areas.map((a) => `   ${a.name}:\n${TIERS.map((t) => `      [${a.name} ${t.label}] ${RESULTS.cards[a.key][t.band]}\n         note under it: ${RESULTS.recommendations[t.band]}`).join("\n")}`).join("\n")}

6. ${CHECKS.title.toUpperCase()}: small sections in this order
   6a (everyone) heading: ${CHECKS.title} | lead: ${CHECKS.lead} | subheading: 1. ${CHECKS.zoning.title}
${G2.options.map((o) => `   6b (audience: Market: ${o.label}) ${CHECKS.zoning.byMarket[o.v]} ${CHECKS.zoning.ask}`).join("\n")}
   6c (everyone) subheading: 2. ${CHECKS.financing.title} | ${CHECKS.financing.body} ${CHECKS.financing.ask}
      subheading: 3. ${CHECKS.insurance.title} | ${CHECKS.insurance.body} ${CHECKS.insurance.ask}
${Object.entries(CHECKS.insurance.byMarket).map(([k, v]) => `   6d (audience: Market: ${label(G2, k)}) ${v}`).join("\n")}
   6e (everyone) small print: ${CHECKS.zoning.asOf} ${CHECKS.notAdvice}

7. YOUR FIRST STEP: four small sections, exactly one shows for each person (the tier's first step, from the GTM)
   7a (score level: overall Beginner) ${ctaCard(RESULTS.report, "the PDF report link")}
   7b (audience: Intermediate, covered market) ${ctaCard(RESULTS.cta.forecast, "the forecast link")}
   7c (audience: Intermediate, outside covered markets) ${ctaCard(RESULTS.cta.market, SITE.masterUrl)}
   7d (score level: overall Advanced) ${ctaCard(RESULTS.cta.call, "the booking link")}

8. EVERY NEXT STEP (cards side by side or stacked, no heading; one of them repeats the first step on purpose)
   8a (everyone) ${ctaCard(RESULTS.report, "the PDF report link")}; second button: ${RESULTS.report.pdf} (the same link)
   8b (audience: Covered market) ${ctaCard(RESULTS.cta.forecast, "the forecast link")}
   8c (audience: Outside covered markets) ${ctaCard(RESULTS.cta.market, SITE.masterUrl)}
   8d (everyone) ${ctaCard(RESULTS.cta.call, "the booking link")}
   8e (everyone) ${ctaCard(RESULTS.cta.service, SITE.masterUrl)}

9. FOOTER (everyone)
   ${RESULTS.ruleLine}
   ${LANDING.footer.line}
   links: Terms (${SITE.legal.terms}), Privacy (${SITE.legal.privacy}), Privacy choices (${SITE.legal.choices})
</sections>

<links>
the PDF report link: ${PDF_LINK}
the forecast link: ${FORECAST("results")}
the booking link: ${BOOKING}
</links>

<self_check>Before you finish, list: the sections in order; for each, who sees it (everyone, score level, or which
audience) and which versions it holds; every link; anything you could not set up exactly as asked; any text you did
not take from this message (there should be none).</self_check>
\`\`\`
`);

/* ---------------------------------------------------------------- stage 4.3 smart section */
const cMap = G3.options.map((o) => `"${o.label}" -> ${SC.invisible.cost[o.v] === null ? "unknown" : "$" + SC.invisible.cost[o.v].toLocaleString("en-US")}`).join("\n");
const fMap = G4.options.map((o) => `"${o.label}" -> ${SC.invisible.fill[o.v] === null ? "unknown" : SC.invisible.fill[o.v]}`).join("\n");
const rMap = G5.options.map((o) => `"${o.label}" -> ${SC.invisible.reserves[o.v] === null ? "unknown" : SC.invisible.reserves[o.v]}`).join("\n");
const KINDS = ["gap", "exact", "covered", "costOnly", "perMonth", "monthsShort", "monthsCovered", "none"];
const tmpl = KINDS.map((k) => `${KIND_NAME[k]}\n  line 1: ${smart(I[k])}${MATH[k] ? `\n  line 2: ${smart(I[MATH[k]])}` : "\n  line 2: (none)"}`).join("\n");
const EX = [
  { carry: "2to3k", fillmonths: "m3", reserves: "m1" },
  { carry: "over4k", fillmonths: "m2", reserves: "m6" },
  { carry: "unsure", fillmonths: "m4", reserves: "m1" }
];
const exBlock = EX.map((a, i) => {
  const r = leaseUp(a);
  return `example ${i + 1}
  answers: A "${label(G3, a.carry)}", B "${label(G4, a.fillmonths)}", C "${label(G5, a.reserves)}"
  output:
${r.lines.map((l) => `  ${l}`).join("\n\n")}`;
}).join("\n\n");

H(`### 4.3 Prompt 4B: the "Your first six months" Smart Section

Turn section 3 into a **Smart Section** (Business or Pro) and paste this as its prompt. Then **Generate Example**, and
compare the output with Appendix B for a few answer combinations. Smart Sections send the answers and scores to
ScoreApp's AI provider, never the name or email, and spend about 1/20 of an AI credit per respondent.

\`\`\`text
<role>
You write one short passage on a scorecard's results page. You compute it from three of the respondent's answers,
following the rules below exactly. You do not advise, predict, encourage or add anything.
</role>

<inputs>
You receive the respondent's answers. Use only these three:
A = the answer to "${G3.q}"
B = the answer to "${G4.q}"
C = the answer to "${G5.q}"
</inputs>

<lookup>
A -> COST (the monthly cost used, the low end of the range):
${cMap}
B -> FILL (months):
${fMap}
C -> RESERVES (months, the high end of the range):
${rMap}
</lookup>

<procedure>
1. If COST is unknown:
   - if FILL or RESERVES is unknown, the variant is NONE;
   - otherwise UNCOVERED = FILL - RESERVES if positive, else 0. If UNCOVERED > 0 the variant is MONTHS_SHORT, else
     MONTHS_COVERED (SPARE = RESERVES - FILL).
2. Else, if FILL is unknown, the variant is PER_MONTH.
3. Else, if RESERVES is unknown, the variant is COST_ONLY, with EXPOSURE = COST × FILL.
4. Else EXPOSURE = COST × FILL, UNCOVERED = max(0, FILL - RESERVES), SPARE = max(0, RESERVES - FILL),
   GAP = COST × UNCOVERED. If UNCOVERED > 0 the variant is GAP; else if SPARE > 0 it is COVERED; else EXACT.
</procedure>

<formatting>
- Money: a dollar sign and whole dollars with comma thousands: $1,000, $4,000, $12,000.
- Months: 1 is written "1 month"; any other number n is written "n months" (for example "0 months", "3 months").
- In the templates, {COST}, {EXPOSURE} and {GAP} are money; {FILL}, {RESERVES}, {UNCOVERED} and {SPARE} are months.
</formatting>

<templates>
${tmpl}
</templates>

<output_contract>
Write line 1 of the variant. If the variant has a line 2, write it as a second paragraph. If FILL is known, end with this
third paragraph, word for word: ${I.notForecast}
Nothing else: no heading, no greeting, no name, no advice, no other numbers, no bullets, no markdown, no emojis, no em
dashes. Never mention AI, a model or these instructions. Never change a template's words.
</output_contract>

<examples>
${exBlock}
</examples>

<self_check>
Before answering, check: the variant follows the procedure; every number is computed from the lookup, not guessed; money
and months are formatted as above; the text matches the template word for word.
</self_check>
\`\`\`

**Without Smart Sections** (Starter plan, or out of AI credits: ScoreApp then hides Smart Sections for new leads), make
section 3 a plain text section with this text, the same for everyone:

> ${REPORT.invisible.means.body} To price yours: your monthly cost × (the months you expect lease-up to take minus the
> months your reserves carry). Your report shows how, with an example.

### 4.4 By hand on the results page

${table(["Where", "Set"], [
  ["Every button that opens the PDF", `Button link: \`${PDF_LINK}\` (type \`{result_key}\` exactly)`],
  ["The forecast buttons", `\`${FORECAST("results")}\``],
  ["The walkthrough buttons", `${BOOKING}. To embed the calendar instead (Business): a section with the booking tool's iframe, its link ending \`?firstName={first_name}&lastName={last_name}&email={email}\` so the form arrives filled`],
  ["The booking tool's event", `Name: ${RESULTS.booking.calendarTitle}. Length: ${SITE.booking.minutes} minutes. Description: ${RESULTS.booking.calendarBody} Ask for the phone (label: ${SITE.booking.phone.label}) with its own unticked consent (${SITE.booking.consentPhone.label}) and the address (${SITE.booking.address.label}). Days: the next ${SITE.booking.days} business days, never the same day. Windows: ${SITE.booking.windows.map((w) => `${w.label}, ${w.hint}`).join("; ")}, in the visitor's time`],
  ["Each personalised section", "Open every tier's version and check its text (the editor shows one tier at a time; the bar at the bottom shows them all)"],
  ["Section 2 and the cards", "Display Options: Percent"],
  ["Prefer the manual builder?", "Create Result Page, Dynamic result page, with the same text: an Individual Category section set to Display Lowest with Dynamic Content on replaces the six Fix first sections, and Individual Category sections with Dynamic Content replace the score-level copies of the five cards. Make it the default page"],
  ["Publish", "Publish the page (this publishes the page, not the scorecard)"]
])}`);

/* ---------------------------------------------------------------- stage 5: PDF */
const overviewIntro = [REPORT.overview.intro, METHOD.overview.nextTop3, fill(METHOD.overview.then, { items: andList([METHOD.overview.items.areas, METHOD.overview.items.method, METHOD.overview.items.service, METHOD.overview.items.playbook]) })].join(" ");
const L = METHOD.letter;
const page = (n, title, type, dyn, body) => `#### Page ${n}. ${title}\n\n*Page type: ${type}. ${dyn}*\n\n${body}\n`;
const sections3 = (x, labels) => `**${labels.means}**\n\n${x.means.lead}\n\n${bullets(x.means.bullets)}\n\n**${labels.next}**\n\n${x.next.lead}\n\n${bullets(x.next.bullets)}\n\n**${labels.impact}**\n\n${x.impact.lead}\n\n${bullets(x.impact.bullets.filter((b) => !/\{\w+\}/.test(b)).concat(x.impact.bullets.some((b) => /\{\w+\}/.test(b)) && x.impact.bulletNoCount ? [x.impact.bulletNoCount] : []))}`;
const guidePages = (k) => {
  const g = PLAYBOOK.guides[k];
  const L2 = PLAYBOOK.guideLabels;
  const p1 = `## ${g.title}\n\n${g.tagline}\n\n${table([g.withoutHead, g.withHead], g.compare)}\n### ${fill(L2.method, { method: g.method })}\n\n${g.phases.map((p, i) => `**${fill(L2.phase, { n: i + 1, t: p.t })}.** ${p.s}\n\n${bullets(p.b)}`).join("\n\n")}`;
  const p2 = `### ${L2.mistakes}\n\n${bullets(g.mistakes)}\n\n### ${L2.protocol}: ${g.protocol.title}\n\n${[[L2.frequency, g.protocol.frequency], [L2.format, g.protocol.format], [L2.review, g.protocol.review], [L2.classify, g.protocol.classify]].map(([k, v]) => `**${k}** ${v}`).join("\n\n")}\n`;
  return [p1, p2];
};
const S = METHOD.steps;
const chip = { low: METHOD.gap.chips.low, medium: METHOD.gap.chips.medium, high: METHOD.gap.chips.high };
const leaseTable = table(["Your answer to \"" + G3.q + "\"", "Monthly cost used"], G3.options.map((o) => [o.label, SC.invisible.cost[o.v] === null ? "Work it out first" : "$" + SC.invisible.cost[o.v].toLocaleString("en-US")]))
  + "\n" + table(["Your answer to \"" + G4.q + "\"", "Lease-up months"], G4.options.map((o) => [o.label, SC.invisible.fill[o.v] === null ? "Find this number" : String(SC.invisible.fill[o.v])]))
  + "\n" + table(["Your answer to \"" + G5.q + "\"", "Reserve months"], G5.options.map((o) => [o.label, SC.invisible.reserves[o.v] === null ? "Count them" : String(SC.invisible.reserves[o.v])]));
const jordan = leaseUp(PERSONAS[0].answers);
const jv = gapVars(invisibleOf(SC, PERSONAS[0].answers));
const pages = [];
pages.push(page(1, "Front cover", "Front cover", "Static.", kv([["Title", REPORT.cover.title], ["Subtitle", REPORT.cover.subtitle.replace("{deal}", "first deal")], ["Prepared for", REPORT.cover.preparedFor], ["Name", "{first_name}"], ["Date", "The report date (ScoreApp's date field)"], ["Picture", "The neighborhood illustration (`src/assets/img/neighborhood-1280.webp`)"]])));
pages.push(page(2, L.title, "General content", "Static, with merge fields.", `*${L.kicker}*\n\n## ${L.title}\n\n${L.body.map(sa).join("\n\n")}\n\n${L.signoff}\n\n### ${L.contentsTitle}\n\n${["invisible", "checks", "overall", "areas", "method", "service", "playbook", "next"].map((k, i) => `${i + 1}. ${L.contents[k]}`).join("\n")}`));
pages.push(page(3, REPORT.overview.title, "Category summary (the five category scores)", "Static text; the scores fill themselves.", `## ${REPORT.overview.heading}\n\n${overviewIntro}\n\n### ${REPORT.overview.sub}\n\n${table(["Area", "What it measures"], areas.map((a) => [a.name, a.description]))}`));
pages.push(page(4, REPORT.invisible.title, "General content", "Static. Each reader's own figure is on their results page (Smart Section).", `## ${REPORT.invisible.title}\n\nYour lease-up gap is your own plan, priced: what the house costs while rooms fill, against the cushion you hold.\n\n**The formula:** monthly cost × (the months you expect lease-up to take minus the months your reserves carry). Costs at the low end of your range and reserves at the high end, so the real figure is at least this large.\n\n${leaseTable}\n**An example, made up:** ${PERSONAS[0].name.split(" (")[0]} expects a house costing ${label(G3, PERSONAS[0].answers.carry)} a month, about ${jv.fill_months} to fill, and reserves of ${label(G5, PERSONAS[0].answers.reserves).toLowerCase()}. ${jordan.lines.slice(0, 2).join(" ")}\n\n**${REPORT.invisible.slowerTitle}.** Double the lease-up months and price it again: a slow start is a plan, not a surprise.\n\n**${REPORT.invisible.means.title}.** ${REPORT.invisible.means.body}`));
pages.push(page(5, CHECKS.title, "General content", "Static: every preset city.", `## ${CHECKS.title}\n\n${CHECKS.lead}\n\n### 1. ${CHECKS.zoning.title}\n\n${table(["Market", "The rule as the city's code publishes it"], G2.options.filter((o) => COVERED.includes(o.v)).map((o) => [o.label, CHECKS.zoning.byMarket[o.v]]).concat([["Another market", CHECKS.zoning.byMarket.other]]))}\n**${CHECKS.zoning.ask}**\n\n### 2. ${CHECKS.financing.title}\n\n${CHECKS.financing.body}\n\n**${CHECKS.financing.ask}**\n\n### 3. ${CHECKS.insurance.title}\n\n${CHECKS.insurance.body} ${Object.values(CHECKS.insurance.byMarket).join(" ")}\n\n**${CHECKS.insurance.ask}**\n\n*${CHECKS.zoning.asOf} ${CHECKS.notAdvice}*`));
pages.push(page(6, REPORT.overall.title, "Overall score", "Dynamic content on: one version per tier.", `${REPORT.overall.paragraph}\n\n${table(["Tier", "Label under the score", "Interpretation"], TIERS.map((t) => [t.label, `${t.name}. ${t.descriptor}`, sa(REPORT.overall.interpretation[t.key])]))}`));
pages.push(page(7, "Your strongest area", "Highest category page", "One version per category; the reader sees their highest.", areas.map((a) => `### If the highest is ${a.name}\n\n## ${REPORT.high[a.key].h}\n\n${sections3(REPORT.high[a.key], REPORT.labels)}`).join("\n\n")));
pages.push(page(8, "Your weakest area", "Lowest category page", "One version per category; the reader sees their lowest. If your plan lets the lowest page follow that category's tier, use the \"refinement\" heading for Advanced.", areas.map((a) => `### If the lowest is ${a.name}\n\n## ${REPORT.low[a.key].h}\n\n*Heading when this area is Advanced: ${REPORT.low[a.key].refinement}*\n\n**${REPORT.overall.urgency.criticalUnknown}**${a.key === "mix" || a.key === "reserves" ? `\n\n${SC.cascadeLines[a.key].replace(/\{cause\} score/, "Rent Evidence and Fill Speed scores")} If either of those two scored under 75, start with its page and its guide.` : ""}\n\n${sections3(REPORT.low[a.key], REPORT.labels)}`).join("\n\n")));
pages.push(page(9, METHOD.intro.h1, "General content", "Static.", `*${METHOD.intro.kicker}*\n\n## ${METHOD.intro.h1}\n\n${METHOD.intro.lead}\n\n### ${METHOD.intro.stepsTitle}\n\n${areas.map((a) => `${S[a.key].n}. **${S[a.key].t}** (${a.name}). ${S[a.key].standard}`).join("\n")}\n\n${METHOD.intro.chain}\n\n**${METHOD.intro.rhythmTitle}.** ${METHOD.intro.rhythm}`));
areas.forEach((a, i) => pages.push(page(10 + i, `${fill(METHOD.gap.step, { n: S[a.key].n, t: S[a.key].t })}`, `Category page (${a.name})`, "Dynamic content on: one version per tier of this category.", `*${METHOD.gap.kicker}: ${METHOD.gap.h1}*\n\n## ${fill(METHOD.gap.step, { n: S[a.key].n, t: S[a.key].t })}\n\n${table(["Tier", "Chip", "Where your plan stands"], TIERS.map((t) => [t.label, chip[t.band], RESULTS.cards[a.key][t.band]]))}\n**${METHOD.gap.columns.standard}:** ${S[a.key].standard}\n\n**${METHOD.gap.columns.service}:** ${S[a.key].service}`)));
const W = METHOD.ways;
pages.push(page(15, W.h1, "General content", "Static.", `*${W.kicker}*\n\n## ${W.h1}\n\n${W.lead}\n\n### ${W.self.title}\n\n${W.self.body}\n\n${bullets(W.self.bullets)}\n\n### ${W.service.title}\n\n${W.service.body}\n\n**${W.service.startTitle}**\n\n${W.service.start.map((x, j) => `${j + 1}. **${x.t}** ${x.b}`).join("\n")}\n\n**${W.service.listTitle}**\n\n${bullets(W.service.list)}\n\n### ${W.wontTitle}\n\n${W.wont.map((x) => `**${x.t}** ${x.b}`).join("\n\n")}\n\n*${W.rules}*`));
const D = METHOD.days;
pages.push(page(16, D.h1, "General content", "Static.", `*${D.kicker}*\n\n## ${D.h1}\n\n${D.lead}\n\n${D.phases.map((p, j) => `${j + 1}. **${p.t}.** ${p.b}`).join("\n")}\n\n### ${D.monthlyTitle}\n\n${D.monthly}\n\n**${D.cta}** ${D.ctaLinkText} (${BOOKING})`));
const P = PLAYBOOK.start;
pages.push(page(17, P.title, "General content", "Static, with one merge field.", `*The 30-day plan*\n\n## ${P.title}\n\n${P.lead}\n\n### ${P.howTitle}\n\n${P.how.map((h, j) => `${j + 1}. **${h.b}** ${h.t}`).join("\n")}\n\n**${sa(P.yourStart)}**\n\n${table(P.sectionsHead, P.sections)}`));
let n = 18;
for (const a of areas) { const [p1, p2] = guidePages(a.key); pages.push(page(n++, PLAYBOOK.guides[a.key].title, "General content", "Static.", p1)); pages.push(page(n++, `${PLAYBOOK.guides[a.key].title}, continued`, "General content", "Static.", p2)); }
const T = PLAYBOOK.timeline;
pages.push(page(n++, T.title, "General content", "Static.", `## ${T.title}\n\n${T.lead}\n\n${T.phases.map((p) => `### ${p.t}\n\n*${T.focus} ${p.focus}*\n\n${bullets(p.b)}\n\n**${T.outcome}** ${p.outcome}`).join("\n\n")}`));
const Q = PLAYBOOK.quickStart;
pages.push(page(n++, Q.title, "General content", "Static.", `## ${Q.title}\n\n${Q.days.map((d) => `### ${d.t} (${d.m})\n\n${d.body}`).join("\n\n")}\n\n**${Q.total}**`));
const C = PLAYBOOK.checklists;
pages.push(page(n++, C.title, "General content", "Static (one or two pages).", `## ${C.title}\n\n${areas.map((a) => `### ${a.name}\n\n${table(C.head, C[a.key].map(([x, y]) => [x, y, ""]))}`).join("\n")}`));
const TR = PLAYBOOK.tracker;
pages.push(page(n++, TR.title, "General content", "Static. The reader writes their starting point from their area scores (0 to 39 is 1 or 2, 40 to 69 is 3, 70 and above is 4 or 5).", `## ${TR.title}\n\n${TR.lead}\n\n${table([TR.head[0], TR.startLabel, ...TR.head.slice(1)], TR.rows.map(([m, target]) => [m, "", ...TR.head.slice(1, -1).map(() => ""), target]))}\n### ${TR.commitmentsTitle}\n\n${bullets(TR.commitments)}\n\n### ${TR.rememberTitle}\n\n${bullets(TR.remember)}`));
const NX = PLAYBOOK.next;
pages.push(page(n++, NX.title, "Call to action", "Static, with one merge field.", `## ${NX.title}\n\n${NX.lead}\n\n### ${NX.boxTitle}\n\n${sa(NX.boxBody)}\n\nButton: ${RESULTS.cta.forecast.button} (${FORECAST("report")})\n\n${NX.pick} ${NX.pickLinkText} (${BOOKING})\n\n${NX.master} ${NX.masterLink} (${SITE.masterUrl})\n\n${NX.self}`));

H(`## Stage 5. PDF report (by hand)

**PDF Reports, Create PDF report, Start without a template.** Defaults: US Letter if offered; header with the RoomIQ
mark (\`brand/assets/logo/\`), footer "${REPORT.title}" and the page number; fonts ${BRAND.fonts.display.family} and
${BRAND.fonts.text.family} (Brand Kit, custom fonts \`src/assets/fonts/\`); ink ${BRAND.colors.ink}, accent ${BRAND.colors.accent}.
Build the pages below in order, then **Publish** and **Set as default**. Category pages and the overall score page need
"Enable dynamic content" on, with one version per tier.

### 5.1 Page plan

${table(["Page", "What", "Type", "Changes with"], pages.map((p) => { const m = p.match(/^#### Page (\d+)\. (.*)\n\n\*Page type: ([^.]*)\. ([^*]*)\*/); return [m[1], m[2], m[3], m[4]]; }))}
### 5.2 The pages

${pages.join("\n")}`);

/* ---------------------------------------------------------------- stage 6: emails */
const E = EMAILS.scoreReport;
H(`## Stage 6. Emails

### 6.1 Results email (Settings, Result Email)

Turn **Result Email** on. Sender: your verified address (Business plan, Account, Domains). [[TBD: sender, for example
"RoomIQ <team@your-domain>"]]. Insert the two buttons from the dynamic content menu (Links): the results button and the
PDF report button.

${kv([
  ["Subject", "Your Deal Readiness Score, and your report"],
  ["Preheader (if the editor offers one)", "Your score and your full report, as a PDF."],
  ["Line 1", sa(E.lines[0])],
  ["Line 2", "Thanks for taking the First Deal Risk Scorecard. Your Deal Readiness Score and your five area scores are ready."],
  ["Results button", "See my score"],
  ["Line 3", E.lines[6]],
  ["PDF report button", E.button],
  ["Line 4", `When you have an address, run a free forecast on it: ${FORECAST("email")} (Free plan, no card needed, three forecasts a month).`],
  ["Line 5", `Want to go through it on your address? Book a 20-minute walkthrough: ${BOOKING}`],
  ["Sign-off", EMAILS.signoff],
  ["Footer", `${fill(EMAILS.privacy, { privacy_link: SITE.legal.privacy })} [[TBD: postal address, required in commercial email]]`]
])}
If your merge-field menu offers the overall score and the lowest category, you may add after line 2:
"Your Deal Readiness Score is [[MERGE: Overall score]]/100. Fix first: ${MERGE_LOWEST}." Leave it out otherwise:
the email cannot vary by tier.

### 6.2 Team notification (Settings, Notifications)

${kv([
  ["To", "[[TBD: the team's address]]"],
  ["Subject", "New scorecard: {first_name}, [[MERGE: Overall score]]/100"],
  ["Body", "Insert from the merge tag icon: first name, email, the overall score and tier, the five category scores, the lowest category, and the answers to questions 1, 2, 8, 9 and 10 (stage, market, monthly cost, lease-up months, reserves)."]
])}
### 6.3 The follow-ups in Loops (days 2, 5 and 8)

The GTM planned these in Loops (\`lead_magnet_spec.xlsx\`, Email_Sequence). **Integrate, Webhooks, Connect**: your
automation tool's https address (Zapier, Make or n8n), a secret key, and the events **Lead Signed Up** and **Quiz
Finished**. Map ScoreApp's payload to Loops:

${table(["Loops field", "ScoreApp webhook field"], [
  ["email, first_name", "data.email, data.first_name"],
  ["score, tier", "data.total_score (its score and tier)"],
  ["bottleneck_name", "data.lowest_category.title"],
  ["market", "data.quiz_questions: the answer to question 2"],
  ["covered", `true when that answer is one of: ${coveredLabels.join(", ")}`],
  ["results_url, report_url", "data.result_url, data.report"],
  ["utm_source, utm_campaign", "data.utm_source, data.utm_campaign"]
])}
Rules from the GTM for these emails: never promise or imply income; zoning, financing and insurance are named as outside
RoomIQ; the free forecast only in covered markets; day 2's numbers come from a real run on the day it is sent, never
invented; day 8's cohort version only while the limit is real.

**Day 2**

${kv([
  ["Subject", "What one address looks like with room-level evidence"],
  ["Preheader", "A worked example, labeled as one: rents, supply and fill nearby."],
  ["Line 1", "Hi {first_name},"],
  ["Line 2", "Your scorecard priced your first six months from your own numbers. Here is what the evidence behind those numbers looks like for one address."],
  ["Line 3", "An example, from a RoomIQ run on [date]: a [n]-bedroom house in [market]."],
  ["Line 4", "Coliving homes within about 3 miles: [n]. Shared-bath rooms nearby list for [range] a week, evidence [level]."],
  ["Line 5", "How comparable launches filled: [summary]."],
  ["Line 6", "What it doesn't tell you: the city's rule on unrelated adults, financing and insurance. Those stay with the city, a lender and an insurer."],
  ["Line 7", "Run the same on your address with the Free plan: three forecasts a month, no card needed."],
  ["Button", "Try it on your address"],
  ["Link", FORECAST("email") + "-day2"],
  ["Send rule", "Fill the brackets from a real run on a covered-market address on the day it goes out; if no run is current, skip it. When covered is false, replace line 7 and the button with \"See whether RoomIQ covers your market\", linking to roomiq.io."]
])}
**Day 5**

${kv([
  ["Subject", "Three numbers to check before an offer"],
  ["Preheader", "Rent, fill speed and supply, for one address."],
  ["Line 1", "Hi {first_name},"],
  ["Line 2", "Three numbers decide a coliving deal's first months: what rooms like yours rent for nearby, how fast comparable rooms filled, and how many homes compete within about 3 miles."],
  ["Line 3", "Your scorecard marked {bottleneck_name} as the one to fix first."],
  ["Line 4", "RoomIQ shows each number for an address and labels how much evidence stands behind it. It doesn't check zoning, arrange financing or quote insurance."],
  ["Line 5", "Want to go through your address together? Twenty minutes, your address, your numbers."],
  ["Button", "Book a 20-minute walkthrough"],
  ["Link", BOOKING],
  ["Send rule", "Skip when a walkthrough is booked."]
])}
**Day 8** (version 1 only while the founding cohort has seats left and the number is published, and only to leads who
run houses; everyone else gets version 2)

${kv([
  ["Version 1 · Subject", "The founding operator cohort closes at 12"],
  ["Version 1 · Line 1", "Hi {first_name},"],
  ["Version 1 · Line 2", "The founding cohort closes at 12 operators; [m] places are left."],
  ["Version 1 · Button", "Apply for the founding cohort"],
  ["Version 1 · Link", "The landing page's cohort section"],
  ["Version 2 · Subject", "Your free forecasts are still waiting for an address"],
  ["Version 2 · Line 1", "Hi {first_name},"],
  ["Version 2 · Line 2", "Your free forecasts are still waiting for an address: three a month on the Free plan, no card needed."],
  ["Version 2 · Line 3", "Type the address and RoomIQ prints the estimate with its formula, its comps and how sure it is."],
  ["Version 2 · Button", "Run my free forecast"],
  ["Version 2 · Link", FORECAST("email") + "-day8"]
])}`);

/* ---------------------------------------------------------------- stage 7 */
H(`## Stage 7. Tracking, domain and sender (by hand)

${table(["Where", "Set", "Why"], [
  ["Settings, Tracking: Meta Pixel ID", "[[TBD: RoomIQ's pixel id]]", "ScoreApp then fires PageView on every page, ScoreappQuestionsStarted after the first answer, ScoreappQuestionsFinished after the last, and Lead after the lead form"],
  ["Settings, Tracking: Conversions API", "On, with the access token from Events Manager (Settings, Conversions API, Generate access token)", "The same events also go server side"],
  ["Meta Events Manager: custom conversions", "\"ScorecardStart\" = event ScoreappQuestionsStarted, URL contains your scorecard domain. \"ScorecardComplete\" = event Lead, URL contains your scorecard domain", "The GTM's event map counts every completion. With the lead form after the questions, Lead fires once per completion; the URL rule keeps it apart from the Meta page's own Lead (a forecast request)"],
  ["The booking tool", "Its own Meta pixel integration, firing Schedule on a booked walkthrough", "ScoreApp does not see bookings made in another tool"],
  ["Settings, Tracking, Custom Scripts (head)", "Your cookie consent tool's script (for example Cookiebot or OneTrust). Mark scoreapp_session and XSRF-TOKEN essential; _score non-essential; the Meta pixel marketing", "The funnel's rule: no tracking before consent, none under Global Privacy Control"],
  ["Account, Domains", "A custom domain: [[TBD: for example score.roomiq.io]]", "Links, emails and the pixel's URL rule use it"],
  ["Account, Domains: sender", "[[TBD: the verified sender]]", "The results email comes from RoomIQ, not scoreappmail"],
  ["RoomIQ's landing page and Meta page", "Set `scorecardUrl` to `https://<your scorecard domain>/questions` (or the default page)", "Their score buttons then open the quiz"]
])}`);

/* ---------------------------------------------------------------- stage 8 */
const personaRows = PERSONAS.map((p) => {
  const v = scoreAppView(p);
  const ans = HERO_STEPS.map((s) => `${N(s)}: ${label(s, p.answers[s.key])}`).join("; ");
  const fix = v.lowTier.band === "high" ? `none (every area Advanced): "${SC.bottleneckLines.none}"` : `${areaName(v.lowest)}${v.ev.bottleneck.primary !== v.lowest ? ` (the funnel's own fix-first is ${areaName(v.ev.bottleneck.primary)}, through the cascade; the Room Mix or Reserves text says so)` : ""}`;
  const first = v.tier.key === "beginner" ? RESULTS.report.h3 : v.tier.key === "advanced" ? RESULTS.cta.call.h3 : v.covered ? RESULTS.cta.forecast.h3 : RESULTS.cta.market.h3;
  return [p.name, ans, `${v.ev.score}, ${v.tier.label}`, areas.map((a) => `${a.name} ${v.scores[a.key]}`).join(", "), fix, v.lease.lines.join(" "), `First step: ${first}. Market card: ${v.covered ? RESULTS.cta.forecast.h3 : RESULTS.cta.market.h3}. City rule: Market: ${label(G2, p.answers.market)}`];
});
H(`## Stage 8. Test in draft mode, then go live

Keep **Draft mode** on (Settings, General) and take the scorecard once per persona, with an email you can read. Each
result must match this table, which was computed by the funnel's own scoring code.

${table(["Persona", "Answers (question: answer)", "Overall, tier", "Category scores", "Fix first (section 4)", "Your first six months (section 3)", "Sections 6 to 8"], personaRows)}
For each persona also check: the tier's versions of sections 2 and 7; each category card's version; the checks section
for the persona's market; the PDF opens from the results page and from the email, with the right tier versions and the
right highest and lowest pages.

**Go live:** fill every \`[[TBD]]\`, publish the landing pages, the results page and the PDF, turn Draft mode off, then
send one real test from a phone and watch Events Manager's test events.

## Appendix A. Not carried over

${table(["Feature", "Why", "If you want it later"], [
  ["The deepener (12 optional questions) and the sharper report", "One question flow per scorecard; adding them to the main flow makes 22 questions", "A second scorecard, \"Sharpen your report\", linked from the results page"],
  ["The six-month strip", "No per-answer graphics", "None needed: the Smart Section says the same"],
  ["Answer-specific fix-first lines (a calculator rent, a divided rent, an assumed vacancy rate)", "Personalised by category, not by answer", "Audiences on question 3's and 4's answers, one section each"],
  ["The checklist questions on zoning and financing, and the checks' status", "They were deepener questions", "Two more questions in the main flow, unscored"],
  ["The walkthrough's built-in form", "ScoreApp books through a calendar tool", "Already covered by the booking tool"],
  ["Per-lead notes, a checker's name on the cover, the Supabase admin", "ScoreApp's own leads area replaces them", "ScoreApp's Leads tab"]
])}
## Appendix B. Your first six months: the exact text for every answer combination

What the funnel shows for each combination of questions 8, 9 and 10. Check the Smart Section against any row.

${table(["Q8 monthly cost", "Q9 lease-up", "Q10 reserves", "Variant", "Exact text"], G3.options.flatMap((c) => G4.options.flatMap((f) => G5.options.map((r) => { const x = leaseUp({ carry: c.v, fillmonths: f.v, reserves: r.v }); return [c.label, f.label, r.label, KIND_NAME[x.kind], x.lines.join(" / ")]; }))))}
## Appendix C. ScoreApp sources read

ScoreApp Help Centre (support.scoreapp.com), read on ${DATE}: Using the AI Builder (103); Creating a Results Page with the
AI Builder (247); AI Generated Result Sections, Smart Sections (216); Understanding AI Credits (241); ScoreApp AI Tools,
what data they access (244); Connecting ScoreApp to Claude and ChatGPT, MCP (239); Adding and Editing Score Tiers (19);
Using Score Tiers to Display Dynamic Content (145); Using Categories and Category Scores (146); Assigning Points to
Answers (144); Highest-Scoring Category and Personality-Style Quizzes (147); Creating your Results Page (90); Audiences
(201); Using End Logic (203); PDF Reports Overview (88); Configuring and Editing the Results Email (73); Answer Insights
Sections (237); The Scorecard Lead Form (69); Customise Lead Form Position and Appearance (186); Creating a Landing Page
(68); Multiple Landing Pages (199); Skipping Landing Page (159); Facebook and Meta Pixel Tracking and Events (100); Google
Tag Manager Custom Events (112); Webhooks Integration Guide (101); Adding Calendly to the Results Page (78); Adding a
Download PDF Button (227); What cookies ScoreApp uses (154); Pricing and Managing Your Plan (155). ScoreApp's reference
for AI assistants: www.scoreapp.com/llms-full.txt.

Two things the help centre does not document, so this brief does not rely on them: merge fields for answers inside page
text, and the exact list of merge fields in the results email. Where they would help, the brief gives a fallback.
`);

const doc = out.join("\n");
if (/[\u2013\u2014]/.test(doc)) throw new Error("scoreapp-brief: an em or en dash slipped into the brief");
if (process.argv.includes("--check")) {
  // npm test: the committed brief must match what the content says now
  const same = existsSync(OUT) && readFileSync(OUT, "utf8") === doc;
  console.log(same ? "scoreapp-brief --check: the brief matches the content" : "scoreapp-brief --check: the brief is stale, run node tools/scoreapp-brief.mjs");
  process.exit(same ? 0 : 1);
}
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, doc);
console.log(`scoreapp-brief: ${path.relative(ROOT, OUT)} written (${doc.split("\n").length} lines)`);
