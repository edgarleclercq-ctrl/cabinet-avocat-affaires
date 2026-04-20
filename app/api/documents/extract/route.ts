import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/documents/extractor";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Extrait le texte d'un document uploadé (PDF / DOCX / TXT).
 *
 * Route server-side uniquement — pdf-parse et mammoth ne peuvent pas
 * tourner dans edge runtime. Ne logge jamais le texte extrait
 * (secret professionnel — art. 66-5 loi 1971).
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Aucun fichier fourni (champ 'file' manquant)." },
        { status: 400 }
      );
    }

    const fileName = (form.get("fileName") as string) || (file as File).name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await extractText(buffer, file.type, fileName);

    // On ne loggue volontairement QUE la taille/wordCount, jamais le texte
    // (secret professionnel).
    console.log(
      `[extract] ${fileName} (${res.mimeType}) — ${res.wordCount} mots, ${res.pageCount ?? "?"} pages`
    );

    return NextResponse.json(res);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur d'extraction inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
