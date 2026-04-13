import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const list = query({
  args: {
    dossierId: v.optional(v.id("dossiers")),
    clientId: v.optional(v.id("clients")),
    utilisateurId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    let activites;
    if (args.dossierId) {
      activites = await ctx.db
        .query("activites")
        .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId!))
        .order("desc")
        .collect();
    } else if (args.clientId) {
      activites = await ctx.db
        .query("activites")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .order("desc")
        .collect();
    } else if (args.utilisateurId) {
      activites = await ctx.db
        .query("activites")
        .withIndex("by_utilisateur", (q) => q.eq("utilisateurId", args.utilisateurId!))
        .order("desc")
        .collect();
    } else {
      activites = await ctx.db.query("activites").order("desc").collect();
    }

    if (args.limit) {
      activites = activites.slice(0, args.limit);
    }

    return activites;
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("activites")
      .order("desc")
      .take(args.limit ?? 20);
  },
});
