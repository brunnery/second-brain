import { useState } from "react";
import { Check } from "lucide-react";
import { useFinance, feedbackFor, CAT_COLORS } from "./engine.js";
import { Sheet, Field, NumInput, Chips, toast } from "../../components/ui.jsx";
import { today } from "../../lib/dates.js";
import { uid } from "../../lib/uid.js";

export const RATING = { good: ["Good", "var(--good)"], neutral: ["Neutral", "var(--muted)"], bad: ["Bad", "var(--bad)"] };

/** Add / edit an entry. New categories must get a rating once. */
export default function EntrySheet({ initial, onClose, onSaved }) {
  const [fin, setFin] = useFinance();
  const [f, setF] = useState({ kind: "expense", amount: null, cat: "", note: "", date: today(), ...initial });
  const [newCat, setNewCat] = useState("");
  const [rating, setRating] = useState(null);
  const cats = Object.entries(fin.cats).filter(([, c]) => c.kind === f.kind).map(([name]) => name);
  const catName = f.cat === "__new" ? newCat.trim() : f.cat;
  const needsRating = f.cat === "__new" && f.kind === "expense";
  const ok = f.amount > 0 && catName && (!needsRating || rating);

  const save = () => {
    const entry = { id: f.id || uid(), date: f.date, amount: f.amount, kind: f.kind, cat: catName, note: f.note, recurringId: f.recurringId };
    const nextCats = fin.cats[catName] ? fin.cats : {
      ...fin.cats,
      [catName]: { kind: f.kind, rating: rating || "good", budget: null, color: CAT_COLORS[Object.keys(fin.cats).length % CAT_COLORS.length] },
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
          <Chips value={f.cat} onChange={(v) => setF({ ...f, cat: v })} options={[...cats.map((c) => [c, c]), ["__new", "+ New"]]} />
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
        <div className="grid2">
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Note"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="optional" /></Field>
        </div>
        <button className="btn primary" disabled={!ok} onClick={save}><Check size={17} /> Save</button>
      </div>
    </Sheet>
  );
}
