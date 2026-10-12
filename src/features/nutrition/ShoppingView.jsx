import { useMemo, useState } from "react";
import { ShoppingCart, RotateCcw } from "lucide-react";
import { useNutrition } from "./store.js";
import { shoppingList } from "./engine/nutrition.js";
import { FOOD_CATS } from "./data/foods.js";
import { fmtG } from "./shared.jsx";
import { Chips, Check, Empty } from "../../components/ui.jsx";

const RANGES = { week: [0, 1, 2, 3, 4, 5, 6], first: [0, 1, 2], second: [3, 4, 5, 6] };

export default function ShoppingView() {
  const [n, setN] = useNutrition();
  const [range, setRange] = useState("first");
  const list = useMemo(() => shoppingList(n.plan, RANGES[range], n.customFoods), [n.plan, range, n.customFoods]);
  if (!n.plan) return <Empty>Build a meal plan first.</Empty>;
  const key = (id) => `${range}:${id}`;
  const groups = list.reduce((a, r) => { (a[r.food.cat] = a[r.food.cat] || []).push(r); return a; }, {});
  const left = list.filter((r) => !n.shopChecked[key(r.id)]).length;

  return (
    <div className="stack">
      <Chips value={range} onChange={setRange} options={[["first", "Shop 1 · Mon–Wed"], ["second", "Shop 2 · Thu–Sun"], ["week", "Whole week"]]} />
      <div className="between">
        <div className="hstack small"><ShoppingCart size={16} /> {left} of {list.length} items left</div>
        <button className="btn sm ghost" onClick={() => setN((x) => ({ ...x, shopChecked: Object.fromEntries(Object.entries(x.shopChecked).filter(([k]) => !k.startsWith(`${range}:`))) }))}><RotateCcw size={14} /> Reset</button>
      </div>
      {Object.entries(groups).map(([cat, rows]) => (
        <div key={cat}>
          <div className="eyebrow" style={{ margin: "6px 0" }}>{FOOD_CATS[cat]}</div>
          <div className="card flush list">
            {rows.map((r) => {
              const on = !!n.shopChecked[key(r.id)];
              return (
                <div key={r.id} className="row" style={on ? { opacity: 0.45 } : undefined}>
                  <Check on={on} label={r.food.name} onClick={() => setN((x) => ({ ...x, shopChecked: { ...x.shopChecked, [key(r.id)]: !on } }))} />
                  <div className="grow" style={on ? { textDecoration: "line-through" } : undefined}>{r.food.name}</div>
                  <span className="small muted">{fmtG(r.grams)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="xs faint">Amounts are raw weights for the planned portions. Round up to the next pack size.</div>
    </div>
  );
}
