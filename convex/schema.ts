import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const roleValidator = v.union(
  v.literal("associe"),
  v.literal("collaborateur"),
  v.literal("secretaire"),
  v.literal("stagiaire")
);

const specialiteValidator = v.union(
  v.literal("corporate"),
  v.literal("litige"),
  v.literal("fiscal")
);

export default defineSchema({
  ...authTables,

  // ─── Utilisateurs ────────────────────────────────────────
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: roleValidator,
    invitedBy: v.optional(v.id("users")),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ─── Clients ─────────────────────────────────────────────
  clients: defineTable({
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
    specialites: v.optional(v.array(specialiteValidator)),
    isActive: v.boolean(),
  })
    .index("by_denomination", ["denomination"])
    .index("by_siren", ["siren"])
    .index("by_avocat", ["avocatReferentId"])
    .searchIndex("search_clients", {
      searchField: "denomination",
      filterFields: ["isActive", "avocatReferentId"],
    }),

  // ─── Contacts ────────────────────────────────────────────
  contacts: defineTable({
    clientId: v.id("clients"),
    nom: v.string(),
    prenom: v.string(),
    poste: v.optional(v.string()),
    telephone: v.optional(v.string()),
    email: v.optional(v.string()),
    isPrincipal: v.boolean(),
  }).index("by_client", ["clientId"]),

  // ─── Dossiers ────────────────────────────────────────────
  dossiers: defineTable({
    reference: v.string(),
    clientId: v.id("clients"),
    specialite: specialiteValidator,
    intitule: v.string(),
    description: v.optional(v.string()),
    statut: v.string(),
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
    dateOuverture: v.string(),
    dateCloture: v.optional(v.string()),
  })
    .index("by_client", ["clientId"])
    .index("by_specialite", ["specialite"])
    .index("by_statut", ["statut"])
    .index("by_avocat", ["avocatResponsableId"])
    .index("by_reference", ["reference"])
    .searchIndex("search_dossiers", {
      searchField: "intitule",
      filterFields: ["specialite", "statut", "avocatResponsableId"],
    }),

  // ─── Extensions Corporate ────────────────────────────────
  dossiersCorporate: defineTable({
    dossierId: v.id("dossiers"),
    typeOperation: v.string(),
    checklist: v.optional(v.array(v.object({
      label: v.string(),
      done: v.boolean(),
    }))),
    dateAG: v.optional(v.string()),
    dateDepotGreffe: v.optional(v.string()),
    datePublicationJAL: v.optional(v.string()),
  }).index("by_dossier", ["dossierId"]),

  // ─── Extensions Litige ───────────────────────────────────
  dossiersLitige: defineTable({
    dossierId: v.id("dossiers"),
    typeProcedure: v.string(),
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
  }).index("by_dossier", ["dossierId"]),

  // ─── Extensions Fiscal ───────────────────────────────────
  dossiersFiscal: defineTable({
    dossierId: v.id("dossiers"),
    typeMission: v.string(),
    regime: v.optional(v.string()),
    calendrierFiscal: v.optional(v.array(v.object({
      description: v.string(),
      date: v.string(),
      statut: v.string(),
    }))),
    montantEnJeu: v.optional(v.number()),
  }).index("by_dossier", ["dossierId"]),

  // ─── Documents (GED) ────────────────────────────────────
  documents: defineTable({
    dossierId: v.id("dossiers"),
    nom: v.string(),
    categorie: v.string(),
    version: v.number(),
    auteurId: v.id("users"),
    commentaire: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    taille: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    statutValidation: v.union(
      v.literal("a_relire"),
      v.literal("relu"),
      v.literal("valide")
    ),
    validePar: v.optional(v.id("users")),
    valideAt: v.optional(v.string()),
    isLocked: v.boolean(),
    lockedBy: v.optional(v.id("users")),
    parentDocumentId: v.optional(v.id("documents")),
    isIAGenerated: v.boolean(),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_dossier_categorie", ["dossierId", "categorie"])
    .index("by_parent", ["parentDocumentId"]),

  // ─── Echeances ──────────────────────────────────────────
  echeances: defineTable({
    dossierId: v.id("dossiers"),
    description: v.string(),
    date: v.string(),
    responsableId: v.id("users"),
    statut: v.union(
      v.literal("a_venir"),
      v.literal("en_retard"),
      v.literal("traitee")
    ),
    type: v.union(
      v.literal("procedurale"),
      v.literal("fiscale"),
      v.literal("administrative"),
      v.literal("ag")
    ),
    rappels: v.optional(v.array(v.string())),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_responsable", ["responsableId"])
    .index("by_date", ["date"])
    .index("by_statut", ["statut"]),

  // ─── Notes ──────────────────────────────────────────────
  notes: defineTable({
    dossierId: v.id("dossiers"),
    auteurId: v.id("users"),
    contenu: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  }).index("by_dossier", ["dossierId"]),

  // ─── Propositions commerciales ──────────────────────────
  propositions: defineTable({
    clientId: v.id("clients"),
    specialite: specialiteValidator,
    description: v.string(),
    modeFacturation: v.union(v.literal("forfait"), v.literal("temps_passe")),
    montantForfait: v.optional(v.number()),
    tauxHoraires: v.optional(v.array(v.object({
      role: v.string(),
      taux: v.number(),
    }))),
    phases: v.optional(v.array(v.object({
      description: v.string(),
      montant: v.number(),
    }))),
    conditionsPaiement: v.optional(v.string()),
    conditionsGenerales: v.optional(v.string()),
    statut: v.union(
      v.literal("brouillon"),
      v.literal("en_attente"),
      v.literal("validee"),
      v.literal("envoyee"),
      v.literal("acceptee"),
      v.literal("refusee")
    ),
    createdBy: v.id("users"),
    valideeBy: v.optional(v.id("users")),
  })
    .index("by_client", ["clientId"])
    .index("by_statut", ["statut"]),

  // ─── Factures ───────────────────────────────────────────
  factures: defineTable({
    dossierId: v.optional(v.id("dossiers")),
    clientId: v.id("clients"),
    propositionId: v.optional(v.id("propositions")),
    numero: v.string(),
    description: v.string(),
    montantHT: v.number(),
    tva: v.number(),
    montantTTC: v.number(),
    statut: v.union(
      v.literal("brouillon"),
      v.literal("en_attente"),
      v.literal("validee"),
      v.literal("envoyee"),
      v.literal("payee_partiellement"),
      v.literal("payee"),
      v.literal("en_retard"),
      v.literal("annulee")
    ),
    dateEmission: v.string(),
    dateEcheance: v.string(),
    datePaiement: v.optional(v.string()),
    acomptesDeduits: v.optional(v.number()),
    relances: v.optional(v.array(v.object({
      date: v.string(),
      niveau: v.number(),
      type: v.string(),
    }))),
    createdBy: v.id("users"),
    valideeBy: v.optional(v.id("users")),
  })
    .index("by_client", ["clientId"])
    .index("by_dossier", ["dossierId"])
    .index("by_statut", ["statut"])
    .index("by_numero", ["numero"]),

  // ─── Temps passes ───────────────────────────────────────
  tempsPasses: defineTable({
    dossierId: v.id("dossiers"),
    intervenantId: v.id("users"),
    date: v.string(),
    dureeMinutes: v.number(),
    description: v.string(),
    tauxHoraire: v.number(),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_intervenant", ["intervenantId"]),

  // ─── Conflits d'interets ────────────────────────────────
  conflitsVerifications: defineTable({
    dossierId: v.optional(v.id("dossiers")),
    clientId: v.id("clients"),
    partiesVerifiees: v.array(v.string()),
    resultat: v.union(
      v.literal("aucun"),
      v.literal("potentiel"),
      v.literal("confirme")
    ),
    details: v.optional(v.string()),
    verifiePar: v.id("users"),
  }).index("by_dossier", ["dossierId"]),

  // ─── Log d'activites ───────────────────────────────────
  activites: defineTable({
    dossierId: v.optional(v.id("dossiers")),
    clientId: v.optional(v.id("clients")),
    utilisateurId: v.id("users"),
    type: v.string(),
    description: v.string(),
    metadata: v.optional(v.string()),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_client", ["clientId"])
    .index("by_utilisateur", ["utilisateurId"]),

  // ─── Analyses IA ────────────────────────────────────────
  analyseIA: defineTable({
    documentId: v.optional(v.id("documents")),
    dossierId: v.id("dossiers"),
    type: v.union(v.literal("analyse"), v.literal("redaction")),
    resultat: v.string(),
    prompt: v.optional(v.string()),
    modele: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_document", ["documentId"]),
});
