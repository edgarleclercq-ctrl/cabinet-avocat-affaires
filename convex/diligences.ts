/**
 * Diligences — prestations facturables saisies par les intervenants.
 * Base du calcul "temps passé valorisé" (Pilier 2 LegalPay).
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("diligences")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    date: v.string(),
    description: v.string(),
    dureeMinutes: v.number(),
    tauxHoraire: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.dureeMinutes <= 0) {
      throw new Error("La durée doit être positive.");
    }
    const montantValorise = Math.round((args.dureeMinutes / 60) * args.tauxHoraire);
    return await ctx.db.insert("diligences", {
      ...args,
      montantValorise,
      saisiePar: user._id,
    });
  },
});
