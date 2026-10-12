/* ================================================================
   PROGRESSION — double progression with RIR targets.
   Hit the top of the rep range on every set → add weight.
   Missed the bottom of the range twice → back off ~5 %.
   Otherwise → same weight, add reps.
   ================================================================ */

const LOWER = ["quads", "hamstrings", "glutes"];

export function incrementFor(ex) {
  if (!ex) return 2.5;
  if (ex.equipment === "bodyweight") return 0;
  if (ex.equipment === "dumbbell" || ex.equipment === "kettlebell") return 2;
  if (ex.mech === "c" && ex.primary.some((m) => LOWER.includes(m))) return 5;
  return 2.5;
}

const round = (kg, step = 0.5) => Math.round(kg / step) * step;

export const e1rm = (kg, reps) => (kg > 0 && reps > 0 && reps <= 15 ? kg * (1 + reps / 30) : 0);

/** history: newest first, each { date, sets: [{ kg, reps, done }] } */
export function suggestNext(item, history, ex) {
  const sessions = (history || []).map((h) => ({ ...h, sets: h.sets.filter((s) => s.done && s.reps > 0) })).filter((h) => h.sets.length);
  if (!sessions.length) {
    return { kg: null, reps: item.repMax, reason: `First time: pick a weight you could lift ~${item.repMax + item.rir} times, then stop at ${item.repMax}.` };
  }
  const last = sessions[0];
  const top = Math.max(...last.sets.map((s) => s.kg || 0));
  const atTop = last.sets.filter((s) => (s.kg || 0) === top);
  const inc = incrementFor(ex);

  if (atTop.length >= Math.min(item.sets, last.sets.length) && atTop.every((s) => s.reps >= item.repMax)) {
    if (inc === 0) return { kg: top, reps: item.repMax + 1, reason: `All sets hit ${item.repMax} — add reps or add load (belt / vest).` };
    return { kg: round(top + inc), reps: item.repMin, reason: `All sets hit ${item.repMax} reps → +${inc} kg, start again at ${item.repMin}.` };
  }
  const missed = (s) => s.sets.some((x) => x.reps < item.repMin);
  if (missed(last) && sessions[1] && missed(sessions[1])) {
    return { kg: round(top * 0.95, inc >= 2 ? 1 : 0.5), reps: item.repMax, reason: "Below the rep range twice in a row → back off 5 % and build up again." };
  }
  return { kg: top, reps: Math.min(item.repMax, Math.max(...last.sets.map((s) => s.reps)) + 1), reason: `Keep ${top} kg and beat last time by a rep.` };
}

/** Extract an exercise's history (newest first) from all sessions. */
export function historyOf(sessions, exerciseId, limit = 12) {
  const out = [];
  for (const s of [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (!s.finishedAt) continue;
    const entry = s.entries.find((e) => e.exerciseId === exerciseId);
    if (entry) out.push({ date: s.date, sets: entry.sets });
    if (out.length >= limit) break;
  }
  return out;
}

export function bestSet(history) {
  let best = null;
  for (const h of history) for (const s of h.sets) {
    if (!s.done) continue;
    const v = e1rm(s.kg, s.reps);
    if (!best || v > best.e1rm) best = { ...s, date: h.date, e1rm: v };
  }
  return best;
}

export const tonnage = (session) =>
  session.entries.reduce((a, e) => a + e.sets.reduce((b, s) => b + (s.done ? (s.kg || 0) * (s.reps || 0) : 0), 0), 0);
