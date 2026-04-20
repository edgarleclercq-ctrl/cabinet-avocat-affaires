"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

type ResultatConflit = "aucun" | "potentiel" | "confirme";

interface VerificationResult {
  resultat: ResultatConflit;
  details?: string;
  conflits?: Array<{
    partieAdverse: string;
    dossierRef?: string;
    client?: string;
  }>;
}

const RESULTAT_TONE: Record<ResultatConflit, {
  bg: string;
  fg: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}> = {
  aucun: {
    bg: "bg-status-success",
    fg: "text-status-success-fg",
    border: "ring-status-success-fg/20",
    icon: CheckCircle,
    title: "Aucun conflit détecté",
  },
  potentiel: {
    bg: "bg-status-warning",
    fg: "text-status-warning-fg",
    border: "ring-status-warning-fg/20",
    icon: AlertTriangle,
    title: "Conflit potentiel détecté",
  },
  confirme: {
    bg: "bg-status-danger",
    fg: "text-status-danger-fg",
    border: "ring-status-danger-fg/20",
    icon: XCircle,
    title: "Conflit confirmé",
  },
};

function ResultatCard({ result }: { result: VerificationResult }) {
  const tone = RESULTAT_TONE[result.resultat];
  const Icon = tone.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-4 ring-1 ring-inset",
        tone.bg,
        tone.border
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", tone.fg)} />
      <div className="flex flex-col gap-1.5">
        <p className={cn("font-medium", tone.fg)}>{tone.title}</p>
        {result.details && (
          <p className={cn("text-sm", tone.fg, "opacity-85")}>
            {result.details}
          </p>
        )}
        {result.conflits && result.conflits.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {result.conflits.map((c, i) => (
              <li key={i} className={cn(tone.fg, "opacity-85")}>
                · {c.partieAdverse}
                {c.dossierRef && ` (Dossier: ${c.dossierRef})`}
                {c.client && ` — Client: ${c.client}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function resultatBadgeVariant(resultat: ResultatConflit) {
  switch (resultat) {
    case "aucun":
      return "default" as const;
    case "potentiel":
      return "secondary" as const;
    case "confirme":
      return "destructive" as const;
  }
}

function resultatBadgeClass(resultat: ResultatConflit) {
  switch (resultat) {
    case "aucun":
      return "bg-status-success text-status-success-fg ring-1 ring-inset ring-status-success-fg/10";
    case "potentiel":
      return "bg-status-warning text-status-warning-fg ring-1 ring-inset ring-status-warning-fg/10";
    case "confirme":
      return "bg-status-danger text-status-danger-fg ring-1 ring-inset ring-status-danger-fg/10";
  }
}

function resultatLabel(resultat: ResultatConflit) {
  switch (resultat) {
    case "aucun":
      return "Aucun";
    case "potentiel":
      return "Potentiel";
    case "confirme":
      return "Confirme";
  }
}

export default function ConflitsPage() {
  const user = useQuery(api.users.me);
  const clients = useQuery(api.clients.list, {});
  const verifications = useQuery(api.conflits.listVerifications, {});
  const verify = useMutation(api.conflits.verify);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [partiesAdverses, setPartiesAdverses] = useState<string[]>([""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<{
    id: string;
    resultat: ResultatConflit;
  } | null>(null);

  const isAssocie = user?.role === "associe";

  function addPartie() {
    setPartiesAdverses([...partiesAdverses, ""]);
  }

  function removePartie(index: number) {
    setPartiesAdverses(partiesAdverses.filter((_, i) => i !== index));
  }

  function updatePartie(index: number, value: string) {
    const updated = [...partiesAdverses];
    updated[index] = value;
    setPartiesAdverses(updated);
  }

  async function handleVerify() {
    if (!selectedClientId || partiesAdverses.every((p) => p.trim() === "")) return;

    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verify({
        clientId: selectedClientId as any,
        partiesAdverses: partiesAdverses.filter((p) => p.trim() !== ""),
      });
      setResult(res as unknown as VerificationResult);
    } catch {
      setResult({
        resultat: "aucun",
        details: "Erreur lors de la verification. Veuillez reessayer.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  const updateResultat = useMutation(api.conflits.updateResultat);

  async function handleUpdateResultat(newResultat: ResultatConflit) {
    if (!selectedVerification) return;
    try {
      await updateResultat({
        id: selectedVerification.id as any,
        resultat: newResultat,
      });
    } finally {
      setUpdateDialogOpen(false);
      setSelectedVerification(null);
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="text-text-muted">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        title="Conflits d'intérêts"
        subtitle="Vérification automatique et registre de conformité déontologique."
      />

      {/* Section A: Verification de conflit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Verification de conflit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select client */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Client</label>
            <Select
              value={selectedClientId}
              onValueChange={(val) => val !== null && setSelectedClientId(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.denomination ?? client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parties adverses */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Parties adverses</label>
            <div className="space-y-2">
              {partiesAdverses.map((partie, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Denomination de la partie adverse"
                    value={partie}
                    onChange={(e) => updatePartie(index, e.target.value)}
                    className="flex-1"
                  />
                  {partiesAdverses.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePartie(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addPartie}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une partie
            </Button>
          </div>

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={
              isVerifying ||
              !selectedClientId ||
              partiesAdverses.every((p) => p.trim() === "")
            }
          >
            {isVerifying ? "Verification en cours..." : "Verifier"}
          </Button>

          {/* Result */}
          {result && <ResultatCard result={result} />}
        </CardContent>
      </Card>

      {/* Section B: Registre des verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Registre des verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!verifications || verifications.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Aucune vérification enregistrée"
              description="Le registre des vérifications apparaîtra ici."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Parties verifiees</TableHead>
                    <TableHead>Resultat</TableHead>
                    <TableHead>Verifie par</TableHead>
                    {isAssocie && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((v: any) => (
                    <TableRow key={v._id}>
                      <TableCell className="whitespace-nowrap">
                        {v.createdAt
                          ? format(new Date(v.createdAt), "dd/MM/yyyy HH:mm", {
                              locale: fr,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>{v.clientNom ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {v.partiesAdverses?.map((p: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={resultatBadgeClass(v.resultat)}>
                          {resultatLabel(v.resultat)}
                        </Badge>
                      </TableCell>
                      <TableCell>{v.verifiePar ?? "-"}</TableCell>
                      {isAssocie && (
                        <TableCell>
                          {v.resultat === "potentiel" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVerification({
                                  id: v._id,
                                  resultat: v.resultat,
                                });
                                setUpdateDialogOpen(true);
                              }}
                            >
                              Modifier
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for updating resultat */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le resultat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le resultat actuel est &quot;Potentiel&quot;. Vous pouvez le changer en :
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50"
              onClick={() => handleUpdateResultat("aucun")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aucun conflit
            </Button>
            <Button
              variant="outline"
              className="border-red-500 text-red-700 hover:bg-red-50"
              onClick={() => handleUpdateResultat("confirme")}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Conflit confirme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
