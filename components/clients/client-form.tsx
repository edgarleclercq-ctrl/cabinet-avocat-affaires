"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { FORMES_JURIDIQUES, SPECIALITES } from "@/lib/constants";
import { DEMO_MODE, DEMO_USERS } from "@/lib/demo-data";
import { demoClientsStore } from "@/lib/demo-store";
import { toast } from "sonner";

import { CompanySearch } from "@/components/clients/company-search";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

type SpecialiteKey = keyof typeof SPECIALITES;

interface ClientFormProps {
  client?: Doc<"clients">;
  onClose: () => void;
}

export function ClientForm({ client, onClose }: ClientFormProps) {
  const createClient = useMutation(api.clients.create);
  const updateClient = useMutation(api.clients.update);
  const convexUsers = useQuery(api.users.list, DEMO_MODE ? "skip" : {});
  const users = DEMO_MODE ? DEMO_USERS : convexUsers;

  const [type, setType] = useState<"personne_morale" | "personne_physique">(
    client?.type ?? "personne_morale"
  );
  const [denomination, setDenomination] = useState(
    client?.denomination ?? ""
  );
  const [prenom, setPrenom] = useState(client?.prenom ?? "");
  const [nom, setNom] = useState(client?.nom ?? "");
  const [formeJuridique, setFormeJuridique] = useState(
    client?.formeJuridique ?? ""
  );
  const [siren, setSiren] = useState(client?.siren ?? "");
  const [siret, setSiret] = useState(client?.siret ?? "");
  const [siegeSocial, setSiegeSocial] = useState(client?.siegeSocial ?? "");
  const [capitalSocial, setCapitalSocial] = useState(
    client?.capitalSocial ?? ""
  );
  const [dirigeants, setDirigeants] = useState(client?.dirigeants ?? "");
  const [secteurActivite, setSecteurActivite] = useState(
    client?.secteurActivite ?? ""
  );
  const [dateCreation, setDateCreation] = useState(
    client?.dateCreation ?? ""
  );
  const [avocatReferentId, setAvocatReferentId] = useState<string>(
    client?.avocatReferentId ?? ""
  );
  const [tags, setTags] = useState<string[]>(client?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [specialites, setSpecialites] = useState<SpecialiteKey[]>(
    (client?.specialites as SpecialiteKey[]) ?? []
  );
  const [loading, setLoading] = useState(false);

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function toggleSpecialite(key: SpecialiteKey) {
    setSpecialites((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!denomination.trim()) {
      toast.error("La dénomination est requise.");
      return;
    }

    setLoading(true);
    try {
      const data = {
        type,
        denomination: denomination.trim(),
        prenom: prenom || undefined,
        nom: nom || undefined,
        formeJuridique: formeJuridique || undefined,
        siren: siren || undefined,
        siret: siret || undefined,
        siegeSocial: siegeSocial || undefined,
        capitalSocial: capitalSocial || undefined,
        dirigeants: dirigeants || undefined,
        secteurActivite: secteurActivite || undefined,
        dateCreation: dateCreation || undefined,
        avocatReferentId: avocatReferentId
          ? (avocatReferentId as Id<"users">)
          : undefined,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes || undefined,
        specialites: specialites.length > 0 ? specialites : undefined,
      };

      if (DEMO_MODE) {
        if (!client) {
          const newClient = {
            ...data,
            _id: `demo_client_${Date.now()}` as Id<"clients">,
            _creationTime: Date.now(),
            isActive: true,
          };
          demoClientsStore.add(newClient);
        }
        toast.success(client ? "Client mis à jour (démo)." : "Client créé (démo).");
      } else if (client) {
        await updateClient({ id: client._id, ...data });
        toast.success("Client mis à jour avec succès.");
      } else {
        await createClient(data);
        toast.success("Client créé avec succès.");
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(val) =>
            setType(val as "personne_morale" | "personne_physique")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personne_morale">Personne morale</SelectItem>
            <SelectItem value="personne_physique">Personne physique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Denomination — avec auto-complétion entreprise */}
      <div className="flex flex-col gap-1.5">
        <Label>Dénomination *</Label>
        {type === "personne_morale" ? (
          <CompanySearch
            initialValue={denomination}
            onSelect={(company) => {
              setDenomination(company.denomination);
              if (company.siren) setSiren(company.siren);
              if (company.formeJuridique) setFormeJuridique(company.formeJuridique);
              if (company.siegeSocial) setSiegeSocial(company.siegeSocial);
              if (company.dateCreation) setDateCreation(company.dateCreation);
              if (company.dirigeants) setDirigeants(company.dirigeants);
              if (company.secteurActivite) setSecteurActivite(company.secteurActivite);
            }}
          />
        ) : (
          <Input
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            placeholder="Nom complet"
            required
          />
        )}
      </div>

      {/* Prenom / Nom (for personne physique) */}
      {type === "personne_physique" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Prénom</Label>
            <Input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nom</Label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
            />
          </div>
        </div>
      )}

      {/* Forme juridique */}
      {type === "personne_morale" && (
        <div className="flex flex-col gap-1.5">
          <Label>Forme juridique</Label>
          <Select value={formeJuridique} onValueChange={(val) => val !== null && setFormeJuridique(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {FORMES_JURIDIQUES.map((fj) => (
                <SelectItem key={fj} value={fj}>
                  {fj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* SIREN / SIRET */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>SIREN</Label>
          <Input
            value={siren}
            onChange={(e) => setSiren(e.target.value)}
            placeholder="123 456 789"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>SIRET</Label>
          <Input
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            placeholder="123 456 789 00001"
          />
        </div>
      </div>

      {/* Siege social */}
      <div className="flex flex-col gap-1.5">
        <Label>Siège social</Label>
        <Input
          value={siegeSocial}
          onChange={(e) => setSiegeSocial(e.target.value)}
          placeholder="Adresse du siège"
        />
      </div>

      {/* Capital social / Dirigeants */}
      {type === "personne_morale" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Capital social</Label>
            <Input
              value={capitalSocial}
              onChange={(e) => setCapitalSocial(e.target.value)}
              placeholder="10 000 €"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Dirigeants</Label>
            <Input
              value={dirigeants}
              onChange={(e) => setDirigeants(e.target.value)}
              placeholder="Noms des dirigeants"
            />
          </div>
        </div>
      )}

      {/* Secteur / Date creation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Secteur d'activité</Label>
          <Input
            value={secteurActivite}
            onChange={(e) => setSecteurActivite(e.target.value)}
            placeholder="Ex: Tech, Immobilier..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Date de création</Label>
          <Input
            type="date"
            value={dateCreation}
            onChange={(e) => setDateCreation(e.target.value)}
          />
        </div>
      </div>

      {/* Avocat referent */}
      <div className="flex flex-col gap-1.5">
        <Label>Avocat référent</Label>
        <Select value={avocatReferentId} onValueChange={(val) => val !== null && setAvocatReferentId(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un avocat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Aucun</SelectItem>
            {users
              ?.filter((u) => u.isActive)
              .map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Specialites (multi-select via checkboxes) */}
      <div className="flex flex-col gap-1.5">
        <Label>Spécialités</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SPECIALITES) as [SpecialiteKey, string][]).map(
            ([key, label]) => (
              <Badge
                key={key}
                variant={specialites.includes(key) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSpecialite(key)}
              >
                {label}
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1 mb-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Ajouter un tag..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Ajouter
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes internes sur le client..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : client
              ? "Mettre à jour"
              : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
