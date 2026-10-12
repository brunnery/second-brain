// Supabase Edge Function "calendar" — serves the app's calendar snapshot as a live .ics feed.
// The app stores the next 8 weeks of training / cardio / evening routines in data.feed.events,
// so this function only formats; all planning logic stays in the app.
//
// Deploy: Dashboard → Edge Functions → Deploy new function → "Via editor" → name: calendar → paste → Deploy.
// Then: turn OFF "Verify JWT" for this function, and add the secret FEED_TOKEN (long random string).
// Feed URL: https://<project>.supabase.co/functions/v1/calendar?token=<FEED_TOKEN>

type Ev = { uid: string; date: string; title: string; start?: string; minutes?: number; desc?: string; alarm?: boolean };

const TZ = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Zurich",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];
const esc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
const enc = new TextEncoder();
function fold(line: string) {
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "", len = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (len + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
const p = (n: number) => String(n).padStart(2, "0");
const ymd = (iso: string) => iso.replace(/-/g, "");
function plusMin(iso: string, t: string, min: number) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCHours(h, m + min, 0, 0);
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`;
}
function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
}

function buildIcs(events: Ev[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Second Brain//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Second Brain", "X-WR-TIMEZONE:Europe/Zurich", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", ...TZ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@second-brain`, `DTSTAMP:${stamp}`);
    if (e.start) lines.push(`DTSTART;TZID=Europe/Zurich:${ymd(e.date)}T${e.start.replace(":", "")}00`, `DTEND;TZID=Europe/Zurich:${plusMin(e.date, e.start, e.minutes || 30)}`);
    else lines.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${nextDay(e.date)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.desc) lines.push(`DESCRIPTION:${esc(e.desc)}`);
    if (e.alarm) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "TRIGGER:PT0M", "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== Deno.env.get("FEED_TOKEN")) return new Response("Not found", { status: 404 });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // single-user project: read the one app_state row (service role bypasses RLS)
  const res = await fetch(`${url}/rest/v1/app_state?select=data&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) return new Response("Upstream error", { status: 502 });
  const rows = await res.json();
  const events: Ev[] = rows[0]?.data?.feed?.events || [];
  return new Response(buildIcs(events), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "max-age=900" },
  });
});
