import { useState } from "react";
import { Plus, Trash2, Repeat } from "lucide-react";
import { useFinance, upcoming } from "./engine.js";
import { Sheet, Field, NumInput, Chips, Empty, toast } from "../../components/ui.jsx";
import { today, fmtShort } from "../../lib/dates.js";
import { money } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

function RecurringSheet({ initial, onClose }) {
  const [fin, setFin] = useFinance();
  const [r, setR] = useState({ name: "", amount: null, kind: "expense", cat: "Rent", interval: "monthly", day: 1, month: 1, start: today(), end: "", ...initial });
  const cats = Object.entries(fin.cats).filter(([, c]) => c.kind === r.kind).map(([n]) => n);
  const ok = r.name && r.amount > 0 && fin.cats[r.cat];
  const save = () => {
    const item = { ...r, id: r.id || uid(), end: r.end || null };
    setFin((x) => ({ ...x, recurring: r.id ? x.recurring.map((y) => (y.id === r.id ? item : y)) : [...x.recurring, item] }));
    toast("Saved — due entries are booked automatically");
    onClose();
  };
  return (
    <Sheet title={r.id ? "Edit recurring" : "New recurring item"} onClose={onClose} area="money">
      <div className="stack">
        <Chips value={r.kind} onChange={(v) => setR({ ...r, kind: v, cat: Object.entries(fin.cats).find(([, c]) => c.kind === v)?.[0] || "" })} options={[["expense", "Expense"], ["income", "Income"]]} />
        <div className="grid2">
          <Field label="Name"><input className="input" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="e.g. Rent" /></Field>
          <Field label="Amount CHF"><NumInput value={r.amount} onChange={(v) => setR({ ...r, amount: v })} /></Field>
        </div>
        <Field label="Category"><Chips scroll value={r.cat} onChange={(v) => setR({ ...r, cat: v })} options={cats.map((c) => [c, c])} /></Field>
        <Field label="Repeats"><Chips value={r.interval} onChange={(v) => setR({ ...r, interval: v })} options={[["monthly", "Monthly"], ["yearly", "Yearly"], ["weekly", "Weekly"]]} /></Field>
        <div className="grid2">
          {r.interval !== "weekly" && <Field label="Day of month"><NumInput value={r.day} onChange={(v) => setR({ ...r, day: Math.max(1, Math.min(31, Math.round(v || 1))) })} /></Field>}
          {r.interval === "yearly" && <Field label="Month (1–12)"><NumInput value={r.month} onChange={(v) => setR({ ...r, month: Math.max(1, Math.min(12, Math.round(v || 1))) })} /></Field>}
          <Field label="Starts"><input type="date" className="input" value={r.start} onChange={(e) => setR({ ...r, start: e.target.value })} /></Field>
          <Field label="Ends (optional)"><input type="date" className="input" value={r.end || ""} onChange={(e) => setR({ ...r, end: e.target.value })} /></Field>
        </div>
        <button className="btn primary" disabled={!ok} onClick={save}>Save</button>
        {r.id && <button className="btn danger" onClick={() => { setFin((x) => ({ ...x, recurring: x.recurring.filter((y) => y.id !== r.id) })); toast("Removed (past entries stay)"); onClose(); }}><Trash2 size={15} /> Remove</button>}
      </div>
    </Sheet>
  );
}

export default function RecurringView() {
  const [fin] = useFinance();
  const [edit, setEdit] = useState(null);
  const monthly = fin.recurring.reduce((a, r) => {
    const m = r.interval === "monthly" ? r.amount : r.interval === "yearly" ? r.amount / 12 : r.amount * 4.33;
    return a + (r.kind === "income" ? m : -m);
  }, 0);
  const next = upcoming(fin, today(), 30);
  return (
    <div className="stack">
      <div className="card tight between"><span className="small muted">Fixed per month (net)</span><b className={monthly >= 0 ? "good" : ""}>{money(monthly)}</b></div>
      {fin.recurring.length === 0 ? <Empty>Add rent, health insurance, Spotify, salary … they get booked automatically on their day.</Empty> : (
        <div className="card flush list">
          {fin.recurring.map((r) => (
            <button key={r.id} className="row" onClick={() => setEdit(r)}>
              <Repeat size={16} className="faint" />
              <div className="grow"><div style={{ fontWeight: 600 }}>{r.name}</div><div className="meta">{r.cat} · {r.interval}{r.interval !== "weekly" ? ` on the ${r.day}.` : ""}</div></div>
              <b className={r.kind === "income" ? "good" : ""}>{money(r.amount)}</b>
            </button>
          ))}
        </div>
      )}
      <button className="btn" onClick={() => setEdit({})}><Plus size={16} /> Add recurring item</button>
      {next.length > 0 && (
        <div className="card">
          <div className="h3" style={{ marginBottom: 8 }}>Upcoming 30 days</div>
          {next.map(({ date, r }) => <div key={r.id + date} className="between small" style={{ padding: "3px 0" }}><span>{fmtShort(date)} · {r.name}</span><span>{money(r.amount)}</span></div>)}
        </div>
      )}
      {edit && <RecurringSheet initial={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
