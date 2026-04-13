import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, canAccessConflits } from "./permissions";

// Fuzzy match: normalize and compare strings
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check word overlap
  const wordsA = na.split(" ").filter((w) => w.length > 2);
  const wordsB = nb.split(" ").filter((w) => w.length > 2);
  const common = wordsA.filter((w) => wordsB.includes(w));
  return common.length >= Math.min(wordsA.length, wordsB.length) * 0.5;
}

export const verify = mutation({
  args: {
    clientId: v.id("clients"),
    partiesAdverses: v.array(v.string()),
    dossierId: v.optional(v.id("dossiers")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canAccessConflits(user.role)) throw new Error("Accès refusé");

    const allClients = await ctx.db.query("clients").collect();
    const allDossiers = await ctx.db.query("dossiers").collect();

    const conflicts: Array<{
      type: string;
      partie: string;
      dossierRef?: string;
      clientDenomination?: string;
    }> = [];

    for (const partie of args.partiesAdverses) {
      // Check if adverse party is a current/past client
      for (const client of allClients) {
        if (client._id === args.clientId) continue;
        if (fuzzyMatch(client.denomination, partie)) {
          conflicts.push({
            type: "partie_adverse_est_client",
            partie,
            clientDenomination: client.denomination,
          });
        }
      }

      // Check if client appears as adverse party in another case
      for (const dossier of allDossiers) {
        if (dossier.clientId === args.clientId) continue;
        for (const pa of dossier.partiesAdverses || []) {
          const clientData = await ctx.db.get(args.clientId);
          if (clientData && fuzzyMatch(pa.denomination, clientData.denomination)) {
            conflicts.push({
              type: "client_est_partie_adverse_ailleurs",
              partie: clientData.denomination,
              dossierRef: dossier.reference,
            });
          }
        }
      }
    }

    const resultat = conflicts.length === 0 ? "aucun" as const : "potentiel" as const;

    await ctx.db.insert("conflitsVerifications", {
      dossierId: args.dossierId,
      clientId: args.clientId,
      partiesVerifiees: args.partiesAdverses,
      resultat,
      details: conflicts.length > 0 ? JSON.stringify(conflicts) : undefined,
      verifiePar: user._id,
    });

    return { resultat, conflicts };
  },
});

export const listVerifications = query({
  args: { dossierId: v.optional(v.id("dossiers")) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canAccessConflits(user.role)) return [];

    if (args.dossierId) {
      return await ctx.db
        .query("conflitsVerifications")
        .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId!))
        .collect();
    }
    return await ctx.db.query("conflitsVerifications").collect();
  },
});

export const updateResultat = mutation({
  args: {
    id: v.id("conflitsVerifications"),
    resultat: v.union(v.literal("aucun"), v.literal("potentiel"), v.literal("confirme")),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { resultat: args.resultat });
  },
});
