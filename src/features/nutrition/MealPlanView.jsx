import { useState } from "react";
import { Lock, Unlock, Replace, RefreshCw, Minus, Plus, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useNutrition } from "./store.js";
import { mealById, SLOT_NAMES } from "./data/meals.js";
import { mealMacros, dayTotals } from "./engine/nutrition.js";
import { useTargets, rebuildPlans } from "../coach.js";
import { MealIngredients, MacroLine, MealSwapSheet } from "./shared.jsx";
import { Chips, Toggle, Note, toast } from "../../components/ui.jsx";
import { WEEKDAYS, dayIdx, today } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export default function MealPlanView() {
  const [n, setN] = useNutrition();
  const t = useTargets();
  const [d, setD] = useState(dayIdx(today()));
  const [open, setOpen] = useState(null);
  const [swap, setSwap] = useState(null);
  const plan = n.plan;

  const setMeal = (si, patch) => setN((x) => ({
    ...x, plan: { ...x.plan, days: x.plan.days.map((day, k) => (k === d ? { ...day, meals: day.meals.map((m) => (m.si === si ? { ...m, ...patch } : m)) } : day)) },
  }));
  const setSettings = (patch) => setN((x) => ({ ...x, planSettings: { ...x.planSettings, ...patch } }));

  if (!plan) {
    return <Note icon={Info}>No meal plan yet. <button className="btn sm primary" onClick={() => rebuildPlans({ training: false })}>Build meal plan</button></Note>;
  }
  const day = plan.days[d];
  const tot = dayTotals(day, n.customFoods);
  const diff = tot.kcal - t.kcal;

  return (
    <div className="stack">
      <Chips value={d} onChange={setD} options={WEEKDAYS.map((w, i) => [i, w])} />
      <div className="card tight">
        <div className="between">
          <div className="h3">{WEEKDAYS[d]} total</div>
          <span className={`small ${Math.abs(diff) > t.kcal * 0.08 ? "warn" : "good"}`}>{diff >= 0 ? "+" : ""}{num(diff)} kcal vs target</span>
        </div>
        <MacroLine m={tot} />
        <div className="xs faint">Target {num(t.kcal)} kcal · P {t.protein} · C {t.carbs} · F {t.fat}</div>
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
                <div className="eyebrow">{SLOT_NAMES[pm.slot]}{pm.locked ? " · locked" : ""}</div>
                <div className="h3 hstack" style={{ gap: 6 }}>{meal.name} {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
                <MacroLine m={m} small />
              </button>
              <button className="iconbtn sm" aria-label={pm.locked ? "Unlock meal" : "Lock meal"} onClick={() => setMeal(pm.si, { locked: !pm.locked })}>
                {pm.locked ? <Lock size={15} color="var(--food)" /> : <Unlock size={15} />}
              </button>
            </div>
            {isOpen && <div style={{ marginTop: 10 }}><MealIngredients meal={meal} pf={pm.pf} cf={pm.cf} customFoods={n.customFoods} /></div>}
            <div className="hstack" style={{ gap: 6, marginTop: 10 }}>
              <button className="btn sm ghost" onClick={() => setSwap({ pm, kcal: m.kcal, protein: m.p })}><Replace size={14} /> Swap</button>
              <span className="grow" />
              <span className="xs muted">Portion</span>
              <button className="iconbtn sm" aria-label="Smaller portion" onClick={() => setMeal(pm.si, { cf: Math.max(0.3, +(pm.cf * 0.9).toFixed(2)), pf: Math.max(0.4, +(pm.pf * 0.95).toFixed(2)), locked: true })}><Minus size={14} /></button>
              <button className="iconbtn sm" aria-label="Bigger portion" onClick={() => setMeal(pm.si, { cf: +(pm.cf * 1.1).toFixed(2), pf: +(pm.pf * 1.05).toFixed(2), locked: true })}><Plus size={14} /></button>
            </div>
          </div>
        );
      })}

      <div className="card stack-sm">
        <div className="h3">Plan settings</div>
        <div className="between">
          <div><div className="small" style={{ fontWeight: 650 }}>Meal prep</div><div className="xs muted">Same lunch & dinner Mon–Wed and Thu–Sat. Cook twice a week.</div></div>
          <Toggle on={n.planSettings.mealPrep} onChange={(v) => setSettings({ mealPrep: v })} label="Meal prep" />
        </div>
        <div className="small" style={{ fontWeight: 650 }}>Budget</div>
        <Chips value={n.planSettings.maxCost} onChange={(v) => setSettings({ maxCost: v })} options={[[1, "Cheapest"], [2, "Normal"], [3, "Anything"]]} />
        <button className="btn primary mt" onClick={() => { rebuildPlans({ training: false }); toast("New meal plan — locked meals kept"); }}>
          <RefreshCw size={16} /> New meal plan for the week
        </button>
        <div className="xs faint">Swapped or resized meals are locked automatically and survive a new plan. Unlock to let them change.</div>
      </div>

      {swap && (
        <MealSwapSheet slot={swap.pm.slot} currentId={swap.pm.mealId} kcal={swap.kcal} protein={swap.protein} onClose={() => setSwap(null)}
          onPick={(mealId, sc) => setMeal(swap.pm.si, { mealId, ...sc, locked: true })} />
      )}
    </div>
  );
}
