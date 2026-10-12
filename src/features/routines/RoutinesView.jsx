import { useState } from "react";
import { Play, Check, Moon, Flame } from "lucide-react";
import { useRoutines } from "./store.js";
import { ROUTINES, routineMinutes, routineStreak } from "./programs.js";
import { useProfile } from "../profile/store.js";
import StepPlayer from "../../components/StepPlayer.jsx";
import { Chips, Field } from "../../components/ui.jsx";
import { today, dayIdx, WEEKDAYS, weekDays } from "../../lib/dates.js";

export function useRoutineToday() {
  const [r, setR] = useRoutines();
  const id = r.schedule[dayIdx(today())];
  const markDone = (rid) => setR((x) => ({ ...x, done: { ...x.done, [today()]: rid } }));
  const toggle = () => setR((x) => {
    const done = { ...x.done };
    if (done[today()]) delete done[today()]; else done[today()] = id || "back";
    return { ...x, done };
  });
  return { routine: id ? ROUTINES[id] : null, done: !!r.done[today()], streak: routineStreak(r.done, r.schedule), markDone, toggle };
}

export const routineSteps = (rt) => rt.exercises.map((e) => ({ label: e.name, sec: e.sec, img: e.img, desc: e.desc }));

export default function RoutinesView() {
  const [r, setR] = useRoutines();
  const [profile] = useProfile();
  const { routine, done, streak, markDone } = useRoutineToday();
  const [playing, setPlaying] = useState(null);
  const [preview, setPreview] = useState(routine?.id || "back");
  const week = weekDays(today());

  return (
    <div className="stack area-mobility">
      <div className="card hero">
        <div className="between">
          <div>
            <div className="eyebrow">Tonight · {profile.routineTime}</div>
            <h2 className="h2" style={{ fontSize: 22 }}>{routine ? routine.name : "Rest evening"}</h2>
            <div className="small muted">{routine ? `${routine.tagline} · ${routineMinutes(routine)} min` : "Nothing scheduled — or pick any routine below."}</div>
          </div>
          <div className="center">
            <div className="hstack" style={{ gap: 4, justifyContent: "center" }}><Flame size={18} color="var(--cardio)" /><span className="big" style={{ fontSize: 28 }}>{streak}</span></div>
            <div className="xs muted">streak</div>
          </div>
        </div>
        {routine && (
          done ? <div className="badge mt" style={{ "--b": "var(--good)" }}><Check size={12} /> Done today</div>
            : <button className="btn primary block mt" onClick={() => setPlaying(routine.id)}><Play size={18} /> Start {routine.name}</button>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 14 }}>
          {week.map((d, i) => {
            const sched = r.schedule[i];
            const ok = r.done[d];
            return (
              <div key={d} className="center">
                <div className="xs faint">{WEEKDAYS[i][0]}</div>
                <div style={{
                  height: 26, borderRadius: 8, marginTop: 3, display: "grid", placeItems: "center",
                  background: ok ? "var(--accent)" : sched ? "var(--raised)" : "transparent",
                  border: sched && !ok ? "1px solid var(--line-strong)" : "1px solid transparent",
                  color: ok ? "var(--on-accent)" : "var(--faint)",
                }}>{ok ? <Check size={14} strokeWidth={3} /> : sched ? "" : <Moon size={12} />}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Chips value={preview} onChange={setPreview} options={Object.values(ROUTINES).map((x) => [x.id, x.name])} />
      {(() => {
        const rt = ROUTINES[preview];
        return (
          <div className="card flush">
            <div className="between" style={{ padding: "14px 16px 6px" }}>
              <div>
                <div className="h3">{rt.name}</div>
                <div className="xs muted">{rt.tagline} · {rt.exercises.length} exercises · {routineMinutes(rt)} min</div>
              </div>
              <button className="btn sm primary" onClick={() => setPlaying(rt.id)}><Play size={14} /> Start</button>
            </div>
            <div className="list">
              {rt.exercises.map((e, i) => (
                <div key={i} className="row" style={{ alignItems: "flex-start" }}>
                  <div className="illus" style={{ width: 64, flexShrink: 0 }}><img src={e.img} alt="" loading="lazy" /></div>
                  <div className="grow">
                    <div className="between"><b>{e.name}</b><span className="xs muted">{e.sec}s</span></div>
                    <div className="xs muted">{e.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <Field label="Weekly schedule">
        <div className="card flush list">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className="row">
              <span className="small" style={{ width: 40, fontWeight: 700 }}>{w}</span>
              <Chips value={r.schedule[i] ?? "none"}
                onChange={(v) => setR((x) => ({ ...x, schedule: x.schedule.map((s, k) => (k === i ? (v === "none" ? null : v) : s)) }))}
                options={[["none", "Rest"], ...Object.values(ROUTINES).map((x) => [x.id, x.name.split(" ")[0]])]} />
            </div>
          ))}
        </div>
      </Field>

      {playing && (
        <StepPlayer title={ROUTINES[playing].name} color={ROUTINES[playing].color} steps={routineSteps(ROUTINES[playing])}
          onClose={() => setPlaying(null)} onDone={() => markDone(playing)} />
      )}
    </div>
  );
}

