/* Scan a nutrition table with the camera → check the numbers → log / save.
   The photo is only held in memory while you compare, then dropped. */
import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Plus, AlertTriangle, Loader } from "lucide-react";
import { useNutrition } from "./store.js";
import { parseLabel, labelWarning, labelMacros } from "./engine/label.js";
import { readLabelText } from "./ocr.js";
import { Field, NumInput, Chips, Toggle, Bar, Note, toast } from "../../components/ui.jsx";
import { uid } from "../../lib/uid.js";
import { num } from "../../lib/format.js";

/** Camera button + OCR state. `onResult(parsed)` gets the numbers read from the photo. */
export function useLabelScan(onResult) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow the same photo again, and drop the reference
    if (!file) return;
    setError(null); setBusy(true); setProgress(0);
    setPreview(URL.createObjectURL(file));
    try {
      const text = await readLabelText(file, setProgress);
      const r = parseLabel(text);
      if (!r.found.length) setError("No nutrition values recognised. Try again closer, straight on and without glare — or type them in.");
      onResult(r);
    } catch {
      setError("Couldn't read the photo (the first scan needs internet once). You can type the values in.");
      onResult(null);
    } finally {
      setBusy(false);
    }
  };

  const input = <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />;
  const clear = () => { setPreview(null); setError(null); };
  return { open: () => ref.current?.click(), input, busy, progress, preview, error, clear };
}

export function ScanStatus({ scan }) {
  return (
    <>
      {scan.busy && (
        <div className="stack-sm">
          <div className="hstack small muted" style={{ gap: 6 }}><Loader size={14} className="spin" /> Reading the label… {Math.round(scan.progress * 100)} %</div>
          <Bar value={scan.progress} max={1} color="var(--food)" thin />
        </div>
      )}
      {scan.preview && (
        <img src={scan.preview} alt="Your label photo (not saved)" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 12, background: "var(--raised)" }} />
      )}
      {scan.error && <Note icon={AlertTriangle} color="var(--warn)">{scan.error}</Note>}
    </>
  );
}

const EMPTY = { kcal: null, p: null, c: null, f: null };

/** Full flow inside "Add food": photo → check values → amount → log (and save as own food). */
export function LabelScan({ onLog }) {
  const [, setN] = useNutrition();
  const [v, setV] = useState(null);
  const [basis, setBasis] = useState("100");
  const [portionG, setPortionG] = useState(null);
  const [grams, setGrams] = useState(100);
  const [name, setName] = useState("");
  const [save, setSave] = useState(true);
  const scan = useLabelScan((r) => {
    setV(r ? { kcal: r.kcal, p: r.p, c: r.c, f: r.f } : { ...EMPTY });
    setBasis(r?.basis === "portion" ? "portion" : "100");
    setPortionG(r?.portionG || null);
    setGrams(r?.portionG || 100);
  });

  if (!v) {
    return (
      <div className="stack">
        {scan.input}
        <ScanStatus scan={scan} />
        {!scan.busy && (
          <>
            <button className="btn primary block" onClick={scan.open}><Camera size={18} /> Photo of the nutrition table</button>
            <div className="xs faint">Hold the phone straight above the table, fill the frame, avoid glare. The photo stays on your phone and is discarded after you check the numbers.</div>
          </>
        )}
      </div>
    );
  }

  const set = (k) => (x) => setV({ ...v, [k]: x });
  const per = basis === "100" ? 100 : portionG || 0;
  const warning = labelWarning(v);
  const m = labelMacros(v, grams, per);
  const ok = v.kcal != null && grams > 0 && per > 0;

  const done = () => {
    const k = 100 / (per || 100);
    const r1 = (x) => Math.round((x || 0) * k * 10) / 10;
    const label = name.trim() || "Scanned food";
    let foodId;
    if (save) {
      foodId = `custom-${uid()}`;
      const food = { id: foodId, name: label, cat: "ready", per100: { kcal: Math.round((v.kcal || 0) * k), p: r1(v.p), c: r1(v.c), f: r1(v.f), fib: 0 }, portion: { g: grams, label: "1 portion" }, cost: 2, custom: true, scanned: true };
      setN((x) => ({ ...x, customFoods: [...x.customFoods, food] }));
    }
    onLog({ name: label, ...(foodId ? { foodId } : {}), grams, ...m });
    scan.clear();
    toast(`${label} added · ${num(m.kcal)} kcal${save ? " · saved to my foods" : ""}`);
  };

  return (
    <div className="stack">
      {scan.input}
      <ScanStatus scan={scan} />
      <div className="xs muted">Check the numbers against the photo and correct anything that's off.</div>
      <Chips value={basis} onChange={setBasis} options={[["100", "Values per 100 g"], ["portion", "Values per portion"]]} />
      {basis === "portion" && <Field label="Portion size (g / ml)"><NumInput value={portionG} onChange={setPortionG} placeholder="from the label" /></Field>}
      <div className="grid2">
        <Field label="kcal"><NumInput value={v.kcal} onChange={set("kcal")} /></Field>
        <Field label="Protein g"><NumInput value={v.p} onChange={set("p")} /></Field>
        <Field label="Carbs g"><NumInput value={v.c} onChange={set("c")} /></Field>
        <Field label="Fat g"><NumInput value={v.f} onChange={set("f")} /></Field>
      </div>
      {warning && <Note icon={AlertTriangle} color="var(--warn)">{warning}</Note>}
      <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. M-Budget muesli" /></Field>
      <Field label="How much did you eat? (g / ml)"><NumInput className="input big-num" value={grams} onChange={setGrams} /></Field>
      <div className="small"><b>{num(m.kcal)} kcal</b> <span className="muted">· P {num(m.p)} · C {num(m.c)} · F {num(m.f)}</span></div>
      <div className="between small"><span>Save to my foods <span className="xs faint">(no scan needed next time)</span></span><Toggle on={save} onChange={setSave} label="Save to my foods" /></div>
      <div className="hstack">
        <button className="btn ghost" onClick={() => { setV(null); scan.clear(); }}><RotateCcw size={16} /> Retake</button>
        <button className="btn primary grow" disabled={!ok} onClick={done}><Plus size={16} /> Add</button>
      </div>
    </div>
  );
}
