"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDiskWrite } from "@/hooks/use-disk-write";
import { isFileSystemAccessSupported } from "@/lib/disk-store";
import { cn } from "@/lib/utils";
import { useDiskStore } from "@/store/disk-store";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Info,
  Loader2,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function StatusDot({ status }: { status: "idle" | "writing" | "success" | "error" }) {
  const color =
    status === "success"
      ? "bg-emerald-500"
      : status === "writing"
        ? "bg-amber-400 animate-pulse"
        : status === "error"
          ? "bg-destructive"
          : "bg-muted-foreground/40";
  return <span className={cn("inline-block size-2 rounded-full", color)} />;
}

export function DiskSettings() {
  const hydrate = useDiskStore((s) => s.hydrate);
  const handle = useDiskStore((s) => s.handle);
  const handleFileName = useDiskStore((s) => s.handleFileName);
  const autoWrite = useDiskStore((s) => s.autoWrite);
  const setAutoWrite = useDiskStore((s) => s.setAutoWrite);
  const clearHandle = useDiskStore((s) => s.clearHandle);
  const status = useDiskStore((s) => s.status);
  const lastError = useDiskStore((s) => s.lastError);
  const lastWriteAt = useDiskStore((s) => s.lastWriteAt);
  const hydrated = useDiskStore((s) => s.hydrated);
  const { write, chooseFile } = useDiskWrite();
  const { toast } = useToast();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const supported = isFileSystemAccessSupported();

  const handlePick = async () => {
    const ok = await chooseFile();
    if (ok) {
      toast({
        title: "File bound",
        description: "Disk sync will write to this file.",
      });
    }
  };

  const handleForget = async () => {
    await clearHandle();
    toast({
      title: "Binding removed",
      description: "No file will be written until you pick one again.",
    });
  };

  const handleTest = async () => {
    try {
      await write();
      toast({
        title: "Saved",
        description: handleFileName ?? "Wrote CSS to disk.",
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const lastWriteLabel = lastWriteAt
    ? new Date(lastWriteAt).toLocaleString()
    : "Never";

  return (
    <div className="space-y-6">
      {!supported ? (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertTitle>Browser not supported</AlertTitle>
          <AlertDescription>
            Your browser does not support the File System Access API. Use the{" "}
            <Link
              href="/editor/theme"
              className="underline underline-offset-2"
            >
              Code panel
            </Link>{" "}
            to copy CSS manually.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="size-4" /> Current binding
              </CardTitle>
              <CardDescription>
                Pick a CSS file on disk. The editor will write generated theme
                CSS to it on every change.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <StatusDot status={status} />
              {status === "writing"
                ? "Writing"
                : status === "success"
                  ? "Synced"
                  : status === "error"
                    ? "Error"
                    : hasBoundHandle(handle)
                      ? "Idle"
                      : "Unbound"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="font-mono wrap-break-word">
              {handleFileName ?? "No file selected"}
            </span>
            {handle ? (
              <span className="text-muted-foreground text-xs">
                Last write: {lastWriteLabel}
              </span>
            ) : null}
          </div>
          {status === "error" && lastError ? (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertTitle>Last write failed</AlertTitle>
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={handlePick} disabled={!supported}>
            <FolderOpen className="size-4" />
            {handle ? "Change file" : "Pick file"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!supported || !handle || status === "writing"}
          >
            {status === "writing" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SettingsIcon className="size-4" />
            )}
            Save now
          </Button>
          <Button
            variant="ghost"
            onClick={handleForget}
            disabled={!handle}
            className="text-muted-foreground"
          >
            <Trash2 className="size-4" /> Forget binding
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-4" /> Auto-write
          </CardTitle>
          <CardDescription>
            When enabled, the editor writes to the bound file on every change
            (debounced 500ms). Disable for full manual control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Auto-write on changes</p>
              <p className="text-muted-foreground text-xs">
                {!handle
                  ? "Pick a file first to enable."
                  : "Writes 500ms after the last edit."}
              </p>
            </div>
            <Switch
              checked={autoWrite && !!handle}
              disabled={!handle}
              onCheckedChange={(checked) => {
                void setAutoWrite(!!checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4" /> How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            The editor holds a live handle to the file you pick. Every theme
            change regenerates CSS using your current color format and Tailwind
            version preferences, then overwrites the file.
          </p>
          <p>
            The handle is stored in your browser&apos;s IndexedDB — it does not
            persist across browsers or after clearing site data.
          </p>
          <p className="flex items-center gap-1.5">
            <CircleCheck className="size-3.5 text-emerald-500" />
            Files are overwritten in place; no upload, no download.
          </p>
          <p>
            You can also drive disk sync from the editor via the{" "}
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              Disk
            </span>{" "}
            button in the action bar.
          </p>
          <p className="flex items-center gap-1.5">
            <ExternalLink className="size-3.5" />
            <Link
              href="https://developer.mozilla.org/docs/Web/API/Window/showSaveFilePicker"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              File System Access API
            </Link>{" "}
            (Chromium-based browsers).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function hasBoundHandle(handle: FileSystemFileHandle | null) {
  return !!handle;
}