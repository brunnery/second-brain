/* ================================================================
   CARDIO PLANNER + CALORIE ESTIMATES (pure, unit-tested)
   ================================================================ */
import { CARDIO_TYPES, CARDIO_WORKOUTS, INTENTS } from "../data/cardio.js";

/* weekly mix of intents per phase, adjusted by goal */
const MIX = {
  hypertrophy: { base: ["z2", "z2", "interval"], cut: ["z2", "z2", "z2", "interval"], bulk: ["z2", "interval"], maintain: ["z2", "interval"] },
  strength: { base: ["z2", "z2"], cut: ["z2", "z2", "z2"], bulk: ["z2"] },
  conditioning: { base: ["interval", "z2", "tempo", "sprint", "z2"], bulk: ["interval", "z2", "tempo", "z2"] },
  hybrid: { base: ["interval", "z2", "tempo", "z2"], cut: ["interval", "z2", "tempo", "z2", "z2"], bulk: ["interval", "z2", "tempo"] },
};

const Z2_MIN = { bulk: 25, leanBulk: 30, recomp: 35, cut: 40, maintain: 30 };
const HARD_TYPES = ["airBike", "rower", "bike", "stairmaster", "run", "elliptical", "inclineWalk"];
const EASY_TYPES = ["inclineWalk", "stairmaster", "bike", "rower", "elliptical", "run", "walk", "airBike", "swim"];
const LEG_SAFE = ["bike", "rower", "inclineWalk", "elliptical", "walk", "airBike", "swim"];

export function weeklyIntents(phase, goal, override) {
  const m = MIX[phase] || MIX.hypertrophy;
  let list = [...(m[goal] || (goal === "leanBulk" || goal === "recomp" ? m.base : m.base))];
  if (override != null) {
    while (list.length < override) list.push("z2");
    list = list.slice(0, override);
  }
  return list;
}

const rotate = (arr, n) => (arr.length ? arr.map((_, i) => arr[(i + n) % arr.length]) : arr);

export function pickWorkout(type, intent, minutes, exclude = []) {
  const pool = CARDIO_WORKOUTS.filter((w) => w.type === type && w.intent === intent && !exclude.includes(w.id));
  if (!pool.length) return null;
  return [...pool].sort((a, b) => Math.abs(a.minutes - minutes) - Math.abs(b.minutes - minutes))[0];
}

/**
 * Build this week's cardio slots.
 * liftDays: [{ weekday, leg: bool }]
 * returns [{ weekday, intent, type, workoutId, minutes }]
 */
export function planCardio({ phase, goal, prefs, perWeek, liftDays = [], seed = 0 }) {
  const intents = weeklyIntents(phase, goal, perWeek);
  const usable = prefs.filter((t) => CARDIO_TYPES[t]);
  const prefsOk = usable.length ? usable : ["bike", "inclineWalk"];
  const isLeg = (d) => liftDays.some((l) => l.weekday === d && l.leg);
  const isLift = (d) => liftDays.some((l) => l.weekday === d);
  const taken = new Map(); // weekday -> count

  const hardDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !isLeg(d) && !isLeg((d + 1) % 7));
  const easyOrder = [
    ...[0, 1, 2, 3, 4, 5, 6].filter((d) => !isLift(d)),
    ...[0, 1, 2, 3, 4, 5, 6].filter((d) => isLift(d) && !isLeg(d)),
    ...[0, 1, 2, 3, 4, 5, 6].filter((d) => isLeg(d)),
  ];

  const sorted = [...intents].sort((a, b) => (a === "z2") - (b === "z2")); // hard first
  const hardTypes = rotate(HARD_TYPES.filter((t) => prefsOk.includes(t)), seed);
  const easyTypes = rotate(EASY_TYPES.filter((t) => prefsOk.includes(t)), seed);
  let h = 0, e = 0;
  const out = [];

  for (const intent of sorted) {
    const hard = intent !== "z2" && intent !== "recovery";
    const pool = hard ? hardDays.filter((d) => !taken.get(d)) : easyOrder.filter((d) => !taken.get(d));
    const spread = (list) => {
      if (!list.length) return null;
      const used = out.map((o) => o.weekday);
      return [...list].sort((a, b) => {
        const da = Math.min(...used.map((u) => Math.min(Math.abs(u - a), 7 - Math.abs(u - a))), 7);
        const db = Math.min(...used.map((u) => Math.min(Math.abs(u - b), 7 - Math.abs(u - b))), 7);
        return db - da;
      })[0];
    };
    let day = spread(pool);
    if (day == null) day = easyOrder.find((d) => (taken.get(d) || 0) < 2) ?? 6;
    taken.set(day, (taken.get(day) || 0) + 1);

    const typeList = hard ? hardTypes : easyTypes;
    let types = typeList.length ? typeList : prefsOk;
    if (isLeg(day)) types = types.filter((t) => LEG_SAFE.includes(t)).concat(types.filter((t) => !LEG_SAFE.includes(t)));
    const minutes = intent === "z2" ? Z2_MIN[goal] || 30 : 25;
    let chosen = null;
    for (let k = 0; k < types.length && !chosen; k++) {
      const type = types[(hard ? h : e) % types.length];
      if (hard) h++; else e++;
      const w = pickWorkout(type, intent, minutes) || (intent === "sprint" ? pickWorkout(type, "interval", minutes) : null) ||
        (intent === "tempo" ? pickWorkout(type, "interval", minutes) : null);
      if (w) chosen = w;
    }
    if (!chosen) chosen = CARDIO_WORKOUTS.find((w) => w.intent === intent) || CARDIO_WORKOUTS[0];
    out.push({ weekday: day, intent, type: chosen.type, workoutId: chosen.id, minutes: chosen.minutes });
  }
  return out.sort((a, b) => a.weekday - b.weekday);
}

/** Another workout with the same intent from the user's machines. */
export function shuffleWorkout(current, prefs, intent) {
  const pool = CARDIO_WORKOUTS.filter((w) => prefs.includes(w.type) && (w.intent === intent || (intent === "sprint" && w.intent === "interval")));
  if (!pool.length) return current;
  const i = pool.findIndex((w) => w.id === current);
  return pool[(i + 1) % pool.length].id;
}

/* ---------- calories ---------- */
const kcalFromVO2 = (vo2, kg, min) => (vo2 * kg / 1000) * 5 * min; // ~5 kcal per litre O2

export function estimateKcal(entry, bodyKg = 80) {
  const min = entry.minutes || 0;
  if (!min) return 0;
  const intensity = entry.intensity || "moderate";
  const type = CARDIO_TYPES[entry.type] || CARDIO_TYPES.other;

  if (entry.calories) return Math.round(entry.calories); // machine display (air bike etc.)
  if ((entry.type === "inclineWalk" || entry.type === "walk") && entry.speed) {
    const v = (entry.speed * 1000) / 60;
    const g = (entry.incline || 0) / 100;
    return Math.round(kcalFromVO2(0.1 * v + 1.8 * v * g + 3.5, bodyKg, min));
  }
  if (entry.type === "run" && entry.distance) {
    const v = entry.distance / min; // m per min
    const g = (entry.incline || 0) / 100;
    return Math.round(kcalFromVO2(0.2 * v + 0.9 * v * g + 3.5, bodyKg, min));
  }
  if (entry.type === "bike" && entry.watts) {
    return Math.round(kcalFromVO2((1.8 * entry.watts * 6.12) / bodyKg + 7, bodyKg, min));
  }
  if (entry.type === "rower" && entry.watts) {
    const met = entry.watts >= 200 ? 14 : entry.watts >= 150 ? 11 : entry.watts >= 100 ? 7.5 : 5;
    return Math.round(met * bodyKg * (min / 60));
  }
  const met = type.met[intensity] || type.met.moderate;
  return Math.round(met * bodyKg * (min / 60));
}

export const intensityOfIntent = (intent) => INTENTS[intent]?.intensity || "moderate";
