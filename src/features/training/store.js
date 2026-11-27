import { registerStore, useStore, getState, setState } from "../../lib/storage.js";

export const TRAINING_KEY = "training";
registerStore(TRAINING_KEY, () => ({
  schemaVersion: 1,
  plan: null,            // generated + edited weekly plan
  moves: {},             // { "YYYY-MM-DD": dayId } one-off swaps
  sessions: [],          // logged workouts
  activeId: null,        // in-progress session id
  customExercises: [],
  checks: {},            // { "YYYY-MM-DD": dayId | true } — simple "trained today" ticks
  kinds: {},             // { "YYYY-MM-DD": "push" | "pull" | "legs" | "base" } — what you actually trained
}));
export const useTraining = () => useStore(TRAINING_KEY);
export const getTraining = () => getState(TRAINING_KEY);
export const setTraining = (fn) => setState(TRAINING_KEY, fn);
