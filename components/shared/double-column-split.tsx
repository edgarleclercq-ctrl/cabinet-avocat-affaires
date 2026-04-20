import * as React from "react";
import { cn } from "@/lib/utils";

interface DoubleColumnSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
  leftAccent?: "neutral" | "gold";
  rightAccent?: "neutral" | "gold";
  className?: string;
}

/**
 * Layout à deux colonnes visuellement séparées. Usage critique :
 * distinction Compte pro / CARPA sur le dashboard — les fonds CARPA
 * ne doivent jamais être visuellement confondus avec la trésorerie
 * disponible du cabinet (art. P.75.1, P.75.2 RIBP).
 */
export function DoubleColumnSplit({
  left,
  right,
  leftLabel,
  rightLabel,
  leftAccent = "neutral",
  rightAccent = "gold",
  className,
}: DoubleColumnSplitProps) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-lg border border-border-subtle bg-surface md:grid-cols-2",
        className
      )}
    >
      <section
        className={cn(
          "flex flex-col gap-3 border-b border-border-default p-5 md:border-b-0 md:border-r",
          leftAccent === "gold" && "bg-status-gold/30"
        )}
      >
        {leftLabel && (
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
            {leftLabel}
          </h3>
        )}
        {left}
      </section>
      <section
        className={cn(
          "flex flex-col gap-3 p-5",
          rightAccent === "gold" && "bg-status-gold/30"
        )}
      >
        {rightLabel && (
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
            {rightLabel}
          </h3>
        )}
        {right}
      </section>
    </div>
  );
}
