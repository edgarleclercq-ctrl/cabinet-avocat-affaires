import { action, internalMutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/* ======================================================================
   Actions existantes — analyse simple + rédaction
   ====================================================================== */

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

/* ======================================================================
   Nouvelle action — analyse de cohérence avec Légifrance (tool use)
   ======================================================================
   Architecture :
   - Claude orchestre l'analyse avec 2 tools (legifrance_search, legifrance_get_article)
   - Boucle tool_use : max 6 tours pour éviter les coûts runaway
   - Le document du client est envoyé à Anthropic uniquement (jamais logué)
   - Les recherches Légifrance passent par PISTE (domaine public)
   - Résultat stocké dans `analysesCoherence` + entrée dans `analyseIA`

   Secret professionnel (art. 66-5 loi 1971) : aucun log ne contient
   le contenu du document, uniquement taille + nb de tours.
====================================================================== */

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOOL_TURNS = 6;

const TOOLS = [
  {
    name: "legifrance_search",
    description:
      "Recherche d'articles ou de jurisprudence sur Légifrance. Utilise ceci pour vérifier la conformité d'une clause avec le droit français positif ou la jurisprudence.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Termes de recherche en français (ex : 'clause pénale manifestement excessive', 'déséquilibre significatif').",
        },
        type: {
          type: "string",
          enum: ["article", "juri"],
          description: "'article' pour les textes légaux, 'juri' pour la jurisprudence.",
        },
        code: {
          type: "string",
          enum: ["CCIV", "CCOM", "CTRAV", "CCONSO"],
          description: "Optionnel — limiter à un code spécifique.",
        },
      },
      required: ["query", "type"],
    },
  },
  {
    name: "legifrance_get_article",
    description: "Récupère le texte intégral et actuel d'un article par son CID Légifrance.",
    input_schema: {
      type: "object",
      properties: {
        cid: {
          type: "string",
          description:
            "Identifiant Légifrance de l'article (ex : LEGIARTI000032040861).",
        },
      },
      required: ["cid"],
    },
  },
] as const;

const SYSTEM_PROMPT = `Tu es un avocat d'affaires expérimenté en droit français qui audite un document juridique pour un confrère.

Ton rôle :
1. Identifier les clauses-clés et les citer fidèlement (verbatim ou très proche).
2. Détecter les contradictions INTERNES entre clauses du document.
3. Vérifier la conformité de chaque clause sensible avec le droit POSITIF français et la JURISPRUDENCE établie.
4. Classer chaque problème en : info / attention / critique.
5. Produire des recommandations concrètes et priorisées.

Règles absolues :
- Tu DOIS utiliser les outils \`legifrance_search\` et \`legifrance_get_article\` pour vérifier toute affirmation réglementaire.
- Ne cite JAMAIS un article ou un arrêt que tu n'as pas vérifié via l'outil — préfère écrire "références à vérifier" plutôt qu'inventer un numéro.
- Si un outil renvoie 0 résultat, reformule une fois puis conclus avec \`references: []\` pour la clause concernée.
- Limite-toi à 6 appels d'outils maximum — sois stratégique.

Format de sortie OBLIGATOIRE — ta dernière réponse (sans tool_use) DOIT contenir un bloc \`<output>\` avec un JSON strict suivant ce schéma :

<output>
{
  "resumeExecutif": "2-4 phrases synthétiques sur le document et les risques principaux",
  "clausesCles": [
    {
      "titre": "Titre court de la clause",
      "contenu": "Extrait fidèle de la clause",
      "references": [
        { "type": "article"|"juri", "cid": "LEGIARTI…", "citation": "C. civ. art. 1171", "url": "https://..." }
      ]
    }
  ],
  "incoherencesInternes": [
    {
      "clauseA": "Extrait clause 1",
      "clauseB": "Extrait clause 2",
      "explication": "Pourquoi ces deux clauses se contredisent",
      "gravite": "info"|"attention"|"critique"
    }
  ],
  "nonConformites": [
    {
      "clause": "Extrait de la clause problématique",
      "reglePatrimoniale": "Règle violée (ex : C. civ. art. 1171 ; Cass. Com. 22 oct 1996, Chronopost)",
      "referenceCid": "LEGIARTI000032040911",
      "referenceUrl": "https://...",
      "explication": "Pourquoi la clause est non conforme",
      "gravite": "info"|"attention"|"critique"
    }
  ],
  "recommandations": [
    {
      "titre": "Titre de l'action",
      "description": "Description concrète",
      "priorite": "low"|"medium"|"high"
    }
  ]
}
</output>

Si le document est manifestement hors-sujet (non juridique, vide, trop court), renvoie ce JSON mais avec des tableaux vides et un resumeExecutif expliquant pourquoi.`;

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    };

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[] | Array<{
    type: "tool_result";
    tool_use_id: string;
    content: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Exécution des tools Légifrance côté serveur                         */
/* ------------------------------------------------------------------ */

interface LegifranceCallResult {
  ok: boolean;
  source: "mock" | "real";
  payload: unknown;
  error?: string;
}

async function runLegifranceTool(
  name: string,
  input: Record<string, unknown>
): Promise<LegifranceCallResult> {
  const { getLegifranceClient } = await import("../lib/integrations/legifrance");
  const client = getLegifranceClient();
  const source: "mock" | "real" = client.isRealBackend ? "real" : "mock";

  try {
    if (name === "legifrance_search") {
      const query = String(input.query ?? "").slice(0, 500);
      const type = input.type === "juri" ? "juri" : "article";
      const code =
        input.code === "CCIV" || input.code === "CCOM" ||
        input.code === "CTRAV" || input.code === "CCONSO"
          ? String(input.code)
          : undefined;

      if (type === "juri") {
        const results = await client.searchJurisprudence({
          query,
          limit: 3,
        });
        return { ok: true, source, payload: { results } };
      } else {
        const results = await client.searchArticle({
          query,
          code,
          limit: 5,
        });
        return { ok: true, source, payload: { results } };
      }
    }

    if (name === "legifrance_get_article") {
      const cid = String(input.cid ?? "");
      if (!cid) throw new Error("cid manquant");
      const article = await client.getArticle(cid);
      return { ok: true, source, payload: { article } };
    }

    return { ok: false, source, payload: null, error: `tool inconnu: ${name}` };
  } catch (e) {
    return {
      ok: false,
      source,
      payload: null,
      error: e instanceof Error ? e.message : "erreur inconnue",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Parsing de l'output JSON                                            */
/* ------------------------------------------------------------------ */

function extractJsonOutput(text: string): unknown {
  const match = text.match(/<output>([\s\S]*?)<\/output>/i);
  const raw = match ? match[1] : text;
  // Best effort : on cherche un objet JSON balancé dans raw
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new ConvexError(
      "La réponse de Claude ne contient pas de JSON exploitable."
    );
  }
  const candidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    throw new ConvexError(
      `JSON mal formé dans la réponse : ${(e as Error).message}`
    );
  }
}

type Gravite = "info" | "attention" | "critique";
type Priorite = "low" | "medium" | "high";

interface CoherenceResult {
  resumeExecutif: string;
  clausesCles: Array<{
    titre: string;
    contenu: string;
    references: Array<{
      type: "article" | "juri";
      cid: string;
      citation: string;
      url?: string;
    }>;
  }>;
  incoherencesInternes: Array<{
    clauseA: string;
    clauseB: string;
    explication: string;
    gravite: Gravite;
  }>;
  nonConformites: Array<{
    clause: string;
    reglePatrimoniale: string;
    referenceCid?: string;
    referenceUrl?: string;
    explication: string;
    gravite: Gravite;
  }>;
  recommandations: Array<{
    titre: string;
    description: string;
    priorite: Priorite;
  }>;
}

function sanitizeGravite(v: unknown): Gravite {
  return v === "critique" || v === "attention" || v === "info"
    ? v
    : "info";
}

function sanitizePriorite(v: unknown): Priorite {
  return v === "high" || v === "medium" || v === "low" ? v : "medium";
}

function sanitizeResult(raw: unknown): CoherenceResult {
  const r = raw as Partial<CoherenceResult> & Record<string, unknown>;
  const asArray = (v: unknown): any[] => (Array.isArray(v) ? v : []);
  const asStr = (v: unknown): string =>
    typeof v === "string" ? v : v == null ? "" : String(v);

  return {
    resumeExecutif: asStr(r.resumeExecutif),
    clausesCles: asArray(r.clausesCles).map((c: any) => ({
      titre: asStr(c?.titre),
      contenu: asStr(c?.contenu),
      references: asArray(c?.references)
        .map((ref: any) => ({
          type: ref?.type === "juri" ? ("juri" as const) : ("article" as const),
          cid: asStr(ref?.cid),
          citation: asStr(ref?.citation),
          url: typeof ref?.url === "string" ? ref.url : undefined,
        }))
        .filter((ref) => ref.cid && ref.citation),
    })),
    incoherencesInternes: asArray(r.incoherencesInternes).map((x: any) => ({
      clauseA: asStr(x?.clauseA),
      clauseB: asStr(x?.clauseB),
      explication: asStr(x?.explication),
      gravite: sanitizeGravite(x?.gravite),
    })),
    nonConformites: asArray(r.nonConformites).map((x: any) => ({
      clause: asStr(x?.clause),
      reglePatrimoniale: asStr(x?.reglePatrimoniale),
      referenceCid:
        typeof x?.referenceCid === "string" ? x.referenceCid : undefined,
      referenceUrl:
        typeof x?.referenceUrl === "string" ? x.referenceUrl : undefined,
      explication: asStr(x?.explication),
      gravite: sanitizeGravite(x?.gravite),
    })),
    recommandations: asArray(r.recommandations).map((x: any) => ({
      titre: asStr(x?.titre),
      description: asStr(x?.description),
      priorite: sanitizePriorite(x?.priorite),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Action principale                                                    */
/* ------------------------------------------------------------------ */

export const analyserCoherence = action({
  args: {
    dossierId: v.id("dossiers"),
    documentId: v.optional(v.id("documents")),
    contenuDocument: v.string(),
    typeDocument: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ConvexError(
        "Clé ANTHROPIC_API_KEY manquante. Ajoutez-la dans les env vars Convex."
      );
    }

    // On limite le texte envoyé (Claude a un context mais on évite les abus)
    const contenu = args.contenuDocument.slice(0, 200_000);
    const typeDocStr = args.typeDocument
      ? `\n\nType de document indiqué : ${args.typeDocument}`
      : "";

    const userMessage = `Voici le document à auditer.${typeDocStr}

Document :
"""
${contenu}
"""

Procède à l'audit en suivant strictement tes instructions. Utilise les outils Légifrance pour vérifier toute affirmation réglementaire, puis produis le rapport JSON dans un bloc <output>.`;

    const messages: AnthropicMessage[] = [
      { role: "user", content: userMessage },
    ];

    let sourceBackend: "mock" | "real" = "mock";
    let rawFinalText = "";

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        }),
      });

      if (!res.ok) {
        const details = await res.text();
        throw new ConvexError(
          `Anthropic API ${res.status}: ${details.slice(0, 300)}`
        );
      }

      const data = (await res.json()) as {
        content: AnthropicContentBlock[];
        stop_reason: string;
      };

      const blocks = data.content ?? [];
      const toolUses = blocks.filter(
        (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> =>
          b.type === "tool_use"
      );

      if (toolUses.length === 0) {
        // Fin de conversation — récupère le texte et parse
        rawFinalText = blocks
          .filter(
            (b): b is Extract<AnthropicContentBlock, { type: "text" }> =>
              b.type === "text"
          )
          .map((b) => b.text)
          .join("\n");
        break;
      }

      // Renvoie l'assistant message avec les tool_use
      messages.push({ role: "assistant", content: blocks });

      // Exécute chaque tool et construit le message user suivant
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const tu of toolUses) {
        const result = await runLegifranceTool(tu.name, tu.input);
        if (result.source === "real") sourceBackend = "real";
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });

      // Log minimal (pas de contenu doc, uniquement metadata)
      console.log(
        `[analyserCoherence] tour ${turn + 1} — ${toolUses.length} tool call(s), source=${sourceBackend}`
      );
    }

    if (!rawFinalText) {
      throw new ConvexError(
        "Claude a dépassé le nombre maximum de tours d'outils sans produire de rapport."
      );
    }

    const parsed = sanitizeResult(extractJsonOutput(rawFinalText));

    // Persistance (best effort — si l'auth échoue on renvoie quand même
    // le résultat au client)
    let analyseIaId: Id<"analyseIA"> | null = null;
    try {
      analyseIaId = await ctx.runMutation(internal.ia.saveAnalyseInternal, {
        dossierId: args.dossierId,
        documentId: args.documentId,
        type: "coherence",
        resultat: rawFinalText,
        prompt: SYSTEM_PROMPT,
        modele: CLAUDE_MODEL,
      });

      if (analyseIaId) {
        await ctx.runMutation(internal.ia.saveCoherenceInternal, {
          analyseIaId,
          dossierId: args.dossierId,
          documentId: args.documentId,
          typeDocument: args.typeDocument,
          resumeExecutif: parsed.resumeExecutif,
          clausesCles: parsed.clausesCles,
          incoherencesInternes: parsed.incoherencesInternes,
          nonConformites: parsed.nonConformites,
          recommandations: parsed.recommandations,
          sourceBackend,
          modele: CLAUDE_MODEL,
        });
      }
    } catch (e) {
      console.log(
        `[analyserCoherence] persistance échouée: ${(e as Error).message}`
      );
    }

    return {
      ...parsed,
      sourceBackend,
      modele: CLAUDE_MODEL,
    };
  },
});

/* ======================================================================
   Mutations internes + queries
   ====================================================================== */

export const saveAnalyseInternal = internalMutation({
  args: {
    dossierId: v.id("dossiers"),
    documentId: v.optional(v.id("documents")),
    type: v.union(
      v.literal("analyse"),
      v.literal("redaction"),
      v.literal("coherence")
    ),
    resultat: v.string(),
    prompt: v.string(),
    modele: v.string(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyseIA", {
      dossierId: args.dossierId,
      documentId: args.documentId,
      type: args.type,
      resultat: args.resultat,
      prompt: args.prompt,
      modele: args.modele,
      createdBy: args.createdBy as Id<"users">,
    });
  },
});

export const saveCoherenceInternal = internalMutation({
  args: {
    analyseIaId: v.id("analyseIA"),
    dossierId: v.id("dossiers"),
    documentId: v.optional(v.id("documents")),
    typeDocument: v.optional(v.string()),
    resumeExecutif: v.string(),
    clausesCles: v.array(
      v.object({
        titre: v.string(),
        contenu: v.string(),
        references: v.array(
          v.object({
            type: v.union(v.literal("article"), v.literal("juri")),
            cid: v.string(),
            citation: v.string(),
            url: v.optional(v.string()),
          })
        ),
      })
    ),
    incoherencesInternes: v.array(
      v.object({
        clauseA: v.string(),
        clauseB: v.string(),
        explication: v.string(),
        gravite: v.union(
          v.literal("info"),
          v.literal("attention"),
          v.literal("critique")
        ),
      })
    ),
    nonConformites: v.array(
      v.object({
        clause: v.string(),
        reglePatrimoniale: v.string(),
        referenceCid: v.optional(v.string()),
        referenceUrl: v.optional(v.string()),
        explication: v.string(),
        gravite: v.union(
          v.literal("info"),
          v.literal("attention"),
          v.literal("critique")
        ),
      })
    ),
    recommandations: v.array(
      v.object({
        titre: v.string(),
        description: v.string(),
        priorite: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
      })
    ),
    sourceBackend: v.union(v.literal("mock"), v.literal("real")),
    modele: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analysesCoherence", {
      ...args,
      createdBy: undefined as unknown as Id<"users">,
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

export const listCoherencesByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysesCoherence")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .order("desc")
      .collect();
  },
});
