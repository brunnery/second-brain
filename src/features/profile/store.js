import { registerStore, useStore, getState } from "../../lib/storage.js";

export const PROFILE_KEY = "profile";

registerStore(PROFILE_KEY, () => ({
  schemaVersion: 1,
  onboarded: false,
  name: "",
  sex: "male",
  birthYear: 2001,
  heightCm: 182,
  weightKg: 85,
  lifestyle: "mixed",
  goal: "leanBulk",
  phase: "hypertrophy",
  daysPerWeek: 6,
  sessionMin: 75,
  backCare: true,              // prefer low spinal-load variants (Scheuermann)
  equipment: "gym",            // gym | home
  cardioPrefs: ["stairmaster", "rower", "bike", "inclineWalk", "run", "airBike"],
  cardioPerWeek: null,         // null = let the planner decide
  routineTime: "21:00",
}));

export const useProfile = () => useStore(PROFILE_KEY);
export const getProfile = () => getState(PROFILE_KEY);

export const ageOf = (p) => new Date().getFullYear() - (p.birthYear || 2000);
