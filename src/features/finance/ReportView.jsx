import { useState } from "react";
import { useFinance, monthSummary, categoryTotals, ratingTotals, inMonth } from "./engine.js";
import { MonthSwitcher } from "./EntriesView.jsx";
import { RATING } from "./EntrySheet.jsx";
import { Donut, BarChart, Legend } from "../../components/charts.jsx";
import { Stat, Bar } from "../../components/ui.jsx";
import { monthKey, shiftMonth, today, fmtMonth, fmtShort } from "../../lib/dates.js";
import { money, moneyShort, pct } from "../../lib/format.js";

const delta = (a, b) => (b ? ((a - b) / b) * 100 : null);

export default function ReportView() {
  const [fin] = useFinance();
  const [mk, setMk] = useState(monthKey(today()));
  const s = monthSummary(fin.entries, mk);
  const prev = monthSummary(fin.entries, shiftMonth(mk, -1));
  const six = Array.from({ length: 6 }, (_, i) => monthSummary(fin.entries, shiftMonth(mk, -(i + 1))).expense);
  const avg6 = six.reduce((a, b) => a + b, 0) / 6;
  const cats = categoryTotals(fin.entries, fin.cats, mk);
  const top = cats.slice(0, 6);
  const rest = cats.slice(6).reduce((a, c) => a + c.total, 0);
  const parts = [...top.map((c) => ({ name: c.name, value: c.total, color: c.color })), ...(rest ? [{ name: "Other", value: rest, color: "var(--faint)" }] : [])];
  const ratings = ratingTotals(fin.entries, fin.cats, mk);
  const biggest = inMonth(fin.entries, mk).filter((e) => e.kind === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5);
  const year = Array.from({ length: 12 }, (_, i) => shiftMonth(mk, i - 11)).map((m) => ({ m, ...monthSummary(fin.entries, m) }));
  const dPrev = delta(s.expense, prev.expense);
  const dAvg = delta(s.expense, avg6);

  return (
    <div className="stack">
      <MonthSwitcher mk={mk} setMk={setMk} />
      <div className="grid3">
        <Stat value={moneyShort(s.income)} label="Income" />
        <Stat value={moneyShort(s.expense)} label="Spent" />
        <Stat value={s.savingsRate != null ? pct(s.savingsRate) : "–"} label="Saved" />
      </div>
      <div className="card tight small">
        Spending {dPrev != null ? <b className={dPrev > 0 ? "bad" : "good"}>{dPrev > 0 ? "+" : ""}{Math.round(dPrev)} %</b> : "–"} vs {fmtMonth(shiftMonth(mk, -1))}
        {" · "}{dAvg != null ? <b className={dAvg > 0 ? "bad" : "good"}>{dAvg > 0 ? "+" : ""}{Math.round(dAvg)} %</b> : "–"} vs 6-month average ({moneyShort(avg6)})
      </div>

      <div className="card">
        <div className="h3" style={{ marginBottom: 10 }}>Where it went</div>
        {cats.length === 0 ? <div className="empty">No expenses.</div> : (
          <div className="hstack" style={{ gap: 16, alignItems: "center" }}>
            <Donut parts={parts} center={<div><div style={{ fontWeight: 800 }}>{moneyShort(s.expense)}</div><div className="xs muted">total</div></div>} />
            <div className="grow stack-sm">
              {parts.map((p) => (
                <div key={p.name} className="between small"><span className="hstack" style={{ gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: p.color }} />{p.name}</span><span>{moneyShort(p.value)}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {cats.some((c) => c.budget) && (
        <div className="card">
          <div className="h3" style={{ marginBottom: 10 }}>Budget vs actual</div>
          {cats.filter((c) => c.budget).map((c) => (
            <div key={c.name} style={{ marginBottom: 10 }}>
              <div className="between small"><span>{c.name}</span><span className={c.total > c.budget ? "bad" : ""}>{money(c.total)} / {money(c.budget)}</span></div>
              <Bar value={c.total} max={c.budget} thin color={c.total > c.budget ? "var(--bad)" : c.color} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="h3" style={{ marginBottom: 10 }}>Good · neutral · bad</div>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", gap: 2, background: "var(--raised)" }}>
          {Object.entries(ratings).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} title={RATING[k][0]} style={{ width: `${(v / (s.expense || 1)) * 100}%`, background: RATING[k][1] }} />
          ))}
        </div>
        <Legend items={Object.entries(ratings).map(([k, v]) => ({ name: `${RATING[k][0]} ${moneyShort(v)}`, color: RATING[k][1] }))} />
      </div>

      <div className="card">
        <div className="h3" style={{ marginBottom: 8 }}>Biggest expenses</div>
        {biggest.length === 0 ? <div className="small muted">–</div> : biggest.map((e) => (
          <div key={e.id} className="between small" style={{ padding: "4px 0" }}><span>{fmtShort(e.date)} · {e.note || e.cat}</span><b>{money(e.amount)}</b></div>
        ))}
      </div>

      <div className="card">
        <div className="h3">12 months</div>
        <div className="xs muted" style={{ marginBottom: 6 }}>Spending per month · dashed line = average income</div>
        <BarChart data={year.map((y) => ({ label: fmtMonth(y.m).slice(0, 3), values: [y.expense] }))} stacks={[{ name: "Spent", color: "var(--money)" }]}
          target={year.reduce((a, y) => a + y.income, 0) / 12 || null} format={(v) => moneyShort(v)} />
      </div>
    </div>
  );
}
