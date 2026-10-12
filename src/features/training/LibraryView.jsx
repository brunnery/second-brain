import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useTraining } from "./store.js";
import { allExercises, MUSCLES, EQUIPMENT, PATTERNS } from "./data/exercises.js";
import { historyOf, bestSet, e1rm } from "./engine/progression.js";
import { addCustomExercise, addItem } from "./actions.js";
import { Chips, Sheet, Field, toast } from "../../components/ui.jsx";
import { LineChart } from "../../components/charts.jsx";
import { fmtShort, fmtDay } from "../../lib/dates.js";
import { num } from "../../lib/format.js";
import { ExerciseList, SpineBadge } from "./ExercisePicker.jsx";

const GROUPS = {
  all: null, chest: ["chest"], back: ["lats", "upperBack", "traps", "lowerBack"], shoulders: ["frontDelts", "sideDelts", "rearDelts"],
  arms: ["biceps", "triceps", "forearms"], legs: ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors"], core: ["abs", "obliques"], conditioning: ["fullBody"],
};

export function ExerciseSheet({ ex, onClose }) {
  const [training] = useTraining();
  const [addTo, setAddTo] = useState(false);
  const hist = historyOf(training.sessions, ex.id, 30);
  const best = bestSet(hist);
  const series = [...hist].reverse().map((h) => ({ date: h.date, v: Math.max(0, ...h.sets.filter((s) => s.done).map((s) => e1rm(s.kg, s.reps))) }));
  return (
    <Sheet title={ex.name} onClose={onClose} area="train">
      <div className="stack">
        <div className="hstack wrap" style={{ gap: 6 }}>
          <span className="badge">{PATTERNS[ex.pattern]}</span>
          <span className="badge" style={{ "--b": "var(--muted)" }}>{EQUIPMENT[ex.equipment]}</span>
          <span className="badge" style={{ "--b": "var(--muted)" }}>{ex.mech === "c" ? "compound" : "isolation"}</span>
          <SpineBadge spine={ex.spine} />
        </div>
        <div className="small"><b>Main:</b> {ex.primary.map((m) => MUSCLES[m]).join(", ")}{ex.secondary.length > 0 && <><br /><b>Also:</b> {ex.secondary.map((m) => MUSCLES[m]).join(", ")}</>}</div>
        {ex.cue && <div className="note small">{ex.cue}</div>}
        {best ? (
          <>
            <div className="grid2">
              <div className="stat"><span className="v">{num(best.kg, 1)} × {best.reps}</span><span className="l">Best set</span></div>
              <div className="stat"><span className="v">{num(best.e1rm)} kg</span><span className="l">Est. 1RM</span></div>
            </div>
            <div className="card tight">
              <div className="xs muted" style={{ marginBottom: 4 }}>Estimated 1RM over time (kg)</div>
              <LineChart series={[{ name: "e1RM", color: "var(--train)", values: series.map((s) => s.v || null) }]} labels={series.map((s) => fmtShort(s.date))} format={(v) => `${num(v)} kg`} />
            </div>
            <div className="card flush list">
              {hist.slice(0, 6).map((h) => (
                <div key={h.date} className="row"><span className="small grow">{fmtDay(h.date)}</span><span className="xs muted">{h.sets.filter((s) => s.done).map((s) => `${num(s.kg, 1)}×${s.reps}`).join(" · ")}</span></div>
              ))}
            </div>
          </>
        ) : <div className="empty">No history yet — it appears after your first logged set.</div>}
        {training.plan && <button className="btn" onClick={() => setAddTo(true)}><Plus size={16} /> Add to a training day</button>}
      </div>
      {addTo && (
        <Sheet title="Add to which day?" onClose={() => setAddTo(false)} area="train">
          <div className="stack-sm">
            {training.plan.days.map((d) => (
              <button key={d.id} className="btn ghost block" onClick={() => { addItem(d.id, ex.id); toast(`Added to ${d.name}`); setAddTo(false); }}>{d.name}</button>
            ))}
          </div>
        </Sheet>
      )}
    </Sheet>
  );
}

function CustomExerciseSheet({ onClose }) {
  const [f, setF] = useState({ name: "", pattern: "h_press", primary: "chest", equipment: "machine", mech: "c" });
  const save = () => {
    if (!f.name.trim()) return;
    addCustomExercise({ name: f.name.trim(), pattern: f.pattern, primary: [f.primary], secondary: [], equipment: f.equipment, mech: f.mech, spine: 0, cue: "" });
    toast("Exercise added to your library");
    onClose();
  };
  return (
    <Sheet title="New exercise" onClose={onClose} area="train">
      <div className="stack">
        <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Hammer Strength Row" /></Field>
        <Field label="Movement pattern (used for swaps)">
          <select className="input" value={f.pattern} onChange={(e) => setF({ ...f, pattern: e.target.value })}>
            {Object.entries(PATTERNS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="grid2">
          <Field label="Main muscle">
            <select className="input" value={f.primary} onChange={(e) => setF({ ...f, primary: e.target.value })}>
              {Object.entries(MUSCLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Equipment">
            <select className="input" value={f.equipment} onChange={(e) => setF({ ...f, equipment: e.target.value })}>
              {Object.entries(EQUIPMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Chips value={f.mech} onChange={(v) => setF({ ...f, mech: v })} options={[["c", "Compound"], ["i", "Isolation"]]} />
        <button className="btn primary" disabled={!f.name.trim()} onClick={save}>Save exercise</button>
      </div>
    </Sheet>
  );
}

export default function LibraryView() {
  const [training] = useTraining();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [equip, setEquip] = useState("any");
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const all = useMemo(() => allExercises(training.customExercises), [training.customExercises]);
  const list = useMemo(() => all.filter((e) => {
    if (GROUPS[group] && !e.primary.some((m) => GROUPS[group].includes(m))) return false;
    if (equip !== "any" && e.equipment !== equip) return false;
    if (q.trim() && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [all, group, equip, q]);

  return (
    <div className="stack">
      <div className="hstack" style={{ position: "relative" }}>
        <Search size={17} className="faint" style={{ position: "absolute", left: 12 }} />
        <input className="input" style={{ paddingLeft: 36 }} placeholder={`Search ${all.length} exercises…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exercises" />
        <button className="iconbtn" aria-label="Add custom exercise" onClick={() => setAdding(true)}><Plus size={18} /></button>
      </div>
      <Chips scroll value={group} onChange={setGroup} options={Object.keys(GROUPS).map((g) => [g, g[0].toUpperCase() + g.slice(1)])} />
      <Chips scroll value={equip} onChange={setEquip} options={[["any", "Any equipment"], ...Object.entries(EQUIPMENT)]} />
      <div className="xs faint">{list.length} exercises · tap for history, cues and 1RM</div>
      <ExerciseList list={list} onPick={setOpen} />
      {open && <ExerciseSheet ex={open} onClose={() => setOpen(null)} />}
      {adding && <CustomExerciseSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
