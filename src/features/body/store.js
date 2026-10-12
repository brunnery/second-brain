import { registerStore, useStore } from "../../lib/storage.js";

export const BODY_KEY = "body";
registerStore(BODY_KEY, () => ({
  schemaVersion: 1,
  weights: [],   // { date, kg }
  waist: [],     // { date, cm }
}));
export const useBody = () => useStore(BODY_KEY);
export const latestWeight = (body, fallback) =>
  [...(body.weights || [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.kg ?? fallback;
