/**
 * Conventions d'honoraires.
 * Référence : art. 6.2 RIN — convention écrite obligatoire (sauf urgence).
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("conventions")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const getActive = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const all = await ctx.db
      .query("conventions")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
    // Priorité : signée > envoyée > brouillon (résiliée ignorée)
    const order: Record<string, number> = {
      signee: 3,
      envoyee: 2,
      brouillon: 1,
      resiliee: 0,
    };
    return (
      all
        .filter((c) => c.statut !== "resiliee")
        .sort((a, b) => (order[b.statut] ?? 0) - (order[a.statut] ?? 0))[0] ??
      null
    );
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    type: v.union(
      v.literal("forfait"),
      v.literal("tempsPasse"),
      v.literal("mixte")
    ),
    montantForfait: v.optional(v.number()),
    tauxHoraire: v.optional(v.number()),
    plafond: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") {
      throw new Error("Accès refusé — rôle insuffisant");
    }
    return await ctx.db.insert("conventions", {
      ...args,
      statut: "brouillon",
    });
  },
});

export const marquerSignee = mutation({
  args: {
    id: v.id("conventions"),
    storageIdPdf: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "associe") {
      throw new Error(
        "Seul un associé peut marquer une convention comme signée (art. 6.2 RIN)."
      );
    }
    await ctx.db.patch(args.id, {
      statut: "signee",
      signedAt: Date.now(),
      storageIdPdf: args.storageIdPdf,
    });
  },
});
