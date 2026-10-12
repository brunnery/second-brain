import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useFinance, categoryTotals } from "./engine.js";
import { RATING } from "./EntrySheet.jsx";
import { Chips, NumInput, Bar, Sheet, Field, toast } from "../../components/ui.jsx";
import { monthKey, today } from "../../lib/dates.js";
import { money } from "../../lib/format.js";

function CatSheet({ name, onClose }) {
  const [fin, setFin] = useFinance();
  const c = fin.cats[name];
  const set = (patch) => setFin((x) => ({ ...x, cats: { ...x.cats, [name]: { ...x.cats[name], ...patch } } }));
  const used = fin.entries.some((e) => e.cat === name);
  return (
    <Sheet title={name} onClose={onClose} area="money">
      <div className="stack">
        {c.kind === "expense" && (
          <>
            <Field label="Rating"><Chips value={c.rating} onChange={(v) => set({ rating: v })} options={Object.entries(RATING).map(([k, [l]]) => [k, l])} /></Field>
            <Field label="Monthly budget (empty = none)"><NumInput value={c.budget} onChange={(v) => set({ budget: v || null })} placeholder="CHF" /></Field>
          </>
        )}
        <button className="btn danger" disabled={used} onClick={() => {
          setFin((x) => { const cats = { ...x.cats }; delete cats[name]; return { ...x, cats }; });
          toast("Category deleted"); onClose();
        }}><Trash2 size={15} /> Delete category</button>
        {used && <div className="xs faint">Used by entries — can't be deleted.</div>}
      </div>
    </Sheet>
  );
}

export default function BudgetsView() {
  const [fin] = useFinance();
  const [open, setOpen] = useState(null);
  const mk = monthKey(today());
  const spent = Object.fromEntries(categoryTotals(fin.entries, fin.cats, mk).map((c) => [c.name, c.total]));
  const groups = [["expense", "Expense categories"], ["income", "Income categories"]];
  return (
    <div className="stack">
      <div className="small muted">Rate each category good / neutral / bad and set optional monthly budgets. Feedback after each expense uses these.</div>
      {groups.map(([kind, title]) => (
        <div key={kind}>
          <div className="eyebrow" style={{ margin: "6px 2px" }}>{title}</div>
          <div className="card flush list">
            {Object.entries(fin.cats).filter(([, c]) => c.kind === kind).map(([name, c]) => (
              <button key={name} className="row" onClick={() => setOpen(name)}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <div className="grow">
                  <div className="between"><b>{name}</b><span className="small">{money(spent[name] || 0)}{c.budget ? <span className="muted"> / {money(c.budget)}</span> : null}</span></div>
                  {c.budget ? <Bar value={spent[name] || 0} max={c.budget} thin color={(spent[name] || 0) > c.budget ? "var(--bad)" : c.color} /> : null}
                </div>
                {kind === "expense" && <span className="badge" style={{ "--b": RATING[c.rating][1] }}>{RATING[c.rating][0]}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      {open && <CatSheet name={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
