import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, canCreateDossier, canDeleteDossier, canAccessDossier } from "./permissions";

function generateReference(specialite: string, count: number): string {
  const prefix = specialite === "corporate" ? "COR" : specialite === "litige" ? "LIT" : "FIS";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    specialite: v.optional(v.string()),
    statut: v.optional(v.string()),
    avocatResponsableId: v.optional(v.id("users")),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let dossiers;
    if (args.search) {
      dossiers = await ctx.db
        .query("dossiers")
        .withSearchIndex("search_dossiers", (q) => {
          let query = q.search("intitule", args.search!);
          if (args.specialite) query = query.eq("specialite", args.specialite as "corporate" | "litige" | "fiscal");
          if (args.statut) query = query.eq("statut", args.statut);
          if (args.avocatResponsableId) query = query.eq("avocatResponsableId", args.avocatResponsableId);
          return query;
        })
        .collect();
    } else if (args.clientId) {
      dossiers = await ctx.db
        .query("dossiers")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .collect();
    } else if (args.specialite) {
      dossiers = await ctx.db
        .query("dossiers")
        .withIndex("by_specialite", (q) => q.eq("specialite", args.specialite as "corporate" | "litige" | "fiscal"))
        .collect();
    } else {
      dossiers = await ctx.db.query("dossiers").collect();
    }

    // Filter by role
    if (user.role === "collaborateur" || user.role === "stagiaire") {
      dossiers = dossiers.filter(
        (d) =>
          d.avocatResponsableId === user._id ||
          d.collaborateursIds.includes(user._id)
      );
    }

    if (args.statut && !args.search) {
      dossiers = dossiers.filter((d) => d.statut === args.statut);
    }

    return dossiers;
  },
});

export const getById = query({
  args: { id: v.id("dossiers") },
  handler: async (ctx, args) => {
    const { dossier } = await canAccessDossier(ctx, args.id);
    return dossier;
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    specialite: v.union(v.literal("corporate"), v.literal("litige"), v.literal("fiscal")),
    intitule: v.string(),
    description: v.optional(v.string()),
    avocatResponsableId: v.id("users"),
    collaborateursIds: v.array(v.id("users")),
    montantHonoraires: v.optional(v.number()),
    propositionId: v.optional(v.id("propositions")),
    partiesAdverses: v.optional(v.array(v.object({
      denomination: v.string(),
      siren: v.optional(v.string()),
      avocat: v.optional(v.string()),
      coordonnees: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canCreateDossier(user.role)) throw new Error("Accès refusé");

    const allDossiers = await ctx.db
      .query("dossiers")
      .withIndex("by_specialite", (q) => q.eq("specialite", args.specialite))
      .collect();
    const reference = generateReference(args.specialite, allDossiers.length);

    const dossierId = await ctx.db.insert("dossiers", {
      ...args,
      reference,
      statut: "ouvert",
      dateOuverture: new Date().toISOString().split("T")[0],
    });

    // Create extension table based on specialite
    if (args.specialite === "corporate") {
      await ctx.db.insert("dossiersCorporate", {
        dossierId,
        typeOperation: "",
      });
    } else if (args.specialite === "litige") {
      await ctx.db.insert("dossiersLitige", {
        dossierId,
        typeProcedure: "",
      });
    } else {
      await ctx.db.insert("dossiersFiscal", {
        dossierId,
        typeMission: "",
      });
    }

    await ctx.db.insert("activites", {
      dossierId,
      clientId: args.clientId,
      utilisateurId: user._id,
      type: "dossier_cree",
      description: `Dossier ${reference} créé : ${args.intitule}`,
    });

    return dossierId;
  },
});

export const updateStatut = mutation({
  args: {
    id: v.id("dossiers"),
    statut: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const dossier = await ctx.db.get(args.id);
    if (!dossier) throw new Error("Dossier introuvable");

    await ctx.db.patch(args.id, { statut: args.statut });

    if (args.statut === "clos") {
      await ctx.db.patch(args.id, {
        dateCloture: new Date().toISOString().split("T")[0],
      });
    }

    await ctx.db.insert("activites", {
      dossierId: args.id,
      clientId: dossier.clientId,
      utilisateurId: user._id,
      type: "statut_change",
      description: `Statut changé de "${dossier.statut}" à "${args.statut}"`,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("dossiers"),
    intitule: v.optional(v.string()),
    description: v.optional(v.string()),
    avocatResponsableId: v.optional(v.id("users")),
    collaborateursIds: v.optional(v.array(v.id("users"))),
    montantHonoraires: v.optional(v.number()),
    partiesAdverses: v.optional(v.array(v.object({
      denomination: v.string(),
      siren: v.optional(v.string()),
      avocat: v.optional(v.string()),
      coordonnees: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);

    await ctx.db.insert("activites", {
      dossierId: id,
      utilisateurId: user._id,
      type: "dossier_modifie",
      description: "Dossier modifié",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("dossiers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!canDeleteDossier(user.role)) throw new Error("Seul un associé peut supprimer un dossier");
    const dossier = await ctx.db.get(args.id);
    if (!dossier) throw new Error("Dossier introuvable");
    await ctx.db.patch(args.id, { statut: "clos", dateCloture: new Date().toISOString().split("T")[0] });
  },
});

// Extensions
export const getCorporateExt = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("dossiersCorporate")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .first();
  },
});

export const getLitigeExt = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("dossiersLitige")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .first();
  },
});

export const getFiscalExt = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("dossiersFiscal")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .first();
  },
});

export const updateCorporateExt = mutation({
  args: {
    id: v.id("dossiersCorporate"),
    typeOperation: v.optional(v.string()),
    checklist: v.optional(v.array(v.object({ label: v.string(), done: v.boolean() }))),
    dateAG: v.optional(v.string()),
    dateDepotGreffe: v.optional(v.string()),
    datePublicationJAL: v.optional(v.string()),
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

export const updateLitigeExt = mutation({
  args: {
    id: v.id("dossiersLitige"),
    typeProcedure: v.optional(v.string()),
    juridiction: v.optional(v.string()),
    chambre: v.optional(v.string()),
    numeroRG: v.optional(v.string()),
    magistrat: v.optional(v.string()),
    avocatAdverse: v.optional(v.string()),
    coordonneesAdverse: v.optional(v.string()),
    conclusionsEchangees: v.optional(v.array(v.object({
      numero: v.number(),
      type: v.string(),
      dateDepot: v.string(),
      documentId: v.optional(v.id("documents")),
    }))),
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

export const updateFiscalExt = mutation({
  args: {
    id: v.id("dossiersFiscal"),
    typeMission: v.optional(v.string()),
    regime: v.optional(v.string()),
    calendrierFiscal: v.optional(v.array(v.object({
      description: v.string(),
      date: v.string(),
      statut: v.string(),
    }))),
    montantEnJeu: v.optional(v.number()),
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

export const count = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const dossiers = await ctx.db.query("dossiers").collect();
    return {
      total: dossiers.length,
      corporate: dossiers.filter((d) => d.specialite === "corporate").length,
      litige: dossiers.filter((d) => d.specialite === "litige").length,
      fiscal: dossiers.filter((d) => d.specialite === "fiscal").length,
      actifs: dossiers.filter((d) => d.statut !== "clos").length,
    };
  },
});
