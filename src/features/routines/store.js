import { registerStore, useStore } from "../../lib/storage.js";
import { DEFAULT_SCHEDULE } from "./programs.js";

export const ROUTINES_KEY = "routines";
registerStore(ROUTINES_KEY, () => ({
  schemaVersion: 1,
  done: {},                      // { "YYYY-MM-DD": routineId }
  schedule: DEFAULT_SCHEDULE,    // Mon … Sun
}));
export const useRoutines = () => useStore(ROUTINES_KEY);
