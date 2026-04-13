import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireRole } from "./permissions";

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await requireUser(ctx);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const invite = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("associe"),
      v.literal("collaborateur"),
      v.literal("secretaire"),
      v.literal("stagiaire")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["associe"]);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Cet email est déjà utilisé");

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      invitedBy: user._id,
      isActive: true,
    });
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("associe"),
      v.literal("collaborateur"),
      v.literal("secretaire"),
      v.literal("stagiaire")
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["associe"]);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const deactivate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["associe"]);
    await ctx.db.patch(args.userId, { isActive: false });
  },
});

// Seed: create first associe if no users exist
export const seed = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").first();
    if (existing) throw new Error("Des utilisateurs existent déjà");

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: "associe",
      isActive: true,
    });
  },
});
