import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNutrition } from "./store.js";
import { FOODS, FOOD_CATS } from "./data/foods.js";
import { Chips, Sheet, Field, NumInput, toast } from "../../components/ui.jsx";
import { AddFoodSheet } from "./shared.jsx";
import { num } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

function CustomFoodSheet({ onClose }) {
  const [, setN] = useNutrition();
  const [f, setF] = useState({ name: "", cat: "protein", kcal: null, p: null, c: null, fat: null, g: 100, label: "1 portion" });
  const ok = f.name.trim() && f.kcal != null;
  const save = () => {
    const food = { id: `custom-${uid()}`, name: f.name.trim(), cat: f.cat, per100: { kcal: f.kcal, p: f.p || 0, c: f.c || 0, f: f.fat || 0, fib: 0 }, portion: { g: f.g || 100, label: f.label }, cost: 2, custom: true };
    setN((x) => ({ ...x, customFoods: [...x.customFoods, food] }));
    toast("Food saved");
    onClose();
  };
  return (
    <Sheet title="New food (per 100 g)" onClose={onClose} area="food">
      <div className="stack">
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
  const list = useMemo(() => [...FOODS, ...n.customFoods].filter((f) =>
    (cat === "all" || f.cat === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase()))), [q, cat, n.customFoods]);
  return (
    <div className="stack">
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
      {logging && <AddFoodSheet onClose={() => setLogging(false)} />}
    </div>
  );
}
