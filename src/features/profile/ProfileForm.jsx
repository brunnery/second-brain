/* Profile + goal pickers, shared by onboarding and the Goals sheet. */
import { Check } from "lucide-react";
import { Field, Chips, NumInput, Toggle } from "../../components/ui.jsx";
import { GOALS, PHASES, LIFESTYLE, SESSION_LENGTHS } from "./goals.js";
import { CARDIO_TYPES, ALL_PREF_TYPES } from "../cardio/data/cardio.js";

function OptionCard({ on, title, sub, children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="card press" aria-pressed={on}
      style={{ textAlign: "left", width: "100%", borderColor: on ? "var(--accent)" : undefined, background: on ? "color-mix(in srgb, var(--accent) 9%, var(--surface))" : undefined }}>
      <div className="between">
        <div className="h3">{title}</div>
        {on && <span className="badge"><Check size={12} /> Selected</span>}
      </div>
      {sub && <div className="small accent" style={{ marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      {children && <div className="small muted" style={{ marginTop: 6 }}>{children}</div>}
    </button>
  );
}

export function BodyFields({ p, set }) {
  return (
    <div className="stack">
      <Field label="Sex (for the calorie formula)">
        <Chips value={p.sex} onChange={(v) => set({ sex: v })} options={[["male", "Male"], ["female", "Female"]]} />
      </Field>
      <div className="grid3">
        <Field label="Born"><NumInput value={p.birthYear} onChange={(v) => set({ birthYear: v })} /></Field>
        <Field label="Height cm"><NumInput value={p.heightCm} onChange={(v) => set({ heightCm: v })} /></Field>
        <Field label="Weight kg"><NumInput value={p.weightKg} onChange={(v) => set({ weightKg: v })} /></Field>
      </div>
      <Field label="Everyday activity (outside the gym)">
        <div className="stack-sm">
          {Object.entries(LIFESTYLE).map(([k, l]) => (
            <OptionCard key={k} on={p.lifestyle === k} title={l.name} onClick={() => set({ lifestyle: k })}>{l.hint}</OptionCard>
          ))}
        </div>
      </Field>
    </div>
  );
}

export function GoalPicker({ p, set }) {
  return (
    <div className="stack-sm">
      {Object.entries(GOALS).map(([k, g]) => (
        <OptionCard key={k} on={p.goal === k} title={g.name} sub={g.short} onClick={() => set({ goal: k })}>{g.blurb}</OptionCard>
      ))}
    </div>
  );
}

export function PhasePicker({ p, set }) {
  return (
    <div className="stack-sm">
      {Object.entries(PHASES).map(([k, ph]) => (
        <OptionCard key={k} on={p.phase === k} title={ph.name} onClick={() => set({ phase: k })}>{ph.blurb}</OptionCard>
      ))}
    </div>
  );
}

export function TrainingFields({ p, set }) {
  return (
    <div className="stack">
      <Field label="Lifting days per week">
        <Chips value={p.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} options={[[3, "3"], [4, "4"], [5, "5"], [6, "6"]]} />
      </Field>
      <Field label="Session length (lifting)">
        <Chips value={p.sessionMin} onChange={(v) => set({ sessionMin: v })} options={SESSION_LENGTHS.map((m) => [m, `${m} min`])} />
      </Field>
      <Field label="Equipment">
        <Chips value={p.equipment} onChange={(v) => set({ equipment: v })} options={[["gym", "Full gym"], ["home", "Dumbbells / home"]]} />
      </Field>
      <div className="card tight between">
        <div>
          <div className="h3">Back care</div>
          <div className="xs muted">Prefer lifts with low spinal load (chest-supported rows, machines). Recommended with Scheuermann.</div>
        </div>
        <Toggle on={p.backCare} onChange={(v) => set({ backCare: v })} label="Back care" />
      </div>
    </div>
  );
}

export function CardioFields({ p, set }) {
  return (
    <div className="stack">
      <Field label="Machines you like (suggestions only use these)">
        <Chips multi value={p.cardioPrefs} onChange={(v) => set({ cardioPrefs: v })}
          options={ALL_PREF_TYPES.map((t) => [t, CARDIO_TYPES[t].name])} />
      </Field>
      <Field label="Cardio sessions per week" hint="Auto picks the amount from your goal and phase.">
        <Chips value={p.cardioPerWeek ?? "auto"} onChange={(v) => set({ cardioPerWeek: v === "auto" ? null : v })}
          options={[["auto", "Auto"], [1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]]} />
      </Field>
    </div>
  );
}
