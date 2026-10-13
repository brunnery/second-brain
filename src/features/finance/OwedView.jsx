import { HandCoins } from "lucide-react";
import { useFinance, openShares, owedByPerson, sharesOf } from "./engine.js";
import { Check, Empty, toast } from "../../components/ui.jsx";
import { fmtShort } from "../../lib/dates.js";
import { money } from "../../lib/format.js";

/** Tick a share as paid back (or undo). */
export function useShareToggle() {
  const [, setFin] = useFinance();
  return (entryId, shareId, received) => setFin((x) => ({
    ...x,
    entries: x.entries.map((e) => (e.id !== entryId ? e : {
      ...e, shares: sharesOf(e).map((s) => (s.id === shareId ? { ...s, received, receivedOn: received ? new Date().toISOString().slice(0, 10) : null } : s)),
    })),
  }));
}

/** Compact "who owes me" card for the overview. */
export function OwedCard({ onOpen }) {
  const [fin] = useFinance();
  const people = owedByPerson(fin.entries);
  if (!people.length) return null;
  const total = people.reduce((a, [, v]) => a + v, 0);
  return (
    <button className="card press" style={{ textAlign: "left", width: "100%" }} onClick={onOpen}>
      <div className="between"><div className="h3 hstack" style={{ gap: 6 }}><HandCoins size={16} /> Owed to you</div><b>{money(total)}</b></div>
      <div className="xs muted" style={{ marginTop: 4 }}>{people.map(([n, v]) => `${n} ${money(v)}`).join(" · ")}</div>
    </button>
  );
}

export default function OwedView() {
  const [fin] = useFinance();
  const toggle = useShareToggle();
  const open = openShares(fin.entries);
  const people = owedByPerson(fin.entries);
  const done = fin.entries.flatMap((e) => sharesOf(e).filter((s) => s.received).map((s) => ({ entry: e, share: s })))
    .sort((a, b) => ((a.share.receivedOn || "") < (b.share.receivedOn || "") ? 1 : -1)).slice(0, 15);

  return (
    <div className="stack">
      <div className="small muted">Money people owe you from split expenses. Tick when it's paid back — the expense then shrinks by that amount.</div>
      {people.length > 0 && (
        <div className="card tight">
          {people.map(([n, v]) => <div key={n} className="between small" style={{ padding: "3px 0" }}><b>{n}</b><span>{money(v)}</span></div>)}
        </div>
      )}
      {open.length === 0 ? <Empty>Nobody owes you anything. Add people when you log an expense (“Others pay me back”).</Empty> : (
        <div className="card flush list">
          {open.map(({ entry, share }) => (
            <div key={share.id} className="row">
              <Check on={false} label={`${share.name} paid back`} onClick={() => {
                toggle(entry.id, share.id, true);
                toast(`${share.name} paid ${money(share.amount)} back`, () => toggle(entry.id, share.id, false));
              }} />
              <div className="grow">
                <div style={{ fontWeight: 650 }}>{share.name} · {money(share.amount)}</div>
                <div className="meta">{fmtShort(entry.date)} · {entry.note || entry.cat} (you paid {money(entry.amount)})</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <>
          <div className="eyebrow" style={{ marginTop: 6 }}>Paid back</div>
          <div className="card flush list">
            {done.map(({ entry, share }) => (
              <div key={share.id} className="row" style={{ opacity: 0.6 }}>
                <Check on label={`Undo ${share.name}`} onClick={() => toggle(entry.id, share.id, false)} />
                <div className="grow"><div style={{ fontWeight: 600 }}>{share.name} · {money(share.amount)}</div><div className="meta">{entry.note || entry.cat} · back {share.receivedOn ? fmtShort(share.receivedOn) : ""}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
