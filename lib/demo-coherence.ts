/**
 * Mode démo pour l'analyse de cohérence juridique.
 *
 * Quand DEMO_MODE = true, on court-circuite l'action Convex
 * `analyserCoherence` et on renvoie une analyse pré-écrite réaliste.
 * Cela permet de démontrer l'UX complète sans consommer de crédits
 * Anthropic et sans credentials PISTE.
 *
 * L'analyse pré-écrite s'adapte légèrement au contenu soumis :
 *  - si le texte contient "clause pénale" ou "pénalité", on ajoute
 *    une vérification art. 1231-5 C. civ.
 *  - si le texte contient "rompre" / "résiliation", on ajoute une
 *    vérification jurisprudence Chronopost
 *  - sinon on renvoie l'analyse de base sur un contrat commercial type.
 */

import { MOCK_ARTICLES, MOCK_DECISIONS } from "@/lib/integrations/legifrance/mock";

export type Gravite = "info" | "attention" | "critique";
export type Priorite = "low" | "medium" | "high";

export interface CoherenceReport {
  resumeExecutif: string;
  clausesCles: Array<{
    titre: string;
    contenu: string;
    references: Array<{
      type: "article" | "juri";
      cid: string;
      citation: string;
      url?: string;
    }>;
  }>;
  incoherencesInternes: Array<{
    clauseA: string;
    clauseB: string;
    explication: string;
    gravite: Gravite;
  }>;
  nonConformites: Array<{
    clause: string;
    reglePatrimoniale: string;
    referenceCid?: string;
    referenceUrl?: string;
    explication: string;
    gravite: Gravite;
  }>;
  recommandations: Array<{
    titre: string;
    description: string;
    priorite: Priorite;
  }>;
  sourceBackend: "mock" | "real";
  modele: string;
}

function ref(numero: string, type: "article" | "juri" = "article") {
  const pool = type === "article" ? MOCK_ARTICLES : MOCK_DECISIONS;
  if (type === "article") {
    const a = MOCK_ARTICLES.find((x) => x.numero === numero);
    if (!a) return null;
    return {
      type: "article" as const,
      cid: a.cid,
      citation: `${a.code === "CCIV" ? "C. civ." : a.code === "CCOM" ? "C. com." : "C. trav."} art. ${a.numero}`,
      url: a.url,
    };
  }
  const d = MOCK_DECISIONS[0];
  return {
    type: "juri" as const,
    cid: d.cid,
    citation: `${d.juridiction}, ${d.datePrononce}`,
    url: d.url,
  };
}

export function demoAnalyseCoherence(
  contenu: string,
  typeDocument?: string
): CoherenceReport {
  const txt = contenu.toLowerCase();
  const hasClausePenale = /clause\s+p[eé]nale|p[eé]nalit[eé]/.test(txt);
  const hasResiliation = /r[eé]siliat|rupture|rompre|terminer\s+le\s+contrat/.test(txt);
  const hasReglementFournisseur = /d[eé]lai\s+de\s+paiement|60\s+jours|90\s+jours/.test(txt);
  const hasLimitationResponsabilite = /limit(e|ation).{0,30}responsabilit|plafond.{0,30}responsabilit/.test(txt);
  const hasPeriodeEssai = /p[eé]riode\s+d['']essai/.test(txt);
  const isContratCommercial = !hasPeriodeEssai;

  const clausesCles: CoherenceReport["clausesCles"] = [];
  const incoherencesInternes: CoherenceReport["incoherencesInternes"] = [];
  const nonConformites: CoherenceReport["nonConformites"] = [];
  const recommandations: CoherenceReport["recommandations"] = [];

  // Clauses-clés de base — toujours présentes
  const art1103 = ref("1103", "article");
  const art1104 = ref("1104", "article");
  if (art1103) {
    clausesCles.push({
      titre: "Force obligatoire du contrat",
      contenu:
        "Les parties s'engagent à exécuter les obligations contractuelles stipulées aux présentes.",
      references: [art1103],
    });
  }
  if (art1104) {
    clausesCles.push({
      titre: "Exécution de bonne foi",
      contenu:
        "Les parties s'engagent à collaborer de bonne foi tout au long de l'exécution du contrat.",
      references: [art1104],
    });
  }

  // Variations contextuelles
  if (hasClausePenale) {
    const art1231 = ref("1231-5", "article");
    if (art1231) {
      clausesCles.push({
        titre: "Clause pénale",
        contenu:
          "En cas d'inexécution imputable à une partie, une pénalité forfaitaire est due à l'autre partie.",
        references: [art1231],
      });
      nonConformites.push({
        clause:
          "Pénalité de 50% du montant du contrat en cas de non-exécution, sans considération du préjudice effectif.",
        reglePatrimoniale: "C. civ. art. 1231-5 — pouvoir modérateur du juge",
        referenceCid: art1231.cid,
        referenceUrl: art1231.url,
        explication:
          "Une clause pénale manifestement excessive peut être modérée d'office par le juge. Le ratio inexécution/pénalité ici (50 %) combiné à l'absence de lien avec le préjudice effectif est un facteur d'aggravation.",
        gravite: "attention",
      });
      recommandations.push({
        titre: "Plafonner la clause pénale à un montant proportionné",
        description:
          "Préciser un mode de calcul lié au préjudice effectif ou plafonner à 20-30 % du contrat pour éviter une révision judiciaire.",
        priorite: "medium",
      });
    }
  }

  if (hasLimitationResponsabilite) {
    const art1170 = ref("1170", "article");
    const chronopost = MOCK_DECISIONS[0];
    if (art1170) {
      nonConformites.push({
        clause:
          "La responsabilité de [Partie A] est limitée à 1 000 € quelle que soit la nature du manquement.",
        reglePatrimoniale:
          "C. civ. art. 1170 + Cass. Com. 22 oct. 1996, Chronopost",
        referenceCid: art1170.cid,
        referenceUrl: art1170.url,
        explication:
          "Une clause qui prive de sa substance l'obligation essentielle du débiteur est réputée non écrite. Une limitation à 1 000 € pour un contrat d'un montant significatif est susceptible de vider l'obligation essentielle de sa substance.",
        gravite: "critique",
      });
      recommandations.push({
        titre: "Réévaluer la limitation de responsabilité",
        description:
          "Modifier le plafond pour qu'il reste proportionné au montant du contrat et au risque, ou limiter la clause aux manquements non essentiels uniquement (obligations accessoires).",
        priorite: "high",
      });
    }
  }

  if (hasReglementFournisseur) {
    const artL44110 = ref("L.441-10", "article");
    if (artL44110) {
      nonConformites.push({
        clause:
          "Les factures sont payables à 90 jours fin de mois à compter de leur émission.",
        reglePatrimoniale:
          "C. com. art. L.441-10 — délai maximum 60 jours (ou 45 jours fin de mois expressément stipulé)",
        referenceCid: artL44110.cid,
        referenceUrl: artL44110.url,
        explication:
          "Le délai de paiement convenu ne peut excéder 60 jours à compter de la date d'émission de la facture, ou 45 jours fin de mois si expressément stipulé. 90 jours fin de mois excède ce plafond et expose à une amende administrative (jusqu'à 2 M€ pour une personne morale).",
        gravite: "critique",
      });
      recommandations.push({
        titre: "Ramener le délai de paiement sous le plafond légal",
        description:
          "Soit 60 jours date d'émission, soit 45 jours fin de mois expressément stipulé. Viser plutôt 30 jours pour éviter toute ambiguïté.",
        priorite: "high",
      });
    }
  }

  if (hasPeriodeEssai) {
    const artL122126 = ref("L.1221-26", "article");
    if (artL122126) {
      clausesCles.push({
        titre: "Période d'essai",
        contenu:
          "Le présent contrat prévoit une période d'essai de 10 mois renouvelable une fois.",
        references: [artL122126],
      });
      nonConformites.push({
        clause: "Période d'essai de 10 mois renouvelable.",
        reglePatrimoniale:
          "C. trav. art. L.1221-26 — durée maximale 8 mois pour un cadre (4 mois ouvriers/employés, 6 mois agents de maîtrise)",
        referenceCid: artL122126.cid,
        referenceUrl: artL122126.url,
        explication:
          "La durée maximale légale de la période d'essai, renouvellement compris, est de 8 mois pour un cadre. Une période de 10 mois est donc illégale et sera automatiquement requalifiée en CDI ferme à partir du 8e mois.",
        gravite: "critique",
      });
      recommandations.push({
        titre: "Réduire la période d'essai à la durée maximale légale",
        description:
          "Limiter à 4, 6 ou 8 mois selon la catégorie professionnelle du salarié, renouvellement inclus.",
        priorite: "high",
      });
    }
  }

  // Incohérences internes courantes
  if (hasResiliation && hasLimitationResponsabilite) {
    incoherencesInternes.push({
      clauseA:
        "Art. 8 — En cas de manquement grave, l'autre partie peut résilier de plein droit sans mise en demeure préalable.",
      clauseB:
        "Art. 12 — Toute résiliation doit être précédée d'une mise en demeure restée infructueuse pendant 30 jours.",
      explication:
        "Deux clauses du même contrat fixent des règles contradictoires pour la mise en œuvre de la résiliation : l'une dispense de mise en demeure, l'autre l'exige. À défaut de clarification, la clause la plus protectrice du débiteur s'appliquera en cas de litige.",
      gravite: "attention",
    });
    recommandations.push({
      titre: "Harmoniser les clauses de résiliation",
      description:
        "Choisir entre résiliation automatique ou après mise en demeure, et supprimer l'autre variante.",
      priorite: "medium",
    });
  }

  // Résumé exécutif dynamique
  const nbCritiques = nonConformites.filter((n) => n.gravite === "critique").length;
  const nbAttention = nonConformites.filter((n) => n.gravite === "attention").length;
  const resumeExecutif = (() => {
    const parts: string[] = [];
    parts.push(
      typeDocument
        ? `Audit d'un document de type "${typeDocument}".`
        : isContratCommercial
          ? "Audit d'un document à caractère contractuel."
          : "Audit d'un document juridique."
    );
    if (nbCritiques > 0) {
      parts.push(
        `${nbCritiques} non-conformité${nbCritiques > 1 ? "s" : ""} critique${nbCritiques > 1 ? "s" : ""} détectée${nbCritiques > 1 ? "s" : ""} — révision nécessaire avant signature.`
      );
    } else if (nbAttention > 0) {
      parts.push(
        `${nbAttention} point${nbAttention > 1 ? "s" : ""} d'attention identifié${nbAttention > 1 ? "s" : ""}.`
      );
    } else {
      parts.push(
        "Aucune non-conformité majeure détectée sur les points vérifiés. Une relecture humaine reste indispensable."
      );
    }
    if (incoherencesInternes.length > 0) {
      parts.push(
        `${incoherencesInternes.length} incohérence${incoherencesInternes.length > 1 ? "s" : ""} interne${incoherencesInternes.length > 1 ? "s" : ""} entre clauses.`
      );
    }
    parts.push(
      "Rapport généré en mode démonstration avec un corpus Légifrance restreint."
    );
    return parts.join(" ");
  })();

  return {
    resumeExecutif,
    clausesCles,
    incoherencesInternes,
    nonConformites,
    recommandations,
    sourceBackend: "mock",
    modele: "demo (sans LLM)",
  };
}

// Contrat de démonstration type à proposer à l'utilisateur
export const DEMO_CONTRAT_EXEMPLE = `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignées :

La société PRESTATAIRE, SAS au capital de 100 000 €, RCS Paris 123 456 789, dont le siège social est situé 10 rue de la Paix 75002 Paris, représentée par son président M. Dupont, ci-après dénommée "le Prestataire",

Et la société CLIENT, SARL au capital de 50 000 €, RCS Paris 987 654 321, dont le siège social est situé 25 avenue Victor Hugo 75016 Paris, représentée par son gérant M. Martin, ci-après dénommée "le Client",

Article 1 — Objet
Le Prestataire s'engage à fournir au Client des prestations de conseil en stratégie commerciale, selon un cahier des charges annexé.

Article 2 — Durée
Le présent contrat est conclu pour une durée de douze (12) mois à compter de sa signature, renouvelable par tacite reconduction.

Article 3 — Prix et modalités de paiement
La rémunération du Prestataire s'élève à 80 000 € HT, payable en quatre échéances trimestrielles de 20 000 € HT.
Les factures sont payables à 90 jours fin de mois à compter de leur émission.

Article 4 — Clause pénale
En cas de non-respect par l'une des parties de ses obligations, celle-ci devra verser à l'autre partie une pénalité forfaitaire équivalente à 50% du montant total du contrat, sans mise en demeure préalable.

Article 5 — Limitation de responsabilité
La responsabilité du Prestataire est limitée à 1 000 € quelle que soit la nature et l'importance du dommage subi par le Client, y compris en cas de faute lourde.

Article 6 — Confidentialité
Chaque partie s'engage à conserver la stricte confidentialité des informations échangées.

Article 7 — Résiliation
En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra résilier le présent contrat de plein droit sans mise en demeure préalable.

Article 8 — Résiliation (suite)
Toute résiliation du contrat devra être précédée d'une mise en demeure par lettre recommandée avec accusé de réception, restée infructueuse pendant 30 jours.

Article 9 — Juridiction compétente
Tout litige relatif à l'exécution du présent contrat sera soumis à la compétence exclusive du Tribunal de commerce de Paris.

Fait à Paris, le _______________
En deux exemplaires originaux.

Le Prestataire                                     Le Client
`;
