"use client";

import Link from "next/link";
import { AlertTriangle, FileSignature, ShieldAlert } from "lucide-react";
import { ProgressGauge } from "@/components/shared/progress-gauge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { EtatCabinet } from "@/lib/legalpay/etat-dossier";

interface AlertesConformiteProps {
  dossiersEnAlerte: EtatCabinet["dossiersEnAlerte"];
  conventionsEnAttention: EtatCabinet["conventionsEnAttention"];
}

export function AlertesConformite({
  dossiersEnAlerte,
  conventionsEnAttention,
}: AlertesConformiteProps) {
  const hasAny =
    dossiersEnAlerte.length > 0 || conventionsEnAttention.length > 0;

  return (
    <section className="flex flex-col rounded-lg border border-border-subtle bg-surface">
      <header className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
        <ShieldAlert className="size-4 text-text-muted" />
        <h2 className="font-heading text-base text-text-strong">
          Alertes de conformité
        </h2>
      </header>

      {!hasAny ? (
        <div className="p-5">
          <EmptyState
            icon={ShieldAlert}
            title="Aucune alerte"
            description="Provisions, conventions et créances sont sous contrôle."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          {dossiersEnAlerte.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-status-danger-fg">
                <AlertTriangle className="size-3" />
                Dépassements de provision
              </h3>
              <ul className="flex flex-col divide-y divide-border-subtle">
                {dossiersEnAlerte.map((d) => (
                  <li
                    key={d.dossierId}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <Link
                      href={`/dossiers/${d.dossierId}`}
                      className="min-w-0 flex-1 hover:text-gold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-muted">
                          {d.reference}
                        </span>
                        <span className="truncate text-text-default">
                          {d.clientDenomination}
                        </span>
                      </div>
                    </Link>
                    <div className="w-32">
                      <ProgressGauge
                        value={d.ratio ?? 1}
                        variant="compact"
                        hidePercentage
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-status-danger-fg tabular-nums">
                      {d.ratio !== null
                        ? `${Math.round(d.ratio * 100)}%`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conventionsEnAttention.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-status-warning-fg">
                <FileSignature className="size-3" />
                Conventions à finaliser
              </h3>
              <ul className="flex flex-col divide-y divide-border-subtle">
                {conventionsEnAttention.map((c) => (
                  <li
                    key={c.conventionId}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      href={`/dossiers/${c.dossierId}`}
                      className="min-w-0 flex-1 hover:text-gold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-muted">
                          {c.reference}
                        </span>
                        <span className="truncate text-text-default">
                          {c.clientDenomination}
                        </span>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.joursDepuisEnvoi !== null && (
                        <span className="text-xs text-text-subtle">
                          {c.joursDepuisEnvoi}j
                        </span>
                      )}
                      <StatusBadge
                        kind="proposition-statut"
                        value={
                          c.statut === "envoyee" ? "envoyee" : "brouillon"
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
