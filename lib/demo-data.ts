// Demo mode — fake data for testing UI without Convex auth
export const DEMO_MODE = true;

export const DEMO_USER = {
  _id: "demo_user_1" as any,
  _creationTime: 1713100800000,
  name: "Maître Dupont",
  email: "dupont@lexicab.fr",
  role: "associe" as const,
  isActive: true,
};

export const DEMO_USERS = [
  DEMO_USER,
  {
    _id: "demo_user_2" as any,
    _creationTime: 1713100800000,
    name: "Sophie Martin",
    email: "martin@lexicab.fr",
    role: "collaborateur" as const,
    isActive: true,
  },
  {
    _id: "demo_user_3" as any,
    _creationTime: 1713100800000,
    name: "Julie Lefebvre",
    email: "lefebvre@lexicab.fr",
    role: "secretaire" as const,
    isActive: true,
  },
  {
    _id: "demo_user_4" as any,
    _creationTime: 1713100800000,
    name: "Paul Renard",
    email: "renard@lexicab.fr",
    role: "stagiaire" as const,
    isActive: true,
  },
];

export const DEMO_CLIENTS = [
  {
    _id: "demo_client_1" as any,
    _creationTime: 1713100800000,
    type: "personne_morale" as const,
    denomination: "TechVision SAS",
    formeJuridique: "SAS",
    siren: "123456789",
    siret: "12345678900001",
    siegeSocial: "42 avenue des Champs-Élysées, 75008 Paris",
    capitalSocial: "500 000 €",
    dirigeants: "Jean-Marc Dubois (Président)",
    secteurActivite: "Technologies",
    dateCreation: "2018-03-15",
    avocatReferentId: "demo_user_1" as any,
    tags: ["VIP", "groupe"],
    notes: "Client stratégique depuis 2020",
    specialites: ["corporate" as const, "fiscal" as const],
    isActive: true,
  },
  {
    _id: "demo_client_2" as any,
    _creationTime: 1713100800000,
    type: "personne_morale" as const,
    denomination: "Immobilière du Parc SARL",
    formeJuridique: "SARL",
    siren: "987654321",
    siegeSocial: "15 rue de la Paix, 75002 Paris",
    capitalSocial: "200 000 €",
    dirigeants: "Marie Fontaine (Gérante)",
    secteurActivite: "Immobilier",
    dateCreation: "2010-06-22",
    avocatReferentId: "demo_user_2" as any,
    tags: ["client sensible"],
    specialites: ["litige" as const, "corporate" as const],
    isActive: true,
  },
  {
    _id: "demo_client_3" as any,
    _creationTime: 1713100800000,
    type: "personne_morale" as const,
    denomination: "Groupe Mercier SA",
    formeJuridique: "SA",
    siren: "456789123",
    siegeSocial: "8 boulevard Haussmann, 75009 Paris",
    capitalSocial: "2 000 000 €",
    dirigeants: "Philippe Mercier (PDG)",
    secteurActivite: "Commerce",
    dateCreation: "1995-01-10",
    avocatReferentId: "demo_user_1" as any,
    tags: ["VIP"],
    specialites: ["fiscal" as const],
    isActive: true,
  },
  {
    _id: "demo_client_4" as any,
    _creationTime: 1713100800000,
    type: "personne_physique" as const,
    denomination: "Laurent Bertrand",
    prenom: "Laurent",
    nom: "Bertrand",
    siegeSocial: "25 rue du Faubourg Saint-Honoré, 75008 Paris",
    avocatReferentId: "demo_user_2" as any,
    specialites: ["litige" as const],
    isActive: true,
  },
];

export const DEMO_DOSSIERS = [
  {
    _id: "demo_dossier_1" as any,
    _creationTime: 1713100800000,
    reference: "COR-2026-0001",
    clientId: "demo_client_1" as any,
    specialite: "corporate" as const,
    intitule: "Constitution filiale TechVision Cloud",
    description: "Création d'une SAS filiale pour l'activité cloud computing",
    statut: "en_cours_redaction",
    avocatResponsableId: "demo_user_1" as any,
    collaborateursIds: ["demo_user_2" as any],
    montantHonoraires: 15000,
    dateOuverture: "2026-03-01",
    partiesAdverses: [],
  },
  {
    _id: "demo_dossier_2" as any,
    _creationTime: 1713100800000,
    reference: "LIT-2026-0003",
    clientId: "demo_client_2" as any,
    specialite: "litige" as const,
    intitule: "Litige commercial vs. BTP Constructions",
    description: "Inexécution contrat de rénovation — demande en paiement 450 000 €",
    statut: "contentieux_en_cours",
    avocatResponsableId: "demo_user_2" as any,
    collaborateursIds: ["demo_user_1" as any, "demo_user_4" as any],
    montantHonoraires: 25000,
    dateOuverture: "2026-01-15",
    partiesAdverses: [{ denomination: "BTP Constructions SARL", siren: "111222333", avocat: "Me Rousseau" }],
  },
  {
    _id: "demo_dossier_3" as any,
    _creationTime: 1713100800000,
    reference: "FIS-2026-0002",
    clientId: "demo_client_3" as any,
    specialite: "fiscal" as const,
    intitule: "Restructuration fiscale Groupe Mercier",
    description: "Optimisation IS via holding — intégration fiscale",
    statut: "en_cours_analyse",
    avocatResponsableId: "demo_user_1" as any,
    collaborateursIds: [],
    montantHonoraires: 35000,
    dateOuverture: "2026-02-10",
    partiesAdverses: [],
  },
  {
    _id: "demo_dossier_4" as any,
    _creationTime: 1713100800000,
    reference: "LIT-2026-0007",
    clientId: "demo_client_4" as any,
    specialite: "litige" as const,
    intitule: "Recouvrement créance Bertrand / SCI Étoile",
    description: "Injonction de payer — loyers impayés",
    statut: "phase_amiable",
    avocatResponsableId: "demo_user_2" as any,
    collaborateursIds: ["demo_user_4" as any],
    montantHonoraires: 5000,
    dateOuverture: "2026-03-20",
    partiesAdverses: [{ denomination: "SCI Étoile du Nord" }],
  },
];

const today = new Date();
const inDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const DEMO_ECHEANCES = [
  {
    _id: "demo_ech_1" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_1" as any,
    description: "Dépôt des statuts au greffe",
    date: inDays(2),
    responsableId: "demo_user_1" as any,
    statut: "a_venir" as const,
    type: "administrative" as const,
  },
  {
    _id: "demo_ech_2" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_2" as any,
    description: "Dépôt conclusions récapitulatives",
    date: inDays(1),
    responsableId: "demo_user_2" as any,
    statut: "a_venir" as const,
    type: "procedurale" as const,
  },
  {
    _id: "demo_ech_3" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_3" as any,
    description: "Date limite déclaration IS",
    date: inDays(5),
    responsableId: "demo_user_1" as any,
    statut: "a_venir" as const,
    type: "fiscale" as const,
  },
  {
    _id: "demo_ech_4" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_2" as any,
    description: "Audience de plaidoirie — TC Paris",
    date: inDays(14),
    responsableId: "demo_user_2" as any,
    statut: "a_venir" as const,
    type: "procedurale" as const,
  },
  {
    _id: "demo_ech_5" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_4" as any,
    description: "Envoi mise en demeure",
    date: inDays(-1),
    responsableId: "demo_user_2" as any,
    statut: "en_retard" as const,
    type: "procedurale" as const,
  },
];

export const DEMO_FACTURE_STATS = {
  emis: 75000,
  encaisse: 45000,
  impaye: 12500,
  tauxRecouvrement: 78,
  totalMois: 75000,
  facturesAEmettre: 3,
  relancesEnCours: 2,
};

export const DEMO_FACTURES = [
  {
    _id: "demo_fac_1" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_1" as any,
    clientId: "demo_client_1" as any,
    numero: "FAC-2026-0001",
    description: "Honoraires constitution filiale — Acompte",
    montantHT: 5000,
    tva: 1000,
    montantTTC: 6000,
    statut: "payee" as const,
    dateEmission: "2026-03-05",
    dateEcheance: "2026-04-05",
    datePaiement: "2026-03-28",
    createdBy: "demo_user_3" as any,
    valideeBy: "demo_user_1" as any,
  },
  {
    _id: "demo_fac_2" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_2" as any,
    clientId: "demo_client_2" as any,
    numero: "FAC-2026-0002",
    description: "Honoraires litige BTP — Phase contentieuse",
    montantHT: 12500,
    tva: 2500,
    montantTTC: 15000,
    statut: "envoyee" as const,
    dateEmission: "2026-03-15",
    dateEcheance: "2026-04-15",
    createdBy: "demo_user_3" as any,
  },
  {
    _id: "demo_fac_3" as any,
    _creationTime: 1713100800000,
    dossierId: "demo_dossier_3" as any,
    clientId: "demo_client_3" as any,
    numero: "FAC-2026-0003",
    description: "Honoraires restructuration fiscale",
    montantHT: 10000,
    tva: 2000,
    montantTTC: 12000,
    statut: "en_retard" as const,
    dateEmission: "2026-02-15",
    dateEcheance: "2026-03-15",
    createdBy: "demo_user_3" as any,
    valideeBy: "demo_user_1" as any,
  },
];

export const DEMO_ACTIVITES = [
  {
    _id: "demo_act_1" as any,
    _creationTime: 1713100800000 - 1000 * 60 * 30,
    dossierId: "demo_dossier_1" as any,
    clientId: "demo_client_1" as any,
    utilisateurId: "demo_user_1" as any,
    type: "document_ajoute",
    description: "Statuts SAS TechVision Cloud v3 ajoutés",
  },
  {
    _id: "demo_act_2" as any,
    _creationTime: 1713100800000 - 1000 * 60 * 120,
    dossierId: "demo_dossier_2" as any,
    clientId: "demo_client_2" as any,
    utilisateurId: "demo_user_2" as any,
    type: "statut_change",
    description: 'Statut changé de "pré-contentieux" à "contentieux en cours"',
  },
  {
    _id: "demo_act_3" as any,
    _creationTime: 1713100800000 - 1000 * 60 * 60 * 5,
    clientId: "demo_client_3" as any,
    utilisateurId: "demo_user_1" as any,
    type: "facture_emise",
    description: "Facture FAC-2026-0003 émise — 12 000 € TTC",
  },
  {
    _id: "demo_act_4" as any,
    _creationTime: 1713100800000 - 1000 * 60 * 60 * 24,
    dossierId: "demo_dossier_3" as any,
    utilisateurId: "demo_user_1" as any,
    type: "dossier_cree",
    description: "Dossier FIS-2026-0002 créé : Restructuration fiscale Groupe Mercier",
  },
];

export const DEMO_DOSSIER_COUNT = {
  total: 4,
  corporate: 1,
  litige: 2,
  fiscal: 1,
  actifs: 4,
};

// =========================================================================
// LegalPay fixtures — socle déontologique (CARPA, conventions, provisions)
// =========================================================================
// Référence : art. P.75.1 et P.75.2 RIBP, art. 6.2 RIN, art. 11.2 RIN
// Règle d'or : les soldes CARPA ne sont JAMAIS de la trésorerie disponible.

const NOW = Date.now();
const DAY = 1000 * 60 * 60 * 24;

export interface DemoConvention {
  _id: string;
  _creationTime: number;
  dossierId: string;
  type: "forfait" | "tempsPasse" | "mixte";
  statut: "brouillon" | "envoyee" | "signee" | "resiliee";
  signedAt?: number;
  montantForfait?: number;
  tauxHoraire?: number;
  plafond?: number;
}

export const DEMO_CONVENTIONS: DemoConvention[] = [
  {
    _id: "demo_conv_1",
    _creationTime: NOW - 180 * DAY,
    dossierId: "demo_dossier_1",
    type: "forfait",
    statut: "signee",
    signedAt: NOW - 175 * DAY,
    montantForfait: 28000,
  },
  {
    _id: "demo_conv_2",
    _creationTime: NOW - 95 * DAY,
    dossierId: "demo_dossier_2",
    type: "tempsPasse",
    statut: "signee",
    signedAt: NOW - 90 * DAY,
    tauxHoraire: 320,
    plafond: 45000,
  },
  {
    _id: "demo_conv_3",
    _creationTime: NOW - 65 * DAY,
    dossierId: "demo_dossier_3",
    type: "mixte",
    statut: "signee",
    signedAt: NOW - 60 * DAY,
    montantForfait: 12000,
    tauxHoraire: 280,
  },
  {
    _id: "demo_conv_4",
    _creationTime: NOW - 12 * DAY,
    dossierId: "demo_dossier_4",
    type: "tempsPasse",
    statut: "envoyee",
    tauxHoraire: 290,
    plafond: 18000,
  },
];

export interface DemoSousCompteCarpa {
  _id: string;
  _creationTime: number;
  dossierId: string;
  numero: string;
  solde: number;
}

export const DEMO_SOUSCOMPTES_CARPA: DemoSousCompteCarpa[] = [
  {
    _id: "demo_carpa_1",
    _creationTime: NOW - 180 * DAY,
    dossierId: "demo_dossier_1",
    numero: "CARPA-2026-0001",
    solde: 8500,
  },
  {
    _id: "demo_carpa_2",
    _creationTime: NOW - 90 * DAY,
    dossierId: "demo_dossier_2",
    numero: "CARPA-2026-0003",
    solde: 3200,
  },
  {
    _id: "demo_carpa_3",
    _creationTime: NOW - 60 * DAY,
    dossierId: "demo_dossier_3",
    numero: "CARPA-2026-0002",
    solde: 5100,
  },
  {
    _id: "demo_carpa_4",
    _creationTime: NOW - 10 * DAY,
    dossierId: "demo_dossier_4",
    numero: "CARPA-2026-0007",
    solde: 0,
  },
];

export interface DemoProvision {
  _id: string;
  _creationTime: number;
  dossierId: string;
  sousCompteCarpaId: string;
  montant: number;
  dateVersement: string; // ISO date
  statut: "attendue" | "recue";
}

export const DEMO_PROVISIONS: DemoProvision[] = [
  {
    _id: "demo_prov_1",
    _creationTime: NOW - 170 * DAY,
    dossierId: "demo_dossier_1",
    sousCompteCarpaId: "demo_carpa_1",
    montant: 15000,
    dateVersement: new Date(NOW - 170 * DAY).toISOString().slice(0, 10),
    statut: "recue",
  },
  {
    _id: "demo_prov_2",
    _creationTime: NOW - 60 * DAY,
    dossierId: "demo_dossier_1",
    sousCompteCarpaId: "demo_carpa_1",
    montant: 10000,
    dateVersement: new Date(NOW - 60 * DAY).toISOString().slice(0, 10),
    statut: "recue",
  },
  {
    _id: "demo_prov_3",
    _creationTime: NOW - 80 * DAY,
    dossierId: "demo_dossier_2",
    sousCompteCarpaId: "demo_carpa_2",
    montant: 20000,
    dateVersement: new Date(NOW - 80 * DAY).toISOString().slice(0, 10),
    statut: "recue",
  },
  {
    _id: "demo_prov_4",
    _creationTime: NOW - 58 * DAY,
    dossierId: "demo_dossier_3",
    sousCompteCarpaId: "demo_carpa_3",
    montant: 12000,
    dateVersement: new Date(NOW - 58 * DAY).toISOString().slice(0, 10),
    statut: "recue",
  },
  {
    _id: "demo_prov_5",
    _creationTime: NOW - 5 * DAY,
    dossierId: "demo_dossier_4",
    sousCompteCarpaId: "demo_carpa_4",
    montant: 6000,
    dateVersement: new Date(NOW - 5 * DAY).toISOString().slice(0, 10),
    statut: "attendue",
  },
];

export interface DemoDiligence {
  _id: string;
  _creationTime: number;
  dossierId: string;
  date: string;
  description: string;
  dureeMinutes: number;
  tauxHoraire: number;
  montantValorise: number;
  saisiePar: string;
}

// Diligences réparties : dossier 1 ~70% consommé (vert-orange),
// dossier 2 = 90% (rouge), dossier 3 = 40% (vert), dossier 4 = 0%.
function diligence(
  id: string,
  dossierId: string,
  daysAgo: number,
  description: string,
  dureeMinutes: number,
  tauxHoraire: number,
  saisiePar: string
): DemoDiligence {
  return {
    _id: id,
    _creationTime: NOW - daysAgo * DAY,
    dossierId,
    date: new Date(NOW - daysAgo * DAY).toISOString().slice(0, 10),
    description,
    dureeMinutes,
    tauxHoraire,
    montantValorise: Math.round((dureeMinutes / 60) * tauxHoraire),
    saisiePar,
  };
}

export const DEMO_DILIGENCES: DemoDiligence[] = [
  // Dossier 1 — Constitution TechVision : convention forfait 28 000 €
  // ~17 500 € valorisés → ratio 62% (orange)
  diligence("d1", "demo_dossier_1", 160, "Analyse projet de statuts et pacte", 240, 320, "demo_user_1"),
  diligence("d2", "demo_dossier_1", 140, "Rédaction statuts V1", 480, 320, "demo_user_1"),
  diligence("d3", "demo_dossier_1", 120, "Négociation pacte d'associés", 360, 320, "demo_user_2"),
  diligence("d4", "demo_dossier_1", 90, "Dépôt formalités greffe", 180, 280, "demo_user_3"),
  diligence("d5", "demo_dossier_1", 45, "AG extraordinaire modification capital", 300, 320, "demo_user_1"),
  diligence("d6", "demo_dossier_1", 20, "Suivi post-constitution", 180, 280, "demo_user_2"),

  // Dossier 2 — Litige BTP : taux 320 €/h — 20 000 € provision, ~17 900 valorisés → 90% (rouge)
  diligence("d7", "demo_dossier_2", 80, "Étude dossier et prescription", 300, 320, "demo_user_1"),
  diligence("d8", "demo_dossier_2", 70, "Rédaction mise en demeure", 240, 320, "demo_user_2"),
  diligence("d9", "demo_dossier_2", 50, "Assignation TC Paris", 420, 320, "demo_user_1"),
  diligence("d10", "demo_dossier_2", 35, "Conclusions n°1", 480, 320, "demo_user_2"),
  diligence("d11", "demo_dossier_2", 20, "Audience mise en état", 240, 320, "demo_user_1"),
  diligence("d12", "demo_dossier_2", 8, "Conclusions n°2 et pièces", 600, 320, "demo_user_2"),
  diligence("d13", "demo_dossier_2", 3, "Préparation plaidoirie", 300, 320, "demo_user_1"),

  // Dossier 3 — Fiscal Mercier : mixte, 12 000 forfait + tempsPasse 280 €/h
  // ~4 800 valorisés → 40% (vert)
  diligence("d14", "demo_dossier_3", 55, "Audit situation fiscale", 360, 280, "demo_user_1"),
  diligence("d15", "demo_dossier_3", 40, "Rédaction réclamation contentieuse", 480, 280, "demo_user_2"),
  diligence("d16", "demo_dossier_3", 25, "Suivi dossier administration", 180, 280, "demo_user_1"),

  // Dossier 4 — pas encore de diligences (convention non signée)
];

export interface DemoNoteHonoraires {
  _id: string;
  _creationTime: number;
  dossierId: string;
  conventionId: string;
  numero: string;
  montantHT: number;
  montantTTC: number;
  tva: number;
  dateEmission: string;
  dateEcheance: string;
  statut:
    | "brouillon"
    | "validee"
    | "envoyee"
    | "payee_partiellement"
    | "payee"
    | "en_retard";
  datePaiement?: string;
}

export const DEMO_NOTES_HONORAIRES: DemoNoteHonoraires[] = [
  {
    _id: "demo_note_1",
    _creationTime: NOW - 130 * DAY,
    dossierId: "demo_dossier_1",
    conventionId: "demo_conv_1",
    numero: "NH-2026-0001",
    montantHT: 10000,
    montantTTC: 12000,
    tva: 20,
    dateEmission: new Date(NOW - 130 * DAY).toISOString().slice(0, 10),
    dateEcheance: new Date(NOW - 100 * DAY).toISOString().slice(0, 10),
    statut: "payee",
    datePaiement: new Date(NOW - 95 * DAY).toISOString().slice(0, 10),
  },
  {
    _id: "demo_note_2",
    _creationTime: NOW - 30 * DAY,
    dossierId: "demo_dossier_2",
    conventionId: "demo_conv_2",
    numero: "NH-2026-0002",
    montantHT: 6000,
    montantTTC: 7200,
    tva: 20,
    dateEmission: new Date(NOW - 30 * DAY).toISOString().slice(0, 10),
    dateEcheance: new Date(NOW - 0 * DAY).toISOString().slice(0, 10),
    statut: "envoyee",
  },
  {
    _id: "demo_note_3",
    _creationTime: NOW - 50 * DAY,
    dossierId: "demo_dossier_3",
    conventionId: "demo_conv_3",
    numero: "NH-2026-0003",
    montantHT: 4000,
    montantTTC: 4800,
    tva: 20,
    dateEmission: new Date(NOW - 50 * DAY).toISOString().slice(0, 10),
    dateEcheance: new Date(NOW - 20 * DAY).toISOString().slice(0, 10),
    statut: "en_retard",
  },
];

export interface DemoMouvementCarpa {
  _id: string;
  _creationTime: number;
  sousCompteCarpaId: string;
  type: "versement_provision" | "prelevement_honoraires" | "remboursement_client";
  montant: number;
  dateOperation: string;
  noteHonorairesId?: string;
  libelle: string;
}

export const DEMO_MOUVEMENTS_CARPA: DemoMouvementCarpa[] = [
  {
    _id: "demo_mvt_1",
    _creationTime: NOW - 170 * DAY,
    sousCompteCarpaId: "demo_carpa_1",
    type: "versement_provision",
    montant: 15000,
    dateOperation: new Date(NOW - 170 * DAY).toISOString().slice(0, 10),
    libelle: "Versement provision initiale",
  },
  {
    _id: "demo_mvt_2",
    _creationTime: NOW - 125 * DAY,
    sousCompteCarpaId: "demo_carpa_1",
    type: "prelevement_honoraires",
    montant: 12000,
    dateOperation: new Date(NOW - 125 * DAY).toISOString().slice(0, 10),
    noteHonorairesId: "demo_note_1",
    libelle: "Prélèvement NH-2026-0001 (triple verrou validé)",
  },
  {
    _id: "demo_mvt_3",
    _creationTime: NOW - 60 * DAY,
    sousCompteCarpaId: "demo_carpa_1",
    type: "versement_provision",
    montant: 10000,
    dateOperation: new Date(NOW - 60 * DAY).toISOString().slice(0, 10),
    libelle: "Complément provision",
  },
  {
    _id: "demo_mvt_4",
    _creationTime: NOW - 80 * DAY,
    sousCompteCarpaId: "demo_carpa_2",
    type: "versement_provision",
    montant: 20000,
    dateOperation: new Date(NOW - 80 * DAY).toISOString().slice(0, 10),
    libelle: "Versement provision initiale",
  },
  {
    _id: "demo_mvt_5",
    _creationTime: NOW - 28 * DAY,
    sousCompteCarpaId: "demo_carpa_2",
    type: "prelevement_honoraires",
    montant: 7200,
    dateOperation: new Date(NOW - 28 * DAY).toISOString().slice(0, 10),
    noteHonorairesId: "demo_note_2",
    libelle: "Prélèvement NH-2026-0002 (triple verrou validé)",
  },
  {
    _id: "demo_mvt_6",
    _creationTime: NOW - 58 * DAY,
    sousCompteCarpaId: "demo_carpa_3",
    type: "versement_provision",
    montant: 12000,
    dateOperation: new Date(NOW - 58 * DAY).toISOString().slice(0, 10),
    libelle: "Versement provision",
  },
  {
    _id: "demo_mvt_7",
    _creationTime: NOW - 45 * DAY,
    sousCompteCarpaId: "demo_carpa_3",
    type: "prelevement_honoraires",
    montant: 4800,
    dateOperation: new Date(NOW - 45 * DAY).toISOString().slice(0, 10),
    noteHonorairesId: "demo_note_3",
    libelle: "Prélèvement NH-2026-0003",
  },
  {
    _id: "demo_mvt_8",
    _creationTime: NOW - 15 * DAY,
    sousCompteCarpaId: "demo_carpa_3",
    type: "remboursement_client",
    montant: 2100,
    dateOperation: new Date(NOW - 15 * DAY).toISOString().slice(0, 10),
    libelle: "Remboursement solde au client (clôture partielle)",
  },
];

// Pennylane mock — compte professionnel du cabinet
// Ces données NE CONCERNENT PAS les fonds clients.
export const DEMO_PENNYLANE_COMPTE_PRO = {
  solde: 47830,
  iban: "FR76 **** **** **** **** 1234",
  devise: "EUR",
  derniereSync: NOW - 2 * 60 * 60 * 1000,
};

export const DEMO_PENNYLANE_MOUVEMENTS = [
  {
    _id: "pyl_1",
    date: new Date(NOW - 1 * DAY).toISOString().slice(0, 10),
    libelle: "Virement reçu — TechVision SAS",
    montant: 12000,
    type: "credit" as const,
  },
  {
    _id: "pyl_2",
    date: new Date(NOW - 3 * DAY).toISOString().slice(0, 10),
    libelle: "URSSAF — cotisations T1",
    montant: -4850,
    type: "debit" as const,
  },
  {
    _id: "pyl_3",
    date: new Date(NOW - 5 * DAY).toISOString().slice(0, 10),
    libelle: "Loyer cabinet — SCI Immobilière",
    montant: -3200,
    type: "debit" as const,
  },
  {
    _id: "pyl_4",
    date: new Date(NOW - 7 * DAY).toISOString().slice(0, 10),
    libelle: "Virement reçu — Groupe Mercier SA",
    montant: 7200,
    type: "credit" as const,
  },
  {
    _id: "pyl_5",
    date: new Date(NOW - 11 * DAY).toISOString().slice(0, 10),
    libelle: "Abonnement Lexbase",
    montant: -295,
    type: "debit" as const,
  },
  {
    _id: "pyl_6",
    date: new Date(NOW - 15 * DAY).toISOString().slice(0, 10),
    libelle: "Salaires — paie M-1",
    montant: -11200,
    type: "debit" as const,
  },
];

