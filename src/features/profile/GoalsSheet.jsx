import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Sheet, Seg, toast } from "../../components/ui.jsx";
import { useProfile } from "./store.js";
import { GOALS, PHASES } from "./goals.js";
import { BodyFields, GoalPicker, PhasePicker, TrainingFields, CardioFields } from "./ProfileForm.jsx";
import { rebuildPlans } from "../coach.js";

/** Edit goal / phase / setup. Changing anything offers to rebuild the plans. */
export default function GoalsSheet({ onClose, initialTab = "goal" }) {
  const [profile, setProfile] = useProfile();
  const [draft, setDraft] = useState(profile);
  const [tab, setTab] = useState(initialTab);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const changedTraining = ["phase", "goal", "daysPerWeek", "sessionMin", "backCare", "equipment"].some((k) => draft[k] !== profile[k]);
  const changed = JSON.stringify(draft) !== JSON.stringify(profile);

  const save = (rebuild) => {
    setProfile(draft);
    if (rebuild) {
      rebuildPlans({ training: changedTraining, meals: true });
      toast(changedTraining ? "Saved — new training & meal plan built" : "Saved — meal plan updated");
    } else toast("Saved");
    onClose();
  };

  return (
    <Sheet title="Goals & setup" onClose={onClose} area="train">
      <div className="stack">
        <Seg value={tab} onChange={setTab} options={[["goal", "Goal"], ["phase", "Phase"], ["setup", "Setup"], ["cardio", "Cardio"], ["body", "Body"]]} />
        {tab === "goal" && <GoalPicker p={draft} set={set} />}
        {tab === "phase" && <PhasePicker p={draft} set={set} />}
        {tab === "setup" && <TrainingFields p={draft} set={set} />}
        {tab === "cardio" && <CardioFields p={draft} set={set} />}
        {tab === "body" && <BodyFields p={draft} set={set} />}
        <div className="divider" />
        <div className="small muted">
          Now: <b className="accent">{GOALS[draft.goal].name}</b> · <b className="accent">{PHASES[draft.phase].short}</b> · {draft.daysPerWeek} days × {draft.sessionMin} min
        </div>
        {changed ? (
          <div className="stack-sm">
            <button className="btn primary block" onClick={() => save(true)}><RefreshCw size={17} /> Save & rebuild plans</button>
            <button className="btn ghost block" onClick={() => save(false)}>Save only (keep my current plans)</button>
            {changedTraining && <div className="xs faint">Rebuilding replaces the training plan (your logged workouts stay). Locked meals are kept.</div>}
          </div>
        ) : (
          <button className="btn ghost block" onClick={onClose}>Close</button>
        )}
      </div>
    </Sheet>
  );
}
