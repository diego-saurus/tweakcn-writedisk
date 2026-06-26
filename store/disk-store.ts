"use client";

import { create } from "zustand";
import {
  getHandle,
  getPrefs,
  isFileSystemAccessSupported,
  saveHandle as persistHandle,
  savePrefs as persistPrefs,
  clearHandle as clearPersistedHandle,
} from "@/lib/disk-store";

export type DiskWriteStatus = "idle" | "writing" | "success" | "error";

interface DiskState {
  status: DiskWriteStatus;
  lastWriteAt: number | null;
  lastError: string | null;
  handle: FileSystemFileHandle | null;
  handleFileName: string | null;
  autoWrite: boolean;
  hydrated: boolean;
  supported: boolean;

  hydrate: () => Promise<void>;
  setHandle: (handle: FileSystemFileHandle | null) => Promise<void>;
  clearHandle: () => Promise<void>;
  setAutoWrite: (next: boolean) => Promise<void>;
  setStatus: (status: DiskWriteStatus, error?: string | null) => void;
  markWriting: () => void;
  markSuccess: () => void;
  markError: (msg: string) => void;
}

export const useDiskStore = create<DiskState>((set, get) => ({
  status: "idle",
  lastWriteAt: null,
  lastError: null,
  handle: null,
  handleFileName: null,
  autoWrite: false,
  hydrated: false,
  supported: isFileSystemAccessSupported(),

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [handle, prefs] = await Promise.all([getHandle(), getPrefs()]);
      let handleFileName: string | null = null;
      if (handle) {
        try {
          handleFileName = handle.name;
        } catch {
          handleFileName = null;
        }
      }
      set({
        handle: handle ?? null,
        handleFileName,
        autoWrite: prefs.autoWrite,
        hydrated: true,
      });
    } catch (err) {
      set({
        hydrated: true,
        lastError: err instanceof Error ? err.message : "Failed to load disk binding",
      });
    }
  },

  setHandle: async (handle) => {
    if (handle) {
      await persistHandle(handle);
      set({
        handle,
        handleFileName: handle.name,
        lastError: null,
      });
    } else {
      await clearPersistedHandle();
      set({
        handle: null,
        handleFileName: null,
        lastError: null,
      });
    }
  },

  clearHandle: async () => {
    await clearPersistedHandle();
    set({
      handle: null,
      handleFileName: null,
      lastError: null,
      status: "idle",
    });
  },

  setAutoWrite: async (next) => {
    await persistPrefs({ autoWrite: next });
    set({ autoWrite: next });
  },

  setStatus: (status, error = null) => set({ status, lastError: error }),

  markWriting: () => set({ status: "writing", lastError: null }),
  markSuccess: () => set({ status: "success", lastWriteAt: Date.now(), lastError: null }),
  markError: (msg) => set({ status: "error", lastError: msg }),
}));