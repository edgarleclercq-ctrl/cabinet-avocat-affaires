import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const analyserDocument = action({
  args: {
    dossierId: v.id("dossiers"),
    documentId: v.id("documents"),
    contenuDocument: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Tu es un assistant juridique expert en droit des affaires français. Analyse le document suivant et produis une analyse structurée.

Document à analyser :
${args.contenuDocument}

Produis l'analyse suivante au format JSON :
{
  "resume": "Synthèse du document en 3-5 points clés",
  "clausesCles": [{"titre": "...", "contenu": "...", "analyse": "..."}],
  "obligations": [{"partie": "...", "obligation": "...", "date": "...", "conditions": "..."}],
  "pointsAttention": [{"titre": "...", "description": "...", "niveau": "info|attention|critique"}]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const resultat = data.content?.[0]?.text || "Erreur lors de l'analyse";

    await ctx.runMutation(internal.ia.saveAnalyseInternal, {
      dossierId: args.dossierId,
      documentId: args.documentId,
      type: "analyse",
      resultat,
      prompt,
      modele: "claude-sonnet-4-20250514",
    });

    return resultat;
  },
});

export const rediger = action({
  args: {
    dossierId: v.id("dossiers"),
    typeDocument: v.string(),
    instructions: v.string(),
    contexte: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Tu es un assistant juridique expert en droit des affaires français. Rédige un brouillon de document juridique.

Type de document : ${args.typeDocument}
Contexte du dossier : ${args.contexte}
Instructions spécifiques : ${args.instructions}

IMPORTANT :
- Ce document est un BROUILLON qui devra être vérifié et validé par un avocat
- Utilise un style juridique formel et précis
- Inclus toutes les mentions obligatoires pour ce type de document
- Structure le document avec des titres et sous-titres clairs

Rédige le document complet.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const resultat = data.content?.[0]?.text || "Erreur lors de la rédaction";

    await ctx.runMutation(internal.ia.saveAnalyseInternal, {
      dossierId: args.dossierId,
      type: "redaction",
      resultat,
      prompt,
      modele: "claude-sonnet-4-20250514",
    });

    return resultat;
  },
});

export const saveAnalyseInternal = internalMutation({
  args: {
    dossierId: v.id("dossiers"),
    documentId: v.optional(v.id("documents")),
    type: v.union(v.literal("analyse"), v.literal("redaction")),
    resultat: v.string(),
    prompt: v.string(),
    modele: v.string(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyseIA", {
      dossierId: args.dossierId,
      documentId: args.documentId,
      type: args.type,
      resultat: args.resultat,
      prompt: args.prompt,
      modele: args.modele,
      createdBy: args.createdBy as any,
    });
  },
});

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyseIA")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .order("desc")
      .collect();
  },
});
