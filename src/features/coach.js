/* ================================================================
   COACH — the integration layer. Combines profile, training plan,
   cardio plan, body weight and nutrition into the suggestions shown
   across the app. Feature modules stay independent; only this file
   (and Home) knows about all of them.
   ================================================================ */
import { useMemo, useEffect } from "react";
import { useProfile, ageOf } from "./profile/store.js";
import { useTraining } from "./training/store.js";
import { useCardio } from "./cardio/store.js";
import { useRoutines } from "./routines/store.js";
import { useBody, latestWeight } from "./body/store.js";
import { useNutrition } from "./nutrition/store.js";
import { generatePlan } from "./training/engine/plan.js";
import { planCardio, estimateKcal, intensityOfIntent, matchLogs } from "./cardio/engine/cardio.js";
import { computeTargets, weeklyExerciseKcal, planWeek, weeklyRate, checkIn } from "./nutrition/engine/nutrition.js";
import { workoutById } from "./cardio/data/cardio.js";
import { isoWeek, weekStart, today, addDays, dayIdx } from "../lib/dates.js";
import { setState, getState, registerStore } from "../lib/storage.js";
import { dayForDate } from "./training/engine/plan.js";
import { ROUTINES } from "./routines/programs.js";
import { exerciseById } from "./training/data/exercises.js";
import { CARDIO_TYPES as CT, INTENTS as INT } from "./cardio/data/cardio.js";

const LEG_KEYS = ["legsA", "legsB", "lowerA", "lowerB"];

export function cardioWeek(profile, plan, iso = today(), overrides = {}) {
  const liftDays = (plan?.days || []).map((d) => ({ weekday: d.weekday, leg: LEG_KEYS.includes(d.key) }));
  const ws = weekStart(iso);
  const slots = planCardio({
    phase: profile.phase, goal: profile.goal, prefs: profile.cardioPrefs,
    perWeek: profile.cardioPerWeek, liftDays, seed: isoWeek(ws),
  });
  return slots.map((s, i) => {
    const date = addDays(ws, s.weekday);
    const key = `${date}#${i}`;
    const workoutId = overrides[key] || s.workoutId;
    const w = workoutById(workoutId);
    return { ...s, key, date, workoutId, type: w?.type || s.type, minutes: w?.minutes || s.minutes };
  });
}

export function useCardioWeek(iso = today()) {
  const [profile] = useProfile();
  const [training] = useTraining();
  const [cardio] = useCardio();
  return useMemo(() => cardioWeek(profile, training.plan, iso, cardio.overrides), [profile, training.plan, iso, cardio.overrides]);
}

export function useTargets() {
  const [profile] = useProfile();
  const [training] = useTraining();
  const [body] = useBody();
  const [nutrition] = useNutrition();
  return useMemo(() => {
    const weightKg = latestWeight(body, profile.weightKg);
    const slots = cardioWeek(profile, training.plan);
    const exKcal = weeklyExerciseKcal({
      weightKg,
      liftSessions: training.plan?.days.length ?? profile.daysPerWeek,
      sessionMin: profile.sessionMin,
      cardioSlots: slots,
      cardioKcalFn: (c) => estimateKcal({ type: c.type, minutes: c.minutes, intensity: intensityOfIntent(c.intent) }, weightKg),
    });
    const t = computeTargets({
      sex: profile.sex, weightKg, heightCm: profile.heightCm, age: ageOf(profile), lifestyle: profile.lifestyle,
      goal: profile.goal, weeklyExerciseKcal: exKcal, adjust: nutrition.kcalAdjust || 0,
    });
    const rate = weeklyRate(body.weights || []);
    return { ...t, weightKg, exKcal, rate, checkIn: checkIn(profile.goal, rate) };
  }, [profile, training.plan, body, nutrition.kcalAdjust]);
}

/** (Re)build training plan + meal plan from the current profile. */
export function rebuildPlans({ training = true, meals = true, keepLocked = true, silent = false } = {}) {
  const profile = getState("profile");
  if (training) {
    setState("training", (t) => ({ ...t, plan: generatePlan(profile), moves: {} }), { silent });
  }
  if (meals) {
    const n = getState("nutrition");
    const t = getState("training");
    const body = getState("body");
    const weightKg = latestWeight(body, profile.weightKg);
    const slots = cardioWeek(profile, t.plan);
    const exKcal = weeklyExerciseKcal({
      weightKg, liftSessions: t.plan?.days.length ?? profile.daysPerWeek, sessionMin: profile.sessionMin, cardioSlots: slots,
      cardioKcalFn: (c) => estimateKcal({ type: c.type, minutes: c.minutes, intensity: intensityOfIntent(c.intent) }, weightKg),
    });
    const targets = computeTargets({
      sex: profile.sex, weightKg, heightCm: profile.heightCm, age: ageOf(profile), lifestyle: profile.lifestyle,
      goal: profile.goal, weeklyExerciseKcal: exKcal, adjust: n.kcalAdjust || 0,
    });
    const plan = planWeek({
      targets, seed: Math.floor(Math.random() * 1e6) + 1,
      mealPrep: n.planSettings?.mealPrep ?? true, maxCost: n.planSettings?.maxCost ?? 2, source: n.planSettings?.source ?? "mine",
      prev: keepLocked ? n.plan : null,
    });
    setState("nutrition", (x) => ({ ...x, plan }), { silent });
  }
}

export const todayIdx = () => dayIdx(today());

/* ---------- calendar feed snapshot ----------
   The next 8 weeks of training, cardio and evening routines, stored as a
   synced key so the Supabase edge function can serve it as an .ics feed
   without duplicating the planning logic. */

registerStore("feed", () => ({ generatedAt: null, events: [] }));

export function buildFeedEvents({ profile, training, cardio, routines, from = today(), weeks = 8 }) {
  const events = [];
  const plan = training.plan;
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(weekStart(from), w * 7);
    const slots = cardioWeek(profile, plan, ws, cardio.overrides);
    for (let i = 0; i < 7; i++) {
      const date = addDays(ws, i);
      if (date < from) continue;
      const day = dayForDate(plan, date, training.moves);
      if (day) {
        events.push({
          uid: `lift-${date}`, date, title: `🏋️ ${day.name}`,
          desc: `${day.focus}\n` + day.items.map((it) => `• ${exerciseById(it.exerciseId, training.customExercises)?.name || "?"} ${it.role === "finisher" ? `${it.minutes || 8} min` : `${it.sets}×${it.repMin}-${it.repMax}`}`).join("\n"),
        });
      }
      const matched = matchLogs(slots, cardio.logs || []);
      for (const s of slots.filter((x) => x.date === date && !cardio.skipped[x.key])) {
        const wk = workoutById(s.workoutId);
        const l = matched[s.key];
        events.push(l
          ? { uid: `cardio-${s.key}`, date, title: `✅ ${CT[l.type]?.short || "Cardio"} ${l.minutes}′`, desc: l.note || "" }
          : { uid: `cardio-${s.key}`, date, title: `🔥 ${wk?.name} · ${CT[s.type].short} ${s.minutes}′`, desc: `${INT[s.intent].name}: ${wk?.how || ""}` });
      }
      const rid = routines.schedule[i];
      if (rid) {
        const r = ROUTINES[rid];
        events.push({
          uid: `routine-${date}`, date, title: `🌙 ${r.name}`, start: profile.routineTime || "21:00",
          minutes: Math.ceil(r.exercises.reduce((a, e) => a + e.sec, 0) / 60), alarm: true,
          desc: r.exercises.map((e) => `• ${e.name} ${e.sec}s`).join("\n"),
        });
      }
    }
  }
  return events;
}

/** Keep the synced feed snapshot fresh (runs in the app shell). */
export function useFeedSnapshot() {
  const [profile] = useProfile();
  const [training] = useTraining();
  const [cardio] = useCardio();
  const [routines] = useRoutines();
  const { plan, moves, customExercises } = training;
  const { overrides, skipped, logs } = cardio;
  useEffect(() => {
    if (!plan) return;
    const events = buildFeedEvents({ profile, training: { plan, moves, customExercises }, cardio: { overrides, skipped, logs }, routines });
    if (JSON.stringify(getState("feed").events) !== JSON.stringify(events)) {
      setState("feed", { generatedAt: new Date().toISOString(), events });
    }
  }, [profile, plan, moves, customExercises, overrides, skipped, logs, routines]);
}

/** One-time upgrades of stored data (run once per device on start). */
export function useMigrations() {
  useEffect(() => {
    const n = getState("nutrition");
    const p = getState("profile");
    // v2.1: meal plans built from "my meals" — rebuild an old plan once (locked meals kept)
    if (p.onboarded && n.plan && n.planSettings && n.planSettings.source === undefined) {
      // silent: never mark local data as "newer" here, so a stale device can't overwrite the cloud
      setState("nutrition", (x) => ({ ...x, planSettings: { ...x.planSettings, source: "mine" } }), { silent: true });
      rebuildPlans({ training: false, meals: true, keepLocked: true, silent: true });
    }
  }, []);
}
