/* ================================================================
   FINANCE ENGINE (pure, unit-tested)
   ================================================================ */
import { registerStore, useStore } from "../../lib/storage.js";
import { addDays, daysInMonth, monthKey, shiftMonth, today, fromISO } from "../../lib/dates.js";
import { money } from "../../lib/format.js";

export const FINANCE_KEY = "finance";

/* fixed categorical order — colour follows the category, never its rank */
export const CAT_COLORS = ["#7cc4ff", "#ffc94a", "#ff7a45", "#63d98f", "#b9a3ff", "#ff7a9c", "#56d6d0", "#d4ff3a", "#c9a27e", "#a39e90"];

/* necessity of an expense: need = had to, want = chose to (fine), waste = unnecessary */
export const NEED = { need: ["Need", "var(--good)"], want: ["Want", "var(--food)"], waste: ["Unnecessary", "var(--bad)"] };
const DEFAULT_NEED = { Rent: "need", Groceries: "need", "Transport / SBB": "need", "Health insurance": "need", Uni: "need" };

const cat = (kind, rating, budget, color, need = "want") => ({ kind, rating, budget, color, need });
export const SEED_CATS = {
  Rent: cat("expense", "neutral", null, CAT_COLORS[0], "need"),
  Groceries: cat("expense", "good", 400, CAT_COLORS[1], "need"),
  "Eating out": cat("expense", "bad", 120, CAT_COLORS[2]),
  "Transport / SBB": cat("expense", "neutral", 80, CAT_COLORS[3], "need"),
  Sport: cat("expense", "good", 80, CAT_COLORS[4]),
  Subscriptions: cat("expense", "neutral", 50, CAT_COLORS[5]),
  "Health insurance": cat("expense", "neutral", null, CAT_COLORS[6], "need"),
  Uni: cat("expense", "good", null, CAT_COLORS[7], "need"),
  Shopping: cat("expense", "neutral", 100, CAT_COLORS[8]),
  "Going out": cat("expense", "bad", 100, CAT_COLORS[9]),
  Salary: cat("income", "good", null, CAT_COLORS[3]),
  "Other income": cat("income", "good", null, CAT_COLORS[0]),
};

/** Necessity of an entry: its own choice, else the category default. */
export const needOf = (e, cats) => e.need || cats?.[e.cat]?.need || DEFAULT_NEED[e.cat] || "want";

/* ---------- shared expenses: others owe me part of it ----------
   entry.shares = [{ id, name, amount, received, receivedOn }]
   The expense only counts what is not paid back yet: amount − received shares. */
export const sharesOf = (e) => (Array.isArray(e.shares) ? e.shares : []);
export const netAmount = (e) =>
  e.kind === "expense" ? Math.max(0, e.amount - sharesOf(e).filter((s) => s.received).reduce((a, s) => a + (s.amount || 0), 0)) : e.amount;
export const myShare = (e) => Math.max(0, e.amount - sharesOf(e).reduce((a, s) => a + (s.amount || 0), 0));
export const openShares = (entries) =>
  entries.flatMap((e) => sharesOf(e).filter((s) => !s.received).map((s) => ({ entry: e, share: s })))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1));
export const owedByPerson = (entries) => {
  const out = {};
  for (const { share } of openShares(entries)) out[share.name] = (out[share.name] || 0) + (share.amount || 0);
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
};
export const knownPeople = (entries) => [...new Set(entries.flatMap((e) => sharesOf(e).map((s) => s.name)).filter(Boolean))].sort();
/** Split an amount equally between me and the named people (rounded to 5 Rappen). */
export function splitEqually(amount, names) {
  const n = names.length + 1;
  const each = Math.round((amount / n) * 20) / 20;
  return names.map((name) => ({ name, amount: each }));
}

registerStore(FINANCE_KEY, () => ({
  schemaVersion: 1,
  entries: [],     // { id, date, amount, kind, cat, note, need?, shares?, recurringId? }
  cats: SEED_CATS,
  recurring: [],   // { id, name, amount, kind, cat, interval, day, month, start, end }
  accounts: [],    // { id, name, type, history: [{ date, balance }] }
  goals: [],       // { id, name, target, date, accountId?, saved }
}));
export const useFinance = () => useStore(FINANCE_KEY);

/* ---------- recurring ---------- */
export function dueDates(rec, upTo) {
  const out = [];
  const start = rec.start || today();
  const end = rec.end && rec.end < upTo ? rec.end : upTo;
  if (start > end) return out;
  if (rec.interval === "weekly") {
    for (let d = start; d <= end; d = addDays(d, 7)) out.push(d);
    return out;
  }
  let mk = monthKey(start);
  for (let i = 0; i < 600; i++) {
    const [y, m] = mk.split("-").map(Number);
    if (rec.interval !== "yearly" || m === (rec.month || Number(start.slice(5, 7)))) {
      const day = Math.min(rec.day || 1, daysInMonth(mk));
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (iso > end) break;
      if (iso >= start) out.push(iso);
    }
    mk = shiftMonth(mk, 1);
    if (`${mk}-01` > end) break;
  }
  return out;
}

/** New entries for recurring items up to `upTo` that do not exist yet (idempotent). */
export function pendingRecurring(state, upTo = today(), makeId = () => Math.random().toString(36).slice(2)) {
  const have = new Set(state.entries.filter((e) => e.recurringId).map((e) => `${e.recurringId}@${e.date}`));
  const out = [];
  for (const r of state.recurring) {
    for (const d of dueDates(r, upTo)) {
      if (!have.has(`${r.id}@${d}`)) out.push({ id: makeId(), date: d, amount: r.amount, kind: r.kind, cat: r.cat, note: r.name, recurringId: r.id });
    }
  }
  return out;
}

export function upcoming(state, from = today(), days = 30) {
  const to = addDays(from, days);
  return state.recurring
    .flatMap((r) => dueDates(r, to).filter((d) => d > from).map((d) => ({ date: d, r })))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* ---------- summaries ---------- */
export const inMonth = (entries, mk) => entries.filter((e) => monthKey(e.date) === mk);

export function monthSummary(entries, mk) {
  const list = inMonth(entries, mk);
  const income = list.filter((e) => e.kind === "income").reduce((a, e) => a + e.amount, 0);
  const expense = list.filter((e) => e.kind === "expense").reduce((a, e) => a + netAmount(e), 0);
  return { list, income, expense, net: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : null };
}

export function categoryTotals(entries, cats, mk) {
  const out = {};
  for (const e of inMonth(entries, mk)) {
    if (e.kind !== "expense") continue;
    out[e.cat] = (out[e.cat] || 0) + netAmount(e);
  }
  return Object.entries(out).map(([name, total]) => ({ name, total, ...(cats[name] || {}) })).sort((a, b) => b.total - a.total);
}

export function ratingTotals(entries, cats, mk) {
  const out = { good: 0, neutral: 0, bad: 0 };
  for (const e of inMonth(entries, mk)) if (e.kind === "expense") out[cats[e.cat]?.rating || "neutral"] += netAmount(e);
  return out;
}

export function needTotals(entries, cats, mk) {
  const out = { need: 0, want: 0, waste: 0 };
  for (const e of inMonth(entries, mk)) if (e.kind === "expense") out[needOf(e, cats)] += netAmount(e);
  return out;
}

/** Instant feedback after logging an expense. */
export function feedbackFor(entry, state) {
  if (entry.kind === "income") return { tone: "good", text: `Nice — ${money(entry.amount)} in.` };
  const meta = state.cats[entry.cat] || { rating: "neutral" };
  const mk = monthKey(entry.date);
  const same = inMonth(state.entries, mk).filter((e) => e.kind === "expense" && e.cat === entry.cat);
  const spent = same.reduce((a, e) => a + netAmount(e), 0);
  const owed = sharesOf(entry).reduce((a, x) => a + (x.amount || 0), 0);
  const owedNote = owed ? ` ${money(owed)} still to come back from ${sharesOf(entry).map((x) => x.name).join(", ")}.` : "";
  if (needOf(entry, state.cats) === "waste") {
    const waste = inMonth(state.entries, mk).filter((e) => e.kind === "expense" && needOf(e, state.cats) === "waste").reduce((a, e) => a + netAmount(e), 0);
    return { tone: "bad", text: `Unnecessary — ${money(waste)} on unnecessary things this month.${owedNote}` };
  }
  if (meta.budget) {
    const pct = Math.round((spent / meta.budget) * 100);
    if (spent > meta.budget) return { tone: "bad", text: `Over budget: ${entry.cat} at ${money(spent)} of ${money(meta.budget)} (${pct} %).${owedNote}` };
    if (pct >= 80) return { tone: "warn", text: `Careful — ${entry.cat} at ${pct} % of its ${money(meta.budget)} budget.${owedNote}` };
    return { tone: meta.rating === "bad" ? "warn" : "good", text: `${entry.cat}: ${pct} % of budget used (${money(spent)} / ${money(meta.budget)}).${owedNote}` };
  }
  if (meta.rating === "bad") return { tone: "bad", text: `You marked ${entry.cat} as a bad habit — ${same.length}× and ${money(spent)} this month.${owedNote}` };
  if (meta.rating === "good") return { tone: "good", text: `Good spend. ${entry.cat} this month: ${money(spent)}.${owedNote}` };
  return { tone: "neutral", text: `Logged. ${entry.cat} this month: ${money(spent)}.${owedNote}` };
}

/* ---------- accounts & goals ---------- */
export const balanceOf = (acc) => [...(acc.history || [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.balance ?? 0;

export function netWorthSeries(accounts, months = 12) {
  const end = monthKey(today());
  return Array.from({ length: months }, (_, i) => {
    const mk = shiftMonth(end, i - months + 1);
    const last = `${mk}-${daysInMonth(mk)}`;
    const v = accounts.reduce((a, acc) => {
      const h = [...(acc.history || [])].filter((x) => x.date <= last).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
      return a + (h?.balance || 0);
    }, 0);
    return { mk, v };
  });
}

export function goalProgress(goal, accounts) {
  const saved = goal.accountId ? balanceOf(accounts.find((a) => a.id === goal.accountId) || {}) : goal.saved || 0;
  const left = Math.max(0, goal.target - saved);
  const months = goal.date ? Math.max(1, (fromISO(goal.date).getFullYear() - new Date().getFullYear()) * 12 + fromISO(goal.date).getMonth() - new Date().getMonth()) : null;
  return { saved, left, pct: goal.target ? Math.min(100, (saved / goal.target) * 100) : 0, perMonth: months ? left / months : null };
}

