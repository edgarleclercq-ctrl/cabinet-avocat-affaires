"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SPECIALITES, ROLES } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER, DEMO_DOSSIER_COUNT, DEMO_ECHEANCES, DEMO_FACTURE_STATS, DEMO_ACTIVITES } from "@/lib/demo-data";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function getEcheanceColor(dateStr: string) {
  const hours = differenceInHours(new Date(dateStr), new Date());
  if (hours < 48) return "destructive";
  if (hours < 168) return "secondary"; // orange-ish via className override
  return "default";
}

function getEcheanceBorderClass(dateStr: string) {
  const hours = differenceInHours(new Date(dateStr), new Date());
  if (hours < 48) return "border-l-red-500";
  if (hours < 168) return "border-l-orange-400";
  return "border-l-green-500";
}

function KpiCard({
  title,
  value,
  icon: Icon,
  borderColor,
  subtitle,
}: {
  title: string;
  value: string | number | undefined;
  icon: React.ElementType;
  borderColor: string;
  subtitle?: string;
}) {
  return (
    <Card className={`border-t-4 ${borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value ?? "..."}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EcheancesList({
  echeances,
}: {
  echeances: Array<{
    _id: string;
    titre: string;
    date: string;
    dossierId?: string;
    dossierRef?: string;
  }> | undefined;
}) {
  if (!echeances || echeances.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune echeance dans les 7 prochains jours.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {echeances.map((echeance) => (
          <div
            key={echeance._id}
            className={`flex items-center justify-between p-3 rounded-md border-l-4 bg-muted/30 ${getEcheanceBorderClass(echeance.date)}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{echeance.titre}</p>
              {echeance.dossierRef && echeance.dossierId && (
                <Link
                  href={`/dossiers/${echeance.dossierId}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {echeance.dossierRef}
                </Link>
              )}
            </div>
            <Badge variant={getEcheanceColor(echeance.date)}>
              {formatDistanceToNow(new Date(echeance.date), {
                addSuffix: true,
                locale: fr,
              })}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ActivityTimeline({
  activites,
}: {
  activites: Array<{
    _id: string;
    type: string;
    description: string;
    createdAt: string;
    utilisateur?: string;
  }> | undefined;
}) {
  if (!activites || activites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune activite recente.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {activites.map((activite) => (
          <div key={activite._id} className="flex items-start gap-3">
            <div className="mt-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activite.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {activite.utilisateur && (
                  <span className="text-xs text-muted-foreground">
                    {activite.utilisateur}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date((activite as any)._creationTime || activite.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function AssocieCollaborateurDashboard({
  dossierCount,
  echeances,
  factureStats,
  activites,
  role,
}: {
  dossierCount: number | undefined;
  echeances: any;
  factureStats: any;
  activites: any;
  role: string;
}) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Dossiers actifs"
          value={dossierCount}
          icon={FolderOpen}
          borderColor="border-t-blue-500"
          subtitle={role === "collaborateur" ? "Vos dossiers" : "Tous les dossiers"}
        />
        <KpiCard
          title="Echeances 7j"
          value={echeances?.length}
          icon={Clock}
          borderColor="border-t-orange-500"
          subtitle="Prochains 7 jours"
        />
        <KpiCard
          title="Facturation du mois"
          value={
            factureStats?.totalMois != null
              ? `${factureStats.totalMois.toLocaleString("fr-FR")} EUR`
              : undefined
          }
          icon={Receipt}
          borderColor="border-t-green-500"
          subtitle={format(new Date(), "MMMM yyyy", { locale: fr })}
        />
        <KpiCard
          title="Taux de recouvrement"
          value={
            factureStats?.tauxRecouvrement != null
              ? `${factureStats.tauxRecouvrement}%`
              : undefined
          }
          icon={TrendingUp}
          borderColor="border-t-purple-500"
          subtitle="Sur les 12 derniers mois"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alertes / Echeances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Alertes et echeances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EcheancesList echeances={echeances} />
          </CardContent>
        </Card>

        {/* Activite recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Activite recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activites={activites} />
          </CardContent>
        </Card>
      </div>

      {/* Facturation chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Evolution de la facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] rounded-md border border-dashed text-sm text-muted-foreground">
            Graphique de facturation (a venir)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecretaireDashboard({
  factureStats,
}: {
  factureStats: any;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Factures a emettre"
          value={factureStats?.facturesAEmettre}
          icon={Receipt}
          borderColor="border-t-blue-500"
        />
        <KpiCard
          title="Relances en cours"
          value={factureStats?.relancesEnCours}
          icon={AlertTriangle}
          borderColor="border-t-orange-500"
        />
        <KpiCard
          title="Facturation du mois"
          value={
            factureStats?.totalMois != null
              ? `${factureStats.totalMois.toLocaleString("fr-FR")} EUR`
              : undefined
          }
          icon={TrendingUp}
          borderColor="border-t-green-500"
          subtitle={format(new Date(), "MMMM yyyy", { locale: fr })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Suivi facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] rounded-md border border-dashed text-sm text-muted-foreground">
            Tableau de suivi des factures et relances (a venir)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StagiaireDashboard({
  dossierCount,
}: {
  dossierCount: number | undefined;
}) {
  return (
    <div className="space-y-6">
      <KpiCard
        title="Dossiers assignes"
        value={dossierCount}
        icon={FolderOpen}
        borderColor="border-t-blue-500"
        subtitle="Vos dossiers en cours"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4" />
            Vos dossiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] rounded-md border border-dashed text-sm text-muted-foreground">
            Liste des dossiers assignes (a venir)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const convexUser = useQuery(api.users.me, DEMO_MODE ? "skip" : {});
  const convexDossierCount = useQuery(api.dossiers.count, DEMO_MODE ? "skip" : {});
  const convexEcheances = useQuery(api.echeances.upcoming, DEMO_MODE ? "skip" : { days: 7 });
  const convexFactureStats = useQuery(api.factures.stats, DEMO_MODE ? "skip" : {});
  const convexActivites = useQuery(api.activites.recent, DEMO_MODE ? "skip" : { limit: 10 });

  const user = DEMO_MODE ? DEMO_USER : convexUser;
  const dossierCount = DEMO_MODE ? DEMO_DOSSIER_COUNT : convexDossierCount;
  const echeances = DEMO_MODE ? DEMO_ECHEANCES : convexEcheances;
  const factureStats = DEMO_MODE ? DEMO_FACTURE_STATS : convexFactureStats;
  const activites = DEMO_MODE ? DEMO_ACTIVITES : convexActivites;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const role = user.role;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user.name ?? user.email}
        </p>
      </div>

      <Separator />

      {(role === "associe" || role === "collaborateur") && (
        <AssocieCollaborateurDashboard
          dossierCount={dossierCount?.actifs}
          echeances={echeances}
          factureStats={factureStats}
          activites={activites}
          role={role}
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
