import * as React from "react";
import { ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "deontologique" | "alerte" | "info";

interface ConformiteBannerProps {
  tone?: Tone;
  /** Référence réglementaire, ex: "art. P.75.1 RIBP" */
  reference?: string;
  children: React.ReactNode;
  className?: string;
}

const TONE_STYLES: Record<
  Tone,
  { bg: string; fg: string; ring: string; icon: React.ComponentType<{ className?: string }> }
> = {
  deontologique: {
    bg: "bg-status-gold",
    fg: "text-status-gold-fg",
    ring: "ring-status-gold-fg/15",
    icon: ShieldAlert,
  },
  alerte: {
    bg: "bg-status-danger",
    fg: "text-status-danger-fg",
    ring: "ring-status-danger-fg/15",
    icon: ShieldAlert,
  },
  info: {
    bg: "bg-status-info",
    fg: "text-status-info-fg",
    ring: "ring-status-info-fg/15",
    icon: Info,
  },
};

/**
 * Bandeau déontologique permanent — à utiliser sur toute UI affichant
 * des fonds CARPA ou des dépassements de provision.
 *
 * Références : art. P.75.1, P.75.2 RIBP ; art. 6.2 RIN.
 */
export function ConformiteBanner({
  tone = "deontologique",
  reference,
  children,
  className,
}: ConformiteBannerProps) {
  const styles = TONE_STYLES[tone];
  const Icon = styles.icon;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-md px-3 py-2 text-xs ring-1 ring-inset",
        styles.bg,
        styles.fg,
        styles.ring,
        className
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="leading-snug">{children}</span>
        {reference && (
          <span className="text-[0.68rem] uppercase tracking-wider opacity-70">
            {reference}
          </span>
        )}
      </div>
    </div>
  );
}
