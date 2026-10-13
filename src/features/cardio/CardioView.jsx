import { useMemo, useState } from "react";
import { Play, Shuffle, Plus, Check, Flame, Trash2, Info } from "lucide-react";
import { useCardio } from "./store.js";
import { useProfile } from "../profile/store.js";
import { useBody, latestWeight } from "../body/store.js";
import { CARDIO_TYPES, CARDIO_WORKOUTS, INTENTS, workoutById, ALL_PREF_TYPES } from "./data/cardio.js";
import { estimateKcal, shuffleWorkout, intensityOfIntent, matchLogs } from "./engine/cardio.js";
import { useCardioWeek } from "../coach.js";
import { Sheet, Field, NumInput, Chips, toast, Empty } from "../../components/ui.jsx";
import StepPlayer from "../../components/StepPlayer.jsx";
import { today, relDay, weekStart, addDays, fmtDay } from "../../lib/dates.js";
import { duration, num, pace } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

const FIELD_DEF = {
  distance: { label: (t) => (t === "rower" ? "Distance m" : "Distance km"), key: "distance" },
  watts: { label: () => "Avg watts", key: "watts" },
  rpm: { label: () => "Avg rpm", key: "rpm" },
  speed: { label: () => "Speed km/h", key: "speed" },
  incline: { label: () => "Incline %", key: "incline" },
  level: { label: () => "Level", key: "level" },
  floors: { label: () => "Floors", key: "floors" },
  calories: { label: () => "Machine kcal", key: "calories" },
};

export function CardioLogSheet({ initial, onClose }) {
  const [, setCardio] = useCardio();
  const [profile] = useProfile();
  const [body] = useBody();
  const kg = latestWeight(body, profile.weightKg);
  const [f, setF] = useState({ date: today(), type: "inclineWalk", intent: "z2", minutes: 30, ...initial });
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const type = CARDIO_TYPES[f.type];
  // distance stored in metres; km fields are converted
  const distMetres = f.distance == null ? null : f.type === "rower" ? f.distance : f.distance * 1000;
  const kcal = estimateKcal({ ...f, distance: distMetres, intensity: intensityOfIntent(f.intent) }, kg);

  const save = () => {
    const entry = { ...f, id: f.id || uid(), distance: distMetres, kcal };
    setCardio((c) => ({ ...c, logs: f.id ? c.logs.map((l) => (l.id === f.id ? entry : l)) : [...c.logs, entry] }));
    toast(`${type.name} logged · ~${kcal} kcal`);
    onClose();
  };

  return (
    <Sheet title="Log cardio" onClose={onClose} area="cardio">
      <div className="stack">
        <Field label="Machine">
          <Chips scroll value={f.type} onChange={(v) => set({ type: v })} options={Object.entries(CARDIO_TYPES).map(([k, t]) => [k, t.name])} />
        </Field>
        <Field label="Type of session">
          <Chips value={f.intent} onChange={(v) => set({ intent: v })} options={Object.entries(INTENTS).map(([k, i]) => [k, i.name])} />
        </Field>
        <div className="grid2">
          <Field label="Minutes"><NumInput value={f.minutes} onChange={(v) => set({ minutes: v })} /></Field>
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
        </div>
        {type.fields.length > 0 && (
          <div className="grid2">
            {type.fields.map((k) => (
              <Field key={k} label={FIELD_DEF[k].label(f.type)}>
                <NumInput value={f[k]} onChange={(v) => set({ [k]: v })} />
              </Field>
            ))}
          </div>
        )}
        <div className="grid2">
          <Field label="Avg heart rate"><NumInput value={f.avgHr} onChange={(v) => set({ avgHr: v })} placeholder="optional" /></Field>
          <Field label="Effort (RPE 1–10)"><NumInput value={f.rpe} onChange={(v) => set({ rpe: v })} placeholder="optional" /></Field>
        </div>
        <input className="input" placeholder="Note" value={f.note || ""} onChange={(e) => set({ note: e.target.value })} />
        <div className="note small"><Flame size={16} /> ≈ <b>{kcal} kcal</b> burned (estimate{f.calories ? " from machine" : ""}).</div>
        <button className="btn primary" disabled={!f.minutes} onClick={save}><Check size={17} /> Save</button>
      </div>
    </Sheet>
  );
}

/** One-line description of a logged session. */
export function logSummary(l) {
  const parts = [`${l.minutes} min`];
  if (l.distance) parts.push(l.type === "rower" ? `${num(l.distance)} m · ${pace(l.minutes * 60, l.distance, 500)}/500m` : `${num(l.distance / 1000, 2)} km`);
  if (l.watts) parts.push(`${l.watts} W`);
  if (l.speed) parts.push(`${l.speed} km/h${l.incline ? ` @ ${l.incline} %` : ""}`);
  if (l.kcal) parts.push(`${l.kcal} kcal`);
  return parts.join(" · ");
}

/** Edit form expects km for distance (m for the rower). */
export const toEditable = (l) => ({ ...l, distance: l.distance != null && l.type !== "rower" ? l.distance / 1000 : l.distance });

function SlotCard({ slot, log, prefs, onShuffle, onStart, onLog, onSkip, onEdit, skipped }) {
  const w = workoutById(slot.workoutId);
  if (log) {
    const t = CARDIO_TYPES[log.type] || CARDIO_TYPES.other;
    return (
      <button className="card press" style={{ textAlign: "left", width: "100%", borderColor: "color-mix(in srgb, var(--good) 40%, var(--line))" }} onClick={onEdit}>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div className="hstack" style={{ alignItems: "flex-start" }}>
            <span className="icon-tile" style={{ "--tile": t.color }}><Check size={18} /></span>
            <div>
              <div className="eyebrow">{relDay(log.date)} · {INTENTS[log.intent]?.name || "Cardio"}</div>
              <div className="h3">{t.name}{log.note ? ` · ${log.note}` : ""}</div>
              <div className="small muted">{logSummary(log)}</div>
            </div>
          </div>
          <span className="badge" style={{ "--b": "var(--good)" }}>logged</span>
        </div>
        <div className="xs faint" style={{ marginTop: 8 }}>{w && slot.key !== log.id ? `Suggested was ${w.name} (${CARDIO_TYPES[slot.type]?.name.toLowerCase()}) · ` : "Extra session · "}tap to edit</div>
      </button>
    );
  }
  const t = CARDIO_TYPES[slot.type];
  return (
    <div className={`card ${slot.date === today() ? "hero" : ""}`} style={{ opacity: skipped ? 0.5 : 1 }}>
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div className="hstack" style={{ alignItems: "flex-start" }}>
          <span className="icon-tile" style={{ "--tile": t.color }}><Flame size={18} /></span>
          <div>
            <div className="eyebrow">{relDay(slot.date)} · {INTENTS[slot.intent].name} · suggestion</div>
            <div className="h3">{w?.name}</div>
            <div className="small muted">{t.name} · {w?.minutes} min</div>
          </div>
        </div>
        {skipped && <span className="badge" style={{ "--b": "var(--muted)" }}>skipped</span>}
      </div>
      {w?.how && <div className="small" style={{ marginTop: 8 }}>{w.how}</div>}
      <div className="hstack wrap" style={{ gap: 6, marginTop: 10 }}>
        <button className="btn sm primary" onClick={onStart}><Play size={14} /> Start</button>
        <button className="btn sm" onClick={onLog}><Check size={14} /> Log what I did</button>
        {prefs.length > 0 && <button className="btn sm ghost" onClick={onShuffle}><Shuffle size={14} /> Other idea</button>}
        <button className="btn sm ghost" onClick={onSkip}>{skipped ? "Unskip" : "Skip"}</button>
      </div>
    </div>
  );
}

export default function CardioView() {
  const [cardio, setCardio] = useCardio();
  const [profile] = useProfile();
  const week = useCardioWeek();
  const [logging, setLogging] = useState(null);
  const [player, setPlayer] = useState(null);
  const [browse, setBrowse] = useState(profile.cardioPrefs[0] || "bike");
  const ws = weekStart(today());

  const weekLogs = cardio.logs.filter((l) => l.date >= ws && l.date <= addDays(ws, 6));
  const totals = useMemo(() => {
    const t = {};
    for (const l of weekLogs) t[l.type] = (t[l.type] || 0) + (l.minutes || 0);
    return t;
  }, [weekLogs]);
  const weekMin = Object.values(totals).reduce((a, b) => a + b, 0);
  const weekKcal = weekLogs.reduce((a, l) => a + (l.kcal || 0), 0);
  const plannedMin = week.reduce((a, s) => a + s.minutes, 0);
  const matched = useMemo(() => matchLogs(week, cardio.logs), [week, cardio.logs]);
  const extra = weekLogs.filter((l) => !Object.values(matched).some((m) => m.id === l.id));

  const startSlot = (slot) => {
    const w = workoutById(slot.workoutId);
    setPlayer({ w, slot });
  };
  const logFrom = (w, slot) => setLogging({ type: w.type, intent: w.intent, minutes: w.minutes, workoutId: w.id, slotKey: slot?.key, date: slot?.date || today() });

  return (
    <div className="stack area-cardio">
      <div className="card">
        <div className="between">
          <div className="stat"><span className="v">{duration(weekMin)}</span><span className="l">This week · plan {duration(plannedMin)}</span></div>
          <div className="stat" style={{ textAlign: "right" }}><span className="v">{num(weekKcal)}</span><span className="l">kcal</span></div>
        </div>
        <div className="bar mt"><span style={{ width: `${plannedMin ? Math.min(100, (weekMin / plannedMin) * 100) : 0}%` }} /></div>
        <div className="hstack wrap xs muted" style={{ gap: "4px 12px", marginTop: 8 }}>
          {Object.entries(totals).map(([k, v]) => <span key={k}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: CARDIO_TYPES[k].color, marginRight: 5 }} />{CARDIO_TYPES[k].short} {v} min</span>)}
        </div>
      </div>

      <div className="between"><h2 className="h2">This week</h2></div>
      <div className="xs muted" style={{ marginTop: -6 }}>
        Suggestions from your goal and phase — just a starting point. Whatever you log (any machine, any length) replaces the suggestion for that day.
      </div>
      {week.length === 0 && <Empty>No cardio planned — set sessions per week under Goals → Cardio.</Empty>}
      {week.map((slot) => (
        <SlotCard key={slot.key} slot={slot} prefs={profile.cardioPrefs}
          log={matched[slot.key]}
          onEdit={() => setLogging(toEditable(matched[slot.key]))}
          skipped={!!cardio.skipped[slot.key]}
          onShuffle={() => setCardio((c) => ({ ...c, overrides: { ...c.overrides, [slot.key]: shuffleWorkout(slot.workoutId, profile.cardioPrefs, slot.intent) } }))}
          onSkip={() => setCardio((c) => ({ ...c, skipped: { ...c.skipped, [slot.key]: !c.skipped[slot.key] } }))}
          onStart={() => startSlot(slot)}
          onLog={() => logFrom(workoutById(slot.workoutId), slot)} />
      ))}

      {extra.map((l) => (
        <SlotCard key={l.id} slot={{ key: l.id, date: l.date, type: l.type, intent: l.intent, workoutId: l.workoutId }} log={l} prefs={[]} onEdit={() => setLogging(toEditable(l))} />
      ))}
      <button className="btn" onClick={() => setLogging({})}><Plus size={16} /> Log cardio</button>

      <h2 className="h2 mt">Workout library</h2>
      <Chips scroll value={browse} onChange={setBrowse} options={ALL_PREF_TYPES.map((t) => [t, CARDIO_TYPES[t].name])} />
      <div className="card flush list">
        {CARDIO_WORKOUTS.filter((w) => w.type === browse).map((w) => (
          <div key={w.id} className="row">
            <div className="grow">
              <div style={{ fontWeight: 650 }}>{w.name} <span className="badge" style={{ marginLeft: 4 }}>{INTENTS[w.intent].name}</span></div>
              <div className="meta">{w.minutes} min · {w.how}</div>
            </div>
            <button className="iconbtn sm" aria-label={`Start ${w.name}`} onClick={() => setPlayer({ w })}><Play size={15} /></button>
          </div>
        ))}
      </div>
      <div className="note xs"><Info size={14} /> <span><b>Zone 2</b> = you can still talk in full sentences. <b>Intervals</b> = hard but repeatable. Calories are estimates (Compendium of Physical Activities / ACSM formulas).</span></div>

      <h2 className="h2 mt">History</h2>
      {cardio.logs.length === 0 ? <Empty>No cardio logged yet.</Empty> : (
        <div className="card flush list">
          {[...cardio.logs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20).map((l) => (
            <div key={l.id} className="row">
              <span className="icon-tile" style={{ "--tile": CARDIO_TYPES[l.type]?.color, width: 30, height: 30 }}><Flame size={15} /></span>
              <button className="grow" style={{ background: "none", border: 0, textAlign: "left", padding: 0 }}
                onClick={() => setLogging(toEditable(l))}>
                <div style={{ fontWeight: 650 }}>{CARDIO_TYPES[l.type]?.name} · {l.minutes} min</div>
                <div className="meta">{fmtDay(l.date)} · {INTENTS[l.intent]?.name} · {logSummary(l)}{l.note ? ` · ${l.note}` : ""}</div>
              </button>
              <button className="iconbtn sm bare" aria-label="Delete" onClick={() => {
                const prev = cardio.logs;
                setCardio((c) => ({ ...c, logs: c.logs.filter((x) => x.id !== l.id) }));
                toast("Deleted", () => setCardio((c) => ({ ...c, logs: prev })));
              }}><Trash2 size={15} className="faint" /></button>
            </div>
          ))}
        </div>
      )}

      {logging && <CardioLogSheet initial={logging} onClose={() => setLogging(null)} />}
      {player && (
        <StepPlayer title={`${CARDIO_TYPES[player.w.type].name} · ${player.w.name}`} color="var(--cardio)"
          steps={player.w.steps.filter((s) => s.sec > 0).map((s) => ({ label: s.label, sec: s.sec, effort: s.effort, desc: player.w.how }))}
          onClose={() => setPlayer(null)}
          onDone={() => logFrom(player.w, player.slot)} />
      )}
    </div>
  );
}
