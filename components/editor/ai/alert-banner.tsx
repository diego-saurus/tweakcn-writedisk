"use client";

import { cn } from "@/lib/utils";

export function AlertBanner() {
  return null;
}

export function BannerWrapper({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <div className={cn("@container/alert-banner")}>
      <div
        className={cn(
          "relative w-full origin-bottom transition-all duration-300 ease-in-out",
          show
            ? "pointer-events-auto max-h-6 @2xl/alert-banner:max-h-7.5"
            : "pointer-events-none max-h-0 translate-y-full"
        )}
        style={{
          willChange: "transform, max-height",
        }}
      >
        <div className="bg-muted text-muted-foreground flex h-6 items-center rounded-t-lg px-3 text-xs @2xl/alert-banner:h-7.5">
          {children}
        </div>

        <div className="bg-muted h-4 w-full"></div>
      </div>
    </div>
  );
}