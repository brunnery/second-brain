import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, LogOut, LogIn } from "lucide-react";
import { useSyncStatus, syncNow, signIn, signOut, syncConfigured, currentEmail } from "../../lib/sync.js";
import { go } from "../../app/router.js";
import { Field } from "../../components/ui.jsx";

const STATE = {
  ok: ["Synced", "var(--good)"], syncing: ["Syncing…", "var(--food)"], offline: ["Offline", "var(--muted)"],
  error: ["Sync error", "var(--bad)"], signedout: ["Not signed in", "var(--faint)"], off: ["Local only", "var(--faint)"],
};

export function SyncBadge() {
  const s = useSyncStatus();
  const [label, color] = STATE[s.state] || STATE.off;
  return (
    <button className="btn sm ghost" onClick={() => go("more/sync")} aria-label={`Sync status: ${label}`}>
      <span className="sync-dot" style={{ background: color }} />
      {s.state === "ok" || s.state === "syncing" ? <Cloud size={15} /> : <CloudOff size={15} />}
    </button>
  );
}

export default function SyncPanel() {
  const s = useSyncStatus();
  const [email, setEmail] = useState(currentEmail() || "");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [label, color] = STATE[s.state] || STATE.off;
  const signedIn = !!currentEmail();

  if (!syncConfigured()) return <div className="small muted">Cloud sync is not configured (see README).</div>;

  return (
    <div className="stack">
      <div className="card tight between">
        <span className="hstack small"><span className="sync-dot" style={{ background: color }} /> {label}</span>
        <span className="xs muted">{s.lastSync ? `last ${new Date(s.lastSync).toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" })}` : "never synced"}</span>
      </div>
      {s.error && <div className="xs bad">{s.error}</div>}
      {signedIn ? (
        <>
          <div className="small">Signed in as <b>{currentEmail()}</b>. Changes upload ~2.5 s after you make them; opening the app pulls the newest data.</div>
          <div className="grid2">
            <button className="btn" onClick={() => syncNow()} disabled={s.state === "syncing"}><RefreshCw size={16} /> Sync now</button>
            <button className="btn ghost" onClick={signOut}><LogOut size={16} /> Sign out</button>
          </div>
        </>
      ) : (
        <>
          <div className="small muted">Sign in with the same account on iPhone, iPad and laptop to keep them in sync. Data stays on this device until then.</div>
          <Field label="Email"><input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          {err && <div className="xs bad">{err}</div>}
          <button className="btn primary" disabled={!email || !pw || busy} onClick={async () => {
            setBusy(true); setErr(null);
            try { await signIn(email.trim(), pw); setPw(""); } catch (e) { setErr(e.message); }
            setBusy(false);
          }}><LogIn size={16} /> {busy ? "Signing in…" : "Sign in"}</button>
          <div className="xs faint">Account is created in Supabase (Authentication → Users). On first sign-in the cloud copy is replaced by whichever side is newer.</div>
        </>
      )}
    </div>
  );
}
