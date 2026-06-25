"use client";

import { Theme } from "@/types/theme";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  Zap,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useDeleteTheme } from "@/hooks/themes";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { ThemePreview } from "@/components/theme-preview";

interface ThemeCardProps {
  theme: Theme;
  className?: string;
}

export function ThemeCard({
  theme,
  className,
}: ThemeCardProps) {
  const { themeState, setThemeState } = useEditorStore();
  const deleteThemeMutation = useDeleteTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const mode = themeState.currentMode;

  const handleConfirmDelete = () => {
    deleteThemeMutation.mutate(theme.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  const handleQuickApply = () => {
    setThemeState({
      ...themeState,
      styles: theme.styles,
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/themes/${theme.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Theme URL copied to clipboard!",
    });
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        <ThemePreview
          styles={theme.styles[mode]}
          name={theme.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="bg-background flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div>
            <h3 className={cn("text-foreground text-sm font-medium")}>
              {theme.name}
            </h3>
            <p className="text-muted-foreground text-xs">
              {new Date(theme.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="hover:bg-accent rounded-md p-2">
              <MoreVertical className="text-muted-foreground h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover w-48">
            <DropdownMenuItem onClick={handleQuickApply} className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Apply
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <Link href={`/themes/${theme.id}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open Theme
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <Link href={`/editor/theme/${theme.id}`}>
                <Edit className="h-4 w-4" />
                Edit Theme
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive gap-2"
              disabled={deleteThemeMutation.isPending}
            >
              {deleteThemeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Theme
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete your {theme.name} theme?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              theme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteThemeMutation.isPending}
            >
              {deleteThemeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}