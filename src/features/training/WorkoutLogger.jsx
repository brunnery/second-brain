import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Plus, Replace, Trash2, Timer, Lightbulb, Trophy, MoreHorizontal, X } from "lucide-react";
import { useTraining } from "./store.js";
import { findExercise, updateEntry, updateSession, finishSession, deleteSession, addExerciseToSession, swapInSession } from "./actions.js";
import { historyOf, bestSet, e1rm, tonnage } from "./engine/progression.js";
import { NumInput, Sheet, toast } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import { clock, num } from "../../lib/format.js";
import { fmtDay } from "../../lib/dates.js";
import { beep, vibrate, unlockAudio } from "../../lib/device.js";
import ExercisePicker from "./ExercisePicker.jsx";

function RestTimer({ rest, onClose }) {
  const [end, setEnd] = useState(() => Date.now() + rest.sec * 1000);
  const [left, setLeft] = useState(rest.sec);
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.round((end - Date.now()) / 1000);
      setLeft(l);
      if (l <= 0 && !fired.current) { fired.current = true; beep(990, 300); vibrate([200, 80, 200]); }
    }, 250);
    return () => clearInterval(t);
  }, [end]);
  const over = left <= 0;
  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 10px)", zIndex: 45, maxWidth: 536, margin: "0 auto" }}>
      <div className="card tight hstack" style={{ background: over ? "var(--accent)" : "var(--raised)", color: over ? "var(--on-accent)" : undefined, borderColor: "var(--accent)" }}>
        <Timer size={18} />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 20 }}>{over ? "Go! Next set" : clock(left)}</div>
          <div className="xs" style={{ opacity: 0.8 }}>Rest after {rest.name}</div>
        </div>
        {!over && <button className="btn sm ghost" onClick={() => setEnd((e) => e - 15000)}>−15</button>}
        {!over && <button className="btn sm ghost" onClick={() => setEnd((e) => e + 15000)}>+15</button>}
        <button className="iconbtn sm bare" aria-label="Close rest timer" style={{ color: "inherit" }} onClick={onClose}><X size={18} /></button>
      </div>
    </div>
  );
}

function Elapsed({ since }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return <span>{clock((now - Date.parse(since)) / 1000)}</span>;
}

function EntryCard({ session, entry, sessions, onRest, onSwap }) {
  const ex = findExercise(entry.exerciseId);
  const hist = historyOf(sessions.filter((s) => s.id !== session.id), entry.exerciseId, 1)[0];
  const t = entry.target;
  const setSet = (i, patch) => updateEntry(session.id, entry.id, (e) => ({ ...e, sets: e.sets.map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  const toggleDone = (i) => {
    const s = entry.sets[i];
    const done = !s.done;
    setSet(i, { done, reps: s.reps ?? (done ? entry.suggestion?.reps ?? t.repMax : s.reps) });
    if (done && t.rest) onRest({ sec: t.rest, name: ex?.name, id: Date.now() });
    if (done) unlockAudio();
  };
  const finisher = entry.role === "finisher";
  const allDone = entry.sets.length && entry.sets.every((s) => s.done);

  return (
    <div className="card" style={allDone ? { borderColor: "color-mix(in srgb, var(--good) 45%, var(--line))" } : undefined}>
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div className="grow">
          <div className="h3">{ex?.name || "Exercise"}</div>
          <div className="xs muted">
            {finisher ? `${t.minutes || 8} min finisher` : `${t.sets} × ${t.repMin}–${t.repMax} · RIR ${t.rir} · rest ${t.rest}s`}
          </div>
        </div>
        <button className="iconbtn sm" aria-label="Swap exercise" onClick={onSwap}><Replace size={15} /></button>
      </div>
      {ex?.cue && <div className="xs faint" style={{ marginTop: 6 }}>{ex.cue}</div>}
      {entry.suggestion && !finisher && (
        <div className="hstack xs" style={{ marginTop: 8, color: "var(--accent)", alignItems: "flex-start", gap: 6 }}>
          <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{entry.suggestion.reason}</span>
        </div>
      )}
      {finisher ? (
        <button className={`btn block mt ${entry.sets[0]?.done ? "primary" : ""}`} onClick={() => setSet(0, { done: !entry.sets[0]?.done, reps: 1, kg: 0 })}>
          <Check size={16} /> {entry.sets[0]?.done ? "Finisher done" : "Mark finisher done"}
        </button>
      ) : (
        <div style={{ marginTop: 10 }}>
          <div className="xs faint" style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 40px", gap: 8, padding: "0 2px 4px" }}>
            <span>#</span><span>Last</span><span>kg</span><span>Reps</span><span />
          </div>
          {entry.sets.map((s, i) => {
            const prev = hist?.sets?.[i];
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 40px", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span className="small faint" style={{ fontWeight: 700 }}>{i + 1}</span>
                <span className="xs muted">{prev ? `${num(prev.kg, 1)}×${prev.reps}` : "–"}</span>
                <NumInput className="input" value={s.kg} placeholder="kg" onChange={(v) => setSet(i, { kg: v })} aria-label={`Set ${i + 1} weight`} style={{ minHeight: 40, padding: "6px 8px", textAlign: "center" }} />
                <NumInput className="input" value={s.reps} placeholder={String(entry.suggestion?.reps ?? t.repMax)} onChange={(v) => setSet(i, { reps: v })} aria-label={`Set ${i + 1} reps`} style={{ minHeight: 40, padding: "6px 8px", textAlign: "center" }} />
                <button className={`check ${s.done ? "on" : ""}`} style={{ width: 40, height: 40, borderRadius: 10 }} aria-label={`Set ${i + 1} done`} onClick={() => toggleDone(i)}>
                  {s.done && <Check size={18} strokeWidth={3} />}
                </button>
              </div>
            );
          })}
          <div className="hstack" style={{ gap: 6 }}>
            <button className="btn sm ghost" onClick={() => updateEntry(session.id, entry.id, (e) => ({ ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false, reps: null }] }))}><Plus size={14} /> Set</button>
            {entry.sets.length > 1 && <button className="btn sm ghost" onClick={() => updateEntry(session.id, entry.id, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))}>− Set</button>}
            <span className="grow" />
            <button className="iconbtn sm bare" aria-label="Remove exercise from workout" onClick={() => updateSession(session.id, (x) => ({ ...x, entries: x.entries.filter((e) => e.id !== entry.id) }))}><Trash2 size={15} className="faint" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutLogger({ id }) {
  const [training] = useTraining();
  const session = training.sessions.find((s) => s.id === id);
  const [rest, setRest] = useState(null);
  const [picker, setPicker] = useState(null);
  const [summary, setSummary] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!session) return <div className="empty">Workout not found. <button className="btn sm" onClick={() => go("train")}>Back</button></div>;

  const doneSets = session.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0);
  const prs = session.entries.map((e) => {
    const prevBest = bestSet(historyOf(training.sessions.filter((s) => s.id !== session.id), e.exerciseId, 50));
    const mine = e.sets.filter((s) => s.done).map((s) => ({ ...s, v: e1rm(s.kg, s.reps) })).sort((a, b) => b.v - a.v)[0];
    return mine && mine.v > 0 && (!prevBest || mine.v > prevBest.e1rm) ? { name: findExercise(e.exerciseId)?.name, set: mine } : null;
  }).filter(Boolean);

  const finish = () => { finishSession(session.id); setSummary(false); toast("Workout saved 💪"); go("train"); };

  return (
    <div className="stack area-train" style={{ paddingBottom: rest ? 80 : 0 }}>
      <div className="between" style={{ marginTop: 4 }}>
        <button className="iconbtn" aria-label="Back to plan" onClick={() => go("train")}><ArrowLeft size={20} /></button>
        <div className="center">
          <div className="eyebrow">{fmtDay(session.date)} · {session.finishedAt ? "logged" : <Elapsed since={session.startedAt} />}</div>
          <div className="h2">{session.dayName}</div>
        </div>
        <button className="iconbtn" aria-label="More" onClick={() => setMenu(true)}><MoreHorizontal size={20} /></button>
      </div>
      <div className="bar thin"><span style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>

      {session.entries.map((e) => (
        <EntryCard key={e.id} session={session} entry={e} sessions={training.sessions} onRest={setRest}
          onSwap={() => setPicker({ mode: "swap", entryId: e.id, pattern: findExercise(e.exerciseId)?.pattern, current: e.exerciseId })} />
      ))}
      <button className="btn ghost" onClick={() => setPicker({ mode: "add" })}><Plus size={16} /> Add exercise</button>
      <textarea className="input" placeholder="Notes (how it felt, pain, sleep …)" value={session.note} onChange={(ev) => updateSession(session.id, (s) => ({ ...s, note: ev.target.value }))} />
      {!session.finishedAt && <button className="btn primary block" onClick={() => setSummary(true)}><Check size={18} /> Finish workout</button>}

      {rest && <RestTimer key={rest.id} rest={rest} onClose={() => setRest(null)} />}
      {picker && (
        <ExercisePicker title={picker.mode === "add" ? "Add to workout" : "Swap exercise"} pattern={picker.pattern} currentId={picker.current}
          onClose={() => setPicker(null)}
          onPick={(xid) => (picker.mode === "add" ? addExerciseToSession(session.id, xid) : swapInSession(session.id, picker.entryId, xid))} />
      )}
      {summary && (
        <Sheet title="Finish workout" onClose={() => setSummary(false)} area="train">
          <div className="stack">
            <div className="grid3">
              <div className="stat"><span className="v"><Elapsed since={session.startedAt} /></span><span className="l">Time</span></div>
              <div className="stat"><span className="v">{doneSets}/{totalSets}</span><span className="l">Sets</span></div>
              <div className="stat"><span className="v">{num(tonnage(session))}</span><span className="l">kg volume</span></div>
            </div>
            {prs.length > 0 && (
              <div className="note" style={{ "--n": "var(--food)" }}>
                <Trophy size={17} color="var(--food)" />
                <div><b>New bests</b>{prs.map((p) => <div key={p.name} className="small">{p.name}: {num(p.set.kg, 1)} kg × {p.set.reps} (e1RM {num(p.set.v)})</div>)}</div>
              </div>
            )}
            {doneSets < totalSets && <div className="small muted">{totalSets - doneSets} sets not ticked — they won't count.</div>}
            <button className="btn primary block" onClick={finish}>Save workout</button>
          </div>
        </Sheet>
      )}
      {menu && (
        <Sheet title="Workout" onClose={() => setMenu(false)} area="train">
          <div className="stack-sm">
            {session.finishedAt && <button className="btn block" onClick={() => { updateSession(session.id, (s) => ({ ...s, finishedAt: null })); setMenu(false); }}>Re-open for editing</button>}
            <button className="btn danger block" onClick={() => {
              if (window.confirm("Delete this workout?")) { deleteSession(session.id); go("train"); }
            }}><Trash2 size={16} /> Delete workout</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
