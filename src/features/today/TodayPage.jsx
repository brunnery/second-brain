/* The whole app, Nov 2026: today's lifting day + a done check, tonight's routine,
   creatine, body weight and optional manual cardio. Portions live under More. */
import { useState } from "react";
import { Play, Check, Moon, Pill, Scale, Plus, Dumbbell, Flame, ChevronRight, Trash2 } from "lucide-react";
import { useTraining } from "../training/store.js";
import { useNutrition } from "../nutrition/store.js";
import { useCardio } from "../cardio/store.js";
import { useBody } from "../body/store.js";
import { useProfile } from "../profile/store.js";
import { dayForDate } from "../training/engine/plan.js";
import { movingAverage } from "../nutrition/engine/nutrition.js";
import { CARDIO_TYPES } from "../cardio/data/cardio.js";
import { CardioLogSheet, logSummary } from "../cardio/CardioView.jsx";
import { useRoutineToday, routineSteps } from "../routines/RoutinesView.jsx";
import { routineMinutes } from "../routines/programs.js";
import { WeightSheet } from "../body/BodyView.jsx";
import StepPlayer from "../../components/StepPlayer.jsx";
import { Check as CheckBox } from "../../components/ui.jsx";
import { Sparkline } from "../../components/charts.jsx";
import { SyncBadge } from "../settings/SyncPanel.jsx";
import { go } from "../../app/router.js";
import { today, weekStart, addDays, fromISO, fmtShort } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

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

export default function TodayPage() {
  const [training, setTraining] = useTraining();
  const [nutrition, setNutrition] = useNutrition();
  const [cardio, setCardio] = useCardio();
  const [body] = useBody();
  const [profile] = useProfile();
  const rt = useRoutineToday();
  const [playing, setPlaying] = useState(false);
  const [sheet, setSheet] = useState(null);

  const d = today();
  const day = dayForDate(training.plan, d, training.moves);
  const checks = training.checks || {};
  const trainedOn = (iso) => !!checks[iso] || training.sessions.some((s) => s.date === iso && s.finishedAt);
  const trained = trainedOn(d);
  const toggleTrained = () => setTraining((t) => {
    const c = { ...(t.checks || {}) };
    if (c[d]) delete c[d]; else c[d] = day?.id || true;
    return { ...t, checks: c };
  });
  const ws = weekStart(d);
  const planned = training.plan?.days.length || 0;
  const doneWeek = [0, 1, 2, 3, 4, 5, 6].filter((k) => trainedOn(addDays(ws, k))).length;

  const creatine = !!nutrition.creatine[d];
  const cardioToday = cardio.logs.filter((l) => l.date === d);

  const weights = [...body.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const avg = movingAverage(weights);
  const last = avg[avg.length - 1];

  return (
    <div className="stack area-home">
      <div className="page-head" style={{ marginBottom: 4 }}>
        <div>
          <div className="eyebrow">{fromISO(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="title">{greeting()}{profile.name ? `, ${profile.name}` : ""}</h1>
        </div>
        <SyncBadge />
      </div>

      {/* lifting: just the day + one check */}
      <button className="card hero area-train hstack press" style={{ width: "100%", textAlign: "left" }} onClick={toggleTrained} aria-pressed={trained}>
        <span className="icon-tile"><Dumbbell size={18} /></span>
        <div className="grow">
          <div className="eyebrow">Today · {doneWeek}/{planned} this week</div>
          <div className="h2">{day ? `${day.name} day` : "Rest day"}</div>
          <div className="small muted">{day ? day.focus : "Recover — walk, stretch, eat well."}</div>
        </div>
        <span className="todo-check" data-on={trained ? "1" : undefined} aria-label={trained ? "Training done" : "Mark training done"}>
          <Check size={22} strokeWidth={3} />
        </span>
      </button>

      {/* evening routine */}
      <div className="card tight hstack area-mobility">
        <span className="icon-tile"><Moon size={18} /></span>
        <button className="grow" style={{ background: "none", border: 0, color: "inherit", textAlign: "left", padding: 0, cursor: "pointer" }} onClick={() => go("routines")}>
          <div className="eyebrow">Tonight · {profile.routineTime}</div>
          <div className="h3">{rt.routine ? rt.routine.name : "Rest evening"}</div>
          <div className="xs muted">{rt.routine ? `${routineMinutes(rt.routine)} min · ` : ""}{rt.streak} evening streak</div>
        </button>
        {rt.routine && (rt.done ? <span className="badge" style={{ "--b": "var(--good)" }}><Check size={12} /> done</span>
          : <button className="btn sm primary" onClick={() => setPlaying(true)}><Play size={14} /> Start</button>)}
      </div>

      {/* creatine */}
      <div className="card tight between">
        <span className="hstack small" style={{ gap: 8 }}><Pill size={16} color="var(--mobility)" /> Creatine 5 g <span className="xs muted">· {streakOf(nutrition.creatine)} day streak</span></span>
        <CheckBox on={creatine} label="Creatine taken" onClick={() => setNutrition((x) => ({ ...x, creatine: { ...x.creatine, [d]: !creatine } }))} />
      </div>

      {/* weight */}
      <div className="card tight hstack">
        <span className="icon-tile" style={{ "--tile": "var(--food)" }}><Scale size={18} /></span>
        <button className="grow" style={{ background: "none", border: 0, color: "inherit", textAlign: "left", padding: 0, cursor: "pointer" }} onClick={() => go("more/body")}>
          <div className="eyebrow">Weight</div>
          <div className="h3">{last ? `${num(last.kg, 1)} kg` : "No weigh-in yet"}</div>
          <div className="xs muted">{last ? `7-day avg ${num(last.avg, 1)} kg · ${fmtShort(last.date)}` : "Mornings, after the toilet"}</div>
        </button>
        {avg.length > 1 && <Sparkline values={avg.slice(-21).map((w) => w.avg)} color="var(--food)" />}
        <button className="btn sm" onClick={() => setSheet("weight")}><Plus size={14} /> Log</button>
      </div>

      {/* cardio — only what you add yourself */}
      {cardioToday.map((l) => (
        <div key={l.id} className="card tight hstack area-cardio">
          <span className="icon-tile" style={{ "--tile": CARDIO_TYPES[l.type]?.color }}><Flame size={18} /></span>
          <div className="grow">
            <div className="eyebrow">Cardio</div>
            <div className="h3">{CARDIO_TYPES[l.type]?.name}{l.note ? ` · ${l.note}` : ""}</div>
            <div className="xs muted">{logSummary(l)}</div>
          </div>
          <button className="iconbtn sm bare" aria-label="Delete cardio" onClick={() => setCardio((c) => ({ ...c, logs: c.logs.filter((x) => x.id !== l.id) }))}><Trash2 size={15} className="faint" /></button>
        </div>
      ))}
      <button className="btn" onClick={() => setSheet("cardio")}><Plus size={16} /> Cardio <ChevronRight size={14} className="faint" /></button>


      {playing && rt.routine && (
        <StepPlayer title={rt.routine.name} color={rt.routine.color} steps={routineSteps(rt.routine)} onClose={() => setPlaying(false)} onDone={() => rt.markDone(rt.routine.id)} />
      )}
      {sheet === "weight" && <WeightSheet onClose={() => setSheet(null)} />}
      {sheet === "cardio" && <CardioLogSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
