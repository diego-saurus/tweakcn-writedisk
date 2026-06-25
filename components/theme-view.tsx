"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useEditorStore } from "@/store/editor-store";
import type { Theme } from "@/types/theme";
import { Edit, Moon, Share2, Sun } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeButton } from "./editor/action-bar/components/code-button";
import { CodePanelDialog } from "./editor/code-panel-dialog";
import ThemePreviewPanel from "./editor/theme-preview-panel";
import { DialogActionsProvider } from "@/hooks/use-dialog-actions";

interface ThemeViewProps {
  theme: Theme;
}

export default function ThemeView({ theme }: ThemeViewProps) {
  const { themeState, setThemeState, saveThemeCheckpoint, restoreThemeCheckpoint } =
    useEditorStore();
  const router = useRouter();
  const currentMode = themeState.currentMode;
  const [codePanelOpen, setCodePanelOpen] = useState(false);

  useEffect(() => {
    saveThemeCheckpoint();
    setThemeState({
      ...themeState,
      styles: theme.styles,
    });
    return () => {
      restoreThemeCheckpoint();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, saveThemeCheckpoint, setThemeState, restoreThemeCheckpoint]);

  if (!theme) {
    notFound();
  }

  const toggleTheme = () => {
    setThemeState({
      ...themeState,
      currentMode: currentMode === "light" ? "dark" : "light",
    });
  };

  const handleOpenInEditor = () => {
    setThemeState({
      ...themeState,
      styles: theme.styles,
    });
    saveThemeCheckpoint();
    router.push("/editor/theme");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/themes/${theme.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Theme URL copied to clipboard!",
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-bold">{theme.name}</h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {currentMode === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            <CodeButton
              variant="outline"
              size="default"
              onClick={() => setCodePanelOpen(true)}
            />
            <Button variant="outline" size="default" onClick={handleShare}>
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" size="default" onClick={handleOpenInEditor}>
              <Edit className="size-4" />
              Open in Editor
            </Button>
          </div>
        </div>
      </div>

      <DialogActionsProvider>
        <div className="-m-4 mt-6 flex h-[min(80svh,900px)] flex-col">
          <ThemePreviewPanel
            styles={theme.styles}
            currentMode={currentMode}
            themeId={theme.id}
            themeName={theme.name}
          />
        </div>

        <CodePanelDialog
          open={codePanelOpen}
          onOpenChange={setCodePanelOpen}
          themeEditorState={themeState}
          themeId={theme.id}
        />
      </DialogActionsProvider>
    </>
  );
}