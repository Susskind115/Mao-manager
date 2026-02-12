export type BackupSchemaV1 = {
  schemaVersion: 1;
  exportedAt: string; // ISO
  app: {
    name: string;
    note: string;
  };
  data: Record<string, unknown>;
};

const STORAGE_KEYS = [
  "tm_tasks_v1",
  "tm_rewards_v1",
  "tm_completions_v1",
  "tm_redemptions_v1",
  "tm_bounties_v1",
  "tm_bounty_completions_v1",
  "tm_levels_v1",
] as const;

function safeParse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Keep raw string if parsing fails
    return raw;
  }
}

export function createBackupObject(): BackupSchemaV1 {
  const data: Record<string, unknown> = {};
  for (const k of STORAGE_KEYS) {
    data[k] = safeParse(localStorage.getItem(k));
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: {
      name: "Time Manager (Local)",
      note: "LocalStorage backup export. Keep this file somewhere safe (cloud drive / USB).",
    },
    data,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Export: Download JSON backup. Pure front-end; no server.
 */
export function downloadBackup() {
  const obj = createBackupObject();
  const jsonText = JSON.stringify(obj, null, 2);

  const d = new Date();
  // Windows-safe filename (no colon)
  const fileName = `time-manager-backup-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(
    d.getHours()
  )}${pad2(d.getMinutes())}${pad2(d.getSeconds())}.json`;

  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Import: validate + overwrite LocalStorage keys.
 */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function validateBackupV1(obj: unknown): asserts obj is BackupSchemaV1 {
  if (!isObject(obj)) throw new Error("Invalid backup: not an object.");
  if (obj.schemaVersion !== 1) throw new Error("Invalid backup: unsupported schemaVersion.");
  if (!isObject(obj.data)) throw new Error("Invalid backup: missing data.");
  const hasAnyKey = STORAGE_KEYS.some((k) => k in obj.data);
  if (!hasAnyKey) throw new Error("Invalid backup: no recognized keys found.");
}

function applyBackupData(data: Record<string, unknown>) {
  for (const k of STORAGE_KEYS) {
    if (!(k in data) || data[k] === undefined || data[k] === null) {
      localStorage.removeItem(k);
      continue;
    }
    const v = data[k];
    // Our app stores JSON strings for these keys.
    // Restore by stringifying objects. If raw string, store as-is.
    if (typeof v === "string") localStorage.setItem(k, v);
    else localStorage.setItem(k, JSON.stringify(v));
  }
}

/**
 * Import: Read JSON file and restore (OVERWRITE). Returns meta for UI.
 */
export async function importBackupFromFile(file: File): Promise<{ exportedAt: string }> {
  const text = await file.text();
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  validateBackupV1(obj);
  applyBackupData(obj.data);
  return { exportedAt: obj.exportedAt };
}
