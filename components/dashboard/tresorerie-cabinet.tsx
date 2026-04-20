"use client";

import * as React from "react";
import {
  Landmark,
  ShieldCheck,
  ExternalLink,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { DoubleColumnSplit } from "@/components/shared/double-column-split";
import { ConformiteBanner } from "@/components/shared/conformite-banner";
import { usePennylaneSnapshot } from "@/lib/integrations/pennylane/hooks";
import { cn } from "@/lib/utils";

interface TresorerieCabinetProps {
  soldeCarpaTotal: number;
  nbSousComptesCarpa: number;
}

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Bloc trésorerie cabinet à double colonne stricte :
 *  - Colonne A : Compte professionnel (Pennylane) — fonds disponibles
 *  - Colonne B : CARPA — fonds détenus pour compte de tiers (NON disponibles)
 *
 * Règle déontologique (art. P.75.1 RIBP) : les deux colonnes NE DOIVENT
 * JAMAIS être présentées comme fongibles. Le bandeau de conformité
 * permanent sur la colonne CARPA est obligatoire.
 */
export function TresorerieCabinet({
  soldeCarpaTotal,
  nbSousComptesCarpa,
}: TresorerieCabinetProps) {
  const { data, loading } = usePennylaneSnapshot();

  const left = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-surface-muted text-text-muted">
            <Landmark className="size-3.5" />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
            Compte professionnel
          </span>
        </div>
        {data && (
          <a
            href="https://app.pennylane.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-text-subtle transition-colors hover:text-gold"
          >
            Pennylane
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-heading text-[2rem] leading-none tracking-tight text-text-strong tabular-nums">
          {loading ? "…" : data ? formatEuros(data.comptePro.solde) : "—"}
        </span>
        <span className="text-xs text-text-subtle">
          {data
            ? `${data.comptePro.iban} · màj ${formatDistanceToNow(new Date(data.comptePro.derniereSync), { addSuffix: true, locale: fr })}`
            : "Trésorerie disponible du cabinet"}
        </span>
      </div>

      {data?.mouvements && data.mouvements.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-border-subtle pt-3 text-xs">
          {data.mouvements.slice(0, 3).map((m) => (
            <li
              key={m._id}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate text-text-muted">{m.libelle}</span>
              <span
                className={cn(
                  "shrink-0 font-medium tabular-nums",
                  m.type === "credit"
                    ? "text-status-success-fg"
                    : "text-text-default"
                )}
              >
                {m.montant > 0 ? "+" : ""}
                {formatEuros(m.montant)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data?.degradationMotif && (
        <div className="flex items-start gap-2 rounded-md bg-status-info/40 px-2.5 py-1.5 text-xs text-status-info-fg">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span className="leading-snug">{data.degradationMotif}</span>
        </div>
      )}
    </div>
  );

  const right = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-status-gold text-status-gold-fg">
            <ShieldCheck className="size-3.5" />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-status-gold-fg">
            CARPA — fonds clients
          </span>
        </div>
        <span className="text-xs text-text-subtle tabular-nums">
          {nbSousComptesCarpa} sous-compte{nbSousComptesCarpa > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-heading text-[2rem] leading-none tracking-tight text-status-gold-fg tabular-nums">
          {formatEuros(soldeCarpaTotal)}
        </span>
        <span className="text-xs text-text-subtle">
          Détenu pour le compte des clients — comptabilité distincte par dossier
        </span>
      </div>

      <ConformiteBanner
        tone="deontologique"
        reference="art. P.75.1 RIBP — art. 12 décret 12/07/2005"
      >
        <strong>Fonds détenus pour compte de tiers</strong> — non disponibles
        pour le cabinet. Chaque mouvement requiert convention signée, note
        d&apos;honoraires émise et justificatif (triple verrou).
      </ConformiteBanner>
    </div>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-lg text-text-strong">
          État de trésorerie
        </h2>
        <span className="flex items-center gap-1 text-xs text-text-subtle">
          <RefreshCcw className="size-3" />
          Temps réel
        </span>
      </div>
      <DoubleColumnSplit
        leftLabel="Trésorerie disponible"
        rightLabel="Fonds non disponibles"
        leftAccent="neutral"
        rightAccent="gold"
        left={left}
        right={right}
      />
    </section>
  );
}
