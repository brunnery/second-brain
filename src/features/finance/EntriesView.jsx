import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Repeat, Trash2 } from "lucide-react";
import { useFinance, inMonth, netAmount, sharesOf, NEED, needOf } from "./engine.js";
import { Chips, Empty, toast } from "../../components/ui.jsx";
import { monthKey, shiftMonth, today, fmtMonth, relDay } from "../../lib/dates.js";
import { money } from "../../lib/format.js";

export function MonthSwitcher({ mk, setMk }) {
  return (
    <div className="between">
      <button className="iconbtn sm" aria-label="Previous month" onClick={() => setMk(shiftMonth(mk, -1))}><ChevronLeft size={18} /></button>
      <div className="h3">{fmtMonth(mk)}</div>
      <button className="iconbtn sm" aria-label="Next month" onClick={() => setMk(shiftMonth(mk, 1))}><ChevronRight size={18} /></button>
    </div>
  );
}

export default function EntriesView({ onEdit }) {
  const [fin, setFin] = useFinance();
  const [mk, setMk] = useState(monthKey(today()));
  const [kind, setKind] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => inMonth(fin.entries, mk)
    .filter((e) => (kind === "all" || e.kind === kind) && (cat === "all" || e.cat === cat) && (!q || (e.note || "").toLowerCase().includes(q.toLowerCase()) || e.cat.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.date < b.date ? 1 : -1)), [fin.entries, mk, kind, cat, q]);
  const byDay = list.reduce((a, e) => { (a[e.date] = a[e.date] || []).push(e); return a; }, {});
  const usedCats = [...new Set(inMonth(fin.entries, mk).map((e) => e.cat))];

  const del = (e) => {
    const prev = fin.entries;
    setFin((x) => ({ ...x, entries: x.entries.filter((y) => y.id !== e.id) }));
    toast("Entry deleted", () => setFin((x) => ({ ...x, entries: prev })));
  };

  return (
    <div className="stack">
      <MonthSwitcher mk={mk} setMk={setMk} />
      <input className="input" placeholder="Search notes / categories…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search entries" />
      <Chips value={kind} onChange={setKind} options={[["all", "All"], ["expense", "Expenses"], ["income", "Income"]]} />
      {usedCats.length > 1 && <Chips scroll value={cat} onChange={setCat} options={[["all", "All categories"], ...usedCats.map((c) => [c, c])]} />}
      {list.length === 0 ? <Empty>No entries.</Empty> : Object.entries(byDay).map(([date, es]) => (
        <div key={date}>
          <div className="between eyebrow" style={{ margin: "6px 2px" }}>
            <span>{relDay(date)}</span>
            <span>{money(es.reduce((a, e) => a + (e.kind === "expense" ? -netAmount(e) : e.amount), 0))}</span>
          </div>
          <div className="card flush list">
            {es.map((e) => (
              <div key={e.id} className="row">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: fin.cats[e.cat]?.color || "var(--faint)", flexShrink: 0 }} />
                <button className="grow" style={{ background: "none", border: 0, textAlign: "left", padding: 0 }} onClick={() => onEdit(e)}>
                  <div style={{ fontWeight: 600 }}>{e.cat} {e.recurringId && <Repeat size={12} className="faint" />}
                    {e.kind === "expense" && <span className="badge" style={{ "--b": NEED[needOf(e, fin.cats)][1], marginLeft: 6 }}>{NEED[needOf(e, fin.cats)][0]}</span>}</div>
                  {e.note && <div className="meta">{e.note}</div>}
                  {sharesOf(e).length > 0 && (
                    <div className="xs" style={{ color: "var(--money)" }}>
                      {sharesOf(e).filter((x) => !x.received).length
                        ? `${money(sharesOf(e).filter((x) => !x.received).reduce((a, x) => a + x.amount, 0))} owed by ${sharesOf(e).filter((x) => !x.received).map((x) => x.name).join(", ")}`
                        : "all paid back"}
                    </div>
                  )}
                </button>
                <span style={{ fontWeight: 700, textAlign: "right" }} className={e.kind === "income" ? "good" : ""}>{e.kind === "income" ? "+" : "−"}{money(netAmount(e))}{netAmount(e) !== e.amount && <div className="xs faint" style={{ fontWeight: 400, textDecoration: "line-through" }}>{money(e.amount)}</div>}</span>
                <button className="iconbtn sm bare" aria-label="Delete entry" onClick={() => del(e)}><Trash2 size={15} className="faint" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
