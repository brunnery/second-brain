/* ================================================================
   CLOUD SYNC — Supabase (plain fetch, no SDK)
   One row per user in `app_state` holding all synced stores as JSON.
   localStorage stays the source of truth; the cloud is a mirror.
   ================================================================ */
import { useSyncExternalStore } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCHEMA_VERSION } from "../config.js";
import { collectAll, replaceAll, getMeta, setMeta, onAnyChange } from "./storage.js";

export const syncConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/* ---------- status store for the UI ---------- */
let status = { state: syncConfigured() ? "signedout" : "off", lastSync: getMeta().lastSync || null, error: null };
const subs = new Set();
const setStatus = (patch) => { status = { ...status, ...patch }; subs.forEach((f) => f()); };
export const useSyncStatus = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => status);

/* ---------- pure decision (unit-tested) ---------- */
export function decideSync(localTs, remoteTs) {
  const l = localTs ? Date.parse(localTs) : 0;
  const r = remoteTs ? Date.parse(remoteTs) : 0;
  if (!r && !l) return "none";
  if (r > l) return "pull";
  if (l > r) return "push";
  return "insync";
}

/* ---------- auth ---------- */
const session = () => getMeta().session || null;
const headers = (token) => ({
  apikey: SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function authRequest(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error_description || json.msg || json.message || "Sign-in failed");
  return json;
}

const storeSession = (j) =>
  setMeta({
    session: {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: Date.now() + (j.expires_in || 3600) * 1000,
      email: j.user?.email,
      user_id: j.user?.id,
    },
  });

/** preferRemote: a fresh device takes the cloud copy even if it has local edits (e.g. from onboarding). */
export async function signIn(email, password, { preferRemote = false } = {}) {
  const j = await authRequest("token?grant_type=password", { email, password });
  storeSession(j);
  setStatus({ state: "syncing", error: null });
  await syncNow({ preferRemote });
}

export function signOut() {
  setMeta({ session: null });
  setStatus({ state: "signedout" });
}

async function validToken() {
  const s = session();
  if (!s) return null;
  if (Date.now() < s.expires_at - 60_000) return s.access_token;
  const j = await authRequest("token?grant_type=refresh_token", { refresh_token: s.refresh_token });
  storeSession(j);
  return j.access_token;
}

/* ---------- data ---------- */
async function fetchRemote(token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?select=data,updated_at`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Pull failed (${res.status})`);
  const rows = await res.json();
  return rows[0] || null;
}

async function pushRemote(token) {
  const s = session();
  const updated_at = getMeta().updatedAt || new Date().toISOString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?on_conflict=user_id`, {
    method: "POST",
    headers: { ...headers(token), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: s.user_id, data: collectAll(), schema_version: SCHEMA_VERSION, updated_at }),
  });
  if (!res.ok) throw new Error(`Push failed (${res.status})`);
}

let running = null;
export async function syncNow({ preferRemote = false } = {}) {
  if (!syncConfigured() || !session()) return "skip";
  if (running) return running;
  running = (async () => {
    setStatus({ state: "syncing" });
    try {
      const token = await validToken();
      const remote = await fetchRemote(token);
      const decision = preferRemote && remote ? "pull" : decideSync(getMeta().updatedAt, remote?.updated_at);
      if (decision === "pull") {
        replaceAll(remote.data || {});
        setMeta({ updatedAt: remote.updated_at });
      } else if (decision === "push" || (decision === "none" && !remote)) {
        await pushRemote(token);
      }
      const lastSync = new Date().toISOString();
      setMeta({ lastSync });
      setStatus({ state: "ok", lastSync, error: null });
      return decision;
    } catch (e) {
      setStatus({ state: navigator.onLine ? "error" : "offline", error: e.message });
      return "error";
    } finally {
      running = null;
    }
  })();
  return running;
}

/* ---------- wiring: debounce pushes, pull on focus/online ---------- */
let timer = null;
export function startSync() {
  if (!syncConfigured()) return;
  if (session()) syncNow();
  onAnyChange(() => {
    if (!session()) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, 2500);
  });
  window.addEventListener("online", () => syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncNow();
  });
}

export const currentEmail = () => session()?.email || null;
