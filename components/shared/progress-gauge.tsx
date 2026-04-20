import * as React from "react";
import { cn } from "@/lib/utils";

type Seuil = "vert" | "orange" | "rouge";

interface ProgressGaugeProps {
  /** Ratio 0-1+ (peut dépasser 1 en cas de dépassement de provision) */
  value: number;
  /** Seuils en pourcentage [orangeMin, rougeMin]. Défaut [60, 85]. */
  thresholds?: [number, number];
  variant?: "compact" | "full";
  /** Masque le label pourcentage en mode compact. Défaut false. */
  hidePercentage?: boolean;
  className?: string;
}

export function computeSeuil(
  valuePct: number,
  thresholds: [number, number] = [60, 85]
): Seuil {
  if (valuePct < thresholds[0]) return "vert";
  if (valuePct < thresholds[1]) return "orange";
  return "rouge";
}

const SEUIL_STYLES: Record<
  Seuil,
  { bar: string; track: string; text: string; ring: string }
> = {
  vert: {
    bar: "bg-status-success-fg",
    track: "bg-status-success/60",
    text: "text-status-success-fg",
    ring: "ring-status-success-fg/20",
  },
  orange: {
    bar: "bg-status-warning-fg",
    track: "bg-status-warning/60",
    text: "text-status-warning-fg",
    ring: "ring-status-warning-fg/20",
  },
  rouge: {
    bar: "bg-status-danger-fg",
    track: "bg-status-danger/60",
    text: "text-status-danger-fg",
    ring: "ring-status-danger-fg/20",
  },
};

/**
 * Barre de progression multi-seuils utilisée pour le ratio
 * provisions / temps passé valorisé (Pilier 2 LegalPay).
 *
 * Seuils par défaut : vert < 60% / orange 60-85% / rouge ≥ 85%
 * Référence : art. 6.2 RIN — dépassement sans accord écrit = blocage diligences.
 */
export function ProgressGauge({
  value,
  thresholds = [60, 85],
  variant = "full",
  hidePercentage = false,
  className,
}: ProgressGaugeProps) {
  const pct = Math.max(0, value * 100);
  const displayPct = Math.min(100, pct);
  const overflow = pct > 100 ? Math.min(pct - 100, 50) : 0;
  const seuil = computeSeuil(pct, thresholds);
  const styles = SEUIL_STYLES[seuil];

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 min-w-[120px]", className)}>
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "relative h-1.5 flex-1 overflow-hidden rounded-full",
            styles.track
          )}
        >
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${displayPct}%` }}
          />
          {overflow > 0 && (
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 animate-pulse bg-status-danger-fg/60"
              style={{ width: `${overflow}%` }}
            />
          )}
        </div>
        {!hidePercentage && (
          <span
            className={cn(
              "shrink-0 text-xs font-medium tabular-nums",
              styles.text
            )}
          >
            {Math.round(pct)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative h-2.5 overflow-hidden rounded-full ring-1 ring-inset",
          styles.track,
          styles.ring
        )}
      >
        {/* Thresholds markers */}
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-text-default/10"
          style={{ left: `${thresholds[0]}%` }}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-text-default/20"
          style={{ left: `${thresholds[1]}%` }}
        />
        <div
          className={cn("h-full transition-all", styles.bar)}
          style={{ width: `${displayPct}%` }}
        />
        {overflow > 0 && (
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 bg-status-danger-fg/70"
            style={{ width: `${overflow}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-subtle">
          <span className="text-status-success-fg">●</span>{" "}
          {`< ${thresholds[0]}%`}
          <span className="mx-2 text-status-warning-fg">●</span>
          {`${thresholds[0]}–${thresholds[1]}%`}
          <span className="mx-2 text-status-danger-fg">●</span>
          {`> ${thresholds[1]}%`}
        </span>
        <span className={cn("font-medium tabular-nums", styles.text)}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
