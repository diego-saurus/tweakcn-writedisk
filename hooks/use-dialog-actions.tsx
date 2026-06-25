import { CodePanelDialog } from "@/components/editor/code-panel-dialog";
import CssImportDialog from "@/components/editor/css-import-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ThemeSaveDialog } from "@/components/editor/theme-save-dialog";
import { toast } from "@/components/ui/use-toast";
import { useCreateTheme, useUpdateTheme } from "@/hooks/themes";
import { useAIThemeGenerationCore } from "@/hooks/use-ai-theme-generation-core";
import { useEditorStore } from "@/store/editor-store";
import { useThemePresetStore } from "@/store/theme-preset-store";
import { parseCssInput } from "@/utils/parse-css-input";
import { usePostHog } from "posthog-js/react";
import { createContext, ReactNode, useContext, useState } from "react";

type PendingAction = "share" | "v0" | null;

function getSaveDialogCopy(pendingAction: PendingAction) {
  switch (pendingAction) {
    case "share":
      return {
        title: "Save to share",
        description: "Save your theme first to share it with others.",
        ctaLabel: "Save & Share",
      };
    case "v0":
      return {
        title: "Save to open in v0",
        description: "Save your theme first to open it in v0.",
        ctaLabel: "Save & Open in v0",
      };
    default:
      return {};
  }
}

interface DialogActionsContextType {
  cssImportOpen: boolean;
  codePanelOpen: boolean;
  saveDialogOpen: boolean;
  shareDialogOpen: boolean;
  shareUrl: string;
  dialogKey: number;
  isCreatingTheme: boolean;
  isUpdatingTheme: boolean;
  isGeneratingTheme: boolean;
  pendingAction: PendingAction;
  existingThemeName: string | undefined;

  setCssImportOpen: (open: boolean) => void;
  setCodePanelOpen: (open: boolean) => void;
  setSaveDialogOpen: (open: boolean) => void;
  setShareDialogOpen: (open: boolean) => void;

  handleCssImport: (css: string) => void;
  handleSaveClick: (options?: { shareAfterSave?: boolean; openInV0AfterSave?: boolean }) => void;
  handleShareClick: (id?: string) => Promise<void>;
  handleOpenInV0: (id?: string, name?: string) => void;
  saveTheme: (themeName: string) => Promise<void>;
  handleUpdateExisting: () => Promise<void>;
}

function useDialogActionsStore(): DialogActionsContextType {
  const [cssImportOpen, setCssImportOpen] = useState(false);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [dialogKey, _setDialogKey] = useState(0);

  const { themeState, setThemeState, applyThemePreset, hasThemeChangedFromCheckpoint, hasUnsavedChanges } =
    useEditorStore();
  const { getPreset } = useThemePresetStore();
  const createThemeMutation = useCreateTheme();
  const updateThemeMutation = useUpdateTheme();
  const { isGeneratingTheme } = useAIThemeGenerationCore();
  const posthog = usePostHog();

  const currentPreset = themeState?.preset ? getPreset(themeState.preset) : undefined;
  const isOnSavedPreset = !!currentPreset && currentPreset.source === "SAVED" && hasUnsavedChanges();
  const existingThemeName = isOnSavedPreset ? currentPreset.label : undefined;

  const handleCssImport = (css: string) => {
    const { lightColors, darkColors } = parseCssInput(css);
    const styles = {
      ...themeState.styles,
      light: { ...themeState.styles.light, ...lightColors },
      dark: { ...themeState.styles.dark, ...darkColors },
    };

    setThemeState({
      ...themeState,
      styles,
    });

    toast({
      title: "CSS imported",
      description: "Your custom CSS has been imported successfully",
    });
  };

  const handleSaveClick = (options?: { shareAfterSave?: boolean; openInV0AfterSave?: boolean }) => {
    setSaveDialogOpen(true);
    if (options?.shareAfterSave) {
      setPendingAction("share");
    }
    if (options?.openInV0AfterSave) {
      setPendingAction("v0");
    }
  };

  const saveTheme = async (themeName: string) => {
    const themeData = {
      name: themeName,
      styles: themeState.styles,
    };

    try {
      const theme = await createThemeMutation.mutateAsync(themeData);
      posthog.capture("CREATE_THEME", {
        theme_id: theme?.id,
        theme_name: theme?.name,
      });
      if (!theme) return;
      applyThemePreset(theme?.id || themeState.preset || "default");
      if (pendingAction === "share") {
        handleShareClick(theme?.id);
        setPendingAction(null);
      } else if (pendingAction === "v0") {
        openInV0(theme?.id);
        setPendingAction(null);
      }
      setTimeout(() => {
        setSaveDialogOpen(false);
      }, 50);
    } catch (error) {
      console.error("Save operation failed (error likely handled by hook):", error);
    }
  };

  const handleShareClick = async (id?: string) => {
    if (hasThemeChangedFromCheckpoint()) {
      handleSaveClick({ shareAfterSave: true });
      return;
    }

    const presetId = id ?? themeState.preset;
    const currentPreset = presetId ? getPreset(presetId) : undefined;

    if (!currentPreset) {
      setShareUrl(`${window.location.origin}/editor/theme`);
      setShareDialogOpen(true);
      return;
    }

    const isSavedPreset = !!currentPreset && currentPreset.source === "SAVED";

    posthog.capture("SHARE_THEME", {
      theme_id: id,
      theme_name: currentPreset?.label,
      is_saved: isSavedPreset,
    });

    const url = isSavedPreset
      ? `${window.location.origin}/themes/${id}`
      : `${window.location.origin}/editor/theme?theme=${id}`;

    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const openInV0 = (id?: string, name?: string) => {
    const presetId = id ?? themeState.preset;
    if (!presetId) return;

    const currentPreset = getPreset(presetId);
    const isSavedPreset = id ? true : !!currentPreset && currentPreset.source === "SAVED";
    const themeName = name || currentPreset?.label || presetId;

    posthog.capture("OPEN_IN_V0", {
      theme_id: presetId,
      theme_name: themeName,
      is_saved: isSavedPreset,
    });

    const themeUrl = isSavedPreset
      ? `${window.location.origin}/r/v0/${presetId}`
      : `${window.location.origin}/r/v0/${presetId}.json`;
    const title = `"${themeName}" from tweakcn`.slice(0, 32);
    const v0Url = `https://v0.dev/chat/api/open?url=${encodeURIComponent(themeUrl)}&title=${encodeURIComponent(title)}`;
    window.open(v0Url, "_blank", "noopener,noreferrer");
  };

  const handleOpenInV0 = (id?: string, name?: string) => {
    if (id) {
      openInV0(id, name);
      return;
    }

    if (hasThemeChangedFromCheckpoint()) {
      handleSaveClick({ openInV0AfterSave: true });
      return;
    }

    openInV0();
  };

  const handleUpdateExisting = async () => {
    if (!themeState.preset) return;
    try {
      const result = await updateThemeMutation.mutateAsync({
        id: themeState.preset,
        styles: themeState.styles,
      });
      if (result) {
        applyThemePreset(result.id || themeState.preset);
        setSaveDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  const value = {
    cssImportOpen,
    codePanelOpen,
    saveDialogOpen,
    shareDialogOpen,
    shareUrl,
    dialogKey,
    isCreatingTheme: createThemeMutation.isPending,
    isUpdatingTheme: updateThemeMutation.isPending,
    isGeneratingTheme,
    pendingAction,
    existingThemeName,

    setCssImportOpen,
    setCodePanelOpen,
    setSaveDialogOpen,
    setShareDialogOpen,

    handleCssImport,
    handleSaveClick,
    handleShareClick,
    handleOpenInV0,
    saveTheme,
    handleUpdateExisting,
  };

  return value;
}

export const DialogActionsContext = createContext<DialogActionsContextType | null>(null);

export function DialogActionsProvider({ children }: { children: ReactNode }) {
  const { themeState } = useEditorStore();
  const store = useDialogActionsStore();

  return (
    <DialogActionsContext value={store}>
      {children}

      <CssImportDialog
        open={store.cssImportOpen}
        onOpenChange={store.setCssImportOpen}
        onImport={store.handleCssImport}
      />
      <CodePanelDialog
        open={store.codePanelOpen}
        onOpenChange={store.setCodePanelOpen}
        themeEditorState={themeState}
      />
      <ThemeSaveDialog
        open={store.saveDialogOpen}
        onOpenChange={store.setSaveDialogOpen}
        onSave={store.saveTheme}
        isSaving={store.isCreatingTheme}
        existingThemeName={store.existingThemeName}
        onUpdateExisting={store.handleUpdateExisting}
        isUpdating={store.isUpdatingTheme}
        {...getSaveDialogCopy(store.pendingAction)}
      />
      <ShareDialog
        open={store.shareDialogOpen}
        onOpenChange={store.setShareDialogOpen}
        url={store.shareUrl}
      />
    </DialogActionsContext>
  );
}

export function useDialogActions(): DialogActionsContextType {
  const context = useContext(DialogActionsContext);

  if (!context) {
    throw new Error("useDialogActions must be used within a DialogActionsProvider");
  }

  return context;
}