import { useRef, useState } from "react";
import { Target, Scale, Cloud, Download, Upload, CalendarDays, Trash2, ChevronRight, Info, Copy, Clock } from "lucide-react";
import { PageHead, Field, toast } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import { useProfile } from "../profile/store.js";
import { GOALS, PHASES } from "../profile/goals.js";
import GoalsSheet from "../profile/GoalsSheet.jsx";
import BodyView from "../body/BodyView.jsx";
import SyncPanel from "./SyncPanel.jsx";
import { exportBackup, importBackup, downloadFile } from "../../lib/backup.js";
import { resetAll, getState } from "../../lib/storage.js";
import { buildIcs } from "../../lib/ics.js";
import { copyText } from "../../lib/device.js";
import { SUPABASE_URL } from "../../config.js";

function Row({ icon: Icon, title, sub, onClick }) {
  return (
    <button className="row" onClick={onClick}>
      <span className="icon-tile" style={{ "--tile": "var(--muted)" }}><Icon size={17} /></span>
      <div className="grow"><div style={{ fontWeight: 650 }}>{title}</div>{sub && <div className="meta">{sub}</div>}</div>
      <ChevronRight size={17} className="faint" />
    </button>
  );
}

function CalendarSection() {
  const [profile, setProfile] = useProfile();
  const [token, setToken] = useState("");
  const url = `${SUPABASE_URL}/functions/v1/calendar?token=${token || "YOUR_FEED_TOKEN"}`;
  return (
    <div className="stack">
      <div className="small muted">Your training days, cardio and evening routines for the next 8 weeks as calendar events — routines get a reminder at their time.</div>
      <Field label="Evening routine time"><input type="time" className="input" value={profile.routineTime} onChange={(e) => setProfile((p) => ({ ...p, routineTime: e.target.value }))} /></Field>
      <button className="btn primary" onClick={() => { downloadFile("second-brain.ics", buildIcs(getState("feed").events), "text/calendar"); toast("Calendar file downloaded — open it to import"); }}>
        <Download size={16} /> Download .ics (one-time import)
      </button>
      <div className="divider" />
      <div className="h3">Live subscription (auto-updates)</div>
      <div className="small muted">Needs the Supabase edge function from the README. Paste your FEED_TOKEN to build the link, then add it in Apple Calendar → Add subscription.</div>
      <input className="input" placeholder="FEED_TOKEN" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Feed token" />
      <div className="code">{url}</div>
      <button className="btn" onClick={async () => toast((await copyText(url)) ? "Link copied" : "Copy failed — select the text")}><Copy size={16} /> Copy link</button>
    </div>
  );
}

export default function MorePage({ route }) {
  const [profile] = useProfile();
  const [goals, setGoals] = useState(false);
  const fileRef = useRef(null);
  const sub = route[0];

  if (sub === "body") return <><PageHead eyebrow="More" title="Body" /><BodyView /></>;
  if (sub === "sync") return <><PageHead eyebrow="More" title="Sync" /><SyncPanel /></>;
  if (sub === "calendar") return <><PageHead eyebrow="More" title="Calendar" /><CalendarSection /></>;

  return (
    <div className="stack">
      <PageHead eyebrow="Settings" title="More" />
      <div className="card flush list">
        <Row icon={Target} title="Goals & setup" sub={`${GOALS[profile.goal].name} · ${PHASES[profile.phase].short} · ${profile.daysPerWeek} days`} onClick={() => setGoals(true)} />
        <Row icon={Scale} title="Body weight" sub="Weigh-ins, 7-day average, trend" onClick={() => go("more/body")} />
        <Row icon={Cloud} title="Cloud sync" sub="iPhone · iPad · laptop" onClick={() => go("more/sync")} />
        <Row icon={CalendarDays} title="Calendar" sub="Export or subscribe" onClick={() => go("more/calendar")} />
        <Row icon={Clock} title="Evening routines" sub="Schedule & programs" onClick={() => go("train/mobility")} />
      </div>

      <div className="card flush list">
        <Row icon={Download} title="Export backup" sub="All data as a JSON file" onClick={exportBackup} />
        <Row icon={Upload} title="Import backup" sub="Replaces current data" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !window.confirm("Replace all current data with this backup?")) return;
          const r = await importBackup(file);
          toast(r.ok ? `Backup restored (${r.found.length} sections)` : r.error);
        }} />
      </div>

      <button className="btn danger" onClick={() => {
        if (!window.confirm("Delete ALL data on this device (and in the cloud on next sync)?")) return;
        if (!window.confirm("Really? This cannot be undone. Export a backup first if unsure.")) return;
        resetAll();
        toast("All data reset");
        go("home");
      }}><Trash2 size={16} /> Reset all data</button>

      <div className="note xs"><Info size={14} /><span>Second Brain v2 · suggestions are rule-based (training science + nutrition guidelines), not medical advice. With back pain or new symptoms, check with a physio first.</span></div>
      {goals && <GoalsSheet onClose={() => setGoals(false)} />}
    </div>
  );
}
