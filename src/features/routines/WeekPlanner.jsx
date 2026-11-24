/* Weekly evening-routine planner.
   Drag a routine from the palette onto a day, drag a day onto another day to swap,
   or drag a day onto "Rest" to clear it. Works with touch (pointer events, not
   HTML5 drag & drop, which iOS Safari doesn't support). Tap fallback: tap a
   routine, then tap the days you want it on. */
import { useEffect, useRef, useState } from "react";
import { GripVertical, Moon } from "lucide-react";
import { ROUTINES, assignDay, swapDays, routineMinutes } from "./programs.js";
import { WEEKDAYS, weekDays, today } from "../../lib/dates.js";

const SHORT = { back: "Back", core: "Core", mobility: "Stretch" };
const PALETTE = [...Object.values(ROUTINES).map((r) => ({ id: r.id, label: SHORT[r.id] || r.name, color: r.color })), { id: null, label: "Rest", color: "var(--faint)" }];
const meta = (id) => PALETTE.find((p) => p.id === (id ?? null));

function Pill({ id, dragging, selected, ...rest }) {
  const m = meta(id);
  return (
    <span {...rest} className="dnd-pill" data-on={selected ? "1" : undefined}
      style={{ "--c": m.color, opacity: dragging ? 0.35 : 1, ...rest.style }}>
      {id ? <GripVertical size={14} /> : <Moon size={13} />}{m.label}
    </span>
  );
}

export default function WeekPlanner({ schedule, onChange }) {
  const [drag, setDrag] = useState(null);   // { src: {palette:id}|{day:i}, x, y, id, active }
  const [hover, setHover] = useState(null); // "day:3" | "rest"
  const [picked, setPicked] = useState(undefined); // tap mode: routine id (null = rest)
  const dragRef = useRef(null);
  const week = weekDays(today());
  const todayIdx = week.indexOf(today());

  const targetAt = (x, y) => document.elementFromPoint(x, y)?.closest("[data-drop]")?.dataset.drop || null;

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const active = d.active || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6;
      dragRef.current = { ...d, x: e.clientX, y: e.clientY, active };
      setDrag(dragRef.current);
      setHover(active ? targetAt(e.clientX, e.clientY) : null);
    };
    const up = (e) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null); setHover(null);
      if (!d) return;
      if (!d.active) { // a tap
        if ("palette" in d.src) setPicked((p) => (p === d.src.palette ? undefined : d.src.palette));
        else if (picked !== undefined) onChange(assignDay(schedule, d.src.day, picked));
        return;
      }
      const t = targetAt(e.clientX, e.clientY);
      if (!t) return;
      if (t === "rest") { if ("day" in d.src) onChange(assignDay(schedule, d.src.day, null)); return; }
      const day = +t.split(":")[1];
      if ("day" in d.src) onChange(swapDays(schedule, d.src.day, day));
      else onChange(assignDay(schedule, day, d.src.palette));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, schedule, onChange, picked]);

  const start = (src, id) => (e) => {
    e.preventDefault();
    dragRef.current = { src, id, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false };
    setDrag(dragRef.current);
  };

  return (
    <div className="stack-sm">
      <div className="dnd-palette" data-drop="rest" data-hover={hover === "rest" ? "1" : undefined}>
        {PALETTE.map((p) => (
          <Pill key={p.id ?? "rest"} id={p.id} selected={picked === p.id} onPointerDown={start({ palette: p.id }, p.id)} />
        ))}
      </div>
      <div className="xs muted">
        {picked !== undefined ? <>Tap the days for <b>{meta(picked).label}</b> — tap it again when done.</> : "Drag a routine onto a day · drag a day onto another to swap · drag onto Rest to clear. Or tap a routine, then tap days."}
      </div>
      <div className="card flush list">
        {WEEKDAYS.map((w, i) => {
          const id = schedule[i] ?? null;
          const rt = id ? ROUTINES[id] : null;
          return (
            <div key={w} className="row dnd-day" data-drop={`day:${i}`} data-hover={hover === `day:${i}` ? "1" : undefined}
              onClick={() => { if (picked !== undefined) onChange(assignDay(schedule, i, picked)); }}>
              <span className="small" style={{ width: 44, fontWeight: 700, color: i === todayIdx ? "var(--mobility)" : undefined }}>{w}</span>
              <div className="grow">
                {rt ? <Pill id={id} dragging={drag?.active && drag.src.day === i} onPointerDown={start({ day: i }, id)} />
                  : <span className="xs faint">Rest evening</span>}
              </div>
              {rt && <span className="xs muted">{routineMinutes(rt)} min</span>}
            </div>
          );
        })}
      </div>
      {drag?.active && (
        <div style={{ position: "fixed", left: drag.x, top: drag.y, transform: "translate(-50%, -60%)", pointerEvents: "none", zIndex: 90 }}>
          <Pill id={drag.id} style={{ boxShadow: "0 8px 24px rgba(0,0,0,.5)" }} />
        </div>
      )}
    </div>
  );
}
