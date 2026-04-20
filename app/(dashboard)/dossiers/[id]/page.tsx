"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  SPECIALITES,
  STATUTS_CORPORATE,
  STATUTS_LITIGE,
  STATUTS_FISCAL,
  TYPES_OPERATIONS_CORPORATE,
  TYPES_PROCEDURES_LITIGE,
  TYPES_MISSIONS_FISCAL,
  CATEGORIES_DOCUMENTS,
} from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
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
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ChevronDown,
  Upload,
  Plus,
  Lock,
  Unlock,
  Check,
  FileText,
  Clock,
  AlertCircle,
  Brain,
  Edit,
} from "lucide-react";

// --- Helpers ---

const validationBadgeClass: Record<string, string> = {
  a_relire: "bg-status-warning text-status-warning-fg ring-1 ring-inset ring-status-warning-fg/10",
  relu: "bg-status-info text-status-info-fg ring-1 ring-inset ring-status-info-fg/10",
  valide: "bg-status-success text-status-success-fg ring-1 ring-inset ring-status-success-fg/10",
};

const validationLabels: Record<string, string> = {
  a_relire: "A relire",
  relu: "Relu",
  valide: "Validé",
};

function getStatuts(specialite: string) {
  switch (specialite) {
    case "litige":
      return STATUTS_LITIGE;
    case "fiscal":
      return STATUTS_FISCAL;
    default:
      return STATUTS_CORPORATE;
  }
}

function statutLabel(value: string, specialite: string): string {
  const statuts = getStatuts(specialite);
  const found = statuts.find((s) => s.value === value);
  return found ? found.label : value;
}

function echeanceColor(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 48) return "text-red-600 dark:text-red-400";
  if (diffHours < 7 * 24) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

// --- Main Page ---

export default function DossierDetailPage() {
  const params = useParams<{ id: string }>();
  const dossierId = params.id as Id<"dossiers">;

  const dossier = useQuery(api.dossiers.getById, { id: dossierId });
  const users = useQuery(api.users.list, {});
  const clients = useQuery(api.clients.list, {});

  const updateStatut = useMutation(api.dossiers.updateStatut);

  const client = clients?.find((c) => c._id === dossier?.clientId);
  const userMap = new Map<string, string>((users ?? []).map((u: any) => [u._id, u.name]));

  if (dossier === undefined) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Chargement du dossier...
      </div>
    );
  }

  if (dossier === null) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Dossier introuvable
      </div>
    );
  }

  const statuts = getStatuts(dossier.specialite);

  async function handleStatutChange(newStatut: string) {
    try {
      await updateStatut({ id: dossierId, statut: newStatut });
      toast.success("Statut mis à jour");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      );
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Dossiers", href: "/dossiers" },
          { label: dossier.reference },
        ]}
        eyebrow={dossier.reference}
        title={dossier.intitule}
        subtitle={`Client : ${client?.denomination ?? "…"} — Avocat responsable : ${userMap.get(dossier.avocatResponsableId) ?? "…"}`}
        actions={
          <>
            <StatusBadge kind="specialite" value={dossier.specialite} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline">
                    {statutLabel(dossier.statut, dossier.specialite)}
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent>
                {statuts.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => handleStatutChange(s.value)}
                  >
                    {s.value === dossier.statut && (
                      <Check className="mr-2 size-4" />
                    )}
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="informations">
        <TabsList variant="line">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="echeances">Échéances</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="temps">Temps passés</TabsTrigger>
          <TabsTrigger value="specifique">Spécifique</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <TabInformations
            dossier={dossier}
            client={client}
            userMap={userMap}
            users={users ?? []}
          />
        </TabsContent>

        <TabsContent value="documents">
          <TabDocuments dossierId={dossierId} userMap={userMap} />
        </TabsContent>

        <TabsContent value="echeances">
          <TabEcheances dossierId={dossierId} userMap={userMap} users={users ?? []} />
        </TabsContent>

        <TabsContent value="notes">
          <TabNotes dossierId={dossierId} userMap={userMap} users={users ?? []} />
        </TabsContent>

        <TabsContent value="temps">
          <TabTempsPasses dossierId={dossierId} userMap={userMap} />
        </TabsContent>

        <TabsContent value="specifique">
          <TabSpecifique dossierId={dossierId} specialite={dossier.specialite} />
        </TabsContent>

        <TabsContent value="ia">
          <TabIA dossierId={dossierId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ──────────────── Tab: Informations ────────────────

function TabInformations({
  dossier,
  client,
  userMap,
  users,
}: {
  dossier: NonNullable<ReturnType<typeof useQuery<typeof api.dossiers.getById>>>;
  client: { denomination: string } | undefined | null;
  userMap: Map<string, string>;
  users: Array<{ _id: Id<"users">; name: string }>;
}) {
  const updateDossier = useMutation(api.dossiers.update);
  const [editing, setEditing] = useState(false);
  const [intitule, setIntitule] = useState(dossier.intitule);
  const [description, setDescription] = useState(dossier.description ?? "");

  async function handleSave() {
    try {
      await updateDossier({
        id: dossier._id,
        intitule,
        description: description || undefined,
      });
      toast.success("Dossier mis à jour");
      setEditing(false);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informations générales</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            <Edit className="mr-1 size-4" />
            {editing ? "Annuler" : "Modifier"}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Référence</span>
            <span className="font-mono">{dossier.reference}</span>
            <span className="text-muted-foreground">Client</span>
            <span>{client?.denomination ?? "..."}</span>
            <span className="text-muted-foreground">Spécialité</span>
            <span>{SPECIALITES[dossier.specialite as keyof typeof SPECIALITES]}</span>
            <span className="text-muted-foreground">Date d&apos;ouverture</span>
            <span>{dossier.dateOuverture}</span>
            {dossier.dateCloture && (
              <>
                <span className="text-muted-foreground">Date de clôture</span>
                <span>{dossier.dateCloture}</span>
              </>
            )}
            <span className="text-muted-foreground">Montant honoraires</span>
            <span>
              {dossier.montantHonoraires
                ? `${dossier.montantHonoraires.toLocaleString("fr-FR")} €`
                : "Non défini"}
            </span>
          </div>
          {editing && (
            <div className="grid gap-3 pt-3 border-t">
              <div className="grid gap-2">
                <Label>Intitulé</Label>
                <Input
                  value={intitule}
                  onChange={(e) => setIntitule(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button size="sm" onClick={handleSave}>
                Enregistrer
              </Button>
            </div>
          )}
          {!editing && dossier.description && (
            <div className="pt-3 border-t">
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="text-sm mt-1">{dossier.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Avocat responsable : </span>
            <span className="font-medium">
              {userMap.get(dossier.avocatResponsableId) ?? "..."}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Collaborateurs : </span>
            {dossier.collaborateursIds.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {dossier.collaborateursIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {userMap.get(id) ?? "..."}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Aucun</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parties adverses */}
      {dossier.partiesAdverses && dossier.partiesAdverses.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Parties adverses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dénomination</TableHead>
                  <TableHead>SIREN</TableHead>
                  <TableHead>Avocat</TableHead>
                  <TableHead>Coordonnées</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossier.partiesAdverses.map((pa, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{pa.denomination}</TableCell>
                    <TableCell>{pa.siren ?? "-"}</TableCell>
                    <TableCell>{pa.avocat ?? "-"}</TableCell>
                    <TableCell>{pa.coordonnees ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────── Tab: Documents ────────────────

function TabDocuments({
  dossierId,
  userMap,
}: {
  dossierId: Id<"dossiers">;
  userMap: Map<string, string>;
}) {
  const documents = useQuery(api.documents.listByDossier, { dossierId });
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const updateValidation = useMutation(api.documents.updateValidation);
  const toggleLock = useMutation(api.documents.toggleLock);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadNom, setUploadNom] = useState("");
  const [uploadCategorie, setUploadCategorie] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!selectedFile || !uploadNom || !uploadCategorie) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();

      await createDocument({
        dossierId,
        nom: uploadNom,
        categorie: uploadCategorie,
        storageId,
        taille: selectedFile.size,
        mimeType: selectedFile.type,
      });

      toast.success("Document téléversé");
      setUploadDialogOpen(false);
      setUploadNom("");
      setUploadCategorie("");
      setSelectedFile(null);
    } catch (error) {
      toast.error("Erreur lors du téléversement");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents (GED)</CardTitle>
        <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 size-4" />
          Téléverser
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents === undefined ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Aucun document
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      {doc.nom}
                      {doc.isIAGenerated && (
                        <Badge variant="secondary" className="text-xs">
                          IA
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{doc.categorie}</TableCell>
                  <TableCell>v{doc.version}</TableCell>
                  <TableCell>{userMap.get(doc.auteurId) ?? "..."}</TableCell>
                  <TableCell>
                    <Select
                      value={doc.statutValidation}
                      onValueChange={(val) => {
                        if (val) {
                          updateValidation({
                            id: doc._id,
                            statutValidation: val as "a_relire" | "relu" | "valide",
                          });
                        }
                      }}
                    >
                      <SelectTrigger size="sm">
                        <Badge
                          variant="secondary"
                          className={validationBadgeClass[doc.statutValidation] ?? ""}
                        >
                          {validationLabels[doc.statutValidation] ?? doc.statutValidation}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_relire">A relire</SelectItem>
                        <SelectItem value="relu">Relu</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleLock({ id: doc._id })}
                      title={doc.isLocked ? "Déverrouiller" : "Verrouiller"}
                    >
                      {doc.isLocked ? (
                        <Lock className="size-4 text-amber-500" />
                      ) : (
                        <Unlock className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Téléverser un document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom du document *</Label>
              <Input
                value={uploadNom}
                onChange={(e) => setUploadNom(e.target.value)}
                placeholder="Nom du document"
              />
            </div>
            <div className="grid gap-2">
              <Label>Catégorie *</Label>
              <Select value={uploadCategorie} onValueChange={(val) => setUploadCategorie(val ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_DOCUMENTS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fichier *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Téléversement..." : "Téléverser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────── Tab: Echeances ────────────────

function TabEcheances({
  dossierId,
  userMap,
  users,
}: {
  dossierId: Id<"dossiers">;
  userMap: Map<string, string>;
  users: Array<{ _id: Id<"users">; name: string }>;
}) {
  const echeances = useQuery(api.echeances.list, { dossierId });
  const createEcheance = useMutation(api.echeances.create);
  const updateStatut = useMutation(api.echeances.updateStatut);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [type, setType] = useState<string>("");

  async function handleCreate() {
    if (!description || !date || !responsableId || !type) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    try {
      await createEcheance({
        dossierId,
        description,
        date,
        responsableId: responsableId as Id<"users">,
        type: type as "procedurale" | "fiscale" | "administrative" | "ag",
      });
      toast.success("Échéance ajoutée");
      setDialogOpen(false);
      setDescription("");
      setDate("");
      setResponsableId("");
      setType("");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Échéances</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {echeances === undefined ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : echeances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Aucune échéance
                </TableCell>
              </TableRow>
            ) : (
              echeances.map((ech) => (
                <TableRow key={ech._id}>
                  <TableCell
                    className={`font-medium ${ech.statut !== "traitee" ? echeanceColor(ech.date) : "text-muted-foreground"}`}
                  >
                    <div className="flex items-center gap-2">
                      {ech.statut !== "traitee" && new Date(ech.date) < new Date() && (
                        <AlertCircle className="size-4 text-red-500" />
                      )}
                      {ech.date}
                    </div>
                  </TableCell>
                  <TableCell>{ech.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ech.type}</Badge>
                  </TableCell>
                  <TableCell>{userMap.get(ech.responsableId) ?? "..."}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        ech.statut === "traitee"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : ech.statut === "en_retard"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : ""
                      }
                    >
                      {ech.statut === "traitee"
                        ? "Traitée"
                        : ech.statut === "en_retard"
                          ? "En retard"
                          : "A venir"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ech.statut !== "traitee" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateStatut({ id: ech._id, statut: "traitee" })
                        }
                      >
                        <Check className="mr-1 size-4" />
                        Traiter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une échéance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={(val) => setType(val ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedurale">Procédurale</SelectItem>
                  <SelectItem value="fiscale">Fiscale</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="ag">AG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Responsable *</Label>
              <Select value={responsableId} onValueChange={(val) => setResponsableId(val ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────── Tab: Notes ────────────────

function TabNotes({
  dossierId,
  userMap,
  users,
}: {
  dossierId: Id<"dossiers">;
  userMap: Map<string, string>;
  users: Array<{ _id: Id<"users">; name: string }>;
}) {
  const notes = useQuery(api.notes.listByDossier, { dossierId });
  const createNote = useMutation(api.notes.create);
  const [contenu, setContenu] = useState("");

  async function handleAdd() {
    if (!contenu.trim()) return;

    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentionNames = [...contenu.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());
    const mentionIds = (users ?? [])
      .filter((u) => mentionNames.some((n) => u.name.toLowerCase().includes(n)))
      .map((u) => u._id);

    try {
      await createNote({
        dossierId,
        contenu,
        mentions: mentionIds.length > 0 ? mentionIds : undefined,
      });
      setContenu("");
      toast.success("Note ajoutée");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>
          Utilisez @nom pour mentionner un collaborateur
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Ajouter une note..."
            rows={3}
          />
          <Button size="sm" onClick={handleAdd} className="w-fit">
            Ajouter la note
          </Button>
        </div>

        <ScrollArea className="max-h-[500px]">
          <div className="flex flex-col gap-3">
            {notes === undefined ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : notes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune note</p>
            ) : (
              [...notes].reverse().map((note) => (
                <div key={note._id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {userMap.get(note.auteurId) ?? "..."}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note._creationTime).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.contenu}</p>
                  {note.mentions && note.mentions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.mentions.map((mId) => (
                        <Badge key={mId} variant="secondary" className="text-xs">
                          @{userMap.get(mId) ?? "..."}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ──────────────── Tab: Temps passes ────────────────

function TabTempsPasses({
  dossierId,
  userMap,
}: {
  dossierId: Id<"dossiers">;
  userMap: Map<string, string>;
}) {
  const tempsData = useQuery(api.tempsPasses.totalByDossier, { dossierId });
  const createTemps = useMutation(api.tempsPasses.create);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [tauxHoraire, setTauxHoraire] = useState("");

  async function handleCreate() {
    if (!date || !dureeMinutes || !description || !tauxHoraire) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    try {
      await createTemps({
        dossierId,
        date,
        dureeMinutes: parseInt(dureeMinutes),
        description,
        tauxHoraire: parseFloat(tauxHoraire),
      });
      toast.success("Entrée ajoutée");
      setDialogOpen(false);
      setDate("");
      setDureeMinutes("");
      setDescription("");
      setTauxHoraire("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  }

  const totalMinutes = tempsData?.totalMinutes ?? 0;
  const totalMontant = tempsData?.totalMontant ?? 0;
  const entries = tempsData?.entries ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Temps passés</CardTitle>
          <CardDescription>
            Total : {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, "0")} |
            Montant : {totalMontant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Intervenant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Taux</TableHead>
              <TableHead>Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Aucun temps saisi
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>{userMap.get(e.intervenantId) ?? "..."}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>
                    {Math.floor(e.dureeMinutes / 60)}h{String(e.dureeMinutes % 60).padStart(2, "0")}
                  </TableCell>
                  <TableCell>{e.tauxHoraire} €/h</TableCell>
                  <TableCell className="font-medium">
                    {((e.dureeMinutes / 60) * e.tauxHoraire).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter du temps passé</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Durée (minutes) *</Label>
              <Input
                type="number"
                value={dureeMinutes}
                onChange={(e) => setDureeMinutes(e.target.value)}
                placeholder="60"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'activité"
              />
            </div>
            <div className="grid gap-2">
              <Label>Taux horaire (€/h) *</Label>
              <Input
                type="number"
                value={tauxHoraire}
                onChange={(e) => setTauxHoraire(e.target.value)}
                placeholder="250"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────── Tab: Specifique ────────────────

function TabSpecifique({
  dossierId,
  specialite,
}: {
  dossierId: Id<"dossiers">;
  specialite: string;
}) {
  if (specialite === "corporate") {
    return <TabCorporate dossierId={dossierId} />;
  }
  if (specialite === "litige") {
    return <TabLitige dossierId={dossierId} />;
  }
  return <TabFiscal dossierId={dossierId} />;
}

function TabCorporate({ dossierId }: { dossierId: Id<"dossiers"> }) {
  const ext = useQuery(api.dossiers.getCorporateExt, { dossierId });
  const updateExt = useMutation(api.dossiers.updateCorporateExt);

  if (!ext) return <div className="text-muted-foreground p-4">Chargement...</div>;

  async function handleUpdate(field: string, value: unknown) {
    try {
      await updateExt({ id: ext!._id, [field]: value } as Parameters<typeof updateExt>[0]);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Opération corporate</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type d&apos;opération</Label>
            <Select
              value={ext.typeOperation || ""}
              onValueChange={(val) => handleUpdate("typeOperation", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_OPERATIONS_CORPORATE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Date AG</Label>
            <Input
              type="date"
              value={ext.dateAG ?? ""}
              onChange={(e) => handleUpdate("dateAG", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Date dépôt greffe</Label>
            <Input
              type="date"
              value={ext.dateDepotGreffe ?? ""}
              onChange={(e) => handleUpdate("dateDepotGreffe", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Date publication JAL</Label>
            <Input
              type="date"
              value={ext.datePublicationJAL ?? ""}
              onChange={(e) => handleUpdate("datePublicationJAL", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {(ext.checklist ?? []).map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(checked) => {
                    const updated = [...(ext.checklist ?? [])];
                    updated[i] = { ...updated[i], done: !!checked };
                    handleUpdate("checklist", updated);
                  }}
                />
                <span className={item.done ? "line-through text-muted-foreground" : ""}>
                  {item.label}
                </span>
              </label>
            ))}
            {(!ext.checklist || ext.checklist.length === 0) && (
              <p className="text-sm text-muted-foreground">Aucun élément dans la checklist</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TabLitige({ dossierId }: { dossierId: Id<"dossiers"> }) {
  const ext = useQuery(api.dossiers.getLitigeExt, { dossierId });
  const updateExt = useMutation(api.dossiers.updateLitigeExt);

  if (!ext) return <div className="text-muted-foreground p-4">Chargement...</div>;

  async function handleUpdate(field: string, value: unknown) {
    try {
      await updateExt({ id: ext!._id, [field]: value } as Parameters<typeof updateExt>[0]);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Procédure</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type de procédure</Label>
            <Select
              value={ext.typeProcedure || ""}
              onValueChange={(val) => handleUpdate("typeProcedure", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_PROCEDURES_LITIGE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Juridiction</Label>
            <Input
              value={ext.juridiction ?? ""}
              onChange={(e) => handleUpdate("juridiction", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Chambre</Label>
            <Input
              value={ext.chambre ?? ""}
              onChange={(e) => handleUpdate("chambre", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Numéro RG</Label>
            <Input
              value={ext.numeroRG ?? ""}
              onChange={(e) => handleUpdate("numeroRG", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Magistrat</Label>
            <Input
              value={ext.magistrat ?? ""}
              onChange={(e) => handleUpdate("magistrat", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partie adverse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Avocat adverse</Label>
            <Input
              value={ext.avocatAdverse ?? ""}
              onChange={(e) => handleUpdate("avocatAdverse", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Coordonnées adverse</Label>
            <Input
              value={ext.coordonneesAdverse ?? ""}
              onChange={(e) => handleUpdate("coordonneesAdverse", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conclusions */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Conclusions échangées</CardTitle>
        </CardHeader>
        <CardContent>
          {ext.conclusionsEchangees && ext.conclusionsEchangees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date de dépôt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ext.conclusionsEchangees.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.dateDepot}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune conclusion échangée</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TabFiscal({ dossierId }: { dossierId: Id<"dossiers"> }) {
  const ext = useQuery(api.dossiers.getFiscalExt, { dossierId });
  const updateExt = useMutation(api.dossiers.updateFiscalExt);

  if (!ext) return <div className="text-muted-foreground p-4">Chargement...</div>;

  async function handleUpdate(field: string, value: unknown) {
    try {
      await updateExt({ id: ext!._id, [field]: value } as Parameters<typeof updateExt>[0]);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mission fiscale</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type de mission</Label>
            <Select
              value={ext.typeMission || ""}
              onValueChange={(val) => handleUpdate("typeMission", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_MISSIONS_FISCAL.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Régime</Label>
            <Input
              value={ext.regime ?? ""}
              onChange={(e) => handleUpdate("regime", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Montant en jeu (€)</Label>
            <Input
              type="number"
              value={ext.montantEnJeu ?? ""}
              onChange={(e) =>
                handleUpdate("montantEnJeu", e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendrier fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          {ext.calendrierFiscal && ext.calendrierFiscal.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ext.calendrierFiscal.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>{c.description}</TableCell>
                    <TableCell>{c.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.statut}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun élément dans le calendrier fiscal</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────── Tab: IA ────────────────

function TabIA({ dossierId }: { dossierId: Id<"dossiers"> }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            Analyser un document
          </CardTitle>
          <CardDescription>
            Utilisez l&apos;IA pour analyser les documents du dossier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/ia?dossierId=${dossierId}&action=analyse`}>
            <Button>
              <FileText className="mr-2 size-4" />
              Analyser un document
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            Rédiger un document
          </CardTitle>
          <CardDescription>
            Utilisez l&apos;IA pour générer un brouillon de document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/ia?dossierId=${dossierId}&action=redaction`}>
            <Button>
              <Edit className="mr-2 size-4" />
              Rédiger un document
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
