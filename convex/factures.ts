import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, canCreateFacture, canValidateFacture } from "./permissions";

export const list = query({
  args: {
    clientId: v.optional(v.id("clients")),
    dossierId: v.optional(v.id("dossiers")),
    statut: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user.role === "stagiaire") return [];

    let factures;
    if (args.clientId) {
      factures = await ctx.db
        .query("factures")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .collect();
    } else if (args.dossierId) {
      factures = await ctx.db
        .query("factures")
        .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId!))
        .collect();
    } else if (args.statut) {
      factures = await ctx.db
        .query("factures")
        .withIndex("by_statut", (q) => q.eq("statut", args.statut as any))
        .collect();
    } else {
      factures = await ctx.db.query("factures").collect();
    }

    return factures;
  },
});

export const getById = query({
  args: { id: v.id("factures") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    dossierId: v.optional(v.id("dossiers")),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    description: v.string(),
    montantHT: v.number(),
    tva: v.number(),
    montantTTC: v.number(),
    dateEcheance: v.string(),
    acomptesDeduits: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canCreateFacture(user.role)) throw new Error("Accès refusé");

    const allFactures = await ctx.db.query("factures").collect();
    const numero = `FAC-${new Date().getFullYear()}-${String(allFactures.length + 1).padStart(4, "0")}`;

    return await ctx.db.insert("factures", {
      ...args,
      numero,
      statut: "brouillon",
      dateEmission: new Date().toISOString().split("T")[0],
      createdBy: user._id,
    });
  },
});

export const updateStatut = mutation({
  args: {
    id: v.id("factures"),
    statut: v.union(
      v.literal("brouillon"),
      v.literal("en_attente"),
      v.literal("validee"),
      v.literal("envoyee"),
      v.literal("payee_partiellement"),
      v.literal("payee"),
      v.literal("en_retard"),
      v.literal("annulee")
    ),
    datePaiement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (["validee"].includes(args.statut) && !canValidateFacture(user.role)) {
      throw new Error("Seul un associé peut valider une facture");
    }

    const updates: Record<string, unknown> = { statut: args.statut };
    if (args.statut === "validee") updates.valideeBy = user._id;
    if (args.datePaiement) updates.datePaiement = args.datePaiement;

    await ctx.db.patch(args.id, updates);
  },
});

export const stats = query({
  args: { mois: v.optional(v.string()) },
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const factures = await ctx.db.query("factures").collect();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const duMois = factures.filter((f) => f.dateEmission.startsWith(currentMonth));

    const emis = duMois.reduce((acc, f) => acc + f.montantTTC, 0);
    const encaisse = duMois
      .filter((f) => f.statut === "payee")
      .reduce((acc, f) => acc + f.montantTTC, 0);
    const impaye = factures
      .filter((f) => f.statut === "en_retard")
      .reduce((acc, f) => acc + f.montantTTC, 0);

    const payees = factures.filter((f) => f.statut === "payee").length;
    const total = factures.filter((f) => !["brouillon", "annulee"].includes(f.statut)).length;
    const tauxRecouvrement = total > 0 ? Math.round((payees / total) * 100) : 0;

    return { emis, encaisse, impaye, tauxRecouvrement };
  },
});

export const addRelance = mutation({
  args: {
    id: v.id("factures"),
    niveau: v.number(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const facture = await ctx.db.get(args.id);
    if (!facture) throw new Error("Facture introuvable");

    const relances = facture.relances || [];
    relances.push({
      date: new Date().toISOString().split("T")[0],
      niveau: args.niveau,
      type: args.type,
    });

    await ctx.db.patch(args.id, { relances });
  },
});
