"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FactureFormProps {
  onClose: () => void;
  defaultClientId?: Id<"clients">;
  defaultDossierId?: Id<"dossiers">;
}

export function FactureForm({
  onClose,
  defaultClientId,
  defaultDossierId,
}: FactureFormProps) {
  const [clientId, setClientId] = useState<string>(defaultClientId ?? "");
  const [dossierId, setDossierId] = useState<string>(defaultDossierId ?? "");
  const [description, setDescription] = useState("");
  const [montantHT, setMontantHT] = useState<number>(0);
  const [tva, setTva] = useState<number>(20);
  const [dateEcheance, setDateEcheance] = useState("");
  const [acomptesDeduits, setAcomptesDeduits] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const clients = useQuery(api.clients.list, {});
  const dossiers = useQuery(
    api.dossiers.list,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip"
  );

  const createFacture = useMutation(api.factures.create);

  const montantTTC = montantHT * (1 + tva / 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!description.trim()) {
      toast.error("Veuillez saisir une description");
      return;
    }
    if (montantHT <= 0) {
      toast.error("Le montant HT doit être supérieur à 0");
      return;
    }
    if (!dateEcheance) {
      toast.error("Veuillez saisir une date d'échéance");
      return;
    }

    setLoading(true);
    try {
      await createFacture({
        clientId: clientId as Id<"clients">,
        dossierId: dossierId ? (dossierId as Id<"dossiers">) : undefined,
        description,
        montantHT,
        tva,
        montantTTC: Math.round(montantTTC * 100) / 100,
        dateEcheance,
        acomptesDeduits: acomptesDeduits ? parseFloat(acomptesDeduits) : undefined,
      });
      toast.success("Facture créée avec succès");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Client */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="clientId">Client *</Label>
        <Select value={clientId} onValueChange={(val) => val !== null && setClientId(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un client" />
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

      {/* Dossier */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="dossierId">Dossier (optionnel)</Label>
        <Select value={dossierId} onValueChange={(val) => val !== null && setDossierId(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un dossier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Aucun dossier</SelectItem>
            {(dossiers ?? []).map((d) => (
              <SelectItem key={d._id} value={d._id}>
                {d.reference} - {d.intitule}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de la prestation..."
          rows={3}
        />
      </div>

      {/* Montant HT + TVA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="montantHT">Montant HT (€) *</Label>
          <Input
            id="montantHT"
            type="number"
            min={0}
            step={0.01}
            value={montantHT || ""}
            onChange={(e) => setMontantHT(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tva">TVA (%) *</Label>
          <Input
            id="tva"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={tva}
            onChange={(e) => setTva(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Montant TTC (auto) */}
      <div className="flex flex-col gap-2">
        <Label>Montant TTC</Label>
        <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-3 text-sm font-medium">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(montantTTC)}
        </div>
      </div>

      {/* Date échéance */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="dateEcheance">Date d&apos;échéance *</Label>
        <Input
          id="dateEcheance"
          type="date"
          value={dateEcheance}
          onChange={(e) => setDateEcheance(e.target.value)}
        />
      </div>

      {/* Acomptes déduits */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="acomptesDeduits">Acomptes déduits (€)</Label>
        <Input
          id="acomptesDeduits"
          type="number"
          min={0}
          step={0.01}
          value={acomptesDeduits}
          onChange={(e) => setAcomptesDeduits(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer la facture"}
        </Button>
      </div>
    </form>
  );
}
