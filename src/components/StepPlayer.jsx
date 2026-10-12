/* Full-screen guided timer used by evening routines and cardio intervals.
   Countdown ring, current + next step, pause / back / skip, 3-2-1 beeps,
   auto-advance and screen wake lock. */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, SkipBack, X, Check } from "lucide-react";
import { beep, vibrate, keepAwake, unlockAudio } from "../lib/device.js";
import { clock } from "../lib/format.js";

const EFFORT_COLOR = { easy: "var(--good)", moderate: "var(--food)", hard: "var(--cardio)", max: "var(--bad)", rest: "var(--muted)" };

export default function StepPlayer({ title, steps, color = "var(--accent)", onDone, onClose }) {
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(steps[0]?.sec || 0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => { keepAwake(true); return () => { keepAwake(false); }; }, []);

  const leftRef = useRef(left);
  useEffect(() => { leftRef.current = left; }, [left]);

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + leftRef.current * 1000;
    const t = setInterval(() => {
      const remain = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      if (remain !== lastRef.current && remain <= 3 && remain > 0) beep(660, 120);
      lastRef.current = remain;
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(t);
        beep(990, 260);
        vibrate([120, 60, 120]);
        if (i + 1 < steps.length) { setI(i + 1); setLeft(steps[i + 1].sec); }
        else { setRunning(false); setFinished(true); }
      }
    }, 250);
    return () => clearInterval(t);
  }, [running, i, steps]);

  const jump = (n) => {
    const k = Math.max(0, Math.min(steps.length - 1, n));
    setI(k); setLeft(steps[k].sec);
  };
  const toggle = () => { unlockAudio(); setRunning((r) => !r); };

  const cur = steps[i];
  const next = steps[i + 1];
  const size = 236, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = cur?.sec ? left / cur.sec : 0;
  const ringColor = cur?.effort ? EFFORT_COLOR[cur.effort] : color;
  const totalLeft = left + steps.slice(i + 1).reduce((a, s) => a + s.sec, 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "var(--bg)", overflowY: "auto" }}>
      <div className="app" style={{ paddingBottom: 40 }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div>
            <div className="eyebrow">{title}</div>
            <div className="small muted">Step {i + 1} of {steps.length} · {clock(totalLeft)} left</div>
          </div>
          <button className="iconbtn" aria-label="Close player" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="bar thin" style={{ marginBottom: 16 }}><span style={{ width: `${((i + (1 - p)) / steps.length) * 100}%`, background: color }} /></div>

        {finished ? (
          <div className="stack center" style={{ paddingTop: 40 }}>
            <div style={{ width: 96, height: 96, borderRadius: 30, margin: "0 auto", display: "grid", placeItems: "center", background: color, color: "var(--on-accent)" }}>
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="title">Done!</h2>
            <p className="muted">Nice work. It has been saved for today.</p>
            <button className="btn primary block" style={{ background: color }} onClick={() => { onDone?.(); onClose(); }}>Save & close</button>
          </div>
        ) : (
          <div className="stack">
            {cur?.img && <div className="illus" style={{ maxHeight: 230 }}><img src={cur.img} alt={cur.label} style={{ maxHeight: 230, objectFit: "contain", margin: "0 auto" }} /></div>}
            <div className="center">
              <div className="h2" style={{ fontSize: 22 }}>{cur?.label}</div>
              {cur?.desc && <p className="small muted" style={{ margin: "6px auto 0", maxWidth: 420 }}>{cur.desc}</p>}
            </div>
            <div style={{ position: "relative", width: size, height: size, margin: "4px auto" }}>
              <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
                  strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .25s linear" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div className="center">
                  <div className="big" style={{ fontSize: 56 }}>{clock(left)}</div>
                  {cur?.effort && <div className="badge" style={{ "--b": ringColor, marginTop: 6 }}>{cur.effort.toUpperCase()}</div>}
                </div>
              </div>
            </div>
            <div className="hstack" style={{ justifyContent: "center", gap: 16 }}>
              <button className="iconbtn" aria-label="Previous step" onClick={() => jump(i - 1)}><SkipBack size={20} /></button>
              <button className="btn primary" style={{ width: 120, height: 60, borderRadius: 20, background: color }} onClick={toggle} aria-label={running ? "Pause" : "Start"}>
                {running ? <Pause size={26} /> : <Play size={26} />}
              </button>
              <button className="iconbtn" aria-label="Next step" onClick={() => (i + 1 < steps.length ? jump(i + 1) : setFinished(true))}><SkipForward size={20} /></button>
            </div>
            {next && <div className="card tight small"><span className="muted">Next: </span><b>{next.label}</b> <span className="muted">· {clock(next.sec)}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}
