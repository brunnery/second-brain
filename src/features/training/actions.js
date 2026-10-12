/* Training state changes (start / log / finish workouts, edit plan). */
import { getTraining, setTraining } from "./store.js";
import { exerciseById, allExercises } from "./data/exercises.js";
import { suggestNext, historyOf } from "./engine/progression.js";
import { uid } from "../../lib/uid.js";
import { today } from "../../lib/dates.js";
import { dayForDate } from "./engine/plan.js";

export const findExercise = (id) => exerciseById(id, getTraining().customExercises);
export const exerciseList = () => allExercises(getTraining().customExercises);

function entryFor(item, sessions) {
  const ex = findExercise(item.exerciseId);
  const hist = historyOf(sessions, item.exerciseId);
  const sug = suggestNext(item, hist, ex);
  const n = item.role === "finisher" ? 1 : item.sets;
  return {
    id: uid(), exerciseId: item.exerciseId, itemId: item.id, role: item.role,
    target: { sets: item.sets, repMin: item.repMin, repMax: item.repMax, rir: item.rir, rest: item.rest, minutes: item.minutes },
    suggestion: sug,
    sets: Array.from({ length: n }, () => ({ kg: sug.kg, reps: null, done: false })),
  };
}

/** Start (or resume) a workout for a plan day on a date. Returns the session id. */
export function startWorkout(dayId, date = today()) {
  const t = getTraining();
  const existing = t.sessions.find((s) => s.dayId === dayId && s.date === date && !s.finishedAt);
  if (existing) { setTraining((x) => ({ ...x, activeId: existing.id })); return existing.id; }
  const day = t.plan.days.find((d) => d.id === dayId);
  const session = {
    id: uid(), date, dayId, dayName: day.name, startedAt: new Date().toISOString(), finishedAt: null,
    entries: day.items.map((it) => entryFor(it, t.sessions)), note: "",
  };
  setTraining((x) => ({ ...x, sessions: [...x.sessions, session], activeId: session.id }));
  return session.id;
}

export function startEmptyWorkout(date = today()) {
  const session = { id: uid(), date, dayId: null, dayName: "Free workout", startedAt: new Date().toISOString(), finishedAt: null, entries: [], note: "" };
  setTraining((x) => ({ ...x, sessions: [...x.sessions, session], activeId: session.id }));
  return session.id;
}

export const updateSession = (id, fn) =>
  setTraining((x) => ({ ...x, sessions: x.sessions.map((s) => (s.id === id ? fn(s) : s)) }));

export const updateEntry = (sid, eid, fn) =>
  updateSession(sid, (s) => ({ ...s, entries: s.entries.map((e) => (e.id === eid ? fn(e) : e)) }));

export function addExerciseToSession(sid, exerciseId) {
  const t = getTraining();
  const ex = findExercise(exerciseId);
  const item = { id: null, exerciseId, role: ex?.mech === "c" ? "secondary" : "accessory", sets: 3, repMin: 8, repMax: 12, rir: 1, rest: 90 };
  updateSession(sid, (s) => ({ ...s, entries: [...s.entries, entryFor(item, t.sessions)] }));
}

export function swapInSession(sid, eid, exerciseId) {
  const t = getTraining();
  updateSession(sid, (s) => ({
    ...s,
    entries: s.entries.map((e) => (e.id === eid ? { ...entryFor({ ...e.target, id: e.itemId, role: e.role, exerciseId }, t.sessions), id: e.id } : e)),
  }));
}

export const finishSession = (id) => {
  updateSession(id, (s) => ({ ...s, finishedAt: new Date().toISOString() }));
  setTraining((x) => ({ ...x, activeId: x.activeId === id ? null : x.activeId }));
};

export const deleteSession = (id) =>
  setTraining((x) => ({ ...x, sessions: x.sessions.filter((s) => s.id !== id), activeId: x.activeId === id ? null : x.activeId }));

/* ---------- plan editing ---------- */
export const updateDay = (dayId, fn) =>
  setTraining((x) => ({ ...x, plan: { ...x.plan, days: x.plan.days.map((d) => (d.id === dayId ? fn(d) : d)) } }));

export const updateItem = (dayId, itemId, patch) =>
  updateDay(dayId, (d) => ({ ...d, items: d.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));

export function moveItem(dayId, itemId, dir) {
  updateDay(dayId, (d) => {
    const items = [...d.items];
    const i = items.findIndex((x) => x.id === itemId);
    const j = i + dir;
    if (j < 0 || j >= items.length) return d;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...d, items };
  });
}

export const removeItem = (dayId, itemId) => updateDay(dayId, (d) => ({ ...d, items: d.items.filter((i) => i.id !== itemId) }));

export function addItem(dayId, exerciseId) {
  const ex = findExercise(exerciseId);
  const compound = ex?.mech === "c";
  updateDay(dayId, (d) => ({
    ...d,
    items: [...d.items, { id: uid(), exerciseId, role: compound ? "secondary" : "accessory", sets: 3, repMin: compound ? 8 : 10, repMax: compound ? 12 : 15, rir: 1, rest: compound ? 120 : 75 }],
  }));
}

/** Swap two plan days for one specific week only. */
export function moveDayThisWeek(dayId, fromDate, toDate) {
  const t = getTraining();
  const moves = { ...t.moves };
  const occupant = dayForDate(t.plan, toDate, t.moves)?.id;
  moves[toDate] = dayId;
  if (occupant && occupant !== dayId) moves[fromDate] = occupant;
  else moves[fromDate] = "__rest__";
  setTraining((x) => ({ ...x, moves }));
}

export function addCustomExercise(ex) {
  const id = `custom-${uid()}`;
  setTraining((x) => ({ ...x, customExercises: [...x.customExercises, { ...ex, id, custom: true }] }));
  return id;
}
