/**
 * Extraction de texte depuis un document uploadé (PDF, DOCX, txt).
 *
 * ⚠ SERVER-SIDE UNIQUEMENT (Node.js runtime) :
 * pdf-parse et mammoth dépendent de modules Node. Ne pas importer
 * ce fichier depuis un composant "use client".
 *
 * Secret professionnel (art. 66-5 loi 1971) : cette fonction ne doit
 * JAMAIS logger le contenu extrait. Seule la taille / le word count
 * peuvent apparaître dans les logs.
 */

export interface ExtractionResult {
  text: string;
  wordCount: number;
  pageCount?: number;
  mimeType: string;
}

const MAX_BYTES = 25 * 1024 * 1024; // 25 Mo max

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<ExtractionResult> {
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(
      `Document trop volumineux (${Math.round(buffer.byteLength / 1024 / 1024)} Mo, max 25 Mo)`
    );
  }

  // PDF
  if (mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
    const mod = (await import("pdf-parse")) as unknown as {
      default?: (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    } & ((buf: Buffer) => Promise<{ text: string; numpages: number }>);
    const pdfParse = mod.default ?? (mod as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>);
    const res = await pdfParse(buffer);
    return {
      text: res.text,
      pageCount: res.numpages,
      wordCount: countWords(res.text),
      mimeType: "application/pdf",
    };
  }

  // DOCX
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName?.toLowerCase().endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const res = await mammoth.extractRawText({ buffer });
    return {
      text: res.value,
      wordCount: countWords(res.value),
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  // Texte brut
  if (mimeType === "text/plain" || fileName?.toLowerCase().match(/\.(txt|md)$/)) {
    const text = buffer.toString("utf-8");
    return {
      text,
      wordCount: countWords(text),
      mimeType: "text/plain",
    };
  }

  throw new Error(
    `Format non supporté (${mimeType || "inconnu"}). Formats acceptés : PDF, DOCX, TXT.`
  );
}
