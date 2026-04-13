import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("tempsPasses")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    date: v.string(),
    dureeMinutes: v.number(),
    description: v.string(),
    tauxHoraire: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("tempsPasses", {
      ...args,
      intervenantId: user._id,
    });
  },
});

export const totalByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const temps = await ctx.db
      .query("tempsPasses")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();

    const totalMinutes = temps.reduce((acc, t) => acc + t.dureeMinutes, 0);
    const totalMontant = temps.reduce(
      (acc, t) => acc + (t.dureeMinutes / 60) * t.tauxHoraire,
      0
    );

    return { totalMinutes, totalMontant, entries: temps };
  },
});
