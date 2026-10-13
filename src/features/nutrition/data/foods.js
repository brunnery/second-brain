/* ================================================================
   FOOD DATABASE — values per 100 g (or 100 ml), approximate,
   based on the Swiss Food Composition Database / USDA FoodData.
   Picked for a budget student shop at Migros / Coop / Aldi / Lidl.
   cost: 1 = cheap staple · 2 = normal · 3 = pricey
   Add your own foods in the app (Food → Foods → +).
   ================================================================ */

export const FOOD_CATS = {
  protein: "Meat, fish & eggs", dairy: "Dairy", grains: "Grains & bread", legumes: "Legumes & tofu",
  veg: "Vegetables", fruit: "Fruit", fats: "Nuts, seeds & oils", snacks: "Snacks & sweets",
  drinks: "Drinks", sauces: "Sauces & extras", ready: "Ready & convenience", supps: "Supplements",
};

// f(id, name, cat, kcal, protein, carbs, fat, fibre, portion grams, portion label, cost)
const f = (id, name, cat, kcal, p, c, fat, fib, g, label, cost = 2) =>
  ({ id, name, cat, per100: { kcal, p, c, f: fat, fib }, portion: { g, label }, cost });

export const FOODS = [
  /* protein */
  f("chicken-breast", "Chicken breast, raw", "protein", 108, 23.5, 0, 1.2, 0, 150, "1 fillet", 2),
  f("chicken-thigh", "Chicken thigh, skinless, raw", "protein", 135, 19, 0, 6.5, 0, 150, "2 thighs", 1),
  f("turkey-breast", "Turkey breast, raw", "protein", 105, 24, 0, 1, 0, 150, "1 fillet", 2),
  f("beef-mince-5", "Beef mince 5 % fat, raw", "protein", 125, 21, 0, 5, 0, 125, "½ pack", 2),
  f("beef-mince-15", "Beef mince 15 % fat, raw", "protein", 210, 19, 0, 15, 0, 125, "½ pack", 1),
  f("beef-steak", "Beef steak (rump), raw", "protein", 125, 22, 0, 4, 0, 180, "1 steak", 3),
  f("pork-loin", "Pork loin, raw", "protein", 125, 22, 0, 4, 0, 150, "1 piece", 2),
  f("ham", "Cooked ham", "protein", 110, 19, 1, 3.5, 0, 50, "3 slices", 2),
  f("chicken-cold-cuts", "Chicken cold cuts", "protein", 100, 20, 1.5, 1.5, 0, 50, "4 slices", 2),
  f("salmon", "Salmon fillet, raw", "protein", 200, 20, 0, 13, 0, 125, "1 fillet", 3),
  f("tuna-can", "Tuna in water, drained", "protein", 110, 25, 0, 1, 0, 120, "1 can", 1),
  f("cod", "Cod / pollock fillet, raw", "protein", 80, 18, 0, 0.7, 0, 150, "1 fillet", 2),
  f("shrimp", "Shrimp, cooked", "protein", 95, 21, 0, 1, 0, 100, "1 handful", 3),
  f("egg", "Egg", "protein", 140, 12.5, 0.7, 9.5, 0, 60, "1 egg (L)", 1),
  f("egg-white", "Liquid egg white", "protein", 48, 10.5, 0.7, 0.2, 0, 150, "1 cup", 2),

  /* dairy */
  f("skyr", "Skyr natural", "dairy", 62, 11, 4, 0.2, 0, 150, "1 tub", 1),
  f("magerquark", "Low-fat quark (Magerquark)", "dairy", 70, 12, 4, 0.3, 0, 250, "½ pack", 1),
  f("greek-yog", "Greek yoghurt 10 %", "dairy", 120, 5, 4, 10, 0, 150, "1 tub", 2),
  f("high-pro-pudding", "High-protein pudding", "dairy", 75, 10, 5.5, 1.5, 0, 200, "1 cup", 2),
  f("cottage", "Cottage cheese", "dairy", 98, 12, 3, 4.3, 0, 200, "1 tub", 1),
  f("milk-2", "Milk 2.5 %", "dairy", 60, 3.4, 4.8, 2.7, 0, 250, "1 glass", 1),
  f("milk-skim", "Skim milk", "dairy", 35, 3.5, 4.9, 0.1, 0, 250, "1 glass", 1),
  f("high-pro-milk", "High-protein milk drink", "dairy", 60, 8, 5, 0.5, 0, 330, "1 bottle", 2),
  f("mozzarella-light", "Mozzarella light", "dairy", 165, 19, 1, 9, 0, 125, "1 ball", 2),
  f("feta", "Feta", "dairy", 265, 16, 1, 22, 0, 50, "1 slice", 2),
  f("gruyere", "Hard cheese (Gruyère)", "dairy", 410, 28, 0, 33, 0, 30, "1 slice", 2),
  f("parmesan", "Parmesan", "dairy", 400, 35, 0, 28, 0, 15, "1 tbsp grated", 2),
  f("butter", "Butter", "dairy", 740, 0.7, 0.6, 82, 0, 10, "1 knob", 1),

  /* grains */
  f("oats", "Oats (Haferflocken)", "grains", 370, 13, 59, 7, 10, 80, "1 bowl", 1),
  f("rice", "Rice, dry", "grains", 355, 7, 78, 0.6, 1.3, 80, "1 portion dry", 1),
  f("basmati", "Basmati rice, dry", "grains", 350, 8, 77, 0.8, 1.5, 80, "1 portion dry", 1),
  f("rice-cooked", "Rice, cooked", "grains", 130, 2.7, 28, 0.3, 0.4, 200, "1 plate", 1),
  f("pasta", "Pasta, dry", "grains", 355, 12.5, 71, 1.5, 3, 100, "1 portion dry", 1),
  f("pasta-wholegrain", "Wholegrain pasta, dry", "grains", 340, 13, 64, 2.5, 8, 100, "1 portion dry", 1),
  f("couscous", "Couscous, dry", "grains", 360, 12, 72, 1.5, 4, 80, "1 portion dry", 1),
  f("quinoa", "Quinoa, dry", "grains", 365, 14, 64, 6, 7, 70, "1 portion dry", 2),
  f("potato", "Potatoes, raw", "grains", 77, 2, 17, 0.1, 2, 300, "3 medium", 1),
  f("sweet-potato", "Sweet potato, raw", "grains", 86, 1.6, 20, 0.1, 3, 250, "1 large", 2),
  f("wholegrain-bread", "Wholegrain bread", "grains", 240, 9, 41, 3, 7, 50, "1 thick slice", 1),
  f("toast", "Toast bread", "grains", 260, 8, 48, 3.5, 3, 30, "1 slice", 1),
  f("wrap", "Tortilla wrap", "grains", 300, 8.5, 50, 7, 3, 60, "1 wrap", 1),
  f("bagel", "Bagel", "grains", 260, 10, 50, 1.5, 2.5, 90, "1 bagel", 2),
  f("rice-cakes", "Rice cakes", "grains", 385, 8, 81, 3, 4, 10, "1 cake", 1),
  f("cornflakes", "Cornflakes", "grains", 375, 7, 84, 0.9, 3, 40, "1 bowl", 1),
  f("granola", "Granola", "grains", 450, 9, 62, 17, 7, 50, "1 handful", 2),
  f("gnocchi", "Gnocchi", "grains", 150, 3.5, 32, 0.5, 1.5, 250, "½ pack", 1),

  /* legumes */
  f("lentils-red", "Red lentils, dry", "legumes", 340, 25, 50, 1.5, 11, 70, "1 portion dry", 1),
  f("chickpeas-can", "Chickpeas, canned, drained", "legumes", 120, 7, 15, 2.5, 6, 120, "½ can", 1),
  f("kidney-beans-can", "Kidney beans, canned, drained", "legumes", 105, 7, 14, 0.5, 6, 120, "½ can", 1),
  f("tofu", "Tofu natural", "legumes", 125, 13, 1.5, 7.5, 1, 200, "1 block", 2),
  f("edamame", "Edamame, frozen", "legumes", 125, 11, 7, 5, 5, 100, "1 cup", 2),
  f("hummus", "Hummus", "legumes", 300, 7, 12, 25, 5, 40, "2 tbsp", 2),

  /* veg */
  f("broccoli", "Broccoli", "veg", 34, 2.8, 4, 0.4, 3, 200, "½ head", 1),
  f("frozen-veg", "Frozen vegetable mix", "veg", 45, 2.5, 6, 0.4, 3.5, 200, "1 portion", 1),
  f("spinach", "Spinach, fresh", "veg", 23, 2.9, 1.4, 0.4, 2.2, 100, "1 big handful", 1),
  f("bell-pepper", "Bell pepper", "veg", 30, 1, 5.5, 0.3, 2, 150, "1 pepper", 1),
  f("tomato", "Tomatoes", "veg", 19, 0.9, 3, 0.2, 1.2, 150, "2 tomatoes", 1),
  f("cucumber", "Cucumber", "veg", 13, 0.6, 2, 0.1, 0.6, 150, "½ cucumber", 1),
  f("carrot", "Carrots", "veg", 37, 0.8, 7, 0.2, 3, 120, "2 carrots", 1),
  f("onion", "Onion", "veg", 40, 1.1, 8, 0.1, 1.7, 80, "1 onion", 1),
  f("zucchini", "Zucchini", "veg", 19, 1.6, 2, 0.4, 1.1, 200, "1 zucchini", 1),
  f("mushrooms", "Mushrooms", "veg", 22, 3, 0.5, 0.3, 2, 150, "1 punnet", 1),
  f("salad-mix", "Salad leaves", "veg", 16, 1.3, 1.7, 0.2, 1.5, 80, "1 bowl", 1),
  f("canned-tomatoes", "Canned chopped tomatoes", "veg", 24, 1.2, 4, 0.2, 1, 200, "½ can", 1),
  f("green-beans", "Green beans, frozen", "veg", 30, 2, 4, 0.2, 3, 150, "1 portion", 1),
  f("corn-can", "Sweetcorn, canned", "veg", 80, 2.5, 15, 1.2, 2.5, 70, "½ small can", 1),

  /* fruit */
  f("banana", "Banana", "fruit", 95, 1.1, 21, 0.3, 2, 120, "1 banana", 1),
  f("apple", "Apple", "fruit", 54, 0.3, 12, 0.2, 2.4, 170, "1 apple", 1),
  f("berries-frozen", "Frozen berries", "fruit", 45, 0.9, 8, 0.4, 5, 100, "1 cup", 1),
  f("orange", "Orange", "fruit", 47, 0.9, 9, 0.2, 2, 150, "1 orange", 1),
  f("kiwi", "Kiwi", "fruit", 60, 1.1, 11, 0.5, 3, 80, "1 kiwi", 1),
  f("dates", "Dates, dried", "fruit", 285, 2, 66, 0.4, 7, 30, "3 dates", 2),
  f("raisins", "Raisins", "fruit", 300, 3, 69, 0.5, 4, 30, "1 handful", 1),

  /* fats */
  f("olive-oil", "Olive / rapeseed oil", "fats", 885, 0, 0, 100, 0, 10, "1 tbsp", 1),
  f("peanut-butter", "Peanut butter", "fats", 600, 25, 14, 49, 6, 20, "1 tbsp", 1),
  f("almonds", "Almonds", "fats", 600, 21, 7, 52, 12, 25, "1 handful", 2),
  f("walnuts", "Walnuts", "fats", 690, 15, 7, 66, 6, 25, "1 handful", 2),
  f("mixed-nuts", "Mixed nuts", "fats", 620, 18, 12, 54, 7, 30, "1 handful", 2),
  f("chia", "Chia seeds", "fats", 490, 17, 8, 31, 34, 15, "1 tbsp", 2),
  f("avocado", "Avocado", "fats", 160, 2, 2, 15, 6.5, 80, "½ avocado", 2),
  f("dark-choc", "Dark chocolate 70 %", "fats", 580, 8, 33, 43, 11, 20, "2 squares", 2),

  /* snacks */
  f("protein-bar", "Protein bar", "snacks", 360, 32, 30, 11, 6, 55, "1 bar", 3),
  f("milk-choc", "Milk chocolate", "snacks", 540, 7, 57, 31, 2, 25, "¼ bar", 1),
  f("chips", "Potato chips", "snacks", 535, 6, 50, 34, 4, 30, "1 handful", 1),
  f("cereal-bar", "Cereal bar", "snacks", 410, 6, 66, 13, 5, 25, "1 bar", 1),
  f("gummies", "Gummy bears", "snacks", 340, 6, 77, 0.2, 0, 30, "1 handful", 1),
  f("popcorn", "Popcorn, salted", "snacks", 470, 9, 60, 21, 10, 25, "1 bowl", 1),
  f("beef-jerky", "Beef jerky", "snacks", 280, 45, 12, 4, 1, 30, "1 pack", 3),

  /* drinks */
  f("cola", "Cola", "drinks", 42, 0, 10.6, 0, 0, 330, "1 can", 1),
  f("cola-zero", "Cola zero / diet soda", "drinks", 0.4, 0, 0, 0, 0, 330, "1 can", 1),
  f("orange-juice", "Orange juice", "drinks", 45, 0.7, 10, 0.1, 0.2, 250, "1 glass", 1),
  f("beer", "Beer (lager)", "drinks", 43, 0.5, 3.6, 0, 0, 500, "1 large", 2),
  f("oat-drink", "Oat drink", "drinks", 45, 1, 6.5, 1.5, 0.8, 250, "1 glass", 1),
  f("coffee-milk", "Cappuccino", "drinks", 40, 2.2, 3.5, 2, 0, 200, "1 cup", 2),

  /* sauces & extras */
  f("pesto", "Pesto", "sauces", 480, 5, 6, 48, 2, 30, "2 tbsp", 2),
  f("tomato-sauce", "Tomato pasta sauce", "sauces", 60, 1.5, 8, 2, 1.5, 125, "½ jar", 1),
  f("soy-sauce", "Soy sauce", "sauces", 60, 8, 6, 0, 0, 15, "1 tbsp", 1),
  f("honey", "Honey", "sauces", 320, 0.3, 80, 0, 0, 20, "1 tbsp", 1),
  f("jam", "Jam", "sauces", 250, 0.4, 60, 0.1, 1, 20, "1 tbsp", 1),
  f("ketchup", "Ketchup", "sauces", 110, 1.2, 25, 0.1, 0.5, 20, "1 tbsp", 1),
  f("mayo-light", "Light mayonnaise", "sauces", 290, 1, 8, 28, 0, 15, "1 tbsp", 1),
  f("curry-paste", "Curry paste / coconut light", "sauces", 120, 1.5, 6, 10, 1, 100, "½ can light coconut milk", 2),
  f("sweet-chili", "Sweet chili sauce", "sauces", 220, 0.5, 52, 0.5, 1, 20, "1 tbsp", 1),

  /* ready */
  f("pizza-frozen", "Frozen pizza", "ready", 240, 10, 28, 9, 2, 350, "1 pizza", 1),
  f("frozen-meal", "Frozen ready meal (avg.)", "ready", 120, 6, 14, 4, 2, 400, "1 meal", 2),
  f("kebab", "Döner kebab", "ready", 215, 12, 20, 10, 2, 400, "1 döner", 2),
  f("burger-menu", "Burger + fries (avg.)", "ready", 260, 11, 28, 12, 2.5, 450, "1 menu", 2),
  f("sushi", "Sushi (mixed box)", "ready", 150, 6, 28, 1.5, 1, 300, "1 box", 3),
  f("canteen-meal", "Mensa / canteen meal (avg.)", "ready", 140, 7, 15, 5.5, 2, 500, "1 plate", 2),
  f("sandwich", "Sandwich (store-bought)", "ready", 240, 10, 28, 9, 2.5, 180, "1 sandwich", 2),

  /* supplements */
  f("whey", "Whey protein", "supps", 380, 78, 6, 5, 0, 30, "1 scoop", 2),
  f("casein", "Casein protein", "supps", 360, 78, 6, 2, 0, 30, "1 scoop", 2),
  f("creatine", "Creatine monohydrate", "supps", 0, 0, 0, 0, 0, 5, "1 tsp", 1),
];

let userFoods = [];
export const setUserFoods = (list) => { userFoods = Array.isArray(list) ? list : []; };
export const allFoods = () => [...FOODS, ...userFoods];
export const foodById = (id, custom = []) =>
  FOODS.find((x) => x.id === id) || userFoods.find((x) => x.id === id) || custom.find((x) => x.id === id) || null;

/** Macros for a given amount of a food. */
export function macrosOf(food, grams) {
  const k = (grams || 0) / 100;
  const m = food?.per100 || { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  return { kcal: m.kcal * k, p: m.p * k, c: m.c * k, f: m.f * k, fib: (m.fib || 0) * k };
}

export const sumMacros = (list) =>
  list.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f, fib: a.fib + (m.fib || 0) }),
    { kcal: 0, p: 0, c: 0, f: 0, fib: 0 });
