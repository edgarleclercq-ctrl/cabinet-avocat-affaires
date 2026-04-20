import * as React from "react";
import {
  SPECIALITES,
  STATUTS_CORPORATE,
  STATUTS_LITIGE,
  STATUTS_FISCAL,
  STATUTS_FACTURE,
  STATUTS_PROPOSITION,
  ROLES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "gold";

const TONE_STYLES: Record<Tone, string> = {
  success:
    "bg-status-success text-status-success-fg ring-status-success-fg/10",
  warning:
    "bg-status-warning text-status-warning-fg ring-status-warning-fg/10",
  danger:
    "bg-status-danger text-status-danger-fg ring-status-danger-fg/10",
  info: "bg-status-info text-status-info-fg ring-status-info-fg/10",
  neutral:
    "bg-status-neutral text-status-neutral-fg ring-status-neutral-fg/10",
  gold: "bg-status-gold text-status-gold-fg ring-status-gold-fg/10",
};

type Kind =
  | "specialite"
  | "dossier-statut"
  | "facture-statut"
  | "proposition-statut"
  | "client-actif"
  | "role";

interface StatusBadgeProps {
  kind: Kind;
  value: string | boolean;
  className?: string;
}

/* ------------------------------------------------------------------
   Resolution tables
   ------------------------------------------------------------------ */

const SPECIALITE_TONE: Record<string, Tone> = {
  corporate: "info",
  litige: "danger",
  fiscal: "success",
};

function dossierStatutTone(value: string): Tone {
  if (value === "clos") return "neutral";
  if (value === "ouvert") return "success";
  if (value.includes("attente")) return "warning";
  if (value === "decision_rendue" || value === "execution") return "info";
  if (value === "appel" || value === "contentieux_en_cours" || value === "contentieux_fiscal") return "danger";
  return "info";
}

const FACTURE_STATUT_TONE: Record<string, Tone> = {
  brouillon: "neutral",
  en_attente: "warning",
  validee: "info",
  envoyee: "info",
  payee_partiellement: "gold",
  payee: "success",
  en_retard: "danger",
  annulee: "neutral",
};

const PROPOSITION_STATUT_TONE: Record<string, Tone> = {
  brouillon: "neutral",
  en_attente: "warning",
  validee: "info",
  envoyee: "info",
  acceptee: "success",
  refusee: "danger",
};

const ROLE_TONE: Record<string, Tone> = {
  associe: "gold",
  collaborateur: "info",
  secretaire: "success",
  stagiaire: "neutral",
};

/* ------------------------------------------------------------------
   Label + tone resolution
   ------------------------------------------------------------------ */

function resolve(kind: Kind, value: string | boolean): { label: string; tone: Tone } {
  switch (kind) {
    case "specialite": {
      const v = String(value);
      const label = SPECIALITES[v as keyof typeof SPECIALITES] ?? v;
      return { label, tone: SPECIALITE_TONE[v] ?? "neutral" };
    }
    case "dossier-statut": {
      const v = String(value);
      const all = [...STATUTS_CORPORATE, ...STATUTS_LITIGE, ...STATUTS_FISCAL];
      const label = all.find((s) => s.value === v)?.label ?? v;
      return { label, tone: dossierStatutTone(v) };
    }
    case "facture-statut": {
      const v = String(value);
      const label = STATUTS_FACTURE.find((s) => s.value === v)?.label ?? v;
      return { label, tone: FACTURE_STATUT_TONE[v] ?? "neutral" };
    }
    case "proposition-statut": {
      const v = String(value);
      const label = STATUTS_PROPOSITION.find((s) => s.value === v)?.label ?? v;
      return { label, tone: PROPOSITION_STATUT_TONE[v] ?? "neutral" };
    }
    case "client-actif": {
      const isActive = Boolean(value);
      return {
        label: isActive ? "Actif" : "Inactif",
        tone: isActive ? "success" : "neutral",
      };
    }
    case "role": {
      const v = String(value);
      const label = ROLES[v as keyof typeof ROLES] ?? v;
      return { label, tone: ROLE_TONE[v] ?? "neutral" };
    }
  }
}

/**
 * Centralized semantic status badge. Use instead of ad-hoc Badge + color
 * dictionary on each page. Tone is derived from the value itself.
 */
export function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  const { label, tone } = resolve(kind, value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[tone],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-status-success-fg",
          tone === "warning" && "bg-status-warning-fg",
          tone === "danger" && "bg-status-danger-fg",
          tone === "info" && "bg-status-info-fg",
          tone === "neutral" && "bg-status-neutral-fg/70",
          tone === "gold" && "bg-status-gold-fg"
        )}
      />
      {label}
    </span>
  );
}
