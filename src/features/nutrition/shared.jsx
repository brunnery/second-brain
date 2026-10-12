/* Shared nutrition helpers + small components. */
import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNutrition } from "./store.js";
import { FOODS, FOOD_CATS, foodById, macrosOf } from "./data/foods.js";
import { MEALS, mealById, SLOT_NAMES } from "./data/meals.js";
import { mealMacros, itemGrams, scaleFor } from "./engine/nutrition.js";
import { Sheet, Field, NumInput, Chips, toast } from "../../components/ui.jsx";
import { uid } from "../../lib/uid.js";
import { today } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export const fmtG = (g) => (g >= 1000 ? `${num(g / 1000, 1)} kg` : `${Math.round(g / 5) * 5} g`);

export function MacroLine({ m, small }) {
  return (
    <span className={small ? "xs muted" : "small muted"}>
      {num(m.kcal)} kcal · <span style={{ color: "var(--protein)" }}>P {num(m.p)}</span> · <span style={{ color: "var(--carbs)" }}>C {num(m.c)}</span> · <span style={{ color: "var(--fat)" }}>F {num(m.f)}</span>
    </span>
  );
}

export function MealIngredients({ meal, pf = 1, cf = 1, customFoods = [] }) {
  return (
    <div className="stack-sm">
      {meal.items.map((it) => {
        const food = foodById(it[0], customFoods);
        const g = itemGrams(it, pf, cf, customFoods);
        return (
          <div key={it[0]} className="between small">
            <span>{food?.name}</span>
            <span className="muted">{fmtG(g)}{!it[2] && <span className="faint"> · fixed</span>}</span>
          </div>
        );
      })}
      {meal.how && meal.how !== "—" && <div className="xs muted" style={{ marginTop: 4 }}>{meal.how}</div>}
      <div className="xs faint">{meal.prep ? `${meal.prep} min` : "no cooking"}{meal.batch ? " · meal-prep friendly" : ""} · {["", "cheap", "normal price", "pricier"][meal.cost]}</div>
    </div>
  );
}

/** Log helpers */
export function useFoodLog(date = today()) {
  const [n, setN] = useNutrition();
  const entries = n.log[date] || [];
  const add = (entry) => setN((x) => ({ ...x, log: { ...x.log, [date]: [...(x.log[date] || []), { id: uid(), ...entry }] } }));
  const remove = (id) => {
    const prev = n.log[date] || [];
    setN((x) => ({ ...x, log: { ...x.log, [date]: (x.log[date] || []).filter((e) => e.id !== id) } }));
    toast("Removed", () => setN((x) => ({ ...x, log: { ...x.log, [date]: prev } })));
  };
  const addMeal = (mealId, slot, pf = 1, cf = 1, extra = {}) => {
    const meal = mealById(mealId);
    const m = mealMacros(meal, pf, cf, n.customFoods);
    add({ name: meal.name, slot, mealId, pf, cf, kcal: m.kcal, p: m.p, c: m.c, f: m.f, ...extra });
  };
  return { entries, add, remove, addMeal };
}

export function AddFoodSheet({ onClose, date = today(), defaultSlot = "snack" }) {
  const [n] = useNutrition();
  const { add, addMeal } = useFoodLog(date);
  const [mode, setMode] = useState("food");
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState(defaultSlot);
  const [pick, setPick] = useState(null);
  const [grams, setGrams] = useState(null);
  const [quick, setQuick] = useState({ name: "", kcal: null, p: null });
  const foods = useMemo(() => [...FOODS, ...n.customFoods].filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase())), [q, n.customFoods]);
  const meals = useMemo(() => MEALS.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase())), [q]);

  const addFood = () => {
    const g = grams ?? pick.portion.g;
    const m = macrosOf(pick, g);
    add({ name: pick.name, slot, foodId: pick.id, grams: g, kcal: m.kcal, p: m.p, c: m.c, f: m.f });
    toast(`${pick.name} added`);
    onClose();
  };

  return (
    <Sheet title="Add food" onClose={onClose} area="food">
      <div className="stack">
        <Chips value={slot} onChange={setSlot} options={Object.entries(SLOT_NAMES)} />
        <Chips value={mode} onChange={(v) => { setMode(v); setPick(null); }} options={[["food", "Food"], ["meal", "Meal"], ["quick", "Quick add"]]} />
        {mode !== "quick" && !pick && (
          <div className="hstack" style={{ position: "relative" }}>
            <Search size={17} className="faint" style={{ position: "absolute", left: 12 }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus aria-label="Search food" />
          </div>
        )}
        {mode === "food" && !pick && (
          <div className="card flush list" style={{ maxHeight: 360, overflowY: "auto" }}>
            {foods.slice(0, 60).map((f) => (
              <button key={f.id} className="row" onClick={() => { setPick(f); setGrams(f.portion.g); }}>
                <div className="grow"><div style={{ fontWeight: 600 }}>{f.name}</div><div className="meta">{f.portion.label} · {f.portion.g} g</div></div>
                <span className="xs muted">{num(f.per100.kcal)} kcal · P {num(f.per100.p, 1)}/100g</span>
              </button>
            ))}
          </div>
        )}
        {mode === "food" && pick && (
          <div className="stack">
            <div className="h3">{pick.name}</div>
            <Field label="Grams"><NumInput className="input big-num" value={grams} onChange={setGrams} /></Field>
            <Chips value={grams} onChange={setGrams} options={[0.5, 1, 1.5, 2].map((k) => [Math.round(pick.portion.g * k), `${k === 1 ? "" : k + "× "}${pick.portion.label}`])} />
            <MacroLine m={macrosOf(pick, grams ?? 0)} />
            <div className="hstack"><button className="btn ghost" onClick={() => setPick(null)}>Back</button><button className="btn primary grow" onClick={addFood}><Plus size={16} /> Add</button></div>
          </div>
        )}
        {mode === "meal" && (
          <div className="card flush list" style={{ maxHeight: 380, overflowY: "auto" }}>
            {meals.map((m) => (
              <button key={m.id} className="row" onClick={() => { addMeal(m.id, slot); toast(`${m.name} added`); onClose(); }}>
                <div className="grow"><div style={{ fontWeight: 600 }}>{m.name}</div><MacroLine m={mealMacros(m)} small /></div>
                <Plus size={16} />
              </button>
            ))}
          </div>
        )}
        {mode === "quick" && (
          <div className="stack">
            <Field label="Name"><input className="input" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} placeholder="e.g. Pizza at Mario's" /></Field>
            <div className="grid2">
              <Field label="kcal"><NumInput value={quick.kcal} onChange={(v) => setQuick({ ...quick, kcal: v })} /></Field>
              <Field label="Protein g"><NumInput value={quick.p} onChange={(v) => setQuick({ ...quick, p: v })} /></Field>
            </div>
            <button className="btn primary" disabled={!quick.kcal} onClick={() => {
              const p = quick.p || 0;
              add({ name: quick.name || "Quick add", slot, kcal: quick.kcal, p, c: Math.max(0, (quick.kcal - p * 4) * 0.55 / 4), f: Math.max(0, (quick.kcal - p * 4) * 0.45 / 9) });
              toast("Added"); onClose();
            }}><Plus size={16} /> Add</button>
            <div className="xs faint">Carbs/fat are estimated from the remaining calories.</div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Pick a different meal for a plan slot; portions rescale to the same calories. */
export function MealSwapSheet({ slot, currentId, kcal, protein, onPick, onClose }) {
  const [q, setQ] = useState("");
  const list = MEALS.filter((m) => m.slots.includes(slot) && (!q || m.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <Sheet title={`Swap ${SLOT_NAMES[slot].toLowerCase()}`} onClose={onClose} area="food">
      <div className="stack">
        <input className="input" placeholder="Search meals…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search meals" />
        <div className="xs faint">Portions are resized to ~{num(kcal)} kcal.</div>
        <div className="card flush list">
          {list.map((m) => {
            const sc = scaleFor(m, kcal, protein);
            return (
              <button key={m.id} className="row" onClick={() => { onPick(m.id, sc); onClose(); }} style={m.id === currentId ? { background: "var(--raised)" } : undefined}>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <MacroLine m={mealMacros(m, sc.pf, sc.cf)} small />
                </div>
                <span className="xs faint">{m.prep}′</span>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

export const CAT_OPTIONS = Object.entries(FOOD_CATS);
