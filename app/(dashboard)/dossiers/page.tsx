"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SPECIALITES, STATUTS_CORPORATE, STATUTS_LITIGE, STATUTS_FISCAL } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER, DEMO_DOSSIERS, DEMO_USERS, DEMO_CLIENTS } from "@/lib/demo-data";
import { useDemoAddedClients, useDemoAddedDossiers } from "@/lib/demo-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DossierForm } from "@/components/dossiers/dossier-form";
import { Plus, Search, LayoutGrid, TableIcon } from "lucide-react";

const ALL_STATUTS = [
  ...STATUTS_CORPORATE,
  ...STATUTS_LITIGE,
  ...STATUTS_FISCAL,
];
const uniqueStatuts = ALL_STATUTS.filter(
  (s, i, arr) => arr.findIndex((x) => x.value === s.value) === i
);

const specialiteBadgeClass: Record<string, string> = {
  corporate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  litige: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  fiscal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function statutLabel(value: string): string {
  const found = ALL_STATUTS.find((s) => s.value === value);
  return found ? found.label : value;
}

function statutBadgeClass(value: string): string {
  if (value === "clos") return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  if (value === "ouvert") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (value.includes("attente")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
}

export default function DossiersPage() {
  const [search, setSearch] = useState("");
  const [specialite, setSpecialite] = useState<string>("");
  const [statut, setStatut] = useState<string>("");
  const [avocatResponsableId, setAvocatResponsableId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const convexUsers = useQuery(api.users.list, DEMO_MODE ? "skip" : {});
  const convexClients = useQuery(api.clients.list, DEMO_MODE ? "skip" : {});
  const convexDossiers = useQuery(api.dossiers.list, DEMO_MODE ? "skip" : {
    search: search || undefined,
    specialite: specialite || undefined,
    statut: statut || undefined,
    avocatResponsableId: avocatResponsableId
      ? (avocatResponsableId as Id<"users">)
      : undefined,
  });

  const users = DEMO_MODE ? DEMO_USERS : convexUsers;
  const addedDemoClients = useDemoAddedClients();
  const addedDemoDossiers = useDemoAddedDossiers();
  const clients = DEMO_MODE
    ? [...addedDemoClients, ...DEMO_CLIENTS]
    : convexClients;
  const allDemoDossiers = DEMO_MODE
    ? [...addedDemoDossiers, ...DEMO_DOSSIERS]
    : [];

  // Filtrage côté client en mode démo
  const filteredDemoDossiers = DEMO_MODE
    ? allDemoDossiers.filter((d: any) => {
        if (search) {
          const s = search.toLowerCase();
          const matches =
            d.intitule?.toLowerCase().includes(s) ||
            d.reference?.toLowerCase().includes(s) ||
            d.description?.toLowerCase().includes(s);
          if (!matches) return false;
        }
        if (specialite && d.specialite !== specialite) return false;
        if (statut && d.statut !== statut) return false;
        if (avocatResponsableId && d.avocatResponsableId !== avocatResponsableId)
          return false;
        return true;
      })
    : [];

  const dossiers = DEMO_MODE ? filteredDemoDossiers : convexDossiers;

  const clientMap = new Map<string, string>(
    (clients ?? []).map((c: any) => [c._id, c.denomination])
  );
  const userMap = new Map<string, string>(
    (users ?? []).map((u: any) => [u._id, u.name])
  );

  // Get next echeance for each dossier is complex - we show a simplified version
  const kanbanStatuts = specialite === "litige"
    ? STATUTS_LITIGE
    : specialite === "fiscal"
      ? STATUTS_FISCAL
      : STATUTS_CORPORATE;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers</h1>
          <p className="text-muted-foreground">
            Gestion des dossiers du cabinet
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 size-4" />
                Nouveau dossier
              </Button>
            }
          />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau dossier</DialogTitle>
            </DialogHeader>
            <DossierForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un dossier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={specialite}
            onValueChange={(val) => setSpecialite(val ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Spécialité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes</SelectItem>
              {Object.entries(SPECIALITES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statut}
            onValueChange={(val) => setStatut(val ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {uniqueStatuts.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={avocatResponsableId}
            onValueChange={(val) => setAvocatResponsableId(val ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Avocat responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {(users ?? []).map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Views toggle */}
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">
            <TableIcon className="mr-1.5 size-4" />
            Tableau
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid className="mr-1.5 size-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        {/* Table view */}
        <TabsContent value="table">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Avocat responsable</TableHead>
                  <TableHead>Date d&apos;ouverture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossiers === undefined ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : dossiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun dossier trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  dossiers.map((dossier) => (
                    <TableRow key={dossier._id}>
                      <TableCell>
                        <Link
                          href={`/dossiers/${dossier._id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {dossier.reference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {clientMap.get(dossier.clientId) ?? "..."}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={specialiteBadgeClass[dossier.specialite] ?? ""}
                        >
                          {SPECIALITES[dossier.specialite as keyof typeof SPECIALITES]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {dossier.intitule}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statutBadgeClass(dossier.statut)}
                        >
                          {statutLabel(dossier.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userMap.get(dossier.avocatResponsableId) ?? "..."}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dossier.dateOuverture}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Kanban view */}
        <TabsContent value="kanban">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuts.map((col) => {
              const colDossiers = (dossiers ?? []).filter(
                (d) => d.statut === col.value
              );
              return (
                <div key={col.value} className="flex-shrink-0 w-72">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline" className={statutBadgeClass(col.value)}>
                      {col.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({colDossiers.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {colDossiers.map((dossier) => (
                      <Link
                        key={dossier._id}
                        href={`/dossiers/${dossier._id}`}
                      >
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-muted-foreground">
                                {dossier.reference}
                              </span>
                              <Badge
                                variant="secondary"
                                className={specialiteBadgeClass[dossier.specialite] ?? ""}
                              >
                                {SPECIALITES[dossier.specialite as keyof typeof SPECIALITES]}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <CardTitle className="text-sm mb-1">
                              {dossier.intitule}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {clientMap.get(dossier.clientId) ?? "..."}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {colDossiers.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Aucun dossier
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
