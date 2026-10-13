import { useState } from "react";
import { Lock, Unlock, Replace, RefreshCw, Minus, Plus, ChevronDown, ChevronUp, Info, ChefHat, ArrowLeftRight, Sparkles } from "lucide-react";
import { useNutrition } from "./store.js";
import { mealById, SLOT_NAMES } from "./data/meals.js";
import { foodById } from "./data/foods.js";
import { mealMacros, dayTotals, topUp } from "./engine/nutrition.js";
import { useTargets, rebuildPlans } from "../coach.js";
import { MealIngredients, MacroLine, MealSwapSheet } from "./shared.jsx";
import MealBuilder from "./MealBuilder.jsx";
import { Chips, Toggle, Note, Sheet, toast } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import { WEEKDAYS, dayIdx, today } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export default function MealPlanView() {
  const [n, setN] = useNutrition();
  const t = useTargets();
  const [d, setD] = useState(dayIdx(today()));
  const [open, setOpen] = useState(null);
  const [swap, setSwap] = useState(null);
  const [build, setBuild] = useState(null);
  const [moving, setMoving] = useState(null);
  const plan = n.plan;
  const source = n.planSettings?.source ?? "mine";

  const setDayMeals = (k, fn) => setN((x) => ({ ...x, plan: { ...x.plan, days: x.plan.days.map((day, i) => (i === k ? { ...day, meals: fn(day.meals) } : day)) } }));
  const setMeal = (si, patch) => setDayMeals(d, (ms) => ms.map((m) => (m.si === si ? { ...m, ...patch } : m)));
  const setSettings = (patch) => setN((x) => ({ ...x, planSettings: { ...x.planSettings, ...patch } }));

  /** Swap this meal with the same slot on another day (both get locked so a rebuild keeps them). */
  const moveTo = (pm, target) => {
    setN((x) => {
      const days = x.plan.days.map((day) => ({ ...day, meals: [...day.meals] }));
      const a = days[d].meals.findIndex((m) => m.si === pm.si);
      const b = days[target].meals.findIndex((m) => m.slot === pm.slot);
      if (a < 0) return x;
      if (b < 0) { days[target].meals.push({ ...days[d].meals[a], si: days[target].meals.length, locked: true }); days[d].meals.splice(a, 1); }
      else {
        const ma = days[d].meals[a], mb = days[target].meals[b];
        days[d].meals[a] = { ...mb, si: ma.si, locked: true };
        days[target].meals[b] = { ...ma, si: mb.si, locked: true };
      }
      return { ...x, plan: { ...x.plan, days } };
    });
    toast(`Moved to ${WEEKDAYS[target]}`);
  };

  if (!plan) {
    return <Note icon={Info}>No meal plan yet. <button className="btn sm primary" onClick={() => rebuildPlans({ training: false })}>Build meal plan</button></Note>;
  }
  const day = plan.days[d];
  const tot = dayTotals(day, n.customFoods);
  const fill = topUp({ kcal: t.kcal - tot.kcal, p: t.protein - tot.p, c: t.carbs - tot.c, f: t.fat - tot.f });
  const withFill = fill.reduce((a, x) => a + x.kcal, tot.kcal);

  return (
    <div className="stack">
      <Chips value={d} onChange={setD} options={WEEKDAYS.map((w, i) => [i, w])} />
      <div className="card tight">
        <div className="between">
          <div className="h3">{WEEKDAYS[d]}</div>
          <span className="xs muted">target {num(t.kcal)} kcal · P {t.protein}</span>
        </div>
        <div className="small" style={{ marginTop: 4 }}>Meals: <MacroLine m={tot} small /></div>
        {fill.length > 0 && (
          <div className="small hstack" style={{ marginTop: 6, gap: 6, alignItems: "flex-start" }}>
            <Sparkles size={14} className="accent" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>Top-up: {fill.map((x) => `${foodById(x.foodId)?.name.split(/[,(]/)[0]} ${x.grams} ${x.foodId.startsWith("milk") ? "ml" : "g"}`).join(" · ")} <span className="muted">→ {num(withFill)} kcal</span></span>
          </div>
        )}
      </div>

      {day.meals.map((pm) => {
        const meal = mealById(pm.mealId);
        if (!meal) return null;
        const m = mealMacros(meal, pm.pf, pm.cf, n.customFoods);
        const isOpen = open === pm.si;
        return (
          <div key={pm.si} className="card tight" style={pm.locked ? { borderColor: "color-mix(in srgb, var(--food) 45%, var(--line))" } : undefined}>
            <div className="between" style={{ alignItems: "flex-start" }}>
              <button className="grow" style={{ background: "none", border: 0, padding: 0, textAlign: "left" }} onClick={() => setOpen(isOpen ? null : pm.si)}>
                <div className="eyebrow">{SLOT_NAMES[pm.slot]}{meal.mine ? " · my meal" : ""}{pm.locked ? " · locked" : ""}</div>
                <div className="h3 hstack" style={{ gap: 6 }}>{meal.name} {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
                <MacroLine m={m} small />
              </button>
              <button className="iconbtn sm" aria-label={pm.locked ? "Unlock meal" : "Lock meal"} onClick={() => setMeal(pm.si, { locked: !pm.locked })}>
                {pm.locked ? <Lock size={15} color="var(--food)" /> : <Unlock size={15} />}
              </button>
            </div>
            {isOpen && <div style={{ marginTop: 10 }}><MealIngredients meal={meal} pf={pm.pf} cf={pm.cf} customFoods={n.customFoods} /></div>}
            <div className="hstack wrap" style={{ gap: 6, marginTop: 10 }}>
              <button className="btn sm ghost" onClick={() => setSwap({ pm, kcal: m.kcal, protein: m.p })}><Replace size={14} /> Swap</button>
              <button className="btn sm ghost" onClick={() => setBuild({ pm, kcal: m.kcal, protein: m.p, initial: { name: meal.mine ? meal.name : "", items: meal.items } })}><ChefHat size={14} /> Ingredients</button>
              <button className="btn sm ghost" onClick={() => setMoving(pm)}><ArrowLeftRight size={14} /> Move</button>
              <span className="grow" />
              <button className="iconbtn sm" aria-label="Smaller portion" onClick={() => setMeal(pm.si, { cf: Math.max(0.3, +(pm.cf * 0.9).toFixed(2)), pf: Math.max(0.4, +(pm.pf * 0.95).toFixed(2)), locked: true })}><Minus size={14} /></button>
              <button className="iconbtn sm" aria-label="Bigger portion" onClick={() => setMeal(pm.si, { cf: +(pm.cf * 1.1).toFixed(2), pf: +(pm.pf * 1.05).toFixed(2), locked: true })}><Plus size={14} /></button>
            </div>
          </div>
        );
      })}

      <div className="card stack-sm">
        <div className="h3">How should the plan be built?</div>
        <Chips value={source} onChange={(v) => setSettings({ source: v })} options={[["mine", "My meals"], ["mix", "Mix"], ["ideas", "New ideas"]]} />
        <div className="xs muted">
          {source === "mine" ? "Uses your own meals for breakfast, lunch and dinner (~85 % of the day) — the rest is a top-up (shake, nuts, oats) sized to your goal."
            : source === "mix" ? "Mostly your meals, sometimes a new idea from the recipe library."
              : "Recipes from the library plus snacks."}
        </div>
        <button className="btn sm ghost" style={{ alignSelf: "flex-start" }} onClick={() => go("food/foods")}>Manage my meals</button>
        <div className="divider" />
        <div className="between">
          <div><div className="small" style={{ fontWeight: 650 }}>Meal prep</div><div className="xs muted">Same lunch & dinner Mon–Wed and Thu–Sat.</div></div>
          <Toggle on={n.planSettings.mealPrep} onChange={(v) => setSettings({ mealPrep: v })} label="Meal prep" />
        </div>
        {source !== "mine" && (
          <>
            <div className="small" style={{ fontWeight: 650 }}>Budget</div>
            <Chips value={n.planSettings.maxCost} onChange={(v) => setSettings({ maxCost: v })} options={[[1, "Cheapest"], [2, "Normal"], [3, "Anything"]]} />
          </>
        )}
        <button className="btn primary mt" onClick={() => { rebuildPlans({ training: false }); toast("New meal plan — locked meals kept"); }}>
          <RefreshCw size={16} /> New meal plan for the week
        </button>
        <div className="xs faint">Changed, moved or resized meals are locked automatically and survive a new plan.</div>
      </div>

      {swap && (
        <MealSwapSheet slot={swap.pm.slot} currentId={swap.pm.mealId} kcal={swap.kcal} protein={swap.protein} onClose={() => setSwap(null)}
          onPick={(mealId, sc) => setMeal(swap.pm.si, { mealId, ...sc, locked: true })}
          onBuild={() => setBuild({ pm: swap.pm, kcal: swap.kcal, protein: swap.protein, initial: {} })} />
      )}
      {build && (
        <MealBuilder mode="plan" slot={build.pm.slot} initial={{ ...build.initial, slots: [build.pm.slot] }} target={{ kcal: build.kcal, protein: build.protein }}
          onClose={() => setBuild(null)}
          onDone={(r) => { setMeal(build.pm.si, { mealId: r.template.id, ...r.sc, locked: true }); toast("Meal updated (saved to My meals)"); }} />
      )}
      {moving && (
        <Sheet title={`Move ${SLOT_NAMES[moving.slot].toLowerCase()} to…`} onClose={() => setMoving(null)} area="food">
          <div className="stack-sm">
            <div className="small muted">Swaps with that day's {SLOT_NAMES[moving.slot].toLowerCase()}.</div>
            <Chips value={null} onChange={(k) => { moveTo(moving, k); setMoving(null); }} options={WEEKDAYS.map((w, i) => [i, w]).filter(([i]) => i !== d)} />
          </div>
        </Sheet>
      )}
    </div>
  );
}
