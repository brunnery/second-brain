/* ================================================================
   NUTRITION ENGINE (pure, unit-tested)
   - Energy: Mifflin-St Jeor BMR × lifestyle + planned exercise.
   - Goal adjustment from GOALS (surplus / deficit, capped).
   - Protein by goal (ISSN: 1.4–2.0 g/kg, higher in a deficit),
     fat 0.8–1.0 g/kg (≥ 20 % kcal), carbs fill the rest.
   - Meal planner: picks templates per slot and scales portions.
   ================================================================ */
import { GOALS, LIFESTYLE } from "../../profile/goals.js";
import { foodById, macrosOf, sumMacros } from "../data/foods.js";
import { MEALS, mealById, getUserMeals } from "../data/meals.js";

export const bmr = ({ sex, weightKg, heightCm, age }) =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "female" ? -161 : 5);

/**
 * weeklyExerciseKcal: net kcal from planned training per week (above resting).
 */
export function computeTargets({ sex, weightKg, heightCm, age, lifestyle, goal, weeklyExerciseKcal = 0, adjust = 0 }) {
  const g = GOALS[goal] || GOALS.maintain;
  const base = bmr({ sex, weightKg, heightCm, age }) * (LIFESTYLE[lifestyle]?.factor || 1.45);
  const tdee = base + weeklyExerciseKcal / 7;
  let delta = tdee * g.kcalPct;
  if (g.kcalCap) delta = Math.max(-g.kcalCap, Math.min(g.kcalCap, delta));
  const kcal = Math.round((tdee + delta + adjust) / 10) * 10;
  const protein = Math.round(weightKg * g.proteinPerKg);
  const fat = Math.round(Math.max(weightKg * g.fatPerKg, (kcal * 0.2) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fibre = Math.round((kcal / 1000) * 14);
  return { tdee: Math.round(tdee), kcal, protein, fat, carbs, fibre, delta: Math.round(delta + adjust) };
}

/** Net strength + cardio kcal for a week. */
export function weeklyExerciseKcal({ weightKg, liftSessions, sessionMin, cardioSlots = [], cardioKcalFn }) {
  const liftNet = liftSessions * (5.0 - 1) * weightKg * (sessionMin / 60); // resistance training ~5 MET
  const cardio = cardioSlots.reduce((a, c) => a + Math.max(0, cardioKcalFn(c) - 1 * weightKg * (c.minutes / 60)), 0);
  return Math.round(liftNet + cardio);
}

/* ---------- weight trend & check-in ---------- */
export function movingAverage(points, window = 7) {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return { ...p, avg: slice.reduce((a, x) => a + x.kg, 0) / slice.length };
  });
}

/** % body-weight change per week over the last `days`, from 7-day averages. */
export function weeklyRate(weights, days = 21) {
  if (weights.length < 4) return null;
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const avg = movingAverage(sorted);
  const last = avg[avg.length - 1];
  const cutoff = new Date(last.date);
  cutoff.setDate(cutoff.getDate() - days);
  const first = avg.find((p) => new Date(p.date) >= cutoff) || avg[0];
  const spanDays = (new Date(last.date) - new Date(first.date)) / 86400000;
  if (spanDays < 10) return null;
  return ((last.avg - first.avg) / first.avg) * 100 * (7 / spanDays);
}

export function checkIn(goal, rate) {
  if (rate == null) return null;
  const [lo, hi] = (GOALS[goal] || GOALS.maintain).ratePctPerWeek;
  if (rate < lo) return { action: "up", kcal: 150, text: `You're changing ${rate.toFixed(2)} %/week — below the ${lo}–${hi} % target. Add ~150 kcal/day.` };
  if (rate > hi) return { action: "down", kcal: -150, text: `You're changing ${rate.toFixed(2)} %/week — above the ${lo}–${hi} % target. Remove ~150 kcal/day.` };
  return { action: "ok", kcal: 0, text: `On track: ${rate.toFixed(2)} %/week (target ${lo} to ${hi} %).` };
}

/* ---------- meals ----------
   A planned meal has two portion factors:
   pf → protein sources (meat, fish, dairy, legumes, protein powder)
   cf → everything else that is scalable (carbs, fats)
   Fixed items (veg, sauces) never change. This lets the planner hit
   calories with carbs while keeping protein close to target. */
const PROTEIN_CATS = ["protein", "dairy", "legumes", "supps"];
const isProteinItem = (id, customFoods) => PROTEIN_CATS.includes(foodById(id, customFoods)?.cat);

export function itemGrams([id, g, scale], pf = 1, cf = 1, customFoods = []) {
  if (!scale) return g;
  return g * (isProteinItem(id, customFoods) ? pf : cf);
}

export function mealMacros(meal, pf = 1, cf = 1, customFoods = []) {
  if (!meal) return sumMacros([]);
  return sumMacros(meal.items.map((it) => macrosOf(foodById(it[0], customFoods), itemGrams(it, pf, cf, customFoods))));
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r05 = (v) => Math.round(v * 20) / 20;

/** Find portion factors so the meal hits `kcal` and roughly `protein`. */
export function scaleFor(meal, kcal, protein = null, customFoods = []) {
  const part = (pred) => sumMacros(meal.items.filter(pred).map(([id, g]) => macrosOf(foodById(id, customFoods), g)));
  const fixed = part((i) => !i[2]);
  const P = part((i) => i[2] && isProteinItem(i[0], customFoods));
  const C = part((i) => i[2] && !isProteinItem(i[0], customFoods));
  let pf = 1, cf = 1;
  if (protein != null && P.p > 0) pf = clamp((protein - fixed.p - C.p) / P.p, 0.6, 1.6);
  if (C.kcal > 0) cf = clamp((kcal - fixed.kcal - pf * P.kcal) / C.kcal, 0.4, 2.2);
  else if (P.kcal > 0) pf = clamp((kcal - fixed.kcal) / P.kcal, 0.5, 2.2);
  // if carbs hit a limit, let protein absorb the rest
  const total = fixed.kcal + pf * P.kcal + cf * C.kcal;
  if (Math.abs(total - kcal) > 80 && P.kcal > 0) pf = clamp((kcal - fixed.kcal - cf * C.kcal) / P.kcal, 0.5, 1.8);
  return { pf: r05(pf), cf: r05(cf) };
}

const SPLIT = { breakfast: 0.25, lunch: 0.3, dinner: 0.3, snack: 0.15 };
/* With "my meals" the three main meals cover ~85 % of the day; the rest is a computed top-up
   (shake, nuts, oats …) so portions stay realistic. */
export const MAIN_SHARE = { breakfast: 0.23, lunch: 0.31, dinner: 0.31 };
export const MAIN_SLOTS = ["breakfast", "lunch", "dinner"];

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const density = (meal) => { const m = mealMacros(meal); return m.kcal ? m.p / m.kcal : 0; };

/**
 * Build a 7-day meal plan.
 * opts: { targets, seed, mealPrep (repeat lunches/dinners in 3-day blocks), maxCost (1–3),
 *         source: "mine" (own meals + top-up) | "mix" | "ideas" (meal library + snacks),
 *         exclude: [mealId], prev: previous plan (locked meals are kept) }
 */
export function planWeek({ targets, seed = 1, mealPrep = true, maxCost = 2, source = "mine", exclude = [], prev = null }) {
  const rand = rng(seed);
  const tgtDensity = targets.protein / targets.kcal;
  const mine = getUserMeals();
  const useMine = source !== "ideas" && mine.length > 0;
  const snacks = useMine && source === "mine" ? 0 : targets.kcal >= 2900 ? 2 : 1;
  const slots = ["breakfast", "lunch", "dinner", ...Array(snacks).fill("snack")];
  const library = (slot) => MEALS.filter((x) => x.slots.includes(slot) && x.cost <= maxCost && !exclude.includes(x.id) && x.id !== "mensa");
  const own = (slot) => mine.filter((x) => x.slots.includes(slot) && !exclude.includes(x.id));
  const pool = (slot) => {
    if (source === "mine" && own(slot).length) return own(slot);
    if (source === "mix" && own(slot).length) return rand() < 0.65 ? own(slot) : library(slot);
    return library(slot);
  };
  const pick = (slot, avoid = [], batchOnly = false) => {
    const base = pool(slot);
    let list = base.filter((x) => !avoid.includes(x.id) && (!batchOnly || x.batch));
    if (!list.length) list = base.filter((x) => !avoid.includes(x.id));
    if (!list.length) list = base;
    // prefer meals whose protein density matches the day's target density
    const ranked = [...list].sort((a, b) => Math.abs(density(a) - tgtDensity) - Math.abs(density(b) - tgtDensity));
    const top = ranked.slice(0, Math.max(3, Math.ceil(ranked.length * 0.6)));
    return top[Math.floor(rand() * top.length)];
  };
  const shareOf = (slot) => (snacks === 0 ? MAIN_SHARE[slot] : slot === "snack" ? SPLIT.snack / snacks : SPLIT[slot]);

  const blockChoice = {};
  const days = [];
  for (let d = 0; d < 7; d++) {
    const keep = prev?.days?.[d]?.meals || [];
    const used = [];
    // fill slots in order; whatever one meal can't take (e.g. a fixed breakfast) moves to the next ones
    let leftK = targets.kcal * slots.reduce((a, sl) => a + shareOf(sl), 0);
    let leftP = targets.protein * slots.reduce((a, sl) => a + shareOf(sl), 0);
    let leftShare = slots.reduce((a, sl) => a + shareOf(sl), 0);
    const meals = slots.map((slot, si) => {
      const locked = keep.find((k) => k.si === si && k.slot === slot && k.locked);
      let entry;
      if (locked) {
        used.push(locked.mealId);
        entry = locked;
      } else {
        let meal;
        const block = d < 3 ? 0 : d < 6 ? 1 : 2;
        if (mealPrep && (slot === "lunch" || slot === "dinner") && block < 2) {
          const key = `${slot}-${block}`;
          if (!blockChoice[key]) blockChoice[key] = pick(slot, [...used, ...Object.values(blockChoice)], true).id;
          meal = mealById(blockChoice[key]);
        } else {
          meal = pick(slot, used);
        }
        used.push(meal.id);
        const part = shareOf(slot) / leftShare;
        entry = { si, slot, mealId: meal.id, ...scaleFor(meal, leftK * part, leftP * part), locked: false };
      }
      const m = mealMacros(mealById(entry.mealId), entry.pf, entry.cf);
      leftK -= m.kcal; leftP -= m.p; leftShare -= shareOf(slot);
      return entry;
    });
    days.push({ meals: snacks ? balanceProtein(meals, targets) : meals });
  }
  return { generatedAt: new Date().toISOString(), seed, mealPrep, maxCost, source, days };
}

/** Swap unlocked snacks so the day's protein lands within ~±15 % of target. */
function balanceProtein(meals, targets) {
  const total = () => sumMacros(meals.map((x) => mealMacros(mealById(x.mealId), x.pf, x.cf)));
  const snackIdx = meals.map((x, i) => (x.slot === "snack" && !x.locked ? i : -1)).filter((i) => i >= 0);
  const snackPool = MEALS.filter((x) => x.slots.includes("snack") && x.cost <= 2).sort((a, b) => density(a) - density(b));
  for (const i of snackIdx) {
    const t = total();
    const ratio = t.p / targets.protein;
    if (ratio >= 0.9 && ratio <= 1.15) break;
    const kcal = mealMacros(mealById(meals[i].mealId), meals[i].pf, meals[i].cf).kcal;
    const pick = ratio > 1.15 ? snackPool[0] : snackPool[snackPool.length - 1];
    if (pick.id === meals[i].mealId) continue;
    const sc = scaleFor(pick, kcal);
    meals[i] = { ...meals[i], mealId: pick.id, ...sc };
  }
  return meals;
}

/**
 * What to add to close the gap after the main meals.
 * remaining: { kcal, p, c, f } still open. Returns [{ foodId, grams, why }] (may be empty).
 * Order: protein first (whey), then fat (nuts), then carbs (oats / banana).
 */
export function topUp(remaining) {
  const out = [];
  let r = { ...remaining };
  const add = (foodId, grams, why) => {
    const g = Math.round(grams / 5) * 5;
    if (g <= 0) return;
    const m = macrosOf(foodById(foodId), g);
    out.push({ foodId, grams: g, why, ...m });
    r = { kcal: r.kcal - m.kcal, p: r.p - m.p, c: r.c - m.c, f: r.f - m.f };
  };
  if (r.p > 12) add("whey", Math.min(60, r.p / 0.78), "protein");
  if (r.p > 12 && r.kcal > 250) add("milk-2", Math.min(400, (r.p / 3.4) * 100), "protein + carbs");
  if (r.f > 8 && r.kcal > 120) add("mixed-nuts", Math.min(60, r.f / 0.54), "fat");
  if (r.c > 25 && r.kcal > 150) {
    if (r.c > 60) add("oats", Math.min(120, r.c / 0.59), "carbs");
    else add("banana", Math.min(240, r.c / 0.21), "carbs");
  }
  return out;
}

/** kcal/protein for the next main meal, from what is still open today (slot-aware). */
export function nextMealTarget(targets, eaten, mainsLeft, slot = "lunch", openSlots = null) {
  const open = openSlots && openSlots.length ? openSlots : MAIN_SLOTS.slice(3 - Math.max(1, mainsLeft));
  const total = open.reduce((a, s) => a + (MAIN_SHARE[s] || 0.25), 0) || 1;
  const part = (MAIN_SHARE[slot] || 0.25) / total;
  const kcal = Math.max(300, (targets.kcal * 0.85 - eaten.kcal) * part);
  const protein = Math.max(20, (targets.protein * 0.85 - eaten.p) * part);
  return { kcal, protein };
}

export function dayTotals(day, customFoods = []) {
  return sumMacros((day?.meals || []).map((x) => mealMacros(mealById(x.mealId), x.pf, x.cf, customFoods)));
}

/** Aggregate grams per food over selected plan days → shopping list. */
export function shoppingList(plan, dayIdxs = [0, 1, 2, 3, 4, 5, 6], customFoods = []) {
  const totals = {};
  for (const d of dayIdxs) {
    for (const x of plan?.days?.[d]?.meals || []) {
      const meal = mealById(x.mealId);
      if (!meal) continue;
      for (const it of meal.items) totals[it[0]] = (totals[it[0]] || 0) + itemGrams(it, x.pf, x.cf, customFoods);
    }
  }
  return Object.entries(totals)
    .map(([id, grams]) => ({ id, grams: Math.round(grams), food: foodById(id, customFoods) }))
    .filter((r) => r.food)
    .sort((a, b) => a.food.cat.localeCompare(b.food.cat) || a.food.name.localeCompare(b.food.name));
}
