"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TYPES_DOCUMENTS_IA } from "@/lib/constants";
import {
  Brain,
  FileSearch,
  PenTool,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";

interface AnalyseResult {
  resume?: string;
  clausesCles?: Array<{ titre: string; contenu: string }>;
  obligations?: Array<{
    partie: string;
    obligation: string;
    echeance?: string;
  }>;
  pointsAttention?: Array<{
    type: "info" | "attention" | "critique";
    titre: string;
    description: string;
  }>;
}

function parseAnalyseResult(raw: unknown): AnalyseResult | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as AnalyseResult;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AnalyseResult;
    } catch {
      return { resume: raw };
    }
  }
  return null;
}

function pointAttentionColor(type: string) {
  switch (type) {
    case "info":
      return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
    case "attention":
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    case "critique":
      return "border-red-500 bg-red-50 dark:bg-red-950/20";
    default:
      return "";
  }
}

function pointAttentionBadge(type: string) {
  switch (type) {
    case "info":
      return "bg-status-info text-status-info-fg ring-1 ring-inset ring-status-info-fg/10";
    case "attention":
      return "bg-status-warning text-status-warning-fg ring-1 ring-inset ring-status-warning-fg/10";
    case "critique":
      return "bg-status-danger text-status-danger-fg ring-1 ring-inset ring-status-danger-fg/10";
    default:
      return "";
  }
}

function CollapsibleClause({
  titre,
  contenu,
}: {
  titre: string;
  contenu: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border">
      <button
        className="flex items-center justify-between w-full p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium">{titre}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {contenu}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function AnalyseResultPanel({ result }: { result: AnalyseResult }) {
  return (
    <div className="space-y-6">
      {/* Resume */}
      {result.resume && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Resume</h3>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{result.resume}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clauses cles */}
      {result.clausesCles && result.clausesCles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Clauses cles</h3>
          <div className="space-y-2">
            {result.clausesCles.map((clause, i) => (
              <CollapsibleClause
                key={i}
                titre={clause.titre}
                contenu={clause.contenu}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tableau des obligations */}
      {result.obligations && result.obligations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Tableau des obligations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-md">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Partie</th>
                  <th className="p-2 text-left font-medium">Obligation</th>
                  <th className="p-2 text-left font-medium">Echeance</th>
                </tr>
              </thead>
              <tbody>
                {result.obligations.map((obl, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{obl.partie}</td>
                    <td className="p-2">{obl.obligation}</td>
                    <td className="p-2">{obl.echeance ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Points d'attention */}
      {result.pointsAttention && result.pointsAttention.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Points d&apos;attention</h3>
          <div className="space-y-2">
            {result.pointsAttention.map((point, i) => (
              <Card
                key={i}
                className={`border-l-4 ${pointAttentionColor(point.type)}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <Badge className={pointAttentionBadge(point.type)}>
                      {point.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{point.titre}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyseDocumentTab() {
  const dossiers = useQuery(api.dossiers.list, {});
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [texteDocument, setTexteDocument] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analyseResult, setAnalyseResult] = useState<AnalyseResult | null>(
    null
  );

  const documents = useQuery(
    api.documents.listByDossier,
    selectedDossierId ? { dossierId: selectedDossierId as any } : "skip"
  );

  const analyser = useAction(api.ia.analyserDocument);

  async function handleAnalyse() {
    setIsAnalysing(true);
    setAnalyseResult(null);
    try {
      const res = await analyser({
        dossierId: selectedDossierId ? (selectedDossierId as any) : undefined,
        documentId: selectedDocumentId
          ? (selectedDocumentId as any)
          : undefined,
        contenuDocument: texteDocument || "",
      });
      setAnalyseResult(parseAnalyseResult(res));
    } catch {
      setAnalyseResult({
        resume: "Erreur lors de l'analyse. Veuillez reessayer.",
      });
    } finally {
      setIsAnalysing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="flex items-center gap-2 pt-4 pb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            Cette analyse n&apos;a aucune valeur juridique. C&apos;est un outil d&apos;aide a la lecture.
          </p>
        </CardContent>
      </Card>

      {/* Dossier select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dossier</label>
        <Select
          value={selectedDossierId}
          onValueChange={(v: any) => {
            if (v !== null) setSelectedDossierId(v);
            setSelectedDocumentId("");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionner un dossier" />
          </SelectTrigger>
          <SelectContent>
            {dossiers?.map((d: any) => (
              <SelectItem key={d._id} value={d._id}>
                {d.reference ?? d.titre ?? d._id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document select */}
      {selectedDossierId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Document du dossier (optionnel)
          </label>
          <Select
            value={selectedDocumentId}
            onValueChange={(val) => val !== null && setSelectedDocumentId(val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selectionner un document" />
            </SelectTrigger>
            <SelectContent>
              {documents?.map((doc: any) => (
                <SelectItem key={doc._id} value={doc._id}>
                  {doc.nom ?? doc.titre ?? doc._id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* OR paste text */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Ou coller/saisir le texte du document
        </label>
        <Textarea
          placeholder="Collez ici le texte du document a analyser..."
          value={texteDocument}
          onChange={(e) => setTexteDocument(e.target.value)}
          rows={10}
          className="min-h-[200px]"
        />
      </div>

      {/* Analyse button */}
      <Button
        onClick={handleAnalyse}
        disabled={
          isAnalysing ||
          (!selectedDocumentId && texteDocument.trim() === "")
        }
      >
        {isAnalysing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Analyser avec l&apos;IA
          </>
        )}
      </Button>

      {/* Results */}
      {analyseResult && (
        <div className="space-y-4">
          <Separator />
          <ScrollArea className="max-h-[600px]">
            <AnalyseResultPanel result={analyseResult} />
          </ScrollArea>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder comme note du dossier
          </Button>
        </div>
      )}
    </div>
  );
}

function RedactionAssisteeTab() {
  const dossiers = useQuery(api.dossiers.list, {});
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [typeDocument, setTypeDocument] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const rediger = useAction(api.ia.rediger);

  const selectedDossier = dossiers?.find(
    (d: any) => d._id === selectedDossierId
  );

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedText(null);
    try {
      const res = await rediger({
        dossierId: selectedDossierId as any,
        typeDocument,
        instructions: instructions || "",
        contexte: selectedDossier
          ? JSON.stringify({
              reference: (selectedDossier as any).reference,
              titre: (selectedDossier as any).intitule,
              specialite: (selectedDossier as any).specialite,
            })
          : "",
      });
      setGeneratedText(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setGeneratedText("Erreur lors de la generation. Veuillez reessayer.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dossier select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dossier</label>
        <Select
          value={selectedDossierId}
          onValueChange={(val) => val !== null && setSelectedDossierId(val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionner un dossier" />
          </SelectTrigger>
          <SelectContent>
            {dossiers?.map((d: any) => (
              <SelectItem key={d._id} value={d._id}>
                {d.reference ?? d.titre ?? d._id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Context auto-populated */}
      {selectedDossier && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">
              Contexte du dossier (auto-rempli)
            </p>
            <p className="text-sm">
              {(selectedDossier as any).reference} —{" "}
              {(selectedDossier as any).titre ?? (selectedDossier as any).clientNom}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Type de document */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type de document</label>
        <Select value={typeDocument} onValueChange={(val) => val !== null && setTypeDocument(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionner un type de document" />
          </SelectTrigger>
          <SelectContent>
            {TYPES_DOCUMENTS_IA.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Instructions specifiques (optionnel)
        </label>
        <Textarea
          placeholder="Indiquez des instructions particulieres pour la redaction..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !typeDocument}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generation en cours...
          </>
        ) : (
          <>
            <PenTool className="h-4 w-4 mr-2" />
            Generer le brouillon
          </>
        )}
      </Button>

      {/* Generated result */}
      {generatedText && (
        <div className="space-y-4">
          <Separator />

          {/* Warning */}
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="flex items-center gap-2 pt-4 pb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Genere par IA — A verifier et valider par un associe
              </p>
            </CardContent>
          </Card>

          {/* Result text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brouillon genere</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="whitespace-pre-wrap text-sm">
                  {generatedText}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder dans la GED du dossier
          </Button>
        </div>
      )}
    </div>
  );
}

export default function IAPage() {
  const user = useQuery(api.users.me);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        eyebrow="Nouveau"
        title="IA Juridique"
        subtitle="Analyse de documents et rédaction assistée par intelligence artificielle."
      />

      <Tabs defaultValue="analyse">
        <TabsList>
          <TabsTrigger value="analyse">
            <FileSearch className="h-4 w-4 mr-2" />
            Analyse de document
          </TabsTrigger>
          <TabsTrigger value="redaction">
            <PenTool className="h-4 w-4 mr-2" />
            Redaction assistee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyse" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <AnalyseDocumentTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redaction" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <RedactionAssisteeTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
