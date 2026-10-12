import { registerStore, useStore } from "../../lib/storage.js";

export const NUTRITION_KEY = "nutrition";
registerStore(NUTRITION_KEY, () => ({
  schemaVersion: 1,
  plan: null,                        // weekly meal plan (7 days)
  planSettings: { mealPrep: true, maxCost: 2 },
  log: {},                           // { date: [{ id, name, slot, kcal, p, c, f, mealId?, foodId?, grams? }] }
  customFoods: [],
  creatine: {},                      // { date: true }
  kcalAdjust: 0,                     // manual / check-in adjustment
  shopChecked: {},
}));
export const useNutrition = () => useStore(NUTRITION_KEY);
