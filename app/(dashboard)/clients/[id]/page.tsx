"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SPECIALITES, STATUTS_FACTURE, STATUTS_PROPOSITION } from "@/lib/constants";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientForm } from "@/components/clients/client-form";
import { PencilIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id as Id<"clients">;

  const client = useQuery(api.clients.getById, { id: clientId });
  const users = useQuery(api.users.list, {});
  const contacts = useQuery(api.contacts.listByClient, { clientId });
  const dossiers = useQuery(api.dossiers.list, { clientId });
  const propositions = useQuery(api.propositions.list, { clientId });
  const factures = useQuery(api.factures.list, { clientId });
  const activites = useQuery(api.activites.list, { clientId });
  const me = useQuery(api.users.me);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  if (client === undefined) {
    return (
      <p className="text-muted-foreground py-8 text-center">Chargement...</p>
    );
  }

  if (client === null) {
    return (
      <p className="text-destructive py-8 text-center">Client introuvable.</p>
    );
  }

  const avocatReferent = users?.find((u: any) => u._id === client.avocatReferentId);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        breadcrumbs={[
          { label: "Clients", href: "/clients" },
          { label: client.denomination },
        ]}
        title={client.denomination}
        subtitle={
          (client.type === "personne_morale"
            ? "Personne morale"
            : "Personne physique") +
          (client.formeJuridique ? ` — ${client.formeJuridique}` : "")
        }
        actions={
          <>
            <StatusBadge
              kind="client-actif"
              value={Boolean(client.isActive)}
            />
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline">
                    <PencilIcon data-icon="inline-start" />
                    Modifier
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Modifier le client</DialogTitle>
                </DialogHeader>
                <ClientForm
                  client={client}
                  onClose={() => setEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="informations">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
          <TabsTrigger value="propositions">Propositions</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* === Informations === */}
        <TabsContent value="informations">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <InfoItem label="Dénomination" value={client.denomination} />
                {client.type === "personne_physique" && (
                  <>
                    <InfoItem label="Prénom" value={client.prenom} />
                    <InfoItem label="Nom" value={client.nom} />
                  </>
                )}
                <InfoItem label="Forme juridique" value={client.formeJuridique} />
                <InfoItem label="SIREN" value={client.siren} />
                <InfoItem label="SIRET" value={client.siret} />
                <InfoItem label="Siège social" value={client.siegeSocial} />
                <InfoItem label="Capital social" value={client.capitalSocial} />
                <InfoItem label="Dirigeants" value={client.dirigeants} />
                <InfoItem
                  label="Secteur d'activité"
                  value={client.secteurActivite}
                />
                <InfoItem label="Date de création" value={client.dateCreation} />
                <InfoItem
                  label="Avocat référent"
                  value={avocatReferent?.name}
                />
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    Spécialités
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {client.specialites?.length ? (
                      client.specialites.map((s) => (
                        <Badge key={s} variant="secondary">
                          {SPECIALITES[s]}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {client.tags?.length ? (
                      client.tags.map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </dl>
              {client.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Contacts === */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <div className="flex justify-end">
                <Dialog
                  open={contactDialogOpen}
                  onOpenChange={setContactDialogOpen}
                >
                  <DialogTrigger
                    render={
                      <Button size="sm">
                        <PlusIcon data-icon="inline-start" />
                        Ajouter un contact
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau contact</DialogTitle>
                    </DialogHeader>
                    <ContactForm
                      clientId={clientId}
                      onClose={() => setContactDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contacts === undefined ? (
                <p className="text-muted-foreground text-center py-4">
                  Chargement...
                </p>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun contact.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-medium">
                          {c.prenom} {c.nom}
                        </TableCell>
                        <TableCell>{c.poste ?? "—"}</TableCell>
                        <TableCell>{c.telephone ?? "—"}</TableCell>
                        <TableCell>{c.email ?? "—"}</TableCell>
                        <TableCell>
                          {c.isPrincipal && (
                            <Badge variant="default">Principal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Dossiers === */}
        <TabsContent value="dossiers">
          <Card>
            <CardHeader>
              <CardTitle>Dossiers</CardTitle>
            </CardHeader>
            <CardContent>
              {dossiers === undefined ? (
                <p className="text-muted-foreground text-center py-4">
                  Chargement...
                </p>
              ) : dossiers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun dossier.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Intitulé</TableHead>
                      <TableHead>Spécialité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date ouverture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.map((d) => (
                      <TableRow key={d._id}>
                        <TableCell>
                          <Link
                            href={`/dossiers/${d._id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {d.reference}
                          </Link>
                        </TableCell>
                        <TableCell>{d.intitule}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {SPECIALITES[d.specialite]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{d.statut}</Badge>
                        </TableCell>
                        <TableCell>{d.dateOuverture}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Propositions === */}
        <TabsContent value="propositions">
          <Card>
            <CardHeader>
              <CardTitle>Propositions commerciales</CardTitle>
            </CardHeader>
            <CardContent>
              {propositions === undefined ? (
                <p className="text-muted-foreground text-center py-4">
                  Chargement...
                </p>
              ) : propositions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune proposition.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Spécialité</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propositions.map((p) => {
                      const statutLabel =
                        STATUTS_PROPOSITION.find((s) => s.value === p.statut)
                          ?.label ?? p.statut;
                      return (
                        <TableRow key={p._id}>
                          <TableCell className="max-w-[300px] truncate">
                            {p.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {SPECIALITES[p.specialite]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {p.modeFacturation === "forfait"
                              ? "Forfait"
                              : "Temps passé"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{statutLabel}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Factures === */}
        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle>Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {factures === undefined ? (
                <p className="text-muted-foreground text-center py-4">
                  Chargement...
                </p>
              ) : factures.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune facture.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Échéance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((f) => {
                      const statutLabel =
                        STATUTS_FACTURE.find((s) => s.value === f.statut)
                          ?.label ?? f.statut;
                      return (
                        <TableRow key={f._id}>
                          <TableCell className="font-medium">
                            {f.numero}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {f.description}
                          </TableCell>
                          <TableCell>
                            {f.montantTTC.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{statutLabel}</Badge>
                          </TableCell>
                          <TableCell>{f.dateEcheance}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Historique === */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              {activites === undefined ? (
                <p className="text-muted-foreground text-center py-4">
                  Chargement...
                </p>
              ) : activites.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune activité enregistrée.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {activites.map((a) => {
                    const auteur = users?.find(
                      (u) => u._id === a.utilisateurId
                    );
                    return (
                      <div
                        key={a._id}
                        className="flex items-start gap-3 border-b pb-3 last:border-b-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm">{a.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {auteur?.name ?? "Utilisateur inconnu"} &middot;{" "}
                            {new Date(a._creationTime).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {a.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Helper components ── */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function ContactForm({
  clientId,
  onClose,
}: {
  clientId: Id<"clients">;
  onClose: () => void;
}) {
  const createContact = useMutation(api.contacts.create);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [poste, setPoste] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      toast.error("Le nom et le prénom sont requis.");
      return;
    }
    setLoading(true);
    try {
      await createContact({
        clientId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        poste: poste || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        isPrincipal,
      });
      toast.success("Contact ajouté avec succès.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Prénom *</Label>
          <Input
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Nom *</Label>
          <Input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Poste</Label>
        <Input
          value={poste}
          onChange={(e) => setPoste(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Téléphone</Label>
          <Input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPrincipal"
          checked={isPrincipal}
          onChange={(e) => setIsPrincipal(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="isPrincipal">Contact principal</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
