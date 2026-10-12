import { CURRENCY } from "../config.js";

const nf = (min, max) => new Intl.NumberFormat("de-CH", { minimumFractionDigits: min, maximumFractionDigits: max });
const nf0 = nf(0, 0), nf1 = nf(0, 1), nf2 = nf(2, 2);

export const num = (n, digits = 0) => (digits === 0 ? nf0 : digits === 1 ? nf1 : nf2).format(Number(n) || 0);
export const money = (n) => `${CURRENCY} ${nf2.format(Number(n) || 0)}`;
export const moneyShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000) return `${CURRENCY} ${nf1.format(v / 1000)}k`;
  return `${CURRENCY} ${nf0.format(v)}`;
};
export const kg = (n) => `${nf1.format(Number(n) || 0)} kg`;
export const pct = (n) => `${Math.round(Number(n) || 0)}%`;

export const duration = (min) => {
  const m = Math.round(Number(min) || 0);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
};
export const clock = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
/* pace in min per km (or per 500 m for rowing) given seconds and metres */
export const pace = (seconds, metres, per = 1000) => {
  if (!seconds || !metres) return "–";
  return clock((seconds / metres) * per);
};
export const parseNum = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
