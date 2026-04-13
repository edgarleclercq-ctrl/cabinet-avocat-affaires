import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const list = query({
  args: {
    dossierId: v.optional(v.id("dossiers")),
    responsableId: v.optional(v.id("users")),
    statut: v.optional(v.string()),
    jours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let echeances;
    if (args.dossierId) {
      echeances = await ctx.db
        .query("echeances")
        .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId!))
        .collect();
    } else if (args.responsableId) {
      echeances = await ctx.db
        .query("echeances")
        .withIndex("by_responsable", (q) => q.eq("responsableId", args.responsableId!))
        .collect();
    } else {
      echeances = await ctx.db.query("echeances").collect();
    }

    if (args.statut) {
      echeances = echeances.filter((e) => e.statut === args.statut);
    }

    if (args.jours) {
      const limit = new Date();
      limit.setDate(limit.getDate() + args.jours);
      const limitStr = limit.toISOString().split("T")[0];
      echeances = echeances.filter((e) => e.date <= limitStr);
    }

    return echeances.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    description: v.string(),
    date: v.string(),
    responsableId: v.id("users"),
    type: v.union(
      v.literal("procedurale"),
      v.literal("fiscale"),
      v.literal("administrative"),
      v.literal("ag")
    ),
    rappels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("echeances", {
      ...args,
      statut: "a_venir",
    });
  },
});

export const updateStatut = mutation({
  args: {
    id: v.id("echeances"),
    statut: v.union(
      v.literal("a_venir"),
      v.literal("en_retard"),
      v.literal("traitee")
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { statut: args.statut });
  },
});

export const upcoming = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const echeances = await ctx.db.query("echeances").collect();
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + args.days);
    const nowStr = now.toISOString().split("T")[0];
    const limitStr = limit.toISOString().split("T")[0];

    return echeances
      .filter((e) => e.statut !== "traitee" && e.date >= nowStr && e.date <= limitStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const overdue = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const now = new Date().toISOString().split("T")[0];
    const echeances = await ctx.db.query("echeances").collect();
    return echeances.filter((e) => e.statut === "a_venir" && e.date < now);
  },
});
