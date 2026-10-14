import { describe, it, expect } from "vitest";
import { generatePlan, weeklyVolume, mesoWeek, dayForDate, candidatesFor } from "../features/training/engine/plan.js";
import { suggestNext, e1rm, historyOf } from "../features/training/engine/progression.js";
import { planCardio, estimateKcal, weeklyIntents } from "../features/cardio/engine/cardio.js";
import { computeTargets, planWeek, dayTotals, shoppingList, checkIn, weeklyRate, scaleFor } from "../features/nutrition/engine/nutrition.js";
import { mealById, MEALS } from "../features/nutrition/data/meals.js";
import { parseLabel, labelWarning, labelMacros } from "../features/nutrition/engine/label.js";
import { EXERCISES } from "../features/training/data/exercises.js";
import { FOODS } from "../features/nutrition/data/foods.js";
import { routineStreak, DEFAULT_SCHEDULE } from "../features/routines/programs.js";
import { addDays, dayIdx, weekStart } from "../lib/dates.js";
import { decideSync } from "../lib/sync.js";

const profile = { goal: "leanBulk", phase: "hypertrophy", daysPerWeek: 6, sessionMin: 75, backCare: true, equipment: "gym" };

describe("data integrity", () => {
  it("exercise ids are unique", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(EXERCISES.length).toBeGreaterThan(150);
  });
  it("meals reference existing foods", () => {
    const ids = new Set(FOODS.map((f) => f.id));
    for (const m of MEALS) for (const [id] of m.items) expect(ids.has(id), `${m.id} → ${id}`).toBe(true);
  });
  it("food ids are unique", () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });
});

describe("training plan", () => {
  it("builds 6 PPL days with no duplicate exercise inside a day", () => {
    const plan = generatePlan(profile);
    expect(plan.days).toHaveLength(6);
    for (const d of plan.days) {
      expect(d.items.length).toBeGreaterThanOrEqual(5);
      expect(new Set(d.items.map((i) => i.exerciseId)).size).toBe(d.items.length);
    }
  });
  it("back care excludes high spinal-load lifts in hypertrophy", () => {
    const plan = generatePlan(profile);
    const ids = plan.days.flatMap((d) => d.items.map((i) => i.exerciseId));
    const heavy = EXERCISES.filter((e) => e.spine === 2).map((e) => e.id);
    expect(ids.some((id) => heavy.includes(id))).toBe(false);
  });
  it("strength phase uses low reps on primaries and fewer accessories", () => {
    const plan = generatePlan({ ...profile, phase: "strength" });
    const prim = plan.days[0].items.find((i) => i.role === "primary");
    expect(prim.repMax).toBeLessThanOrEqual(5);
    for (const d of plan.days) expect(d.items.filter((i) => i.role === "accessory").length).toBeLessThanOrEqual(3);
  });
  it("conditioning adds finishers", () => {
    const plan = generatePlan({ ...profile, phase: "conditioning" });
    expect(plan.days.every((d) => d.items.some((i) => i.role === "finisher"))).toBe(true);
  });
  it("every split size works", () => {
    for (const n of [3, 4, 5, 6]) expect(generatePlan({ ...profile, daysPerWeek: n }).days).toHaveLength(n);
  });
  it("weekly volume is in a sensible range for chest", () => {
    const v = weeklyVolume(generatePlan(profile));
    expect(v.chest).toBeGreaterThanOrEqual(10);
    expect(v.chest).toBeLessThanOrEqual(30);
  });
  it("mesoWeek cycles 1..6", () => {
    const plan = { mesoStart: "2026-01-05" };
    expect(mesoWeek(plan, "2026-01-05")).toBe(1);
    expect(mesoWeek(plan, "2026-02-09")).toBe(6);
    expect(mesoWeek(plan, "2026-02-16")).toBe(1);
  });
  it("dayForDate respects swaps", () => {
    const plan = generatePlan(profile);
    const mon = "2026-10-12", tue = "2026-10-13";
    expect(dayForDate(plan, mon).weekday).toBe(0);
    const moves = { [mon]: plan.days[1].id, [tue]: plan.days[0].id };
    expect(dayForDate(plan, mon, moves).id).toBe(plan.days[1].id);
    expect(dayForDate(plan, tue, moves).id).toBe(plan.days[0].id);
  });
  it("home equipment only uses home gear", () => {
    expect(candidatesFor("h_press", { equipment: "home" }).every((e) => ["dumbbell", "bodyweight", "band", "kettlebell", "other"].includes(e.equipment))).toBe(true);
  });
});

describe("progression", () => {
  const item = { sets: 3, repMin: 8, repMax: 12, rir: 1 };
  const ex = EXERCISES.find((e) => e.id === "bb-bench");
  it("adds weight when every set hits the top", () => {
    const r = suggestNext(item, [{ date: "x", sets: [12, 12, 12].map((reps) => ({ kg: 80, reps, done: true })) }], ex);
    expect(r.kg).toBe(82.5);
  });
  it("holds weight otherwise", () => {
    const r = suggestNext(item, [{ date: "x", sets: [12, 10, 9].map((reps) => ({ kg: 80, reps, done: true })) }], ex);
    expect(r.kg).toBe(80);
  });
  it("backs off after two misses", () => {
    const miss = { date: "x", sets: [7, 6, 6].map((reps) => ({ kg: 80, reps, done: true })) };
    expect(suggestNext(item, [miss, miss], ex).kg).toBe(76);
  });
  it("e1rm epley", () => expect(Math.round(e1rm(100, 5))).toBe(117));
  it("historyOf returns newest first", () => {
    const s = [
      { date: "2026-01-01", finishedAt: 1, entries: [{ exerciseId: "a", sets: [] }] },
      { date: "2026-02-01", finishedAt: 1, entries: [{ exerciseId: "a", sets: [] }] },
    ];
    expect(historyOf(s, "a")[0].date).toBe("2026-02-01");
  });
});

describe("cardio", () => {
  const liftDays = [0, 1, 2, 3, 4, 5].map((w) => ({ weekday: w, leg: w === 2 || w === 5 }));
  it("cut gets more sessions than bulk", () => {
    expect(weeklyIntents("hypertrophy", "cut").length).toBeGreaterThan(weeklyIntents("hypertrophy", "bulk").length);
  });
  it("hard sessions avoid leg days and the day before", () => {
    const plan = planCardio({ phase: "conditioning", goal: "cut", prefs: ["stairmaster", "rower", "bike", "airBike", "inclineWalk", "run"], liftDays });
    for (const s of plan.filter((p) => p.intent !== "z2")) {
      expect([2, 5]).not.toContain(s.weekday);
      expect([1, 4]).not.toContain(s.weekday);
    }
  });
  it("only uses preferred machines", () => {
    const plan = planCardio({ phase: "hybrid", goal: "maintain", prefs: ["rower", "inclineWalk"], liftDays });
    expect(plan.every((p) => ["rower", "inclineWalk"].includes(p.type))).toBe(true);
  });
  it("incline walk calories via ACSM", () => {
    const k = estimateKcal({ type: "inclineWalk", minutes: 30, speed: 4.8, incline: 12 }, 85);
    expect(k).toBeGreaterThan(250);
    expect(k).toBeLessThan(400);
  });
});

describe("nutrition", () => {
  const base = { sex: "male", weightKg: 85, heightCm: 182, age: 25, lifestyle: "mixed" };
  it("cut < maintain < bulk", () => {
    const c = computeTargets({ ...base, goal: "cut" }).kcal;
    const m = computeTargets({ ...base, goal: "maintain" }).kcal;
    const b = computeTargets({ ...base, goal: "bulk" }).kcal;
    expect(c).toBeLessThan(m);
    expect(m).toBeLessThan(b);
  });
  it("macros add up to kcal", () => {
    const t = computeTargets({ ...base, goal: "leanBulk", weeklyExerciseKcal: 3000 });
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal)).toBeLessThan(10);
  });
  it("meal plan lands near target kcal and protein", () => {
    const targets = computeTargets({ ...base, goal: "leanBulk", weeklyExerciseKcal: 3000 });
    const plan = planWeek({ targets, seed: 7 });
    expect(plan.days).toHaveLength(7);
    for (const d of plan.days) {
      const t = dayTotals(d);
      expect(Math.abs(t.kcal - targets.kcal) / targets.kcal).toBeLessThan(0.15);
      expect(t.p).toBeGreaterThan(targets.protein * 0.8);
      expect(t.p).toBeLessThan(targets.protein * 1.4);
    }
  });
  it("meal prep repeats lunches", () => {
    const targets = computeTargets({ ...base, goal: "maintain" });
    const plan = planWeek({ targets, seed: 3 });
    const lunch = (d) => plan.days[d].meals.find((m) => m.slot === "lunch").mealId;
    expect(lunch(0)).toBe(lunch(1));
    expect(lunch(1)).toBe(lunch(2));
  });
  it("shopping list sums foods", () => {
    const targets = computeTargets({ ...base, goal: "maintain" });
    expect(shoppingList(planWeek({ targets, seed: 3 })).length).toBeGreaterThan(5);
  });
  it("scaleFor resizes", () => {
    expect(scaleFor(mealById("chicken-rice-broc"), 800, 50).cf).toBeGreaterThan(0.5);
  });
  it("check-in", () => {
    expect(checkIn("bulk", 0).action).toBe("up");
    expect(checkIn("cut", -0.7).action).toBe("ok");
  });
  it("weekly rate from weights", () => {
    const w = Array.from({ length: 22 }, (_, i) => ({ date: addDays("2026-01-01", i), kg: 85 + i * 0.03 }));
    expect(weeklyRate(w)).toBeGreaterThan(0.15);
  });
});

describe("routines + sync + dates", () => {
  it("streak ignores unscheduled evenings", () => {
    const sat = "2026-10-10";
    const done = { [sat]: "back", [addDays(sat, -3)]: "mobility" };
    expect(dayIdx(sat)).toBe(5);
    expect(routineStreak(done, DEFAULT_SCHEDULE, addDays(sat, 1))).toBe(2);
  });
  it("decideSync", () => {
    expect(decideSync("2026-01-02T00:00:00Z", "2026-01-01T00:00:00Z")).toBe("push");
    expect(decideSync("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")).toBe("pull");
    expect(decideSync(null, null)).toBe("none");
  });
  it("weekStart is Monday", () => expect(weekStart("2026-10-18")).toBe("2026-10-12"));
});

import { dueDates, pendingRecurring, feedbackFor, monthSummary, SEED_CATS } from "../features/finance/engine.js";
describe("finance", () => {
  it("monthly on the 31st clamps to month end", () => {
    const d = dueDates({ interval: "monthly", day: 31, start: "2026-01-01" }, "2026-04-30");
    expect(d).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });
  it("yearly + weekly", () => {
    expect(dueDates({ interval: "yearly", day: 15, month: 3, start: "2025-01-01" }, "2026-12-31")).toEqual(["2025-03-15", "2026-03-15"]);
    expect(dueDates({ interval: "weekly", start: "2026-01-05" }, "2026-01-20")).toHaveLength(3);
  });
  it("recurring generation is idempotent", () => {
    let n = 0;
    const st = { entries: [], recurring: [{ id: "r", amount: 900, kind: "expense", cat: "Rent", interval: "monthly", day: 1, start: "2026-01-01" }] };
    const first = pendingRecurring(st, "2026-03-15", () => `id${n++}`);
    expect(first).toHaveLength(3);
    expect(pendingRecurring({ ...st, entries: first }, "2026-03-15")).toHaveLength(0);
  });
  it("budget feedback warns at 80 %", () => {
    const st = { cats: SEED_CATS, entries: [{ date: "2026-10-01", amount: 100, kind: "expense", cat: "Eating out" }] };
    expect(feedbackFor(st.entries[0], st).tone).toBe("warn");
  });
  it("summary", () => {
    const s = monthSummary([{ date: "2026-10-01", amount: 1000, kind: "income" }, { date: "2026-10-02", amount: 250, kind: "expense" }], "2026-10");
    expect(s.net).toBe(750);
    expect(s.savingsRate).toBe(75);
  });
});

import { buildIcs, fold } from "../lib/ics.js";
import { validateBackup } from "../lib/backup.js";
describe("ics + backup", () => {
  it("folds long lines at 75 octets and uses CRLF", () => {
    const f = fold("SUMMARY:" + "x".repeat(200));
    expect(f.split("\r\n ").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    const ics = buildIcs([{ uid: "a", date: "2026-10-12", title: "Back", start: "21:00", minutes: 7, alarm: true }]);
    expect(ics).toContain("DTSTART;TZID=Europe/Zurich:20261012T210000");
    expect(ics).toContain("DTEND;TZID=Europe/Zurich:20261012T210700");
    expect(ics.includes("\r\n")).toBe(true);
  });
  it("validates backups", () => {
    expect(validateBackup({ app: "x" }, ["profile"]).ok).toBe(false);
    expect(validateBackup({ app: "second-brain", schemaVersion: 2, data: { profile: {} } }, ["profile"]).ok).toBe(true);
    expect(validateBackup({ app: "second-brain", schemaVersion: 99, data: { profile: {} } }, ["profile"]).ok).toBe(false);
  });
});

import { matchLogs } from "../features/cardio/engine/cardio.js";
describe("cardio log matching", () => {
  const slots = [{ key: "2026-10-12#0", date: "2026-10-12" }, { key: "2026-10-15#1", date: "2026-10-15" }];
  it("links by slotKey and by same day", () => {
    const logs = [{ id: "a", date: "2026-10-12", slotKey: "2026-10-12#0" }, { id: "b", date: "2026-10-15" }, { id: "c", date: "2026-10-15" }];
    const m = matchLogs(slots, logs);
    expect(m["2026-10-12#0"].id).toBe("a");
    expect(m["2026-10-15#1"].id).toBe("b");
  });
  it("leaves unmatched suggestions alone", () => {
    expect(matchLogs(slots, [{ id: "x", date: "2026-10-13" }])).toEqual({});
  });
});

import { topUp, nextMealTarget, planWeek as planWeek2, dayTotals as dayTotals2, computeTargets as ct2 } from "../features/nutrition/engine/nutrition.js";
import { setUserMeals, SEED_MY_MEALS } from "../features/nutrition/data/meals.js";
describe("my meals + top-up", () => {
  const targets = ct2({ sex: "male", weightKg: 85, heightCm: 182, age: 25, lifestyle: "mixed", goal: "bulk", weeklyExerciseKcal: 3000 });
  it("plans only own meals in 'mine' mode, and they cover most of the day", () => {
    setUserMeals(SEED_MY_MEALS);
    const plan = planWeek2({ targets, seed: 5, source: "mine" });
    for (const d of plan.days) {
      expect(d.meals).toHaveLength(3);
      expect(d.meals.every((m) => m.mealId.startsWith("my-"))).toBe(true);
      const t = dayTotals2(d);
      expect(t.kcal / targets.kcal).toBeGreaterThan(0.75);
      expect(t.kcal / targets.kcal).toBeLessThan(1.0);
    }
    setUserMeals([]);
  });
  it("top-up closes protein then fat then carbs", () => {
    const items = topUp({ kcal: 700, p: 40, c: 60, f: 20 });
    expect(items[0].foodId).toBe("whey");
    expect(items.some((i) => i.foodId === "mixed-nuts")).toBe(true);
    const sum = items.reduce((a, i) => a + i.kcal, 0);
    expect(sum).toBeGreaterThan(400);
    expect(sum).toBeLessThan(950);
    expect(topUp({ kcal: 50, p: 5, c: 5, f: 2 })).toEqual([]);
  });
  it("next meal target shrinks as the day fills", () => {
    const a = nextMealTarget(targets, { kcal: 0, p: 0 }, 3);
    const b = nextMealTarget(targets, { kcal: 1500, p: 80 }, 1);
    expect(a.kcal).toBeGreaterThan(700);
    expect(b.kcal).toBeLessThan(targets.kcal);
  });
});

import { registerStore, replaceAll, getState } from "../lib/storage.js";
describe("storage", () => {
  it("cloud data from an older version gets new default fields", () => {
    registerStore("t-merge", () => ({ a: 1, added: [1, 2] }));
    replaceAll({ "t-merge": { a: 5 } });
    expect(getState("t-merge")).toEqual({ a: 5, added: [1, 2] });
  });
});

import { netAmount, myShare, openShares, owedByPerson, splitEqually, needTotals, needOf } from "../features/finance/engine.js";
describe("shared expenses + necessity", () => {
  const round = { id: "r", date: "2026-10-10", amount: 60, kind: "expense", cat: "Going out",
    shares: [{ id: "a", name: "Luca", amount: 15, received: true }, { id: "b", name: "Mia", amount: 15, received: false }, { id: "c", name: "Noah", amount: 15, received: false }] };
  it("only received shares reduce the expense", () => {
    expect(netAmount(round)).toBe(45);
    expect(myShare(round)).toBe(15);
  });
  it("lists open shares by person", () => {
    expect(openShares([round])).toHaveLength(2);
    expect(owedByPerson([round, { ...round, id: "r2", shares: [{ id: "d", name: "Mia", amount: 10, received: false }] }])[0]).toEqual(["Mia", 25]);
  });
  it("splits equally including me", () => {
    expect(splitEqually(60, ["A", "B", "C"])).toEqual([{ name: "A", amount: 15 }, { name: "B", amount: 15 }, { name: "C", amount: 15 }]);
  });
  it("necessity totals use entry override, then category", () => {
    const cats = { Rent: { need: "need" }, "Going out": { need: "want" } };
    expect(needOf({ cat: "Going out", need: "waste" }, cats)).toBe("waste");
    const t = needTotals([{ date: "2026-10-01", amount: 900, kind: "expense", cat: "Rent" }, round], cats, "2026-10");
    expect(t).toEqual({ need: 900, want: 45, waste: 0 });
  });
});

import { mealById as mealById3, setUserMeals as setUM, SEED_MY_MEALS as SEEDS, vegOf as vegOf3 } from "../features/nutrition/data/meals.js";
import { planWeek as pw3, computeTargets as ct3 } from "../features/nutrition/engine/nutrition.js";
describe("one vegetable per day", () => {
  it("variant ids swap the vegetable", () => {
    setUM(SEEDS);
    const m = mealById3("my-pasta-chicken~broccoli");
    expect(vegOf3(m)).toBe("broccoli");
    expect(m.items.filter((i) => ["bell-pepper", "zucchini", "mushrooms"].includes(i[0]))).toHaveLength(0);
    expect(m.name).toContain("broccoli");
  });
  it("lunch and dinner share a single vegetable each day", () => {
    setUM(SEEDS);
    const t = ct3({ sex: "male", weightKg: 85, heightCm: 182, age: 25, lifestyle: "mixed", goal: "bulk" });
    const plan = pw3({ targets: t, seed: 2 });
    for (const d of plan.days) {
      const vegs = new Set(d.meals.filter((m) => m.slot !== "breakfast").map((m) => vegOf3(mealById3(m.mealId))));
      expect(vegs.size).toBe(1);
    }
    expect(new Set(plan.days.map((d) => vegOf3(mealById3(d.meals[1].mealId)))).size).toBeGreaterThan(1);
    setUM([]);
  });
});

describe("nutrition label scan", () => {
  const near = (a, b, tol = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
  it("reads a bilingual Swiss label (per 100 g column first)", () => {
    const r = parseLabel(`Nährwerte / Valeurs nutritives   pro 100 g   pro Portion (40 g)
Energie / Énergie 1550 kJ (370 kcal) 620 kJ (148 kcal)
Fett / Matières grasses 12 g 4.8 g
davon gesättigte Fettsäuren / dont acides gras saturés 3,5 g 1,4 g
Kohlenhydrate / Glucides 50 g 20 g
davon Zucker / dont sucres 12 g 4.8 g
Ballaststoffe / Fibres alimentaires 5 g 2 g
Eiweiss / Protéines 10 g 4 g
Salz / Sel 0.5 g 0.2 g`);
    expect(r.kcal).toBe(370);
    expect(r.f).toBe(12);
    expect(r.c).toBe(50);
    expect(r.p).toBe(10);
    expect(r.basis).toBe("100g");
    expect(r.warning).toBeNull();
  });
  it("converts kJ, reads decimals with commas and wrapped values", () => {
    const r = parseLabel(`Energie 418 kJ
Fett
0,5 g
Kohlenhydrate 4,0 g
davon Zucker 4,0 g
Eiweiss 11 g`);
    expect(r.kcal).toBe(100);
    near(r.f, 0.5);
    near(r.c, 4);
    expect(r.p).toBe(11);
  });
  it("handles OCR noise: 'O' for zero, '<' values and '12g' read as '129'", () => {
    const r = parseLabel(`energy 7OO kj / 167 kcal
fat <0.5 g
carbohydrate 129
of which sugars 3 g
protein 1O g`);
    expect(r.kcal).toBe(167);
    near(r.f, 0.5);
    expect(r.c).toBe(12);
    expect(r.p).toBe(10);
  });
  it("reads unit-less kJ/kcal columns and Italian keywords", () => {
    const r = parseLabel(`kJ / kcal
Energia 1550 370
Grassi 12 g
di cui acidi grassi saturi 2 g
Carboidrati 50 g
Proteine 10 g`);
    expect(r.kcal).toBe(370);
    expect([r.f, r.c, r.p]).toEqual([12, 50, 10]);
  });
  it("flags missing or inconsistent values", () => {
    expect(labelWarning({ kcal: 370, p: 10, c: null, f: 12 })).toMatch(/Not all/);
    expect(labelWarning({ kcal: 100, p: 10, c: 50, f: 12 })).toMatch(/kcal/);
    expect(labelWarning({ kcal: 370, p: 60, c: 50, f: 12 })).toMatch(/100 g/);
    expect(parseLabel("random text without numbers").found).toEqual([]);
  });
  it("scales macros to the amount eaten", () => {
    expect(labelMacros({ kcal: 370, p: 10, c: 50, f: 12 }, 40)).toEqual({ kcal: 148, p: 4, c: 20, f: 4.8 });
    expect(labelMacros({ kcal: 148, p: 4, c: 20, f: 4.8 }, 80, 40)).toEqual({ kcal: 296, p: 8, c: 40, f: 9.6 });
  });
});

describe("nutrition label scan — OCR unit/decimal mix-ups", () => {
  it("uses the kcal to decide between '79' and '7g'", () => {
    // real values: P 7, C 60, F 3 → 4·7 + 4·60 + 9·3 = 295 kcal
    const r = parseLabel("Energie 1234 kJ / 295 kcal\nFett 39\nKohlenhydrate 60 g\nEiweiss 79");
    expect([r.p, r.c, r.f]).toEqual([7, 60, 3]);
  });
  it("restores a dropped decimal point ('3.5g' → '359')", () => {
    // P 20, C 2, F 3.5 → 80 + 8 + 31.5 ≈ 120 kcal
    const r = parseLabel("Energie 502 kJ / 120 kcal\nFett 359\nKohlenhydrate 2 g\nEiweiss 20 g");
    expect(r.f).toBe(3.5);
  });
  it("keeps a real 9 when it fits the kcal", () => {
    // P 19, C 0, F 1.5 → 76 + 13.5 ≈ 90 kcal
    const r = parseLabel("Energie 377 kJ / 90 kcal\nFett 1.5 g\nKohlenhydrate 0 g\nEiweiss 19");
    expect(r.p).toBe(19);
  });
});

describe("nutrition label scan — real OCR output", () => {
  it("reads Tesseract output of a greyscale label photo ('129g' for '12 g')", () => {
    const r = parseLabel(`Nährwerte / Valeurs nutritives pro 100 g pro Portion (40 g)
Energie / Energie 1550 kJ (370 kcal) 620 kJ (148 kcal)
Fett / Matières grasses 129g 4.89
davon gesättigte Fettsäuren 3.5g 1.49
Kohlenhydrate / Glucides 50g 20g
davon Zucker / dont sucres 129 489
Ballaststoffe / Fibres 59g 29
Eiweiss / Protéines 10g 49
Salz / Sel 0.5g 0.29`);
    expect([r.kcal, r.p, r.c, r.f]).toEqual([370, 10, 50, 12]);
    expect(r.warning).toBeNull();
  });
});
