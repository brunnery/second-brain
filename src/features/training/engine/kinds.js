/* The four training kinds you can tick on Today, and which one a plan day defaults to. */
export const TRAINING_KINDS = {
  push: { name: "Push", focus: "Chest · shoulders · triceps" },
  pull: { name: "Pull", focus: "Back · biceps · posture" },
  legs: { name: "Legs", focus: "Quads · hamstrings · glutes · core" },
  base: { name: "Base endurance", focus: "Long, easy aerobic session (Zone 2)" },
};

/** Default kind for a plan day ("Push A" → push). Unknown names (upper, full body…) → null. */
export function kindOfDay(day) {
  const n = (day?.name || "").toLowerCase();
  return Object.keys(TRAINING_KINDS).find((k) => k !== "base" && n.startsWith(k)) || null;
}

/** Kind shown for a date: your own pick wins, otherwise the plan day's default. */
export function kindForDate(kinds = {}, iso, day) {
  return kinds[iso] || kindOfDay(day);
}

/* Quick extra-cardio presets (logged in one tap). */
export const CARDIO_PRESETS = {
  hiit: { name: "HIIT", intent: "interval", minutes: 20, intensity: "hard" },
  sprints: { name: "Sprints", intent: "sprint", minutes: 15, intensity: "hard" },
  easy30: { name: "30 min easy", intent: "z2", minutes: 30, intensity: "easy" },
};
