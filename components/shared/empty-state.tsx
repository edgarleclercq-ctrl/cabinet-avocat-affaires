import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-default bg-surface-muted/40 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex size-10 items-center justify-center rounded-full bg-surface text-text-muted ring-1 ring-border-subtle">
          <Icon className="size-5" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-heading text-base text-text-strong">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
