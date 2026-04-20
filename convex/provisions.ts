/**
 * Provisions versées par les clients sur les sous-comptes CARPA.
 * Une provision "recue" apparaît au bilan CARPA du dossier.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("provisions")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const totalRecues = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const provisions = await ctx.db
      .query("provisions")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
    return provisions
      .filter((p) => p.statut === "recue")
      .reduce((acc, p) => acc + p.montant, 0);
  },
});

export const enregistrerAttendue = mutation({
  args: {
    dossierId: v.id("dossiers"),
    sousCompteCarpaId: v.id("sousComptesCARPA"),
    montant: v.number(),
    dateVersement: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") throw new Error("Accès refusé");
    return await ctx.db.insert("provisions", {
      ...args,
      statut: "attendue",
    });
  },
});

export const confirmerRecue = mutation({
  args: {
    id: v.id("provisions"),
    storageIdJustificatif: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") throw new Error("Accès refusé");
    await ctx.db.patch(args.id, {
      statut: "recue",
      storageIdJustificatif: args.storageIdJustificatif,
    });
  },
});
