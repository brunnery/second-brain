import { useState } from "react";
import { Plus, Landmark, Target, Trash2 } from "lucide-react";
import { useFinance, balanceOf, netWorthSeries, goalProgress } from "./engine.js";
import { Sheet, Field, NumInput, Chips, Empty, Bar, toast } from "../../components/ui.jsx";
import { LineChart } from "../../components/charts.jsx";
import { today, fmtShort, fmtMonth } from "../../lib/dates.js";
import { money, moneyShort } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

const ACC_TYPES = [["bank", "Bank"], ["savings", "Savings"], ["3a", "Pillar 3a"], ["invest", "Investments"], ["cash", "Cash"]];

function AccountSheet({ acc, onClose }) {
  const [, setFin] = useFinance();
  const [f, setF] = useState({ name: acc?.name || "", type: acc?.type || "bank", balance: acc ? balanceOf(acc) : null });
  const save = () => {
    setFin((x) => {
      if (acc) {
        return { ...x, accounts: x.accounts.map((a) => (a.id === acc.id ? { ...a, name: f.name, type: f.type, history: [...a.history.filter((h) => h.date !== today()), { date: today(), balance: f.balance || 0 }] } : a)) };
      }
      return { ...x, accounts: [...x.accounts, { id: uid(), name: f.name, type: f.type, history: [{ date: today(), balance: f.balance || 0 }] }] };
    });
    toast("Balance saved");
    onClose();
  };
  return (
    <Sheet title={acc ? `Update ${acc.name}` : "New account"} onClose={onClose} area="money">
      <div className="stack">
        <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. UBS private" /></Field>
        <Chips value={f.type} onChange={(v) => setF({ ...f, type: v })} options={ACC_TYPES} />
        <Field label="Current balance CHF"><NumInput className="input big-num" value={f.balance} onChange={(v) => setF({ ...f, balance: v })} /></Field>
        <button className="btn primary" disabled={!f.name} onClick={save}>Save</button>
        {acc && <button className="btn danger" onClick={() => { setFin((x) => ({ ...x, accounts: x.accounts.filter((a) => a.id !== acc.id) })); onClose(); }}><Trash2 size={15} /> Delete account</button>}
        {acc?.history?.length > 1 && <div className="xs faint">{acc.history.length} balance snapshots · first {fmtShort(acc.history[0].date)}</div>}
      </div>
    </Sheet>
  );
}

function GoalSheet({ goal, onClose }) {
  const [fin, setFin] = useFinance();
  const [g, setG] = useState({ name: "", target: null, date: "", accountId: "", saved: null, ...goal });
  const save = () => {
    const item = { ...g, id: g.id || uid(), accountId: g.accountId || null };
    setFin((x) => ({ ...x, goals: g.id ? x.goals.map((y) => (y.id === g.id ? item : y)) : [...x.goals, item] }));
    onClose();
  };
  return (
    <Sheet title={g.id ? "Edit goal" : "New savings goal"} onClose={onClose} area="money">
      <div className="stack">
        <Field label="Goal"><input className="input" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="e.g. Road bike, emergency fund" /></Field>
        <div className="grid2">
          <Field label="Target CHF"><NumInput value={g.target} onChange={(v) => setG({ ...g, target: v })} /></Field>
          <Field label="By (optional)"><input type="date" className="input" value={g.date || ""} onChange={(e) => setG({ ...g, date: e.target.value })} /></Field>
        </div>
        <Field label="Track with">
          <Chips value={g.accountId || ""} onChange={(v) => setG({ ...g, accountId: v })} options={[["", "Manual amount"], ...fin.accounts.map((a) => [a.id, a.name])]} />
        </Field>
        {!g.accountId && <Field label="Saved so far CHF"><NumInput value={g.saved} onChange={(v) => setG({ ...g, saved: v })} /></Field>}
        <button className="btn primary" disabled={!g.name || !g.target} onClick={save}>Save goal</button>
        {g.id && <button className="btn danger" onClick={() => { setFin((x) => ({ ...x, goals: x.goals.filter((y) => y.id !== g.id) })); onClose(); }}><Trash2 size={15} /> Delete</button>}
      </div>
    </Sheet>
  );
}

export default function SavingsView() {
  const [fin] = useFinance();
  const [acc, setAcc] = useState(null);
  const [goal, setGoal] = useState(null);
  const total = fin.accounts.reduce((a, x) => a + balanceOf(x), 0);
  const series = netWorthSeries(fin.accounts, 12);
  return (
    <div className="stack">
      <div className="card hero">
        <div className="eyebrow">Net worth</div>
        <div className="big">{moneyShort(total)}</div>
        {fin.accounts.length > 0 && series.some((s) => s.v) && (
          <div className="mt"><LineChart labels={series.map((s) => fmtMonth(s.mk).slice(0, 3))} format={(v) => moneyShort(v)}
            series={[{ name: "Net worth", color: "var(--money)", values: series.map((s) => s.v || null) }]} /></div>
        )}
      </div>
      <div className="between"><h2 className="h2">Accounts</h2><button className="btn sm" onClick={() => setAcc({})}><Plus size={14} /> Account</button></div>
      {fin.accounts.length === 0 ? <Empty>Add your accounts and update the balance once a month.</Empty> : (
        <div className="card flush list">
          {fin.accounts.map((a) => (
            <button key={a.id} className="row" onClick={() => setAcc(a)}>
              <Landmark size={17} className="faint" />
              <div className="grow"><div style={{ fontWeight: 600 }}>{a.name}</div><div className="meta">{ACC_TYPES.find(([k]) => k === a.type)?.[1]} · updated {fmtShort([...a.history].sort((x, y) => (x.date < y.date ? 1 : -1))[0].date)}</div></div>
              <b>{money(balanceOf(a))}</b>
            </button>
          ))}
        </div>
      )}
      <div className="between"><h2 className="h2">Savings goals</h2><button className="btn sm" onClick={() => setGoal({})}><Plus size={14} /> Goal</button></div>
      {fin.goals.length === 0 ? <Empty>No goals yet.</Empty> : fin.goals.map((g) => {
        const p = goalProgress(g, fin.accounts);
        return (
          <button key={g.id} className="card press" style={{ textAlign: "left", width: "100%" }} onClick={() => setGoal(g)}>
            <div className="between"><div className="h3 hstack" style={{ gap: 6 }}><Target size={16} /> {g.name}</div><span className="small">{Math.round(p.pct)} %</span></div>
            <div className="mt"><Bar value={p.saved} max={g.target} /></div>
            <div className="xs muted" style={{ marginTop: 6 }}>{money(p.saved)} of {money(g.target)}{p.perMonth != null && p.left > 0 ? ` · save ${money(p.perMonth)}/month to make it` : ""}</div>
          </button>
        );
      })}
      {acc && <AccountSheet acc={acc.id ? acc : null} onClose={() => setAcc(null)} />}
      {goal && <GoalSheet goal={goal} onClose={() => setGoal(null)} />}
    </div>
  );
}
