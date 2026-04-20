"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUTS_FACTURE } from "@/lib/constants";
import {
  DEMO_MODE,
  DEMO_USER,
  DEMO_FACTURES,
  DEMO_FACTURE_STATS,
  DEMO_CLIENTS,
} from "@/lib/demo-data";
import { useDemoAddedClients, useDemoAddedFactures } from "@/lib/demo-store";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Euro,
  TrendingUp,
  AlertTriangle,
  Percent,
  Receipt,
} from "lucide-react";

import { FactureForm } from "@/components/facturation/facture-form";
import { FactureDetail } from "@/components/facturation/facture-detail";
import { PageHeader } from "@/components/shared/page-header";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

function formatMontant(montant: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

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
      <div className="flex-1">{children}</div>
    </section>
  );
}

export default function FacturationPage() {
  const [activeTab, setActiveTab] = useState("factures");
  const [statutFilter, setStatutFilter] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFactureId, setSelectedFactureId] =
    useState<Id<"factures"> | null>(null);

  const convexStats = useQuery(api.factures.stats, DEMO_MODE ? "skip" : {});
  const convexFactures = useQuery(
    api.factures.list,
    DEMO_MODE ? "skip" : statutFilter ? { statut: statutFilter } : {}
  );
  const convexClients = useQuery(api.clients.list, DEMO_MODE ? "skip" : {});

  const addedDemoFactures = useDemoAddedFactures();
  const addedDemoClients = useDemoAddedClients();

  const allDemoFactures = DEMO_MODE
    ? [...addedDemoFactures, ...DEMO_FACTURES]
    : [];

  const computedDemoStats = DEMO_MODE
    ? (() => {
        const emis = allDemoFactures.reduce(
          (acc: number, f: any) => acc + (f.montantTTC || 0),
          0
        );
        const encaisse = allDemoFactures
          .filter((f: any) => f.statut === "payee")
          .reduce((acc: number, f: any) => acc + (f.montantTTC || 0), 0);
        const impaye = allDemoFactures
          .filter((f: any) => f.statut === "en_retard")
          .reduce((acc: number, f: any) => acc + (f.montantTTC || 0), 0);
        const tauxRecouvrement =
          emis > 0 ? Math.round((encaisse / emis) * 100) : 0;
        return {
          emis,
          encaisse,
          impaye,
          tauxRecouvrement,
          totalMois: emis,
          facturesAEmettre: allDemoFactures.filter(
            (f: any) => f.statut === "brouillon"
          ).length,
          relancesEnCours: allDemoFactures.filter(
            (f: any) => f.statut === "en_retard"
          ).length,
        };
      })()
    : null;

  const stats = DEMO_MODE ? computedDemoStats : convexStats;

  const factures = DEMO_MODE
    ? statutFilter
      ? allDemoFactures.filter((f: any) => f.statut === statutFilter)
      : allDemoFactures
    : convexFactures;

  const clients = DEMO_MODE
    ? [...addedDemoClients, ...DEMO_CLIENTS]
    : convexClients;

  const clientsMap = new Map<string, string>(
    (clients ?? []).map((c: any) => [c._id, c.denomination])
  );

  const filteredFactures = clientFilter
    ? (factures ?? []).filter((f) => f.clientId === clientFilter)
    : factures ?? [];

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        title="Facturation"
        subtitle="Cycle de vie des factures, suivi des paiements et reporting financier."
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus data-icon="inline-start" />
            Nouvelle facture
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
        <TabsList>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="temps">Temps passés</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>

        {/* ── Tab Factures ─────────────────────────────── */}
        <TabsContent value="factures" className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="CA émis (mois)"
              value={stats ? formatMontant(stats.emis) : "—"}
              icon={Euro}
            />
            <StatCard
              label="Encaissé"
              value={stats ? formatMontant(stats.encaisse) : "—"}
              icon={TrendingUp}
              trend={
                stats && stats.emis > 0
                  ? {
                      value: `${Math.round((stats.encaisse / stats.emis) * 100)}%`,
                      direction:
                        stats.encaisse / Math.max(stats.emis, 1) >= 0.6
                          ? "up"
                          : "flat",
                      label: "du CA émis",
                    }
                  : undefined
              }
            />
            <StatCard
              label="Impayé"
              value={stats ? formatMontant(stats.impaye) : "—"}
              icon={AlertTriangle}
              trend={
                stats
                  ? {
                      value: `${(factures ?? []).filter((f: any) => f.statut === "en_retard").length}`,
                      direction: stats.impaye > 0 ? "down" : "flat",
                      label: "factures en retard",
                    }
                  : undefined
              }
            />
            <StatCard
              label="Taux de recouvrement"
              value={stats ? `${stats.tauxRecouvrement}%` : "—"}
              icon={Percent}
              hint="12 derniers mois"
            />
          </div>

          <FilterToolbar>
            <Select
              value={statutFilter ?? ""}
              onValueChange={(val) => setStatutFilter(val || null)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                {STATUTS_FACTURE.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={clientFilter ?? ""}
              onValueChange={(val) => setClientFilter(val || null)}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les clients</SelectItem>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.denomination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterToolbar>

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
            {filteredFactures.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Receipt}
                  title="Aucune facture"
                  description="Aucune facture ne correspond à vos filtres."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border-subtle hover:bg-transparent">
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Émission</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFactures.map((facture) => (
                    <TableRow
                      key={facture._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedFactureId(facture._id)}
                    >
                      <TableCell className="font-mono text-xs font-medium text-text-strong">
                        {facture.numero}
                      </TableCell>
                      <TableCell className="text-text-default">
                        {clientsMap.get(facture.clientId) ?? "—"}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {facture.dossierId ? "Oui" : "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-text-muted">
                        {facture.description}
                      </TableCell>
                      <TableCell className="text-right font-medium text-text-strong tabular-nums">
                        {formatMontant(facture.montantTTC)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="facture-statut"
                          value={facture.statut}
                        />
                      </TableCell>
                      <TableCell className="text-text-subtle tabular-nums">
                        {facture.dateEmission}
                      </TableCell>
                      <TableCell className="text-text-subtle tabular-nums">
                        {facture.dateEcheance}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ── Tab Temps passés ─────────────────────────── */}
        <TabsContent value="temps">
          <SectionPanel title="Temps passés" icon={Receipt}>
            <div className="p-5">
              <EmptyState
                icon={Receipt}
                title="Suivi des temps passés"
                description="La saisie déclarative par dossier sera disponible prochainement."
              />
            </div>
          </SectionPanel>
        </TabsContent>

        {/* ── Tab Reporting ─────────────────────────────── */}
        <TabsContent value="reporting" className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard
              label="CA mensuel"
              value={stats ? formatMontant(stats.emis) : "—"}
              icon={TrendingUp}
            />
            <StatCard
              label="CA trimestriel"
              value="À venir"
              hint="Disponible prochainement"
            />
            <StatCard
              label="CA annuel"
              value="À venir"
              hint="Disponible prochainement"
            />
          </div>

          <SectionPanel title="Top 5 clients par CA" icon={TrendingUp}>
            <div className="p-5">
              <EmptyState
                icon={TrendingUp}
                title="Classement par chiffre d'affaires"
                description="Disponible prochainement."
              />
            </div>
          </SectionPanel>

          <SectionPanel title="Factures en retard" icon={AlertTriangle}>
            {(factures ?? []).filter((f) => f.statut === "en_retard").length ===
            0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Receipt}
                  title="Aucune facture en retard"
                  description="Excellent — le recouvrement est à jour."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border-subtle hover:bg-transparent">
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(factures ?? [])
                    .filter((f) => f.statut === "en_retard")
                    .map((f) => (
                      <TableRow
                        key={f._id}
                        className="cursor-pointer"
                        onClick={() => setSelectedFactureId(f._id)}
                      >
                        <TableCell className="font-mono text-xs font-medium">
                          {f.numero}
                        </TableCell>
                        <TableCell className="text-text-default">
                          {clientsMap.get(f.clientId) ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-status-danger-fg tabular-nums">
                          {formatMontant(f.montantTTC)}
                        </TableCell>
                        <TableCell className="text-text-subtle tabular-nums">
                          {f.dateEcheance}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </SectionPanel>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
          </DialogHeader>
          <FactureForm onClose={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog
        open={selectedFactureId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedFactureId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de la facture</DialogTitle>
          </DialogHeader>
          {selectedFactureId && <FactureDetail factureId={selectedFactureId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
