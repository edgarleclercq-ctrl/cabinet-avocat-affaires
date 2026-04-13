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

function ResultatCard({ result }: { result: VerificationResult }) {
  if (result.resultat === "aucun") {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-400">
              Aucun conflit detecte
            </p>
            <p className="text-sm text-green-700 dark:text-green-500">
              La verification n&apos;a revele aucun conflit d&apos;interets avec les parties indiquees.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.resultat === "potentiel") {
    return (
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-yellow-800 dark:text-yellow-400">
                Conflit potentiel detecte
              </p>
              {result.details && (
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  {result.details}
                </p>
              )}
              {result.conflits && result.conflits.length > 0 && (
                <ul className="space-y-1">
                  {result.conflits.map((c, i) => (
                    <li key={i} className="text-sm text-yellow-700 dark:text-yellow-500">
                      - {c.partieAdverse}
                      {c.dossierRef && ` (Dossier: ${c.dossierRef})`}
                      {c.client && ` — Client: ${c.client}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-red-800 dark:text-red-400">
              Conflit confirme
            </p>
            {result.details && (
              <p className="text-sm text-red-700 dark:text-red-500">
                {result.details}
              </p>
            )}
            {result.conflits && result.conflits.length > 0 && (
              <ul className="space-y-1">
                {result.conflits.map((c, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-500">
                    - {c.partieAdverse}
                    {c.dossierRef && ` (Dossier: ${c.dossierRef})`}
                    {c.client && ` — Client: ${c.client}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "potentiel":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "confirme":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
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
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Conflits d&apos;interets
        </h1>
        <p className="text-muted-foreground">
          Verification et registre des conflits d&apos;interets
        </p>
      </div>

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
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucune verification enregistree.
            </p>
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
