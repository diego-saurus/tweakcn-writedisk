"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useDiskWrite } from "@/hooks/use-disk-write";
import { cn } from "@/lib/utils";
import { useDiskStore } from "@/store/disk-store";
import { CircleAlert, FolderOpen, HardDrive, Loader2, Save } from "lucide-react";

interface DiskButtonProps extends React.ComponentProps<typeof Button> {}

export function DiskButton({ className, ...props }: DiskButtonProps) {
  const { write, chooseFile, isSupported, hasHandle } = useDiskWrite();
  const status = useDiskStore((s) => s.status);
  const autoWrite = useDiskStore((s) => s.autoWrite);
  const setAutoWrite = useDiskStore((s) => s.setAutoWrite);
  const handleFileName = useDiskStore((s) => s.handleFileName);
  const lastError = useDiskStore((s) => s.lastError);
  const { toast } = useToast();

  if (!isSupported) return null;

  const statusColor =
    status === "success"
      ? "bg-emerald-500"
      : status === "writing"
        ? "bg-amber-400 animate-pulse"
        : status === "error"
          ? "bg-destructive"
          : hasHandle
            ? "bg-muted-foreground/50"
            : "bg-muted-foreground/30";

  const handleSaveNow = async () => {
    if (!hasHandle) {
      const picked = await chooseFile();
      if (picked) {
        toast({
          title: "Saved",
          description: `Wrote CSS to ${handleFileName ?? "file"}.`,
        });
      }
      return;
    }
    try {
      await write();
      toast({
        title: "Saved",
        description: `Wrote CSS to ${handleFileName ?? "file"}.`,
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description:
          err instanceof Error ? err.message : lastError ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleChangeFile = async () => {
    const ok = await chooseFile();
    if (!ok) return;
    toast({
      title: "File bound",
      description: "Now writing to the new file on every change.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative", className)}
          {...props}
        >
          <span className="relative">
            <HardDrive className="size-3.5" />
            <span
              aria-hidden
              className={cn(
                "absolute -top-0.5 -right-0.5 size-1.5 rounded-full ring-1 ring-background",
                statusColor
              )}
            />
          </span>
          <span className="hidden text-sm md:block">Disk</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 text-foreground">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>Disk sync</span>
          {handleFileName ? (
            <span className="text-muted-foreground text-xs font-normal">
              {handleFileName}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs font-normal">
              No file selected
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleSaveNow();
          }}
          disabled={status === "writing"}
        >
          {status === "writing" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>{hasHandle ? "Save to disk now" : "Pick file & save"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleChangeFile();
          }}
          disabled={status === "writing"}
        >
          <FolderOpen className="size-4" />
          <span>{hasHandle ? "Change file…" : "Pick file…"}</span>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={autoWrite}
          onCheckedChange={(checked) => {
            void setAutoWrite(!!checked);
          }}
          disabled={!hasHandle}
        >
          Auto-write on changes
        </DropdownMenuCheckboxItem>
        {status === "error" && lastError ? (
          <>
            <DropdownMenuSeparator />
            <div className="text-destructive flex items-start gap-2 px-2 py-1.5 text-xs">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span className="wrap-break-word">{lastError}</span>
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}