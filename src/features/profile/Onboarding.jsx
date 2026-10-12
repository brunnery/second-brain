import { useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useProfile } from "./store.js";
import { BodyFields, GoalPicker, PhasePicker, TrainingFields, CardioFields } from "./ProfileForm.jsx";
import { rebuildPlans } from "../coach.js";
import { setState } from "../../lib/storage.js";
import { today } from "../../lib/dates.js";

const STEPS = [
  { title: "About you", sub: "Used for calories and macros.", C: BodyFields },
  { title: "Your goal", sub: "Bulk, cut or in between — changes food and cardio.", C: GoalPicker },
  { title: "Training phase", sub: "What the lifting should build right now.", C: PhasePicker },
  { title: "Training setup", sub: "Days, time and equipment.", C: TrainingFields },
  { title: "Cardio", sub: "Pick your machines — you get a new suggestion every session.", C: CardioFields },
];

export default function Onboarding() {
  const [profile, setProfile] = useProfile();
  const [step, setStep] = useState(0);
  const set = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const { title, sub, C } = STEPS[step];
  const last = step === STEPS.length - 1;

  const finish = () => {
    setState("body", (b) => ({ ...b, weights: [{ date: today(), kg: profile.weightKg }] }));
    rebuildPlans({ keepLocked: false });
    set({ onboarded: true });
  };

  return (
    <main className="app area-train" style={{ paddingBottom: 120 }}>
      <div className="eyebrow" style={{ marginTop: 8 }}>Second Brain · setup {step + 1}/{STEPS.length}</div>
      <div className="bar thin" style={{ margin: "10px 0 18px" }}><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <h1 className="title">{title}</h1>
      <p className="muted small" style={{ margin: "8px 0 18px" }}>{sub}</p>
      <C p={profile} set={set} />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px calc(12px + var(--safe-bottom))", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="hstack" style={{ maxWidth: "var(--maxw)", margin: "0 auto" }}>
          {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)} aria-label="Back"><ArrowLeft size={18} /></button>}
          <button className="btn primary grow" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? <><Sparkles size={18} /> Build my plans</> : <>Next <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </main>
  );
}
