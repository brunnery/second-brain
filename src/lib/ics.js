/* iCalendar (.ics) builder — CRLF line endings, 75-octet folding,
   Europe/Zurich VTIMEZONE, stable UIDs. Same format as the Supabase
   calendar feed (supabase/functions/calendar/index.ts). */

const TZ = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Zurich",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

const esc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (len + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const ymd = (iso) => iso.replace(/-/g, "");
const hm = (t) => t.replace(":", "") + "00";
const addMin = (iso, t, min) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date(`${iso}T00:00:00`);
  d.setHours(h, m + min, 0, 0);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
};

/** events: [{ uid, date, title, start?, minutes?, desc?, alarm? }] */
export function buildIcs(events, name = "Second Brain") {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Second Brain//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Europe/Zurich", ...TZ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@second-brain`, `DTSTAMP:${stamp}`);
    if (e.start) {
      lines.push(`DTSTART;TZID=Europe/Zurich:${ymd(e.date)}T${hm(e.start)}`, `DTEND;TZID=Europe/Zurich:${addMin(e.date, e.start, e.minutes || 30)}`);
    } else {
      const next = new Date(`${e.date}T00:00:00`);
      next.setDate(next.getDate() + 1);
      const p = (n) => String(n).padStart(2, "0");
      lines.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.desc) lines.push(`DESCRIPTION:${esc(e.desc)}`);
    if (e.alarm) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "TRIGGER:PT0M", "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
