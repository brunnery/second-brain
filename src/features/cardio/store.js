import { registerStore, useStore } from "../../lib/storage.js";

export const CARDIO_KEY = "cardio";
registerStore(CARDIO_KEY, () => ({
  schemaVersion: 1,
  logs: [],          // { id, date, type, intent, workoutId?, minutes, distance?, watts?, speed?, incline?, level?, floors?, calories?, avgHr?, rpe?, kcal, note }
  overrides: {},     // { "YYYY-MM-DD#slot": workoutId } — shuffled suggestions
  skipped: {},       // { "YYYY-MM-DD#slot": true }
}));
export const useCardio = () => useStore(CARDIO_KEY);
