import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireRole } from "./permissions";

export const list = query({
  args: {
    clientId: v.optional(v.id("clients")),
    statut: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let propositions;
    if (args.clientId) {
      propositions = await ctx.db
        .query("propositions")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .collect();
    } else if (args.statut) {
      propositions = await ctx.db
        .query("propositions")
        .withIndex("by_statut", (q) => q.eq("statut", args.statut as any))
        .collect();
    } else {
      propositions = await ctx.db.query("propositions").collect();
    }
    return propositions;
  },
});

export const getById = query({
  args: { id: v.id("propositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    specialite: v.union(v.literal("corporate"), v.literal("litige"), v.literal("fiscal")),
    description: v.string(),
    modeFacturation: v.union(v.literal("forfait"), v.literal("temps_passe")),
    montantForfait: v.optional(v.number()),
    tauxHoraires: v.optional(v.array(v.object({ role: v.string(), taux: v.number() }))),
    phases: v.optional(v.array(v.object({ description: v.string(), montant: v.number() }))),
    conditionsPaiement: v.optional(v.string()),
    conditionsGenerales: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("propositions", {
      ...args,
      statut: "brouillon",
      createdBy: user._id,
    });
  },
});

export const updateStatut = mutation({
  args: {
    id: v.id("propositions"),
    statut: v.union(
      v.literal("brouillon"),
      v.literal("en_attente"),
      v.literal("validee"),
      v.literal("envoyee"),
      v.literal("acceptee"),
      v.literal("refusee")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const prop = await ctx.db.get(args.id);
    if (!prop) throw new Error("Proposition introuvable");

    if (["validee"].includes(args.statut) && user.role !== "associe") {
      throw new Error("Seul un associé peut valider une proposition");
    }

    const updates: Record<string, unknown> = { statut: args.statut };
    if (args.statut === "validee") {
      updates.valideeBy = user._id;
    }

    await ctx.db.patch(args.id, updates);

    await ctx.db.insert("activites", {
      clientId: prop.clientId,
      utilisateurId: user._id,
      type: "proposition_" + args.statut,
      description: `Proposition ${args.statut}`,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("propositions"),
    description: v.optional(v.string()),
    modeFacturation: v.optional(v.union(v.literal("forfait"), v.literal("temps_passe"))),
    montantForfait: v.optional(v.number()),
    tauxHoraires: v.optional(v.array(v.object({ role: v.string(), taux: v.number() }))),
    phases: v.optional(v.array(v.object({ description: v.string(), montant: v.number() }))),
    conditionsPaiement: v.optional(v.string()),
    conditionsGenerales: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});
