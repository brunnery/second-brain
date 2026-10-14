/* ================================================================
   NUTRITION LABEL PARSER — turns OCR text of a nutrition table into
   kcal / protein / carbs / fat. Pure, no DOM. Handles the usual Swiss
   labels (German / French / Italian / English, often bilingual):

     Energie / Énergie   1550 kJ (370 kcal)
     Fett / Matières grasses   12 g
       davon gesättigte Fettsäuren   3.5 g
     Kohlenhydrate / Glucides   50 g
     Eiweiss / Protéines   10 g

   The first number on a line is taken, which on two-column tables is
   the "per 100 g" column. The user always checks the result.
   ================================================================ */

const KEYS = {
  kcal: /energie|énergie|energia|energy|brennwert|valeur énergétique|kcal/,
  f: /\bfett\b|fett\s|matières? grasses|matieres? grasses|grassi|\bfat\b|lipides|graisses/,
  c: /kohlen\s?hydrate?|glucides|carboidrati|carbohydrate|carbs/,
  p: /eiwei(ss|ß|b)|prot[eé]ines?|proteine|protein/,
};
// sub-rows we must not mistake for the main value
const SUB = /davon|dont|di cui|of which|gesättigt|gesattigt|saturé|sature|saturi|saturates|zucker|sucres|zuccheri|sugars|einfach|mehrfach|ungesättigt|polyols|stärke|amidon/;

/** Normalise typical OCR noise without touching the words we look for. */
export function cleanOcr(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[|]/g, " ")
    // "1O" → "10", "O,5" → "0,5", "l2" → "12" when inside a number
    .replace(/(?<=\d)[o](?=[\d\s,.gk]|$)/g, "0")
    .replace(/(?<=\s|^)o(?=[,.]\d)/g, "0")
    .replace(/(?<=\d)[il](?=\d)/g, "1")
    .replace(/[ \t]+/g, " ");
}

const NUM = /(<\s*)?(\d{1,4}(?:[.,]\d{1,2})?)/g;
const toNum = (s) => parseFloat(s.replace(",", "."));

/** Numbers on a line, in order. "<0.5" counts as 0.5. */
function numbersIn(s) {
  const out = [];
  for (const m of s.matchAll(NUM)) out.push({ v: toNum(m[2]), at: m.index, end: m.index + m[0].length });
  return out;
}

/** Remove "100 g" / "100g" / "100 ml" basis mentions so they are not read as values. */
const stripBasis = (s) => s.replace(/(pro|per|pour|par|je|für)?\s*100\s?(g|ml)\b/g, " ");

/**
 * Possible gram values for a nutrient row, most likely first. OCR often reads the unit "g" as a
 * trailing "9" and drops the decimal point ("12g" → "129", "3.5g" → "359"), so for a bare number
 * ending in 9 the readings without it are offered too; the kcal check later picks the right one.
 */
function gramsFrom(line) {
  const s = stripBasis(line);
  const first = [...s.matchAll(NUM)][0];
  if (!first) return [];
  const raw = first[2];
  const v = toNum(raw);
  const hasUnit = /^\s*(g|mg|ml)\b/.test(s.slice(first.index + first[0].length));
  const opts = [];
  if (/^\d{2,4}$/.test(raw) && raw.endsWith("9")) {
    // "12 g" can also come out as "129g" (the g read twice), so this applies with a unit too
    const base = raw.slice(0, -1);
    opts.push(toNum(base));
    if (base.length >= 2) opts.push(toNum(`${base.slice(0, -1)}.${base.slice(-1)}`));
    if (v <= 100) opts.splice(hasUnit || v <= 50 ? 0 : 1, 0, v); // keep the literal reading in the running
  } else if (v <= 100) opts.push(v);
  return [...new Set(opts.filter((x) => x <= 100))];
}

/** Pick one reading per nutrient: the combination that best fits the stated kcal (and ≤ 100 g in total). */
function bestFit(cands, kcal) {
  const pick = (k) => cands[k]?.[0] ?? null;
  if (kcal == null || ["p", "c", "f"].every((k) => (cands[k]?.length || 0) <= 1)) return { p: pick("p"), c: pick("c"), f: pick("f") };
  let best = null;
  for (const p of cands.p?.length ? cands.p : [null])
    for (const c of cands.c?.length ? cands.c : [null])
      for (const f of cands.f?.length ? cands.f : [null]) {
        const tot = (p || 0) + (c || 0) + (f || 0);
        const err = Math.abs((p || 0) * 4 + (c || 0) * 4 + (f || 0) * 9 - kcal) + (tot > 100.5 ? 1e6 : 0);
        if (!best || err < best.err) best = { p, c, f, err };
      }
  return best;
}

/** kcal from an energy row (+ the next line, where kcal often wraps): explicit kcal, else kJ, else a kJ/kcal number pair. */
function kcalFrom(line, next = "") {
  for (const s of [stripBasis(line), stripBasis(next)]) {
    const kcal = s.match(/(\d{1,4}(?:[.,]\d)?)\s*kcal/);
    if (kcal) return toNum(kcal[1]);
  }
  const kj = stripBasis(line).match(/(\d{2,4}(?:[.,]\d)?)\s*k\s?j/);
  if (kj) return Math.round(toNum(kj[1]) / 4.184);
  // unit-less columns like "energie 1550 370": second number ≈ first / 4.184
  const nums = numbersIn(stripBasis(line)).map((n) => n.v);
  for (let i = 0; i < nums.length - 1; i++) if (nums[i + 1] > 0 && Math.abs(nums[i] / 4.184 - nums[i + 1]) / nums[i + 1] < 0.03) return nums[i + 1];
  return null;
}

/**
 * Parse OCR text of a nutrition table.
 * @returns {{ kcal, p, c, f, basis: "100g"|"portion", portionG, found: string[], warning: string|null }}
 */
export function parseLabel(text) {
  const lines = cleanOcr(text).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out = { kcal: null, p: null, c: null, f: null };
  const cands = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || "";
    if (out.kcal == null && KEYS.kcal.test(line)) {
      out.kcal = kcalFrom(line, next);
    }
    if (SUB.test(line)) continue;
    for (const k of ["f", "c", "p"]) {
      if (cands[k]?.length) continue;
      const m = line.match(KEYS[k]);
      if (!m) continue;
      // read after the keyword; fall back to the next line when the value wrapped
      const after = gramsFrom(line.slice(m.index + m[0].length));
      const nextIsRow = SUB.test(next) || Object.values(KEYS).some((r) => r.test(next));
      cands[k] = after.length ? after : nextIsRow ? [] : gramsFrom(next);
    }
  }
  Object.assign(out, bestFit(cands, out.kcal));
  delete out.err;

  const found = Object.keys(out).filter((k) => out[k] != null);
  const est = (out.p || 0) * 4 + (out.c || 0) * 4 + (out.f || 0) * 9;
  if (out.kcal == null && out.p != null && out.c != null && out.f != null) out.kcal = Math.round(est);

  const all = cleanOcr(text);
  const portion = all.match(/(?:portion|serving|pro stück|par pièce)[^\d\n]{0,12}(\d{1,4})\s?(g|ml)/);
  const has100 = /100\s?(g|ml)/.test(all);

  return {
    ...out,
    basis: has100 || !portion ? "100g" : "portion",
    portionG: portion ? toNum(portion[1]) : null,
    found,
    warning: labelWarning(out),
  };
}

/** Plausibility check the user sees next to the numbers. */
export function labelWarning({ kcal, p, c, f }) {
  if ([kcal, p, c, f].some((v) => v == null)) return "Not all values found — please fill in the empty ones.";
  if (p + c + f > 100.5) return "Protein + carbs + fat add up to more than 100 g — one value is probably misread.";
  const est = p * 4 + c * 4 + f * 9;
  if (kcal > 0 && Math.abs(est - kcal) / kcal > 0.2) return `The macros give ~${Math.round(est)} kcal, the label says ${Math.round(kcal)} — please check.`;
  return null;
}

/** Macros for an amount eaten. `per` = grams the values refer to (100 or the portion size). */
export function labelMacros(v, grams, per = 100) {
  const k = (grams || 0) / (per || 100);
  const r = (x, d = 1) => Math.round((x || 0) * k * 10 ** d) / 10 ** d;
  return { kcal: r(v.kcal, 0), p: r(v.p), c: r(v.c), f: r(v.f) };
}
