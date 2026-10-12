import { useState } from "react";
import { Check, Plus, Replace, Trash2, Pill, TrendingUp, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useNutrition } from "./store.js";
import { useProfile } from "../profile/store.js";
import { GOALS } from "../profile/goals.js";
import { mealById, SLOT_NAMES } from "./data/meals.js";
import { mealMacros } from "./engine/nutrition.js";
import { sumMacros } from "./data/foods.js";
import { useTargets, rebuildPlans } from "../coach.js";
import { useFoodLog, AddFoodSheet, MealIngredients, MacroLine, MealSwapSheet } from "./shared.jsx";
import { Ring, Bar, Check as CheckBox, Note, toast } from "../../components/ui.jsx";
import { today, dayIdx } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export function MacroTargets({ eaten, t }) {
  const rows = [["Protein", eaten.p, t.protein, "var(--protein)"], ["Carbs", eaten.c, t.carbs, "var(--carbs)"], ["Fat", eaten.f, t.fat, "var(--fat)"]];
  return (
    <div className="hstack" style={{ gap: 16, alignItems: "center" }}>
      <Ring value={eaten.kcal} max={t.kcal} size={112} stroke={11} color="var(--food)">
        <div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>{num(Math.max(0, t.kcal - eaten.kcal))}</div>
          <div className="xs muted">kcal left</div>
        </div>
      </Ring>
      <div className="grow stack-sm">
        {rows.map(([name, v, max, color]) => (
          <div key={name}>
            <div className="between xs"><span style={{ fontWeight: 700 }}>{name}</span><span className="muted">{num(v)} / {num(max)} g</span></div>
            <Bar value={v} max={max} color={color} thin />
          </div>
        ))}
        <div className="xs muted">{num(eaten.kcal)} / {num(t.kcal)} kcal</div>
      </div>
    </div>
  );
}

export default function TodayFood() {
  const [n, setN] = useNutrition();
  const [profile] = useProfile();
  const t = useTargets();
  const { entries, remove, addMeal } = useFoodLog();
  const [adding, setAdding] = useState(null);
  const [open, setOpen] = useState(null);
  const [swap, setSwap] = useState(null);
  const [why, setWhy] = useState(false);
  const eaten = sumMacros(entries);
  const di = dayIdx(today());
  const planDay = n.plan?.days?.[di];
  const creatine = !!n.creatine[today()];

  const setPlanMeal = (si, patch) => setN((x) => ({
    ...x, plan: { ...x.plan, days: x.plan.days.map((d, k) => (k === di ? { ...d, meals: d.meals.map((m) => (m.si === si ? { ...m, ...patch } : m)) } : d)) },
  }));

  return (
    <div className="stack">
      <div className="card hero">
        <MacroTargets eaten={eaten} t={t} />
        <button className="hstack xs muted" style={{ background: "none", border: 0, padding: 0, marginTop: 10, gap: 4 }} onClick={() => setWhy(!why)}>
          <Info size={13} /> Why these numbers? {why ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {why && (
          <div className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            Maintenance ≈ <b>{num(t.tdee)} kcal</b> (BMR × daily activity + {num(t.exKcal / 7)} kcal/day from your planned training).
            Goal <b>{GOALS[profile.goal].name}</b>: {t.delta >= 0 ? "+" : ""}{num(t.delta)} kcal.
            Protein {GOALS[profile.goal].proteinPerKg} g/kg × {num(t.weightKg, 1)} kg. Fat ≥ {GOALS[profile.goal].fatPerKg} g/kg, carbs fill the rest. Fibre goal {t.fibre} g.
            {n.kcalAdjust ? <> Manual adjustment: {n.kcalAdjust > 0 ? "+" : ""}{n.kcalAdjust} kcal.</> : null}
          </div>
        )}
      </div>

      {t.checkIn && t.checkIn.action !== "ok" && (
        <Note icon={TrendingUp} color="var(--food)">
          <div>{t.checkIn.text}</div>
          <button className="btn sm primary" style={{ marginTop: 8 }} onClick={() => {
            setN((x) => ({ ...x, kcalAdjust: (x.kcalAdjust || 0) + t.checkIn.kcal }));
            setTimeout(() => rebuildPlans({ training: false }), 0);
            toast(`Target ${t.checkIn.kcal > 0 ? "raised" : "lowered"} by ${Math.abs(t.checkIn.kcal)} kcal · meal plan updated`);
          }}>Apply {t.checkIn.kcal > 0 ? "+" : ""}{t.checkIn.kcal} kcal</button>
        </Note>
      )}

      <div className="card tight hstack">
        <span className="icon-tile" style={{ "--tile": "var(--mobility)" }}><Pill size={18} /></span>
        <div className="grow"><div className="h3">Creatine 5 g</div><div className="xs muted">Daily, any time. Streak keeps you honest.</div></div>
        <CheckBox on={creatine} label="Creatine taken" onClick={() => setN((x) => ({ ...x, creatine: { ...x.creatine, [today()]: !creatine } }))} />
      </div>

      <div className="between"><h2 className="h2">Today's plan</h2><button className="btn sm" onClick={() => setAdding("snack")}><Plus size={14} /> Add food</button></div>
      {!planDay && (
        <Note icon={Info}>No meal plan yet. <button className="btn sm primary" style={{ marginLeft: 6 }} onClick={() => rebuildPlans({ training: false })}>Build meal plan</button></Note>
      )}
      {planDay?.meals.map((pm) => {
        const meal = mealById(pm.mealId);
        if (!meal) return null;
        const m = mealMacros(meal, pm.pf, pm.cf, n.customFoods);
        const eatenIt = entries.some((e) => e.planSi === pm.si && e.mealId === pm.mealId);
        const isOpen = open === pm.si;
        return (
          <div key={pm.si} className="card tight" style={eatenIt ? { opacity: 0.6 } : undefined}>
            <button className="between" style={{ width: "100%", background: "none", border: 0, padding: 0, textAlign: "left" }} onClick={() => setOpen(isOpen ? null : pm.si)}>
              <div className="grow">
                <div className="eyebrow">{SLOT_NAMES[pm.slot]}</div>
                <div className="h3">{meal.name}</div>
                <MacroLine m={m} small />
              </div>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && <div style={{ marginTop: 10 }}><MealIngredients meal={meal} pf={pm.pf} cf={pm.cf} customFoods={n.customFoods} /></div>}
            <div className="hstack" style={{ gap: 6, marginTop: 10 }}>
              {eatenIt ? <span className="badge" style={{ "--b": "var(--good)" }}><Check size={12} /> eaten</span> : (
                <button className="btn sm primary" onClick={() => {
                  const mm = mealMacros(meal, pm.pf, pm.cf, n.customFoods);
                  addMeal(pm.mealId, pm.slot, pm.pf, pm.cf, { planSi: pm.si });
                  toast(`${meal.name} logged · ${num(mm.kcal)} kcal`);
                }}><Check size={14} /> Eaten</button>
              )}
              <button className="btn sm ghost" onClick={() => setSwap({ pm, kcal: m.kcal, protein: m.p })}><Replace size={14} /> Swap</button>
            </div>
          </div>
        );
      })}

      <h2 className="h2 mt">Logged today</h2>
      {entries.length === 0 ? <div className="empty">Nothing logged yet. Tap “Eaten” on a planned meal or add food.</div> : (
        <div className="card flush list">
          {entries.map((e) => (
            <div key={e.id} className="row">
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{e.name}{e.grams ? <span className="muted small"> · {Math.round(e.grams)} g</span> : null}</div>
                <MacroLine m={e} small />
              </div>
              <button className="iconbtn sm bare" aria-label={`Remove ${e.name}`} onClick={() => remove(e.id)}><Trash2 size={15} className="faint" /></button>
            </div>
          ))}
        </div>
      )}

      {adding && <AddFoodSheet defaultSlot={adding} onClose={() => setAdding(null)} />}
      {swap && (
        <MealSwapSheet slot={swap.pm.slot} currentId={swap.pm.mealId} kcal={swap.kcal} protein={swap.protein} onClose={() => setSwap(null)}
          onPick={(mealId, sc) => { setPlanMeal(swap.pm.si, { mealId, ...sc, locked: true }); toast("Swapped — locked so it stays when the plan is rebuilt"); }} />
      )}
    </div>
  );
}

