"use client";

import { del, get, set } from "idb-keyval";

const HANDLE_KEY = "tweakcn-disk-handle";
const PREFS_KEY = "tweakcn-disk-prefs";

export type DiskPrefs = {
  autoWrite: boolean;
};

const DEFAULT_PREFS: DiskPrefs = { autoWrite: false };

export const isFileSystemAccessSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return typeof window.showSaveFilePicker === "function";
};

export async function saveHandle(handle: FileSystemFileHandle): Promise<void> {
  await set(HANDLE_KEY, handle);
}

export async function getHandle(): Promise<FileSystemFileHandle | null> {
  const handle = (await get(HANDLE_KEY)) as FileSystemFileHandle | undefined;
  return handle ?? null;
}

export async function clearHandle(): Promise<void> {
  await del(HANDLE_KEY);
}

export async function savePrefs(prefs: Partial<DiskPrefs>): Promise<void> {
  const current = await getPrefs();
  await set(PREFS_KEY, { ...current, ...prefs });
}

export async function getPrefs(): Promise<DiskPrefs> {
  const stored = (await get(PREFS_KEY)) as DiskPrefs | undefined;
  return { ...DEFAULT_PREFS, ...(stored ?? {}) };
}

export async function verifyPermission(
  handle: FileSystemFileHandle,
  mode: "read" | "readwrite" = "readwrite"
): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const opts = { mode };
  try {
    if ((await handle.queryPermission(opts)) === "granted") return true;
    return (await handle.requestPermission(opts)) === "granted";
  } catch {
    return false;
  }
}

export async function pickFile(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const handle = await window.showSaveFilePicker!({
      suggestedName: "globals.css",
      types: [
        {
          description: "CSS file",
          accept: { "text/css": [".css"] },
        },
      ],
    });
    return handle;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
}

export async function writeToHandle(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}