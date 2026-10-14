import { useState } from "react";
import { Camera, Check, Plus, Replace, Trash2, Pill, TrendingUp, ChevronDown, ChevronUp, Info, ChefHat, Sparkles } from "lucide-react";
import { useNutrition } from "./store.js";
import { useProfile } from "../profile/store.js";
import { GOALS } from "../profile/goals.js";
import { mealById, SLOT_NAMES } from "./data/meals.js";
import { mealMacros, topUp, nextMealTarget, MAIN_SLOTS } from "./engine/nutrition.js";
import { sumMacros, foodById } from "./data/foods.js";
import MealBuilder, { builderEntry } from "./MealBuilder.jsx";
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
  const { entries, remove, addMeal, add } = useFoodLog();
  const [cook, setCook] = useState(null);
  const [adding, setAdding] = useState(null);
  const [open, setOpen] = useState(null);
  const [swap, setSwap] = useState(null);
  const [why, setWhy] = useState(false);
  const eaten = sumMacros(entries);
  const di = dayIdx(today());
  const planDay = n.plan?.days?.[di];
  const creatine = !!n.creatine[today()];

  // what is still planned (main meals not logged yet) and what would still be open after it
  // a planned meal counts as done when it was logged from the plan, or when something else was logged for that slot
  const loggedFor = {};
  const usedIds = new Set();
  for (const pm of planDay?.meals || []) {
    const e = entries.find((x) => x.planSi === pm.si);
    if (e) { loggedFor[pm.si] = e; usedIds.add(e.id); }
  }
  for (const pm of planDay?.meals || []) {
    if (loggedFor[pm.si]) continue;
    const e = entries.find((x) => !usedIds.has(x.id) && x.planSi == null && !x.topUp && x.slot === pm.slot);
    if (e) { loggedFor[pm.si] = e; usedIds.add(e.id); }
  }
  const pendingMains = (planDay?.meals || []).filter((pm) => MAIN_SLOTS.includes(pm.slot) && !loggedFor[pm.si]);
  const loggedMainSlots = new Set(entries.filter((e) => MAIN_SLOTS.includes(e.slot)).map((e) => e.slot));
  const mainsLeft = planDay ? pendingMains.length : MAIN_SLOTS.filter((x) => !loggedMainSlots.has(x)).length;
  const planned = sumMacros(pendingMains.map((pm) => mealMacros(mealById(pm.mealId), pm.pf, pm.cf)));
  const gap = { kcal: t.kcal - eaten.kcal - planned.kcal, p: t.protein - eaten.p - planned.p, c: t.carbs - eaten.c - planned.c, f: t.fat - eaten.f - planned.f };
  const fill = topUp(gap);

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

      <div className="between"><h2 className="h2">Today</h2><div className="hstack" style={{ gap: 6 }}><button className="btn sm" onClick={() => setCook({ pm: null, initial: {} })}><ChefHat size={14} /> Meal</button><button className="btn sm" onClick={() => setAdding("snack")}><Plus size={14} /> Food</button><button className="btn sm" aria-label="Scan nutrition label" onClick={() => setAdding("scan")}><Camera size={14} /></button></div></div>
      {!planDay && (
        <Note icon={Info}>No meal plan yet. <button className="btn sm primary" style={{ marginLeft: 6 }} onClick={() => rebuildPlans({ training: false })}>Build meal plan</button></Note>
      )}
      {planDay?.meals.map((pm) => {
        const meal = mealById(pm.mealId);
        const logged = loggedFor[pm.si];
        if (logged) {
          return (
            <div key={pm.si} className="card tight" style={{ borderColor: "color-mix(in srgb, var(--good) 40%, var(--line))" }}>
              <div className="between">
                <div className="grow">
                  <div className="eyebrow">{SLOT_NAMES[pm.slot]} · eaten</div>
                  <div className="h3">{logged.name}</div>
                  <MacroLine m={logged} small />
                  {logged.items && <div className="xs faint" style={{ marginTop: 2 }}>{logged.items.map((i) => `${foodById(i.foodId)?.name.split(/[,(]/)[0]} ${i.grams} g`).join(" · ")}</div>}
                </div>
                <Check size={18} color="var(--good)" />
              </div>
            </div>
          );
        }
        if (!meal) return null;
        const m = mealMacros(meal, pm.pf, pm.cf, n.customFoods);
        const isOpen = open === pm.si;
        return (
          <div key={pm.si} className="card tight">
            <button className="between" style={{ width: "100%", background: "none", border: 0, padding: 0, textAlign: "left" }} onClick={() => setOpen(isOpen ? null : pm.si)}>
              <div className="grow">
                <div className="eyebrow">{SLOT_NAMES[pm.slot]} · suggestion{meal.mine ? " · my meal" : ""}</div>
                <div className="h3">{meal.name}</div>
                <MacroLine m={m} small />
              </div>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && <div style={{ marginTop: 10 }}><MealIngredients meal={meal} pf={pm.pf} cf={pm.cf} customFoods={n.customFoods} /></div>}
            <div className="hstack wrap" style={{ gap: 6, marginTop: 10 }}>
              <button className="btn sm primary" onClick={() => {
                addMeal(pm.mealId, pm.slot, pm.pf, pm.cf, { planSi: pm.si });
                toast(`${meal.name} logged · ${num(m.kcal)} kcal`);
              }}><Check size={14} /> Eaten as planned</button>
              <button className="btn sm" onClick={() => setCook({ pm, initial: { name: meal.name, items: meal.items } })}><ChefHat size={14} /> Cook something else</button>
              <button className="btn sm ghost" onClick={() => setSwap({ pm, kcal: m.kcal, protein: m.p })}><Replace size={14} /> Swap</button>
            </div>
          </div>
        );
      })}

      {!planDay && (
        <button className="btn" onClick={() => setCook({ pm: null, initial: {} })}><ChefHat size={16} /> What are you cooking?</button>
      )}

      {fill.length > 0 && (
        <div className="card" style={{ borderColor: "color-mix(in srgb, var(--food) 40%, var(--line))" }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 6 }}><Sparkles size={16} className="accent" /><b>{mainsLeft === 0 ? "Close the gap" : "Top-up to hit your goal"}</b></div>
          <div className="xs muted" style={{ marginBottom: 8 }}>
            {mainsLeft === 0 ? "After your main meals you still have:" : "With your planned meals you'd still be missing:"} {num(Math.max(0, gap.kcal))} kcal · P {num(Math.max(0, gap.p))} · F {num(Math.max(0, gap.f))} · C {num(Math.max(0, gap.c))}
          </div>
          {fill.map((x) => (
            <div key={x.foodId} className="between small" style={{ padding: "3px 0" }}>
              <span>{foodById(x.foodId)?.name} <span className="faint">· {x.why}</span></span><b>{x.grams} {foodById(x.foodId)?.cat === "drinks" || x.foodId.startsWith("milk") ? "ml" : "g"}</b>
            </div>
          ))}
          <button className="btn sm primary mt" onClick={() => {
            fill.forEach((x) => add({ name: foodById(x.foodId).name, slot: "snack", foodId: x.foodId, grams: x.grams, kcal: x.kcal, p: x.p, c: x.c, f: x.f, topUp: true }));
            toast("Top-up logged");
          }}><Plus size={14} /> Log top-up</button>
        </div>
      )}

      <h2 className="h2 mt">Logged today</h2>
      {entries.length === 0 ? <div className="empty">Nothing logged yet. Tap “Eaten” on a planned meal or add food.</div> : (
        <div className="card flush list">
          {entries.map((e) => (
            <div key={e.id} className="row">
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{e.name}{e.grams ? <span className="muted small"> · {Math.round(e.grams)} g</span> : null}</div>
                <MacroLine m={e} small />
                {e.items && <div className="xs faint">{e.items.map((i) => `${foodById(i.foodId)?.name.split(/[,(]/)[0]} ${i.grams} g`).join(" · ")}</div>}
              </div>
              <button className="iconbtn sm bare" aria-label={`Remove ${e.name}`} onClick={() => remove(e.id)}><Trash2 size={15} className="faint" /></button>
            </div>
          ))}
        </div>
      )}

      {cook && (
        <MealBuilder mode="cook" initial={cook.initial} slot={cook.pm?.slot || "lunch"}
          target={nextMealTarget(t, eaten, Math.max(1, mainsLeft), cook.pm?.slot || "lunch", pendingMains.map((x) => x.slot))}
          onClose={() => setCook(null)}
          onDone={(r) => { add(builderEntry(r, cook.pm ? { planSi: cook.pm.si } : {})); toast(`${r.name} logged · ${num(r.macros.kcal)} kcal`); }} />
      )}
      {adding && <AddFoodSheet defaultSlot={adding === "scan" ? "snack" : adding} defaultMode={adding === "scan" ? "scan" : "food"} onClose={() => setAdding(null)} />}
      {swap && (
        <MealSwapSheet slot={swap.pm.slot} currentId={swap.pm.mealId} kcal={swap.kcal} protein={swap.protein} onClose={() => setSwap(null)}
          onPick={(mealId, sc) => { setPlanMeal(swap.pm.si, { mealId, ...sc, locked: true }); toast("Swapped — locked so it stays when the plan is rebuilt"); }} />
      )}
    </div>
  );
}

