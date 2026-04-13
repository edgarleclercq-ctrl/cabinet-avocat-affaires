import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, canViewAllClients, canCreateClient, canDeleteClient } from "./permissions";

export const list = query({
  args: {
    search: v.optional(v.string()),
    specialite: v.optional(v.string()),
    avocatReferentId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let clients;
    if (args.search) {
      clients = await ctx.db
        .query("clients")
        .withSearchIndex("search_clients", (q) => {
          let query = q.search("denomination", args.search!);
          if (args.isActive !== undefined) query = query.eq("isActive", args.isActive);
          if (args.avocatReferentId) query = query.eq("avocatReferentId", args.avocatReferentId);
          return query;
        })
        .collect();
    } else {
      clients = await ctx.db.query("clients").collect();
    }

    if (!canViewAllClients(user.role)) {
      clients = clients.filter(
        (c) => c.avocatReferentId === user._id
      );
    }

    if (args.isActive !== undefined && !args.search) {
      clients = clients.filter((c) => c.isActive === args.isActive);
    }

    return clients;
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("personne_morale"), v.literal("personne_physique")),
    denomination: v.string(),
    prenom: v.optional(v.string()),
    nom: v.optional(v.string()),
    formeJuridique: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    siegeSocial: v.optional(v.string()),
    capitalSocial: v.optional(v.string()),
    dirigeants: v.optional(v.string()),
    secteurActivite: v.optional(v.string()),
    dateCreation: v.optional(v.string()),
    avocatReferentId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    specialites: v.optional(v.array(v.union(
      v.literal("corporate"),
      v.literal("litige"),
      v.literal("fiscal")
    ))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canCreateClient(user.role)) throw new Error("Accès refusé");

    const clientId = await ctx.db.insert("clients", {
      ...args,
      isActive: true,
    });

    await ctx.db.insert("activites", {
      clientId,
      utilisateurId: user._id,
      type: "client_cree",
      description: `Client "${args.denomination}" créé`,
    });

    return clientId;
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    type: v.optional(v.union(v.literal("personne_morale"), v.literal("personne_physique"))),
    denomination: v.optional(v.string()),
    prenom: v.optional(v.string()),
    nom: v.optional(v.string()),
    formeJuridique: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    siegeSocial: v.optional(v.string()),
    capitalSocial: v.optional(v.string()),
    dirigeants: v.optional(v.string()),
    secteurActivite: v.optional(v.string()),
    dateCreation: v.optional(v.string()),
    avocatReferentId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    specialites: v.optional(v.array(v.union(
      v.literal("corporate"),
      v.literal("litige"),
      v.literal("fiscal")
    ))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canCreateClient(user.role)) throw new Error("Accès refusé");

    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);

    await ctx.db.insert("activites", {
      clientId: id,
      utilisateurId: user._id,
      type: "client_modifie",
      description: `Client modifié`,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canDeleteClient(user.role)) throw new Error("Seul un associé peut supprimer un client");
    await ctx.db.patch(args.id, { isActive: false });
  },
});
