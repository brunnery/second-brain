/* ================================================================
   STORAGE
   One in-memory store per feature key, mirrored to localStorage as
   "sb.<key>". Features register their key + default factory, then use
   `useStore(key)` → [state, update]. Every write bumps meta.updatedAt
   and notifies listeners (the sync engine listens for pushes).
   ================================================================ */
import { useSyncExternalStore, useCallback } from "react";

const PREFIX = "sb.";
const LEGACY_KEYS = ["tri-tracker-v1", "sb:session", "sb:updatedAt", "fin-v1", "goals-v1", "uni-v1"];

const defaults = new Map();   // key -> () => initial state
const cache = new Map();      // key -> current state
const listeners = new Map();  // key -> Set<fn>
const changeHooks = new Set();
const mem = new Map();        // fallback when localStorage is unavailable

const lsGet = (k) => {
  try {
    const raw = window.localStorage.getItem(PREFIX + k);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return mem.get(k);
  }
};
const lsSet = (k, v) => {
  try {
    window.localStorage.setItem(PREFIX + k, JSON.stringify(v));
  } catch {
    mem.set(k, v);
  }
};
const lsDel = (k) => {
  try { window.localStorage.removeItem(PREFIX + k); } catch { mem.delete(k); }
};

/** Register a synced feature store. */
export function registerStore(key, factory) {
  defaults.set(key, factory);
}
export const syncedKeys = () => [...defaults.keys()];

export function getState(key) {
  if (cache.has(key)) return cache.get(key);
  const stored = lsGet(key);
  const factory = defaults.get(key);
  const base = factory ? factory() : undefined;
  // shallow-merge so new fields added in later versions get their defaults
  const value = stored && base && typeof base === "object" && !Array.isArray(base)
    ? { ...base, ...stored }
    : stored ?? base;
  cache.set(key, value);
  return value;
}

export function setState(key, next, { silent = false } = {}) {
  const prev = getState(key);
  const value = typeof next === "function" ? next(prev) : next;
  if (value === prev) return;
  cache.set(key, value);
  lsSet(key, value);
  (listeners.get(key) || []).forEach((fn) => fn());
  if (!silent && defaults.has(key)) {
    setMeta({ updatedAt: new Date().toISOString() });
    changeHooks.forEach((fn) => fn(key));
  }
}

const subscribe = (key) => (fn) => {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
};

/** React hook: [state, update]. update accepts a value or (prev) => next. */
export function useStore(key) {
  const sub = useCallback((fn) => subscribe(key)(fn), [key]);
  const value = useSyncExternalStore(sub, () => getState(key));
  const update = useCallback((next) => setState(key, next), [key]);
  return [value, update];
}

/** Call fn(state) now and whenever the key changes (outside React). */
export function watch(key, fn) {
  fn(getState(key));
  return subscribe(key)(() => fn(getState(key)));
}

export const onAnyChange = (fn) => {
  changeHooks.add(fn);
  return () => changeHooks.delete(fn);
};

/* ---------- meta (not synced): sync timestamps, session ---------- */
export const getMeta = () => lsGet("meta") || {};
export const setMeta = (patch) => lsSet("meta", { ...getMeta(), ...patch });

/* ---------- bulk helpers for sync + backup ---------- */
export const collectAll = () =>
  Object.fromEntries(syncedKeys().map((k) => [k, getState(k)]));

export function replaceAll(data) {
  syncedKeys().forEach((k) => {
    if (data[k] === undefined) return;
    const base = defaults.get(k)();
    // merge with defaults so data from an older app version gets new fields
    const value = base && typeof base === "object" && !Array.isArray(base) && data[k] && typeof data[k] === "object"
      ? { ...base, ...data[k] } : data[k];
    setState(k, value, { silent: true });
  });
}

export function resetAll() {
  syncedKeys().forEach((k) => {
    lsDel(k);
    cache.delete(k);
    setState(k, defaults.get(k)(), { silent: true });
  });
  setMeta({ updatedAt: new Date().toISOString() });
  changeHooks.forEach((fn) => fn("*"));
}

export function clearLegacy() {
  try { LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k)); } catch { /* ignore */ }
}

/** Small local-only UI preferences (remembered tabs etc.) */
export function useLocal(key, initial) {
  const k = `ui.${key}`;
  const sub = useCallback((fn) => subscribe(k)(fn), [k]);
  const value = useSyncExternalStore(sub, () => {
    if (!cache.has(k)) cache.set(k, lsGet(k) ?? initial);
    return cache.get(k);
  });
  const update = useCallback((v) => setState(k, v, { silent: true }), [k]);
  return [value, update];
}
