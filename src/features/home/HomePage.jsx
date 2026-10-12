import { useState } from "react";
import { Play, Check, Flame, Moon, Pill, Scale, Plus, Wallet, AlertTriangle, Dumbbell, UtensilsCrossed, ChevronRight } from "lucide-react";
import { useTraining } from "../training/store.js";
import { useNutrition } from "../nutrition/store.js";
import { useCardio } from "../cardio/store.js";
import { useProfile } from "../profile/store.js";
import { GOALS, PHASES } from "../profile/goals.js";
import { dayForDate } from "../training/engine/plan.js";
import { startWorkout } from "../training/actions.js";
import { useCardioWeek, useTargets } from "../coach.js";
import { workoutById, CARDIO_TYPES, INTENTS } from "../cardio/data/cardio.js";
import { useRoutineToday, routineSteps } from "../routines/RoutinesView.jsx";
import { mealById, SLOT_NAMES } from "../nutrition/data/meals.js";
import { mealMacros } from "../nutrition/engine/nutrition.js";
import { sumMacros } from "../nutrition/data/foods.js";
import { useFoodLog } from "../nutrition/shared.jsx";
import { useFinance, monthSummary, categoryTotals, upcoming } from "../finance/engine.js";
import EntrySheet from "../finance/EntrySheet.jsx";
import { WeightSheet } from "../body/BodyView.jsx";
import StepPlayer from "../../components/StepPlayer.jsx";
import { Ring, Bar, Check as CheckBox, Note, toast } from "../../components/ui.jsx";
import { SyncBadge } from "../settings/SyncPanel.jsx";
import { go } from "../../app/router.js";
import { today, dayIdx, weekStart, addDays, fromISO, monthKey, fmtShort } from "../../lib/dates.js";
import { num, money, moneyShort } from "../../lib/format.js";

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Late night" : h < 11 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

function streakOf(map) {
  let s = 0;
  let d = map[today()] ? today() : addDays(today(), -1);
  while (map[d]) { s++; d = addDays(d, -1); }
  return s;
}

export default function HomePage() {
  const [training] = useTraining();
  const [nutrition, setNutrition] = useNutrition();
  const [cardio] = useCardio();
  const [profile] = useProfile();
  const [fin] = useFinance();
  const t = useTargets();
  const week = useCardioWeek();
  const rt = useRoutineToday();
  const { entries, addMeal } = useFoodLog();
  const [playing, setPlaying] = useState(false);
  const [sheet, setSheet] = useState(null);

  const d = today();
  const day = dayForDate(training.plan, d, training.moves);
  const doneToday = training.sessions.some((s) => s.date === d && s.finishedAt);
  const active = training.sessions.find((s) => s.id === training.activeId && !s.finishedAt);
  const cardioToday = week.filter((c) => c.date === d && !cardio.skipped[c.key]);
  const eaten = sumMacros(entries);
  const planDay = nutrition.plan?.days?.[dayIdx(d)];
  const nextMeal = planDay?.meals.find((pm) => !entries.some((e) => e.planSi === pm.si && e.mealId === pm.mealId));
  const creatine = !!nutrition.creatine[d];

  const ws = weekStart(d);
  const planned = training.plan?.days.length || 0;
  const doneWeek = new Set(training.sessions.filter((s) => s.finishedAt && s.date >= ws && s.date <= addDays(ws, 6)).map((s) => s.date)).size;
  const cardioMin = cardio.logs.filter((l) => l.date >= ws && l.date <= addDays(ws, 6)).reduce((a, l) => a + l.minutes, 0);

  const mk = monthKey(d);
  const ms = monthSummary(fin.entries, mk);
  const cats = categoryTotals(fin.entries, fin.cats, mk);
  const over = cats.filter((c) => c.budget && c.total > c.budget);
  const budget = Object.values(fin.cats).filter((c) => c.kind === "expense" && c.budget).reduce((a, c) => a + c.budget, 0);
  const nextBills = upcoming(fin).slice(0, 3);

  return (
    <div className="stack area-home">
      <div className="page-head" style={{ marginBottom: 4 }}>
        <div>
          <div className="eyebrow">{fromISO(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="title">{greeting()}{profile.name ? `, ${profile.name}` : ""}</h1>
        </div>
        <SyncBadge />
      </div>
      <div className="xs muted" style={{ marginTop: -4 }}>{GOALS[profile.goal].name} · {PHASES[profile.phase].short} · {num(t.kcal)} kcal · {t.protein} g protein</div>

      {/* training */}
      <div className="card hero area-train">
        <div className="between">
          <div className="hstack" style={{ alignItems: "flex-start" }}>
            <span className="icon-tile"><Dumbbell size={18} /></span>
            <div>
              <div className="eyebrow">Today's lifting</div>
              <div className="h2">{day ? day.name : "Rest day"}</div>
              <div className="small muted">{day ? `${day.focus} · ${day.items.length} exercises · ~${profile.sessionMin} min` : "Recover — walk, stretch, eat well."}</div>
            </div>
          </div>
          {doneToday && <span className="badge" style={{ "--b": "var(--good)" }}><Check size={12} /> done</span>}
        </div>
        {day && !doneToday && (
          <button className="btn primary block mt" onClick={() => go(`train/workout/${active?.date === d ? active.id : startWorkout(day.id, d)}`)}>
            <Play size={18} /> {active?.date === d ? "Continue workout" : "Start workout"}
          </button>
        )}
      </div>

      {cardioToday.map((c) => {
        const w = workoutById(c.workoutId);
        const done = cardio.logs.some((l) => l.slotKey === c.key);
        return (
          <button key={c.key} className="card tight press hstack area-cardio" style={{ width: "100%", textAlign: "left" }} onClick={() => go("train/cardio")}>
            <span className="icon-tile" style={{ "--tile": CARDIO_TYPES[c.type].color }}><Flame size={18} /></span>
            <div className="grow">
              <div className="eyebrow">Cardio · {INTENTS[c.intent].name}</div>
              <div className="h3">{w?.name} · {CARDIO_TYPES[c.type].name}</div>
              <div className="xs muted">{w?.minutes} min — {w?.how}</div>
            </div>
            {done ? <Check size={18} color="var(--good)" /> : <ChevronRight size={18} className="faint" />}
          </button>
        );
      })}

      {/* evening routine */}
      <div className="card tight hstack area-mobility">
        <span className="icon-tile"><Moon size={18} /></span>
        <div className="grow">
          <div className="eyebrow">Tonight · {profile.routineTime}</div>
          <div className="h3">{rt.routine ? rt.routine.name : "Rest evening"}</div>
          <div className="xs muted">{rt.streak} evening streak</div>
        </div>
        {rt.routine && (rt.done ? <span className="badge" style={{ "--b": "var(--good)" }}><Check size={12} /> done</span>
          : <button className="btn sm primary" onClick={() => setPlaying(true)}><Play size={14} /> Start</button>)}
      </div>

      {/* food */}
      <div className="card area-food">
        <div className="hstack" style={{ gap: 14 }}>
          <Ring value={eaten.kcal} max={t.kcal} size={84} stroke={9} color="var(--food)">
            <div><div style={{ fontWeight: 800, fontSize: 16 }}>{num(Math.max(0, t.kcal - eaten.kcal))}</div><div className="xs muted">left</div></div>
          </Ring>
          <div className="grow stack-sm">
            <div className="between xs"><b>Protein</b><span className="muted">{num(eaten.p)} / {t.protein} g</span></div>
            <Bar value={eaten.p} max={t.protein} color="var(--protein)" thin />
            <div className="between xs"><b>Calories</b><span className="muted">{num(eaten.kcal)} / {num(t.kcal)}</span></div>
            <Bar value={eaten.kcal} max={t.kcal} color="var(--food)" thin />
          </div>
        </div>
        {nextMeal && mealById(nextMeal.mealId) && (
          <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="eyebrow">Next · {SLOT_NAMES[nextMeal.slot]}</div>
              <div className="small truncate" style={{ fontWeight: 650 }}>{mealById(nextMeal.mealId).name}</div>
              <div className="xs muted">{num(mealMacros(mealById(nextMeal.mealId), nextMeal.pf, nextMeal.cf).kcal)} kcal</div>
            </div>
            <button className="btn sm primary" onClick={() => { addMeal(nextMeal.mealId, nextMeal.slot, nextMeal.pf, nextMeal.cf, { planSi: nextMeal.si }); toast("Logged"); }}><Check size={14} /> Eaten</button>
          </div>
        )}
        <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <span className="hstack small" style={{ gap: 8 }}><Pill size={16} color="var(--mobility)" /> Creatine 5 g <span className="xs muted">· {streakOf(nutrition.creatine)} day streak</span></span>
          <CheckBox on={creatine} label="Creatine taken" onClick={() => setNutrition((x) => ({ ...x, creatine: { ...x.creatine, [d]: !creatine } }))} />
        </div>
      </div>

      {/* week */}
      <div className="grid3">
        <button className="card tight press center" onClick={() => go("train/progress")}>
          <div className="big" style={{ fontSize: 26 }}>{doneWeek}<span className="muted" style={{ fontSize: 15 }}>/{planned}</span></div><div className="xs muted">workouts</div>
        </button>
        <button className="card tight press center" onClick={() => go("train/cardio")}>
          <div className="big" style={{ fontSize: 26 }}>{cardioMin}<span className="muted" style={{ fontSize: 15 }}>′</span></div><div className="xs muted">cardio</div>
        </button>
        <button className="card tight press center" onClick={() => go("train/mobility")}>
          <div className="big" style={{ fontSize: 26 }}>{rt.streak}</div><div className="xs muted">routine streak</div>
        </button>
      </div>

      {/* money */}
      <button className="card press area-money" style={{ textAlign: "left", width: "100%" }} onClick={() => go("money")}>
        <div className="between">
          <div className="hstack"><span className="icon-tile"><Wallet size={18} /></span><div><div className="eyebrow">This month</div><div className="h3">{moneyShort(ms.expense)} spent{budget ? ` of ${moneyShort(budget)}` : ""}</div></div></div>
          <ChevronRight size={18} className="faint" />
        </div>
        {budget > 0 && <div className="mt"><Bar value={ms.expense} max={budget} thin color={ms.expense > budget ? "var(--bad)" : "var(--money)"} /></div>}
        {over.length > 0 && <div className="xs bad hstack" style={{ marginTop: 8, gap: 4 }}><AlertTriangle size={13} /> Over budget: {over.map((c) => c.name).join(", ")}</div>}
        {nextBills.length > 0 && <div className="xs muted" style={{ marginTop: 8 }}>Next: {nextBills.map(({ date, r }) => `${fmtShort(date)} ${r.name} ${money(r.amount)}`).join(" · ")}</div>}
      </button>

      {/* quick actions */}
      <div className="grid2">
        <button className="btn" onClick={() => setSheet("expense")}><Plus size={16} /> Expense</button>
        <button className="btn" onClick={() => setSheet("weight")}><Scale size={16} /> Weight</button>
        <button className="btn" onClick={() => go("train/cardio")}><Flame size={16} /> Cardio</button>
        <button className="btn" onClick={() => go("food/today")}><UtensilsCrossed size={16} /> Food</button>
      </div>

      {t.checkIn && t.checkIn.action !== "ok" && <Note icon={Scale} color="var(--food)">{t.checkIn.text} <button className="btn sm" style={{ marginTop: 6 }} onClick={() => go("food/today")}>Review</button></Note>}

      {playing && rt.routine && (
        <StepPlayer title={rt.routine.name} color={rt.routine.color} steps={routineSteps(rt.routine)} onClose={() => setPlaying(false)} onDone={() => rt.markDone(rt.routine.id)} />
      )}
      {sheet === "expense" && <EntrySheet initial={{ kind: "expense" }} onClose={() => setSheet(null)} />}
      {sheet === "weight" && <WeightSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
