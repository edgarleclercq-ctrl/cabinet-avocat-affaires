"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEMO_MODE,
  DEMO_USER,
  DEMO_DOSSIER_COUNT,
  DEMO_ECHEANCES,
  DEMO_FACTURE_STATS,
  DEMO_ACTIVITES,
  DEMO_CLIENTS,
} from "@/lib/demo-data";
import { computeEtatCabinetDemo } from "@/lib/legalpay/etat-dossier";
import { TresorerieCabinet } from "@/components/dashboard/tresorerie-cabinet";
import { KpiFinanciers } from "@/components/dashboard/kpi-financiers";
import { AlertesConformite } from "@/components/dashboard/alertes-conformite";
import Link from "next/link";
import { formatDistanceToNow, format, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
  FolderOpen,
  Clock,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function echeanceUrgency(dateStr: string): "danger" | "warning" | "success" {
  const hours = differenceInHours(new Date(dateStr), new Date());
  if (hours < 48) return "danger";
  if (hours < 168) return "warning";
  return "success";
}

const URGENCY_STYLES = {
  danger:
    "border-l-status-danger-fg bg-status-danger/30 text-status-danger-fg",
  warning:
    "border-l-status-warning-fg bg-status-warning/30 text-status-warning-fg",
  success:
    "border-l-status-success-fg bg-status-success/30 text-status-success-fg",
} as const;

function EcheancesList({
  echeances,
}: {
  echeances:
    | Array<{
        _id: string;
        titre: string;
        date: string;
        dossierId?: string;
        dossierRef?: string;
      }>
    | undefined;
}) {
  if (!echeances || echeances.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Aucune échéance"
        description="Rien n'est prévu dans les 7 prochains jours."
      />
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-2">
      <ul className="flex flex-col gap-1.5">
        {echeances.map((e) => {
          const urgency = echeanceUrgency(e.date);
          return (
            <li
              key={e._id}
              className="flex items-center justify-between gap-4 rounded-md border border-border-subtle bg-surface px-3 py-2.5 transition-colors hover:border-border-default"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "h-9 w-0.5 rounded-full",
                    urgency === "danger" && "bg-status-danger-fg",
                    urgency === "warning" && "bg-status-warning-fg",
                    urgency === "success" && "bg-status-success-fg"
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-medium text-text-strong">
                    {e.titre}
                  </p>
                  {e.dossierRef && e.dossierId && (
                    <Link
                      href={`/dossiers/${e.dossierId}`}
                      className="text-xs font-mono text-text-muted transition-colors hover:text-gold"
                    >
                      {e.dossierRef}
                    </Link>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  urgency === "danger" &&
                    "bg-status-danger text-status-danger-fg ring-status-danger-fg/10",
                  urgency === "warning" &&
                    "bg-status-warning text-status-warning-fg ring-status-warning-fg/10",
                  urgency === "success" &&
                    "bg-status-success text-status-success-fg ring-status-success-fg/10"
                )}
              >
                {formatDistanceToNow(new Date(e.date), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}

function ActivityTimeline({
  activites,
}: {
  activites:
    | Array<{
        _id: string;
        type: string;
        description: string;
        createdAt: string;
        utilisateur?: string;
      }>
    | undefined;
}) {
  if (!activites || activites.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Rien à signaler"
        description="L'activité récente apparaîtra ici."
      />
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-2">
      <ul className="relative flex flex-col gap-0">
        <span
          aria-hidden
          className="absolute left-[17px] top-2 bottom-2 w-px bg-border-subtle"
        />
        {activites.map((a) => (
          <li key={a._id} className="relative flex items-start gap-3 py-2.5">
            <span className="relative z-10 mt-1 flex size-[14px] shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border-default ml-[10px]">
              <span className="size-1.5 rounded-full bg-gold" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-sm text-text-default">{a.description}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-text-subtle">
                {a.utilisateur && <span>{a.utilisateur}</span>}
                {a.utilisateur && <span aria-hidden>·</span>}
                <span>
                  {formatDistanceToNow(
                    new Date(
                      (a as any)._creationTime ?? a.createdAt
                    ),
                    { addSuffix: true, locale: fr }
                  )}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboards per role                                                 */
/* ------------------------------------------------------------------ */

function SectionPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border-subtle bg-surface">
      <header className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
        <Icon className="size-4 text-text-muted" />
        <h2 className="font-heading text-base text-text-strong">{title}</h2>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

function AssocieCollaborateurDashboard({
  dossierCount,
  echeances,
  factureStats,
  activites,
  role,
  etatCabinet,
}: {
  dossierCount: number | undefined;
  echeances: any;
  factureStats: any;
  activites: any;
  role: string;
  etatCabinet: ReturnType<typeof computeEtatCabinetDemo>;
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Pilier 1 LegalPay — trésorerie + KPIs financiers + alertes conformité */}
      <TresorerieCabinet
        soldeCarpaTotal={etatCabinet.soldeCarpaTotal}
        nbSousComptesCarpa={etatCabinet.nbSousComptesCarpa}
      />
      <KpiFinanciers
        provisionsDetenues={etatCabinet.provisionsDetenues}
        honorairesNonEncaisses={etatCabinet.honorairesNonEncaisses}
        ageMoyenCreancesJours={etatCabinet.ageMoyenCreancesJours}
        nbDossiersEnAlerte={etatCabinet.dossiersEnAlerte.length}
      />
      <AlertesConformite
        dossiersEnAlerte={etatCabinet.dossiersEnAlerte}
        conventionsEnAttention={etatCabinet.conventionsEnAttention}
      />

      {/* Séparateur visuel : section opérationnelle */}
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-subtle">
          Opérationnel
        </span>
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dossiers actifs"
          value={dossierCount ?? "—"}
          icon={FolderOpen}
          hint={role === "collaborateur" ? "Vos dossiers" : "Tous les dossiers"}
        />
        <StatCard
          label="Échéances 7j"
          value={echeances?.length ?? "—"}
          icon={Clock}
          trend={{
            value: `${
              (echeances ?? []).filter((e: any) =>
                differenceInHours(new Date(e.date), new Date()) < 48
              ).length
            } urgentes`,
            direction: "flat",
          }}
        />
        <StatCard
          label="Facturation du mois"
          value={
            factureStats?.totalMois != null
              ? `${factureStats.totalMois.toLocaleString("fr-FR")} €`
              : "—"
          }
          icon={Receipt}
          hint={format(new Date(), "MMMM yyyy", { locale: fr })}
        />
        <StatCard
          label="Taux de recouvrement"
          value={
            factureStats?.tauxRecouvrement != null
              ? `${factureStats.tauxRecouvrement}%`
              : "—"
          }
          icon={TrendingUp}
          trend={
            factureStats?.tauxRecouvrement != null
              ? {
                  value: `${factureStats.tauxRecouvrement}%`,
                  direction:
                    factureStats.tauxRecouvrement >= 80
                      ? "up"
                      : factureStats.tauxRecouvrement >= 50
                        ? "flat"
                        : "down",
                }
              : undefined
          }
          hint="12 derniers mois"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionPanel title="Alertes et échéances" icon={AlertTriangle}>
            <EcheancesList echeances={echeances} />
          </SectionPanel>
        </div>
        <div className="lg:col-span-2">
          <SectionPanel title="Activité récente" icon={Activity}>
            <ActivityTimeline activites={activites} />
          </SectionPanel>
        </div>
      </div>

      {/* Revenue trend — lightweight SVG sparkline on demo data */}
      <SectionPanel title="Évolution de la facturation" icon={Receipt}>
        <RevenueSparkline factureStats={factureStats} />
      </SectionPanel>
    </div>
  );
}

function RevenueSparkline({ factureStats }: { factureStats: any }) {
  // For the "professional demo" look we derive a 12-month pseudo-series from
  // current-month total. No backend data needed.
  const base = factureStats?.totalMois ?? 42000;
  const series = Array.from({ length: 12 }).map((_, i) => {
    const seasonal = Math.sin((i / 12) * Math.PI * 2) * 0.08;
    const noise = ((i * 7919) % 100) / 100 - 0.5;
    return Math.round(base * (0.7 + i * 0.03 + seasonal + noise * 0.15));
  });
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const w = 100;
  const h = 40;
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;
  const area = `M 0,${h} L ${points.join(" L ")} L ${w},${h} Z`;

  const total = series.reduce((a, b) => a + b, 0);
  const prev = series[series.length - 2];
  const curr = series[series.length - 1];
  const delta = Math.round(((curr - prev) / Math.max(prev, 1)) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-3xl tracking-tight text-text-strong tabular-nums">
          {total.toLocaleString("fr-FR")} €
        </span>
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            delta >= 0 ? "text-status-success-fg" : "text-status-danger-fg"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta}%
        </span>
        <span className="text-xs text-text-subtle">vs. mois précédent</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkFill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function SecretaireDashboard({ factureStats }: { factureStats: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Factures à émettre"
          value={factureStats?.facturesAEmettre ?? "—"}
          icon={Receipt}
        />
        <StatCard
          label="Relances en cours"
          value={factureStats?.relancesEnCours ?? "—"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Facturation du mois"
          value={
            factureStats?.totalMois != null
              ? `${factureStats.totalMois.toLocaleString("fr-FR")} €`
              : "—"
          }
          icon={TrendingUp}
          hint={format(new Date(), "MMMM yyyy", { locale: fr })}
        />
      </div>
      <SectionPanel title="Suivi facturation" icon={Receipt}>
        <EmptyState
          icon={Receipt}
          title="Tableau de suivi des relances"
          description="Disponible prochainement."
        />
      </SectionPanel>
    </div>
  );
}

function StagiaireDashboard({
  dossierCount,
}: {
  dossierCount: number | undefined;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Dossiers assignés"
          value={dossierCount ?? "—"}
          icon={FolderOpen}
          hint="Vos dossiers en cours"
        />
      </div>
      <SectionPanel title="Vos dossiers" icon={FolderOpen}>
        <EmptyState
          icon={FolderOpen}
          title="Liste des dossiers assignés"
          description="Disponible prochainement."
        />
      </SectionPanel>
    </div>
  );
}

export default function DashboardPage() {
  const convexUser = useQuery(api.users.me, DEMO_MODE ? "skip" : {});
  const convexDossierCount = useQuery(
    api.dossiers.count,
    DEMO_MODE ? "skip" : {}
  );
  const convexEcheances = useQuery(
    api.echeances.upcoming,
    DEMO_MODE ? "skip" : { days: 7 }
  );
  const convexFactureStats = useQuery(
    api.factures.stats,
    DEMO_MODE ? "skip" : {}
  );
  const convexActivites = useQuery(
    api.activites.recent,
    DEMO_MODE ? "skip" : { limit: 10 }
  );

  const user = DEMO_MODE ? DEMO_USER : convexUser;
  const dossierCount = DEMO_MODE ? DEMO_DOSSIER_COUNT : convexDossierCount;
  const echeances = DEMO_MODE ? DEMO_ECHEANCES : convexEcheances;
  const factureStats = DEMO_MODE ? DEMO_FACTURE_STATS : convexFactureStats;
  const activites = DEMO_MODE ? DEMO_ACTIVITES : convexActivites;

  // Pilier 1 LegalPay — agrégat cabinet (trésorerie CARPA, créances, alertes)
  const etatCabinet = React.useMemo(() => {
    const clientsById = new Map(
      (DEMO_MODE ? DEMO_CLIENTS : []).map((c: any) => [
        c._id as string,
        { denomination: c.denomination },
      ])
    );
    return computeEtatCabinetDemo(clientsById);
  }, []);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="text-text-muted">Chargement…</div>
      </div>
    );
  }

  const role = user.role;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        eyebrow={`Bienvenue, ${user.name ?? user.email}`}
        title="Tableau de bord"
        subtitle="Vue d'ensemble de l'activité du cabinet."
      />

      {(role === "associe" || role === "collaborateur") && (
        <AssocieCollaborateurDashboard
          dossierCount={dossierCount?.actifs}
          echeances={echeances}
          factureStats={factureStats}
          activites={activites}
          role={role}
          etatCabinet={etatCabinet}
        />
      )}

      {role === "secretaire" && (
        <SecretaireDashboard factureStats={factureStats} />
      )}

      {role === "stagiaire" && (
        <StagiaireDashboard dossierCount={dossierCount?.actifs} />
      )}
    </div>
  );
}
