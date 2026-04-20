"use client";

import * as React from "react";
import {
  Upload,
  FileText,
  FolderOpen,
  Loader2,
  X,
  CheckCircle,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DEMO_CONTRAT_EXEMPLE } from "@/lib/demo-coherence";
import { cn } from "@/lib/utils";

const TYPES_DOCUMENT = [
  { value: "contrat_commercial", label: "Contrat commercial" },
  { value: "bail_commercial", label: "Bail commercial" },
  { value: "pacte_associes", label: "Pacte d'associés" },
  { value: "cgv", label: "CGV / CGU" },
  { value: "convention_honoraires", label: "Convention d'honoraires" },
  { value: "contrat_travail", label: "Contrat de travail" },
  { value: "accord_confidentialite", label: "Accord de confidentialité (NDA)" },
  { value: "autre", label: "Autre document juridique" },
];

export interface CoherenceUploaderSubmission {
  dossierId: string;
  documentId?: string;
  typeDocument?: string;
  contenuDocument: string;
  fileName?: string;
}

interface CoherenceUploaderProps {
  dossiers: Array<{ _id: string; reference: string; intitule: string }>;
  onSubmit: (s: CoherenceUploaderSubmission) => void;
  isAnalysing: boolean;
}

type Mode = "upload" | "paste" | "demo";

export function CoherenceUploader({
  dossiers,
  onSubmit,
  isAnalysing,
}: CoherenceUploaderProps) {
  const [dossierId, setDossierId] = React.useState<string>("");
  const [typeDocument, setTypeDocument] = React.useState<string>("");
  const [mode, setMode] = React.useState<Mode>("upload");

  // Upload state
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedText, setExtractedText] = React.useState<string>("");
  const [extractionMeta, setExtractionMeta] = React.useState<{
    wordCount: number;
    pageCount?: number;
  } | null>(null);
  const [extractionError, setExtractionError] = React.useState<string | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);

  // Paste state
  const [pastedText, setPastedText] = React.useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleFileSelected(f: File) {
    setFile(f);
    setExtractionError(null);
    setExtractedText("");
    setExtractionMeta(null);
    setIsExtracting(true);

    try {
      const form = new FormData();
      form.append("file", f);
      form.append("fileName", f.name);
      const res = await fetch("/api/documents/extract", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Erreur d'extraction");
      }
      setExtractedText(json.text);
      setExtractionMeta({
        wordCount: json.wordCount,
        pageCount: json.pageCount,
      });
    } catch (e) {
      setExtractionError(
        e instanceof Error ? e.message : "Erreur inconnue"
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setExtractedText("");
    setExtractionMeta(null);
    setExtractionError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    const contenu =
      mode === "upload"
        ? extractedText
        : mode === "demo"
          ? DEMO_CONTRAT_EXEMPLE
          : pastedText;
    if (!contenu.trim()) return;
    onSubmit({
      dossierId: dossierId || (dossiers[0]?._id ?? ""),
      typeDocument: typeDocument || undefined,
      contenuDocument: contenu,
      fileName: mode === "upload" ? file?.name : undefined,
    });
  }

  const canSubmit =
    !isAnalysing &&
    !!dossierId &&
    !!(
      (mode === "upload" && extractedText) ||
      (mode === "paste" && pastedText.trim()) ||
      mode === "demo"
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Dossier associé *</Label>
          <Select
            value={dossierId}
            onValueChange={(v) => setDossierId(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un dossier" />
            </SelectTrigger>
            <SelectContent>
              {dossiers.map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.reference} — {d.intitule}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Type de document (optionnel)</Label>
          <Select
            value={typeDocument}
            onValueChange={(v) => setTypeDocument(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ex : Contrat commercial" />
            </SelectTrigger>
            <SelectContent>
              {TYPES_DOCUMENT.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="mr-1.5 size-3.5" />
            Téléverser
          </TabsTrigger>
          <TabsTrigger value="paste">
            <ClipboardPaste className="mr-1.5 size-3.5" />
            Coller le texte
          </TabsTrigger>
          <TabsTrigger value="demo">
            <Sparkles className="mr-1.5 size-3.5" />
            Document de démo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <UploadZone
            file={file}
            isExtracting={isExtracting}
            extractedText={extractedText}
            extractionMeta={extractionMeta}
            extractionError={extractionError}
            onFileSelected={handleFileSelected}
            onReset={handleReset}
            fileInputRef={fileInputRef}
          />
        </TabsContent>

        <TabsContent value="paste" className="mt-4">
          <div className="flex flex-col gap-2">
            <Label>Texte du document</Label>
            <Textarea
              rows={12}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Collez ici le texte intégral du document à analyser…"
              className="font-mono text-xs"
            />
            <span className="text-xs text-text-subtle">
              {pastedText.trim().split(/\s+/).filter(Boolean).length} mots
            </span>
          </div>
        </TabsContent>

        <TabsContent value="demo" className="mt-4">
          <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-muted/40 p-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-text-muted" />
              <span className="text-sm font-medium text-text-strong">
                Contrat de prestation de services (démo)
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Document type contenant plusieurs non-conformités volontaires
              (clause pénale excessive, limitation de responsabilité de 1 000 €,
              délai de paiement 90 jours, clauses de résiliation contradictoires).
              Idéal pour démontrer les capacités d'audit.
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer text-text-muted hover:text-text-default">
                Aperçu du document
              </summary>
              <pre className="mt-2 max-h-64 overflow-y-auto rounded-md bg-surface p-3 font-mono text-[0.7rem] text-text-default">
                {DEMO_CONTRAT_EXEMPLE.slice(0, 800)}…
              </pre>
            </details>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="gap-2"
        >
          {isAnalysing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Lancer l&apos;analyse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function UploadZone({
  file,
  isExtracting,
  extractedText,
  extractionMeta,
  extractionError,
  onFileSelected,
  onReset,
  fileInputRef,
}: {
  file: File | null;
  isExtracting: boolean;
  extractedText: string;
  extractionMeta: { wordCount: number; pageCount?: number } | null;
  extractionError: string | null;
  onFileSelected: (f: File) => void;
  onReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFileSelected(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragOver
              ? "border-gold bg-status-gold/30"
              : "border-border-default bg-surface-muted/40 hover:border-border-strong"
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-surface ring-1 ring-border-subtle">
            <Upload className="size-5 text-text-muted" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base text-text-strong">
              Glissez-déposez un document
            </p>
            <p className="text-sm text-text-muted">
              PDF, DOCX ou TXT — max 25 Mo
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            Choisir un fichier
          </Button>
        </label>
      ) : (
        <div className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface p-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-surface-muted text-text-muted">
            <FileText className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-text-strong">
                {file.name}
              </p>
              {isExtracting ? (
                <Loader2 className="size-3.5 animate-spin text-text-muted" />
              ) : extractedText ? (
                <CheckCircle className="size-3.5 text-status-success-fg" />
              ) : null}
            </div>
            {extractionMeta && (
              <p className="text-xs text-text-subtle">
                {extractionMeta.wordCount.toLocaleString("fr-FR")} mots
                {extractionMeta.pageCount
                  ? ` · ${extractionMeta.pageCount} page${extractionMeta.pageCount > 1 ? "s" : ""}`
                  : ""}{" "}
                · {(file.size / 1024).toFixed(0)} Ko
              </p>
            )}
            {extractionError && (
              <p className="text-xs text-status-danger-fg">{extractionError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-default"
            aria-label="Retirer le document"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {extractedText && (
        <details className="text-xs">
          <summary className="cursor-pointer text-text-muted hover:text-text-default">
            Aperçu du texte extrait
          </summary>
          <pre className="mt-2 max-h-64 overflow-y-auto rounded-md bg-surface-muted/60 p-3 font-mono text-[0.7rem] text-text-default">
            {extractedText.slice(0, 2000)}
            {extractedText.length > 2000 && "\n…"}
          </pre>
        </details>
      )}
    </div>
  );
}
