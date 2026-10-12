import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Replace, Plus } from "lucide-react";
import { Sheet, Field, NumInput, Chips } from "../../components/ui.jsx";
import { useTraining } from "./store.js";
import { findExercise, updateDay, updateItem, moveItem, removeItem, addItem } from "./actions.js";
import { WEEKDAYS } from "../../lib/dates.js";
import ExercisePicker, { SpineBadge } from "./ExercisePicker.jsx";

const ROLES = [["primary", "Main"], ["secondary", "Secondary"], ["accessory", "Accessory"], ["finisher", "Finisher"]];

export default function DayEditor({ dayId, onClose }) {
  const [training] = useTraining();
  const day = training.plan.days.find((d) => d.id === dayId);
  const [open, setOpen] = useState(null);
  const [picker, setPicker] = useState(null); // { mode: 'swap'|'add', itemId?, pattern? }
  if (!day) return null;

  return (
    <Sheet title={`Edit ${day.name}`} onClose={onClose} area="train">
      <div className="stack">
        <div className="grid2">
          <Field label="Name"><input className="input" value={day.name} onChange={(e) => updateDay(dayId, (d) => ({ ...d, name: e.target.value }))} /></Field>
          <Field label="Focus"><input className="input" value={day.focus} onChange={(e) => updateDay(dayId, (d) => ({ ...d, focus: e.target.value }))} /></Field>
        </div>
        <Field label="Weekday (every week)">
          <Chips value={day.weekday} onChange={(v) => updateDay(dayId, (d) => ({ ...d, weekday: v }))} options={WEEKDAYS.map((w, i) => [i, w])} />
        </Field>

        <div className="card flush list">
          {day.items.map((it, n) => {
            const ex = findExercise(it.exerciseId);
            const isOpen = open === it.id;
            return (
              <div key={it.id}>
                <button className="row" onClick={() => setOpen(isOpen ? null : it.id)}>
                  <span className="xs faint" style={{ width: 16 }}>{n + 1}</span>
                  <div className="grow">
                    <div style={{ fontWeight: 650 }}>{ex?.name}</div>
                    <div className="meta">{it.role === "finisher" ? `${it.minutes || 8} min` : `${it.sets} × ${it.repMin}–${it.repMax} · RIR ${it.rir} · ${it.rest}s rest`}</div>
                  </div>
                  <SpineBadge spine={ex?.spine} />
                </button>
                {isOpen && (
                  <div className="stack-sm" style={{ padding: "4px 14px 14px", background: "var(--raised)" }}>
                    {ex?.cue && <div className="xs muted">{ex.cue}</div>}
                    <div className="grid3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                      <Field label="Sets"><NumInput value={it.sets} onChange={(v) => v && updateItem(dayId, it.id, { sets: Math.max(1, Math.round(v)) })} /></Field>
                      <Field label="Min"><NumInput value={it.repMin} onChange={(v) => v && updateItem(dayId, it.id, { repMin: Math.round(v) })} /></Field>
                      <Field label="Max"><NumInput value={it.repMax} onChange={(v) => v && updateItem(dayId, it.id, { repMax: Math.round(v) })} /></Field>
                      <Field label="RIR"><NumInput value={it.rir} onChange={(v) => v != null && updateItem(dayId, it.id, { rir: Math.round(v) })} /></Field>
                      <Field label="Rest s"><NumInput value={it.rest} onChange={(v) => v != null && updateItem(dayId, it.id, { rest: Math.round(v) })} /></Field>
                    </div>
                    <Chips value={it.role} onChange={(v) => updateItem(dayId, it.id, { role: v })} options={ROLES} />
                    <div className="hstack wrap" style={{ gap: 6 }}>
                      <button className="btn sm" onClick={() => setPicker({ mode: "swap", itemId: it.id, pattern: ex?.pattern, current: it.exerciseId })}><Replace size={14} /> Swap</button>
                      <button className="iconbtn sm" aria-label="Move up" onClick={() => moveItem(dayId, it.id, -1)}><ArrowUp size={15} /></button>
                      <button className="iconbtn sm" aria-label="Move down" onClick={() => moveItem(dayId, it.id, 1)}><ArrowDown size={15} /></button>
                      <span className="grow" />
                      <button className="btn sm danger" onClick={() => removeItem(dayId, it.id)}><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="btn" onClick={() => setPicker({ mode: "add" })}><Plus size={16} /> Add exercise</button>
        <button className="btn primary" onClick={onClose}>Done</button>
      </div>
      {picker && (
        <ExercisePicker
          title={picker.mode === "add" ? "Add exercise" : "Swap exercise"}
          pattern={picker.pattern}
          currentId={picker.current}
          onClose={() => setPicker(null)}
          onPick={(id) => (picker.mode === "add" ? addItem(dayId, id) : updateItem(dayId, picker.itemId, { exerciseId: id }))}
        />
      )}
    </Sheet>
  );
}
