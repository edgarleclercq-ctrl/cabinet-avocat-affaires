"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SPECIALITES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

interface PartieAdverse {
  denomination: string;
  siren: string;
  avocat: string;
  coordonnees: string;
}

interface DossierFormProps {
  onClose: () => void;
}

export function DossierForm({ onClose }: DossierFormProps) {
  const users = useQuery(api.users.list, {});
  const clients = useQuery(api.clients.list, {});

  const createDossier = useMutation(api.dossiers.create);
  const verifyConflicts = useMutation(api.conflits.verify);

  const [clientId, setClientId] = useState<string>("");
  const [specialite, setSpecialite] = useState<string>("");
  const [intitule, setIntitule] = useState("");
  const [description, setDescription] = useState("");
  const [avocatResponsableId, setAvocatResponsableId] = useState<string>("");
  const [collaborateursIds, setCollaborateursIds] = useState<string[]>([]);
  const [montantHonoraires, setMontantHonoraires] = useState("");
  const [partiesAdverses, setPartiesAdverses] = useState<PartieAdverse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conflict warning state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<
    Array<{
      type: string;
      partie: string;
      dossierRef?: string;
      clientDenomination?: string;
    }>
  >([]);

  function addPartieAdverse() {
    setPartiesAdverses([
      ...partiesAdverses,
      { denomination: "", siren: "", avocat: "", coordonnees: "" },
    ]);
  }

  function removePartieAdverse(index: number) {
    setPartiesAdverses(partiesAdverses.filter((_, i) => i !== index));
  }

  function updatePartieAdverse(
    index: number,
    field: keyof PartieAdverse,
    value: string
  ) {
    const updated = [...partiesAdverses];
    updated[index] = { ...updated[index], [field]: value };
    setPartiesAdverses(updated);
  }

  function toggleCollaborateur(userId: string) {
    setCollaborateursIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmit(forceCreate = false) {
    if (!clientId || !specialite || !intitule || !avocatResponsableId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // Run conflict check if parties adverses exist and not forcing
      if (!forceCreate && partiesAdverses.some((p) => p.denomination.trim())) {
        const result = await verifyConflicts({
          clientId: clientId as Id<"clients">,
          partiesAdverses: partiesAdverses
            .filter((p) => p.denomination.trim())
            .map((p) => p.denomination),
        });

        if (result.resultat === "potentiel" && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          setConflictDialogOpen(true);
          setIsSubmitting(false);
          return;
        }
      }

      await createDossier({
        clientId: clientId as Id<"clients">,
        specialite: specialite as "corporate" | "litige" | "fiscal",
        intitule,
        description: description || undefined,
        avocatResponsableId: avocatResponsableId as Id<"users">,
        collaborateursIds: collaborateursIds as Id<"users">[],
        montantHonoraires: montantHonoraires
          ? parseFloat(montantHonoraires)
          : undefined,
        partiesAdverses: partiesAdverses.length > 0
          ? partiesAdverses
              .filter((p) => p.denomination.trim())
              .map((p) => ({
                denomination: p.denomination,
                siren: p.siren || undefined,
                avocat: p.avocat || undefined,
                coordonnees: p.coordonnees || undefined,
              }))
          : undefined,
      });

      toast.success("Dossier cr\u00e9\u00e9 avec succ\u00e8s");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la cr\u00e9ation"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Client */}
        <div className="grid gap-2">
          <Label htmlFor="clientId">Client *</Label>
          <Select value={clientId} onValueChange={(val) => setClientId(val ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="S\u00e9lectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.denomination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specialite */}
        <div className="grid gap-2">
          <Label htmlFor="specialite">Sp\u00e9cialit\u00e9 *</Label>
          <Select value={specialite} onValueChange={(val) => setSpecialite(val ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="S\u00e9lectionner une sp\u00e9cialit\u00e9" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SPECIALITES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intitule */}
        <div className="grid gap-2">
          <Label htmlFor="intitule">Intitul\u00e9 *</Label>
          <Input
            id="intitule"
            value={intitule}
            onChange={(e) => setIntitule(e.target.value)}
            placeholder="Intitul\u00e9 du dossier"
          />
        </div>

        {/* Description */}
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du dossier"
            rows={3}
          />
        </div>

        {/* Avocat responsable */}
        <div className="grid gap-2">
          <Label htmlFor="avocatResponsableId">Avocat responsable *</Label>
          <Select
            value={avocatResponsableId}
            onValueChange={(val) => setAvocatResponsableId(val ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="S\u00e9lectionner l'avocat responsable" />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collaborateurs (multi-select via checkboxes) */}
        <div className="grid gap-2">
          <Label>Collaborateurs</Label>
          <div className="flex flex-wrap gap-2">
            {(users ?? []).map((u) => (
              <Button
                key={u._id}
                type="button"
                variant={collaborateursIds.includes(u._id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCollaborateur(u._id)}
              >
                {u.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Montant honoraires */}
        <div className="grid gap-2">
          <Label htmlFor="montantHonoraires">Montant des honoraires (EUR)</Label>
          <Input
            id="montantHonoraires"
            type="number"
            value={montantHonoraires}
            onChange={(e) => setMontantHonoraires(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Parties adverses */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label>Parties adverses</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPartieAdverse}
            >
              <Plus className="mr-1 size-3" />
              Ajouter
            </Button>
          </div>
          {partiesAdverses.map((partie, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-2 rounded-lg border p-3"
            >
              <Input
                placeholder="D\u00e9nomination"
                value={partie.denomination}
                onChange={(e) =>
                  updatePartieAdverse(index, "denomination", e.target.value)
                }
              />
              <Input
                placeholder="SIREN"
                value={partie.siren}
                onChange={(e) =>
                  updatePartieAdverse(index, "siren", e.target.value)
                }
              />
              <Input
                placeholder="Avocat"
                value={partie.avocat}
                onChange={(e) =>
                  updatePartieAdverse(index, "avocat", e.target.value)
                }
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Coordonn\u00e9es"
                  value={partie.coordonnees}
                  onChange={(e) =>
                    updatePartieAdverse(index, "coordonnees", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePartieAdverse(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Cr\u00e9ation..." : "Cr\u00e9er le dossier"}
        </Button>
      </div>

      {/* Conflict warning dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Conflits d&apos;int\u00e9r\u00eats d\u00e9tect\u00e9s
            </DialogTitle>
            <DialogDescription>
              Des conflits potentiels ont \u00e9t\u00e9 identifi\u00e9s. Veuillez les examiner
              avant de continuer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/50"
              >
                {c.type === "partie_adverse_est_client" ? (
                  <p>
                    La partie adverse <strong>{c.partie}</strong> correspond au
                    client <strong>{c.clientDenomination}</strong>
                  </p>
                ) : (
                  <p>
                    Le client <strong>{c.partie}</strong> appara\u00eet comme partie
                    adverse dans le dossier <strong>{c.dossierRef}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConflictDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConflictDialogOpen(false);
                handleSubmit(true);
              }}
            >
              Cr\u00e9er malgr\u00e9 les conflits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
