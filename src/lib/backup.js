import { collectAll, replaceAll, syncedKeys, setMeta } from "./storage.js";
import { SCHEMA_VERSION } from "../config.js";
import { today } from "./dates.js";

export function downloadFile(name, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackup() {
  const payload = { app: "second-brain", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: collectAll() };
  downloadFile(`second-brain-${today()}.json`, JSON.stringify(payload, null, 2));
}

/** Validate a parsed backup. Returns { ok, data, error }. Pure — unit-tested. */
export function validateBackup(json, keys = syncedKeys()) {
  if (!json || typeof json !== "object") return { ok: false, error: "Not a JSON object." };
  if (json.app !== "second-brain") return { ok: false, error: "This file is not a Second Brain backup." };
  if ((json.schemaVersion || 0) > SCHEMA_VERSION) return { ok: false, error: "Backup is from a newer app version." };
  const data = json.data || {};
  const found = keys.filter((k) => data[k] && typeof data[k] === "object");
  if (!found.length) return { ok: false, error: "Backup contains no data." };
  return { ok: true, data, found };
}

export async function importBackup(file) {
  const text = await file.text();
  let json;
  try { json = JSON.parse(text); } catch { return { ok: false, error: "File is not valid JSON." }; }
  const v = validateBackup(json);
  if (!v.ok) return v;
  replaceAll(v.data);
  setMeta({ updatedAt: new Date().toISOString() });
  return v;
}
