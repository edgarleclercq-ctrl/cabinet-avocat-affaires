/**
 * Sous-comptes CARPA (un par dossier).
 * Référence : art. P.75.1 RIBP, art. 12 décret 12/07/2005 — comptabilité
 * distincte par dossier, traçabilité stricte.
 *
 * Les fonds CARPA sont détenus POUR LE COMPTE DES CLIENTS. Ils ne doivent
 * JAMAIS apparaître comme trésorerie disponible du cabinet.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const getByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("sousComptesCARPA")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .first();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") return [];
    return await ctx.db.query("sousComptesCARPA").collect();
  },
});

/**
 * Total agrégé des soldes CARPA. À utiliser sur le dashboard cabinet
 * avec la mention déontologique "Fonds détenus pour compte de tiers —
 * non disponibles".
 */
export const totalCarpa = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") return { total: 0, nbSousComptes: 0 };
    const all = await ctx.db.query("sousComptesCARPA").collect();
    return {
      total: all.reduce((acc, s) => acc + s.solde, 0),
      nbSousComptes: all.length,
    };
  },
});

export const createForDossier = mutation({
  args: {
    dossierId: v.id("dossiers"),
    numero: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "associe" && user.role !== "secretaire") {
      throw new Error("Accès refusé");
    }
    const existing = await ctx.db
      .query("sousComptesCARPA")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .first();
    if (existing) {
      throw new Error("Ce dossier a déjà un sous-compte CARPA.");
    }
    return await ctx.db.insert("sousComptesCARPA", {
      ...args,
      solde: 0,
    });
  },
});
