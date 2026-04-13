import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: {
    dossierId: v.id("dossiers"),
    categorie: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    if (args.categorie) {
      return await ctx.db
        .query("documents")
        .withIndex("by_dossier_categorie", (q: any) =>
          q.eq("dossierId", args.dossierId).eq("categorie", args.categorie!)
        )
        .collect();
    }
    return await ctx.db
      .query("documents")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getVersions = query({
  args: { parentId: v.id("documents") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("documents")
      .withIndex("by_parent", (q) => q.eq("parentDocumentId", args.parentId))
      .collect();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    nom: v.string(),
    categorie: v.string(),
    storageId: v.optional(v.id("_storage")),
    taille: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    commentaire: v.optional(v.string()),
    parentDocumentId: v.optional(v.id("documents")),
    isIAGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let version = 1;
    if (args.parentDocumentId) {
      const siblings = await ctx.db
        .query("documents")
        .withIndex("by_parent", (q) => q.eq("parentDocumentId", args.parentDocumentId!))
        .collect();
      version = siblings.length + 2;
    }

    const docId = await ctx.db.insert("documents", {
      dossierId: args.dossierId,
      nom: args.nom,
      categorie: args.categorie,
      version,
      auteurId: user._id,
      commentaire: args.commentaire,
      storageId: args.storageId,
      taille: args.taille,
      mimeType: args.mimeType,
      statutValidation: "a_relire",
      isLocked: false,
      parentDocumentId: args.parentDocumentId,
      isIAGenerated: args.isIAGenerated ?? false,
    });

    await ctx.db.insert("activites", {
      dossierId: args.dossierId,
      utilisateurId: user._id,
      type: "document_ajoute",
      description: `Document "${args.nom}" v${version} ajouté`,
    });

    return docId;
  },
});

export const updateValidation = mutation({
  args: {
    id: v.id("documents"),
    statutValidation: v.union(
      v.literal("a_relire"),
      v.literal("relu"),
      v.literal("valide")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const updates: Record<string, unknown> = { statutValidation: args.statutValidation };
    if (args.statutValidation === "relu" || args.statutValidation === "valide") {
      updates.validePar = user._id;
      updates.valideAt = new Date().toISOString();
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const toggleLock = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document introuvable");

    if (doc.isLocked && doc.lockedBy !== user._id) {
      throw new Error("Ce document est verrouillé par un autre utilisateur");
    }

    await ctx.db.patch(args.id, {
      isLocked: !doc.isLocked,
      lockedBy: !doc.isLocked ? user._id : undefined,
    });
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
