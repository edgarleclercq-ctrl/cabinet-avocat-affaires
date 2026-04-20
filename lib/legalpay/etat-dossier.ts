/**
 * Calcul de l'état financier d'un dossier (Pilier 2 LegalPay).
 *
 * Ce service est intentionnellement côté client pour fonctionner en DEMO_MODE.
 * La même shape est exposée par la query Convex `etatDossier.compute` — le
 * switch DEMO vs prod s'opère dans le hook `useEtatFinancierDossier`.
 *
 * Références réglementaires :
 * - art. 6.2 RIN : convention d'honoraires écrite obligatoire
 * - art. 11.2 RIN : mentions obligatoires des notes d'honoraires
 * - art. 12 décret 12/07/2005 : comptabilité distincte par dossier
 */
import {
  DEMO_CONVENTIONS,
  DEMO_DILIGENCES,
  DEMO_PROVISIONS,
  DEMO_SOUSCOMPTES_CARPA,
  DEMO_NOTES_HONORAIRES,
  DEMO_DOSSIERS,
  type DemoConvention,
  type DemoDiligence,
  type DemoProvision,
  type DemoSousCompteCarpa,
  type DemoNoteHonoraires,
} from "@/lib/demo-data";

export type Seuil = "vert" | "orange" | "rouge";

export interface EtatFinancierDossier {
  dossierId: string;
  /** Total des provisions effectivement reçues (hors attendues). */
  provisionVersee: number;
  /** Total des provisions attendues mais non encore versées. */
  provisionAttendue: number;
  /** Σ diligences valorisées + forfait signé (si convention signée). */
  tempsPasseValorise: number;
  /** min(versée, valorisé) — fraction déjà consommée par la facturation. */
  provisionConsommee: number;
  /** max(0, versée − valorisé). */
  provisionRestante: number;
  /** max(0, valorisé − versée). */
  depassement: number;
  /** Ratio (valorisé / versée). null si pas de provision versée. */
  ratio: number | null;
  seuil: Seuil;
  /** true si ratio > 85% OU dépassement > 0. */
  alerteDepassement: boolean;
  /** Convention active (signée, envoyée ou brouillon) ou null. */
  convention: DemoConvention | null;
  /** Sous-compte CARPA du dossier ou null. */
  sousCompteCarpa: DemoSousCompteCarpa | null;
  /** Notes d'honoraires émises sur le dossier. */
  notes: DemoNoteHonoraires[];
  /** Diligences du dossier, triées par date décroissante. */
  diligences: DemoDiligence[];
  /** Provisions du dossier, triées par date décroissante. */
  provisions: DemoProvision[];
}

function seuilFromRatio(ratioPct: number): Seuil {
  if (ratioPct < 60) return "vert";
  if (ratioPct < 85) return "orange";
  return "rouge";
}

/**
 * Calcule l'état financier d'un dossier à partir des fixtures DEMO.
 * Retourne un état "vide" si aucune donnée n'existe (dossier sans convention).
 */
export function computeEtatFinancierDossierDemo(
  dossierId: string
): EtatFinancierDossier {
  const convention =
    DEMO_CONVENTIONS.find((c) => c.dossierId === dossierId) ?? null;
  const sousCompteCarpa =
    DEMO_SOUSCOMPTES_CARPA.find((s) => s.dossierId === dossierId) ?? null;

  const provisions = DEMO_PROVISIONS.filter(
    (p) => p.dossierId === dossierId
  ).sort((a, b) => b._creationTime - a._creationTime);

  const diligences = DEMO_DILIGENCES.filter(
    (d) => d.dossierId === dossierId
  ).sort((a, b) => b._creationTime - a._creationTime);

  const notes = DEMO_NOTES_HONORAIRES.filter(
    (n) => n.dossierId === dossierId
  ).sort((a, b) => b._creationTime - a._creationTime);

  const provisionVersee = provisions
    .filter((p) => p.statut === "recue")
    .reduce((acc, p) => acc + p.montant, 0);

  const provisionAttendue = provisions
    .filter((p) => p.statut === "attendue")
    .reduce((acc, p) => acc + p.montant, 0);

  // Forfait pris en compte uniquement si convention signée ou envoyée
  const forfait =
    convention?.statut === "signee" || convention?.statut === "envoyee"
      ? (convention.type === "forfait" || convention.type === "mixte"
          ? (convention.montantForfait ?? 0)
          : 0)
      : 0;

  const diligencesValorise = diligences.reduce(
    (acc, d) => acc + d.montantValorise,
    0
  );
  const tempsPasseValorise = forfait + diligencesValorise;

  const provisionConsommee = Math.min(provisionVersee, tempsPasseValorise);
  const provisionRestante = Math.max(0, provisionVersee - tempsPasseValorise);
  const depassement = Math.max(0, tempsPasseValorise - provisionVersee);

  const ratio = provisionVersee > 0 ? tempsPasseValorise / provisionVersee : null;
  const ratioPct = ratio !== null ? ratio * 100 : 0;
  const seuil: Seuil =
    provisionVersee === 0 ? "vert" : seuilFromRatio(ratioPct);
  const alerteDepassement = ratioPct > 85 || depassement > 0;

  return {
    dossierId,
    provisionVersee,
    provisionAttendue,
    tempsPasseValorise,
    provisionConsommee,
    provisionRestante,
    depassement,
    ratio,
    seuil,
    alerteDepassement,
    convention,
    sousCompteCarpa,
    notes,
    diligences,
    provisions,
  };
}

/* ------------------------------------------------------------------ */
/*  Vue cabinet (Pilier 1)                                              */
/* ------------------------------------------------------------------ */

export interface EtatCabinet {
  /** Solde total CARPA (Σ sous-comptes). À NE JAMAIS confondre avec la
   * trésorerie disponible — fonds détenus pour compte de tiers. */
  soldeCarpaTotal: number;
  /** Nombre de sous-comptes CARPA actifs. */
  nbSousComptesCarpa: number;
  /** Total des provisions détenues pour le compte des clients. */
  provisionsDetenues: number;
  /** Total des honoraires émis et non encore payés. */
  honorairesNonEncaisses: number;
  /** Âge moyen des créances non payées, en jours. */
  ageMoyenCreancesJours: number;
  /** Dossiers en dépassement ou proches du dépassement. */
  dossiersEnAlerte: Array<{
    dossierId: string;
    reference: string;
    clientDenomination: string;
    ratio: number | null;
    seuil: Seuil;
    depassement: number;
  }>;
  /** Conventions à attention (envoyée > 14 jours, ou non signée sur dossier actif). */
  conventionsEnAttention: Array<{
    dossierId: string;
    conventionId: string;
    reference: string;
    clientDenomination: string;
    statut: DemoConvention["statut"];
    joursDepuisEnvoi: number | null;
  }>;
}

export function computeEtatCabinetDemo(
  clientsById: Map<string, { denomination: string }>
): EtatCabinet {
  const soldeCarpaTotal = DEMO_SOUSCOMPTES_CARPA.reduce(
    (acc, s) => acc + s.solde,
    0
  );

  const provisionsDetenues = DEMO_PROVISIONS.filter(
    (p) => p.statut === "recue"
  ).reduce((acc, p) => acc + p.montant, 0);

  const notesNonPayees = DEMO_NOTES_HONORAIRES.filter(
    (n) => n.statut !== "payee" && n.statut !== "brouillon"
  );
  const honorairesNonEncaisses = notesNonPayees.reduce(
    (acc, n) => acc + n.montantTTC,
    0
  );

  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const ageMoyenCreancesJours =
    notesNonPayees.length === 0
      ? 0
      : Math.round(
          notesNonPayees.reduce((acc, n) => {
            const ageDays = Math.max(
              0,
              Math.floor((now - new Date(n.dateEmission).getTime()) / day)
            );
            return acc + ageDays;
          }, 0) / notesNonPayees.length
        );

  const dossiersEnAlerte = DEMO_DOSSIERS.map((d) => {
    const etat = computeEtatFinancierDossierDemo(d._id as unknown as string);
    return {
      dossierId: d._id as unknown as string,
      reference: d.reference,
      clientDenomination:
        clientsById.get(d.clientId as unknown as string)?.denomination ?? "—",
      ratio: etat.ratio,
      seuil: etat.seuil,
      depassement: etat.depassement,
    };
  })
    .filter((d) => d.seuil === "rouge" || d.depassement > 0)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));

  const conventionsEnAttention = DEMO_DOSSIERS.map((d) => {
    const conv = DEMO_CONVENTIONS.find(
      (c) => c.dossierId === (d._id as unknown as string)
    );
    if (!conv) return null;
    if (conv.statut === "signee" || conv.statut === "resiliee") return null;
    const joursDepuisEnvoi =
      conv.statut === "envoyee"
        ? Math.floor((now - conv._creationTime) / day)
        : null;
    // Skip conventions envoyées récemment (< 7 jours)
    if (conv.statut === "envoyee" && (joursDepuisEnvoi ?? 0) < 7) {
      return null;
    }
    return {
      dossierId: d._id as unknown as string,
      conventionId: conv._id,
      reference: d.reference,
      clientDenomination:
        clientsById.get(d.clientId as unknown as string)?.denomination ?? "—",
      statut: conv.statut,
      joursDepuisEnvoi,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    soldeCarpaTotal,
    nbSousComptesCarpa: DEMO_SOUSCOMPTES_CARPA.length,
    provisionsDetenues,
    honorairesNonEncaisses,
    ageMoyenCreancesJours,
    dossiersEnAlerte,
    conventionsEnAttention,
  };
}
