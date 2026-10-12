import { useEffect, useState } from "react";
import { Plus, AlertTriangle, CalendarClock, TrendingUp, TrendingDown } from "lucide-react";
import { useFinance, pendingRecurring, monthSummary, categoryTotals, upcoming } from "./engine.js";
import { PageHead, Seg, Note, Stat, Bar } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import { monthKey, today, fmtShort, fmtMonth } from "../../lib/dates.js";
import { money, moneyShort } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";
import EntrySheet from "./EntrySheet.jsx";
import EntriesView from "./EntriesView.jsx";
import BudgetsView from "./BudgetsView.jsx";
import RecurringView from "./RecurringView.jsx";
import SavingsView from "./SavingsView.jsx";
import ReportView from "./ReportView.jsx";

const TABS = [["overview", "Overview"], ["entries", "Entries"], ["budgets", "Budgets"], ["recurring", "Recurring"], ["savings", "Savings"], ["report", "Report"]];

/** Book due recurring items once per app open (idempotent). */
export function useRecurringAutobook() {
  const [fin, setFin] = useFinance();
  const { recurring } = fin;
  useEffect(() => {
    setFin((x) => {
      const due = pendingRecurring(x, today(), uid);
      return due.length ? { ...x, entries: [...x.entries, ...due] } : x;
    });
  }, [recurring, setFin]);
}

function Overview({ onAdd }) {
  const [fin] = useFinance();
  const mk = monthKey(today());
  const s = monthSummary(fin.entries, mk);
  const cats = categoryTotals(fin.entries, fin.cats, mk);
  const budgetTotal = Object.values(fin.cats).filter((c) => c.kind === "expense" && c.budget).reduce((a, c) => a + c.budget, 0);
  const budgetSpent = cats.filter((c) => c.budget).reduce((a, c) => a + c.total, 0);
  const over = cats.filter((c) => c.budget && c.total > c.budget);
  const next = upcoming(fin).slice(0, 4);

  return (
    <div className="stack">
      <div className="card hero">
        <div className="eyebrow">{fmtMonth(mk)}</div>
        <div className="between" style={{ alignItems: "flex-end", marginTop: 4 }}>
          <div>
            <div className="big">{moneyShort(s.expense)}</div>
            <div className="small muted">spent this month</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className={`h2 ${s.net >= 0 ? "good" : "bad"}`}>{s.net >= 0 ? "+" : ""}{moneyShort(s.net)}</div>
            <div className="xs muted">net · {s.savingsRate != null ? `${Math.round(s.savingsRate)} % saved` : "no income yet"}</div>
          </div>
        </div>
        {budgetTotal > 0 && (
          <div className="mt">
            <div className="between xs muted"><span>Budgets</span><span>{money(budgetSpent)} / {money(budgetTotal)}</span></div>
            <Bar value={budgetSpent} max={budgetTotal} color={budgetSpent > budgetTotal ? "var(--bad)" : "var(--accent)"} />
          </div>
        )}
      </div>
      <div className="grid2">
        <button className="btn" onClick={() => onAdd("expense")}><TrendingDown size={16} /> Expense</button>
        <button className="btn" onClick={() => onAdd("income")}><TrendingUp size={16} /> Income</button>
      </div>
      {over.map((c) => (
        <Note key={c.name} icon={AlertTriangle} color="var(--bad)"><b>{c.name}</b> is over budget: {money(c.total)} of {money(c.budget)}.</Note>
      ))}
      <div className="card">
        <div className="card-head"><div className="h3">Top categories</div><button className="btn sm ghost" onClick={() => go("money/report")}>Report</button></div>
        {cats.length === 0 ? <div className="empty">No expenses this month.</div> : cats.slice(0, 5).map((c) => (
          <div key={c.name} style={{ marginBottom: 10 }}>
            <div className="between small"><span className="hstack" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />{c.name}</span><span>{money(c.total)}{c.budget ? <span className="muted"> / {moneyShort(c.budget)}</span> : null}</span></div>
            {c.budget ? <Bar value={c.total} max={c.budget} thin color={c.total > c.budget ? "var(--bad)" : c.color} /> : null}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><div className="h3 hstack" style={{ gap: 6 }}><CalendarClock size={16} /> Next 30 days</div><button className="btn sm ghost" onClick={() => go("money/recurring")}>Manage</button></div>
        {next.length === 0 ? <div className="small muted">No recurring items yet — add rent, insurance, subscriptions, salary.</div> : next.map(({ date, r }) => (
          <div key={r.id + date} className="between small" style={{ padding: "4px 0" }}>
            <span>{fmtShort(date)} · {r.name}</span><span className={r.kind === "income" ? "good" : ""}>{r.kind === "income" ? "+" : "−"}{money(r.amount)}</span>
          </div>
        ))}
      </div>
      <div className="grid3">
        <Stat value={moneyShort(s.income)} label="Income" />
        <Stat value={s.list.length} label="Entries" />
        <Stat value={cats.length} label="Categories" />
      </div>
    </div>
  );
}

export default function MoneyPage({ route }) {
  const t = TABS.some(([k]) => k === route[0]) ? route[0] : "overview";
  const [adding, setAdding] = useState(null);
  return (
    <div className="area-money">
      <PageHead eyebrow="Finance" title="Money" />
      <div style={{ marginBottom: 14 }}><Seg value={t} onChange={(k) => go(`money/${k}`)} options={TABS} /></div>
      {t === "overview" && <Overview onAdd={(kind) => setAdding({ kind })} />}
      {t === "entries" && <EntriesView onEdit={setAdding} />}
      {t === "budgets" && <BudgetsView />}
      {t === "recurring" && <RecurringView />}
      {t === "savings" && <SavingsView />}
      {t === "report" && <ReportView />}
      <button className="fab" aria-label="Add expense" onClick={() => setAdding({ kind: "expense" })}><Plus size={26} /></button>
      {adding && <EntrySheet initial={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
