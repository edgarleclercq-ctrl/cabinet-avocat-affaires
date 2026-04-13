import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    nom: v.string(),
    prenom: v.string(),
    poste: v.optional(v.string()),
    telephone: v.optional(v.string()),
    email: v.optional(v.string()),
    isPrincipal: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    if (args.isPrincipal) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
      for (const c of existing) {
        if (c.isPrincipal) {
          await ctx.db.patch(c._id, { isPrincipal: false });
        }
      }
    }
    return await ctx.db.insert("contacts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    nom: v.optional(v.string()),
    prenom: v.optional(v.string()),
    poste: v.optional(v.string()),
    telephone: v.optional(v.string()),
    email: v.optional(v.string()),
    isPrincipal: v.optional(v.boolean()),
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

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.id);
  },
});
