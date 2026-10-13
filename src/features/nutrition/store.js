import { registerStore, useStore, watch } from "../../lib/storage.js";
import { SEED_MY_MEALS, setUserMeals } from "./data/meals.js";
import { setUserFoods } from "./data/foods.js";

export const NUTRITION_KEY = "nutrition";
registerStore(NUTRITION_KEY, () => ({
  schemaVersion: 1,
  plan: null,                        // weekly meal plan (7 days)
  planSettings: { mealPrep: true, maxCost: 2, source: "mine" }, // source: mine | mix | ideas
  log: {},                           // { date: [{ id, name, slot, kcal, p, c, f, mealId?, items?, foodId?, grams? }] }
  customFoods: [],
  myMeals: SEED_MY_MEALS,            // the user's own meal templates
  creatine: {},                      // { date: true }
  kcalAdjust: 0,                     // manual / check-in adjustment
  shopChecked: {},
}));

// keep the meal + food registries in sync with the store (used by the pure engines)
watch(NUTRITION_KEY, (n) => {
  setUserMeals(n?.myMeals);
  setUserFoods(n?.customFoods);
});

export const useNutrition = () => useStore(NUTRITION_KEY);
