/* Local-date helpers. All stored dates are local ISO strings "YYYY-MM-DD".
   Weeks start on Monday (index 0 = Monday). */
const pad = (n) => String(n).padStart(2, "0");

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const today = () => toISO(new Date());
export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const dayIdx = (iso) => (fromISO(iso).getDay() + 6) % 7; // Mon = 0
export const weekStart = (iso) => addDays(iso, -dayIdx(iso));
export const weekDays = (iso) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(iso), i));
export const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
export const monthKey = (iso) => iso.slice(0, 7);
export const shiftMonth = (mk, delta) => {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const daysInMonth = (mk) => {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
export const isoWeek = (iso) => {
  const d = fromISO(iso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const fmtDay = (iso) =>
  fromISO(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const fmtShort = (iso) =>
  fromISO(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const fmtMonth = (mk) => {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
export const relDay = (iso) => {
  const n = daysBetween(today(), iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return fmtDay(iso);
};
