import { PageHead, Seg } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import PlanView from "./PlanView.jsx";
import WorkoutLogger from "./WorkoutLogger.jsx";
import LibraryView from "./LibraryView.jsx";
import ProgressView from "./ProgressView.jsx";
import CardioView from "../cardio/CardioView.jsx";
import RoutinesView from "../routines/RoutinesView.jsx";

const TABS = [["plan", "Lifts"], ["cardio", "Cardio"], ["mobility", "Mobility"], ["library", "Exercises"], ["progress", "Stats"]];
const AREA = { plan: "train", cardio: "cardio", mobility: "mobility", library: "train", progress: "train" };

export default function TrainPage({ route }) {
  const [tab = "plan", id] = route;
  if (tab === "workout" && id) return <div className="area-train"><WorkoutLogger id={id} /></div>;
  const t = TABS.some(([k]) => k === tab) ? tab : "plan";
  return (
    <div className={`area-${AREA[t]}`}>
      <PageHead eyebrow="Fitness" title="Train" />
      <div style={{ marginBottom: 14 }}><Seg value={t} onChange={(k) => go(`train/${k}`)} options={TABS} /></div>
      {t === "plan" && <PlanView />}
      {t === "cardio" && <CardioView />}
      {t === "mobility" && <RoutinesView />}
      {t === "library" && <LibraryView />}
      {t === "progress" && <ProgressView />}
    </div>
  );
}
