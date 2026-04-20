"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  SPECIALITES,
  STATUTS_CORPORATE,
  STATUTS_LITIGE,
  STATUTS_FISCAL,
} from "@/lib/constants";
import {
  DEMO_MODE,
  DEMO_DOSSIERS,
  DEMO_USERS,
  DEMO_CLIENTS,
} from "@/lib/demo-data";
import { useDemoAddedClients, useDemoAddedDossiers } from "@/lib/demo-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PageHeader } from "@/components/shared/page-header";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Search, LayoutGrid, TableIcon, FolderOpen } from "lucide-react";

const ALL_STATUTS = [
  ...STATUTS_CORPORATE,
  ...STATUTS_LITIGE,
  ...STATUTS_FISCAL,
];
const uniqueStatuts = ALL_STATUTS.filter(
  (s, i, arr) => arr.findIndex((x) => x.value === s.value) === i
);

export default function DossiersPage() {
  const [search, setSearch] = useState("");
  const [specialite, setSpecialite] = useState<string>("");
  const [statut, setStatut] = useState<string>("");
  const [avocatResponsableId, setAvocatResponsableId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const convexUsers = useQuery(api.users.list, DEMO_MODE ? "skip" : {});
  const convexClients = useQuery(api.clients.list, DEMO_MODE ? "skip" : {});
  const convexDossiers = useQuery(
    api.dossiers.list,
    DEMO_MODE
      ? "skip"
      : {
          search: search || undefined,
          specialite: specialite || undefined,
          statut: statut || undefined,
          avocatResponsableId: avocatResponsableId
            ? (avocatResponsableId as Id<"users">)
            : undefined,
        }
  );

  const users = DEMO_MODE ? DEMO_USERS : convexUsers;
  const addedDemoClients = useDemoAddedClients();
  const addedDemoDossiers = useDemoAddedDossiers();
  const clients = DEMO_MODE
    ? [...addedDemoClients, ...DEMO_CLIENTS]
    : convexClients;
  const allDemoDossiers = DEMO_MODE
    ? [...addedDemoDossiers, ...DEMO_DOSSIERS]
    : [];

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

  const kanbanStatuts =
    specialite === "litige"
      ? STATUTS_LITIGE
      : specialite === "fiscal"
        ? STATUTS_FISCAL
        : STATUTS_CORPORATE;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        title="Dossiers"
        subtitle="Tous les dossiers ouverts et archivés du cabinet, par spécialité et statut."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus data-icon="inline-start" />
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
        }
      />

      <FilterToolbar>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <Input
            placeholder="Rechercher un dossier, une référence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-transparent bg-transparent pl-8 focus-visible:border-ring"
          />
        </div>
        <span aria-hidden className="hidden h-5 w-px bg-border-subtle sm:block" />
        <Select value={specialite} onValueChange={(val) => setSpecialite(val ?? "")}>
          <SelectTrigger className="w-[170px]">
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
        <Select value={statut} onValueChange={(val) => setStatut(val ?? "")}>
          <SelectTrigger className="w-[170px]">
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
          <SelectTrigger className="w-[190px]">
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
      </FilterToolbar>

      <Tabs defaultValue="table" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="table">
            <TableIcon className="mr-1.5 size-3.5" />
            Tableau
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid className="mr-1.5 size-3.5" />
            Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
            {dossiers === undefined ? (
              <p className="py-16 text-center text-sm text-text-muted">
                Chargement…
              </p>
            ) : dossiers.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FolderOpen}
                  title="Aucun dossier trouvé"
                  description="Aucun dossier ne correspond à vos filtres."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border-subtle hover:bg-transparent">
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Avocat responsable</TableHead>
                    <TableHead>Ouverture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((dossier) => (
                    <TableRow key={dossier._id}>
                      <TableCell>
                        <Link
                          href={`/dossiers/${dossier._id}`}
                          className="font-mono text-xs font-medium text-text-strong transition-colors hover:text-gold"
                        >
                          {dossier.reference}
                        </Link>
                      </TableCell>
                      <TableCell className="text-text-default">
                        {clientMap.get(dossier.clientId) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="specialite"
                          value={dossier.specialite}
                        />
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-text-default">
                        {dossier.intitule}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="dossier-statut"
                          value={dossier.statut}
                        />
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {userMap.get(dossier.avocatResponsableId) ?? "—"}
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {dossier.dateOuverture}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuts.map((col) => {
              const colDossiers = (dossiers ?? []).filter(
                (d) => d.statut === col.value
              );
              return (
                <div key={col.value} className="w-72 flex-shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge kind="dossier-statut" value={col.value} />
                    <span className="text-xs font-medium text-text-subtle tabular-nums">
                      {colDossiers.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {colDossiers.map((dossier) => (
                      <Link
                        key={dossier._id}
                        href={`/dossiers/${dossier._id}`}
                        className="group flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-3.5 transition-colors hover:border-gold/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[0.7rem] font-medium text-text-muted">
                            {dossier.reference}
                          </span>
                          <StatusBadge
                            kind="specialite"
                            value={dossier.specialite}
                          />
                        </div>
                        <p className="text-sm font-medium text-text-strong line-clamp-2">
                          {dossier.intitule}
                        </p>
                        <p className="text-xs text-text-subtle">
                          {clientMap.get(dossier.clientId) ?? "—"}
                        </p>
                      </Link>
                    ))}
                    {colDossiers.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border-subtle px-3 py-4 text-center text-xs text-text-subtle">
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
