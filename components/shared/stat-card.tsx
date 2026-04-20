import * as React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trend {
  value: string;
  direction: "up" | "down" | "flat";
  label?: string;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: Trend;
  hint?: string;
  className?: string;
}

const TREND_STYLES: Record<Trend["direction"], string> = {
  up: "text-status-success-fg",
  down: "text-status-danger-fg",
  flat: "text-text-muted",
};

const TREND_ICONS: Record<Trend["direction"], React.ComponentType<{ className?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/**
 * KPI tile with large display number, optional trend indicator and hint.
 * Intentionally flat (no colored top-border) to avoid the template KPI look.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5 transition-colors hover:border-border-default",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
          {label}
        </span>
        {Icon && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-muted">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-[1.875rem] leading-none tracking-tight text-text-strong tabular-nums">
          {value}
        </span>
        {(trend || hint) && (
          <div className="flex items-center gap-2 text-xs">
            {trend && TrendIcon && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium tabular-nums",
                  TREND_STYLES[trend.direction]
                )}
              >
                <TrendIcon className="size-3" />
                {trend.value}
              </span>
            )}
            {hint && <span className="text-text-subtle">{hint}</span>}
            {trend?.label && !hint && (
              <span className="text-text-subtle">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
