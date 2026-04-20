/**
 * Mouvements CARPA — flux financiers sur les sous-comptes dossier.
 *
 * TRIPLE VERROU (art. P.75.1, P.75.2 RIBP) :
 * Un prélèvement d'honoraires sur fonds CARPA est refusé sans :
 *   (a) convention d'honoraires signée sur le dossier
 *   (b) note d'honoraires émise dont le montant ≥ prélèvement
 *   (c) justificatif (pièce) attaché au mouvement
 *
 * Cette contrainte est appliquée ici (niveau applicatif Convex).
 * Convex n'ayant pas de CHECK constraint SQL, la sûreté repose sur
 * cette mutation. AUCUNE autre voie d'insertion dans `mouvementsCARPA`
 * avec type=prelevement_honoraires ne doit exister.
 */
import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireUser } from "./permissions";

export const listBySousCompte = query({
  args: { sousCompteCarpaId: v.id("sousComptesCARPA") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("mouvementsCARPA")
      .withIndex("by_sousCompte", (q) =>
        q.eq("sousCompteCarpaId", args.sousCompteCarpaId)
      )
      .collect();
  },
});

export const creerVersementProvision = mutation({
  args: {
    sousCompteCarpaId: v.id("sousComptesCARPA"),
    montant: v.number(),
    dateOperation: v.string(),
    libelle: v.string(),
    storageIdJustificatif: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "stagiaire") throw new Error("Accès refusé");
    if (args.montant <= 0) {
      throw new ConvexError("Le montant d'un versement doit être positif.");
    }

    const sousCompte = await ctx.db.get(args.sousCompteCarpaId);
    if (!sousCompte) throw new Error("Sous-compte CARPA introuvable");

    const mvtId = await ctx.db.insert("mouvementsCARPA", {
      sousCompteCarpaId: args.sousCompteCarpaId,
      type: "versement_provision",
      montant: args.montant,
      dateOperation: args.dateOperation,
      storageIdJustificatif: args.storageIdJustificatif,
      libelle: args.libelle,
      createdBy: user._id,
    });

    await ctx.db.patch(args.sousCompteCarpaId, {
      solde: sousCompte.solde + args.montant,
    });

    return mvtId;
  },
});

/**
 * Prélèvement d'honoraires sur fonds CARPA — triple verrou obligatoire.
 */
export const creerPrelevementHonoraires = mutation({
  args: {
    sousCompteCarpaId: v.id("sousComptesCARPA"),
    noteHonorairesId: v.id("notesHonoraires"),
    montant: v.number(),
    dateOperation: v.string(),
    libelle: v.string(),
    storageIdJustificatif: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "associe") {
      throw new ConvexError(
        "Seul un associé peut valider un prélèvement CARPA (art. P.75.2 RIBP)."
      );
    }
    if (args.montant <= 0) {
      throw new ConvexError("Le montant d'un prélèvement doit être positif.");
    }

    const sousCompte = await ctx.db.get(args.sousCompteCarpaId);
    if (!sousCompte) throw new Error("Sous-compte CARPA introuvable");
    if (sousCompte.solde < args.montant) {
      throw new ConvexError(
        "Solde CARPA insuffisant pour ce prélèvement. Un nouvel appel de provision est requis."
      );
    }

    // ═══ TRIPLE VERROU ═══════════════════════════════════════════
    // (a) Convention signée sur le dossier ?
    const conventions = await ctx.db
      .query("conventions")
      .withIndex("by_dossier", (q) => q.eq("dossierId", sousCompte.dossierId))
      .collect();
    const hasConventionSignee = conventions.some((c) => c.statut === "signee");
    if (!hasConventionSignee) {
      throw new ConvexError(
        "Triple verrou CARPA: aucune convention signée sur ce dossier (art. 6.2 RIN)."
      );
    }

    // (b) Note d'honoraires émise + montant ≥ prélèvement ?
    const note = await ctx.db.get(args.noteHonorairesId);
    if (!note) {
      throw new ConvexError("Note d'honoraires introuvable.");
    }
    if (note.dossierId !== sousCompte.dossierId) {
      throw new ConvexError(
        "Triple verrou CARPA: la note d'honoraires ne correspond pas au dossier du sous-compte."
      );
    }
    const noteEmise =
      note.statut === "validee" ||
      note.statut === "envoyee" ||
      note.statut === "payee_partiellement" ||
      note.statut === "payee";
    if (!noteEmise) {
      throw new ConvexError(
        "Triple verrou CARPA: la note d'honoraires doit être émise (statut validée/envoyée/payée)."
      );
    }
    if (note.montantTTC < args.montant) {
      throw new ConvexError(
        "Triple verrou CARPA: le montant prélevé dépasse celui de la note d'honoraires."
      );
    }

    // (c) Justificatif — la signature ci-dessus exige déjà `storageIdJustificatif`.

    // Triple verrou validé — on enregistre le mouvement.
    const mvtId = await ctx.db.insert("mouvementsCARPA", {
      sousCompteCarpaId: args.sousCompteCarpaId,
      type: "prelevement_honoraires",
      montant: args.montant,
      dateOperation: args.dateOperation,
      noteHonorairesId: args.noteHonorairesId,
      storageIdJustificatif: args.storageIdJustificatif,
      libelle: args.libelle,
      createdBy: user._id,
    });

    await ctx.db.patch(args.sousCompteCarpaId, {
      solde: sousCompte.solde - args.montant,
    });

    // Log d'activité déontologique
    await ctx.db.insert("activites", {
      dossierId: sousCompte.dossierId,
      utilisateurId: user._id,
      type: "prelevement_carpa",
      description: `Prélèvement CARPA ${args.montant} € — triple verrou validé (convention signée, note ${note.numero} émise, justificatif fourni)`,
    });

    return mvtId;
  },
});
