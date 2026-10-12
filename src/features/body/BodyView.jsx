import { useState } from "react";
import { Plus, Trash2, Scale } from "lucide-react";
import { useBody } from "./store.js";
import { useProfile } from "../profile/store.js";
import { GOALS } from "../profile/goals.js";
import { movingAverage, weeklyRate } from "../nutrition/engine/nutrition.js";
import { LineChart } from "../../components/charts.jsx";
import { Sheet, Field, NumInput, Empty, Stat, toast } from "../../components/ui.jsx";
import { today, fmtShort, fmtDay } from "../../lib/dates.js";
import { num } from "../../lib/format.js";

export function WeightSheet({ onClose }) {
  const [body, setBody] = useBody();
  const last = [...body.weights].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const [kg, setKg] = useState(last?.kg ?? null);
  const [waist, setWaist] = useState(null);
  const [date, setDate] = useState(today());
  const save = () => {
    setBody((b) => ({
      ...b,
      weights: kg ? [...b.weights.filter((w) => w.date !== date), { date, kg }] : b.weights,
      waist: waist ? [...b.waist.filter((w) => w.date !== date), { date, cm: waist }] : b.waist,
    }));
    toast("Saved");
    onClose();
  };
  return (
    <Sheet title="Log weight" onClose={onClose} area="food">
      <div className="stack">
        <Field label="Weight kg" hint="Best: mornings, after the toilet, before eating."><NumInput className="input big-num" value={kg} onChange={setKg} autoFocus /></Field>
        <div className="grid2">
          <Field label="Waist cm (optional)"><NumInput value={waist} onChange={setWaist} /></Field>
          <Field label="Date"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <button className="btn primary" disabled={!kg && !waist} onClick={save}>Save</button>
      </div>
    </Sheet>
  );
}

export default function BodyView() {
  const [body, setBody] = useBody();
  const [profile] = useProfile();
  const [adding, setAdding] = useState(false);
  const sorted = [...body.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const avg = movingAverage(sorted);
  const rate = weeklyRate(sorted);
  const [lo, hi] = GOALS[profile.goal].ratePctPerWeek;
  const last = avg[avg.length - 1];

  return (
    <div className="stack area-food">
      <div className="grid3">
        <Stat value={last ? `${num(last.kg, 1)}` : "–"} label="Last kg" />
        <Stat value={last ? `${num(last.avg, 1)}` : "–"} label="7-day avg" />
        <Stat value={rate != null ? `${rate > 0 ? "+" : ""}${num(rate, 2)} %` : "–"} label="per week" />
      </div>
      <div className="xs muted">Target for {GOALS[profile.goal].name}: {lo} to {hi} % body weight per week. The trend needs ~2 weeks of weigh-ins.</div>
      <div className="card">
        {sorted.length > 1 ? (
          <LineChart labels={sorted.map((w) => fmtShort(w.date))} format={(v) => `${num(v, 1)} kg`}
            series={[{ name: "Weigh-in", color: "var(--faint)", values: sorted.map((w) => w.kg) }, { name: "7-day average", color: "var(--food)", values: avg.map((w) => +w.avg.toFixed(2)), dots: false }]} />
        ) : <Empty>Log a few weigh-ins to see the trend.</Empty>}
      </div>
      <button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} /> Log weight</button>
      {sorted.length > 0 && (
        <div className="card flush list">
          {[...sorted].reverse().slice(0, 30).map((w) => (
            <div key={w.date} className="row">
              <Scale size={16} className="faint" />
              <span className="grow small">{fmtDay(w.date)}</span>
              <b>{num(w.kg, 1)} kg</b>
              <button className="iconbtn sm bare" aria-label="Delete weigh-in" onClick={() => setBody((b) => ({ ...b, weights: b.weights.filter((x) => x.date !== w.date) }))}><Trash2 size={15} className="faint" /></button>
            </div>
          ))}
        </div>
      )}
      {adding && <WeightSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
