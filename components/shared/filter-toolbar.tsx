import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal toolbar wrapper for search + select filters. Visually lighter
 * than a full Card — just a single-row panel with consistent gaps.
 */
export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}
