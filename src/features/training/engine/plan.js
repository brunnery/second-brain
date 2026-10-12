/* ================================================================
   TRAINING PLAN GENERATOR (rule-based, offline)
   Inputs: profile (goal, phase, days/week, session length, back care)
   Output: an editable weekly plan. Pure functions — unit-tested.
   ================================================================ */
import { EXERCISES, exerciseById } from "../data/exercises.js";
import { SPLITS, dayTemplate, isLegDay } from "../data/splits.js";
import { PHASES, GOALS, exercisesForLength } from "../../profile/goals.js";
import { uid } from "../../../lib/uid.js";
import { today, weekStart, daysBetween } from "../../../lib/dates.js";

const HOME_EQUIP = ["dumbbell", "bodyweight", "band", "kettlebell", "other"];

/** All exercises usable for a slot, in preference order. */
export function candidatesFor(pattern, { backCare = true, role = "accessory", phase = "hypertrophy", equipment = "gym" } = {}, pool = EXERCISES) {
  let list = pool.filter((e) => e.pattern === pattern);
  if (equipment === "home") list = list.filter((e) => HOME_EQUIP.includes(e.equipment));
  if (backCare) {
    const heavyOk = role === "primary" && (phase === "strength" || phase === "hybrid");
    const safe = list.filter((e) => e.spine < 2 || heavyOk);
    if (safe.length) list = safe;
  }
  if (role === "primary" && (phase === "strength" || phase === "hybrid")) {
    // strength work favours free-weight compounds that load well
    const rank = (e) => (e.mech === "c" ? 0 : 1) + (["barbell", "trapbar"].includes(e.equipment) ? 0 : 0.5);
    list = [...list].sort((a, b) => rank(a) - rank(b));
  }
  return list;
}

function pickExercise(slot, ctx, usedInDay) {
  const list = candidatesFor(slot.p, { ...ctx, role: slot.role });
  if (!list.length) return null;
  for (let k = 0; k < list.length; k++) {
    const e = list[(slot.v + k) % list.length];
    if (!usedInDay.has(e.id)) return e;
  }
  return list[slot.v % list.length];
}

export function schemeFor(role, phaseKey, goalKey) {
  const [sets, repMin, repMax, rir, rest] = PHASES[phaseKey].roles[role];
  let s = sets;
  if (goalKey === "cut" && role === "accessory") s = Math.max(2, sets - 1);
  return { sets: s, repMin, repMax, rir, rest };
}

const FINISHERS = ["airbike-finisher", "sled-push", "erg-finisher", "kb-swing-cond", "battle-ropes", "wall-balls"];

export function generatePlan(profile) {
  const phase = PHASES[profile.phase] ? profile.phase : "hypertrophy";
  const goal = GOALS[profile.goal] ? profile.goal : "maintain";
  const split = SPLITS[profile.daysPerWeek] || SPLITS[4];
  const maxEx = exercisesForLength(profile.sessionMin);
  const ctx = { backCare: profile.backCare, phase, equipment: profile.equipment };
  let finisherCount = 0;

  const days = split.days.map((key, i) => {
    const t = dayTemplate(key);
    const used = new Set();
    let accessories = 0;
    const items = [];
    for (const slot of t.slots) {
      if (items.length >= maxEx) break;
      if (slot.role === "accessory") {
        if (PHASES[phase].maxAccessories && accessories >= PHASES[phase].maxAccessories) continue;
        accessories++;
      }
      const e = pickExercise(slot, ctx, used);
      if (!e) continue;
      used.add(e.id);
      items.push({ id: uid(), exerciseId: e.id, role: slot.role, ...schemeFor(slot.role, phase, goal) });
    }
    const wantsFinisher = PHASES[phase].finisher === true ||
      (PHASES[phase].finisher === "some" && !isLegDay(key) && finisherCount < 2);
    if (wantsFinisher) {
      const fid = FINISHERS[finisherCount % FINISHERS.length];
      finisherCount++;
      items.push({ id: uid(), exerciseId: fid, role: "finisher", sets: 1, repMin: 8, repMax: 10, rir: 3, rest: 0, minutes: 8 });
    }
    return { id: uid(), key, name: t.name, focus: t.focus, weekday: split.weekdays[i], items };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    basis: { goal, phase, daysPerWeek: profile.daysPerWeek, sessionMin: profile.sessionMin, backCare: profile.backCare },
    splitName: split.name,
    mesoStart: weekStart(today()),
    days,
  };
}

/** Weekly hard sets per muscle: primary muscle = 1, secondary = 0.5. */
export function weeklyVolume(plan, custom = []) {
  const vol = {};
  for (const d of plan?.days || []) {
    for (const it of d.items) {
      if (it.role === "finisher") continue;
      const e = exerciseById(it.exerciseId, custom);
      if (!e) continue;
      e.primary.forEach((m) => { vol[m] = (vol[m] || 0) + it.sets; });
      e.secondary.forEach((m) => { vol[m] = (vol[m] || 0) + it.sets * 0.5; });
    }
  }
  return vol;
}

/** Week of the 6-week block (1–6). Week 6 is a deload. */
export function mesoWeek(plan, iso = today()) {
  if (!plan?.mesoStart) return 1;
  const w = Math.floor(daysBetween(plan.mesoStart, iso) / 7);
  return ((w % 6) + 6) % 6 + 1;
}

/** Plan day scheduled for a date (respecting one-off moves for that week). */
export function dayForDate(plan, iso, moves = {}) {
  if (!plan) return null;
  if (moves[iso] !== undefined) return plan.days.find((d) => d.id === moves[iso]) || null;
  const idx = (new Date(iso.replace(/-/g, "/")).getDay() + 6) % 7;
  const movedAway = Object.entries(moves).some(([date, id]) =>
    weekStart(date) === weekStart(iso) && plan.days.find((d) => d.id === id && d.weekday === idx));
  if (movedAway) return null;
  return plan.days.find((d) => d.weekday === idx) || null;
}
