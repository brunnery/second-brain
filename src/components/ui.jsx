/* Shared UI primitives. Styling lives in styles/base.css. */
import { useEffect, useState, useSyncExternalStore } from "react";
import { X, Check as CheckIcon } from "lucide-react";

export function PageHead({ eyebrow, title, right }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="title">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function Seg({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? "on" : ""} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Chips({ value, onChange, options, multi = false, scroll = false }) {
  const isOn = (k) => (multi ? value.includes(k) : value === k);
  const toggle = (k) => {
    if (!multi) return onChange(k);
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  };
  return (
    <div className={`chips ${scroll ? "scroll" : ""}`}>
      {options.map(([k, label]) => (
        <button key={k} type="button" className={`chip ${isOn(k) ? "on" : ""}`} aria-pressed={isOn(k)} onClick={() => toggle(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ title, onClose, children, area }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${area ? `area-${area}` : ""}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sheet-head">
          <h2 className="h2">{title}</h2>
          <button className="iconbtn sm" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="xs faint">{hint}</div>}
    </div>
  );
}

export function Check({ on, onClick, label }) {
  return (
    <button type="button" className={`check ${on ? "on" : ""}`} aria-pressed={on} aria-label={label} onClick={onClick}>
      {on && <CheckIcon size={16} strokeWidth={3} />}
    </button>
  );
}

export function Toggle({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} />;
}

export function Bar({ value, max, color, thin }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className={`bar ${thin ? "thin" : ""}`}><span style={{ width: `${p}%`, background: color }} /></div>;
}

export function Stat({ value, label, className = "" }) {
  return <div className={`stat ${className}`}><span className="v">{value}</span><span className="l">{label}</span></div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Note({ icon: Icon, color, children }) {
  return (
    <div className="note" style={color ? { "--n": color } : undefined}>
      {Icon && <Icon size={17} style={{ color: color || "var(--accent)", flexShrink: 0, marginTop: 1 }} />}
      <div>{children}</div>
    </div>
  );
}

/** Ring progress (single value). */
export function Ring({ value, max, size = 92, stroke = 9, color = "var(--accent)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .4s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{children}</div>
    </div>
  );
}

/* ---------- global toast with optional undo ---------- */
let toastState = null;
const toastSubs = new Set();
const emitToast = () => toastSubs.forEach((f) => f());
let toastTimer = null;
export function toast(message, undo) {
  toastState = { message, undo, id: Date.now() };
  emitToast();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastState = null; emitToast(); }, 4500);
}
export function ToastHost() {
  const t = useSyncExternalStore((f) => { toastSubs.add(f); return () => toastSubs.delete(f); }, () => toastState);
  if (!t) return null;
  return (
    <div className="toast" role="status">
      <span>{t.message}</span>
      {t.undo && <button onClick={() => { t.undo(); toastState = null; emitToast(); }}>Undo</button>}
    </div>
  );
}

/** Controlled number input that tolerates "," and empty values while typing. */
export function NumInput({ value, onChange, placeholder, className = "input", step = "any", ...rest }) {
  const [text, setText] = useState(value ?? "");
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    const typed = parseFloat(String(text).replace(",", "."));
    if (typed !== value) setText(value ?? "");
  }
  return (
    <input className={className} inputMode="decimal" type="text" placeholder={placeholder} value={text} step={step}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value.replace(",", "."));
        onChange(Number.isFinite(n) ? n : null);
      }} {...rest} />
  );
}
