/**
 * Query pure : état financier d'un dossier (Pilier 2 LegalPay).
 * Shape identique au service DEMO `lib/legalpay/etat-dossier.ts`.
 */
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./permissions";

function seuilFromRatio(ratioPct: number): "vert" | "orange" | "rouge" {
  if (ratioPct < 60) return "vert";
  if (ratioPct < 85) return "orange";
  return "rouge";
}

export const compute = query({
  args: { dossierId: v.id("dossiers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const [provisions, diligences, notes, sousCompteCarpa, conventions] =
      await Promise.all([
        ctx.db
          .query("provisions")
          .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
          .collect(),
        ctx.db
          .query("diligences")
          .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
          .collect(),
        ctx.db
          .query("notesHonoraires")
          .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
          .collect(),
        ctx.db
          .query("sousComptesCARPA")
          .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
          .first(),
        ctx.db
          .query("conventions")
          .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
          .collect(),
      ]);

    const convention =
      conventions.find((c) => c.statut === "signee") ??
      conventions.find((c) => c.statut === "envoyee") ??
      conventions.find((c) => c.statut === "brouillon") ??
      null;

    const provisionVersee = provisions
      .filter((p) => p.statut === "recue")
      .reduce((acc, p) => acc + p.montant, 0);

    const provisionAttendue = provisions
      .filter((p) => p.statut === "attendue")
      .reduce((acc, p) => acc + p.montant, 0);

    const forfait =
      convention &&
      (convention.statut === "signee" || convention.statut === "envoyee") &&
      (convention.type === "forfait" || convention.type === "mixte")
        ? (convention.montantForfait ?? 0)
        : 0;

    const diligencesValorise = diligences.reduce(
      (acc, d) => acc + d.montantValorise,
      0
    );
    const tempsPasseValorise = forfait + diligencesValorise;

    const provisionConsommee = Math.min(provisionVersee, tempsPasseValorise);
    const provisionRestante = Math.max(0, provisionVersee - tempsPasseValorise);
    const depassement = Math.max(0, tempsPasseValorise - provisionVersee);

    const ratio =
      provisionVersee > 0 ? tempsPasseValorise / provisionVersee : null;
    const ratioPct = ratio !== null ? ratio * 100 : 0;
    const seuil =
      provisionVersee === 0
        ? ("vert" as const)
        : seuilFromRatio(ratioPct);

    return {
      dossierId: args.dossierId,
      provisionVersee,
      provisionAttendue,
      tempsPasseValorise,
      provisionConsommee,
      provisionRestante,
      depassement,
      ratio,
      seuil,
      alerteDepassement: ratioPct > 85 || depassement > 0,
      convention,
      sousCompteCarpa,
      notes,
      diligences,
      provisions,
    };
  },
});
