// The quiz's markup: one question per step, a tap answers, contact details last. One set of string templates for the
// build (the hero's ten steps are in the page's HTML, so the first question shows before any script runs) and for the
// browser (the deepener's steps, which depend on the hero's answers). Inlined into the page's script by the build:
// keep it to `export function` declarations with no imports.

export function escHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function useIcon(id, cls) {
  return `<svg class="${cls || "ic"}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

/** The notice at collection under a form, naming its own button. links: { terms, privacy, choices }. */
export function legalNoteHtml(legal, links, button, withMeta) {
  const a = (href, label) => `<a href="${escHtml(href)}" target="_blank" rel="noopener">${escHtml(label)}<span class="sr-only"> ${escHtml(legal.newTab)}</span></a>`;
  let out = escHtml(legal.notice).replace("{button}", `“${escHtml(button)}”`).replace("{terms}", a(links.terms, legal.terms)).replace("{privacy}", a(links.privacy, legal.privacy));
  if (withMeta) out += " " + escHtml(legal.noticeMeta).replace("{choices}", a(links.choices, legal.choices));
  return `<p class="legal-note">${out}</p>`;
}

function nav(ui, i, last, button) {
  return `<p class="err" role="alert"></p><div class="gc-nav"><button type="button" class="gc-back"${i === 0 ? " hidden" : ""}>${useIcon("i-back")}${escHtml(ui.back)}</button>` +
    (last ? `<button type="submit" class="btn btn-primary gc-next gc-submit">${escHtml(button)}</button>` : `<button type="button" class="btn btn-primary gc-next">${escHtml(ui.next)}${useIcon("i-arrow")}</button>`) + `</div>`;
}

/** One step. step: a choice ({ key, q, options, layout }), a slider over the options ({ type: "scale", unsure, format }),
 *  typed words matched to an option ({ type: "text", textKey, undecided, placeholder }) or fields ({ key, q, fields,
 *  choice, consent }). */
export function stepHtml(step, i, total, ui, opts) {
  const hidden = i === 0 ? "" : " hidden";
  const id = step.id || step.key;
  const last = i === total - 1;
  const button = (opts && opts.button) || step.button || ui.next;
  const head = `<legend class="gc-q" tabindex="-1">${escHtml(step.q)}</legend>`;
  if (step.type === "fields") {
    let body = "";
    for (const f of step.fields) {
      const help = f.help ? `<p class="help" id="h-${f.name}">${escHtml(f.help)}</p>` : "";
      body += `<div class="field"><label for="f-${f.name}">${escHtml(f.label)}</label>${help}<input id="f-${f.name}" name="${f.name}" type="${f.type || "text"}"` +
        `${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ""}${f.inputmode ? ` inputmode="${f.inputmode}"` : ""}${f.max ? ` maxlength="${f.max}"` : ""}` +
        `${f.required ? " required" : ""}${f.help ? ` aria-describedby="h-${f.name}"` : ""}></div>`;
    }
    if (step.choice) {
      body += `<div><span class="group-l" id="l-${step.choice.key}">${escHtml(step.choice.label)}</span><div class="chips" role="radiogroup" aria-labelledby="l-${step.choice.key}">` +
        step.choice.options.map((o) => `<label class="chip-opt"><input type="radio" name="${step.choice.key}" value="${escHtml(o.v)}"><span>${escHtml(o.label)}</span></label>`).join("") + `</div></div>`;
    }
    if (step.consent) {
      body += `<label class="consent"><input type="checkbox" name="${step.consent.name}"${step.consent.required ? " required" : ""}><span>${escHtml(step.consent.label)}</span></label>`;
    }
    if (last && opts && opts.legalHtml) body += opts.legalHtml;
    return `<fieldset class="gc-step" data-step="${i}" data-kind="fields" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}${body}${nav(ui, i, last, button)}</fieldset>`;
  }
  // The option that sits outside a slider or a typed answer ("Not sure", "Not decided yet"): a chip under it
  const altChip = (o) => (o ? `<div class="gc-alt"><label class="gc-alt-opt"><input type="checkbox" name="${escHtml(step.key)}Alt" value="${escHtml(o.v)}"><span>${escHtml(o.label)}</span></label></div>` : "");
  if (step.type === "text") {
    const tk = step.textKey;
    const named = step.options.filter((o) => o.aliases);
    const list = named.length ? `<datalist id="dl-${tk}">${named.map((o) => `<option value="${escHtml(o.label)}"></option>`).join("")}</datalist>` : "";
    const help = step.help ? `<p class="help" id="h-${tk}">${escHtml(step.help)}</p>` : "";
    const body = `<div class="field gc-text"><input id="f-${tk}" name="${tk}" type="text" autocomplete="off" spellcheck="false"${named.length ? ` list="dl-${tk}"` : ""}` +
      `${step.max ? ` maxlength="${step.max}"` : ""}${step.placeholder ? ` placeholder="${escHtml(step.placeholder)}"` : ""} aria-label="${escHtml(step.q)}"${step.help ? ` aria-describedby="h-${tk}"` : ""}>${help}${list}</div>` +
      altChip(step.options.find((o) => o.v === step.undecided));
    return `<fieldset class="gc-step" data-step="${i}" data-kind="text" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}${body}${nav(ui, i, last, button)}</fieldset>`;
  }
  if (step.type === "scale") {
    // A slider over the answers in order; nothing is chosen until the thumb is moved (or the chip is picked)
    const stops = step.options.filter((o) => o.v !== step.unsure);
    const mid = Math.floor((stops.length - 1) / 2);
    const data = escHtml(JSON.stringify(stops.map((o) => ({ v: o.v, label: o.label }))));
    const help = step.help ? `<p class="help gc-help" id="h-${escHtml(id)}">${escHtml(step.help)}</p>` : "";
    const body = `${help}<div class="gc-scale" data-state="unset"><p class="gc-scale-v" aria-hidden="true"><span class="gc-scale-hint">${escHtml(ui.slideHint)}</span><span class="gc-scale-label"></span></p>` +
      `<input class="gc-range" type="range" min="0" max="${stops.length - 1}" step="1" value="${mid}" style="--p:${Math.round((mid / (stops.length - 1)) * 100)}%" aria-label="${escHtml(step.q)}" aria-valuetext="${escHtml(ui.slideHint)}"` +
      ` data-opts="${data}"${step.format ? ` data-format="${escHtml(step.format)}"` : ""}${step.help ? ` aria-describedby="h-${escHtml(id)}"` : ""}>` +
      `<div class="gc-ticks" aria-hidden="true">${stops.map(() => "<i></i>").join("")}</div>` +
      `<div class="gc-ends" aria-hidden="true"><span>${escHtml(stops[0].label)}</span><span>${escHtml(stops[stops.length - 1].label)}</span></div>` +
      `<input type="hidden" name="${escHtml(step.key)}" value=""></div>${altChip(step.options.find((o) => o.v === step.unsure))}`;
    return `<fieldset class="gc-step" data-step="${i}" data-kind="scale" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}${body}${nav(ui, i, last, button)}</fieldset>`;
  }
  const grid = step.layout === "grid" ? " grid" : "";
  const options = step.options.map((o) => `<label class="gc-opt"><input type="radio" name="${escHtml(step.key)}" value="${escHtml(o.v)}"><span>${escHtml(o.label)}</span></label>`).join("");
  return `<fieldset class="gc-step" data-step="${i}" data-kind="choice" data-key="${escHtml(step.key)}" data-id="${escHtml(id)}"${hidden}>${head}<div class="gc-opts${grid}">${options}</div>${nav(ui, i, last && !(opts && opts.autoSubmit === false), button)}</fieldset>`;
}

/** The whole card. opts: { id, label, frame, frameShort, button, legalHtml, kind } */
export function quizCardHtml(steps, ui, opts) {
  const n = steps.length;
  const count = escHtml(ui.count).replace("{n}", "1").replace("{total}", String(n));
  return `<div class="gc" id="${opts.id || "quiz"}" data-quiz="${escHtml(opts.kind || "hero")}" data-total="${n}">` +
    `<div class="gc-top"><span class="gc-label">${useIcon("i-file")}${escHtml(opts.label)}</span><span class="gc-count" aria-live="polite">${count}</span></div>` +
    `<div class="gc-bar" aria-hidden="true"><i style="--p:${Math.round(100 / n)}%"></i></div>` +
    (opts.frame ? `<p class="gc-frame">${opts.frameShort ? `<span class="m-hide">${escHtml(opts.frame)}</span><span class="m-only">${escHtml(opts.frameShort)}</span>` : escHtml(opts.frame)}</p>` : "") +
    `<form class="gc-form" novalidate><div class="hp" aria-hidden="true"><label>Leave this empty<input name="hp" tabindex="-1" autocomplete="off"></label></div>` +
    steps.map((s, i) => stepHtml(s, i, n, ui, opts)).join("") + `</form></div>`;
}
