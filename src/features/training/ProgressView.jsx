import { useMemo, useState } from "react";
import { useTraining } from "./store.js";
import { useCardio } from "../cardio/store.js";
import { useBody } from "../body/store.js";
import { CARDIO_TYPES } from "../cardio/data/cardio.js";
import { tonnage, historyOf, e1rm } from "./engine/progression.js";
import { findExercise } from "./actions.js";
import { movingAverage } from "../nutrition/engine/nutrition.js";
import { BarChart, LineChart } from "../../components/charts.jsx";
import { Chips, Empty, Stat } from "../../components/ui.jsx";
import { today, weekStart, addDays, fmtShort, daysBetween } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export default function ProgressView() {
  const [training] = useTraining();
  const [cardio] = useCardio();
  const [body] = useBody();
  const [range, setRange] = useState(12);
  const weeks = useMemo(() => Array.from({ length: range }, (_, i) => addDays(weekStart(today()), -7 * (range - 1 - i))), [range]);
  const done = training.sessions.filter((s) => s.finishedAt);

  const tonnageData = weeks.map((w) => ({
    label: fmtShort(w),
    values: [done.filter((s) => s.date >= w && s.date <= addDays(w, 6)).reduce((a, s) => a + tonnage(s), 0)],
  }));
  const workoutsData = weeks.map((w) => ({ label: fmtShort(w), values: [done.filter((s) => s.date >= w && s.date <= addDays(w, 6)).length] }));
  const usedTypes = [...new Set(cardio.logs.map((l) => l.type))];
  const cardioData = weeks.map((w) => ({
    label: fmtShort(w),
    values: usedTypes.map((t) => cardio.logs.filter((l) => l.type === t && l.date >= w && l.date <= addDays(w, 6)).reduce((a, l) => a + l.minutes, 0)),
  }));

  const weights = [...body.weights].sort((a, b) => (a.date < b.date ? -1 : 1)).filter((w) => daysBetween(w.date, today()) <= range * 7);
  const wAvg = movingAverage(weights);

  const lifted = useMemo(() => {
    const ids = new Map();
    for (const s of done) for (const e of s.entries) if (e.sets.some((x) => x.done && x.kg)) ids.set(e.exerciseId, (ids.get(e.exerciseId) || 0) + 1);
    return [...ids.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id);
  }, [done]);
  const [lift, setLift] = useState(null);
  const liftId = lift || lifted[0];
  const liftHist = liftId ? [...historyOf(training.sessions, liftId, 40)].reverse() : [];

  return (
    <div className="stack">
      <Chips value={range} onChange={setRange} options={[[4, "4 weeks"], [12, "12 weeks"], [52, "1 year"]]} />
      <div className="grid3">
        <Stat value={done.filter((s) => daysBetween(s.date, today()) < 30).length} label="Workouts 30d" />
        <Stat value={num(done.filter((s) => daysBetween(s.date, today()) < 7).reduce((a, s) => a + tonnage(s), 0) / 1000, 1) + " t"} label="Volume 7d" />
        <Stat value={cardio.logs.filter((l) => daysBetween(l.date, today()) < 7).reduce((a, l) => a + l.minutes, 0) + "′"} label="Cardio 7d" />
      </div>

      <div className="card">
        <div className="h3">Lifting volume per week</div>
        <div className="xs muted" style={{ marginBottom: 6 }}>kg × reps of all ticked sets</div>
        {done.length ? <BarChart data={tonnageData} stacks={[{ name: "Volume", color: "var(--train)" }]} format={(v) => `${num(v)} kg`} /> : <Empty>Log a workout to see this.</Empty>}
      </div>

      <div className="card">
        <div className="h3">Workouts per week</div>
        <BarChart data={workoutsData} stacks={[{ name: "Workouts", color: "var(--train)" }]} height={120} format={(v) => `${v}`} />
      </div>

      <div className="card">
        <div className="h3">Cardio minutes per week</div>
        {usedTypes.length ? (
          <BarChart data={cardioData} stacks={usedTypes.map((t) => ({ name: CARDIO_TYPES[t].short, color: CARDIO_TYPES[t].color }))} format={(v) => `${v}′`} />
        ) : <Empty>No cardio logged yet.</Empty>}
      </div>

      <div className="card">
        <div className="h3">Body weight</div>
        {weights.length > 1 ? (
          <LineChart labels={weights.map((w) => fmtShort(w.date))} format={(v) => `${num(v, 1)} kg`}
            series={[
              { name: "Weigh-in", color: "var(--faint)", values: weights.map((w) => w.kg) },
              { name: "7-day average", color: "var(--food)", values: wAvg.map((w) => +w.avg.toFixed(2)), dots: false },
            ]} />
        ) : <Empty>Log your weight under More → Body.</Empty>}
      </div>

      <div className="card">
        <div className="h3">Strength — estimated 1RM</div>
        {lifted.length ? (
          <>
            <Chips scroll value={liftId} onChange={setLift} options={lifted.map((id) => [id, findExercise(id)?.name || id])} />
            <div style={{ marginTop: 8 }}>
              <LineChart labels={liftHist.map((h) => fmtShort(h.date))} format={(v) => `${num(v)} kg`}
                series={[{ name: "e1RM", color: "var(--train)", values: liftHist.map((h) => Math.round(Math.max(0, ...h.sets.filter((s) => s.done).map((s) => e1rm(s.kg, s.reps)))) || null) }]} />
            </div>
          </>
        ) : <Empty>Your top lifts show up here after logging.</Empty>}
      </div>
    </div>
  );
}
