"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUTS_FACTURE } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER, DEMO_FACTURES, DEMO_FACTURE_STATS, DEMO_CLIENTS } from "@/lib/demo-data";
import { useDemoAddedClients, useDemoAddedFactures } from "@/lib/demo-store";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Euro, TrendingUp, AlertTriangle, Percent } from "lucide-react";

import { FactureForm } from "@/components/facturation/facture-form";
import { FactureDetail } from "@/components/facturation/facture-detail";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-700",
  en_attente: "bg-yellow-100 text-yellow-800",
  validee: "bg-blue-100 text-blue-800",
  envoyee: "bg-purple-100 text-purple-800",
  payee_partiellement: "bg-emerald-100 text-emerald-700",
  payee: "bg-green-100 text-green-800",
  en_retard: "bg-red-100 text-red-800",
  annulee: "bg-gray-100 text-gray-500",
};

function formatMontant(montant: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

function getStatutLabel(statut: string) {
  return STATUTS_FACTURE.find((s) => s.value === statut)?.label ?? statut;
}

export default function FacturationPage() {
  const [activeTab, setActiveTab] = useState("factures");
  const [statutFilter, setStatutFilter] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFactureId, setSelectedFactureId] = useState<Id<"factures"> | null>(null);

  const convexMe = useQuery(api.users.me, DEMO_MODE ? "skip" : {});
  const convexStats = useQuery(api.factures.stats, DEMO_MODE ? "skip" : {});
  const convexFactures = useQuery(api.factures.list, DEMO_MODE ? "skip" : (statutFilter ? { statut: statutFilter } : {}));
  const convexClients = useQuery(api.clients.list, DEMO_MODE ? "skip" : {});

  const me = DEMO_MODE ? DEMO_USER : convexMe;
  const addedDemoFactures = useDemoAddedFactures();
  const addedDemoClients = useDemoAddedClients();

  const allDemoFactures = DEMO_MODE
    ? [...addedDemoFactures, ...DEMO_FACTURES]
    : [];

  // Stats recalculées en mode démo pour inclure les factures ajoutées
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
        const tauxRecouvrement = emis > 0 ? Math.round((encaisse / emis) * 100) : 0;
        return {
          emis,
          encaisse,
          impaye,
          tauxRecouvrement,
          totalMois: emis,
          facturesAEmettre: allDemoFactures.filter((f: any) => f.statut === "brouillon").length,
          relancesEnCours: allDemoFactures.filter((f: any) => f.statut === "en_retard").length,
        };
      })()
    : null;

  const stats = DEMO_MODE ? computedDemoStats : convexStats;

  // Filtrage par statut côté client en mode démo
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground">
            Gestion des factures, temps pass&#233;s et reporting financier
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 size-4" />
          Nouvelle facture
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="temps">Temps pass&#233;s</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>

        {/* ── Tab Factures ─────────────────────────────────── */}
        <TabsContent value="factures">
          <div className="flex flex-col gap-6">
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      CA du mois (&#233;mis)
                    </CardTitle>
                    <Euro className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stats ? formatMontant(stats.emis) : "..."}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Encaiss&#233;
                    </CardTitle>
                    <TrendingUp className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stats ? formatMontant(stats.encaisse) : "..."}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Impay&#233;
                    </CardTitle>
                    <AlertTriangle className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {stats ? formatMontant(stats.impaye) : "..."}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taux recouvrement
                    </CardTitle>
                    <Percent className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stats ? `${stats.tauxRecouvrement}%` : "..."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={statutFilter ?? ""}
                onValueChange={(val) => setStatutFilter(val || null)}
              >
                <SelectTrigger>
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
                <SelectTrigger>
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
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Num&#233;ro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date &#233;mission</TableHead>
                      <TableHead>&#201;ch&#233;ance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFactures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Aucune facture trouv&#233;e
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFactures.map((facture) => (
                        <TableRow
                          key={facture._id}
                          className="cursor-pointer"
                          onClick={() => setSelectedFactureId(facture._id)}
                        >
                          <TableCell className="font-medium">{facture.numero}</TableCell>
                          <TableCell>{clientsMap.get(facture.clientId) ?? "—"}</TableCell>
                          <TableCell>{facture.dossierId ? "Oui" : "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {facture.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(facture.montantTTC)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={STATUT_COLORS[facture.statut] ?? ""}
                              variant="outline"
                            >
                              {getStatutLabel(facture.statut)}
                            </Badge>
                          </TableCell>
                          <TableCell>{facture.dateEmission}</TableCell>
                          <TableCell>{facture.dateEcheance}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab Temps pass&#233;s ──────────────────────────── */}
        <TabsContent value="temps">
          <Card>
            <CardHeader>
              <CardTitle>Temps pass&#233;s</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Le suivi des temps pass&#233;s par dossier sera disponible prochainement.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Reporting ─────────────────────────────────── */}
        <TabsContent value="reporting">
          <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CA mensuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stats ? formatMontant(stats.emis) : "..."}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CA trimestriel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-muted-foreground">
                    &#192; venir
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CA annuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-muted-foreground">
                    &#192; venir
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top 5 clients */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 clients par CA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Le classement des clients par chiffre d&apos;affaires sera disponible prochainement.
                </p>
              </CardContent>
            </Card>

            {/* Factures en retard */}
            <Card>
              <CardHeader>
                <CardTitle>Factures en retard</CardTitle>
              </CardHeader>
              <CardContent>
                {(factures ?? []).filter((f) => f.statut === "en_retard").length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucune facture en retard.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Num&#233;ro</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead>&#201;ch&#233;ance</TableHead>
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
                            <TableCell className="font-medium">{f.numero}</TableCell>
                            <TableCell>{clientsMap.get(f.clientId) ?? "—"}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatMontant(f.montantTTC)}
                            </TableCell>
                            <TableCell>{f.dateEcheance}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
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
            <DialogTitle>D&#233;tail de la facture</DialogTitle>
          </DialogHeader>
          {selectedFactureId && (
            <FactureDetail factureId={selectedFactureId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
