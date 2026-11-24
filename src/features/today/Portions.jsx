/* Meal-prep cheat sheet (More → Portions). Reference only, no logging. */
import { PORTIONS } from "./portions.js";

export default function Portions({ phase }) {
  const col = (k) => ({ fontWeight: phase === k ? 800 : 500, color: phase === k ? "var(--food)" : "var(--muted)" });
  return (
    <div className="card tight area-food">
      <div className="stack-sm">
          <table style={{ width: "100%", borderCollapse: "collapse" }} className="small">
            <thead><tr className="xs muted"><th style={{ textAlign: "left", padding: "4px 0" }}></th><th style={{ textAlign: "right", ...col("bulk") }}>Bulk</th><th style={{ textAlign: "right", ...col("cut") }}>Cut</th></tr></thead>
            <tbody>
              {PORTIONS.rows.map((r) => (
                <tr key={r.name} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "7px 0" }}><b>{r.name}</b> <span className="xs faint">{r.note}</span></td>
                  <td style={{ textAlign: "right", ...col("bulk") }}>{r.bulk} g</td>
                  <td style={{ textAlign: "right", ...col("cut") }}>{r.cut} g</td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "7px 0" }}><b>Shake</b></td>
                <td style={{ textAlign: "right", ...col("bulk") }} className="xs">{PORTIONS.shake.bulk}</td>
                <td style={{ textAlign: "right", ...col("cut") }} className="xs">{PORTIONS.shake.cut}</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "7px 0" }}><b>Day</b></td>
                <td style={{ textAlign: "right", ...col("bulk") }} className="xs">{PORTIONS.targets.bulk}</td>
                <td style={{ textAlign: "right", ...col("cut") }} className="xs">{PORTIONS.targets.cut}</td>
              </tr>
            </tbody>
          </table>
          <div className="xs muted"><b>Breakfast:</b> {PORTIONS.breakfast}</div>
          <div className="xs faint">{PORTIONS.tip}</div>
      </div>
    </div>
  );
}
