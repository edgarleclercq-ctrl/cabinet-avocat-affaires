"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUTS_FACTURE } from "@/lib/constants";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Ban,
} from "lucide-react";

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

function getStatutLabel(statut: string) {
  return STATUTS_FACTURE.find((s) => s.value === statut)?.label ?? statut;
}

function formatMontant(montant: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

interface FactureDetailProps {
  factureId: Id<"factures">;
}

export function FactureDetail({ factureId }: FactureDetailProps) {
  const facture = useQuery(api.factures.getById, { id: factureId });
  const me = useQuery(api.users.me);
  const clients = useQuery(api.clients.list, {});

  const updateStatut = useMutation(api.factures.updateStatut);
  const addRelance = useMutation(api.factures.addRelance);

  if (!facture) {
    return <p className="text-muted-foreground py-4 text-center">Chargement...</p>;
  }

  const clientName =
    clients?.find((c) => c._id === facture.clientId)?.denomination ?? "—";
  const isAssocie = me?.role === "associe";

  async function handleUpdateStatut(
    newStatut: "brouillon" | "en_attente" | "validee" | "envoyee" | "payee_partiellement" | "payee" | "en_retard" | "annulee",
    label: string
  ) {
    try {
      await updateStatut({
        id: factureId,
        statut: newStatut,
        datePaiement:
          newStatut === "payee" || newStatut === "payee_partiellement"
            ? new Date().toISOString().split("T")[0]
            : undefined,
      });
      toast.success(`Facture ${label}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  }

  async function handleRelance() {
    const currentRelances = facture!.relances ?? [];
    const nextNiveau = currentRelances.length + 1;
    try {
      await addRelance({
        id: factureId,
        niveau: nextNiveau,
        type: nextNiveau <= 1 ? "email" : nextNiveau <= 2 ? "courrier" : "mise_en_demeure",
      });
      toast.success(`Relance niveau ${nextNiveau} enregistrée`);
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la relance");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Infos principales */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Numéro</p>
          <p className="font-medium">{facture.numero}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Client</p>
          <p className="font-medium">{clientName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date d'émission</p>
          <p className="font-medium">{facture.dateEmission}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Échéance</p>
          <p className="font-medium">{facture.dateEcheance}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Montant HT</p>
          <p className="font-medium">{formatMontant(facture.montantHT)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">TVA ({facture.tva}%)</p>
          <p className="font-medium">
            {formatMontant(facture.montantTTC - facture.montantHT)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Montant TTC</p>
          <p className="text-lg font-bold">{formatMontant(facture.montantTTC)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Statut</p>
          <Badge
            className={STATUT_COLORS[facture.statut] ?? ""}
            variant="outline"
          >
            {getStatutLabel(facture.statut)}
          </Badge>
        </div>
        {facture.acomptesDeduits ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">Acomptes déduits</p>
            <p className="font-medium">{formatMontant(facture.acomptesDeduits)}</p>
          </div>
        ) : null}
        {facture.datePaiement ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">Date de paiement</p>
            <p className="font-medium">{facture.datePaiement}</p>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Description</p>
        <p className="text-sm">{facture.description}</p>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Actions</p>
        <div className="flex flex-wrap gap-2">
          {facture.statut === "brouillon" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatut("en_attente", "soumise")}
            >
              <ArrowRight className="mr-1 size-3" />
              Soumettre
            </Button>
          )}

          {facture.statut === "en_attente" && isAssocie && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatut("validee", "validée")}
            >
              <CheckCircle className="mr-1 size-3" />
              Valider
            </Button>
          )}

          {facture.statut === "validee" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatut("envoyee", "marquée envoyée")}
            >
              <Send className="mr-1 size-3" />
              Marquer envoyée
            </Button>
          )}

          {facture.statut === "envoyee" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleUpdateStatut("payee_partiellement", "payée partiellement")
                }
              >
                <Clock className="mr-1 size-3" />
                Paiement partiel
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatut("payee", "payée")}
              >
                <CheckCircle className="mr-1 size-3" />
                Paiement total
              </Button>
            </>
          )}

          {facture.statut === "en_retard" && (
            <>
              <Button size="sm" variant="outline" onClick={handleRelance}>
                <RefreshCw className="mr-1 size-3" />
                Relancer
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatut("payee", "payée")}
              >
                <CheckCircle className="mr-1 size-3" />
                Paiement reçu
              </Button>
            </>
          )}

          {!["payee", "annulee"].includes(facture.statut) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatut("annulee", "annulée")}
            >
              <Ban className="mr-1 size-3" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Historique des relances */}
      {facture.relances && facture.relances.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Historique des relances</p>
            <div className="flex flex-col gap-1.5">
              {facture.relances.map((relance, index) => (
                <Card key={index} size="sm">
                  <CardContent className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Niveau {relance.niveau}</Badge>
                      <span className="text-muted-foreground capitalize">
                        {relance.type.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {relance.date}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
