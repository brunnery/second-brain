/* ================================================================
   GOALS (body composition) + PHASES (training focus)
   These two choices drive every suggestion in the app:
   training volume / rep ranges, cardio mix and nutrition targets.
   ================================================================ */

export const GOALS = {
  bulk: {
    name: "Bulk", short: "Gain muscle fast",
    blurb: "Calorie surplus of ~10–15 %. Aim to gain 0.25–0.5 % body weight per week. Most muscle, some fat.",
    kcalPct: 0.13, kcalCap: 500, proteinPerKg: 1.8, fatPerKg: 1.0, ratePctPerWeek: [0.25, 0.5],
  },
  leanBulk: {
    name: "Lean bulk", short: "Slow, clean gain",
    blurb: "Small surplus of ~5–10 %. Aim for ~0.1–0.25 % per week — slower, less fat gain.",
    kcalPct: 0.07, kcalCap: 300, proteinPerKg: 2.0, fatPerKg: 0.9, ratePctPerWeek: [0.1, 0.25],
  },
  recomp: {
    name: "Recomp", short: "Lose fat, keep building",
    blurb: "Around maintenance (−5 %). Body weight stays roughly flat while composition improves. High protein matters most.",
    kcalPct: -0.05, kcalCap: 250, proteinPerKg: 2.2, fatPerKg: 0.8, ratePctPerWeek: [-0.25, 0],
  },
  cut: {
    name: "Cut", short: "Lose fat, keep muscle",
    blurb: "Deficit of ~20 %. Aim to lose 0.5–1 % body weight per week. Protein high, training heavy, cardio up.",
    kcalPct: -0.2, kcalCap: 750, proteinPerKg: 2.3, fatPerKg: 0.8, ratePctPerWeek: [-1, -0.5],
  },
  maintain: {
    name: "Maintain", short: "Hold weight",
    blurb: "Eat at maintenance. Good between phases or in busy times.",
    kcalPct: 0, kcalCap: 0, proteinPerKg: 1.8, fatPerKg: 0.9, ratePctPerWeek: [-0.1, 0.1],
  },
};

/* rep schemes per exercise role: [sets, repMin, repMax, RIR, rest seconds] */
export const PHASES = {
  hypertrophy: {
    name: "Muscle growth", short: "Hypertrophy",
    blurb: "Moderate weights for 6–15 reps close to failure. 10–20 hard sets per muscle per week.",
    roles: { primary: [4, 6, 10, 2, 180], secondary: [3, 8, 12, 1, 120], accessory: [3, 10, 15, 1, 75], finisher: [1, 8, 10, 3, 0] },
    volume: [10, 20], finisher: false,
  },
  strength: {
    name: "Strength", short: "Strength",
    blurb: "Heavy main lifts for 3–5 reps with long rests, fewer accessories. Builds maximal strength.",
    roles: { primary: [5, 3, 5, 2, 240], secondary: [4, 5, 8, 2, 180], accessory: [2, 8, 12, 1, 90], finisher: [1, 8, 10, 3, 0] },
    volume: [6, 12], finisher: false, maxAccessories: 3,
  },
  conditioning: {
    name: "Fitness", short: "Conditioning",
    blurb: "Lighter loads, higher reps, short rests and a conditioning finisher. More cardio in the week.",
    roles: { primary: [3, 8, 12, 2, 90], secondary: [3, 10, 15, 2, 60], accessory: [3, 12, 20, 1, 45], finisher: [1, 8, 10, 3, 0] },
    volume: [8, 14], finisher: true,
  },
  hybrid: {
    name: "Hybrid (all of it)", short: "Hybrid",
    blurb: "Heavy main lift for strength, hypertrophy work after it, a short finisher on some days and balanced cardio.",
    roles: { primary: [4, 4, 6, 2, 210], secondary: [3, 8, 12, 1, 120], accessory: [3, 10, 15, 1, 60], finisher: [1, 8, 10, 3, 0] },
    volume: [8, 16], finisher: "some",
  },
};

export const LIFESTYLE = {
  desk: { name: "Mostly sitting", factor: 1.3, hint: "Desk job / lectures, < 6k steps" },
  mixed: { name: "Mixed", factor: 1.45, hint: "6–10k steps a day" },
  active: { name: "On my feet", factor: 1.6, hint: "> 10k steps or physical job" },
};

export const SESSION_LENGTHS = [45, 60, 75, 90];
export const exercisesForLength = (min) => ({ 45: 4, 60: 5, 75: 6, 90: 7 }[min] || 6);
