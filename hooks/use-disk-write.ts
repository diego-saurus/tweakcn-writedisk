"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  isFileSystemAccessSupported,
  pickFile,
  verifyPermission,
  writeToHandle,
} from "@/lib/disk-store";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useEditorStore } from "@/store/editor-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { useDiskStore } from "@/store/disk-store";
import { generateThemeCode } from "@/utils/theme-style-generator";

const AUTO_WRITE_DEBOUNCE_MS = 500;

function describeError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotFoundError") {
      return "File no longer exists. Pick a new one.";
    }
    if (err.name === "NotAllowedError") {
      return "Permission denied. Re-pick the file to grant access.";
    }
    if (err.name === "AbortError") return "Cancelled.";
    return err.message || err.name;
  }
  if (err instanceof Error) return err.message;
  return "Unknown write error";
}

export function useDiskWrite() {
  const hydrate = useDiskStore((s) => s.hydrate);
  const handle = useDiskStore((s) => s.handle);
  const autoWrite = useDiskStore((s) => s.autoWrite);
  const supported = useDiskStore((s) => s.supported);
  const hydrated = useDiskStore((s) => s.hydrated);

  const markWriting = useDiskStore((s) => s.markWriting);
  const markSuccess = useDiskStore((s) => s.markSuccess);
  const markError = useDiskStore((s) => s.markError);
  const setHandle = useDiskStore((s) => s.setHandle);

  const themeState = useEditorStore((s) => s.themeState);

  const lastSignature = useRef<string | null>(null);
  const writeInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const performWrite = useCallback(
    async (mode: "manual" | "auto"): Promise<void> => {
      const current = useDiskStore.getState();
      const h = current.handle;
      if (!h) {
        if (mode === "manual") {
          markError("No file selected. Use the menu to pick one.");
        }
        return;
      }
      if (!(await verifyPermission(h, "readwrite"))) {
        markError("Permission denied. Re-pick the file to grant access.");
        return;
      }

      const themeState = useEditorStore.getState().themeState;
      const { colorFormat, tailwindVersion } = usePreferencesStore.getState();
      const css = generateThemeCode(themeState, colorFormat, tailwindVersion);
      const signature = css.length + ":" + css.slice(0, 64);
      if (mode === "auto" && signature === lastSignature.current) return;
      lastSignature.current = signature;

      markWriting();
      try {
        await writeToHandle(h, css);
        markSuccess();
      } catch (err) {
        markError(describeError(err));
        throw err;
      }
    },
    [markWriting, markSuccess, markError]
  );

  const write = useCallback(async (): Promise<void> => {
    if (writeInFlight.current) return writeInFlight.current;
    const p = performWrite("manual").finally(() => {
      writeInFlight.current = null;
    });
    writeInFlight.current = p;
    return p;
  }, [performWrite]);

  const debouncedAutoWrite = useDebouncedCallback(() => {
    void performWrite("auto").catch(() => {});
  }, AUTO_WRITE_DEBOUNCE_MS);

  useEffect(() => {
    if (!hydrated || !handle || !autoWrite) return;
    if (!themeState?.styles?.light || !themeState?.styles?.dark) return;
    debouncedAutoWrite();
  }, [
    hydrated,
    handle,
    autoWrite,
    debouncedAutoWrite,
    themeState,
  ]);

  const chooseFile = useCallback(async (): Promise<boolean> => {
    if (!isFileSystemAccessSupported()) {
      markError("Your browser does not support writing files directly. Use the Code panel.");
      return false;
    }
    try {
      const picked = await pickFile();
      if (!picked) return false;
      await setHandle(picked);
      const themeState = useEditorStore.getState().themeState;
      const { colorFormat, tailwindVersion } = usePreferencesStore.getState();
      const css = generateThemeCode(themeState, colorFormat, tailwindVersion);
      markWriting();
      try {
        await writeToHandle(picked, css);
        markSuccess();
        lastSignature.current = css.length + ":" + css.slice(0, 64);
      } catch (err) {
        markError(describeError(err));
      }
      return true;
    } catch (err) {
      markError(describeError(err));
      return false;
    }
  }, [setHandle, markWriting, markSuccess, markError]);

  return {
    write,
    chooseFile,
    isSupported: supported,
    hasHandle: !!handle,
    autoWrite,
  };
}