/**
 * Notes d'honoraires — art. 11.2 RIN (mentions obligatoires).
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

export const listByDossier = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("notesHonoraires")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
  },
});

export const create = mutation({
  args: {
    dossierId: v.id("dossiers"),
    conventionId: v.id("conventions"),
    montantHT: v.number(),
    tva: v.number(),
    montantTTC: v.number(),
    dateEcheance: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") throw new Error("Accès refusé");

    const convention = await ctx.db.get(args.conventionId);
    if (!convention) throw new Error("Convention introuvable");
    if (convention.statut !== "signee") {
      throw new Error(
        "Une note d'honoraires ne peut être émise que sur une convention signée (art. 6.2 RIN)."
      );
    }

    const all = await ctx.db.query("notesHonoraires").collect();
    const numero = `NH-${new Date().getFullYear()}-${String(all.length + 1).padStart(4, "0")}`;

    return await ctx.db.insert("notesHonoraires", {
      ...args,
      numero,
      statut: "brouillon",
      dateEmission: new Date().toISOString().split("T")[0],
      createdBy: user._id,
    });
  },
});

export const valider = mutation({
  args: { id: v.id("notesHonoraires") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "associe") {
      throw new Error("Seul un associé peut valider une note d'honoraires.");
    }
    await ctx.db.patch(args.id, { statut: "validee" });
  },
});
