"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SPECIALITES } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER, DEMO_CLIENTS, DEMO_USERS } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
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
import { PlusIcon, SearchIcon } from "lucide-react";

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
  const convexClients = useQuery(api.clients.list, DEMO_MODE ? "skip" : {
    search: search || undefined,
    specialite: specialite || undefined,
    avocatReferentId: avocatReferentId || undefined,
    isActive: true,
  });

  const me = DEMO_MODE ? DEMO_USER : convexMe;
  const users = DEMO_MODE ? DEMO_USERS : convexUsers;
  const clients = DEMO_MODE ? DEMO_CLIENTS : convexClients;

  const canCreate =
    me && CAN_CREATE_ROLES.includes(me.role as (typeof CAN_CREATE_ROLES)[number]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        {canCreate && (
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
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
          </div>

          {clients === undefined ? (
            <p className="text-muted-foreground py-8 text-center">
              Chargement...
            </p>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucun client trouvé.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dénomination</TableHead>
                  <TableHead>Forme juridique</TableHead>
                  <TableHead>SIREN</TableHead>
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
                          className="font-medium text-primary hover:underline"
                        >
                          {client.denomination}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {client.formeJuridique ?? "—"}
                      </TableCell>
                      <TableCell>{client.siren ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {client.specialites?.map((s) => (
                            <Badge key={s} variant="secondary">
                              {SPECIALITES[s]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{avocat?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={client.isActive ? "default" : "outline"}
                        >
                          {client.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
