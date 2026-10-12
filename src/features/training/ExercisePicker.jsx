import { useMemo, useState } from "react";
import { Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { Sheet, Chips } from "../../components/ui.jsx";
import { MUSCLES, EQUIPMENT, PATTERNS } from "./data/exercises.js";
import { useTraining } from "./store.js";
import { allExercises } from "./data/exercises.js";

export function SpineBadge({ spine }) {
  if (spine === 0) return <span className="badge" style={{ "--b": "var(--good)" }}><ShieldCheck size={11} /> back-friendly</span>;
  if (spine === 2) return <span className="badge" style={{ "--b": "var(--warn)" }}><AlertTriangle size={11} /> high spine load</span>;
  return null;
}

const MUSCLE_FILTERS = ["chest", "lats", "upperBack", "sideDelts", "rearDelts", "frontDelts", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs"];

export function ExerciseList({ list, onPick, selectedId }) {
  if (!list.length) return <div className="empty">No exercise matches.</div>;
  return (
    <div className="card flush list">
      {list.map((e) => (
        <button key={e.id} className="row" onClick={() => onPick(e)} style={selectedId === e.id ? { background: "var(--raised)" } : undefined}>
          <div className="grow">
            <div style={{ fontWeight: 650 }}>{e.name}{e.custom && <span className="badge" style={{ marginLeft: 6 }}>custom</span>}</div>
            <div className="meta">{e.primary.map((m) => MUSCLES[m]).join(", ")} · {EQUIPMENT[e.equipment]}</div>
          </div>
          <SpineBadge spine={e.spine} />
        </button>
      ))}
    </div>
  );
}

/** Pick an exercise. With `pattern`, alternatives for that slot are shown first. */
export default function ExercisePicker({ title = "Choose exercise", pattern, currentId, onPick, onClose }) {
  const [training] = useTraining();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState(null);
  const [mode, setMode] = useState(pattern ? "alt" : "all");
  const all = useMemo(() => allExercises(training.customExercises), [training.customExercises]);

  const list = useMemo(() => {
    let l = mode === "alt" && pattern ? all.filter((e) => e.pattern === pattern) : all;
    if (muscle) l = l.filter((e) => e.primary.includes(muscle) || e.secondary.includes(muscle));
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((e) => e.name.toLowerCase().includes(s) || (PATTERNS[e.pattern] || "").toLowerCase().includes(s));
    }
    return l;
  }, [all, mode, pattern, muscle, q]);

  return (
    <Sheet title={title} onClose={onClose} area="train">
      <div className="stack">
        {pattern && (
          <Chips value={mode} onChange={setMode} options={[["alt", `Alternatives · ${PATTERNS[pattern]}`], ["all", "All exercises"]]} />
        )}
        <div className="hstack" style={{ position: "relative" }}>
          <Search size={17} className="faint" style={{ position: "absolute", left: 12 }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exercises" />
        </div>
        <Chips scroll value={muscle} onChange={(v) => setMuscle(v === muscle ? null : v)} options={MUSCLE_FILTERS.map((m) => [m, MUSCLES[m]])} />
        <div className="xs faint">{list.length} exercises</div>
        <ExerciseList list={list} selectedId={currentId} onPick={(e) => { onPick(e.id); onClose(); }} />
      </div>
    </Sheet>
  );
}
