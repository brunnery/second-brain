/* Hand-rolled SVG charts: thin marks, recessive grid, tap/hover tooltips.
   All charts are responsive (viewBox) and single-axis. */
import { useState } from "react";

const W = 340;
const PAD = { l: 34, r: 8, t: 10, b: 22 };

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || step0;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return ticks;
}

const fmtTick = (v) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${+v.toFixed(1)}`);

function Tooltip({ x, y, lines, h }) {
  const left = Math.min(Math.max(x, 60), W - 60);
  return (
    <g pointerEvents="none">
      <line x1={x} x2={x} y1={PAD.t} y2={h - PAD.b} stroke="var(--line-strong)" strokeWidth="1" />
      <foreignObject x={left - 60} y={Math.max(0, y - 52)} width="120" height="48">
        <div style={{ background: "var(--text)", color: "var(--on-accent)", borderRadius: 8, padding: "4px 8px", fontSize: 11, lineHeight: 1.35, textAlign: "center", fontWeight: 600 }}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </foreignObject>
    </g>
  );
}

/**
 * LineChart
 * series: [{ name, color, values: number|null[] , dashed? }]
 * labels: string[] (x axis)
 */
export function LineChart({ series, labels, height = 160, format = (v) => fmtTick(v), yMin }) {
  const [hover, setHover] = useState(null);
  const all = series.flatMap((s) => s.values).filter((v) => v != null);
  if (!all.length) return <div className="empty">No data yet.</div>;
  const ticks = niceTicks(yMin ?? Math.min(...all), Math.max(...all));
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const n = labels.length;
  const x = (i) => PAD.l + (n <= 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (n - 1));
  const y = (v) => height - PAD.b - ((v - lo) / (hi - lo || 1)) * (height - PAD.t - PAD.b);
  const labelEvery = Math.ceil(n / 6);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={series.map((s) => s.name).join(", ")}
        onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill="var(--faint)">{fmtTick(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => i % labelEvery === 0 && (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--faint)">{l}</text>
        ))}
        {series.map((s) => {
          let d = "";
          s.values.forEach((v, i) => { if (v != null) d += `${d && s.values[i - 1] != null ? "L" : "M"}${x(i)},${y(v)}`; });
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "4 4" : undefined} />
              {s.dots !== false && s.values.map((v, i) => v != null && (
                <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : n > 30 ? 0 : 2.5} fill={s.color} stroke="var(--surface)" strokeWidth="1.5" />
              ))}
            </g>
          );
        })}
        {hover != null && (
          <Tooltip x={x(hover)} h={height}
            y={Math.min(...series.map((s) => (s.values[hover] != null ? y(s.values[hover]) : height)))}
            lines={[labels[hover], ...series.filter((s) => s.values[hover] != null).map((s) => `${series.length > 1 ? `${s.name}: ` : ""}${format(s.values[hover])}`)]} />
        )}
      </svg>
      {series.length > 1 && <Legend items={series} />}
    </div>
  );
}

/**
 * BarChart (optionally stacked)
 * stacks: [{ name, color }] ; data: [{ label, values: number[] }]
 */
export function BarChart({ data, stacks, height = 160, format = (v) => fmtTick(v), target }) {
  const [hover, setHover] = useState(null);
  const totals = data.map((d) => d.values.reduce((a, b) => a + (b || 0), 0));
  const max = Math.max(...totals, target || 0, 1);
  const ticks = niceTicks(0, max);
  const hi = ticks[ticks.length - 1];
  const n = data.length;
  const slot = (W - PAD.l - PAD.r) / n;
  const bw = Math.max(4, Math.min(28, slot * 0.62));
  const y = (v) => height - PAD.b - (v / hi) * (height - PAD.t - PAD.b);
  const labelEvery = Math.ceil(n / 8);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="bar chart" onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill="var(--faint)">{fmtTick(t)}</text>
          </g>
        ))}
        {target != null && <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="var(--muted)" strokeDasharray="3 4" strokeWidth="1.5" />}
        {data.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          let acc = 0;
          const segs = d.values.map((v, si) => {
            const y0 = y(acc), y1 = y(acc + (v || 0));
            acc += v || 0;
            return { y0, y1, color: stacks[si].color, last: false, v };
          }).filter((s) => s.v > 0);
          if (segs.length) segs[segs.length - 1].last = true;
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
              <rect x={cx - slot / 2} y={PAD.t} width={slot} height={height - PAD.t - PAD.b} fill="transparent" />
              {segs.map((s, si) => {
                const h = Math.max(0, s.y0 - s.y1 - (s.last ? 0 : 2));
                const r = s.last ? Math.min(4, bw / 2, h) : 0;
                return (
                  <path key={si} fill={s.color} opacity={hover == null || hover === i ? 1 : 0.55}
                    d={`M${cx - bw / 2},${s.y0} V${s.y0 - h + r} Q${cx - bw / 2},${s.y0 - h} ${cx - bw / 2 + r},${s.y0 - h} H${cx + bw / 2 - r} Q${cx + bw / 2},${s.y0 - h} ${cx + bw / 2},${s.y0 - h + r} V${s.y0} Z`} />
                );
              })}
              {i % labelEvery === 0 && <text x={cx} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--faint)">{d.label}</text>}
            </g>
          );
        })}
        {hover != null && (
          <Tooltip x={PAD.l + slot * hover + slot / 2} h={height} y={y(totals[hover])}
            lines={[data[hover].label, stacks.length > 1
              ? stacks.map((s, si) => data[hover].values[si] ? `${s.name} ${format(data[hover].values[si])}` : null).filter(Boolean).slice(0, 2).join(" · ") || "–"
              : format(totals[hover])]} />
        )}
      </svg>
      {stacks.length > 1 && <Legend items={stacks} />}
    </div>
  );
}

/** Donut — parts: [{ name, value, color }] */
export function Donut({ parts, size = 132, stroke = 16, center }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  const gap = parts.length > 1 ? 2 : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label="share chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
        {total > 0 && parts.map((p) => {
          const len = (p.value / total) * c;
          const el = (
            <circle key={p.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-off}>
              <title>{p.name}</title>
            </circle>
          );
          off += len;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="hstack wrap" style={{ gap: "6px 14px", marginTop: 6 }}>
      {items.map((s) => (
        <span key={s.name} className="xs muted hstack" style={{ gap: 6 }}>
          <span style={{ width: 10, height: s.dashed ? 2 : 10, borderRadius: 3, background: s.color }} />{s.name}
        </span>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = "var(--accent)", width = 80, height = 26 }) {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return null;
  const lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((val, i) => `${(i / (v.length - 1)) * width},${height - 3 - ((val - lo) / (hi - lo || 1)) * (height - 6)}`);
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
