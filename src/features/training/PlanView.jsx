import { useMemo, useState } from "react";
import { Play, Pencil, ArrowLeftRight, RefreshCw, Info, Check, ChevronDown, ChevronUp, Flame, BedDouble, Plus } from "lucide-react";
import { useTraining } from "./store.js";
import { useProfile } from "../profile/store.js";
import { GOALS, PHASES } from "../profile/goals.js";
import { dayForDate, mesoWeek, weeklyVolume } from "./engine/plan.js";
import { findExercise, startWorkout, moveDayThisWeek, startEmptyWorkout } from "./actions.js";
import { MUSCLES } from "./data/exercises.js";
import { useCardioWeek, rebuildPlans } from "../coach.js";
import { CARDIO_TYPES, workoutById, INTENTS } from "../cardio/data/cardio.js";
import { today, weekDays, WEEKDAYS, fmtDay, relDay } from "../../lib/dates.js";
import { go } from "../../app/router.js";
import { Note, Sheet, toast } from "../../components/ui.jsx";
import DayEditor from "./DayEditor.jsx";
import GoalsSheet from "../profile/GoalsSheet.jsx";

const restText = (s) => (s >= 120 ? `${Math.round((s / 60) * 2) / 2} min` : `${s}s`);
export const itemScheme = (it) =>
  it.role === "finisher" ? `${it.minutes || 8} min` : `${it.sets} × ${it.repMin}–${it.repMax}`;

export default function PlanView() {
  const [training] = useTraining();
  const [profile] = useProfile();
  const [sel, setSel] = useState(today());
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);
  const [goals, setGoals] = useState(false);
  const [showVol, setShowVol] = useState(false);
  const plan = training.plan;
  const days = weekDays(sel);
  const cardio = useCardioWeek(sel);
  const doneOn = (date) => training.sessions.some((s) => s.date === date && s.finishedAt);
  const vol = useMemo(() => weeklyVolume(plan, training.customExercises), [plan, training.customExercises]);

  if (!plan) {
    return (
      <div className="stack">
        <Note icon={Info}>No plan yet. Build one from your goals.</Note>
        <button className="btn primary" onClick={() => rebuildPlans({ meals: false })}><RefreshCw size={17} /> Build training plan</button>
      </div>
    );
  }

  const day = dayForDate(plan, sel, training.moves);
  const mw = mesoWeek(plan, sel);
  const cardioToday = cardio.filter((c) => c.date === sel);
  const active = training.sessions.find((s) => s.id === training.activeId && !s.finishedAt);
  const [vlo, vhi] = PHASES[profile.phase].volume;

  return (
    <div className="stack">
      <button className="card tight press between" onClick={() => setGoals(true)} style={{ textAlign: "left", width: "100%" }}>
        <div>
          <div className="eyebrow">Goal · phase</div>
          <div className="h3">{GOALS[profile.goal].name} · {PHASES[profile.phase].short}</div>
          <div className="xs muted">{plan.splitName} · {profile.sessionMin} min · back care {profile.backCare ? "on" : "off"}</div>
        </div>
        <span className="btn sm ghost"><Pencil size={14} /> Change</span>
      </button>

      {active && (
        <Note icon={Play}>
          Workout in progress: <b>{active.dayName}</b>.{" "}
          <button className="btn sm primary" style={{ marginTop: 8 }} onClick={() => go(`train/workout/${active.id}`)}>Continue</button>
        </Note>
      )}

      {mw === 6 ? (
        <Note icon={BedDouble} color="var(--mobility)"><b>Deload week (6/6).</b> Do 2 sets per exercise and stop 3+ reps before failure. Recovery is where the growth happens — next week starts a fresh block.</Note>
      ) : (
        <div className="xs muted">Block week <b className="accent">{mw}/6</b> — push close to failure; week 6 is a deload.</div>
      )}

      {/* week strip */}
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {days.map((d, i) => {
          const pd = dayForDate(plan, d, training.moves);
          const isSel = d === sel, isToday = d === today();
          const hasCardio = cardio.some((c) => c.date === d);
          return (
            <button key={d} onClick={() => setSel(d)} aria-label={fmtDay(d)}
              style={{
                padding: "8px 0", borderRadius: 12, border: `1px solid ${isSel ? "var(--accent)" : "var(--line)"}`,
                background: isSel ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface)", color: "var(--text)",
              }}>
              <div className="xs" style={{ color: isToday ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>{WEEKDAYS[i]}</div>
              <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>{pd ? pd.name.replace(/ (A|B|C)$/, "").split(" ")[0].slice(0, 4) : "—"}</div>
              <div style={{ height: 14, marginTop: 2, display: "flex", justifyContent: "center", gap: 3, alignItems: "center" }}>
                {doneOn(d) && <Check size={12} color="var(--good)" strokeWidth={3} />}
                {hasCardio && <span style={{ width: 5, height: 5, borderRadius: 3, background: "var(--cardio)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* selected day */}
      <div className="card hero">
        <div className="between">
          <div>
            <div className="eyebrow">{relDay(sel)}</div>
            <h2 className="h2" style={{ fontSize: 22 }}>{day ? day.name : "Rest day"}</h2>
            {day && <div className="small muted">{day.focus}</div>}
          </div>
          {day && (
            <div className="hstack" style={{ gap: 6 }}>
              <button className="iconbtn sm" aria-label="Move this day" onClick={() => setMoving(day)}><ArrowLeftRight size={16} /></button>
              <button className="iconbtn sm" aria-label="Edit this day" onClick={() => setEditing(day.id)}><Pencil size={16} /></button>
            </div>
          )}
        </div>
        {day ? (
          <>
            <div className="list" style={{ margin: "12px -16px 0" }}>
              {day.items.map((it, n) => {
                const ex = findExercise(it.exerciseId);
                return (
                  <div key={it.id} className="row" style={{ minHeight: 40, padding: "8px 16px" }}>
                    <span className="xs faint" style={{ width: 16 }}>{n + 1}</span>
                    <div className="grow">
                      <div style={{ fontWeight: 650 }} className="truncate">{ex?.name || "Unknown exercise"}</div>
                      <div className="meta">{itemScheme(it)}{it.role !== "finisher" && ` · rest ${restText(it.rest)} · RIR ${it.rir}`}</div>
                    </div>
                    {it.role === "primary" && <span className="badge">main</span>}
                    {it.role === "finisher" && <span className="badge" style={{ "--b": "var(--cardio)" }}><Flame size={11} /> finisher</span>}
                  </div>
                );
              })}
            </div>
            <button className="btn primary block mt" onClick={() => go(`train/workout/${startWorkout(day.id, sel)}`)}>
              <Play size={18} /> {doneOn(sel) ? "Log again" : "Start workout"}
            </button>
          </>
        ) : (
          <div className="stack-sm" style={{ marginTop: 10 }}>
            <div className="small muted">Recovery day. Walk, stretch, do the evening routine.</div>
            <button className="btn sm ghost" onClick={() => go(`train/workout/${startEmptyWorkout(sel)}`)}><Plus size={15} /> Log a free workout</button>
          </div>
        )}
      </div>

      {cardioToday.map((c) => {
        const w = workoutById(c.workoutId);
        return (
          <button key={c.key} className="card tight press hstack area-cardio" style={{ width: "100%", textAlign: "left" }} onClick={() => go("train/cardio")}>
            <span className="icon-tile" style={{ "--tile": CARDIO_TYPES[c.type].color }}><Flame size={18} /></span>
            <div className="grow">
              <div className="h3">{w?.name} · {CARDIO_TYPES[c.type].name}</div>
              <div className="xs muted">{INTENTS[c.intent].name} · {c.minutes} min — open cardio for details / shuffle</div>
            </div>
          </button>
        );
      })}

      {/* volume */}
      <div className="card">
        <button className="between" onClick={() => setShowVol(!showVol)} style={{ width: "100%", background: "none", border: 0, padding: 0 }}>
          <div style={{ textAlign: "left" }}>
            <div className="h3">Weekly volume</div>
            <div className="xs muted">Hard sets per muscle (secondary counts ½). Target for {PHASES[profile.phase].short}: {vlo}–{vhi}.</div>
          </div>
          {showVol ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showVol && (
          <div className="stack-sm" style={{ marginTop: 12 }}>
            {Object.entries(vol).filter(([m]) => !["fullBody", "forearms", "lowerBack", "traps", "adductors", "abductors"].includes(m)).sort((a, b) => b[1] - a[1]).map(([m, v]) => {
              const color = v < vlo ? "var(--warn)" : v > vhi + 2 ? "var(--bad)" : "var(--good)";
              return (
                <div key={m} className="hstack">
                  <span className="small" style={{ width: 92 }}>{MUSCLES[m]}</span>
                  <div className="grow" style={{ position: "relative" }}>
                    <div className="bar"><span style={{ width: `${Math.min(100, (v / (vhi + 6)) * 100)}%`, background: color }} /></div>
                    <span style={{ position: "absolute", top: -2, bottom: -2, left: `${(vlo / (vhi + 6)) * 100}%`, width: `${((vhi - vlo) / (vhi + 6)) * 100}%`, borderLeft: "1px dashed var(--muted)", borderRight: "1px dashed var(--muted)" }} />
                  </div>
                  <span className="small" style={{ width: 34, textAlign: "right", fontWeight: 700 }}>{+v.toFixed(1)}</span>
                </div>
              );
            })}
            <div className="xs faint">Abs & core are also trained in the evening Core routine.</div>
          </div>
        )}
      </div>

      <button className="btn ghost" onClick={() => {
        if (window.confirm("Build a fresh training plan from your goals? Your edits to the plan are replaced; logged workouts stay.")) {
          rebuildPlans({ meals: false });
          toast("New training plan built");
        }
      }}><RefreshCw size={16} /> Regenerate training plan</button>

      {editing && <DayEditor dayId={editing} onClose={() => setEditing(null)} />}
      {goals && <GoalsSheet onClose={() => setGoals(false)} />}
      {moving && (
        <Sheet title={`Move ${moving.name} this week`} onClose={() => setMoving(null)} area="train">
          <div className="stack-sm">
            <div className="small muted">Swaps with whatever is planned on that day — only for this week.</div>
            {days.map((d) => {
              const pd = dayForDate(plan, d, training.moves);
              return (
                <button key={d} className="btn ghost block" disabled={d === sel} style={{ justifyContent: "space-between" }}
                  onClick={() => { moveDayThisWeek(moving.id, sel, d); setSel(d); setMoving(null); toast(`${moving.name} moved to ${fmtDay(d)}`); }}>
                  <span>{fmtDay(d)}</span><span className="muted small">{pd ? pd.name : "rest"}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}
