import { useMemo, useState } from "react";
import { Search, Plus, ChefHat, Camera } from "lucide-react";
import { useLabelScan, ScanStatus } from "./ScanLabel.jsx";
import MealBuilder from "./MealBuilder.jsx";
import { SLOT_NAMES } from "./data/meals.js";
import { useNutrition } from "./store.js";
import { FOODS, FOOD_CATS, foodById } from "./data/foods.js";
import { Chips, Sheet, Field, NumInput, toast } from "../../components/ui.jsx";
import { AddFoodSheet } from "./shared.jsx";
import { num } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

function CustomFoodSheet({ onClose }) {
  const [, setN] = useNutrition();
  const [f, setF] = useState({ name: "", cat: "protein", kcal: null, p: null, c: null, fat: null, g: 100, label: "1 portion" });
  const ok = f.name.trim() && f.kcal != null;
  // fill the per-100 g fields from a label photo (only 100 g columns are read; check before saving)
  const scan = useLabelScan((r) => r && setF((x) => ({ ...x, kcal: r.kcal ?? x.kcal, p: r.p ?? x.p, c: r.c ?? x.c, fat: r.f ?? x.fat, g: r.portionG || x.g })));
  const save = () => {
    const food = { id: `custom-${uid()}`, name: f.name.trim(), cat: f.cat, per100: { kcal: f.kcal, p: f.p || 0, c: f.c || 0, f: f.fat || 0, fib: 0 }, portion: { g: f.g || 100, label: f.label }, cost: 2, custom: true };
    setN((x) => ({ ...x, customFoods: [...x.customFoods, food] }));
    toast("Food saved");
    onClose();
  };
  return (
    <Sheet title="New food (per 100 g)" onClose={onClose} area="food">
      <div className="stack">
        {scan.input}
        <button className="btn" disabled={scan.busy} onClick={scan.open}><Camera size={16} /> Fill from label photo</button>
        <ScanStatus scan={scan} />
        <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="From the label" /></Field>
        <Field label="Category">
          <select className="input" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
            {Object.entries(FOOD_CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="grid2">
          <Field label="kcal / 100 g"><NumInput value={f.kcal} onChange={(v) => setF({ ...f, kcal: v })} /></Field>
          <Field label="Protein g"><NumInput value={f.p} onChange={(v) => setF({ ...f, p: v })} /></Field>
          <Field label="Carbs g"><NumInput value={f.c} onChange={(v) => setF({ ...f, c: v })} /></Field>
          <Field label="Fat g"><NumInput value={f.fat} onChange={(v) => setF({ ...f, fat: v })} /></Field>
          <Field label="Portion g"><NumInput value={f.g} onChange={(v) => setF({ ...f, g: v })} /></Field>
          <Field label="Portion name"><input className="input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
        </div>
        <button className="btn primary" disabled={!ok} onClick={save}>Save food</button>
      </div>
    </Sheet>
  );
}

export default function FoodsView() {
  const [n] = useNutrition();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const list = useMemo(() => [...FOODS, ...n.customFoods].filter((f) =>
    (cat === "all" || f.cat === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase()))), [q, cat, n.customFoods]);
  return (
    <div className="stack">
      <div className="between"><h2 className="h2">My meals</h2><button className="btn sm" onClick={() => setEditMeal({})}><Plus size={14} /> New</button></div>
      <div className="xs muted" style={{ marginTop: -6 }}>Your go-to meals. The plan uses them, and the app sizes the portions to your goal.</div>
      <div className="card flush list">
        {n.myMeals.length === 0 && <div className="empty">No own meals yet.</div>}
        {n.myMeals.map((m) => (
          <button key={m.id} className="row" onClick={() => setEditMeal(m)}>
            <ChefHat size={16} className="faint" />
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div className="meta">{m.slots.map((x) => SLOT_NAMES[x]).join(", ")} · {m.items.map((i) => foodById(i[0])?.name.split(/[,(]/)[0]).join(", ")}</div>
            </div>
          </button>
        ))}
      </div>

      <h2 className="h2 mt">Food database</h2>
      <div className="hstack" style={{ position: "relative" }}>
        <Search size={17} className="faint" style={{ position: "absolute", left: 12 }} />
        <input className="input" style={{ paddingLeft: 36 }} placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />
        <button className="iconbtn" aria-label="Add custom food" onClick={() => setAdding(true)}><Plus size={18} /></button>
      </div>
      <Chips scroll value={cat} onChange={setCat} options={[["all", "All"], ...Object.entries(FOOD_CATS)]} />
      <div className="card flush list">
        {list.map((f) => (
          <button key={f.id} className="row" onClick={() => setLogging(true)}>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{f.name}{f.custom && <span className="badge" style={{ marginLeft: 6 }}>mine</span>}</div>
              <div className="meta">per 100 g · {num(f.per100.kcal)} kcal · P {num(f.per100.p, 1)} · C {num(f.per100.c, 1)} · F {num(f.per100.f, 1)}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="xs faint">Values are approximate (Swiss food composition database / USDA). For branded products, add your own from the label.</div>
      {adding && <CustomFoodSheet onClose={() => setAdding(false)} />}
      {editMeal && <MealBuilder mode="edit" initial={editMeal.id ? editMeal : { slots: ["lunch", "dinner"], items: [] }} onClose={() => setEditMeal(null)} />}
      {logging && <AddFoodSheet onClose={() => setLogging(false)} />}
    </div>
  );
}
