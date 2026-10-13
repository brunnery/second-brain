import { useState } from "react";
import { Check, Users, X, Plus } from "lucide-react";
import { useFinance, feedbackFor, CAT_COLORS, NEED, needOf, knownPeople, splitEqually, myShare } from "./engine.js";
import { Sheet, Field, NumInput, Chips, Toggle, toast } from "../../components/ui.jsx";
import { today } from "../../lib/dates.js";
import { money } from "../../lib/format.js";
import { uid } from "../../lib/uid.js";

export const RATING = { good: ["Good", "var(--good)"], neutral: ["Neutral", "var(--muted)"], bad: ["Bad", "var(--bad)"] };

/** Add / edit an entry. New categories get a rating once; expenses can be split with people who pay you back. */
export default function EntrySheet({ initial, onClose, onSaved }) {
  const [fin, setFin] = useFinance();
  const [f, setF] = useState({ kind: "expense", amount: null, cat: "", note: "", date: today(), shares: [], ...initial });
  const [newCat, setNewCat] = useState("");
  const [rating, setRating] = useState(null);
  const [split, setSplit] = useState((initial?.shares || []).length > 0);
  const [person, setPerson] = useState("");
  const cats = Object.entries(fin.cats).filter(([, c]) => c.kind === f.kind).map(([name]) => name);
  const catName = f.cat === "__new" ? newCat.trim() : f.cat;
  const needsRating = f.cat === "__new" && f.kind === "expense";
  const need = f.need || (catName ? needOf({ cat: catName }, fin.cats) : "want");
  const shares = f.shares || [];
  const people = knownPeople(fin.entries).filter((p) => !shares.some((s) => s.name === p));
  const ok = f.amount > 0 && catName && (!needsRating || rating);

  const setShares = (list) => setF((x) => ({ ...x, shares: list }));
  const addPerson = (name) => {
    const n = name.trim();
    if (!n || shares.some((s) => s.name === n)) return;
    const next = [...shares, { id: uid(), name: n, amount: 0, received: false }];
    // re-split equally whenever people are added
    const eq = splitEqually(f.amount || 0, next.map((s) => s.name));
    setShares(next.map((s, i) => ({ ...s, amount: eq[i].amount })));
    setPerson("");
  };

  const save = () => {
    const cleanShares = split ? shares.filter((s) => s.name && s.amount > 0) : [];
    const entry = {
      id: f.id || uid(), date: f.date, amount: f.amount, kind: f.kind, cat: catName, note: f.note, recurringId: f.recurringId,
      ...(f.kind === "expense" ? { need } : {}),
      ...(cleanShares.length ? { shares: cleanShares } : {}),
    };
    const nextCats = fin.cats[catName] ? fin.cats : {
      ...fin.cats,
      [catName]: { kind: f.kind, rating: rating || "good", budget: null, color: CAT_COLORS[Object.keys(fin.cats).length % CAT_COLORS.length], need },
    };
    const nextEntries = f.id ? fin.entries.map((e) => (e.id === f.id ? entry : e)) : [...fin.entries, entry];
    setFin((x) => ({ ...x, cats: nextCats, entries: nextEntries }));
    const fb = feedbackFor(entry, { ...fin, cats: nextCats, entries: nextEntries });
    onSaved?.(fb);
    if (!onSaved) toast(fb.text);
    onClose();
  };

  return (
    <Sheet title={f.id ? "Edit entry" : f.kind === "income" ? "Add income" : "Add expense"} onClose={onClose} area="money">
      <div className="stack">
        <Chips value={f.kind} onChange={(v) => setF({ ...f, kind: v, cat: "" })} options={[["expense", "Expense"], ["income", "Income"]]} />
        <NumInput className="input big-num" value={f.amount} placeholder="CHF 0.00" onChange={(v) => setF({ ...f, amount: v })} autoFocus aria-label="Amount" />
        <Field label="Category">
          <Chips value={f.cat} onChange={(v) => setF({ ...f, cat: v, need: undefined })} options={[...cats.map((c) => [c, c]), ["__new", "+ New"]]} />
        </Field>
        {f.cat === "__new" && (
          <>
            <input className="input" placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="New category name" />
            {needsRating && (
              <Field label="Is this a good, neutral or bad expense? (asked once)">
                <Chips value={rating} onChange={setRating} options={Object.entries(RATING).map(([k, [l]]) => [k, l])} />
              </Field>
            )}
          </>
        )}
        {f.kind === "expense" && (
          <Field label="Was it necessary?">
            <Chips value={need} onChange={(v) => setF({ ...f, need: v })} options={Object.entries(NEED).map(([k, [l]]) => [k, l])} />
          </Field>
        )}
        <div className="grid2">
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Note"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. round of drinks" /></Field>
        </div>

        {f.kind === "expense" && (
          <div className="card tight stack-sm">
            <div className="between">
              <div className="hstack" style={{ gap: 8 }}><Users size={16} /><div><div className="small" style={{ fontWeight: 650 }}>Others pay me back</div><div className="xs muted">Split a bill, a round, a ticket …</div></div></div>
              <Toggle on={split} onChange={setSplit} label="Others pay me back" />
            </div>
            {split && (
              <>
                {shares.map((s, i) => (
                  <div key={s.id} className="hstack" style={{ gap: 8 }}>
                    <span className="grow small" style={{ fontWeight: 650 }}>{s.name}</span>
                    <NumInput className="input" value={s.amount} onChange={(v) => setShares(shares.map((x, k) => (k === i ? { ...x, amount: v || 0 } : x)))} aria-label={`${s.name} owes`} style={{ width: 92, minHeight: 36, padding: "4px 8px", textAlign: "right" }} />
                    <button className="iconbtn sm bare" aria-label={`Remove ${s.name}`} onClick={() => setShares(shares.filter((_, k) => k !== i))}><X size={15} /></button>
                  </div>
                ))}
                <div className="hstack" style={{ gap: 6 }}>
                  <input className="input" placeholder="Name" value={person} onChange={(e) => setPerson(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPerson(person)} aria-label="Person's name" />
                  <button className="iconbtn" aria-label="Add person" onClick={() => addPerson(person)}><Plus size={17} /></button>
                </div>
                {people.length > 0 && (
                  <div className="chips scroll">{people.slice(0, 12).map((p) => <button key={p} className="chip" onClick={() => addPerson(p)}>+ {p}</button>)}</div>
                )}
                {shares.length > 0 && (
                  <div className="between xs">
                    <button className="btn sm ghost" onClick={() => { const eq = splitEqually(f.amount || 0, shares.map((s) => s.name)); setShares(shares.map((s, i) => ({ ...s, amount: eq[i].amount }))); }}>Split equally (incl. me)</button>
                    <span className="muted">Your part: <b>{money(myShare({ amount: f.amount || 0, shares }))}</b></span>
                  </div>
                )}
                <div className="xs faint">The full amount counts until you tick “paid back” (Money → Owed).</div>
              </>
            )}
          </div>
        )}
        <button className="btn primary" disabled={!ok} onClick={save}><Check size={17} /> Save</button>
      </div>
    </Sheet>
  );
}
