"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SPECIALITES } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER, DEMO_CLIENTS, DEMO_USERS } from "@/lib/demo-data";
import { useDemoAddedClients } from "@/lib/demo-store";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PlusIcon, SearchIcon, Users } from "lucide-react";

const CAN_CREATE_ROLES = ["associe", "collaborateur", "secretaire"] as const;

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [specialite, setSpecialite] = useState<string | undefined>(undefined);
  const [avocatReferentId, setAvocatReferentId] = useState<
    Id<"users"> | undefined
  >(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const convexMe = useQuery(api.users.me, DEMO_MODE ? "skip" : {});
  const convexUsers = useQuery(api.users.list, DEMO_MODE ? "skip" : {});
  const convexClients = useQuery(
    api.clients.list,
    DEMO_MODE
      ? "skip"
      : {
          search: search || undefined,
          specialite: specialite || undefined,
          avocatReferentId: avocatReferentId || undefined,
          isActive: true,
        }
  );

  const me = DEMO_MODE ? DEMO_USER : convexMe;
  const users = DEMO_MODE ? DEMO_USERS : convexUsers;
  const addedDemoClients = useDemoAddedClients();
  const allDemoClients = DEMO_MODE
    ? [...addedDemoClients, ...DEMO_CLIENTS]
    : [];

  const filteredDemoClients = DEMO_MODE
    ? allDemoClients.filter((c: any) => {
        if (search) {
          const s = search.toLowerCase();
          const matches =
            c.denomination?.toLowerCase().includes(s) ||
            c.siren?.toLowerCase().includes(s) ||
            c.siret?.toLowerCase().includes(s);
          if (!matches) return false;
        }
        if (specialite && !c.specialites?.includes(specialite)) return false;
        if (avocatReferentId && c.avocatReferentId !== avocatReferentId)
          return false;
        return true;
      })
    : [];

  const clients = DEMO_MODE ? filteredDemoClients : convexClients;

  const canCreate =
    me && CAN_CREATE_ROLES.includes(me.role as (typeof CAN_CREATE_ROLES)[number]);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        title="Clients"
        subtitle="Base de clients actifs et inactifs, avec leurs spécialités et avocats référents."
        actions={
          canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Nouveau client
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouveau client</DialogTitle>
                </DialogHeader>
                <ClientForm onClose={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )
        }
      />

      <FilterToolbar>
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-text-subtle" />
          <Input
            placeholder="Rechercher un client, SIREN, SIRET…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-transparent bg-transparent pl-8 focus-visible:border-ring"
          />
        </div>
        <span aria-hidden className="hidden h-5 w-px bg-border-subtle sm:block" />
        <Select
          value={specialite ?? ""}
          onValueChange={(val: any) =>
            setSpecialite(val === "" || val === null ? undefined : val)
          }
        >
          <SelectTrigger className="w-[180px]">
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
          value={avocatReferentId ?? ""}
          onValueChange={(val) =>
            setAvocatReferentId(
              val === "" ? undefined : (val as Id<"users">)
            )
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Avocat référent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous</SelectItem>
            {users
              ?.filter((u) => u.isActive)
              .map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </FilterToolbar>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {clients === undefined ? (
          <p className="py-16 text-center text-sm text-text-muted">
            Chargement…
          </p>
        ) : clients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="Aucun client trouvé"
              description="Aucun client ne correspond à vos filtres. Ajustez la recherche ou créez un nouveau client."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b-border-subtle hover:bg-transparent">
                <TableHead>Dénomination</TableHead>
                <TableHead>Forme juridique</TableHead>
                <TableHead className="font-mono text-[0.7rem]">SIREN</TableHead>
                <TableHead>Spécialités</TableHead>
                <TableHead>Avocat référent</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const avocat = users?.find(
                  (u) => u._id === client.avocatReferentId
                );
                return (
                  <TableRow key={client._id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client._id}`}
                        className="font-medium text-text-strong transition-colors hover:text-gold"
                      >
                        {client.denomination}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-muted">
                      {client.formeJuridique ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {client.siren ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.specialites?.map((s: string) => (
                          <StatusBadge
                            key={s}
                            kind="specialite"
                            value={s}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-text-default">
                      {avocat?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        kind="client-actif"
                        value={Boolean(client.isActive)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
