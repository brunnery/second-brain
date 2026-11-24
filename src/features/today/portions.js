/* Meal-prep cheat sheet agreed in chat on 17 Nov 2026 (90 kg, bulk now, cut from January).
   Weights are per box, weighed raw (meat) / dry (rice, pasta). Reference only — no logging. */
export const PORTIONS = {
  rows: [
    { name: "Chicken", note: "raw", bulk: 250, cut: 250 },
    { name: "Mince", note: "raw · cut: lean 5 %", bulk: 175, cut: 200 },
    { name: "Rice", note: "dry", bulk: 125, cut: 75 },
    { name: "Pasta", note: "dry", bulk: 125, cut: 75 },
  ],
  breakfast: "2 wholegrain toast · cottage cheese · 4 slices chicken cold cuts · 1 egg (~380 kcal, ~36 g protein) — same in both phases",
  shake: { bulk: "Milk + 1 banana + 50 g oats", cut: "Water only" },
  targets: { bulk: "~3200 kcal · ~180 g protein", cut: "~2400 kcal · ~180 g protein" },
  tip: "Scale not moving as planned after 2–3 weeks? Change rice/pasta by ±25 g per box.",
};
