/* ================================================================
   MEAL BUILDER — "here's what I'm cooking, tell me how much".
   Pick ingredients (or start from a saved meal). Ingredients marked
   "auto" are sized by the app to hit the meal's calorie + protein aim;
   "fixed" ones (veg, oil, sauce) keep the grams you enter.
   Used to log a meal, to change a planned meal and to edit "My meals".
   ================================================================ */
import { useMemo, useState } from "react";
import { Search, X, Check, Save, Trash2, Wand2 } from "lucide-react";
import { useNutrition } from "./store.js";
import { allFoods, foodById, FOOD_CATS } from "./data/foods.js";
import { SLOT_NAMES } from "./data/meals.js";
import { scaleFor, itemGrams, mealMacros } from "./engine/nutrition.js";
import { Sheet, Field, NumInput, Chips, Toggle, toast } from "../../components/ui.jsx";
import { MacroLine } from "./shared.jsx";
import { uid } from "../../lib/uid.js";
import { num } from "../../lib/format.js";

const STAPLES = ["pasta", "rice", "potato", "wholegrain-bread", "chicken-breast", "beef-mince-5", "egg", "chicken-cold-cuts",
  "bell-pepper", "zucchini", "broccoli", "mushrooms", "olive-oil", "tomato-sauce", "skyr", "tuna-can"];
const AUTO_CATS = ["protein", "dairy", "legumes", "grains", "supps"];
export const defaultScalable = (foodId) => AUTO_CATS.includes(foodById(foodId)?.cat);

/** "≈ 2 slices" style hint from a food's portion label. */
function portionHint(food, g) {
  const m = /^1\s+(.+)$/.exec(food.portion.label || "");
  if (!m || !food.portion.g) return null;
  const n = g / food.portion.g;
  if (n < 0.4 || n > 12) return null;
  return `≈ ${Math.round(n * 2) / 2} × ${m[1]}`;
}

/**
 * props: initial { id?, name, slots, items: [[foodId, grams, scalable]] }
 *        mode: "cook" (log it) | "edit" (my meal) | "plan" (replace a planned meal)
 *        slot, target { kcal, protein }, onDone(result), onClose
 */
export default function MealBuilder({ initial = {}, mode = "cook", slot: slot0 = "lunch", target, onDone, onClose }) {
  const [, setN] = useNutrition();
  const [name, setName] = useState(initial.name || "");
  const [slots, setSlots] = useState(initial.slots || [slot0]);
  const [slot, setSlot] = useState(slot0);
  const [items, setItems] = useState(initial.items || []);
  const [kcal, setKcal] = useState(Math.round(target?.kcal || 800));
  const [protein, setProtein] = useState(Math.round(target?.protein || 45));
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [saveMine, setSaveMine] = useState(false);

  const meal = { items };
  const hasAuto = items.some((i) => i[2]);
  const sc = useMemo(() => (hasAuto ? scaleFor({ items }, kcal || 0, protein || null) : { pf: 1, cf: 1 }), [items, kcal, protein, hasAuto]);
  const totals = mealMacros(meal, sc.pf, sc.cf);
  const results = useMemo(() => (q.trim() ? allFoods().filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30) : []), [q]);

  const add = (foodId) => {
    if (items.some((i) => i[0] === foodId)) return;
    const f = foodById(foodId);
    setItems([...items, [foodId, f.portion.g, defaultScalable(foodId)]]);
    setQ(""); setSearching(false);
  };
  const setItem = (k, patch) => setItems(items.map((it, i) => (i === k ? [patch[0] ?? it[0], patch[1] ?? it[1], patch[2] ?? it[2]] : it)));
  const finalItems = items.map((it) => ({ foodId: it[0], grams: Math.round(itemGrams(it, sc.pf, sc.cf) / 5) * 5 }));
  const mealName = name.trim() || items.slice(0, 3).map((i) => foodById(i[0])?.name.split(/[ ,(]/)[0]).join(", ") || "Meal";

  const saveAsMine = () => {
    const tpl = { id: initial.id && mode === "edit" ? initial.id : `my-${uid()}`, name: mealName, slots, prep: initial.prep ?? 15, batch: initial.batch ?? true, cost: 1, mine: true, items, how: initial.how || "" };
    setN((x) => ({ ...x, myMeals: x.myMeals.some((m) => m.id === tpl.id) ? x.myMeals.map((m) => (m.id === tpl.id ? tpl : m)) : [...x.myMeals, tpl] }));
    return tpl;
  };

  const primary = () => {
    if (mode === "edit") { saveAsMine(); toast("Saved to My meals"); onClose(); return; }
    const tpl = saveMine || mode === "plan" ? saveAsMine() : null;
    onDone?.({ name: mealName, slot, items: finalItems, macros: totals, sc, template: tpl, rawItems: items });
    onClose();
  };

  return (
    <Sheet title={mode === "edit" ? (initial.id ? "Edit my meal" : "New meal") : mode === "plan" ? "Change this meal" : "What are you cooking?"} onClose={onClose} area="food">
      <div className="stack">
        <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={mealName} /></Field>
        {mode === "edit"
          ? <Field label="Good for"><Chips multi value={slots} onChange={setSlots} options={Object.entries(SLOT_NAMES)} /></Field>
          : mode === "cook" && <Chips value={slot} onChange={setSlot} options={Object.entries(SLOT_NAMES)} />}

        {mode !== "edit" && (
          <div className="card tight">
            <div className="hstack" style={{ gap: 6, marginBottom: 6 }}><Wand2 size={15} className="accent" /><b className="small">Aim for this meal</b></div>
            <div className="grid2">
              <Field label="kcal"><NumInput value={kcal} onChange={setKcal} /></Field>
              <Field label="Protein g"><NumInput value={protein} onChange={setProtein} /></Field>
            </div>
            <div className="xs faint" style={{ marginTop: 6 }}>Pre-filled from what's still open today. “Auto” ingredients are sized to hit it.</div>
          </div>
        )}

        <div className="card flush list">
          {items.length === 0 && <div className="empty">Add what you have — e.g. pasta, chicken, peppers.</div>}
          {items.map((it, k) => {
            const f = foodById(it[0]);
            if (!f) return null;
            const g = itemGrams(it, sc.pf, sc.cf);
            return (
              <div key={it[0]} className="row" style={{ alignItems: "center" }}>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }} className="truncate">{f.name}</div>
                  <div className="xs muted">{it[2] ? <><b className="accent">{num(Math.round(g / 5) * 5)} g</b>{portionHint(f, g) ? ` · ${portionHint(f, g)}` : ""}</> : "fixed amount"}</div>
                </div>
                {!it[2] && <NumInput className="input" value={it[1]} onChange={(v) => v != null && setItem(k, [null, v])} aria-label={`${f.name} grams`} style={{ width: 72, minHeight: 36, padding: "4px 8px", textAlign: "right" }} />}
                <button className={`chip ${it[2] ? "on" : ""}`} style={{ minHeight: 30 }} onClick={() => setItem(k, [null, it[1], !it[2]])} aria-label="Toggle auto amount">{it[2] ? "auto" : "fixed"}</button>
                <button className="iconbtn sm bare" aria-label={`Remove ${f.name}`} onClick={() => setItems(items.filter((_, i) => i !== k))}><X size={16} /></button>
              </div>
            );
          })}
        </div>

        <div className="chips scroll">
          {STAPLES.filter((id) => !items.some((i) => i[0] === id)).map((id) => (
            <button key={id} className="chip" onClick={() => add(id)}>+ {foodById(id)?.name.split(/[,(]/)[0]}</button>
          ))}
        </div>
        {searching ? (
          <div className="stack-sm">
            <div className="hstack" style={{ position: "relative" }}>
              <Search size={17} className="faint" style={{ position: "absolute", left: 12 }} />
              <input className="input" style={{ paddingLeft: 36 }} autoFocus placeholder="Search any food…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search food" />
            </div>
            {results.length > 0 && (
              <div className="card flush list" style={{ maxHeight: 240, overflowY: "auto" }}>
                {results.map((f) => (
                  <button key={f.id} className="row" onClick={() => add(f.id)}>
                    <div className="grow"><div style={{ fontWeight: 600 }}>{f.name}</div><div className="meta">{FOOD_CATS[f.cat]} · {num(f.per100.kcal)} kcal / 100 g</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : <button className="btn sm ghost" onClick={() => setSearching(true)}><Search size={14} /> Other ingredient</button>}

        {items.length > 0 && (
          <div className="card tight">
            <div className="between"><b className="small">This meal</b><MacroLine m={totals} small /></div>
            {mode !== "edit" && Math.abs(totals.kcal - kcal) > kcal * 0.12 && hasAuto && (
              <div className="xs warn" style={{ marginTop: 4 }}>Can't hit {num(kcal)} kcal with sensible portions — add a carb or protein source, or set more items to “auto”.</div>
            )}
          </div>
        )}

        {mode === "cook" && (
          <div className="between small"><span>Also save to My meals</span><Toggle on={saveMine} onChange={setSaveMine} label="Save to my meals" /></div>
        )}
        <button className="btn primary" disabled={!items.length} onClick={primary}>
          {mode === "edit" ? <><Save size={16} /> Save meal</> : mode === "plan" ? <><Check size={16} /> Use in plan</> : <><Check size={16} /> Log this meal</>}
        </button>
        {mode === "edit" && initial.id && (
          <button className="btn danger" onClick={() => {
            setN((x) => ({ ...x, myMeals: x.myMeals.filter((m) => m.id !== initial.id) }));
            toast("Meal deleted"); onClose();
          }}><Trash2 size={15} /> Delete meal</button>
        )}
      </div>
    </Sheet>
  );
}

/** Log a builder result as one food-log entry. */
export const builderEntry = (r, extra = {}) => ({
  name: r.name, slot: r.slot, kcal: r.macros.kcal, p: r.macros.p, c: r.macros.c, f: r.macros.f, items: r.items, ...extra,
});
