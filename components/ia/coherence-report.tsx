"use client";

import * as React from "react";
import {
  FileCheck,
  AlertTriangle,
  ExternalLink,
  Scale,
  ListChecks,
  BookMarked,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { CoherenceReport } from "@/lib/demo-coherence";
import { ConformiteBanner } from "@/components/shared/conformite-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface CoherenceReportProps {
  report: CoherenceReport;
}

type Gravite = "info" | "attention" | "critique";
type Priorite = "low" | "medium" | "high";

const GRAVITE_STYLES: Record<
  Gravite,
  { chip: string; border: string; label: string }
> = {
  info: {
    chip: "bg-status-info text-status-info-fg ring-status-info-fg/15",
    border: "border-l-status-info-fg",
    label: "Info",
  },
  attention: {
    chip: "bg-status-warning text-status-warning-fg ring-status-warning-fg/15",
    border: "border-l-status-warning-fg",
    label: "Attention",
  },
  critique: {
    chip: "bg-status-danger text-status-danger-fg ring-status-danger-fg/15",
    border: "border-l-status-danger-fg",
    label: "Critique",
  },
};

const PRIORITE_STYLES: Record<Priorite, { chip: string; label: string }> = {
  low: {
    chip: "bg-status-neutral text-status-neutral-fg ring-status-neutral-fg/10",
    label: "Priorité basse",
  },
  medium: {
    chip: "bg-status-info text-status-info-fg ring-status-info-fg/10",
    label: "Priorité moyenne",
  },
  high: {
    chip: "bg-status-danger text-status-danger-fg ring-status-danger-fg/10",
    label: "Priorité haute",
  },
};

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-medium ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionPanel({
  icon: Icon,
  title,
  subtitle,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border-subtle bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-text-muted" />
          <div className="flex flex-col leading-tight">
            <h3 className="font-heading text-sm text-text-strong">{title}</h3>
            {subtitle && (
              <span className="text-xs text-text-subtle">{subtitle}</span>
            )}
          </div>
        </div>
        {count !== undefined && count > 0 && (
          <Chip className="bg-surface-muted text-text-muted ring-border-subtle">
            {count}
          </Chip>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function CoherenceReportView({ report }: CoherenceReportProps) {
  const nbCritiques = [
    ...report.incoherencesInternes,
    ...report.nonConformites,
  ].filter((x) => x.gravite === "critique").length;
  const nbAttention = [
    ...report.incoherencesInternes,
    ...report.nonConformites,
  ].filter((x) => x.gravite === "attention").length;
  const nbInfo = [
    ...report.incoherencesInternes,
    ...report.nonConformites,
  ].filter((x) => x.gravite === "info").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section 1 — Résumé exécutif ────────────────────────── */}
      <SectionPanel icon={Sparkles} title="Résumé exécutif">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-text-default">
            {report.resumeExecutif}
          </p>
          <div className="flex flex-wrap gap-2">
            {nbCritiques > 0 && (
              <Chip className={GRAVITE_STYLES.critique.chip}>
                <AlertTriangle className="size-3" />
                {nbCritiques} critique{nbCritiques > 1 ? "s" : ""}
              </Chip>
            )}
            {nbAttention > 0 && (
              <Chip className={GRAVITE_STYLES.attention.chip}>
                {nbAttention} attention{nbAttention > 1 ? "s" : ""}
              </Chip>
            )}
            {nbInfo > 0 && (
              <Chip className={GRAVITE_STYLES.info.chip}>
                {nbInfo} info{nbInfo > 1 ? "s" : ""}
              </Chip>
            )}
            {report.sourceBackend === "mock" && (
              <Chip className="bg-status-gold text-status-gold-fg ring-status-gold-fg/15">
                Corpus restreint (mock)
              </Chip>
            )}
            {report.sourceBackend === "real" && (
              <Chip className="bg-status-success text-status-success-fg ring-status-success-fg/15">
                Sources Légifrance vérifiées
              </Chip>
            )}
          </div>

          <ConformiteBanner
            tone="info"
            reference="Disclaimer"
          >
            <strong>L'analyse IA ne remplace pas la validation d'un avocat.</strong>
            {" "}Les citations Légifrance sont authentiques mais leur interprétation
            engage la responsabilité du relecteur.
          </ConformiteBanner>
        </div>
      </SectionPanel>

      {/* ── Section 2 — Clauses-clés ────────────────────────────── */}
      <SectionPanel
        icon={BookMarked}
        title="Clauses-clés identifiées"
        subtitle="Citations vérifiées sur Légifrance"
        count={report.clausesCles.length}
      >
        {report.clausesCles.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="Aucune clause identifiée"
            description="Le document ne contient pas de clauses clairement identifiables."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {report.clausesCles.map((c, i) => (
              <ClauseItem key={i} clause={c} />
            ))}
          </ul>
        )}
      </SectionPanel>

      {/* ── Section 3 — Incohérences internes ──────────────────── */}
      <SectionPanel
        icon={Scale}
        title="Incohérences internes"
        subtitle="Clauses contradictoires au sein du document"
        count={report.incoherencesInternes.length}
      >
        {report.incoherencesInternes.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Aucune incohérence détectée"
            description="Les clauses analysées sont cohérentes entre elles."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {report.incoherencesInternes.map((inc, i) => {
              const styles = GRAVITE_STYLES[inc.gravite];
              return (
                <li
                  key={i}
                  className={cn(
                    "flex flex-col gap-3 rounded-md border-l-2 bg-surface-muted/40 px-4 py-3",
                    styles.border
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-strong">
                      {inc.explication}
                    </p>
                    <Chip className={styles.chip}>{styles.label}</Chip>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-border-subtle bg-surface p-3">
                      <div className="mb-1 text-[0.65rem] uppercase tracking-[0.1em] text-text-subtle">
                        Clause A
                      </div>
                      <p className="text-xs italic text-text-default">
                        « {inc.clauseA} »
                      </p>
                    </div>
                    <div className="rounded-md border border-border-subtle bg-surface p-3">
                      <div className="mb-1 text-[0.65rem] uppercase tracking-[0.1em] text-text-subtle">
                        Clause B
                      </div>
                      <p className="text-xs italic text-text-default">
                        « {inc.clauseB} »
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionPanel>

      {/* ── Section 4 — Non-conformités ──────────────────────────── */}
      <SectionPanel
        icon={AlertTriangle}
        title="Non-conformités avec le droit positif"
        subtitle="Clauses contraires au droit français ou à la jurisprudence"
        count={report.nonConformites.length}
      >
        {report.nonConformites.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="Aucune non-conformité détectée"
            description="Le document est conforme aux règles vérifiées."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {report.nonConformites.map((nc, i) => {
              const styles = GRAVITE_STYLES[nc.gravite];
              return (
                <li
                  key={i}
                  className={cn(
                    "flex flex-col gap-2 rounded-md border-l-2 bg-surface-muted/40 px-4 py-3",
                    styles.border
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
                        Règle : {nc.reglePatrimoniale}
                      </span>
                      {nc.referenceUrl && (
                        <a
                          href={nc.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center gap-1 text-xs text-gold transition-colors hover:underline"
                        >
                          Voir sur legifrance.gouv.fr
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <Chip className={styles.chip}>{styles.label}</Chip>
                  </div>
                  <div className="rounded-md border border-border-subtle bg-surface p-3">
                    <div className="mb-1 text-[0.65rem] uppercase tracking-[0.1em] text-text-subtle">
                      Clause en cause
                    </div>
                    <p className="text-xs italic text-text-default">
                      « {nc.clause} »
                    </p>
                  </div>
                  <p className="text-sm text-text-default">{nc.explication}</p>
                </li>
              );
            })}
          </ul>
        )}
      </SectionPanel>

      {/* ── Section 5 — Recommandations ────────────────────────── */}
      <SectionPanel
        icon={ListChecks}
        title="Recommandations"
        count={report.recommandations.length}
      >
        {report.recommandations.length === 0 ? (
          <p className="text-sm text-text-muted">
            Aucune recommandation — le document est globalement acceptable.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.recommandations
              .slice()
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.priorite] - order[b.priorite];
              })
              .map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface p-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold",
                      r.priorite === "high"
                        ? "bg-status-danger text-status-danger-fg"
                        : r.priorite === "medium"
                          ? "bg-status-info text-status-info-fg"
                          : "bg-status-neutral text-status-neutral-fg"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-strong">
                        {r.titre}
                      </p>
                      <Chip className={PRIORITE_STYLES[r.priorite].chip}>
                        {PRIORITE_STYLES[r.priorite].label}
                      </Chip>
                    </div>
                    <p className="text-sm text-text-muted">{r.description}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}

function ClauseItem({
  clause,
}: {
  clause: CoherenceReport["clausesCles"][number];
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <li className="rounded-md border border-border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-medium text-text-strong">{clause.titre}</p>
          {!expanded && (
            <p className="truncate text-xs text-text-muted">
              « {clause.contenu} »
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {clause.references.map((ref, j) => (
              <a
                key={j}
                href={ref.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md bg-status-gold/60 px-2 py-0.5 text-[0.68rem] font-medium text-status-gold-fg ring-1 ring-inset ring-status-gold-fg/15 transition-colors hover:bg-status-gold"
              >
                {ref.citation}
                <ExternalLink className="size-3" />
              </a>
            ))}
            {clause.references.length === 0 && (
              <span className="text-[0.68rem] italic text-text-subtle">
                Pas de référence associée
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-text-muted" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border-subtle px-4 py-3">
          <p className="text-sm italic text-text-default">
            « {clause.contenu} »
          </p>
        </div>
      )}
    </li>
  );
}
